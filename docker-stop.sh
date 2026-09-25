#!/usr/bin/env bash
# ==============================================================================
# J.A.R.V.I.S. - Docker Stopper for Linux / Kali / macOS
# ==============================================================================

echo "🛑 Deteniendo contenedores de J.A.R.V.I.S...."
docker compose down
echo "✅ Contenedores detenidos correctamente."
