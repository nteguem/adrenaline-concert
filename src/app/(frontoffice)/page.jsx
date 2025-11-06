"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import LogoHeader from "@/components/common/LogoHeader";
import HeartbeatButton from "@/components/common/HeartbeatButton";
import { evangelion, din } from "@/styles/fonts";
import LoadingObject from "@/components/common/CentralLoadingObject";
import Countdown from "@/components/common/CountDown";
import Login from "../../components/common/Login";
import Checkbox from "@/components/common/Checkbox";
import PopupModal from "@/components/common/PopupModal";
import { useTours } from "@/hooks/useOptimizedSWR";

export default function HomePage() {
  const router = useRouter();
  const [isClicked, setIsClicked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { data, error } = useTours();
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

  // Afficher si (Date.now <= endDate) ET (eventDate <= Date.now)
  const shouldShowForm = (eventISO, endISO) => {
    if (!eventISO || !endISO) return false;
    const now = Date.now();
    const startTs = Date.parse(eventISO);
    const endTs = Date.parse(endISO);
    if (Number.isNaN(startTs) || Number.isNaN(endTs)) return false;
    const cond = now <= endTs && startTs <= now;
    return cond;
  };

  const customdateFormat = (passedDate) => {
    const date = new Date(passedDate?.endDate);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    const returnDate = `${day}.${month}.${year}`;
    return returnDate;
  };

  const formatEndTime = (endDate) => {
    if (!endDate) return null;
    try {
      const date = new Date(endDate);
      if (isNaN(date.getTime())) return null;

      const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Europe/Paris'
      };
      const timeString = date.toLocaleTimeString('fr-FR', options);

      const [hours, minutes] = timeString.split(':');
      return `${hours}h${minutes !== '00' ? minutes : ''}`;
    } catch (error) {
      return null;
    }
  };

  // Fonction pour trouver l'événement avec la endDate la plus proche (mais pas encore passée)
  const getClosestEvent = (tours) => {
    if (!tours || tours.length === 0) return null;

    const now = new Date();
    let closestEvent = null;
    let closestEndDate = null;

    // Parcourir tous les tours et leurs événements
    tours.forEach(tour => {
      if (tour.nextEvent && tour.nextEvent.endDate) {
        const endDate = new Date(tour.nextEvent.endDate);

        // Vérifier que l'événement n'est pas encore terminé
        if (endDate >= now) {
          // Si c'est le premier événement valide ou si sa endDate est plus proche
          if (!closestEndDate || endDate < closestEndDate) {
            closestEvent = tour.nextEvent;
            closestEndDate = endDate;
          }
        }
      }
    });

    return closestEvent;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  // Récupérer l'événement le plus proche parmi tous les tours
  const closestEvent = data?.data?.tours ? getClosestEvent(data.data.tours) : null;

  if (data) {
    if (data?.data?.tours.length > 0) {
      if (!closestEvent) {
        return <LoadingObject text={"le formulaire est clôturé"} />;
      }
      const show = shouldShowForm(closestEvent?.eventDate, closestEvent?.endDate);
      if (!show) return <LoadingObject text={"le formulaire est clôturé"} />;
    } else {
      return <LoadingObject text={"le formulaire est clôturé"} />;
    }
  }

  if (!data) return <LoadingObject text={"Loading ..."} />;

  if (!closestEvent) {
    return <LoadingObject text={"le formulaire est clôturé"} />;
  }

  formattedDate = customdateFormat(closestEvent);

  // Récupérer l'heure de fin de l'événement
  const endTime = closestEvent?.endDate
    ? formatEndTime(closestEvent.endDate)
    : null;

  const handleClick = () => {
    // Valider uniquement au clic
    if (!formData.age || !formData.santéOk || !formData.cgu) {
      setErrorModal({
        isOpen: true,
        title: "Conditions non acceptées",
        message: "Veuillez accepter toutes les conditions pour continuer.",
        type: "error",
      });
      return;
    }
    setIsClicked(true);
    router.push("/registration");
  };

  // Ne pas désactiver le bouton en temps réel; validation au clic uniquement
  const isButtonDisabled = false;

  return (
    <main className={`${din.variable} min-h-screen bg-black dnb-bg`}>
      {/* Conteneur avec overlay pour le contenu qui défile */}
      <div className="content-overlay">
        <div className="min-h-screen flex flex-col">

          {!isLoggedIn ? (
            <div className="flex items-center justify-center h-screen p-4">
              <Login handle={setIsLoggedIn} />
            </div>
          ) : (
            <>
              {/* Header avec espace approprié */}
              <div className="flex-shrink-0">
                <LogoHeader
                  date={formattedDate}
                  venue={closestEvent.venue}
                  city={closestEvent.city}
                />
                {endTime && (
                  <div className="flex justify-center mb-8 sm:mb-12 md:mb-16 px-4">
                    <h1 className="text-white text-sm sm:text-base md:text-lg leading-tight block">
                    Heure limite de participation <span className="text-blue-400 font-bold">{endTime}</span>
                    </h1>
                  </div>
                )}
                {/* Espace pour compenser le header fixe */}
                <div className="h-24 sm:h-28 md:h-32 lg:h-36"></div>
              </div>

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
                        {/* <div className="mt-1">
                          <a
                            href="/conditions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 text-xs underline hover:text-blue-300 transition-colors"
                          >
                            voir les conditions
                          </a>
                        </div> */}
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
                          <a
                            href="/reglement.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            type="application/pdf"
                            className="text-blue-400 text-xs underline hover:text-blue-300 transition-colors"
                          >
                            voir conditions et règlement
                          </a>
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
                      ${isButtonDisabled
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