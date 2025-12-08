
import { callAIProxy, cleanJsonString } from '../../../lib/aiClient';

export const analyzeCustomerRisk = async (
    customerData: {
        totalDebt: number;
        remainingDebt: number;
        debtHistory: { amount: number; status: string; dueDate: string; paidAmount: number }[];
    },
    lang: 'ar' | 'en'
): Promise<{ score: number; summary: string; analysis: string } | null> => {
    const prompt = `
        Analyze customer debt history and behavior.
        Data: ${JSON.stringify(customerData)}
        Return JSON: { "score": (0-100), "summary": "...", "analysis": "..." }
        Language: ${lang}
    `;
    
    const text = await callAIProxy(prompt, { responseMimeType: 'application/json' });
    if (!text) return null;
    return JSON.parse(cleanJsonString(text));
};
