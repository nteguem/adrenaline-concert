"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import HeartbeatButton from "@/components/common/HeartbeatButton";
import { din } from "@/styles/fonts";

export default function VideoPage() {
  const router = useRouter();
  const [videoEnded, setVideoEnded] = useState(false);

  const handleNext = () => {
    setTimeout(() => {
      router.push("/registration");
    }, 300);
  };

  // Fonction pour gérer la fin de la vidéo
  const handleVideoEnd = () => {
    setVideoEnded(true);
  };

  return (
    <main className={`${din.variable} min-h-screen flex flex-col items-center bg-black text-white`}>
      <div className="flex flex-col w-full h-screen max-w-md mx-auto justify-between py-10">
        {/* Espace pour la vidéo */}
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="w-full aspect-video bg-black relative">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/8KtxwR0plj0?autoplay=1&mute=1&enablejsapi=1"
              title="Mat pokora adrenaline tour"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onEnded={handleVideoEnd}
            ></iframe>
          </div>
        </div>

        {/* Bouton SUIVANT */}
        <div className="w-full mt-auto">
          <HeartbeatButton
            onClick={handleNext}
            horizontal={true}
          >
            SUIVANT
          </HeartbeatButton>
        </div>
      </div>
    </main>
  );
}