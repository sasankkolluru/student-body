@echo off
setlocal enabledelayedexpansion

:: Check if MongoDB service is running
sc query MongoDB >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    sc query MongoDB | find "RUNNING" >nul
    if %ERRORLEVEL% EQU 0 (
        echo [%TIME%] MongoDB service is already running
        goto :check_connection
    )
)

echo [%TIME%] MongoDB service is not running. Starting...

:: Try to start MongoDB service
net start MongoDB >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [%TIME%] Successfully started MongoDB service
) else (
    echo [%TIME%] [ERROR] Failed to start MongoDB service
    echo [%TIME%] [INFO] Attempting to start MongoDB manually...
    
    :: Try to start MongoDB manually if service fails
    start "" /D "C:\Program Files\MongoDB\Server\5.0\bin" mongod.exe --config "C:\Program Files\MongoDB\Server\5.0\bin\mongod.cfg"
    
    timeout /t 5 /nobreak >nul
    
    :: Check if MongoDB is running on default port
    netstat -ano | find ":27017" | find "LISTENING" >nul
    if %ERRORLEVEL% EQU 0 (
        echo [%TIME%] MongoDB started successfully on port 27017
    ) else (
        echo [%TIME%] [ERROR] Failed to start MongoDB. Please check MongoDB installation.
        exit /b 1
    )
)

:check_connection
echo [%TIME%] Verifying MongoDB connection...

:: Try to connect to MongoDB
"C:\Program Files\MongoDB\Server\5.0\bin\mongo.exe" --eval "db.adminCommand('ping')" --quiet >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [%TIME%] Successfully connected to MongoDB
) else (
    echo [%TIME%] [WARNING] Could not connect to MongoDB. Retrying...
    timeout /t 5 /nobreak >nul
    
    "C:\Program Files\MongoDB\Server\5.0\bin\mongo.exe" --eval "db.adminCommand('ping')" --quiet >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [%TIME%] Successfully connected to MongoDB on retry
    ) else (
        echo [%TIME%] [ERROR] Failed to connect to MongoDB after retry
        echo [%TIME%] [INFO] Please check MongoDB logs and configuration
        exit /b 1
    )
)

echo [%TIME%] MongoDB is ready and accessible

exit /b 0
