import React from "react";
import { evangelion } from "@/styles/fonts";

const LogoHeader = ({ venue, date, city }) => {
  const subtitleText =
    date && venue ? `${date} | ${city} - ${venue}` : date || venue || "";

  const getFontSizeClass = (text) => {
    if (!text) return "text-lg sm:text-xl md:text-2xl lg:text-3xl";
    if (text.length > 50) return "text-xs sm:text-sm md:text-base lg:text-lg";
    if (text.length > 30) return "text-sm sm:text-base md:text-lg lg:text-xl";
    return "text-base sm:text-lg md:text-xl lg:text-2xl";
  };

  const getScaleTransform = (text) => {
    if (!text) return "scaleX(1)";
    if (text.length > 60) return "scaleX(0.75)";
    if (text.length > 45) return "scaleX(0.85)";
    return "scaleX(1)";
  };

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <div className="flex flex-col items-center py-2 sm:py-3 md:py-4 px-2">
        
        {/* Titre principal responsive */}
        <h1
          className={`
            ${evangelion.className} 
            text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl
            text-white 
            mb-1 sm:mb-2
            text-center
            leading-tight
            px-1
          `}
          style={{
            // Ajustement automatique si le texte est trop long
            transform: window?.innerWidth < 400 ? "scaleX(0.9)" : "scaleX(1)",
            transformOrigin: "center",
          }}
        >
          ADRENALINE TOUR
        </h1>

        {/* Sous-titre responsive */}
        {subtitleText && (
          <div className="w-full flex justify-center px-2">
            <div
              className={`
                text-center 
                ${getFontSizeClass(subtitleText)} 
                text-white 
                max-w-full
                leading-tight
              `}
              style={{
                transform: getScaleTransform(subtitleText),
                transformOrigin: "center",
                // Gestion du line-break automatique sur mobile
                wordBreak: subtitleText.length > 30 ? "break-word" : "normal",
                hyphens: subtitleText.length > 40 ? "auto" : "none",
              }}
            >
              {/* Affichage conditionnel selon la longueur */}
              {subtitleText.length > 50 ? (
                // Sur les très longs textes, on divise en plusieurs lignes
                <div className="space-y-1">
                  <div>{date}</div>
                  <div className="text-xs sm:text-sm opacity-90">
                    {city} - {venue}
                  </div>
                </div>
              ) : (
                // Texte normal
                <div className="px-1">
                  {subtitleText}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogoHeader;