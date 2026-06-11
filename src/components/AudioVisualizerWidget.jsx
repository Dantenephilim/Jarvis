import React, { useEffect, useRef, useState } from 'react';
import './AudioVisualizerWidget.css';

const AudioVisualizerWidget = ({ isMuted }) => {
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isMuted) return;

    let mounted = true;
    let audioCtx;
    let analyser;
    let source;
    let requestRef;
    let stream;

    const startVisualizer = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // For smooth envelope tracking
        let smoothEnvelope = Array(bufferLength).fill(0);

        const draw = () => {
          if (!mounted) return;
          requestRef = requestAnimationFrame(draw);

          analyser.getByteTimeDomainData(dataArray);

          // Clear background
          ctx.fillStyle = 'rgba(0, 5, 15, 1)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // 1. Draw Grid
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
          ctx.shadowBlur = 0;
          ctx.beginPath();
          // Vertical lines
          for (let x = 0; x <= canvas.width; x += 20) {
            ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
          }
          // Horizontal lines
          for (let y = 0; y <= canvas.height; y += 20) {
            ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
          }
          // Center split line
          ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();

          const sliceWidth = canvas.width * 1.0 / bufferLength;
          let x = 0;

          // 2. Draw Mirrored Dense Waveform Centered
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = 'rgba(200, 255, 255, 0.9)';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00f3ff';
          ctx.beginPath();

          for (let i = 0; i < bufferLength; i++) {
            const v = (dataArray[i] - 128) / 128.0; // -1 to 1
            const amplitude = Math.abs(v) * (canvas.height / 2.5);
            const yCenter = canvas.height / 2;
            
            ctx.moveTo(x, yCenter - amplitude);
            ctx.lineTo(x, yCenter + amplitude);
            x += sliceWidth;
          }
          ctx.stroke();
        };

        draw();

      } catch (err) {
        if (mounted) setError(true);
      }
    };

    startVisualizer();

    return () => {
      mounted = false;
      if (requestRef) cancelAnimationFrame(requestRef);
      if (source) source.disconnect();
      if (analyser) analyser.disconnect();
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [isMuted]);

  return (
    <div className="audio-visualizer-panel" style={{ position: 'absolute', bottom: 'calc(40px + 35vh + 20px)', right: '40px', width: '320px' }}>
      <div className="tech-brackets">
         <div className="corner top-left"></div>
         <div className="corner top-right"></div>
         <div className="corner bottom-left"></div>
         <div className="corner bottom-right"></div>
      </div>
      
      {!isMuted && !error ? (
        <canvas ref={canvasRef} width="400" height="120" className="visualizer-canvas" />
      ) : (
        <div className="visualizer-offline">
           {isMuted ? 'MICROPHONE OFFLINE' : 'NO SIGNAL'}
        </div>
      )}
    </div>
  );
};

export default AudioVisualizerWidget;
