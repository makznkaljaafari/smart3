import React from 'react';
import { SectionBox } from '../../../components/ui/SectionBox';
import { Toggle } from '../../../components/ui/Toggle';
import { SettingsState, PageSettings } from '../../../types';

interface PageSettingsSectionProps {
  localSettings: SettingsState;
  setLocalSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  t: Record<string, string>;
  onReset: (page: keyof PageSettings) => void;
  theme: 'light' | 'dark';
}

interface PageConfigBlockProps {
  title: string;
  settings: { pageSize: number; visibleCols: string[] };
  onPageSizeChange: (value: number) => void;
  onReset: () => void;
  t: Record<string, string>;
  theme: 'light' | 'dark';
}

const PageConfigBlock: React.FC<PageConfigBlockProps> = ({ title, settings, onPageSizeChange, onReset, t, theme }) => {
  const tagClasses = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-slate-100 border-slate-300 text-slate-700';
  const inputClasses = `w-full mt-1 p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-slate-800 border-slate-300'}`;
  const labelClasses = `text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{title}</h4>
        <button className="text-sm underline text-cyan-400 hover:text-cyan-300" onClick={onReset}>{t.reset}</button>
      </div>
      <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-slate-100'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>{t.rowsPerPage}</label>
            <input 
              type="number"
              value={settings.pageSize}
              onChange={e => onPageSizeChange(Math.max(1, Number(e.target.value)))}
              className={inputClasses}
              min="1"
            />
          </div>
          <div>
            <label className={labelClasses}>{t.visibleColumns}</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {settings.visibleCols.map((c, i) => (
                <span key={i} className={`px-2 py-1 text-xs rounded-md border ${tagClasses}`}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export const PageSettingsSection: React.FC<PageSettingsSectionProps> = ({ localSettings, setLocalSettings, t, onReset, theme }) => {
  
  const handlePageSizeChange = (page: 'customers' | 'debts' | 'expenses', value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      page: {
        ...prev.page,
        [page]: { ...prev.page[page], pageSize: value }
      }
    }));
  };

  const handleNoteSettingChange = (key: 'allowAudio' | 'allowImages', value: boolean) => {
     setLocalSettings(prev => ({
      ...prev,
      page: {
        ...prev.page,
        notes: { ...prev.page.notes, [key]: value }
      }
    }));
  };
  
  return (
    <SectionBox title={t.pageSettings} theme={theme}>
      <div className="space-y-6">
        <PageConfigBlock 
          title={t.customers}
          settings={localSettings.page.customers}
          onPageSizeChange={value => handlePageSizeChange('customers', value)}
          onReset={() => onReset('customers')}
          t={t}
          theme={theme}
        />
        <PageConfigBlock 
          title={t.debts}
          settings={localSettings.page.debts}
          onPageSizeChange={value => handlePageSizeChange('debts', value)}
          onReset={() => onReset('debts')}
          t={t}
          theme={theme}
        />
        <PageConfigBlock 
          title={t.expenses}
          settings={localSettings.page.expenses}
          onPageSizeChange={value => handlePageSizeChange('expenses', value)}
          onReset={() => onReset('expenses')}
          t={t}
          theme={theme}
        />
        
        <div>
           <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{t.notes}</h4>
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-slate-100'} space-y-3`}>
                <div className="flex justify-between items-center">
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}>{t.allowAudioNotes}</span>
                    <Toggle 
                        checked={localSettings.page.notes.allowAudio}
                        onChange={value => handleNoteSettingChange('allowAudio', value)} 
                    />
                </div>
                 <div className="flex justify-between items-center">
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}>{t.allowImageNotes}</span>
                    <Toggle 
                        checked={localSettings.page.notes.allowImages}
                        onChange={value => handleNoteSettingChange('allowImages', value)} 
                    />
                </div>
            </div>
        </div>
      </div>
    </SectionBox>
  );
};