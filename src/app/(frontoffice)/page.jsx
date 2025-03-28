"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import LogoHeader from "@/components/common/LogoHeader";
import HeartbeatButton from "@/components/common/HeartbeatButton";
import { evangelion, din } from "@/styles/fonts";
import useSWR from "swr";

const fetcher = (...args) => fetch(...args).then((res) => res.json());
export default function HomePage() {
  const router = useRouter();
  const [isClicked, setIsClicked] = useState(false);
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
      <div
        className="
        w-full 
        max-w-xl 
        mx-auto 
        flex 
        flex-col 
        items-center 
        justify-center 
        text-center
      "
      >
        <LogoHeader date={formattedDate} venue={data.data[0].name} />

        <div className="w-full max-w-md mx-auto mt-[65%]">
          <div className="mb-8">
            <p className="text-base md:text-lg text-white mb-2">
              TENTEZ DE VIVRE L'EXPERIENCE
            </p>
            <p
              className={`
                ${din.className} 
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
              max-w-[300px] 
              mx-auto 
              transition-colors 
              ${isClicked ? "bg-blue-400" : ""}
            `}
          >
            {formattedDate} {data.data[0].name}
          </HeartbeatButton>
        </div>
      </div>
    </main>
  );
}
