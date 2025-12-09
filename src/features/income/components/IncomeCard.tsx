
import React, { useState } from 'react';
import { Income, IncomeCategory } from '../../../types';
import { Eye, Edit2, Trash2, MoreVertical, Calendar, BarChart3, Tag, RefreshCw, ArrowUpRight } from 'lucide-react';
import { useZustandStore } from '../../../store/useStore';
import { AppTheme } from '../../../types';

const INCOME_CATEGORY_CONFIG: Record<IncomeCategory, { label: string; icon: React.ElementType }> = {
  product_sales: { label: 'مبيعات منتجات', icon: Tag },
  service_fees: { label: 'رسوم خدمات', icon: BarChart3 },
  consulting: { label: 'استشارات', icon: BarChart3 },
  rentals: { label: 'إيجارات', icon: BarChart3 },
  refunds: { label: 'استردادات', icon: BarChart3 },
  other: { label: 'أخرى', icon: BarChart3 },
};

const formatCurrency = (amount: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
const formatShortDate = (dateString?: string) => dateString ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateString)) : '';

export const IncomeCard: React.FC<{ income: Income; onEdit: (i: Income) => void; onDelete: (id: string) => void; onViewDetails: (i: Income) => void; theme: AppTheme; }> = ({ income, onEdit, onDelete, onViewDetails, theme }) => {
    const CategoryIcon = INCOME_CATEGORY_CONFIG[income.category]?.icon || Tag;
    const [menuOpen, setMenuOpen] = useState(false);
    const isDark = theme.startsWith('dark');

    const cardBg = isDark ? 'bg-gray-900/60 backdrop-blur-md' : 'bg-white';
    const borderColor = isDark ? 'border-gray-800' : 'border-slate-200';
    const hoverEffect = isDark ? 'hover:border-green-500/30 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'hover:shadow-lg';
    const textColor = isDark ? 'text-white' : 'text-slate-900';

    return (
        <div className={`group relative p-0 rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden ${cardBg} ${borderColor} ${hoverEffect}`}>
            
            {/* Top Edge */}
            <div className={`h-1 w-full ${isDark ? 'bg-gradient-to-r from-green-500 to-cyan-500' : 'bg-gradient-to-r from-green-400 to-cyan-400'}`} />

            <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                         <div className={`p-2.5 rounded-xl ${isDark ? 'bg-gray-800 text-green-400' : 'bg-green-50 text-green-600'} shadow-inner`}>
                             <CategoryIcon size={20} />
                         </div>
                         <div>
                            <h3 className={`font-bold text-base line-clamp-1 flex items-center gap-2 ${textColor}`}>
                                {income.isRecurringTemplate && <RefreshCw size={12} className="text-cyan-400" />}
                                {income.title}
                            </h3>
                            <p className="text-xs text-gray-500">{income.source}</p>
                         </div>
                    </div>
                    <div className="relative">
                        <button onClick={(e)=>{e.stopPropagation(); setMenuOpen(!menuOpen);}} onBlur={()=>setTimeout(()=>setMenuOpen(false), 200)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                            <MoreVertical size={18}/>
                        </button>
                        {menuOpen && <div className={`absolute left-0 mt-2 w-40 rounded-xl shadow-2xl z-10 border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                            <button onClick={() => onViewDetails(income)} className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-right hover:bg-opacity-50 ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-slate-50 text-slate-700'}`}><Eye size={16}/> عرض</button>
                            <button onClick={() => onEdit(income)} className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-right hover:bg-opacity-50 ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-slate-50 text-slate-700'}`}><Edit2 size={16}/> تعديل</button>
                            <button onClick={() => onDelete(income.id)} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-right text-red-500 hover:bg-red-500/10"><Trash2 size={16}/> حذف</button>
                        </div>}
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <p className={`text-2xl font-mono font-bold ${textColor}`}>{formatCurrency(income.amount, income.currency)}</p>
                    <div className={`p-1.5 rounded-full ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                        <ArrowUpRight size={16} />
                    </div>
                </div>
            </div>
            
            <div className={`px-5 py-3 border-t flex justify-between items-center bg-opacity-30 ${isDark ? 'bg-black/20 border-gray-800' : 'bg-slate-50 border-slate-200'}`}>
                 <div className="flex items-center gap-2 text-xs text-gray-500">
                     <Calendar size={12} />
                     <span>{formatShortDate(income.date)}</span>
                 </div>
                 <span className={`text-xs px-2 py-1 rounded border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                    {INCOME_CATEGORY_CONFIG[income.category]?.label}
                 </span>
            </div>
        </div>
    );
};
