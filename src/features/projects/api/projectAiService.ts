
import { callAIProxy, cleanJsonString } from '../../../lib/aiClient';
import { Project } from '../types';

export const analyzeProjectPerformance = async (
    projectData: Project,
    lang: 'ar' | 'en'
): Promise<{ summary: string; risks: string; suggestions: string } | null> => {
    const prompt = `
        Analyze the following project data and provide a report in ${lang === 'ar' ? 'Arabic' : 'English'}.
        Project: ${projectData.name}, Budget: ${projectData.budget}, Net Profit: ${projectData.netProfit}, Status: ${projectData.status}.
        Respond ONLY with JSON: { "summary": "...", "risks": "...", "suggestions": "..." }
    `;
    
    const text = await callAIProxy(prompt, { responseMimeType: 'application/json' });
    if (!text) return null;
    return JSON.parse(cleanJsonString(text));
};
