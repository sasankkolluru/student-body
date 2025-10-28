@echo off
setlocal enabledelayedexpansion

:: Configuration
set BACKEND_DIR=%~dp0server
set NODE_ENV=production
set PORT=3001
set MONGODB_URI=mongodb://localhost:27017/student_body
set PM2=pm2

:: Set environment variables
set NODE_ENV=%NODE_ENV%
set PORT=%PORT%
set MONGODB_URI=%MONGODB_URI%

:: Create logs directory if it doesn't exist
if not exist "%BACKEND_DIR%\logs" mkdir "%BACKEND_DIR%\logs"

:: Check if PM2 is installed
where %PM2% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [%TIME%] [INFO] PM2 not found. Installing PM2 globally...
    npm install -g pm2
    if %ERRORLEVEL% NEQ 0 (
        echo [%TIME%] [ERROR] Failed to install PM2
        exit /b 1
    )
)

:: Check if backend process is already running
%PM2% describe student-body-backend >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [%TIME%] Backend is already running
    %PM2% list | findstr /i "student-body-backend"
    exit /b 0
)

echo [%TIME%] Starting backend service...

:: Change to backend directory
cd /d "%BACKEND_DIR%"

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo [%TIME%] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [%TIME%] [ERROR] Failed to install dependencies
        exit /b 1
    )
)

:: Build TypeScript if needed
if exist "tsconfig.json" (
    echo [%TIME%] Building TypeScript...
    call npx tsc
    if %ERRORLEVEL% NEQ 0 (
        echo [%TIME%] [ERROR] TypeScript build failed
        exit /b 1
    )
)

:: Start the backend with PM2
echo [%TIME%] Starting backend with PM2...
%PM2% start "dist/index.js" --name "student-body-backend" --time --restart-delay=3000 --max-memory-restart 1G --output "logs/backend-out.log" --error "logs/backend-error.log"

if %ERRORLEVEL% EQU 0 (
    echo [%TIME%] Backend started successfully with PM2
    %PM2% save
    %PM2% startup
) else (
    echo [%TIME%] [ERROR] Failed to start backend with PM2
    exit /b 1
)

echo [%TIME%] Backend is running on http://localhost:%PORT%
echo [%TIME%] PM2 Process List:
%PM2% list

exit /b 0
