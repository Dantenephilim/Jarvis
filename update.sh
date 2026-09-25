#!/usr/bin/env bash
# ==============================================================================
# J.A.R.V.I.S. - Auto-Updater Script for Dedicated PC / Server
# ==============================================================================

set -e

echo "===================================================="
echo "  🔄 ACTUALIZANDO J.A.R.V.I.S. DESDE GITHUB"
echo "===================================================="

# Check git
if ! command -v git &> /dev/null; then
    echo "❌ Error: git no está instalado."
    exit 1
fi

echo "📥 Descargando los últimos cambios desde GitHub..."
git fetch origin main
git pull origin main

echo "📦 Reconstruyendo imágenes y reiniciando contenedores en Docker..."
docker compose up --build -d

echo ""
echo "===================================================="
echo "  ✅ ACTUALIZACIÓN COMPLETADA CON ÉXITO"
echo "===================================================="
echo "🌐 Abre tu navegador en: http://localhost (o http://$(hostname -I | awk '{print $1}'))"
echo "📊 Ver estado: docker compose ps"
echo "===================================================="
