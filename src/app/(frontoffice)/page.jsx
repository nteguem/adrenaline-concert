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
    const date = new Date(passedDate?.endDate);
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
    <main className={`${din.variable} min-h-screen bg-black dnb-bg`}>
      {/* Conteneur avec overlay pour le contenu qui défile */}
      <div className="content-overlay">
        <div className="min-h-screen flex flex-col">
          
          {!isLoggedIn ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <Login handle={setIsLoggedIn} />
            </div>
          ) : (
            <>
              {/* Header avec espace approprié */}
              <div className="flex-shrink-0">
                <LogoHeader
                  date={formattedDate}
                  venue={data?.data?.tours[0]?.nextEvent.venue}
                  city={data?.data?.tours[0]?.nextEvent.city}
                />
                {/* Espace pour compenser le header fixe */}
                <div className="h-24 sm:h-28 md:h-32 lg:h-36"></div>
              </div>

              {/* Espace flexible pour pousser le contenu vers le bas */}
              <div className="flex-1"></div>
              
              {/* Titre principal */}
              <div className="flex justify-center mb-8 sm:mb-12 md:mb-16 px-4">
                <div className="inline-block bg-white px-3 py-2 sm:px-4 sm:py-2 rounded-sm text-center max-w-[95%] sm:max-w-none">
                  <p className={`${din.className} text-xs sm:text-sm md:text-base lg:text-lg font-bold text-black uppercase leading-tight`}>
                    <span className="block whitespace-nowrap">TENTEZ DE VIVRE L'EXPÉRIENCE</span> 
                    <span className="block whitespace-nowrap">ADRENALINE MAX</span>
                  </p>
                </div>
              </div>

              {/* Formulaire tout en bas */}
              <div className="w-full max-w-md mx-auto px-4 pb-4">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-3 sm:space-y-4 px-2 mb-4">
                    
                    {/* Checkbox 1 */}
                    <div className="flex gap-3 w-full">
                      <input
                        type="checkbox"
                        name="age"
                        checked={formData.age || false}
                        onChange={handleInputChange}
                        className="mt-0.5 flex-shrink-0 w-4 h-4"
                      />
                      <div className="flex-1 text-left">
                        <label className="text-white text-xs sm:text-sm leading-tight block">
                          Je certifie avoir + de 18 ans pour participer au concours
                        </label>
                      </div>
                    </div>

                    {/* Checkbox 2 */}
                    <div className="flex gap-3 w-full">
                      <input
                        type="checkbox"
                        name="santéOk"
                        checked={formData.santéOk || false}
                        onChange={handleInputChange}
                        className="mt-0.5 flex-shrink-0 w-4 h-4"
                      />
                      <div className="flex-1 text-left">
                        <label className="text-white text-xs sm:text-sm leading-tight block">
                          j'atteste ne pas avoir de contre indication médicales
                        </label>
                        <div className="text-gray-300 text-xs mt-1 leading-tight">
                          ( problèmes cardiaques, épilepsie, mobilité réduite, grossesse, vertiges …)
                        </div>
                        <div className="mt-1">
                          <button
                            type="button"
                            className="text-blue-400 text-xs underline hover:text-blue-300 transition-colors"
                          >
                            voir les conditions
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Checkbox 3 */}
                    <div className="flex gap-3 w-full">
                      <input
                        type="checkbox"
                        name="cgu"
                        checked={formData.cgu || false}
                        onChange={handleInputChange}
                        className="mt-0.5 flex-shrink-0 w-4 h-4"
                      />
                      <div className="flex-1 text-left">
                        <label className="text-white text-xs sm:text-sm leading-tight block">
                          J'accepte les conditions générales
                        </label>
                        <div className="mt-1">
                          <button
                            type="button"
                            className="text-blue-400 text-xs underline hover:text-blue-300 transition-colors"
                          >
                            voir conditions et règlement
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bouton tout en bas avec petite marge */}
                  <HeartbeatButton
                    onClick={handleClick}
                    disabled={isButtonDisabled}
                    className={`
                      w-full max-w-[280px] sm:max-w-[300px]
                      mx-auto 
                      transition-colors 
                      ${
                        isButtonDisabled
                          ? "bg-gray-500 text-gray-300 cursor-not-allowed"
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