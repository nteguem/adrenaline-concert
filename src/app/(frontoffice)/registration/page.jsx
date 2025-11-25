"use client";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/common/Input";
import Checkbox from "@/components/common/Checkbox";
// import FileUpload from "@/components/common/FileUpload";
import Button from "@/components/common/Button";
import PopupModal from "@/components/common/PopupModal";
import { din, evangelion } from "@/styles/fonts";
import LoadingObject from "@/components/common/CentralLoadingObject";
import Countdown from "@/components/common/CountDown";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getYear, getMonth } from "date-fns";
import { useTours, useEmailCheck } from "@/hooks/useOptimizedSWR";

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
      <h1 className={`${evangelion.className} text-6xl text-white text-center whitespace-nowrap`}>
        ADRENALINE TOUR
      </h1>
      {(venue || date || city) && (
        <div className={`text-center ${getFontSize(subtitleText)} text-white whitespace ma-w-full`}>
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
  const [certifiePresent, setCertifiePresent] = useState(false);
  const [typePlacement, setTypePlacement] = useState("GRADIN"); // "GRADIN" ou "PARTERRE" - GRADIN par défaut (déprécié, gardé pour compatibilité)
  const [gradinNumber, setGradinNumber] = useState(""); // Déprécié, gardé pour compatibilité
  const [isStep3Editable, setIsStep3Editable] = useState(false); // État pour activer/désactiver l'édition au step 3
  const [radioFields, setRadioFields] = useState({}); // Pour stocker les valeurs des champs radio dynamiques
  const [radioTextFields, setRadioTextFields] = useState({}); // Pour stocker les valeurs des inputs associés
  const uploadAttemptsRef = useRef(0);

  const { data, error } = useTours();
  // const { isChecking, participantExists, participantData } = useEmailCheck(formData.email, data?.data?.tours[0]?.nextEvent?.id);

  // Fonction pour normaliser les noms de champs de l'API vers les clés utilisées dans le code
  const normalizePlacementFieldName = useCallback((fieldName) => {
    // Convertir en minuscules et remplacer les espaces par des underscores
    const normalized = fieldName.toLowerCase().replace(/\s+/g, '_');
    // Mapping spécial pour certains champs
    const mappings = {
      'gradin_ou_parterre': 'typePlacement', // Géré séparément (déprécié)
      'categorie': 'categorie',
      'rang': 'rang',
      'place': 'place',
    };
    return mappings[normalized] || normalized;
  }, []);

  // Fonction pour détecter si un champ contient " OU " et extraire les options
  const parseRadioField = useCallback((fieldName) => {
    const upperField = fieldName.toUpperCase();
    if (upperField.includes(" OU ")) {
      const parts = upperField.split(" OU ");
      if (parts.length === 2) {
        return {
          isRadio: true,
          option1: parts[0].trim(),
          option2: parts[1].trim(),
          originalField: fieldName
        };
      }
    }
    return { isRadio: false };
  }, []);

  // Initialiser les champs de placement depuis l'API
  useEffect(() => {
    if (data?.data?.tours[0]?.nextEvent?.placement) {
      const initialPlacementData = {};
      const initialRadioFields = {};
      const initialRadioTextFields = {};

      data.data.tours[0].nextEvent.placement.forEach((field) => {
        const parsed = parseRadioField(field);
        if (parsed.isRadio) {
          // Initialiser avec la première option par défaut
          initialRadioFields[field] = parsed.option1;
          initialRadioTextFields[field] = "";
        } else {
          const normalizedName = normalizePlacementFieldName(field);
          initialPlacementData[normalizedName] = "";
        }
      });

      setPlacementData(initialPlacementData);
      setRadioFields(initialRadioFields);
      setRadioTextFields(initialRadioTextFields);
    }
  }, [data, parseRadioField, normalizePlacementFieldName]);

  // Réinitialiser FORCÉMENT le modal d'erreur de placement au step 1
  useEffect(() => {
    if (formStep === 1) {
      // Si on est au step 1, fermer IMMÉDIATEMENT toute erreur liée au placement
      const isPlacementError = errorModal.message && (
        errorModal.message.toLowerCase().includes("placement") ||
        errorModal.message.toLowerCase().includes("renseigner au moins un champ")
      );

      if (isPlacementError && errorModal.isOpen) {
        console.log("[useEffect] FORCAGE : Fermeture du modal d'erreur de placement au step 1");
        setErrorModal({ isOpen: false, title: "", message: "", type: "error" });
      }
    }
  }, [formStep]);

  const placementFields = useMemo(() => data?.data?.tours[0]?.nextEvent?.placement || [], [data]);

  const handlePlacementChange = useCallback((e) => {
    const { name, value } = e.target;
    setPlacementData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Vérifier si on a des informations de placement valides (OCR ou manuel)
  // IMPORTANT : Cette fonction ne doit JAMAIS être appelée au step 1
  const hasValidPlacementData = () => {
    // SÉCURITÉ ABSOLUE : Si on est au step 1, retourner true immédiatement (ne JAMAIS valider)
    if (formStep !== 2) {
      console.warn("[hasValidPlacementData] Appelée au step", formStep, "- Retourne true par sécurité");
      return true; // Ne JAMAIS bloquer au step 1
    }

    // Vérifier les champs radio dynamiques
    const radioFieldNames = placementFields.filter(field => parseRadioField(field).isRadio);
    for (const fieldName of radioFieldNames) {
      if (radioTextFields[fieldName] && radioTextFields[fieldName].trim() !== "") {
        return true;
      }
    }

    // Vérifier les autres champs dynamiques
    const otherFields = placementFields.filter(field => !parseRadioField(field).isRadio);
    if (otherFields.length > 0) {
      // Vérifier qu'AU MOINS UN champ dynamique est rempli
      const hasDynamicFields = otherFields.some(field => {
        const normalizedName = normalizePlacementFieldName(field);
        const value = placementData[normalizedName];
        return value && value.trim() !== "";
      });
      return hasDynamicFields;
    }

    // Si aucun champ n'est configuré dans l'API, c'est OK
    return true;
  };

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
    return `${day}.${month}.${year}`;
  };

  // Gestion des états de chargement et d'erreur
  if (error) return <LoadingObject text={"Failed to load"} />;
  if (!data) return <LoadingObject text={"Loading ..."} />;

  if (data?.data?.tours.length === 0) return <LoadingObject text={"le formulaire est clôturé"} />;
  const evt = data?.data?.tours[0]?.nextEvent;
  const showForm = shouldShowForm(evt?.eventDate, evt?.endDate);
  if (!showForm) return <LoadingObject text={"le formulaire est clôturé"} />;

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
      // Envoyer le nom d'artiste/tournée si disponible
      const expectedArtist = data?.data?.tours?.[0]?.artistName
        ?? data?.data?.tours?.[0]?.artist
        ?? data?.data?.tours?.[0]?.eventName
        ?? data?.data?.tours?.[0]?.nextEvent?.artistName
        ?? data?.data?.tours?.[0]?.nextEvent?.artist;
      if (expectedArtist) {
        formData.append("eventName", expectedArtist);
      }

      const apiResponse = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
        cache: "no-store"
      });
      const result = await apiResponse.json();

      if (!apiResponse.ok || !result?.success) {
        setOcrLoad(false);

        // Pour WRONG_EVENT_DATE, on applique aussi la règle des 2 tentatives
        if (result?.errorType === "WRONG_EVENT_DATE") {
          if (attempts >= 2) {
            setOcrFailed(true);
            setOcrStatus("error");
            setOcrStatusMessage("Date incorrecte sur le billet");
          } else {
            setOcrStatus("error");
            setOcrStatusMessage("Date incorrecte sur le billet");
          }
          return;
        }

        // Pour les autres erreurs
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
      const ocrRadioFields = {};
      const ocrRadioTextFields = {};
      const currentPlacementFields = data?.data?.tours[0]?.nextEvent?.placement || [];

      if (result?.data) {
        Object.keys(result.data).forEach((key) => {
          if (key !== "ticketUrl" && key !== "date") {
            // Vérifier si cette clé correspond à un champ radio
            const matchingField = currentPlacementFields.find(field => {
              const parsed = parseRadioField(field);
              if (parsed.isRadio) {
                // Vérifier si la clé correspond au champ original ou normalisé
                const normalized = normalizePlacementFieldName(field);
                return key === field || key === normalized || key.toLowerCase() === field.toLowerCase();
              }
              return false;
            });

            if (matchingField) {
              const parsed = parseRadioField(matchingField);
              // Si c'est un champ radio, extraire le type et la valeur
              // On suppose que l'OCR retourne un objet avec type et value, ou juste la valeur
              if (typeof result.data[key] === 'object' && result.data[key].type) {
                ocrRadioFields[matchingField] = result.data[key].type;
                ocrRadioTextFields[matchingField] = result.data[key].value || "";
              } else {
                // Sinon, on met la valeur dans le textField et on garde l'option par défaut
                ocrRadioTextFields[matchingField] = result.data[key];
                if (!ocrRadioFields[matchingField]) {
                  ocrRadioFields[matchingField] = parsed.option1;
                }
              }
            } else {
              ocrPlacementData[key] = result.data[key];
            }
          }
        });
      }

      setOcrData(result?.data);
      setPlacementData(ocrPlacementData);
      setRadioFields(prev => ({ ...prev, ...ocrRadioFields }));
      setRadioTextFields(prev => ({ ...prev, ...ocrRadioTextFields }));
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

    // if (participantExists) {
    //   setErrorModal({ isOpen: true, title: "Email déjà utilisé", message: "l'adresse email saisie a déjà été utilisée pour cet évènement", type: "error" });
    //   return false;
    // }

    // PAS de vérification des champs de placement au step 1
    // Ils seront validés au step 2 lors du submit final

    return true;
  };

  const isButtonDisabled = () => {
    return false; // return ocrLoad; // OCR désactivé temporairement
  };

  const handleNextStep = () => {
    if (formStep === 1 && validateForm()) {
      // Réinitialiser le modal d'erreur avant de passer au step 2
      setErrorModal({ isOpen: false, title: "", message: "", type: "error" });
      setFormStep(2);
    }
  };

  const formatDate = (date) => date.toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // SÉCURITÉ ABSOLUE : Ne jamais exécuter au step 1
    if (formStep !== 2) {
      console.error("[handleSubmit] BLOCAGE : Appelé au step", formStep, "- Ignoré immédiatement");
      // Réinitialiser toute erreur de placement qui pourrait persister
      if (errorModal.message.includes("placement")) {
        setErrorModal({ isOpen: false, title: "", message: "", type: "error" });
      }
      return;
    }

    if (!certifiePresent) {
      setErrorModal({ isOpen: true, title: "Vous devez être présent", message: "Votre présence au concert de ce jour est obligatoire.", type: "error" });
      return;
    }

    // Validation des champs de placement au step 2 uniquement
    const placementValid = hasValidPlacementData();
    if (!placementValid) {
      setErrorModal({ isOpen: true, title: "Informations manquantes", message: "Veuillez renseigner au moins un champ de placement obligatoire.", type: "error" });
      return;
    }

    // Passer au step 3 (récapitulatif) au lieu de soumettre directement
    setFormStep(3);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();

    // SÉCURITÉ ABSOLUE : Ne jamais exécuter en dehors du step 3
    if (formStep !== 3) {
      console.error("[handleFinalSubmit] BLOCAGE : Appelé au step", formStep, "- Ignoré immédiatement");
      return;
    }

    // Construire les valeurs de placement avec les champs radio dynamiques
    const radioPlacementValues = {};
    Object.keys(radioFields).forEach((fieldName) => {
      radioPlacementValues[fieldName] = {
        type: radioFields[fieldName],
        value: radioTextFields[fieldName] || ""
      };
    });

    const postBody = {
      nom: formData.nom, prenom: formData.prenom, dateNaissance: formatDate(formData.dateNaissance),
      email: formData.email, phone: formData.phone, eventId: data?.data?.tours[0]?.nextEvent.id,
      accepteInfos: formData.confirmePresence,
      placementValues: {
        ...placementData,
        ...radioPlacementValues,
        // Garder pour compatibilité avec l'ancien système
        typePlacement: typePlacement,
        gradinNumber: gradinNumber,
      },
      ticketUrl: ocrData?.ticketUrl || ticketImage || "", // Utiliser l'image si pas d'OCR, sinon chaîne vide
      textInfo: ocrFailed ? "Billet rempli manuellement après échec OCR" : "Billet rempli manuellement",
    };

    try {
      const response = await fetch("/api/participants_fo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        },
        body: JSON.stringify(postBody),
        cache: "no-store"
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch (_) {
        // ignore json parse errors, we'll fallback to generic message
      }

      if (!response.ok || payload?.success === false) {
        const serverMsg = payload?.error || "Une erreur est survenue. Veuillez réessayer.";
        const isDup = /déjà|existe|already/i.test(serverMsg);
        setErrorModal({
          isOpen: true,
          title: isDup ? "Email déjà utilisé" : "Erreur",
          message: isDup ? "l'adresse email saisie a déjà été utilisée pour cet évènement" : serverMsg,
          type: "error",
        });
        return;
      }

      if (formStep === 3) router.push("/confirmation");
    } catch (err) {
      setErrorModal({
        isOpen: true,
        title: "Erreur réseau",
        message: "Impossible d'envoyer le formulaire. Vérifiez votre connexion et réessayez.",
        type: "error",
      });
    }
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
          <div className={`px-4 py-2 text-sm animate-fade-in ${ocrFailed ? "bg-orange-100 text-orange-700 border-t border-orange-200" : "bg-red-100 text-red-700 border-t border-red-200"
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

  // Calculer la date maximale (il y a 18 ans à partir d'aujourd'hui)
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const maxYear = getYear(maxDate);

  const years = range(1950, maxYear + 1, 1);
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
                autoComplete="off"
                selected={formData.dateNaissance}
                onChange={(date) => {
                  setFormData({ ...formData, dateNaissance: date });
                }}
                placeholderText="DATE DE NAISSANCE"
                name="dateNaissance"
                dateFormat={"dd/MM/yyyy"}
                maxDate={maxDate}
                inputProps={{ readOnly: true }}
                onFocus={(e) => e.target.blur()}
                withPortal
                popperPlacement="bottom-start"
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [0, 8],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
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
                className="h-50 w-full"
              />
            </div>

            <Checkbox
              label="J'ACCEPTE DE RECEVOIR DES INFORMATIONS CONCERNANT ADRENALINE TOUR"
              checked={formData.confirmePresence} onChange={handleInputChange} name="confirmePresence"
            />

            {/* <div className="mt-6 mb-4"> */}
            {/* {!ticketImage ? (
                <FileUpload onFileSelect={(dataUrl, fileName) => handleFileSelect(dataUrl, fileName)}
                  initialPreview={ticketImage} initialFileName={ticketFileName} />
              ) : (
                <TicketPreview />
              )}

              {ticketImage && !ocrFailed && ocrStatus !== "success" && (
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
              )} */}
            {/* </div> */}

            {/* Champs de placement - Retirés du step 1, affichés uniquement dans le step 2 */}

            <div className="mt-4 flex justify-center">
              {/* {ocrLoad ? (
                <div className="text-center text-white">
                  <div>Chargement des infos du billet...</div>
                </div>
              ) : ( */}
              <Button type="submit" disabled={isButtonDisabled()}
                className="transition-colors">
                CONTINUEZ
              </Button>
              {/* )} */}
            </div>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              {/* {ticketImage && <TicketPreview />} */}

              {/* Checkbox "JE CERTIFIE ÊTRE BIEN PRÉSENT..." */}
              <div className="bg-black flex items-center px-4 py-3 mb-4">
                <input
                  type="checkbox"
                  id="certifiePresent"
                  checked={certifiePresent}
                  onChange={(e) => {
                    setCertifiePresent(e.target.checked);
                    setIsPlacementEditable(e.target.checked);
                  }}
                  className="mr-3 flex-shrink-0 cursor-pointer w-4 h-4"
                />
                <label
                  htmlFor="certifiePresent"
                  className="text-white font-bold text-xs uppercase leading-tight cursor-pointer flex-1"
                >
                  JE CERTIFIE ÊTRE BIEN PRESENT AU CONCERT DE CE JOUR
                </label>
              </div>

              {/* Zone avec nom de l'événement et date */}
              {data?.data?.tours[0]?.nextEvent && (() => {
                const event = data.data.tours[0].nextEvent;
                const endDate = event.endDate ? new Date(event.endDate) : null;
                const formattedEventDate = endDate
                  ? `${String(endDate.getUTCDate()).padStart(2, "0")}.${String(endDate.getUTCMonth() + 1).padStart(2, "0")}.${endDate.getUTCFullYear()}`
                  : "";
                const cityName = event.city ? event.city.toUpperCase() : "";
                const displayText = cityName && formattedEventDate
                  ? `${cityName} - ${formattedEventDate}`
                  : cityName || event.venue || "Événement";

                return (
                  <div className="bg-white rounded px-4 py-3 mb-6">
                    <p className="text-black font-bold text-base text-center">
                      {displayText}
                    </p>
                  </div>
                );
              })()}

              <div className="mb-3">
                {/* Titre principal */}
                <h6 className="text-white font-bold text-sm uppercase mb-6 text-center">
                  JE REMPLIE LES INFORMATIONS DE PLACEMENT MENTIONNÉES SUR MON BILLET
                </h6>

                {/* Champs radio dynamiques (détection automatique des champs contenant " OU ") */}
                {placementFields
                  .filter(field => parseRadioField(field).isRadio)
                  .map((field) => {
                    const parsed = parseRadioField(field);
                    const fieldKey = field;
                    const currentValue = radioFields[fieldKey] || parsed.option1;

                    return (
                      <div key={fieldKey} className="flex items-center gap-4 mb-6">
                        {/* Colonne gauche : Radio buttons et labels */}
                        <div className="flex flex-col space-y-4">
                          {/* Option 1 */}
                          <div className="flex items-center gap-3 mr-2">
                            <input
                              type="radio"
                              id={`${fieldKey}-option1`}
                              name={`radio-${fieldKey}`}
                              value={parsed.option1}
                              checked={currentValue === parsed.option1}
                              onChange={(e) => {
                                setRadioFields(prev => ({ ...prev, [fieldKey]: e.target.value }));
                              }}
                              disabled={!certifiePresent}
                              className="w-5 h-5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <label htmlFor={`${fieldKey}-option1`} className="text-white font-bold text-base uppercase cursor-pointer whitespace-nowrap">
                              {parsed.option1}
                            </label>
                          </div>

                          {/* Option 2 */}
                          <div className="flex items-center gap-3 mr-2">
                            <input
                              type="radio"
                              id={`${fieldKey}-option2`}
                              name={`radio-${fieldKey}`}
                              value={parsed.option2}
                              checked={currentValue === parsed.option2}
                              onChange={(e) => {
                                setRadioFields(prev => ({ ...prev, [fieldKey]: e.target.value }));
                              }}
                              disabled={!certifiePresent}
                              className="w-5 h-5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <label htmlFor={`${fieldKey}-option2`} className="text-white font-bold text-base uppercase cursor-pointer whitespace-nowrap">
                              {parsed.option2}
                            </label>
                          </div>
                        </div>

                        {/* Champ input partagé au milieu */}
                        <div className="flex-1 flex items-center">
                          <Input
                            type="text"
                            value={radioTextFields[fieldKey] || ""}
                            onChange={(e) => {
                              setRadioTextFields(prev => ({ ...prev, [fieldKey]: e.target.value }));
                            }}
                            disabled={!certifiePresent}
                            placeholder=""
                            className={`w-full h-10 rounded ${certifiePresent
                              ? "bg-white text-black border-gray-300"
                              : "bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed"
                              }`}
                          />
                        </div>
                      </div>
                    );
                  })}

                {/* Champs dynamiques depuis l'API (sauf les champs "OU" qui sont gérés au-dessus) */}
                {placementFields.filter(field => !parseRadioField(field).isRadio).length > 0 && (
                  <div className={`grid gap-4 ${placementFields.filter(f => !parseRadioField(f).isRadio).length === 1 ? 'grid-cols-1' : placementFields.filter(f => !parseRadioField(f).isRadio).length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {placementFields
                      .filter(field => !parseRadioField(field).isRadio)
                      .map((field) => {
                        const normalizedName = normalizePlacementFieldName(field);
                        return (
                          <div key={field} className="flex flex-col">
                            <label className="text-white font-bold text-sm uppercase mb-2">
                              {field.toUpperCase()}
                            </label>
                            <Input
                              name={normalizedName}
                              value={placementData[normalizedName] || ""}
                              onChange={handlePlacementChange}
                              disabled={!certifiePresent}
                              className={`h-10 rounded ${certifiePresent
                                ? "bg-white text-black border-gray-300 hover:bg-gray-50"
                                : "bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed"
                                }`}
                              autoComplete="off"
                            />
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>


              <h6 className="text-white font-bold text-sm uppercase mb-6 text-left"  >
                Veillez a bien renseigner tous les champs ci-dessus. <br /> si vous gagnez, votre billet vous sera demandé pour verification.
              </h6>
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

      case 3: {
        // Collecter tous les champs de placement à afficher
        const allPlacementFields = [];

        // Ajouter les champs radio dynamiques
        placementFields
          .filter(field => parseRadioField(field).isRadio)
          .forEach((field) => {
            allPlacementFields.push({
              label: field.toUpperCase(),
              value: radioTextFields[field] || "",
              key: field,
              isRadio: true,
              radioValue: radioFields[field]
            });
          });

        // Ajouter les autres champs dynamiques
        placementFields
          .filter(field => !parseRadioField(field).isRadio)
          .forEach((field) => {
            const normalizedName = normalizePlacementFieldName(field);
            allPlacementFields.push({
              label: field.toUpperCase(),
              value: placementData[normalizedName] || "",
              key: normalizedName,
              isSpecial: false
            });
          });

        return (
          <form onSubmit={handleFinalSubmit}>
            <div className="mb-8">
              {/* Header avec titre */}
              <div className="flex items-center mb-6">
                <p className="text-white text-sm font-bold uppercase">
                  JE VERIFIE ET MODIFIE MES INFORMATIONS SI BESOIN
                </p>
              </div>

              {/* Grille des champs de placement (2x2) */}
              <div className="grid grid-cols-2 gap-4">
                {allPlacementFields.map((field, index) => (
                  <div key={field.key || index} className="flex flex-col">
                    <label className="text-white font-bold text-xs uppercase mb-2">
                      {field.label}
                    </label>
                    {field.isRadio ? (
                      <Input
                        type="text"
                        value={field.value}
                        onChange={(e) => {
                          setRadioTextFields(prev => ({ ...prev, [field.key]: e.target.value }));
                        }}
                        className="!h-16 !rounded-lg !font-bold !border-0 !mb-0 !pl-3 focus:!outline-none focus:!ring-0 !bg-white !text-black focus:!bg-white focus:!text-black cursor-text"
                        style={{ padding: '12px 16px', fontSize: '2rem', lineHeight: '2rem', fontWeight: '700' }}
                        autoComplete="off"
                      />
                    ) : (
                      <Input
                        name={field.key}
                        value={field.value}
                        onChange={handlePlacementChange}
                        className="!h-16 !rounded-lg !font-bold !border-0 !mb-0 !pl-3 focus:!outline-none focus:!ring-0 !bg-white !text-black focus:!bg-white focus:!text-black cursor-text"
                        style={{ padding: '12px 16px', fontSize: '2rem', lineHeight: '2rem', fontWeight: '700' }}
                        autoComplete="off"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center space-x-4">
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("[Step 3] Bouton RETOUR cliqué, retour au step 2");
                  setIsStep3Editable(false); // Réinitialiser l'état d'édition
                  setFormStep(2);
                }}
                variant="secondary"
                className="flex-1 !bg-white !text-black h-12 min-h-[48px] flex items-center justify-center !cursor-pointer"
              >
                RETOUR
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 min-h-[48px] flex items-center justify-center"
              >
                VALIDER
              </Button>
            </div>
          </form>
        );
      }

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