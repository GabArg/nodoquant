"use client";

export default function ReportSuccessState({ score }: { score: number }) {
    let evaluation = "";
    if (score >= 80) evaluation = "Your strategy demonstrates a robust statistical edge. It's an excellent candidate for scaling risk or full automation.";
    else if (score >= 50) evaluation = "Your strategy shows potential but requires optimization. Focus on improving your risk-reward ratio or cutting losers earlier.";
    else evaluation = "Your strategy currently lacks a positive expectancy. Review the core rules and ensure losses are strictly capped.";

    return (
        <div className="mb-8 p-6 sm:p-8 rounded-2xl border border-emerald-500/30 shadow-lg bg-emerald-500/10 flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                    Analysis Complete! Your Strategy Score is {score}.
                </h3>
                <p className="text-sm text-emerald-200/80 mb-4 leading-relaxed">
                    <strong>What it means:</strong> {evaluation}
                </p>
                <p className="text-sm text-gray-400">
                    <strong>What to analyze next:</strong> Review your <em>Equity Curve</em> below for sudden drawdowns, and check the <em>Performance Breakdown</em> to see which assets or days are hurting your profitability.
                </p>
            </div>
        </div>
    );
}
