@echo off
title J.A.R.V.I.S. — Launching...
color 0B

echo.
echo  ================================================
echo   J.A.R.V.I.S.  --  Tactical AI Interface
echo  ================================================
echo.

:: Check if .env exists
if not exist ".env" (
    echo [ERROR] No se encontro el archivo .env
    echo         Copia .env.example a .env y rellena las API keys.
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [SETUP] Primera vez detectada. Instalando dependencias...
    echo.
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install fallo. Asegurate de tener Node.js instalado.
        pause
        exit /b 1
    )
    echo.
)

echo [BOOT] Iniciando servidor de desarrollo...
echo [INFO] Jarvis estara disponible en: http://localhost:5173
echo [INFO] Presiona Ctrl+C para detener el servidor.
echo.

:: Open browser after a short delay (background process)
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"

:: Start Vite dev server
npm run dev

pause
