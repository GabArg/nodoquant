export default function Testimonials() {
    const testimonials = [
        {
            quote: "This helped me realize my strategy had negative expectancy. I fixed my risk management and everything changed.",
            author: "Carlos M. — Forex Trader (5 years exp.)",
            icon: "C"
        },
        {
            quote: "The equity curve analysis alone is worth it. I had never measured my strategy properly before.",
            author: "Elena R. — Prop Firm Trader",
            icon: "E"
        },
        {
            quote: "I thought I had an edge. NodoQuant showed me the truth.",
            author: "David S. — Crypto Day Trader",
            icon: "D"
        }
    ];

    return (
        <section className="py-[80px] border-t border-white/5" id="testimonials">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                        What Traders Are Saying
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((t, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors flex flex-col justify-between">
                            <p className="text-gray-300 font-medium leading-relaxed mb-8">
                                "{t.quote}"
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                                    {t.icon}
                                </div>
                                <span className="text-sm text-gray-400 uppercase tracking-widest font-semibold">
                                    — {t.author}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
