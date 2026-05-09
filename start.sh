#!/bin/bash
# Start Coleoptera Desktop App
# The Electron app automatically spawns the Python backend.

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$BASE_DIR/electron"

echo "Building frontend..."
npm run build

echo "Launching Coleoptera..."
npx electron .
