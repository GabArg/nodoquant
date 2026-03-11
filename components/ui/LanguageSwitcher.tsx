"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const switchLocale = (newLocale: string) => {
        router.replace(pathname, { locale: newLocale });
    };

    return (
        <div className="flex items-center gap-2 text-sm font-medium">
            <button
                onClick={() => switchLocale("en")}
                className={`px-2 py-1 rounded transition-colors ${locale === "en" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                    }`}
            >
                EN
            </button>
            <span className="text-gray-700">|</span>
            <button
                onClick={() => switchLocale("es")}
                className={`px-2 py-1 rounded transition-colors ${locale === "es" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                    }`}
            >
                ES
            </button>
        </div>
    );
}
