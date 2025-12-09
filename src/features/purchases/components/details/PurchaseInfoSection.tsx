
import React from 'react';
import { PurchaseInvoice } from '../../../../types';
import { Building, Calendar, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useZustandStore } from '../../../../store/useStore';

interface PurchaseInfoSectionProps {
  purchase: PurchaseInvoice;
  t: Record<string, string>;
}

export const PurchaseInfoSection: React.FC<PurchaseInfoSectionProps> = ({ purchase, t }) => {
  const { theme, lang } = useZustandStore(state => ({ theme: state.theme, lang: state.lang }));
  const isDark = !theme.startsWith('light');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-2">
          <Building className="text-purple-400" size={18} />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{t.supplierName}</span>
        </div>
        <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{purchase.supplierName}</p>
      </div>

      <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="text-blue-400" size={18} />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{t.date}</span>
        </div>
        <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{new Date(purchase.date).toLocaleDateString(lang)}</p>
      </div>

      <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="text-green-400" size={18} />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{t.status}</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${purchase.remainingAmount > 0 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
            {purchase.remainingAmount > 0 ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            {purchase.remainingAmount > 0 ? t.partially_paid : t.paid}
        </span>
      </div>
    </div>
  );
};
