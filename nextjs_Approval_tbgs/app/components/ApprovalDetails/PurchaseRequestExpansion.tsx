"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/components/ApprovalDetails/PurchaseRequestExpansion.tsx

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { apiUrl } from "@/lib/config";
import ApprovalDocuments from "./ApprovalDocuments";

interface PurchaseRequestExpansionProps {
    /** The list row (already camelCase). Used while the detail is loading. */
    row: any;
    /** Route slug, e.g. "purchase-request". */
    approvalType: string;
}

const formatDate = (value: any) => {
    if (value === undefined || value === null || value === "") return "-";
    const d = new Date(value);
    return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
};

const text = (value: any) => {
    const s = value === undefined || value === null ? "" : String(value).trim();
    return s === "" ? "-" : s;
};

const statusClass = (status: string) => {
    switch ((status || "PENDING").toUpperCase()) {
        case "APPROVED":
            return "bg-emerald-100 text-emerald-700 border-emerald-200";
        case "REJECTED":
            return "bg-rose-100 text-rose-700 border-rose-200";
        case "HOLD":
            return "bg-indigo-100 text-indigo-700 border-indigo-200";
        default:
            return "bg-amber-100 text-amber-700 border-amber-200";
    }
};

const accentClass = (status: string) => {
    switch ((status || "PENDING").toUpperCase()) {
        case "APPROVED":
            return "border-l-emerald-400";
        case "REJECTED":
            return "border-l-rose-400";
        case "HOLD":
            return "border-l-indigo-400";
        default:
            return "border-l-amber-300";
    }
};

const InfoItem = ({ label, value, className = "" }: { label: string; value: any; className?: string }) => (
    <div className={`min-w-0 ${className}`}>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-[13px] font-semibold text-slate-800 break-words leading-snug">{text(value)}</p>
    </div>
);

const LineField = ({ label, value, className = "" }: { label: string; value: any; className?: string }) => (
    <div className={`min-w-0 ${className}`}>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-[12px] font-semibold text-slate-700 break-words leading-snug">{text(value)}</p>
    </div>
);

const SectionTitle = ({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.14em]">{children}</p>
        {hint}
    </div>
);

/**
 * Full Purchase Request panel shown when a list row is expanded.
 *
 * The list row only carries the header fields, so the lines and the per-level
 * approval trail are fetched lazily from the same detail endpoint the detail
 * page uses. Fetching here (instead of through the redux slice) keeps the
 * globally cached `currentRecord` untouched while a row is expanded.
 *
 * The panel is rendered inside a table cell that is as wide as the whole grid
 * (which is wider than the screen and scrolls horizontally), so the wrapper is
 * pinned to the left of the scroll area and capped to the viewport. Without
 * that, the right-hand cards - and the last line-item columns - sit off-screen.
 */
