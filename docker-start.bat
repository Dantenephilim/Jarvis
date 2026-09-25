@echo off
title J.A.R.V.I.S. - Docker Launcher
echo ====================================================
echo   ^> INICIANDO J.A.R.V.I.S. EN DOCKER (Windows)
echo ====================================================

docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker no esta instalado o Docker Desktop no esta iniciado.
    echo Inicia Docker Desktop y vuelve a intentarlo.
    pause
    exit /b 1
)

if not exist .env (
    echo [INFO] Creando archivo .env desde .env.example...
    copy .env.example .env >nul
)

echo [INFO] Construyendo e iniciando contenedores...
docker compose up --build -d

if %errorlevel% neq 0 (
    echo [ERROR] Ocurrio un error al levantar los contenedores.
    pause
    exit /b 1
)

echo ====================================================
echo   ^> J.A.R.V.I.S. ESTA EN LINEA
echo ====================================================
echo Abriendo navegador en http://localhost ...
start http://localhost
echo.
echo Para ver logs: docker compose logs -f
echo Para detener:  docker-stop.bat
echo ====================================================
pause
