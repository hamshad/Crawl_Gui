from flask import Flask, request, jsonify
from flask_cors import CORS
import asyncio
import logging
from crawl4ai import AsyncWebCrawler
from crawl4ai.async_configs import BrowserConfig

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

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5001
    app.run(host="127.0.0.1", port=port, debug=False)