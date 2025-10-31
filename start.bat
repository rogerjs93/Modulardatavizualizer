@echo off
REM Quick start script for Windows

echo ============================================
echo  Modular Data Visualizer - Quick Start
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org
    echo.
    echo Alternative: Just open index.html in your browser!
    pause
    exit /b 1
)

echo Starting local server on http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul

REM Open browser
start http://localhost:8000

REM Start Python server
python -m http.server 8000
