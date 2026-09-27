import React, { useState, useEffect } from 'react';
import { X, Save, Key, Globe, Mic } from 'lucide-react';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose, onSave }) => {
    const [agentId, setAgentId] = useState('');
    const [n8nUrl, setN8nUrl] = useState('');
    const [voiceId, setVoiceId] = useState('');
    const [testStatus, setTestStatus] = useState(''); // 'testing', 'success', 'error'
    const [testMessage, setTestMessage] = useState('');
    const [theme, setTheme] = useState('VoiceCore');

    const [haUrl, setHaUrl] = useState('');
    const [haToken, setHaToken] = useState('');
    const [haTestStatus, setHaTestStatus] = useState('');
    const [haTestMessage, setHaTestMessage] = useState('');

    const DEFAULT_N8N_URL = 'http://10.0.0.141:5678/webhook/fbb90c0a-03c0-4c21-a5bf-dc85cf102a2a';
    const DEFAULT_VOICE_ID = 'DMyrgzQFny3JI1Y1paM5'; // Default Jarvis

    useEffect(() => {
        // Load initial from localStorage
        const storedId = localStorage.getItem('eleven_agent_id');
        let storedUrl = localStorage.getItem('n8n_webhook_url');
        const storedVoice = localStorage.getItem('eleven_voice_id');
        const storedHaUrl = localStorage.getItem('ha_url');
        const storedHaToken = localStorage.getItem('ha_token');
        
        if (storedId) setAgentId(storedId);
        if (storedHaUrl) setHaUrl(storedHaUrl);
        if (storedHaToken) setHaToken(storedHaToken);
        if (storedVoice) setVoiceId(storedVoice);
        else setVoiceId(DEFAULT_VOICE_ID);
        
        if (storedUrl && !storedUrl.includes('nexotechx.com') && !storedUrl.includes('1faaf855')) {
            setN8nUrl(storedUrl);
        } else {
            setN8nUrl(DEFAULT_N8N_URL);
            localStorage.setItem('n8n_webhook_url', DEFAULT_N8N_URL);
        }

        const storedTheme = localStorage.getItem('jarvis_theme');
        if (storedTheme) setTheme(storedTheme);
        else setTheme('VoiceCore');

        // Fetch server .env values
        fetch('/api/config')
            .then(res => res.json())
            .then(data => {
                if (data.n8nUrl) {
                    setN8nUrl(data.n8nUrl);
                    localStorage.setItem('n8n_webhook_url', data.n8nUrl);
                }
                if (data.haUrl) {
                    setHaUrl(data.haUrl);
                    localStorage.setItem('ha_url', data.haUrl);
                }
                if (data.haToken) {
                    setHaToken(data.haToken);
                    localStorage.setItem('ha_token', data.haToken);
                }
                if (data.elevenApiKey) {
                    setAgentId(data.elevenApiKey);
                    localStorage.setItem('eleven_agent_id', data.elevenApiKey);
                }
            })
            .catch(() => {});

        setTestStatus('');
        setTestMessage('');
        setHaTestStatus('');
        setHaTestMessage('');
    }, [isOpen]);

    const handleSave = async () => {
        localStorage.setItem('eleven_agent_id', agentId);
        localStorage.setItem('n8n_webhook_url', n8nUrl);
        localStorage.setItem('eleven_voice_id', voiceId);
        localStorage.setItem('ha_url', haUrl);
        localStorage.setItem('ha_token', haToken);
        localStorage.setItem('jarvis_theme', theme);

        // Persist directly into server .env file
        try {
            await fetch('/api/save-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    n8nUrl,
                    haUrl,
                    haToken,
                    elevenApiKey: agentId,
                    elevenVoiceId: voiceId
                })
            });
        } catch (e) {
            console.warn('Could not persist to server .env directly:', e);
        }

        onSave({ agentId, n8nUrl, voiceId, theme, haUrl, haToken });
        onClose();
    };

    const handleTestHa = async () => {
        if (!haUrl) {
            setHaTestStatus('error');
            setHaTestMessage('Por favor ingresa la URL de Home Assistant');
            return;
        }
        setHaTestStatus('testing');
        setHaTestMessage('Conectando a Home Assistant...');

        try {
            const cleanUrl = haUrl.replace(/\/$/, '');
            const res = await fetch('/api/ha/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${haToken}`,
                    'x-ha-url': cleanUrl,
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setHaTestStatus('success');
                setHaTestMessage(`HA Conectado: ${data.message || 'API OK'}`);
            } else {
                setHaTestStatus('error');
                setHaTestMessage(`Error HA: HTTP ${res.status}`);
            }
        } catch (err) {
            setHaTestStatus('error');
            setHaTestMessage(`Error de red: ${err.message}`);
        }
    };

    const handleTestConnection = async () => {
        if (!n8nUrl) {
            setTestStatus('error');
            setTestMessage('Please enter a URL first');
            return;
        }
        setTestStatus('testing');
        setTestMessage('Pinging n8n via proxy...');

        try {
            const res = await fetch('/api/n8n-proxy', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-n8n-url': n8nUrl
                },
                body: JSON.stringify({ chatInput: 'TEST_CONNECTION_FROM_JARVIS' })
            });

            if (res.ok) {
                setTestStatus('success');
                setTestMessage('Connection Successful!');
            } else {
                setTestStatus('error');
                setTestMessage(`Failed: HTTP ${res.status}`);
            }
        } catch (err) {
            setTestStatus('error');
            setTestMessage(`Error: ${err.message}`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-panel">
                <div className="modal-header">
                    <h2 className="title-neon text-cyan"><Key size={20} style={{ marginRight: '10px' }} /> SYSTEM CONFIG</h2>
                    <button className="close-btn" onClick={onClose}><X size={24} color="var(--primary-glow)" /></button>
                </div>

                <div className="modal-body">
                    <div className="input-group">
                        <label className="text-emerald">ELEVENLABS AGENT ID</label>
                        <input
                            type="password"
                            value={agentId}
                            onChange={(e) => setAgentId(e.target.value)}
                            placeholder="e.g. a_12345678..."
                            className="cyber-input"
                        />
                    </div>

                    <div className="input-group" style={{ marginTop: '20px' }}>
                        <label className="text-emerald"><Mic size={16} style={{marginRight:'5px'}}/> VOICE PROFILE</label>
                        <select 
                            value={voiceId} 
                            onChange={(e) => setVoiceId(e.target.value)}
                            className="cyber-input"
                        >
                            <option value="DMyrgzQFny3JI1Y1paM5">J.A.R.V.I.S. (Default)</option>
                            <option value="6fZce9LFNG3iEITDfqZZ">Charlotte (Alt)</option>
                            <option value="dn9HtxgDwCH96MVX9iAO">Xavian</option>
                            <option value="tgfcQY9SGvn3GfmnNWIi">Larry</option>
                            <option value="RKCbSROXui75bk1SVpy8">Shaun</option>
                            <option value="V3qtdXMm1DnTIg3N6NBN">Oxleys</option>
                            <option value="NKKDngZymUvjZVKvNU1">Tyler</option>
                            <option value="E4aVOlWL5DGbFy7TWmZA">Mike</option>
                            <option value="XEQBC9sleaE3f5ff82UR">Charlotte</option>
                            <option value="2LZAcK8Cx5QjdQhfBsJQZ">Grace</option>
                            <option value="sBObXMSU6qeIkKldMgv0">Connery</option>
                        </select>
                        <small className="hint">Select active synthesizing persona.</small>
                    </div>

                    <div className="input-group" style={{ marginTop: '20px' }}>
                        <label className="text-emerald">N8N WEBHOOK URL</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="password"
                                value={n8nUrl}
                                onChange={(e) => setN8nUrl(e.target.value)}
                                placeholder="https://..."
                                className="cyber-input"
                                style={{ flex: 1 }}
                            />
                            <button
                                className="cyber-btn"
                                style={{ padding: '0 15px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                                onClick={handleTestConnection}
                                disabled={testStatus === 'testing'}
                            >
                                {testStatus === 'testing' ? '...' : 'TEST'}
                            </button>
                        </div>
                        {testMessage && (
                            <div style={{
                                marginTop: '5px',
                                fontSize: '0.8rem',
                                color: testStatus === 'success' ? 'var(--emerald-glow)' : 'var(--alert-color)'
                            }}>
                                {testMessage}
                            </div>
                        )}
                        <small className="hint">Production Webhook URL for logic processing</small>
                    </div>

                    <div className="input-group" style={{ marginTop: '20px' }}>
                        <label className="text-emerald">HOME ASSISTANT URL</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                value={haUrl}
                                onChange={(e) => setHaUrl(e.target.value)}
                                placeholder="http://10.0.0.X:8123 o https://..."
                                className="cyber-input"
                                style={{ flex: 1 }}
                            />
                            <button
                                className="cyber-btn"
                                style={{ padding: '0 15px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                                onClick={handleTestHa}
                                disabled={haTestStatus === 'testing'}
                            >
                                {haTestStatus === 'testing' ? '...' : 'TEST HA'}
                            </button>
                        </div>
                        {haTestMessage && (
                            <div style={{
                                marginTop: '5px',
                                fontSize: '0.8rem',
                                color: haTestStatus === 'success' ? 'var(--emerald-glow)' : 'var(--alert-color)'
                            }}>
                                {haTestMessage}
                            </div>
                        )}
                        <small className="hint">IP o dominio de Home Assistant para control de domótica.</small>
                    </div>

                    <div className="input-group" style={{ marginTop: '20px' }}>
                        <label className="text-emerald">HOME ASSISTANT TOKEN (Long-Lived)</label>
                        <input
                            type="password"
                            value={haToken}
                            onChange={(e) => setHaToken(e.target.value)}
                            placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                            className="cyber-input"
                        />
                        <small className="hint">Token de acceso de larga duración creado en el perfil de Home Assistant.</small>
                    </div>

                    <div className="input-group" style={{ marginTop: '20px' }}>
                        <label className="text-emerald">CORE VISUAL STYLE</label>
                        <select 
                            value={theme} 
                            onChange={(e) => setTheme(e.target.value)}
                            className="cyber-input"
                        >
                            <option value="VoiceCore">VoiceCore (Default)</option>
                            <option value="CyberNeon">CyberNeon (Backup)</option>
                        </select>
                        <small className="hint">Select the 3D aesthetic of the main core.</small>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="cyber-btn" onClick={handleSave}>
                        <Save size={18} style={{ marginRight: '8px' }} /> APPLY CONFIG
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
