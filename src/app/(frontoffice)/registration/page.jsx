"use client";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/common/Input";
import Checkbox from "@/components/common/Checkbox";
import FileUpload from "@/components/common/FileUpload";
import Button from "@/components/common/Button";
import PopupModal from "@/components/common/PopupModal";
import { din, evangelion } from "@/styles/fonts";
import useSWR from "swr";
import LoadingObject from "@/components/common/CentralLoadingObject";
import Countdown from "@/components/common/CountDown";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getYear, getMonth } from "date-fns";

const useEmailCheck = (email, eventId) => {
  const fetcher = async ([url, email, eventId]) => {
    if (!email || !eventId || !email.includes("@")) return null;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.toLowerCase().trim(), eventId }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.data : null;
  };

  const shouldCheck = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && eventId;
  }, [email, eventId]);

  const { data, error, isLoading } = useSWR(
    shouldCheck ? ["/api/check-participant", email, eventId] : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 3000, errorRetryCount: 1 }
  );

  return {
    isChecking: isLoading,
    participantExists: data?.exists || false,
    participantData: data?.participant || null,
    error: error || null,
  };
};

const fetcher = (...args) => fetch(...args).then((res) => res.json());

const IntegratedHeader = ({ venue, date, city }) => {
  const subtitleText = date && venue ? `${date} | ${city} - ${venue}` : date || venue;
  
  const getFontSize = (text) => {
    if (!text) return "text-3xl";
    const length = text.length;
    if (length <= 20) return "text-3xl";
    if (length <= 30) return "text-2xl";
    if (length <= 40) return "text-xl";
    if (length <= 50) return "text-lg";
    return "text-base";
  };

  return (
    <div className="w-full flex flex-col items-center mb-8">
      <h1 className={`${evangelion.className} text-6xl text-white text-center`} style={{ whiteSpace: "nowrap" }}>
        ADRENALINE TOUR
      </h1>
      {(venue || date || city) && (
        <div className={`text-center ${getFontSize(subtitleText)} text-white whitespace-nowrap ma-w-full`}>
          <span className="inline-block" style={{
            transform: subtitleText && subtitleText.length > 50 ? "scaleX(0.9)" : "scaleX(1)",
            transformOrigin: "center",
          }}>
            {subtitleText}
          </span>
        </div>
      )}
    </div>
  );
};

