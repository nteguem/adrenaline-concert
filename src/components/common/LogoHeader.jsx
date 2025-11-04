import React from "react";
import { evangelion } from "@/styles/fonts";

const LogoHeader = ({ venue, date, city }) => {
  const subtitleText =
    date && venue ? `${date} | ${city} - ${venue}` : date || venue || "";

  // Fonction améliorée pour diminuer plus la taille des textes longs
  const getFontSize = (text) => {
    if (!text) return "text-3xl";
    if (text.length > 70) return "text-sm";   // Très long = très petit
    if (text.length > 50) return "text-base"; // Long = petit
    if (text.length > 30) return "text-lg";   // Moyen = moyen
    return "text-2xl";                        // Court = grand
  };

  return (
    <div className="w-full z-50">
      <div className="flex flex-col items-center py-4">

        {/* EXACTEMENT le même titre que registration */}
        <h1
          className={`${evangelion.className} text-6xl text-white mb-1 text-center`}
        >
          ADRENALINE TOUR
        </h1>

        {/* Sous-titre responsive qui s'adapte sans se couper */}
        {subtitleText && (
          <div className="w-full flex justify-center px-2">
            <div
              className={`text-center ${getFontSize(subtitleText)} text-white max-w-full leading-tight`}
              style={{
                transform:
                  subtitleText.length > 60
                    ? "scaleX(0.75)"
                    : subtitleText.length > 45
                    ? "scaleX(0.85)"
                    : subtitleText.length > 30
                    ? "scaleX(0.9)"
                    : "scaleX(1)",
                transformOrigin: "center",
                wordWrap: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {subtitleText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogoHeader;