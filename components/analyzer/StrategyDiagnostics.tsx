"use client";

import type { BasicMetrics } from "@/lib/analyzer/metrics";
import type { Trade } from "@/lib/analyzer/parser";
import { useTranslations } from "next-intl";

interface Props {
  metrics: BasicMetrics;
  trades: Trade[];
}

const SESSION_MAP = (hour: number): "asia" | "london" | "newyork" | "outOfHours" => {
  if (hour >= 0 && hour < 8) return "asia";
  if (hour >= 7 && hour < 16) return "london";
  if (hour >= 12 && hour < 21) return "newyork";
  return "outOfHours";
};

export default function StrategyDiagnostics({ metrics, trades }: Props) {
  const t = useTranslations("analyzer.diagnostics");
  const ti = useTranslations("analyzer.insights");

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

  const worstDay = [...dayStats].sort((a, b) => a.avg - b.avg)[0];
  const bestDay = [...dayStats].sort((a, b) => b.avg - a.avg)[0];

  // 2. Session Analysis
  const bySession: Record<string, number[]> = { asia: [], london: [], newyork: [], outOfHours: [] };
  trades.forEach((tr) => {
    const dt = tr.exit_time ?? tr.datetime;
    if (dt) {
      const key = SESSION_MAP(dt.getUTCHours());
      bySession[key].push(tr.profit);
    }
  });

  const sessionStats = Object.entries(bySession).map(([key, profits]) => ({
    key,
    avg: profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : -999,
    count: profits.length,
  })).filter(s => s.count >= 3);

  const bestSession = [...sessionStats].sort((a, b) => b.avg - a.avg)[0];
  const worstSession = [...sessionStats].sort((a, b) => a.avg - b.avg)[0];

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
        ? t("weekday.explanation", { day: dayNames[worstDay.day] })
        : t("weekday.positive", { day: dayNames[bestDay.day] }),
      tip: t("weekday.tip", { day: dayNames[worstDay?.day ?? 1] }),
      icon: "📅",
    },
    {
      id: "sessions",
      title: t("sessions.title"),
      level: bestSession && bestSession.avg > 0 ? "positive" : "neutral",
      headline: bestSession && bestSession.avg > 0
        ? t("sessions.explanation", { session: ti(`sessions.${bestSession.key}`) })
        : t("sessions.warning", { session: ti(`sessions.${worstSession?.key ?? "asia"}`) }),
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
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-10">
      <div className="flex flex-col items-center">
        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-600 mb-2">{t("title")}</h3>
        <div className="h-1 w-12 bg-indigo-500/20 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {diagnostics.map((d) => (
          <div key={d.id} className="rounded-[28px] p-6 space-y-5 transition-all duration-300 hover:bg-white/[0.04] border border-white/5 bg-white/[0.01] group relative overflow-hidden">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shadow-inner">
                    {d.icon}
                </div>
                <div>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{d.title}</span>
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
                <div className="flex gap-3">
                    <div className="w-px bg-indigo-500/30 shrink-0" />
                    <p className="text-[11px] leading-relaxed font-medium text-gray-400">
                        <span className="text-indigo-400 font-black mr-1 uppercase text-[9px] tracking-widest">DIAGNOSTIC TIP</span>
                        {d.tip}
                    </p>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
