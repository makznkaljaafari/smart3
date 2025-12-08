
import React from 'react';
import { useZustandStore } from '../../store/useStore';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
    const theme = useZustandStore(state => state.theme);
    const baseClasses = `w-full rounded-lg p-3 border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500`;
    const themeClasses = theme === 'dark' 
        ? 'bg-[rgb(var(--bg-tertiary-rgb))] text-[rgb(var(--text-primary-rgb))] border-[rgb(var(--border-primary-rgb))]' 
        : 'bg-white text-slate-800 border-slate-300';

    return (
        <select
            ref={ref}
            className={`${baseClasses} ${themeClasses} ${className}`}
            {...props}
        >
            {children}
        </select>
    );
});