import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Center, Bvh, Html } from '@react-three/drei';
import * as THREE from 'three';

const IronManModel = () => {
  const { scene } = useGLTF('/src/assets/iron_man.glb');
  const groupRef = useRef();

  const [isDragging, setIsDragging] = useState(false);
  const [hoveredInfo, setHoveredInfo] = useState(null);
  const velocity = useRef({ x: 0, y: 0.005 });
  const lastMouse = useRef({ x: 0, y: 0 });
  const clearHoverTimeout = useRef(null);
  const spawnProgress = useRef(0);

  useMemo(() => {
    if (scene && !scene.userData.materialsProcessed) {
      scene.userData.materialsProcessed = true;
      scene.traverse((child) => {
        if (child.isMesh && !child.userData.isWireframeOverlay) {
          // Do NOT disable raycast here anymore, Bvh handles performance
          
          // Hide only the base/pedestal
          const name = child.name.toLowerCase();
          if (
            name === 'base' || name === 'pedestal' || name.includes('cylinder') || name === 'plane' ||
            name.includes('_mat_') || name.includes('plane017') || name.includes('plane018') || 
            name.includes('plane019') || name.includes('plane020')
          ) {
            child.visible = false;
          }

          // Clean up any previously added lines during hot-reloads
          const overlays = child.children.filter(c => c.isLineSegments || c.userData.isWireframeOverlay);
          overlays.forEach(c => child.remove(c));

          // 1. Solid Holographic Core
          child.material = new THREE.MeshStandardMaterial({
            color: '#0a1d3a',       
            emissive: '#0f7bb0',
            emissiveIntensity: 0.9,
            roughness: 0.2,
            metalness: 0.8,         
            transparent: true,
            opacity: 0, // Starts at 0 for spawn animation
            depthWrite: true,
            polygonOffset: true,    
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1
          });

          // 2. Full Wireframe Grid Overlay (Reverted)
          const wireframeMesh = new THREE.Mesh(
            child.geometry,
            new THREE.MeshBasicMaterial({
              color: '#88eeff',
              wireframe: true,
              transparent: true,
              opacity: 0, // Starts at 0 for spawn animation
              depthWrite: false,
              blending: THREE.AdditiveBlending
            })
          );
          wireframeMesh.raycast = () => null; // Disable raycasting on overlay
          wireframeMesh.userData.isWireframeOverlay = true;
          
          child.add(wireframeMesh);

          // PERFORMANCE OPTIMIZATION: Disable matrix updates for all static child parts
          child.updateMatrix();
          child.matrixAutoUpdate = false;
          wireframeMesh.updateMatrix();
          wireframeMesh.matrixAutoUpdate = false;
        }
      });
    }
  }, [scene]);

  // Visual "Grabbed" Effect
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh && !child.userData.isWireframeOverlay && child.material) {
          child.material.emissiveIntensity = isDragging ? 1.8 : 0.9;
        }
      });
    }
  }, [isDragging, scene]);

  useFrame(() => {
    if (!groupRef.current) return;
    
    // Cool Materialize Spawn Animation
    if (spawnProgress.current < 1) {
      spawnProgress.current += 0.015;
      if (spawnProgress.current > 1) spawnProgress.current = 1;
      
      const eased = 1 - Math.pow(1 - spawnProgress.current, 3);
      groupRef.current.position.y = -2 + (eased * 2);
      
      scene.traverse(child => {
        if (child.isMesh && child.material) {
           if (child.userData.isWireframeOverlay) {
               child.material.opacity = eased * 0.08;
           } else {
               child.material.opacity = eased * 0.85;
           }
        }
      });
    }

    if (!isDragging) {
      velocity.current.y = velocity.current.y * 0.95 + 0.005 * 0.05; // Base auto-spin
    }
    
    // Lock X rotation to 0 (no vertical tilt)
    groupRef.current.rotation.x += (0 - groupRef.current.rotation.x) * 0.1;
    groupRef.current.rotation.y += velocity.current.y;
  });

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    setHoveredInfo(null);
    lastMouse.current = { x: e.clientX, y: e.clientY };
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      const deltaX = e.clientX - lastMouse.current.x;
      velocity.current.y += (deltaX * 0.005 - velocity.current.y) * 0.5;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    } else {
      if (hoveredInfo && e.point && groupRef.current) {
        e.stopPropagation();
        const localPoint = groupRef.current.worldToLocal(e.point.clone());
        setHoveredInfo(prev => prev ? { ...prev, point: localPoint } : null);
      }
    }
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  const handlePointerOver = (e) => {
    e.stopPropagation();
    if (clearHoverTimeout.current) clearTimeout(clearHoverTimeout.current);
    if (!isDragging && e.object && e.object.name) {
      // Create a clean readable name from the mesh node name
      let cleanName = e.object.name.replace(/_/g, ' ').toUpperCase();
      if (cleanName.includes('OBJECT')) cleanName = 'ARMOR PLATE ' + cleanName.split(' ')[1];
      
      // Convert the world intersection point into the group's local coordinates
      // This pins the tooltip perfectly to the 3D mesh so it rotates with it!
      let localPoint = e.point.clone();
      if (groupRef.current) {
         localPoint = groupRef.current.worldToLocal(localPoint);
      }

      setHoveredInfo({
         name: cleanName,
         point: localPoint
      });
      // Change cursor to crosshair
      document.body.style.cursor = 'crosshair';
    }
  };

  const handlePointerOut = (e) => {
    clearHoverTimeout.current = setTimeout(() => {
      setHoveredInfo(null);
      document.body.style.cursor = 'auto';
    }, 50);
  };

  return (
    <group 
      ref={groupRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOut={(e) => { handlePointerOut(e); handlePointerUp(e); }}
      onPointerOver={handlePointerOver}
      scale={0.015} 
    >
      <Center>
        <Bvh firstHitOnly>
          <primitive object={scene} />
        </Bvh>
      </Center>

      {hoveredInfo && !isDragging && (
        <Html position={hoveredInfo.point} style={{ pointerEvents: 'none' }}>
          <div style={{ position: 'relative', width: 0, height: 0 }}>
            {/* The dot at the exact 3D intersection point */}
            <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '4px', height: '4px', background: '#00f3ff', borderRadius: '50%', boxShadow: '0 0 5px #00f3ff' }} />
            
            {/* The diagonal line starting at the dot (0,0) and going up-right */}
            <svg style={{ position: 'absolute', left: 0, top: '-40px', width: '40px', height: '40px', overflow: 'visible' }}>
              <line x1="0" y1="40" x2="40" y2="0" stroke="#00f3ff" strokeWidth="1" />
              <circle cx="40" cy="0" r="2" fill="#00f3ff" />
            </svg>

            {/* The text box anchored at the end of the line (up and to the right) */}
            <div style={{ 
              position: 'absolute', 
              left: '40px', 
              bottom: '40px', 
              border: 'none', 
              background: 'transparent', 
              padding: '6px 10px', 
              fontSize: '11px', 
              color: '#fff', 
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-main)',
              letterSpacing: '1px',
              textShadow: '0 0 5px rgba(0,243,255,0.5)'
            }}>
              <span style={{ color: '#00f3ff', marginRight: '5px' }}>SYS.TGT:</span>
              {hoveredInfo.name}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

const HoloModelWidget = () => {
  return (
    <div style={{ position: 'absolute', bottom: '30px', left: '10px', width: '350px', height: '450px', zIndex: 15, overflow: 'visible' }}>
      <div style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <Canvas 
          camera={{ position: [0, 0, 7.5], fov: 45 }} 
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#00f3ff" />
          <React.Suspense fallback={null}>
            <IronManModel />
          </React.Suspense>
        </Canvas>
      </div>
    </div>
  );
};

export default HoloModelWidget;

// Preload the 3D model into cache so it loads instantly when the app starts
useGLTF.preload('/src/assets/iron_man.glb');
