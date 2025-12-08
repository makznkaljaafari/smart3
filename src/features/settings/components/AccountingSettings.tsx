
import React, { useState, useEffect } from 'react';
import { SectionBox } from '../../../components/ui/SectionBox';
import { SettingsState } from '../../../types';
import { useZustandStore } from '../../../store/useStore';
import { Select } from '../../../components/ui/Select';
import { Label } from '../../../components/ui/Label';
import { Account } from '../../accounting/types';
import { HoloButton } from '../../../components/ui/HoloButton';
import { Sparkles, Loader, Save } from 'lucide-react';
import { accountMappingService, CompanyAccountMap } from '../../../services/accounting/accountMapping';

interface AccountingSettingsProps {
  localSettings: SettingsState;
  setLocalSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  t: Record<string, string>;
  theme: 'light' | 'dark';
  lang: 'ar' | 'en';
}

const AccountSelector: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    accounts: Account[];
    type: Account['type'] | Account['type'][];
}> = ({ label, value, onChange, accounts, type }) => {
    const types = Array.isArray(type) ? type : [type];
    const filteredAccounts = accounts.filter(a => types.includes(a.type) && !a.isPlaceholder);
    return (
        <div>
            <Label>{label}</Label>
            <Select value={value} onChange={e => onChange(e.target.value)}>
                <option value="">-- Select --</option>
                {filteredAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.accountNumber})
                    </option>
                ))}
            </Select>
        </div>
    );
};

