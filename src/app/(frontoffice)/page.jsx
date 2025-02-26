"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import LogoHeader from "@/components/common/LogoHeader";
import HeartbeatButton from "@/components/common/HeartbeatButton";
import { evangelion, din } from "@/styles/fonts";

export default function HomePage() {
  const router = useRouter();
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    router.push("/video");
  };

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
      <div className="
        w-full 
        max-w-xl 
        mx-auto 
        flex 
        flex-col 
        items-center 
        justify-center 
        text-center
      ">
        <LogoHeader date="08.11.25" venue="AMNEVILLE" />
        
        <div className="w-full max-w-md mx-auto">          
          <div className="mb-8">
            <p className="text-base md:text-lg text-white mb-2">
              TENTEZ DE VIVRE L'EXPERIENCE
            </p>
            <p 
              className={`
                ${evangelion.className} 
                text-xl md:text-2xl 
                font-bold 
                text-white 
                mb-6
              `}
            >
              ADRÉNALINE MAX
            </p>
          </div>
          
          <HeartbeatButton
            onClick={handleClick}
            className={`
              w-full 
              max-w-[300px] 
              mx-auto 
              transition-colors 
              ${isClicked ? "bg-blue-400" : ""}
            `}
          >
            08.11.25 AMNEVILLE
          </HeartbeatButton>
          
        </div>
      </div>
    </main>
  );
}