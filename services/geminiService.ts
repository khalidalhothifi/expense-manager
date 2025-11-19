
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedInvoiceData } from "../types";

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractInvoiceData = async (
  base64Image: string,
  mimeType: string
): Promise<ExtractedInvoiceData | null> => {
  try {
    // Ensure we only send supported types
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!supportedTypes.includes(mimeType)) {
        console.warn("Unsupported mime type for Gemini OCR:", mimeType);
        return null;
    }

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
                text: "Extract invoice data from this document. Return JSON."
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