export default function RegistrationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nom: "", prenom: "", dateNaissance: "", email: "", phone: "", confirmePresence: false
  });
  const [formStep, setFormStep] = useState(1);
  const [ticketImage, setTicketImage] = useState(null);
  const [ticketFileName, setTicketFileName] = useState("");
  const [ocrData, setOcrData] = useState(null);
  const [ocrFailed, setOcrFailed] = useState(false);
  const [placementData, setPlacementData] = useState({});
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: "", message: "", type: "error" });
  const [ocrLoad, setOcrLoad] = useState(false);
  const [ocrStatus, setOcrStatus] = useState(null);
  const [ocrStatusMessage, setOcrStatusMessage] = useState("");
  const [isPlacementEditable, setIsPlacementEditable] = useState(false);
  const uploadAttemptsRef = useRef(0);

  const { data, error } = useSWR("/api/tours/tour_event", fetcher);
  const { isChecking, participantExists } = useEmailCheck(formData.email, data?.data?.tours[0]?.nextEvent.id);

  // Initialiser les champs de placement
  useEffect(() => {
    if (data?.data?.tours[0]?.nextEvent?.placement) {
      const initialPlacementData = {};
      data.data.tours[0].nextEvent.placement.forEach((field) => {
        initialPlacementData[field] = "";
      });
      setPlacementData(initialPlacementData);
    }
  }, [data]);

  const placementFields = useMemo(() => data?.data?.tours[0]?.nextEvent?.placement || [], [data]);

  const handlePlacementChange = useCallback((e) => {
    const { name, value } = e.target;
    setPlacementData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Vérifier si on a des informations de placement valides (OCR ou manuel)
  const hasValidPlacementData = () => {
    console.log("=== hasValidPlacementData DEBUG ===");
    console.log("ocrFailed:", ocrFailed);
    console.log("ocrData:", ocrData);
    console.log("placementFields:", placementFields);
    console.log("placementData:", placementData);
    
    // Si OCR a réussi, on a les données
    if (!ocrFailed && ocrData?.ticketUrl) {
      console.log("OCR réussi, retourne true");
      return true;
    }
    
    // Si OCR a échoué, vérifier les champs manuels
    if (ocrFailed) {
      // Si pas de champs configurés, c'est OK
      if (placementFields.length === 0) {
        console.log("Pas de champs requis, retourne true");
        return true;
      }
      
      // Vérifier qu'AU MOINS UN champ requis est rempli (au lieu de TOUS)
      const result = placementFields.some(field => {
        const value = placementData[field];
        const isValid = value && value.trim() !== "";
        console.log(`Champ ${field}: "${value}" -> ${isValid}`);
        return isValid;
      });
      console.log("Résultat final des champs manuels (au moins un):", result);
      return result;
    }
    
    console.log("Cas par défaut, retourne false");
    return false;
  };

  // Vérifications d'état de la page
  const hasDatePassed = (startDate) => {
    const currentDate = new Date();
    const tourDate = new Date(startDate);
    tourDate.setHours(tourDate.getHours(), tourDate.getMinutes(), tourDate.getSeconds(), 0);
    return currentDate < tourDate;
  };

  const hasDateEnd = (endDate) => {
    const currentDate = new Date();
    const tourDate = new Date(endDate);
    tourDate.setHours(tourDate.getHours(), tourDate.getMinutes(), tourDate.getSeconds(), 0);
    return currentDate > tourDate;
  };

  const customdateFormat = (passedDate) => {
    const date = new Date(passedDate?.endDate);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${day}.${month}.${year}`;
  };

  // Gestion des états de chargement et d'erreur
  if (error) return <LoadingObject text={"Failed to load"} />;
  if (!data) return <LoadingObject text={"Loading ..."} />;

  if (data?.data?.tours.length === 0) return <LoadingObject text={"le formulaire est clôturé"} />;
  if (hasDateEnd(data?.data?.tours[0]?.nextEvent.endDate)) return <LoadingObject text={"le formulaire est clôturé"} />;
  if (hasDatePassed(data?.data?.tours[0]?.nextEvent.eventDate)) {
    const tourDate = new Date(data?.data?.tours[0]?.nextEvent.eventDate);
    tourDate.setHours(8, 0, 0, 0);
    return <Countdown startDate={tourDate} />;
  }

  const formattedDate = customdateFormat(data.data?.tours[0]?.nextEvent);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleFileSelect = async (dataUrl, fileName = "") => {
    setTicketImage(dataUrl);
    if (fileName) setTicketFileName(fileName);
    setOcrLoad(true);
    setOcrStatus(null);
    setOcrStatusMessage("");

    uploadAttemptsRef.current++;
    const attempts = uploadAttemptsRef.current;

    try {
      const formData = new FormData();
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      formData.append("file", blob, fileName || "uploaded-image.png");

      if (data?.data?.tours[0]?.nextEvent?.endDate) {
        formData.append("endDate", data.data.tours[0].nextEvent.endDate);
      }

      const apiResponse = await fetch("/api/ocr", { method: "POST", body: formData });
      const result = await apiResponse.json();

      if (!apiResponse.ok || !result?.success) {
        setOcrLoad(false);

        if (result?.errorType === "WRONG_EVENT_DATE") {
          setOcrStatus("error");
          setOcrStatusMessage("Date incorrecte sur le billet");
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
        }
        return;
      }

      // OCR réussi
      const ocrPlacementData = {};
      if (result?.data) {
        Object.keys(result.data).forEach((key) => {
          if (key !== "ticketUrl" && key !== "date") {
            ocrPlacementData[key] = result.data[key];
          }
        });
      }

      setOcrData(result?.data);
      setPlacementData(ocrPlacementData);
      setOcrLoad(false);
      setOcrStatus("success");
      setOcrStatusMessage("");
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
      }
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  // VALIDATION COMPLÈTEMENT REECRITE - PLUS DE VÉRIFICATION BILLET
  const validateForm = () => {
    console.log("=== DÉBUT VALIDATION ===");
    
    if (!formData.nom || !formData.prenom || !formData.dateNaissance || !formData.email || !formData.phone) {
      setErrorModal({ isOpen: true, title: "Formulaire incomplet", message: "Merci de remplir toutes les cases.", type: "error" });
      return false;
    }

    const age = calculateAge(formData.dateNaissance);
    if (age < 18) {
      setErrorModal({ isOpen: true, message: "Pour participer à l'expérience, il faut avoir + de 18 ans.", type: "error" });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorModal({ isOpen: true, title: "Email invalide", message: "Veuillez entrer une adresse email valide.", type: "error" });
      return false;
    }

    if (participantExists) {
      setErrorModal({ isOpen: true, title: "Email déjà utilisé", message: "l'adresse email saisie a déjà été utilisée pour cet évènement", type: "error" });
      return false;
    }

    // SEULE vérification importante : les données de placement
    const placementValid = hasValidPlacementData();
    console.log("hasValidPlacementData résultat:", placementValid);
    
    if (!placementValid) {
      console.log("ÉCHEC: Données de placement invalides");
      setErrorModal({ isOpen: true, title: "Informations manquantes", message: "Veuillez renseigner au moins un champ de placement obligatoire.", type: "error" });
      return false;
    }

    console.log("=== VALIDATION RÉUSSIE ===");
    return true;
  };

  const isButtonDisabled = () => {
    // Vérifications de base
    if (!formData.nom || !formData.prenom || !formData.dateNaissance || !formData.email || !formData.phone || ocrLoad) {
      return true;
    }
    
    // Si on n'a pas d'image de billet du tout
    if (!ticketImage) return true;
    
    // Vérifier qu'on a des données de placement valides (OCR ou manuel)
    return !hasValidPlacementData();
  };

  const handleNextStep = () => {
    if (isButtonDisabled()) return;
    if (formStep === 1 && validateForm()) setFormStep(2);
  };

  const formatDate = (date) => date.toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const postBody = {
      nom: formData.nom, prenom: formData.prenom, dateNaissance: formatDate(formData.dateNaissance),
      email: formData.email, phone: formData.phone, eventId: data?.data?.tours[0]?.nextEvent.id,
      placementValues: { ...placementData }, 
      ticketUrl: ocrData?.ticketUrl || ticketImage, // Utiliser l'image si pas d'OCR
      textInfo: ocrFailed ? "Billet rempli manuellement après échec OCR" : "",
    };

    const response = await fetch("/api/participants_fo", {
      method: "POST",
      body: JSON.stringify(postBody),
    });

    if (formStep === 2) router.push("/confirmation");
  };

  const TicketPreview = () => {
    if (!ticketImage) return null;

    return (
      <div className="border-2 border-blue-500 bg-blue-100 rounded overflow-hidden mb-6">
        <div className="flex items-center p-2">
          <div className="w-16 h-16 mr-4 bg-white rounded overflow-hidden flex-shrink-0">
            <img src={ticketImage} alt="Billet importé" className="w-full h-full object-contain" />
          </div>
          <div className="flex-grow">
            <p className="font-medium text-blue-800 truncate">{ticketFileName || "Billet"}</p>
            <div className="flex items-center text-sm">
              {ocrLoad ? (
                <div className="flex items-center text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span>Analyse en cours...</span>
                </div>
              ) : ocrStatus === "success" ? (
                <div className="flex items-center text-green-600 animate-fade-in">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Billet valide</span>
                </div>
              ) : ocrStatus === "error" && !ocrFailed ? (
                <div className="flex items-center text-red-500 animate-fade-in">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
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
          <div className={`px-4 py-2 text-sm animate-fade-in ${
            ocrFailed ? "bg-orange-100 text-orange-700 border-t border-orange-200" : "bg-red-100 text-red-700 border-t border-red-200"
          }`}>
            {ocrStatusMessage}
          </div>
        )}
      </div>
    );
  };

  const range = (start, end, step = 1) => {
    const output = [];
    for (let i = start; i < end; i += step) output.push(i);
    return output;
  };

  const years = range(1950, getYear(new Date()) + 1, 1);
  const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  const renderFormStep = () => {
    switch (formStep) {
      case 1:
        return (
          <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
            <Input placeholder="NOM" name="nom" value={formData.nom} onChange={handleInputChange} className="h-50 w-full" />
            <Input placeholder="PRENOM" name="prenom" value={formData.prenom} onChange={handleInputChange} className="mb-0 h-50 w-full" />
            
            <div className="w-full">
              <DatePicker
                autoComplete="off" selected={formData.dateNaissance}
                onChange={(date) => {
                  setFormData({ ...formData, dateNaissance: date });
                  if (date) {
                    const age = calculateAge(date);
                    if (age < 18) {
                      setErrorModal({ isOpen: true, message: "Pour participer à l'expérience, il faut avoir + de 18 ans.", type: "error" });
                    }
                  }
                }}
                placeholderText="DATE DE NAISSANCE" name="dateNaissance" dateFormat={"dd/MM/yyyy"}
                renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
                  <div style={{ margin: 10, display: "flex", justifyContent: "center" }}>
                    <button type="button" className="mr-10" onClick={decreaseMonth} disabled={prevMonthButtonDisabled}>{"<"}</button>
                    <select value={getYear(date)} onChange={({ target: { value } }) => changeYear(value)}>
                      {years.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <select value={months[getMonth(date)]} className="ml-2" onChange={({ target: { value } }) => changeMonth(months.indexOf(value))}>
                      {months.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <button type="button" className="ml-10" onClick={increaseMonth} disabled={nextMonthButtonDisabled}>{">"}</button>
                  </div>
                )}
                className="text-gray-700 h-50 w-full rounded p-3 mb-3 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            
            <Input placeholder="Numéro de téléphone" name="phone" value={formData.phone} onChange={handleInputChange} className="h-50 w-full" />
            
            <div className="relative">
              <Input
                type="email" placeholder="ADRESSE MAIL" name="email" value={formData.email} onChange={handleInputChange}
                className={`h-50 w-full ${participantExists ? "border-red-500 bg-red-50" : ""}`}
              />
              {isChecking && formData.email.includes("@") && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
              {participantExists && !isChecking && (
                <div className="mt-2 text-red-600 text-sm animate-fade-in">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>l'adresse email saisie a déjà été utilisée pour cet évènement</span>
                  </div>
                </div>
              )}
            </div>

            <Checkbox
              label="J'ACCEPTE DE RECEVOIR DES INFORMATIONS CONCERNANT ADRENALINE TOUR"
              checked={formData.confirmePresence} onChange={handleInputChange} name="confirmePresence"
            />

            <div className="mt-6 mb-4">
              {!ticketImage ? (
                <FileUpload onFileSelect={(dataUrl, fileName) => handleFileSelect(dataUrl, fileName)}
                  initialPreview={ticketImage} initialFileName={ticketFileName} />
              ) : (
                <TicketPreview />
              )}

              {ticketImage && !ocrFailed && (
                <div className="flex justify-center mt-2">
                  <button type="button" onClick={() => {
                    setTicketImage(null); setOcrData(null); setOcrLoad(false); setOcrFailed(false);
                    setOcrStatus(null); setOcrStatusMessage("");
                    const resetPlacementData = {};
                    Object.keys(placementData).forEach((key) => { resetPlacementData[key] = ""; });
                    setPlacementData(resetPlacementData);
                  }} className="text-sm text-blue-500 hover:text-blue-700">
                    Réessayer
                  </button>
                </div>
              )}
            </div>

            {/* Champs de placement - SEULEMENT si OCR a échoué après 2 tentatives */}
            {ticketImage && ocrFailed && placementFields.length > 0 && (
              <div className="mt-6 mb-4">
                <p className="text-white text-sm mb-4 text-center">
                  MERCI DE RENSEIGNER AU MOINS UN DÉTAIL DE PLACEMENT FIGURANT SUR VOTRE BILLET
                </p>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 justify-start">
                    {placementFields.map((field) => (
                      <div key={`placement-field-${field}`} className="flex flex-col">
                        <label htmlFor={`input-${field}`} className="text-white text-xs mb-1 font-medium">
                          {field.toUpperCase()}
                        </label>
                        <Input
                          id={`input-${field}`} placeholder="" name={field} value={placementData[field] || ""}
                          onChange={handlePlacementChange} className="h-10 w-20 text-sm px-2" autoComplete="off"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-center">
              {ocrLoad ? (
                <div className="text-center text-white">
                  <div>Chargement des infos du billet...</div>
                </div>
              ) : (
                <Button type="submit" disabled={isButtonDisabled()}
                  className={`transition-colors ${isButtonDisabled() ? "bg-gray-500 text-gray-300 cursor-not-allowed opacity-60" : ""}`}>
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

              <div className="bg-gray-900/50 rounded-lg p-2 border border-gray-700 mb-3">
                <div className="text-center mb-2">
                  {ocrFailed ? (
                    <div className="flex items-center justify-center mb-1">
                      <svg className="w-4 h-4 text-orange-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-orange-400 font-medium text-sm">Informations saisies manuellement</p>
                    </div>
                  ) : null}
                </div>

                <div className="text-center mb-2">
                  <button
                    type="button"
                    onClick={() => setIsPlacementEditable(!isPlacementEditable)}
                    className="text-gray-300 text-xs flex items-center justify-center hover:text-white transition-colors cursor-pointer"
                  >
                    {isPlacementEditable ? (
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    Je modifie mes informations si besoin
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(placementData).length > 0 ? 
                    Object.keys(placementData).map((field) => (
                      <div key={`step2-${field}`} className="bg-gray-800/50 rounded-md p-2 hover:bg-gray-800/70 transition-colors">
                        <label className="text-white font-medium text-xs uppercase block mb-1">{field}</label>
                        <Input
                          name={field} 
                          value={placementData[field] || ""} 
                          onChange={handlePlacementChange}
                          disabled={!isPlacementEditable}
                          className={`h-8 text-white focus:border-blue-500 focus:ring-blue-500 transition-colors text-sm w-full ${
                            isPlacementEditable 
                              ? "bg-gray-700 border-gray-600 hover:bg-gray-600" 
                              : "bg-gray-800 border-gray-700 cursor-not-allowed opacity-60"
                          }`}
                          autoComplete="off"
                        />
                      </div>
                    )) : (
                      <div className="col-span-3 text-center py-2">
                        <p className="text-gray-400 italic text-xs">
                          Aucune information de placement disponible
                        </p>
                      </div>
                    )
                  }
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center space-x-4">
              <Button onClick={() => setFormStep(1)} variant="secondary"
                className="flex-1 !bg-white !text-black h-12 min-h-[48px] flex items-center justify-center">
                RETOUR
              </Button>
              <Button type="submit" className="flex-1 h-12 min-h-[48px] flex items-center justify-center">
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
    <main className={`${din.variable} flex min-h-screen flex-col items-center p-6 bg-black dnb-bg`}>
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>

      <div className="w-full max-w-md mx-auto">
        <IntegratedHeader
          date={formattedDate}
          venue={data?.data?.tours[0]?.nextEvent.venue}
          city={data?.data?.tours[0]?.nextEvent.city}
        />
        <div className="w-full">{renderFormStep()}</div>
      </div>

      <PopupModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        title={errorModal.title}
        message={errorModal.message}
        type={errorModal.type}
      />
    </main>
  );
}