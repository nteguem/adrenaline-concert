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
                    errorType: 'NO_FILE'
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
                    system: "Tu es un expert en analyse de billets de concert du Capitole en Champagne. Tu dois vérifier si l'image est un billet de concert valide. Si oui, identifie exactement ce qui est écrit sur le billet pour le bloc, le rang, et la place. Chaque valeur peut être une lettre, un chiffre ou une combinaison des deux. Ne fais absolument aucune interprétation ou conversion des valeurs - copie exactement ce qui est écrit.",
                    messages: [{
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Analyse ce billet et extrait exactement ce qui est écrit pour: 1) Le bloc 2) Le rang 3) La place. Copie les valeurs telles qu'elles apparaissent, qu'elles soient des lettres, des chiffres ou une combinaison. Si ce n'est pas un billet ou si les informations ne sont pas clairement visibles, réponds uniquement 'null'. Sinon, réponds avec un objet JSON. Exemple: {'bloc': 'I2', 'rang': 'F12', 'place': '39'}."
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
            })

            const assistantMessage = response?.data?.content[0];
            console.log('Réponse Claude:', assistantMessage);

            if (!assistantMessage?.text) {
                return {
                    success: false,
                    message: "Pas de réponse de l'IA",
                    errorType: 'NO_AI_RESPONSE'
                };
            }

            const cleanedText = assistantMessage.text.trim().replace(/\n/g, '').replace(/'/g, '"');
            console.log('Cleaned text:', cleanedText);

            if (cleanedText.toLowerCase() === 'null') {
                return {
                    success: false,
                    message: "Image non reconnue comme un billet de concert valide",
                    errorType: 'INVALID_TICKET'
                };
            }

            let ticketInfo;
            try {
                const cleanedText = assistantMessage?.text
                .trim()
                .replace(/\n/g, '')
                .replace(/'/g, '"');
                console.log('Cleaned text:', cleanedText);
                ticketInfo = JSON.parse(cleanedText);
            } catch (error) {
                console.error('Erreur parsing JSON:', error);
                return {
                    success: false,
                    message: "Format de réponse invalide de l'IA",
                    errorType: 'INVALID_AI_RESPONSE'
                };
            }

            if (!ticketInfo || typeof ticketInfo !== 'object') {
                return {
                    success: false,
                    message: "Format de réponse invalide",
                    errorType: 'INVALID_RESPONSE_FORMAT'
                };
            }

            if (!ticketInfo.bloc || !ticketInfo.rang || !ticketInfo.place) {
                return {
                    success: false,
                    message: "Informations manquantes sur le billet",
                    errorType: 'MISSING_INFORMATION'
                };
            }

            // Validate all fields can contain letters and numbers
            if (!/^[A-Za-z0-9]+$/.test(String(ticketInfo.rang)) || 
                !/^[A-Za-z0-9]+$/.test(String(ticketInfo.place)) ||
                !/^[A-Za-z0-9]+$/.test(String(ticketInfo.bloc))) {
                return {
                    success: false,
                    message: "Les valeurs doivent contenir uniquement des lettres et/ou des chiffres",
                    errorType: 'INVALID_FORMAT'
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
            return {
                success: false,
                message: "Erreur lors de l'analyse du billet",
                details: error instanceof Error ? error.message : 
                    (error as { response?: { data: any } })?.response?.data || 'Unknown error',
                errorType: 'AI_ANALYSIS_ERROR'
            };
        }
    }
}