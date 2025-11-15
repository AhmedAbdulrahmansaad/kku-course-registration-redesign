import React from 'react';

interface KKULogoSVGProps {
  size?: number;
  className?: string;
}

export const KKULogoSVG: React.FC<KKULogoSVGProps> = ({ size = 60, className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Circle */}
        <circle cx="100" cy="100" r="95" fill="#184A2C" stroke="#D4AF37" strokeWidth="3"/>
        
        {/* Inner Circle */}
        <circle cx="100" cy="100" r="80" fill="none" stroke="#D4AF37" strokeWidth="2"/>
        
        {/* Arabic Text Simulation - Top */}
        <path
          d="M60 50 Q100 45 140 50"
          stroke="#D4AF37"
          strokeWidth="3"
          fill="none"
        />
        
        {/* Book/Knowledge Symbol */}
        <rect x="70" y="80" width="60" height="50" rx="3" fill="#D4AF37"/>
        <rect x="75" y="85" width="50" height="40" rx="2" fill="#184A2C"/>
        <line x1="100" y1="85" x2="100" y2="125" stroke="#D4AF37" strokeWidth="2"/>
        <line x1="85" y1="95" x2="95" y2="95" stroke="#D4AF37" strokeWidth="1.5"/>
        <line x1="105" y1="95" x2="115" y2="95" stroke="#D4AF37" strokeWidth="1.5"/>
        <line x1="85" y1="105" x2="95" y2="105" stroke="#D4AF37" strokeWidth="1.5"/>
        <line x1="105" y1="105" x2="115" y2="105" stroke="#D4AF37" strokeWidth="1.5"/>
        <line x1="85" y1="115" x2="95" y2="115" stroke="#D4AF37" strokeWidth="1.5"/>
        <line x1="105" y1="115" x2="115" y2="115" stroke="#D4AF37" strokeWidth="1.5"/>
        
        {/* Crown Symbol */}
        <path
          d="M85 70 L90 75 L95 68 L100 75 L105 68 L110 75 L115 70"
          stroke="#D4AF37"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Bottom Decorative Line */}
        <path
          d="M60 150 Q100 155 140 150"
          stroke="#D4AF37"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Stars */}
        <circle cx="50" cy="100" r="3" fill="#D4AF37"/>
        <circle cx="150" cy="100" r="3" fill="#D4AF37"/>
      </svg>
    </div>
  );
};
