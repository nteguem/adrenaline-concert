import axios from 'axios';
import path from 'path';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

export class OcrService {
    static async analyzeTicket(file: File): Promise<{
        success: boolean;
        message?: string;
        data?: { rang: string; place: string; bloc: string; };
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
                    system: "Tu es un expert en analyse de billets de concert. RÈGLES STRICTES:\n\n1. Pour un billet de concert valide:\n   - EXIGER la présence EXPLICITE des labels suivants:\n     * 'Bloc' ou 'Block' ou 'Secteur' suivi d'une valeur\n     * 'Rang' ou 'Rij' suivi d'une valeur\n     * 'Place' ou 'Plaats' suivi d'une valeur\n   - Ces labels DOIVENT être clairement imprimés sur le billet\n   - NE JAMAIS interpréter:\n     * Prix (ex: '800 Fr', '50€')\n     * Dates\n     * Numéros de série\n     * Codes-barres\n     * Numéros sans label explicite\n\n2. Réponses:\n   - Billet valide avec tous les labels: UNIQUEMENT format JSON {'bloc': 'X', 'rang': 'Y', 'place': 'Z'}\n   - Labels manquants: 'INVALID_TICKET: Billet de concert [artiste/date], mais absence des labels [liste des labels manquants]'\n   - Photo de personne: 'PHOTO_PERSONNE: [description]'\n   - Autre document: 'NOT_TICKET: [description]'\n   - Autre type de billet: 'NOT_CONCERT_TICKET: [description]'",
                    messages: [{
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Analyse cette image. IMPORTANT: Ne considère que les informations avec des labels explicites (Bloc/Rang/Place). Ignore TOTALEMENT les prix et autres numéros sans label."
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

            // Vérification stricte du format de réponse
            if (!cleanedText.startsWith('PHOTO_PERSONNE:') && 
                !cleanedText.startsWith('NOT_TICKET:') && 
                !cleanedText.startsWith('NOT_CONCERT_TICKET:') && 
                !cleanedText.startsWith('INVALID_TICKET:') && 
                !cleanedText.startsWith('{')) {
                return {
                    success: false,
                    message: "Format de réponse non reconnu",
                    errorType: 'INVALID_RESPONSE_FORMAT',
                    details: `Format de réponse inattendu: ${cleanedText.substring(0, 50)}...`
                };
            }

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

            if (!ticketInfo.bloc || !ticketInfo.rang || !ticketInfo.place) {
                const missingFields = [
                    !ticketInfo.bloc ? 'bloc' : null,
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

            if (!/^[A-Za-z0-9]+$/.test(String(ticketInfo.rang)) || 
                !/^[A-Za-z0-9]+$/.test(String(ticketInfo.place)) ||
                !/^[A-Za-z0-9]+$/.test(String(ticketInfo.bloc))) {
                return {
                    success: false,
                    message: "Les valeurs doivent contenir uniquement des lettres et/ou des chiffres",
                    errorType: 'INVALID_FORMAT',
                    details: "Les valeurs de bloc, rang ou place contiennent des caractères non autorisés"
                };
            }

            return {
                success: true,
                data: {
                    rang: String(ticketInfo.rang),
                    place: String(ticketInfo.place),
                    bloc: String(ticketInfo.bloc)
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