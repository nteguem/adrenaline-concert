"use client";
import React, { useState } from 'react';

const HeartbeatButton = ({
  children = "SUIVANT",
  onClick,
  className = "",
  speed = 2
}) => {
  const [isClicked, setIsClicked] = useState(false);
  
  const handleClick = () => {
    setIsClicked(true);
    if (onClick) onClick();
  };
  
  return (
    <div className="relative w-full h-24 bg-transparent flex items-center justify-center overflow-hidden">
      {/* Animation ECG qui se dessine progressivement */}
      <div className="absolute inset-0 flex items-center pointer-events-none">
        <div className="relative w-full h-full flex items-center">
          {/* Ligne ECG qui se dessine progressivement - avec zone de dessin limitée */}
          <svg className="absolute w-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
            <defs>
              <clipPath id="button-area">
                {/* Cette zone définit où l'animation est visible */}
                <rect x="0" y="15" width="1000" height="70" />
              </clipPath>
            </defs>
            
            <g clipPath="url(#button-area)">
              <path
                d="M0,20 
                    L40,80 
                    L80,20 
                    L120,80
                    L160,20
                    L200,80
                    L240,20 
                    L280,80 
                    L320,20
                    L360,80
                    L400,20 
                    L440,80 
                    L480,20
                    L520,80
                    L560,20 
                    L600,80 
                    L640,20
                    L680,80
                    L720,20 
                    L760,80 
                    L800,20
                    L840,80
                    L880,20 
                    L920,80 
                    L960,20
                    L1000,80"
                stroke="white"
                strokeWidth="2"
                fill="none"
                className="ecg-drawing-white"
                style={{ animationDuration: `${speed}s` }}
              />
            </g>
          </svg>
        </div>
      </div>
      
      {/* Effet de lueur */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full relative">
          <div className="absolute left-1/2 top-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 bg-white blur-2xl opacity-30"></div>
        </div>
      </div>
      
      {/* Bouton central - la couleur change au clic */}
      <button
        onClick={handleClick}
        className={`
          text-white font-bold py-3 px-12 rounded-md z-10 transition-all duration-300
          ${isClicked ? 'bg-sky-300/90' : 'bg-blue-600 hover:bg-blue-700'}
          ${className}
        `}
      >
        {children}
      </button>
      
      <style jsx>{`
        @keyframes draw-ecg-white {
          0% {
            stroke-dashoffset: 2000;
            opacity: 0.8;
          }
          95% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0.8;
          }
        }
        
        .ecg-drawing-white {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: draw-ecg-white linear infinite;
          filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.8));
        }
      `}</style>
    </div>
  );
};

export default HeartbeatButton;