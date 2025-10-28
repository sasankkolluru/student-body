@echo off
setlocal enabledelayedexpansion

:: Configuration
set CHECK_INTERVAL=60
set LOG_DIR=logs
set MONGODB_SCRIPT=ensure_mongodb.bat
set BACKEND_SCRIPT=ensure_backend.bat

:: Create logs directory if it doesn't exist
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

:monitor_loop
set "TIMESTAMP=%DATE% %TIME%"
echo [%TIMESTAMP%] Checking services... >> "%LOG_DIR%\monitor.log"

:: Check MongoDB
call %MONGODB_SCRIPT% >> "%LOG_DIR%\mongodb.log" 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [%TIMESTAMP%] [ERROR] MongoDB check failed. Check logs/mongodb.log for details. >> "%LOG_DIR%\monitor.log"
) else (
    echo [%TIMESTAMP%] MongoDB is running >> "%LOG_DIR%\monitor.log"
)

:: Check Backend
call %BACKEND_SCRIPT% >> "%LOG_DIR%\backend.log" 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [%TIMESTAMP%] [ERROR] Backend check failed. Check logs/backend.log for details. >> "%LOG_DIR%\monitor.log"
) else (
    echo [%TIMESTAMP%] Backend is running >> "%LOG_DIR%\monitor.log"
)

echo [%TIMESTAMP%] Next check in %CHECK_INTERVAL% seconds... >> "%LOG_DIR%\monitor.log"
timeout /t %CHECK_INTERVAL% /nobreak >nul

goto monitor_loop
