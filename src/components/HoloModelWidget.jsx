import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Center, Bvh, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronLeft, ChevronRight, Layers, Shield, Sparkles } from 'lucide-react';
import defaultIronManModel from '../assets/iron_man.glb';

export const ARMOR_REGISTRY = [
  { id: 'mark_85', name: 'MARK LXXXV (PRIME)', file: defaultIronManModel, tag: 'NANO-TECH', scale: 0.013 },
  { id: 'mark_7', name: 'MARK VII', path: '/assets/iron-man_mark_7.glb', tag: 'HEAVY ARTILLERY', scale: 0.013 },
  { id: 'mark_6', name: 'MARK VI (AVENGERS)', path: '/assets/iron_man_the_avengers.glb', tag: 'TRI-CORE', scale: 0.013 },
  { id: 'stealth', name: 'MARK 85 STEALTH', path: '/assets/iron_man_mark_85stealth.glb', tag: 'NIGHT OPS', scale: 0.013 },
  { id: 'samurai', name: 'IRON SAMURAI', path: '/assets/iron_man_-_iron_samurai.glb', tag: 'TACTICAL BLADE', scale: 0.013 },
  { id: 'war_machine', name: 'WAR MACHINE', path: '/assets/war_machine_-_cacw.glb', tag: 'TACTICAL DEFENSE', scale: 0.013 },
  { id: 'mark_1', name: 'MARK I (ORIGIN)', path: '/assets/iron_man_-_mark_1.glb', tag: 'CAVE PROTOCOL', scale: 0.013 },
  { id: 'hulkbuster', name: 'HULKBUSTER', path: '/assets/hulkbuster.glb', tag: 'HEAVY BRAWLER', scale: 0.009 }
];

