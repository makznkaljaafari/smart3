
import { callAIProxy, cleanJsonString } from '../../../lib/aiClient';

export const analyzeFinancialHealth = async (
  data: {
    totalAssets: number;
    totalLiabilities: number;
    recentCashFlow: number;
    overdueDebtPercentage: number;
  },
  lang: 'ar' | 'en'
): Promise<{ score: number; summary: string; analysis: string } | null> => {
  const prompt = `
    You are a senior financial analyst AI. Analyze the following company financial data:
    - Total Assets: ${data.totalAssets}
    - Total Liabilities: ${data.totalLiabilities}
    - Recent Cash Flow (Net): ${data.recentCashFlow}
    - Overdue Debt Percentage: ${data.overdueDebtPercentage}%

    Instructions:
    1. Calculate a "Financial Health Score" from 0 to 100 based on standard ratios (Liquidity, Solvency).
    2. Provide a very brief, one-sentence summary in ${lang === 'ar' ? 'Arabic' : 'English'}.
    3. Provide a detailed analysis (2-3 paragraphs) in ${lang === 'ar' ? 'Arabic' : 'English'}, using Markdown formatting.
    
    Response Format (JSON Only):
    { "score": 85, "summary": "...", "analysis": "..." }
  `;

  const text = await callAIProxy(prompt, { responseMimeType: 'application/json' });
  if (!text) return null;
  return JSON.parse(cleanJsonString(text));
};

export const generateStrategicAdvice = async (
    context: {
        cashOnHand: number;
        totalDebt: number;
        inventoryValue: number;
        monthlyBurnRate: number;
    },
    lang: 'ar' | 'en'
): Promise<{ advice: string[], priority: 'high' | 'medium' | 'low' } | null> => {
    const prompt = `
        You are a CFO AI Agent. Analyze these high-level metrics:
        - Cash on Hand: ${context.cashOnHand}
        - Total Receivables (Debt): ${context.totalDebt}
        - Inventory Value: ${context.inventoryValue}
        - Monthly Burn Rate (Avg Expenses): ${context.monthlyBurnRate}

        Provide 3 strategic, actionable bullet points in ${lang === 'ar' ? 'Arabic' : 'English'} to improve the business.
        Determine priority based on cash runway.
        
        Return JSON: { "advice": ["Tip 1", "Tip 2", "Tip 3"], "priority": "high" | "medium" | "low" }
    `;

    const text = await callAIProxy(prompt, { responseMimeType: 'application/json' });
    if (!text) return null;
    return JSON.parse(cleanJsonString(text));
};
