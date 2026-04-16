import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

const ConsoleLog = ({ logs }) => {
    const endOfLogRef = useRef(null);

    useEffect(() => {
        endOfLogRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="console-container">
            <div className="console-header">
                <Terminal size={12} className="text-cyan" />
                <span className="label">SYS.TRK.LOG</span>
                <div className="pulse-dot" />
            </div>
            
            <div className="log-entries">
                {logs.length === 0 && (
                    <div className="empty-state">Initializing tracking data...</div>
                )}
                {logs.map((log, index) => {
                    const isSystem = log.startsWith('SYSTEM:') || log.startsWith('CONNECTION');
                    const isJarvis = log.startsWith('JARVIS:');
                    const isError = log.startsWith('ERROR:');

                    let className = "log-entry";
                    if (isSystem) className += " system";
                    if (isJarvis) className += " jarvis";
                    if (isError) className += " error";

                    return (
                        <div key={index} className={className}>
                            <span className="timestamp">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                            {log}
                        </div>
                    );
                })}
                <div ref={endOfLogRef} />
            </div>

            <style jsx="true">{`
                .console-container {
                    width: 320px;
                    height: 35vh;
                    display: flex;
                    flex-direction: column;
                    background: rgba(0, 5, 10, 0.4);
                    border: 1px solid rgba(0, 243, 255, 0.1);
                    border-left-width: 4px;
                    border-left-color: rgba(0, 243, 255, 0.3);
                    backdrop-filter: blur(8px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    font-family: var(--font-main);
                }
                .console-header {
                    padding: 8px 15px;
                    background: rgba(0, 243, 255, 0.05);
                    border-bottom: 1px solid rgba(0, 243, 255, 0.1);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .label {
                    color: var(--primary-glow);
                    font-size: 0.6rem;
                    letter-spacing: 3px;
                    font-weight: bold;
                }
                .pulse-dot {
                    width: 6px; height: 6px;
                    background: var(--primary-glow);
                    border-radius: 50%;
                    margin-left: auto;
                    animation: pulse 2s infinite;
                }
                .log-entries {
                    flex: 1;
                    padding: 12px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    font-size: 0.75rem;
                }
                .log-entry {
                    color: #fff;
                    word-wrap: break-word;
                    line-height: 1.4;
                    animation: dataReveal 0.3s ease-out;
                    opacity: 0.9;
                }
                .timestamp {
                    color: rgba(0, 243, 255, 0.3);
                    margin-right: 8px;
                    font-size: 0.65rem;
                }
                .system { color: #888; }
                .jarvis { 
                    color: var(--primary-glow); 
                    border-left: 2px solid var(--primary-glow);
                    padding-left: 8px;
                    text-shadow: 0 0 5px rgba(0, 243, 255, 0.3);
                }
                .error { color: var(--alert-color); }
                .empty-state { color: #444; font-style: italic; }

                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(0, 243, 255, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(0, 243, 255, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(0, 243, 255, 0); }
                }

                @keyframes dataReveal {
                    from { opacity: 0; transform: translateX(5px); }
                    to { opacity: 0.9; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
};

export default ConsoleLog;

