# ──────────────────────────────────────────────
# Stage 1: Build the React app
# ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for Vite environment variables
ARG VITE_N8N_WEBHOOK_URL
ARG VITE_ELEVENLABS_API_KEY
ARG VITE_ELEVENLABS_VOICE_ID

ENV VITE_N8N_WEBHOOK_URL=$VITE_N8N_WEBHOOK_URL
ENV VITE_ELEVENLABS_API_KEY=$VITE_ELEVENLABS_API_KEY
ENV VITE_ELEVENLABS_VOICE_ID=$VITE_ELEVENLABS_VOICE_ID

# Install deps first (cache layer)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ──────────────────────────────────────────────
# Stage 2: Serve with Nginx
# ──────────────────────────────────────────────
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/jarvis.conf

# Copy built React app from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
