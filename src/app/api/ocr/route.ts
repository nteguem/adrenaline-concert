// Dans /api/ocr/route.ts
import { NextRequest } from 'next/server'; 
import { OcrService } from '@/services/ocrService';

export async function POST(request: NextRequest) {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const eventDate = formData.get('eventDate') as string | null; // NOUVEAU
             
      if (!file) {
        return new Response(JSON.stringify({ error: 'error file input' }), { status: 400 });
      }
             
      const result = await OcrService.analyzeTicket(file, eventDate || undefined);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { 'Content-Type': 'application/json' }
      });
           
    } catch (error) {
      console.error('Error in POST:', error);
      return new Response(JSON.stringify({ error: 'Failed to process request' }), { status: 400 });
    }
  }