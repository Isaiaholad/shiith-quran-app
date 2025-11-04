@echo off
REM Quran Web Application Startup Script for Windows

echo ======================================
echo   Quran Web Application
echo ======================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -q -r requirements.txt

REM Initialize database
echo Checking database...
python -c "from app import create_app, db; app = create_app('development'); app.app_context().push(); db.create_all(); print('✓ Database ready')"

REM Start the application
echo.
echo ======================================
echo Starting Flask application...
echo Access the app at: http://localhost:5000
echo Press Ctrl+C to stop
echo ======================================
echo.

python run.py
