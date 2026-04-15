import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { exec } from 'child_process'
import os from 'os'

const localTerminalPlugin = () => ({
  name: 'local-terminal-plugin',
  configureServer(server) {
    server.middlewares.use('/api/spawn-cmd', (req, res) => {
      exec('start cmd.exe');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    });
    
    server.middlewares.use('/api/system-stats', (req, res) => {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);
      const cpus = os.cpus();
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
         cpu: cpus[0].model,
         cores: cpus.length,
         ramPercent: memPercent,
         totalRam: Math.round(totalMem / (1024*1024*1024))
      }));
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localTerminalPlugin()],
  server: {
    proxy: {
      '/api/webhook': {
        target: 'https://n8n.nexotechx.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/webhook/, '/webhook'),
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error('[Proxy Error]', err.message, req.url);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('[Proxy →]', req.method, req.url, '→', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('[Proxy ←]', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})
