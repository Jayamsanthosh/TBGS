"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
//app/[approvalType]/page.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import FilterForm from "../components/ApprovalDetails/FilterForm";
import DataTable, { Column } from "../components/ApprovalDetails/DataTable";
import {
    Eye,
    ChevronDown,
    XCircle,
    RefreshCw,
    Settings,
    ArrowLeft,
    Layers
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

import PdfViewerModal from "../components/ApprovalDetails/PdfViewerModal";
import DashboardCard from "../components/DashboardCard";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchApprovalRecords, updateApprovalStatusByType } from "@/redux/slices/approvalSlice";
import { fetchDashboardCards } from "@/redux/slices/dashboardSlice";
import { apiUrl, asset } from "@/lib/config";

interface ApprovalDetailsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

type PendingStatusUpdate = {
    ids: number[];
    status: "PENDING" | "APPROVED" | "REJECTED" | "HOLD";
};



// Main Table columns
function getTableColumns(
    approvalType: string,
    onViewDetails: (row: any) => void,
    onGenerateInvoicePdf: (row: any) => void | Promise<void>,
): { columns: Column[]; middleCols: Column[] } {
    const nType = (approvalType || '').toLowerCase();
    const isPO = nType === 'purchase-order';
    const isWO = nType === 'work-order';
    const isPA = nType === 'price-approval';
    const isSR = nType === 'sales-return-approval';

    const refLabel = isPO ? 'PO NO' : isWO ? 'WO NO' : isPA ? 'PA NO' : isSR ? 'SR NO' : 'REF NO';

    // ── Shared helpers for the request-type columns ───────────────────
    const fmtMoney = (v: any) => (v == null || v === '' ? '-' : Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    const fmtDate = (v: any) => {
        if (v == null || v === '') return '-';
        const d = new Date(v);
        return isNaN(d.getTime()) ? String(v).slice(0, 10) : d.toLocaleDateString();
    };
    const nm = (v: any) => (v == null || v === '' ? '-' : String(v));

    const empIdCol: Column = {
        key: 'empId',
        label: 'Emp ID',
        responsiveClass: 'hidden lg:table-cell',
        render: (id: any) => <span className="text-slate-600 font-medium">{(id == null || id === '') ? '-' : `EMP ${id}`}</span>
    };
    const designationCol: Column = {
        key: 'designationId',
        label: 'Designation',
        responsiveClass: 'hidden xl:table-cell',
        render: (id: any, row: any) => <span className="text-slate-600 font-medium">{row.designationName || id || '-'}</span>
    };
    const pendingDaysCol: Column = {
        key: 'pendingDays', label: 'No of Days', render: (_: any, row: any) => {
            const days = row.noOfDays || row.NO_OF_DAYS || 0;
            return (
                <div className="flex justify-center">
                    <div className="w-7 h-7 bg-amber-100 text-amber-700 flex items-center justify-center rounded font-bold transition-transform hover:scale-110">
                        {days}
                    </div>
                </div>
            );
        }
    };

    const baseCols: Column[] = [
        {
            key: 'action',
            label: 'Action',
            headerAlign: 'center',
            width: '180px',
            render: (_: any, row: any, { isExpanded, toggleExpansion }: any) => (
                <div className="flex items-center justify-center space-x-1.5 min-w-[160px]">
                    <button
                        onClick={() => onViewDetails(row)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100 shrink-0"
                        title="View Details"
                    >
                        <Eye size={16} strokeWidth={2.5} />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onGenerateInvoicePdf(row);
                        }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border border-rose-200 shrink-0"
                        title="Generate PDF"
                    >
                        <Image
                            src={asset("/pdf_icon.png")}
                            alt="PDF"
                            width={16}
                            height={16}
                            className="block w-4 h-4 object-contain"
                        />
                    </button>

                    <button
                        onClick={toggleExpansion}
                        className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all border shrink-0 ${isExpanded
                            ? 'bg-indigo-600 text-white border-indigo-600 rotate-180'
                            : 'text-slate-400 hover:bg-slate-100 border-slate-200'
                            }`}
                        title={isExpanded ? "Collapse" : "Expand"}
                    >
                        <ChevronDown size={14} strokeWidth={3} />
                    </button>
                </div>
            )
        },
        { key: 'sno', label: 'ID', render: (val: number) => <span className="font-bold text-slate-800">{val}</span> },
        {
            key: 'companyId',
            label: 'Company',
            render: (id: any, row: any) => (
                <span className="text-slate-500 font-semibold">{row.companyName || id}</span>
            )
        },
        { key: 'poRefNo', label: refLabel, render: (value: string) => <span className="text-[13px] font-bold text-slate-700">{value}</span> },
        {
            key: 'departmentId',
            label: 'Dept',
            responsiveClass: 'hidden md:table-cell',
            render: (id: any, row: any) => (
                <span className="text-slate-600 font-medium">{row.departmentName || id}</span>
            )
        },
        {
            key: 'requestedBy',
            label: 'Requested By',
            render: (_: any, row: any) => (
                <div className="flex flex-col">
                    <span className="text-slate-700 text-[11px] font-bold">{row.requestedBy}</span>
                    <span className="text-slate-400 text-[10px]">{row.requestedDate ? new Date(row.requestedDate).toLocaleDateString() : ''}</span>
                </div>
            )
        },
    ];

    // ── Per-request-type important columns ─────────────────────────────
    let middleCols: Column[] = [];

    if (nType === 'attendance') {
        middleCols = [
            empIdCol,
            designationCol,
            {
                key: 'attendanceTypeId',
                label: 'Attendance Type',
                render: (id: any, row: any) => <span className="text-slate-700 font-medium">{nm(row.attendanceTypeName || id)}</span>
            },
            { key: 'dateFrom', label: 'Date From', render: (v: any) => <span className="text-slate-600">{fmtDate(v)}</span> },
            { key: 'dateTo', label: 'Date To', render: (v: any) => <span className="text-slate-600">{fmtDate(v)}</span> },
            pendingDaysCol,
        ];
    } else if (nType === 'cash-advance') {
        middleCols = [
            empIdCol,
            designationCol,
            { key: 'amount', label: 'Request Amount', headerAlign: 'right', render: (v: any) => <span className="text-slate-700 font-semibold inline-block min-w-[64px] text-right">{fmtMoney(v)}</span> },
            { key: 'salaryDeductionType', label: 'Salary Deduction', render: (v: any) => <span className="text-slate-700">{nm(v)}</span> },
            { key: 'eligibleAmount', label: 'Eligible Amt', headerAlign: 'right', render: (v: any) => <span className="text-slate-600 inline-block min-w-[64px] text-right">{fmtMoney(v)}</span> },
            { key: 'netPay', label: 'Net Pay', headerAlign: 'right', render: (v: any) => <span className="text-slate-700 font-medium inline-block min-w-[64px] text-right">{fmtMoney(v)}</span> },
            { key: 'deductionFromDate', label: 'Deduct From', render: (v: any) => <span className="text-slate-600 whitespace-nowrap">{fmtDate(v)}</span> },
            { key: 'deductionToDate', label: 'Deduct To', render: (v: any) => <span className="text-slate-600 whitespace-nowrap">{fmtDate(v)}</span> },
            { key: 'noOfMonths', label: 'No of Months', headerAlign: 'center', render: (v: any) => <span className="text-slate-700">{nm(v)}</span> },
            { key: 'monthlyDeduction', label: 'Monthly Deduction', headerAlign: 'right', render: (v: any) => <span className="text-slate-700 font-medium inline-block min-w-[64px] text-right">{fmtMoney(v)}</span> },
            { key: 'paymentModeId', label: 'Payment Mode', render: (_: any, row: any) => <span className="text-slate-700">{nm(row.paymentModeName)}</span> },
            {
                key: 'accountNo',
                label: 'Bank Account',
                render: (_: any, row: any) => (
                    <div className="flex flex-col">
                        <span className="text-slate-700 text-[11px] font-semibold">{nm(row.bankName)}</span>
                        <span className="text-slate-400 text-[10px]">{nm(row.accountNo)}</span>
                    </div>
                )
            },
        ];
    } else if (nType === 'arrears') {
        middleCols = [
            empIdCol,
            designationCol,
            { key: 'amount', label: 'Request Amount', headerAlign: 'right', render: (v: any) => <span className="text-slate-700 font-semibold inline-block min-w-[64px] text-right">{fmtMoney(v)}</span> },
            { key: 'approvedAmount', label: 'Approved Amt', headerAlign: 'right', render: (v: any) => <span className="text-slate-600 inline-block min-w-[64px] text-right">{fmtMoney(v)}</span> },
            { key: 'reason', label: 'Reason' },
        ];
    } else if (nType === 'overtime') {
        middleCols = [
            empIdCol,
            designationCol,
            { key: 'otFromDate', label: 'OT From', render: (v: any) => <span className="text-slate-700 whitespace-nowrap">{fmtDate(v)}</span> },
            { key: 'otToDate', label: 'OT To', render: (v: any) => <span className="text-slate-700 whitespace-nowrap">{fmtDate(v)}</span> },
            { key: 'otHours', label: 'OT Hours', headerAlign: 'center', render: (v: any) => <span className="text-slate-700 font-semibold">{nm(v)}</span> },
            { key: 'amount', label: 'Request Amount', headerAlign: 'right', render: (v: any) => <span className="text-slate-700 font-semibold inline-block min-w-[64px] text-right">{fmtMoney(v)}</span> },
            { key: 'paidStatus', label: 'Paid Status', render: (v: any) => <span className="text-slate-600">{nm(v)}</span> },
        ];
    } else if (nType === 'bonus') {
        middleCols = [
            empIdCol,
            designationCol,
            { key: 'bonusType', label: 'Bonus Type', render: (v: any) => <span className="text-slate-700">{nm(v)}</span> },
            { key: 'monthEntered', label: 'Month', render: (v: any) => <span className="text-slate-600">{nm(v)}</span> },
            { key: 'yearEntered', label: 'Year', render: (v: any) => <span className="text-slate-600">{nm(v)}</span> },
            { key: 'amount', label: 'Request Amount', headerAlign: 'right', render: (v: any) => <span className="text-slate-700 font-semibold inline-block min-w-[64px] text-right">{fmtMoney(v)}</span> },
            { key: 'approvedAmount', label: 'Approved Amt', headerAlign: 'right', render: (v: any) => <span className="text-slate-600 inline-block min-w-[64px] text-right">{fmtMoney(v)}</span> },
            { key: 'paidStatus', label: 'Paid Status', render: (v: any) => <span className="text-slate-600">{nm(v)}</span> },
        ];
    } else if (nType === 'leave-encashment') {
        middleCols = [
            empIdCol,
            designationCol,
            { key: 'balanceLeaveDays', label: 'Balance Days', headerAlign: 'center', render: (v: any) => <span className="text-slate-600">{nm(v)}</span> },
            { key: 'encashmentDays', label: 'Encash Days', headerAlign: 'center', render: (v: any) => <span className="text-slate-700 font-semibold">{nm(v)}</span> },
            { key: 'amount', label: 'Gross Amount', headerAlign: 'right', render: (v: any) => <span className="text-slate-700 font-semibold inline-block min-w-[64px] text-right">{fmtMoney(v)}</span> },
            { key: 'monthEntered', label: 'Month', render: (v: any) => <span className="text-slate-600">{nm(v)}</span> },
            { key: 'yearEntered', label: 'Year', render: (v: any) => <span className="text-slate-600">{nm(v)}</span> },
        ];
    } else if (nType === 'promotion-demotion-transfer') {
        middleCols = [
            empIdCol,
            designationCol,
            { key: 'transferType', label: 'Type', render: (v: any) => <span className="text-slate-700 font-medium">{nm(v)}</span> },
            { key: 'oldCompanyName', label: 'Old Company', render: (v: any) => <span className="text-slate-600">{nm(v)}</span> },
            { key: 'newCompanyName', label: 'New Company', render: (v: any) => <span className="text-slate-700 font-medium">{nm(v)}</span> },
            { key: 'oldDesignationName', label: 'Old Desig', render: (v: any) => <span className="text-slate-600">{nm(v)}</span> },
            { key: 'newDesignationName', label: 'New Desig', render: (v: any) => <span className="text-slate-700 font-medium">{nm(v)}</span> },
            { key: 'oldGrossAmount', label: 'Old Gross', headerAlign: 'right', render: (v: any) => <span className="text-slate-600 inline-block min-w-[64px] text-right">{fmtMoney(v)}</span> },
            { key: 'newGrossAmount', label: 'New Gross', headerAlign: 'right', render: (v: any) => <span className="text-slate-700 font-semibold inline-block min-w-[64px] text-right">{fmtMoney(v)}</span> },
            { key: 'managerRecommendedYn', label: 'Mgr Rec', headerAlign: 'center', render: (v: any) => <span className="text-slate-600">{nm(v || '-')}</span> },
        ];
    } else {
        // Purchase Order / Work Order / Price Approval / Sales Return keep the
        // legacy "No of Days" summary column.
        middleCols = [pendingDaysCol];
    }

    const statusCol: Column = {
        key: 'finalResponseStatus',
        label: 'Status',
        render: (val: string, row: any) => {
            // Fallback to statusEntry for admin-created requests
            const status = val || row?.statusEntry || 'PENDING';
            const colors: Record<string, string> = {
                'APPROVED': 'bg-emerald-100 text-emerald-700 border-emerald-200',
                'REJECTED': 'bg-rose-100 text-rose-700 border-rose-200',
                'PENDING': 'bg-amber-100 text-amber-700 border-amber-200',
                'HOLD': 'bg-indigo-100 text-indigo-700 border-indigo-200',
                'CLOSED': 'bg-slate-200 text-slate-600 border-slate-300',
            };

            return (
                <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border shadow-sm ${colors[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {status}
                </span>
            );
        }
    };

    return {
        columns: [...baseCols, statusCol],
        middleCols
    };
}

const ApprovalDetailsPage = ({ searchParams }: ApprovalDetailsPageProps) => {
    const router = useRouter();
    const params = useParams();
    const dispatch = useAppDispatch();
    const approvalType = (params?.approvalType as string) || "";

    const { records, loading: recordsLoading } = useAppSelector((state: any) => state.approval);
    const { cards: allCards } = useAppSelector((state: any) => state.dashboard);

    // Get query parameters from URL
    const [queryParams, setQueryParams] = useState<Record<string, string>>({});
    const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
    const [remarksInput, setRemarksInput] = useState("");
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<PendingStatusUpdate | null>(null);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [currentPdfData, setCurrentPdfData] = useState<string>("");
    const [currentPdfTitle, setCurrentPdfTitle] = useState<string>("");

    const currentCard = useMemo(
        () => (Array.isArray(allCards) ? allCards : []).find((c: any) => c.routeSlug === approvalType),
        [allCards, approvalType]
    );

    const childCards = useMemo(
        () => (Array.isArray(allCards) ? allCards : []).filter((c: any) => c.parentId === currentCard?.sno),
        [allCards, currentCard]
    );

    const hasSubTypes = childCards.length > 0;

    useEffect(() => {
        if (!searchParams) return;
        // Convert Promise to actual values
        searchParams.then((params) => {
            if (!params) return;
            const paramsObj: Record<string, string> = {};
            Object.entries(params).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    paramsObj[key] = value;
                }
            });
            setQueryParams(paramsObj);
        });
    }, [searchParams]);

    const [filters, setFilters] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [viewAll, setViewAll] = useState(false);

    useEffect(() => {
        dispatch(fetchDashboardCards());
    }, [dispatch]);

    useEffect(() => {
        if (approvalType) {
            dispatch(fetchApprovalRecords(approvalType));
        }
        setViewAll(false);
    }, [dispatch, approvalType]);

    const runStatusUpdate = async (ids: number[], status: string, remarks: string) => {
        setIsLoading(true);
        try {
            // Use the configured axios instance via the redux thunk so the
            // Authorization header (Bearer token from localStorage) is included.
            const result = await dispatch(updateApprovalStatusByType({
                type: approvalType,
                ids,
                status,
                remarks
            })).unwrap();

            if (result?.success === false) {
                toast.error(result.message || 'Failed to update status');
                return;
            }
            toast.success(`${ids.length} request(s) marked as ${status}`);
            // Refresh grid data + sidebar card counts so the update is
            // reflected immediately everywhere.
            dispatch(fetchApprovalRecords(approvalType));
            dispatch(fetchDashboardCards());
            setSelectedRows([]);
            setPendingStatusUpdate(null);
            setRemarksInput("");
            setIsRemarksModalOpen(false);
        } catch (error: any) {
            console.error('Status update failed:', error);
            const msg = typeof error === 'string'
                ? error
                : (error?.response?.data?.message || error?.message || 'Network error during status update');
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const confirmStatusChange = async () => {
        if (!pendingStatusUpdate) return;
        if (pendingStatusUpdate.status === 'HOLD' && !remarksInput.trim()) {
            toast.error('Remarks are required to put a request on Hold');
            return;
        }

        await runStatusUpdate(pendingStatusUpdate.ids, pendingStatusUpdate.status, remarksInput);
    };

    const handleGenerateInvoicePdf = React.useCallback(async (row: any) => {
        setIsLoading(true);
        try {
            // ── Fetch live data from API ──────────────────────────────────────
            const res = await fetch(apiUrl(`/approvals/${approvalType}/${row.sno || row.id}`));
            if (!res.ok) throw new Error('API fetch failed');
            const detail = await res.json();

            const lineItems: any[] = (detail?.productLineItems || []).map((item: any) => {
                const qty = Number(item.totalPcs ?? item.totalPacking ?? item.orderedQty ?? 0);
                const unitPrice = Number(item.ratePerPcs ?? item.unitPrice ?? 0);
                const amount = Number(
                    item.totalProductAmount ?? item.productAmount ??
                    item.finalProductAmount ?? item.amount ?? (qty * unitPrice)
                );
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

            const subtotal = lineItems.reduce((s, i) => s + Number(i.amount || 0), 0);
            const addCostTotal = additionalCosts.reduce((s, c) => s + Number(c.amount || 0), 0);
            const vat = Number(row.vatHdrAmount ?? 0);
            const total = Number(row.totalFinalProductionHdrAmount ?? subtotal + addCostTotal + vat);

            const fmt = (value: any) =>
                Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            // ── Dynamic title ──────────────────────────────────────────────────
            const invoiceTitle = (approvalType || 'approval')
                .replace(/-/g, ' ')
                .replace(/\b\w/g, (c: string) => c.toUpperCase());

            const poRef = row.poRefNo || row.refNo || row.requestRefNo || '-';
            const poDate = String(row.poDate || row.createdDate || '').split('T')[0] || '-';

            // ── QR Code ───────────────────────────────────────────────────────
            const qrContent = `${process.env.NEXT_PUBLIC_APP_URL}qrscan?id=%22${encodeURIComponent(poRef)}%22`;
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrContent)}`;

            const [{ jsPDF }, autoTableModule] = await Promise.all([
                import('jspdf'),
                import('jspdf-autotable')
            ]);

            const autoTable = autoTableModule.default;
            const doc = new jsPDF({ unit: 'mm', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 12;
            const right = pageWidth - margin;

            // Load QR image
            const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new window.Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('QR Load Failed'));
                img.src = qrApiUrl;
            });
            doc.addImage(qrImg, 'PNG', right - 25, 8, 25, 25);

            // ── Company logo (top-left) ───────────────────────────────────────
            try {
                const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new window.Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error('Logo Load Failed'));
                    img.src = asset('/tbgs-logo.jpg');
                });
                const logoWidth = 24;
                const logoHeight = (logoImg.naturalHeight * logoWidth) / logoImg.naturalWidth || 12;
                doc.addImage(logoImg, 'JPEG', margin, 8, logoWidth, logoHeight);
            } catch (e) {
                console.warn('Logo failed to load', e);
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text(invoiceTitle.toUpperCase(), margin + 28, 16);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(`Ref: ${poRef}`, margin, 21);
            doc.text(`Date: ${poDate}`, margin, 26);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 31);

            doc.setFont('helvetica', 'bold');
            doc.text('Supplier', margin, 38);
            doc.text('Company / Store', right - 70, 38);
            doc.setFont('helvetica', 'normal');
            doc.text(String(supplier.supplierName || '-'), margin, 43);
            doc.text(String(company.companyName || '-'), right - 70, 43);
            doc.text(String(store.storeName || '-'), right - 70, 48);

            autoTable(doc, {
                startY: 55,
                head: [['#', 'Product', 'Specification', 'Qty', 'Unit Price', 'Amount']],
                body: lineItems.map((item: any, index: number) => [
                    index + 1,
                    item.productName || '-',
                    item.specification || '-',
                    fmt(item.orderedQty),
                    fmt(item.unitPrice),
                    fmt(item.amount)
                ]),
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2.5 },
                headStyles: { fillColor: [15, 23, 42] },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 10 },
                    3: { halign: 'right', cellWidth: 20 },
                    4: { halign: 'right', cellWidth: 26 },
                    5: { halign: 'right', cellWidth: 26 }
                }
            });

            const lineItemsEndY = (doc as any).lastAutoTable?.finalY || 70;

            autoTable(doc, {
                startY: lineItemsEndY + 6,
                head: [['Cost Type', 'Amount', 'VAT']],
                body: additionalCosts.map((cost: any) => [
                    String(cost.costType || '-').replaceAll('_', ' '),
                    fmt(cost.amount),
                    fmt(cost.vatAmount ?? 0)
                ]),
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2.5 },
                headStyles: { fillColor: [30, 64, 175] },
                columnStyles: {
                    1: { halign: 'right', cellWidth: 30 },
                    2: { halign: 'right', cellWidth: 30 }
                }
            });

            const costsEndY = (doc as any).lastAutoTable?.finalY || lineItemsEndY + 20;

            autoTable(doc, {
                startY: costsEndY + 6,
                margin: { left: right - 78 },
                body: [
                    ['Subtotal', fmt(subtotal)],
                    ['Additional Costs', fmt(addCostTotal)],
                    ['VAT', fmt(vat)],
                    ['Total', `${fmt(total)} ${row.currencyType || 'TZS'}`]
                ],
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 2.5 },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 45 },
                    1: { halign: 'right', cellWidth: 33 }
                }
            });

            const pdfOutput = doc.output('datauristring');
            setCurrentPdfData(pdfOutput);
            setCurrentPdfTitle(`${invoiceTitle} - ${poRef}`);
            setIsPdfModalOpen(true);
            toast.success(`PDF generated for ${poRef}`);
        } catch {
            toast.error(`Failed to generate PDF for ${row.poRefNo}`);
        } finally {
            setIsLoading(false);
        }
    }, [approvalType]);

    // Get page title from query params or from route
    const pageTitle = useMemo(() => {
        if (queryParams.cardTitle) return queryParams.cardTitle;
        if (!approvalType) return 'Approval Details';
        return approvalType.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    }, [approvalType, queryParams]);

    // Combined Data Filtering logic
    const filteredData = useMemo(() => {
        const rawData = records || [];

        // Map raw data to include calculated fields
        const data = rawData.map((item: any) => {
            const created = new Date(item.createdDate || item.CREATED_DATE || new Date());
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - created.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const mapStatusStr = (str: string | undefined | null) => {
                if (!str) return 'PENDING';
                const s = str.toUpperCase();
                if (s === 'APPROVAL' || s === 'APPROVED') return 'APPROVED';
                if (s === 'REJECT' || s === 'REJECTED') return 'REJECTED';
                if (s === 'CLOSED') return 'CLOSED';
                // 'CL' for cash advance means SUBMITTED (enters the workflow),
                // not a terminal state - leave it alone so the response cascade
                // below decides PENDING/APPROVED/etc.
                return s;
            };

            // STATUS_MASTER lifecycle state wins over the level cascade:
            // APPROVED / REJECTED / CLOSED rows are terminal regardless of levels.
            const smStatus = mapStatusStr(item.STATUS_MASTER);
            const smLifeStatus = ['APPROVED', 'REJECTED', 'CLOSED'].includes(smStatus) ? smStatus : null;

            // Effective status = latest non-empty level in the approval cascade
            // (FINAL -> RESPONSE_2 -> RESPONSE_1 -> SECTION_HEAD). A level-1
            // approval writes SECTION_HEAD_RESPONSE_STATUS only, so checking
            // FINAL_RESPONSE_STATUS alone would keep showing PENDING.
            const firstSetStatus = [item.FINAL_RESPONSE_STATUS, item.RESPONSE_2_STATUS, item.RESPONSE_1_STATUS, item.SECTION_HEAD_RESPONSE_STATUS]
                .map((v: any) => (v == null ? '' : String(v).trim()))
                .find((v: string) => v !== '');
            const finalRespStatus = smLifeStatus || item.finalResponseStatus || firstSetStatus || item.statusEntry || 'PENDING';

            return {
                ...item,
                id: item.sno || item.SNO, // Map sno to id for compatibility
                sno: item.sno || item.SNO, // Grid ID column reads lowercase 'sno'
                pendingDays: item.noOfDays || item.NO_OF_DAYS || 0,
                amount: item.amount || item.REQUEST_AMOUNT || item.NO_OF_DAYS || item.totalFinalProductionHdrAmount, 
                
                poRefNo: item.poRefNo || item.ATT_REQUEST_REF_NO || item.CASH_ADV_REQUEST_REF_NO || `REF-${item.sno || item.SNO}`,
                poStoreId: item.poStoreId || item.STORE_ID,
                departmentId: item.departmentId || item.DEPARTMENT_ID,
                storeName: item.storeName || item.STORE_NAME || item.poStoreId || item.STORE_ID,
                requestedBy: item.requestedBy || item.FIRST_NAME || item.EMP_ID,
                requestedDate: item.requestedDate || item.CREATED_DATE,
                currencyType: item.currencyType || item.currencyName || item.CURRENCY || 'TZS',

                response1Status: mapStatusStr(item.response1Status || item.RESPONSE_1_STATUS || "PENDING"),
                response1Person: item.response1Person || item.RESPONSE_1_EMP_ID,
                response1Remarks: item.response1Remarks || item.REMARKS,

                response2Status: mapStatusStr(item.response2Status || item.RESPONSE_2_STATUS || "PENDING"),
                response2Person: item.response2Person || item.RESPONSE_2_EMP_ID,
                response2Remarks: item.response2Remarks || item.REMARKS,

                // Normalize status: use finalResponseStatus, fall back to statusEntry
                finalResponseStatus: mapStatusStr(finalRespStatus),
                statusEntry: mapStatusStr(finalRespStatus)
            };
        });

        if (Object.keys(filters).length === 0) return data;

        return data.filter((item: any) => {
            // 1. Company Filter (exact ID match)
            if (filters.company && item.companyId?.toString() !== filters.company.toString()) return false;

            // 2. Purchase Type Filter
            if (filters.purchaseType && filters.purchaseType !== 'all' && item.purchaseType?.toLowerCase() !== filters.purchaseType.toLowerCase()) return false;

            // 3. Supplier Filter (exact ID match)
            if (filters.supplier && filters.supplier !== 'all') {
                if (item.supplierId?.toString() !== filters.supplier.toString()) return false;
            }

            // 4. Department Filter (exact ID match)
            if (filters.department && filters.department !== 'all') {
                if (item.poStoreId?.toString() !== filters.department.toString()) return false;
            }

            // 5. Status Filter
            if (filters.status && filters.status !== 'all') {
                const itemStatus = (item.finalResponseStatus || 'PENDING').toLowerCase();
                if (itemStatus !== filters.status.toLowerCase()) return false;
            }

            // 6. Emp Id / Name Live Search
            if (filters.empId) {
                const q = String(filters.empId).toLowerCase().trim();
                const haystack = [
                    item.empId,
                    item.EMP_ID,
                    item.requestedBy,
                    item.requestedByName,
                    item.FIRST_NAME,
                    item.MIDDLE_NAME,
                    item.LAST_NAME
                ].filter((v: any) => v != null).map((v: any) => String(v)).join(' ').toLowerCase();
                if (!haystack.includes(q)) return false;
            }

            // 7. Currency Filter
            if (filters.currency && item.currencyType !== filters.currency) return false;

            // 8. Amount Range Filters
            if (filters.minAmount || filters.maxAmount) {
                const numericAmount = item.amount;
                if (filters.minAmount && numericAmount < parseFloat(filters.minAmount)) return false;
                if (filters.maxAmount && numericAmount > parseFloat(filters.maxAmount)) return false;
            }

            // 9. Date Range Filters
            if (filters.searchFrom || filters.searchTo) {
                const itemDate = new Date(item.createdDate || item.poDate || new Date());
                itemDate.setHours(0, 0, 0, 0);

                if (filters.searchFrom) {
                    const fromDate = new Date(filters.searchFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    if (itemDate < fromDate) return false;
                }
                if (filters.searchTo) {
                    const toDate = new Date(filters.searchTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (itemDate > toDate) return false;
                }
            }

            return true;
        });
    }, [filters, approvalType, records]);

    const handleApplyFilters = (newFilters: any) => {
        setIsLoading(true);
        setFilters(newFilters);
        setTimeout(() => setIsLoading(false), 600);
    };

    const handleResetFilters = () => {
        setFilters({});
        toast('Filters cleared', { icon: '🧹' });
    };

    const handleViewDetails = React.useCallback((row: any) => {
        // Pass query params to detail page
        const queryString = new URLSearchParams(queryParams).toString();
        const query = queryString ? `?${queryString}` : '';

        // Clean URL: removed /approval
        router.push(`/${approvalType}/${row.id}${query}`, {
            scroll: false,
        });
    }, [approvalType, router, queryParams]);

    const { columns: tableColumns, middleCols } = useMemo(
        () => getTableColumns(approvalType, handleViewDetails, handleGenerateInvoicePdf),
        [approvalType, handleViewDetails, handleGenerateInvoicePdf]
    );

    const filterOptions = useMemo(() => {
        const rawData = records || [];
        return {
            companies: Array.from(
                new Map(rawData.map((i: any) => [i.companyId, i.companyName || String(i.companyId)])).entries()
            ).filter(([id]) => id).map(([id, name]) => ({ id, name })),
            departments: Array.from(new Set(rawData.map((i: any) => i.poStoreId))).filter(Boolean).map(id => ({
                id,
                name: rawData.find((i: any) => i.poStoreId === id)?.storeName || String(id)
            }))
        };
    }, [records]);

    return (
        <>
            <PdfViewerModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                pdfData={currentPdfData}
                title={currentPdfTitle}
            />

            <div className="min-h-screen bg-transparent pb-10">
                {hasSubTypes && !viewAll ? (
                    /* ── Sub-Card Dashboard View ───────────────────────────────── */
                    <div className="w-full">
                        {/* Child Dashboard Cards Grid */}
                        {childCards.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Layers className="h-10 w-10 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sub-Categories</h3>
                                <p className="text-gray-500">This approval type has no sub-categories configured.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {childCards.map((child: any) => (
                                    <DashboardCard
                                        key={child.sno}
                                        card={{
                                            id: child.sno,
                                            title: child.cardTitle,
                                            value: child.pendingCount || 0,
                                            iconKey: child.iconKey,
                                            routeSlug: child.routeSlug,
                                            backgroundColor: child.backgroundColor,
                                            childCount: 0,
                                        }}
                                        onClick={() => router.push(`/${child.routeSlug}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── Data Table View ─────────────────────────────────────── */
                    <div className="w-full space-y-6">
                        {/* Sub-Type Tabs — only when viewing all on a parent */}
                        {hasSubTypes && (
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => setViewAll(false)}
                                    className="px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-xl transition-all flex items-center gap-2"
                                >
                                    <ArrowLeft size={14} strokeWidth={3} />
                                    Back to Sub-Categories
                                </button>
                                <div className="flex flex-wrap gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200">
                                    <button
                                        className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                                    >
                                        {currentCard?.cardTitle || pageTitle}
                                    </button>
                                    {childCards.map((child: any) => (
                                        <button
                                            key={child.routeSlug}
                                            onClick={() => router.push(`/${child.routeSlug}`)}
                                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-2"
                                        >
                                            {child.cardTitle}
                                            {child.pendingCount > 0 && (
                                                <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none">
                                                    {child.pendingCount}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Advanced Filter Component */}
                        <FilterForm
                            filters={filters}
                            onFilterChange={setFilters}
                            onApplyFilters={handleApplyFilters}
                            onReset={handleResetFilters}
                            isLoading={isLoading}
                            title={`Filter ${pageTitle} Requests`}
                            filterOptions={filterOptions}
                        />

                        {/* Dynamic Data Table Implementation */}
                        <DataTable
                            title={`${pageTitle} Analysis`}
                            subTitle={`Active View`}
                            data={filteredData}
                            totalRows={filteredData.length}
                            columns={tableColumns}
                            isLoading={isLoading || recordsLoading}
                            showSearch={true}
                            onSearch={() => { }}
                            // Export Configuration
                            exportOptions={{
                                enabled: true,
                                formats: ['csv', 'excel', 'pdf'],
                                onExport: (format) => {
                                    const dataToExport = selectedRows.length > 0
                                        ? filteredData.filter((item: any) => selectedRows.includes(item.id))
                                        : filteredData;

                                    if (format === 'csv' || format === 'excel') {
                                        // Simple CSV key-value dump
                                        const headers = tableColumns.map(c => c.label).join(',');
                                        const rows = dataToExport.map((row: any) =>
                                            tableColumns.map(c => {
                                                const val = row[c.key as keyof typeof row];
                                                return typeof val === 'string' ? `"${val}"` : val;
                                            }).join(',')
                                        ).join('\n');

                                        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
                                        const encodedUri = encodeURI(csvContent);
                                        const link = document.createElement("a");
                                        link.setAttribute("href", encodedUri);
                                        link.setAttribute("download", `${pageTitle}_export_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xls' : 'csv'}`);
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        toast.success(`Exported ${dataToExport.length} records to ${format.toUpperCase()}`);
                                    } else if (format === 'pdf') {
                                        toast("Generating PDF...", { icon: '📄' });

                                        Promise.all([
                                            import('jspdf'),
                                            import('jspdf-autotable')
                                        ]).then(([jsPDFModule, autoTableModule]) => {
                                            const jsPDF = jsPDFModule.default;
                                            const autoTable = autoTableModule.default;
                                            const doc: any = new jsPDF();

                                            // 1. Header Section
                                            doc.setFontSize(18);
                                            doc.setTextColor(40, 40, 40);
                                            doc.text("Approval Requests Report", 14, 20);

                                            doc.setFontSize(10);
                                            doc.setTextColor(100, 100, 100);
                                            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
                                            doc.text(`Category: ${pageTitle}`, 14, 33);

                                            // 2. Define Columns & Rows
                                            const exportableColumns = tableColumns.filter(c => c.key !== 'action');
                                            const tableHead = exportableColumns.map(c => c.label);

                                            const tableBody = dataToExport.map((row: any) => {
                                                return exportableColumns.map(c => {
                                                    const val = row[c.key as keyof typeof row];
                                                    if (val === null || val === undefined) return '';
                                                    return String(val);
                                                });
                                            });

                                            // 3. Generate Table
                                            autoTable(doc, {
                                                head: [tableHead],
                                                body: tableBody,
                                                startY: 40,
                                                theme: 'grid',
                                                styles: {
                                                    fontSize: 8,
                                                    cellPadding: 3,
                                                    overflow: 'linebreak'
                                                },
                                                headStyles: {
                                                    fillColor: [79, 70, 229], // Indigo-600 to match theme
                                                    textColor: 255,
                                                    fontStyle: 'bold'
                                                },
                                                didDrawPage: (data: any) => {
                                                    const str = 'Page ' + doc.internal.getNumberOfPages();
                                                    doc.setFontSize(8);
                                                    const pageSize = doc.internal.pageSize;
                                                    const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                                                    doc.text(str, data.settings.margin.left, pageHeight - 10);
                                                }
                                            });

                                            // 4. Save
                                            doc.save(`${pageTitle}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
                                            toast.success("PDF Downloaded successfully");
                                        }).catch(err => {
                                            console.error("PDF Generation Error:", err);
                                            toast.error("Failed to generate PDF. Please try again.");
                                        });
                                    }
                                }
                            }}

                            // Custom Toolbar Actions
                            selection={{
                                enabled: true,
                                selectedRows,
                                onSelectedRowsChange: setSelectedRows
                            }}

                            // Expansion Configuration
                            expansion={{
                                enabled: true,
                                expandedRows,
                                hideExpansionColumn: true,
                                onExpandedRowsChange: setExpandedRows,
                                renderExpansion: (row: any) => (
                                    <div className="flex flex-col space-y-6 px-4 py-6 bg-slate-50/30 rounded-xl border border-slate-100 animate-in slide-in-from-top-2 duration-500">

                                        {/* --- Section 1.5: Request Details (moved from table so no side-scroll needed) --- */}
                                        {middleCols.length > 0 && (
                                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Request Details</p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-10">
                                                    {middleCols.map((mCol: Column, mIdx: number) => (
                                                        <div key={mCol.key || mIdx} className="space-y-1">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{mCol.label}</p>
                                                            <div className="text-[13px] font-bold text-slate-800">
                                                                {mCol.render ? mCol.render(row[mCol.key], row) : (row[mCol.key] !== null && row[mCol.key] !== undefined ? row[mCol.key] : '-')}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            }}

                            // Custom Toolbar Actions
                            toolbarActions={(
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => {
                                            setIsLoading(true);
                                            setTimeout(() => setIsLoading(false), 800);
                                        }}
                                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-indigo-600 transition-all shadow-sm active:rotate-180 duration-500"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                    <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 shadow-sm">
                                        <Settings size={16} />
                                    </button>
                                </div>
                            )}

                            // Bulk Actions Implementation
                            bulkActions={(ids: number[]) => (
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center bg-white rounded-lg p-0.5 shadow-sm">
                                        <select
                                            id="bulk-status-select"
                                            className="bg-transparent text-xs font-bold text-slate-700 py-1 pl-3 pr-8 outline-none border-none focus:ring-0 cursor-pointer"
                                            defaultValue=""
                                            onChange={(e) => {
                                                const status = e.target.value;
                                                if (!status || ids.length === 0) return;

                                                // Reset dropdown back to placeholder
                                                e.target.value = "";

                                                // Open modal for all statuses to confirm
                                                setPendingStatusUpdate({
                                                    ids: [...ids],
                                                    status: status as PendingStatusUpdate["status"]
                                                });
                                                setRemarksInput("");
                                                setIsRemarksModalOpen(true);
                                            }}
                                        >
                                            <option value="" disabled>Change Status To...</option>
                                            <option value="APPROVED">Approve Selected</option>
                                            <option value="REJECTED">Reject Selected</option>
                                            <option value="HOLD">Put on Hold</option>
                                        </select>

                                    </div>
                                </div>
                            )}

                            useInternalState={{
                                selection: false,
                                expansion: false,
                                pagination: true,
                                sorting: true
                            }}
                        />
                    </div >
                )}
            </div >
            {isRemarksModalOpen && (
                <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100 p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h3 className="text-lg font-bold text-slate-800">Status Confirmation</h3>
                            <button
                                onClick={() => setIsRemarksModalOpen(false)}
                                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm text-slate-500 font-medium">
                                You are about to mark <span className="text-indigo-600 font-bold">{pendingStatusUpdate?.ids?.length} request(s)</span> as <span className={`font-bold ${pendingStatusUpdate?.status === 'APPROVED' ? 'text-emerald-600' : pendingStatusUpdate?.status === 'REJECTED' ? 'text-rose-600' : 'text-amber-600'}`}>{pendingStatusUpdate?.status}</span>.
                            </p>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Remarks / Comments {pendingStatusUpdate?.status === 'HOLD' && <span className="text-rose-500">*</span>}</label>
                                <textarea
                                    value={remarksInput}
                                    onChange={(e) => setRemarksInput(e.target.value)}
                                    placeholder={pendingStatusUpdate?.status === 'HOLD' ? "Enter mandatory remarks for this action..." : "Enter remarks / comments (optional)"}
                                    className="w-full h-24 p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end space-x-3 pt-2">
                            <button
                                onClick={() => setIsRemarksModalOpen(false)}
                                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmStatusChange}
                                disabled={pendingStatusUpdate?.status === 'HOLD' ? !remarksInput.trim() : false}
                                className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center space-x-2"
                            >
                                <span>Confirm Update</span>
                                {isLoading && <RefreshCw size={14} className="animate-spin" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ApprovalDetailsPage;
