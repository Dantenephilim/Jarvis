import React, { useState, useEffect } from 'react';

const SysStatsWidget = () => {
    const [stats, setStats] = useState({ cpu: 'Loading...', cores: 8, ramPercent: 0, totalRam: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/system-stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Stats API offline");
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    // Rotate dial based on RAM usage (0% = -135deg, 100% = 135deg)
    const dialRotation = (stats.ramPercent / 100) * 270 - 135;

    return (
        <div style={{
            position: 'absolute',
            left: '30px',
            bottom: '50px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            fontFamily: 'var(--font-main)'
        }}>
            
            <div style={{ fontSize: '0.65rem', color: '#999', letterSpacing: '1px' }}>
                <div style={{ color: 'var(--primary-glow)', marginBottom: '5px' }}>{stats.cpu.substring(0, 25)}</div>
                <div>CORES: <span style={{color: '#fff'}}>{stats.cores}</span> | RAM: <span style={{color: '#fff'}}>{stats.totalRam} GB</span></div>
                <div>USAGE: <span style={{color: 'var(--alert-color)'}}>{stats.ramPercent}%</span></div>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                    <div style={{
                        position: 'absolute', width: '100%', height: '100%',
                        border: '1px solid rgba(0, 119, 255, 0.4)', borderRadius: '50%',
                        borderTopColor: 'var(--primary-glow)',
                        transform: 'rotate(-45deg)'
                    }}></div>
                    <div style={{
                        position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '10px',
                        border: '2px dashed rgba(255, 255, 255, 0.1)', borderRadius: '50%'
                    }}></div>
                    
                    <div style={{
                        position: 'absolute', width: '2px', height: '50px',
                        background: '#fff', left: '50%', top: '10px',
                        transformOrigin: 'bottom center', transform: `translateX(-50%) rotate(${dialRotation}deg)`,
                        boxShadow: '0 0 10px #fff',
                        transition: 'transform 1s ease-out'
                    }}></div>
                    
                    <div style={{
                        position: 'absolute', bottom: '-20px', width: '100%', textAlign: 'center',
                        fontSize: '0.6rem', color: '#888', letterSpacing: '2px'
                    }}>MEM CORE</div>
                </div>

                <div style={{ position: 'relative', width: '80px', height: '80px', marginTop: '40px' }}>
                    <div style={{
                        position: 'absolute', width: '100%', height: '100%',
                        border: '1px solid rgba(0, 119, 255, 0.2)', borderRadius: '50%',
                        borderBottomColor: 'var(--alert-color)',
                        transform: 'rotate(20deg)'
                    }}></div>
                    <div style={{
                        position: 'absolute', width: '2px', height: '30px',
                        background: 'var(--alert-color)', left: '50%', top: '10px',
                        transformOrigin: 'bottom center', transform: 'translateX(-50%) rotate(-30deg)',
                        boxShadow: '0 0 5px var(--alert-color)'
                    }}></div>
                </div>
            </div>
        </div>
    );
};

export default SysStatsWidget;
