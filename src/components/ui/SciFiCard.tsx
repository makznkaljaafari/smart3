
import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Eye, EyeOff, Activity } from 'lucide-react';
import { AppTheme } from '../../types';

interface SciFiCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    trend?: number;
    color?: 'primary' | 'cyan' | 'purple' | 'green' | 'orange' | 'red' | 'yellow';
    theme: AppTheme;
    inCustomizeMode?: boolean;
    onToggleVisibility?: () => void;
    isVisible?: boolean;
    onClick?: () => void;
}

export const SciFiCard: React.FC<SciFiCardProps> = ({ 
  title, value, icon: Icon, trend, color = 'primary', theme, 
  inCustomizeMode, onToggleVisibility, isVisible, onClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isLight = theme.startsWith('light');

  // Map colors to specific accent gradients/colors
  const getColorStyles = (c: string) => {
      const map: Record<string, { border: string, iconBg: string, glow: string }> = {
          primary: { border: 'border-[var(--accent-border-50)]', iconBg: 'bg-[var(--accent-500)]', glow: 'var(--accent-rgb)' },
          cyan: { border: 'border-cyan-500/50', iconBg: 'bg-cyan-500', glow: '6, 182, 212' },
          purple: { border: 'border-purple-500/50', iconBg: 'bg-purple-500', glow: '168, 85, 247' },
          green: { border: 'border-green-500/50', iconBg: 'bg-green-500', glow: '34, 197, 94' },
          orange: { border: 'border-orange-500/50', iconBg: 'bg-orange-500', glow: '249, 115, 22' },
          red: { border: 'border-red-500/50', iconBg: 'bg-red-500', glow: '239, 68, 68' },
          yellow: { border: 'border-yellow-500/50', iconBg: 'bg-yellow-500', glow: '234, 179, 8' },
      };
      return map[c] || map.primary;
  };

  const styles = getColorStyles(color);

  // Light Theme Logic
  if (isLight) {
    return (
        <div 
          onClick={!inCustomizeMode ? onClick : undefined}
          className={`relative p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm transition-all duration-300 
            ${onClick && !inCustomizeMode ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}
            ${inCustomizeMode && !isVisible ? 'opacity-50 grayscale' : ''}
          `}
        >
            {inCustomizeMode && (
                <div className="absolute inset-0 bg-black/10 rounded-2xl z-10 flex items-center justify-center backdrop-blur-[1px]">
                    <button onClick={(e) => { e.stopPropagation(); onToggleVisibility?.(); }} className="p-2 bg-white rounded-full text-slate-700 shadow-md hover:scale-110 transition-transform">
                        {isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                </div>
            )}
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl text-white shadow-md ${styles.iconBg} bg-opacity-90`}>
                    <Icon size={22} />
                </div>
                {typeof trend === 'number' && (
                  <div 
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span>{Math.abs(trend)}%</span>
                  </div>
                )}
            </div>
            <div>
                <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
                <p className="text-2xl font-bold text-slate-800 tracking-tight font-[family-name:var(--font-mono)]">{value}</p>
            </div>
        </div>
    );
  }

  // Dark Theme Logic (Sci-Fi)
  return (
    <div
      onClick={!inCustomizeMode ? onClick : undefined}
      onMouseEnter={() => !inCustomizeMode && setIsHovered(true)}
      onMouseLeave={() => !inCustomizeMode && setIsHovered(false)}
      className={`
        relative p-5 rounded-2xl 
        bg-[rgba(var(--bg-secondary-rgb),0.6)] 
        backdrop-filter backdrop-blur-xl
        border ${styles.border}
        transition-all duration-500 ease-out
        overflow-hidden group
        ${onClick && !inCustomizeMode ? 'cursor-pointer' : ''}
        ${!isVisible && inCustomizeMode ? 'opacity-40 grayscale' : ''}
      `}
      style={{
        boxShadow: isHovered 
            ? `0 10px 30px -10px rgba(${styles.glow}, 0.4), 0 0 0 1px rgba(${styles.glow}, 0.2) inset` 
            : `0 4px 20px -5px rgba(0,0,0,0.3)`
      }}
    >
        {/* Background Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(0deg,transparent_24%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05)_76%,transparent_77%,transparent)] bg-[length:30px_30px]"></div>
        
        {/* Customize Overlay */}
        {inCustomizeMode && (
            <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center backdrop-blur-sm transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); onToggleVisibility?.(); }} className="p-3 bg-gray-800/80 border border-gray-600 rounded-full text-white hover:bg-gray-700 hover:scale-110 transition-all">
                    {isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
            </div>
        )}

        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${styles.iconBg} bg-opacity-20 border border-white/10 text-[rgba(${styles.glow},1)] shadow-[0_0_15px_rgba(${styles.glow},0.3)]`}>
                    <Icon size={22} />
                </div>
                {typeof trend === 'number' && (
                     <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md border ${trend >= 0 ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                        {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        <span>{Math.abs(trend)}%</span>
                     </div>
                )}
                {/* If no trend, show a subtle activity line */}
                {typeof trend !== 'number' && (
                    <Activity size={20} className="text-gray-700 opacity-50" />
                )}
            </div>
            
            <div>
                <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">{title}</h3>
                <p className="text-2xl font-bold text-white font-[family-name:var(--font-mono)] tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                    {value}
                </p>
            </div>
        </div>

        {/* Hover Effect Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-tr from-[rgba(${styles.glow},0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
    </div>
  );
};
