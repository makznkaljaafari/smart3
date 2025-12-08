import React from 'react';
import { DashboardCardConfig, DashboardCardColor } from '../../../types';
import { Wallet, AlertCircle, TrendingUp, CreditCard, HeartPulse, Brain } from 'lucide-react';

export const cardMetaData: Record<DashboardCardConfig['id'], { icon: React.ElementType, defaultColor: DashboardCardColor }> = {
    dailyBriefing: { icon: Brain, defaultColor: 'primary' },
    financialHealth: { icon: HeartPulse, defaultColor: 'primary' },
    totalDebts: { icon: Wallet, defaultColor: 'primary' },
    overdueDebts: { icon: AlertCircle, defaultColor: 'orange' },
    totalIncome: { icon: TrendingUp, defaultColor: 'green' },
    totalExpenses: { icon: CreditCard, defaultColor: 'purple' },
};
