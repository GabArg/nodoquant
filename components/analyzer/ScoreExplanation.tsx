"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

export default function ScoreExplanation() {
  const t = useTranslations("analyzer.results.narrative.scoreExplanation");
  const [isOpen, setIsOpen] = useState(false);

  const components = [
    { label: t("weights.pf"), weight: "30%", icon: "📈", color: "#10b981", tip: t("weights.pfTip") },
    { label: t("weights.expectancy"), weight: "25%", icon: "🎯", color: "#818cf8", tip: t("weights.expTip") },
    { label: t("weights.drawdown"), weight: "20%", icon: "🛡️", color: "#f87171", tip: t("weights.ddTip") },
    { label: t("weights.consistency"), weight: "15%", icon: "⚖️", color: "#fbbf24", tip: t("weights.consTip") },
    { label: t("weights.tradeCount"), weight: "10%", icon: "📊", color: "#94a3b8", tip: t("weights.tcTip") },
  ];

  return (
    <div className="w-full max-w-xl mx-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 mx-auto text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors py-2 px-4 rounded-full border border-white/5 hover:bg-white/5"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {t("title")}
      </button>

      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? "max-h-[500px] opacity-100 mt-6" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-8 space-y-8 relative overflow-hidden shadow-2xl">
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
          
          <div className="space-y-3 relative z-10">
            <h4 className="text-xl font-black text-white tracking-tight italic uppercase">
              {t("title")}
            </h4>
            <p className="text-[11px] leading-relaxed font-medium text-gray-400">
              {t("desc")}
            </p>
          </div>

          <div className="space-y-6 relative z-10">
            {components.map((comp) => (
              <div key={comp.label} className="group">
                <div className="flex justify-between items-end mb-2 px-1">
                  <div className="flex items-center gap-2 group/tip relative">
                    <span className="text-sm grayscale group-hover:grayscale-0 transition-all duration-300">{comp.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors">
                      {comp.label}
                    </span>
                    <div className="opacity-0 group-hover/tip:opacity-100 transition-opacity absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-900 border border-white/10 rounded-lg text-[9px] text-gray-400 font-medium z-50 pointer-events-none shadow-2xl">
                      {comp.tip}
                    </div>
                  </div>
                  <span className="text-xs font-black tabular-nums" style={{ color: comp.color }}>
                    {comp.weight}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 delay-300 ease-out"
                    style={{
                      width: isOpen ? comp.weight : "0%",
                      backgroundColor: comp.color,
                      boxShadow: `0 0 10px ${comp.color}40`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Real-time algorithmic weighting
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
