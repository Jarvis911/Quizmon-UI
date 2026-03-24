import React from 'react';

const KnowledgeGlobeSVG = ({ className = "" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 600 600" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`w-full h-full animate-[spin_60s_linear_infinite] origin-center ${className}`}
    >
      <defs>
        <linearGradient id="globeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
        </linearGradient>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer Rings */}
      <circle cx="300" cy="300" r="280" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="10 10" />
      <circle cx="300" cy="300" r="290" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2" />

      {/* Main Sphere Lines */}
      <g fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5">
        <circle cx="300" cy="300" r="240" stroke="url(#globeGrad)" strokeWidth="2" strokeOpacity="0.5" />
        <ellipse cx="300" cy="300" rx="120" ry="240" />
        <ellipse cx="300" cy="300" rx="60" ry="240" strokeOpacity="0.15" />
        <ellipse cx="300" cy="300" rx="240" ry="120" />
        <ellipse cx="300" cy="300" rx="240" ry="60" strokeOpacity="0.15" />
      </g>

      {/* Connecting Network / Neural Paths */}
      <g stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" fill="none">
        <path d="M 150 150 L 220 200 L 280 180 L 350 240 L 450 180" />
        <path d="M 220 200 L 200 280 L 260 320 L 320 280 L 350 240" />
        <path d="M 260 320 L 220 400 L 300 450 L 380 390 L 320 280" />
        <path d="M 450 180 L 420 280 L 480 350 L 380 390" />
      </g>

      {/* Network Nodes */}
      <g fill="currentColor" opacity="0.8">
        <circle cx="150" cy="150" r="4" />
        <circle cx="220" cy="200" r="5" />
        <circle cx="280" cy="180" r="3" />
        <circle cx="350" cy="240" r="6" />
        <circle cx="450" cy="180" r="4" />
        <circle cx="200" cy="280" r="4" />
        <circle cx="260" cy="320" r="7" />
        <circle cx="320" cy="280" r="3" />
        <circle cx="220" cy="400" r="5" />
        <circle cx="300" cy="450" r="4" />
        <circle cx="380" cy="390" r="6" />
        <circle cx="420" cy="280" r="3" />
        <circle cx="480" cy="350" r="5" />
      </g>

      {/* Node Glowing Accents */}
      <circle cx="350" cy="240" r="15" fill="url(#nodeGlow)" opacity="0.6" />
      <circle cx="260" cy="320" r="18" fill="url(#nodeGlow)" opacity="0.5" />
      <circle cx="380" cy="390" r="15" fill="url(#nodeGlow)" opacity="0.6" />

      {/* Floating Particles / Stars */}
      <g fill="currentColor" opacity="0.5">
        <circle cx="120" cy="280" r="2" />
        <circle cx="180" cy="100" r="1.5" />
        <circle cx="480" cy="120" r="2.5" />
        <circle cx="520" cy="280" r="1" />
        <circle cx="450" cy="480" r="2" />
        <circle cx="150" cy="480" r="1.5" />
      </g>

      {/* DNA Helix Abstract Silhouette */}
      <g opacity="0.4" stroke="#0ea5e9" strokeWidth="2.5" fill="none">
        <path d="M 220 500 Q 260 460, 300 500 T 380 500" />
        <path d="M 220 500 Q 260 540, 300 500 T 380 500" />
        <line x1="240" y1="486" x2="240" y2="514" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="260" y1="478" x2="260" y2="522" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="280" y1="486" x2="280" y2="514" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="320" y1="486" x2="320" y2="514" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="340" y1="478" x2="340" y2="522" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="360" y1="486" x2="360" y2="514" strokeWidth="1" strokeOpacity="0.5" />
      </g>
      
      {/* Abstract Book/Page Flying */}
      <g stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5">
        <path d="M 100 200 L 130 180 L 160 200 L 130 220 Z" />
        <path d="M 100 200 C 110 190, 120 190, 130 220" />
        
        <path d="M 450 100 L 480 80 L 510 100 L 480 120 Z" />
        <path d="M 450 100 C 460 90, 470 90, 480 120" />
      </g>
    </svg>
  );
};

export default KnowledgeGlobeSVG;
