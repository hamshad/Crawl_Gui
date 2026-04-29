# Crawl4ai Desktop Application

## Project Overview
Electron desktop app that crawls URLs and returns formatted markdown. Backend is a separate Flask server (port 5001) using crawl4ai.

## Tech Stack
- **Runtime:** Electron 41.3.0
- **Frontend (planned):** React + Vite + TypeScript
- **Styling:** Tailwind CSS v3 + shadcn/ui
- **Icons:** Phosphor Icons (@phosphor-icons/react)
- **Font:** Quicksand (Google Fonts)
- **Markdown:** react-markdown + remark-gfm
- **Backend:** Flask on port 5001
  - `GET /health` → `{"status": "ok"}`
  - `POST /crawl` → `{url}` → `{success, markdown, logs}` or `{success: false, error, logs}`

## Architecture
```
electron/ (React frontend) → HTTP → backend.py (Flask, port 5001) → crawl4ai
```

## Current State
- Bare Electron scaffold (index.js + index.html)
- No React, no build system, no UI framework
- Flask backend is functional and tested
- Old Tkinter GUI exists in crawl_gui.py (being replaced)

## Conventions
- Dark theme, clean aesthetic
- NO gradients
- Phosphor icons (not Lucide)
- Quicksand font (not JetBrains Mono or Plus Jakarta Sans)
