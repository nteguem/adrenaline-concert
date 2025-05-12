import axios from 'axios';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { PDFDocument } from 'pdf-lib';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export class OcrService {
    static async analyzeTicket(file: File): Promise<{
        success: boolean;
        message?: string;
        data?: Record<string, string>;
        errorType?: string;
        details?: string | any;
    }> {
        try {
            if (!file) {
                return {
                    success: false,
                    message: 'Aucun fichier uploadé ou format non supporté',
                    errorType: 'NO_FILE',
                    details: 'Aucun fichier n\'a été fourni pour l\'analyse'
                };
            }

            const fileExt = path.extname(file.name).toLowerCase().slice(1);
            let base64Image: string;
            let mimeType: string;
            let buffer: Buffer;
            let uploadResult: any;

            // check if is pdf file or image
            if (fileExt === 'pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                const pages = pdfDoc.getPages();
                if (pages.length === 0) {
                    return {
                        success: false,
                        message: "PDF vide",
                        errorType: 'INVALID_PDF',
                        details: "Le PDF ne contient aucune page"
                    };
                }

                // Upload PDF to Cloudinary first for conversion
                 uploadResult = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            folder: 'concert-tickets-adrenaline',
                            format: 'png',
                            resource_type: 'auto',
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    uploadStream.end(Buffer.from(arrayBuffer));
                });

                // Get the converted image from Cloudinary
                const imageResponse = await axios.get((uploadResult as any).secure_url, {
                    responseType: 'arraybuffer'
                });
                
                buffer = Buffer.from(imageResponse.data);
                base64Image = buffer.toString('base64');
                mimeType = 'image/png';
            } else {
                const arrayBuffer = await file.arrayBuffer();
                buffer = Buffer.from(arrayBuffer);
                base64Image = buffer.toString('base64');
                mimeType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

                 // Upload image to Cloudinary
                 uploadResult = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            folder: 'concert-tickets-adrenaline',
                            resource_type: 'auto',
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    uploadStream.end(buffer);
                });
            }

             // Upload to Cloudinary
            //  let uploadResult;
            //  try {
            //      uploadResult = await new Promise((resolve, reject) => {
            //          const uploadStream = cloudinary.uploader.upload_stream(
            //              {
            //                  folder: 'concert-tickets-adrenaline',
            //                  resource_type: 'auto',
            //              },
            //              (error, result) => {
            //                  if (error) reject(error);
            //                  else resolve(result);
            //              }
            //          );
            //          uploadStream.end(buffer);
            //      });
            //  } catch (uploadError) {
            //      console.error('Erreur upload Cloudinary:', uploadError);
            //      return {
            //          success: false,
            //          message: "Erreur lors du stockage de l'image",
            //          errorType: 'UPLOAD_ERROR',
            //          details: uploadError instanceof Error ? uploadError.message : 'Erreur inconnue'
            //      };
            //  }
 

            const response = await axios({
                method: 'post',
                url: 'https://api.anthropic.com/v1/messages',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                data: {
                    model: "claude-3-opus-20240229",
                    max_tokens: 1024,
                    system: "Tu es un expert en analyse de billets du Zénith. RÈGLES TRÈS STRICTES:\n\n1. VALIDATION DU TYPE D'IMAGE:\n   - Si c'est un logo ou une image d'entreprise: RÉPONDRE UNIQUEMENT 'NOT_TICKET: Logo détecté'\n"
                           + "- Si c'est une photo de personne: RÉPONDRE UNIQUEMENT 'PHOTO_PERSONNE: [description]'\n   - Si ce n'est pas un billet: RÉPONDRE UNIQUEMENT 'NOT_TICKET: [description]'\n\n2. ANALYSE DES INFORMATIONS DE PLACEMENT:\n"
                           + "- Format du billet:\n   * Après 'Porte:' extraire comme porte\n   * Après 'Niveau:' extraire comme niveau\n   * Après 'Rang:' extraire comme rang\n   * Après 'Place:' extraire comme place\n"
                           + "* Après 'Parterre:' extraire comme parterre\n   * Après 'Entree:' ou 'Accès:' extraire comme entree\n"
                           + "* Après 'Tribune:' ou 'TRIBUNE' extraire comme tribune\n   * Après 'Siege:' extraire comme siege\n"
                           + "* Après 'Chaise:' extraire comme chaise\n   * Après 'Gradin:' ou 'GRADINS' extraire comme gradin\n   * Après 'Bloc:' extraire comme bloc\n\n"
                           + "3. RÈGLES D'EXTRACTION:\n   - Extraire EXACTEMENT les valeurs trouvées\n   - Conserver la casse et le format exact\n   - Si un champ n'a pas de valeur, NE PAS l'inclure\n\n"
                           + "4. RÉPONSE:\n   - Billet valide: RÉPONDRE UNIQUEMENT un objet JSON avec les champs trouvés\n"
                           + "- Informations manquantes: RÉPONDRE UNIQUEMENT 'INVALID_TICKET: [détails]'\n\nATTENTION: EXTRAIRE LES VALEURS EXACTES.",
                    // system: "Tu es un expert en analyse de billets du Zénith. RÈGLES TRÈS STRICTES:\n\n1. VALIDATION DU TYPE D'IMAGE:\n   - Si c'est un logo ou une image d'entreprise: RÉPONDRE UNIQUEMENT 'NOT_TICKET: Logo détecté'\n   - Si c'est une photo de personne: RÉPONDRE UNIQUEMENT 'PHOTO_PERSONNE: [description]'\n   - Si ce n'est pas un billet: RÉPONDRE UNIQUEMENT 'NOT_TICKET: [description]'\n\n2. ANALYSE DES INFORMATIONS DE PLACEMENT:\n   Format Type 1 (standard):\n   - Numéro après PORTE/TRIBUNE/GRADIN = porte (extraire UNIQUEMENT le numéro)\n   - Rang P ou lettre seule = rang (extraire UNIQUEMENT la lettre)\n   - Numéro après le rang = place (extraire UNIQUEMENT le numéro)\n\n   Format Type 2 (format alternatif):\n   - Si format 'PORTE X Y Z':\n     * X = numéro de porte (UNIQUEMENT le numéro)\n     * Y = rang (UNIQUEMENT la lettre/numéro)\n     * Z = place (UNIQUEMENT le numéro)\n\n   Format Type 3 (explicite):\n   - Labels explicites: extraire UNIQUEMENT les valeurs sans les labels\n\n3. RÈGLES D'EXTRACTION:\n   - NE PAS inclure les mots PORTE, TRIBUNE, GRADIN\n   - NE PAS inclure les labels Rang, Place\n   - Extraire UNIQUEMENT les valeurs numériques ou lettres\n\n4. RÉPONSE:\n   - Billet valide: RÉPONDRE UNIQUEMENT {'porte': 'numéro', 'rang': 'lettre', 'place': 'numéro'}\n   - Informations manquantes: RÉPONDRE UNIQUEMENT 'INVALID_TICKET: [détails]'\n\nATTENTION: UNIQUEMENT LES VALEURS, PAS DE LABELS.",
                    messages: [{
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Analyse cette image et renvoie UNIQUEMENT le format de réponse spécifié, sans aucun texte explicatif."
                            },
                            {
                                type: "image",
                                source: {
                                    type: "base64",
                                    media_type: mimeType,
                                    data: base64Image
                                }
                            }
                        ]
                    }]
                }
            });

            const assistantMessage = response?.data?.content[0];
            console.log('Réponse Claude:', assistantMessage);

            if (!assistantMessage?.text) {
                return {
                    success: false,
                    message: "Pas de réponse de l'IA",
                    errorType: 'NO_AI_RESPONSE',
                    details: "L'API n'a pas retourné de texte analysable"
                };
            }

            const cleanedText = assistantMessage.text.trim();
            console.log('Cleaned text:', cleanedText);

            if (cleanedText.startsWith('PHOTO_PERSONNE:')) {
                const description = cleanedText.split('PHOTO_PERSONNE:')[1].trim();
                return {
                    success: false,
                    message: "L'image uploadée est une photo de personne. Veuillez fournir une photo de billet.",
                    errorType: 'PHOTO_PERSONNE',
                    details: description || "Photo de personne détectée"
                };
            }

            if (cleanedText.startsWith('NOT_TICKET:')) {
                const description = cleanedText.split('NOT_TICKET:')[1].trim();
                return {
                    success: false,
                    message: "L'image n'est pas un billet. Veuillez fournir une photo de billet valide.",
                    errorType: 'NOT_TICKET',
                    details: description || "Document non reconnu comme billet"
                };
            }

            if (cleanedText.startsWith('NOT_CONCERT_TICKET:')) {
                const description = cleanedText.split('NOT_CONCERT_TICKET:')[1].trim();
                return {
                    success: false,
                    message: "L'image est un billet mais pas un billet de concert. Veuillez fournir un billet de concert valide.",
                    errorType: 'NOT_CONCERT_TICKET',
                    details: description || "Billet non reconnu comme billet de concert"
                };
            }

            if (cleanedText.startsWith('INVALID_TICKET:')) {
                const description = cleanedText.split('INVALID_TICKET:')[1].trim();
                return {
                    success: false,
                    message: "Le billet ne contient pas clairement les informations de placement requises",
                    errorType: 'INVALID_TICKET',
                    details: description || "Informations de placement manquantes ou non explicites"
                };
            }

            if (!cleanedText.startsWith('{')) {
                return {
                    success: false,
                    message: "Format de réponse non reconnu",
                    errorType: 'INVALID_RESPONSE_FORMAT',
                    details: `Format de réponse inattendu: ${cleanedText.substring(0, 50)}...`
                };
            }

            const jsonText = cleanedText.replace(/\n/g, '').replace(/'/g, '"');
            let ticketInfo;
            try {
                ticketInfo = JSON.parse(jsonText);
            } catch (error) {
                console.error('Erreur parsing JSON:', error);
                return {
                    success: false,
                    message: "Format de réponse invalide de l'IA",
                    errorType: 'INVALID_AI_RESPONSE',
                    details: `Erreur de parsing JSON: ${error instanceof Error ? error.message : 'Format invalide'}`
                };
            }

            if (!ticketInfo || typeof ticketInfo !== 'object') {
                return {
                    success: false,
                    message: "Format de réponse invalide",
                    errorType: 'INVALID_RESPONSE_FORMAT',
                    details: "La réponse n'est pas un objet JSON valide"
                };
            }

            // if (!ticketInfo.porte || !ticketInfo.rang || !ticketInfo.place) {
            //     const missingFields = [
            //         !ticketInfo.porte ? 'porte' : null,
            //         !ticketInfo.rang ? 'rang' : null,
            //         !ticketInfo.place ? 'place' : null
            //     ].filter(Boolean).join(', ');
                
            //     return {
            //         success: false,
            //         message: "Informations manquantes sur le billet",
            //         errorType: 'MISSING_INFORMATION',
            //         details: `Champs manquants: ${missingFields}`
            //     };
            // }

            // const extractNumber = (value: string) => {
            //     const matches = value.match(/\d+/);
            //     return matches ? matches[0] : value;
            // };

            const ticketData: Record<string, string> = {};
            // Add available fields dynamically
            if (ticketInfo.porte && ticketInfo.porte.trim()) {
                ticketData.porte = String(ticketInfo.porte).trim();
            }
            if (ticketInfo.rang && ticketInfo.rang.trim()) {
                ticketData.rang = String(ticketInfo.rang).replace(/Rang\s*/i, '').trim();
            }
            if (ticketInfo.place && ticketInfo.place.trim()) {
                ticketData.place = String(ticketInfo.place).trim();
            }
            if (uploadResult?.secure_url) {
                ticketData.ticketUrl = uploadResult.secure_url;
            }
            if (ticketInfo.niveau && ticketInfo.niveau.trim()) {
                ticketData.niveau = String(ticketInfo.niveau).trim();
            }
            if (ticketInfo.bloc && ticketInfo.bloc.trim()) {
                ticketData.bloc = String(ticketInfo.bloc).trim();
            }
            if (ticketInfo.gradin && ticketInfo.gradin.trim()) {
                ticketData.gradin = String(ticketInfo.gradin).trim();
            }
            if (ticketInfo.chaise && ticketInfo.chaise.trim()) {
                ticketData.chaise = String(ticketInfo.chaise).trim();
            }
            if (ticketInfo.siege && ticketInfo.siege.trim()) {
                ticketData.siege = String(ticketInfo.siege).trim();
            }
            if (ticketInfo.entree && ticketInfo.entree.trim()) {
                ticketData.entree = String(ticketInfo.entree).trim();
            }
            if (ticketInfo.parterre && ticketInfo.parterre.trim()) {
                ticketData.parterre = String(ticketInfo.parterre).trim();
            }
            if (ticketInfo.tribune && ticketInfo.tribune.trim()) {
                ticketData.tribune = String(ticketInfo.tribune).trim();
            }


             // Check if we have at least some basic information
             if (Object.keys(ticketData).length === 0) {
                return {
                    success: false,
                    message: "Aucune information valide trouvée sur le billet",
                    errorType: 'NO_VALID_INFO',
                    details: "Impossible d'extraire des informations valides du billet"
                };
            }

            return {
                success: true,
                data: ticketData
            };

        } catch (error: unknown) {
            console.error('Erreur complète:', error);
            const errorMessage = error instanceof Error ? error.message : 
                (error as { response?: { data: any } })?.response?.data || 'Erreur inconnue';
            
            return {
                success: false,
                message: "Erreur lors de l'analyse du billet",
                details: `Erreur technique: ${errorMessage}`,
                errorType: 'AI_ANALYSIS_ERROR'
            };
        }
    }
}