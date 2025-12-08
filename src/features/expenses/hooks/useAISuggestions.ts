import { useState, useCallback } from 'react';
import { suggestExpenseCategory, suggestExpenseAccounts } from '../../../services/aiService';
import { Account, ExpenseCategory } from '../../../types';

export const useAISuggestions = () => {
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);
  const [isSuggestingAccounts, setIsSuggestingAccounts] = useState(false);

  const getCategorySuggestion = useCallback(async (title: string): Promise<ExpenseCategory | null> => {
    setIsSuggestingCategory(true);
    try {
      return await suggestExpenseCategory(title);
    } finally {
      setIsSuggestingCategory(false);
    }
  }, []);

  const getAccountSuggestions = useCallback(async (
    title: string,
    accounts: Account[]
  ): Promise<{ expenseAccountId: string; paymentAccountId: string } | null> => {
    setIsSuggestingAccounts(true);
    try {
      return await suggestExpenseAccounts(title, accounts);
    } finally {
      setIsSuggestingAccounts(false);
    }
  }, []);

  return {
    isSuggestingCategory,
    isSuggestingAccounts,
    getCategorySuggestion,
    getAccountSuggestions,
  };
};
