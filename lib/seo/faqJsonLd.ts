/** Builds a JSON-LD FAQ schema script tag for structured data (Google rich results) */
export function faqJsonLd(faqs: { q: string; a: string }[]): string {
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
    });
}
