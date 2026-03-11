"use client";

import { useRef, useState, DragEvent } from "react";

interface Props {
    onFile: (content: string, fileName: string) => void;
    loading?: boolean;
}

export default function FileUpload({ onFile, loading = false }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    function handleFile(file: File) {
        if (!file.name.toLowerCase().endsWith(".csv")) {
            setError("Solo se aceptan archivos .csv");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("El archivo no puede superar 5 MB");
            return;
        }
        setError(null);
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text === "string") onFile(text, file.name);
        };
        reader.readAsText(file);
    }

    function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }

    function onDrop(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    }

    return (
        <div className="w-full max-w-xl mx-auto">
            {/* Dropzone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 px-8 py-12 text-center"
                style={{
                    borderColor: dragging ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.12)",
                    background: dragging ? "rgba(99,102,241,0.05)" : "rgba(255,255,255,0.02)",
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={onInputChange}
                />

                {/* Icon */}
                <div className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(99,102,241,0.12)" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                </div>

                {fileName ? (
                    <>
                        <p className="text-sm font-medium text-indigo-300 mb-1">
                            ✓ {fileName}
                        </p>
                        <p className="text-xs" style={{ color: "#6b7280" }}>
                            Clic para cambiar archivo
                        </p>
                    </>
                ) : (
                    <>
                        <p className="text-sm font-semibold text-gray-200 mb-1">
                            Arrastrá y soltá tu archivo CSV acá
                        </p>
                        <p className="text-xs mb-3" style={{ color: "#6b7280" }}>
                            o hacé clic para explorar
                        </p>
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                            <span className="badge badge-soon">CSV genérico</span>
                            <span className="badge badge-soon">Export MT5</span>
                        </div>
                    </>
                )}
            </div>

            {/* Format hint */}
            {!fileName && (
                <div className="mt-4 p-4 rounded-lg text-xs space-y-1"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="font-medium text-gray-400 mb-2">Formatos compatibles:</p>
                    <p style={{ color: "#6b7280" }}>
                        <span className="text-indigo-400">MT5:</span> exportá la pestaña &quot;Deals&quot; desde&nbsp;
                        MetaTrader 5 → Historia de Cuenta → clic derecho → Guardar como informe.
                    </p>
                    <p style={{ color: "#6b7280" }}>
                        <span className="text-indigo-400">CSV genérico:</span> cualquier archivo con columnas&nbsp;
                        <code className="text-indigo-300">profit</code> y <code className="text-indigo-300">datetime</code>.
                    </p>
                </div>
            )}

            {/* Error */}
            {error && (
                <p className="mt-3 text-xs text-red-400 text-center">{error}</p>
            )}

            {/* Loading state */}
            {loading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-indigo-300">
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Analizando archivo...
                </div>
            )}
        </div>
    );
}