const ArmorModelRenderer = ({ modelSource, scale = 0.013 }) => {
  const { scene } = useGLTF(modelSource);
  const groupRef = useRef();

  const [isDragging, setIsDragging] = useState(false);
  const [hoveredInfo, setHoveredInfo] = useState(null);
  const velocity = useRef({ x: 0, y: 0.005 });
  const lastMouse = useRef({ x: 0, y: 0 });
  const clearHoverTimeout = useRef(null);
  const spawnProgress = useRef(0);

  // Clone scene so multiple switches don't corrupt materials
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useMemo(() => {
    if (clonedScene) {
      clonedScene.traverse((child) => {
        if (child.isMesh && !child.userData.isWireframeOverlay) {
          // Hide pedestal/base meshes if any
          const name = child.name.toLowerCase();
          if (
            name === 'base' || name === 'pedestal' || name.includes('cylinder') || name === 'plane' ||
            name.includes('_mat_') || name.includes('plane017') || name.includes('plane018') || 
            name.includes('plane019') || name.includes('plane020')
          ) {
            child.visible = false;
          }

          // Holographic Core Material
          child.material = new THREE.MeshStandardMaterial({
            color: '#0a1d3a',       
            emissive: '#0f7bb0',
            emissiveIntensity: 0.9,
            roughness: 0.2,
            metalness: 0.8,         
            transparent: true,
            opacity: 0,
            depthWrite: true,
            polygonOffset: true,    
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1
          });

          // Holographic Wireframe Grid Overlay
          const wireframeMesh = new THREE.Mesh(
            child.geometry,
            new THREE.MeshBasicMaterial({
              color: '#88eeff',
              wireframe: true,
              transparent: true,
              opacity: 0,
              depthWrite: false,
              blending: THREE.AdditiveBlending
            })
          );
          wireframeMesh.raycast = () => null;
          wireframeMesh.userData.isWireframeOverlay = true;
          child.add(wireframeMesh);

          child.updateMatrix();
          child.matrixAutoUpdate = false;
          wireframeMesh.updateMatrix();
          wireframeMesh.matrixAutoUpdate = false;
        }
      });
    }
  }, [clonedScene]);

  // Visual "Grabbed" Effect
  useEffect(() => {
    if (clonedScene) {
      clonedScene.traverse((child) => {
        if (child.isMesh && !child.userData.isWireframeOverlay && child.material) {
          child.material.emissiveIntensity = isDragging ? 1.8 : 0.9;
        }
      });
    }
  }, [isDragging, clonedScene]);

  useFrame(() => {
    if (!groupRef.current) return;
    
    // Holographic Materialize Spawn Animation
    if (spawnProgress.current < 1) {
      spawnProgress.current += 0.02;
      if (spawnProgress.current > 1) spawnProgress.current = 1;
      
      const eased = 1 - Math.pow(1 - spawnProgress.current, 3);
      groupRef.current.position.y = -1.5 + (eased * 1.5);
      
      clonedScene.traverse(child => {
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
      velocity.current.y = velocity.current.y * 0.95 + 0.005 * 0.05;
    }
    
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
      let cleanName = e.object.name.replace(/_/g, ' ').toUpperCase();
      if (cleanName.includes('OBJECT')) cleanName = 'ARMOR PLATE ' + cleanName.split(' ')[1];
      
      let localPoint = e.point.clone();
      if (groupRef.current) {
         localPoint = groupRef.current.worldToLocal(localPoint);
      }

      setHoveredInfo({
         name: cleanName,
         point: localPoint
      });
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
      scale={scale} 
    >
      <Center>
        <Bvh firstHitOnly>
          <primitive object={clonedScene} />
        </Bvh>
      </Center>

      {hoveredInfo && !isDragging && (
        <Html position={hoveredInfo.point} style={{ pointerEvents: 'none' }}>
          <div style={{ position: 'relative', width: 0, height: 0 }}>
            <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '4px', height: '4px', background: '#00f3ff', borderRadius: '50%', boxShadow: '0 0 5px #00f3ff' }} />
            <svg style={{ position: 'absolute', left: 0, top: '-40px', width: '40px', height: '40px', overflow: 'visible' }}>
              <line x1="0" y1="40" x2="40" y2="0" stroke="#00f3ff" strokeWidth="1" />
              <circle cx="40" cy="0" r="2" fill="#00f3ff" />
            </svg>
            <div style={{ 
              position: 'absolute', 
              left: '40px', 
              bottom: '40px', 
              padding: '6px 10px', 
              fontSize: '10px', 
              color: '#fff', 
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-main, monospace)',
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

// Fallback error wrapper for 3D model loading
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.warn("Could not load selected 3D model, falling back to Mark 85", error);
  }
  render() {
    if (this.state.hasError) {
      return <ArmorModelRenderer modelSource={defaultIronManModel} scale={0.013} />;
    }
    return this.props.children;
  }
}

const HoloModelWidget = () => {
  const [selectedIdx, setSelectedIdx] = useState(() => {
    const saved = localStorage.getItem('jarvis_selected_suit');
    const found = ARMOR_REGISTRY.findIndex(a => a.id === saved);
    return found !== -1 ? found : 0;
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeArmor = ARMOR_REGISTRY[selectedIdx] || ARMOR_REGISTRY[0];

  const handleSelectArmor = (idx) => {
    const validIdx = (idx + ARMOR_REGISTRY.length) % ARMOR_REGISTRY.length;
    setSelectedIdx(validIdx);
    localStorage.setItem('jarvis_selected_suit', ARMOR_REGISTRY[validIdx].id);
    setIsMenuOpen(false);
  };

  return (
    <div style={{ 
      position: 'absolute', 
      bottom: '65px', 
      left: '25px', 
      width: '310px', 
      height: '420px', 
      zIndex: 50, 
      overflow: 'visible' 
    }}>
      
      {/* HUD Armor Selector Control Ribbon */}
      <div style={{
        position: 'absolute',
        top: '-15px',
        left: '0',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(2, 10, 25, 0.85)',
        border: '1px solid rgba(0, 243, 255, 0.3)',
        borderRadius: '3px',
        padding: '4px 8px',
        backdropFilter: 'blur(8px)',
        zIndex: 60,
        fontFamily: 'var(--font-main, monospace)'
      }}>
        <button 
          onClick={() => handleSelectArmor(selectedIdx - 1)}
          style={{ background: 'transparent', border: 'none', color: '#00f3ff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
          title="Previous Armor"
        >
          <ChevronLeft size={14} />
        </button>

        <div 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{ cursor: 'pointer', textAlign: 'center', flex: 1, padding: '0 4px' }}
          title="Click to view Armor Vault"
        >
          <div style={{ fontSize: '0.62rem', fontWeight: 'bold', color: '#fff', letterSpacing: '1px', textShadow: '0 0 6px #00f3ff' }}>
            {activeArmor.name}
          </div>
          <div style={{ fontSize: '0.48rem', color: '#00f3ff', letterSpacing: '1px', opacity: 0.8 }}>
            // {activeArmor.tag}
          </div>
        </div>

        <button 
          onClick={() => handleSelectArmor(selectedIdx + 1)}
          style={{ background: 'transparent', border: 'none', color: '#00f3ff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
          title="Next Armor"
        >
          <ChevronRight size={14} />
        </button>

        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{ background: 'transparent', border: 'none', color: isMenuOpen ? '#fff' : '#00f3ff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', marginLeft: '4px' }}
          title="Toggle Armor Vault Grid"
        >
          <Layers size={13} />
        </button>
      </div>

      {/* Armor Vault Dropdown Grid */}
      {isMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '30px',
          left: '0',
          width: '100%',
          background: 'rgba(2, 10, 25, 0.95)',
          border: '1px solid #00f3ff',
          borderRadius: '4px',
          padding: '8px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          zIndex: 70,
          boxShadow: '0 10px 25px rgba(0,0,0,0.8), 0 0 15px rgba(0,243,255,0.2)',
          backdropFilter: 'blur(10px)',
          fontFamily: 'var(--font-main, monospace)'
        }}>
          {ARMOR_REGISTRY.map((armor, idx) => (
            <button
              key={armor.id}
              onClick={() => handleSelectArmor(idx)}
              style={{
                background: selectedIdx === idx ? 'rgba(0, 243, 255, 0.25)' : 'rgba(0, 20, 40, 0.6)',
                border: selectedIdx === idx ? '1px solid #00f3ff' : '1px solid rgba(0, 243, 255, 0.2)',
                color: selectedIdx === idx ? '#fff' : '#88aacc',
                padding: '6px 4px',
                borderRadius: '3px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.55rem',
                fontFamily: 'inherit',
                letterSpacing: '1px',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontWeight: 'bold', color: selectedIdx === idx ? '#00f3ff' : '#fff' }}>
                {armor.name}
              </div>
              <div style={{ fontSize: '0.45rem', opacity: 0.7 }}>
                {armor.tag}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 3D Holographic Canvas */}
      <div style={{ width: '100%', height: '100%', overflow: 'visible', marginTop: '10px' }}>
        <Canvas 
          camera={{ position: [0, 0.1, 8.5], fov: 42 }} 
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#00f3ff" />
          <React.Suspense fallback={null}>
            <ModelErrorBoundary key={activeArmor.id}>
              <ArmorModelRenderer 
                modelSource={activeArmor.file || activeArmor.path} 
                scale={activeArmor.scale} 
              />
            </ModelErrorBoundary>
          </React.Suspense>
        </Canvas>
      </div>
    </div>
  );
};

export default HoloModelWidget;

// Preload default prime model
useGLTF.preload(defaultIronManModel);
