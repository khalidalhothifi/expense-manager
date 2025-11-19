
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedInvoiceData } from "../types";

// Initialize the Gemini API client
// Note: In a real production app, you should proxy these requests through your backend
// to avoid exposing your API key in the client code.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractInvoiceData = async (
  base64Image: string,
  mimeType: 'image/jpeg' | 'image/png'
): Promise<ExtractedInvoiceData | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Image
                }
            },
            {
                text: "Extract invoice data from this image. Return JSON."
            }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                vendorName: { type: Type.STRING },
                invoiceNumber: { type: Type.STRING },
                date: { type: Type.STRING, description: "YYYY-MM-DD format" },
                lineItems: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            description: { type: Type.STRING },
                            quantity: { type: Type.NUMBER },
                            amount: { type: Type.NUMBER }
                        }
                    }
                },
                taxes: { type: Type.NUMBER },
                totalAmount: { type: Type.NUMBER }
            }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as ExtractedInvoiceData;

  } catch (error) {
    console.error("Gemini extraction error:", error);
    return null;
  }
}
