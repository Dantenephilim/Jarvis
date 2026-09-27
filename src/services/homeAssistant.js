/**
 * Home Assistant REST API Service for J.A.R.V.I.S.
 */

export const getHaConfig = () => {
    const url = localStorage.getItem('ha_url') || import.meta.env.VITE_HA_URL || '';
    const token = localStorage.getItem('ha_token') || import.meta.env.VITE_HA_TOKEN || '';
    return { url: url.replace(/\/$/, ''), token };
};

export const checkHaConnection = async (customUrl, customToken) => {
    const config = (customUrl && customToken) ? { url: customUrl.replace(/\/$/, ''), token: customToken } : getHaConfig();
    
    // Attempt 1: Via backend proxy /api/ha/ (bypasses CORS & Mixed Content HTTPS)
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (config.token) headers['Authorization'] = `Bearer ${config.token}`;
        if (config.url) headers['x-ha-url'] = config.url;

        const proxyRes = await fetch('/api/ha/', { method: 'GET', headers });
        if (proxyRes.ok) {
            const data = await proxyRes.json();
            return { success: true, message: data.message || 'HA Running via Proxy' };
        }
    } catch (e) {
        // Proxy not available or failed
    }

    // Attempt 2: Direct call (when on same protocol/origin)
    if (config.url && config.token) {
        try {
            const res = await fetch(`${config.url}/api/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${config.token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                return { success: true, message: data.message || 'API Running' };
            }
            return { success: false, message: `HTTP ${res.status}: ${res.statusText}` };
        } catch (err) {
            return { success: false, message: err.message || 'Error de conexión' };
        }
    }

    return { success: false, message: 'URL o Token no configurado' };
};

export const fetchHaStates = async () => {
    const config = getHaConfig();

    // Attempt 1: Via proxy /api/ha/states
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (config.token) headers['Authorization'] = `Bearer ${config.token}`;
        if (config.url) headers['x-ha-url'] = config.url;

        const proxyRes = await fetch('/api/ha/states', { method: 'GET', headers });
        if (proxyRes.ok) {
            const data = await proxyRes.json();
            if (Array.isArray(data)) return data;
        }
    } catch (e) {
        // Proxy failed
    }

    // Attempt 2: Direct call
    if (config.url && config.token) {
        try {
            const res = await fetch(`${config.url}/api/states`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${config.token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                return await res.json();
            }
        } catch (err) {
            console.warn('Home Assistant direct fetch states error:', err);
        }
    }

    return null;
};

export const callHaService = async (domain, service, serviceData = {}) => {
    const config = getHaConfig();

    // Attempt 1: Via proxy
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (config.token) headers['Authorization'] = `Bearer ${config.token}`;
        if (config.url) headers['x-ha-url'] = config.url;

        const proxyRes = await fetch(`/api/ha/services/${domain}/${service}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(serviceData)
        });
        if (proxyRes.ok) {
            const result = await proxyRes.json().catch(() => ({ success: true }));
            return { success: true, data: result };
        }
    } catch (e) {
        // Proxy failed
    }

    // Attempt 2: Direct call
    if (config.url && config.token) {
        try {
            const res = await fetch(`${config.url}/api/services/${domain}/${service}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(serviceData)
            });
            if (res.ok) {
                const result = await res.json().catch(() => ({ success: true }));
                return { success: true, data: result };
            }
            return { success: false, status: res.status };
        } catch (err) {
            console.error('Home Assistant service call error:', err);
            return { success: false, error: err.message };
        }
    }

    return { success: false, error: 'Not configured' };
};

export const toggleHaEntity = async (entityId) => {
    const domain = entityId.split('.')[0];
    let service = 'toggle';
    if (domain === 'scene') service = 'turn_on';
    if (domain === 'script') service = 'turn_on';
    if (domain === 'lock') service = 'toggle';
    if (domain === 'cover') service = 'toggle';

    return await callHaService(domain, service, { entity_id: entityId });
};
