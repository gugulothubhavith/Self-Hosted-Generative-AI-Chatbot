@echo off
TITLE AI Chatbot Dependency Installer

echo ==================================================
echo      AI Chatbot - Dependency Installer
echo ==================================================
echo.
echo This script will install all necessary dependencies for:
echo  1. Backend (Python/Pip)
echo  2. Frontend (Node.js/NPM)
echo  3. Docker Containers (Build)
echo.

REM --- Check Python ---
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in PATH! Please install Python 3.10+.
    pause
    exit /b
)

echo [1/3] Installing Backend Dependencies (Python)...
pip install -r backend/requirements.txt
if %errorlevel% neq 0 (
    echo [WARNING] Pip install failed. Check errors above.
) else (
    echo [SUCCESS] Backend dependencies installed.
)
echo.

REM --- Check Node.js ---
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] NPM is not found! Please install Node.js.
    pause
    exit /b
)

echo [2/3] Installing Frontend Dependencies (NPM)...
cd frontend
call npm install
cd ..
if %errorlevel% neq 0 (
    echo [WARNING] NPM install failed. Check errors above.
) else (
    echo [SUCCESS] Frontend dependencies installed.
)
echo.

REM --- Check Docker ---
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Docker not found. Skipping container build.
) else (
    echo [3/3] Building Docker Containers...
    cd infra
    docker-compose build
    cd ..
    echo [SUCCESS] Docker containers built.
)

echo.
echo ==================================================
echo      Installation Complete!
echo ==================================================
echo You can now run 'start_all.bat' to launch the application.
echo.
pause
