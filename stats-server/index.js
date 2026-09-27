// stats-server/index.js
// Mini Express server that reads real CPU/RAM from the host's /proc filesystem,
// proxies Home Assistant & n8n requests to bypass CORS/Mixed Content,
// and saves/loads settings to/from .env

import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;
const HOST_PROC = process.env.HOST_PROC || '/proc';

app.use(express.json());

// ─────────────────────────────────────────
// Helper to locate .env file
// ─────────────────────────────────────────
function getEnvFilePath() {
    const candidates = [
        '/app/.env',
        '/host-project/.env',
        '/host/.env',
        path.join(process.cwd(), '.env'),
        path.join(process.cwd(), '..', '.env'),
        '/home/dante/Jarvis/.env',
        '/root/Jarvis/.env'
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    return '/app/.env'; // default target
}

function parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return {};
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const env = {};
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const idx = trimmed.indexOf('=');
            if (idx !== -1) {
                const key = trimmed.slice(0, idx).trim();
                let val = trimmed.slice(idx + 1).trim();
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                env[key] = val;
            }
        }
        return env;
    } catch {
        return {};
    }
}

function getMergedEnv() {
    const envPath = getEnvFilePath();
    const fileEnv = parseEnvFile(envPath);
    return { ...process.env, ...fileEnv };
}

function getHaConfig() {
    const env = getMergedEnv();
    const url = (
        env.HA_URL ||
        env.VITE_HA_URL ||
        env.HOME_ASSISTANT_URL ||
        env.HASS_URL ||
        env.HOMEASSISTANT_URL ||
        ''
    ).trim();
    
    const token = (
        env.HA_TOKEN ||
        env.VITE_HA_TOKEN ||
        env.HOME_ASSISTANT_TOKEN ||
        env.HASS_TOKEN ||
        env.HOMEASSISTANT_TOKEN ||
        env.SUPERVISOR_TOKEN ||
        env.HA_API_KEY ||
        env.HOME_ASSISTANT_API_KEY ||
        ''
    ).trim();

    let cleanUrl = url.replace(/\/+$/, '');
    if (cleanUrl.endsWith('/api')) {
        cleanUrl = cleanUrl.slice(0, -4).replace(/\/+$/, '');
    }

    return { url: cleanUrl, token };
}

function writeEnvFile(filePath, updates) {
    let existingLines = [];
    if (fs.existsSync(filePath)) {
        try {
            existingLines = fs.readFileSync(filePath, 'utf8').split('\n');
        } catch {
            existingLines = [];
        }
    }

    const updatedKeys = new Set();
    const newLines = existingLines.map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            if (key in updates) {
                updatedKeys.add(key);
                return `${key}=${updates[key]}`;
            }
        }
        return line;
    });

    // Append any keys that weren't already in the file
    for (const [key, val] of Object.entries(updates)) {
        if (!updatedKeys.has(key)) {
            newLines.push(`${key}=${val}`);
        }
    }

    try {
        fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
        return true;
    } catch (err) {
        console.error('Failed to write .env file:', err);
        return false;
    }
}

// ─────────────────────────────────────────
// Read RAM from /proc/meminfo with OS fallback
// ─────────────────────────────────────────
function readMemInfo() {
    try {
        const raw = fs.readFileSync(path.join(HOST_PROC, 'meminfo'), 'utf8');
        const lines = Object.fromEntries(
            raw.split('\n')
               .filter(Boolean)
               .map(l => {
                   const [key, val] = l.split(':');
                   return [key.trim(), parseInt(val) || 0];
               })
        );

        const totalKb  = lines['MemTotal']  || 0;
        const freeKb   = lines['MemFree']   || 0;
        const buffers  = lines['Buffers']   || 0;
        const cached   = lines['Cached']    || 0;

        const usedKb   = totalKb - freeKb - buffers - cached;
        const pct      = totalKb > 0 ? Math.round((usedKb / totalKb) * 100) : 0;
        const totalGb  = Math.round(totalKb / (1024 * 1024));

        return { ramPercent: pct, totalRam: totalGb };
    } catch {
        const total = os.totalmem();
        const free = os.freemem();
        const pct = total > 0 ? Math.round(((total - free) / total) * 100) : 0;
        const totalGb = Math.round(total / (1024 * 1024 * 1024));
        return { ramPercent: pct, totalRam: totalGb };
    }
}

