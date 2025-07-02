"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import LogoHeader from "@/components/common/LogoHeader";
import HeartbeatButton from "@/components/common/HeartbeatButton";
import { evangelion, din } from "@/styles/fonts";
import useSWR from "swr";
import LoadingObject from "@/components/common/CentralLoadingObject";
import Countdown from "@/components/common/CountDown";
import Login from "../../components/common/Login";
import Checkbox from "@/components/common/Checkbox";
import PopupModal from "@/components/common/PopupModal";

const fetcher = (...args) => fetch(...args).then((res) => res.json());
export default function HomePage() {
  const router = useRouter();
  const [isClicked, setIsClicked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { data, error } = useSWR("/api/tours/tour_event", fetcher);
  const [formData, setFormData] = useState({
    confirmePresence: false,
    age: false,
    santéOk: false,
    cgu: false,
    acc: false,
  });
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });
  const closeModal = () => {
    setErrorModal({ ...errorModal, isOpen: false });
  };

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
    // console.log("formatted date:", returnDate);
    return returnDate;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérifier que toutes les conditions sont acceptées
    if (!formData.age || !formData.santéOk || !formData.cgu || !formData.acc) {
      setErrorModal({
        isOpen: true,
        title: "Conditions non acceptées",
        message: "Veuillez accepter toutes les conditions pour continuer.",
        type: "error",
      });
      return;
    }
  };
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  if (error) return <LoadingObject text={"Failed to load"} />;
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
    formattedDate = customdateFormat(data?.data?.tours[0]?.nextEvent);
  }

  const handleClick = () => {
    setIsClicked(true);
    if (!formData.age || !formData.santéOk || !formData.cgu || !formData.acc) {
      setErrorModal({
        isOpen: true,
        title: "Conditions non acceptées",
        message: "Veuillez accepter toutes les conditions pour continuer.",
        type: "error",
      });
      return;
    } else {
      router.push("/video");
    }
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
        {!isLoggedIn ? (
          <Login handle={setIsLoggedIn} />
        ) : (
          <>
            <LogoHeader
              date={formattedDate}
              venue={data?.data?.tours[0]?.name}
            />
            <div className="w-full max-w-md mx-auto mt-[40%]">
              <div className="mb-8">
                <p
                  className={`${din.className} text-4xl md:text-2xl font-bold text-white mb-6`}
                >
                  ADRÉNALINE MAX
                </p>
                <p className="text-base md:text-lg text-white mb-2">
                  TENTEZ DE VIVRE L'EXPERIENCE
                </p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="space-y-3 px-3">
                  <Checkbox
                    label="Je certifie avoir + de 18 ans pour participer au concours"
                    name="age"
                    onChange={handleInputChange}
                    checked={formData.age || false}
                    className="w-full"
                  />
                  <Checkbox
                    label="J'atteste ne pas avoir de contre indication médicale pour participer à l'Adrénaline MAX"
                    name="santéOk"
                    subLabel=" ( problèmes cardiaques, épilepsie, mobilité réduite, grossesse, vertiges …)"
                    linkText="voir les conditions"
                    onChange={handleInputChange}
                    checked={formData.santéOk || false}
                    className="w-full "
                  />
                  <Checkbox
                    label="J'accepte les conditions générales"
                    name="cgu"
                    linkText="voir conditions et règlement"
                    onChange={handleInputChange}
                    checked={formData.cgu || false}
                    className="w-full"
                  />
                  <Checkbox
                    label="MES INFORMATIONS SONT CORRECTES"
                    name="acc"
                    onChange={handleInputChange}
                    checked={formData.acc || false}
                    className="w-full"
                  />
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
                  {/* {formattedDate} {data.data[0].name} */}
                  {"ENTREZ"}
                </HeartbeatButton>
              </form>
            </div>
          </>
        )}
      </div>
      <PopupModal
        isOpen={errorModal.isOpen}
        onClose={closeModal}
        title={errorModal.title}
        message={errorModal.message}
        type={errorModal.type}
      />
    </main>
  );
}
