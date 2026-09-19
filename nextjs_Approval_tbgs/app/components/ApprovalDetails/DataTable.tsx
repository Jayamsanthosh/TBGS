"use client";
// app/components/ApprovalDetails/DataTable.tsx
import React, { useState, useMemo, useEffect } from "react";
import {
    ChevronUp,
    ChevronDown,
    Download,
    Search,
    Eye,
    Filter as FilterIcon,
    Loader2,
    AlertCircle
} from "lucide-react";
import Pagination from "./Pagination";
import axios from "axios";
import toast from "react-hot-toast";

export interface Column {
    key: string;
    label: string;
    responsiveClass?: string;
    headerAlign?: 'left' | 'center' | 'right';
    width?: string;
    render?: (value: any, row?: any, options?: any) => React.ReactNode;
}

interface PaginationProps {
    enabled: boolean;
    currentPage: number;
    itemsPerPage: number | string;
    onPageChange?: (page: number) => void;
    onItemsPerPageChange?: (value: number | string) => void;
}

interface SortingProps {
    enabled: boolean;
    sortConfig: { key: string | null; direction: 'asc' | 'desc' };
    onSortChange?: (config: { key: string; direction: 'asc' | 'desc' }) => void;
}

interface SelectionProps {
    enabled: boolean;
    selectedRows: any[];
    onSelectedRowsChange?: (rows: any[]) => void;
}

interface ExpansionProps {
    enabled: boolean;
    expandedRows: any[];
    expandedColumns?: Column[];
    hideExpansionColumn?: boolean;
    onExpandedRowsChange?: (rows: any[]) => void;
    renderExpansion?: (row: any, columns?: Column[]) => React.ReactNode;
}

interface ExportOptions {
    enabled: boolean;
    onExport?: (format: string) => void;
    formats: string[];
}

interface UseInternalState {
    selection: boolean;
    expansion: boolean;
    pagination: boolean;
    sorting: boolean;
}

interface DataTableProps {
    data?: any[];
    columns: Column[];
    rowKey?: string;
    title?: string;
    subTitle?: string;
    isLoading?: boolean;
    selection?: SelectionProps;
    expansion?: ExpansionProps;
    totalRows?: number;
    pagination?: PaginationProps;
    sorting?: SortingProps;
    exportOptions?: ExportOptions;
    bulkActions?: (ids: any[]) => React.ReactNode;
    toolbarActions?: React.ReactNode;
    emptyMessage?: string;
    showSearch?: boolean;
    onSearch?: (term: string) => void;
    useInternalState?: UseInternalState;

    // API Integration Props
    apiEndpoint?: string;
    approvalCode?: string;
    autoFetch?: boolean;
    onDataFetched?: (data: any[]) => void;
}

/**
 * A highly reusable and dynamic DataTable component with API integration.
 */
