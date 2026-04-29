# Crawl4ai Desktop App — Roadmap

## Phase 01: React + shadcn UI for Crawler

**Goal:** Transform bare Electron scaffold into a polished React desktop app for URL crawling with real-time progress and formatted markdown output.

**Requirements:**
- [x] [REACT-01] React + Vite + TypeScript in Electron
- [x] [SHADCN-01] shadcn/ui component styling
- [x] [CRAWL-01] URL input with crawl trigger
- [x] [CRAWL-02] Real-time updates during crawl
- [x] [MARKDOWN-01] Formatted markdown rendering
- [x] [DESIGN-01] Clean aesthetic UI, no gradients
- [x] [DESIGN-02] Phosphor icons
- [x] [DESIGN-03] Quicksand font

**Plans:** 3/3 plans complete
- [x] 01-01-PLAN.md — React + Vite + Tailwind + shadcn foundation
- [x] 01-02-PLAN.md — Crawling UI with markdown rendering
- [x] 01-03-PLAN.md — Fix Spider icon and CSS type declarations

## Phase 02: Backend Streaming

**Goal:** Add SSE streaming to Flask backend for true real-time markdown/log updates.

**Requirements:**
- [x] [STREAM-01] SSE endpoint `/crawl/stream` with POST support
- [x] [STREAM-02] Frontend consumes SSE with `fetch-event-source`
- [x] [STREAM-03] Progress events streamed in real-time via crawl4ai hooks
- [x] [STREAM-04] Full markdown returned on completion in `done` event

**Plans:** 4/4 plans complete
- [x] 02-01-PLAN.md — SSE endpoint skeleton with Response + Queue
- [x] 02-02-PLAN.md — Crawl4ai integration with hooks emitting events
- [x] 02-03-PLAN.md — SSE endpoint returns proper events (start, log, progress, done)
- [x] 02-04-PLAN.md — Frontend SSE consumer with fetchEventSource

## Phase 03: Advanced Crawling

**Goal:** Add anti-bot bypass (stealth mode, undetected browser), overlay/popup removal, and caching to handle protected sites like those with PerimeterX.

**Requirements:**
- [x] [ANTIBOT-01] Stealth mode toggle via enable_stealth in BrowserConfig
- [ ] [ANTIBOT-02] Undetected browser adapter for sophisticated anti-bot bypass
- [ ] [ANTIBOT-03] Proxy configuration support with rotation
- [x] [OVERLAY-01] Overlay removal (remove_overlay_elements) and consent popup removal
- [x] [CACHE-01] Cache mode control via CrawlerRunConfig (ENABLED, BYPASS, DISABLED)

**Plans:** 2 plans
- [x] 03-01-PLAN.md — Add CrawlerRunConfig, stealth mode, overlay removal, caching
- [ ] 03-02-PLAN.md — Add undetected browser, proxy support, crawl stats
