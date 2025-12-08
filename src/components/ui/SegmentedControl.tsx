import React from 'react';
import { AppTheme } from '../../types';

interface SegmentedControlProps<T extends string> {
  options: { label: string; value: T; icon?: React.ElementType }[];
  value: T;
  onChange: (value: T) => void;
  theme: AppTheme;
}

export const SegmentedControl = <T extends string>({ options, value, onChange, theme }: SegmentedControlProps<T>) => {
  const isLightTheme = theme.startsWith('light');
  const baseClasses = `relative flex-1 px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none z-10`;
  const activeClasses = isLightTheme ? 'text-cyan-800' : 'text-white';
  const inactiveClasses = isLightTheme ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white';
  
  const activeOptionIndex = options.findIndex(opt => opt.value === value);

  return (
    <div className={`relative flex w-full p-1 rounded-lg ${isLightTheme ? 'bg-slate-200' : 'bg-[rgb(var(--bg-tertiary-rgb))]'}`}>
       <div 
        className={`absolute top-1 bottom-1 rounded-md transition-all duration-300 ease-in-out ${isLightTheme ? 'bg-white shadow-sm' : 'bg-[rgb(var(--bg-interactive-rgb))]'}`}
        style={{
          width: `calc(${100 / options.length}% - 4px)`,
          transform: `translateX(calc(${activeOptionIndex * 100}% + 2px))`
        }}
      />
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`${baseClasses} ${value === opt.value ? activeClasses : inactiveClasses}`}
        >
          <div className="flex items-center justify-center gap-2">
            {opt.icon && <opt.icon size={16} />}
            <span>{opt.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
};
