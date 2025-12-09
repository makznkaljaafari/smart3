
import React, { useMemo } from 'react';
import { SectionBox } from '../../../components/ui/SectionBox';
import { SettingsState, CurrencyCode, LangCode, AppTheme } from '../../../types';
import { currencyLabels } from '../../../lib/i18n';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';

interface ProfileSettingsProps {
  localSettings: SettingsState;
  setLocalSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  t: Record<string, string>;
  lang: 'ar' | 'en';
  theme: AppTheme;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ localSettings, setLocalSettings, t, lang, theme }) => {

  // Merge default and custom currencies for dropdown
  const allCurrencies = useMemo(() => {
      const builtIn: Record<string, { ar: string, en: string }> = { ...currencyLabels };
      const custom = localSettings.customCurrencies || [];
      custom.forEach(c => {
          builtIn[c.code] = { ar: c.nameAr, en: c.nameEn };
      });
      return builtIn;
  }, [localSettings.customCurrencies]);

  return (
    <SectionBox title={t.profile} theme={theme}>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input aria-label={t.name} placeholder={t.name} value={localSettings.profile.name} onChange={(e) => setLocalSettings((p) => ({ ...p, profile: { ...p.profile, name: e.target.value } }))} className="p-2" />
          <Input aria-label={t.phone} placeholder={t.phone} value={localSettings.profile.phone} onChange={(e) => setLocalSettings((p) => ({ ...p, profile: { ...p.profile, phone: e.target.value } }))} className="p-2" />
          <Select aria-label={t.locale} value={localSettings.profile.locale} onChange={(e) => setLocalSettings((p) => ({ ...p, profile: { ...p.profile, locale: e.target.value as LangCode } }))} className="p-2" >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </Select>
          <Select aria-label={t.preferredCurrency} value={localSettings.profile.preferredCurrency} onChange={(e) => setLocalSettings((p) => ({ ...p, profile: { ...p.profile, preferredCurrency: e.target.value as CurrencyCode } }))} className="p-2" >
            {Object.keys(allCurrencies).map((c) => (<option key={c} value={c}>{allCurrencies[c][lang]} ({c})</option>))}
          </Select>
      </div>
    </SectionBox>
  );
};
