import React, { useState, useEffect, useCallback } from 'react';
import { 
    Home, Lightbulb, Power, Lock, Unlock, Thermometer, 
    ChevronDown, ChevronUp, Sparkles, Shield, RefreshCw 
} from 'lucide-react';
import { getHaConfig, fetchHaStates, toggleHaEntity, callHaService } from '../services/homeAssistant';
import './SmartHomeWidget.css';

const DEFAULT_DEMO_ENTITIES = [
    { entity_id: 'light.living_room', name: 'LUCES SALÓN', domain: 'light', state: 'on', icon: Lightbulb },
    { entity_id: 'light.desk_ambient', name: 'NEÓN DESK', domain: 'light', state: 'on', icon: Lightbulb },
    { entity_id: 'switch.master_power', name: 'ENCHUFE PC', domain: 'switch', state: 'on', icon: Power },
    { entity_id: 'climate.ac_unit', name: 'AC 21°C', domain: 'climate', state: 'cool', icon: Thermometer, val: '21°C' },
    { entity_id: 'lock.front_door', name: 'PUERTA ACCESO', domain: 'lock', state: 'locked', icon: Lock },
    { entity_id: 'switch.fans', name: 'VENTILADOR', domain: 'switch', state: 'off', icon: Power },
    { entity_id: 'scene.movie_night', name: 'MODO CINE', domain: 'scene', state: 'ready', icon: Sparkles },
    { entity_id: 'scene.secure_home', name: 'PROTOCOLO SEGURO', domain: 'scene', state: 'ready', icon: Shield }
];

const SmartHomeWidget = ({ onActionSound }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [entities, setEntities] = useState(DEFAULT_DEMO_ENTITIES);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadStates = useCallback(async () => {
        const { url, token } = getHaConfig();
        if (!url || !token) {
            setIsConnected(false);
            return;
        }

        setIsRefreshing(true);
        try {
            const rawStates = await fetchHaStates();
            if (rawStates && Array.isArray(rawStates)) {
                setIsConnected(true);
                // Filter relevant domains: light, switch, climate, lock, scene
                const relevant = rawStates.filter(e => {
                    const d = e.entity_id.split('.')[0];
                    return ['light', 'switch', 'climate', 'lock', 'scene'].includes(d);
                }).slice(0, 8).map(e => {
                    const d = e.entity_id.split('.')[0];
                    let Icon = Power;
                    if (d === 'light') Icon = Lightbulb;
                    if (d === 'climate') Icon = Thermometer;
                    if (d === 'lock') Icon = e.state === 'locked' ? Lock : Unlock;
                    if (d === 'scene') Icon = Sparkles;

                    return {
                        entity_id: e.entity_id,
                        name: (e.attributes.friendly_name || e.entity_id.split('.')[1]).toUpperCase(),
                        domain: d,
                        state: e.state,
                        val: e.attributes.temperature ? `${e.attributes.temperature}°C` : e.state,
                        icon: Icon
                    };
                });

                if (relevant.length > 0) {
                    setEntities(relevant);
                }
            } else {
                setIsConnected(false);
            }
        } catch (err) {
            setIsConnected(false);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadStates();
        const interval = setInterval(loadStates, 10000);
        return () => clearInterval(interval);
    }, [loadStates]);

    const handleToggle = async (entity) => {
        if (onActionSound) onActionSound();

        // Optimistic UI update
        setEntities(prev => prev.map(item => {
            if (item.entity_id === entity.entity_id) {
                let nextState = item.state === 'on' ? 'off' : 'on';
                if (item.domain === 'lock') nextState = item.state === 'locked' ? 'unlocked' : 'locked';
                if (item.domain === 'scene') nextState = 'active';
                return { ...item, state: nextState };
            }
            return item;
        }));

        if (isConnected) {
            await toggleHaEntity(entity.entity_id);
            // Quick refresh after 500ms to get authoritative state
            setTimeout(loadStates, 500);
        }
    };

    const handleQuickScene = async (sceneType) => {
        if (onActionSound) onActionSound();

        if (sceneType === 'cinema') {
            setEntities(prev => prev.map(e => {
                if (e.domain === 'light') return { ...e, state: 'off' };
                if (e.domain === 'switch' && e.entity_id.includes('desk')) return { ...e, state: 'on' };
                return e;
            }));
            if (isConnected) {
                await callHaService('light', 'turn_off', {});
            }
        } else if (sceneType === 'all_on') {
            setEntities(prev => prev.map(e => e.domain === 'light' ? { ...e, state: 'on' } : e));
            if (isConnected) {
                await callHaService('light', 'turn_on', {});
            }
        } else if (sceneType === 'secure') {
            setEntities(prev => prev.map(e => {
                if (e.domain === 'lock') return { ...e, state: 'locked' };
                if (e.domain === 'light') return { ...e, state: 'off' };
                return e;
            }));
            if (isConnected) {
                await callHaService('lock', 'lock', {});
            }
        }
    };

    return (
        <div className={`smart-home-hud ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Top Bar Header */}
            <div className="hud-top-bar" onClick={() => setIsCollapsed(!isCollapsed)}>
                <div className="hud-title-wrap">
                    <Home size={14} color="#00f3ff" />
                    <span className="hud-title">HOME AUTOMATION // HA-OS</span>
                    <span className={`hud-status-badge ${isConnected ? 'online' : 'demo'}`}>
                        {isConnected ? 'HA CONNECTED' : 'DEMO MATRIX'}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                        className="hud-toggle-btn"
                        onClick={(e) => { e.stopPropagation(); loadStates(); }}
                        title="Refresh States"
                    >
                        <RefreshCw size={12} className={isRefreshing ? 'spin-anim' : ''} />
                    </button>
                    <button className="hud-toggle-btn" title={isCollapsed ? 'Expand HUD' : 'Collapse HUD'}>
                        {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                </div>
            </div>

            {/* Grid of Device Tiles */}
            {!isCollapsed && (
                <>
                    <div className="hud-content-grid">
                        {entities.map(item => {
                            const IconComponent = item.icon || Power;
                            const isActive = item.state === 'on' || item.state === 'active' || item.state === 'cool';
                            const isLocked = item.domain === 'lock' && item.state === 'locked';

                            return (
                                <div 
                                    key={item.entity_id}
                                    className={`ha-tile ${isActive ? 'active' : ''} ${item.domain === 'lock' ? (isLocked ? 'locked active' : 'unlocked') : ''}`}
                                    onClick={() => handleToggle(item)}
                                >
                                    <div className="tile-top">
                                        <IconComponent size={14} className="tile-icon" />
                                        <div className="tile-state-dot" />
                                    </div>
                                    <div className="tile-bottom">
                                        <div className="tile-name" title={item.name}>{item.name}</div>
                                        <div className="tile-val">{item.val || item.state}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Quick Protocols & Scenes */}
                    <div className="hud-actions-row">
                        <span>PROTOCOLS:</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="quick-scene-btn" onClick={() => handleQuickScene('cinema')}>
                                🎬 MODO CINE
                            </button>
                            <button className="quick-scene-btn" onClick={() => handleQuickScene('all_on')}>
                                💡 FULL POWER
                            </button>
                            <button className="quick-scene-btn" onClick={() => handleQuickScene('secure')}>
                                🛡️ PROTOCOLO SEGURO
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SmartHomeWidget;
