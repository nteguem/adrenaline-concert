import React from "react";
import { evangelion } from "@/styles/fonts";

const LogoHeader = ({ venue, date }) => {
  return (
    <div className="fixed top-0 left-0 w-full z-50 flex flex-col items-center py-4">
      <h1
        className={`${evangelion.className} text-6xl text-white mb-1 space-x-0`}
      >
        ADRENALINE
      </h1>
      <span className={`${evangelion.className} text-3xl mb-2 tracking-wide`}>
        TOUR
      </span>
      {(venue || date) && (
        <div className="text-center text-lg">
          {date && venue ? `${date} | ${venue}` : date || venue}
        </div>
      )}
    </div>
  );
};

export default LogoHeader;
