import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useProgress } from '@react-three/drei';
import { useJarvisLogic } from './hooks/useJarvisLogic';
import { useSoundEffects } from './hooks/useSoundEffects';
import { useClapDetector } from './hooks/useClapDetector';
import VoiceCore from './components/VoiceCore';
import VoiceCore_CyberNeon from './themes/VoiceCore_CyberNeon';
import SettingsModal from './components/SettingsModal';
import ConsoleLog from './components/ConsoleLog';
import ShortcutsWidget from './components/ShortcutsWidget';
import WeatherWidget from './components/WeatherWidget';
import DateTimeWidget from './components/DateTimeWidget';
import SysStatsWidget from './components/SysStatsWidget';
import WebcamWidget from './components/WebcamWidget';
import MusicWidget from './components/MusicWidget';
import AudioVisualizerWidget from './components/AudioVisualizerWidget';
import SuitWidget from './components/SuitWidget';
import HoloModelWidget from './components/HoloModelWidget';
import LogoWidget from './components/LogoWidget';
import { Mic, MicOff, Settings, Wifi, WifiOff, Send, Camera, CameraOff, Music } from 'lucide-react';

const GlobalLoader = ({ onReady }) => {
  const { active, progress } = useProgress();
  const [show, setShow] = useState(true);
  const [dots, setDots] = useState('');
  const [isFading, setIsFading] = useState(false);
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(dotInterval);
  }, []);

  // Smooth progress calculation
  useEffect(() => {
    let interval = setInterval(() => {
        setDisplayedProgress(prev => {
            if (prev >= 100) return 100;
            
            const isDone = !active && progress === 100;
            const target = isDone ? 100 : Math.max(progress * 0.9, prev);
            
            if (isDone) {
                // If model is loaded, climb at a steady cinematic pace
                // 1.25 per 50ms = 25 per second. Reaches 100 in 4 seconds.
                return Math.min(100, prev + 1.25);
            } else {
                // Chase target smoothly
                return prev + (target - prev) * 0.1;
            }
        });
    }, 50);
    return () => clearInterval(interval);
  }, [active, progress]);

  useEffect(() => {
    if (displayedProgress >= 100 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      const waitTimer = setTimeout(() => {
        if (onReady) onReady();
        setIsFading(true);
        setTimeout(() => setShow(false), 1200); 
      }, 600); // Brief 600ms pause at 100% so it's clearly readable
      return () => clearTimeout(waitTimer);
    }
  }, [displayedProgress]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      backgroundColor: '#020610', zIndex: 99999, fontFamily: 'var(--font-main, monospace)',
      opacity: isFading ? 0 : 1,
      transform: isFading ? 'scale(1.05)' : 'scale(1)',
      pointerEvents: isFading ? 'none' : 'auto',
      transition: 'opacity 1s ease-out, transform 1s ease-out'
    }}>
      <div className="tactical-grid" />
      
      {/* Outer Ring */}
      <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="200" height="200" style={{ position: 'absolute', animation: 'spin-slow 8s linear infinite' }}>
           <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(0, 243, 255, 0.2)" strokeWidth="2" strokeDasharray="10 20" />
           <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(0, 243, 255, 0.4)" strokeWidth="1" strokeDasharray="40 10 10 10" />
        </svg>
        <svg width="200" height="200" style={{ position: 'absolute', animation: 'spin-reverse-slow 12s linear infinite' }}>
           <circle cx="100" cy="100" r="70" fill="none" stroke="#00f3ff" strokeWidth="4" strokeDasharray="100 200" style={{ filter: 'drop-shadow(0 0 10px #00f3ff)' }} />
        </svg>
        
        {/* Progress Text */}
        <div style={{ color: '#00f3ff', fontSize: '24px', fontWeight: 'bold', textShadow: '0 0 10px #00f3ff' }}>
          {displayedProgress.toFixed(0)}%
        </div>
      </div>

      <div style={{ marginTop: '30px', color: '#00f3ff', fontSize: '14px', letterSpacing: '4px', textShadow: '0 0 5px #00f3ff' }}>
        INITIALIZING SYSTEMS{dots}
      </div>
      
      {/* Progress Bar */}
      <div style={{ width: '300px', height: '2px', background: 'rgba(0, 243, 255, 0.1)', marginTop: '20px', overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: '#00f3ff', boxShadow: '0 0 10px #00f3ff', transition: 'width 0.3s ease-out' }} />
      </div>
    </div>
  );
};

