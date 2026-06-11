import React from 'react';
import logo from '../assets/stark_logo_cyan.png';

const LogoWidget = () => {
    return (
        <div className="logo-widget-container">
            <img src={logo} alt="Stark Industries" className="stark-logo" />
            
            <style jsx="true">{`
                .logo-widget-container {
                    position: absolute;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    pointerEvents: none;
                    z-index: 10;
                    opacity: 0.9;
                    animation: fadeIn 2s ease-out;
                }
                .stark-logo {
                    width: 450px;
                    height: auto;
                    filter: drop-shadow(0 0 10px rgba(0, 243, 255, 0.6));
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translate(-50%, -20px); }
                    to { opacity: 0.9; transform: translate(-50%, 0); }
                }
            `}</style>
        </div>
    );
};

export default LogoWidget;
