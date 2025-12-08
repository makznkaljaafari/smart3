
import React from 'react';
import { HoloButton } from '../../../components/ui/HoloButton';
import { Eye, Loader, Brain, EyeOff } from 'lucide-react';
import { LangCode, AppTheme } from '../../../types';

interface FinancialHealthCardProps {
  score?: number;
  summary?: string;
  theme: AppTheme;
  onViewDetails: () => void;
  onGenerate: () => void;
  t: Record<string, any>;
  isLoading: boolean;
  lang: LangCode;
  inCustomizeMode?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({ 
    score, summary, theme, onViewDetails, onGenerate, t, isLoading, lang, 
    inCustomizeMode, isVisible, onToggleVisibility 
}) => {
  const isGenerated = typeof score === 'number';
  const isDark = theme.includes('dark');

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = isGenerated ? circumference - (score / 100) * circumference : circumference;

  let colorClass = 'text-green-400';
  let statusText = t.financialStatusGood;
  let trackColor = isDark ? 'stroke-green-500/20' : 'stroke-green-100';
  let progressColor = 'stroke-green-500';
  let glowFilter = isDark ? 'drop-shadow(0 0 6px rgba(34,197,94,0.5))' : 'none';

  if (isGenerated) {
      if (score < 40) {
        colorClass = 'text-red-400';
        statusText = t.financialStatusPoor;
        trackColor = isDark ? 'stroke-red-500/20' : 'stroke-red-100';
        progressColor = 'stroke-red-500';
        glowFilter = isDark ? 'drop-shadow(0 0 6px rgba(239,68,68,0.5))' : 'none';
      } else if (score < 70) {
        colorClass = 'text-yellow-400';
        statusText = t.financialStatusAverage;
        trackColor = isDark ? 'stroke-yellow-500/20' : 'stroke-yellow-100';
        progressColor = 'stroke-yellow-500';
        glowFilter = isDark ? 'drop-shadow(0 0 6px rgba(234,179,8,0.5))' : 'none';
      }
  }

  const cardBaseClasses = 'relative rounded-xl p-4 flex flex-col items-center justify-between text-center h-full transition-all duration-300';
  const themeClasses = theme.startsWith('light')
    ? 'bg-white border border-slate-200 shadow-sm'
    : 'bg-gray-900 border border-[var(--accent-border-50)]';
    
  if (isLoading) {
    return (
        <div className={`${cardBaseClasses} ${themeClasses} justify-center`}>
            <Loader size={48} className="animate-spin text-cyan-400" />
            <p className="mt-2 text-sm">{lang === 'ar' ? 'جاري الحساب...' : 'Calculating...'}</p>
        </div>
    );
  }

  return (
    <div className={`${cardBaseClasses} ${themeClasses} ${!isVisible && inCustomizeMode ? 'opacity-30' : ''}`}>
       {inCustomizeMode && (
          <div className="absolute inset-0 bg-black/60 rounded-xl z-10 flex items-center justify-center backdrop-blur-sm">
              <button onClick={onToggleVisibility} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20">
                  {isVisible ? <Eye size={24} /> : <EyeOff size={24} />}
              </button>
          </div>
      )}
      {!isGenerated ? (
        <>
             <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>{t.financialHealthScore}</h3>
             <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-400 mb-4">{lang === 'ar' ? 'اضغط للحصول على تحليل لحالتك المالية.' : 'Click to get an analysis of your financial status.'}</p>
                <HoloButton onClick={onGenerate} variant="primary" className="!py-2 !px-4 text-sm">
                    <Brain size={16} /> {lang === 'ar' ? 'حساب المؤشر' : 'Calculate Score'}
                </HoloButton>
             </div>
        </>
      ) : (
        <>
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>{t.financialHealthScore}</h3>
            <div className="relative w-32 h-32 my-2">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle
                    className={trackColor}
                    strokeWidth="8"
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                />
                <circle
                    className={progressColor}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                    style={{ 
                        transform: 'rotate(-90deg)', 
                        transformOrigin: '50% 50%', 
                        transition: 'stroke-dashoffset 1.5s ease-out',
                        filter: glowFilter
                    }}
                />
                </svg>
                <div className={`absolute inset-0 flex flex-col items-center justify-center font-bold ${colorClass}`}>
                <span className="text-4xl drop-shadow-md">{score}</span>
                <span className="text-sm">{statusText}</span>
                </div>
            </div>
            <p className={`text-xs h-8 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{summary}</p>
            <HoloButton onClick={onViewDetails} variant="primary" className="!py-2 !px-4 text-sm mt-3">
                <Eye size={16} /> {t.viewDetails}
            </HoloButton>
        </>
      )}
    </div>
  );
};
