
import { callAIProxy, cleanJsonString } from '../../../lib/aiClient';
import { Stocktake } from '../types';
import { supabase } from '../../../lib/supabaseClient';
import { GoogleGenAI } from "@google/genai";
import { config } from '../../../lib/config';

export const generateStocktakeSummary = async (stocktake: Stocktake, lang: 'ar' | 'en'): Promise<string | null> => {
    const discrepancies = stocktake.items
        .filter(item => item.countedQuantity !== null && item.countedQuantity !== item.expectedQuantity)
        .map(item => ({
            name: item.product?.name,
            expected: item.expectedQuantity,
            counted: item.countedQuantity,
            diff: (item.countedQuantity ?? 0) - item.expectedQuantity,
        }));

    if (discrepancies.length === 0) return null;

    const prompt = `
        Generate a stocktake summary report in ${lang === 'ar' ? 'Arabic' : 'English'}.
        Discrepancies: ${JSON.stringify(discrepancies)}
        Include summary, possible causes, and recommended next steps. Use Markdown.
    `;
    
    const text = await callAIProxy(prompt);
    return text;
};

export const matchInvoiceItemsToProducts = async (
    invoiceItems: any[],
    inventoryProducts: any[]
): Promise<Record<string, string> | null> => {
    const prompt = `Match invoice items to inventory products based on name/sku similarity.
    Invoice: ${JSON.stringify(invoiceItems)}
    Inventory: ${JSON.stringify(inventoryProducts)}
    Return JSON: { "invoiceItemIndex": "productId" }`;

    const text = await callAIProxy(prompt, { responseMimeType: 'application/json' });
    if (!text) return null;
    return JSON.parse(cleanJsonString(text));
};

export const suggestProductDetails = async (productName: string): Promise<{ description: string; categoryId: string } | null> => {
  const prompt = `Suggest description and general category for car part: "${productName}". Return JSON: { "description": "...", "categoryId": "..." }`;
  const text = await callAIProxy(prompt, { responseMimeType: 'application/json' });
  if (!text) return null;
  return JSON.parse(cleanJsonString(text));
};

export const getStockoutPrediction = async (
  productName: string,
  currentStock: number,
  salesHistory: { date: string; quantity: number }[],
  lang: 'ar' | 'en'
): Promise<string | null> => {
  const prompt = `Predict stockout date for "${productName}" (Stock: ${currentStock}). History: ${JSON.stringify(salesHistory)}. Return short phrase in ${lang === 'ar' ? 'Arabic' : 'English'}.`;
  const text = await callAIProxy(prompt);
  return text;
};

export const generateDemandForecast = async (productId: string, sales: any[], lang: 'ar' | 'en'): Promise<{ label: string, value: number }[] | null> => {
    const prompt = `Forecast demand for next 3 months based on sales data. Return JSON array: [{ "label": "Month", "value": 123 }]`;
    const text = await callAIProxy(prompt, { responseMimeType: 'application/json' });
    if (!text) return null;
    return JSON.parse(cleanJsonString(text));
};

/**
 * Analyzes CSV headers and maps them to system fields.
 */
export const mapCsvHeadersToSchema = async (headers: string[]): Promise<Record<string, string> | null> => {
    const systemFields = [
        "sku", "name", "nameAr", "nameEn", "itemNumber", "manufacturer", 
        "quantity", "costPrice", "sellingPrice", "description", "size", "location"
    ];
    
    // 1. Try Heuristic Matching First (Fast & Free)
    const mapping: Record<string, string> = {};
    const usedFields = new Set<string>();
    
    const rules: Record<string, string[]> = {
        sku: ['sku', 'code', 'symbol', 'رمز', 'كود'],
        name: ['name', 'product', 'item', 'description', 'اسم', 'مادة', 'بيان'],
        itemNumber: ['part', 'number', 'no.', 'رقم'],
        manufacturer: ['brand', 'make', 'manufacturer', 'شركة', 'صانع', 'ماركة'],
        quantity: ['qty', 'quantity', 'count', 'stock', 'كمية', 'عدد'],
        costPrice: ['cost', 'buy', 'purchase', 'تكلفة', 'شراء'],
        sellingPrice: ['price', 'sell', 'retail', 'بيع', 'مستهلك'],
        size: ['size', 'dimension', 'مقاس'],
        location: ['location', 'bin', 'shelf', 'موقع', 'رف']
    };
    
    headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        for (const [field, keywords] of Object.entries(rules)) {
            if (usedFields.has(field)) continue;
            if (keywords.some(k => lowerHeader.includes(k))) {
                mapping[field] = header;
                usedFields.add(field);
                break;
            }
        }
    });
    
    // If we mapped most critical fields, return early
    if (mapping['name'] && (mapping['costPrice'] || mapping['sellingPrice'])) {
        return mapping;
    }

    // 2. Fallback to AI for complex/ambiguous headers
    const prompt = `
        Map these CSV headers to system fields.
        CSV Headers: ${JSON.stringify(headers)}
        System Fields: ${JSON.stringify(systemFields)}
        
        Return JSON object: { "systemField": "csvHeader" }.
        Only include confident matches.
    `;

    try {
        const text = await callAIProxy(prompt, { responseMimeType: 'application/json' });
        if (!text) return mapping; // Return heuristic result if AI fails
        const aiMapping = JSON.parse(cleanJsonString(text));
        return { ...mapping, ...aiMapping }; // Merge
    } catch (e) {
        console.error("AI Mapping failed", e);
        return mapping;
    }
};

export const extractInventoryItemsFromFile = async (base64Data: string, mimeType: string) => {
    const promptText = `
        Analyze this image/file containing an inventory list.
        Extract data into a SINGLE JSON object with this structure:
        {
            "items": [
                { 
                    "sku": "string", 
                    "name": "string", 
                    "quantity": 0, 
                    "costPrice": 0, 
                    "sellingPrice": 0, 
                    "itemNumber": "string", 
                    "manufacturer": "string",
                    "description": "string"
                }
            ]
        }
        - Return ONLY valid JSON.
        - Use "0" for missing numbers.
        - Use "" for missing strings.
        - Ensure arrays are properly closed.
        - Do not output markdown code blocks or any other text.
    `;
    
    const model = 'gemini-2.5-flash';

    const contents = {
        parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: promptText }
        ]
    };
    
    const genConfig = { responseMimeType: "application/json" };

    try {
         const { data, error } = await supabase.functions.invoke('gemini-proxy', {
          body: {
            model: model,
            contents: contents,
            config: genConfig
          }
        });
        
        if (error) throw error;
        
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return JSON.parse(cleanJsonString(text || '{}'));

    } catch (e) {
        console.warn("Proxy Extraction Failed, switching to Client Fallback...", e);
        if (config.gemini.apiKey) {
            try {
                const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
                const response = await ai.models.generateContent({
                    model: model,
                    contents: contents,
                    config: genConfig
                });
                
                const rawText = response.text || '{}';
                try {
                    return JSON.parse(cleanJsonString(rawText));
                } catch (parseError) {
                    console.warn("Parsing failed, attempting backup extraction", parseError);
                    // Backup: try to find just the first JSON object if multiple exist
                    // This regex tries to capture { "items": [ ... ] } roughly
                    const firstObjMatch = rawText.match(/\{[\s\S]*"items"[\s\S]*\}/);
                    if (firstObjMatch) {
                        return JSON.parse(cleanJsonString(firstObjMatch[0]));
                    }
                    throw parseError;
                }
            } catch (clientError) {
                console.error("Client Fallback Extraction Failed:", clientError);
            }
        }
        return null;
    }
};
