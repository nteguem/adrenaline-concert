import { NextRequest } from 'next/server';
import { TourService } from '@/services/tourService';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  return TourService.handleGetTourById(request, { params });
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  return TourService.handleUpdateTour(request, { params });
}