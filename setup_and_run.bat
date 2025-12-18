@echo off
setlocal

echo 🚀 Starting League of Legends AI Coach Setup (Windows)...

:: --- Backend Setup ---
echo ----------------------------------------
echo 🐍 Setting up Backend...
echo ----------------------------------------
cd backend

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH.
    echo Please install Python 3.12+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

:: Create venv if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate venv
call venv\Scripts\activate

:: Install dependencies
echo Installing backend dependencies...
pip install -r requirements.txt

:: Start Backend in a new window
echo Starting Backend Server...
start "LoL Coach Backend" cmd /k "venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

cd ..

:: --- Frontend Setup ---
echo ----------------------------------------
echo ⚛️ Setting up Frontend...
echo ----------------------------------------
cd frontend

:: Check for Node/NPM
call npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js/NPM is not installed.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

:: Start Frontend in a new window
echo Starting Frontend Server...
start "LoL Coach Frontend" cmd /k "npm run dev"

cd ..

echo ----------------------------------------
echo ✅ Setup Launched!
echo    - Backend running in new window
echo    - Frontend running in new window
echo.
echo    Open http://localhost:3000 to use the app.
echo ----------------------------------------
pause
