import axios from 'axios';
import path from 'path';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

export class OcrService {
    static async analyzeTicket(file: File): Promise<{
        success: boolean;
        message?: string;
        data?: { rang: string; place: string };
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

            // Convert File to Buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Image = buffer.toString('base64');
            const fileExt = path.extname(file.name).toLowerCase().slice(1);
            const mimeType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

            // Call Claude AI API
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
                    system: "Tu es un expert en analyse de billets de concert du Stade de France. Sur ces billets, le rang et la place sont toujours les deux derniers nombres à droite du billet, après les sections comme 'EST', 'BASSE', etc. Le rang est l'avant-dernier nombre et la place est le dernier nombre. Ignore complètement les lettres comme 'D' ou 'D2' qui sont des indicateurs de section et non des numéros de rang.",
                    messages: [{
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Regarde à droite du billet et identifie uniquement les deux derniers nombres. L'avant-dernier nombre est le rang, le dernier nombre est la place. Par exemple si tu vois à droite '13 06', le rang est '13' et la place est '06'. Ignore toutes les lettres. Réponds uniquement avec un objet JSON contenant les champs 'rang' et 'place'. N'ajoute rien d'autre dans ta réponse."
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

            const assistantMessage = response.data.content[0];
            console.log('Réponse Claude:', assistantMessage);

            // Parse response
            let ticketInfo;
            try {
                const cleanedText = assistantMessage.text.trim().replace(/\n/g, '');
                console.log('Cleaned text:', cleanedText);
                ticketInfo = JSON.parse(cleanedText);
                
                console.log('Parsed ticket info:', ticketInfo);
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

            // Validate numbers
            if (!/^\d+$/.test(ticketInfo.rang) || !/^\d+$/.test(ticketInfo.place)) {
                return {
                    success: false,
                    message: "Les valeurs extraites ne sont pas des nombres valides",
                    errorType: 'INVALID_NUMBER_FORMAT'
                };
            }

            const formattedPlace = ticketInfo.place.padStart(2, '0');

            return {
                success: true,
                data: {
                    rang: ticketInfo.rang,
                    place: formattedPlace
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