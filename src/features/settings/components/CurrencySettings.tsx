
import React, { useState, useMemo } from 'react';
import { SectionBox } from '../../../components/ui/SectionBox';
import { SettingsState, CurrencyCode, ExchangeRate, AppTheme } from '../../../types';
import { currencyLabels } from '../../../lib/i18n';
import { getLatestRate } from '../../../lib/currency';
import { X, Save, ArrowUp, ArrowDown, TrendingUp, Plus, Coins, Loader } from 'lucide-react';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { useZustandStore } from '../../../store/useStore';
import { settingsService } from '../../../services/settingsService';
import { profileService } from '../../../services/profileService';

interface CurrencySettingsProps {
  localSettings: SettingsState;
  setLocalSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  t: Record<string, string>;
  lang: 'ar' | 'en';
  theme: AppTheme;
}

const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateString));
};

export const CurrencySettings: React.FC<CurrencySettingsProps> = ({ localSettings, setLocalSettings, t, lang, theme }) => {
  const isDark = theme.startsWith('dark');
  const { addToast, currentCompany } = useZustandStore(state => ({ 
      addToast: state.addToast,
      currentCompany: state.currentCompany
  }));
  
  const [rateModalOpen, setRateModalOpen] = useState<CurrencyCode | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState<CurrencyCode | null>(null);
  const [isAddCurrencyModalOpen, setIsAddCurrencyModalOpen] = useState(false);
  
  const [newRate, setNewRate] = useState('');
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [newCurrency, setNewCurrency] = useState({ code: '', nameAr: '', nameEn: '' });
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);

  const { modalRef: rateModalRef, headerRef: rateHeaderRef, position: ratePosition, size: rateSize, handleDragStart: handleRateDragStart } = useDraggableAndResizable({
    initialSize: { width: 500, height: 400 },
    minSize: { width: 400, height: 350 }
  });

  const { modalRef: historyModalRef, headerRef: historyHeaderRef, position: historyPosition, size: historySize, handleDragStart: handleHistoryDragStart, handleResizeStart: handleHistoryResizeStart } = useDraggableAndResizable({
    initialSize: { width: 600, height: 650 },
    minSize: { width: 450, height: 400 }
  });

  const { modalRef: addModalRef, headerRef: addHeaderRef, position: addPosition, size: addSize, handleDragStart: handleAddDragStart } = useDraggableAndResizable({
    initialSize: { width: 450, height: 450 },
  });

  // Merge built-in currencies with user custom currencies
  const allCurrencies = useMemo(() => {
      const builtIn: Record<string, { ar: string, en: string }> = { ...currencyLabels };
      const custom = localSettings.customCurrencies || [];
      custom.forEach(c => {
          builtIn[c.code] = { ar: c.nameAr, en: c.nameEn };
      });
      return builtIn;
  }, [localSettings.customCurrencies]);

  const handleUpdateRate = async () => {
    const newRateValue = parseFloat(newRate);
    if (!rateModalOpen || !newRateValue || newRateValue <= 0) return;
    if (!currentCompany) {
        addToast({ message: 'Company context missing', type: 'error' });
        return;
    }

    setIsSavingRate(true);
    try {
        const newRateEntry: ExchangeRate = {
            id: crypto.randomUUID(), // Temporary ID, DB will assign real one
            from: localSettings.baseCurrency,
            to: rateModalOpen,
            rate: newRateValue,
            date: new Date().toISOString()
        };
        
        // Save to DB immediately
        const { data: savedRate, error } = await settingsService.addExchangeRate(currentCompany.id, newRateEntry);
        
        if (error) throw error;

        // Update local state to reflect change
        setLocalSettings(prev => ({
            ...prev,
            exchangeRates: [...(prev.exchangeRates || []), savedRate || newRateEntry]
        }));
        
        addToast({ message: 'تم حفظ سعر الصرف بنجاح', type: 'success' });
        setRateModalOpen(null);
        setNewRate('');
    } catch (e: any) {
        console.error(e);
        addToast({ message: 'فشل حفظ سعر الصرف: ' + e.message, type: 'error' });
    } finally {
        setIsSavingRate(false);
    }
  };

  const handleAddCustomCurrency = async () => {
      const code = newCurrency.code.toUpperCase().trim();
      if (!code || code.length !== 3) {
          addToast({ message: 'رمز العملة يجب أن يكون 3 أحرف (مثال: EUR)', type: 'error' });
          return;
      }
      if (!newCurrency.nameAr || !newCurrency.nameEn) {
          addToast({ message: 'يرجى إدخال الاسم بالعربية والإنجليزية', type: 'error' });
          return;
      }
      
      if (allCurrencies[code]) {
          addToast({ message: 'هذه العملة موجودة بالفعل', type: 'error' });
          return;
      }

      setIsSavingCurrency(true);
      try {
          const updatedCustomCurrencies = [...(localSettings.customCurrencies || []), { ...newCurrency, code }];
          const updatedEnabledCurrencies = [...localSettings.enabledCurrencies, code];
          
          const updatedSettings = {
              ...localSettings,
              customCurrencies: updatedCustomCurrencies,
              enabledCurrencies: updatedEnabledCurrencies
          };
          
          // Persist definition to user_metadata immediately
          const { error } = await profileService.updateProfileAndSettings(updatedSettings);
          if (error) throw error;

          setLocalSettings(updatedSettings);
          addToast({ message: 'تم إضافة العملة وحفظها بنجاح', type: 'success' });
          setNewCurrency({ code: '', nameAr: '', nameEn: '' });
          setIsAddCurrencyModalOpen(false);
      } catch (e: any) {
          console.error(e);
          addToast({ message: 'فشل حفظ العملة: ' + e.message, type: 'error' });
      } finally {
          setIsSavingCurrency(false);
      }
  };

  const selectClasses = isDark
    ? 'bg-gray-800 text-white border-gray-700'
    : 'bg-slate-50 text-slate-900 border-slate-300';
  
  const checkboxClasses = isDark
    ? 'text-cyan-600 bg-gray-700 border-gray-600'
    : 'text-cyan-600 bg-slate-100 border-slate-300';

  const CurrencyCheckbox: React.FC<{ code: CurrencyCode }> = ({ code }) => {
    const enabled = localSettings.enabledCurrencies.includes(code);
    const lbl = allCurrencies[code]?.[lang] || code;
    return (
      <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg border transition-all ${enabled ? (isDark ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-cyan-50 border-cyan-200') : (isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200')}`}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) =>
            setLocalSettings((prev) => ({
              ...prev,
              enabledCurrencies: e.target.checked ? Array.from(new Set([...prev.enabledCurrencies, code])) : prev.enabledCurrencies.filter((c) => c !== code)
            }))
          }
          className={`w-4 h-4 rounded focus:ring-cyan-500 ${checkboxClasses}`}
        />
        <span className={isDark ? 'text-gray-200' : 'text-slate-700'}>{lbl} ({code})</span>
      </label>
    );
  };
  
  const HistoryModalContent: React.FC<{ currencyCode: CurrencyCode }> = ({ currencyCode }) => {
    const history = (localSettings.exchangeRates || [])
        .filter(r => (r.from === localSettings.baseCurrency && r.to === currencyCode) || (r.from === currencyCode && r.to === localSettings.baseCurrency))
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getRateAndPrevRate = (index: number) => {
        const current = history[index];
        const prev = history[index + 1];
        const currentRate = current.from === localSettings.baseCurrency ? current.rate : 1 / current.rate;
        const prevRate = prev ? (prev.from === localSettings.baseCurrency ? prev.rate : 1 / prev.rate) : null;
        return { currentRate, prevRate };
    }

    return (
        <tbody>
            {history.map((rate, index) => {
                const { currentRate, prevRate } = getRateAndPrevRate(index);
                let change: { value: string, isUp: boolean } | null = null;
                if (prevRate !== null && prevRate > 0) {
                    const diff = currentRate - prevRate;
                    const percentage = (diff / prevRate) * 100;
                    change = { value: percentage.toFixed(2), isUp: diff >= 0 };
                }
                return (
                    <tr key={rate.id} className={`border-b ${isDark ? 'border-gray-800 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'} transition-colors`}>
                        <td className="p-4 text-sm opacity-70">{formatDate(rate.date)}</td>
                        <td className={`p-4 text-center font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentRate.toFixed(4)}</td>
                        <td className="p-4 text-center">
                            {change ? (
                                <span className={`flex items-center justify-center gap-1 font-mono text-xs px-2 py-1 rounded-full bg-opacity-10 ${change.isUp ? 'text-green-400 bg-green-400' : 'text-red-400 bg-red-400'}`}>
                                    {change.isUp ? <ArrowUp size={12}/> : <ArrowDown size={12}/>} {Math.abs(parseFloat(change.value))}%
                                </span>
                            ) : <span className="text-gray-500">-</span>}
                        </td>
                    </tr>
                )
            })}
        </tbody>
    );
  };
  
  const otherCurrencies = localSettings.enabledCurrencies.filter(c => c !== localSettings.baseCurrency);

  return (
    <>
      <SectionBox title={t.currencies} theme={theme}>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <label htmlFor="baseCurrencySelect" className="block text-sm mb-2 opacity-70">{t.baseCurrency}</label>
            <select
              id="baseCurrencySelect"
              value={localSettings.baseCurrency}
              onChange={(e) => setLocalSettings((p) => ({ ...p, baseCurrency: e.target.value as CurrencyCode }))}
              className={`w-full rounded-xl p-3 border focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none ${selectClasses}`}
            >
              {Object.keys(allCurrencies).map((c) => (
                <option key={c} value={c}>
                  {allCurrencies[c][lang]} ({c})
                </option>
              ))}
            </select>
            <p className="text-xs mt-2 opacity-50">سيتم استخدام هذه العملة كمرجع أساسي للتقارير والحسابات.</p>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm opacity-70">{t.enabledCurrencies}</label>
                <button onClick={() => setIsAddCurrencyModalOpen(true)} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    <Plus size={14} /> {lang === 'ar' ? 'إضافة عملة' : 'Add Currency'}
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
              {Object.keys(allCurrencies).map((c) => <CurrencyCheckbox key={c} code={c} />)}
            </div>
          </div>
        </div>
      </SectionBox>

      <div className="mt-6">
          <SectionBox title={t.exchangeRates} theme={theme}>
              <div className="flex items-center gap-2 mb-4 text-xs opacity-60">
                  <TrendingUp size={14} />
                  <span>{t.automaticConversion}</span>
              </div>
              
              <div className="space-y-3">
                  {otherCurrencies.map(currency => {
                      const latestRateInfo = getLatestRate(localSettings.baseCurrency, currency, localSettings.exchangeRates || []);
                      const history = (localSettings.exchangeRates || [])
                          .filter(r => (r.from === localSettings.baseCurrency && r.to === currency) || (r.from === currency && r.to === localSettings.baseCurrency));

                      return (
                          <div key={currency} className={`p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border transition-all ${isDark ? 'bg-gray-800/50 border-gray-700 hover:border-cyan-500/30' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${isDark ? 'bg-gray-700 text-cyan-400' : 'bg-white text-cyan-600 border'}`}>
                                      {currency}
                                  </div>
                                  <div>
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-sm opacity-60">1 {localSettings.baseCurrency} =</span>
                                        <span className={`font-mono font-bold text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {latestRateInfo ? latestRateInfo.rate.toFixed(4) : '---'}
                                        </span>
                                        <span className="text-sm font-bold">{currency}</span>
                                      </div>
                                      {latestRateInfo ? (
                                          <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/> 
                                              {t.lastUpdated}: {formatDate(latestRateInfo.date)}
                                          </p>
                                      ) : (
                                          <p className="text-xs text-red-400 mt-1">{t.noRateSet}</p>
                                      )}
                                  </div>
                              </div>
                              
                              <div className="flex gap-2 w-full sm:w-auto">
                                  <HoloButton variant="secondary" onClick={() => setRateModalOpen(currency)} className="flex-1 sm:flex-none !py-2 !px-4 text-sm">{t.updateRate}</HoloButton>
                                  <HoloButton variant="primary" onClick={() => setHistoryModalOpen(currency)} disabled={history.length === 0} className="flex-1 sm:flex-none !py-2 !px-4 text-sm">{t.rateHistory}</HoloButton>
                              </div>
                          </div>
                      )
                  })}
              </div>
          </SectionBox>
      </div>

      {/* Rate Modal */}
      {rateModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm" onClick={() => setRateModalOpen(null)}>
              <div 
                  ref={rateModalRef}
                  style={{'--modal-x': `${ratePosition.x}px`, '--modal-y': `${ratePosition.y}px`, '--modal-width': `${rateSize.width}px`, '--modal-height': `${rateSize.height}px`} as React.CSSProperties}
                  className={`fixed inset-0 md:inset-auto md:left-[var(--modal-x)] md:top-[var(--modal-y)] md:w-[var(--modal-width)] md:h-[var(--modal-height)] rounded-none md:rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full flex flex-col overflow-hidden border ${isDark ? 'bg-gray-900 border-cyan-500/30' : 'bg-white border-slate-200'}`} 
                  onClick={e => e.stopPropagation()}
              >
                  <div 
                      ref={rateHeaderRef}
                      onMouseDown={handleRateDragStart}
                      className={`p-6 border-b flex items-center justify-between cursor-move ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}
                  >
                      <h3 className="text-xl font-bold">{t.updateRate}</h3>
                      <button onClick={() => setRateModalOpen(null)} className="opacity-70 hover:opacity-100"><X/></button>
                  </div>
                  <div className="p-8 space-y-6 flex-1 flex flex-col justify-center">
                      <div className="text-center mb-4">
                          <p className="text-sm opacity-60 uppercase tracking-wider mb-2">{t.currencyPair}</p>
                          <div className="flex items-center justify-center gap-4 text-2xl font-bold">
                              <span>{localSettings.baseCurrency}</span>
                              <span className="text-cyan-500">→</span>
                              <span>{rateModalOpen}</span>
                          </div>
                      </div>
                      
                      <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                          <label className="block text-sm mb-3 opacity-70">1 {localSettings.baseCurrency} =</label>
                          <div className="flex items-center gap-3">
                            <input 
                                type="number" 
                                value={newRate} 
                                onChange={e => setNewRate(e.target.value)} 
                                autoFocus 
                                placeholder="0.0000"
                                className={`w-full p-4 text-2xl font-mono font-bold bg-transparent border-b-2 focus:outline-none ${isDark ? 'border-gray-600 focus:border-cyan-500 text-white' : 'border-slate-300 focus:border-cyan-600 text-slate-900'}`} 
                            />
                            <span className="text-xl font-bold opacity-50">{rateModalOpen}</span>
                          </div>
                      </div>
                  </div>
                  <div className={`p-4 flex justify-end gap-3 border-t ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                      <button onClick={() => setRateModalOpen(null)} className="px-6 py-2 rounded-xl font-medium opacity-70 hover:opacity-100 transition-opacity">{t.cancel}</button>
                      <HoloButton variant="success" icon={isSavingRate ? Loader : Save} onClick={handleUpdateRate} disabled={isSavingRate} className="px-6">
                        {isSavingRate ? 'جاري الحفظ...' : t.save}
                      </HoloButton>
                  </div>
              </div>
          </div>
      )}

      {/* History Modal */}
      {historyModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm" onClick={() => setHistoryModalOpen(null)}>
              <div 
                  ref={historyModalRef}
                  style={{'--modal-x': `${historyPosition.x}px`, '--modal-y': `${historyPosition.y}px`, '--modal-width': `${historySize.width}px`, '--modal-height': `${historySize.height}px`} as React.CSSProperties}
                  className={`fixed inset-0 md:inset-auto md:left-[var(--modal-x)] md:top-[var(--modal-y)] md:w-[var(--modal-width)] md:h-[var(--modal-height)] rounded-none md:rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full flex flex-col overflow-hidden border ${isDark ? 'bg-gray-900 border-cyan-500/30' : 'bg-white border-slate-200'}`} 
                  onClick={e => e.stopPropagation()}
              >
                  <div 
                      ref={historyHeaderRef}
                      onMouseDown={handleHistoryDragStart}
                      onTouchStart={handleHistoryDragStart}
                      className={`p-6 border-b flex items-center justify-between cursor-move ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}
                  >
                      <h3 className="text-xl font-bold">{t.exchangeRateLog}: {historyModalOpen}</h3>
                      <button onClick={() => setHistoryModalOpen(null)} className="opacity-70 hover:opacity-100"><X/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-0">
                      <table className="w-full text-sm text-left border-collapse">
                          <thead className={`sticky top-0 z-10 ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-slate-100 text-slate-600'}`}>
                            <tr>
                                <th className="p-4 font-semibold border-b border-opacity-10">{t.date}</th>
                                <th className="p-4 font-semibold text-center border-b border-opacity-10">{t.rate} (1 {localSettings.baseCurrency})</th>
                                <th className="p-4 font-semibold text-center border-b border-opacity-10">{t.change}</th>
                            </tr>
                          </thead>
                          <HistoryModalContent currencyCode={historyModalOpen} />
                      </table>
                  </div>
                   <div className={`p-4 flex justify-end border-t ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                      <HoloButton variant="primary" onClick={() => setHistoryModalOpen(null)} className="px-6">{t.close}</HoloButton>
                   </div>
                   <div 
                      onMouseDown={handleHistoryResizeStart}
                      onTouchStart={handleHistoryResizeStart}
                      className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-20 opacity-50 hover:opacity-100 transition-opacity hidden md:block"
                      title="Resize"
                    >
                      <svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" className={isDark ? 'text-cyan-500' : 'text-slate-400'}>
                        <path d="M16 0V16H0L16 0Z" fill="currentColor"/>
                      </svg>
                    </div>
              </div>
          </div>
      )}

      {/* Add Custom Currency Modal */}
      {isAddCurrencyModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm" onClick={() => setIsAddCurrencyModalOpen(false)}>
              <div 
                  ref={addModalRef}
                  style={{'--modal-x': `${addPosition.x}px`, '--modal-y': `${addPosition.y}px`, '--modal-width': `${addSize.width}px`} as React.CSSProperties}
                  className={`fixed inset-0 md:inset-auto md:left-[var(--modal-x)] md:top-[var(--modal-y)] md:w-[var(--modal-width)] rounded-none md:rounded-2xl shadow-2xl w-full flex flex-col border ${isDark ? 'bg-gray-900 border-cyan-500/30' : 'bg-white border-slate-200'}`} 
                  onClick={e => e.stopPropagation()}
              >
                   <div 
                      ref={addHeaderRef}
                      onMouseDown={handleAddDragStart}
                      className={`p-6 border-b flex items-center justify-between cursor-move ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}
                  >
                      <h3 className="text-xl font-bold flex items-center gap-2"><Coins size={20} /> إضافة عملة جديدة</h3>
                      <button onClick={() => setIsAddCurrencyModalOpen(false)}><X/></button>
                  </div>
                  <div className="p-6 space-y-4">
                       <div>
                           <Label>رمز العملة (Code)</Label>
                           <Input 
                             placeholder="EX: EUR, GBP" 
                             value={newCurrency.code} 
                             onChange={e => setNewCurrency({...newCurrency, code: e.target.value.toUpperCase()})}
                             maxLength={3}
                             className="font-mono uppercase"
                           />
                           <p className="text-xs text-gray-500 mt-1">3 أحرف إنجليزية كبيرة.</p>
                       </div>
                       <div>
                           <Label>الاسم (عربي)</Label>
                           <Input 
                             placeholder="مثال: يورو" 
                             value={newCurrency.nameAr} 
                             onChange={e => setNewCurrency({...newCurrency, nameAr: e.target.value})} 
                           />
                       </div>
                       <div>
                           <Label>الاسم (إنجليزي)</Label>
                           <Input 
                             placeholder="EX: Euro" 
                             value={newCurrency.nameEn} 
                             onChange={e => setNewCurrency({...newCurrency, nameEn: e.target.value})} 
                           />
                       </div>
                  </div>
                  <div className={`p-4 flex justify-end gap-3 border-t mt-auto ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                      <button onClick={() => setIsAddCurrencyModalOpen(false)} className="px-4 py-2 rounded-lg opacity-70">{t.cancel}</button>
                      <HoloButton variant="success" icon={isSavingCurrency ? Loader : Plus} onClick={handleAddCustomCurrency} disabled={isSavingCurrency}>
                          {isSavingCurrency ? 'جاري الحفظ...' : t.add}
                      </HoloButton>
                  </div>
              </div>
          </div>
      )}
    </>
  );
};
