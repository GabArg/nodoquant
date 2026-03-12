"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
    initialNotes: string;
    reportId: string;
    canEdit: boolean;
}

export default function StrategyJournal({ initialNotes, reportId, canEdit }: Props) {
    const t = useTranslations("fullReport.journal");
    const [notes, setNotes] = useState(initialNotes || "");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        if (!canEdit) return;
        setSaving(true);
        setSaved(false);
        try {
            const res = await fetch(`/api/report/${reportId}/note`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes }),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (e) {
            console.error("Failed to save notes:", e);
        } finally {
            setSaving(false);
        }
    };

    if (!canEdit && !initialNotes) {
        return null; // Don't show anything if anonymous and no notes
    }

    return (
        <div className="mt-12 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">{t("title")}</h2>
            <div className="bg-[#111118] border border-white/5 p-6 rounded-2xl">
                {!canEdit ? (
                    <div className="text-sm text-gray-300 whitespace-pre-wrap">
                        {notes}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <textarea
                            className="w-full bg-transparent border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 min-h-[120px] transition-colors resize-y"
                            placeholder={t("placeholder")}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                        <div className="flex items-center justify-end gap-3">
                            {saved && <span className="text-xs text-emerald-400">{t("saved")}</span>}
                            <button
                                className="px-6 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2"
                                style={{ background: "#4f46e5" }}
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? t("saving") : t("save")}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
