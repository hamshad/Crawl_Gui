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
npm run build
npx electron .
```

## Or use the start script
```bash
cd /Users/moksha/Moksha/Hamshad/Crawling
./start.sh
```

## Ports
- Backend: 5001
- App runs standalone (no server needed after build)

## What was built:
- React + Vite frontend (in electron/ folder)
- Python backend (in backend.py)
- Clean dark UI withJetBrains Mono + Plus Jakarta Sans fonts
- Logs panel with timestamps