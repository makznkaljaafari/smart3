import React from 'react';
import { HoloButton } from '../../../components/ui/HoloButton';
import { Plus, Users, CreditCard, Edit, Save, X } from 'lucide-react';
import { useZustandStore } from '../../../store/useStore';

interface DashboardHeaderProps {
  t: Record<string, string>;
  customizeMode: boolean;
  onCustomize: () => void;
  onCancel: () => void;
  onSaveLayout: () => void;
  onAddDebt: () => void;
  onAddCustomer: () => void;
  onAddExpense: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  t,
  customizeMode,
  onCustomize,
  onCancel,
  onSaveLayout,
  onAddDebt,
  onAddCustomer,
  onAddExpense,
}) => {
  const { userRole } = useZustandStore(s => ({ userRole: s.userRole }));
  const canManageGeneral = userRole === 'owner' || userRole === 'admin' || userRole === 'manager';
  
  return (
    <div className="flex justify-between items-center flex-wrap gap-4">
      <div className="flex flex-wrap gap-3" data-tour-id="dashboard-actions">
        {canManageGeneral && <HoloButton icon={Plus} variant="primary" onClick={onAddDebt}>{t.addDebt}</HoloButton>}
        {canManageGeneral && <HoloButton icon={Users} variant="secondary" onClick={onAddCustomer}>{t.addCustomer}</HoloButton>}
        <HoloButton icon={CreditCard} variant="success" onClick={onAddExpense}>{t.addExpense}</HoloButton>
      </div>
      <div className="flex gap-3">
        {customizeMode ? (
          <>
            <HoloButton icon={X} variant="secondary" onClick={onCancel}>{t.cancel}</HoloButton>
            <HoloButton icon={Save} variant="success" onClick={onSaveLayout}>{t.saveLayout}</HoloButton>
          </>
        ) : (
          <HoloButton icon={Edit} variant="primary" onClick={onCustomize}>{t.customize}</HoloButton>
        )}
      </div>
    </div>
  );
};