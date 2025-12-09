
import React, { useState, useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { ReportContainer } from './ReportContainer';
import { formatCurrency } from '../../expenses/lib/utils';
import { TrendingUp, TrendingDown, ArrowDown, PieChart as PieIcon, List, BarChart2, Loader } from 'lucide-react';
import { ProfitAndLossChart } from './ProfitAndLossChart';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../../services/reportService';
import { AppTheme } from '../../../types';

const CategoryBreakdownItem: React.FC<{
  label: string;
  amount: number;
  percentage: number;
  currency: string;
  theme: AppTheme;
  type: 'income' | 'expense';
}> = ({ label, amount, percentage, currency, theme, type }) => {
  const isIncome = type === 'income';
  const isDark = theme.startsWith('dark');
  const barColor = isIncome ? 'bg-emerald-500' : 'bg-orange-500';
  const textColor = isDark ? 'text-gray-200' : 'text-slate-800';
  const bgColor = isDark ? 'bg-gray-800' : 'bg-slate-100';

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-center mb-1.5 text-sm">
        <span className={`${textColor} font-medium`}>{label}</span>
        <div className="flex items-center gap-2">
            <span className="text-xs opacity-50 font-mono">{percentage.toFixed(1)}%</span>
            <span className={`font-bold font-mono ${textColor}`}>{formatCurrency(amount, currency)}</span>
        </div>
      </div>
      <div className={`w-full h-2.5 rounded-full ${bgColor} overflow-hidden`}>
        <div 
            className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`} 
            style={{ width: `${percentage}%` }} 
        />
      </div>
    </div>
  );
};

export const ProfitAndLossReport: React.FC = () => {
  const { theme, lang, currency, currentCompany } = useZustandStore(state => ({
    theme: state.theme,
    lang: state.lang,
    currency: state.settings.baseCurrency,
    currentCompany: state.currentCompany,
  }));
  const t = translations[lang];
  const isDark = theme.startsWith('dark');

  const [dateRange, setDateRange] = useState('thisMonth');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // Note: currently using getIncomeStatement without date params because backend View handles totals.
  // Future enhancement: Create RPC for filtered PnL.
  const { data: pnlData, isLoading } = useQuery({
    queryKey: ['pnlReport', currentCompany?.id], 
    queryFn: reportService.getIncomeStatement,
    enabled: !!currentCompany?.id,
  });

  const totalIncome = pnlData?.revenue || 0;
  const totalExpenses = pnlData?.expenses || 0;
  const netProfit = pnlData?.netProfit || 0;
  const isProfit = netProfit >= 0;
  
  const incomeBreakdown = pnlData?.breakdown.revenue || {};
  const expenseBreakdown = pnlData?.breakdown.expenses || {};

  const filters = (
    <div className="flex items-center gap-2">
      <label className="text-sm">{t.dateRange}:</label>
      <select 
        value={dateRange} 
        onChange={e => setDateRange(e.target.value)}
        className={`px-3 py-1.5 rounded-lg border focus:outline-none text-sm font-medium transition-colors ${isDark ? 'bg-gray-800 text-white border-gray-700 hover:border-gray-600' : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400'}`}
      >
        <option value="allTime">{t.allTime}</option>
        {/* <option value="thisMonth">{t.thisMonth}</option> */}
        {/* <option value="last30days">{t.last30days}</option> */}
      </select>
    </div>
  );

  const SummaryCard = ({ title, amount, icon: Icon, colorClass, bgClass }: any) => (
      <div className={`p-5 rounded-2xl border relative overflow-hidden group ${isDark ? 'bg-gray-900/60 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-110 transition-transform duration-500 ${bgClass}`} />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{title}</p>
                <div className={`p-2 rounded-lg ${bgClass} bg-opacity-20`}>
                    <Icon size={20} className={colorClass} />
                </div>
            </div>
            <p className={`text-3xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCurrency(amount, currency)}
            </p>
          </div>
      </div>
  );

  return (
    <ReportContainer title={t.profitAndLoss} filters={filters}>
        {isLoading ? (
             <div className="flex flex-col justify-center items-center p-20">
                 <Loader className="w-12 h-12 animate-spin text-cyan-400 mb-4" />
                 <p className="text-gray-500 animate-pulse">جاري إعداد التقرير المالي...</p>
             </div>
        ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <SummaryCard 
                        title={t.totalIncome} 
                        amount={totalIncome} 
                        icon={TrendingUp} 
                        colorClass="text-emerald-400" 
                        bgClass="bg-emerald-500" 
                    />
                    <SummaryCard 
                        title={t.totalExpenses} 
                        amount={totalExpenses} 
                        icon={TrendingDown} 
                        colorClass="text-orange-400" 
                        bgClass="bg-orange-500" 
                    />
                    <div className={`p-5 rounded-2xl border relative overflow-hidden ${isProfit ? (isDark ? 'bg-cyan-900/20 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'bg-cyan-50 border-cyan-200') : (isDark ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200')}`}>
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-2">
                                <p className={`text-sm font-bold uppercase tracking-wider ${isProfit ? 'text-cyan-500' : 'text-red-500'}`}>{isProfit ? t.netProfit : t.netLoss}</p>
                                {isProfit ? <PieIcon className="text-cyan-500" /> : <ArrowDown className="text-red-500"/>}
                            </div>
                            <p className={`text-4xl font-bold font-mono ${isProfit ? (isDark ? 'text-cyan-400' : 'text-cyan-700') : (isDark ? 'text-red-400' : 'text-red-700')}`}>
                                {formatCurrency(Math.abs(netProfit), currency)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mb-6 flex justify-end">
                    <SegmentedControl 
                        theme={theme}
                        value={viewMode}
                        onChange={(v) => setViewMode(v as 'table' | 'chart')}
                        options={[
                            { value: 'chart', label: 'Chart', icon: BarChart2 },
                            { value: 'table', label: 'Details', icon: List }
                        ]}
                    />
                </div>
                
                {viewMode === 'table' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900/40 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-dashed border-gray-700 pb-3">
                                <div className="p-1.5 bg-emerald-500/20 rounded"><TrendingUp className="text-emerald-400" size={18}/></div>
                                <span className={isDark ? 'text-white' : 'text-slate-900'}>{t.incomeBreakdown}</span>
                            </h3>
                            <div className="space-y-1">
                                {Object.entries(incomeBreakdown).sort(([,a], [,b]) => (b as number) - (a as number)).map(([category, amount]) => (
                                    <CategoryBreakdownItem 
                                        key={category}
                                        label={category}
                                        amount={amount as number}
                                        percentage={totalIncome > 0 ? ((amount as number) / totalIncome) * 100 : 0}
                                        currency={currency}
                                        theme={theme}
                                        type="income"
                                    />
                                ))}
                                {Object.keys(incomeBreakdown).length === 0 && <p className="text-sm text-gray-500 text-center py-8 italic">لا توجد بيانات إيرادات.</p>}
                            </div>
                        </div>
                        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900/40 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-dashed border-gray-700 pb-3">
                                <div className="p-1.5 bg-orange-500/20 rounded"><TrendingDown className="text-orange-400" size={18}/></div>
                                <span className={isDark ? 'text-white' : 'text-slate-900'}>{t.expenseBreakdown}</span>
                            </h3>
                            <div className="space-y-1">
                                {Object.entries(expenseBreakdown).sort(([,a], [,b]) => (b as number) - (a as number)).map(([category, amount]) => (
                                    <CategoryBreakdownItem 
                                        key={category}
                                        label={category}
                                        amount={amount as number}
                                        percentage={totalExpenses > 0 ? ((amount as number) / totalExpenses) * 100 : 0}
                                        currency={currency}
                                        theme={theme}
                                        type="expense"
                                    />
                                ))}
                                {Object.keys(expenseBreakdown).length === 0 && <p className="text-sm text-gray-500 text-center py-8 italic">لا توجد بيانات مصروفات.</p>}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={`p-8 rounded-2xl border flex items-center justify-center ${isDark ? 'bg-gray-900/40 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="w-full max-w-2xl">
                            <ProfitAndLossChart totalIncome={totalIncome} totalExpenses={totalExpenses} netProfit={netProfit} />
                        </div>
                    </div>
                )}
            </div>
        )}
    </ReportContainer>
  );
};
