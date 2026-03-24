"use client";

import type { BasicMetrics, FullMetrics } from "@/lib/analyzer/metrics";
import type { Trade } from "@/lib/analyzer/parser";
import { useTranslations } from "next-intl";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  BarChart, 
  Bar,
  ReferenceLine
} from "recharts";

interface Props {
  metrics: BasicMetrics;
  fullMetrics?: FullMetrics;
  trades: Trade[];
  onAddToComparison?: () => void;
  isInComparison?: boolean;
}

const SESSION_MAP = (hour: number): "asia" | "london" | "newyork" | "outOfHours" => {
  if (hour >= 0 && hour < 8) return "asia";
  if (hour >= 7 && hour < 16) return "london";
  if (hour >= 12 && hour < 21) return "newyork";
  return "outOfHours";
};

export default function StrategyDiagnostics({ metrics, fullMetrics, trades, onAddToComparison, isInComparison }: Props) {
  const t = useTranslations("analyzer.diagnostics");
  const ti = useTranslations("analyzer.insights");
  const sqnT = useTranslations("analyzer.sqn");
  const zT = useTranslations("analyzer.zscore");
  const mcT = useTranslations("analyzer.monteCarlo");
  const pfT = useTranslations("analyzer.propFirm");
  const intelT = useTranslations("analyzer.intelligence");
  const tipT = useTranslations("analyzer.expertTips");
  const compT = useTranslations("analyzer.comparison");

  if (trades.length < 20) return null;

  // 1. Weekday Analysis
  const dayNames: string[] = ti.raw("days");
  const byDay: Record<number, number[]> = {};
  trades.forEach((tr) => {
    const dt = tr.exit_time ?? tr.datetime;
    if (dt) {
      const d = dt.getDay();
      byDay[d] = byDay[d] ?? [];
      byDay[d].push(tr.profit);
    }
  });

  const dayStats = Object.entries(byDay).map(([day, profits]) => ({
    day: parseInt(day),
    avg: profits.reduce((a, b) => a + b, 0) / profits.length,
    count: profits.length,
  })).filter(s => s.count >= 3);

  const worstDay = dayStats.length > 0 ? [...dayStats].sort((a, b) => a.avg - b.avg)[0] : null;
  const bestDay = dayStats.length > 0 ? [...dayStats].sort((a, b) => b.avg - a.avg)[0] : null;

  // 2. Session Analysis
  const bySession: Record<string, number[]> = { asia: [], london: [], newyork: [], outOfHours: [] };
  trades.forEach((tr) => {
    const dt = tr.exit_time ?? tr.datetime;
    if (dt) {
      const key = SESSION_MAP(dt.getUTCHours());
      bySession[key].push(tr.profit);
    }
  });

  const sessionStats = Object.entries(bySession)
    .map(([key, profits]) => ({
      key,
      avg: profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : -999,
      count: profits.length,
    }))
    .filter((s) => s.count >= 3 && s.avg !== -999);

  const bestSession = sessionStats.length > 0 ? [...sessionStats].sort((a, b) => b.avg - a.avg)[0] : null;
  const worstSession = sessionStats.length > 0 ? [...sessionStats].sort((a, b) => a.avg - b.avg)[0] : null;

  // 3. Drawdown Profile
  const ddValue = Math.abs(metrics.maxDrawdown);
  const ddLevel = ddValue <= 15 ? "optimal" : ddValue <= 30 ? "stable" : "larger";

  // 4. Winrate dependency
  const dependency = metrics.winrate >= 55 ? "accuracy" : "rr";

  const diagnostics = [
    {
      id: "weekday",
      title: t("weekday.title"),
      level: worstDay && worstDay.avg < 0 ? "negative" : "positive",
      headline: worstDay && worstDay.avg < 0 
        ? t("weekday.explanation", { day: dayNames[worstDay.day] || "Unknown" })
        : t("weekday.positive", { day: dayNames[bestDay?.day ?? 0] || "Unknown" }),
      tip: t("weekday.tip", { day: dayNames[worstDay?.day ?? bestDay?.day ?? 1] || "Unknown" }),
      icon: "📅",
    },
    {
      id: "sessions",
      title: t("sessions.title"),
      level: bestSession && bestSession.avg > 0 ? "positive" : "neutral",
      headline: bestSession && bestSession.avg > 0
        ? t("sessions.explanation", { session: ti(`sessions.${bestSession.key}`) })
        : worstSession 
          ? t("sessions.warning", { session: ti(`sessions.${worstSession.key}`) })
          : t("sessions.warning", { session: ti("sessions.asia") }),
      tip: t("sessions.tip"),
      icon: "🕒",
    },
    {
        id: "drawdown",
        title: t("drawdown.title"),
        level: ddLevel === "optimal" ? "positive" : ddLevel === "stable" ? "neutral" : "negative",
        headline: t("drawdown.explanation", { level: t(`drawdown.${ddLevel}`) }),
        tip: t("drawdown.tip"),
        icon: "📉",
    },
    {
        id: "winrate",
        title: t("winrate.title"),
        level: "info",
        headline: t("winrate.explanation", { factor: t(`winrate.${dependency}`) }),
        tip: t("winrate.tip"),
        icon: "🎯",
    },
    {
        id: "sqn",
        title: sqnT("title"),
        level: ["excellent", "elite", "good"].includes(fullMetrics?.advanced?.sqnLevel || "") ? "positive" : fullMetrics?.advanced?.sqnLevel === "below" ? "neutral" : "negative",
        headline: sqnT(`levels.${fullMetrics?.advanced?.sqnLevel || "poor"}`),
        tip: sqnT("tooltip"),
        icon: "📊",
        value: fullMetrics?.advanced?.sqn || 0
    },
    {
        id: "zscore",
        title: zT("title"),
        level: fullMetrics?.advanced?.zLevel === "random" ? "positive" : "neutral",
        headline: zT(`levels.${fullMetrics?.advanced?.zLevel || "random"}`),
        tip: zT("tooltip"),
        icon: "🔗",
        value: fullMetrics?.advanced?.zScore || 0
    },
    {
        id: "montecarlo",
        title: mcT("title"),
        level: (fullMetrics?.monteCarlo?.riskOfRuin || 0) < 5 ? "positive" : (fullMetrics?.monteCarlo?.riskOfRuin || 0) < 15 ? "neutral" : "negative",
        headline: mcT(`levels.${(fullMetrics?.monteCarlo?.riskOfRuin || 0) < 5 ? "positive" : (fullMetrics?.monteCarlo?.riskOfRuin || 0) < 15 ? "neutral" : "negative"}`),
        tip: mcT("tooltip"),
        icon: "🎲",
        value: fullMetrics?.monteCarlo?.riskOfRuin || 0,
        extra: [
            { label: mcT("medianOutcome"), value: `${(fullMetrics?.monteCarlo?.averageCase ?? 0) >= 0 ? "+" : ""}${fullMetrics?.monteCarlo?.averageCase || 0}` },
            { label: mcT("worstCaseDD"), value: `${fullMetrics?.monteCarlo?.drawdownAt5Pct || 0}%` },
            { label: mcT("ruinProb"), value: `${fullMetrics?.monteCarlo?.riskOfRuin || 0}%` }
        ]
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-10">
      <div className="flex flex-col items-center">
        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-600 mb-2">{t("title")}</h3>
        <div className="h-1 w-12 bg-indigo-500/20 rounded-full mb-6" />
        
        {onAddToComparison && (
          <button
            onClick={onAddToComparison}
            disabled={isInComparison}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full border transition-all duration-300 text-[10px] font-black uppercase tracking-widest ${
              isInComparison 
                ? "bg-white/5 border-white/10 text-gray-500 cursor-not-allowed" 
                : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 shadow-lg shadow-indigo-500/10"
            }`}
          >
            {isInComparison ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Agregado
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {compT("add")}
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {diagnostics.map((d) => (
          <div key={d.id} className="rounded-[32px] p-6 space-y-5 transition-all duration-300 hover:bg-white/[0.04] border border-white/5 bg-white/[0.01] group relative overflow-visible shadow-2xl shadow-black/20">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                    {d.icon}
                </div>
                <div className="flex-1">
                   <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{d.title}</span>
                       {"value" in d && <span className="text-xs font-black text-indigo-400">{(d as any).value}</span>}
                   </div>
                   <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${d.level === "positive" ? "bg-emerald-500" : d.level === "negative" ? "bg-red-500" : d.level === "info" ? "bg-blue-500" : "bg-amber-500"}`} />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                            {d.level.toUpperCase()} DIAGNOSTIC
                        </span>
                   </div>
                </div>
             </div>

             <div>
                <p className="text-lg font-black leading-tight tracking-tight text-white mb-3">
                    {d.headline}
                </p>
                <div className="flex gap-3 relative cursor-help">
                    <div className="w-px bg-indigo-500/30 shrink-0" />
                    <p className="text-[11px] leading-relaxed font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                        <span className="text-indigo-400 font-black mr-1 uppercase text-[9px] tracking-widest">DIAGNOSTIC TIP</span>
                        {d.tip}
                    </p>
                </div>

                {/* ── Additional metrics for specific cards (like Monte Carlo) ── */}
                {"extra" in d && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 mt-5">
                        {(d as any).extra.map((ex: any, i: number) => (
                            <div key={i} className="flex flex-col">
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">{ex.label}</span>
                                <span className="text-[10px] font-black text-indigo-100">{ex.value}</span>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          </div>
        ))}
      </div>

      {/* ── Section: Prop Firm Readiness Module ── */}
      {fullMetrics?.propFirm && (
        <div className="pt-8 border-t border-white/5 space-y-8">
            <div className="flex flex-col items-center">
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-600 mb-2">{pfT("title")}</h3>
                <p className="text-[10px] text-gray-500 font-medium">{pfT("subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Gauge */}
                <div className="lg:col-span-1 p-8 rounded-[40px] bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative w-32 h-32 mb-6">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                            <circle 
                                cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                strokeDasharray={364.4}
                                strokeDashoffset={364.4 - (364.4 * (fullMetrics.propFirm.passProb / 100))}
                                className={`${
                                    fullMetrics.propFirm.passTier === "strong" ? "text-emerald-500" :
                                    fullMetrics.propFirm.passTier === "good" ? "text-indigo-500" :
                                    fullMetrics.propFirm.passTier === "borderline" ? "text-amber-500" : "text-red-500"
                                } transition-all duration-1000 ease-out`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-white">{fullMetrics.propFirm.passProb}%</span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">PROB.</span>
                        </div>
                    </div>

                    <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest mb-2 ${
                        fullMetrics.propFirm.passTier === "strong" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                        fullMetrics.propFirm.passTier === "good" ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" :
                        fullMetrics.propFirm.passTier === "borderline" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                    }`}>
                        {pfT(`verdicts.${fullMetrics.propFirm.passTier}`)}
                    </div>
                </div>

                {/* Sub Metrics Grid */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-[32px] bg-white/[0.01] border border-white/5 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{pfT("dailyViolation")}</span>
                            <span className={`text-xs font-black ${fullMetrics.propFirm.failDailyDDProb > 10 ? "text-red-400" : "text-emerald-400"}`}>
                                {fullMetrics.propFirm.failDailyDDProb}%
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${fullMetrics.propFirm.failDailyDDProb > 10 ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${fullMetrics.propFirm.failDailyDDProb}%` }} />
                        </div>
                    </div>

                    <div className="p-6 rounded-[32px] bg-white/[0.01] border border-white/5 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{pfT("maxViolation")}</span>
                            <span className={`text-xs font-black ${fullMetrics.propFirm.failMaxDDProb > 10 ? "text-red-400" : "text-emerald-400"}`}>
                                {fullMetrics.propFirm.failMaxDDProb}%
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${fullMetrics.propFirm.failMaxDDProb > 10 ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${fullMetrics.propFirm.failMaxDDProb}%` }} />
                        </div>
                    </div>

                    <div className="p-6 rounded-[32px] bg-white/[0.01] border border-white/5 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{pfT("consistency")}</span>
                            <span className="text-xs font-black text-indigo-400">{fullMetrics.propFirm.consistencyScore}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${fullMetrics.propFirm.consistencyScore}%` }} />
                        </div>
                    </div>

                    <div className="p-6 rounded-[32px] bg-white/[0.01] border border-white/5 flex items-center justify-around">
                        <div className="text-center">
                            <div className="text-[8px] font-black uppercase text-gray-600 mb-1">{pfT("metrics.target")}</div>
                            <div className="text-xs font-black text-white">10%</div>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div className="text-center">
                            <div className="text-[8px] font-black uppercase text-gray-600 mb-1">{pfT("metrics.limit")}</div>
                            <div className="text-xs font-black text-white">5 / 10%</div>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div className="text-center">
                            <div className="text-[8px] font-black uppercase text-gray-600 mb-1">{pfT("metrics.days")}</div>
                            <div className="text-xs font-black text-white">~{fullMetrics.propFirm.expectedTrades} tr.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* ── Section: Strategy Intelligence Dashboard ── */}
      {fullMetrics && (
        <div className="pt-12 border-t border-white/5 space-y-10">
            <div className="flex flex-col items-center">
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-3 shadow-[0_0_15px_rgba(99,102,241,0.2)]">Intelligence Layer</span>
                <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-white mb-2">{intelT("title")}</h3>
                <p className="text-[10px] text-gray-500 font-medium max-w-md text-center leading-relaxed">{intelT("subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* 1. Equity Fan Chart (Future Projections) */}
                <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 shadow-2xl space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">{intelT("equityFan.title")}</h4>
                            <p className="text-[9px] text-gray-500 font-medium">{intelT("equityFan.subtitle")}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 block mb-1">Horizon</span>
                            <span className="text-[10px] font-black text-white">{fullMetrics.monteCarlo.horizon} Trades</span>
                        </div>
                    </div>

                    <div className="h-[280px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart 
                                data={fullMetrics.monteCarlo.percentilePaths.p50.map((v, i) => ({
                                    idx: i,
                                    p5: fullMetrics.monteCarlo.percentilePaths.p5[i],
                                    p25: fullMetrics.monteCarlo.percentilePaths.p25[i],
                                    p50: v,
                                    p75: fullMetrics.monteCarlo.percentilePaths.p75[i],
                                    p95: fullMetrics.monteCarlo.percentilePaths.p95[i],
                                }))} 
                                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="fanInner" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                                    </linearGradient>
                                    <linearGradient id="fanOuter" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey="idx" hide />
                                <YAxis 
                                    orientation="right" 
                                    tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }} 
                                    tickFormatter={(v) => `$${v}`}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                                    itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                                    labelStyle={{ display: 'none' }}
                                />
                                
                                {/* Inner Confidence (25-75%) */}
                                <Area type="monotone" dataKey="p75" stackId="1" stroke="none" fill="url(#fanInner)" animationDuration={1500} />
                                <Area type="monotone" dataKey="p25" stackId="1" stroke="none" fill="transparent" />

                                {/* Outer Confidence (5-95%) */}
                                <Area type="monotone" dataKey="p95" stroke="rgba(99,102,241,0.2)" strokeWidth={1} fill="url(#fanOuter)" animationDuration={2000} />
                                <Area type="monotone" dataKey="p5" stroke="rgba(99,102,241,0.2)" strokeWidth={1} fill="transparent" />

                                {/* Median Outcome */}
                                <Area type="monotone" dataKey="p50" stroke="#818cf8" strokeWidth={3} fill="none" dot={false} strokeDasharray="5 5" />
                                <ReferenceLine y={10000} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 opacity-60" />
                            <span className="text-[8px] font-black uppercase text-gray-500">95% Confidence</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-400" />
                            <span className="text-[8px] font-black uppercase text-gray-500">50% Probable</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-300" />
                            <span className="text-[8px] font-black uppercase text-gray-500">Median Path</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* 2. Edge Health / Decay Signal */}
                    {fullMetrics.edgeDecay && (
                        <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 flex items-center gap-8 relative overflow-hidden group">
                           <div className={`absolute inset-y-0 left-0 w-1.5 ${
                               fullMetrics.edgeDecay.signal === "stable" ? "bg-emerald-500" :
                               fullMetrics.edgeDecay.signal === "caution" ? "bg-amber-500" : "bg-red-500"
                           }`} />
                           
                           <div className="flex flex-col gap-1 flex-1">
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">{intelT("edgeDecay.title")}</h4>
                               <p className="text-[9px] text-gray-600 font-medium mb-2">{intelT("edgeDecay.subtitle")}</p>
                               <div className="flex items-end gap-3">
                                   <span className={`text-2xl font-black ${
                                       fullMetrics.edgeDecay.signal === "stable" ? "text-emerald-400 text-glow-emerald" :
                                       fullMetrics.edgeDecay.signal === "caution" ? "text-amber-400" : "text-red-400"
                                   }`}>
                                       {intelT(`edgeDecay.${fullMetrics.edgeDecay.signal}`)}
                                   </span>
                                   <span className="text-xs font-black text-gray-500 mb-1">Score: {fullMetrics.edgeDecay.score}%</span>
                               </div>
                           </div>
                           
                           <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                               <div className="text-center">
                                   <div className="text-[8px] font-black text-gray-600 uppercase mb-1">Recent</div>
                                   <div className="text-[10px] font-black text-white">{fullMetrics.edgeDecay.recentSQN} <span className="text-[8px] text-gray-500">SQN</span></div>
                               </div>
                               <div className="w-px h-6 bg-white/5" />
                               <div className="text-center">
                                   <div className="text-[8px] font-black text-gray-600 uppercase mb-1">Baseline</div>
                                   <div className="text-[10px] font-black text-gray-400">{fullMetrics.edgeDecay.baselineSQN} <span className="text-[8px] text-gray-600">SQN</span></div>
                               </div>
                           </div>
                        </div>
                    )}

                    {/* 3. Payoff Normalized Distribution */}
                    {fullMetrics.rHistogram && (
                        <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">{intelT("payoffDistribution.title")}</h4>
                                    <p className="text-[9px] text-gray-500 font-medium">{intelT("payoffDistribution.subtitle")}</p>
                                </div>
                            </div>

                            <div className="h-[140px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart 
                                        data={fullMetrics.rHistogram.counts.map((c, i) => ({
                                            r: fullMetrics.rHistogram ? fullMetrics.rHistogram.min + (i * ((fullMetrics.rHistogram.max - fullMetrics.rHistogram.min) / fullMetrics.rHistogram.counts.length)) : i,
                                            val: c
                                        }))}
                                        barGap={2}
                                    >
                                        <XAxis 
                                            dataKey="r" 
                                            tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }} 
                                            tickFormatter={(v) => `${v.toFixed(1)}R`}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis hide />
                                        <RechartsTooltip 
                                           cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                                            itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                                            labelFormatter={(v) => `Bucket: ${Number(v).toFixed(2)}R`}
                                        />
                                        <Bar 
                                            dataKey="val" 
                                            fill="#6366f1" 
                                            radius={[4, 4, 0, 0]} 
                                            opacity={0.6}
                                            activeBar={{ fill: '#818cf8', opacity: 1 }}
                                        />
                                        <ReferenceLine x={0} stroke="#f87171" strokeWidth={1} strokeDasharray="3 3" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* ── Section: Expert Tips Engine ── */}
      {fullMetrics?.advanced?.expertTips && fullMetrics.advanced.expertTips.length > 0 && (
        <div className="pt-8 border-t border-white/5">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 whitespace-nowrap">
                    {tipT("title")}
                </h4>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fullMetrics.advanced.expertTips.map((tipKey, idx) => (
                    <div key={idx} className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all flex gap-4 items-start group">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                            👨‍🔬
                        </div>
                        <p className="text-xs text-gray-400 font-medium leading-relaxed group-hover:text-gray-300 transition-colors">
                            {tipT(tipKey, { 
                                mcDD: fullMetrics.monteCarlo ? `${fullMetrics.monteCarlo.drawdownAt5Pct.toFixed(1)}%` : "N/A",
                                histDD: `${Math.abs(metrics.maxDrawdown).toFixed(1)}%`
                            })}
                        </p>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}
