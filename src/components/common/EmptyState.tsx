
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { HoloButton } from '../ui/HoloButton';
import { useZustandStore } from '../../store/useStore';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
    variant?: 'default' | 'error';
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
    icon: Icon, 
    title, 
    description, 
    actionLabel, 
    onAction, 
    className,
    variant = 'default'
}) => {
    const theme = useZustandStore(state => state.theme);
    const isDark = theme !== 'light';
    const isError = variant === 'error';

    const containerClasses = isError
        ? (isDark ? 'border-red-500/30 bg-red-900/10' : 'border-red-200 bg-red-50')
        : (isDark ? 'border-gray-700 bg-gray-900/20' : 'border-slate-300 bg-slate-50/50');

    const iconBgClasses = isError
        ? (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-500')
        : (isDark ? 'bg-gray-800 text-gray-500' : 'bg-slate-200 text-slate-400');

    const titleClasses = isError
        ? (isDark ? 'text-red-300' : 'text-red-700')
        : (isDark ? 'text-white' : 'text-slate-900');

    const descClasses = isError
        ? (isDark ? 'text-red-400/80' : 'text-red-600/80')
        : (isDark ? 'text-gray-400' : 'text-slate-500');

    return (
        <div className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed transition-all animate-in fade-in zoom-in-95 duration-300 ${containerClasses} ${className}`}>
            <div className={`p-4 rounded-full mb-4 ${iconBgClasses}`}>
                <Icon size={48} strokeWidth={1.5} />
            </div>
            
            <h3 className={`text-lg font-bold mb-2 ${titleClasses}`}>
                {title}
            </h3>
            
            <p className={`text-sm max-w-md mb-6 ${descClasses}`}>
                {description}
            </p>

            {actionLabel && onAction && (
                <HoloButton variant={isError ? "danger" : "primary"} onClick={onAction}>
                    {actionLabel}
                </HoloButton>
            )}
        </div>
    );
};
