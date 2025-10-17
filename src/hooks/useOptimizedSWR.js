// hooks/useOptimizedSWR.js - Hooks SWR optimisés pour le FRONT OFFICE
import useSWR from 'swr';
import { useMemo } from 'react';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

// Configuration SWR pour les tours (cache 30 minutes)
export function useTours() {
  return useSWR('/api/tours/tour_event', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 1800000, // 30 minutes
    errorRetryCount: 2,
    refreshInterval: 0,
    keepPreviousData: true,
  });
}

// Configuration SWR pour les événements (cache 5 minutes)
export function useEvents() {
  return useSWR('/api/events', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5 minutes
    errorRetryCount: 2,
    refreshInterval: 0,
    keepPreviousData: true,
  });
}

// Configuration SWR pour les participants (cache 2 minutes)
export function useParticipants(eventId) {
  return useSWR(
    eventId ? `/api/participants_fo/event/${eventId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 120000, // 2 minutes
      errorRetryCount: 2,
      refreshInterval: 0,
      keepPreviousData: true,
    }
  );
}

// Configuration SWR pour les tirages (cache 1 minute)
export function useTirages(eventId) {
  return useSWR(
    eventId ? `/api/tirage/event/${eventId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
      errorRetryCount: 2,
      refreshInterval: 0,
      keepPreviousData: true,
    }
  );
}

// Configuration SWR pour les vainqueurs (cache 1 minute)
export function useVainqueurs(eventId) {
  return useSWR(
    eventId ? `/api/vainqueurs/event/${eventId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
      errorRetryCount: 2,
      refreshInterval: 0,
      keepPreviousData: true,
    }
  );
}

// Configuration SWR pour la vérification d'email (cache 30 secondes)
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), eventId })
      });
      
      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.data : null;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30 secondes
      errorRetryCount: 1,
    }
  );
}

// Configuration SWR pour les données critiques (pas de cache)
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

// Configuration SWR pour les statistiques (cache modéré)
export function useStatistics() {
  return useSWR('/api/events/event_participants', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5 minutes
    errorRetryCount: 2,
    refreshInterval: 0,
    keepPreviousData: true,
  });
}

// Utilitaires pour la gestion du cache SWR - FRONT OFFICE
export const SWRConfigFO = {
  // Configuration pour les données de référence (tours, événements)
  reference: {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 1800000, // 30 minutes
    errorRetryCount: 2,
    refreshInterval: 0,
    keepPreviousData: true,
  },
  
  // Configuration pour les données dynamiques (participants)
  dynamic: {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 120000, // 2 minutes
    errorRetryCount: 2,
    refreshInterval: 0,
    keepPreviousData: true,
  },
  
  // Configuration pour les données critiques (tirages, vainqueurs)
  critical: {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 minute
    errorRetryCount: 2,
    refreshInterval: 0,
    keepPreviousData: true,
  },
  
  // Configuration pour les vérifications rapides
  quick: {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000, // 30 secondes
    errorRetryCount: 1,
    refreshInterval: 0,
    keepPreviousData: true,
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
