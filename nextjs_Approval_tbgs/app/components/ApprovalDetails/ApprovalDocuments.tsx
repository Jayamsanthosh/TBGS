"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/components/ApprovalDetails/ApprovalDocuments.tsx

import React, { useEffect, useState } from "react";
import { Download, Eye, FileImage, FileText, Loader2, X } from "lucide-react";
import api from "@/lib/axios";
import { apiUrl } from "@/lib/config";

/** Shape returned by the approval detail endpoint inside `files`. */
export interface ApprovalDocument {
    id?: number;
    dmsId?: number;
    fileName?: string;
    documentType?: string;
    description?: string;
    contentType?: string;
    remarks?: string;
    status?: string;
    pageRefNo?: string;
    uploadedBy?: string;
    uploadedDate?: string | null;
}

interface ApprovalDocumentsProps {
    files: ApprovalDocument[];
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
}

interface ViewerState {
    url: string;
    name: string;
    contentType: string;
}

const documentId = (doc: ApprovalDocument): number => {
    const raw = doc?.dmsId ?? doc?.id ?? (doc as any)?.DMS_ID;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : 0;
};

const formatDate = (value: any) => {
    if (value === undefined || value === null || value === "") return "";
    const d = new Date(value);
    return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
};

const humanSize = (bytes: any) => {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n <= 0) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

const saveBlob = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
};

/**
 * Read-only attachment list for the approval screens.
 *
 * The approval app has no DMS permission of its own, so files come through the
 * approval-scoped endpoint as a raw blob. Viewing happens in a modal on this
 * page rather than in a new tab: the fetch is asynchronous, so `window.open`
 * would run outside the click gesture and be treated as a popup.
 */
const ApprovalDocuments = ({ files, loading = false, emptyMessage, className = "" }: ApprovalDocumentsProps) => {
    const [busyId, setBusyId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [viewer, setViewer] = useState<ViewerState | null>(null);

    // Revoke the object URL when the preview closes (or the list unmounts).
    useEffect(() => {
        return () => {
            if (viewer?.url) URL.revokeObjectURL(viewer.url);
        };
    }, [viewer]);

    useEffect(() => {
        if (!viewer) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setViewer(null);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [viewer]);

    const fetchBlob = async (doc: ApprovalDocument): Promise<{ blob: Blob; url: string; name: string; contentType: string }> => {
        const id = documentId(doc);
        if (!id) throw new Error("This attachment has no stored file.");

        setBusyId(id);
        setError(null);
        try {
            const response = await api.get(apiUrl(`/approvals/files/${id}`), { responseType: "blob" });
            const contentType =
                doc.contentType ||
                (response.headers?.["content-type"] as string | undefined) ||
                "application/octet-stream";
            const blob = new Blob([response.data], { type: contentType });
            return {
                blob,
                url: URL.createObjectURL(blob),
                name: doc.fileName || `document-${id}`,
                contentType,
            };
        } catch (err: any) {
            const status = err?.response?.status;
            throw new Error(
                status === 404
                    ? "Document not found - it may have been removed after submission."
                    : err?.response?.data?.message || err?.message || "Failed to load the document."
            );
        } finally {
            setBusyId(null);
        }
    };

    const openDocument = async (doc: ApprovalDocument) => {
        try {
            const file = await fetchBlob(doc);
            setViewer({ url: file.url, name: file.name, contentType: file.contentType });
        } catch (err: any) {
            setError(err?.message || "Failed to load the document.");
        }
    };

    const downloadDocument = async (doc: ApprovalDocument) => {
        try {
            const file = await fetchBlob(doc);
            saveBlob(file.url, file.name);
            setTimeout(() => URL.revokeObjectURL(file.url), 5_000);
        } catch (err: any) {
            setError(err?.message || "Failed to load the document.");
        }
    };

    return (
        <div className={className}>
            {error && (
                <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">
                    {error}
                </div>
            )}

            {loading && files.length === 0 ? (
                <div className="space-y-2">
                    {[0, 1].map((i) => (
                        <div key={i} className="h-14 rounded-xl border border-slate-200 bg-slate-50/60 animate-pulse" />
                    ))}
                </div>
            ) : files.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-5 text-center text-[12px] font-semibold text-slate-400">
                    {emptyMessage || "No documents attached."}
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                    {files.map((doc, index) => {
                        const id = documentId(doc);
                        const busy = busyId === id;
                        const isImage = String(doc.contentType || "").startsWith("image/");
                        const Icon = isImage ? FileImage : FileText;
                        const uploaded = [doc.uploadedBy, formatDate(doc.uploadedDate)].filter(Boolean).join(" · ");
                        const size = humanSize((doc as any).size ?? (doc as any).fileSize);
                        const name = doc.fileName || `Document ${index + 1}`;

                        return (
                            <div
                                key={id || `${doc.fileName}-${index}`}
                                className="min-w-0 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2.5"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="shrink-0 w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                                        <Icon className="w-4 h-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[12px] font-bold text-slate-800 break-words leading-snug">{name}</p>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-semibold text-slate-400">
                                            {doc.documentType && <span className="uppercase tracking-wide">{doc.documentType}</span>}
                                            {doc.contentType && <span>{doc.contentType}</span>}
                                            {size && <span>{size}</span>}
                                            {uploaded && <span>{uploaded}</span>}
                                        </div>
                                        {doc.description && (
                                            <p className="mt-0.5 text-[10px] text-slate-500 italic break-words">{doc.description}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="shrink-0 flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => openDocument(doc)}
                                        disabled={busy || !id}
                                        title="View document"
                                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-violet-700 hover:border-violet-200 transition-colors disabled:opacity-40"
                                    >
                                        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => downloadDocument(doc)}
                                        disabled={busy || !id}
                                        title="Download document"
                                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-indigo-700 hover:border-indigo-200 transition-colors disabled:opacity-40"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {viewer && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={viewer.name}
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/70 p-4"
                    onClick={() => setViewer(null)}
                >
                    <div
                        className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                            <div className="min-w-0">
                                <p className="truncate text-[13px] font-bold text-slate-800">{viewer.name}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    {viewer.contentType}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => saveBlob(viewer.url, viewer.name)}
                                    title="Download document"
                                    className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-indigo-200 hover:text-indigo-700"
                                >
                                    <Download className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewer(null)}
                                    title="Close preview"
                                    className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-rose-200 hover:text-rose-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto bg-slate-100">
                            {viewer.contentType.startsWith("image/") ? (
                                <div className="flex min-h-full items-center justify-center p-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={viewer.url} alt={viewer.name} className="max-h-full max-w-full object-contain" />
                                </div>
                            ) : viewer.contentType === "application/pdf" ? (
                                <iframe src={viewer.url} title={viewer.name} className="h-full w-full border-0 bg-white" />
                            ) : (
                                <div className="flex min-h-full flex-col items-center justify-center gap-3 p-8 text-center">
                                    <FileText className="h-10 w-10 text-slate-400" />
                                    <p className="text-[13px] font-semibold text-slate-600">
                                        This file type cannot be previewed here.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => saveBlob(viewer.url, viewer.name)}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-bold text-white hover:bg-indigo-700"
                                    >
                                        Download file
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalDocuments;
