@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0"
echo ========================================
echo   Smart Campus Assistant
echo ========================================
echo.
echo Starting backend...
start "Backend" cmd /c run-backend.bat
echo Starting frontend...
start "Frontend" cmd /c run-frontend.bat
echo.
echo Waiting 10 seconds for servers...
ping -n 11 127.0.0.1 >nul
echo Opening browser...
start http://localhost:3000
echo.
echo Done! If blank, wait and refresh.
pause