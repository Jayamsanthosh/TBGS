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
    FileText,
    MessageSquareMore,
    ArrowLeft,
    Layers
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import ExpandableText from "../components/ExpandableText";

import PdfViewerModal from "../components/ApprovalDetails/PdfViewerModal";
import DashboardCard from "../components/DashboardCard";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchApprovalRecords, updateApprovalStatusByType } from "@/redux/slices/approvalSlice";
import { fetchDashboardCards } from "@/redux/slices/dashboardSlice";

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
    onViewDocument: (row: any) => void,
    onGenerateInvoicePdf: (row: any) => void | Promise<void>,
    onViewConversation: (row: any) => void
): Column[] {
    const nType = (approvalType || '').toLowerCase();
    const isPO = nType === 'purchase-order';
    const isWO = nType === 'work-order';
    const isPA = nType === 'price-approval';
    const isSR = nType === 'sales-return-approval';

    const refLabel = isPO ? 'PO NO' : isWO ? 'WO NO' : isPA ? 'PA NO' : isSR ? 'SR NO' : 'REF NO';

    return [
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
                            onViewDocument(row);
                        }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-200 shrink-0"
                        title="View Document"
                    >
                        <FileText size={16} strokeWidth={2.5} />
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
                            src="/pdf_icon.png"
                            alt="PDF"
                            width={16}
                            height={16}
                            className="block w-4 h-4 object-contain"
                        />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewConversation(row);
                        }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-amber-600 hover:bg-amber-50 transition-all border border-transparent hover:border-amber-100 shrink-0"
                        title="Conversation"
                    >
                        <MessageSquareMore size={16} strokeWidth={2.5} />
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
        {
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
        },
        {
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
        }
    ];
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

    const handleViewConversation = React.useCallback((row: any) => {
        router.push(`/${approvalType}/conversation?poRefNo=${row.poRefNo}`);
    }, [router, approvalType]);


    const handleViewDocument = React.useCallback(async (row: any) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/approvals/${approvalType}/${row.sno || row.id}`);
            if (!res.ok) throw new Error('Failed to fetch document');
            const detail = await res.json();
            const matchingFiles: any[] = detail?.files || [];

            if (matchingFiles.length === 0) {
                toast.error(`No document found for ${row.poRefNo}`);
                return;
            }

            const selectedFile =
                matchingFiles.find((file: any) => file.fileType === 'INVOICE' && file.contentType === 'application/pdf') ||
                matchingFiles.find((file: any) => file.contentType === 'application/pdf');

            if (!selectedFile?.contentData) {
                toast.error(`Document content is missing for ${row.poRefNo}`);
                return;
            }

            setCurrentPdfData(selectedFile.contentData);
            setCurrentPdfTitle(`Document - ${row.poRefNo}`);
            setIsPdfModalOpen(true);
            toast.success(`Opening document for ${row.poRefNo}...`);
        } catch {
            toast.error(`Failed to open document for ${row.poRefNo}`);
        } finally {
            setIsLoading(false);
        }
    }, [approvalType]);

    const handleGenerateInvoicePdf = React.useCallback(async (row: any) => {
        setIsLoading(true);
        try {
            // ── Fetch live data from API ──────────────────────────────────────
            const res = await fetch(`/api/approvals/${approvalType}/${row.sno || row.id}`);
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

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text(invoiceTitle.toUpperCase(), margin, 14);

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

            // 6. PO Number / Roll No Search
            if (filters.poRollNo && !item.poRefNo.toLowerCase().includes(filters.poRollNo.toLowerCase())) return false;

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

    const tableColumns = useMemo(
        () => getTableColumns(approvalType, handleViewDetails, handleViewDocument, handleGenerateInvoicePdf, handleViewConversation),
        [approvalType, handleViewDetails, handleViewDocument, handleGenerateInvoicePdf, handleViewConversation]
    );

    const filterOptions = useMemo(() => {
        const rawData = records || [];
        return {
            companies: Array.from(
                new Map(rawData.map((i: any) => [i.companyId, i.companyName || String(i.companyId)])).entries()
            ).filter(([id]) => id).map(([id, name]) => ({ id, name })),
            purchaseTypes: Array.from(new Set(rawData.map((i: any) => i.purchaseType))).filter(Boolean).map(String),
            suppliers: Array.from(new Set(rawData.map((i: any) => i.supplierId))).filter(Boolean).map(id => ({
                id,
                name: rawData.find((i: any) => i.supplierId === id)?.supplierName || String(id)
            })),
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

                                        {/* --- Section 1: Request DNA (Metadata Summary) --- */}
                                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-x-12 gap-y-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Organization Unit</span>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]"></div>
                                                    <span className="text-[14px] font-bold text-slate-800">
                                                        {row.companyName || row.companyId}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col border-l border-slate-100 pl-8">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Currency Axis</span>
                                                <p className="text-[14px] font-bold text-slate-800 uppercase flex items-center space-x-1.5">
                                                    <span className="text-slate-400 font-medium">{row.currencyType || 'TZS'}</span>
                                                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">BASE</span>
                                                </p>
                                            </div>
                                            <div className="flex flex-col border-l border-slate-100 pl-8">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Operational Dept</span>
                                                <p className="text-[14px] font-bold text-slate-800">
                                                    {row.storeName || row.poStoreId}
                                                </p>
                                            </div>
                                            <div className="flex flex-col border-l border-slate-100 pl-8">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Source Record</span>
                                                <p className="text-[14px] font-bold text-slate-800 flex items-center space-x-1.5">
                                                    <span className="text-indigo-600">#{row.sno?.toString().padStart(4, '0')}</span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                                    <span className="text-slate-500">{row.poRefNo}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* --- Section 2: Workflow Lifecycle (Dual Tracking) --- */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Enhanced Response 1 Log */}
                                            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                <div className="bg-indigo-50/50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">01</div>
                                                        <span className="text-[12px] font-black text-slate-800 uppercase tracking-tight">Technical Review</span>
                                                    </div>
                                                    <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${row.response1Status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                                        }`}>
                                                        {row.response1Status || "AWAITING"}
                                                    </span>
                                                </div>

                                                <div className="p-5 space-y-5">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                                            <Eye className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Reviewing Authority</p>
                                                            <p className="text-[14px] font-bold text-slate-800">{row.response1Person || "Not Initiated"}</p>
                                                        </div>
                                                    </div>

                                                    <div className="relative pl-4 border-l-2 border-slate-100 py-1">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Audit Remarks</p>
                                                        <div className="text-[13px] text-slate-600 leading-relaxed font-medium capitalize italic">
                                                            "<ExpandableText text={row.response1Remarks || "Pending technical validation of specific line items and supplier terms."} limit={100} />"
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Enhanced Response 2 Log */}
                                            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                <div className="bg-indigo-50/50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">02</div>
                                                        <span className="text-[12px] font-black text-slate-800 uppercase tracking-tight">Executive Decision</span>
                                                    </div>
                                                    <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${row.response2Status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                                        }`}>
                                                        {row.response2Status || "PENDING"}
                                                    </span>
                                                </div>

                                                <div className="p-5 space-y-5">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                                            <Settings className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Approving Authority</p>
                                                            <p className="text-[14px] font-bold text-slate-800">{row.response2Person || "Final Tier Pending"}</p>
                                                        </div>
                                                    </div>

                                                    <div className="relative pl-4 border-l-2 border-slate-100 py-1">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Final Remarks</p>
                                                        <div className="text-[13px] text-slate-600 leading-relaxed font-medium capitalize italic">
                                                            "<ExpandableText text={row.response2Remarks || "Awaiting final sign-off from the department head to execute procurement."} limit={100} />"
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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
                            {pendingStatusUpdate?.status === 'HOLD' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Remarks / Comments <span className="text-rose-500">*</span></label>
                                    <textarea
                                        value={remarksInput}
                                        onChange={(e) => setRemarksInput(e.target.value)}
                                        placeholder="Enter mandatory remarks for this action..."
                                        className="w-full h-24 p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            )}
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
