#!/bin/bash

# Script para iniciar Jarvis en Kali Linux

# Obtiene el directorio actual donde se encuentra el script
JARVIS_DIR="$(dirname "$(realpath "$0")")"

echo -e "\e[36m[JARVIS]\e[0m Iniciando el sistema Jarvis..."

# Navega al directorio
cd "$JARVIS_DIR" || { echo -e "\e[31m[ERROR]\e[0m No se pudo acceder a $JARVIS_DIR"; exit 1; }

# Verifica si npm está instalado
if ! command -v npm &> /dev/null; then
    echo -e "\e[31m[ERROR]\e[0m npm no está instalado. Por favor, instala nodejs y npm primero."
    echo -e "Puedes instalarlo con: sudo apt update && sudo apt install nodejs npm"
    exit 1
fi

# Instala las dependencias si no existe la carpeta node_modules
if [ ! -d "node_modules" ]; then
    echo -e "\e[33m[JARVIS]\e[0m Dependencias no encontradas. Instalando..."
    npm install
fi

# Inicia el servidor
echo -e "\e[32m[JARVIS]\e[0m Lanzando el servidor web de Jarvis..."
npm run dev -- --host
