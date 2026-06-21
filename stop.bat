@echo off
echo Stopping servers...
taskkill /F /IM node.exe 2>nul
echo Stopped.
pause