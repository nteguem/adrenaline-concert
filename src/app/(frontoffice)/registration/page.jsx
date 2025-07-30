"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import LogoHeader from "@/components/common/LogoHeader";
import Input from "@/components/common/Input";
import Checkbox from "@/components/common/Checkbox";
import FileUpload from "@/components/common/FileUpload";
import Button from "@/components/common/Button";
import PopupModal from "@/components/common/PopupModal";
import { din } from "@/styles/fonts";
import useSWR from "swr";
import LoadingObject from "@/components/common/CentralLoadingObject";
import Countdown from "@/components/common/CountDown";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getYear, getMonth } from "date-fns";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function RegistrationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    dateNaissance: "",
    email: "",
    phone: "",
    confirmePresence: false,
    age: false,
    santéOk: false,
    cgu: false,
    acc: false,
  });
  const [formStep, setFormStep] = useState(1);
  const [ticketImage, setTicketImage] = useState(null);
  const [ticketFileName, setTicketFileName] = useState("");
  const [ocrData, setOcrData] = useState(null);
  const [ocrFailed, setOcrFailed] = useState(false);
  
  // État dynamique pour les champs de placement
  const [placementData, setPlacementData] = useState({});
  
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });
  const [ocrLoad, setOcrLoad] = useState(false);
  const [ocrErrorMessage, setOcrErrorMessage] = useState("");
  const [ocrStatus, setOcrStatus] = useState(null);
  const [ocrStatusMessage, setOcrStatusMessage] = useState("");
  const uploadAttemptsRef = useRef(0);
  const fileUploadKeyRef = useRef(0);
  const { data, error } = useSWR("/api/tours/tour_event", fetcher);

  // Initialiser les champs de placement dynamiques
  useEffect(() => {
    if (data?.data?.tours[0]?.nextEvent?.placement) {
      const placementFields = data.data.tours[0].nextEvent.placement;
      const initialPlacementData = {};
       
      placementFields.forEach(field => {
        initialPlacementData[field] = "";
      });
      
      setPlacementData(initialPlacementData);
    }
  }, [data]);

  // Vérifier si les champs de placement obligatoires sont remplis
  const hasRequiredPlacementFields = () => {
    const placementKeys = Object.keys(placementData);
    return placementKeys.some(key => 
      placementData[key] && placementData[key].trim() !== ""
    );
  };

  // LOGIQUE BOUTON GRISÉ
  const isButtonDisabled = () => {
    if (
      !formData.nom ||
      !formData.prenom ||
      !formData.dateNaissance ||
      !formData.email ||
      !formData.phone
    ) {
      return true;
    }

    if (!ticketImage) {
      return true;
    }

    if (ocrLoad) {
      return true;
    }

    if (!hasRequiredPlacementFields()) {
      return true;
    }

    return false;
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

  const range = (start, end, step = 1) => {
    const output = [];
    for (let i = start; i < end; i += step) {
      output.push(i);
    }
    return output;
  };

  const years = range(1950, getYear(new Date()) + 1, 1);
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];

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

  let eventId = null;

  if (error) return <LoadingObject text={"Failed to load"} />;
  if (data) {
    eventId = data.data?.tours[0]?.nextEvent.id;
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
    eventId = data.data?.tours[0]?.nextEvent?.id;
    formattedDate = customdateFormat(data.data?.tours[0]?.nextEvent);
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handler pour les champs de placement dynamiques
  const handlePlacementChange = (e) => {
    const { name, value } = e.target;
    setPlacementData({
      ...placementData,
      [name]: value,
    });
  };

// Modification dans handleFileSelect
const handleFileSelect = async (dataUrl, fileName = "") => {
  setTicketImage(dataUrl);
  if (fileName) {
    setTicketFileName(fileName);
  }
  setOcrLoad(true);
  setOcrErrorMessage("");
  setOcrStatus(null);
  setOcrStatusMessage("");

  uploadAttemptsRef.current++;
  const attempts = uploadAttemptsRef.current;

  try {
    const formData = new FormData();
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    formData.append("file", blob, fileName || "uploaded-image.png");
    
    // AJOUT : Passer la date de l'événement pour validation
    if (data?.data?.tours[0]?.nextEvent?.eventDate) {
      formData.append("eventDate", data.data.tours[0].nextEvent.eventDate);
    }

    const apiResponse = await fetch("/api/ocr", {
      method: "POST",
      body: formData,
    });

    const result = await apiResponse.json();

    if (!apiResponse.ok || !result?.success) {
      setOcrLoad(false);

      // NOUVEAU : Gestion spécifique de l'erreur de date
      if (result?.errorType === 'WRONG_EVENT_DATE') {
        setOcrStatus("error");
        setOcrStatusMessage("Date incorrecte sur le billet");
        setOcrErrorMessage(result.message || "Ce billet n'est pas pour la bonne date d'événement");
        setOcrFailed(true);
        return;
      }

      if (attempts >= 2) {
        setOcrFailed(true);
        setOcrStatus("error");
        setOcrStatusMessage("le billet n'a pas été reconnu");
      } else {
        setOcrStatus("error");
        setOcrStatusMessage("le billet n'a pas été reconnu");
        setOcrErrorMessage(
          result.message || "L'analyse du billet n'a pas pu s'effectuer correctement"
        );
      }
      return;
    }

    // SUCCES OCR - Prendre TOUS les champs sauf ticketUrl et date
    const ocrPlacementData = {};
    if (result?.data) {
      Object.keys(result.data).forEach(key => {
        if (key !== 'ticketUrl' && key !== 'date') {
          ocrPlacementData[key] = result.data[key];
        }
      });
    }
    
    setOcrData(result?.data);
    setPlacementData(ocrPlacementData);
    setOcrLoad(false);
    setOcrStatus("success");
    setOcrStatusMessage("");
    setOcrErrorMessage("");
    setOcrFailed(false);
  } catch (error) {
    setOcrLoad(false);

    if (attempts >= 2) {
      setOcrFailed(true);
      setOcrStatus("error");
      setOcrStatusMessage("le billet n'a pas été reconnu");
    } else {
      setOcrStatus("error");
      setOcrStatusMessage("le billet n'a pas été reconnu");
      setOcrErrorMessage(
        "L'analyse du billet n'a pas pu s'effectuer correctement"
      );
    }
  }
};

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  const validateForm = () => {
    if (
      !formData.nom ||
      !formData.prenom ||
      !formData.dateNaissance ||
      !formData.email ||
      !formData.phone
    ) {
      setErrorModal({
        isOpen: true,
        title: "Formulaire incomplet",
        message: "Merci de remplir toutes les cases.",
        type: "error",
      });
      return false;
    }

    const age = calculateAge(formData.dateNaissance);
    if (age < 18) {
      setErrorModal({
        isOpen: true,
        message: "Pour participer à l'expérience, il faut avoir + de 18 ans.",
        type: "error",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorModal({
        isOpen: true,
        title: "Email invalide",
        message: "Veuillez entrer une adresse email valide.",
        type: "error",
      });
      return false;
    }

    if (!ticketImage) {
      setErrorModal({
        isOpen: true,
        title: "Billet manquant",
        message: "Veuillez importer votre billet.",
        type: "error",
      });
      return false;
    }

    if (!hasRequiredPlacementFields()) {
      setErrorModal({
        isOpen: true,
        title: "Informations manquantes",
        message: "Veuillez renseigner tous les champs de placement obligatoires.",
        type: "error",
      });
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (isButtonDisabled()) return;

    if (formStep === 1 && validateForm()) {
      setFormStep(2);
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const placementValues = { ...placementData };

    const postBody = {
      nom: formData.nom,
      prenom: formData.prenom,
      dateNaissance: formatDate(formData.dateNaissance),
      email: formData.email,
      phone: formData.phone,
      eventId: eventId,
      placementValues: placementValues,
      ticketUrl: ocrData?.ticketUrl || "",
      textInfo: ocrFailed ? "Billet rempli manuellement après échec OCR" : ""
    };

    const response = await fetch("/api/participants_fo", {
      method: "POST",
      body: JSON.stringify(postBody),
    });

    const responseData = await response.json();

    if (formStep === 2) {
      router.push("/confirmation");
    }
  };

  const closeModal = () => {
    setErrorModal({ ...errorModal, isOpen: false });
  };

  const TicketPreview = () => {
    if (!ticketImage) return null;

    return (
      <div className="border-2 border-blue-500 bg-blue-100 rounded overflow-hidden mb-6">
        <div className="flex items-center p-2">
          <div className="w-16 h-16 mr-4 bg-white rounded overflow-hidden flex-shrink-0">
            <img
              src={ticketImage}
              alt="Billet importé"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-grow">
            <p className="font-medium text-blue-800 truncate">
              {ticketFileName || "Billet"}
            </p>
            <div className="flex items-center text-sm">
              {ocrLoad ? (
                <div className="flex items-center text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span>Analyse en cours...</span>
                </div>
              ) : ocrStatus === "success" ? (
                <div className="flex items-center text-green-600 animate-fade-in">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Billet valide</span>
                </div>
              ) : ocrStatus === "error" && !ocrFailed ? (
                <div className="flex items-center text-red-500 animate-fade-in">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Analyse échouée</span>
                </div>
              ) : ocrFailed ? (
                <span className="text-blue-600">Billet importé</span>
              ) : (
                <span className="text-blue-600">Billet importé</span>
              )}
            </div>
          </div>
        </div>

        {ocrStatusMessage && ocrStatus !== "success" && formStep === 1 && (
          <div
            className={`px-4 py-2 text-sm animate-fade-in ${
              ocrFailed
                ? "bg-orange-100 text-orange-700 border-t border-orange-200"
                : "bg-red-100 text-red-700 border-t border-red-200"
            }`}
          >
            {ocrStatusMessage}
          </div>
        )}
      </div>
    );
  };

// NOUVEAU : Formulaire de placement dynamique avec labels au-dessus
const DynamicPlacementForm = () => {
  if (!ocrFailed) return null;

  const placementFields = data?.data?.tours[0]?.nextEvent?.placement || [];
  
  if (placementFields.length === 0) {
    return (
      <div className="mt-6 mb-4">
        <p className="text-white text-sm mb-4 text-center">
          Aucun champ de placement configuré pour cet événement.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 mb-4">
      <p className="text-white text-sm mb-4 text-center">
        MERCI DE RENSEIGNER MANUELLEMENT LES DÉTAILS DE PLACEMENT FIGURANT SUR VOTRE BILLET
      </p>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 justify-start">
          {placementFields.map((field, index) => (
            <div key={field} className="flex flex-col">
              <label className="text-white text-xs mb-1 font-medium">
                {field.toUpperCase()}
              </label>
              <Input
                placeholder=""
                name={field}
                value={placementData[field] || ""}
                onChange={handlePlacementChange}
                className="h-10 w-20 text-sm px-2"
                required={true}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

  const renderFormStep = () => {
    switch (formStep) {
      case 1:
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNextStep();
            }}
          >
            <Input
              placeholder="NOM"
              name="nom"
              value={formData.nom}
              onChange={handleInputChange}
              className="h-50 w-full"
            />
            <Input
              placeholder="PRENOM"
              name="prenom"
              value={formData.prenom}
              onChange={handleInputChange}
              className="mb-0 h-50 w-full"
            />
            <div className="w-full">
              <DatePicker
                autoComplete="off"
                selected={formData.dateNaissance}
                onChange={(date) => {
                  setFormData({ ...formData, dateNaissance: date });
                  if (date) {
                    const age = calculateAge(date);
                    if (age < 18) {
                      setErrorModal({
                        isOpen: true,
                        message: "Pour participer à l'expérience, il faut avoir + de 18 ans.",
                        type: "error",
                      });
                    }
                  }
                }}
                placeholderText="DATE DE NAISSANCE"
                name="dateNaissance"
                dateFormat={"dd/MM/yyyy"}
                renderCustomHeader={({
                  date,
                  changeYear,
                  changeMonth,
                  decreaseMonth,
                  increaseMonth,
                  prevMonthButtonDisabled,
                  nextMonthButtonDisabled,
                }) => (
                  <div style={{ margin: 10, display: "flex", justifyContent: "center" }}>
                    <button
                      type="button"
                      className="mr-10"
                      onClick={decreaseMonth}
                      disabled={prevMonthButtonDisabled}
                    >
                      {"<"}
                    </button>
                    <select
                      value={getYear(date)}
                      onChange={({ target: { value } }) => changeYear(value)}
                    >
                      {years.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <select
                      value={months[getMonth(date)]}
                      className="ml-2"
                      onChange={({ target: { value } }) =>
                        changeMonth(months.indexOf(value))
                      }
                    >
                      {months.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="ml-10"
                      onClick={increaseMonth}
                      disabled={nextMonthButtonDisabled}
                    >
                      {">"}
                    </button>
                  </div>
                )}
                className="text-gray-700 h-50 w-full rounded p-3 mb-3 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <Input
              placeholder="Numéro de téléphone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="h-50 w-full"
            />
            <Input
              type="email"
              placeholder="ADRESSE MAIL"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="h-50 w-full"
            />

            <Checkbox
              label="J'ACCEPTE DE RECEVOIR DES INFORMATIONS CONCERNANT ADRENALINE TOUR"
              checked={formData.confirmePresence}
              onChange={handleInputChange}
              name="confirmePresence"
            />

            <div className="mt-6 mb-4">
              {!ticketImage ? (
                <FileUpload
                  onFileSelect={(dataUrl, fileName) =>
                    handleFileSelect(dataUrl, fileName)
                  }
                  initialPreview={ticketImage}
                  initialFileName={ticketFileName}
                />
              ) : (
                <TicketPreview />
              )}

              {ticketImage && !ocrFailed && (
                <div className="flex justify-center mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTicketImage(null);
                      setOcrData(null);
                      setOcrLoad(false);
                      setOcrErrorMessage("");
                      setOcrFailed(false);
                      setOcrStatus(null);
                      setOcrStatusMessage("");
                      // Reset placement data
                      const resetPlacementData = {};
                      Object.keys(placementData).forEach(key => {
                        resetPlacementData[key] = "";
                      });
                      setPlacementData(resetPlacementData);
                    }}
                    className="text-sm text-blue-500 hover:text-blue-700"
                  >
                    Réessayer
                  </button>
                </div>
              )}
            </div>

            {/* Formulaire de placement dynamique */}
            <DynamicPlacementForm />

            <div className="mt-4 flex justify-center">
              {ocrLoad ? (
                <div className="text-center text-white">
                  <div>Chargement des infos du billet...</div>
                </div>
              ) : (
                <Button
                  type="submit"
                  disabled={isButtonDisabled()}
                  className={`
                    transition-colors 
                    ${
                      isButtonDisabled()
                        ? "bg-gray-500 text-gray-300 cursor-not-allowed opacity-60"
                        : ""
                    }
                  `}
                >
                  CONTINUEZ
                </Button>
              )}
            </div>
          </form>
        );
case 2:
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-8">
        {ticketImage && <TicketPreview />}
        
        {/* Section interactive de récap/modification */}
        <div className="bg-gray-900/50 rounded-lg p-2 border border-gray-700 mb-3">
          <div className="text-center mb-2">
            {ocrFailed ? (
              <div className="flex items-center justify-center mb-1">
                <svg className="w-4 h-4 text-orange-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-orange-400 font-medium text-sm">
                  Informations saisies manuellement
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center mb-1">
                <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <p className="text-green-400 font-medium text-sm">
                  Informations analysées automatiquement
                </p>
              </div>
            )}
          </div>

          {/* Message d'aide */}
          <div className="text-center mb-2">
            <p className="text-gray-300 text-xs flex items-center justify-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Vous pouvez modifier ces informations si nécessaire
            </p>
          </div>

          {/* Champs de placement éditables */}
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(placementData)
              .filter(([key, value]) => value && value.trim() !== "")
              .map(([key, value]) => (
                <div key={key} className="bg-gray-800/50 rounded-md p-2 hover:bg-gray-800/70 transition-colors">
                  <label className="text-white font-medium text-xs uppercase block mb-1">
                    {key}
                  </label>
                  <Input
                    name={key}
                    value={value}
                    onChange={handlePlacementChange}
                    className="h-8 bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500 transition-colors text-sm w-full"
                  />
                </div>
              ))}

            {Object.entries(placementData).filter(
              ([key, value]) => value && value.trim() !== ""
            ).length === 0 && (
              <div className="col-span-3 text-center py-2">
                <p className="text-gray-400 italic text-xs">Aucune information de placement disponible</p>
              </div>
            )}
          </div>
        </div>

        {ocrErrorMessage && (
          <div className="text-center mt-4">
            <p className="text-red-500 text-sm">{ocrErrorMessage}</p>
          </div>
        )}
      </div>
      
      <div className="mt-8 flex justify-between items-center space-x-4">
        <Button
          onClick={() => setFormStep(1)}
          variant="secondary"
          className="flex-1 !bg-white !text-black"
        >
          MODIFIER MES INFORMATIONS
        </Button>
        <Button type="submit" className="flex-1">
          VALIDER
        </Button>
      </div>
    </form>
  );
      default:
        return null;
    }
  };

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
      pt-24
    `}
    >
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
      <div className="w-full max-w-md mx-auto">
        <div className="mb-12">
          <LogoHeader date={formattedDate} venue={data?.data?.tours[0]?.nextEvent.venue} />
        </div>

        <div className="w-full">{renderFormStep()}</div>
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