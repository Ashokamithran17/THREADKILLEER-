@echo off
title ThreatKiller - Startup Wizard
echo ==============================================================
echo               ThreatKiller Local Startup Wizard
echo ==============================================================
echo Checking system tools...

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python.
    pause
    exit /b
)

call npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js/npm is not installed or not in PATH. Please install Node.js.
    pause
    exit /b
)

echo.
echo [1/4] Preparing Python Virtual Environment...
cd backend
if not exist venv (
    echo Creating virtual environment venv...
    python -m venv venv
)
call venv\Scripts\activate

echo.
echo [2/4] Installing Python Backend dependencies...
pip install -r requirements.txt

echo.
echo [3/4] Seeding SQLite database and training Isolation Forest model...
python database/seed_db.py

echo.
echo Starting FastAPI Backend server in a new window...
start "ThreatKiller Backend" cmd /k "call venv\Scripts\activate && uvicorn main:app --host 127.0.0.1 --port 8000"

echo.
echo [4/4] Setting up React Frontend...
cd ../frontend
if not exist node_modules (
    echo Installing node packages...
    call npm install --legacy-peer-deps
)

echo Starting Vite Frontend dev server in a new window...
start "ThreatKiller Frontend" cmd /k "npm run dev"

echo.
echo ==============================================================
echo                 STARTUP PROGRESS COMPLETE
echo ==============================================================
echo  Frontend Dashboard will be available at: http://localhost:5173
echo  FastAPI REST API docs available at:       http://127.0.0.1:8000/docs
echo.
echo  Default Login Credentials:
echo  - Username: admin
echo  - Password: password123
echo ==============================================================
echo Press any key to close this launcher.
pause
