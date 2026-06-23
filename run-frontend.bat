@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0client"
call "%~dp0client\node_modules\.bin\vite.cmd" --host