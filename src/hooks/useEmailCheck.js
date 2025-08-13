import useSWR from 'swr';
import { useCallback, useMemo } from 'react';

const fetcher = async ([url, email, eventId]) => {
  if (!email || !eventId || !email.includes('@')) {
    return null;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toLowerCase().trim(), eventId })
  });
  
  if (!response.ok) return null;
  const data = await response.json();
  return data.success ? data.data : null;
};

export function useEmailCheck(email, eventId) {
  // Valide l'email avant de faire la requête
  const shouldCheck = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && eventId;
  }, [email, eventId]);

  const { data, error, isLoading } = useSWR(
    shouldCheck ? ['/api/check-participant', email, eventId] : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3000, // Cache 3 secondes
      errorRetryCount: 1,
    }
  );

  return {
    isChecking: isLoading,
    participantExists: data?.exists || false,
    participantData: data?.participant || null,
    error: error || null
  };
}