
import React from 'react';
import { HoloButton } from '../../../components/ui/HoloButton';
import { Brain, RefreshCw, Terminal } from 'lucide-react';
import { AppTheme } from '../../../types';
import { marked } from 'marked';

interface DailyBriefingCardProps {
  briefing: string | null;
  isLoading: boolean;
  onRegenerate: () => void;
  theme: AppTheme;
  t: Record<string, string>;
  inCustomizeMode?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export const DailyBriefingCard: React.FC<DailyBriefingCardProps> = ({
  briefing, isLoading, onRegenerate, theme, t,
  inCustomizeMode, isVisible, onToggleVisibility
}) => {
  const isDark = theme.includes('dark');
  const cardBaseClasses = 'relative rounded-xl p-5 flex flex-col h-full transition-all duration-300 overflow-hidden group';
  const themeClasses = theme.startsWith('light')
    ? 'bg-white border border-slate-200 shadow-sm'
    : 'bg-gray-900 border border-[var(--accent-border-50)] bg-[linear-gradient(45deg,rgba(0,0,0,0.5)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.5)_50%,rgba(0,0,0,0.5)_75%,transparent_75%,transparent)] bg-[length:4px_4px]';

  return (
    <div className={`${cardBaseClasses} ${themeClasses} ${!isVisible && inCustomizeMode ? 'opacity-30' : ''}`}>
      {/* Scanline Overlay */}
      {isDark && <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,rgba(0,255,255,0.03)_50%,rgba(0,0,0,0)_50%)] bg-[length:100%_4px] z-0"></div>}
      
      <div className="relative z-10 flex justify-between items-center mb-3 border-b border-dashed border-gray-700/50 pb-2">
        <h3 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-cyan-400 font-mono tracking-tight' : 'text-slate-800'}`}>
          {isDark ? <Terminal size={18} /> : <Brain size={20} className="text-purple-400" />}
          {isDark ? '> DAILY_BRIEFING_LOG' : 'الموجز اليومي'}
        </h3>
        <HoloButton 
          onClick={onRegenerate} 
          disabled={isLoading} 
          className="!p-1.5 !rounded-lg opacity-70 hover:opacity-100"
          variant="secondary"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </HoloButton>
      </div>
      
      <div className={`flex-1 relative z-10 ${isDark ? 'text-green-400 font-mono text-sm leading-relaxed' : 'text-[rgb(var(--text-secondary-rgb))]'}`}>
        {isLoading && !briefing ? (
          <div className="space-y-3 mt-2">
             <div className="flex items-center gap-2 text-cyan-500 animate-pulse">
                <span className="w-2 h-4 bg-cyan-500"></span>
                <span>INITIALIZING_AI_ANALYSIS...</span>
             </div>
             <div className={`h-2 rounded w-3/4 opacity-30 ${isDark ? 'bg-green-500' : 'bg-slate-300'}`}></div>
             <div className={`h-2 rounded w-1/2 opacity-30 ${isDark ? 'bg-green-500' : 'bg-slate-300'}`}></div>
          </div>
        ) : briefing ? (
          <div
            className="prose prose-sm prose-invert max-w-none custom-scrollbar"
            dangerouslySetInnerHTML={{ __html: marked(briefing) as string }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
            <Brain size={32} className="mb-2" />
            <p className="text-xs">
              {isDark ? 'NO_DATA_GENERATED. AWAITING_INPUT.' : 'لم يتم إنشاء الموجز اليومي بعد.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
