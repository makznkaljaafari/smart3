import React from 'react';
import { useZustandStore } from '../../store/useStore';
import { Label } from './Label';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ElementType;
    iconPosition?: 'left' | 'right';
    label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, icon: Icon, iconPosition = 'left', label, ...props }, ref) => {
    const theme = useZustandStore(state => state.theme);
    const baseClasses = `w-full rounded-lg border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500`;
    const themeClasses = theme === 'dark' 
        ? 'bg-[rgb(var(--bg-tertiary-rgb))] text-[rgb(var(--text-primary-rgb))] border-[rgb(var(--border-primary-rgb))] placeholder:[rgb(var(--text-muted-rgb))] disabled:opacity-50' 
        : 'bg-white text-slate-800 border-slate-300 placeholder:text-slate-400 disabled:bg-slate-100';
    
    const paddingClasses = Icon ? (iconPosition === 'left' ? 'pl-10 pr-3' : 'pr-10 pl-3') : 'px-3';
    const finalPadding = props.size ? '' : 'py-3'; // Use default padding if size is not specified

    const inputElement = (
        <div className="relative w-full">
            {Icon && (
                <div className={`absolute top-1/2 -translate-y-1/2 ${iconPosition === 'left' ? 'left-3' : 'right-3'} text-[rgb(var(--text-muted-rgb))] pointer-events-none`}>
                    <Icon size={20} />
                </div>
            )}
            <input
                ref={ref}
                className={`${baseClasses} ${themeClasses} ${paddingClasses} ${finalPadding} ${className}`}
                {...props}
            />
        </div>
    );
    
    if (label) {
        return (
            <div>
                <Label>{label}</Label>
                {inputElement}
            </div>
        );
    }

    return inputElement;
});