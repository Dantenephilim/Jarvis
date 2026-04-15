import React, { useState } from 'react';
import { useJarvisLogic } from './hooks/useJarvisLogic';
import JarvisOrb from './components/JarvisOrb';
import SettingsModal from './components/SettingsModal';
import ConsoleLog from './components/ConsoleLog';
import ShortcutsWidget from './components/ShortcutsWidget';
import WeatherWidget from './components/WeatherWidget';
import DateTimeWidget from './components/DateTimeWidget';
import SysStatsWidget from './components/SysStatsWidget';
import { Mic, MicOff, Settings, Wifi, WifiOff, Send, VolumeX, ShieldAlert } from 'lucide-react';

function App() {
  const { status, transcript, logs, isMuted, toggleMute, updateConfig, isConnected, sendTextMessage } = useJarvisLogic();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Status logic: active if listening, speaking, or connected to agent
  const isAndActive = status === 'listening' || status === 'speaking' || status === 'connected';

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendTextMessage(chatInput);
      setChatInput('');
    }
  };

  return (
    <div className="jarvis-container">
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={updateConfig}
      />

      {/* FULL SCREEN HUD LAYOUT */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        pointerEvents: 'none' // Allows clicking through to the center elements
      }}>
        
        {/* Modular Overlays */}
        <div style={{ pointerEvents: 'auto', position: 'relative', zIndex: 50, width: '100%', height: '100%' }}>
          <ShortcutsWidget />
          <SysStatsWidget />
          <DateTimeWidget />
          <WeatherWidget />
          
          <div style={{ position: 'absolute', right: '40px', bottom: '40px' }}>
             <ConsoleLog logs={logs || []} />
          </div>
        </div>

        {/* Center Viewport */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none', // The container blocks, its children should have auto
          zIndex: 100
        }}>
          
          <div style={{ pointerEvents: 'none' }}>
             <JarvisOrb state={status} />
          </div>

          {/* Status Indicators */}
          <div style={{
            marginTop: '-120px', // Pull it closer to the expanded orb
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            zIndex: 10
          }}>
            <div className="title-neon text-emerald" style={{ fontSize: '1rem', letterSpacing: '4px' }}>
              {status === 'listening' ? 'LISTENING...' : status === 'speaking' ? 'SYNTHESIZING...' : 'SYSTEM ONLINE'}
            </div>
          </div>

          {/* Controls Dock */}
          <div style={{
            display: 'flex',
            gap: '20px',
            padding: '5px 20px',
            borderBottom: '1px solid var(--primary-glow)',
            alignItems: 'center',
            marginTop: '80px',
            marginBottom: '15px',
            position: 'relative',
            zIndex: 100,
            pointerEvents: 'auto'
          }}>
            <button className="icon-btn" onClick={toggleMute} title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              style={{ background: 'none', border: 'none', color: isMuted ? 'var(--alert-color)' : '#fff', cursor: 'pointer', transition: 'all 0.3s' }}>
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button className="icon-btn" title={isConnected ? "Network Connected" : "Network Disconnected"}
              style={{ background: 'none', border: 'none', color: isConnected ? 'var(--primary-glow)' : 'var(--alert-color)', cursor: 'default' }}>
              {isConnected ? <Wifi size={20} /> : <WifiOff size={20} />}
            </button>

            <button className="icon-btn" onClick={() => setIsSettingsOpen(true)} title="Settings"
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <Settings size={20} />
            </button>
          </div>

          {/* Chat Form */}
          <form onSubmit={handleChatSubmit} style={{
            display: 'flex',
            alignItems: 'center',
            width: '400px',
            background: 'transparent',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            padding: '5px 10px',
            position: 'relative',
            zIndex: 100,
            pointerEvents: 'auto'
          }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="DIRECTIVE INPUT..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--primary-glow)',
                fontFamily: 'var(--font-main)',
                fontSize: '0.8rem',
                outline: 'none',
                letterSpacing: '2px'
              }}
            />
            <button type="submit" style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-glow)',
              cursor: 'pointer',
              padding: '0 5px'
            }}>
              <Send size={16} />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

export default App;
