import React from 'react';

const ShortcutsWidget = () => {
    return (
        <div style={{
            position: 'absolute',
            left: '40px',
            top: '20vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            fontFamily: 'var(--font-main)',
            fontSize: '0.65rem',
            textAlign: 'right'
        }}>
            <div style={{ borderBottom: '1px solid var(--primary-glow)', paddingBottom: '10px', marginBottom: '10px' }}>
                <div style={{ color: '#fff', letterSpacing: '2px', fontSize: '0.9rem', width:'150px' }}>J.A.R.V.I.S OS</div>
                <div style={{ color: '#555' }}>Ver 2.3.0</div>
            </div>

            {
                [{name: 'SYSTEM', url: '#'}, 
                 {name: 'LINKS', url: '#'}, 
                 {name: 'YOUTUBE', url: 'https://youtube.com'}, 
                 {name: 'GITHUB', url: 'https://github.com'}, 
                 {name: 'TERMINAL', action: () => fetch('/api/spawn-cmd')}, 
                 {name: 'SECURE', url: '#'}].map((item, idx) => (
                <a key={item.name} 
                   href={item.url || '#'} 
                   target={item.url !== '#' ? "_blank" : undefined} 
                   rel={item.url !== '#' ? "noreferrer" : undefined} 
                   onClick={(e) => {
                       if (item.action) {
                           e.preventDefault();
                           item.action();
                       }
                   }}
                   style={{
                    color: idx === 0 || idx === 1 ? 'var(--alert-color)' : '#999',
                    letterSpacing: '2px',
                    cursor: 'pointer',
                    transition: '0.2s',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    display: 'block'
                }}>
                    {item.name}
                </a>
            ))}

            <div style={{ marginTop: '50px', display: 'flex', gap: '15px', flexDirection: 'column' }}>
                <div style={{ color: '#555', letterSpacing:'1px' }}>MEMORY <span style={{ color:'var(--primary-glow)' }}>3.4 GB</span></div>
                <div style={{ color: '#555', letterSpacing:'1px' }}>NETWORK <span style={{ color:'var(--primary-glow)' }}>99.9 MB</span></div>
                <div style={{ color: '#555', letterSpacing:'1px' }}>LATENCY <span style={{ color:'var(--primary-glow)' }}>13 MS</span></div>
            </div>
        </div>
    );
};

export default ShortcutsWidget;
