#!/bin/bash

echo "Installing Student Body Project Dependencies..."
echo

echo "Installing Server Dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "Server dependency installation failed!"
    exit 1
fi

echo "Building Server..."
npm run build
if [ $? -ne 0 ]; then
    echo "Server build failed!"
    exit 1
fi

cd ..

echo "Installing Frontend Dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Frontend dependency installation failed!"
    exit 1
fi

echo
echo "All dependencies installed successfully!"
echo
echo "To start the development servers:"
echo "1. Open a new terminal and run: cd server && npm run dev"
echo "2. Open another terminal and run: npm run dev"
echo
