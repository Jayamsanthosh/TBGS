"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/components/ApprovalDetails/ApprovalDocuments.tsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    AlertCircle,
    Download,
    ExternalLink,
    Eye,
    FileImage,
    FileText,
    Loader2,
    X,
} from "lucide-react";
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
    size?: number;
    fileSize?: number;
}

interface ApprovalDocumentsProps {
    files: ApprovalDocument[];
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
}

interface ViewerState {
    name: string;
    contentType: string;
    documentType?: string;
    size: number;
    uploaded: string;
    url: string | null;
    loading: boolean;
    error: string | null;
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

const docSize = (doc: ApprovalDocument): number => {
    const n = Number(doc?.size ?? doc?.fileSize ?? (doc as any)?.file_size ?? 0);
    return Number.isFinite(n) && n > 0 ? n : 0;
};

const humanSize = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const documentType = (doc: ApprovalDocument): string => {
    const declared = String(doc?.contentType || "").trim().toLowerCase();
    if (declared) return declared;
    const name = String(doc?.fileName || "").toLowerCase();
    if (name.endsWith(".pdf")) return "application/pdf";
    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) return "image/*";
    return "application/octet-stream";
};

const typeLabel = (doc: ApprovalDocument): string => {
    const type = documentType(doc);
    if (type === "application/pdf") return "PDF";
    if (type.startsWith("image/")) return "IMAGE";
    const ext = String(doc?.fileName || "").split(".").pop();
    if (ext && ext.length <= 5 && ext !== doc?.fileName) return ext.toUpperCase();
    return "FILE";
};

const fileNameOf = (doc: ApprovalDocument, fallbackIndex = 0): string =>
    doc?.fileName || `Document ${fallbackIndex + 1}`;

const withExtension = (name: string, contentType: string): string => {
    if (/\.[a-z0-9]{2,5}$/i.test(name)) return name;
    if (contentType === "application/pdf") return `${name}.pdf`;
    if (contentType === "image/png") return `${name}.png`;
    if (contentType === "image/jpeg") return `${name}.jpg`;
    return name;
};

const saveBlob = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
};

const typeTone = (doc: ApprovalDocument): string => {
    const type = documentType(doc);
    if (type === "application/pdf") return "bg-rose-50 text-rose-600 border-rose-100";
    if (type.startsWith("image/")) return "bg-violet-50 text-violet-600 border-violet-100";
    return "bg-slate-50 text-slate-500 border-slate-200";
};

/**
 * Read-only attachment list for the approval screens.
 *
 * The approval app has no DMS permission of its own, so files come through the
 * approval-scoped endpoint as a raw blob. Viewing happens in a portal-rendered
 * modal (rendered on document.body so the fixed overlay is never trapped by a
 * transformed/faded ancestor) rather than in a new tab: the fetch is async, so
 * `window.open` would run outside the click gesture and be treated as a popup.
 */
