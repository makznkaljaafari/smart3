
import React from 'react';
import { SalesInvoice } from '../../../types';
import { useZustandStore } from '../../../../store/useStore';
import { formatCurrency } from '../../../../lib/formatters';

interface SalesItemsSectionProps {
  items: SalesInvoice['items'];
  currency: string;
  t: Record<string, string>;
}

export const SalesItemsSection: React.FC<SalesItemsSectionProps> = ({ items, currency, t }) => {
  const theme = useZustandStore(state => state.theme);
  const isDark = theme === 'dark';

  return (
    <div>
      <h4 className={`font-bold mb-4 text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          <span className="w-1 h-6 bg-cyan-500 rounded-full block"></span>
          {t.itemsList || 'Items'}
      </h4>
      <div className={`rounded-xl overflow-hidden border ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <table className="w-full text-sm">
          <thead className={`${isDark ? 'bg-white/5 text-gray-300' : 'bg-slate-100 text-gray-700'}`}>
            <tr>
              <th className="p-4 text-right font-semibold opacity-70">#</th>
              <th className="p-4 text-right font-semibold opacity-70">{t.product}</th>
              <th className="p-4 text-center font-semibold opacity-70">{t.quantity}</th>
              <th className="p-4 text-center font-semibold opacity-70">{t.unitPrice}</th>
              <th className="p-4 text-center font-semibold opacity-70">{t.total}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-200'}`}>
            {items.map((item, index) => (
              <tr key={index} className={`${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'} transition-colors`}>
                <td className="p-4 text-gray-500 text-xs">{index + 1}</td>
                <td className={`p-4 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.productName}</td>
                <td className={`p-4 text-center font-mono ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{item.quantity}</td>
                <td className="p-4 text-center font-mono opacity-80">{formatCurrency(item.unitPrice, currency)}</td>
                <td className={`p-4 text-center font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(item.total, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
