import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Home, Lightbulb, Power, Lock, Unlock, Thermometer, 
    ChevronDown, ChevronUp, Sparkles, Shield, RefreshCw,
    Sliders, Tv, Eye, Fan, Activity, Disc, Zap, Flame,
    AlertCircle, Radio, Play, CheckCircle, Settings, WifiOff
} from 'lucide-react';
import { getHaConfig, fetchHaStates, toggleHaEntity, callHaService } from '../services/homeAssistant';
import './SmartHomeWidget.css';

const DEFAULT_DEMO_ENTITIES = [
    { entity_id: 'light.living_room', name: 'LUCES SALÓN', domain: 'light', state: 'on', icon: Lightbulb, val: 'ON' },
    { entity_id: 'light.desk_ambient', name: 'NEÓN DESK', domain: 'light', state: 'on', icon: Lightbulb, val: '100%' },
    { entity_id: 'switch.master_power', name: 'ENCHUFE PC', domain: 'switch', state: 'on', icon: Zap, val: 'ON' },
    { entity_id: 'climate.ac_unit', name: 'CLIMATIZADOR', domain: 'climate', state: 'cool', icon: Thermometer, val: '21°C' },
    { entity_id: 'lock.front_door', name: 'PUERTA ACCESO', domain: 'lock', state: 'locked', icon: Lock, val: 'LOCKED' },
    { entity_id: 'fan.living_fan', name: 'VENTILADOR', domain: 'fan', state: 'off', icon: Fan, val: 'OFF' },
    { entity_id: 'sensor.temp_salon', name: 'TEMP SALÓN', domain: 'sensor', state: '22.4', icon: Activity, val: '22.4 °C' },
    { entity_id: 'scene.movie_night', name: 'MODO CINE', domain: 'scene', state: 'ready', icon: Sparkles, val: 'SCENE' },
    { entity_id: 'scene.secure_home', name: 'PROTOCOLO SEGURO', domain: 'scene', state: 'ready', icon: Shield, val: 'ARMED' }
];

