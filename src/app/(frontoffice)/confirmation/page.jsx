"use client";
import React, { useEffect } from "react";
// import Image from "next/image";
import { evangelion, din } from "@/styles/fonts";
import LogoHeader from "@/components/common/LogoHeader";
import LoadingObject from "@/components/common/CentralLoadingObject";
import Countdown from "@/components/common/CountDown";
import { useTours } from "@/hooks/useOptimizedSWR";

export default function ConfirmationPage() {
  useEffect(() => {
    // Animation de confirmation pourrait être ajoutée ici
    const timer = setTimeout(() => {
      // Redirection ou autre action après un délai
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const { data, error } = useTours();

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
    const date = new Date(passedDate.endDate);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();

    return `${day}.${month}.${year}`;
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
        min-h-screen 
        bg-black 
        dnb-bg
        pt-20
        relative
        flex flex-col
        justify-between
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
      <div className="flex flex-col items-center text-center px-4 mt-16">
        <h2 className={`font-din text-2xl font-bold text-white`}>
          VOTRE PARTICIPATION A BIEN <br/>ÉTÉ PRISE EN COMPTE
        </h2>
      </div>

      {/* BLOC EN BAS : Tirage au sort */}
      <div className="text-center text-lg text-white px-6 pb-24">
        <p>
          TIRAGE AU SORT CE SOIR UNE HEURE AVANT LE DEBUT DU CONCERT, LES
          GAGNANTS SERONT DIRECTEMENT CONTACTES PAR MAIL ET SMS
        </p>
        <p className="text-blue-400 mt-2">Bonne chance!</p>
      </div>
    </main>
  );
}
