import React, { useEffect, useState } from "react";

interface CountdownProps {
  startDate: string; // Pass start date as a string
}

const Countdown: React.FC<CountdownProps> = ({ startDate }) => {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const countdownDate = new Date(startDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = countdownDate - now;

      // Calculate time left
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (distance < 0) {
        clearInterval(interval);
        setCountdown("The event has started!");
        return;
      }

      // Build the countdown string based on non-zero values
      const timeParts = [];
      if (days > 0) timeParts.push(`${days}d`);
      if (hours > 0) timeParts.push(`${hours}h`);
      if (minutes > 0) timeParts.push(`${minutes}m`);
      if (seconds > 0) timeParts.push(`${seconds}s`);

      // Join the non-zero parts with spaces
      setCountdown(timeParts.join(" ") || "0s"); // Show "0s" if all parts are zero
    }, 1000);

    return () => clearInterval(interval); // Clear the interval on unmount
  }, [startDate]);

  return (
    <div
      style={{
        display: "flex",
        alignSelf: "center",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      Cet événement aura lieu dans {countdown}
    </div>
  );
};

export default Countdown;
