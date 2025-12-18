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
