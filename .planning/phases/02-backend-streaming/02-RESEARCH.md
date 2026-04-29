# Phase 02: Backend Streaming — Research

## Objective
Add SSE streaming to Flask backend for real-time markdown/log updates. Currently `/crawl` blocks until the entire crawl completes.

---

## Key Finding: crawl4ai Does NOT Stream Markdown for Single URLs

`AsyncWebCrawler.arun()` returns a single `CrawlResult` with complete markdown after the page is fully processed. There is no built-in callback or streaming mode for partial markdown during a single-page crawl.

**What crawl4ai DOES support:**
- `arun_many(urls, config=CrawlerRunConfig(stream=True))` — streams results across multiple URLs via `async for`
- **Hooks** — 8 hook points (`on_browser_created`, `before_goto`, `after_goto`, `on_execution_started`, `before_retrieve_html`, `before_return_html`, etc.) that fire at specific stages

**Implication:** True "markdown streams as it's generated" is not possible with `arun()`. We can only stream **progress events and log messages** in real-time, then send the complete markdown at the end.

---

## 1. SSE in Flask — Options

### Option A: Raw Response + Generator (Simplest)
```python
@app.route('/crawl/stream', methods=['POST'])
def crawl_stream():
    def generate():
        yield "data: {\"status\": \"starting\"}\n\n"
        # ... do work ...
        yield "data: {\"markdown\": \"...\"}\n\n"

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',  # disable nginx buffering
            'Connection': 'keep-alive',
        }
    )
```
- ✅ No extra dependencies
- ✅ Full control over SSE format
- ❌ Generator is sync — can't directly `await` async crawl4ai calls

### Option B: flask-queue-sse (Lightweight, No Redis)
- PyPI: `flask-queue-sse`
- Uses in-memory `Queue` to push events from any thread
- ✅ No Redis required (matches current simple architecture)
- ✅ Can push events from a background thread running async crawl4ai
- ❌ Additional dependency

### Option C: flask-sse (Requires Redis)
- PyPI: `flask-sse`
- Requires Redis for pub/sub
- ❌ Overkill for single-process Electron app

### Option D: Switch to FastAPI (Recommended for future, not now)
- FastAPI is async-native, handles `async def` endpoints with `StreamingResponse` naturally
- ✅ Best for async + SSE pattern
- ❌ Major architecture change, breaks current Flask setup

**Recommendation for Phase 02:** Use **Option A (raw Response)** with a threading + Queue bridge to async crawl4ai.

---

## 2. The Core Problem: Async crawl4ai + Sync Flask WSGI

Flask is a WSGI app (sync). crawl4ai's `AsyncWebCrawler` is async. The current code uses `asyncio.run(crawl_url(url))` which blocks the Flask worker.

### Bridging Pattern: Thread + asyncio.Queue

```python
import threading
import asyncio
from queue import Queue
from flask import Response

def crawl_stream_route():
    event_queue = Queue()

    def run_crawl():
        async def do_crawl():
            # crawl4ai work
            event_queue.put({"status": "browser_starting"})
            async with AsyncWebCrawler(config=browser_config) as crawler:
                event_queue.put({"status": "page_loading"})
                result = await crawler.arun(url=url, config=run_config)
                event_queue.put({"status": "done", "markdown": result.markdown})
        asyncio.run(do_crawl())
        event_queue.put(None)  # sentinel

    threading.Thread(target=run_crawl).start()

    def generate():
        while True:
            item = event_queue.get()
            if item is None:
                break
            yield f"data: {json.dumps(item)}\n\n"
        yield "data: [DONE]\n\n"

    return Response(generate(), mimetype='text/event-stream', ...)
```

- The crawl runs in a new thread with its own event loop (`asyncio.run`)
- A `Queue` (thread-safe) passes events from the async context to the sync generator
- The sync generator yields SSE-formatted events to Flask

---

## 3. What Events Can We Stream?

Since `arun()` doesn't provide partial markdown, we stream **progress events** using hooks and log messages:

| Event | Source | Timing |
|-------|--------|--------|
| `start` | Backend | Crawl requested |
| `browser_starting` | Hook / log | `on_browser_created` |
| `page_loading` | Hook / log | `before_goto` |
| `page_loaded` | Hook / log | `after_goto` |
| `extracting` | Hook / log | `on_execution_started` |
| `html_retrieved` | Hook / log | `before_retrieve_html` |
| `log` | `log_messages` | Throughout crawl |
| `done` | Backend | `arun()` completed, includes full markdown |

