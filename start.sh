#!/bin/bash
# Quick start script for Linux/Mac

echo "============================================"
echo " Modular Data Visualizer - Quick Start"
echo "============================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    echo "Please install Python 3 from https://www.python.org"
    echo ""
    echo "Alternative: Just open index.html in your browser!"
    exit 1
fi

echo "Starting local server on http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "Opening browser in 3 seconds..."
sleep 3

# Open browser (works on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:8000
# Open browser (works on Linux)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:8000 2>/dev/null || echo "Please open http://localhost:8000 in your browser"
fi

# Start Python server
python3 -m http.server 8000
