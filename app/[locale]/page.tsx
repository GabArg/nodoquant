import type { Metadata } from "next";
import Hero from "@/components/nodoquant/Hero";
import Credibility from "@/components/nodoquant/Credibility";
import SocialProof from "@/components/nodoquant/SocialProof";

import SupportedPlatforms from "@/components/nodoquant/SupportedPlatforms";
import WhyQuant from "@/components/nodoquant/WhyQuant";
import StrategyScoreSection from "@/components/nodoquant/StrategyScoreSection";
import HowItWorks from "@/components/nodoquant/HowItWorks";
import SampleReport from "@/components/nodoquant/SampleReport";
import Testimonials from "@/components/nodoquant/Testimonials";
import FAQ from "@/components/nodoquant/FAQ";
import FinalCTA from "@/components/nodoquant/FinalCTA";
import FooterNote from "@/components/nodoquant/FooterNote";

export default function Home() {
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
            <Credibility />
            <SampleReport />

            <SupportedPlatforms />
            <HowItWorks />
            <SocialProof />
            <WhyQuant />
            <StrategyScoreSection />
            <Testimonials />
            <FAQ />
            <FinalCTA />
            <FooterNote />
        </div>
    );
}
