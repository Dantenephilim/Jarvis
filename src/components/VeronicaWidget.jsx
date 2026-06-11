import React, { useRef, useEffect } from 'react';
import veronicaVideo from '../assets/veronica.mp4';

const VeronicaWidget = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    let animationId;
    let isDragging = false;
    let lastMouseX = 0;
    let velocityX = 0;
    let angleY = 0;

    const render = () => {
      if (!isDragging) {
        // Friction to slow down spin
        velocityX *= 0.95;
      }
      
      angleY += velocityX;

      if (containerRef.current) {
        containerRef.current.style.transform = `perspective(1000px) rotateY(${angleY}deg)`;
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    const handleMouseDown = (e) => {
      isDragging = true;
      lastMouseX = e.clientX;
      if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - lastMouseX;
      
      // Horizontal drag spins the Y axis
      velocityX = deltaX * 0.2;
      
      lastMouseX = e.clientX;
    };
    
    const handleMouseUp = () => {
      isDragging = false;
      if (containerRef.current) containerRef.current.style.cursor = 'grab';
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      cancelAnimationFrame(animationId);
      if (container) {
        container.removeEventListener('mousedown', handleMouseDown);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div style={{ position: 'absolute', bottom: '50px', left: '260px', zIndex: 60 }}>
      <div 
        ref={containerRef}
        style={{
          width: '250px',
          height: '250px',
          cursor: 'grab',
          transformStyle: 'preserve-3d',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <video 
          src={veronicaVideo} 
          autoPlay 
          loop 
          muted 
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            mixBlendMode: 'screen', // Makes pure black transparent
            filter: 'contrast(1.5)', // Increases contrast to crush any gray backgrounds to pure black
            pointerEvents: 'none' // Let mouse events pass to the wrapper
          }}
        />
      </div>
    </div>
  );
};

export default VeronicaWidget;
