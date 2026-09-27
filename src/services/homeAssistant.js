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
    if (!config.url || !config.token) return { success: false, message: 'URL o Token no configurado' };

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
};

export const fetchHaStates = async () => {
    const config = getHaConfig();
    if (!config.url || !config.token) return null;

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
        return null;
    } catch (err) {
        console.warn('Home Assistant fetch states error:', err);
        return null;
    }
};

export const callHaService = async (domain, service, serviceData = {}) => {
    const config = getHaConfig();
    if (!config.url || !config.token) {
        console.warn('Home Assistant not configured');
        return { success: false, error: 'Not configured' };
    }

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
            const result = await res.json();
            return { success: true, data: result };
        }
        return { success: false, status: res.status };
    } catch (err) {
        console.error('Home Assistant service call error:', err);
        return { success: false, error: err.message };
    }
};

export const toggleHaEntity = async (entityId) => {
    const domain = entityId.split('.')[0];
    let service = 'toggle';
    if (domain === 'scene') service = 'turn_on';
    if (domain === 'script') service = 'turn_on';
    if (domain === 'lock') service = 'toggle';

    return await callHaService(domain, service, { entity_id: entityId });
};
