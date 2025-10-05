#!/bin/bash

echo "Setting up Vignan University Chatbot System..."
echo "================================================"
echo

echo "Step 1: Installing Node.js Dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Server dependency installation failed!"
    exit 1
fi
echo "✅ Server dependencies installed successfully!"

echo
echo "Step 2: Building Server..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Server build failed!"
    exit 1
fi
echo "✅ Server built successfully!"

cd ..

echo
echo "Step 3: Installing Frontend Dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Frontend dependency installation failed!"
    exit 1
fi
echo "✅ Frontend dependencies installed successfully!"

echo
echo "Step 4: Setting up Python Environment for Rasa..."
cd rasa-chatbot

echo "Checking Python installation..."
python3 --version >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Python is not installed! Please install Python 3.8+ first."
    echo "Install with: sudo apt-get install python3 python3-pip python3-venv"
    exit 1
fi

echo "Creating virtual environment..."
python3 -m venv venv
if [ $? -ne 0 ]; then
    echo "❌ Failed to create virtual environment!"
    exit 1
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Python dependency installation failed!"
    exit 1
fi
echo "✅ Python dependencies installed successfully!"

echo
echo "Step 5: Training Rasa Model..."
python train.py
if [ $? -ne 0 ]; then
    echo "❌ Rasa training failed!"
    exit 1
fi
echo "✅ Rasa model trained successfully!"

cd ..

echo
echo "================================================"
echo "🎉 Setup completed successfully!"
echo
echo "To start the system:"
echo "1. Open a new terminal and run: cd server && npm run dev"
echo "2. Open another terminal and run: npm run dev"
echo "3. Open a third terminal and run: cd rasa-chatbot && source venv/bin/activate && python rasa_server.py"
echo
echo "The chatbot will use Rasa for advanced AI capabilities with Node-NLP as fallback."
echo
