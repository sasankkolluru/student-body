@echo off
setlocal enabledelayedexpansion

:: Set environment
set PYTHON=python
set VENV_DIR=venv
set RASA_ENV=production

:: Check if virtual environment exists, if not create one
if not exist "%VENV_DIR%\" (
    echo Creating Python virtual environment...
    %PYTHON% -m venv %VENV_DIR%
    call %VENV_DIR%\Scripts\activate.bat
    pip install --upgrade pip
    pip install -r requirements.txt
    pip install rasa[full] --use-deprecated=legacy-resolver
) else (
    call %VENV_DIR%\Scripts\activate.bat
)

:: Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

:: Set environment variables
set REDIS_URL=redis://localhost:6379
set RASA_ENVIRONMENT=%RASA_ENV%
set RASA_ACTIONS_PORT=5055
set RASA_ACTIONS_URL=http://localhost:5055/webhook
set RASA_SERVER_PORT=5005

:: Start Rasa server with optimized settings
echo Starting Rasa server...
start "Rasa Server" cmd /k "%VENV_DIR%\Scripts\python.exe" -m rasa run \
    --enable-api \
    --cors "*" \
    --debug \
    --endpoints endpoints.yml \
    --port %RASA_SERVER_PORT% \
    --log-file logs/rasa.log \
    --enable-cors "*" \
    --debug \
    --model models \
    --log-level INFO

:: Start Rasa actions server
timeout /t 2 /nobreak >nul

echo Starting Rasa Actions server...
start "Rasa Actions" cmd /k "%VENV_DIR%\Scripts\python.exe" -m rasa run actions \
    --port %RASA_ACTIONS_PORT% \
    --cors "*" \
    --debug \
    --log-file logs/actions.log

echo.
echo Rasa services started successfully.
echo - Server: http://localhost:%RASA_SERVER_PORT%
echo - Actions: http://localhost:%RASA_ACTIONS_PORT%
echo.
echo Use 'pm2 monit' to monitor the services.
pause
