#!/bin/bash
# Start script for Crawl4ai Electron app

# Kill any existing processes
pkill -f "electron" 2>/dev/null
pkill -f "backend.py" 2>/dev/null
sleep 1

# Change to project directory
cd /Users/moksha/Moksha/Hamshad/Crawling

# Start Python backend (ignore output)
nohup .venv/bin/python backend.py > /dev/null 2>&1 &
BACKEND_PID=$!
echo "Started backend (PID: $BACKEND_PID)"

sleep 2

# Start Electron
cd /Users/moksha/Moksha/Hamshad/Crawling/electron
nohup npm start > /dev/null 2>&1 &
ELECTRON_PID=$!
echo "Started Electron (PID: $ELECTRON_PID)"

# Wait for startup
sleep 5

echo "App should be running now!"
echo "Backend PID: $BACKEND_PID"
echo "Electron PID: $ELECTRON_PID"