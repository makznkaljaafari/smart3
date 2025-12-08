import React from 'react';
import { SectionBox } from '../../../components/ui/SectionBox';
import { HoloButton } from '../../../components/ui/HoloButton';
import { Sparkles, AlertTriangle, Brain } from 'lucide-react';
import { AppTheme } from '../../../types';

interface AIInsightsSectionProps {
  theme: AppTheme;
  lang: 'ar' | 'en';
  t: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  insights: string[] | null;
  onGenerate: () => void;
  canGenerate: boolean;
}

export const AIInsightsSection: React.FC<AIInsightsSectionProps> = ({
  theme, lang, t, isLoading, error, insights, onGenerate, canGenerate
}) => {
  return (
    <SectionBox title={<div className="flex items-center gap-2"><Sparkles className="text-purple-400" /> {t.aiInsights}</div>} theme={theme}>
      {isLoading ? (
        <div className="space-y-3"><div className={`h-4 rounded-md animate-pulse w-3/4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-slate-200'}`}></div><div className={`h-4 rounded-md animate-pulse w-5/6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-slate-200'}`}></div><div className={`h-4 rounded-md animate-pulse w-1/2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-slate-200'}`}></div></div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-400"><AlertTriangle size={18} /><span>{error}</span></div>
      ) : insights ? (
        <ul className={`list-disc space-y-2 ${lang === 'ar' ? 'pr-6' : 'pl-6'}`}>
          {insights?.map((insight, index) => <li key={index}>{insight}</li>)}
        </ul>
      ) : (
        <div className="text-center">
          <p className="mb-4">{lang === 'ar' ? 'اضغط لإنشاء رؤى وتحليلات ذكية بناءً على بياناتك الحالية والمتوقعة.' : 'Click to generate smart insights and analysis based on your current and forecasted data.'}</p>
          <HoloButton icon={Brain} onClick={onGenerate} disabled={!canGenerate}>
            {lang === 'ar' ? 'توليد الرؤى الذكية' : 'Generate Insights'}
          </HoloButton>
          {!canGenerate && <p className="text-xs mt-2 text-gray-500">{lang === 'ar' ? 'يجب إنشاء توقعات التدفق النقدي أولاً.' : 'Cash flow forecast must be generated first.'}</p>}
        </div>
      )}
    </SectionBox>
  );
};
