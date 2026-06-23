@echo off
set PATH=C:\Program Files\nodejs;C:\Users\jxgm\AppData\Local\Programs\Python\Python313;%PATH%
cd /d "%~dp0server"
call "%~dp0server\node_modules\.bin\tsx.cmd" src\server.ts