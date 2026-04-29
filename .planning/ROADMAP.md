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
- [ ] [STREAM-01] SSE endpoint `/crawl/stream` with POST support
- [ ] [STREAM-02] Frontend consumes SSE with `fetch-event-source`
- [ ] [STREAM-03] Progress events streamed in real-time via crawl4ai hooks
- [ ] [STREAM-04] Full markdown returned on completion in `done` event

**Plans:** 3/4 plans executed
- [ ] 02-01-PLAN.md — SSE endpoint with progress streaming
- [ ] 02-02-PLAN.md — Frontend SSE consumer with fetch-event-source
