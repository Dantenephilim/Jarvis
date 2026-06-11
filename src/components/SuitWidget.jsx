import React, { useRef, useEffect } from 'react';
import './SuitWidget.css';

const SuitWidget = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    
    // High-DPI Canvas
    const dpr = window.devicePixelRatio || 1;
    const width = 200;
    const height = 280;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // 3D Nodes for a geometric sphere/hologram
    const nodes = [];
    const numNodes = 80;
    for (let i = 0; i < numNodes; i++) {
      const phi = Math.acos(-1 + (2 * i) / numNodes);
      const theta = Math.sqrt(numNodes * Math.PI) * phi;
      nodes.push({
        x: Math.cos(theta) * Math.sin(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(phi),
      });
    }

    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let velocityX = 0;
    let velocityY = 0.005; // Base auto-spin speed
    let angleX = 0;
    let angleY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      const centerX = width / 2;
      const centerY = height / 2 - 20;
      const radius = 80;

      if (!isDragging) {
        // Apply friction to slow down the spin momentum
        velocityX *= 0.95;
        // Slowly return velocityY to the base auto-spin speed (0.005)
        velocityY = velocityY * 0.95 + 0.005 * 0.05;
        
        // Add a gentle spring force to slowly return the X tilt (pitch) to 0 so it stands upright
        angleX += (0 - angleX) * 0.05;
      }
      
      angleX += velocityX;
      angleY += velocityY;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      const projected = nodes.map(node => {
        let y1 = node.y * cosX - node.z * sinX;
        let z1 = node.y * sinX + node.z * cosX;
        let x1 = node.x * cosY + z1 * sinY;
        let z2 = -node.x * sinY + z1 * cosY;

        const scale = 200 / (200 + z2 * radius);
        return {
          xProj: centerX + x1 * radius * scale,
          yProj: centerY + y1 * radius * scale,
          z: z2,
          scale
        };
      });

      ctx.lineWidth = 1;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dist = Math.sqrt(Math.pow(p1.xProj - p2.xProj, 2) + Math.pow(p1.yProj - p2.yProj, 2));
          
          if (dist < 40) {
            const alpha = Math.min(1, Math.max(0.1, p1.z + 1));
            ctx.strokeStyle = `rgba(0, 243, 255, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.moveTo(p1.xProj, p1.yProj);
            ctx.lineTo(p2.xProj, p2.yProj);
            ctx.stroke();
          }
        }
      }

      projected.forEach(p => {
        const alpha = Math.min(1, Math.max(0.2, p.z + 1));
        ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.xProj, p.yProj, 2 * p.scale, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    const handleMouseDown = (e) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      canvas.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e) => {
      if (!isDragging) {
        canvas.style.cursor = 'grab';
        return;
      }
      
      const deltaX = e.clientX - lastMouseX;
      const deltaY = e.clientY - lastMouseY;
      
      // Horizontal drag spins the Y axis (like a top)
      velocityY = deltaX * 0.008;
      // Vertical drag tilts the X axis
      velocityX = deltaY * 0.008;
      
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };
    
    const handleMouseUp = () => {
      isDragging = false;
      canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="suit-widget-container" style={{ top: '20px', left: '30px', position: 'absolute' }}>
      <div className="suit-hologram-wrapper">
        <canvas ref={canvasRef} className="holo-canvas" />
      </div>
    </div>
  );
};

export default SuitWidget;
