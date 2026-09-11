"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
    CUSTOM_PROP_FIRM_CONFIG,
    runPropFirmMonteCarlo,
    strategyDataFromMetrics,
    validatePropFirmConfig,
    type PropFirmConfig,
    type PropFirmSimulationResult,
} from "@/lib/analyzer/propFirm";
import type { FullMetrics } from "@/lib/analyzer/metrics";

export interface PropFirmStrategyOption {
    reportId: string;
    name: string;
    metrics: FullMetrics;
}

export default function PropFirmDashboardSimulator({ strategies, initialReportId }: { strategies: PropFirmStrategyOption[]; initialReportId?: string }) {
    const locale = useLocale();
    const t = useTranslations("dashboard.propFirm");
    const translate = t as (key: string) => string;
    const copy = new Proxy({} as Record<string, string>, { get: (_, key) => translate(String(key)) });
    const [strategyId, setStrategyId] = useState(initialReportId && strategies.some(item => item.reportId === initialReportId) ? initialReportId : "");
    const [config, setConfig] = useState<PropFirmConfig>(() => structuredClone(CUSTOM_PROP_FIRM_CONFIG));
    const [editing, setEditing] = useState(false);
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<PropFirmSimulationResult | null>(null);
    const selected = strategies.find(item => item.reportId === strategyId);
    const strategyData = useMemo(() => selected ? strategyDataFromMetrics(selected.metrics) : null, [selected]);
    const validationErrors = validatePropFirmConfig(config);

    function simulate() {
        if (!strategyData || validationErrors.length) return;
        setRunning(true);
        setResult(null);
        window.setTimeout(() => {
            setResult(runPropFirmMonteCarlo(strategyData, config, 1000));
            setRunning(false);
        }, 20);
    }

    function setPhaseCount(count: number) {
        const phases = Array.from({ length: count }, (_, index) => config.phases[index] ?? { id: `phase-${index + 1}`, name: `${copy.phase} ${index + 1}`, profitTargetPct: config.phases[0]?.profitTargetPct ?? 10 });
        setConfig(current => ({ ...current, phases }));
    }

    return (
        <section id="prop-firm-simulator" className="relative overflow-hidden rounded-[32px] border border-indigo-400/20 bg-gradient-to-br from-indigo-500/[0.12] via-[#11111a] to-[#09090f] p-5 shadow-2xl shadow-indigo-950/20 sm:p-8">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">{copy.eyebrow}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">{copy.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">{copy.subtitle}</p>

                <div className="mt-7 grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                    <Field label={copy.strategy}>
                        <select className="form-input" value={strategyId} onChange={event => { setStrategyId(event.target.value); setResult(null); }}>
                            <option value="">{copy.selectStrategy}</option>
                            {strategies.map(strategy => <option key={strategy.reportId} value={strategy.reportId}>{strategy.name}</option>)}
                        </select>
                    </Field>
                    <Field label={copy.preset}>
                        <select className="form-input" value="custom" disabled><option value="custom">{copy.custom}</option></select>
                    </Field>
                    <button type="button" onClick={simulate} disabled={!strategyData || running || validationErrors.length > 0} className="btn-primary min-h-11 justify-center px-6 disabled:cursor-not-allowed disabled:opacity-40">
                        {running ? copy.simulating : result ? copy.recalculate : copy.simulate}
                    </button>
                </div>

                {!strategyId && <StateMessage>{copy.noStrategy}</StateMessage>}
                {strategyId && !strategyData && <StateMessage>{copy.insufficient}</StateMessage>}

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <Rule label={copy.accountSize} value={currency(config.accountSize, locale)} />
                    <Rule label={copy.target} value={`${config.phases[0]?.profitTargetPct ?? "—"}%`} />
                    <Rule label={copy.dailyLoss} value={`${config.dailyLossLimitPct}%`} />
                    <Rule label={copy.maxLoss} value={`${config.maxLossLimitPct}%`} />
                    <Rule label={copy.phases} value={String(config.phases.length)} />
                    <Rule label={copy.drawdown} value={config.drawdownType === "static" ? copy.static : copy.trailing} />
                </div>

                <button type="button" onClick={() => setEditing(value => !value)} aria-expanded={editing} className="mt-4 text-sm font-bold text-indigo-300 hover:text-indigo-200">
                    {editing ? copy.closeRules : copy.editRules}
                </button>

                {editing && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <NumberField label={copy.accountSize} value={config.accountSize} min={1000} step={1000} onChange={value => setConfig(current => ({ ...current, accountSize: value }))} />
                            <NumberField label={copy.dailyLoss} value={config.dailyLossLimitPct} min={0.1} step={0.1} onChange={value => setConfig(current => ({ ...current, dailyLossLimitPct: value }))} />
                            <NumberField label={copy.maxLoss} value={config.maxLossLimitPct} min={0.1} step={0.1} onChange={value => setConfig(current => ({ ...current, maxLossLimitPct: value }))} />
                            <NumberField label={copy.tradesPerDay} value={config.tradesPerDayEstimate} min={1} step={1} onChange={value => setConfig(current => ({ ...current, tradesPerDayEstimate: Math.round(value) }))} />
                            <Field label={copy.drawdown}><select className="form-input" value={config.drawdownType} onChange={event => setConfig(current => ({ ...current, drawdownType: event.target.value as PropFirmConfig["drawdownType"] }))}><option value="static">{copy.static}</option><option value="trailing">{copy.trailing}</option></select></Field>
                            <Field label={copy.dailyCalculation}><select className="form-input" value={config.dailyLossCalculation} onChange={event => setConfig(current => ({ ...current, dailyLossCalculation: event.target.value as PropFirmConfig["dailyLossCalculation"] }))}><option value="balance">Balance</option><option value="equity">Equity</option><option value="balanceOrEquity">Balance / Equity</option></select></Field>
                            <NumberField label={copy.phases} value={config.phases.length} min={1} max={4} step={1} onChange={value => setPhaseCount(Math.max(1, Math.min(4, Math.round(value))))} />
                            <NumberField label={copy.consistencyOptional} value={config.consistencyRulePct ?? 0} min={0} max={100} step={1} onChange={value => setConfig(current => ({ ...current, consistencyRulePct: value > 0 ? value : undefined }))} />
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            {config.phases.map((phase, index) => (
                                <div key={phase.id} className="rounded-xl border border-white/5 bg-white/[0.025] p-4">
                                    <p className="mb-3 text-xs font-black uppercase tracking-wider text-indigo-300">{copy.phase} {index + 1}</p>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <NumberField label={copy.target} value={phase.profitTargetPct} min={0.1} step={0.1} onChange={value => setConfig(current => ({ ...current, phases: current.phases.map((item, i) => i === index ? { ...item, profitTargetPct: value } : item) }))} />
                                        <NumberField label={copy.minDays} value={phase.minTradingDays ?? 0} min={0} step={1} onChange={value => setConfig(current => ({ ...current, phases: current.phases.map((item, i) => i === index ? { ...item, minTradingDays: value || undefined } : item) }))} />
                                        <NumberField label={copy.maxDays} value={phase.maxTradingDays ?? 20} min={1} step={1} onChange={value => setConfig(current => ({ ...current, phases: current.phases.map((item, i) => i === index ? { ...item, maxTradingDays: value } : item) }))} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {validationErrors.length > 0 && <p role="alert" className="mt-4 text-sm text-red-300">{copy.invalid}</p>}
                    </div>
                )}

                <div aria-live="polite" aria-busy={running}>
                    {result?.status === "completed" && <SimulationResult result={result} copy={copy} />}
                    {result?.status === "insufficientData" && <StateMessage>{copy.insufficient}</StateMessage>}
                </div>
            </div>
        </section>
    );
}

function SimulationResult({ result, copy }: { result: PropFirmSimulationResult; copy: Record<string, string> }) {
    const probability = result.totalPassProbability;
    const verdict = probability == null ? copy.insufficient : probability >= 70 ? copy.excellent : probability >= 40 ? copy.moderate : copy.elevated;
    const primaryRisk = result.primaryFailureCause ? copy[`primaryRisk.${result.primaryFailureCause}`] : copy["primaryRisk.none"];
    return <div className="mt-8 grid gap-6 rounded-3xl border border-white/10 bg-black/25 p-5 sm:p-7 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-center text-center lg:border-r lg:border-white/10 lg:pr-7">
            <p className="mx-auto mb-4 w-fit rounded-full border border-indigo-400/25 bg-indigo-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-200">{verdict}</p>
            <p className="text-6xl font-black tracking-tighter text-white sm:text-7xl">{formatPct(probability)}</p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.22em] text-indigo-300">{copy.estimatedPass}</p>
            <p className="mt-5 text-sm font-semibold leading-relaxed text-gray-200">{primaryRisk}</p>
            <p className="mt-2 text-xs text-gray-500">{copy.estimateDisclaimer}</p>
        </div>
        <div>
            <dl className="grid grid-cols-2 gap-3">
                <ResultMetric label={copy.dailyRisk} value={formatPct(result.dailyLossViolationProbability)} />
                <ResultMetric label={copy.maxRisk} value={formatPct(result.maxLossViolationProbability)} />
                <ResultMetric label={copy.consistency} value={formatPct(result.consistencyScore)} />
                <ResultMetric label={copy.duration} value={result.durationDays ? `${result.durationDays.p50} ${copy.days}` : "—"} />
            </dl>
            <div className="mt-5">
                <h3 className="text-xs font-black uppercase tracking-[0.18em] text-white">{copy.howFail}</h3>
                <div className="mt-3 space-y-2">
                    <Failure label={copy.dailyLoss} count={result.failureCounts.dailyLoss} total={result.iterations} />
                    <Failure label={copy.maxLoss} count={result.failureCounts.maxLoss} total={result.iterations} />
                    <Failure label={copy.targetMiss} count={result.failureCounts.targetNotReached} total={result.iterations} />
                    <Failure label={copy.consistency} count={result.failureCounts.consistency} total={result.iterations} />
                </div>
            </div>
            <p className="mt-4 text-[11px] text-gray-500">{copy.histogramNotice}</p>
        </div>
    </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="form-label">{label}</span>{children}</label>; }
function NumberField({ label, value, onChange, ...props }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number }) { return <Field label={label}><input type="number" className="form-input" value={value} onChange={event => onChange(Number(event.target.value))} {...props} /></Field>; }
function Rule({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[9px] font-black uppercase tracking-wider text-gray-500">{label}</p><p className="mt-1 text-lg font-black text-white">{value}</p></div>; }
function ResultMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-white/[0.035] p-3"><dt className="text-[9px] uppercase tracking-wider text-gray-500">{label}</dt><dd className="mt-1 text-xl font-black text-white">{value}</dd></div>; }
function Failure({ label, count, total }: { label: string; count: number; total: number }) { const width = total ? count / total * 100 : 0; return <div><div className="flex justify-between text-xs text-gray-400"><span>{label}</span><span className="tabular-nums text-white">{count}</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${width}%` }} /></div></div>; }
function StateMessage({ children }: { children: React.ReactNode }) { return <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm text-gray-400">{children}</p>; }
function formatPct(value: number | null) { return value == null ? "—" : `${value.toFixed(1)}%`; }
function currency(value: number, locale: string) { return new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }
