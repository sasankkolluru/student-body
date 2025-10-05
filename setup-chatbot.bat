@echo off
echo Setting up Vignan University Chatbot System...
echo ================================================
echo.

echo Step 1: Installing Node.js Dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ❌ Server dependency installation failed!
    pause
    exit /b 1
)
echo ✅ Server dependencies installed successfully!

echo.
echo Step 2: Building Server...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Server build failed!
    pause
    exit /b 1
)
echo ✅ Server built successfully!

cd ..

echo.
echo Step 3: Installing Frontend Dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Frontend dependency installation failed!
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed successfully!

echo.
echo Step 4: Setting up Python Environment for Rasa...
cd rasa-chatbot

echo Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed! Please install Python 3.8+ first.
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Creating virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo ❌ Failed to create virtual environment!
    pause
    exit /b 1
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Python dependency installation failed!
    pause
    exit /b 1
)
echo ✅ Python dependencies installed successfully!

echo.
echo Step 5: Training Rasa Model...
python train.py
if %errorlevel% neq 0 (
    echo ❌ Rasa training failed!
    pause
    exit /b 1
)
echo ✅ Rasa model trained successfully!

cd ..

echo.
echo ================================================
echo 🎉 Setup completed successfully!
echo.
echo To start the system:
echo 1. Open a new terminal and run: cd server && npm run dev
echo 2. Open another terminal and run: npm run dev
echo 3. Open a third terminal and run: cd rasa-chatbot && venv\Scripts\activate.bat && python rasa_server.py
echo.
echo The chatbot will use Rasa for advanced AI capabilities with Node-NLP as fallback.
echo.
pause
