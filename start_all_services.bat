@echo off
title Student Body Platform - Service Manager
setlocal enabledelayedexpansion

:: Configuration
set PROJECT_ROOT=%~dp0
set NODE_EXE=node
set PM2=pm2
set PYTHON=python

:: Colors
set RED=91
set GREEN=92
set YELLOW=93
set BLUE=94
set NC=0

:: Function to display colored messages
:colorEcho
    echo [%time%] %~1
    exit /b 0

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [ADMIN] Running with administrative privileges
) else (
    echo [ERROR] Please run this script as Administrator
    pause
    exit /b 1
)

:: Install PM2 globally if not present
where %PM2% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Installing PM2 globally...
    npm install -g pm2
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install PM2
        pause
        exit /b 1
    )
)

:: Install dependencies
echo [INFO] Installing Node.js dependencies...
cd "%PROJECT_ROOT%"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install Node.js dependencies
    pause
    exit /b 1
)

cd "%PROJECT_ROOT%\server"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install server dependencies
    pause
    exit /b 1
)

:: Start Redis if not running
sc query Redis >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Redis service not found. Please install Redis for Windows.
    echo [INFO] You can download it from: https://github.com/microsoftarchive/redis/releases
    pause
) else (
    sc start Redis >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [INFO] Redis service started successfully
    ) else (
        echo [INFO] Redis service is already running
    )
)

:: Start Backend Service
echo [INFO] Starting Backend Service...
cd "%PROJECT_ROOT%"
%PM2% start "%PROJECT_ROOT%\server\dist\index.js" --name "student-body-backend" --time --restart-delay=3000 --max-memory-restart 1G

:: Start Rasa Chatbot
echo [INFO] Starting Rasa Chatbot...
cd "%PROJECT_ROOT%\rasa-chatbot"

:: Create a temporary batch file to start Rasa in a new window
echo @echo off > start_rasa_temp.bat
echo call "%PROJECT_ROOT%\rasa-chatbot\venv\Scripts\activate.bat" >> start_rasa_temp.bat
echo rasa run --enable-api --cors "*" --debug --endpoints endpoints.yml --port 5005 --log-file logs/rasa.log >> start_rasa_temp.bat

%PM2% start cmd.exe --name "rasa-chatbot" -- /c "%PROJECT_ROOT%\rasa-chatbot\start_rasa_temp.bat"

:: Start Rasa Actions
echo [INFO] Starting Rasa Actions...
cd "%PROJECT_ROOT%\rasa-chatbot"

echo @echo off > start_actions_temp.bat
echo call "%PROJECT_ROOT%\rasa-chatbot\venv\Scripts\activate.bat" >> start_actions_temp.bat
echo rasa run actions --cors "*" --debug --port 5055 --log-file logs/actions.log >> start_actions_temp.bat

%PM2% start cmd.exe --name "rasa-actions" -- /c "%PROJECT_ROOT%\rasa-chatbot\start_actions_temp.bat"

:: Save PM2 process list
%PM2% save

:: Set PM2 to start on system boot
%PM2% startup

:: Display status
timeout /t 3 /nobreak >nul
%PM2% status

echo.
echo ================================================
echo [SUCCESS] All services have been started!
echo.
echo [INFO] Access the application at: http://localhost:3000
echo [INFO] Rasa API: http://localhost:5005
echo [INFO] Rasa Actions: http://localhost:5055
echo.
echo [INFO] To monitor services: pm2 monit
echo [INFO] To view logs: pm2 logs
echo [INFO] To stop services: pm2 stop all
echo ================================================
echo.

:: Cleanup
del "%PROJECT_ROOT%\rasa-chatbot\start_rasa_temp.bat" >nul 2>&1
del "%PROJECT_ROOT%\rasa-chatbot\start_actions_temp.bat" >nul 2>&1

pause
