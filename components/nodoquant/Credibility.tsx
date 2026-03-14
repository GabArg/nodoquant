"use client";

import React from 'react';

const credibilityItems = [
  {
    title: "Multi-market support",
    description: "Forex • Crypto • Futures • Stocks"
  },
  {
    title: "Flexible data imports",
    description: "MT4 • MT5 • CSV • Exchange exports"
  },
  {
    title: "Advanced statistical analysis",
    description: "Edge • Expectancy • Drawdown • Monte Carlo"
  }
];

export default function Credibility() {
  return (
    <section className="py-14 border-y border-white/[0.03]">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          {credibilityItems.map((item, index) => (
            <div key={index} className="flex flex-col gap-2">
              <h4 className="text-lg font-semibold">
                {item.title}
              </h4>
              <p className="text-sm opacity-70">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
