
import React from 'react';
import { SalesInvoice } from '../../../../types';
import { User, Calendar, Hash, FileText, CheckCircle2, AlertOctagon, X, Car } from 'lucide-react';
import { useZustandStore } from '../../../../store/useStore';

interface SalesInfoSectionProps {
  sale: SalesInvoice;
  t: Record<string, string>;
}

export const SalesInfoSection: React.FC<SalesInfoSectionProps> = ({ sale, t }) => {
  const { theme, lang } = useZustandStore(state => ({ theme: state.theme, lang: state.lang }));

  const getStatusConfig = (status: string) => {
      const map: Record<string, { label: string, color: string, icon: React.ElementType }> = {
          paid: { label: t.completed || 'Paid', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
          partially_paid: { label: 'Partially Paid', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: AlertOctagon },
          draft: { label: t.draft || 'Draft', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', icon: FileText },
          void: { label: 'Void', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: X },
          confirmed: { label: 'Confirmed', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: CheckCircle2 }
      };
      return map[status] || { label: status, color: 'text-gray-400', icon: FileText };
  };

  const statusConfig = getStatusConfig(sale.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
         <div className="flex items-center gap-3 mb-2">
            <User className="text-purple-400" size={18} />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{t.customer}</span>
         </div>
         <p className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{sale.customerName}</p>
         {sale.customerEmail && <p className="text-sm text-gray-500">{sale.customerEmail}</p>}
      </div>

      <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
         <div className="flex items-center gap-3 mb-2">
            <Calendar className="text-blue-400" size={18} />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{t.date}</span>
         </div>
         <p className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{new Date(sale.date).toLocaleDateString(lang)}</p>
      </div>

      <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
         <div className="flex items-center gap-3 mb-2">
            <Hash className="text-green-400" size={18} />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{t.status}</span>
         </div>
         <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${statusConfig.color}`}>
            <StatusIcon size={14} />
            {statusConfig.label}
         </span>
      </div>

      {sale.vehicleDescription && (
          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800/50 border-cyan-500/20' : 'bg-cyan-50 border-cyan-200'}`}>
             <div className="flex items-center gap-3 mb-2">
                <Car className="text-cyan-400" size={18} />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">المركبة</span>
             </div>
             <p className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{sale.vehicleDescription}</p>
          </div>
      )}
    </div>
  );
};
