
import React from 'react';
import { Package } from 'lucide-react';

interface RestockItem {
    id: string;
    name: string;
    sku: string;
    currentQty: number;
    reorderPoint?: number;
}

interface RestockAlertsListProps {
  items: RestockItem[];
  theme: string;
  t: Record<string, string>;
}

export const RestockAlertsList: React.FC<RestockAlertsListProps> = ({ items, theme, t }) => {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-3">
        {items.map((item) => (
            <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border-l-4 border-red-500 ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                <div>
                    <p className="font-bold text-red-400">{item.name}</p>
                    <p className="text-xs text-gray-500">{t.sku}: {item.sku}</p>
                </div>
                <div className="text-right">
                    <div className="text-sm">
                        <span className="text-gray-400">{t.current}: </span>
                        <span className="font-bold text-red-400">{item.currentQty}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                        {t.reorderPoint}: {item.reorderPoint}
                    </div>
                </div>
            </div>
        ))}
        {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-green-500">
                <Package size={32} className="mb-2 opacity-50"/>
                <p>مخزونك في حالة جيدة!</p>
            </div>
        )}
    </div>
  );
};
