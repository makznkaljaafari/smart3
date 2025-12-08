
import React from 'react';
import { useZustandStore } from '../../../../store/useStore';
import { Product } from '../../../../types';

interface TopStockedListProps {
  items: { id: string; quantity: number; name: string; sku: string }[];
  maxStock: number;
  theme: string;
  t: Record<string, string>;
}

export const TopStockedList: React.FC<TopStockedListProps> = ({ items, maxStock, theme, t }) => {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-4">
        {items.map((item) => (
            <div key={item.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="font-mono font-bold text-cyan-400">{item.quantity}</span>
                </div>
                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div 
                        className="h-2 rounded-full bg-cyan-500 transition-all duration-500" 
                        style={{ width: `${(item.quantity / maxStock) * 100}%` }}
                    />
                </div>
            </div>
        ))}
         {items.length === 0 && <p className="text-center text-gray-500 py-4">{t.noItemsFound}</p>}
    </div>
  );
};
