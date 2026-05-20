#!/bin/bash

# Linguaplay Server Startup Script
# This script ensures the correct linguaplay server runs on port 5050

echo "🚀 Starting Linguaplay Backend Server..."

# Check if port 5050 is in use
PORT=5050
PID=$(lsof -ti :$PORT)

if [ ! -z "$PID" ]; then
    echo "⚠️  Port $PORT is in use by process $PID"
    echo "🔧 Killing existing process..."
    kill -9 $PID
    sleep 2
fi

# Check if port is still in use after kill
PID=$(lsof -ti :$PORT)
if [ ! -z "$PID" ]; then
    echo "❌ Failed to kill process on port $PORT"
    echo "Please manually kill the process and try again"
    exit 1
fi

# Navigate to the linguaplay directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Start the server
echo "✅ Starting linguaplay server on port $PORT..."
npx tsx server.ts

echo "🎉 Server started successfully!"
