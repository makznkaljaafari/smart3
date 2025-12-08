
import React from 'react';
import { useZustandStore } from '../../store/useStore';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
    const theme = useZustandStore(state => state.theme);
    const baseClasses = `w-full rounded-lg p-3 border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500`;
    const themeClasses = theme === 'dark' 
        ? 'bg-[rgb(var(--bg-tertiary-rgb))] text-[rgb(var(--text-primary-rgb))] border-[rgb(var(--border-primary-rgb))] placeholder:text-[rgb(var(--text-muted-rgb))]' 
        : 'bg-white text-slate-800 border-slate-300 placeholder:text-slate-400';

    return (
        <textarea
            ref={ref}
            className={`${baseClasses} ${themeClasses} ${className}`}
            {...props}
        />
    );
});