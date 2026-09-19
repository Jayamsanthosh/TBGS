"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, Copy, RefreshCw, X, AlertCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface QrScanClientProps {
    initialId: string | null;
    initialIsValid: boolean;
}

export default function QrScanClient({ initialId, initialIsValid }: QrScanClientProps) {
    const id = initialId;
    const isValid = initialIsValid;

    const [timestamp, setTimestamp] = useState('');
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        // Set initial timestamp on mount to avoid hydration mismatch
        setTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, []);

    useEffect(() => {
        // Force update browser title for dynamic feedback
        if (id) {
            document.title = isValid ? "Verification Success" : "Verification Failed";
        } else {
            document.title = "Verification";
        }
    }, [id, isValid]);


    const copyToClipboard = async () => {
        const content = id || "No content";
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(content);
            } else {
                throw new Error('Clipboard API unavailable');
            }
        } catch (err) {
            const dummy = document.createElement("textarea");
            document.body.appendChild(dummy);
            dummy.value = content;
            dummy.select();
            document.execCommand("copy");
            document.body.removeChild(dummy);
        }

        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    const router = useRouter();

    const handleOpenLink = async () => {
        if (!id) return;

        if (id.startsWith('http://') || id.startsWith('https://')) {
            window.open(id, '_blank', 'noopener,noreferrer');
            return;
        }

        // 1. Try to find the record from the live API
        const approvalTypes = ['purchase-order', 'work-order', 'price-approval', 'sales-return-approval', 'attendance', 'cash-advance', 'arrears', 'overtime'];
        let foundRecord: any = null;
        let foundType = '';

        for (const type of approvalTypes) {
            try {
                const res = await fetch(`/api/approvals/${type}`);
                const records = await res.json();
                const normalize = (str: string) => str.replace(/-/g, '/').toUpperCase();
                const match = (records || []).find((r: any) => r.poRefNo && normalize(r.poRefNo) === normalize(id));
                if (match) {
                    foundRecord = match;
                    foundType = type;
                    break;
                }
            } catch { /* skip */ }
        }

        if (!foundRecord) {
            alert('Record not found or invalid ID');
            return;
        }

        // 2. Fetch full detail from the detail endpoint
        let detail: any;
        try {
            const res = await fetch(`/api/approvals/${foundType}/${foundRecord.sno}`);
            if (!res.ok) throw new Error('Failed to fetch detail');
            detail = await res.json();
        } catch {
            alert('Failed to load record details');
            return;
        }

        // 3. Generate PDF from the live detail data
        try {
            const [{ jsPDF }, autoTableModule] = await Promise.all([
                import("jspdf"),
                import("jspdf-autotable")
            ]);

            const autoTable = autoTableModule.default;
            const doc = new jsPDF({ unit: "mm", format: "a4" });
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 12;
            const right = pageWidth - margin;

            const lineItems: any[] = (detail?.productLineItems || []).map((item: any) => {
                const qty = Number(item.totalPcs ?? item.totalPacking ?? item.orderedQty ?? 0);
                const unitPrice = Number(item.ratePerPcs ?? item.unitPrice ?? 0);
                const amount = Number(item.totalProductAmount ?? item.productAmount ?? item.finalProductAmount ?? item.amount ?? (qty * unitPrice));
                return {
                    ...item,
                    productName: item.productName || item.alternateProductName || `Product ${item.productId ?? ''}`.trim(),
                    specification: item.specification || item.remarks || '-',
                    orderedQty: qty,
                    unitPrice,
                    amount
                };
            });

            const additionalCosts: any[] = (detail?.additionalCosts || [])
                .filter((cost: any) => cost.statusMaster === 'ACTIVE')
                .map((cost: any) => ({
                    ...cost,
                    costType: cost.additionalCostType || 'ADDITIONAL_COST',
                    vatAmount: Number(cost.vatAmount ?? 0)
                }));

            const supplier = detail?.supplier || {};
            const company = detail?.company || {};
            const store = detail?.store || {};

            const subtotal = lineItems.reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
            const addCostTotal = additionalCosts.reduce((s: number, c: any) => s + Number(c.amount || 0), 0);
            const vat = Number(foundRecord.vatHdrAmount ?? 0);
            const total = Number(foundRecord.totalFinalProductionHdrAmount ?? subtotal + addCostTotal + vat);

            const fmt = (value: any) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            const qrContent = `${process.env.NEXT_PUBLIC_APP_URL}qrscan?id=%22${foundRecord.poRefNo}%22`;
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrContent)}`;

            try {
                const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new window.Image();
                    img.crossOrigin = "anonymous";
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error("QR Load Failed"));
                    img.src = qrApiUrl;
                });
                doc.addImage(qrImg, "PNG", right - 25, 8, 25, 25);
            } catch { /* skip */ }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("PURCHASE INVOICE", margin, 14);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(`PO Ref: ${foundRecord.poRefNo || "-"}`, margin, 21);
            doc.text(`PO Date: ${foundRecord.poDate ? new Date(foundRecord.poDate).toLocaleDateString() : "-"}`, margin, 26);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 31);

            doc.setFont("helvetica", "bold");
            doc.text("Supplier", margin, 38);
            doc.text("Company / Store", right - 70, 38);
            doc.setFont("helvetica", "normal");
            doc.text(String(supplier.supplierName || "-"), margin, 43);
            doc.text(String(company.companyName || "-"), right - 70, 43);
            doc.text(String(store.storeName || "-"), right - 70, 48);

            autoTable(doc, {
                startY: 55,
                head: [["#", "Product", "Specification", "Qty", "Unit Price", "Amount"]],
                body: lineItems.map((item: any, index: number) => [
                    index + 1,
                    item.productName || "-",
                    item.specification || "-",
                    fmt(item.orderedQty),
                    fmt(item.unitPrice),
                    fmt(item.amount)
                ]),
                theme: "grid",
                styles: { fontSize: 8, cellPadding: 2.5 },
                headStyles: { fillColor: [15, 23, 42] },
                columnStyles: { 0: { halign: "center", cellWidth: 10 }, 3: { halign: "right", cellWidth: 20 }, 4: { halign: "right", cellWidth: 26 }, 5: { halign: "right", cellWidth: 26 } }
            });

            const lineItemsEndY = (doc as any).lastAutoTable?.finalY || 70;

            autoTable(doc, {
                startY: lineItemsEndY + 6,
                head: [["Cost Type", "Amount", "VAT"]],
                body: additionalCosts.map((cost: any) => [
                    String(cost.costType || "-").replaceAll("_", " "),
                    fmt(cost.amount),
                    fmt(cost.vatAmount ?? 0)
                ]),
                theme: "grid",
                styles: { fontSize: 8, cellPadding: 2.5 },
                headStyles: { fillColor: [30, 64, 175] },
                columnStyles: { 1: { halign: "right", cellWidth: 30 }, 2: { halign: "right", cellWidth: 30 } }
            });

            const costsEndY = (doc as any).lastAutoTable?.finalY || lineItemsEndY + 20;

            autoTable(doc, {
                startY: costsEndY + 6,
                margin: { left: right - 78 },
                body: [
                    ["Subtotal", fmt(subtotal)],
                    ["Additional Costs", fmt(addCostTotal)],
                    ["VAT", fmt(vat)],
                    ["Total", `${fmt(total)} ${foundRecord.currencyType || 'TZS'}`]
                ],
                theme: "grid",
                styles: { fontSize: 9, cellPadding: 2.5 },
                columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 }, 1: { halign: "right", cellWidth: 33 } }
            });

            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');

            toast.success("Invoice PDF generated and opened");

        } catch (err) {
            console.error(err);
            toast.error("Failed to generate PDF");
        }
    };

    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes scale-up {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes draw-check {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-scale { animation: scale-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .check-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: draw-check 0.8s 0.3s ease-in-out forwards;
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .glass {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}} />

            <div className="max-w-md w-full glass rounded-3xl shadow-2xl overflow-hidden animate-scale">
                {isValid ? (
                    /* Success View */
                    <>
                        <div className="bg-emerald-500 p-8 flex flex-col items-center text-white">
                            <div className="bg-white/20 p-4 rounded-full mb-4">
                                <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        className="check-path"
                                        d="M5 13L9 17L19 7"
                                        stroke="white"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">Success!</h1>
                            <p className="text-emerald-50 font-medium mt-1">QR Code scanned successfully</p>
                        </div>

                        <div className="p-8">
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Timestamp</span>
                                        <span className="text-sm font-semibold text-slate-700">{timestamp || 'Loading...'}</span>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Status</span>
                                        <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Validated
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-100/50 rounded-xl break-all">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Scanned ID</span>
                                    <span className="text-sm font-mono text-slate-600">{id}</span>
                                </div>

                                <button
                                    onClick={copyToClipboard}
                                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <Copy className="w-5 h-5" />
                                    Copy Content
                                </button>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleReload}
                                        className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Scan Another
                                    </button>
                                    <button
                                        onClick={handleOpenLink}
                                        className="flex-1 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Open Link
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Failure View */
                    <>
                        <div className="bg-rose-500 p-8 flex flex-col items-center text-white">
                            <div className="bg-white/20 p-4 rounded-full mb-4 animate-shake">
                                <X className="w-16 h-16" strokeWidth={3} />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">Scan Failed</h1>
                            <p className="text-rose-50 font-medium mt-1">Unable to process QR code</p>
                        </div>

                        <div className="p-8">
                            <div className="space-y-6">
                                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="text-rose-500 mt-0.5">
                                            <AlertCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-rose-900">Possible Issues:</h3>
                                            <ul className="text-sm text-rose-700 mt-1 list-disc list-inside space-y-1">
                                                <li>QR code is blurry or poorly lit</li>
                                                <li>Code is damaged or partially covered</li>
                                                <li>Invalid or unsupported format</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Attempt Time</span>
                                        <span className="text-sm font-semibold text-slate-700">{timestamp || 'Loading...'}</span>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Error Code</span>
                                        <span className="text-sm font-semibold text-rose-600">ERR_INVALID_SRC</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleReload}
                                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Try Scanning Again
                                </button>

                                <button className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold transition-colors">
                                    Contact Support
                                </button>
                            </div>
                        </div>

                        <div className="px-8 pb-8 text-center">
                            <p className="text-xs text-slate-400">If the problem persists, please check your camera lens and internet connection.</p>
                        </div>
                    </>
                )}
            </div>

            <div
                className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-800 text-white rounded-full text-sm font-medium transition-opacity duration-300 pointer-events-none shadow-xl border border-slate-700 ${showToast ? 'opacity-100' : 'opacity-0'}`}
            >
                Copied to clipboard!
            </div>
        </div>
    );
}
