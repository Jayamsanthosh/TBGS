"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
//app/[approvalType]/[id]/page.tsx
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Download, AlertCircle, ArrowLeft, Loader2, FileText } from "lucide-react";
import ExpandableText from "@/app/components/ExpandableText";
import ApprovalDocuments from "@/app/components/ApprovalDetails/ApprovalDocuments";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchApprovalDetail, clearCurrentRecord } from "@/redux/slices/approvalSlice";

interface ViewDetailPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ViewDetailPage = ({ searchParams }: ViewDetailPageProps) => {
    const router = useRouter();
    const params = useParams();
    const dispatch = useAppDispatch();

    const approvalType = (params?.approvalType as string) || "";
    const id = (params?.id as string) || "";

    const { currentRecord: rowData, loading } = useAppSelector((state: any) => state.approval);

    // Get query parameters
    const [queryParams, setQueryParams] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!searchParams) return;
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

    useEffect(() => {
        if (approvalType && id) {
            dispatch(fetchApprovalDetail({ type: approvalType, id }));
        }

        return () => {
            dispatch(clearCurrentRecord());
        };
    }, [dispatch, approvalType, id]);

    const pageTitle = React.useMemo(() => {
        if (queryParams.cardTitle) return queryParams.cardTitle;
        return approvalType?.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    }, [approvalType, queryParams]);

    // Format currency amount
    const formatAmount = (amount: any, currency: string) => {
        if (amount === undefined || amount === null) return "N/A";
        return `${Number(amount).toLocaleString()} ${currency || ''}`;
    };

    // Table cells prefer a dash over "N/A" for a missing money value.
    const formatMoneyCell = (amount: any) => {
        if (amount === undefined || amount === null || amount === '') return "-";
        const n = Number(amount);
        return isNaN(n)
            ? String(amount)
            : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Dates arrive as ISO strings or as the SP's 'dd-MMM-yyyy' text.
    const formatDate = (value: any) => {
        if (value === undefined || value === null || value === '') return "N/A";
        const d = new Date(value);
        return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
    };

    // Get status badge styling
    const getStatusBadge = (status: string) => {
        const statusText = status || "PENDING";
        let bgColor = "bg-gray-100";
        let textColor = "text-gray-800";

        switch (statusText.toUpperCase()) {
            case "APPROVED":
                bgColor = "bg-green-100 uppercase";
                textColor = "text-green-800";
                break;
            case "HOLD":
                bgColor = "bg-yellow-100 uppercase";
                textColor = "text-yellow-800";
                break;
            case "REJECTED":
                bgColor = "bg-red-100 uppercase";
                textColor = "text-red-800";
                break;
            default:
                bgColor = "bg-gray-100 uppercase";
                textColor = "text-gray-800";
        }

        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${bgColor} ${textColor}`}>
                {statusText}
            </span>
        );
    };

    const isAttendance = approvalType === "attendance";
    const isPurchaseRequest = approvalType === "purchase-request" || approvalType === "purchase-requests";
    const isPurchaseQuotation = approvalType === "purchase-quotation" || approvalType === "purchase-quotations";
    const isPurchaseOrder = approvalType === "purchase-order" || approvalType === "purchase-orders";
    // Quotation and order lines both carry rate / discount / tax and FC + LC
    // money, so they share the priced line table.
    const isPricedLines = isPurchaseQuotation || isPurchaseOrder;

    const purchaseRequestSections = [
        {
            title: "Purchase Request",
            items: [
                { label: "PR Number", value: rowData?.poRefNo || "N/A" },
                { label: "PR Date", value: formatDate(rowData?.poDate) },
                { label: "Requested By", value: rowData?.requestedBy || "N/A" },
                { label: "Requester EMP ID", value: rowData?.empId ? `EMP ${rowData.empId}` : "N/A" },
                { label: "Company", value: rowData?.companyName || rowData?.companyId?.toString() || "N/A" },
                { label: "Branch", value: rowData?.branchName || rowData?.branchId?.toString() || "N/A" },
                { label: "Purchase Store", value: rowData?.requestStoreName || rowData?.storeName || "N/A" },
                { label: "Camp", value: rowData?.campName || rowData?.campId?.toString() || "N/A" },
            ]
        },
        {
            title: "Request Details",
            items: [
                { label: "Request Type", value: rowData?.requestTypeName || rowData?.purchaseType || "N/A" },
                { label: "Priority", value: rowData?.priorityName || "N/A" },
                { label: "Required Date", value: formatDate(rowData?.requiredDate) },
                { label: "Delivery Location", value: rowData?.deliveryLocationName || "N/A" },
                { label: "Reason", value: rowData?.reason || "N/A", isRemark: true },
                { label: "Remarks", value: rowData?.remarks || "N/A", isRemark: true },
            ]
        },
    ];

    const purchaseQuotationSections = [
        {
            title: "Purchase Quotation",
            items: [
                { label: "PQ Number", value: rowData?.purchaseQuotationNo || rowData?.poRefNo || "N/A" },
                { label: "PQ Date", value: formatDate(rowData?.purchaseQuotationDate || rowData?.poDate) },
                { label: "Purchase Request No", value: rowData?.purchaseRequestNo || "N/A" },
                { label: "Supplier", value: rowData?.supplierName || rowData?.supplier?.supplierName || "N/A" },
                { label: "Supplier Quote No", value: rowData?.supplierQuotationNo || "N/A" },
                { label: "Supplier Quote Date", value: formatDate(rowData?.supplierQuotationDate) },
                { label: "Company", value: rowData?.companyName || rowData?.company?.companyName || "N/A" },
                { label: "Branch", value: rowData?.branchName || "N/A" },
                { label: "Purchase Store", value: rowData?.poStoreName || rowData?.storeName || rowData?.requestStoreName || "N/A" },
                { label: "Camp", value: rowData?.campName || "N/A" },
                { label: "Created By", value: rowData?.createdBy || rowData?.requestedBy || "N/A" },
                { label: "Created Date", value: formatDate(rowData?.createdDate) },
            ]
        },
        {
            title: "Terms & Delivery",
            items: [
                { label: "Payment Term", value: rowData?.paymentTermName || "N/A" },
                { label: "Payment Mode", value: rowData?.paymentModeName || "N/A" },
                { label: "Shipment Mode", value: rowData?.shipmentModeName || "N/A" },
                { label: "Delivery Date", value: formatDate(rowData?.deliveryDate) },
                { label: "Delivery Term", value: rowData?.deliveryTerm || "N/A" },
                { label: "Delivery Location", value: rowData?.deliveryLocationName || "N/A" },
                { label: "Valid From", value: formatDate(rowData?.validFromDate) },
                { label: "Valid To", value: formatDate(rowData?.validToDate) },
                {
                    label: "Currency / FX",
                    value: rowData?.currencyName
                        ? `${rowData.currencyName}${rowData?.exchangeRate != null ? ` @ ${Number(rowData.exchangeRate).toLocaleString()}` : ""}`
                        : (rowData?.currencyType || "N/A")
                },
                { label: "Shipment Remarks", value: rowData?.shipmentRemarks || "N/A", isRemark: true },
                { label: "Remarks", value: rowData?.remarks || "N/A", isRemark: true },
            ]
        },
        {
            title: "Quotation Totals",
            items: [
                { label: "Subtotal (FC)", value: formatAmount(rowData?.subTotalAmount, rowData?.currencyName) },
                { label: "Subtotal (LC)", value: formatAmount(rowData?.subTotalAmountLc, "") },
                { label: "Discount (FC)", value: formatAmount(rowData?.discountAmount, rowData?.currencyName) },
                { label: "Total Product (FC)", value: formatAmount(rowData?.totalProductAmount, rowData?.currencyName) },
                { label: "Tax / VAT (FC)", value: formatAmount(rowData?.taxAmount, rowData?.currencyName) },
                { label: "Final Total (FC)", value: formatAmount(rowData?.totalAmount, rowData?.currencyName) },
                { label: "Final Total (LC)", value: formatAmount(rowData?.totalAmountLc, "") },
            ]
        },
    ];

    const purchaseOrderSections = [
        {
            title: "Purchase Order",
            items: [
                { label: "PO Number", value: rowData?.purchaseOrderNo || rowData?.poRefNo || "N/A" },
                { label: "PO Date", value: formatDate(rowData?.purchaseOrderDate || rowData?.poDate) },
                { label: "Supplier", value: rowData?.supplierName || rowData?.supplier?.supplierName || "N/A" },
                { label: "Company", value: rowData?.companyName || rowData?.company?.companyName || "N/A" },
                { label: "Branch", value: rowData?.branchName || "N/A" },
                { label: "Purchase Store", value: rowData?.poStoreName || rowData?.storeName || rowData?.requestStoreName || "N/A" },
                { label: "Camp", value: rowData?.campName || "N/A" },
                { label: "Order Status", value: rowData?.purchaseOrderStatusName || "N/A" },
                { label: "Created By", value: rowData?.createdBy || rowData?.requestedBy || "N/A" },
                { label: "Created Date", value: formatDate(rowData?.createdDate) },
            ]
        },
        {
            title: "Purchase References",
            items: [
                { label: "Purchase Quotation No", value: rowData?.purchaseQuotationNo || "N/A" },
                { label: "Purchase Request No", value: rowData?.purchaseRequestNo || "N/A" },
                { label: "Delivery Location", value: rowData?.deliveryLocationName || "N/A" },
                { label: "Reason", value: rowData?.reason || rowData?.shipmentRemarks || "N/A", isRemark: true },
                { label: "Remarks", value: rowData?.remarks || "N/A", isRemark: true },
            ]
        },
        {
            title: "Terms & Delivery",
            items: [
                { label: "Payment Term", value: rowData?.paymentTermName || "N/A" },
                { label: "Payment Mode", value: rowData?.paymentModeName || "N/A" },
                { label: "Shipment Mode", value: rowData?.shipmentModeName || "N/A" },
                { label: "Delivery Date", value: formatDate(rowData?.deliveryDate) },
                { label: "Delivery Term", value: rowData?.deliveryTerm || "N/A" },
                {
                    label: "Currency / FX",
                    value: rowData?.currencyName
                        ? `${rowData.currencyName}${rowData?.exchangeRate != null ? ` @ ${Number(rowData.exchangeRate).toLocaleString()}` : ""}`
                        : (rowData?.currencyType || "N/A")
                },
                { label: "Shipment Remarks", value: rowData?.shipmentRemarks || "N/A", isRemark: true },
            ]
        },
        {
            title: "Order Totals",
            items: [
                { label: "Subtotal (FC)", value: formatAmount(rowData?.subTotalAmount, rowData?.currencyName) },
                { label: "Subtotal (LC)", value: formatAmount(rowData?.subTotalAmountLc, "") },
                { label: "Discount (FC)", value: formatAmount(rowData?.discountAmount, rowData?.currencyName) },
                { label: "Additional Cost (FC)", value: formatAmount(rowData?.additionalCostAmount, rowData?.currencyName) },
                { label: "Total Product (FC)", value: formatAmount(rowData?.totalProductAmount, rowData?.currencyName) },
                { label: "Tax / VAT (FC)", value: formatAmount(rowData?.taxAmount, rowData?.currencyName) },
                { label: "Final Total (FC)", value: formatAmount(rowData?.totalAmount, rowData?.currencyName) },
                { label: "Final Total (LC)", value: formatAmount(rowData?.totalAmountLc, "") },
            ]
        },
    ];

    const detailSections = isAttendance
        ? [
            {
                title: `${pageTitle || 'Request'} Information`,
                items: [
                    { label: "Reference Number", value: rowData?.poRefNo || "N/A" },
                    { label: "Type", value: rowData?.purchaseType || "N/A" },
                    { label: "Company", value: rowData?.companyName || rowData?.companyId?.toString() || "N/A" },
                    { label: "Department", value: rowData?.departmentName || rowData?.departmentId?.toString() || "N/A" },
                    { label: "Designation", value: rowData?.designationName || "N/A" },
                    { label: "Store", value: rowData?.storeName || "N/A" },
                    { label: "Created Date", value: rowData?.createdDate || "N/A" },
                ]
            },
            {
                title: "Attendance Details",
                items: [
                    { label: "Attendance Type", value: rowData?.attendanceTypeName || rowData?.attendanceTypeId?.toString() || "N/A" },
                    { label: "Date From", value: rowData?.dateFrom || "N/A" },
                    { label: "Date To", value: rowData?.dateTo || "N/A" },
                    { label: "No. of Days", value: rowData?.noOfDays?.toString() || "N/A" },
                    { label: "Eligible Days", value: rowData?.eligibleDays?.toString() || "N/A" },
                    { label: "Balance Leave", value: rowData?.balanceLeave?.toString() || "N/A" },
                    { label: "Process Month", value: rowData?.monthEntered || "N/A" },
                    { label: "Process Year", value: rowData?.yearEntered?.toString() || "N/A" },
                    { label: "Reason", value: rowData?.reason || "N/A", isRemark: true },
                ]
            }
        ]
        : isPurchaseRequest
        ? purchaseRequestSections
        : isPurchaseQuotation
        ? purchaseQuotationSections
        : isPurchaseOrder
        ? purchaseOrderSections
        : [
            {
                title: `${pageTitle || 'Request'} Information`,
                items: [
                    { label: "Reference Number", value: rowData?.poRefNo || "N/A" },
                    { label: "Type", value: rowData?.purchaseType || "N/A" },
                    { label: "Cell", value: rowData?.cell || "N/A" },
                    { label: "Company", value: rowData?.companyName || rowData?.companyId?.toString() || "N/A" },
                    { label: "Department", value: rowData?.departmentName || rowData?.departmentId?.toString() || rowData?.poStoreId?.toString() || "N/A" },
                    { label: "Currency", value: rowData?.currencyType || "N/A" },
                    { label: "Total Amount", value: formatAmount(rowData?.amount ?? rowData?.totalFinalProductionHdrAmount, rowData?.currencyType) },
                    { label: "Created Date", value: rowData?.createdDate || "N/A" },
                ]
            },
            {
                title: "Supplier & Request Details",
                items: [
                    { label: "Supplier ID", value: rowData?.supplierId?.toString() || "N/A" },
                    { label: "Requested By", value: rowData?.requestedBy || "N/A" },
                    { label: "Requested Date", value: rowData?.requestedDate || "N/A" },
                ]
            }
        ];

    // Purchase requests carry the approver's name and a timestamp per level;
    // the HR rows only carry the EMP_ID, so the Date row is PR-only.
    const approvalDateItems = (value: any) =>
        isPurchaseRequest || isPurchaseQuotation || isPurchaseOrder ? [{ label: "Date", value: formatDate(value) }] : [];

    const approvalSections = [
        {
            title: "Section Head Approval",
            items: [
                { label: "Authority", value: rowData?.sectionHeadPersonName || rowData?.sectionHeadPerson || "Not Assigned" },
                { label: "Status", value: rowData?.sectionHeadStatus || "PENDING", isStatus: true },
                ...approvalDateItems(rowData?.sectionHeadDate),
                { label: "Remarks", value: rowData?.sectionHeadRemarks || "No remarks provided" },
            ]
        },
        {
            title: "First Approval Workflow",
            items: [
                { label: "Authority", value: rowData?.response1PersonName || rowData?.response1Person || "Not Assigned" },
                { label: "Status", value: rowData?.response1Status || "PENDING", isStatus: true },
                ...approvalDateItems(rowData?.response1Date),
                { label: "Remarks", value: rowData?.response1Remarks || "No remarks provided" },
            ]
        },
        {
            title: "Second Approval Workflow",
            items: [
                { label: "Authority", value: rowData?.response2PersonName || rowData?.response2Person || "Not Assigned" },
                { label: "Status", value: rowData?.response2Status || "PENDING", isStatus: true },
                ...approvalDateItems(rowData?.response2Date),
                { label: "Remarks", value: rowData?.response2Remarks || "No remarks provided" },
            ]
        }
    ];

    const productLineItems: any[] = Array.isArray(rowData?.productLineItems)
        ? rowData.productLineItems
        : [];

    const attachedFiles: any[] = Array.isArray(rowData?.files) ? rowData.files : [];


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4" />
                    <p className="text-slate-600 font-bold uppercase text-[12px] tracking-widest">Loading Detailed Analysis...</p>
                </div>
            </div>
        );
    }

    if (!rowData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-slate-100">
                    <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-rose-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Data Not Found</h2>
                    <p className="text-slate-500 mb-8 font-medium">
                        The requested approval record <span className="text-indigo-600 font-bold">#{id}</span> could not be retrieved from the vault.
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="w-full py-4 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={3} />
                        Return to List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <FileText size={20} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            {rowData.poRefNo}
                        </h1>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                        <span>{pageTitle}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span>SNO: {rowData.sno}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        {getStatusBadge(rowData.finalResponseStatus || 'PENDING')}
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 text-xs font-black text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all flex items-center shadow-sm active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={3} />
                        BACK TO LIST
                    </button>
                    <button className="px-6 py-3 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all flex items-center shadow-lg shadow-indigo-100 active:scale-95">
                        <Download className="w-4 h-4 mr-2" strokeWidth={3} />
                        DOWNLOAD PO
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {detailSections.map((section, idx) => (
                    <div key={idx} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100">
                            <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">{section.title}</h3>
                        </div>
                        <div className="p-8 flex-1">
                            <div className="grid grid-cols-1 gap-y-4">
                                {section.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 group">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-400 transition-colors">{item.label}</span>
                                        {(item as any).isRemark ? (
                                            <span className="text-[13px] font-medium text-slate-600 text-right italic max-w-[60%]">
                                                {item.value}
                                            </span>
                                        ) : (
                                            <span className="text-[14px] font-bold text-slate-800 text-right">{item.value}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Purchase Request / Purchase Quotation / Purchase Order Line Items */}
            {(isPurchaseRequest || isPricedLines) && (
                <div className="mb-8 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">
                            {isPurchaseOrder ? 'Order Lines' : isPurchaseQuotation ? 'Quotation Lines' : 'Request Lines'}
                        </h3>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                            {productLineItems.length} {productLineItems.length === 1 ? 'line' : 'lines'}
                        </span>
                    </div>
                    {productLineItems.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">
                            {isPurchaseOrder ? 'No order lines found.' : isPurchaseQuotation ? 'No quotation lines found.' : 'No request lines found.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50/70">
                                    <tr>
                                        {(isPricedLines
                                            ? ['#', 'Product', 'Description', 'Category', 'Reference', 'Qty', 'UOM', 'Rate', 'Disc %', 'Tax %', 'Final (FC)', 'Final (LC)']
                                            : ['#', 'Product', 'Description', 'Category', 'Reference', 'Qty', 'UOM', 'Packing', 'Truck', 'Required Date', 'Reason']
                                        ).map((heading) => (
                                            <th
                                                key={heading}
                                                className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap"
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {productLineItems.map((item: any, index: number) => (
                                        <tr key={item.id ?? index} className="border-t border-slate-50 hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-bold text-slate-500">{item.lineNo ?? index + 1}</td>
                                            <td className="px-4 py-3 font-bold text-slate-800">{item.productName || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600">{item.description || item.remarks || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {[item.mainCategoryName, item.subCategoryName].filter(Boolean).join(' / ') || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {[item.referenceTypeName, item.referenceNo].filter(Boolean).join(' ') || '-'}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-800 text-right">{item.totalQuantity ?? '-'}</td>
                                            <td className="px-4 py-3 text-slate-600">{item.uomName || '-'}</td>
                                            {isPricedLines ? (
                                                <>
                                                    <td className="px-4 py-3 text-slate-700 text-right whitespace-nowrap">{formatMoneyCell(item.rate ?? item.ratePerPcs)}</td>
                                                    <td className="px-4 py-3 text-slate-600 text-right whitespace-nowrap">{item.discountPercentage != null ? `${Number(item.discountPercentage)}%` : '-'}</td>
                                                    <td className="px-4 py-3 text-slate-600 text-right whitespace-nowrap">{item.taxPercentage != null ? `${Number(item.taxPercentage)}%` : '-'}</td>
                                                    <td className="px-4 py-3 font-semibold text-slate-800 text-right whitespace-nowrap">{formatMoneyCell(item.finalAmount ?? item.amount)}</td>
                                                    <td className="px-4 py-3 text-slate-600 text-right whitespace-nowrap">{formatMoneyCell(item.finalAmountLc)}</td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-3 text-slate-600">{item.totalPacking ?? '-'}</td>
                                                    <td className="px-4 py-3 text-slate-600">{item.truckNo || '-'}</td>
                                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(item.requiredDate)}</td>
                                                    <td className="px-4 py-3 text-slate-600 max-w-[240px]">{item.reason || '-'}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Purchase Quotation / Purchase Order Additional Charges */}
            {isPricedLines && Array.isArray(rowData?.additionalCosts) && rowData.additionalCosts.length > 0 && (
                <div className="mb-8 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">
                            Additional Charges
                        </h3>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                            {rowData.additionalCosts.length} {rowData.additionalCosts.length === 1 ? 'charge' : 'charges'}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/70">
                                <tr>
                                    {['#', 'Charge Type', 'Description', 'Qty', 'Rate', 'Tax %', 'Total (FC)', 'Final (FC)', 'Final (LC)'].map((heading) => (
                                        <th
                                            key={heading}
                                            className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap"
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rowData.additionalCosts.map((charge: any, index: number) => (
                                    <tr key={charge.id ?? index} className="border-t border-slate-50 hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-bold text-slate-500">{charge.lineNo ?? index + 1}</td>
                                        <td className="px-4 py-3 font-bold text-slate-800">{charge.chargeTypeName || charge.additionalCostType || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{charge.description || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600 text-right">{charge.quantity ?? '-'}</td>
                                        <td className="px-4 py-3 text-slate-700 text-right whitespace-nowrap">{formatMoneyCell(charge.rate)}</td>
                                        <td className="px-4 py-3 text-slate-600 text-right whitespace-nowrap">{charge.taxPercentage != null ? `${Number(charge.taxPercentage)}%` : '-'}</td>
                                        <td className="px-4 py-3 text-slate-700 text-right whitespace-nowrap">{formatMoneyCell(charge.totalAmount)}</td>
                                        <td className="px-4 py-3 font-semibold text-slate-800 text-right whitespace-nowrap">{formatMoneyCell(charge.finalAmount)}</td>
                                        <td className="px-4 py-3 text-slate-600 text-right whitespace-nowrap">{formatMoneyCell(charge.finalAmountLc)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Attached Documents */}
            {(isPurchaseRequest || isPricedLines) && (
                <div className="mb-8 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">
                            Documents / Attachments
                        </h3>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                            {attachedFiles.length} {attachedFiles.length === 1 ? 'document' : 'documents'}
                        </span>
                    </div>
                    <div className="p-6">
                        <ApprovalDocuments
                            files={attachedFiles}
                            emptyMessage="No documents were attached to this record."
                        />
                    </div>
                </div>
            )}

            {/* Approval Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {approvalSections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="bg-indigo-50/30 px-8 py-5 border-b border-slate-100 flex items-center space-x-2">
                            <div className="w-5 h-5 rounded-md bg-indigo-600 text-[10px] font-black text-white flex items-center justify-center">0{sectionIndex + 1}</div>
                            <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">{section.title}</h3>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 gap-y-6">
                                {section.items.map((item, itemIndex) => (
                                    <div key={itemIndex}>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">{item.label}</div>
                                        {item.isStatus ? (
                                            <div className="inline-block">{getStatusBadge(item.value)}</div>
                                        ) : (
                                            <div className={`
                                                p-4 rounded-2xl transition-all
                                                ${item.label === "Remarks"
                                                    ? "italic bg-slate-50 border border-slate-100 text-slate-600 font-medium text-[13px]"
                                                    : "bg-white text-slate-800 font-bold text-[15px] p-0"}
                                            `}>
                                                {item.label === "Remarks" ? (
                                                    <ExpandableText text={item.value} limit={60} />
                                                ) : (
                                                    item.value
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ViewDetailPage;