@echo off
TITLE AI Chatbot Dependency Installer

echo ==================================================
echo      AI Chatbot - Dependency Installer
echo ==================================================
echo.
echo This script will install all necessary dependencies for:
echo  1. Backend (Python/Pip)
echo  2. Main Frontend (Node.js/NPM)
echo  3. Admin Frontend (Node.js/NPM)
echo  4. Docker Containers (Build)
echo.

REM --- Check Python ---
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in PATH! Please install Python 3.10+.
    pause
    exit /b
)

echo [1/4] Installing Backend Dependencies (Python)...
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

echo [2/4] Installing Main Frontend Dependencies (NPM)...
cd frontend
call npm install
cd ..
if %errorlevel% neq 0 (
    echo [WARNING] NPM install failed for frontend. Check errors above.
) else (
    echo [SUCCESS] Main Frontend dependencies installed.
)
echo.

echo [3/4] Installing Admin Frontend Dependencies (NPM)...
cd admin-frontend
call npm install
cd ..
if %errorlevel% neq 0 (
    echo [WARNING] NPM install failed for admin-frontend. Check errors above.
) else (
    echo [SUCCESS] Admin Frontend dependencies installed.
)
echo.

REM --- Check Docker ---
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Docker not found. Skipping container build.
) else (
    echo [4/4] Building Docker Containers...
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
