@echo off
TITLE AI Chatbot Launcher

REM Check for Administrator privileges
NET SESSION >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

REM Change to script directory
cd /d "%~dp0"

echo ==================================================
echo      Self-Hosted AI Chatbot Launcher
echo ==================================================
echo.
echo Launching setup script...
echo.

powershell -ExecutionPolicy Bypass -File "./setup_windows.ps1"

echo.
echo ==================================================
echo      Press any key to close this window...
echo ==================================================
pause >nul
