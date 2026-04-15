import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

const ConsoleLog = ({ logs }) => {
    const endOfLogRef = useRef(null);

    useEffect(() => {
        endOfLogRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div style={{ 
            width: '300px', 
            height: '40vh', 
            display: 'flex', 
            flexDirection: 'column',
            background: 'transparent',
            borderLeft: '1px solid rgba(0, 243, 255, 0.2)',
            fontFamily: 'var(--font-main)'
        }}>
            <div style={{ 
                padding: '5px 15px', 
                borderBottom: '1px solid rgba(0, 243, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <Terminal size={14} className="text-emerald" />
                <span className="text-cyan" style={{ fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Sys.Trk.Log</span>
            </div>
            
            <div style={{ 
                flex: 1, 
                padding: '15px', 
                overflowY: 'auto', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px',
                fontSize: '0.85rem'
            }}>
                {logs.length === 0 && (
                    <div style={{ color: '#555', fontStyle: 'italic' }}>System initialized. Awaiting input...</div>
                )}
                {logs.map((log, index) => {
                    const isSystem = log.startsWith('SYSTEM:') || log.startsWith('CONNECTION');
                    const isUser = log.startsWith('USER:');
                    const isJarvis = log.startsWith('JARVIS:');
                    const isError = log.startsWith('ERROR:');

                    let color = 'var(--text-color)';
                    if (isSystem) color = '#888';
                    if (isUser) color = 'white';
                    if (isJarvis) color = 'var(--primary-glow)';
                    if (isError) color = 'var(--alert-color)';

                    return (
                        <div key={index} style={{ color, wordWrap: 'break-word', borderLeft: isJarvis ? '2px solid var(--primary-glow)' : 'none', paddingLeft: isJarvis ? '8px' : '0' }}>
                            {log}
                        </div>
                    );
                })}
                <div ref={endOfLogRef} />
            </div>
        </div>
    );
};

export default ConsoleLog;
