


import React from 'react';
import { AppTheme } from '../../types';

interface SectionBoxProps {
    title: string | React.ReactNode;
    children: React.ReactNode;
    theme: AppTheme;
}

export const SectionBox: React.FC<SectionBoxProps> = ({ title, children, theme }) => (
  <section className={`p-6 rounded-2xl relative overflow-hidden ${
      !theme.startsWith('light')
        ? 'bg-[rgb(var(--bg-secondary-rgb))] border-t border-[var(--accent-border-50)] border-x-0 border-b-0 border-opacity-50'
        : 'bg-[rgb(var(--bg-secondary-rgb))] border border-[rgb(var(--border-primary-rgb))] shadow-sm'
    }`} aria-label={typeof title === 'string' ? title : 'Section'}>
    <div className={`absolute inset-0 opacity-[0.04] pointer-events-none ${!theme.startsWith('light') ? 'bg-[var(--accent-500)]' : ''}`}></div>
    <div className="relative">
      <h2 className={`text-[rgb(var(--text-primary-rgb))] font-semibold mb-4 text-lg`}>{title}</h2>
      <div className={`text-[rgb(var(--text-secondary-rgb))] text-sm`}>{children}</div>
    </div>
  </section>
);