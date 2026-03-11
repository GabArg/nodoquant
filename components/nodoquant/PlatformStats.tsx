"use client";

import { useEffect, useRef, useState } from "react";

import { useTranslations } from "next-intl";

interface Stats {
    analysisCount: number;
    leadsCount: number;
    backtests: number;
    automationProjects: number;
    forwardTests: number;
}

const METRICS_CONFIG = [
    {
        key: "analysisCount" as keyof Stats,
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
        ),
    },
    {
        key: "backtests" as keyof Stats,
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
        ),
    },
    {
        key: "automationProjects" as keyof Stats,
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
            </svg>
        ),
    },
    {
        key: "forwardTests" as keyof Stats,
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
        ),
    },
];

function useCountUp(target: number, enabled: boolean, duration = 1400): number {
    const [value, setValue] = useState(0);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled || target === 0) {
            setValue(target);
            return;
        }
        const startTime = performance.now();
        function tick(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setValue(Math.round(eased * target));
            if (progress < 1) {
                frameRef.current = requestAnimationFrame(tick);
            }
        }
        frameRef.current = requestAnimationFrame(tick);
        return () => {
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        };
    }, [target, enabled, duration]);

    return value;
}

function StatCard({
    label,
    value,
    icon,
    delay,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    delay: number;
}) {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const count = useCountUp(value, visible);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    timer = setTimeout(() => setVisible(true), delay);
                }
            },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => {
            observer.disconnect();
            clearTimeout(timer);
        };
    }, [delay]);

    return (
        <div
            ref={ref}
            className="card rounded-2xl px-6 py-7 flex flex-col items-center text-center gap-3"
        >
            <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
            >
                {icon}
            </div>
            <div>
                <p className="text-3xl font-extrabold text-white tabular-nums leading-none mb-1">
                    {visible ? (count > 0 ? `+${count}` : "0") : "—"}
                </p>
                <p className="text-xs" style={{ color: "#6b7280" }}>{label}</p>
            </div>
        </div>
    );
}

export default function PlatformStats() {
    const [stats, setStats] = useState<Stats | null>(null);
    const t = useTranslations("platformStats");

    useEffect(() => {
        fetch("/api/analyzer/stats")
            .then((r) => r.json())
            .then((data: Stats) => setStats(data))
            .catch(() => {/* silently fail — section is hidden if fetch fails */ });
    }, []);

    if (!stats) return null;

    const display: Stats = {
        analysisCount: stats.analysisCount ?? 0,
        leadsCount: stats.leadsCount ?? 0,
        backtests: stats.backtests ?? stats.analysisCount ?? 0,
        automationProjects: stats.automationProjects ?? stats.leadsCount ?? 0,
        forwardTests: stats.forwardTests ?? 0,
    };

    return (
        <section className="py-16 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <p className="section-label">{t("label")}</p>
                    <h2 className="text-2xl font-bold text-white">{t("title")}</h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {METRICS_CONFIG.map((m, i) => (
                        <StatCard
                            key={m.key}
                            label={t(m.key as never)}
                            value={display[m.key]}
                            icon={m.icon}
                            delay={i * 120}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
