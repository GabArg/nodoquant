"use client";

import React from "react";
import { toPng } from "html-to-image";
import { trackEvent } from "@/lib/analytics";

interface CertificateActionsProps {
    report_id: string;
    score: number;
    winrate: number;
    pf: number;
    trades: number;
    locale: string;
}

export default function CertificateActions({ report_id, score, winrate, pf, trades, locale }: CertificateActionsProps) {
    const shareUrl = `https://nodoquant.com/${locale}/certificate/${report_id}`;
    const shareText = `My trading strategy scored ${Math.round(score)}/100 on NodoQuant.\n\nWin Rate: ${winrate.toFixed(1)}%\nProfit Factor: ${pf.toFixed(2)}\nTrades analyzed: ${trades}\n\nAnalyze your strategy:\nhttps://nodoquant.com/analyzer`;

    const handleDownload = async () => {
        const node = document.getElementById("certificate-content");
        if (!node) return;

        try {
            const dataUrl = await toPng(node, {
                quality: 1,
                pixelRatio: 2,
                width: 1200,
                height: 630
            });
            const link = document.createElement("a");
            link.download = `nodoquant-certificate-${report_id.slice(0, 8)}.png`;
            link.href = dataUrl;
            link.click();

            trackEvent('certificate_share', { platform: "download", report_id });
            console.log("Analytics event: certificate_download", { report_id });
        } catch (err) {
            console.error("Oops, something went wrong!", err);
        }
    };

    const shareOnX = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(url, "_blank");
        trackEvent('certificate_share', { platform: "X", report_id });
        console.log("Analytics event: certificate_share", { platform: "X", report_id });
    };

    const shareOnReddit = () => {
        const url = `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`My strategy scored ${Math.round(score)}/100 on NodoQuant`)}`;
        window.open(url, "_blank");
        trackEvent('certificate_share', { platform: "Reddit", report_id });
        console.log("Analytics event: certificate_share", { platform: "Reddit", report_id });
    };

    const copyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
        trackEvent('certificate_share', { platform: "copy_link", report_id });
        console.log("Analytics event: certificate_share", { platform: "copy_link", report_id });
    };

    return (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
            <button
                onClick={handleDownload}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center gap-3"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PNG
            </button>

            <button
                onClick={shareOnX}
                className="bg-black hover:bg-black/80 text-white px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all border border-white/10 active:scale-95 flex items-center gap-3"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.843L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X / Twitter
            </button>

            <button
                onClick={shareOnReddit}
                className="bg-[#FF4500] hover:brightness-110 text-white px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .89.182 1.207.491 1.207-.856 2.853-1.415 4.674-1.488l.82-3.818a.303.303 0 0 1 .37-.234l2.848.601c.21-.295.556-.491.948-.491zM9.23 12.51c-.657 0-1.188.542-1.188 1.2a1.191 1.191 0 0 0 1.187 1.2c.658 0 1.188-.543 1.188-1.2 0-.658-.53-1.2-1.188-1.2zm5.54 0c-.658 0-1.188.542-1.188 1.2 0 .658.53 1.2 1.188 1.2a1.191 1.191 0 0 0 1.187-1.2c0-.658-.53-1.2-1.187-1.2zm-5.46 3.633a.142.142 0 0 0-.012.019c-.1.144-.124.364.043.483a5.57 5.57 0 0 0 2.659.814 5.57 5.57 0 0 0 2.659-.814.126.126 0 0 0 .043-.483.333.333 0 0 0-.012-.019.167.167 0 0 0-.204-.05c-.11.04-.977.346-2.486.346-1.51 0-2.376-.306-2.486-.346a.167.167 0 0 0-.204.05z" />
                </svg>
                Reddit
            </button>

            <button
                onClick={copyLink}
                className="bg-white/5 hover:bg-white/10 text-gray-400 px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all border border-white/5 active:scale-95 flex items-center gap-3"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy Link
            </button>
        </div>
    );
}
