"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface ReportMetrics {
    winrate: number;
    profit_factor: number;
    max_drawdown: number;
    metrics_json?: {
        edge_location?: {
            bestSession?: string;
            bestSymbol?: string;
            bestDayOfWeek?: string;
        };
        equity_curve?: { date: string; value: number }[];
    };
}

interface Props {
    latestReport: ReportMetrics | null;
}

export default function EdgeAlerts({ latestReport }: Props) {
    const t = useTranslations("analyzer.edgeAlerts");
    if (!latestReport) return null;

    const alerts: { type: "edge" | "risk" | "consistency", message: string, color: string, icon: string }[] = [];

    // 1. Edge Location Alert
    const edge = latestReport.metrics_json?.edge_location;
    if (edge?.bestSymbol || edge?.bestSession) {
        let msg = t("edge.intro");
        if (edge.bestSymbol) msg += t("edge.symbol", { symbol: edge.bestSymbol });
        if (edge.bestSession) msg += edge.bestSymbol ? t("edge.session", { session: edge.bestSession }) : t("edge.sessionOnly", { session: edge.bestSession });

        alerts.push({
            type: "edge",
            message: msg,
            color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
            icon: "🎯"
        });
    } else {
        // Fallback generic edge alert based on PF
        if (latestReport.profit_factor > 1.5) {
            alerts.push({
                type: "edge",
                message: t("edge.generic", { pf: latestReport.profit_factor.toFixed(2) }),
                color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
                icon: "🎯"
            });
        }
    }

    // 2. Risk Alert
    if (Math.abs(latestReport.max_drawdown) > 20) {
        alerts.push({
            type: "risk",
            message: t("risk.maxDrawdownWarning", { limit: Math.abs(latestReport.max_drawdown).toFixed(1) }),
            color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
            icon: "⚠️"
        });
    }

    // 3. Consistency Alert
    const eq = latestReport.metrics_json?.equity_curve;
    if (eq && eq.length >= 20) {
        // Check last 20 trades
        const last20 = eq.slice(-20);
        const startVal = last20[0].value;
        const endVal = last20[last20.length - 1].value;
        if (endVal < startVal) {
            alerts.push({
                type: "consistency",
                message: t("consistency.declining"),
                color: "text-red-400 border-red-500/20 bg-red-500/5",
                icon: "📉"
            });
        } else if (endVal > startVal * 1.05) {
            alerts.push({
                type: "consistency",
                message: t("consistency.stable"),
                color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
                icon: "📈"
            });
        }
    }

    if (alerts.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-bold text-white mb-4">{t("title")}</h3>
            {alerts.map((alert, i) => (
                <div key={i} className={`card rounded-xl p-4 border flex gap-3 ${alert.color}`}>
                    <span className="text-xl shrink-0 leading-none">{alert.icon}</span>
                    <p className="text-sm font-medium pr-2 leading-snug">{alert.message}</p>
                </div>
            ))}
        </div>
    );
}