const PurchaseRequestExpansion = ({ row, approvalType }: PurchaseRequestExpansionProps) => {
    const id = row?.id ?? row?.sno ?? row?.SNO;
    const [detail, setDetail] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(id ? null : "Missing request id");
    // Derived, so the effect never has to synchronously set a loading flag.
    const loading = detail === null && error === null;
    const rootRef = useRef<HTMLDivElement | null>(null);
    const [panelWidth, setPanelWidth] = useState<number | null>(null);

    /* The expansion lives in a table cell that is as wide as the whole grid.
       The grid scrolls horizontally, so a full-width cell would push the right
       half of this panel off-screen. Measure the scroll container instead and
       cap the panel to what the user can actually see. */
    useEffect(() => {
        const scrollParent = rootRef.current?.closest(".overflow-x-auto") as HTMLElement | null;
        if (!scrollParent) return;

        let frame = 0;
        const measure = () => setPanelWidth(Math.max(320, scrollParent.clientWidth - 24));
        const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
        };

        schedule();
        const observer = new ResizeObserver(schedule);
        observer.observe(scrollParent);
        window.addEventListener("resize", schedule);

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            window.removeEventListener("resize", schedule);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        if (!id) return;

        api
            .get(apiUrl(`/approvals/${approvalType}/${id}`))
            .then((response) => {
                if (!cancelled) setDetail(response.data);
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err?.response?.data?.message || err?.message || "Failed to load request details");
                }
            });

        return () => {
            cancelled = true;
        };
    }, [approvalType, id]);

    // Show whatever the list row already has until the detail arrives.
    const data = detail ?? row ?? {};
    const lines: any[] = Array.isArray(data.productLineItems) ? data.productLineItems : [];
    const files: any[] = Array.isArray(data.files) ? data.files : [];
    const overallStatus = String(data.finalResponseStatus || data.statusEntry || "PENDING").toUpperCase();

    const prNumber = data.poRefNo || data.requestRefNo || data.refNo || "-";

    const approvalTrail = [
        {
            title: "Section Head",
            authority: data.sectionHeadPersonName || data.sectionHeadPerson,
            status: data.sectionHeadStatus,
            date: data.sectionHeadDate,
            remarks: data.sectionHeadRemarks,
        },
        {
            title: "First Approval",
            authority: data.response1PersonName || data.response1Person,
            status: data.response1Status,
            date: data.response1Date,
            remarks: data.response1Remarks,
        },
        {
            title: "Second Approval",
            authority: data.response2PersonName || data.response2Person,
            status: data.response2Status,
            date: data.response2Date,
            remarks: data.response2Remarks,
        },
    ];

    return (
        <div
            ref={rootRef}
            style={panelWidth ? { width: `${panelWidth}px` } : undefined}
            className="sticky left-0 w-[calc(100vw-3rem)] max-w-[1400px] rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-5"
        >

            {/* ── Header strip ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.16em] mb-1">
                        Purchase Request
                    </p>
                    <p className="text-[17px] font-black text-slate-900 leading-tight break-words">{prNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                    {loading && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                            Loading details...
                        </span>
                    )}
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border ${statusClass(overallStatus)}`}>
                        {overallStatus}
                    </span>
                </div>
            </div>

            {error && !loading && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 text-[12px] font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error} - showing the list information only.
                </div>
            )}

            {/* ── Header fields ────────────────────────────────────────────── */}
            <div>
                <SectionTitle>Request Information</SectionTitle>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                    <InfoItem label="PR Date" value={formatDate(data.poDate)} />
                    <InfoItem label="Requested By" value={data.requestedBy || data.requestedByName} />
                    <InfoItem label="Requester EMP ID" value={data.empId ? `EMP ${data.empId}` : null} />
                    <InfoItem label="Company" value={data.companyName} />
                    <InfoItem label="Branch" value={data.branchName} />
                    <InfoItem label="Purchase Store" value={data.requestStoreName || data.storeName} />
                    <InfoItem label="Camp" value={data.campName} />
                    <InfoItem label="Delivery Location" value={data.deliveryLocationName} />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 mt-4 pt-4 border-t border-slate-100">
                    <InfoItem label="Request Type" value={data.requestTypeName || data.purchaseType} />
                    <InfoItem label="Priority" value={data.priorityName} />
                    <InfoItem label="Required Date" value={formatDate(data.requiredDate)} />
                    <InfoItem label="Reason" value={data.reason} className="col-span-2 lg:col-span-4" />
                    {data.remarks ? (
                        <InfoItem label="Remarks" value={data.remarks} className="col-span-2 lg:col-span-4" />
                    ) : null}
                </div>
            </div>

            {/* ── Approval trail ───────────────────────────────────────────── */}
            <div>
                <SectionTitle hint={<span className="text-[10px] font-bold text-slate-400">3-level chain</span>}>
                    Approval Trail
                </SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {approvalTrail.map((level, index) => {
                        const status = String(level.status || "PENDING").toUpperCase();
                        return (
                            <div
                                key={level.title}
                                className={`min-w-0 rounded-xl border border-slate-200 border-l-4 ${accentClass(status)} bg-slate-50/40 overflow-hidden`}
                            >
                                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white/70 border-b border-slate-100">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider truncate">
                                        {index + 1}. {level.title}
                                    </p>
                                    <span className={`shrink-0 px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${statusClass(status)}`}>
                                        {status}
                                    </span>
                                </div>
                                <div className="px-3 py-2.5 space-y-2">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Authority</p>
                                        <p className="text-[12px] font-semibold text-slate-800 break-words leading-snug">
                                            {text(level.authority || "Not Assigned")}
                                        </p>
                                    </div>
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Date</p>
                                            <p className="text-[11px] font-semibold text-slate-600">{formatDate(level.date)}</p>
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Remarks</p>
                                        <p className="text-[11px] font-medium text-slate-600 italic break-words leading-snug">
                                            {text(level.remarks || "No remarks provided")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Request lines (card layout: nothing is cut off) ──────────── */}
            <div>
                <SectionTitle
                    hint={
                        <span className="text-[10px] font-bold text-slate-400">
                            {lines.length} {lines.length === 1 ? "line" : "lines"}
                        </span>
                    }
                >
                    Request Lines
                </SectionTitle>

                {lines.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-[12px] font-semibold text-slate-400">
                        {loading ? "Loading request lines..." : "No request lines found."}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {lines.map((item: any, index: number) => (
                            <div key={item.id ?? index} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/30 overflow-hidden">
                                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-white/70 border-b border-slate-100">
                                    <p className="text-[12px] font-black text-slate-800 break-words">
                                        <span className="text-slate-400 mr-1.5">#{item.lineNo ?? index + 1}</span>
                                        {text(item.productName)}
                                    </p>
                                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-700 uppercase">
                                        {text(item.totalQuantity)} {item.uomName ? String(item.uomName) : ""}
                                    </span>
                                </div>
                                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                                    <LineField label="Description" value={item.description} className="col-span-2 sm:col-span-3" />
                                    <LineField
                                        label="Category"
                                        value={[item.mainCategoryName, item.subCategoryName].filter(Boolean).join(" / ")}
                                    />
                                    <LineField
                                        label="Reference"
                                        value={[item.referenceTypeName, item.referenceNo].filter(Boolean).join(" ")}
                                    />
                                    <LineField label="Pcs / Packing" value={item.noOfPcsPerPacking} />
                                    <LineField label="Total Packing" value={item.totalPacking} />
                                    <LineField label="Truck" value={item.truckNo} />
                                    <LineField label="Required Date" value={formatDate(item.requiredDate)} />
                                    <LineField label="Reason" value={item.reason} className="col-span-2 sm:col-span-3" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Attached documents ───────────────────────────────────────── */}
            <div>
                <SectionTitle
                    hint={
                        <span className="text-[10px] font-bold text-slate-400">
                            {files.length} {files.length === 1 ? "document" : "documents"}
                        </span>
                    }
                >
                    Documents / Attachments
                </SectionTitle>
                <ApprovalDocuments
                    files={files}
                    loading={loading}
                    emptyMessage="No documents were attached to this request."
                />
            </div>
        </div>
    );
};

export default PurchaseRequestExpansion;
