import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, CloudRain, Video, Activity } from 'lucide-react';

const SystemWidgets = () => {
    const [uptime, setUptime] = useState(0);
    const [cpuLoad, setCpuLoad] = useState(38);
    const [ramLoad, setRamLoad] = useState(51);

    useEffect(() => {
        const timer = setInterval(() => {
            setUptime(prev => prev + 1);
            // Simulate slight fluctuations in CPU/RAM
            setCpuLoad(prev => Math.min(100, Math.max(10, prev + (Math.random() > 0.5 ? 2 : -2))));
            setRamLoad(prev => Math.min(100, Math.max(10, prev + (Math.random() > 0.5 ? 1 : -1))));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatUptime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '320px', padding: '20px' }}>
            {/* System Stats Block */}
            <div className="glass-panel" style={{ padding: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <Cpu size={18} className="text-emerald" />
                    <span className="title-neon text-emerald" style={{ fontSize: '0.9rem', letterSpacing: '2px' }}>System Stats</span>
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                        <span>CPU Usage</span>
                        <span className="text-cyan">{cpuLoad}%</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${cpuLoad}%`, height: '100%', background: 'var(--primary-glow)', transition: 'width 0.5s' }} />
                    </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                        <span>RAM Usage</span>
                        <span className="text-cyan">{ramLoad}% (16.5GB)</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${ramLoad}%`, height: '100%', background: 'var(--emerald-glow)', transition: 'width 0.5s' }} />
                    </div>
                </div>
            </div>

            {/* Weather Block */}
            <div className="glass-panel" style={{ padding: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <CloudRain size={18} className="text-emerald" />
                    <span className="title-neon text-emerald" style={{ fontSize: '0.9rem', letterSpacing: '2px' }}>Weather</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>21.0°C</span>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>Cloudy</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--primary-glow)', marginTop: '5px' }}>Miami, FL - Local</div>
            </div>

            {/* Camera / Sensors */}
            <div className="glass-panel" style={{ padding: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <Video size={18} className="text-emerald" />
                    <span className="title-neon text-emerald" style={{ fontSize: '0.9rem', letterSpacing: '2px' }}>4K Sensors</span>
                </div>
                <div style={{ 
                    height: '80px', 
                    border: '1px dashed rgba(0, 243, 255, 0.4)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.3)',
                    color: 'var(--primary-glow)',
                    fontSize: '0.8rem'
                }}>
                    <Video size={16} style={{marginRight: '8px'}} /> Camera On - Streaming
                </div>
            </div>

            {/* Uptime */}
            <div className="glass-panel" style={{ padding: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <Activity size={18} className="text-emerald" />
                    <span className="title-neon text-emerald" style={{ fontSize: '0.9rem', letterSpacing: '2px' }}>System Uptime</span>
                </div>
                <div className="title-neon text-cyan" style={{ fontSize: '1.5rem', textAlign: 'center' }}>
                    {formatUptime(uptime)}
                </div>
                <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#666', marginTop: '5px' }}>J.A.R.V.I.S. Core Active</div>
            </div>
        </div>
    );
};

export default SystemWidgets;
