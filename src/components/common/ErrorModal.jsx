"use client";
import React from 'react';
import PopupModal from './PopupModal';

export const DateErrorModal = ({ isOpen, onClose }) => {
  return (
    <PopupModal
      isOpen={isOpen}
      onClose={onClose}
      title="Erreur de date ou ville"
      message="Le billet que vous avez importé ne correspond pas à la date ou à la ville du concert. Veuillez vérifier votre billet."
      type="error"
    />
  );
};

export const ScannedTicketModal = ({ isOpen, onClose }) => {
  return (
    <PopupModal
      isOpen={isOpen}
      onClose={onClose}
      title="Billet déjà scanné"
      message="Ce billet a déjà été scanné. Chaque billet ne peut être utilisé qu'une seule fois pour participer à l'expérience."
      type="error"
    />
  );
};

export const UnreadableTicketModal = ({ isOpen, onClose }) => {
  return (
    <PopupModal
      isOpen={isOpen}
      onClose={onClose}
      title="Billet illisible"
      message="Nous n'arrivons pas à lire clairement les informations de votre billet. Veuillez prendre une photo plus nette ou essayer de scanner à nouveau."
      type="warning"
    />
  );
};

// Utilisation des modals dans les composants
/*
import { DateErrorModal, ScannedTicketModal, UnreadableTicketModal } from '@/components/common/ErrorModals';

// Dans votre composant
const [dateErrorOpen, setDateErrorOpen] = useState(false);
const [scannedErrorOpen, setScannedErrorOpen] = useState(false);
const [unreadableErrorOpen, setUnreadableErrorOpen] = useState(false);

// Pour ouvrir un modal
const handleTicketError = (errorType) => {
  if (errorType === 'date') setDateErrorOpen(true);
  else if (errorType === 'scanned') setScannedErrorOpen(true);
  else if (errorType === 'unreadable') setUnreadableErrorOpen(true);
};

// Dans le JSX
<DateErrorModal 
  isOpen={dateErrorOpen} 
  onClose={() => setDateErrorOpen(false)} 
/>
<ScannedTicketModal 
  isOpen={scannedErrorOpen} 
  onClose={() => setScannedErrorOpen(false)} 
/>
<UnreadableTicketModal 
  isOpen={unreadableErrorOpen} 
  onClose={() => setUnreadableErrorOpen(false)} 
/>
*/