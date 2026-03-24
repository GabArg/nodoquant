"use client";

import { useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import type { ComparisonStrategy } from "@/hooks/useComparison";

interface ComparisonChartProps {
    strategies: ComparisonStrategy[];
}

export default function ComparisonChart({ strategies }: ComparisonChartProps) {
    const chartData = useMemo(() => {
        if (strategies.length === 0) return [];

        // Normalize each strategy to 100 points
        const points = 101;
        const normalizedData = Array.from({ length: points }, (_, i) => {
            const entry: any = { percentage: i };
            
            strategies.forEach((strat, sIdx) => {
                const curve = strat.fullMetrics.equityCurve as any[];
                if (!curve || !curve.length) return;
                
                // Linear interpolation to find the value at percentage i
                const exactIdx = (i / (points - 1)) * (curve.length - 1);
                const low = Math.floor(exactIdx);
                const high = Math.min(Math.ceil(exactIdx), curve.length - 1);
                const alpha = exactIdx - low;
                
                const val = (1 - alpha) * (curve[low]?.equity ?? 0) + alpha * (curve[high]?.equity ?? 0);
                entry[`strategy_${sIdx}`] = val;
            });
            
            return entry;
        });

        return normalizedData;
    }, [strategies]);

    const colors = ["#818cf8", "#10b981", "#fb923c"];

    if (strategies.length === 0) return null;

    return (
        <div className="w-full h-[400px] rounded-3xl p-6 border border-white/10 bg-white/[0.02] backdrop-blur-xl">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                        dataKey="percentage" 
                        hide 
                    />
                    <YAxis 
                        tick={{ fill: '#6b7280', fontSize: 10 }} 
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`}
                    />
                    <Tooltip
                        contentStyle={{ 
                            backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            backdropFilter: 'blur(10px)',
                            padding: '12px'
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        labelStyle={{ display: 'none' }}
                        formatter={(value: any, name: any) => {
                            const val = parseFloat(value);
                            const idx = parseInt((name || "").split('_')[1]);
                            return [`$${val.toFixed(2)}`, strategies[idx]?.name || "N/A"];
                        }}
                    />
                    <Legend 
                        verticalAlign="top" 
                        align="right"
                        wrapperStyle={{ paddingBottom: '20px' }}
                        formatter={(value, entry: any) => {
                            const idx = parseInt(entry.dataKey.split('_')[1]);
                            return <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">{strategies[idx]?.name}</span>;
                        }}
                    />
                    {strategies.map((strat, i) => (
                        <Line
                            key={strat.id}
                            type="monotone"
                            dataKey={`strategy_${i}`}
                            stroke={colors[i % colors.length]}
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, stroke: colors[i % colors.length], strokeWidth: 2, fill: '#fff' }}
                            animationDuration={1500}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
