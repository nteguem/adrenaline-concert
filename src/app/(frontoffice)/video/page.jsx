"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import HeartbeatButton from "@/components/common/HeartbeatButton";
import { din } from "@/styles/fonts";
import useSWR from "swr";

const fetcher = (...args) => fetch(...args).then((res) => res.json());
export default function VideoPage() {
  const router = useRouter();
  const [videoEnded, setVideoEnded] = useState(false);

  const { data, error } = useSWR("/api/tours", fetcher);
  let formattedDate = null;

  const hasDatePassed = (startDate) => {
    const currentDate = new Date();
    const tourDate = new Date(startDate);
    // console.log("hasreached:", currentDate < tourDate);
    return currentDate < tourDate;
  };

  const hasDateEnd = (endDate) => {
    const currentDate = new Date();
    const tourDate = new Date(endDate);
    // console.log("hasreached:", currentDate > tourDate);
    return currentDate > tourDate;
  };
  const customdateFormat = (passedDate) => {
    // console.log(passedDate);
    const date = new Date(passedDate.startDate);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear(); // Get full year

    // Format to dd.mm.yyyy
    const returnDate = `${day}.${month}.${year}`;
    // console.log("formatted date:", returnDate);
    return returnDate;
  };

  if (error) return <div>Failed to load</div>;
  if (hasDateEnd(data?.data[0].endDate))
    return <div>La date de participation est passé</div>;
  if (hasDatePassed(data?.data[0].startDate))
    return (
      <div>Date de participation {customdateFormat(data.data[0])} ...</div>
    );
  if (!data) return <div>Loading...</div>;
  else {
    formattedDate = customdateFormat(data.data[0]);
  }

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
    <main
      className={`${din.variable} min-h-screen flex flex-col items-center bg-black text-white`}
    >
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
          <HeartbeatButton onClick={handleNext} horizontal={true}>
            SUIVANT
          </HeartbeatButton>
        </div>
      </div>
    </main>
  );
}
