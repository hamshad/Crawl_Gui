# Crawl4ai Desktop Application

## Project Overview
Electron desktop app that crawls URLs and returns formatted markdown. Backend is a separate Flask server (port 5001) using crawl4ai, with SSE streaming for real-time progress updates.

## Tech Stack
- **Runtime:** Electron 41.3.0
- **Frontend:** React 19 + Vite 8 + TypeScript
- **Styling:** Tailwind CSS v3 + shadcn/ui
- **Icons:** Phosphor Icons (@phosphor-icons/react)
- **Font:** Quicksand (Google Fonts)
- **Markdown:** react-markdown + remark-gfm
- **SSE:** @microsoft/fetch-event-source
- **Backend:** Flask on port 5001 (SSE streaming)
  - `GET /health` → `{"status": "ok"}`
  - `POST /crawl/stream` → SSE stream with `start`, `progress`, `log`, `done` events

## Architecture
```
electron/ (React frontend) → SSE POST → backend.py (Flask, port 5001) → crawl4ai
```

## Current State
- Electron + React + Vite + TypeScript fully set up
- shadcn/ui components (Button, Input, Card, Badge, Progress)
- SSE streaming backend with real-time progress events
- Markdown rendering with GFM support
- No Tkinter GUI (crawl_gui.py removed)

## Conventions
- Dark theme, clean aesthetic
- NO gradients
- Phosphor icons (not Lucide)
- Quicksand font
- ESM module system (`"type": "module"`)
- All API communication via SSE (Server-Sent Events)
