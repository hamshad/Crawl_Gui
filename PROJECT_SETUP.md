# Crawl4ai GUI Project Setup

## Overview
This project creates a Python GUI application that uses crawl4ai to crawl URLs and display the results in markdown format.

## Project Structure
```
/Users/moksha/Moksha/Hamshad/Crawling/
├── crawl_gui.py          # Main application
├── requirements.txt     # Python dependencies
└── .venv/               # Virtual environment (all packages installed here)
```

## How to Run

### Quick Start
```bash
cd /Users/moksha/Moksha/Hamshad/Crawling
.venv/bin/python crawl_gui.py
```

### Prerequisites (If Not Already Installed)
```bash
# Install Python 3.12 and tkinter (one-time setup)
brew install python@3.12 python-tk@3.12

# Create virtual environment
/opt/homebrew/bin/python3.12 -m venv .venv

# Install dependencies
.venv/bin/pip install -U -r requirements.txt

# Install Playwright browsers
.venv/bin/python -m playwright install chromium
```

### Run the GUI
```bash
cd /Users/moksha/Moksha/Hamshad/Crawling
.venv/bin/python crawl_gui.py
```

## How to Install (Fresh Setup)
```bash
# 1. Install Python 3.12 and tkinter via Homebrew
brew install python@3.12 python-tk@3.12

# 2. Navigate to project
cd /Users/moksha/Moksha/Hamshad/Crawling

# 3. Create virtual environment
/opt/homebrew/bin/python3.12 -m venv .venv

# 4. Activate and install packages
.venv/bin/pip install -U -r requirements.txt

# 5. Install Playwright browsers (required for crawl4ai)
.venv/bin/python -m playwright install chromium

# 6. Run the app
.venv/bin/python crawl_gui.py
```

## How to Clean Up
To remove all project files and dependencies:
```bash
rm -rf /Users/moksha/Moksha/Hamshad/Crawling
```
This removes:
- The GUI application
- The virtual environment with all Python packages
- Playwright browsers (stored in ~/Library/Caches/ms-playwright)

Then optionally remove Python 3.12 from system (if not needed):
```bash
brew uninstall python@3.12 python-tk@3.12
```

## System Requirements (Must be installed on system)
- **Python 3.12** (via Homebrew: `brew install python@3.12 python-tk@3.12`)
- **Homebrew** (for installing Python)

## Virtual Environment
The `.venv` folder contains everything:
- Python 3.12 interpreter
- crawl4ai and all dependencies
- Playwright Chromium browser

Deleting the project folder removes all installed packages.

## Notes
- A `.gitignore` file is included for Git
- All dependencies are isolated in `.venv/` - nothing is installed system-wide
- Playwright browsers are downloaded to `~/Library/Caches/ms-playwright`
- When you delete the project folder, the only leftover is Python 3.12 (if you want to keep it)