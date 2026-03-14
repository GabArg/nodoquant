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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-12 gap-y-12 items-center justify-items-center">
        {brokers.map((broker) => (
          <div key={broker.name} className="flex items-center justify-center w-full h-12 transition-all duration-500 transform hover:scale-110">
            <img
              src={broker.logo}
              alt={broker.name}
              className={`max-h-full w-auto object-contain ${broker.name === 'OANDA' ? 'max-w-[120px]' : 'max-w-[140px]'}`}
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
