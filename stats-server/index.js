// stats-server/index.js
// Mini Express server that reads real CPU/RAM from the host's /proc filesystem.
// In Docker, mount host /proc as /host/proc (read-only) and set HOST_PROC=/host/proc

import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;
const HOST_PROC = process.env.HOST_PROC || '/proc';

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
        // Fallback using Node.js os module (e.g. Windows/macOS/non-Linux Docker hosts)
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

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
    console.log(`[Jarvis Stats] Running on port ${PORT}`);
    console.log(`[Jarvis Stats] Reading /proc from: ${HOST_PROC}`);
});
