
import React from 'react';
import { ExpenseCategory, AppTheme } from '../../../types';
import { CATEGORY_CONFIG, formatCurrency } from '../../expenses/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface BudgetProgressProps {
  category: ExpenseCategory;
  spent: number;
  total: number;
  currency: string;
  theme: AppTheme;
  t: Record<string, string>;
}

export const BudgetProgress: React.FC<BudgetProgressProps> = ({ category, spent, total, currency, theme, t }) => {
  const percentage = total > 0 ? (spent / total) * 100 : 0;
  const isOverBudget = percentage > 100;
  const isDark = theme.startsWith('dark');
  
  let progressBarColor = 'bg-green-500';
  if (percentage > 95) progressBarColor = 'bg-red-500';
  else if (percentage > 75) progressBarColor = 'bg-yellow-500';

  const categoryConfig = CATEGORY_CONFIG[category];
  const CategoryIcon = categoryConfig ? categoryConfig.icon : AlertTriangle;
  const categoryLabel = categoryConfig ? categoryConfig.label : category;

  const textColor = isDark ? 'text-white' : 'text-slate-800';
  const subTextColor = isDark ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/30' : 'bg-slate-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CategoryIcon size={18} className={categoryConfig ? categoryConfig.color.replace('600', '400') : 'text-gray-400'} />
          <span className={`font-semibold ${textColor}`}>{categoryLabel}</span>
        </div>
        {isOverBudget && <AlertTriangle size={18} className="text-red-500" />}
      </div>
      <div className={`w-full h-2.5 rounded-full mb-2 ${isDark ? 'bg-gray-700' : 'bg-slate-200'}`}>
        <div 
          className={`h-2.5 rounded-full ${progressBarColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className={`flex justify-between text-xs ${subTextColor}`}>
        <span>
          {t.spentOf.replace('{spent}', formatCurrency(spent, currency)).replace('{total}', formatCurrency(total, currency))}
        </span>
        {isOverBudget ? (
          <span className="font-semibold text-red-500">
            {t.overBudgetBy} {formatCurrency(spent - total, currency)}
          </span>
        ) : (
          <span>
            {t.remaining}: {formatCurrency(total - spent, currency)}
          </span>
        )}
      </div>
    </div>
  );
};
