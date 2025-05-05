import axios from 'axios';
import path from 'path';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

export class OcrService {
    static async analyzeTicket(file: File): Promise<{
        success: boolean;
        message?: string;
        data?: { rang: string; place: string; porte: string; };
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

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Image = buffer.toString('base64');
            const fileExt = path.extname(file.name).toLowerCase().slice(1);
            const mimeType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

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
                    system: "Tu es un expert en analyse de billets du Zénith. RÈGLES TRÈS STRICTES:\n\n1. VALIDATION DU TYPE D'IMAGE:\n   - Si c'est un logo ou une image d'entreprise: RÉPONDRE UNIQUEMENT 'NOT_TICKET: Logo détecté'\n   - Si c'est une photo de personne: RÉPONDRE UNIQUEMENT 'PHOTO_PERSONNE: [description]'\n   - Si ce n'est pas un billet: RÉPONDRE UNIQUEMENT 'NOT_TICKET: [description]'\n\n2. ANALYSE DES INFORMATIONS DE PLACEMENT:\n   Format Type 1 (standard):\n   - Numéro après PORTE/TRIBUNE/GRADIN = porte (extraire UNIQUEMENT le numéro)\n   - Rang P ou lettre seule = rang (extraire UNIQUEMENT la lettre)\n   - Numéro après le rang = place (extraire UNIQUEMENT le numéro)\n\n   Format Type 2 (format alternatif):\n   - Si format 'PORTE X Y Z':\n     * X = numéro de porte (UNIQUEMENT le numéro)\n     * Y = rang (UNIQUEMENT la lettre/numéro)\n     * Z = place (UNIQUEMENT le numéro)\n\n   Format Type 3 (explicite):\n   - Labels explicites: extraire UNIQUEMENT les valeurs sans les labels\n\n3. RÈGLES D'EXTRACTION:\n   - NE PAS inclure les mots PORTE, TRIBUNE, GRADIN\n   - NE PAS inclure les labels Rang, Place\n   - Extraire UNIQUEMENT les valeurs numériques ou lettres\n\n4. RÉPONSE:\n   - Billet valide: RÉPONDRE UNIQUEMENT {'porte': 'numéro', 'rang': 'lettre', 'place': 'numéro'}\n   - Informations manquantes: RÉPONDRE UNIQUEMENT 'INVALID_TICKET: [détails]'\n\nATTENTION: UNIQUEMENT LES VALEURS, PAS DE LABELS.",
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

            if (!ticketInfo.porte || !ticketInfo.rang || !ticketInfo.place) {
                const missingFields = [
                    !ticketInfo.porte ? 'porte' : null,
                    !ticketInfo.rang ? 'rang' : null,
                    !ticketInfo.place ? 'place' : null
                ].filter(Boolean).join(', ');
                
                return {
                    success: false,
                    message: "Informations manquantes sur le billet",
                    errorType: 'MISSING_INFORMATION',
                    details: `Champs manquants: ${missingFields}`
                };
            }

            const extractNumber = (value: string) => {
                const matches = value.match(/\d+/);
                return matches ? matches[0] : value;
            };

            return {
                success: true,
                data: {
                    porte: extractNumber(String(ticketInfo.porte)),
                    rang: String(ticketInfo.rang).replace(/Rang\s*/i, '').trim(),
                    place: extractNumber(String(ticketInfo.place))
                }
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