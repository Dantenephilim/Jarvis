#!/usr/bin/env bash
# ==============================================================================
# J.A.R.V.I.S. - Tailscale HTTPS Enabler (Enables Native Mic & Camera remotely)
# ==============================================================================

set -e

echo "===================================================="
echo "  🔒 ACTIVANDO HTTPS CON TAILSCALE SERVE"
echo "===================================================="

if ! command -v tailscale &> /dev/null; then
    echo "❌ Error: Tailscale no está instalado."
    echo "👉 Instala Tailscale con: curl -fsSL https://tailscale.com/install.sh | sh"
    exit 1
fi

echo "🚀 Exponiendo el puerto 80 con HTTPS automático vía Tailscale..."
sudo tailscale serve --bg 80

echo ""
echo "===================================================="
echo "  ✅ TAILSCALE HTTPS ACTIVADO"
echo "===================================================="
echo "🌐 Ahora puedes abrir Jarvis con HTTPS seguro desde cualquier otra PC o móvil en tu Tailnet."
echo "🎙️ Micrófono y 📷 Cámara funcionarán de forma nativa sin configurar flags en el navegador."
echo "🔗 Para ver tu dominio Tailscale, corre: tailscale status"
echo "===================================================="
