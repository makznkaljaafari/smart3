import React, { useState } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { formatCurrency } from '../../expenses/lib/utils';
import { AppTheme } from '../../../types';


interface BarChartData {
  label: string;
  value: number;
  color: string;
  count?: number;
}

interface BarChartProps {
  data: BarChartData[];
  theme: AppTheme;
}

interface TooltipState {
  visible: boolean;
  content: React.ReactNode;
  x: number;
  y: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, theme }) => {
  const { lang, currency } = useZustandStore(state => ({
    lang: state.lang,
    currency: state.settings.baseCurrency,
  }));
  const t = translations[lang];

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, content: null, x: 0, y: 0 });

  const maxValue = Math.max(...data.map(d => d.value), 0);
  const chartHeight = 250;
  const barWidth = 40;
  const barMargin = 20;
  const svgWidth = data.length * (barWidth + barMargin);
  const textFill = !theme.startsWith('light') ? '#9ca3af' : '#475569';

  const handleMouseMove = (event: React.MouseEvent<SVGRectElement>, item: BarChartData, index: number) => {
    setHoveredIndex(index);
    const content = (
      <div>
        <p className="font-bold">{item.label}</p>
        <p>{formatCurrency(item.value, currency)}</p>
        {item.count !== undefined && <p className="text-xs text-gray-300">{item.count} {t.debtCount}</p>}
      </div>
    );
    setTooltip({ visible: true, content, x: event.clientX + 15, y: event.clientY + 15 });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltip({ ...tooltip, visible: false });
  };

  return (
    <div className="w-full overflow-x-auto relative">
      <svg width="100%" height={chartHeight + 40} viewBox={`0 0 ${svgWidth} ${chartHeight + 40}`}>
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0;
          const x = index * (barWidth + barMargin);
          const isHovered = hoveredIndex === index;
          return (
            <g key={item.label} style={{ cursor: 'pointer' }}>
              <rect
                x={x}
                y={chartHeight - barHeight}
                width={barWidth}
                height={barHeight}
                fill={item.color}
                rx="4"
                onMouseMove={(e) => handleMouseMove(e, item, index)}
                onMouseLeave={handleMouseLeave}
                style={{
                    transition: 'all 0.2s ease-out',
                    filter: isHovered ? 'brightness(1.2)' : 'none',
                    transform: isHovered ? `translateY(-5px)`: 'none',
                    height: isHovered ? barHeight + 5 : barHeight,
                }}
              />
              <text
                x={x + barWidth / 2}
                y={chartHeight - barHeight - 10}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill={item.color}
                className="pointer-events-none"
              >
                {item.value > 0 ? item.value.toLocaleString('en-US') : ''}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartHeight + 20}
                textAnchor="middle"
                fontSize="12"
                fill={textFill}
                 className="pointer-events-none"
              >
                {item.label}
              </text>
            </g>
          );
        })}
        <line x1="0" y1={chartHeight} x2={svgWidth} y2={chartHeight} stroke={!theme.startsWith('light') ? '#4b5563' : '#e2e8f0'} strokeWidth="1"/>
      </svg>
      {tooltip.visible && (
        <div 
          className="fixed p-2 text-sm rounded-lg shadow-lg z-10 pointer-events-none bg-[rgba(var(--bg-secondary-rgb),0.8)] border border-[rgb(var(--border-primary-rgb))] text-[rgb(var(--text-primary-rgb))]"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};
