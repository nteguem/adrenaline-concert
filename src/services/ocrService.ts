import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';

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
        details?: string;
    }> {
        try {
            console.log('=== DEBUT ANALYSE OCR ===');
            console.log('Fichier reçu:', file.name, file.type, file.size);

            // 1. Vérification basique du fichier
            if (!file) {
                return {
                    success: false,
                    message: 'Aucun fichier uploadé',
                    errorType: 'NO_FILE'
                };
            }

            // 2. Conversion du fichier en base64
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Image = buffer.toString('base64');
            
            // Déterminer le type MIME correctement
            let mimeType = 'image/jpeg'; // par défaut
            
            // Vérifier le type MIME réel du fichier, pas juste l'extension
            if (file.type) {
                // Utiliser le type MIME du fichier si disponible
                mimeType = file.type;
            } else {
                // Fallback sur l'extension si pas de type MIME
                const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
                if (fileExt === 'png') mimeType = 'image/png';
                else if (fileExt === 'jpg' || fileExt === 'jpeg') mimeType = 'image/jpeg';
                else if (fileExt === 'webp') mimeType = 'image/webp';
                else if (fileExt === 'gif') mimeType = 'image/gif';
                else if (fileExt === 'bmp') mimeType = 'image/bmp';
            }

            // Vérification additionnelle : détecter le type via les magic bytes
            const uint8Array = new Uint8Array(arrayBuffer.slice(0, 4));
            if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
                mimeType = 'image/png';
            } else if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8) {
                mimeType = 'image/jpeg';
            } else if (uint8Array[0] === 0x47 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46) {
                mimeType = 'image/gif';
            } else if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46) {
                mimeType = 'image/webp';
            }

            console.log('Fichier:', file.name);
            console.log('Type MIME fichier:', file.type);
            console.log('Type MIME détecté:', mimeType);
            console.log('Magic bytes:', Array.from(uint8Array).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));

            // 3. Upload vers Cloudinary pour stockage
            let ticketUrl = '';
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
                console.log('Upload Cloudinary réussi:', ticketUrl);
            } catch (uploadError) {
                console.error('Erreur upload Cloudinary:', uploadError);
                // On continue même si l'upload échoue
            }

            // 4. Appel à l'API Claude
            console.log('=== PREPARATION APPEL CLAUDE ===');
            console.log('API Key présente:', !!CLAUDE_API_KEY);
            console.log('API Key début:', CLAUDE_API_KEY?.substring(0, 10) + '...');
            
            const claudePayload = {
                model: "claude-sonnet-4-20250514", // Claude Sonnet 4 (nom correct)
                max_tokens: 1024,
                system: `Tu es un analyseur de billets de concert. Analyse l'image et réponds UNIQUEMENT avec un objet JSON ou un message d'erreur.

RÈGLES STRICTES:
1. Si ce n'est PAS un billet de concert: réponds "NOT_TICKET"
2. Si c'est une photo de personne: réponds "PHOTO_PERSONNE" 
3. Si c'est un billet de concert VALIDE: réponds avec un objet JSON contenant les informations trouvées

Format JSON attendu (inclure SEULEMENT les champs que tu trouves):
{
  "porte": "valeur trouvée",
  "rang": "valeur trouvée", 
  "place": "valeur trouvée",
  "bloc": "valeur trouvée",
  "gradin": "valeur trouvée",
  "chaise": "valeur trouvée",
  "siege": "valeur trouvée",
  "entree": "valeur trouvée",
  "niveau": "valeur trouvée",
  "parterre": "valeur trouvée",
  "tribune": "valeur trouvée"
}

IMPORTANT: 
- Extraire UNIQUEMENT les valeurs, pas les labels
- Si tu ne trouves aucune information de placement: réponds "INVALID_TICKET"
- Pas de texte explicatif, SEULEMENT le JSON ou le message d'erreur`,

                messages: [{
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Analyse cette image de billet et réponds selon les règles définies."
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
            };

            console.log('Payload préparé, taille image base64:', base64Image.length);
            console.log('URL API:', 'https://api.anthropic.com/v1/messages');

            const response = await axios({
                method: 'post',
                url: 'https://api.anthropic.com/v1/messages',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                data: claudePayload,
                timeout: 30000, // 30 secondes de timeout
                validateStatus: function (status) {
                    // Accepter toutes les réponses pour les analyser
                    return true;
                }
            });

            console.log('=== REPONSE CLAUDE ===');
            console.log('Status:', response.status);
            console.log('Headers:', response.headers);
            console.log('Data:', JSON.stringify(response.data, null, 2));
            
            // 5. Traitement de la réponse
            if (response.status !== 200) {
                console.error('=== ERREUR API CLAUDE ===');
                console.error('Status:', response.status);
                console.error('Response data:', response.data);
                
                return {
                    success: false,
                    message: `Erreur API Claude (${response.status})`,
                    errorType: 'API_ERROR',
                    details: JSON.stringify(response.data)
                };
            }

            const assistantMessage = response?.data?.content?.[0];
            if (!assistantMessage?.text) {
                console.error('=== REPONSE CLAUDE VIDE ===');
                console.error('Structure response.data:', Object.keys(response.data || {}));
                console.error('Content complet:', response.data?.content);
                
                return {
                    success: false,
                    message: "L'API n'a pas retourné de réponse",
                    errorType: 'NO_AI_RESPONSE',
                    details: `Structure reçue: ${JSON.stringify(response.data)}`
                };
            }

            const responseText = assistantMessage.text.trim();
            console.log('Réponse Claude:', responseText);

            // 6. Gestion des cas d'erreur
            if (responseText === 'NOT_TICKET') {
                return {
                    success: false,
                    message: "L'image n'est pas un billet de concert valide",
                    errorType: 'NOT_TICKET'
                };
            }

            if (responseText === 'PHOTO_PERSONNE') {
                return {
                    success: false,
                    message: "L'image est une photo de personne, pas un billet",
                    errorType: 'PHOTO_PERSONNE'
                };
            }

            if (responseText === 'INVALID_TICKET') {
                return {
                    success: false,
                    message: "Le billet ne contient pas les informations de placement nécessaires",
                    errorType: 'INVALID_TICKET'
                };
            }

            // 7. Parsing du JSON
            let ticketData;
            try {
                // Nettoyer la réponse si nécessaire
                let jsonText = responseText;
                if (!jsonText.startsWith('{')) {
                    // Chercher le premier { et dernier }
                    const start = jsonText.indexOf('{');
                    const end = jsonText.lastIndexOf('}');
                    if (start !== -1 && end !== -1) {
                        jsonText = jsonText.substring(start, end + 1);
                    }
                }
                
                ticketData = JSON.parse(jsonText);
                console.log('Données extraites:', ticketData);
                
            } catch (parseError) {
                console.error('Erreur parsing JSON:', parseError);
                return {
                    success: false,
                    message: "Format de réponse invalide de l'IA",
                    errorType: 'PARSE_ERROR',
                    details: `Réponse reçue: ${responseText.substring(0, 100)}...`
                };
            }

            // 8. Validation et nettoyage des données
            const cleanedData: Record<string, string> = {};
            
            // Ajouter l'URL du billet si disponible
            if (ticketUrl) {
                cleanedData.ticketUrl = ticketUrl;
            }

            // Nettoyer et valider chaque champ
            const validFields = [
                'porte', 'rang', 'place', 'bloc', 'gradin', 
                'chaise', 'siege', 'entree', 'niveau', 
                'parterre', 'tribune'
            ];

            for (const field of validFields) {
                if (ticketData[field]) {
                    const value = String(ticketData[field]).trim();
                    if (value && value !== '' && value !== 'null' && value !== 'undefined') {
                        cleanedData[field] = value;
                    }
                }
            }

            // 9. Vérification finale
            if (Object.keys(cleanedData).filter(key => key !== 'ticketUrl').length === 0) {
                return {
                    success: false,
                    message: "Aucune information de placement trouvée sur le billet",
                    errorType: 'NO_PLACEMENT_INFO'
                };
            }

            console.log('=== ANALYSE REUSSIE ===');
            console.log('Données finales:', cleanedData);

            return {
                success: true,
                data: cleanedData
            };

        } catch (error: any) {
            console.error('=== ERREUR OCR COMPLETE ===');
            console.error('Type erreur:', typeof error);
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
            
            // Logs détaillés pour les erreurs axios
            if (error.response) {
                console.error('=== ERREUR RESPONSE ===');
                console.error('Status:', error.response.status);
                console.error('Status Text:', error.response.statusText);
                console.error('Headers:', error.response.headers);
                console.error('Data:', error.response.data);
                console.error('Config URL:', error.config?.url);
                console.error('Config Method:', error.config?.method);
                console.error('Config Headers:', error.config?.headers);
                
                const status = error.response.status;
                const errorData = error.response.data;
                
                if (status === 400) {
                    return {
                        success: false,
                        message: "Erreur dans la requête envoyée à l'API d'analyse",
                        errorType: 'API_BAD_REQUEST',
                        details: `Status 400 - Data: ${JSON.stringify(errorData)}`
                    };
                } else if (status === 401) {
                    return {
                        success: false,
                        message: "Erreur d'authentification avec le service d'analyse",
                        errorType: 'API_AUTH_ERROR',
                        details: `Status 401 - Vérifiez votre clé API Claude`
                    };
                } else if (status === 404) {
                    return {
                        success: false,
                        message: "URL de l'API introuvable",
                        errorType: 'API_NOT_FOUND',
                        details: `Status 404 - URL: ${error.config?.url} - Data: ${JSON.stringify(errorData)}`
                    };
                } else if (status === 429) {
                    return {
                        success: false,
                        message: "Trop de requêtes, veuillez réessayer dans quelques instants",
                        errorType: 'API_RATE_LIMIT',
                        details: `Status 429 - Data: ${JSON.stringify(errorData)}`
                    };
                } else if (status >= 500) {
                    return {
                        success: false,
                        message: "Erreur temporaire du service d'analyse, veuillez réessayer",
                        errorType: 'API_SERVER_ERROR',
                        details: `Status ${status} - Data: ${JSON.stringify(errorData)}`
                    };
                } else {
                    return {
                        success: false,
                        message: `Erreur API inconnue (${status})`,
                        errorType: 'API_UNKNOWN_ERROR',
                        details: `Status ${status} - Data: ${JSON.stringify(errorData)}`
                    };
                }
            } else if (error.request) {
                console.error('=== ERREUR REQUEST ===');
                console.error('Request:', error.request);
                return {
                    success: false,
                    message: "Impossible de joindre le service d'analyse",
                    errorType: 'NETWORK_ERROR',
                    details: `Erreur réseau: ${error.message} - Code: ${error.code || 'N/A'}`
                };
            } else {
                console.error('=== ERREUR SETUP ===');
                return {
                    success: false,
                    message: "Erreur de configuration",
                    errorType: 'SETUP_ERROR',
                    details: `Erreur: ${error.message}`
                };
            }
        }
    }
}