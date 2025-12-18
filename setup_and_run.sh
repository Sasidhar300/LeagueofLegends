#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting League of Legends AI Coach Setup..."

# Get the absolute path of the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# --- Backend Setup ---
echo "----------------------------------------"
echo "🐍 Setting up Backend..."
echo "----------------------------------------"
cd backend

# Check for Python 3.12+
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed."
    echo "Please download Python 3.12+ from https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
REQUIRED_VERSION="3.12"

if (( $(echo "$PYTHON_VERSION < $REQUIRED_VERSION" | bc -l) )); then
    echo "❌ Detected Python $PYTHON_VERSION, but Python $REQUIRED_VERSION+ is required."
    echo "Please install Python 3.12+ from https://www.python.org/downloads/"
    exit 1
fi

echo "✅ Using Python $PYTHON_VERSION"

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt

# Start Backend in background
echo "Starting Backend Server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

cd ..

# --- Frontend Setup ---
echo "----------------------------------------"
echo "⚛️ Setting up Frontend..."
echo "----------------------------------------"
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
else
    echo "node_modules already exists. Skipping npm install."
fi

# Start Frontend in background
echo "Starting Frontend Server..."
npm run dev &
FRONTEND_PID=$!

cd ..

# --- Summary ---
echo "----------------------------------------"
echo "✅ Setup Complete. Services are running!"
echo "   - Backend: http://localhost:8000 (PID: $BACKEND_PID)"
echo "   - Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
echo "----------------------------------------"
echo "Press CTRL+C to stop both servers."

# Trap SIGINT to kill both processes when user presses Ctrl+C
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT

# Keep script running to maintain the trap
wait
