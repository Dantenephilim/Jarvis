#!/usr/bin/env bash
# ==============================================================================
# J.A.R.V.I.S. - Docker Launcher for Linux / Kali / macOS
# ==============================================================================

set -e

echo "===================================================="
echo "  🚀 INICIANDO J.A.R.V.I.S. EN DOCKER"
echo "===================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado o no se encuentra en el PATH."
    echo "👉 Instala Docker desde: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  No se encontró el archivo .env. Creando uno desde .env.example..."
    cp .env.example .env
    echo "✅ Archivo .env generado. Puedes editarlo si deseas personalizar claves."
fi

echo "📦 Construyendo y levantando contenedores con Docker Compose..."
docker compose up --build -d

echo ""
echo "===================================================="
echo "  ✅ J.A.R.V.I.S. ESTÁ EN LÍNEA"
echo "===================================================="
echo "🌐 Abre tu navegador en: http://localhost"
echo "📊 Ver logs: docker compose logs -f"
echo "🛑 Detener:  ./docker-stop.sh (o docker compose down)"
echo "===================================================="
