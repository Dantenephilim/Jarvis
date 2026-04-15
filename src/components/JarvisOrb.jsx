import React from 'react';
import './JarvisOrb.css';

const JarvisOrb = ({ state = 'idle' }) => {
  // We'll add decorative text segments
  const decoTexts = ["GAME MODE", "CTRL", "DOCS", "DEVEL", "SYNC", "MEM", "ACCH"];

  return (
    <div className={`arc-reactor-container ${state}`}>
      {/* 9: Massive bounding rings */}
      <div className="ring-9-gigantic ring-layer"></div>

      {/* Layer 8: The extreme outermost bounding box ring with tick marks */}
      <div className="ring-8-outermost ring-layer">
        {decoTexts.map((txt, i) => (
          <div key={i} className="deco-label" style={{ transform: `rotate(${i * 51}deg) translateY(-270px)` }}>
            <span>{txt}</span>
          </div>
        ))}
      </div>

      {/* Layer 7: Dashed outer block boundary */}
      <div className="ring-7-outer-blocks ring-layer"></div>

      {/* Layer 6: Calibration Crosshairs */}
      <div className="ring-6-calibration ring-layer">
        <div className="calibration-marks"></div>
      </div>

      {/* Layer 5: Data Bars / Equalizer lines using conic gradient masking */}
      <div className="ring-5-data-blocks ring-layer"></div>

      {/* Layer 4: Dotted Cyan lines */}
      <div className="ring-4-dotted ring-layer"></div>

      {/* Layer 3: Vibrant Orange Data Accents */}
      <div className="ring-3-orange ring-layer"></div>

      {/* Layer 2: Complex segmented gradient ring */}
      <div className="ring-2-segments ring-layer"></div>

      {/* Layer 1: Dashed Inner Ring */}
      <div className="ring-1-dashed ring-layer"></div>

      {/* Central Core Numeral & Text */}
      <div className="reactor-center ring-layer">
        <span className="giant-number" style={{ fontSize: '1.4rem', letterSpacing: '4px' }}>J.A.R.V.I.S.</span>
      </div>
      
      {/* Dark underlying core separator */}
      <div className="core-inner-dark ring-layer"></div>

      {/* Radar Sweep Effect */}
      <div className="scanner-radar ring-layer"></div>
    </div>
  );
};

export default JarvisOrb;
