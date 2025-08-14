import React from "react";
import { evangelion } from "@/styles/fonts";

const LogoHeader = ({ venue, date, city }) => {
  const subtitleText =
    date && venue ? `${date} | ${city} - ${venue}` : date || venue || "";

  // EXACTEMENT la même fonction que registration
  const getFontSize = (text) => {
    if (!text) return "text-3xl";
    if (text.length > 50) return "text-lg";
    if (text.length > 30) return "text-2xl";
    return "text-3xl";
  };

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <div className="flex flex-col items-center py-4">
        
        {/* EXACTEMENT le même titre que registration */}
        <h1
          className={`${evangelion.className} text-6xl text-white mb-1 text-center`}
        >
          ADRENALINE TOUR
        </h1>

        {/* EXACTEMENT le même sous-titre que registration */}
        {subtitleText && (
          <div
            className={`text-center ${getFontSize(subtitleText)} text-white whitespace-nowrap px-4 max-w-full`}
            style={{
              transform:
                subtitleText.length > 60
                  ? "scaleX(0.85)"
                  : subtitleText.length > 45
                  ? "scaleX(0.9)"
                  : "scaleX(1)",
              transformOrigin: "center",
            }}
          >
            {subtitleText}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogoHeader;