/**
 * Home Assistant REST API Service for J.A.R.V.I.S.
 */

export const getHaConfig = () => {
    const url = (localStorage.getItem('ha_url') || import.meta.env.VITE_HA_URL || '').trim();
    const token = (localStorage.getItem('ha_token') || import.meta.env.VITE_HA_TOKEN || '').trim();
    return { url: url.replace(/\/+$/, ''), token };
};

export const checkHaConnection = async (customUrl, customToken) => {
    const config = (customUrl !== undefined && customToken !== undefined) 
        ? { url: (customUrl || '').trim().replace(/\/+$/, ''), token: (customToken || '').trim() } 
        : getHaConfig();
    
    // Attempt 1: Via backend proxy /api/ha/ (bypasses CORS & Mixed Content HTTPS)
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (config.token) headers['Authorization'] = `Bearer ${config.token}`;
        if (config.url) headers['x-ha-url'] = config.url;

        const proxyRes = await fetch('/api/ha/', { method: 'GET', headers });
        if (proxyRes.ok) {
            const data = await proxyRes.json();
            return { success: true, message: data.message || 'HA Running via Proxy' };
        } else {
            const errData = await proxyRes.json().catch(() => ({}));
            return { 
                success: false, 
                message: errData.message || errData.error || `HTTP ${proxyRes.status}: ${proxyRes.statusText}` 
            };
        }
    } catch (e) {
        console.warn('[HA Service] Proxy check error:', e.message);
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
            return { success: false, message: err.message || 'Error de conexión directa' };
        }
    }

    return { success: false, message: 'URL o Token de Home Assistant no configurado' };
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
        } else {
            console.warn('[HA Service] /api/ha/states failed with status', proxyRes.status);
        }
    } catch (e) {
        console.warn('[HA Service] /api/ha/states network error:', e.message);
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
            console.warn('[HA Service] Direct states fetch error:', err.message);
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
        console.warn('[HA Service] Call service proxy error:', e.message);
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
            console.error('[HA Service] Direct service call error:', err);
            return { success: false, error: err.message };
        }
    }

    return { success: false, error: 'Not configured' };
};

export const toggleHaEntity = async (entityId) => {
    const domain = entityId.split('.')[0];
    let service = 'toggle';
    let serviceData = { entity_id: entityId };

    if (domain === 'scene' || domain === 'script') {
        service = 'turn_on';
    } else if (domain === 'lock') {
        service = 'toggle';
    } else if (domain === 'cover') {
        service = 'toggle';
    } else if (domain === 'vacuum') {
        service = 'start_pause';
    } else if (domain === 'automation') {
        service = 'trigger';
    } else if (domain === 'input_boolean') {
        service = 'toggle';
    } else if (domain === 'fan') {
        service = 'toggle';
    } else if (domain === 'climate') {
        service = 'set_hvac_mode';
        serviceData = { entity_id: entityId, hvac_mode: 'heat_cool' };
    }

    return await callHaService(domain, service, serviceData);
};
