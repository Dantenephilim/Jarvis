import React from 'react';
import './JarvisOrb.css';

const JarvisOrb = ({ state = 'idle' }) => {
  // Decorative text segments for the outer ring
  const decoTexts = ["GAME MODE", "CTRL", "DOCS", "DEVEL", "SYNC", "MEM", "ACCH"];

  return (
    <div className={`arc-reactor-container ${state}`}>
      {/* Background Decorative Rings */}
      <div className="ring-9-gigantic ring-layer"></div>
      <div className="ring-8-outermost ring-layer">
        {decoTexts.map((txt, i) => (
          <div key={i} className="deco-label" style={{ transform: `rotate(${i * 51}deg) translateY(-270px)` }}>
            <span>{txt}</span>
          </div>
        ))}
      </div>

      <div className="ring-7-outer-blocks ring-layer"></div>
      <div className="ring-6-calibration ring-layer">
        <div className="calibration-marks"></div>
      </div>

      <div className="ring-5-data-blocks ring-layer"></div>
      <div className="ring-4-dotted ring-layer"></div>
      <div className="ring-3-orange ring-layer"></div>
      <div className="ring-2-segments ring-layer"></div>
      <div className="ring-1-dashed ring-layer"></div>

      {/* New Tactical Shield Rings */}
      <div className="shield-ring-1 ring-layer"></div>
      <div className="shield-ring-2 ring-layer"></div>

      {/* Central Core Numeral & Text */}
      <div className="reactor-center ring-layer">
        <div className="hex-pattern"></div>
        <span className="giant-number">J.A.R.V.I.S.</span>
      </div>
      
      <div className="core-inner-dark ring-layer"></div>

      {/* Primary & Secondary Scanners */}
      <div className="scanner-radar ring-layer"></div>
      <div className="scanner-radar secondary ring-layer"></div>

      {/* Data Noise Dots */}
      <div className="data-shards ring-layer"></div>
    </div>
  );
};

export default JarvisOrb;

