import React, { useEffect, useRef } from 'react';
import './VoiceCore.css';
import { getJarvisAnalyser } from '../hooks/useJarvisLogic';

const VoiceCore = ({ state = 'idle' }) => {
  const canvasRef = useRef(null);
  
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Create a persistent Uint8Array for performance
  const dataArrayRef = useRef(new Uint8Array(256));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let particles = [];
    
    let dpr = 1;
    let maxRadius = 0;

    const initCanvas = () => {
      dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      
      const numParticles = 1000; 
      particles = [];
      maxRadius = Math.max(window.innerWidth, window.innerHeight) / 1.5;
      
      for (let i = 0; i < numParticles; i++) {
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(Math.random() * 2 - 1);
        const radiusDist = Math.pow(Math.random(), 4); 
        const baseRadius = 180 + radiusDist * (maxRadius - 180); 
        
        particles.push({
          theta,
          phi,
          baseRadius,
          speed: 0.0001 + Math.random() * 0.0005, 
          size: 0.8 + Math.random() * 2,
          offsetY: (Math.random() - 0.5) * 40 
        });
      }
    };

    initCanvas();
    window.addEventListener('resize', initCanvas);

    let currentSpeedMult = 1;
    let currentR = 0, currentG = 180, currentB = 255, currentA = 0.8;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2 - (40 * dpr);
      
      let targetSpeedMult = 1;
      if (stateRef.current === 'listening') targetSpeedMult = 2;
      else if (stateRef.current === 'processing') targetSpeedMult = 5;
      else if (stateRef.current === 'speaking') targetSpeedMult = 4;

      currentSpeedMult += (targetSpeedMult - currentSpeedMult) * 0.05;

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 300 * dpr);
      
      let targetR = 0, targetG = 180, targetB = 255, targetA = 0.8;
      if (stateRef.current === 'listening') { targetR = 0; targetG = 255; targetB = 150; }
      else if (stateRef.current === 'processing') { targetR = 0; targetG = 255; targetB = 50; }
      else if (stateRef.current === 'speaking') { targetR = 0; targetG = 255; targetB = 255; targetA = 1; }

      currentR += (targetR - currentR) * 0.05;
      currentG += (targetG - currentG) * 0.05;
      currentB += (targetB - currentB) * 0.05;
      currentA += (targetA - currentA) * 0.05;

      const coreColor = `rgba(${Math.round(currentR)}, ${Math.round(currentG)}, ${Math.round(currentB)}, ${currentA})`;

      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.15, coreColor);
      gradient.addColorStop(0.5, 'rgba(0, 80, 200, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 400 * dpr, 0, Math.PI * 2);
      ctx.fill();

      // Get real audio amplitude from Jarvis
      let audioAmplitude = 0;
      if (stateRef.current === 'speaking') {
          const analyser = getJarvisAnalyser();
          if (analyser) {
              const dataArray = dataArrayRef.current;
              analyser.getByteTimeDomainData(dataArray);
              let maxVal = 0;
              for (let i = 0; i < analyser.frequencyBinCount; i++) {
                  const val = Math.abs(dataArray[i] - 128);
                  if (val > maxVal) maxVal = val;
              }
              // Normalizing maxVal (0 to ~100) to a multiplier (0 to 1)
              audioAmplitude = maxVal / 80;
          } else {
              // Fallback if browser TTS is used and no analyser is available
              audioAmplitude = Math.abs(Math.sin(Date.now() / 250)) * 0.5;
          }
      }

      // Render particles
      particles.forEach(p => {
        p.theta += p.speed * currentSpeedMult;
        
        let targetRadialOffset = 0;

        if (stateRef.current === 'speaking') {
           // We map the live audio amplitude to push the particles OUTWARD from the center.
           // structureWave makes some particles push out further than others to create an organic wave shape.
           const structureWave = Math.sin(p.theta * 6 + Date.now() / 300);
           // We use Math.abs to always push outward, plus a baseline push
           targetRadialOffset = (Math.abs(structureWave) * 350 + 100) * audioAmplitude * dpr;
        } else if (stateRef.current === 'listening') {
           targetRadialOffset = Math.sin(Date.now() / 200) * 15 * dpr;
        }

        p.currentOffset = p.currentOffset || 0;
        
        // Asymmetric easing: expands outward fast (0.2), floats back to center slowly (0.015)
        const radialEasing = (targetRadialOffset > p.currentOffset) ? 0.2 : 0.015;
        p.currentOffset += (targetRadialOffset - p.currentOffset) * radialEasing;

        let displayRadius = (p.baseRadius * dpr) + p.currentOffset;

        // 3D coordinates - natively orbiting around the vertical Y axis
        let x = displayRadius * Math.sin(p.theta) * Math.sin(p.phi);
        let z = displayRadius * Math.cos(p.theta) * Math.sin(p.phi);
        let y = displayRadius * Math.cos(p.phi) + (p.offsetY * dpr);

        // Apply a slight fixed static tilt so we're looking slightly down at the swarm
        const staticAngleX = 0.2; // slight tilt
        let y1 = y * Math.cos(staticAngleX) - z * Math.sin(staticAngleX);
        let z1 = y * Math.sin(staticAngleX) + z * Math.cos(staticAngleX);

        let x2 = x;
        let y2 = y1;
        let z2 = z1;

        const focalLength = 400 * dpr;
        if (focalLength + z2 <= 0) return; // Skip particles behind camera to prevent crash
        
        const scale = focalLength / (focalLength + z2);
        
        const xProj = centerX + x2 * scale;
        const yProj = centerY + y2 * scale;
        
        // Fade out smoothly towards the edges so we don't see hard borders
        const distFromCenter = Math.sqrt(x2*x2 + y2*y2);
        const edgeFade = Math.max(0, 1 - (distFromCenter / (maxRadius * dpr)));
        
        // Z-fade for depth
        const zFade = Math.max(0.05, Math.min(1, (z2 + 300 * dpr) / (500 * dpr)));
        
        const alpha = Math.min(edgeFade, zFade);
        if (alpha <= 0.02) return; // Skip invisible particles
        
        ctx.fillStyle = `rgba(100, 220, 255, ${alpha})`;
        if (Math.random() > 0.98) ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        
        const renderRadius = Math.max(0.1, p.size * dpr * scale);
        
        ctx.beginPath();
        ctx.arc(xProj, yProj, renderRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', initCanvas);
    };
  }, []); // Run engine only once and never reboot it!

  return (
    <div className="voice-core-container">
      <canvas ref={canvasRef} className="voice-core-canvas"></canvas>
    </div>
  );
};

export default VoiceCore;