export const AccountingSettings: React.FC<AccountingSettingsProps> = ({ localSettings, setLocalSettings, t, theme }) => {
    const { accounts, currentCompany, addToast } = useZustandStore(state => ({ 
        accounts: state.accounts, 
        currentCompany: state.currentCompany,
        addToast: state.addToast
    }));
    const [isAutoMapping, setIsAutoMapping] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Sync localSettings.accounting with the DB state on mount
    useEffect(() => {
        const fetchMapping = async () => {
            if (!currentCompany) return;
            setIsLoading(true);
            const map = await accountMappingService.getCompanyAccountMap(currentCompany.id);
            if (map) {
                setLocalSettings(prev => ({
                    ...prev,
                    accounting: {
                        ...prev.accounting,
                        // Map ALL fields from DB to Settings
                        defaultAccountsReceivableId: map.accountsReceivableId || '',
                        defaultAccountsPayableId: map.accountsPayableId || '',
                        defaultSalesAccountId: map.defaultRevenueAccountId || '',
                        defaultInventoryAccountId: map.inventoryAccountId || '',
                        defaultCogsAccountId: map.cogsAccountId || '',
                        defaultCashSalesAccountId: map.defaultCashSalesAccountId || '',
                        defaultSalariesExpenseId: map.defaultSalariesExpenseId || '',
                        defaultSalariesPayableId: map.defaultSalariesPayableId || '',
                        defaultGeneralExpenseAccountId: map.defaultGeneralExpenseAccountId || '',
                        defaultInventoryAdjustmentAccountId: map.defaultInventoryAdjustmentAccountId || '',
                        // Added missing fields
                        cashAccountId: map.cashAccountId || '',
                        bankAccountId: map.bankAccountId || '',
                        defaultExpenseAccountId: map.defaultExpenseAccountId || '',
                        taxPayableAccountId: map.taxPayableAccountId || '',
                    } as any // temporary cast to any if type definition is lagging
                }));
            }
            setIsLoading(false);
        };
        fetchMapping();
    }, [currentCompany, setLocalSettings]);

    const handleChange = (field: string, value: string) => {
        setLocalSettings(prev => ({
            ...prev,
            accounting: {
                ...prev.accounting,
                [field]: value
            }
        }));
    };

    const handleSaveToDB = async () => {
        if (!currentCompany) return;
        setIsSaving(true);
        
        const mapping: CompanyAccountMap = {
            accountsReceivableId: localSettings.accounting.defaultAccountsReceivableId,
            accountsPayableId: localSettings.accounting.defaultAccountsPayableId,
            defaultRevenueAccountId: localSettings.accounting.defaultSalesAccountId,
            inventoryAccountId: localSettings.accounting.defaultInventoryAccountId,
            cogsAccountId: localSettings.accounting.defaultCogsAccountId,
            defaultCashSalesAccountId: localSettings.accounting.defaultCashSalesAccountId,
            defaultSalariesExpenseId: localSettings.accounting.defaultSalariesExpenseId,
            defaultSalariesPayableId: localSettings.accounting.defaultSalariesPayableId,
            defaultGeneralExpenseAccountId: localSettings.accounting.defaultGeneralExpenseAccountId,
            defaultInventoryAdjustmentAccountId: localSettings.accounting.defaultInventoryAdjustmentAccountId,
            // Added missing fields to save
            cashAccountId: (localSettings.accounting as any).cashAccountId,
            bankAccountId: (localSettings.accounting as any).bankAccountId,
            defaultExpenseAccountId: (localSettings.accounting as any).defaultExpenseAccountId,
            taxPayableAccountId: (localSettings.accounting as any).taxPayableAccountId,
        };

        const { error } = await accountMappingService.updateCompanyAccountMap(currentCompany.id, mapping);
        
        if (error) {
            addToast({ message: `Failed to save accounting settings: ${error.message}`, type: 'error' });
        } else {
            addToast({ message: 'Accounting settings saved to database.', type: 'success' });
        }
        setIsSaving(false);
    };

    const handleAutoMap = () => {
        setIsAutoMapping(true);
        setTimeout(() => {
            const findId = (namePart: string) => accounts.find(a => a.name.toLowerCase().includes(namePart.toLowerCase()) && !a.isPlaceholder)?.id || '';
            
            const newMappings = {
                ...localSettings.accounting,
                defaultAccountsReceivableId: findId('Receivable') || findId('الذمم المدينة') || localSettings.accounting.defaultAccountsReceivableId,
                defaultAccountsPayableId: findId('Payable') || findId('الذمم الدائنة') || localSettings.accounting.defaultAccountsPayableId,
                defaultSalesAccountId: findId('Sales Revenue') || findId('إيرادات المبيعات') || localSettings.accounting.defaultSalesAccountId,
                defaultInventoryAccountId: findId('Inventory Asset') || findId('مخزون') || localSettings.accounting.defaultInventoryAccountId,
                defaultCogsAccountId: findId('Cost of Goods') || findId('تكلفة البضاعة') || localSettings.accounting.defaultCogsAccountId,
                defaultCashSalesAccountId: findId('Cash') || findId('نقد') || localSettings.accounting.defaultCashSalesAccountId,
                defaultSalariesExpenseId: findId('Salaries Expense') || findId('رواتب') || localSettings.accounting.defaultSalariesExpenseId,
                defaultSalariesPayableId: findId('Salaries Payable') || findId('رواتب مستحقة') || localSettings.accounting.defaultSalariesPayableId,
                defaultGeneralExpenseAccountId: findId('General') || findId('عامة') || localSettings.accounting.defaultGeneralExpenseAccountId,
                defaultInventoryAdjustmentAccountId: findId('Inventory Adjustment') || findId('تسوية') || localSettings.accounting.defaultInventoryAdjustmentAccountId,
                taxPayableAccountId: findId('Tax') || findId('ضريبة') || '',
            };

            setLocalSettings(prev => ({ ...prev, accounting: newMappings }));
            setIsAutoMapping(false);
            addToast({ message: 'Auto-mapped accounts based on names.', type: 'info' });
        }, 500);
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader className="animate-spin text-cyan-400" /></div>;
    }

    return (
        <SectionBox title={t.accountingDefaults} theme={theme}>
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                <p className={`text-xs max-w-md ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                    {t.accountingDefaultsDescription}
                    <br/>
                    <span className="text-orange-400 font-semibold">مهم:</span> تأكد من حفظ الإعدادات هنا لضمان عمل الفواتير والقيود الآلية بشكل صحيح.
                </p>
                <div className="flex gap-2">
                    <HoloButton variant="secondary" onClick={handleAutoMap} disabled={isAutoMapping} className="!text-xs !py-1.5">
                        {isAutoMapping ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {isAutoMapping ? 'جاري الربط...' : 'ربط تلقائي'}
                    </HoloButton>
                    <HoloButton variant="primary" onClick={handleSaveToDB} disabled={isSaving} className="!text-xs !py-1.5">
                        {isSaving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                        حفظ في النظام
                    </HoloButton>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <h4 className={`col-span-full text-sm font-bold border-b pb-2 mt-2 ${theme === 'dark' ? 'border-gray-700 text-cyan-400' : 'border-slate-200 text-cyan-700'}`}>حسابات الفواتير والديون</h4>
                <AccountSelector
                    label={t.defaultAccountsReceivableId}
                    value={localSettings.accounting.defaultAccountsReceivableId}
                    onChange={value => handleChange('defaultAccountsReceivableId', value)}
                    accounts={accounts}
                    type="asset"
                />
                 <AccountSelector
                    label={t.defaultAccountsPayableId}
                    value={localSettings.accounting.defaultAccountsPayableId}
                    onChange={value => handleChange('defaultAccountsPayableId', value)}
                    accounts={accounts}
                    type="liability"
                />
                
                <h4 className={`col-span-full text-sm font-bold border-b pb-2 mt-2 ${theme === 'dark' ? 'border-gray-700 text-green-400' : 'border-slate-200 text-green-700'}`}>حسابات المبيعات والمخزون</h4>
                 <AccountSelector
                    label={t.defaultSalesAccountId}
                    value={localSettings.accounting.defaultSalesAccountId}
                    onChange={value => handleChange('defaultSalesAccountId', value)}
                    accounts={accounts}
                    type="revenue"
                />
                 <AccountSelector
                    label={t.defaultCashSalesAccountId}
                    value={localSettings.accounting.defaultCashSalesAccountId}
                    onChange={value => handleChange('defaultCashSalesAccountId', value)}
                    accounts={accounts}
                    type={['revenue', 'asset']}
                />
                 <AccountSelector
                    label={t.defaultInventoryAccountId}
                    value={localSettings.accounting.defaultInventoryAccountId}
                    onChange={value => handleChange('defaultInventoryAccountId', value)}
                    accounts={accounts}
                    type="asset"
                />
                <AccountSelector
                    label={t.defaultCogsAccountId}
                    value={localSettings.accounting.defaultCogsAccountId}
                    onChange={value => handleChange('defaultCogsAccountId', value)}
                    accounts={accounts}
                    type="expense"
                />

                <h4 className={`col-span-full text-sm font-bold border-b pb-2 mt-2 ${theme === 'dark' ? 'border-gray-700 text-orange-400' : 'border-slate-200 text-orange-700'}`}>حسابات المصروفات والضرائب</h4>
                <AccountSelector
                    label={t.defaultGeneralExpenseAccountId}
                    value={localSettings.accounting.defaultGeneralExpenseAccountId}
                    onChange={value => handleChange('defaultGeneralExpenseAccountId', value)}
                    accounts={accounts}
                    type="expense"
                />
                 <AccountSelector
                    label="حساب الضريبة المستحقة (Tax Payable)"
                    value={(localSettings.accounting as any).taxPayableAccountId}
                    onChange={value => handleChange('taxPayableAccountId', value)}
                    accounts={accounts}
                    type="liability"
                />
                <AccountSelector
                    label={t.defaultSalariesExpenseId}
                    value={localSettings.accounting.defaultSalariesExpenseId}
                    onChange={value => handleChange('defaultSalariesExpenseId', value)}
                    accounts={accounts}
                    type="expense"
                />
                <AccountSelector
                    label={t.defaultSalariesPayableId}
                    value={localSettings.accounting.defaultSalariesPayableId}
                    onChange={value => handleChange('defaultSalariesPayableId', value)}
                    accounts={accounts}
                    type="liability"
                />
                <AccountSelector
                    label="حساب تسوية المخزون (Inventory Adjustment)"
                    value={localSettings.accounting.defaultInventoryAdjustmentAccountId}
                    onChange={value => handleChange('defaultInventoryAdjustmentAccountId', value)}
                    accounts={accounts}
                    type={['expense', 'revenue']}
                />
            </div>
        </SectionBox>
    );
};
