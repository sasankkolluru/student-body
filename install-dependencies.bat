@echo off
echo Installing Student Body Project Dependencies...
echo.

echo Installing Server Dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo Server dependency installation failed!
    pause
    exit /b 1
)

echo Building Server...
call npm run build
if %errorlevel% neq 0 (
    echo Server build failed!
    pause
    exit /b 1
)

cd ..

echo Installing Frontend Dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Frontend dependency installation failed!
    pause
    exit /b 1
)

echo.
echo All dependencies installed successfully!
echo.
echo To start the development servers:
echo 1. Open a new terminal and run: cd server && npm run dev
echo 2. Open another terminal and run: npm run dev
echo.
pause
