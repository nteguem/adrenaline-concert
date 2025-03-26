import { NextRequest } from 'next/server';
import { TourService } from '@/services/tourService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return TourService.handleGetTourById(request, { params });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return TourService.handleUpdateTour(request, { params });
}