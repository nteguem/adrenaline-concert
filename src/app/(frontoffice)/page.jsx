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
    const date = new Date(passedDate?.eventDate);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    const returnDate = `${day}.${month}.${year}`;
    return returnDate;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérifier que toutes les conditions sont acceptées (sans acc)
    if (!formData.age || !formData.santéOk || !formData.cgu) {
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
    // Ne rien faire si le bouton est désactivé
    if (isButtonDisabled) return;
    
    setIsClicked(true);
    router.push("/video");
  };

  // Vérifier si les 3 checkboxes sont cochées pour griser le bouton
  const isButtonDisabled = !formData.age || !formData.santéOk || !formData.cgu;

  return (
    <main
      style={{ paddingTop: '150px' }}
      className={`
        ${din.variable} 
        min-h-screen 
        bg-black 
        dnb-bg 
        flex 
        items-center 
        justify-center 
        p-2 
        md:p-4
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
            <div className="w-full max-w-md mx-auto -mt-8">
              <div className="mb-12">
                <p
                  className={`${din.className} text-4xl md:text-3xl font-bold text-white mb-3`}
                >
                  ADRÉNALINE MAX
                </p>
                <p className="text-sm md:text-base text-white mb-2">
                  TENTEZ DE VIVRE L'EXPERIENCE
                </p>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-3 px-3 mb-4 mt-14">
                  <div className="flex gap-3 w-full">
                    <input
                      type="checkbox"
                      name="age"
                      checked={formData.age || false}
                      onChange={handleInputChange}
                      className="mt-0.5 flex-shrink-0 w-4 h-4"
                    />
                    <div className="flex-1 text-left">
                      <label className="text-white text-sm md:text-base leading-tight block">
                        Je certifie avoir + de 18 ans pour participer au concours
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full">
                    <input
                      type="checkbox"
                      name="santéOk"
                      checked={formData.santéOk || false}
                      onChange={handleInputChange}
                      className="mt-0.5 flex-shrink-0 w-4 h-4"
                    />
                    <div className="flex-1 text-left">
                      <label className="text-white text-sm md:text-base leading-tight block">
                        J'atteste ne pas avoir de contre indication médicale pour participer à l'Adrénaline MAX
                      </label>
                      <div className="text-gray-300 text-xs mt-1 leading-tight">
                        ( problèmes cardiaques, épilepsie, mobilité réduite, grossesse, vertiges …)
                      </div>
                      <div className="mt-1">
                        <button 
                          type="button" 
                          className="text-blue-400 text-xs underline hover:text-blue-300"
                        >
                          voir les conditions
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full">
                    <input
                      type="checkbox"
                      name="cgu"
                      checked={formData.cgu || false}
                      onChange={handleInputChange}
                      className="mt-0.5 flex-shrink-0 w-4 h-4"
                    />
                    <div className="flex-1 text-left">
                      <label className="text-white text-sm md:text-base leading-tight block">
                        J'accepte les conditions générales
                      </label>
                      <div className="mt-1">
                        <button 
                          type="button" 
                          className="text-blue-400 text-xs underline hover:text-blue-300"
                        >
                          voir conditions et règlement
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <HeartbeatButton
                  onClick={handleClick}
                  disabled={isButtonDisabled}
                  className={`
                    max-w-[300px] 
                    mx-auto 
                    transition-colors 
                    ${isButtonDisabled 
                      ? "bg-gray-500 text-gray-300 cursor-not-allowed opacity-60" 
                      : isClicked 
                        ? "bg-blue-400" 
                        : ""
                    }
                  `}
                >
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