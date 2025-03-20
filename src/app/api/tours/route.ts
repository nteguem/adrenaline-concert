import { NextRequest } from 'next/server';
import { TourService } from '@/services/tourService';

export async function GET(request: NextRequest) {
  return TourService.handleGetAllTour(request);
}

export async function POST(request: NextRequest) {
  return TourService.handleCreateTour(request);
}
