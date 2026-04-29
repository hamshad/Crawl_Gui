from flask import Flask, request, Response
from flask_cors import CORS
import asyncio
import json
import threading
from queue import Queue

from crawl4ai import AsyncWebCrawler
from crawl4ai.async_configs import BrowserConfig

app = Flask(__name__)
CORS(app)


def create_browser_config():
    return BrowserConfig(
        browser_type="chromium",
        headless=True,
        channel="chromium"
    )


# ── SSE Streaming Endpoint ──────────────────────────────────────
# POST /crawl/stream
# Body: {"url": "https://example.com"}
# Returns: text/event-stream with events: start, progress, log, done
# ─────────────────────────────────────────────────────────────────

@app.route("/crawl/stream", methods=["POST"])
def crawl_stream():
    data = request.json or {}
    url = data.get("url", "").strip()

    if not url:
        return {"success": False, "error": "No URL provided"}, 400

    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    event_queue = Queue()

    def run_crawl():
        async def do_crawl():
            event_queue.put(json.dumps({"event": "start", "url": url}))

            browser_config = create_browser_config()

            # Hook: before navigating to URL
            async def hook_before_goto(page, context, goto_url, **kwargs):
                event_queue.put(json.dumps({
                    "event": "progress", "status": "page_loading", "url": goto_url
                }))
                event_queue.put(json.dumps({
                    "event": "log", "msg": f"Navigating to {goto_url}", "level": "info"
                }))
                return page

            # Hook: after page loaded
            async def hook_after_goto(page, context, **kwargs):
                event_queue.put(json.dumps({
                    "event": "progress", "status": "page_loaded"
                }))
                event_queue.put(json.dumps({
                    "event": "log", "msg": "Page loaded successfully", "level": "info"
                }))
                return page

            # Hook: execution started
            async def hook_on_execution_started(page, context, **kwargs):
                event_queue.put(json.dumps({
                    "event": "progress", "status": "extracting"
                }))
                event_queue.put(json.dumps({
                    "event": "log", "msg": "Content extraction started", "level": "info"
                }))
                return page

            # Hook: before retrieving HTML
            async def hook_before_retrieve_html(page, context, **kwargs):
                event_queue.put(json.dumps({
                    "event": "progress", "status": "html_retrieved"
                }))
                event_queue.put(json.dumps({
                    "event": "log", "msg": "HTML retrieved, processing...", "level": "info"
                }))
                return page

            event_queue.put(json.dumps({
                "event": "progress", "status": "browser_started"
            }))

            async with AsyncWebCrawler(config=browser_config) as crawler:
                result = await crawler.arun(
                    url=url,
                    before_goto=hook_before_goto,
                    after_goto=hook_after_goto,
                    on_execution_started=hook_on_execution_started,
                    before_retrieve_html=hook_before_retrieve_html,
                )

                if result.success:
                    event_queue.put(json.dumps({
                        "event": "done", "success": True, "markdown": result.markdown
                    }))
                else:
                    event_queue.put(json.dumps({
                        "event": "done", "success": False, "error": result.error_message
                    }))

            # Signal end of stream
            event_queue.put(None)

        asyncio.run(do_crawl())

    threading.Thread(target=run_crawl, daemon=True).start()

    def generate(q):
        while True:
            item = q.get()
            if item is None:
                break
            yield f"data: {item}\n\n"

    return Response(
        generate(event_queue),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        }
    )


# ── Health Check ─────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return {"status": "ok"}


# ── Main ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5001
    app.run(host="127.0.0.1", port=port, debug=False, threaded=True)
