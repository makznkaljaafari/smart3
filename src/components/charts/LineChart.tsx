import React from 'react';

interface LineChartProps {
    data: { label: string; value: number }[];
    forecastData?: { label: string; value: number }[];
    height?: number;
    width?: number;
    yAxisLabel?: string;
    xAxisLabel?: string;
    lineColor?: string;
    forecastLineColor?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
    data,
    forecastData = [],
    height = 300,
    width = 600,
    yAxisLabel,
    xAxisLabel,
    lineColor = '#06b6d4', // cyan-500
    forecastLineColor = '#a855f7', // purple-500
}) => {
    const allData = [...data, ...forecastData];
    if (allData.length === 0) return null;

    const maxValue = Math.max(...allData.map(d => d.value), 0) * 1.2 || 1;
    const yPadding = 20;
    const xPadding = 40;

    const pointsToPath = (points: [number, number][]) => {
        return points.map((p, i) => (i === 0 ? 'M' : 'L') + `${p[0]},${p[1]}`).join(' ');
    };

    const dataPoints: [number, number][] = data.map((d, i): [number, number] => [
        xPadding + (i / (allData.length - 1)) * (width - xPadding * 2),
        height - yPadding - (d.value / maxValue) * (height - yPadding * 2)
    ]);

    const forecastPoints: [number, number][] = data.length > 0 ? [
        dataPoints[dataPoints.length - 1]!,
        ...forecastData.map((d, i): [number, number] => [
            xPadding + ((data.length - 1 + i + 1) / (allData.length - 1)) * (width - xPadding * 2),
            height - yPadding - (d.value / maxValue) * (height - yPadding * 2)
        ])
    ] : [];

    const yAxisLabels = [0, maxValue / 2, maxValue];

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Y-axis */}
            {yAxisLabels.map(label => {
                const y = height - yPadding - (label / maxValue) * (height - yPadding * 2);
                return (
                    <g key={label}>
                        <line x1={xPadding} y1={y} x2={width - xPadding} y2={y} stroke="#374151" strokeWidth="0.5" />
                        <text x={xPadding - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{label.toFixed(0)}</text>
                    </g>
                )
            })}
            
            {/* X-axis */}
            {allData.map((d, i) => {
                 const x = xPadding + (i / (allData.length - 1)) * (width - xPadding * 2);
                 return (
                     <text key={i} x={x} y={height - yPadding + 15} textAnchor="middle" fontSize="10" fill="#9ca3af">{d.label}</text>
                 )
            })}
            
            {/* Historical Path */}
            {dataPoints.length > 0 &&
                <path d={pointsToPath(dataPoints)} stroke={lineColor} strokeWidth="2.5" fill="none" />
            }
            
            {/* Forecast Path */}
            {forecastData.length > 0 && forecastPoints.length > 1 &&
                <path d={pointsToPath(forecastPoints)} stroke={forecastLineColor} strokeWidth="2.5" fill="none" strokeDasharray="5,5" />
            }
        </svg>
    );
};