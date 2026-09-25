# J.A.R.V.I.S. — Tactical AI Interface

Interface táctica de control por voz e inteligencia artificial construida con React + Vite + Three.js, conectada a workflows de n8n y síntesis de voz de ElevenLabs.

![J.A.R.V.I.S. Banner](public/logo.png)

---

## ⚡ Despliegue Rápido con Docker (Cualquier PC / Servidor)

Puedes levantar J.A.R.V.I.S. en cualquier computadora (Linux, Kali Linux, Ubuntu, Windows con Docker Desktop, macOS, Raspberry Pi, etc.) en **3 simples pasos**:

### 1. Clonar el repositorio
```bash
git clone https://github.com/Dantenephilim/Jarvis.git
cd Jarvis
```

### 2. Configurar variables de entorno (Opcional)
```bash
cp .env.example .env
```
*Si no configuras claves en el archivo `.env`, puedes ingresarlas directamente en el panel de configuración de la interfaz web (icono de engranaje).*

### 3. Levantar con Docker Compose

- **En Linux / Kali / macOS:**
  ```bash
  chmod +x docker-start.sh docker-stop.sh
  ./docker-start.sh
  ```
  *(O directamente: `docker compose up --build -d`)*

- **En Windows:**
  Haz doble clic en `docker-start.bat` o ejecuta:
  ```powershell
  docker compose up --build -d
  ```

🎉 **¡Listo!** Abre tu navegador en: **[http://localhost](http://localhost)**

---

## 🛑 Detener Contenedores

- **En Linux / macOS:** `./docker-stop.sh` o `docker compose down`
- **En Windows:** Haz doble clic en `docker-stop.bat` o `docker compose down`

---

## 🎙️ Permisos de Micrófono y Reconocimiento de Voz

El reconocimiento de voz utiliza la **Web Speech API** nativa de Chromium (Google Chrome, Microsoft Edge, Brave, Opera).

> [!IMPORTANT]
> **Contexto Seguro Requerido**:
> - **Acceso local (`http://localhost` o `http://127.0.0.1`):** El navegador permite el micrófono automáticamente.
> - **Acceso desde otra PC en la misma red local (ej: `http://192.168.1.100`):** Los navegadores bloquean el micrófono en conexiones HTTP no locales.

### ¿Cómo usar el micrófono si accedes por IP en la red local?

1. **Opción A (Recomendada para pruebas rápidas sin SSL):**
   En el navegador de la PC cliente (la que abre la interfaz), ingresa en la barra de direcciones:
   ```text
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
   ```
   - Habilita la opción (**Enabled**).
   - Escribe la URL de tu servidor: `http://IP_DE_TU_PC:PUERTO` (ej: `http://192.168.1.100`).
   - Reinicia el navegador.

2. **Opción B (Túnel HTTPS Gratuito):**
   Usa [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) o `ngrok` para exponer el puerto 80 con un dominio HTTPS seguro:
   ```bash
   cloudflared tunnel --url http://localhost:80
   ```

---

## ⚙️ Variables de Entorno (`.env`)

| Variable | Descripción | Valor por Defecto |
|---|---|---|
| `JARVIS_PORT` | Puerto expuesto en la máquina host | `80` |
| `VITE_N8N_WEBHOOK_URL` | URL del Webhook de producción de n8n | `https://n8n.nexotechx.com/webhook/...` |
| `VITE_ELEVENLABS_API_KEY` | API Key de ElevenLabs para TTS | *(Opcional, configurable en UI)* |
| `VITE_ELEVENLABS_VOICE_ID` | ID de la voz para síntesis | `DMyrgzQFny3JI1Y1paM5` (Jarvis) |

---

## 🛠️ Desarrollo Local (Sin Docker)

Si deseas ejecutar el proyecto en modo desarrollo con recarga en caliente:

### Requisitos:
- **Node.js**: v18 o superior
- **npm**: v9 o superior

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env
cp .env.example .env

# 3. Iniciar servidor de desarrollo
npm run dev
```

Jarvis quedará disponible en: **http://localhost:5173**

---

## 🐳 Arquitectura Docker Multi-Contenedor

El despliegue con Docker Compose orquesta dos servicios en una red privada aislada:

```
                  ┌─────────────────────────────────────────┐
                  │                 CLIENT                  │
                  │   Browser (Chrome / Edge / Chromium)    │
                  └────────────────────┬────────────────────┘
                                       │ HTTP :80
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Docker Network: jarvis-net                                                  │
│                                                                             │
│   ┌────────────────────────────────┐       ┌──────────────────────────────┐ │
│   │           jarvis-app           │       │         jarvis-stats         │ │
│   │         (Nginx Alpine)         │       │        (Node Express)        │ │
│   │  - Sirve SPA React compilada   │       │  - Lee CPU/RAM del Host      │ │
│   │  - Proxy /api/webhook → n8n    │──────▶│    vía /proc o fallback OS   │ │
│   │  - Proxy /api/system-stats ────┼──────▶│  - Expone /stats en :3001    │ │
│   └────────────────────────────────┘       └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **`jarvis-app`**:
   - Compilación multi-stage con `node:20-alpine` y servidor `nginx:alpine`.
   - Proxy inverso Nginx para llamadas de webhook hacia n8n (evita problemas de CORS).
   - Enrutamiento SPA con fallback a `index.html`.

2. **`jarvis-stats`**:
   - Microservicio Express ligero que monitorea CPU, núcleos y uso de RAM en tiempo real.
   - Monta `/proc` en modo solo lectura en Linux/Kali para estadísticas reales del host con fallback automático a la API de Node.js en Windows/macOS.

---

## 📡 APIs y Servicios Integrados

- **ElevenLabs (Text-to-Speech)**: Modelo turbo ultra-rápido de baja latencia para respuestas de voz realistas. Fallback automático a síntesis de voz del navegador si no hay clave configurada.
- **n8n Automation**: Procesamiento de lenguaje natural y ejecución de flujos de trabajo inteligentes.
- **Three.js & React Three Fiber**: Núcleo holográfico interactivo renderizado en 3D en tiempo real con reactividad al audio.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.
