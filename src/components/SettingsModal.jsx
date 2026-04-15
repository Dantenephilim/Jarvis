import React, { useState, useEffect } from 'react';
import { X, Save, Key, Globe, Mic } from 'lucide-react';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose, onSave }) => {
    const [agentId, setAgentId] = useState('');
    const [n8nUrl, setN8nUrl] = useState('');
    const [voiceId, setVoiceId] = useState('');
    const [testStatus, setTestStatus] = useState(''); // 'testing', 'success', 'error'
    const [testMessage, setTestMessage] = useState('');

    const DEFAULT_N8N_URL = 'https://n8n.nexotechx.com/webhook/1faaf855-bd93-4b57-a298-8bdd00e419da';
    const DEFAULT_VOICE_ID = 'DMyrgzQFny3JI1Y1paM5'; // Default Jarvis

    useEffect(() => {
        const storedId = localStorage.getItem('eleven_agent_id');
        let storedUrl = localStorage.getItem('n8n_webhook_url');
        const storedVoice = localStorage.getItem('eleven_voice_id');
        
        if (storedId) setAgentId(storedId);
        
        if (storedUrl) {
            // Hotfix: clean up port 5678 if present from previous stores
            if (storedUrl.includes(':5678')) {
                storedUrl = storedUrl.replace(':5678', '');
                localStorage.setItem('n8n_webhook_url', storedUrl);
            }
            setN8nUrl(storedUrl);
        } else {
            setN8nUrl(DEFAULT_N8N_URL);
        }
        
        if (storedVoice) {
            setVoiceId(storedVoice);
        } else {
            setVoiceId(DEFAULT_VOICE_ID);
        }
        
        setTestStatus('');
        setTestMessage('');
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem('eleven_agent_id', agentId);
        localStorage.setItem('n8n_webhook_url', n8nUrl);
        localStorage.setItem('eleven_voice_id', voiceId);
        onSave({ agentId, n8nUrl, voiceId });
        onClose();
    };

    const handleTestConnection = () => {
        if (!n8nUrl) {
            setTestStatus('error');
            setTestMessage('Please enter a URL first');
            return;
        }
        setTestStatus('testing');
        setTestMessage('Pinging n8n...');

        let testUrl = n8nUrl;
        if (testUrl.includes('nexotechx.com')) {
            try {
                const urlObj = new URL(testUrl);
                testUrl = `/api${urlObj.pathname}`;
            } catch (e) {
                // Invalid URL
            }
        }

        fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'TEST_CONNECTION_FROM_JARVIS' })
        })
            .then(res => {
                if (res.ok) {
                    setTestStatus('success');
                    setTestMessage('Connection Successful!');
                } else {
                    setTestStatus('error');
                    setTestMessage(`Failed: ${res.status} ${res.statusText}`);
                }
            })
            .catch(err => {
                setTestStatus('error');
                setTestMessage(`Error: ${err.message}`);
            });
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
