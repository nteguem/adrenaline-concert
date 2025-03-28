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
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });
  const { data, error } = useSWR("/api/tours", fetcher);
  let formattedDate = null;

  const hasDatePassed = (startDate) => {
    const currentDate = new Date();
    const tourDate = new Date(startDate);
    // console.log("hasreached:", currentDate < tourDate);
    return currentDate < tourDate;
  };

  const hasDateEnd = (endDate) => {
    const currentDate = new Date();
    const tourDate = new Date(endDate);
    // console.log("hasreached:", currentDate > tourDate);
    return currentDate > tourDate;
  };
  const customdateFormat = (passedDate) => {
    // console.log(passedDate);
    const date = new Date(passedDate.startDate);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear(); // Get full year

    // Format to dd.mm.yyyy
    const returnDate = `${day}.${month}.${year}`;
    // console.log("formatted date:", returnDate);
    return returnDate;
  };

  if (error) return <div>Failed to load</div>;
  if (hasDateEnd(data?.data[0].endDate))
    return <div>La date de participation est passé</div>;
  if (hasDatePassed(data?.data[0].startDate))
    return (
      <div>Date de participation {customdateFormat(data.data[0])} ...</div>
    );
  if (!data) return <div>Loading...</div>;
  else {
    formattedDate = customdateFormat(data.data[0]);
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileSelect = (dataUrl, fileName = "") => {
    // Le composant FileUpload nous renvoie déjà un dataURL
    setTicketImage(dataUrl);
    if (fileName) {
      setTicketFileName(fileName);
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
        message: "Veuillez importer votre billet de concert.",
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
        dateNaissance: formData.dateNaissance,
        email: formData.email,
      };
      // console.log("data before post:", postBody);
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
            />
            <Input
              placeholder="PRENOM"
              name="prenom"
              value={formData.prenom}
              onChange={handleInputChange}
            />
            <Input
              type="date"
              placeholder="DATE DE NAISSANCE"
              name="dateNaissance"
              value={formData.dateNaissance}
              onChange={handleInputChange}
              className="text-white"
            />
            <Input
              type="email"
              placeholder="ADRESSE MAIL"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
            />
            <Checkbox
              label="JE CONFIRME MA PRESENCE AU CONCERT"
              checked={formData.confirmePresence}
              onChange={handleInputChange}
              name="confirmePresence"
            />

            <div className="mt-6 mb-4">
              <p className="text-green-400 text-center mb-2">
                Veuillez importer votre billet de concert
              </p>
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
              <Button type="submit">CONTINUER</Button>
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
                <p>BLOC</p>
                <p>RANG</p>
                <p>PLACE</p>
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
                className="w-full"
              />
              <Checkbox
                label="J'accepte les conditions générales"
                name="cgu"
                onChange={handleInputChange}
                checked={formData.cgu || false}
                className="w-full"
              />
            </div>

            <div className="mt-8 flex justify-between items-center">
              <Button onClick={() => setFormStep(1)} variant="secondary">
                RETOUR
              </Button>
              <Button type="submit">JE TENTE MA CHANCE</Button>
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
      <div className="w-full max-w-md mx-auto">
        <div className="mb-12">
          <LogoHeader date={formattedDate} venue={data?.data[0].name} />
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
