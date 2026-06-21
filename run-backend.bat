@echo off
cd /d "%~dp0server"
echo [Backend] Starting on port 5000...
call "%~dp0server\node_modules\.bin\tsx.cmd" src\server.ts
pause