// ─────────────────────────────────────────
// Read CPU model from /proc/cpuinfo with OS fallback
// ─────────────────────────────────────────
function readCpuInfo() {
    try {
        const raw = fs.readFileSync(path.join(HOST_PROC, 'cpuinfo'), 'utf8');
        const modelLine = raw.split('\n').find(l => l.startsWith('model name'));
        const coreLine  = raw.split('\n').filter(l => l.startsWith('processor'));

        const model = modelLine ? modelLine.split(':')[1].trim() : os.cpus()[0]?.model || 'Unknown CPU';
        const cores = coreLine.length || os.cpus().length;

        return { cpu: model, cores };
    } catch {
        const cpus = os.cpus();
        return { cpu: cpus[0]?.model || 'Unknown CPU', cores: cpus.length };
    }
}

// ─────────────────────────────────────────
// /stats endpoint
// ─────────────────────────────────────────
app.get('/stats', (req, res) => {
    const mem = readMemInfo();
    const cpu = readCpuInfo();

    res.json({
        cpu:        cpu.cpu,
        cores:      cpu.cores,
        ramPercent: mem.ramPercent,
        totalRam:   mem.totalRam,
    });
});

// ─────────────────────────────────────────
// Configuration API: Load & Save to .env
// ─────────────────────────────────────────
app.get('/config', (req, res) => {
    const env = getMergedEnv();
    const ha = getHaConfig();

    res.json({
        n8nUrl: env.VITE_N8N_WEBHOOK_URL || env.N8N_WEBHOOK_URL || 'http://10.0.0.141:5678/webhook/fbb90c0a-03c0-4c21-a5bf-dc85cf102a2a',
        haUrl: ha.url || '',
        haToken: ha.token || '',
        elevenApiKey: env.VITE_ELEVENLABS_API_KEY || '',
        elevenVoiceId: env.VITE_ELEVENLABS_VOICE_ID || 'DMyrgzQFny3JI1Y1paM5'
    });
});

app.post('/save-config', (req, res) => {
    const { n8nUrl, haUrl, haToken, elevenApiKey, elevenVoiceId } = req.body;
    const envPath = getEnvFilePath();

    const updates = {};
    if (n8nUrl !== undefined) {
        updates['VITE_N8N_WEBHOOK_URL'] = n8nUrl;
        updates['N8N_WEBHOOK_URL'] = n8nUrl;
        process.env.VITE_N8N_WEBHOOK_URL = n8nUrl;
        process.env.N8N_WEBHOOK_URL = n8nUrl;
    }
    if (haUrl !== undefined) {
        let cleanHa = haUrl.trim().replace(/\/+$/, '');
        if (cleanHa.endsWith('/api')) cleanHa = cleanHa.slice(0, -4).replace(/\/+$/, '');
        updates['VITE_HA_URL'] = cleanHa;
        updates['HA_URL'] = cleanHa;
        process.env.VITE_HA_URL = cleanHa;
        process.env.HA_URL = cleanHa;
    }
    if (haToken !== undefined) {
        const cleanToken = haToken.trim();
        updates['VITE_HA_TOKEN'] = cleanToken;
        updates['HA_TOKEN'] = cleanToken;
        process.env.VITE_HA_TOKEN = cleanToken;
        process.env.HA_TOKEN = cleanToken;
    }
    if (elevenApiKey !== undefined) {
        updates['VITE_ELEVENLABS_API_KEY'] = elevenApiKey;
        process.env.VITE_ELEVENLABS_API_KEY = elevenApiKey;
    }
    if (elevenVoiceId !== undefined) {
        updates['VITE_ELEVENLABS_VOICE_ID'] = elevenVoiceId;
        process.env.VITE_ELEVENLABS_VOICE_ID = elevenVoiceId;
    }

    const saved = writeEnvFile(envPath, updates);
    console.log(`[Config API] Saved settings to ${envPath}:`, updates);

    res.json({
        success: saved,
        message: saved ? 'Configuración guardada en .env y aplicada!' : 'Error al escribir archivo .env',
        config: updates
    });
});

