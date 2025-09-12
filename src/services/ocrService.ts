import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class OcrService {
    static async analyzeTicket(file: File, eventDate?: string): Promise<{
        success: boolean;
        message?: string;
        data?: Record<string, string>;
        errorType?: string;
        details?: string;
    }> {
        let ticketUrl = '';
        
        try {
            if (!file) {
                return {
                    success: false,
                    message: 'Aucun fichier uploadé',
                    errorType: 'NO_FILE'
                };
            }

            // Conversion du fichier en base64
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Data = buffer.toString('base64');
            
            // Déterminer le type MIME
            let mimeType = file.type || 'image/jpeg';
            
            // Détection par magic bytes
            const uint8Array = new Uint8Array(arrayBuffer.slice(0, 8));
            if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
                mimeType = 'image/png';
            } else if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8) {
                mimeType = 'image/jpeg';
            } else if (uint8Array[0] === 0x25 && uint8Array[1] === 0x50 && uint8Array[2] === 0x44 && uint8Array[3] === 0x46) {
                mimeType = 'application/pdf';
            }

            // Vérification du type supporté
            const supportedTypes = [
                'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 
                'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml',
                'application/pdf'
            ];
            
            if (!supportedTypes.includes(mimeType)) {
                return {
                    success: false,
                    message: 'Type de fichier non supporté.',
                    errorType: 'UNSUPPORTED_FILE_TYPE'
                };
            }

            // Upload vers Cloudinary - OBLIGATOIRE maintenant
            try {
                const uploadResult = await new Promise((resolve, reject) => {
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
                
                ticketUrl = (uploadResult as any)?.secure_url || '';
                
                // Si l'upload échoue, on arrête tout
                if (!ticketUrl) {
                    throw new Error('Upload Cloudinary failed');
                }
                
            } catch (uploadError) {
                return {
                    success: false,
                    message: "Erreur lors de l'upload du billet",
                    errorType: 'UPLOAD_ERROR',
                    details: String(uploadError)
                };
            }

            // Préparation de la date attendue pour validation
            let expectedDateString = '';
            if (eventDate) {
                try {
                    const date = new Date(eventDate);
                    expectedDateString = date.toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric'
                    });
                } catch (dateError) {
                    // Continue sans validation de date si erreur de parsing
                }
            }

            // Préparation du contenu pour Claude
            const contentData = mimeType === 'application/pdf' ? {
                type: "document",
                source: {
                    type: "base64",
                    media_type: mimeType,
                    data: base64Data
                }
            } : {
                type: "image",
                source: {
                    type: "base64",
                    media_type: mimeType,
                    data: base64Data
                }
            };
            const systemPrompt = `Tu es un analyseur de billets de concert spécialisé. Analyse l'image ou le document et réponds UNIQUEMENT avec un objet JSON ou un message d'erreur spécifique.

RÈGLES DE VALIDATION:
1. Si ce n'est PAS un billet de concert: réponds "NOT_TICKET"
2. Si c'est une photo de personne: réponds "PHOTO_PERSONNE" 
3. Si c'est un billet valide: extrait les informations et réponds avec un JSON

${expectedDateString ? `VALIDATION DE DATE OBLIGATOIRE:
- La date attendue de l'événement est: ${expectedDateString}
- Si la date sur le billet ne correspond PAS à cette date: réponds "WRONG_DATE"
- Compare soigneusement les dates (jour/mois/année)` : ''}

MISSION: Extrais SEULEMENT les informations qui indiquent OÙ s'asseoir dans la salle.

AUTORISÉ À EXTRAIRE:
- Section/Zone: PARTERRE, TRIBUNE, FOSSE, PELOUSE, BALCON
- Rang/Rangée: RANG, ROW, RANGÉE + numéro
- Place/Siège: PLACE, SEAT, CHAISE, SIÈGE, FAUTEUIL + numéro/lettre
- Bloc/Secteur: BLOC, BLOCK + lettre/numéro
- Porte d'accès: PORTE, DOOR + numéro/lettre
- Niveau: NIVEAU, ÉTAGE + numéro

STRICTEMENT INTERDIT D'EXTRAIRE:
- Prix, montants, EUR, €, coûts, tarifs
- Heures (20H00, 19:30, etc.)
- Noms d'artistes ou tournées
- Lieux/salles/venues
- Catégories de prix (Or, VIP, Premium - sauf si c'est une zone de placement)
- Mots comme "Normal", "Standard"
- Dates (sauf pour validation)

RÈGLE ABSOLUE:
Si tu vois un prix, une heure, un nom d'artiste ou lieu → NE L'EXTRAIS PAS
Ne garde que ce qui répond à la question "Où dois-je m'asseoir ?"

N'INCLUS PAS la date dans le JSON final - elle n'est pas une information de placement.

Si aucune information de placement trouvée: réponds "INVALID_TICKET"
Pas de texte explicatif, SEULEMENT le JSON ou le code d'erreur`;

            const claudePayload = {
                model: "claude-sonnet-4-20250514",
                max_tokens: 1024,
                system: systemPrompt,
                messages: [{
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Analyse ce billet et extrais TOUTES les informations de placement avec leurs noms exacts. Vérifie aussi que la date correspond à l'événement attendu."
                        },
                        contentData
                    ]
                }]
            };

            const response = await axios({
                method: 'post',
                url: 'https://api.anthropic.com/v1/messages',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                data: claudePayload,
                timeout: 45000,
                validateStatus: () => true
            });
            
            // Traitement de la réponse
            if (response.status !== 200) {
                // RETOURNER L'URL MÊME EN CAS D'ERREUR API
                return {
                    success: false,
                    message: `Erreur API Claude (${response.status}) - Billet enregistré`,
                    errorType: 'API_ERROR',
                    data: { ticketUrl }, // On retourne quand même l'URL
                    details: JSON.stringify(response.data)
                };
            }

            const assistantMessage = response?.data?.content?.[0];
            if (!assistantMessage?.text) {
                // RETOURNER L'URL MÊME SI PAS DE RÉPONSE
                return {
                    success: false,
                    message: "L'analyse automatique a échoué - Billet enregistré",
                    errorType: 'NO_AI_RESPONSE',
                    data: { ticketUrl } // On retourne quand même l'URL
                };
            }

            const responseText = assistantMessage.text.trim();

            // Gestion des cas d'erreur - MAIS ON RETOURNE TOUJOURS L'URL
            if (responseText === 'NOT_TICKET') {
                return {
                    success: false,
                    message: "L'image n'est pas un billet de concert valide - Billet enregistré",
                    errorType: 'NOT_TICKET',
                    data: { ticketUrl }
                };
            }

            if (responseText === 'PHOTO_PERSONNE') {
                return {
                    success: false,
                    message: "L'image est une photo de personne, pas un billet - Billet enregistré",
                    errorType: 'PHOTO_PERSONNE',
                    data: { ticketUrl }
                };
            }

            if (responseText === 'WRONG_DATE') {
                return {
                    success: false,
                    message: `Ce billet n'est pas pour la bonne date. Date attendue: ${expectedDateString} - Billet enregistré`,
                    errorType: 'WRONG_EVENT_DATE',
                    data: { ticketUrl }
                };
            }

            if (responseText === 'INVALID_TICKET') {
                return {
                    success: false,
                    message: "Le billet ne contient pas d'informations de placement - Billet enregistré",
                    errorType: 'INVALID_TICKET',
                    data: { ticketUrl }
                };
            }

            // Parsing du JSON
            let ticketData;
            try {
                let jsonText = responseText;
                if (!jsonText.startsWith('{')) {
                    const start = jsonText.indexOf('{');
                    const end = jsonText.lastIndexOf('}');
                    if (start !== -1 && end !== -1) {
                        jsonText = jsonText.substring(start, end + 1);
                    }
                }
                
                ticketData = JSON.parse(jsonText);
                
            } catch (parseError) {
                // RETOURNER L'URL MÊME EN CAS D'ERREUR DE PARSING
                return {
                    success: false,
                    message: "Format de réponse invalide de l'IA - Billet enregistré",
                    errorType: 'PARSE_ERROR',
                    data: { ticketUrl }
                };
            }

            // Nettoyage et validation des données - CONSERVE LES NOMS ORIGINAUX
            const cleanedData: Record<string, string> = {};
            
            // Ajouter l'URL du billet TOUJOURS
            cleanedData.ticketUrl = ticketUrl;

            // Nettoyer et valider TOUS les champs retournés par l'IA (sans mapping forcé)
            Object.keys(ticketData).forEach(field => {
                if (ticketData[field]) {
                    const value = String(ticketData[field]).trim();
                    if (value && value !== '' && value !== 'null' && value !== 'undefined') {
                        cleanedData[field] = value;
                    }
                }
            });

            // Vérification finale (exclure ticketUrl et date de la validation des infos de placement)
            const placementFields = Object.keys(cleanedData).filter(key => 
                key !== 'ticketUrl' && key !== 'date'
            );
            
            if (placementFields.length === 0) {
                // MÊME SI AUCUNE INFO DE PLACEMENT, ON RETOURNE L'URL
                return {
                    success: false,
                    message: "Aucune information de placement trouvée sur le billet - Billet enregistré",
                    errorType: 'NO_PLACEMENT_INFO',
                    data: { ticketUrl }
                };
            }

            return {
                success: true,
                data: cleanedData // Contient ticketUrl + données de placement
            };

        } catch (error: any) {
            // RETOURNER L'URL MÊME EN CAS D'ERREUR GÉNÉRALE (si elle existe)
            const baseErrorData = ticketUrl ? { ticketUrl } : undefined;
            
            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;
                
                if (status === 401) {
                    return {
                        success: false,
                        message: "Erreur d'authentification avec le service d'analyse - Billet enregistré",
                        errorType: 'API_AUTH_ERROR',
                        data: baseErrorData
                    };
                } else if (status === 429) {
                    return {
                        success: false,
                        message: "Trop de requêtes, veuillez réessayer dans quelques instants - Billet enregistré",
                        errorType: 'API_RATE_LIMIT',
                        data: baseErrorData
                    };
                } else if (status >= 500) {
                    return {
                        success: false,
                        message: "Erreur temporaire du service d'analyse - Billet enregistré",
                        errorType: 'API_SERVER_ERROR',
                        data: baseErrorData
                    };
                } else {
                    return {
                        success: false,
                        message: `Erreur API (${status}) - Billet enregistré`,
                        errorType: 'API_UNKNOWN_ERROR',
                        data: baseErrorData
                    };
                }
            } else if (error.request) {
                return {
                    success: false,
                    message: "Impossible de joindre le service d'analyse - Billet enregistré",
                    errorType: 'NETWORK_ERROR',
                    data: baseErrorData
                };
            } else {
                return {
                    success: false,
                    message: "Erreur de configuration - Billet enregistré",
                    errorType: 'SETUP_ERROR',
                    data: baseErrorData
                };
            }
        }
    }
}