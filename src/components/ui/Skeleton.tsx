
import React from 'react';
import { useZustandStore } from '../../store/useStore';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'text', width, height }) => {
  const theme = useZustandStore(state => state.theme);
  const isDark = theme !== 'light';
  
  const baseClass = isDark ? 'bg-gray-800/50' : 'bg-slate-200';
  const animateClass = 'animate-pulse';
  
  let roundedClass = 'rounded';
  if (variant === 'circular') roundedClass = 'rounded-full';
  if (variant === 'rectangular') roundedClass = 'rounded-none';
  if (variant === 'rounded') roundedClass = 'rounded-xl';

  return (
    <div 
      className={`${baseClass} ${animateClass} ${roundedClass} ${className}`} 
      style={{ width, height }}
      role="status"
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
