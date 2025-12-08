
import React, { useRef, useState } from 'react';
import { SectionBox } from '../../../components/ui/SectionBox';
import { Toggle } from '../../../components/ui/Toggle';
import { SettingsState, AppTheme } from '../../../types';
import { Rows, View, Check, Upload, Loader, Sparkles, Zap, Eye } from 'lucide-react';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { HoloButton } from '../../../components/ui/HoloButton';
import { storageService } from '../../../services/storageService';
import { useZustandStore } from '../../../store/useStore';
import { Textarea } from '../../../components/ui/Textarea';

interface AppearanceSettingsProps {
  localSettings: SettingsState;
  setLocalSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  t: Record<string, string>;
  theme: AppTheme;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ localSettings, setLocalSettings, t, theme }) => {
  const isLightTheme = theme.startsWith('light');
  const addToast = useZustandStore(s => s.addToast);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectClasses = isLightTheme
    ? 'bg-slate-50 text-slate-900 border-slate-300'
    : 'bg-[rgb(var(--bg-secondary-rgb))] text-white border-[rgb(var(--border-primary-rgb))]';
    
  const accentColors: SettingsState['appearance']['accentColor'][] = ['cyan', 'purple', 'green', 'orange', 'red', 'yellow'];
  const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]',
    purple: 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]',
    green: 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]',
    orange: 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]',
    red: 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    yellow: 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]',
  };
  
  const docAccentColors = [
      { name: 'Cyan', value: '#06b6d4' },
      { name: 'Blue', value: '#3b82f6' },
      { name: 'Purple', value: '#8b5cf6' },
      { name: 'Green', value: '#10b981' },
      { name: 'Orange', value: '#f97316' },
      { name: 'Slate', value: '#475569' },
  ];

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const { publicUrl, error } = await storageService.uploadAttachment(file);
      setIsUploading(false);

      if (error) {
          addToast({ message: `Failed to upload logo: ${error.message}`, type: 'error' });
      } else if (publicUrl) {
          setLocalSettings(prev => ({
              ...prev,
              companyProfile: { ...prev.companyProfile, logoUrl: publicUrl }
          }));
          addToast({ message: 'تم رفع الشعار بنجاح', type: 'success' });
      }
  };


  return (
    <div className="space-y-6">
      <SectionBox title={t.generalAppearance} theme={theme}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
                <label htmlFor="themeSelect" className="block text-slate-400 text-sm mb-2">{t.theme}</label>
                <select id="themeSelect" value={localSettings.appearance.theme} onChange={(e) => setLocalSettings((p) => ({ ...p, appearance: { ...p.appearance, theme: e.target.value as any } }))} className={`w-full rounded-lg p-3 border focus:ring-2 focus:ring-cyan-500 outline-none ${selectClasses}`}>
                  <option value="light">{t.light}</option>
                  <option value="light-corporate">{t.corporate || 'Corporate'}</option>
                  <option value="dark">{t.dark}</option>
                  <option value="dark-midnight">{t.midnight || 'Midnight'}</option>
                  <option value="dark-terminal">{t.terminal || 'Terminal'}</option>
                  <option value="dark-graphite">{t.graphite || 'Graphite'}</option>
                  <option value="system">{t.system}</option>
                </select>
            </div>
            <div>
                 <label className="block text-slate-400 text-sm mb-2">{t.density}</label>
                 <SegmentedControl
                    value={localSettings.appearance.density}
                    onChange={(value) => setLocalSettings(p => ({...p, appearance: {...p.appearance, density: value}}))}
                    theme={theme}
                    options={[
                        { label: t.comfortable, value: 'comfortable', icon: View },
                        { label: t.compact, value: 'compact', icon: Rows },
                    ]}
                 />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">{t.fontSize}</label>
              <SegmentedControl
                  value={localSettings.appearance.fontSize}
                  onChange={(value) => setLocalSettings(p => ({...p, appearance: {...p.appearance, fontSize: value}}))}
                  theme={theme}
                  options={[ { label: t.small, value: 'small' }, { label: t.normal, value: 'normal' }, { label: t.large, value: 'large' } ]}
              />
            </div>
            <div>
              <label htmlFor="fontSelect" className="block text-slate-400 text-sm mb-2">{t.font}</label>
              <select id="fontSelect" value={localSettings.appearance.font} onChange={(e) => setLocalSettings((p) => ({ ...p, appearance: { ...p.appearance, font: e.target.value as any } }))} className={`w-full rounded-lg p-3 border focus:ring-2 focus:ring-cyan-500 outline-none ${selectClasses}`}>
                <option value="system">{t.systemFont}</option>
                <option value="tajawal">{t.tajawalFont}</option>
              </select>
            </div>
        </div>
      </SectionBox>
      
      <SectionBox title={t.colorsAndEffects} theme={theme}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Accent Color Picker */}
          <div>
            <label className="block text-slate-400 text-sm mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-cyan-400" /> {t.accentColor}
            </label>
            <div className="flex flex-wrap gap-4">
                {accentColors.map(color => (
                    <button key={color} onClick={() => setLocalSettings(p => ({...p, appearance: {...p.appearance, accentColor: color}}))}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 relative ${colorMap[color]} ${localSettings.appearance.accentColor === color ? `scale-110 ring-2 ring-offset-2 ${isLightTheme ? 'ring-offset-white' : 'ring-offset-gray-900'} ring-white` : 'hover:scale-105 hover:brightness-110'}`}
                    >
                       {localSettings.appearance.accentColor === color && <Check size={24} className="text-white drop-shadow-md"/>}
                    </button>
                ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
                {localSettings.appearance.theme.includes('dark') ? 'This color will glow in the dark interface.' : 'Primary color for buttons and highlights.'}
            </p>
          </div>

          {/* Effects Controls */}
          <div className={`p-6 rounded-2xl border ${isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/5'}`}>
              <div className="space-y-6">
                  <div>
                      <label className="block text-slate-400 text-sm mb-2 flex items-center gap-2">
                          <Zap size={16} /> {t.glowIntensity}
                      </label>
                        <SegmentedControl
                          value={localSettings.appearance.glowIntensity}
                          onChange={(value) => setLocalSettings(p => ({...p, appearance: {...p.appearance, glowIntensity: value}}))}
                          theme={theme}
                          options={[ { label: t.off, value: 'off' }, { label: t.subtle, value: 'subtle' }, { label: t.normal, value: 'normal' }, { label: t.intense, value: 'intense' } ]}
                      />
                  </div>
                  <div>
                      <label className="block text-slate-400 text-sm mb-2">{t.animationIntensity}</label>
                        <SegmentedControl
                          value={localSettings.appearance.animationIntensity}
                          onChange={(value) => setLocalSettings(p => ({...p, appearance: {...p.appearance, animationIntensity: value}}))}
                          theme={theme}
                          options={[ { label: t.full, value: 'full' }, { label: t.subtle, value: 'subtle' }, { label: t.off, value: 'off' } ]}
                      />
                  </div>
                    <div className="flex items-center justify-between pt-2">
                      <label className="block text-slate-400 text-sm font-medium">{t.backgroundAnimations}</label>
                      <Toggle 
                          checked={localSettings.appearance.backgroundAnimations} 
                          onChange={(v) => setLocalSettings((p) => ({ ...p, appearance: { ...p.appearance, backgroundAnimations: v } }))}
                      />
                  </div>
              </div>
          </div>
        </div>
      </SectionBox>

      <SectionBox title="مظهر المستندات والفواتير" theme={theme}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <label className="block text-slate-400 text-sm mb-2">شعار الشركة (للطباعة)</label>
                <div className="flex items-center gap-4">
                    <div className={`w-32 h-32 rounded-xl flex items-center justify-center border-2 border-dashed ${isLightTheme ? 'bg-slate-100 border-slate-300' : 'bg-black/20 border-gray-700'}`}>
                        {localSettings.companyProfile.logoUrl ? (
                            <img src={localSettings.companyProfile.logoUrl} alt="logo" className="max-w-full max-h-full object-contain rounded-lg"/>
                        ) : <span className="text-xs text-slate-500 text-center px-2">JPG/PNG<br/>Max 2MB</span>}
                    </div>
                    <div className="flex flex-col gap-2">
                        <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                        <HoloButton variant="secondary" icon={isUploading ? Loader : Upload} onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                            {isUploading ? 'جاري الرفع...' : 'رفع الشعار'}
                        </HoloButton>
                        {localSettings.companyProfile.logoUrl && (
                            <button onClick={() => setLocalSettings(p => ({ ...p, companyProfile: { ...p.companyProfile, logoUrl: '' }}))} className="text-xs text-red-400 hover:underline">إزالة الشعار</button>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="space-y-6">
                <div>
                     <label className="block text-slate-400 text-sm mb-2">اللون المميز للمستند (الطباعة)</label>
                     <div className="flex flex-wrap gap-3">
                         {docAccentColors.map(color => (
                             <button
                                key={color.name}
                                onClick={() => setLocalSettings(p => ({ ...p, appearance: { ...p.appearance, documentAccentColor: color.value }}))}
                                className="w-8 h-8 rounded-full transition-transform hover:scale-110 shadow-sm"
                                style={{ 
                                    backgroundColor: color.value,
                                    border: localSettings.appearance.documentAccentColor === color.value ? `3px solid white` : 'none',
                                    boxShadow: localSettings.appearance.documentAccentColor === color.value ? `0 0 0 2px ${color.value}` : 'none'
                                }}
                                title={color.name}
                             />
                         ))}
                     </div>
                </div>
                 <div>
                    <label className="block text-slate-400 text-sm mb-2">نص تذييل الصفحة (Footer)</label>
                    <Textarea
                        placeholder="مثال: شكرًا لتعاملكم معنا. السجل التجاري: ..."
                        value={localSettings.companyProfile.footerText || ''}
                        onChange={e => setLocalSettings(p => ({ ...p, companyProfile: { ...p.companyProfile, footerText: e.target.value }}))}
                        className="text-sm"
                    />
                </div>
            </div>
        </div>
      </SectionBox>

      <SectionBox title={t.tableAppearance} theme={theme}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                  <label className="block text-slate-400 text-sm mb-2">{t.tableTheme}</label>
                  <SegmentedControl
                      value={localSettings.appearance.tables.theme}
                      onChange={(value) => setLocalSettings(p => ({ ...p, appearance: { ...p.appearance, tables: { ...p.appearance.tables, theme: value } } }))}
                      theme={theme}
                      options={[ { label: t.plain, value: 'plain' }, { label: t.striped, value: 'striped' } ]}
                  />
              </div>
              <div>
                  <label className="block text-slate-400 text-sm mb-2">{t.headerStyle}</label>
                  <SegmentedControl
                      value={localSettings.appearance.tables.headerStyle}
                      onChange={(value) => setLocalSettings(p => ({ ...p, appearance: { ...p.appearance, tables: { ...p.appearance.tables, headerStyle: value } } }))}
                      theme={theme}
                      options={[ { label: t.normal, value: 'normal' }, { label: t.bold, value: 'bold' }, { label: t.accent, value: 'accent' } ]}
                  />
              </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">{t.tableFontSize}</label>
                  <SegmentedControl
                      value={localSettings.appearance.tables.fontSize}
                      onChange={(value) => setLocalSettings(p => ({ ...p, appearance: { ...p.appearance, tables: { ...p.appearance.tables, fontSize: value } } }))}
                      theme={theme}
                      options={[ { label: t.small, value: 'small' }, { label: t.normal, value: 'normal' }, { label: t.large, value: 'large' } ]}
                  />
              </div>
          </div>
      </SectionBox>
    </div>
  );
};