// ─────────────────────────────────────────
// Proxy for n8n Webhook to bypass Mixed Content & CORS
// ─────────────────────────────────────────
app.all('/n8n-proxy', async (req, res) => {
    const env = getMergedEnv();
    const defaultUrl = env.VITE_N8N_WEBHOOK_URL || env.N8N_WEBHOOK_URL || 'http://10.0.0.141:5678/webhook/fbb90c0a-03c0-4c21-a5bf-dc85cf102a2a';
    const targetUrl = (req.headers['x-n8n-url'] || defaultUrl).trim();

    try {
        const fetchOptions = {
            method: req.method,
            headers: {
                'Content-Type': req.headers['content-type'] || 'application/json'
            }
        };

        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const n8nRes = await fetch(targetUrl, fetchOptions);
        const contentType = n8nRes.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            const data = await n8nRes.json();
            return res.status(n8nRes.status).json(data);
        } else {
            const text = await n8nRes.text();
            return res.status(n8nRes.status).send(text);
        }
    } catch (err) {
        console.error('[n8n Proxy Error]:', err.message);
        return res.status(502).json({ error: 'Failed to communicate with n8n', message: err.message, targetUrl });
    }
});

// ─────────────────────────────────────────
// Proxy for Home Assistant to bypass CORS & Mixed Content
// ─────────────────────────────────────────
app.all('/ha/*', async (req, res) => {
    const haConfig = getHaConfig();
    
    let targetUrl = (req.headers['x-ha-url'] || haConfig.url || '').trim().replace(/\/+$/, '');
    if (targetUrl.endsWith('/api')) {
        targetUrl = targetUrl.slice(0, -4).replace(/\/+$/, '');
    }

    let targetToken = (
        (req.headers['authorization'] ? req.headers['authorization'].replace(/^Bearer\s+/i, '') : '') ||
        req.headers['x-ha-token'] ||
        haConfig.token
    ).trim();

    if (!targetUrl || !targetToken) {
        console.warn(`[HA Proxy] Missing configuration: URL='${targetUrl}', Token=${targetToken ? 'PRESENT' : 'MISSING'}`);
        return res.status(400).json({ 
            error: 'Home Assistant URL or Token not configured in .env',
            urlConfigured: !!targetUrl,
            tokenConfigured: !!targetToken
        });
    }

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = `http://${targetUrl}`;
    }

    const subPath = (req.params[0] || '').replace(/^\/+/, '');
    const fullHaUrl = subPath ? `${targetUrl}/api/${subPath}` : `${targetUrl}/api/`;

    console.log(`[HA Proxy] Forwarding ${req.method} request to: ${fullHaUrl}`);

    try {
        const fetchOptions = {
            method: req.method,
            headers: {
                'Authorization': `Bearer ${targetToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const haResponse = await fetch(fullHaUrl, fetchOptions);
        const contentType = haResponse.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            const data = await haResponse.json();
            return res.status(haResponse.status).json(data);
        } else {
            const text = await haResponse.text();
            return res.status(haResponse.status).send(text);
        }
    } catch (err) {
        console.error(`[HA Proxy Error] Failed to reach ${fullHaUrl}:`, err.message);
        return res.status(502).json({ 
            error: 'Failed to communicate with Home Assistant', 
            message: err.message,
            targetUrl: fullHaUrl
        });
    }
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
    console.log(`[Jarvis Stats & Proxy] Running on port ${PORT}`);
    console.log(`[Jarvis Stats & Proxy] Reading /proc from: ${HOST_PROC}`);
    const ha = getHaConfig();
    console.log(`[Jarvis Stats & Proxy] Home Assistant configured: URL=${ha.url ? 'YES' : 'NO'}, TOKEN=${ha.token ? 'YES' : 'NO'}`);
});
