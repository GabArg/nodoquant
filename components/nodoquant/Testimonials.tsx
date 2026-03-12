import { useTranslations } from "next-intl";

export default function Testimonials() {
    const t = useTranslations("testimonials");

    const testimonials = [
        {
            num: 1,
            author: "Carlos M.",
            role: "Forex Trader — 5 years",
            icon: "C"
        },
        {
            num: 2,
            author: "Elena R.",
            role: "Prop Firm Trader",
            icon: "E"
        },
        {
            num: 3,
            author: "David S.",
            role: "Crypto Day Trader",
            icon: "D"
        }
    ];

    return (
        <section className="py-[120px] border-t border-white/[0.03] bg-[#050505]" id="testimonials">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20 animate-fade-in text-balance">
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                        {t("title")}
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((test) => (
                        <div key={test.num} className="bg-white/[0.02] border border-white/[0.05] rounded-[40px] p-10 hover:bg-white/[0.04] transition-all duration-500 group relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/0 group-hover:bg-indigo-500/20 transition-all" />
                            
                            <p className="text-gray-300 font-medium leading-relaxed mb-10 text-lg italic">
                                "{t(`t${test.num}_quote`)}"
                            </p>
                            
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xl shadow-[0_0_15px_rgba(99,102,241,0.1)] group-hover:scale-110 transition-transform">
                                    {test.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base text-white font-bold tracking-tight">
                                        {test.author}
                                    </span>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">
                                        {test.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
