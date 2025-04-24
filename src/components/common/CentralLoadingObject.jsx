import React from "react";
import { din } from "@/styles/fonts";

function CentralLoadingObject({ text }) {
  return (
    <main
      className={`
        ${din.variable} 
        min-h-screen 
        bg-black 
        dnb-bg 
        flex 
        items-center 
        justify-center 
        p-4 
        md:p-6
        pt-20  // Ajoutez ce padding pour compenser l'en-tête fixe
      `}
    >
      <div
        style={{
          display: "flex",
          alignSelf: "center",
          flexDirection: "column",
          justifyContent: "space-between",
          textTransform: "uppercase",
        }}
      >
        {text}
      </div>
    </main>
  );
}

export default CentralLoadingObject;
