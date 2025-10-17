// Ce fichier est maintenant remplacé par useOptimizedSWR.js
// Gardé pour compatibilité avec les anciens composants
import { useEmailCheck as useOptimizedEmailCheck } from './useOptimizedSWR';

export function useEmailCheck(email, eventId) {
  return useOptimizedEmailCheck(email, eventId);
}