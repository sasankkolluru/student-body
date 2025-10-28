@echo off
cd /d %~dp0

:: Install PM2 globally if not already installed
npm install -g pm2

:: Install dependencies
cd server
npm install
cd ..

:: Start all services using PM2
pm2 start ecosystem.config.js

:: Save PM2 process list for autostart
pm2 save

:: Generate startup script
pm2 startup

:: Display status
pm2 status

echo.
echo All services have been started and configured to run on system startup.
echo You can monitor them using: pm2 monit
echo To view logs: pm2 logs
echo To stop all services: pm2 stop all

pause
