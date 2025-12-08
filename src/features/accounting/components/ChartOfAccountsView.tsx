
import React, { useState } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Account, Toast } from '../../../types';
import { HoloButton } from '../../../components/ui/HoloButton';
import { Plus, Edit, ServerCrash, BookCopy } from 'lucide-react';
import { AccountFormModal } from './AccountFormModal';
import { useAccountData } from '../hooks/useAccountData';
import { LoadingState } from '../../../components/common/LoadingState';
import { EmptyState } from '../../../components/common/EmptyState';
import { AppTheme } from '../../../types';

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
};

interface AccountRowProps {
  account: Account;
  level: number;
  theme: AppTheme;
  onEdit: (account: Account) => void;
  t: Record<string, string>;
}

const AccountRow: React.FC<AccountRowProps> = ({ account, level, theme, onEdit, t }) => {
  const indentStyle = { paddingRight: `${level * 2}rem` }; // For RTL
  const isParent = account.isPlaceholder;
  const isDark = theme.startsWith('dark');

  const rowClasses = isDark 
    ? `border-gray-700 ${isParent ? 'bg-gray-800/50' : 'hover:bg-gray-800'}`
    : `border-slate-200 ${isParent ? 'bg-slate-100' : 'hover:bg-slate-50'}`;
  
  const nameTextClasses = `${isParent ? 'font-bold' : ''} ${isDark ? (isParent ? 'text-white' : 'text-slate-300') : (isParent ? 'text-slate-900' : 'text-slate-700')}`;
  const balanceTextClasses = `${isParent ? 'font-bold' : ''} ${isDark ? 'text-gray-200' : 'text-slate-800'}`;

  const accountTypeLabels = {
    asset: 'أصل',
    liability: 'خصم',
    equity: 'حقوق ملكية',
    revenue: 'إيراد',
    expense: 'مصروف',
  };

  return (
    <tr className={`border-b ${rowClasses}`}>
      <td className="p-3" style={indentStyle} data-label={t.accountName}>
        <div className="flex items-center gap-2">
            <span className={`font-mono text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{account.accountNumber}</span>
            <span className={nameTextClasses}>{account.name}</span>
        </div>
      </td>
      <td className={`p-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`} data-label={t.accountType}>{accountTypeLabels[account.type]}</td>
      <td className={`p-3 text-right font-mono ${balanceTextClasses}`} data-label={t.balance}>{formatCurrency(account.balance, account.currency)}</td>
      <td className="p-3 text-center" data-label={t.actions}>
        <button onClick={() => onEdit(account)} className="p-2 hover:bg-gray-700 rounded-lg text-slate-400"><Edit size={16}/></button>
      </td>
    </tr>
  );
};

export const ChartOfAccountsView: React.FC = () => {
    const { theme, lang } = useZustandStore(state => ({ theme: state.theme, lang: state.lang }));
    const addToastAction = useZustandStore(state => state.addToast);
    const t = translations[lang];

    const { accounts, isLoading, error, saveAccount, isSeeding, seedAccounts } = useAccountData();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    
    const addToast = (message: string, type: Toast['type'] = 'info') => {
        addToastAction({ message, type });
    };

    const handleEdit = (account: Account) => {
        setEditingAccount(account);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setEditingAccount(null);
        setIsFormOpen(true);
    };

    const handleSave = async (accountData: Partial<Account>) => {
      try {
        await saveAccount(accountData);
        setIsFormOpen(false);
      } catch (e) {
        // Error toast is handled by the hook
        console.error("Failed to save account:", e);
      }
    };

    const renderAccounts = (parentId: string | null = null, level = 0): React.ReactNode[] => {
        return accounts
            .filter(a => a.parentId === parentId)
            .sort((a, b) => a.accountNumber.localeCompare(b.accountNumber))
            .flatMap(account => [
                <AccountRow key={account.id} account={account} level={level} theme={theme} onEdit={handleEdit} t={t} />,
                ...renderAccounts(account.id, level + 1)
            ]);
    };

    const renderContent = () => {
        if (isLoading) {
            return <LoadingState />;
        }
        if (error) {
            return <EmptyState icon={ServerCrash} title="Error" description={`Error loading accounts: ${error}`} variant="error" />;
        }
        if (accounts.length === 0) {
            return (
                <EmptyState 
                    icon={BookCopy} 
                    title="شجرة الحسابات فارغة" 
                    description="يمكنك إضافة الحسابات يدويًا أو البدء بمجموعة من الحسابات الافتراضية."
                    actionLabel={isSeeding ? 'جاري الإنشاء...' : 'إضافة الحسابات الافتراضية'}
                    onAction={seedAccounts}
                />
            );
        }
        return (
            <table className="w-full text-sm responsive-table">
                <thead className={`${theme.startsWith('dark') ? 'bg-gray-800 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                    <tr className="text-right ">
                        <th className="p-3 font-semibold text-right">{t.accountName}</th>
                        <th className="p-3 font-semibold text-right">{t.accountType}</th>
                        <th className="p-3 font-semibold text-right">{t.balance}</th>
                        <th className="p-3 font-semibold text-center">{t.actions}</th>
                    </tr>
                </thead>
                <tbody>
                    {renderAccounts()}
                </tbody>
            </table>
        );
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <HoloButton icon={Plus} onClick={handleAdd}>{t.addAccount}</HoloButton>
            </div>
            <div className={`rounded-xl border overflow-x-auto ${theme.startsWith('dark') ? 'border-gray-700' : 'border-slate-200'}`}>
                {renderContent()}
            </div>
            {isFormOpen && (
                <AccountFormModal
                    accountToEdit={editingAccount}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};
