@echo off
setlocal
title MovilDrink - servidor local
cd /d "%~dp0"

echo.
echo   ============================================
echo      MovilDrink - servidor local
echo   ============================================
echo.
echo   En esta laptop:   http://localhost:8080
echo.
echo   Desde tu celular o tablet (misma red WiFi):
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=* delims= " %%b in ("%%a") do echo      http://%%b:8080
)
echo.
echo   Deja esta ventana abierta mientras uses la app.
echo   Para cerrar el servidor: Ctrl + C
echo.

start "" http://localhost:8080

python -m http.server 8080 --bind 0.0.0.0
if errorlevel 1 (
    echo.
    echo   No se pudo iniciar. Verifica que Python este instalado.
    pause
)
endlocal
