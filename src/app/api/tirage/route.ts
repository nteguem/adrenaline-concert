import { NextRequest } from 'next/server';
import { TirageService } from '@/services/tirageService';


export async function POST(request: NextRequest) {

  
  
  return TirageService.handleCreateTirage(request);
}

export async function GET() {
  
  return await TirageService.getAllTiragesWithWinners();
}
