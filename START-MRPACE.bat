@echo off
title Mr Pace - starting website
cd /d "%~dp0"

if not exist "backend\.env" copy "backend\.env.example" "backend\.env" >nul

echo Starting Mr Pace backend, website and admin...
start "Mr Pace backend" cmd /k "cd /d "%~dp0backend" && node src/server.js"
start "Mr Pace website" cmd /k "cd /d "%~dp0frontend" && npx vite --port 5173"
start "Mr Pace admin" cmd /k "cd /d "%~dp0admin" && npx vite --port 5174"

timeout /t 6 /nobreak >nul
start "" http://localhost:5173
start "" http://localhost:5174

echo.
echo Website: http://localhost:5173
echo Admin:   http://localhost:5174
echo Close the three black windows to stop the site.
