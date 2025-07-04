"use client";
import React, { useState } from "react";
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
    telephone: "",
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
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });
  const [ocrLoad, setOcrLoad] = useState(false);
  const [ocrErrorMessage, setOcrErrorMessage] = useState("");
  const [billetNonReconnu, setBilletNonReconnu] = useState(false);
  const [uploadAttempts, setUploadAttempts] = useState(0);
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

  const range = (start, end, step = 1) => {
    const output = [];
    for (let i = start; i < end; i += step) {
      output.push(i);
    }
    return output;
  };

  const years = range(1990, getYear(new Date()) + 1, 1);
  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
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
    formattedDate = customdateFormat(data.data?.tours[0]?.nextEvent);
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileSelect = async (dataUrl, fileName = "") => {
    setTicketImage(dataUrl);
    if (fileName) {
      setTicketFileName(fileName);
    }
    setOcrLoad(true);
    setOcrErrorMessage("");
    
    // Incrémenter IMMEDIATEMENT le compteur
    const newAttempts = uploadAttempts + 1;
    setUploadAttempts(newAttempts);
    
    try {
      const formData = new FormData();
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      formData.append("file", blob, fileName || "uploaded-image.png");

      const apiResponse = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });
      
      const result = await apiResponse.json();
      
      if (!apiResponse.ok || !result?.success) {
        // ECHEC
        setOcrLoad(false);
        setOcrErrorMessage("L'analyse du billet n'a pas pu s'effectuer correctement");
        
        // Vérifier si on a atteint 2 tentatives
        if (newAttempts >= 2) {
          setBilletNonReconnu(true);
          setErrorModal({
            isOpen: true,
            title: "Billet non reconnu",
            message: "Ton billet n'a pas été reconnu par le formulaire. Pas d'inquiétude : si tu fais partie des gagnants, pense à te munir de ton billet lors du brief avec les équipes techniques.",
            type: "info",
          });
        }
        return;
      }

      // SUCCES
      setOcrData(result?.data);
      setOcrLoad(false);
      setOcrErrorMessage("");
      // On garde le compteur mais on enlève pas les erreurs en cas de succès
      
    } catch (error) {
      console.error("Error fetching OCR:", error);
      setOcrLoad(false);
      setOcrErrorMessage("L'analyse du billet n'a pas pu s'effectuer correctement");
      
      // Vérifier si on a atteint 2 tentatives
      if (newAttempts >= 2) {
        setBilletNonReconnu(true);
        setErrorModal({
          isOpen: true,
          title: "Billet non reconnu",
          message: "Ton billet n'a pas été reconnu par le formulaire. Pas d'inquiétude : si tu fais partie des gagnants, pense à te munir de ton billet lors du brief avec les équipes techniques.",
          type: "info",
        });
      }
    }
  };

  // Fonction pour calculer l'âge
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const validateForm = () => {
    // Vérifier si tous les champs sont remplis
    if (
      !formData.nom ||
      !formData.prenom ||
      !formData.dateNaissance ||
      !formData.email ||
      !formData.telephone
    ) {
      setErrorModal({
        isOpen: true,
        title: "Formulaire incomplet",
        message: "Merci de remplir toutes les cases.",
        type: "error",
      });
      return false;
    }

    // Vérifier l'âge (doit avoir 18 ans ou plus)
    const age = calculateAge(formData.dateNaissance);
    if (age < 18) {
      setErrorModal({
        isOpen: true,
        title: "Âge insuffisant",
        message: "Il semble que tu ne sois pas encore majeur(e). Malheureusement, l'inscription est réservée aux personnes de 18 ans et plus.",
        type: "error",
      });
      return false;
    }

    // Vérifier le format de l'email
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

    // LE BILLET N'EST PLUS REQUIRED SI billetNonReconnu = true
    if (!billetNonReconnu && !ticketImage) {
      setErrorModal({
        isOpen: true,
        title: "Billet manquant",
        message: "Veuillez importer votre billet.",
        type: "error",
      });
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (formStep === 1 && validateForm()) {
      setFormStep(2);
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cgu) {
      setErrorModal({
        isOpen: true,
        title: "Conditions non acceptées",
        message: "Merci de cocher toutes les cases.",
        type: "error",
      });
      return;
    } else {
      const postBody = {
        nom: formData.nom,
        prenom: formData.prenom,
        dateNaissance: formatDate(formData.dateNaissance),
        email: formData.email,
        telephone: formData.telephone,
        eventId: eventId,
        porte: billetNonReconnu ? "" : (ocrData?.porte || ""),
        rang: billetNonReconnu ? "" : (ocrData?.rang || ""),
        place: billetNonReconnu ? "" : (ocrData?.place || ""),
        bloc: billetNonReconnu ? "" : (ocrData?.bloc || ""),
        gradin: billetNonReconnu ? "" : (ocrData?.gradin || ""),
        chaise: billetNonReconnu ? "" : (ocrData?.chaise || ""),
        siege: billetNonReconnu ? "" : (ocrData?.siege || ""),
        entree: billetNonReconnu ? "" : (ocrData?.entree || ""),
        niveau: billetNonReconnu ? "" : (ocrData?.niveau || ""),
        parterre: billetNonReconnu ? "" : (ocrData?.parterre || ""),
        tribune: billetNonReconnu ? "" : (ocrData?.tribune || ""),
        ticketUrl: ocrData?.ticketUrl || "",
        textInfo: billetNonReconnu ? "Billet non reconnu par OCR" : "",
      };
      
      const response = await fetch("/api/participants_fo", {
        method: "POST",
        body: JSON.stringify(postBody),
      });

      const data = await response.json();
    }

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
            <p className="text-sm text-blue-600 flex items-center">
              {billetNonReconnu ? "Billet non reconnu" : "Billet importé"}
            </p>
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
                selected={formData.dateNaissance}
                onChange={(date) => {
                  setFormData({ ...formData, dateNaissance: date });
                  if (date) {
                    const age = calculateAge(date);
                    if (age < 18) {
                      setErrorModal({
                        isOpen: true,
                        title: "Âge insuffisant",
                        message: "Il semble que tu ne sois pas encore majeur(e). Malheureusement, l'inscription est réservée aux personnes de 18 ans et plus.",
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
                  <div
                    style={{
                      margin: 10,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
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
              name="telephone"
              value={formData.telephone}
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

            {/* SECTION BILLET - Disparaît complètement si billet non reconnu */}
            {!billetNonReconnu && (
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

                {ticketImage && (
                  <div className="flex justify-center mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTicketImage(null);
                        setOcrData(null);
                        setOcrLoad(false);
                        setOcrErrorMessage("");
                        // NE PAS remettre à zéro les tentatives pour éviter le spam
                      }}
                      className="text-sm text-blue-500 hover:text-blue-700"
                    >
                      Changer de billet
                    </button>
                  </div>
                )}

                {/* Message d'erreur OCR EN ROUGE */}
                {ocrErrorMessage && (
                  <div className="text-center mt-4">
                    <p className="text-red-500 text-sm">{ocrErrorMessage}</p>
                  </div>
                )}
              </div>
            )}

            {/* Message informatif pour billet non reconnu */}
            {billetNonReconnu && (
              <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 rounded mt-6">
                <p className="text-sm">
                  <strong>Information :</strong> Ton billet n'a pas été reconnu par le formulaire. Pas d'inquiétude : si tu fais partie des gagnants, pense à te munir de ton billet lors du brief avec les équipes techniques.
                </p>
              </div>
            )}

            <div className="mt-4 flex justify-center">
              {ocrLoad ? (
                <div className="text-center text-white">
                  <div>Chargement des infos du billet...</div>
                </div>
              ) : (
                <Button type="submit">CONTINUEZ</Button>
              )}
            </div>
          </form>
        );
      case 2:
        return (
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              {ticketImage && <TicketPreview />}
              <div className="text-center text-sm mb-4">
                {!billetNonReconnu && ocrData ? (
                  <div>
                    {/* Affichage 100% dynamique de tous les champs présents */}
                    {Object.entries(ocrData)
                      .filter(([key, value]) => key !== 'ticketUrl' && value && value.trim() !== '')
                      .map(([key, value]) => (
                        <p key={key}>
                          {key.toUpperCase()} {value}
                        </p>
                      ))}
                    
                    {/* Si aucun champ de placement n'est présent */}
                    {Object.entries(ocrData).filter(([key, value]) => key !== 'ticketUrl' && value && value.trim() !== '').length === 0 && (
                      <p>Informations du billet en cours de traitement</p>
                    )}
                  </div>
                ) : (
                  <p className="text-blue-600 font-medium">
                    {billetNonReconnu 
                      ? "Informations du billet à vérifier lors du brief"
                      : "Informations du billet en cours de traitement"
                    }
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <Checkbox
                label="MES INFORMATIONS SONT CORRECTES"
                name="cgu"
                onChange={handleInputChange}
                checked={formData.cgu || false}
                className="w-full"
              />
            </div>

            <div className="mt-8 flex justify-center items-center">
              <Button type="submit">
                JE TENTE MA CHANCE
              </Button>
            </div>
            <Button onClick={() => setFormStep(1)} variant="secondary">
              RETOUR
            </Button>
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
      <div className="w-full max-w-md mx-auto">
        <div className="mb-12">
          <LogoHeader date={formattedDate} venue={data?.data?.tours[0].name} />
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