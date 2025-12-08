
import { callAIProxy, cleanJsonString } from '../../../lib/aiClient';
import { Account, AccountType } from '../types';

export const suggestJournalEntryFromDescription = async (
  description: string,
  accounts: Account[],
  lang: 'ar' | 'en'
): Promise<{ description: string; lines: { accountId: string; debit: number; credit: number }[] } | null> => {
  const accts = accounts.filter(a => !a.isPlaceholder).map(a => ({ id: a.id, name: a.name, type: a.type }));
  const prompt = `Create double-entry journal for "${description}". Language: ${lang}.
    Accounts: ${JSON.stringify(accts)}
    Return JSON: { "description": "...", "lines": [{ "accountId": "...", "debit": 0, "credit": 0 }] }`;

  const text = await callAIProxy(prompt, { responseMimeType: 'application/json' });
  if (!text) return null;
  return JSON.parse(cleanJsonString(text));
};

export const suggestAccountType = async (accountName: string): Promise<AccountType | null> => {
  const prompt = `Suggest account type for "${accountName}" from [asset, liability, equity, revenue, expense]. Return type string only.`;
  const text = await callAIProxy(prompt);
  const type = text?.trim() as AccountType;
  return ['asset', 'liability', 'equity', 'revenue', 'expense'].includes(type) ? type : null;
};