const ApprovalDocuments = ({ files, loading = false, emptyMessage, className = "" }: ApprovalDocumentsProps) => {
    const [busyId, setBusyId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [viewer, setViewer] = useState<ViewerState | null>(null);

    const viewerOpenRef = useRef(false);
    const viewerUrlRef = useRef<string | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);

    const releaseViewerUrl = useCallback(() => {
        if (viewerUrlRef.current) {
            URL.revokeObjectURL(viewerUrlRef.current);
            viewerUrlRef.current = null;
        }
    }, []);

    const closeViewer = useCallback(() => {
        viewerOpenRef.current = false;
        releaseViewerUrl();
        setViewer(null);
    }, [releaseViewerUrl]);

    useEffect(() => () => releaseViewerUrl(), [releaseViewerUrl]);

    useEffect(() => {
        if (!viewer) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeViewer();
        };
        window.addEventListener("keydown", onKeyDown);
        closeButtonRef.current?.focus();

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [viewer, closeViewer]);

    const loadBlob = useCallback(async (doc: ApprovalDocument): Promise<{ url: string; name: string; contentType: string }> => {
        const id = documentId(doc);
        if (!id) throw new Error("This attachment has no stored file.");

        try {
            const response = await api.get(apiUrl(`/approvals/files/${id}`), { responseType: "blob" });
            const contentType = documentType(doc) || "application/octet-stream";
            const blob = new Blob([response.data], { type: contentType });
            return {
                url: URL.createObjectURL(blob),
                name: withExtension(fileNameOf(doc), contentType),
                contentType,
            };
        } catch (err: any) {
            const status = err?.response?.status;
            throw new Error(
                status === 404
                    ? "Document not found - it may have been removed after submission."
                    : err?.response?.data?.message || err?.message || "Failed to load the document."
            );
        }
    }, []);

    const openDocument = useCallback(async (doc: ApprovalDocument, index: number) => {
        const id = documentId(doc);
        const contentType = documentType(doc);
        const name = fileNameOf(doc, index);

        if (!id) {
            setError("This attachment has no stored file.");
            return;
        }

        setError(null);
        releaseViewerUrl();
        viewerOpenRef.current = true;
        setViewer({
            name,
            contentType,
            documentType: doc.documentType,
            size: docSize(doc),
            uploaded: [doc.uploadedBy, formatDate(doc.uploadedDate)].filter(Boolean).join(" | "),
            url: null,
            loading: true,
            error: null,
        });

        setBusyId(id);
        try {
            const file = await loadBlob(doc);
            if (!viewerOpenRef.current) {
                URL.revokeObjectURL(file.url);
                return;
            }
            viewerUrlRef.current = file.url;
            setViewer((prev) => (prev ? { ...prev, url: file.url, name: file.name, loading: false } : prev));
        } catch (err: any) {
            const message = err?.message || "Failed to load the document.";
            if (viewerOpenRef.current) {
                setViewer((prev) => (prev ? { ...prev, loading: false, error: message } : prev));
            }
        } finally {
            setBusyId(null);
        }
    }, [loadBlob, releaseViewerUrl]);

    const downloadDocument = useCallback(async (doc: ApprovalDocument) => {
        setError(null);
        setBusyId(documentId(doc));
        try {
            const file = await loadBlob(doc);
            saveBlob(file.url, file.name);
            setTimeout(() => URL.revokeObjectURL(file.url), 5_000);
        } catch (err: any) {
            setError(err?.message || "Failed to load the document.");
        } finally {
            setBusyId(null);
        }
    }, [loadBlob]);

    const isImage = viewer ? viewer.contentType.startsWith("image/") : false;
    const isPdf = viewer ? viewer.contentType === "application/pdf" || /\.pdf$/i.test(viewer.name) : false;
    const viewerSize = viewer ? humanSize(viewer.size) : "";
    const viewerMeta = [
        viewer?.documentType ? String(viewer.documentType).toUpperCase() : typeLabel({ fileName: viewer?.name, contentType: viewer?.contentType }),
        viewerSize,
        viewer?.uploaded,
    ].filter(Boolean).join("  |  ");

    return (
        <div className={className}>
            {error && (
                <div className="mb-2 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {loading && files.length === 0 ? (
                <div className="space-y-2">
                    {[0, 1].map((i) => (
                        <div key={i} className="h-16 rounded-xl border border-slate-200 bg-slate-50/60 animate-pulse" />
                    ))}
                </div>
            ) : files.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-[12px] font-semibold text-slate-400">
                    {emptyMessage || "No documents attached."}
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                    {files.map((doc, index) => {
                        const id = documentId(doc);
                        const busy = busyId === id;
                        const image = documentType(doc).startsWith("image/");
                        const Icon = image ? FileImage : FileText;
                        const meta = [
                            typeLabel(doc),
                            humanSize(docSize(doc)),
                            [doc.uploadedBy, formatDate(doc.uploadedDate)].filter(Boolean).join(" | "),
                        ].filter(Boolean).join("  |  ");

                        return (
                            <div
                                key={id || `${doc.fileName}-${index}`}
                                className="group min-w-0 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2.5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                            >
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${typeTone(doc)}`}>
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="break-words text-[12.5px] font-bold leading-snug text-slate-800">{fileNameOf(doc, index)}</p>
                                        {meta && (
                                            <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">{meta}</p>
                                        )}
                                        {doc.description && (
                                            <p className="mt-0.5 line-clamp-2 break-words text-[10px] italic text-slate-500">{doc.description}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => openDocument(doc, index)}
                                        disabled={busy || !id}
                                        title="View document"
                                        aria-label={`View ${fileNameOf(doc, index)}`}
                                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-40"
                                    >
                                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => downloadDocument(doc)}
                                        disabled={busy || !id}
                                        title="Download document"
                                        aria-label={`Download ${fileNameOf(doc, index)}`}
                                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-40"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {viewer && createPortal(
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="approval-doc-viewer-title"
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-6"
                    onClick={closeViewer}
                >
                    <div
                        className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)] sm:h-[92vh] sm:rounded-3xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${isImage ? "border-violet-100 bg-violet-50 text-violet-600" : "border-rose-100 bg-rose-50 text-rose-600"}`}>
                                    {isImage ? <FileImage className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                </span>
                                <div className="min-w-0">
                                    <p id="approval-doc-viewer-title" className="truncate text-[13px] font-black text-slate-900">{viewer.name}</p>
                                    <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">{viewerMeta}</p>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-1.5">
                                {viewer.url && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => window.open(viewer.url as string, "_blank", "noopener,noreferrer")}
                                            title="Open in new tab"
                                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-[11px] font-bold text-slate-600 transition-colors hover:border-indigo-200 hover:text-indigo-700"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">Open</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => saveBlob(viewer.url as string, viewer.name)}
                                            title="Download document"
                                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-[11px] font-bold text-slate-600 transition-colors hover:border-indigo-200 hover:text-indigo-700"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">Download</span>
                                        </button>
                                    </>
                                )}
                                <span className="mx-0.5 h-5 w-px bg-slate-200" />
                                <button
                                    ref={closeButtonRef}
                                    type="button"
                                    onClick={closeViewer}
                                    title="Close preview"
                                    aria-label="Close preview"
                                    className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-rose-200 hover:text-rose-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="relative flex-1 overflow-auto bg-slate-100">
                            {viewer.loading ? (
                                <div className="flex h-full flex-col items-center justify-center gap-3 bg-white">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Loading document...</p>
                                </div>
                            ) : viewer.error ? (
                                <div className="flex h-full flex-col items-center justify-center gap-3 bg-white p-8 text-center">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-500">
                                        <AlertCircle className="h-6 w-6" />
                                    </span>
                                    <p className="text-[13px] font-semibold text-slate-700">{viewer.error}</p>
                                </div>
                            ) : viewer.url && isImage ? (
                                <div className="flex min-h-full items-center justify-center bg-[radial-gradient(circle_at_center,_#f8fafc,_#eef2f7)] p-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={viewer.url}
                                        alt={viewer.name}
                                        className="max-h-[calc(94vh-9rem)] w-auto max-w-full rounded-lg border border-slate-200 bg-white object-contain shadow-sm"
                                    />
                                </div>
                            ) : viewer.url && isPdf ? (
                                <iframe
                                    src={`${viewer.url}#view=FitH&navpanes=0`}
                                    title={viewer.name}
                                    className="h-full w-full border-0 bg-white"
                                />
                            ) : viewer.url ? (
                                <div className="flex h-full flex-col items-center justify-center gap-3 bg-white p-8 text-center">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                                        <FileText className="h-6 w-6" />
                                    </span>
                                    <p className="text-[13px] font-semibold text-slate-600">This file type cannot be previewed here.</p>
                                    <p className="text-[11px] text-slate-400">Download it or open it in a new tab to view the contents.</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => window.open(viewer.url as string, "_blank", "noopener,noreferrer")}
                                            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            Open
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => saveBlob(viewer.url as string, viewer.name)}
                                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-bold text-white hover:bg-indigo-700"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ApprovalDocuments;
