import { TourService } from '@/services/tourService';

export async function GET() {
  return TourService.getToursWithEvents();
}