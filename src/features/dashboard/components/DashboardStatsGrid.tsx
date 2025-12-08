
import React from 'react';
import { DashboardCardConfig, AppTheme } from '../../../types';
import { SciFiCard } from '../../../components/ui/SciFiCard';
import { FinancialHealthCard } from './FinancialHealthCard';
import { DailyBriefingCard } from './DailyBriefingCard';
import { StretchHorizontal, Minimize } from 'lucide-react';
import { cardMetaData } from '../lib/dashboardUtils';
import { Skeleton } from '../../../components/ui/Skeleton';

interface DashboardStatsGridProps {
  theme: AppTheme;
  t: Record<string, string>;
  lang: 'ar' | 'en';
  baseCurrency: string;
  customizeMode: boolean;
  localDashboardCards: DashboardCardConfig[];
  dashboardStats: any;
  financialHealth: { score: number; summary: string; analysis: string } | null;
  isHealthLoading: boolean;
  briefing: string | null;
  isBriefingLoading: boolean;
  onGenerateBriefing: () => void;
  onCardChange: (id: DashboardCardConfig['id'], key: keyof DashboardCardConfig, value: any) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (targetId: string) => void;
  draggedId: string | null;
  onViewHealthDetails: () => void;
  onGenerateHealth: () => void;
  onCardClick: (id: DashboardCardConfig['id']) => void;
  isLoading?: boolean;
}

const numberFormatter = new Intl.NumberFormat('en-US');

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({
  theme, t, lang, baseCurrency, customizeMode, localDashboardCards, dashboardStats, financialHealth, isHealthLoading,
  briefing, isBriefingLoading, onGenerateBriefing,
  onCardChange, onDragStart, onDragOver, onDrop, draggedId, onViewHealthDetails, onGenerateHealth, onCardClick,
  isLoading = false,
}) => {

  if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
                <div key={i} className={`lg:col-span-2 rounded-xl overflow-hidden border ${theme.includes('dark') ? 'border-gray-800' : 'border-slate-200'}`}>
                    <Skeleton height="100%" className="min-h-[140px]" variant="rectangular" />
                </div>
            ))}
        </div>
      );
  }

  return (
    <div 
      data-tour-id="dashboard-grid"
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 ${customizeMode ? 'ring-2 ring-cyan-500/50 ring-dashed p-6 rounded-xl bg-cyan-500/5' : ''}`}>
      {localDashboardCards.map(cardConfig => {
        if (!cardConfig.visible && !customizeMode) return null;

        const sizeClass = cardConfig.size === 'wide' ? 'lg:col-span-3' : 'lg:col-span-2';
        const isNavigable = ['totalDebts', 'overdueDebts', 'totalIncome', 'totalExpenses'].includes(cardConfig.id);


        const commonDivProps = {
            key: cardConfig.id,
            draggable: customizeMode,
            onDragStart: () => onDragStart(cardConfig.id),
            onDragOver: onDragOver,
            onDrop: () => onDrop(cardConfig.id),
            className: `transition-all duration-300 relative ${sizeClass} ${draggedId === cardConfig.id ? 'opacity-30 scale-95' : 'opacity-100'} ${customizeMode ? 'cursor-move hover:ring-2 hover:ring-cyan-400 rounded-2xl' : ''}`
        };
        
        const CustomizeControls = () => (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
            <button
              title={cardConfig.size === 'wide' ? 'Make smaller' : 'Make wider'}
              onClick={() => onCardChange(cardConfig.id, 'size', cardConfig.size === 'wide' ? 'default' : 'wide')}
              className="p-1.5 bg-white/10 rounded-full text-white hover:bg-white/20 backdrop-blur-sm"
            >
              {cardConfig.size === 'wide' ? <Minimize size={14} /> : <StretchHorizontal size={14} />}
            </button>
          </div>
        );
        
        if (cardConfig.id === 'dailyBriefing') {
          return (
            <div {...commonDivProps}>
              {customizeMode && <CustomizeControls />}
              <DailyBriefingCard
                briefing={briefing}
                isLoading={isBriefingLoading}
                onRegenerate={onGenerateBriefing}
                theme={theme as AppTheme}
                t={t}
                inCustomizeMode={customizeMode}
                isVisible={cardConfig.visible}
                onToggleVisibility={() => onCardChange(cardConfig.id, 'visible', !cardConfig.visible)}
              />
            </div>
          )
        }

        if (cardConfig.id === 'financialHealth') {
          return (
            <div {...commonDivProps}>
              {customizeMode && <CustomizeControls />}
              <FinancialHealthCard
                score={financialHealth?.score}
                summary={financialHealth?.summary}
                theme={theme as AppTheme}
                t={t}
                onViewDetails={onViewHealthDetails}
                onGenerate={onGenerateHealth}
                isLoading={isHealthLoading}
                lang={lang}
                inCustomizeMode={customizeMode}
                isVisible={cardConfig.visible}
                onToggleVisibility={() => onCardChange(cardConfig.id, 'visible', !cardConfig.visible)}
              />
            </div>
          );
        }

        const meta = cardMetaData[cardConfig.id as keyof typeof cardMetaData];
        const stats = dashboardStats[cardConfig.id as keyof typeof dashboardStats];
        if (!meta || !stats) return null;
        
        return (
          <div {...commonDivProps}>
             {customizeMode && <CustomizeControls />}
            <SciFiCard
              theme={theme as AppTheme}
              title={t[cardConfig.id]}
              value={`${numberFormatter.format(stats.value)} ${baseCurrency}`}
              icon={meta.icon}
              trend={stats.trend}
              color={cardConfig.color}
              inCustomizeMode={customizeMode}
              isVisible={cardConfig.visible}
              onToggleVisibility={() => onCardChange(cardConfig.id, 'visible', !cardConfig.visible)}
              onClick={isNavigable ? () => onCardClick(cardConfig.id) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
};
