
import { supabase } from '../../../lib/supabaseClient';
import { cleanJsonString } from '../../../lib/aiClient';
import { GoogleGenAI } from "@google/genai";
import { config } from '../../../lib/config';

export const extractInvoiceDataFromFile = async (base64Data: string, mimeType: string) => {
    const promptText = "Extract invoice data to JSON: supplierName, invoiceNumber, date, currencyCode, subtotal, tax, grandTotal, items(description, quantity, unitPrice, total). Raw JSON only.";
    const model = 'gemini-2.5-flash';

    const contents = {
        parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: promptText }
        ]
    };
    
    const genConfig = { responseMimeType: "application/json" };

    // 1. Try Supabase Edge Function (Proxy)
    try {
         const { data, error } = await supabase.functions.invoke('gemini-proxy', {
          body: {
            model: model,
            contents: contents,
            config: genConfig
          }
        });
        
        if (error) throw error;
        
        // Proxy success path
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return JSON.parse(cleanJsonString(text || '{}'));

    } catch (e) {
        console.warn("Proxy Extraction Failed, switching to Client Fallback...", e);

        // 2. Fallback: Direct Client-Side Call
        if (config.gemini.apiKey) {
            try {
                const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
                const response = await ai.models.generateContent({
                    model: model,
                    contents: contents,
                    config: genConfig
                });
                
                const text = response.text;
                return JSON.parse(cleanJsonString(text || '{}'));
            } catch (clientError) {
                console.error("Client Fallback Extraction Failed:", clientError);
            }
        } else {
             console.error("Extraction Failed: Proxy failed and no API Key available for fallback.");
        }
        
        return null;
    }
};
