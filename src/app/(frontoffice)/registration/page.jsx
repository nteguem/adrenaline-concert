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
    confirmePresence: false,
    age: false,
    santéOk: false,
    cgu: false,
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
  const { data, error } = useSWR("/api/tours/tour_event", fetcher);
  let formattedDate = null;

  const hasDatePassed = (startDate) => {
    const currentDate = new Date();
    const tourDate = new Date(startDate);
    tourDate.setHours(8, 0, 0, 0);
    return currentDate < tourDate;
  };
  const range = (start, end, step = 1) => {
    const output = [];
    for (let i = start; i < end; i += step) {
      output.push(i);
    }
    return output;
  }
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
    tourDate.setHours(18, 0, 0, 0);
    // console.log("hasreached:", currentDate > tourDate);
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
  let eventId = null;

  if (error) return <LoadingObject text={"Failed to load"} />;
  if (data) {
    // console.log("data length", data?.data?.tours.length);
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
    // Le composant FileUpload nous renvoie déjà un dataURL
    setTicketImage(dataUrl);
    if (fileName) {
      setTicketFileName(fileName);
    }
    setOcrLoad(true);
    setOcrErrorMessage("");
    try {
      // Create a FormData object
      const formData = new FormData();

      // Convert dataUrl to a Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Append the Blob to the FormData object
      formData.append("file", blob, fileName || "uploaded-image.png");

      // Make the API request
      const apiResponse = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });
      const result = await apiResponse.json();
      // Check for a successful response
      if (!apiResponse.ok) {
        setOcrErrorMessage(
          result?.message || "Erreur lors de l'analyse du billet"
        );
        throw new Error("Network response was not ok");
      }

      if (result?.success === true) {
        setOcrData(result?.data);
        setOcrLoad(false);
      }
      // Handle the result as needed
    } catch (error) {
      console.error("Error fetching OCR:", error);
    }
  };

  const validateForm = () => {
    // Vérifier si tous les champs sont remplis
    if (
      !formData.nom ||
      !formData.prenom ||
      !formData.dateNaissance ||
      !formData.email
    ) {
      setErrorModal({
        isOpen: true,
        title: "Formulaire incomplet",
        message: "Veuillez remplir tous les champs du formulaire.",
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

    // Vérifier si le billet a été importé
    if (!ticketImage) {
      setErrorModal({
        isOpen: true,
        title: "Billet manquant",
        message: "",
        type: "error",
      });
      return false;
    }

    // Si tout est valide, passer à l'étape suivante
    return true;
  };

  const handleNextStep = () => {
    if (formStep === 1 && validateForm()) {
      // Si le formulaire est valide, on passe directement à l'étape de confirmation
      setFormStep(2);
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split("T")[0]; // retourne 'yyyy-MM-dd'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérifier que toutes les conditions sont acceptées
    if (!formData.age || !formData.santéOk || !formData.cgu) {
      setErrorModal({
        isOpen: true,
        title: "Conditions non acceptées",
        message: "Veuillez accepter toutes les conditions pour continuer.",
        type: "error",
      });
      return;
    } else {
      const postBody = {
        nom: formData.nom,
        prenom: formData.prenom,
        dateNaissance: formatDate(formData.dateNaissance),
        email: formData.email,
        eventId: eventId,
        bloc: ocrData?.bloc,
        rang: ocrData?.rang,
        place: parseInt(ocrData?.place, 0),
      };
      const response = await fetch("/api/participants_fo", {
        method: "POST",
        body: JSON.stringify(postBody),
      });

      // Handle response if necessary
      const data = await response.json();
      // console.log("response from push participant", data);
    }

    if (formStep === 2) {
      // Toutes les conditions sont acceptées, rediriger vers la page de confirmation
      router.push("/confirmation");
    }
  };


  const closeModal = () => {
    setErrorModal({ ...errorModal, isOpen: false });
  };

  // Solution: Créer un composant d'aperçu de ticket personnalisé qui utilise directement ticketImage
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
              Billet importé
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
          // Étape 1: Formulaire d'inscription avec upload de billet intégré
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
              className="h-50"
            />
            <Input
              placeholder="PRENOM"
              name="prenom"
              value={formData.prenom}
              onChange={handleInputChange}
              className="mb-0 h-50"
            />
            {/* <Input
              type="date"
              placeholder="DATE DE NAISSANCE"
              name="dateNaissance"
              value={formData.dateNaissance}
              onChange={handleInputChange}
              className="text-white h-50 w-full"
            /> */}
            <div className="w-full">
              <DatePicker
                selected={formData.dateNaissance}
                onChange={(date) =>
                  setFormData({ ...formData, dateNaissance: date })
                }
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
                    <button type="button" className="mr-10" onClick={decreaseMonth} disabled={prevMonthButtonDisabled}>
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
          
                    <button type="button" className="ml-10"  onClick={increaseMonth} disabled={nextMonthButtonDisabled}>
                      {">"}
                    </button>
                  </div>
                )}
                className="text-white h-50 bg-blue-600 text-white w-full rounded p-3 mb-3 placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <Input
              type="email"
              placeholder="ADRESSE MAIL"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="h-50"
            />
            <Checkbox
              label="JE CONFIRME MA PRESENCE AU CONCERT DE CE SOIR"
              checked={formData.confirmePresence}
              onChange={handleInputChange}
              name="confirmePresence"
            />

            <div className="mt-6 mb-4">
              {/* <p className="text-green-400 text-center mb-2">
                Veuillez importer votre billet de concert
              </p> */}
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
                    onClick={() => setTicketImage(null)}
                    className="text-sm text-blue-500 hover:text-blue-700"
                  >
                    Changer de billet
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-center">
              {ocrLoad ? (
                <>
                  {ocrErrorMessage ? (
                    <p className="text-danger">{ocrErrorMessage}</p>
                  ) : (
                    <div>chargement des infos du billet ...</div>
                  )}
                </>
              ) : (
                <Button type="submit">CONTINUEZ</Button>
              )}
            </div>
          </form>
        );
      case 2:
        return (
          // Étape 2: Confirmation et conditions
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <TicketPreview />
              <div className="text-center text-sm mb-4">
                <p className="font-bold">DATE - VILLE</p>
                <p>BLOC {ocrData?.bloc}</p>
                <p>RANG {ocrData?.rang}</p>
                <p>PLACE {ocrData?.place}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <Checkbox
                label="Je certifie avoir plus de 18 ans"
                name="age"
                onChange={handleInputChange}
                checked={formData.age || false}
                className="w-full"
              />
              <Checkbox
                label="Je certifie ne présenter aucune contre indication médicale pour participer à l'Adrénaline MAX"
                name="santéOk"
                onChange={handleInputChange}
                checked={formData.santéOk || false}
                className="w-full "
              />
              <Checkbox
                label="J'accepte les conditions générales"
                name="cgu"
                onChange={handleInputChange}
                checked={formData.cgu || false}
                className="w-full"
              />
            </div>

            <div className="mt-8 flex justify-center items-center">
              <Button type="submit" desabled>
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
