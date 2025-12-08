
import React from 'react';
import { SectionBox } from '../ui/SectionBox';
import { useZustandStore } from '../../store/useStore';

interface SimplePlaceholderProps {
    title: string;
}

export const SimplePlaceholder: React.FC<SimplePlaceholderProps> = ({ title }) => {
  const { theme, lang } = useZustandStore(state => ({ theme: state.theme, lang: state.lang }));
  return (
    <SectionBox title={title} theme={theme}>
      <p className="font-semibold text-lg">
        {lang === 'ar' ? `نحن نعمل على بناء صفحة ${title}!` : `We're building the ${title} page!`}
      </p>
      <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
        {lang === 'ar' ? 'سيتم إضافة وظائف متقدمة لإدارة وتحليل بياناتك هنا قريبًا. ترقب التحديثات!' : 'Advanced features for managing and analyzing your data will be implemented here soon. Stay tuned for updates!'}
      </p>
    </SectionBox>
  );
};