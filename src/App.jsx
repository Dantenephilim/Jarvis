import React, { useState, useEffect } from 'react';
import { useJarvisLogic } from './hooks/useJarvisLogic';
import { useSoundEffects } from './hooks/useSoundEffects';
import JarvisOrb from './components/JarvisOrb';
import SettingsModal from './components/SettingsModal';
import ConsoleLog from './components/ConsoleLog';
import ShortcutsWidget from './components/ShortcutsWidget';
import WeatherWidget from './components/WeatherWidget';
import DateTimeWidget from './components/DateTimeWidget';
import SysStatsWidget from './components/SysStatsWidget';
import { Mic, MicOff, Settings, Wifi, WifiOff, Send } from 'lucide-react';

function App() {
  const { status, logs, isMuted, toggleMute, updateConfig, isConnected, sendTextMessage } = useJarvisLogic();
  const sounds = useSoundEffects();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');

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

      {/* FULL SCREEN HUD LAYOUT */}
      <div className="hud-layout">
        
        {/* Modular Overlays */}
        <div className="widgets-container">
          <ShortcutsWidget onAction={sounds.click} />
          <SysStatsWidget />
          <DateTimeWidget />
          <WeatherWidget />
          
          <div className="console-portal">
             <ConsoleLog logs={logs || []} />
          </div>
        </div>

        {/* Center Viewport */}
        <div className="core-viewport">
          
          <div className="orb-anchor">
             <JarvisOrb state={status} />
          </div>

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

            <button className="icon-btn" title={isConnected ? "Network Connected" : "Network Disconnected"}
              style={{ color: isConnected ? 'var(--primary-glow)' : 'var(--alert-color)', cursor: 'default' }}>
              {isConnected ? <Wifi size={20} /> : <WifiOff size={20} />}
            </button>

            <button className="icon-btn" onClick={handleOpenSettings} title="Settings">
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
        .hud-layout {
          position: absolute;
          top: 0; left: 0; width: 100vw; height: 100vh;
          overflow: hidden;
          pointer-events: none;
          z-index: 50;
        }
        .widgets-container {
          pointer-events: auto;
          position: relative;
          width: 100%;
          height: 100%;
        }
        .console-portal {
          position: absolute;
          right: 40px;
          bottom: 40px;
          animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .core-viewport {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          pointer-events: none;
          z-index: 100;
        }
        .orb-anchor { 
          pointer-events: none;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px; /* Reduced space holder */
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
          margin-top: 80px; margin-bottom: 15px;
          position: relative; z-index: 100;
          pointer-events: auto;
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
          .directive-input-form { width: 90vw; }
          .status-plate { margin-top: -60px; }
          .console-portal { right: 10px; bottom: 10px; width: 95vw; }
        }
      `}</style>
    </div>
  );
}

export default App;

