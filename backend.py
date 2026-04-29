from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import asyncio
import logging
from crawl4ai import AsyncWebCrawler
from crawl4ai.async_configs import BrowserConfig
import json
import threading
from queue import Queue

app = Flask(__name__)
CORS(app)

log_messages = []

def log(msg, level="info"):
    log_messages.append({"msg": msg, "level": level})
    if len(log_messages) > 50:
        log_messages.pop(0)

async def crawl_url(url):
    log(f"Initializing crawler for: {url}", "info")
    
    browser_config = BrowserConfig(
        browser_type="chromium",
        headless=True,
        channel="chromium"
    )
    
    log("Starting browser...", "info")
    
    async with AsyncWebCrawler(config=browser_config) as crawler:
        log("Browser started, fetching URL...", "info")
        result = await crawler.arun(url=url)
        
        if result.success:
            log(f"Successfully crawled! ({len(result.markdown or '')} chars)", "success")
            return {
                "success": True,
                "markdown": result.markdown,
                "logs": log_messages.copy()
            }
        else:
            log(f"Error: {result.error_message}", "error")
            return {
                "success": False,
                "error": result.error_message,
                "logs": log_messages.copy()
            }

@app.route("/crawl", methods=["POST"])
def crawl():
    global log_messages
    log_messages = []
    
    data = request.json
    url = data.get("url", "")
    
    if not url:
        return jsonify({"success": False, "error": "No URL provided", "logs": []}), 400
    
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    
    log(f"Processing URL: {url}", "info")
    
    result = asyncio.run(crawl_url(url))
    return jsonify(result)

@app.route("/crawl/stream", methods=["POST"])
def crawl_stream():
    data = request.json
    url = data.get("url", "")

    if not url:
        return jsonify({"success": False, "error": "No URL provided"}), 400

    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    event_queue = Queue()

    def run_crawl():
        # Placeholder - full implementation in 02-02
        event_queue.put(json.dumps({"event": "start", "url": url}))
        event_queue.put(json.dumps({"event": "done", "success": True, "markdown": "# Placeholder markdown", "logs": []}))
        event_queue.put(None)  # sentinel

    threading.Thread(target=run_crawl).start()

    def generate(q):
        while True:
            item = q.get()
            if item is None:
                break
            yield f"data: {item}\n\n"
        yield "data: [DONE]\n\n"

    return Response(
        generate(event_queue),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5001
    app.run(host="127.0.0.1", port=port, debug=False)