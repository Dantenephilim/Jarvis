import React, { useEffect, useRef } from 'react';
import { Music, X } from 'lucide-react';
import audioFile from '../../Music/ACDC - Shoot to Thrill.mp3';

const MusicWidget = ({ isActive, onClose }) => {
    const audioRef = useRef(null);
    const wasActiveRef = useRef(false);

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new window.Audio(audioFile);
            audioRef.current.loop = false;
            audioRef.current.onended = () => {
                onClose();
            };
        }

        const audio = audioRef.current;

        try {
            if (isActive && !wasActiveRef.current) {
                // Widget just became active: start song from 7s
                audio.currentTime = 7;
                audio.volume = 0.25; // Soft volume for background
                audio.play().catch(e => console.error("Audio play blocked", e));
                wasActiveRef.current = true;
            } else if (!isActive && wasActiveRef.current) {
                // Widget was turned off
                audio.pause();
                wasActiveRef.current = false;
            }
            // If isActive and wasActiveRef.current are both true, do nothing (keep playing)
        } catch (e) {
            console.error("Error controlling audio player", e);
        }
    }, [isActive]); // Removed onClose from dependency array to prevent re-renders

    return (
        <div className="music-container" style={{ 
            opacity: isActive ? 1 : 0, 
            pointerEvents: isActive ? 'auto' : 'none',
            transition: 'opacity 0.3s ease-out'
        }}>
            <div className="music-header">
                <Music size={12} className="text-cyan" />
                <span className="label">AC/DC - SHOOT TO THRILL</span>
                <button className="close-btn" onClick={onClose}><X size={14} /></button>
            </div>

            {isActive && (
                <div className="music-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-glow)', padding: '0 10px 10px 10px' }}>
                    <div className="waveform-animation" style={{ display: 'flex', gap: '2px', height: '15px' }}>
                        <div className="bar" style={{ width: '3px', background: 'var(--primary-glow)', animation: 'pulse 1s infinite' }}></div>
                        <div className="bar" style={{ width: '3px', background: 'var(--primary-glow)', animation: 'pulse 0.8s infinite 0.2s' }}></div>
                        <div className="bar" style={{ width: '3px', background: 'var(--primary-glow)', animation: 'pulse 1.2s infinite 0.4s' }}></div>
                    </div>
                    <span style={{ fontSize: '0.65rem', letterSpacing: '2px' }}>BACKGROUND AUDIO ONLINE</span>
                </div>
            )}

            <style jsx="true">{`
                .music-container {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    width: 280px;
                    background: rgba(0, 5, 10, 0.6);
                    border: 1px solid rgba(0, 243, 255, 0.2);
                    backdrop-filter: blur(4px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
                    font-family: var(--font-main);
                    border-radius: 4px;
                }
                .music-header {
                    padding: 8px 10px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .label {
                    color: var(--primary-glow);
                    font-size: 0.55rem;
                    letter-spacing: 2px;
                    font-weight: bold;
                    flex: 1;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    overflow: hidden;
                }
                .close-btn {
                    background: none;
                    border: none;
                    color: var(--primary-glow);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0px;
                }
                .close-btn:hover {
                    color: var(--alert-color);
                }
                @keyframes pulse {
                    0%, 100% { height: 3px; }
                    50% { height: 15px; }
                }
            `}</style>
        </div>
    );
};

export default MusicWidget;
