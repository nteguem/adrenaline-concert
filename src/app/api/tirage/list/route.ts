import { TirageService } from '@/services/tirageService';

export async function GET() {
  return TirageService.getAllTiragesWithEvents();
}