#!/bin/bash

# Quran Web Application Startup Script

echo "======================================"
echo "  Quran Web Application"
echo "======================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -q -r requirements.txt

# Initialize database if needed
echo "Checking database..."
python3 << EOF
from app import create_app, db
import os

app = create_app('development')
with app.app_context():
    db.create_all()
    print('✓ Database ready')
EOF

# Start the application
echo ""
echo "======================================"
echo "Starting Flask application..."
echo "Access the app at: http://localhost:5000"
echo "Press Ctrl+C to stop"
echo "======================================"
echo ""

python3 run.py
