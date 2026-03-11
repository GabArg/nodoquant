import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EquityCurveChartProps {
    data: { index: number; r_multiple: number; cumulative_r: number }[];
}

export default function EquityCurveChart({ data }: EquityCurveChartProps) {
    return (
        <div className="card p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <h3 className="text-lg font-semibold text-white mb-4">Curva de Capital (R-Multiples)</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorR" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="index" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}R`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111827', borderColor: '#ffffff20', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#818cf8' }}
                            labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                            formatter={(value: any) => [`${parseFloat(value || 0).toFixed(2)} R`, 'Cumulative']}
                            labelFormatter={(label) => `Trade #${label}`}
                        />
                        <Area type="monotone" dataKey="cumulative_r" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorR)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
