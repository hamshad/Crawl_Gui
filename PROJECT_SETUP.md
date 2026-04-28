# Crawl4ai GUI Project

## Overview
- **UI**: Svelte + Vite (served via Vite preview server)
- **Python backend**: Flask API running on port 5001
- **Communication**: HTTP API

## Quick Start

### 1. Start Backend (Port 5001)
```bash
cd /Users/moksha/Moksha/Hamshad/Crawling
.venv/bin/python backend.py
# Or specify port: .venv/bin/python backend.py 5002
```

### 2. Start UI
```bash
cd /Users/moksha/Moksha/Hamshad/Crawling/electron
npx vite preview --port 8080 --host
```

### 3. Open in Browser
```
http://127.0.0.1:8080
```

## Project Structure
```
/Users/moksha/Moksha/Hamshad/Crawling/
├── backend.py              # Flask API (port 5001)
├── requirements.txt        # Python dependencies
├── .venv/                # Virtual environment
└── electron/
    ├── src/
    │   └── App.svelte   # Main UI component
    ├── package.json     # Node dependencies
    ├── vite.config.js  # Vite config
    └── dist/          # Built files
```

## Ports Used
| Service      | Default Port |
|-------------|-------------|
| Flask API    | 5001        |
| Vite Preview| 8080        |

To change backend port:
```bash
.venv/bin/python backend.py 5002
```

## Installation

### Python
```bash
brew install python@3.12
cd /Users/moksha/Moksha/Hamshad/Crawling
/opt/homebrew/bin/python3.12 -m venv .venv
.venv/bin/pip install -U crawl4ai flask flask-cors
.venv/bin/python -m playwright install chromium
```

### Node
```bash
cd /Users/moksha/Moksha/Hamshad/Crawling/electron
npm install
npm run build
```

## Running

### Option 1: All in one
```bash
# Terminal 1
cd /Users/moksha/Moksha/Hamshad/Crawling && .venv/bin/python backend.py

# Terminal 2
cd /Users/moksha/Moksha/Hamshad/Crawling/electron && npx vite preview --port 8080 --host
```

### Option 2: Using npm (if configured)
```bash
cd /Users/moksha/Moksha/Hamshad/Crawling/electron
npm run dev
```

## Clean Up
```bash
rm -rf /Users/moksha/Moksha/Hamshad/Crawling
brew uninstall python@3.12
```

## Notes
- Port 5001 avoids AirPlay Receiver conflict on 5000
- All dependencies isolated in `.venv/`
- Playwright cache in `~/Library/Caches/ms-playwright`