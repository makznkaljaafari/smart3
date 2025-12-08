import React from 'react';
import { HoloButton } from '../ui/HoloButton';
import { X } from 'lucide-react';
import { useZustandStore } from '../../store/useStore';

interface Action {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    variant: 'primary' | 'secondary' | 'success' | 'danger';
    disabled?: boolean;
}

interface BulkActionBarProps {
    count: number;
    actions: Action[];
    onClear: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({ count, actions, onClear }) => {
    const { theme, lang } = useZustandStore();
    const isVisible = count > 0;
    
    return (
        <div className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className={`mx-auto mb-4 max-w-fit rounded-2xl p-3 flex items-center gap-4 shadow-2xl ${theme === 'dark' ? 'bg-gray-800/80 backdrop-blur-md border border-cyan-500/30' : 'bg-white/80 backdrop-blur-md border'}`}>
                <div className="flex items-center gap-2">
                    <span className="bg-cyan-500 text-white font-bold text-sm rounded-full w-6 h-6 flex items-center justify-center">{count}</span>
                    <span className="font-semibold">{lang === 'ar' ? 'عناصر محددة' : 'items selected'}</span>
                </div>
                <div className="h-6 w-px bg-gray-600"></div>
                <div className="flex items-center gap-2">
                    {actions.map(action => (
                        <HoloButton key={action.label} icon={action.icon} variant={action.variant} onClick={action.onClick} disabled={action.disabled} className="!py-2 !px-3 !text-sm">
                            {action.label}
                        </HoloButton>
                    ))}
                </div>
                <button onClick={onClear} className="p-2 rounded-full hover:bg-gray-700">
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};
