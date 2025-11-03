// hooks/useOptimizedSWR.js - Hooks SWR SANS CACHE
import useSWR from 'swr';
import { useMemo } from 'react';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

// Configuration SWR SANS CACHE pour les tours
export function useTours() {
  return useSWR('/api/tours/tour_event', fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 0, // Pas de cache
    errorRetryCount: 2,
    refreshInterval: 0,
    keepPreviousData: false,
  });
}

// Configuration SWR SANS CACHE pour les événements
export function useEvents() {
  return useSWR('/api/events', fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 0, // Pas de cache
    errorRetryCount: 2,
    refreshInterval: 0,
    keepPreviousData: false,
  });
}

// Configuration SWR SANS CACHE pour les participants
export function useParticipants(eventId) {
  return useSWR(
    eventId ? `/api/participants_fo/event/${eventId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 0, // Pas de cache
      errorRetryCount: 2,
      refreshInterval: 0,
      keepPreviousData: false,
    }
  );
}

// Configuration SWR SANS CACHE pour les tirages
export function useTirages(eventId) {
  return useSWR(
    eventId ? `/api/tirage/event/${eventId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 0, // Pas de cache
      errorRetryCount: 2,
      refreshInterval: 0,
      keepPreviousData: false,
    }
  );
}

// Configuration SWR SANS CACHE pour les vainqueurs
export function useVainqueurs(eventId) {
  return useSWR(
    eventId ? `/api/vainqueurs/event/${eventId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 0, // Pas de cache
      errorRetryCount: 2,
      refreshInterval: 0,
      keepPreviousData: false,
    }
  );
}

// Configuration SWR SANS CACHE pour la vérification d'email
export function useEmailCheck(email, eventId) {
  const shouldCheck = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && eventId;
  }, [email, eventId]);
  
  return useSWR(
    shouldCheck ? ['/api/check-participant', email, eventId] : null,
    async ([url, email, eventId]) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify({ email: email.toLowerCase().trim(), eventId }),
        cache: 'no-store'
      });
      
      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.data : null;
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 0, // Pas de cache
      errorRetryCount: 1,
    }
  );
}

// Configuration SWR SANS CACHE pour les données critiques
export function useCriticalData(url) {
  return useSWR(url, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 0,
    errorRetryCount: 3,
    refreshInterval: 0,
    keepPreviousData: false,
  });
}

// Configuration SWR SANS CACHE pour les statistiques
export function useStatistics() {
  return useSWR('/api/events/event_participants', fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 0, // Pas de cache
    errorRetryCount: 2,
    refreshInterval: 0,
    keepPreviousData: false,
  });
}

// Utilitaires pour la gestion du cache SWR - SANS CACHE
export const SWRConfigFO = {
  // Configuration pour les données de référence (SANS CACHE)
  reference: {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 0, // Pas de cache
    errorRetryCount: 2,
    refreshInterval: 0,
    keepPreviousData: false,
  },
  
  // Configuration pour les données dynamiques (SANS CACHE)
  dynamic: {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 0, // Pas de cache
    errorRetryCount: 2,
    refreshInterval: 0,
    keepPreviousData: false,
  },
  
  // Configuration pour les données critiques (SANS CACHE)
  critical: {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 0, // Pas de cache
    errorRetryCount: 2,
    refreshInterval: 0,
    keepPreviousData: false,
  },
  
  // Configuration pour les vérifications rapides (SANS CACHE)
  quick: {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 0, // Pas de cache
    errorRetryCount: 1,
    refreshInterval: 0,
    keepPreviousData: false,
  }
};

export default {
  useTours,
  useEvents,
  useParticipants,
  useTirages,
  useVainqueurs,
  useEmailCheck,
  useCriticalData,
  useStatistics,
  SWRConfigFO
};
