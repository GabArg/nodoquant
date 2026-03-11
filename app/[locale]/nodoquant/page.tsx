import type { Metadata } from "next";
import Hero from "@/components/nodoquant/Hero";
import SupportedPlatforms from "@/components/nodoquant/SupportedPlatforms";
import WhyQuant from "@/components/nodoquant/WhyQuant";
import StrategyScoreSection from "@/components/nodoquant/StrategyScoreSection";
import HowItWorks from "@/components/nodoquant/HowItWorks";
import SampleReport from "@/components/nodoquant/SampleReport";
import FAQ from "@/components/nodoquant/FAQ";
import FinalCTA from "@/components/nodoquant/FinalCTA";
import FooterNote from "@/components/nodoquant/FooterNote";

// Page level metadata is inherited from app/[locale]/layout.tsx

export default function NodoQuantPage() {
    return (
        <div className="min-h-screen">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        name: "NodoQuant",
                        applicationCategory: "FinanceApplication",
                        description: "Quantitative strategy analysis platform for traders.",
                        operatingSystem: "Web",
                    }),
                }}
            />
            <Hero />
            <SupportedPlatforms />
            <WhyQuant />
            <StrategyScoreSection />
            <HowItWorks />
            <SampleReport />
            <FAQ />
            <FinalCTA />
            <FooterNote />
        </div>
    );
}
