@echo off
setlocal enabledelayedexpansion

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [ADMIN] Running with administrative privileges
) else (
    echo [ERROR] Please run this script as Administrator
    pause
    exit /b 1
)

:: Install required tools
echo [INFO] Installing required tools...
choco install -y nssm
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install NSSM. Please install Chocolatey first.
    echo [INFO] Install Chocolatey from: https://chocolatey.org/install
    pause
    exit /b 1
)

:: Set paths
set "SERVICE_NAME=StudentBodyPlatform"
set "NODE_PATH=%ProgramFiles%\nodejs\node.exe"
set "PM2_PATH=%APPDATA%\npm\node_modules\pm2\bin\pm2"
set "SCRIPT_PATH=%~dp0start_all_services.bat"

:: Create a batch file to start PM2
echo @echo off > "%TEMP%\start_pm2.bat"
echo set PM2_HOME="%USERPROFILE%\.pm2" >> "%TEMP%\start_pm2.bat"
echo call "%SCRIPT_PATH%" >> "%TEMP%\start_pm2.bat"

:: Install the service
echo [INFO] Installing %SERVICE_NAME% service...
nssm install %SERVICE_NAME% "%TEMP%\start_pm2.bat"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install service
    pause
    exit /b 1
)

:: Configure the service
echo [INFO] Configuring service...
nssm set %SERVICE_NAME% Description "Student Body Platform - Backend and Chatbot Services"
nssm set %SERVICE_NAME% Start SERVICE_AUTO_START
nssm set %SERVICE_NAME% AppDirectory "%~dp0"
nssm set %SERVICE_NAME% AppStdout "%~dp0logs\service.log"
nssm set %SERVICE_NAME% AppStderr "%~dp0logs\service_error.log"
nssm set %SERVICE_NAME% AppRotateFiles 1
nssm set %SERVICE_NAME% AppRotateOnline 1
nssm set %SERVICE_NAME% AppRotateSeconds 86400
nssm set %SERVICE_NAME% AppRotateBytes 1048576

:: Start the service
echo [INFO] Starting service...
net start %SERVICE_NAME%
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Service installed and started successfully!
    echo [INFO] Service name: %SERVICE_NAME%
    echo [INFO] Logs directory: %~dp0logs\
) else (
    echo [WARNING] Service installed but could not be started. Please start it manually.
)

echo.
echo ================================================
echo [INFO] Installation complete!
echo [INFO] The service will start automatically on system boot.
echo [INFO] To manage the service:
echo [INFO]   - Start: net start %SERVICE_NAME%
echo [INFO]   - Stop: net stop %SERVICE_NAME%
echo [INFO]   - Uninstall: nssm remove %SERVICE_NAME% confirm
echo ================================================

pause
