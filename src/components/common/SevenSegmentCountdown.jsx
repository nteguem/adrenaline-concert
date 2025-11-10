"use client";
import React, { useEffect, useState } from "react";

const SevenSegmentCountdown = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      
      if (isNaN(end)) {
        console.error("Invalid endDate:", endDate);
        return;
      }

      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
        return;
      }

      setIsExpired(false);

      // Calculer les jours, heures, minutes et secondes restantes
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  // Style 7-segment authentique comme l'image 2
  const SegmentDigit = ({ value, label }) => {
    const digits = String(value).padStart(2, "0").split("");
    return (
      <div className="flex flex-col items-center">
        <div className="flex" style={{ gap: "0.05em" }}>
          {digits.map((digit, idx) => (
            <div
              key={idx}
              className="relative"
              style={{
                fontFamily: "'DS-Digital', 'Courier New', monospace",
                fontSize: "clamp(1rem, 2.5vw, 2rem)",
                fontWeight: "normal",
                color: "#ffffff",
                letterSpacing: "0",
                lineHeight: "1",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {digit}
            </div>
          ))}
        </div>
        <div 
          className="text-white"
          style={{
            fontSize: "clamp(0.5rem, 1.2vw, 0.8rem)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: "500",
            marginTop: "clamp(0.25rem, 0.5vw, 0.5rem)",
            color: "#ffffff",
          }}
        >
          {label}
        </div>
      </div>
    );
  };

  if (isExpired) {
    return (
      <div className="flex justify-center items-center bg-black px-3 py-2">
        <div className="text-white text-sm sm:text-base">
          Le délai est expiré
        </div>
      </div>
    );
  }

  // Afficher conditionnellement : JOUR seulement si > 0, sinon HR : MIN : SEC
  const timeUnits = [];
  if (timeLeft.days > 0) {
    timeUnits.push({ value: timeLeft.days, label: "JOUR" });
  }
  timeUnits.push({ value: timeLeft.hours, label: "HR" });
  timeUnits.push({ value: timeLeft.minutes, label: "MIN" });
  timeUnits.push({ value: timeLeft.seconds, label: "SEC" });

  return (
    <div className="flex flex-col items-center justify-center bg-black px-3 py-2">
      <div className="flex items-start" style={{ gap: "clamp(0.25rem, 0.5vw, 0.5rem)" }}>
        {timeUnits.map((unit, index) => (
          <React.Fragment key={unit.label}>
            <SegmentDigit value={unit.value} label={unit.label} />
            {index < timeUnits.length - 1 && (
              <div
                className="text-white"
                style={{
                  fontFamily: "'DS-Digital', 'Courier New', monospace",
                  fontSize: "clamp(1rem, 2.5vw, 2rem)",
                  fontWeight: "normal",
                  lineHeight: "1",
                }}
              >
                :
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default SevenSegmentCountdown;
