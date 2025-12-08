
import { callAIProxy, cleanJsonString } from '../../../lib/aiClient';
import { Expense, ExpenseCategory } from '../types';
import { CurrencyCode } from '../../../types.base';
import { CATEGORY_CONFIG } from '../lib/utils';
import { Account } from '../../accounting/types';

export const suggestBudgets = async (
    expenses: any[], // Accepts simplified expense objects
    baseCurrency: CurrencyCode,
    lang: 'ar' | 'en'
): Promise<Record<ExpenseCategory, number> | null> => {
    if (expenses.length < 5) return null;

    const categoryKeys = Object.keys(CATEGORY_CONFIG).join(', ');
    const prompt = `
        Analyze expense data from last 90 days. Suggest monthly budget for categories in [${categoryKeys}].
        Data: ${JSON.stringify(expenses.map(e => ({cat: e.category, amt: e.amount})))}
        Return JSON object where keys are categories and values are numbers.
    `;

    const text = await callAIProxy(prompt, { responseMimeType: 'application/json' });
    if (!text) return null;
    return JSON.parse(cleanJsonString(text));
};

export const suggestExpenseCategory = async (title: string): Promise<ExpenseCategory | null> => {
  const keys = Object.keys(CATEGORY_CONFIG).join(', ');
  const prompt = `Suggest one category for expense "${title}" from this list: [${keys}]. Return JUST the key string.`;
  const text = await callAIProxy(prompt);
  const cleaned = text?.trim().replace(/['"]/g, '');
  return cleaned as ExpenseCategory;
};

export const suggestExpenseAccounts = async (title: string, accounts: Account[]): Promise<{ expenseAccountId: string; paymentAccountId: string } | null> => {
  const accts = accounts.map(a => ({id: a.id, name: a.name, type: a.type}));
  const prompt = `Suggest expense and payment account IDs for transaction: "${title}". 
  Accounts: ${JSON.stringify(accts)}. 
  Return JSON: { "expenseAccountId": "...", "paymentAccountId": "..." }`;
  
  const text = await callAIProxy(prompt, { responseMimeType: 'application/json' });
  if (!text) return null;
  return JSON.parse(cleanJsonString(text));
};
