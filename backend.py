from flask import Flask, request, Response
from flask_cors import CORS
import asyncio
import json
import threading
from queue import Queue

# Use Python 3.12 for crawl4ai (Python 3.9 doesn't support | Union syntax)
import sys
if sys.version_info >= (3, 10):
    from crawl4ai import AsyncWebCrawler
    from crawl4ai.async_configs import BrowserConfig, CrawlerRunConfig, CacheMode
    from crawl4ai import UndetectedAdapter
    from crawl4ai.async_crawler_strategy import AsyncPlaywrightCrawlerStrategy
else:
    # Fallback - will fail at runtime if used with Python 3.9
    AsyncWebCrawler = None
    BrowserConfig = None
    CrawlerRunConfig = None
    CacheMode = None
    UndetectedAdapter = None
    AsyncPlaywrightCrawlerStrategy = None

app = Flask(__name__)
CORS(app)


def create_browser_config(options=None):
    if options is None:
        options = {}
    
    # Note: enable_stealth uses playwright-stealth to modify browser fingerprints.
    # For sophisticated anti-bot bypass (PerimeterX, advanced Cloudflare, DataDome), use:
    #   adapter = UndetectedAdapter()
    #   strategy = AsyncPlaywrightCrawlerStrategy(browser_config=browser_config, browser_adapter=adapter)
    #   async with AsyncWebCrawler(crawler_strategy=strategy) as crawler:
    #       ...
    # The undetected browser is slower but provides deep-level patches to evade CDP detection.
    # Use options["undetected_browser"] = True to enable.
    
    return BrowserConfig(
        browser_type="chromium",
        headless=options.get("headless", True),
        channel="chromium",
        enable_stealth=options.get("stealth_mode", False)
    )


def create_crawler_strategy(browser_config, options):
    """Create crawler strategy with optional undetected adapter.
    
    Args:
        browser_config: BrowserConfig instance
        options: Dict with options
        
    Returns:
        AsyncPlaywrightCrawlerStrategy if undetected_browser=True, else None (uses default strategy)
        
    Note:
        The undetected browser adapter is more resource-intensive but provides higher success rate
        for sophisticated anti-bot systems like PerimeterX, DataDome, advanced Cloudflare.
        Still experimental - may not work on all sites.
    """
    use_undetected = options.get("undetected_browser", False)
    
    if use_undetected and UndetectedAdapter and AsyncPlaywrightCrawlerStrategy:
        adapter = UndetectedAdapter()
        return AsyncPlaywrightCrawlerStrategy(
            browser_config=browser_config,
            browser_adapter=adapter
        )
    return None  # Use default strategy


# Cache mode mapping: string -> CacheMode enum
CACHE_MODE_MAP = {
    "enabled": CacheMode.ENABLED,
    "bypass": CacheMode.BYPASS,
    "disabled": CacheMode.DISABLED,
    "read_only": CacheMode.READ_ONLY,
    "write_only": CacheMode.WRITE_ONLY,
}


def create_crawler_config(options=None):
    """Create CrawlerRunConfig with advanced options.
    
    Args:
        options: Dict with keys:
            - cache_mode: "enabled" | "bypass" | "disabled" | "read_only" | "write_only" (default: "bypass")
            - remove_overlays: Remove popups/modals blocking content (default: True)
            - remove_consent: Remove GDPR/cookie consent popups (default: True)
            - proxy_config: Single proxy str, list of proxies, or ProxyConfig object
            - max_retries: Number of retry rounds when blocking detected (default: 0)
            
    Proxy config format examples:
        - Single proxy: "http://user:pass@host:port"
        - List of proxies: ["http://proxy1:8080", "http://proxy2:8080"]
        - Use "direct" or ProxyConfig.DIRECT to explicitly try without proxy
    """
    if options is None:
        options = {}
    
    cache_mode_str = options.get("cache_mode", "bypass")
    cache_mode = CACHE_MODE_MAP.get(cache_mode_str.lower(), CacheMode.BYPASS)
    
    # Get proxy config and max_retries from options
    proxy_config = options.get("proxy_config", None)
    max_retries = options.get("max_retries", 0)
    
    return CrawlerRunConfig(
        cache_mode=cache_mode,
        remove_overlay_elements=options.get("remove_overlays", True),
        remove_consent_popups=options.get("remove_consent", True),
        wait_until="networkidle",
        page_timeout=60000,
        verbose=True,
        proxy_config=proxy_config,
        max_retries=max_retries,
    )


