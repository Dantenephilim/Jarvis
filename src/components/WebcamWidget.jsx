import React, { useRef, useEffect, useState } from 'react';
import { Camera, AlertCircle } from 'lucide-react';

const WebcamWidget = ({ isActive }) => {
    const videoRef = useRef(null);
    const [hasError, setHasError] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);

    useEffect(() => {
        let stream = null;

        const startCamera = async () => {
            try {
                setHasError(false);
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: "user" 
                    } 
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsStreaming(true);
                }
            } catch (err) {
                console.error("Error accessing webcam:", err);
                setHasError(true);
                setIsStreaming(false);
            }
        };

        const stopCamera = () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
                setIsStreaming(false);
            }
        };

        if (isActive) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isActive]);

    // Removed early return so the widget frame always renders
    // if (!isActive) return null;

    return (
        <div className="webcam-container">
            <div className="webcam-header">
                <Camera size={12} className={isActive ? "text-cyan" : "text-gray"} style={{ opacity: isActive ? 1 : 0.5 }} />
                <span className="label" style={{ opacity: isActive ? 1 : 0.5 }}>OPTICAL SENSOR</span>
                <div className={`pulse-dot ${isStreaming ? 'active' : ''}`} />
            </div>

            <div className="webcam-feed-wrapper">
                {!isActive ? (
                    <div className="webcam-error" style={{ color: '#888', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <Camera size={32} style={{ opacity: 0.3 }} />
                        <span style={{ opacity: 0.5 }}>SENSOR OFFLINE</span>
                    </div>
                ) : hasError ? (
                    <div className="webcam-error">
                        <AlertCircle size={32} />
                        <span>CAMERA ACCESS DENIED</span>
                    </div>
                ) : (
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="webcam-video"
                        style={{ opacity: isStreaming ? 1 : 0 }}
                    />
                )}
                <div className="crosshair-overlay"></div>
            </div>

            <style jsx="true">{`
                .webcam-container {
                    position: absolute;
                    top: 390px;
                    right: 40px;
                    width: 260px;
                    background: rgba(0, 5, 10, 0.6);
                    border: 1px solid rgba(0, 243, 255, 0.2);
                    border-right-width: 4px;
                    border-right-color: rgba(0, 243, 255, 0.4);
                    backdrop-filter: blur(8px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    font-family: var(--font-main);
                    animation: fadeIn 0.3s ease-out;
                    z-index: 100;
                }
                .webcam-header {
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
                    background: #555;
                    border-radius: 50%;
                    margin-left: auto;
                }
                .pulse-dot.active {
                    background: var(--alert-color); /* Red recording dot */
                    animation: pulse-record 2s infinite;
                }
                .webcam-feed-wrapper {
                    position: relative;
                    width: 100%;
                    padding-bottom: 75%; /* 4:3 Aspect Ratio */
                    background: #000;
                    overflow: hidden;
                }
                .webcam-video {
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    object-fit: cover;
                    /* Flip horizontally so it acts like a mirror */
                    transform: scaleX(-1);
                    filter: contrast(1.1) brightness(1.1) saturate(0.8) sepia(0.2) hue-rotate(180deg); /* Slight blue tint */
                }
                .webcam-error {
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    color: var(--alert-color);
                    gap: 10px;
                    font-size: 0.8rem;
                    letter-spacing: 2px;
                    text-align: center;
                }
                .crosshair-overlay {
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    pointer-events: none;
                    background-image: 
                        linear-gradient(transparent 49%, rgba(0, 243, 255, 0.3) 50%, transparent 51%),
                        linear-gradient(90deg, transparent 49%, rgba(0, 243, 255, 0.3) 50%, transparent 51%);
                    background-size: 100% 100%;
                }
                .crosshair-overlay::after {
                    content: '';
                    position: absolute;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    width: 40px; height: 40px;
                    border: 1px solid rgba(0, 243, 255, 0.5);
                    border-radius: 50%;
                }

                @keyframes pulse-record {
                    0% { box-shadow: 0 0 0 0 rgba(255, 85, 0, 0.7); }
                    70% { box-shadow: 0 0 0 8px rgba(255, 85, 0, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 85, 0, 0); }
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @media (max-width: 768px) {
                    .webcam-container {
                        top: 60px;
                        right: 10px;
                        width: 150px; /* Smaller on mobile */
                    }
                }
            `}</style>
        </div>
    );
};

export default WebcamWidget;
