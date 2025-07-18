"use client";
import React, { useRef, useState } from "react";
import { Download, Check, X, FileText, Image as ImageIcon, Camera, Upload } from "lucide-react";

const FileUpload = ({
  onFileSelect,
  label = "J'IMPORTE MON BILLET OU JE LE PRENDS EN PHOTO",
}) => {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraSupported, setCameraSupported] = useState(false);

  // Vérifier le support de la caméra au montage du composant
  React.useEffect(() => {
    checkCameraSupport();
  }, []);

  const checkCameraSupport = () => {
    // Vérifier si on est en HTTPS ou localhost
    const isSecureContext = window.location.protocol === 'https:' || 
                           window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
    
    // Vérifier si l'API existe
    const hasMediaDevices = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    
    // Support caméra = contexte sécurisé + API disponible
    setCameraSupported(isSecureContext && hasMediaDevices);
  };

  const handleButtonClick = () => {
    setShowModal(true);
  };

  const handleFileUpload = () => {
    setShowModal(false);
    fileInputRef.current.click();
  };

  const handleCameraCapture = async () => {
    // Double vérification avant d'essayer d'accéder à la caméra
    if (!cameraSupported) {
      setCameraError("La caméra n'est pas disponible sur cet appareil ou ce navigateur.");
      return;
    }

    try {
      setCameraError("");
      setShowModal(false);
      setCameraMode(true);

      // Vérification finale de l'API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("API caméra non disponible");
      }

      // Demander l'accès à la caméra avec différentes contraintes selon l'appareil
      const constraints = {
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        }
      };

      // Ajouter facingMode seulement sur mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        constraints.video.facingMode = "environment";
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error("Erreur accès caméra:", error);
      
      let errorMessage = "";
      if (error.name === 'NotAllowedError') {
        errorMessage = "Accès à la caméra refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "Aucune caméra trouvée sur cet appareil.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "La caméra n'est pas supportée sur ce navigateur.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "La caméra est déjà utilisée par une autre application.";
      } else if (error.message.includes("API caméra non disponible")) {
        errorMessage = "La caméra n'est pas disponible. Essayez de téléverser un fichier.";
      } else {
        errorMessage = "Impossible d'accéder à la caméra. Vérifiez que vous êtes en HTTPS et que les permissions sont accordées.";
      }
      
      setCameraError(errorMessage);
      setCameraMode(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Définir la taille du canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Dessiner l'image de la vidéo sur le canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convertir en base64
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Arrêter la caméra
      stopCamera();
      
      // Définir les informations du fichier
      const currentDate = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const capturedFileName = `photo-billet-${currentDate}.jpg`;
      
      setPreview(dataUrl);
      setFileName(capturedFileName);
      setFileType("image/jpeg");
      setCameraMode(false);
      
      // Appeler la fonction de callback
      onFileSelect(dataUrl, capturedFileName);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraMode(false);
    setCameraError("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      setFileType(file.type);

      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target.result);
        onFileSelect(event.target.result, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setPreview(null);
    setFileName("");
    setFileType("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onFileSelect(null);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const renderPreviewContent = () => {
    if (fileType.startsWith("image/")) {
      return (
        <img
          src={preview}
          alt="Aperçu"
          className="w-full h-full object-cover"
        />
      );
    } else if (fileType === "application/pdf") {
      return (
        <div className="w-full h-full flex items-center justify-center bg-blue-50">
          <FileText className="h-10 w-10 text-blue-500" />
        </div>
      );
    } else {
      return (
        <div className="w-full h-full flex items-center justify-center bg-blue-50">
          <FileText className="h-10 w-10 text-blue-500" />
        </div>
      );
    }
  };

  const getFileIcon = () => {
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4 mr-1" />;
    } else if (fileType === "application/pdf") {
      return <FileText className="h-4 w-4 mr-1" />;
    } else {
      return <FileText className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <div className="w-full">
      {!preview ? (
        // Bouton d'importation lorsqu'aucun fichier n'est sélectionné
        <button
          type="button"
          onClick={handleButtonClick}
          className="bg-white hover:bg-blue-500 text-gray-700 font-bold py-3 px-6 rounded w-full flex items-center justify-between"
        >
          <span>{label}</span>
          <Download className="h-5 w-5" />
        </button>
      ) : (
        // Aperçu du fichier après sélection
        <div
          className="w-full rounded overflow-hidden border-2 border-blue-500 bg-blue-100 cursor-pointer"
          onClick={handleButtonClick}
        >
          <div className="relative">
            {/* Aperçu du fichier */}
            <div className="flex items-center p-2">
              <div className="w-16 h-16 mr-4 bg-white rounded overflow-hidden flex-shrink-0">
                {renderPreviewContent()}
              </div>

              <div className="flex-grow">
                <p className="font-medium text-blue-800 truncate">{fileName}</p>
                <p className="text-sm text-blue-600 flex items-center">
                  {getFileIcon()}
                  Billet importé
                </p>
              </div>

              <button
                onClick={clearFile}
                className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input file caché */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        className="hidden"
      />

      {/* Canvas caché pour la capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Modale de choix */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white rounded-lg p-8 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-6 text-center">
              Comment voulez-vous ajouter votre billet ?
            </h3>
            
            <div className="space-y-4">
              {/* Bouton Upload */}
              <button
                onClick={handleFileUpload}
                className="w-full bg-white hover:bg-gray-100 text-black font-bold py-4 px-6 rounded flex items-center justify-center space-x-3 transition-colors"
              >
                <Upload className="h-6 w-6" />
                <span>IMPORTER UN FICHIER</span>
              </button>

              {/* Bouton Caméra - affiché seulement si supporté */}
              {cameraSupported ? (
                <button
                  onClick={handleCameraCapture}
                  className="w-full bg-white hover:bg-gray-100 text-black font-bold py-4 px-6 rounded flex items-center justify-center space-x-3 transition-colors"
                >
                  <Camera className="h-6 w-6" />
                  <span>PRENDRE UNE PHOTO</span>
                </button>
              ) : (
                <div className="w-full bg-gray-600 text-gray-300 font-bold py-4 px-6 rounded flex items-center justify-center space-x-3 cursor-not-allowed">
                  <Camera className="h-6 w-6" />
                  <span>CAMÉRA NON DISPONIBLE</span>
                </div>
              )}
            </div>

            {/* Bouton Annuler */}
            <button
              onClick={closeModal}
              className="w-full mt-6 bg-transparent hover:bg-white hover:text-black text-white font-bold py-3 px-6 rounded border border-white transition-colors"
            >
              ANNULER
            </button>
          </div>
        </div>
      )}

      {/* Interface caméra */}
      {cameraMode && (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
          {/* Header */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <button
              onClick={stopCamera}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
            >
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-white font-medium">Prenez votre billet en photo</h3>
            <div className="w-10"></div> {/* Spacer */}
          </div>

          {/* Vidéo */}
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Overlay de guidage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-white border-dashed rounded-lg w-80 h-60 flex items-center justify-center">
                <span className="text-white text-sm text-center px-4">
                  Positionnez votre billet dans ce cadre
                </span>
              </div>
            </div>
          </div>

          {/* Bouton de capture */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <button
              onClick={capturePhoto}
              className="bg-white hover:bg-gray-100 text-gray-800 p-4 rounded-full shadow-lg"
            >
              <Camera className="h-8 w-8" />
            </button>
          </div>

          {/* Message d'erreur caméra */}
          {cameraError && (
            <div className="absolute bottom-20 left-4 right-4 bg-red-500 text-white p-3 rounded-lg text-center">
              {cameraError}
              <button
                onClick={() => setCameraError("")}
                className="ml-2 underline"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
