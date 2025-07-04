#!/bin/bash

# Kill all FFmpeg processes related to Framesend app
echo "Killing all Framesend FFmpeg processes..."

# Find and kill processes that have framesend-app in their command
ps aux | grep ffmpeg | grep -E "(framesend-app|Application Support/framesend-app)" | grep -v grep | awk '{print $2}' | while read pid; do
    echo "Killing PID: $pid"
    kill -9 $pid 2>/dev/null || true
done

# Also kill by job ID pattern if provided
if [ ! -z "$1" ]; then
    echo "Killing processes for job ID: $1"
    ps aux | grep ffmpeg | grep "$1" | grep -v grep | awk '{print $2}' | while read pid; do
        echo "Killing PID: $pid (job $1)"
        kill -9 $pid 2>/dev/null || true
    done
fi

echo "Done."

# Check if any remain
remaining=$(ps aux | grep ffmpeg | grep -E "(framesend-app|Application Support/framesend-app)" | grep -v grep | wc -l)
if [ $remaining -gt 0 ]; then
    echo "Warning: $remaining FFmpeg processes still running"
else
    echo "All Framesend FFmpeg processes terminated"
fi