# ── SSE Streaming Endpoint ──────────────────────────────────────
# POST /crawl/stream
# Body: {"url": "https://example.com", "options": {"stealth_mode": true, "undetected_browser": false}}
# Returns: text/event-stream with events: start, progress, log, done
# ─────────────────────────────────────────────────────────────────

@app.route("/crawl/stream", methods=["POST"])
def crawl_stream():
    data = request.json or {}
    url = data.get("url", "").strip()
    options = data.get("options", {})

    if not url:
        return {"success": False, "error": "No URL provided"}, 400

    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    event_queue = Queue()

    def run_crawl():
        async def do_crawl():
            # Emit start event with URL and options
            event_queue.put(json.dumps({"event": "start", "url": url, "options": options}))

            # Create configs from options
            browser_config = create_browser_config(options)
            crawler_config = create_crawler_config(options)
            strategy = create_crawler_strategy(browser_config, options)

            # Build config info message
            config_info = {
                "stealth_mode": options.get("stealth_mode", False),
                "cache": options.get("cache_mode", "bypass"),
                "remove_overlays": options.get("remove_overlays", True),
                "undetected_browser": options.get("undetected_browser", False),
                "proxy_config": "set" if options.get("proxy_config") else "none",
                "max_retries": options.get("max_retries", 0),
            }
            
            # Emit config info event
            event_queue.put(json.dumps({
                "event": "log", 
                "msg": f"Config: {config_info}", 
                "level": "info"
            }))

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

            # Use strategy if undetected_browser requested
            if strategy:
                event_queue.put(json.dumps({
                    "event": "log", 
                    "msg": "Using undetected browser adapter for anti-bot bypass", 
                    "level": "info"
                }))
                async with AsyncWebCrawler(crawler_strategy=strategy) as crawler:
                    result = await crawler.arun(
                        url=url,
                        config=crawler_config,
                        before_goto=hook_before_goto,
                        after_goto=hook_after_goto,
                        on_execution_started=hook_on_execution_started,
                        before_retrieve_html=hook_before_retrieve_html,
                    )
            else:
                async with AsyncWebCrawler(config=browser_config) as crawler:
                    result = await crawler.arun(
                        url=url,
                        config=crawler_config,
                        before_goto=hook_before_goto,
                        after_goto=hook_after_goto,
                        on_execution_started=hook_on_execution_started,
                        before_retrieve_html=hook_before_retrieve_html,
                    )

            # Handle result and emit crawl stats
            if result.success:
                # Build crawl stats message
                content_length = len(result.markdown) if result.markdown else 0
                stats_msg = f"Content extracted: {content_length} chars"
                
                # Try to get attempts if available
                crawl_stats = getattr(result, 'crawl_stats', None)
                if crawl_stats:
                    attempts = getattr(crawl_stats, 'attempts', None)
                    if attempts is not None:
                        stats_msg += f", Attempts: {attempts}"
                
                event_queue.put(json.dumps({
                    "event": "log", "msg": stats_msg, "level": "info"
                }))
                
                event_queue.put(json.dumps({
                    "event": "done", "success": True, "markdown": result.markdown
                }))
            else:
                error_msg = result.error_message or "Unknown error"
                
                # Check for common anti-bot blocks and provide helpful warning
                anti_bot_keywords = ["perimeterx", "cloudflare", "datadome", "blocked", "captcha", "challenge"]
                if any(kw in error_msg.lower() for kw in anti_bot_keywords):
                    event_queue.put(json.dumps({
                        "event": "log",
                        "msg": "Anti-bot protection detected. Try enabling stealth_mode or undetected_browser.",
                        "level": "warning"
                    }))
                
                event_queue.put(json.dumps({
                    "event": "done", "success": False, "error": error_msg
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