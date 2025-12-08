
import React from 'react';
import { useZustandStore } from '../../store/useStore';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label: React.FC<LabelProps> = ({ children, className, ...props }) => {
    const theme = useZustandStore(state => state.theme);
    const labelClasses = `block text-sm mb-2 ${theme === 'dark' ? 'text-[rgb(var(--text-secondary-rgb))]' : 'text-slate-700'}`;
    
    return (
        <label className={`${labelClasses} ${className}`} {...props}>
            {children}
        </label>
    );
};