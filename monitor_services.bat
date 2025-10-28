@echo off
setlocal enabledelayedexpansion

:: Configuration
set SERVICE_NAME=StudentBodyPlatform
set PM2=pm2
set CHECK_INTERVAL=60

:check_services
:: Check if PM2 is running
%PM2% ping >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [%TIME%] PM2 is not running. Starting services...
    call start_all_services.bat
) else (
    :: Check if all required processes are running
    %PM2% list | findstr /i "student-body-backend rasa-chatbot rasa-actions" >nul
    if %ERRORLEVEL% NEQ 0 (
        echo [%TIME%] Some services are down. Restarting...
        %PM2% restart all
    )
)

timeout /t %CHECK_INTERVAL% /nobreak >nul
goto check_services
