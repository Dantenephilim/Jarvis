import React, { useState, useEffect, useCallback } from 'react';
import { useJarvisLogic } from './hooks/useJarvisLogic';
import { useSoundEffects } from './hooks/useSoundEffects';
import { useClapDetector } from './hooks/useClapDetector';
import VoiceCore from './components/VoiceCore';
import SettingsModal from './components/SettingsModal';
import ConsoleLog from './components/ConsoleLog';
import ShortcutsWidget from './components/ShortcutsWidget';
import WeatherWidget from './components/WeatherWidget';
import DateTimeWidget from './components/DateTimeWidget';
import SysStatsWidget from './components/SysStatsWidget';
import WebcamWidget from './components/WebcamWidget';
import MusicWidget from './components/MusicWidget';
import AudioVisualizerWidget from './components/AudioVisualizerWidget';
import { Mic, MicOff, Settings, Wifi, WifiOff, Send, Camera, CameraOff, Music } from 'lucide-react';

function App() {
  const { status, logs, isMuted, toggleMute, updateConfig, isConnected, sendTextMessage, forceSpeak, addLog } = useJarvisLogic();
  const sounds = useSoundEffects();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isMusicActive, setIsMusicActive] = useState(false);

  const isClapProcessingRef = React.useRef(false);

  // Busy flag the clap detector reads each frame. While JARVIS is speaking or
  // music is playing, its own audio output would otherwise self-trigger claps.
  const isBusyRef = React.useRef(false);
  useEffect(() => {
    isBusyRef.current = status === 'speaking' || status === 'processing' || isMusicActive;
  }, [status, isMusicActive]);

  // Clap Detection Logic
  const handleClapDetected = useCallback(() => {
    if (!isMusicActive && status !== 'speaking' && status !== 'processing') {
      setIsMusicActive(true);
      
      const phrases = [
        "Aquí estoy, señor.",
        "A la orden, señor.",
        "Sistemas de audio en línea.",
        "Música ambiental activada.",
        "Quedo a su disposición, señor."
      ];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      forceSpeak(randomPhrase);
    }
  }, [isMusicActive, status, forceSpeak]);

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
      <VoiceCore state={status} />

      {/* FULL SCREEN HUD LAYOUT - CORNER ANCHORED */}
      
      {/* TOP LEFT ANCHOR */}
      <div className="hud-layer" style={{ transformOrigin: 'top left', transform: `scale(${scale})` }}>
        <ShortcutsWidget onAction={sounds.click} />
        <MusicWidget isActive={isMusicActive} onClose={() => setIsMusicActive(false)} />
      </div>

      {/* LEFT CENTER ANCHOR */}
      <div className="hud-layer" style={{ transformOrigin: 'left center', transform: `scale(${scale})` }}>
        <SysStatsWidget />
      </div>

      {/* TOP RIGHT ANCHOR */}
      <div className="hud-layer" style={{ transformOrigin: 'top right', transform: `scale(${scale})` }}>
        <DateTimeWidget />
        <WeatherWidget />
        <WebcamWidget isActive={isWebcamActive} />
      </div>

      {/* BOTTOM RIGHT ANCHOR */}
      <div className="hud-layer" style={{ transformOrigin: 'bottom right', transform: `scale(${scale})` }}>
        <div className="bottom-right-container">
           <AudioVisualizerWidget isMuted={isMuted} />
           <div className="console-portal">
              <ConsoleLog logs={logs || []} />
           </div>
        </div>
      </div>

      {/* BOTTOM CENTER VIEWPORT ANCHOR */}
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
        .hud-layer > * {
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

