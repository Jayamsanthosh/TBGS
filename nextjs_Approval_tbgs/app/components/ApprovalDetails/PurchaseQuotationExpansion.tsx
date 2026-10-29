"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/components/ApprovalDetails/PurchaseQuotationExpansion.tsx

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { apiUrl } from "@/lib/config";
import ApprovalDocuments from "./ApprovalDocuments";

interface PurchaseQuotationExpansionProps {
    /** The list row (already camelCase). Used while the detail is loading. */
    row: any;
    /** Route slug, e.g. "purchase-quotation". */
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

const isBlank = (value: any) =>
    value === undefined || value === null || String(value).trim() === "";

const fmtMoney = (value: any) => {
    if (isBlank(value) || isNaN(Number(value))) return "-";
    return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const fmtNumber = (value: any) => {
    if (isBlank(value) || isNaN(Number(value))) return "-";
    return Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 });
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

const MoneyTile = ({
    label,
    value,
    secondary,
    currency,
    emphasis = false,
}: {
    label: string;
    value: any;
    secondary?: any;
    currency?: string;
    emphasis?: boolean;
}) => (
    <div
        className={`min-w-0 rounded-xl border px-3 py-2.5 ${
            emphasis ? "border-violet-200 bg-violet-50/60" : "border-slate-200 bg-slate-50/40"
        }`}
    >
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-[14px] font-black break-words leading-tight ${emphasis ? "text-violet-800" : "text-slate-800"}`}>
            {fmtMoney(value)}
            {!isBlank(value) && currency ? <span className="ml-1 text-[10px] font-bold text-slate-400">{currency}</span> : null}
        </p>
        {!isBlank(secondary) ? (
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5 break-words">
                LC {fmtMoney(secondary)}
            </p>
        ) : null}
    </div>
);

/**
 * Full Purchase Quotation panel shown when a list row is expanded.
 *
 * The list row only carries the header fields, so the lines, additional charges
 * and the per-level approval trail are fetched lazily from the same detail
 * endpoint the detail page uses. Fetching here (instead of through the redux
 * slice) keeps the globally cached `currentRecord` untouched while a row is
 * expanded.
 *
 * The panel is rendered inside a table cell that is as wide as the whole grid
 * (which is wider than the screen and scrolls horizontally), so the wrapper is
 * pinned to the left of the scroll area and capped to the viewport. Without
 * that, the right-hand cards - and the last line-item fields - sit off-screen.
 *
 * Quotation lines are cards rather than a wide table on purpose: a quotation
 * line has rate, discount, tax and both FC/LC money columns, and a table that
 * wide is exactly what gets clipped inside the scroll area.
 */
const PurchaseQuotationExpansion = ({ row, approvalType }: PurchaseQuotationExpansionProps) => {
    const id = row?.id ?? row?.sno ?? row?.SNO;
    const [detail, setDetail] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(id ? null : "Missing quotation id");
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
                    setError(err?.response?.data?.message || err?.message || "Failed to load quotation details");
                }
            });

        return () => {
            cancelled = true;
        };
    }, [approvalType, id]);

    // Show whatever the list row already has until the detail arrives.
    const data = detail ?? row ?? {};
    const lines: any[] = Array.isArray(data.productLineItems) ? data.productLineItems : [];
    const charges: any[] = Array.isArray(data.additionalCosts) ? data.additionalCosts : [];
    const files: any[] = Array.isArray(data.files) ? data.files : [];
    const overallStatus = String(data.finalResponseStatus || data.statusEntry || "PENDING").toUpperCase();

    const pqNumber = data.purchaseQuotationNo || data.poRefNo || data.requestRefNo || data.refNo || "-";
    const currency = data.currencyName || data.currencyType || "";

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
                        Purchase Quotation
                    </p>
                    <p className="text-[17px] font-black text-slate-900 leading-tight break-words">{pqNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                    {loading && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
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

            {/* ── Quotation information ────────────────────────────────────── */}
            <div>
                <SectionTitle>Quotation Information</SectionTitle>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                    <InfoItem label="PQ Date" value={formatDate(data.purchaseQuotationDate || data.poDate)} />
                    <InfoItem label="Supplier" value={data.supplierName || data.supplier?.supplierName} />
                    <InfoItem label="Supplier Quote No" value={data.supplierQuotationNo} />
                    <InfoItem label="Supplier Quote Date" value={formatDate(data.supplierQuotationDate)} />
                    <InfoItem label="Company" value={data.companyName || data.company?.companyName} />
                    <InfoItem label="Branch" value={data.branchName} />
                    <InfoItem label="Purchase Store" value={data.poStoreName || data.storeName || data.requestStoreName} />
                    <InfoItem label="Camp" value={data.campName} />
                    <InfoItem label="Purchase Request No" value={data.purchaseRequestNo} />
                    <InfoItem label="Created By" value={data.createdBy || data.requestedBy} />
                    <InfoItem label="Created Date" value={formatDate(data.createdDate)} />
                    <InfoItem label="Delivery Location" value={data.deliveryLocationName} />
                </div>
            </div>

            {/* ── Terms ────────────────────────────────────────────────────── */}
            <div>
                <SectionTitle>Terms &amp; Delivery</SectionTitle>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                    <InfoItem label="Payment Term" value={data.paymentTermName} />
                    <InfoItem label="Payment Mode" value={data.paymentModeName} />
                    <InfoItem label="Shipment Mode" value={data.shipmentModeName} />
                    <InfoItem label="Delivery Date" value={formatDate(data.deliveryDate)} />
                    <InfoItem label="Delivery Term" value={data.deliveryTerm} />
                    <InfoItem label="Valid From" value={formatDate(data.validFromDate)} />
                    <InfoItem label="Valid To" value={formatDate(data.validToDate)} />
                    <InfoItem
                        label="Currency / FX"
                        value={
                            currency
                                ? `${currency}${!isBlank(data.exchangeRate) ? ` @ ${fmtNumber(data.exchangeRate)}` : ""}`
                                : data.exchangeRate
                        }
                    />
                    <InfoItem label="Shipment Remarks" value={data.shipmentRemarks} className="col-span-2 lg:col-span-2" />
                    <InfoItem label="Remarks" value={data.remarks} className="col-span-2 lg:col-span-2" />
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

            {/* ── Totals (FC + LC) ─────────────────────────────────────────── */}
            <div>
                <SectionTitle
                    hint={
                        <span className="text-[10px] font-bold text-slate-400">
                            All amounts in {currency || "quotation currency"}
                        </span>
                    }
                >
                    Quotation Totals
                </SectionTitle>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <MoneyTile label="Subtotal" value={data.subTotalAmount} secondary={data.subTotalAmountLc} currency={currency} />
                    <MoneyTile label="Discount" value={data.discountAmount} secondary={data.discountAmountLc} currency={currency} />
                    <MoneyTile label="Total Product" value={data.totalProductAmount} secondary={data.totalProductAmountLc} currency={currency} />
                    <MoneyTile label="Tax / VAT" value={data.taxAmount} secondary={data.taxAmountLc} currency={currency} />
                    <MoneyTile label="Final Total" value={data.totalAmount ?? data.amount} secondary={data.totalAmountLc} currency={currency} emphasis />
                </div>
            </div>

            {/* ── Quotation lines (card layout: nothing is cut off) ────────── */}
            <div>
                <SectionTitle
                    hint={
                        <span className="text-[10px] font-bold text-slate-400">
                            {lines.length} {lines.length === 1 ? "line" : "lines"}
                        </span>
                    }
                >
                    Quotation Lines
                </SectionTitle>

                {lines.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-[12px] font-semibold text-slate-400">
                        {loading ? "Loading quotation lines..." : "No quotation lines found."}
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
                                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-violet-50 border border-violet-100 text-[10px] font-black text-violet-700 uppercase">
                                        {text(item.totalQuantity)} {item.uomName ? String(item.uomName) : ""}
                                    </span>
                                </div>
                                <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
                                    <LineField label="Description" value={item.description || item.remarks} className="col-span-2 sm:col-span-4" />
                                    <LineField
                                        label="Category"
                                        value={[item.mainCategoryName, item.subCategoryName].filter(Boolean).join(" / ")}
                                    />
                                    <LineField
                                        label="Reference"
                                        value={[item.referenceTypeName, item.referenceNo].filter(Boolean).join(" ")}
                                    />
                                    <LineField label="PR No" value={item.purchaseRequestNo} />
                                    <LineField label="Required Date" value={formatDate(item.requiredDate)} />

                                    <LineField label="Rate" value={fmtMoney(item.rate ?? item.ratePerPcs)} />
                                    <LineField label="Discount %" value={item.discountPercentage} />
                                    <LineField label="Discount Amt" value={fmtMoney(item.discountAmount)} />
                                    <LineField label="Subtotal" value={fmtMoney(item.subTotalAmount)} />
                                    <LineField label="Tax" value={[item.taxName, item.taxPercentage != null && item.taxPercentage !== "" ? `(${item.taxPercentage}%)` : ""].filter(Boolean).join(" ")} />
                                    <LineField label="Tax Amt" value={fmtMoney(item.taxAmount)} />
                                    <LineField label="Final (FC)" value={fmtMoney(item.finalAmount ?? item.amount)} />
                                    <LineField label="Final (LC)" value={fmtMoney(item.finalAmountLc)} />

                                    {item.reason ? (
                                        <LineField label="Reason" value={item.reason} className="col-span-2 sm:col-span-4" />
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Additional charges ───────────────────────────────────────── */}
            <div>
                <SectionTitle
                    hint={
                        <span className="text-[10px] font-bold text-slate-400">
                            {charges.length} {charges.length === 1 ? "charge" : "charges"}
                        </span>
                    }
                >
                    Additional Charges
                </SectionTitle>

                {charges.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 py-4 text-center text-[12px] font-semibold text-slate-400">
                        {loading ? "Loading additional charges..." : "No additional charges."}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {charges.map((charge: any, index: number) => (
                            <div key={charge.id ?? `${charge.lineNo}-${index}`} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/30 overflow-hidden">
                                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-white/70 border-b border-slate-100">
                                    <p className="text-[12px] font-black text-slate-800 break-words">
                                        <span className="text-slate-400 mr-1.5">#{charge.lineNo ?? index + 1}</span>
                                        {text(charge.chargeTypeName || charge.additionalCostType)}
                                    </p>
                                    {charge.description ? (
                                        <span className="text-[11px] font-semibold text-slate-500 break-words">{charge.description}</span>
                                    ) : null}
                                </div>
                                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                                    <LineField label="Quantity" value={fmtNumber(charge.quantity)} />
                                    <LineField label="Rate" value={fmtMoney(charge.rate)} />
                                    <LineField label="Total (FC)" value={fmtMoney(charge.totalAmount)} />
                                    <LineField label="Tax" value={charge.taxPercentage != null && charge.taxPercentage !== "" ? `${charge.taxPercentage}%` : null} />
                                    <LineField label="Tax Amt" value={fmtMoney(charge.taxAmount)} />
                                    <LineField label="Final (FC)" value={fmtMoney(charge.finalAmount)} />
                                    <LineField label="Total (LC)" value={fmtMoney(charge.totalAmountLc)} />
                                    <LineField label="Tax (LC)" value={fmtMoney(charge.taxAmountLc)} />
                                    <LineField label="Final (LC)" value={fmtMoney(charge.finalAmountLc)} />
                                    {charge.remarks ? (
                                        <LineField label="Remarks" value={charge.remarks} className="col-span-2 sm:col-span-3" />
                                    ) : null}
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
                    emptyMessage="No documents were attached to this quotation."
                />
            </div>
        </div>
    );
};

export default PurchaseQuotationExpansion;
