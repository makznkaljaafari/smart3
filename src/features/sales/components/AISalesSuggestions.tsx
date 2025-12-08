import React from 'react';
import { Product } from '../../../types';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Sparkles, ShoppingCart } from 'lucide-react';

interface AISalesSuggestionsProps {
    suggestions: Product[];
    onSelect: (product: Product) => void;
    isLoading: boolean;
}

export const AISalesSuggestions: React.FC<AISalesSuggestionsProps> = ({ suggestions, onSelect, isLoading }) => {
    const { theme, lang } = useZustandStore();
    const t = translations[lang];

    if (isLoading) {
        return (
            <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${theme === 'dark' ? 'bg-purple-900/50 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}>
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                <span className="text-sm text-purple-300">{t.generatingSuggestions}...</span>
            </div>
        );
    }
    
    if (suggestions.length === 0) {
        return null;
    }

    return (
        <div className={`mt-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-purple-900/50 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}>
            <h4 className="flex items-center gap-2 font-semibold mb-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                {t.aiSalesSuggestions}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {suggestions.map(product => (
                    <button 
                        key={product.id}
                        onClick={() => onSelect(product)}
                        className={`p-2 rounded-md text-left transition-colors flex items-center gap-2 ${theme === 'dark' ? 'hover:bg-purple-800/60' : 'hover:bg-purple-100'}`}
                    >
                        <ShoppingCart size={16} className="text-purple-400 flex-shrink-0" />
                        <span className="text-sm">{product.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
