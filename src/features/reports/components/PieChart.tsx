import React, { useState } from 'react';
import { formatCurrency } from '../../expenses/lib/utils';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  theme: 'light' | 'dark';
}

interface TooltipState {
  visible: boolean;
  content: string;
  x: number;
  y: number;
}

export const PieChart: React.FC<PieChartProps> = ({ data, size = 300, theme }) => {
  const { settings, lang } = useZustandStore(state => ({ settings: state.settings, lang: state.lang }));
  const currency = settings.baseCurrency;
  const t = translations[lang];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, content: '', x: 0, y: 0 });

  const total = data.reduce((acc, item) => acc + item.value, 0);
  if (total === 0) return null;

  const handleMouseMove = (event: React.MouseEvent<SVGPathElement>, item: PieChartData, index: number) => {
    setHoveredIndex(index);
    const percentage = ((item.value / total) * 100).toFixed(1);
    setTooltip({
      visible: true,
      content: `${item.label}: ${formatCurrency(item.value, currency)} (${percentage}%)`,
      x: event.clientX + 15,
      y: event.clientY + 15,
    });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltip({ ...tooltip, visible: false });
  };

  let cumulativePercent = 0;
  const outerRadius = size / 2 - 10;
  const innerRadius = outerRadius * 0.6;
  const center = size / 2;

  const getCoords = (p: number, r: number) => {
    const angle = 2 * Math.PI * p - Math.PI / 2; // Subtract PI/2 to start from top
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return [x, y];
  }

  const slices = data.map((item, index) => {
    const percent = item.value / total;
    
    const [outerStartX, outerStartY] = getCoords(cumulativePercent, outerRadius);
    const [innerStartX, innerStartY] = getCoords(cumulativePercent, innerRadius);
    
    cumulativePercent += percent;
    
    const [outerEndX, outerEndY] = getCoords(cumulativePercent, outerRadius);
    const [innerEndX, innerEndY] = getCoords(cumulativePercent, innerRadius);

    const largeArcFlag = percent > 0.5 ? 1 : 0;

    const pathData = [
        `M ${outerStartX} ${outerStartY}`, // Move to outer start
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}`, // Outer arc
        `L ${innerEndX} ${innerEndY}`, // Line to inner end
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`, // Inner arc (reverse)
        'Z' // Close path
    ].join(' ');

    const isHovered = hoveredIndex === index;
    const transform = isHovered ? `scale(1.03)` : `scale(1)`;

    return (
        <path 
            key={index} 
            d={pathData} 
            fill={item.color} 
            onMouseMove={(e) => handleMouseMove(e, item, index)}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: transform,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out',
                filter: isHovered ? `brightness(1.15)` : 'brightness(1)',
                cursor: 'pointer'
            }}
        />
    );
  });

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 relative">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {slices}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>{t.total || 'Total'}</span>
            <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {formatCurrency(total, currency)}
            </span>
        </div>
      </div>
      
      {tooltip.visible && (
        <div 
          className="fixed p-2 text-sm rounded-lg shadow-lg z-10 pointer-events-none bg-[rgba(var(--bg-secondary-rgb),0.8)] border border-[rgb(var(--border-primary-rgb))] text-[rgb(var(--text-primary-rgb))]"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          {tooltip.content}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className={`text-sm text-[rgb(var(--text-secondary-rgb))]`}>{item.label}</span>
            <span className={`text-xs font-mono ml-auto text-[rgb(var(--text-muted-rgb))]`}>({((item.value / total) * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};
