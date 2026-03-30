import Hero from "@/components/nodoquant/Hero";
import SupportedPlatforms from "@/components/nodoquant/SupportedPlatforms";
import StrategyScoreSection from "@/components/nodoquant/StrategyScoreSection";
import HowItWorks from "@/components/nodoquant/HowItWorks";
import SampleReport from "@/components/nodoquant/SampleReport";
import WhyItMatters from "@/components/nodoquant/WhyItMatters";
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
            <SampleReport />
            <HowItWorks />
            <SupportedPlatforms />
            <WhyItMatters />
            <StrategyScoreSection />
            <FAQ />
            <FinalCTA />
            <FooterNote />
        </div>
    );
}
