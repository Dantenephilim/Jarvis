# J.A.R.V.I.S. — Tactical AI Interface

Interface de control de voz e IA construida con React + Vite, conectada a n8n y ElevenLabs.

---

## ⚙️ Requisitos previos

| Herramienta | Versión mínima | Notar |
|---|---|---|
| **Node.js** | v18+ | [nodejs.org](https://nodejs.org) |
| **npm** | v9+ | Viene con Node.js |
| **Cuenta ElevenLabs** | — | Para texto a voz |
| **n8n corriendo** | — | Para procesar comandos de voz |
| **Chromium/Edge** | — | El mic usa Web Speech API (no funciona en Firefox) |

---

## 🚀 Levantar el servidor

### 1. Instalar dependencias (primera vez)

```bash
cd C:\tu_location\Jarvis
npm install
```

### 2. Configurar variables de entorno

Edita el archivo `.env` en la raíz del proyecto:

```env
# URL del webhook de n8n (el proxy de Vite lo redirige automáticamente)
VITE_N8N_WEBHOOK_URL=https://nexotechx.com/webhook/production_link

# API Key de ElevenLabs (text-to-speech)
VITE_ELEVENLABS_API_KEY=tu_api_key_aqui

# Voice ID de ElevenLabs (el ID de la voz que usa Jarvis)
VITE_ELEVENLABS_VOICE_ID=tu_api_key_aqui
```

> **Importante:** El archivo `.env` nunca se sube a Git (está en `.gitignore`). Si clonás el repo de cero, tenés que crearlo manualmente.

### 3. Levantar en modo desarrollo

```bash
npm run dev
```

Jarvis queda disponible en: **http://localhost:5173**

### 4. Lanzador rápido (Windows)

Si estás en Windows, puedes simplemente hacer doble clic en el archivo:
`start-jarvis.bat`

Este script:
- Verifica si tienes el archivo `.env`.
- Instala las dependencias si es la primera vez (`npm install`).
- Inicia el servidor de desarrollo (`npm run dev`).
- Abre automáticamente tu navegador en la dirección correcta.

---

## 🔌 Cómo funciona el proxy de n8n

Vite actúa como proxy inverso para evitar errores de CORS. Cualquier request a `/api/webhook/*` se redirige automáticamente a `https://n8n.nexotechx.com/webhook/*`.

Esto significa que **n8n tiene que estar corriendo y accesible** en `n8n.nexotechx.com` para que Jarvis procese comandos.

Puedes verificar la conexión con:

```bash
node test_connection.js
```

---

## 📡 APIs utilizadas

### ElevenLabs (Text-to-Speech)
- **Modelo:** `eleven_turbo_v2_5`
- **Endpoint:** `https://api.elevenlabs.io/v1/text-to-speech/{voiceId}`
- Fallback automático al TTS del browser si la API key no está configurada.

### Web Speech API (Speech-to-Text)
- Nativa del browser (Chrome/Edge).
- Idioma configurado: `es-ES`
- **No funciona en Firefox ni en HTTP puro** (requiere localhost o HTTPS).

### n8n Webhook
- Recibe el texto transcripto del micrófono.
- Devuelve la respuesta de Jarvis (JSON con campo `output`, `response`, o `text`).

---

## 🌐 Endpoints locales del servidor de Vite

Vite expone dos endpoints internos para el sistema:

| Endpoint | Descripción |
|---|---|
| `GET /api/system-stats` | CPU, RAM y núcleos del sistema |
| `GET /api/spawn-cmd` | Abre una ventana de `cmd.exe` |

---

## 🐳 Desplegar en Docker (Kali Linux)

### Estructura de archivos Docker

```
Jarvis/
├── Dockerfile               # Build multi-stage: Node → Nginx
├── docker-compose.yml       # Orquesta app + stats server
├── .dockerignore
├── .env                     # Variables secretas (no subir a Git)
├── nginx/
│   └── nginx.conf           # Proxy n8n + stats + SPA fallback
└── stats-server/
    ├── Dockerfile
    ├── package.json
    └── index.js             # Lee /proc del host para CPU/RAM reales
```

### Paso a paso en Kali

**1. Copiar el proyecto a Kali**
```bash
# Desde Windows, copiar a Kali vía SCP o montar OneDrive
scp -r /mnt/c/Users/Dante/OneDrive/Proyects/Jarvis user@kali-ip:~/jarvis
```

**2. Configurar variables de entorno**
```bash
cd ~/jarvis
cp .env.example .env
nano .env   # Rellenar API keys reales
```

**3. Construir y levantar**
```bash
docker compose up --build -d
```

Jarvis queda disponible en: **http://localhost** (puerto 80)

**4. Ver logs en tiempo real**
```bash
docker compose logs -f
```

**5. Detener**
```bash
docker compose down
```

### ⚠️ Web Speech API y HTTPS

La API del micrófono del browser **requiere HTTPS o localhost**. Si accedés desde otro dispositivo de la red (ej: `http://192.168.x.x`) el micrófono **no funcionará**.

Solución rápida con un certificado autofirmado en Kali:

```bash
# Generar cert autofirmado
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/CN=jarvis.local"

# Agregar al nginx.conf:
# listen 443 ssl;
# ssl_certificate     /etc/nginx/ssl/cert.pem;
# ssl_certificate_key /etc/nginx/ssl/key.pem;
```

O usar un proxy como **Caddy** o **Cloudflare Tunnel** para HTTPS automático.

### 📊 Cómo funcionan las stats en Docker

El contenedor `jarvis-stats` monta `/proc` del host de Kali como solo-lectura:
```yaml
volumes:
  - /proc:/host/proc:ro
```
Así lee CPU y RAM **reales del host**, no del contenedor.

---

## 🏗️ Estructura del proyecto

```
Jarvis/
├── .env                      # Variables de entorno (no subir a Git)
├── vite.config.js            # Config de Vite + proxy n8n + endpoints locales
├── package.json              # Dependencias
├── test_connection.js        # Script para testear conexión con n8n
└── src/
    ├── App.jsx               # Componente raíz
    ├── hooks/
    │   └── useJarvisLogic.js # Toda la lógica: mic, TTS, n8n, estado
    └── components/
        ├── JarvisOrb.jsx     # Orbe central animado
        ├── ConsoleLog.jsx    # Log de comandos del sistema
        ├── WeatherWidget.jsx # Clima en tiempo real
        ├── SysStatsWidget.jsx# CPU / RAM en tiempo real
        ├── ShortcutsWidget.jsx# Accesos rápidos
        ├── SystemWidgets.jsx # Contenedor de widgets
        ├── SettingsModal.jsx # Modal de configuración
        └── DateTimeWidget.jsx# Hora y fecha
```

---

## 🛠️ Comandos disponibles

```bash
npm run dev       # Levanta el servidor de desarrollo en localhost:5173
npm run build     # Genera el build de producción en /dist
npm run preview   # Sirve el build de /dist localmente
npm run lint      # Corre ESLint
```

---

## 🎙️ Permisos del micrófono

Chrome/Edge pedirán permiso de micrófono la primera vez. Si el mic se bloquea:

1. Hacé click en el **ícono de candado** en la barra de direcciones.
2. Cambiá **Micrófono** a **Permitir**.
3. Recargá la página (`F5`).
4. Si el botón del mic aparece en rojo, hacé click para reactivarlo.

---

## 🔑 Dónde conseguir las keys

| Key | Dónde obtenerla |
|---|---|
| `VITE_ELEVENLABS_API_KEY` | [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys) |
| `VITE_ELEVENLABS_VOICE_ID` | [elevenlabs.io/app/voice-library](https://elevenlabs.io/app/voice-library) (copia el ID de la voz) |
| `VITE_N8N_WEBHOOK_URL` | Panel de n8n → tu workflow → nodo Webhook → URL de producción |