### Using crawl4ai Hooks to Emit Events

```python
def make_hooks(event_queue):
    async def before_goto(page, context, url, **kwargs):
        event_queue.put(json.dumps({"event": "page_loading", "url": url}))
        return page
    return {"before_goto": before_goto}
```

Hooks run inside the async context, so they can push to the queue directly.

---

## 4. Frontend SSE Consumption

### Problem: Native EventSource Doesn't Support POST

The browser's native `EventSource` API only supports GET requests. We need POST to send the URL.

### Solution: `@microsoft/fetch-event-source`

```bash
npm install @microsoft/fetch-event-source
```

```typescript
import { fetchEventSource } from '@microsoft/fetch-event-source';

fetchEventSource('http://127.0.0.1:5001/crawl/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url }),
  onmessage(ev) {
    const data = JSON.parse(ev.data);
    // handle: start, log, done, etc.
  },
  onerror(err) {
    console.error('SSE error:', err);
  },
});
```

- ✅ Supports POST, headers, body
- ✅ Reconnection handling built-in
- ✅ Same API as EventSource otherwise

### React Integration Pattern

```typescript
const [logs, setLogs] = useState<LogEntry[]>([]);
const [markdown, setMarkdown] = useState<string | null>(null);
const [isStreaming, setIsStreaming] = useState(false);

const handleCrawlStream = async (url: string) => {
  setIsStreaming(true);
  setLogs([]);
  setMarkdown(null);

  await fetchEventSource('http://127.0.0.1:5001/crawl/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
    onmessage(ev) {
      const data = JSON.parse(ev.data);
      if (data.event === 'log') {
        setLogs(prev => [...prev, { msg: data.msg, level: data.level }]);
      } else if (data.event === 'done') {
        setMarkdown(data.markdown);
        setIsStreaming(false);
      }
    },
  });
};
```

---

## 5. SSE Event Format Design

```jsonc
// Progress event
data: {"event": "progress", "status": "page_loading", "url": "https://example.com"}

// Log event
data: {"event": "log", "msg": "Browser started", "level": "info"}

// Done event (final)
data: {"event": "done", "success": true, "markdown": "# Full markdown here...", "logs": [...]}

// Keepalive (optional, every 15s)
data: {"event": "ping"}
```

Use `event:` field for type, or just use `data:` with a type field inside JSON.

---

## 6. Common Pitfalls

| Pitfall | Mitigation |
|---------|------------|
| Flask WSGI blocks on long requests | Run crawl in a thread, stream via Queue |
| Browser disconnects, crawl continues | Check `request.is_disconnected()` (needs Flask async), or handle client-side abort |
| SSE connection limits (6 per domain) | Not an issue for single-backend Electron app |
| Nginx/proxy buffers SSE responses | Set `X-Accel-Buffering: no` and `Cache-Control: no-cache` |
| crawl4ai hooks run in async context | Use thread-safe Queue to pass events to sync generator |
| Markdown not streamable from crawl4ai | Document that only progress/logs stream; markdown arrives at end |

---

## 7. Validation Plan

1. **SSE endpoint works:** `curl -N -X POST http://127.0.0.1:5001/crawl/stream -H "Content-Type: application/json" -d '{"url":"https://example.com"}'` should show streaming events
2. **Frontend receives events:** React组件中 `fetchEventSource` 收到所有事件类型
3. **Logs appear in real-time:** Log messages show up before crawl completes
4. **Markdown arrives at end:** Full markdown in `done` event
5. **Connection cleanup:** Stream closes properly after `done` or on error

---

## 8. Summary of Decisions Needed for Planning

1. **SSE implementation:** Raw `Response` + generator + Queue (recommended) vs `flask-queue-sse`
2. **Event types to stream:** Progress (hooks) + logs + final markdown (at end)
3. **Frontend SSE client:** `@microsoft/fetch-event-source` (supports POST)
4. **Keep Flask or switch:** Keep Flask for now; FastAPI is better long-term if more async work is needed
5. **Markdown streaming:** Not possible with `arun()` — only progress events + final markdown
6. **Hook usage:** Use crawl4ai hooks (`before_goto`, `after_goto`, etc.) to emit progress events into the queue
