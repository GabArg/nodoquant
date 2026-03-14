"use client";

import React from 'react';
import { brokers } from '@/data/brokers';

export default function BrokerLogos() {
  return (
    <section className="max-w-6xl mx-auto py-16 px-4">
      <div className="mb-14 text-center">
        <h3 className="text-lg md:text-xl font-medium text-muted-foreground mb-3">
          Compatible with 100+ brokers and trading platforms
        </h3>
        <p className="text-sm opacity-70">
          MetaTrader • cTrader • Binance • Bybit • Interactive Brokers
        </p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-x-10 gap-y-8 items-center justify-items-center">
        {brokers.map((broker) => (
          <div key={broker.name} className="flex items-center justify-center">
            <img
              src={broker.logo}
              alt={broker.name}
              className="h-[34px] md:h-[46px] w-auto opacity-80 hover:opacity-100 transition duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