function App() {
  const { status, logs, isMuted, toggleMute, setMuteState, updateConfig, isConnected, sendTextMessage, forceSpeak, addLog, activeTheme } = useJarvisLogic();
  const sounds = useSoundEffects();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isWebcamActive, setIsWebcamActive] = useState(true);
  const [isMusicActive, setIsMusicActive] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  const isClapProcessingRef = React.useRef(false);

  // Busy flag the clap detector reads each frame. While JARVIS is speaking or
  // music is playing, its own audio output would otherwise self-trigger claps.
  const isBusyRef = React.useRef(false);
  useEffect(() => {
    isBusyRef.current = status === 'speaking' || status === 'processing' || isMusicActive;
  }, [status, isMusicActive]);

  // Clap Detection Logic
  const handleClapDetected = useCallback(() => {
    // Only detect claps if the microphone is ACTIVE (!isMuted)
    if (!isMuted && !isMusicActive && status !== 'speaking' && status !== 'processing') {
      setIsMusicActive(true);
      forceSpeak("Bienvenido señor.");
      setMuteState(true);
    }
  }, [isMuted, isMusicActive, status, forceSpeak, setMuteState]);

  useClapDetector({ onClap: handleClapDetected, isBusyRef, onError: addLog });

  const [scale, setScale] = useState(1);

  // Uniform scale to prevent stretching (perfect circles) while filling the screen
  useEffect(() => {
    const handleResize = () => {
      // Find the most constrained dimension, but CAP at 1.0 to prevent blurry upscaling on 2K/4K monitors
      const s = Math.min(1, Math.min(window.innerWidth / 1600, window.innerHeight / 900));
      setScale(s);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Play sound on status change
  useEffect(() => {
    if (status === 'listening') sounds.listening();
    if (status === 'speaking') sounds.synthStart();
    if (status === 'processing') sounds.processing();
  }, [status]);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sounds.click();
      sendTextMessage(chatInput);
      setChatInput('');
    }
  };

  const handleToggleMute = () => {
    sounds.click();
    toggleMute();
  };

  const handleToggleWebcam = () => {
    sounds.click();
    setIsWebcamActive(!isWebcamActive);
  };

  const handleToggleMusic = () => {
    sounds.click();
    setIsMusicActive(!isMusicActive);
  };

  const handleOpenSettings = () => {
    sounds.click();
    setIsSettingsOpen(true);
  };

  return (
    <div className="jarvis-container">
      <GlobalLoader onReady={() => setIsAppReady(true)} />
      
      {/* HUD Aesthetic Layers */}
      <div className="tactical-grid" />
      <div className="hud-corner top-left" />
      <div className="hud-corner top-right" />
      <div className="hud-corner bottom-left" />
      <div className="hud-corner bottom-right" />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={updateConfig}
      />

      {/* FULL SCREEN BACKGROUND CORE */}
      {activeTheme === 'CyberNeon' ? <VoiceCore_CyberNeon state={status} /> : <VoiceCore state={status} />}

      {/* FULL SCREEN HUD LAYOUT - CORNER ANCHORED */}
      
      {/* TOP CENTER ANCHOR */}
      <div className="hud-layer" style={{ transformOrigin: 'top center', transform: `scale(${scale})` }}>
        <LogoWidget />
      </div>

      {/* TOP LEFT ANCHOR */}
      <div className="hud-layer" style={{ transformOrigin: 'top left', transform: `scale(${scale})` }}>
        <div className={`hud-anim-wrapper ${isAppReady ? 'anim-slide-right' : 'hud-hidden'}`}>
          <SuitWidget />
          <ShortcutsWidget onAction={sounds.click} />
        </div>
      </div>

      {/* LEFT CENTER ANCHOR (SysStats + Music) */}
      <div className="hud-layer" style={{ transformOrigin: 'left center', transform: `scale(${scale})` }}>
        <div className={`hud-anim-wrapper ${isAppReady ? 'anim-slide-right-delayed' : 'hud-hidden'}`}>
          <SysStatsWidget />
          <MusicWidget isActive={isMusicActive} onToggle={() => {
              const nextState = !isMusicActive;
              setIsMusicActive(nextState);
              setMuteState(nextState); // Mutes when playing, unmutes when stopped
          }} />
        </div>
      </div>

      {/* BOTTOM RIGHT ANCHOR (Clock + Console + Mic) */}
      <div className="hud-layer" style={{ transformOrigin: 'bottom right', transform: `scale(${scale})` }}>
        <div className={`hud-anim-wrapper ${isAppReady ? 'anim-slide-left' : 'hud-hidden'}`}>
          <DateTimeWidget />
          <ConsoleLog logs={logs || []} />
          <AudioVisualizerWidget isMuted={isMuted} />
        </div>
      </div>

      {/* TOP RIGHT ANCHOR - TIME/WEATHER */}
      <div className="hud-layer" style={{ transformOrigin: 'top right', transform: `scale(${scale})` }}>
        <div className={`hud-anim-wrapper ${isAppReady ? 'anim-fade-slow' : 'hud-hidden'}`}>
          <WeatherWidget />
        </div>
      </div>

      {/* TOP RIGHT ANCHOR - CAMERA */}
      <div className="hud-layer" style={{ transformOrigin: 'top right', transform: `scale(${scale})` }}>
        <div className={`hud-anim-wrapper ${isAppReady ? 'anim-slide-left' : 'hud-hidden'}`}>
          <WebcamWidget isActive={isWebcamActive} />
        </div>
      </div>

      {/* BOTTOM CENTER ANCHOR (Chat) */}
      <div className="hud-layer" style={{ transformOrigin: 'bottom center', transform: `scale(${scale})` }}>
        <div className="core-viewport">
          {/* Status Indicators */}
          <div className="status-plate">
            <div className="title-neon text-emerald">
              {status === 'listening' ? 'LISTENING...' : status === 'speaking' ? 'SYNTHESIZING...' : 
               status === 'processing' ? 'PROCESSING...' : 'SYSTEM ONLINE'}
            </div>
          </div>

          {/* Controls Dock */}
          <div className="controls-dock">
            <button className="icon-btn" onClick={handleToggleMute} title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              style={{ color: isMuted ? 'var(--alert-color)' : '#fff' }}>
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button className="icon-btn" onClick={handleToggleWebcam} title={isWebcamActive ? "Disable Camera" : "Enable Camera"}
              style={{ color: isWebcamActive ? 'var(--primary-glow)' : '#888' }}>
              {isWebcamActive ? <Camera size={20} /> : <CameraOff size={20} />}
            </button>

            <button className="icon-btn" title={isConnected ? "Network Connected" : "Network Disconnected"}
              style={{ color: isConnected ? 'var(--primary-glow)' : 'var(--alert-color)', cursor: 'default' }}>
              {isConnected ? <Wifi size={20} /> : <WifiOff size={20} />}
            </button>

            <button className="icon-btn" onClick={handleOpenSettings} title="Settings"
              style={{ color: '#888' }}>
              <Settings size={20} />
            </button>
          </div>

          {/* Chat Form */}
          <form onSubmit={handleChatSubmit} className="directive-input-form">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="DIRECTIVE INPUT..."
              className="hud-input"
            />
            <button type="submit" className="hud-send-btn">
              <Send size={16} />
            </button>
          </form>

        </div>
      </div>

      {/* HOLOGRAM LAYER - TOPMOST TO PREVENT TOOLTIP CLIPPING */}
      <div className="hud-layer" style={{ transformOrigin: 'left center', transform: `scale(${scale})`, zIndex: 1000 }}>
        <HoloModelWidget />
      </div>

      <style jsx="true">{`
        /* FULL EDGE-TO-EDGE CANVAS */
        .jarvis-container {
          width: 100vw;
          height: 100vh;
          position: absolute;
          top: 0;
          left: 0;
          overflow: hidden;
        }

        /* ANCHOR LAYERS */
        .hud-layer {
          position: absolute;
          top: 0; left: 0; width: 100vw; height: 100vh;
          overflow: hidden;
          pointer-events: none;
          z-index: 50;
        }
        
        /* Enable clicking on widgets inside layers */
        .hud-layer * {
          pointer-events: auto;
        }

        .bottom-right-container {
          position: absolute;
          right: 40px;
          bottom: 40px;
          display: flex;
          align-items: flex-end;
          gap: 20px;
          animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .console-portal {
           /* Inherit position from flex container */
        }
        .core-viewport {
          position: absolute;
          bottom: 10px; 
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          pointer-events: none;
          z-index: 100;
        }
        .status-plate {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          z-index: 10;
        }
        .controls-dock {
          display: flex; gap: 20px; padding: 5px 20px;
          border-bottom: 1px solid var(--primary-glow);
          align-items: center;
          margin-top: 30px; margin-bottom: 15px;
          position: relative; z-index: 100;
          pointer-events: auto;
        }
        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 50%;
        }
        .icon-btn:hover {
          background: rgba(255,255,255,0.05);
          transform: scale(1.1);
        }
        .directive-input-form {
          display: flex; align-items: center;
          width: 400px; background: transparent;
          border-bottom: 1px solid rgba(255,255,255,0.2);
          padding: 5px 10px; position: relative;
          z-index: 100; pointer-events: auto;
        }
        .hud-input {
          flex: 1; background: transparent; border: none;
          color: var(--primary-glow); font-family: var(--font-main);
          font-size: 0.8rem; outline: none; letter-spacing: 2px;
        }
        .hud-send-btn { background: none; border: none; color: var(--primary-glow); cursor: pointer; padding: 0 5px; }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .right-hud-panel {
             right: 10px; top: 10px; bottom: 10px; width: auto; align-items: flex-end;
          }
          .directive-input-form { width: 90vw; }
          .status-plate { margin-top: -60px; }
          .console-portal { width: 95vw; }
        }
      `}</style>
    </div>
  );
}

export default App;

