"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import HeartbeatButton from "@/components/common/HeartbeatButton";
import { din } from "@/styles/fonts";
import useSWR from "swr";
import LoadingObject from "@/components/common/CentralLoadingObject";
import Countdown from "@/components/common/CountDown";

const fetcher = (...args) => fetch(...args).then((res) => res.json());
export default function VideoPage() {
  const router = useRouter();
  const [videoEnded, setVideoEnded] = useState(false);

  const { data, error } = useSWR("/api/tours/tour_event", fetcher);
  let formattedDate = null;

  const hasDatePassed = (startDate) => {
    const currentDate = new Date();
    const tourDate = new Date(startDate);
    tourDate.setHours(
      tourDate.getHours(),
      tourDate.getMinutes(),
      tourDate.getSeconds(),
      0
    );
    return currentDate < tourDate;
  };

  const hasDateEnd = (endDate) => {
    const currentDate = new Date();
    const tourDate = new Date(endDate);
    tourDate.setHours(
      tourDate.getHours(),
      tourDate.getMinutes(),
      tourDate.getSeconds(),
      0
    );
    return currentDate > tourDate;
  };
  const customdateFormat = (passedDate) => {
    // console.log(passedDate);
    const date = new Date(passedDate?.eventDate);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear(); // Get full year

    // Format to dd.mm.yyyy
    const returnDate = `${day}.${month}.${year}`;
    return returnDate;
  };

  if (error) return <LoadingObject text={"Failed to load"} />;

  // if (hasDateEnd(data?.data?.tours[0]?.nextEvent?.endDate))
  //   return <LoadingObject text={"La date de participation est passé"} />;
  // if (hasDatePassed(data?.data?.tours[0]?.nextEvent?.eventDate)) {
  //   return <Countdown startDate={data?.data?.tours[0]?.eventDate} />;
  // }
  if (data) {
    // console.log("data length", data?.data?.tours.length);
    if (data?.data?.tours.length > 0) {
      if (hasDateEnd(data?.data?.tours[0]?.nextEvent.endDate))
        return <LoadingObject text={"le formulaire est clôturé"} />;
      if (hasDatePassed(data?.data?.tours[0]?.nextEvent.eventDate)) {
        const tourDate = new Date(data?.data?.tours[0]?.nextEvent.eventDate);
        tourDate.setHours(8, 0, 0, 0);
        return <Countdown startDate={tourDate} />;
      }
    } else if (data?.data?.tours.length === 0) {
      return <LoadingObject text={"le formulaire est clôturé"} />;
    } else {
      return <LoadingObject text={"le formulaire est clôturé"} />;
    }
  }

  if (!data) return <LoadingObject text={"Loading ..."} />;
  else {
    formattedDate = customdateFormat(data.data?.tours[0].nextEvent);
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
        <div className="flex-1 flex flex-col justify-center items-center gap-[10%]">
          <div className="flex justify-center p-7 bg-blue-600 rounded-md w-[90%]">
            VIDEO MATT QUI TEASE SUR L’EXPERIENCE
          </div>
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
