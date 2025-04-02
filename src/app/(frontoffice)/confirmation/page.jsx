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

  if (error) return <LoadingObject text={"Failed to load"} />;
  if (hasDateEnd(data?.data[0].endDate))
    return <LoadingObject text={"La date de participation est passé"} />;
  if (hasDatePassed(data?.data[0].startDate)) {
    return <Countdown startDate={data?.data[0].startDate} />;
  }

  if (!data) return <LoadingObject text={"Loading ..."} />;
  else {
    formattedDate = customdateFormat(data.data[0]);
  }
  // Effet pour simuler la confetti ou animation de succès

  return (
    <main
      className={`
        ${din.variable} 
        flex 
        min-h-screen 
        flex-col 
        items-center 
        justify-center 
        p-6 
        bg-black 
        dnb-bg
        pt-20  // Ajouté pour compenser l'en-tête fixe
      `}
    >
      <div className="max-w-md w-full mx-auto flex flex-col items-center justify-center text-center">
        <LogoHeader date={formattedDate} venue={data.data[0].name} />

        <div className="w-full mb-8">
          <h2 className={`font-din text-2xl font-bold mb-6`}>
            TA PARTICIPATION A BIEN ÉTÉ
            <br />
            PRISE EN COMPTE
          </h2>
          <div className="text-lg">
            <p className="mb-2">
              Nous vous contacterons si vous êtes sélectionné!
            </p>
            <p className="text-blue-400">Bonne chance!</p>
          </div>
        </div>
      </div>
    </main>
  );
}
