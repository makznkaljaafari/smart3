
import React, { useState } from 'react';
import { Tooltip } from './Tooltip';

interface HoloButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ElementType;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  children: React.ReactNode;
  tooltip?: string;
}

export const HoloButton: React.FC<HoloButtonProps> = ({ 
  icon: Icon, 
  children, 
  variant = 'primary', 
  className = '', 
  title,
  tooltip,
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Use tooltip prop or fallback to title for the tooltip content
  const tooltipContent = tooltip || title;
  
  const variants = {
    primary: 'bg-cyan-600 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] text-white',
    secondary: 'bg-slate-700 border-slate-500/50 shadow-[0_0_10px_rgba(148,163,184,0.2)] hover:shadow-[0_0_20px_rgba(148,163,184,0.4)] text-slate-100',
    success: 'bg-emerald-600 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] text-white',
    danger: 'bg-red-600 border-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] text-white'
  };

  // Base styles
  const baseStyles = `
    relative overflow-hidden px-5 py-2.5 rounded-xl 
    font-semibold text-sm transition-all duration-300 ease-out
    flex items-center justify-center gap-2
    border border-opacity-50 backdrop-blur-sm
    disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
    active:scale-95 active:shadow-inner
  `;

  const ButtonElement = (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      // Remove native title if we are using custom tooltip
      title={tooltipContent ? undefined : title} 
      {...props}
    >
      {/* Scanline/Glow Effect */}
      <div 
        className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] skew-x-12 transition-transform duration-700 ease-in-out ${isHovered ? 'translate-x-[200%]' : ''}`}
      />
      
      {/* Icon Animation */}
      {Icon && (
        <Icon 
            size={18} 
            className={`transition-transform duration-300 ${isHovered ? 'scale-110 rotate-3' : ''}`} 
        />
      )}
      
      <span className="relative z-10 tracking-wide">{children}</span>
      
      {/* Bottom Highlight for 3D feel */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/20" />
    </button>
  );

  if (tooltipContent) {
    return <Tooltip content={tooltipContent}>{ButtonElement}</Tooltip>;
  }

  return ButtonElement;
};
