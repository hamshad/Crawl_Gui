# Crawl4ai Desktop Application

## Quick Start

### 1. Start Backend (Terminal 1)
```bash
cd /Users/moksha/Moksha/Hamshad/Crawling
.venv/bin/python backend.py
```

### 2. Build and Run Desktop App (Terminal 2)
```bash
cd /Users/moksha/Moksha/Hamshad/Crawling/electron
npm run dev
```

## Ports
- Backend: 5001 (Flask SSE streaming API)
- Electron app connects to backend at `http://127.0.0.1:5001`

## What was built:
- **Electron + React + Vite + TypeScript** frontend (in `electron/` folder)
- **Clean dark UI** with shadcn/ui components, Quicksand font, Phosphor icons
- **SSE streaming backend** (in `backend.py`) — real-time progress events and markdown output
- **Markdown rendering** with `react-markdown` + `remark-gfm`
- No Tkinter GUI (`crawl_gui.py` removed)

## Architecture
```
electron/ (React frontend) → SSE POST → backend.py (Flask, port 5001) → crawl4ai
```

## Features
- URL input with crawl trigger
- Real-time progress updates (Loading page → Extracting → Processing)
- Live log streaming during crawl
- Formatted markdown output with GFM support
- Stop crawl button (abort mid-crawl)
- Error handling with user-friendly messages