const DataTable: React.FC<DataTableProps> = ({
    data: propData = [],
    columns = [],
    rowKey = "id",
    title,
    subTitle,
    isLoading: propIsLoading = false,

    // Selection
    selection = {
        enabled: true,
        selectedRows: [],
        onSelectedRowsChange: () => { }
    },

    // Expansion
    expansion = {
        enabled: false,
        expandedRows: [],
        expandedColumns: [],
        onExpandedRowsChange: () => { },
        renderExpansion: null
    },

    totalRows: propTotalRows = null,

    // Pagination
    pagination = {
        enabled: true,
        currentPage: 1,
        itemsPerPage: 10,
        onPageChange: () => { },
        onItemsPerPageChange: () => { }
    },

    // Sorting
    sorting = {
        enabled: true,
        sortConfig: { key: null, direction: 'asc' },
        onSortChange: () => { }
    },

    // Export
    exportOptions = {
        enabled: true,
        onExport: (format) => console.log(`Export as ${format}`),
        formats: ['csv', 'excel', 'pdf']
    },

    // Custom Components/Elements
    bulkActions = null,
    toolbarActions = null,
    emptyMessage = "No records found",
    showSearch = false,
    onSearch = () => { },

    // Internal State Fallbacks
    useInternalState = {
        selection: true,
        expansion: true,
        pagination: true,
        sorting: true
    },

    // API Integration
    apiEndpoint,
    approvalCode,
    autoFetch = true,
    onDataFetched
}) => {
    // --- API State ---
    const [apiData, setApiData] = useState<any[]>([]);
    const [apiLoading, setApiLoading] = useState(false);
    const [apiTotalRows, setApiTotalRows] = useState(0);
    const [apiError, setApiError] = useState<string | null>(null);

    // --- Internal State ---
    const [internalSelectedRows, setInternalSelectedRows] = useState<any[]>([]);
    const [internalExpandedRows, setInternalExpandedRows] = useState<any[]>([]);
    const [internalCurrentPage, setInternalCurrentPage] = useState(1);
    const [internalItemsPerPage, setInternalItemsPerPage] = useState<number | string>(pagination.itemsPerPage || 10);
    const [internalSortConfig, setInternalSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState("");
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    // --- Effective Data Source ---
    const effectiveData = apiEndpoint ? apiData : propData;
    const effectiveIsLoading = apiEndpoint ? apiLoading : propIsLoading;
    const effectiveTotalItems = apiEndpoint ? apiTotalRows : (propTotalRows !== null ? propTotalRows : effectiveData.length);

    // --- Fetch Data from API ---
    useEffect(() => {
        if (!autoFetch || !apiEndpoint) return;

        const fetchData = async () => {
            try {
                setApiLoading(true);
                setApiError(null);

                const token = localStorage.getItem("accessToken");
                if (!token) {
                    throw new Error("No authentication token found");
                }

                // Determine approval code from props or extract from URL
                let code = approvalCode;
                if (!code && typeof window !== 'undefined') {
                    const pathParts = window.location.pathname.split('/');
                    const approvalIndex = pathParts.indexOf('approval');
                    if (approvalIndex !== -1 && pathParts[approvalIndex + 1]) {
                        code = pathParts[approvalIndex + 1];
                    }
                }

                // Map route slug to approval code
                const approvalCodeMap: Record<string, string> = {
                    'po-approval': 'PO_APPROVAL',
                    'cash-advance-approval': 'CASH_ADVANCE_APPROVAL',
                    'credit-limit-approval': 'CREDIT_LIMIT_APPROVAL',
                    'price-approval': 'PRICE_APPROVAL',
                    'goods-request-approval': 'GOODS_REQUEST_APPROVAL',
                    'inter-company-approval': 'INTERCOMPANY_APPROVAL',
                    'sales-return-approval': 'SALES_RETURN_APPROVAL',
                    'gate-pass-approval': 'GATE_PASS_APPROVAL',
                    'product-creation-approval': 'PRODUCT_CREATION_APPROVAL',
                    'customer-creation-approval': 'CUSTOMER_CREATION_APPROVAL',
                    'wastage-delivery-approval': 'WASTAGE_DELIVERY_APPROVAL',
                    'work-order-approval': 'WORK_ORDER_APPROVAL',
                    'pfl-work-order-approval': 'PFL_WORK_ORDER_APPROVAL',
                    'pprb-roll-cutt-templates': 'PPRB_ROLL_CUTT_TEMPLATES',
                    'expat-travel-leave-approval': 'EXPAT_TRAVEL_LEAVE_APPROVAL',
                    'sales-pi-approval': 'SALES_PI_APPROVAL',
                    'purchase-pi-approval': 'PURCHASE_PI_APPROVAL',
                    'apparels-dashboard': 'APPARELS_DASHBOARD',
                    'po-approval-head': 'PO_APPROVAL_HEAD',
                    'overtime-approval': 'OVERTIME_APPROVAL',
                    'expat-leave-encashment': 'EXPAT_LEAVE_ENCASHMENT',
                    'bonce-po-approval': 'BONCE_PO_APPROVAL',
                    'bond-release-approval': 'BOND_RELEASE_APPROVAL',
                };

                const finalApprovalCode = code || approvalCodeMap[code || ''] || 'PO_APPROVAL';

                const params: any = {
                    page: useInternalState.pagination ? internalCurrentPage : pagination.currentPage,
                    limit: useInternalState.pagination && internalItemsPerPage !== 'all'
                        ? Number(internalItemsPerPage)
                        : 10,
                };

                // FIX: Only add status param if it's not 'ALL'
                if (filterStatus && filterStatus !== 'ALL') {
                    params.status = filterStatus;
                }

                if (searchTerm) {
                    params.search = searchTerm;
                }

                const response = await axios.get(
                    apiEndpoint || `/api/approvals/${finalApprovalCode}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        params
                    }
                );

                setApiData(response.data.data || []);
                setApiTotalRows(response.data.pagination?.total || 0);
                onDataFetched?.(response.data.data || []);

            } catch (error: any) {
                console.error('API fetch error:', error);
                setApiError(error.message || 'Failed to load data');
                toast.error(error.response?.data?.error || 'Failed to load data');
            } finally {
                setApiLoading(false);
            }
        };

        fetchData();
    }, [
        apiEndpoint,
        approvalCode,
        autoFetch,
        useInternalState.pagination ? internalCurrentPage : pagination.currentPage,
        useInternalState.pagination ? internalItemsPerPage : pagination.itemsPerPage,
        filterStatus, // FIX: Now properly tracked
        searchTerm
    ]);

    // --- Effective State ---
    const effectiveSelectedRows = useInternalState.selection ? internalSelectedRows : selection.selectedRows;
    const effectiveExpandedRows = useInternalState.expansion ? internalExpandedRows : expansion.expandedRows;
    const effectiveCurrentPage = useInternalState.pagination ? internalCurrentPage : pagination.currentPage;
    const effectiveItemsPerPage = useInternalState.pagination ? internalItemsPerPage : pagination.itemsPerPage;
    const effectiveSortConfig = useInternalState.sorting ? internalSortConfig : sorting.sortConfig;

    // --- Data Processing (only for client-side data, API data is already paginated) ---
    const filteredData = useMemo(() => {
        if (apiEndpoint) return effectiveData; // API data is already filtered

        let result = effectiveData;

        // Client-side Status Filter
        if (filterStatus && filterStatus !== 'ALL') {
            result = result.filter(row => {
                // Check common status field names
                const statusValue = row.status || row.finalResponseStatus || row.statusEntry || row.finalStatus;
                return statusValue && String(statusValue).toUpperCase() === filterStatus;
            });
        }

        if (!searchTerm) return result;
        const lowerSearch = searchTerm.toLowerCase();
        return result.filter(row =>
            Object.values(row).some(val =>
                String(val).toLowerCase().includes(lowerSearch)
            )
        );
    }, [effectiveData, searchTerm, apiEndpoint, filterStatus]);

    const sortedData = useMemo(() => {
        if (apiEndpoint) return filteredData; // API sorting handled by backend

        if (!effectiveSortConfig.key) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = a[effectiveSortConfig.key!];
            const bValue = b[effectiveSortConfig.key!];

            if (aValue === bValue) return 0;
            if (aValue < bValue) return effectiveSortConfig.direction === 'asc' ? -1 : 1;
            return effectiveSortConfig.direction === 'asc' ? 1 : -1;
        });
    }, [filteredData, effectiveSortConfig, apiEndpoint]);

    const isPaginationAll = effectiveItemsPerPage === 'all';
    const totalPages = isPaginationAll ? 1 : Math.ceil(effectiveTotalItems / Number(effectiveItemsPerPage));

    const paginatedData = useMemo(() => {
        if (apiEndpoint) return sortedData; // API data is already paginated

        if (isPaginationAll || !pagination.enabled) return sortedData;
        const start = (effectiveCurrentPage - 1) * Number(effectiveItemsPerPage);
        return sortedData.slice(start, start + Number(effectiveItemsPerPage));
    }, [sortedData, effectiveCurrentPage, effectiveItemsPerPage, pagination.enabled, isPaginationAll, apiEndpoint]);

    // --- Handlers ---
    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        if (useInternalState.pagination) setInternalCurrentPage(page);
        pagination.onPageChange?.(page);
    };

    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
        if (useInternalState.pagination) {
            setInternalItemsPerPage(value);
            setInternalCurrentPage(1);
        }
        pagination.onItemsPerPageChange?.(value);
    };

    const handleSort = (key: string) => {
        if (!sorting.enabled || apiEndpoint) return;
        let direction: 'asc' | 'desc' = 'asc';
        if (effectiveSortConfig.key === key && effectiveSortConfig.direction === 'asc') {
            direction = 'desc';
        }
        const newConfig = { key, direction };
        if (useInternalState.sorting) setInternalSortConfig(newConfig);
        sorting.onSortChange?.(newConfig);
    };

    const handleRowSelect = (id: any) => {
        const newSelected = effectiveSelectedRows.includes(id)
            ? effectiveSelectedRows.filter(rowId => rowId !== id)
            : [...effectiveSelectedRows, id];

        if (useInternalState.selection) setInternalSelectedRows(newSelected);
        selection.onSelectedRowsChange?.(newSelected);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        const pageIds = paginatedData.map(row => row[rowKey]);

        let newSelected;
        if (isChecked) {
            newSelected = [...new Set([...effectiveSelectedRows, ...pageIds])];
        } else {
            newSelected = effectiveSelectedRows.filter(id => !pageIds.includes(id));
        }

        if (useInternalState.selection) setInternalSelectedRows(newSelected);
        selection.onSelectedRowsChange?.(newSelected);
    };

    const toggleRowExpansion = (id: any) => {
        const newExpanded = effectiveExpandedRows.includes(id)
            ? effectiveExpandedRows.filter(rowId => rowId !== id)
            : [...effectiveExpandedRows, id];

        if (useInternalState.expansion) setInternalExpandedRows(newExpanded);
        expansion.onExpandedRowsChange?.(newExpanded);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        onSearch(e.target.value);
    };

    const handleStatusFilterChange = (status: string) => {
        setFilterStatus(status);
        if (useInternalState.pagination) setInternalCurrentPage(1);

        // Clear cached data to force refresh with new filter
        if (apiEndpoint) {
            setApiData([]);
        }
    };

    const handleRefresh = () => {
        if (apiEndpoint) {
            // Trigger re-fetch by forcing a state update
            setApiLoading(true);
            setApiData([]);
            // This will trigger the useEffect
            setInternalCurrentPage(prev => prev);
        }
    };

    // Combined expansion columns
    const effectiveExpansionColumns = useMemo(() => {
        const hidden = columns.filter(col => col.responsiveClass && col.responsiveClass.includes('hidden'));
        return [...(expansion.expandedColumns || []), ...hidden];
    }, [expansion.expandedColumns, columns]);

    // Error state
    if (apiError) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-red-200">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Failed to Load Data</h3>
                <p className="text-gray-600 text-center mb-4">{apiError}</p>
                <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Search and Filter Bar */}
            {showSearch && (
                <div className="bg-white px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by PO number, supplier, product..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Status Filter - FIXED: Properly handling ALL option */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Status:</span>
                        <select
                            value={filterStatus}
                            onChange={(e) => handleStatusFilterChange(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="HOLD">Hold</option>
                            <option value="ALL">All</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Table Toolbar */}
            <div className="bg-white px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
                <div>
                    <h3 className="text-[17px] font-bold text-slate-800 tracking-tight">
                        {title} <span className="mx-1.5 opacity-40">•</span> <span className="text-[15px] font-semibold text-slate-500">{effectiveTotalItems} records found</span>
                    </h3>
                    <p className="text-[13px] text-slate-400 font-medium">
                        {effectiveTotalItems} records total • {effectiveSelectedRows.length} selected
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    {/* Items Per Page */}
                    <div className="flex items-center space-x-2">
                        <span className="text-[13px] text-slate-500 font-semibold">Show:</span>
                        <div className="relative">
                            <select
                                value={effectiveItemsPerPage}
                                onChange={handleItemsPerPageChange}
                                className="appearance-none bg-gray-50/50 border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-[13px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                                disabled={!!apiEndpoint}
                            >
                                {[10, 25, 50, 'all'].map(val => (
                                    <option key={val} value={val}>{val === 'all' ? 'All' : val}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Export Button */}
                    {exportOptions.enabled && (
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className="flex items-center space-x-2 px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all outline-none"
                            >
                                <Download className="w-3.5 h-3.5 text-slate-400" />
                                <span>Export</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showExportMenu && (
                                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in zoom-in-95 duration-200 origin-top-right">
                                    {exportOptions.formats.map(format => (
                                        <button
                                            key={format}
                                            onClick={() => {
                                                exportOptions.onExport?.(format);
                                                setShowExportMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors capitalize"
                                        >
                                            Export as {format}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Refresh Button (for API) */}
                    {apiEndpoint && (
                        <button
                            onClick={handleRefresh}
                            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                            title="Refresh data"
                        >
                            <Loader2 className={`w-4 h-4 ${apiLoading ? 'animate-spin' : ''}`} />
                        </button>
                    )}

                    {toolbarActions}
                </div>
            </div>

            {/* Bulk Actions */}
            {effectiveSelectedRows.length > 0 && bulkActions && (
                <div className="bg-indigo-600 text-white px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[13px] font-bold">{effectiveSelectedRows.length} items selected</span>
                    {bulkActions(effectiveSelectedRows)}
                </div>
            )}

            {/* Main Table Area */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#c7d2fe]/50 border-b border-gray-200">
                        <tr>
                            {selection.enabled && (
                                <th className="w-12 px-4 py-3.5 text-center">
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={paginatedData.length > 0 && paginatedData.every(row => effectiveSelectedRows.includes(row[rowKey]))}
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                </th>
                            )}

                            {columns.map((col, idx) => (
                                <th
                                    key={col.key || idx}
                                    onClick={() => handleSort(col.key)}
                                    style={{ width: col.width }}
                                    className={`px-4 py-3.5 text-[12px] font-black text-slate-600 uppercase tracking-widest cursor-pointer hover:bg-indigo-100/50 transition-colors whitespace-nowrap ${col.responsiveClass || ''}`}
                                >
                                    <div className={`flex items-center space-x-1.5 ${col.headerAlign === 'center' ? 'justify-center' : col.headerAlign === 'right' ? 'justify-end' : ''}`}>
                                        <span>{col.label}</span>
                                        {sorting.enabled && !apiEndpoint && (
                                            <div className="flex flex-col opacity-20">
                                                <ChevronUp className={`w-2 h-2 ${effectiveSortConfig.key === col.key && effectiveSortConfig.direction === 'asc' ? 'opacity-100 text-indigo-700' : ''}`} />
                                                <ChevronDown className={`w-2 h-2 ${effectiveSortConfig.key === col.key && effectiveSortConfig.direction === 'desc' ? 'opacity-100 text-indigo-700' : ''}`} />
                                            </div>
                                        )}
                                    </div>
                                </th>
                            ))}

                            {expansion.enabled && !expansion.hideExpansionColumn && (
                                <th className="w-12 px-4 py-3.5">
                                    <span className="sr-only">Details</span>
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {effectiveIsLoading ? (
                            // Loading skeleton
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={columns.length + (selection.enabled ? 1 : 0) + (expansion.enabled ? 1 : 0)} className="p-4">
                                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (selection.enabled ? 1 : 0) + (expansion.enabled ? 1 : 0)} className="py-20 text-center">
                                    <div className="flex flex-col items-center">
                                        <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                                        <p className="text-slate-500 font-medium">{emptyMessage}</p>
                                        <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, rowIdx) => (
                                <React.Fragment key={row[rowKey] || rowIdx}>
                                    <tr className={`hover:bg-slate-50/50 transition-colors ${effectiveSelectedRows.includes(row[rowKey]) ? 'bg-indigo-50/30' : ''}`}>
                                        {selection.enabled && (
                                            <td className="px-4 py-3.5 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={effectiveSelectedRows.includes(row[rowKey])}
                                                    onChange={() => handleRowSelect(row[rowKey])}
                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                />
                                            </td>
                                        )}

                                        {columns.map((col, colIdx) => (
                                            <td
                                                key={col.key || colIdx}
                                                className={`px-4 py-3.5 text-[13px] text-slate-700 ${col.responsiveClass || ''}`}
                                            >
                                                {col.render ? col.render(row[col.key], row, {
                                                    isExpanded: effectiveExpandedRows.includes(row[rowKey]),
                                                    toggleExpansion: () => toggleRowExpansion(row[rowKey])
                                                }) : (
                                                    <span className={`${col.key === 'id' || col.key === 'amount' ? 'font-bold text-slate-800' : 'font-medium'}`}>
                                                        {row[col.key] !== null && row[col.key] !== undefined ? row[col.key] : '-'}
                                                    </span>
                                                )}
                                            </td>
                                        ))}

                                        {expansion.enabled && !expansion.hideExpansionColumn && (
                                            <td className="px-4 py-3.5 text-center">
                                                <button
                                                    onClick={() => toggleRowExpansion(row[rowKey])}
                                                    className={`p-1.5 rounded-full transition-transform ${effectiveExpandedRows.includes(row[rowKey]) ? 'rotate-180 text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100'}`}
                                                >
                                                    <ChevronDown size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>

                                    {/* Expansion Card */}
                                    {expansion.enabled && effectiveExpandedRows.includes(row[rowKey]) && (
                                        <tr className="bg-slate-50/30 border-l-2 border-indigo-400">
                                            <td colSpan={columns.length + (selection.enabled ? 1 : 0) + (expansion.enabled ? 1 : 0)} className="p-5">
                                                {expansion.renderExpansion ? expansion.renderExpansion(row, effectiveExpansionColumns) : (
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-10 p-4 bg-white rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-top-2">
                                                        {effectiveExpansionColumns.map((eCol, eIdx) => (
                                                            <div key={eCol.key || eIdx} className="space-y-1">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{eCol.label}</p>
                                                                <p className="text-[13px] font-bold text-slate-800">
                                                                    {eCol.render ? eCol.render(row[eCol.key], row) : (row[eCol.key] !== null && row[eCol.key] !== undefined ? row[eCol.key] : '-')}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Refined Modular Pagination Footer */}
            {pagination.enabled && !isPaginationAll && totalPages > 1 && (
                <Pagination
                    currentPage={effectiveCurrentPage}
                    totalPages={totalPages}
                    totalFilteredCount={effectiveTotalItems}
                    entriesPerPage={Number(effectiveItemsPerPage)}
                    onPageChange={handlePageChange}
                />
            )}

            {/* "All" view indicator */}
            {isPaginationAll && effectiveTotalItems > 0 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600 text-center">
                    Showing all {effectiveTotalItems} records
                </div>
            )}
        </div>
    );
};

export default DataTable;