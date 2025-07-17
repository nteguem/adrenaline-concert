import { NextRequest } from 'next/server';
import { ParticipantService } from '@/services/participantService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return ParticipantService.handleGetAllParticipants(request);
}

// export async function POST(request: NextRequest) {
//   try {
//     console.log('Content-Type:', request.headers.get('content-type'));
    
//     const data = await request.formData();
    
//     // Log all entries including file details
//     Array.from(data.entries()).forEach(([key, value]) => {
//       if (value instanceof File) {
//         console.log('File Entry:', key, {
//           name: value.name,
//           type: value.type,
//           size: value.size,
//           lastModified: value.lastModified
//         });
//       } else {
//         console.log('Form Entry:', key, value);
//       }
//     });

//     const file = data.get('file');
//     console.log('File details:', {
//       exists: !!file,
//       type: file ? typeof file : 'none',
//       isFile: file instanceof File,
//       name: file instanceof File ? file.name : 'no file',
//       mimeType: file instanceof File ? file.type : 'none',
//       size: file instanceof File ? file.size : 0
//     });

//     return ParticipantService.handleCreateParticipant(request);
//   } catch (error) {
//     console.error('Error in POST:', error);
//     return new Response(JSON.stringify({ error: 'Failed to process request' }), { status: 400 });
//   }
// }



// export async function POST(request: NextRequest) {
// try{
//     const formData = await request.formData();
//     const file = formData.get('file') as File | null;

//     const participant = {
//       nom: formData.get('nom') as string,
//       prenom: formData.get('prenom') as string,
//       email: formData.get('email') as string,
//       eventId: formData.get('eventId') as string,
//       dateNaissance: new Date(formData.get('dateNaissance') as string),
//       file: file
//     };
//       return ParticipantService.handleCreateParticipant(participant);
//     } catch (error) {
//       console.error('Error processing form data:', error);
//       return new Response(JSON.stringify({
//         success: false,
//         message: 'Error processing form data'
//       }), { status: 400 });
//     }
// }
export async function POST(request: NextRequest) {
  return ParticipantService.handleCreateParticipant(request);
}