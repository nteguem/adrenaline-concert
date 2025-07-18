"use client";
import React, { useState, useRef } from "react";
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
  const [ocrFailed, setOcrFailed] = useState(false);
  const [manualTicketData, setManualTicketData] = useState({
    categorie: "",
    gradin: "",
    place: "",
    bloc: "",
    rang: "",
  });
  const manualInputsRef = useRef({
    categorie: "",
    gradin: "",
    place: "",
    bloc: "",
    rang: "",
  });
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });
  const [ocrLoad, setOcrLoad] = useState(false);
  const [ocrErrorMessage, setOcrErrorMessage] = useState("");
  const [ocrStatus, setOcrStatus] = useState(null); // 'success', 'error', null
  const [ocrStatusMessage, setOcrStatusMessage] = useState("");
  const uploadAttemptsRef = useRef(0); // Compteur simple et fiable
  const fileUploadKeyRef = useRef(0); // Pour forcer le re-render du FileUpload
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
    eventId = data.data?.tours[0]?.nextEvent?.id; // FIX: Récupération correcte de l'eventId
    formattedDate = customdateFormat(data.data?.tours[0]?.nextEvent);
  }

  // LOGIQUE BOUTON GRISÉ - Vérification en temps réel
  const isButtonDisabled = () => {
    // Vérifier les champs obligatoires
    if (
      !formData.nom ||
      !formData.prenom ||
      !formData.dateNaissance ||
      !formData.email ||
      !formData.telephone
    ) {
      return true;
    }

    // Vérifier le billet
    if (!ticketImage) {
      return true;
    }

    // Si OCR a échoué, vérifier les champs manuels obligatoires
    if (ocrFailed) {
      if (!manualTicketData.rang || !manualTicketData.place) {
        return true;
      }
    }

    // Si OCR en cours, désactiver le bouton
    if (ocrLoad) {
      return true;
    }

    return false;
  };

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
    setOcrStatus(null);
    setOcrStatusMessage("");

    // Incrémenter le compteur - SIMPLE ET DIRECT
    uploadAttemptsRef.current++;
    const attempts = uploadAttemptsRef.current;

    console.log(`=== TENTATIVE ${attempts}/2 ===`);

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
        // ECHEC OCR
        setOcrLoad(false);

        if (attempts >= 2) {
          console.log("=== ACTIVATION MODE MANUEL ===");
          setOcrFailed(true);
          setOcrStatus("error");
          setOcrStatusMessage("le billet n’a pas été reconnu");
        } else {
          console.log(`=== ECHEC TENTATIVE ${attempts} ===`);
          setOcrStatus("error");
          setOcrStatusMessage("le billet n’a pas été reconnu");
          setOcrErrorMessage(
            "L'analyse du billet n'a pas pu s'effectuer correctement"
          );
        }
        return;
      }

      // SUCCES OCR
      console.log("=== SUCCES OCR ===");
      setOcrData(result?.data);
      setOcrLoad(false);
      setOcrStatus("success");
      setOcrStatusMessage("");
      setOcrErrorMessage("");
      setOcrFailed(false);
    } catch (error) {
      console.error("Error fetching OCR:", error);
      setOcrLoad(false);

      if (attempts >= 2) {
        console.log("=== ACTIVATION MODE MANUEL (CATCH) ===");
        setOcrFailed(true);
        setOcrStatus("error");
        setOcrStatusMessage("le billet n’a pas été reconnu");
      } else {
        console.log(`=== ECHEC TENTATIVE ${attempts} (CATCH) ===`);
        setOcrStatus("error");
        setOcrStatusMessage("le billet n’a pas été reconnu");
        setOcrErrorMessage(
          "L'analyse du billet n'a pas pu s'effectuer correctement"
        );
      }
    }
  };

  const handleManualTicketChange = (e) => {
    const { name, value } = e.target;
    setManualTicketData({
      ...manualTicketData,
      [name]: value,
    });
  };

  // Fonction pour calculer l'âge
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
        message: "Pour participer à l'expérience, il faut être majeur.",
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

    // LE BILLET N'EST PLUS REQUIRED
    if (!ticketImage) {
      setErrorModal({
        isOpen: true,
        title: "Billet manquant",
        message: "Veuillez importer votre billet.",
        type: "error",
      });
      return false;
    }

    // Si OCR a échoué, vérifier que les champs obligatoires sont remplis
    if (ocrFailed) {
      if (!manualTicketData.rang || !manualTicketData.place) {
        setErrorModal({
          isOpen: true,
          title: "Informations manquantes",
          message:
            "Veuillez renseigner au minimum le rang et la place de votre billet.",
          type: "error",
        });
        return false;
      }
    }

    return true;
  };

  const handleNextStep = () => {
    // BLOQUER L'ACTION SI LE BOUTON EST DÉSACTIVÉ
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

    console.log("=== SUBMIT ===");
    console.log("ocrFailed:", ocrFailed);
    console.log("manualTicketData state:", manualTicketData);
    console.log("ocrData:", ocrData);

    // Préparer les données de billet selon le mode (OCR ou manuel)
    let billetData = {};

    if (ocrFailed) {
      // Mode manuel - utiliser le state manualTicketData
      billetData = {
        porte: "",
        rang: manualTicketData.rang || "",
        place: manualTicketData.place || "",
        bloc: manualTicketData.bloc || "",
        gradin: manualTicketData.gradin || "",
        chaise: "",
        siege: "",
        entree: "",
        niveau: "",
        parterre: "",
        tribune: "",
        categorie: manualTicketData.categorie || "",
        textInfo: "Billet rempli manuellement après échec OCR",
      };
      console.log("Données manuelles depuis state:", billetData);
    } else {
      // Mode OCR - utiliser les données extraites
      billetData = {
        porte: ocrData?.porte || "",
        rang: ocrData?.rang || "",
        place: ocrData?.place || "",
        bloc: ocrData?.bloc || "",
        gradin: ocrData?.gradin || "",
        chaise: ocrData?.chaise || "",
        siege: ocrData?.siege || "",
        entree: ocrData?.entree || "",
        niveau: ocrData?.niveau || "",
        parterre: ocrData?.parterre || "",
        tribune: ocrData?.tribune || "",
        textInfo: "",
      };
      console.log("Données OCR:", billetData);
    }

    const postBody = {
      nom: formData.nom,
      prenom: formData.prenom,
      dateNaissance: formatDate(formData.dateNaissance),
      email: formData.email,
      telephone: formData.telephone,
      eventId: eventId,
      ...billetData,
      ticketUrl: ocrData?.ticketUrl || "",
    };

    console.log("Payload final:", postBody);

    const response = await fetch("/api/participants_fo", {
      method: "POST",
      body: JSON.stringify(postBody),
    });

    const data = await response.json();
    console.log("Réponse API:", data);

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
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
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
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
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
              ) : ocrFailed ? (
                <span className="text-orange-600">
                  Billet à compléter manuellement
                </span>
              ) : (
                <span className="text-blue-600">Billet importé</span>
              )}
            </div>
          </div>
        </div>

        {/* Message de statut OCR - Seulement en étape 1 et pas pour succès */}
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

  const ManualTicketForm = () => {
    if (!ocrFailed) return null;

    return (
      <div className="mt-6 mb-4">
        <p className="text-white text-sm mb-4 text-center">
          MERCI DE RENSEIGNER MANUELLEMENT LES DÉTAILS DE PLACEMENT FIGURANT SUR
          VOTRE BILLET
        </p>

        <div className="space-y-2">
          {/* Première ligne - 4 champs si possible, sinon on passe à la ligne suivante */}
          <div className="flex flex-wrap gap-2 justify-start">
            <Input
              placeholder="CAT"
              name="categorie"
              value={manualTicketData.categorie}
              onChange={handleManualTicketChange}
              className="h-10 w-20 text-sm px-2"
            />
            <Input
              placeholder="GRADIN"
              name="gradin"
              value={manualTicketData.gradin}
              onChange={handleManualTicketChange}
              className="h-10 w-20 text-sm px-2"
            />
            <Input
              placeholder="PLACE *"
              name="place"
              value={manualTicketData.place}
              onChange={handleManualTicketChange}
              className="h-10 w-20 text-sm px-2"
              required
            />
            <Input
              placeholder="BLOC"
              name="bloc"
              value={manualTicketData.bloc}
              onChange={handleManualTicketChange}
              className="h-10 w-20 text-sm px-2"
            />
            <Input
              placeholder="RANG *"
              name="rang"
              value={manualTicketData.rang}
              onChange={handleManualTicketChange}
              className="h-10 w-20 text-sm px-2"
              required
            />
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
                        message:
                          "Pour participer à l'expérience, il faut être majeur.",
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

            {/* SECTION BILLET */}
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
                      console.log(
                        "=== CHANGER DE BILLET (compteur conservé) ==="
                      );
                      // Reset tout SAUF le compteur
                      setTicketImage(null);
                      setOcrData(null);
                      setOcrLoad(false);
                      setOcrErrorMessage("");
                      setOcrFailed(false);
                      setOcrStatus(null);
                      setOcrStatusMessage("");
                      // Pas de reset du compteur et plus de key change
                      setManualTicketData({
                        categorie: "",
                        gradin: "",
                        place: "",
                        bloc: "",
                        rang: "",
                      });
                    }}
                    className="text-sm text-blue-500 hover:text-blue-700"
                  >
                    Changer de billet
                  </button>
                </div>
              )}
            </div>

            {/* Formulaire manuel si OCR échoue */}
            <ManualTicketForm />

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
              <div className="text-center text-sm mb-4">
                {ocrFailed ? (
                  <div>
                    {/* Affichage des champs manuels remplis - alignés à gauche */}
                    <div className="text-left">
                      {Object.entries(manualTicketData)
                        .filter(([key, value]) => value && value.trim() !== "")
                        .map(([key, value]) => (
                          <p key={key}>
                            {key.toUpperCase()} : {value}
                          </p>
                        ))}
                    </div>
                  </div>
                ) : ocrData ? (
                  <div>
                    <p className="text-blue-600 font-medium mb-2">
                      Informations du billet analysées automatiquement
                    </p>
                    {/* Affichage 100% dynamique de tous les champs présents - alignés à gauche */}
                    <div className="text-left">
                      {Object.entries(ocrData)
                        .filter(
                          ([key, value]) =>
                            key !== "ticketUrl" && value && value.trim() !== ""
                        )
                        .map(([key, value]) => (
                          <p key={key}>
                            {key.toUpperCase()} : {value}
                          </p>
                        ))}

                      {/* Si aucun champ de placement n'est présent */}
                      {Object.entries(ocrData).filter(
                        ([key, value]) =>
                          key !== "ticketUrl" && value && value.trim() !== ""
                      ).length === 0 && (
                        <p>Informations du billet en cours de traitement</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-blue-600 font-medium">
                    Informations du billet en cours de traitement
                  </p>
                )}
              </div>

              {/* Message d'erreur OCR EN ROUGE */}
              {ocrErrorMessage && (
                <div className="text-center mt-4">
                  <p className="text-red-500 text-sm">{ocrErrorMessage}</p>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div
                onClick={() => setFormStep(1)}
                className="flex items-center cursor-pointer"
              >
                <Checkbox
                  label="MODIFIER MES INFORMATIONS"
                  name="cgu"
                  onChange={handleInputChange}
                  checked={formData.cgu || false}
                  className="w-full pointer-events-none"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center space-x-4">
              <Button
                onClick={() => setFormStep(1)}
                variant="secondary"
                className="flex-1 !bg-white !text-black"
              >
                RETOUR
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
          <LogoHeader date={formattedDate} venue={data?.data?.tours[0]?.name} />
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