const SmartHomeWidget = ({ onActionSound, onOpenSettings }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [entities, setEntities] = useState(DEFAULT_DEMO_ENTITIES);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [connectionDetail, setConnectionDetail] = useState('');

    const loadStates = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const rawStates = await fetchHaStates();
            if (rawStates && Array.isArray(rawStates) && rawStates.length > 0) {
                setIsConnected(true);
                setConnectionDetail(`${rawStates.length} DISPOSITIVOS`);
                
                // Parse and format ALL Home Assistant entities
                const parsed = rawStates
                    .filter(e => {
                        if (!e.entity_id || !e.entity_id.includes('.')) return false;
                        const d = e.entity_id.split('.')[0];
                        // Filter out noisy internal entities
                        if (['persistent_notification', 'zone', 'update', 'tts'].includes(d)) return false;
                        return true;
                    })
                    .map(e => {
                        const d = e.entity_id.split('.')[0];
                        let Icon = Power;
                        if (d === 'light') Icon = Lightbulb;
                        else if (d === 'climate') Icon = Thermometer;
                        else if (d === 'lock') Icon = e.state === 'locked' ? Lock : Unlock;
                        else if (d === 'fan') Icon = Fan;
                        else if (d === 'scene' || d === 'script') Icon = Sparkles;
                        else if (d === 'automation') Icon = Play;
                        else if (d === 'media_player') Icon = Tv;
                        else if (d === 'binary_sensor') Icon = Eye;
                        else if (d === 'sensor') Icon = Activity;
                        else if (d === 'vacuum') Icon = Disc;
                        else if (d === 'alarm_control_panel') Icon = Shield;
                        else if (d === 'switch') Icon = Zap;
                        else if (d === 'input_boolean') Icon = Sliders;

                        const friendlyName = e.attributes?.friendly_name || e.entity_id.replace(`${d}.`, '').replace(/_/g, ' ');

                        let displayVal = e.state;
                        const unit = e.attributes?.unit_of_measurement;
                        if (unit) {
                            displayVal = `${e.state} ${unit}`;
                        } else if (e.attributes?.temperature) {
                            displayVal = `${e.attributes.temperature}°C`;
                        } else if (e.attributes?.brightness) {
                            displayVal = `${Math.round((e.attributes.brightness / 255) * 100)}%`;
                        }

                        return {
                            entity_id: e.entity_id,
                            name: friendlyName.toUpperCase(),
                            domain: d,
                            state: e.state,
                            val: displayVal,
                            icon: Icon,
                            attributes: e.attributes
                        };
                    });

                if (parsed.length > 0) {
                    setEntities(parsed);
                }
            } else {
                setIsConnected(false);
                setConnectionDetail('SIN CONEXIÓN HA');
            }
        } catch (err) {
            console.warn('[SmartHome] Error loading states:', err);
            setIsConnected(false);
            setConnectionDetail('ERROR HA');
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // Initial mount: load server config first, then fetch states
    useEffect(() => {
        let isMounted = true;

        const initConfigAndLoad = async () => {
            try {
                const res = await fetch('/api/config');
                if (res.ok) {
                    const data = await res.json();
                    if (data.haUrl) {
                        localStorage.setItem('ha_url', data.haUrl);
                    }
                    if (data.haToken) {
                        localStorage.setItem('ha_token', data.haToken);
                    }
                }
            } catch (e) {
                // Ignore config fetch error
            }
            if (isMounted) {
                loadStates();
            }
        };

        initConfigAndLoad();
        const interval = setInterval(loadStates, 5000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [loadStates]);

    const handleToggle = async (entity) => {
        if (onActionSound) onActionSound();

        // Read-only sensor check
        if (entity.domain === 'sensor' || entity.domain === 'binary_sensor') {
            return;
        }

        // Optimistic UI update
        setEntities(prev => prev.map(item => {
            if (item.entity_id === entity.entity_id) {
                let nextState = item.state === 'on' ? 'off' : 'on';
                if (item.domain === 'lock') nextState = item.state === 'locked' ? 'unlocked' : 'locked';
                if (item.domain === 'scene' || item.domain === 'script' || item.domain === 'automation') nextState = 'active';
                return { ...item, state: nextState, val: nextState.toUpperCase() };
            }
            return item;
        }));

        await toggleHaEntity(entity.entity_id);
        setTimeout(loadStates, 450);
    };

    const handleQuickScene = async (sceneType) => {
        if (onActionSound) onActionSound();

        if (sceneType === 'cinema') {
            setEntities(prev => prev.map(e => e.domain === 'light' ? { ...e, state: 'off', val: 'OFF' } : e));
            await callHaService('light', 'turn_off', {});
        } else if (sceneType === 'all_on') {
            setEntities(prev => prev.map(e => e.domain === 'light' ? { ...e, state: 'on', val: 'ON' } : e));
            await callHaService('light', 'turn_on', {});
        } else if (sceneType === 'secure') {
            setEntities(prev => prev.map(e => {
                if (e.domain === 'lock') return { ...e, state: 'locked', val: 'LOCKED' };
                if (e.domain === 'light') return { ...e, state: 'off', val: 'OFF' };
                return e;
            }));
            await callHaService('lock', 'lock', {});
        }
        setTimeout(loadStates, 600);
    };

    const filteredEntities = useMemo(() => {
        let list = entities;
        if (activeTab === 'LIGHTS') list = entities.filter(e => e.domain === 'light');
        else if (activeTab === 'POWER') list = entities.filter(e => ['switch', 'fan', 'media_player', 'vacuum', 'input_boolean'].includes(e.domain));
        else if (activeTab === 'CLIMATE') list = entities.filter(e => ['climate', 'humidifier', 'water_heater', 'fan'].includes(e.domain));
        else if (activeTab === 'SECURITY') list = entities.filter(e => ['lock', 'alarm_control_panel', 'cover', 'binary_sensor', 'camera'].includes(e.domain));
        else if (activeTab === 'SENSORS') list = entities.filter(e => e.domain === 'sensor');
        else if (activeTab === 'SCENES') list = entities.filter(e => ['scene', 'script', 'automation'].includes(e.domain));

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(e => e.name.toLowerCase().includes(q) || e.entity_id.toLowerCase().includes(q));
        }

        return list;
    }, [entities, activeTab, searchQuery]);

    const counts = useMemo(() => {
        return {
            all: entities.length,
            lights: entities.filter(e => e.domain === 'light').length,
            power: entities.filter(e => ['switch', 'fan', 'media_player', 'vacuum', 'input_boolean'].includes(e.domain)).length,
            climate: entities.filter(e => ['climate', 'humidifier', 'water_heater', 'fan'].includes(e.domain)).length,
            security: entities.filter(e => ['lock', 'alarm_control_panel', 'cover', 'binary_sensor', 'camera'].includes(e.domain)).length,
            sensors: entities.filter(e => e.domain === 'sensor').length,
            scenes: entities.filter(e => ['scene', 'script', 'automation'].includes(e.domain)).length
        };
    }, [entities]);

    return (
        <div className={`smart-home-hud ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Top Bar Header */}
            <div className="hud-top-bar" onClick={() => setIsCollapsed(!isCollapsed)}>
                <div className="hud-title-wrap">
                    <Home size={14} color="#00f3ff" />
                    <span className="hud-title">HOME AUTOMATION MATRIX</span>
                    <span 
                        className={`hud-status-badge ${isConnected ? 'online' : 'demo'}`}
                        title={isConnected ? 'Conectado a Home Assistant' : 'Haz clic para abrir Ajustes (⚙️)'}
                        onClick={(e) => {
                            if (!isConnected && onOpenSettings) {
                                e.stopPropagation();
                                onOpenSettings();
                            }
                        }}
                        style={{ cursor: !isConnected ? 'pointer' : 'default' }}
                    >
                        {isConnected ? `HA ONLINE (${counts.all})` : 'DEMO MATRIX (CONFIGURA HA)'}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                        className="hud-toggle-btn"
                        onClick={(e) => { e.stopPropagation(); loadStates(); }}
                        title="Actualizar estados"
                    >
                        <RefreshCw size={12} className={isRefreshing ? 'spin-anim' : ''} />
                    </button>
                    <button className="hud-toggle-btn" title={isCollapsed ? 'Expandir HUD' : 'Plegar HUD'}>
                        {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                </div>
            </div>

            {/* Expanded Content */}
            {!isCollapsed && (
                <>
                    {/* Filter Tabs */}
                    <div className="ha-filter-tabs">
                        {[
                            { key: 'ALL', label: `ALL (${counts.all})` },
                            { key: 'LIGHTS', label: `LIGHTS (${counts.lights})` },
                            { key: 'POWER', label: `POWER (${counts.power})` },
                            { key: 'CLIMATE', label: `CLIMATE (${counts.climate})` },
                            { key: 'SECURITY', label: `SECURITY (${counts.security})` },
                            { key: 'SENSORS', label: `SENSORS (${counts.sensors})` },
                            { key: 'SCENES', label: `SCENES (${counts.scenes})` }
                        ].map(tab => (
                            <button 
                                key={tab.key} 
                                className={`ha-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Grid of Device Tiles */}
                    <div className="hud-content-grid">
                        {filteredEntities.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#666', fontSize: '0.8rem', letterSpacing: '1px' }}>
                                NO SE ENCONTRARON DISPOSITIVOS EN ESTA CATEGORÍA
                            </div>
                        ) : (
                            filteredEntities.map(item => {
                                const IconComponent = item.icon || Power;
                                const isActive = item.state === 'on' || item.state === 'active' || item.state === 'cool' || 
                                                 item.state === 'heat' || item.state === 'open' || item.state === 'playing' ||
                                                 item.state === 'home';
                                const isLocked = item.domain === 'lock' && item.state === 'locked';
                                const isSensor = item.domain === 'sensor' || item.domain === 'binary_sensor';

                                return (
                                    <div 
                                        key={item.entity_id}
                                        className={`ha-tile ${isActive ? 'active' : ''} ${item.domain === 'lock' ? (isLocked ? 'locked active' : 'unlocked') : ''} ${isSensor ? 'is-sensor' : ''}`}
                                        onClick={() => handleToggle(item)}
                                        title={item.entity_id}
                                    >
                                        <div className="tile-top">
                                            <IconComponent size={13} className="tile-icon" />
                                            <div className={`tile-state-dot ${isActive ? 'dot-active' : ''}`} />
                                        </div>
                                        <div className="tile-bottom">
                                            <div className="tile-name" title={item.name}>{item.name}</div>
                                            <div className="tile-val">{item.val || item.state}</div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
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
