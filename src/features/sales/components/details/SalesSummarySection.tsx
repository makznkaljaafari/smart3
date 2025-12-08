
import React from 'react';
import { SalesInvoice } from '../../../types';
import { useZustandStore } from '../../../../store/useStore';
import { formatCurrency } from '../../../../lib/formatters';

interface SalesSummarySectionProps {
  sale: SalesInvoice;
  currency: string;
  t: Record<string, string>;
}

export const SalesSummarySection: React.FC<SalesSummarySectionProps> = ({ sale, currency, t }) => {
  const theme = useZustandStore(state => state.theme);
  const isDark = theme === 'dark';
  const summaryLabelClasses = isDark ? 'text-gray-400' : 'text-gray-600';

  const subtotal = sale.items.reduce((a,b) => a + b.total, 0);

  return (
    <div className="flex flex-col md:flex-row justify-end gap-8">
      {/* Notes Section */}
      {sale.notes && (
          <div className={`flex-1 p-4 rounded-xl border h-fit ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t.notes}</h5>
              <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{sale.notes}</p>
          </div>
      )}

      <div className={`w-full md:w-96 p-6 rounded-xl border space-y-3 ${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          {/* Basic Subtotal */}
           <div className="flex justify-between text-sm">
              <span className={summaryLabelClasses}>{t.subtotal}</span>
              <span className="font-mono">{formatCurrency(subtotal, currency)}</span>
          </div>
          
          <div className={`border-t border-dashed my-2 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}></div>
          
          <div className="flex justify-between items-end">
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.total}</span>
              <span className="font-mono font-black text-2xl text-cyan-500">{formatCurrency(sale.total, currency)}</span>
          </div>

          <div className={`flex justify-between text-sm mt-2 ${summaryLabelClasses}`}>
              <span>{t.amountPaid}</span>
              <span className="font-mono text-green-500 font-semibold">{formatCurrency(sale.amountPaid, currency)}</span>
          </div>
           {sale.remainingAmount > 0 && (
              <div className="flex justify-between text-sm">
                  <span className="text-red-400 font-medium">{t.remainingAmount}</span>
                  <span className="font-mono text-red-400 font-bold">{formatCurrency(sale.remainingAmount, currency)}</span>
              </div>
           )}
      </div>
    </div>
  );
};
