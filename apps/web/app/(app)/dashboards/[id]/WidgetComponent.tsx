// @ts-nocheck
"use client";

import { useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell, Label, LabelList
} from "recharts";
import { Loader2, AlertCircle } from "lucide-react";

interface WidgetComponentProps {
  widget: any;
  data: any[];
  isLoading: boolean;
  error?: string;
}

// Professional, highly curated color palette (Tailwind: Indigo, Rose, Emerald, Amber, Sky, Fuchsia)
const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#0ea5e9', '#d946ef'];

export default function WidgetComponent({ widget, data, isLoading, error }: WidgetComponentProps) {
  
  const content = useMemo(() => {
    if (isLoading && !data?.length) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col h-full w-full items-center justify-center text-red-500 p-4 text-center">
          <AlertCircle className="h-6 w-6 mb-2" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex h-full w-full items-center justify-center text-zinc-400">
          <span className="text-sm">No data available</span>
        </div>
      );
    }

    const type = widget.widgetType;
    const config = widget.visualizationConfig || {};

    // Auto-detect keys if not configured
    const keys = Object.keys(data[0]);
    const xAxisKey = config.xAxisKey || keys[0];
    // Filter out xAxisKey to find potential data series keys
    const potentialYKeys = keys.filter(k => k !== xAxisKey);
    const yAxisKeys = config.yAxisKeys?.length ? config.yAxisKeys : (potentialYKeys.length ? [potentialYKeys[0]] : [keys[0]]);

    if (type === 'stat') {
      const statValue = data[0][yAxisKeys[0]] || data[0][keys[0]];
      return (
        <div className="flex flex-col h-full w-full items-center justify-center">
          <span className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {typeof statValue === 'number' ? statValue.toLocaleString() : statValue}
          </span>
          {config.statLabel && (
            <span className="text-sm text-zinc-500 mt-2 font-medium uppercase tracking-wider">{config.statLabel}</span>
          )}
        </div>
      );
    }

    if (type === 'table') {
      return (
        <div className="h-full w-full overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 sticky top-0 uppercase tracking-wider font-semibold">
              <tr>
                {keys.map((key) => (
                  <th key={key} className="px-4 py-3">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  {keys.map((key) => (
                    <td key={key} className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {String(row[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Charting components
    const ChartWrapper = ({ children }: { children: React.ReactNode }) => (
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        {children as any}
      </ResponsiveContainer>
    );

    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 10, bottom: 20 },
    };

    const xAxisProps = {
      dataKey: xAxisKey,
      tick: { fontSize: 12, fill: '#888' },
      axisLine: false,
      tickLine: false,
      tickMargin: 12,
      padding: { left: 20, right: 20 }
    };

    const yAxisProps = {
      tick: { fontSize: 12, fill: '#888' },
      axisLine: false,
      tickLine: false,
      tickMargin: 8,
      allowDecimals: false
    };

    const Gradients = () => (
      <defs>
        {COLORS.map((color, idx) => (
          <linearGradient key={`color-${idx}`} id={`color-${idx}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
          </linearGradient>
        ))}
      </defs>
    );

    switch (type) {
      case 'line':
        return (
          <ChartWrapper>
            <LineChart {...commonProps}>
              <Gradients />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" strokeOpacity={0.15} />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <RechartsTooltip cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', backdropFilter: 'blur(4px)' }} itemStyle={{ color: '#fff', fontWeight: 500 }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
              {yAxisKeys.map((key: string, idx: number) => (
                <Line key={key} type="monotone" dataKey={key} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }} animationDuration={1200} />
              ))}
            </LineChart>
          </ChartWrapper>
        );
      case 'bar':
        return (
          <ChartWrapper>
            <BarChart {...commonProps}>
              <Gradients />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" strokeOpacity={0.15} />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <RechartsTooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', backdropFilter: 'blur(4px)' }} itemStyle={{ color: '#fff', fontWeight: 500 }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
              {yAxisKeys.map((key: string, idx: number) => (
                <Bar key={key} dataKey={key} fill={`url(#color-${idx % COLORS.length})`} radius={[6, 6, 0, 0]} maxBarSize={60} animationDuration={1200}>
                   <LabelList dataKey={key} position="top" fill="#888" fontSize={11} offset={8} />
                </Bar>
              ))}
            </BarChart>
          </ChartWrapper>
        );
      case 'area':
        return (
          <ChartWrapper>
            <AreaChart {...commonProps}>
              <Gradients />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" strokeOpacity={0.15} />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <RechartsTooltip cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', backdropFilter: 'blur(4px)' }} itemStyle={{ color: '#fff', fontWeight: 500 }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
              {yAxisKeys.map((key: string, idx: number) => (
                <Area key={key} type="monotone" dataKey={key} stroke={COLORS[idx % COLORS.length]} fill={`url(#color-${idx % COLORS.length})`} strokeWidth={3} dot={{ r: 3, fill: '#fff' }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} animationDuration={1200} />
              ))}
            </AreaChart>
          </ChartWrapper>
        );
      case 'pie':
        const nameKey = xAxisKey;
        const dataKey = yAxisKeys[0];
        
        // Calculate total for center label
        const total = data.reduce((acc, curr) => {
          const val = Number(curr[dataKey]);
          return acc + (isNaN(val) ? 1 : val);
        }, 0);

        return (
          <ChartWrapper>
            <PieChart>
              <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', backdropFilter: 'blur(4px)' }} itemStyle={{ color: '#fff', fontWeight: 500 }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" />
              <Pie
                data={data.map(d => {
                  const val = Number(d[dataKey]);
                  return { ...d, [dataKey]: isNaN(val) ? 1 : val };
                })}
                dataKey={dataKey}
                nameKey={nameKey}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={3}
                animationDuration={1200}
                stroke="none"
              >
                <Label 
                  value={total.toLocaleString()} 
                  position="center" 
                  fill="#3f3f46"
                  style={{ fontSize: '32px', fontWeight: 'bold' }}
                />
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartWrapper>
        );
        return (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            <span className="text-sm">Unsupported widget type: {type}</span>
          </div>
        );
    }
  }, [widget, data, isLoading, error]);

  return (
    <div className="w-full h-full">
      {content}
    </div>
  );
}
