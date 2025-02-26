"use client";
import React, { useEffect } from 'react';
import Image from 'next/image';
import { evangelion, din } from '@/styles/fonts';
import LogoHeader from '@/components/common/LogoHeader';

export default function ConfirmationPage() {
  // Effet pour simuler la confetti ou animation de succès
  useEffect(() => {
    // Animation de confirmation pourrait être ajoutée ici
    const timer = setTimeout(() => {
      // Redirection ou autre action après un délai
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

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
        pt-20  // Ajouté pour compenser l'en-tête fixe
      `}
    >
      <div className="max-w-md w-full mx-auto flex flex-col items-center justify-center text-center">
        <LogoHeader date="08.11.25" venue="AMNEVILLE" />
        
        <div className="w-full mb-8">
          <h2 className="text-2xl font-bold mb-6">TA PARTICIPATION A BIEN ÉTÉ<br />PRISE EN COMPTE</h2>          
          <div className="text-lg">
            <p className="mb-2">Nous vous contacterons si vous êtes sélectionné!</p>
            <p className="text-blue-400">Bonne chance!</p>
          </div>
        </div>
      </div>
    </main>
  );
}