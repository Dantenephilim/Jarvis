import React, { useEffect, useRef, useState } from 'react';
import { Music, X, Square, Play } from 'lucide-react';
import audioFile from '../../Music/ACDC - Shoot to Thrill.mp3';

const MusicWidget = ({ isActive, onToggle }) => {
    const audioRef = useRef(null);
    const canvasRef = useRef(null);
    const wasActiveRef = useRef(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Audio Context refs
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const requestRef = useRef(null);

    const setupVisualizer = () => {
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtxRef.current = new AudioContext();
            analyserRef.current = audioCtxRef.current.createAnalyser();
            analyserRef.current.fftSize = 512;
            
            sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
            sourceRef.current.connect(analyserRef.current);
            analyserRef.current.connect(audioCtxRef.current.destination);
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    const drawVisualizer = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const analyser = analyserRef.current;
        if (!analyser) return;

        requestRef.current = requestAnimationFrame(drawVisualizer);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        analyser.getByteTimeDomainData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(200, 255, 255, 0.9)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f3ff';
        ctx.beginPath();

        for(let i = 0; i < bufferLength; i++) {
            const v = (dataArray[i] - 128) / 128.0; // -1 to 1
            const amplitude = Math.abs(v) * (canvas.height / 2.5);
            const yCenter = canvas.height / 2;
            
            ctx.moveTo(x, yCenter - amplitude);
            ctx.lineTo(x, yCenter + amplitude);
            x += sliceWidth;
        }
        ctx.stroke();
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Sync external state changes (e.g. voice commands turning music on/off)

        try {
            // Handle external state changes (like clap detection)
            if (isActive && !wasActiveRef.current) {
                audio.currentTime = 7;
                audio.volume = 0.25;
                setupVisualizer();
                audio.play().then(() => {
                    setIsPlaying(true);
                    if (!requestRef.current) drawVisualizer();
                }).catch(e => console.error("Audio blocked natively", e));
                wasActiveRef.current = true;
            } else if (!isActive && wasActiveRef.current) {
                audio.pause();
                setIsPlaying(false);
                wasActiveRef.current = false;
            }
        } catch (e) {
            console.error("Error controlling audio player", e);
        }
    }, [isActive]);

    const handleTogglePlayback = () => {
        if (!audioRef.current) return;
        
        const audio = audioRef.current;
        
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
            wasActiveRef.current = false;
        } else {
            if (!audioCtxRef.current) {
                audio.currentTime = 7;
                audio.volume = 0.25;
            }
            setupVisualizer();
            audio.play().then(() => {
                if (!requestRef.current) drawVisualizer();
            }).catch(e => console.error("Direct audio play blocked", e));
            setIsPlaying(true);
            wasActiveRef.current = true;
        }
        
        if (onToggle) onToggle(); // sync global state
    };

    return (
        <div className="music-container">
            <audio 
                ref={audioRef} 
                src={audioFile} 
                crossOrigin="anonymous" 
                onEnded={() => {
                    if (onToggle) onToggle();
                    setIsPlaying(false);
                    wasActiveRef.current = false;
                }}
                preload="auto"
            />
            <div className="music-header">
                <Music size={12} className="text-cyan" />
                <span className="label">AC/DC - SHOOT TO THRILL</span>
                <button className="ctrl-btn" onClick={handleTogglePlayback} title={isPlaying ? "Stop" : "Play"}>
                    {isPlaying ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                </button>
            </div>

            <div className="music-indicator" style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '10px' }}>
                <canvas ref={canvasRef} width="180" height="40" style={{ borderBottom: '1px solid rgba(0, 243, 255, 0.3)' }} />
                <span style={{ fontSize: '0.65rem', letterSpacing: '2px', color: 'var(--primary-glow)', textAlign: 'center' }}>
                    AUDIO {isPlaying ? 'ONLINE' : 'PAUSED'}
                </span>
            </div>

            <style jsx="true">{`
                .music-container {
                    position: absolute;
                    top: 500px;
                    left: 30px;
                    width: 200px;
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
                    background: rgba(0, 243, 255, 0.05);
                    border-bottom: 1px solid rgba(0, 243, 255, 0.1);
                }
                .label {
                    color: var(--primary-glow);
                    font-size: 0.50rem;
                    letter-spacing: 1px;
                    font-weight: bold;
                    flex: 1;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    overflow: hidden;
                }
                .ctrl-btn, .close-btn {
                    background: none;
                    border: none;
                    color: var(--primary-glow);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0px;
                }
                .ctrl-btn:hover { color: #fff; }
                .close-btn:hover { color: var(--alert-color); }
            `}</style>
        </div>
    );
};

export default MusicWidget;
