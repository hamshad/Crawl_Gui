# Coleoptera

A standalone desktop application that crawls websites and converts them to clean Markdown using [crawl4ai](https://github.com/unclecode/crawl4ai).

Built with **Electron + React + Vite** (frontend) and **Flask + crawl4ai + Playwright** (backend). The Python backend is bundled into the app — no separate server needed at runtime.

## Requirements

- Python 3.12
- Node.js 20+
- npm

## Development

### 1. Setup Python environment

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

### 2. Setup frontend

```bash
cd electron
npm install
```

### 3. Run (dev mode)

```bash
cd electron
npm run dev
```

This builds the React frontend and launches Electron. The Electron main process automatically spawns `.venv/bin/python backend.py` as a child process.

---

## Build distributable

### Local build (your current platform only)

```bash
cd electron

# Build once for quick dev cycle (skips Python bundling)
npm run build:electron:quick

# Full build (bundles Python + Playwright browsers)
npm run build:all
```

Output goes to `electron/release/`:
- **macOS**: `Coleoptera-1.0.0-mac-arm64.dmg` + `.zip`
- **Linux**: `Coleoptera-1.0.0-linux-x64.AppImage`
- **Windows**: `Coleoptera-1.0.0-win-x64.exe`

### Platform-specific notes

**macOS**: Code signing requires setting `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` environment variables. Without these, the app builds but shows an "unverified developer" warning (right-click → Open to bypass).

**Linux**: `AppImage` target needs `fuse` installed (`sudo apt install fuse` on Debian/Ubuntu).

**Windows**: `NSIS` target needs an internet connection to download the NSIS installer on first run.

---

## GitHub Release

Push a version tag to trigger the CI pipeline:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow (`.github/workflows/release.yml`) builds on macOS ARM64, Linux x64, and Windows x64 in parallel, then attaches all artifacts to a GitHub Release.

---

## Project structure

```
.
├── backend.py                  # Flask SSE streaming API (port 5001)
├── requirements.txt            # Python dependencies
├── electron/
│   ├── index.js                # Electron main — spawns backend, singleton, lifecycle
│   ├── scripts/
│   │   └── copy-browsers.mjs   # Cross-platform Playwright browser bundler
│   ├── src/
│   │   └── App.tsx             # React UI
│   ├── dist/                   # Built frontend (Vite output)
│   └── package.json            # Build scripts & electron-builder config
├── .github/workflows/release.yml
├── start.sh
└── LICENSE                     # MIT
```

## License

MIT — see [LICENSE](LICENSE).
