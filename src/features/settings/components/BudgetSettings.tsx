
import React, { useState } from 'react';
import { SectionBox } from '../../../components/ui/SectionBox';
import { SettingsState, Budget, ExpenseCategory } from '../../../types';
import { CATEGORY_CONFIG } from '../../expenses/lib/utils';
import { Brain, Loader } from 'lucide-react';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useZustandStore } from '../../../store/useStore';
import { suggestBudgets } from '../../../services/aiService';
import { BudgetSuggestionModal } from './BudgetSuggestionModal';
import { useQuery } from '@tanstack/react-query';
import { expenseService } from '../../../services/expenseService';


interface BudgetSettingsProps {
  localSettings: SettingsState;
  setLocalSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  t: Record<string, string>;
  theme: 'light' | 'dark';
  lang: 'ar' | 'en';
}

export const BudgetSettings: React.FC<BudgetSettingsProps> = ({ localSettings, setLocalSettings, t, theme, lang }) => {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentCompany = useZustandStore(state => state.currentCompany);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedBudgets, setSuggestedBudgets] = useState<Record<ExpenseCategory, number> | null>(null);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);

  const { data: expenseStats } = useQuery({
        queryKey: ['expenseStats', currentCompany?.id],
        queryFn: () => expenseService.getExpenseStats(),
        enabled: !!currentCompany?.id,
  });
  
  // Use optional chaining or default empty array
  const expenses = (expenseStats as any)?.data || [];

  const handleBudgetChange = (category: ExpenseCategory, amount: string) => {
    const numericAmount = parseFloat(amount) || 0;
    const existingBudgets = localSettings.budgets || [];
    const budgetForMonth = existingBudgets.find(b => b.month === currentMonth && b.category === category);

    let updatedBudgets: Budget[];

    if (budgetForMonth) {
      if (numericAmount > 0) {
        // Update existing budget
        updatedBudgets = existingBudgets.map(b => 
          b.id === budgetForMonth.id ? { ...b, amount: numericAmount } : b
        );
      } else {
        // Remove budget if amount is 0 or less
        updatedBudgets = existingBudgets.filter(b => b.id !== budgetForMonth.id);
      }
    } else if (numericAmount > 0) {
      // Add new budget
      const newBudget: Budget = {
        id: `bud-${category}-${currentMonth}`,
        category,
        amount: numericAmount,
        month: currentMonth,
      };
      updatedBudgets = [...existingBudgets, newBudget];
    } else {
      // Do nothing if no budget exists and amount is 0
      updatedBudgets = existingBudgets;
    }

    setLocalSettings(prev => ({ ...prev, budgets: updatedBudgets }));
  };
  
  const handleSuggest = async () => {
    setIsSuggesting(true);
    setIsSuggestionModalOpen(true); 
    setSuggestedBudgets(null);

    const mappedExpenses: any = expenses.map((e: any) => ({
        category: e.category,
        amount: e.amount,
        date: e.date
    }));

    const result = await suggestBudgets(mappedExpenses, localSettings.baseCurrency, lang);
    if (result) {
        setSuggestedBudgets(result);
    } else {
        useZustandStore.getState().addToast({ message: 'Failed to get AI suggestions.', type: 'error' });
        setIsSuggestionModalOpen(false); 
    }
    setIsSuggesting(false);
  };

  const handleApplySuggestions = (appliedBudgets: Record<ExpenseCategory, number>) => {
    const existingBudgets = localSettings.budgets || [];
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Create a map of existing budgets for the current month for easy lookup
    const existingMonthBudgets = new Map(
      existingBudgets
        .filter(b => b.month === currentMonth)
        .map(b => [b.category, b])
    );

    let updatedBudgets: Budget[] = [...existingBudgets];

    Object.entries(appliedBudgets).forEach(([category, amount]) => {
      const cat = category as ExpenseCategory;
      const existingBudget = existingMonthBudgets.get(cat);
      if (existingBudget) {
        // Update existing
        const index = updatedBudgets.findIndex((b: Budget) => b.id === (existingBudget as Budget).id);
        if (index !== -1) {
          const budgetToUpdate = updatedBudgets[index];
          if (budgetToUpdate) {
            updatedBudgets[index] = { ...budgetToUpdate, amount };
          }
        }
      } else if (amount > 0) {
        // Add new
        updatedBudgets.push({
          id: `bud-${cat}-${currentMonth}`,
          category: cat,
          amount,
          month: currentMonth,
        });
      }
    });

    setLocalSettings(prev => ({ ...prev, budgets: updatedBudgets }));
    setIsSuggestionModalOpen(false);
  };


  const inputClasses = theme === 'dark'
    ? 'bg-gray-800 text-white border-gray-700 placeholder:text-gray-500'
    : 'bg-slate-50 text-slate-900 border-slate-300 placeholder:text-slate-400';

  return (
    <>
      <SectionBox title={t.currentMonthBudgets} theme={theme}>
        <div className="flex justify-between items-center mb-4">
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
              {t.setBudgetsDescription}
            </p>
            <HoloButton icon={isSuggesting ? Loader : Brain} onClick={handleSuggest} disabled={isSuggesting} className={isSuggesting ? 'animate-pulse' : ''} variant="secondary">
              {t.suggestWithAI}
            </HoloButton>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const categoryKey = key as ExpenseCategory;
            const currentBudget = localSettings.budgets?.find(b => b.month === currentMonth && b.category === categoryKey);
            const CategoryIcon = config.icon;
            return (
              <div key={categoryKey} className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-slate-100'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <CategoryIcon size={18} className={config.color.replace('600', '400')} />
                  <label className="font-semibold">{config.label}</label>
                </div>
                <div className="relative">
                  <span className={`absolute inset-y-0 ${lang === 'ar' ? 'right-3' : 'left-3'} flex items-center text-gray-400`}>{localSettings.baseCurrency}</span>
                  <input
                    type="number"
                    placeholder={t.setBudget}
                    value={currentBudget?.amount || ''}
                    onChange={(e) => handleBudgetChange(categoryKey, e.target.value)}
                    className={`w-full rounded-lg p-2 border focus:ring-cyan-500 focus:border-cyan-500 ${inputClasses} ${lang === 'ar' ? 'pr-12' : 'pl-12'}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SectionBox>
       {isSuggestionModalOpen && (
        <BudgetSuggestionModal
          isOpen={isSuggestionModalOpen}
          onClose={() => setIsSuggestionModalOpen(false)}
          onApply={handleApplySuggestions}
          suggestions={suggestedBudgets}
          isLoading={isSuggesting}
          currency={localSettings.baseCurrency}
        />
      )}
    </>
  );
};
