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
    // console.log("hasreached:", currentDate > tourDate);
    return currentDate > tourDate;
  };

  const customdateFormat = (passedDate) => {
    // console.log(passedDate);
    const date = new Date(passedDate.endDate);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear(); // Get full year

    // Format to dd.mm.yyyy
    const returnDate = `${day}.${month}.${year}`;
    // console.log("formatted date:", returnDate);
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

  // Effet pour simuler la confetti ou animation de succès

  return (
    <main
      className={`
        ${din.variable} 
        min-h-screen 
        bg-black 
        dnb-bg
        pt-20
        relative
      `}
    >
      {/* HEADER EN HAUT */}
      <div className="flex justify-center pt-8">
        <LogoHeader 
          date={formattedDate} 
          venue={data?.data?.tours[0].nextEvent.venue} 
          city={data?.data?.tours[0].nextEvent.city} 
        />
      </div>

      {/* BLOC CENTRÉ : Message confirmation */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md w-full text-center" style={{ top: '62%' }}>
        <div className="w-full">
          <h2 className={`font-din text-2xl font-bold text-white`}>
            VOTRE PARTICIPATION A BIEN <br/>ÉTÉ PRISE EN COMPTE
          </h2>
        </div>
      </div>

      {/* BLOC EN BAS : Tirage au sort */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 max-w-md w-full text-center text-lg text-white px-6">
        <p>
          TIRAGE AU SORT CE SOIR UNE HEURE AVANT LE DEBUT DU CONCERT, LES
          GAGNANTS SERONT DIRECTEMENT CONTACTES PAR MAIL ET SMS
        </p>
        <p className="text-blue-400 mt-2">Bonne chance!</p>
      </div>
    </main>
  );
}