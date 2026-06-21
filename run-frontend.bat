@echo off
cd /d "%~dp0client"
echo [Frontend] Starting on port 3000...
call "%~dp0client\node_modules\.bin\vite.cmd" --host
pause