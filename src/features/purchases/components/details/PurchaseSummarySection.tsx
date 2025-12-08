
import React from 'react';
import { PurchaseInvoice } from '../../../types';
import { useZustandStore } from '../../../../store/useStore';
import { formatCurrency } from '../../../../lib/formatters';

interface PurchaseSummarySectionProps {
  purchase: PurchaseInvoice;
  currency: string;
  t: Record<string, string>;
}

export const PurchaseSummarySection: React.FC<PurchaseSummarySectionProps> = ({ purchase, currency, t }) => {
  const theme = useZustandStore(state => state.theme);
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col md:flex-row justify-end gap-8">
       {/* Notes Section */}
       {purchase.notes && (
          <div className={`flex-1 p-4 rounded-xl border h-fit ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t.notes}</h5>
              <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{purchase.notes}</p>
          </div>
      )}

      <div className={`w-full md:w-96 p-6 rounded-xl border space-y-3 ${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex justify-between text-lg items-center">
              <span className={`font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t.total}</span>
              <span className={`font-mono font-black text-2xl text-purple-500`}>{formatCurrency(purchase.total, currency)}</span>
          </div>
          <div className={`flex justify-between text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <span>{t.amountPaid}</span>
              <span className="font-mono text-green-500 font-semibold">{formatCurrency(purchase.amountPaid, currency)}</span>
          </div>
          
          <div className={`border-t border-dashed my-2 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}></div>
          
          <div className="flex justify-between text-lg font-bold">
              <span className={purchase.remainingAmount > 0 ? 'text-red-400' : 'text-gray-500'}>{t.remainingAmount}</span>
              <span className={`font-mono ${purchase.remainingAmount > 0 ? 'text-red-400' : 'text-gray-500'}`}>{formatCurrency(purchase.remainingAmount, currency)}</span>
          </div>
      </div>
    </div>
  );
};
