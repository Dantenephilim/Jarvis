import React, { useState, useEffect, useRef } from 'react';

const TaskGraph = ({ label, color, history, unit, maxVal }) => {
    const width = 200;
    const height = 60;
    
    // Normalize history to 0-height
    const points = history.map((val, i) => {
        const x = (i / (history.length - 1)) * width;
        // Clamp value between 0 and maxVal
        const clampedVal = Math.max(0, Math.min(maxVal, val));
        const y = height - (clampedVal / maxVal) * height;
        return `${x},${y}`;
    });
    
    const polygonPoints = `0,${height} ${points.join(' ')} ${width},${height}`;
    const currentValue = Math.round(history[history.length - 1]);
    
    return (
        <div style={{ position: 'relative', width: `${width}px`, height: `${height}px`, border: `1px solid ${color}`, backgroundColor: 'rgba(0, 15, 30, 0.8)', overflow: 'hidden' }}>
            {/* Graph Paper Grid */}
            <div style={{ 
                position: 'absolute', width: '100%', height: '100%', 
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '10px 10px'
             }}></div>
             
             {/* Area Chart */}
             <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
                <polygon points={polygonPoints} fill={color} opacity="0.5" />
                <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="1.5" />
             </svg>
             
             {/* Label */}
             <div style={{ position: 'absolute', top: '3px', left: '5px', fontSize: '11px', color: '#fff', fontWeight: 'bold', textShadow: `0 0 5px ${color}`, letterSpacing: '1px' }}>
                {label} {currentValue}{unit}
             </div>
        </div>
    );
};

const SysStatsWidget = () => {
    const [stats, setStats] = useState({ cpu: 'Loading...', cores: 8, ramPercent: 0, totalRam: 0 });
    
    const [cpuHistory, setCpuHistory] = useState(Array(50).fill(0));
    const [ramHistory, setRamHistory] = useState(Array(50).fill(0));
    const [netHistory, setNetHistory] = useState(Array(50).fill(0));
    
    const targetRamRef = useRef(0);

    // Fetch static system info
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/system-stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                    targetRamRef.current = data.ramPercent;
                }
            } catch (error) {
                console.error("Stats API offline");
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    // Graph Ticker
    useEffect(() => {
        let currentCpu = Math.random() * 20 + 10;
        let currentNet = Math.random() * 5;
        
        const tick = setInterval(() => {
            // CPU Jitter (0-100%)
            currentCpu += (Math.random() - 0.5) * 30;
            if (currentCpu > 95) currentCpu = 90;
            if (currentCpu < 5) currentCpu = 10;
            
            // Network Jitter (0-100 Mbps)
            currentNet += (Math.random() - 0.5) * 40;
            if (currentNet > 100) currentNet = 80;
            if (currentNet < 0) currentNet = 2;
            
            setCpuHistory(prev => [...prev.slice(1), currentCpu]);
            setNetHistory(prev => [...prev.slice(1), currentNet]);
            
            // Smooth RAM interpolation based on real API data
            setRamHistory(prev => {
                const target = targetRamRef.current || 0;
                const last = prev[prev.length - 1];
                const next = last + (target - last) * 0.2;
                return [...prev.slice(1), next];
            });
        }, 500);
        
        return () => clearInterval(tick);
    }, []);

    return (
        <div style={{
            position: 'absolute',
            left: '30px',
            bottom: '30px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            fontFamily: 'var(--font-main)'
        }}>
            {/* Header info */}
            <div style={{ fontSize: '0.65rem', color: '#999', letterSpacing: '1px' }}>
                <div style={{ color: 'var(--primary-glow)', marginBottom: '5px' }}>{stats.cpu.substring(0, 25)}</div>
                <div>CORES: <span style={{color: '#fff'}}>{stats.cores}</span> | RAM: <span style={{color: '#fff'}}>{stats.totalRam} GB</span></div>
            </div>

            {/* Graphs - Unified Color Scheme */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <TaskGraph label="CPU" color="#00f3ff" history={cpuHistory} unit="%" maxVal={100} />
                <TaskGraph label="MEM" color="#00f3ff" history={ramHistory} unit="%" maxVal={100} />
                <TaskGraph label="NET" color="#00f3ff" history={netHistory} unit=" Mb/s" maxVal={100} />
            </div>
        </div>
    );
};

export default SysStatsWidget;
