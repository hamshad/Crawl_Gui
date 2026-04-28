#!/bin/bash
# Start Crawl4ai Desktop App

BASE_DIR="/Users/moksha/Moksha/Hamshad/Crawling"

# Kill existing
pkill -f "electron" 2>/dev/null
pkill -f "backend.py" 2>/dev/null
sleep 1

# Start backend in background
echo "Starting backend..."
cd "$BASE_DIR"
nohup .venv/bin/python backend.py > /dev/null 2>&1 &

# Wait for backend
sleep 2

# Build and run electron
echo "Building and starting desktop app..."
cd "$BASE_DIR/electron"
npm run build
npx electron .

echo "Done!"