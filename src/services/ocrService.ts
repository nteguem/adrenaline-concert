import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
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

            // Upload vers Cloudinary
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
            } catch (uploadError) {
                // Continue même si l'upload échoue
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
            
            const claudePayload = {
                model: "claude-sonnet-4-20250514",
                max_tokens: 1024,
                system: `Tu es un analyseur de billets de concert. Analyse l'image ou le document et réponds UNIQUEMENT avec un objet JSON ou un message d'erreur.

RÈGLES:
1. Si ce n'est PAS un billet de concert: réponds "NOT_TICKET"
2. Si c'est une photo de personne: réponds "PHOTO_PERSONNE" 
3. Si c'est un billet valide: réponds avec un objet JSON contenant TOUTES les informations de placement que tu trouves

IMPORTANT: 
- Retourne un objet JSON avec TOUTES les informations de placement trouvées
- Utilise les noms de champs EXACTS que tu vois sur le billet
- Extrais UNIQUEMENT les valeurs, pas les labels
- Si aucune info de placement: réponds "INVALID_TICKET"
- Pas de texte explicatif, SEULEMENT le JSON

Exemple: {"rang": "A", "place": "12", "zone": "VIP", "secteur": "Nord"}`,

                messages: [{
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Analyse ce billet et extrais TOUTES les informations de placement avec leurs noms exacts."
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
                return {
                    success: false,
                    message: `Erreur API Claude (${response.status})`,
                    errorType: 'API_ERROR',
                    details: JSON.stringify(response.data)
                };
            }

            const assistantMessage = response?.data?.content?.[0];
            if (!assistantMessage?.text) {
                return {
                    success: false,
                    message: "L'API n'a pas retourné de réponse",
                    errorType: 'NO_AI_RESPONSE'
                };
            }

            const responseText = assistantMessage.text.trim();

            // Gestion des cas d'erreur
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
                    message: "Le billet ne contient pas d'informations de placement",
                    errorType: 'INVALID_TICKET'
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
                return {
                    success: false,
                    message: "Format de réponse invalide de l'IA",
                    errorType: 'PARSE_ERROR'
                };
            }

            // Nettoyage et validation des données
            const cleanedData: Record<string, string> = {};
            
            // Ajouter l'URL du billet si disponible
            if (ticketUrl) {
                cleanedData.ticketUrl = ticketUrl;
            }

            // Nettoyer et valider TOUS les champs retournés par l'IA
            Object.keys(ticketData).forEach(field => {
                if (ticketData[field]) {
                    const value = String(ticketData[field]).trim();
                    if (value && value !== '' && value !== 'null' && value !== 'undefined') {
                        cleanedData[field] = value;
                    }
                }
            });

            // Vérification finale
            if (Object.keys(cleanedData).filter(key => key !== 'ticketUrl').length === 0) {
                return {
                    success: false,
                    message: "Aucune information de placement trouvée sur le billet",
                    errorType: 'NO_PLACEMENT_INFO'
                };
            }

            return {
                success: true,
                data: cleanedData
            };

        } catch (error: any) {
            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;
                
                if (status === 401) {
                    return {
                        success: false,
                        message: "Erreur d'authentification avec le service d'analyse",
                        errorType: 'API_AUTH_ERROR'
                    };
                } else if (status === 429) {
                    return {
                        success: false,
                        message: "Trop de requêtes, veuillez réessayer dans quelques instants",
                        errorType: 'API_RATE_LIMIT'
                    };
                } else if (status >= 500) {
                    return {
                        success: false,
                        message: "Erreur temporaire du service d'analyse",
                        errorType: 'API_SERVER_ERROR'
                    };
                } else {
                    return {
                        success: false,
                        message: `Erreur API (${status})`,
                        errorType: 'API_UNKNOWN_ERROR'
                    };
                }
            } else if (error.request) {
                return {
                    success: false,
                    message: "Impossible de joindre le service d'analyse",
                    errorType: 'NETWORK_ERROR'
                };
            } else {
                return {
                    success: false,
                    message: "Erreur de configuration",
                    errorType: 'SETUP_ERROR'
                };
            }
        }
    }
}