import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
}) => {
  return (
    <div className="bg-[rgb(var(--bg-secondary-rgb))] rounded-xl shadow-sm border border-[rgb(var(--border-primary-rgb))] p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconBg} ${iconColor} p-3 rounded-lg`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <p className="text-[rgb(var(--text-secondary-rgb))] text-sm mb-1">{title}</p>
        <p className="text-2xl font-bold text-[rgb(var(--text-primary-rgb))]">{value}</p>
      </div>
    </div>
  );
};