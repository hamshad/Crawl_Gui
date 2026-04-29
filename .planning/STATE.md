# State

## Current Plan
- Phase 03 (Advanced Crawling): Plan 01 of 02 complete

## Current Position
- Phase 01 (React UI): Plan 03 complete
- Phase 02 (Backend Streaming): Plan 04 of 04 complete
- Phase 03 (Advanced Crawling): Plan 01 of 02 complete

## Key Decisions
- React + Vite + TypeScript for frontend
- Tailwind v3 (not v4 — better Electron compatibility)
- shadcn/ui manual component creation (CLI issues in Electron/Vite)
- SSE streaming (Phase 02) replaces polling-based updates
- Dark theme, no gradients
- Phosphor icons (not Lucide)
- Quicksand font
- Always load built files (no Vite dev server in Electron)
- ESM module system throughout (type: module in package.json)
- Bug icon replaces Spider (Spider not exported in @phosphor-icons/react v2.1.10)
- CSS module type declarations in vite-env.d.ts with Vite client reference
- Raw Flask Response + Queue bridge for async crawl4ai (not flask-queue-sse)
- @microsoft/fetch-event-source for POST-based SSE in frontend
- crawl4ai hooks emit progress events; markdown only at completion
- Hooks emit both progress and log events for real-time feedback
- Queue stores dicts; JSON encoding happens once in generate() at yield point
- AbortController for SSE connection cleanup (not raw fetch timeouts)
- isStreaming state (replaces isLoading) for clearer streaming semantics

## Blockers
- None

## Recent Decisions (Phase 02-04)
- Frontend uses fetchEventSource POST to /crawl/stream (not polling)
- Real-time log streaming with onmessage handler for log/progress/done events
- Stop button with AbortController for manual SSE connection cancellation
- Logs display during streaming (not just after) for real-time feedback
- AbortController for SSE connection cleanup (not raw fetch timeouts)
- isStreaming state (replaces isLoading) for clearer streaming semantics

## Performance Metrics
| Phase | Plan | Duration | Tasks | Files |
|--------|------|----------|-------|-------|
| 02 | 01 | 5min | 2 | 1 |
| 02 | 02 | 4min | 3 | 1 |
| 02 | 03 | 1min | 2 | 3 |
| 02 | 04 | 9min | 3 | 1 |
| 03 | 01 | 1min | 3 | 1 |

## Pending Todos
- Phase 03 in progress

## Session Info
- Last session: 2026-04-29T13:25:51Z
- Stopped at: Completed 03-01-PLAN.md
