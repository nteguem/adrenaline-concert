"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import { evangelion, din } from "@/styles/fonts";
import LogoHeader from "@/components/common/LogoHeader";
import useSWR from "swr";
import LoadingObject from "@/components/common/CentralLoadingObject";
import Countdown from "@/components/common/CountDown";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function ConfirmationPage() {
  useEffect(() => {
    // Animation de confirmation pourrait être ajoutée ici
    const timer = setTimeout(() => {
      // Redirection ou autre action après un délai
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

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
    const date = new Date(passedDate.eventDate);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();

    const returnDate = `${day}.${month}.${year}`;
    return returnDate;
  };

  if (error) return <LoadingObject text={"Failed to load"} />;

  if (data) {
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
    formattedDate = customdateFormat(data.data.tours[0].nextEvent);
  }

  return (
    <main
      className={`
        ${din.variable} 
        flex 
        min-h-screen 
        flex-col 
        items-center 
        justify-between
        bg-black 
        dnb-bg
        py-8
      `}
    >
      {/* En-tête - reste en haut */}
      <div className="w-full max-w-md mx-auto flex justify-center">
        <LogoHeader
          date={formattedDate}
          venue={data?.data?.tours[0].nextEvent.venue}
          city={data?.data?.tours[0]?.nextEvent.city}
        />
      </div>

      {/* Bloc H2 - remonté vers le logo */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center text-center -mt-8 sm:-mt-12 md:-mt-16">
        <h2 className={`font-din text-xl sm:text-2xl md:text-3xl font-bold`}>
          VOTRE PARTICIPATION A BIEN <br />
          ÉTÉ PRISE EN COMPTE
        </h2>
      </div>

      {/* Bloc du bas - descendu encore plus */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center text-center mb-4 sm:mb-8 md:mb-12">
        <div className="text-sm sm:text-base md:text-lg">
          <p>
            TIRAGE AU SORT CE SOIR UNE HEURE AVANT LE DEBUT DU CONCERT, LES
            GAGNANTS SERONT DIRECTEMENT CONTACTES PAR MAIL ET SMS
          </p>
          <p className="text-blue-400 mt-2">Bonne chance!</p>
        </div>
      </div>
    </main>
  );
}