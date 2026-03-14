"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

export default function Credibility() {
  const t = useTranslations("credibility");

  const credibilityItems = [
    {
      title: t("marketSupportTitle"),
      description: t("marketSupportDesc")
    },
    {
      title: t("dataImportsTitle"),
      description: t("dataImportsDesc")
    },
    {
      title: t("statsTitle"),
      description: t("statsDesc")
    }
  ];

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
