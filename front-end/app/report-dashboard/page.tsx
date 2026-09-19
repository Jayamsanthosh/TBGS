"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Search, Download, X, FileText, SlidersHorizontal, ChevronLeft, ChevronRight, ChevronDown, Braces } from "lucide-react";
import { API_URL } from "@/lib/config";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReportType {
  value: string;
  label: string;
}

interface ReportParameter {
  name: string;
  dataType: string;
  maxLength: number | null;
  mode: string;
  filter: string;
  sample: string;
}

interface ReportParametersInfo {
  reportName: string;
  procedureName: string;
  qualifiedName: string | null;
  procedureFound: boolean;
  parameters: ReportParameter[];
}

interface FilterOption {
  value: number;
  label: string;
}

interface StoreFilterOption extends FilterOption {
  campId: number | null;
}

interface FilterOptions {
  companies: FilterOption[];
  stores: StoreFilterOption[];
  camps: FilterOption[];
  departments: FilterOption[];
  companyCamps: { companyId: number; campId: number }[];
}

interface ReportRow {
  sno: number;
  id?: number;
  refNo?: string;
  poRefNo?: string;
  ATT_REQUEST_REF_NO?: string;
  CASH_ADV_REQUEST_REF_NO?: string;
  ARREAR_REQUEST_REF_NO?: string;
  OT_REQUEST_REF_NO?: string;
  requestedBy?: string;
  FIRST_NAME?: string;
  EMP_ID?: string;
  companyName?: string;
  COMPANY_ID?: number;
  departmentName?: string;
  DEPARTMENT_ID?: number;
  storeName?: string;
  STORE_ID?: number;
  campName?: string;
  campId?: number;
  storeId?: number;
  departmentId?: number;
  empId?: number;
  statusEntry?: string;
  finalResponseStatus?: string;
  response1Status?: string;
  response2Status?: string;
  sectionHeadStatus?: string;
  finalResponseRemarks?: string;
  response1Remarks?: string;
  response2Remarks?: string;
  sectionHeadRemarks?: string;
  sectionHeadDate?: string;
  response1Date?: string;
  response2Date?: string;
  finalResponseDate?: string;
  STATUS_MASTER?: string;
  SECTION_HEAD_RESPONSE_STATUS?: string;
  RESPONSE_1_STATUS?: string;
  RESPONSE_2_STATUS?: string;
  FINAL_RESPONSE_STATUS?: string;
  SECTION_HEAD_REMARKS?: string;
  RESPONSE_1_REMARKS?: string;
  RESPONSE_2_REMARKS?: string;
  FINAL_REMARKS?: string;
  REMARKS?: string;
  createdDate?: string;
  CREATED_DATE?: string;
  MODIFIED_DATE?: string;
  amount?: number;
  REQUEST_AMOUNT?: number;
  NO_OF_DAYS?: number;
  SECTION_HEAD_RESPONSE_DATE?: string;
  RESPONSE_1_DATE?: string;
  RESPONSE_2_DATE?: string;
  FINAL_RESPONSE_DATE?: string;
  [key: string]: unknown;
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "bg-amber-100", text: "text-amber-700" },
  APPROVED: { bg: "bg-green-100", text: "text-green-700" },
  HOLD: { bg: "bg-blue-100", text: "text-blue-700" },
  REJECTED: { bg: "bg-red-100", text: "text-red-700" },
};

function getEffectiveStatus(row: ReportRow): string {
  const firstSet = [
    row.FINAL_RESPONSE_STATUS,
    row.finalResponseStatus,
    row.RESPONSE_2_STATUS,
    row.response2Status,
    row.RESPONSE_1_STATUS,
    row.response1Status,
    row.SECTION_HEAD_RESPONSE_STATUS,
    row.sectionHeadStatus,
    row.STATUS_MASTER,
    row.statusEntry,
  ]
    .map((v) => String(v ?? "").trim().toUpperCase())
    .find((v) => v && v !== "");
  if (!firstSet) return "PENDING";
  if (firstSet === "APPROVAL") return "APPROVED";
  return firstSet;
}

function getRefNo(row: ReportRow): string {
  return row.refNo || row.poRefNo || row.ATT_REQUEST_REF_NO || row.CASH_ADV_REQUEST_REF_NO || row.ARREAR_REQUEST_REF_NO || row.OT_REQUEST_REF_NO || `#${row.sno}`;
}

function getEmployeeName(row: ReportRow): string {
  return row.requestedBy || row.FIRST_NAME || row.EMP_ID || "";
}

function formatDateTime(v: unknown): string {
  if (!v) return "-";
  try {
    return new Date(String(v)).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return String(v);
  }
}

function formatAmount(row: ReportRow): string {
  const val = row.amount ?? row.REQUEST_AMOUNT ?? row.NO_OF_DAYS;
  if (val == null) return "-";
  return typeof val === "number" ? val.toLocaleString() : String(val);
}

function toCSV(rows: ReportRow[], headers: string[]): string {
  const lines = rows.map((r) =>
    headers.map((h) => String(r[h] ?? "")).map((c) => `"${c.replace(/"/g, '""')}"`)
  );
  return [headers.map((h) => `"${h}"`).join(","), ...lines.map((l) => l.join(","))].join("\n");
}

function formatKey(k: string): string {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const COLUMN_LABELS: Record<string, string> = {
  refNo: "Ref No",
  requestRefNo: "Ref No",
  poRefNo: "Ref No",
  requestedBy: "Requested By",
  companyName: "Company",
  companyId: "Company Id",
  departmentName: "Department",
  designationName: "Designation",
  storeName: "Store",
  campName: "Camp",
  amount: "Amount",
  approvedAmount: "Approved Amount",
  finalResponseStatus: "Status",
  sectionHeadStatus: "Section Head Status",
  response1Status: "Response 1 Status",
  response2Status: "Response 2 Status",
  statusEntry: "Status Entry",
  createdDate: "Created Date",
  poDate: "PO Date",
  requestedDate: "Requested Date",
  otFromDate: "OT From Date",
  otToDate: "OT To Date",
  otHours: "OT Hours",
  monthEntered: "Month",
  yearEntered: "Year",
  reason: "Reason",
  noOfDays: "No. of Days",
  eligibleDays: "Eligible Days",
  balanceLeave: "Balance Leave",
  currencyType: "Currency",
  purchaseType: "Type",
  paidStatus: "Paid Status",
  paymentRefNo: "Payment Ref No",
  grossPay: "Gross Pay",
  netPay: "Net Pay",
  eligibleAmount: "Eligible Amount",
  noOfMonths: "No. of Months",
  monthlyDeduction: "Monthly Deduction",
  salaryDeductionType: "Salary Deduction Type",
  advanceType: "Advance Type",
  dateFrom: "Date From",
  dateTo: "Date To",
  paymentModeId: "Payment Mode",
  bankId: "Bank",
};

function prettyColumn(col: string): string {
  return COLUMN_LABELS[col] ?? formatKey(col);
}

const TABLE_DROP = new Set([
  "poRefNo", "requestRefNo", "poDate", "requestedDate", "department", "designation",
  "statusEntry", "totalFinalProductionHdrAmount", "vatHdrAmount", "supplierId",
  "supplierName", "cell", "currencyType", "purchaseType",
]);

function isRawIdColumn(col: string): boolean {
  if (col.toLowerCase() === "sno") return true;
  if (/Id$/.test(col)) return true;
  if (/_ID$/.test(col)) return true;
  return false;
}

function isResponseColumn(col: string): boolean {
  const t = col.replace(/[^A-Za-z]/g, "").toLowerCase();
  return /response|remarks|status|person|approval/.test(t);
}

const PAGE_SIZES = [10, 20, 50, 100];
const REPORT_TYPE_STORAGE_KEY = "reportDashboardType";

export default function ReportDashboardPage() {
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const didFocusOnce = useRef(false);

  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("ALL");
  const [searchText, setSearchText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const [paramsInfo, setParamsInfo] = useState<ReportParametersInfo | null>(null);
  const [loadingParams, setLoadingParams] = useState(false);
  const [paramsError, setParamsError] = useState<string | null>(null);

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [company, setCompany] = useState("");
  const [store, setStore] = useState("");
  const [camp, setCamp] = useState("");
  const [department, setDepartment] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const [rows, setRows] = useState<ReportRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const [detailRow, setDetailRow] = useState<ReportRow | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/report-dashboard/filters`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setFilterOptions(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    if (!searchText.trim() || rows.length === 0) return [];
    const term = searchText.trim().toLowerCase();
    const matches = rows.filter((r) => {
      const emp = getEmployeeName(r).toLowerCase();
      const ref = getRefNo(r).toLowerCase();
      return emp.includes(term) || ref.includes(term);
    });
    return matches.slice(0, 8);
  }, [searchText, rows]);

  const companyOptions = useMemo(() => filterOptions?.companies ?? [], [filterOptions]);

  const campOptions = useMemo(() => {
    const allCamps = filterOptions?.camps ?? [];
    if (!filterOptions || !company) return allCamps;
    const allowed = new Set(
      filterOptions.companyCamps
        .filter((cc) => String(cc.companyId) === String(company))
        .map((cc) => cc.campId)
    );
    return allCamps.filter((c) => allowed.has(c.value));
  }, [filterOptions, company]);

  const storeOptions = useMemo(() => {
    const allStores = filterOptions?.stores ?? [];
    if (!filterOptions || !company) return allStores;
    if (camp) {
      return allStores.filter((s) => s.campId !== null && String(s.campId) === String(camp));
    }
    const allowedCamps = new Set(
      filterOptions.companyCamps
        .filter((cc) => String(cc.companyId) === String(company))
        .map((cc) => cc.campId)
    );
    return allStores.filter((s) => s.campId !== null && allowedCamps.has(s.campId));
  }, [filterOptions, company, camp]);

  const departmentOptions = useMemo(() => filterOptions?.departments ?? [], [filterOptions]);

  const isStatusColumn = (col: string): boolean => {
    const t = col.replace(/[^A-Za-z]/g, "").toLowerCase();
    return t.includes("status") || t === "finalresponsestatus";
  };

  const displayColumns = useMemo(() => {
    const source = columns.length > 0 ? columns : rows.length > 0 ? Object.keys(rows[0] ?? {}) : [];
    return source.filter((c) => c.toLowerCase() !== "id");
  }, [columns, rows]);

  const tableColumns = useMemo(() => {
    const filtered = displayColumns.filter((col) => {
      if (isRawIdColumn(col)) return false;
      if (TABLE_DROP.has(col)) return false;
      if (isResponseColumn(col)) return false;
      if (rows.length > 0 && rows.every((r) => r[col] == null || r[col] === "")) return false;
      return true;
    });
    return filtered.length > 0 ? filtered : displayColumns;
  }, [displayColumns, rows]);

  const isNumericColumn = (col: string): boolean => {
    if (!rows.length) return false;
    return rows.every((r) => {
      const v = r[col];
      return v == null || v === "" || typeof v === "number";
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const buildParams = useCallback(
    (pg: number, ps: number, typeOverride?: string): URLSearchParams => {
      const params = new URLSearchParams({ requestType: typeOverride ?? selectedType });
      params.set("page", String(pg));
      params.set("pageSize", String(ps));
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);
      if (status && status !== "ALL") params.set("status", status);
      if (company) params.set("company", company);
      if (store) params.set("store", store);
      if (camp) params.set("camp", camp);
      if (department) params.set("department", department);
      if (searchText.trim()) params.set("search", searchText.trim());
      return params;
    },
    [selectedType, fromDate, toDate, status, searchText, company, store, camp, department]
  );

  const fetchReport = useCallback(
    async (pg: number, ps: number, typeOverride?: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/report-dashboard/reports?${buildParams(pg, ps, typeOverride).toString()}`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch report data");
        const data = await res.json();
        setRows(Array.isArray(data.data) ? data.data : []);
        setColumns(Array.isArray(data.columns) ? data.columns : []);
        setTotal(Number(data.total ?? 0));
        setPage(pg);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch report data";
        setError(message);
        setRows([]);
        setColumns([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [buildParams]
  );

  const doSearch = useCallback(
    async () => {
      if (!selectedType) {
        setError("Please select a Report Name to search.");
        return;
      }
      setSearched(true);
      setShowSuggestions(false);
      await fetchReport(1, pageSize);
    },
    [selectedType, fetchReport, pageSize]
  );

  const fetchParameters = useCallback(async (reportType: string) => {
    if (!reportType) {
      setParamsInfo(null);
      return;
    }
    setLoadingParams(true);
    setParamsError(null);
    try {
      const res = await fetch(`${API_URL}/report-dashboard/parameters?requestType=${encodeURIComponent(reportType)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch report parameters");
      const data = await res.json();
      setParamsInfo(data?.data ?? null);
    } catch (err) {
      setParamsInfo(null);
      setParamsError(err instanceof Error ? err.message : "Failed to fetch report parameters");
    } finally {
      setLoadingParams(false);
    }
  }, []);

  const handleReportChange = useCallback(
    (value: string) => {
      setSelectedType(value);
      if (value) sessionStorage.setItem(REPORT_TYPE_STORAGE_KEY, value);
      else sessionStorage.removeItem(REPORT_TYPE_STORAGE_KEY);
      setParamsInfo(null);
      if (value) {
        fetchParameters(value);
      }
    },
    [fetchParameters]
  );

  useEffect(() => {
    fetch(`${API_URL}/report-dashboard/types`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d) || d.length === 0) return;
        setReportTypes(d);
        const stored = sessionStorage.getItem(REPORT_TYPE_STORAGE_KEY);
        const storedValid = !!stored && d.some((t) => t.value === stored);
        const fallback = storedValid ? (stored as string) : d[0]?.value;
        if (fallback) handleReportChange(fallback);
      })
      .catch(() => {});
  }, [handleReportChange]);

  useEffect(() => {
    if (!selectedType) return;
    const t = setTimeout(() => {
      setSearched(true);
      fetchReport(1, pageSize);
    }, 400);
    return () => clearTimeout(t);
  }, [selectedType, searchText, fromDate, toDate, status, company, store, camp, department, fetchReport, pageSize]);

  useEffect(() => {
    const onRefocus = () => {
      if (!didFocusOnce.current) {
        didFocusOnce.current = true;
        return;
      }
      if (selectedType) fetchReport(page, pageSize);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible" && selectedType) {
        onRefocus();
      }
    };
    window.addEventListener("focus", onRefocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onRefocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [selectedType, fetchReport, page, pageSize]);

  const goToPage = useCallback(
    (p: number) => {
      fetchReport(p, pageSize);
    },
    [fetchReport, pageSize]
  );

  const handlePageSizeChange = (val: string) => {
    const ps = Number(val) || 10;
    setPageSize(ps);
  };

  const resetFilters = () => {
    setSelectedType("");
    setFromDate("");
    setToDate("");
    setStatus("ALL");
    setSearchText("");
    setCompany("");
    setStore("");
    setCamp("");
    setDepartment("");
    setRows([]);
    setColumns([]);
    setTotal(0);
    setPage(1);
    setSearched(false);
    setError(null);
    setParamsInfo(null);
    setParamsError(null);
  };

  const exportCSV = async () => {
    if (!selectedType || total === 0) return;
    setError(null);
    try {
      const params = buildParams(1, 100000);
      params.set("export", "1");
      const res = await fetch(`${API_URL}/report-dashboard/reports?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to export report data");
      const data = await res.json();
      const allRows = Array.isArray(data.data) ? data.data : [];
      if (allRows.length === 0) return;
      const headers = Array.isArray(data.columns) && data.columns.length > 0
        ? data.columns.filter((c: string) => c.toLowerCase() !== "id")
        : displayColumns;
      const blob = new Blob([toCSV(allRows, headers)], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${selectedType.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to export report data";
      setError(message);
    }
  };

  const selectSuggestion = (row: ReportRow) => {
    const emp = getEmployeeName(row);
    const ref = getRefNo(row);
    setSearchText(emp || ref);
    setShowSuggestions(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setShowSuggestions(true);
      if (suggestions.length > 0) setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length > 0) setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      if (showSuggestions && activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const fullDetails = useMemo(() => {
    if (!detailRow) return [];
    const ordered = displayColumns.length > 0 ? displayColumns : Object.keys(detailRow);
    const keys = ordered.filter((k) => k !== "id" && k !== "sno");
    return keys.map((k) => ({
      key: k,
      label: prettyColumn(k),
      value:
        detailRow[k] == null || detailRow[k] === ""
          ? "-"
          : typeof detailRow[k] === "object"
            ? JSON.stringify(detailRow[k])
            : String(detailRow[k]),
    }));
  }, [detailRow, displayColumns]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Report Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search and filter approval requests by type, date range, and employee name or ID.
          </p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Report Name</label>
            <SearchableSelect
              value={selectedType}
              onChange={handleReportChange}
              options={reportTypes.map((t) => ({ value: t.value, label: t.label }))}
              placeholder="Select Report Name..."
            />
            {selectedType && !loadingParams && !paramsError && paramsInfo && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {paramsInfo.parameters.length} parameter{paramsInfo.parameters.length === 1 ? "" : "s"} will be passed to{" "}
                <span className="font-medium text-foreground">{paramsInfo.procedureName}</span>
              </p>
            )}
            {loadingParams && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">Loading parameters...</p>
            )}
            {paramsError && (
              <p className="mt-1.5 text-[11px] text-destructive">{paramsError}</p>
            )}
          </div>
          {showFilters && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/40"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/40"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-9 text-sm text-foreground shadow-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/40"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Hold">Hold</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </>
          )}
        </div>
        {showFilters && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Company</label>
              <SearchableSelect
                value={company}
                onChange={(v) => { setCompany(v); setCamp(""); setStore(""); }}
                options={companyOptions}
                placeholder="Select Company..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Camp</label>
              <SearchableSelect
                value={camp}
                onChange={(v) => { setCamp(v); setStore(""); }}
                options={campOptions}
                placeholder="Select Camp..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Store</label>
              <SearchableSelect
                value={store}
                onChange={setStore}
                options={storeOptions}
                placeholder="Select Store..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Department</label>
              <SearchableSelect
                value={department}
                onChange={setDepartment}
                options={departmentOptions}
                placeholder="Select Department..."
              />
            </div>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2" ref={searchRef}>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Custom Search (Emp ID / Ref No / Name / Any)</label>
            <input
              ref={inputRef}
              type="text"
              placeholder="Type employee ID, ref no, name, company, store, camp..."
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setActiveIndex(-1); setShowSuggestions(true); }}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              onKeyDown={handleSearchKeyDown}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
                {suggestions.map((r, idx) => {
                  const emp = getEmployeeName(r);
                  const ref = getRefNo(r);
                  const st = getEffectiveStatus(r);
                  const isActive = idx === activeIndex;
                  return (
                    <li
                      key={`${r.sno}-${idx}`}
                      onClick={() => selectSuggestion(r)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer ${isActive ? "bg-muted" : "hover:bg-muted/50"}`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-foreground truncate">{emp || ref}</span>
                        <span className="text-xs text-muted-foreground truncate">{emp ? `Ref: ${ref}` : ref}</span>
                      </div>
                      <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[st]?.bg || STATUS_STYLE.PENDING.bg} ${STATUS_STYLE[st]?.text || STATUS_STYLE.PENDING.text}`}>
                        {st}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={doSearch}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            <Search className="h-4 w-4" />
            {loading ? "Searching..." : "Search"}
          </button>
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            Reset
          </button>
          <button
            onClick={exportCSV}
            disabled={!searched || total === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          {searched && !loading && (
            <span className="text-xs text-muted-foreground">
              {total.toLocaleString()} record{total === 1 ? "" : "s"} found
            </span>
          )}
        </div>
      </div>

      {selectedType && paramsInfo && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Braces className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Parameters To Pass</h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {paramsInfo.parameters.length} parameter{paramsInfo.parameters.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Stored Procedure: <span className="font-medium text-foreground">{paramsInfo.qualifiedName ?? paramsInfo.procedureName}</span>
            {!paramsInfo.procedureFound && (
              <span className="ml-2 text-destructive">(not found in database)</span>
            )}
          </p>
          {paramsInfo.parameters.length === 0 ? (
            <p className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              This stored procedure declares no input parameters, so it is executed without arguments.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-semibold">Parameter</th>
                    <th className="px-3 py-2 font-semibold">Data Type</th>
                    <th className="px-3 py-2 font-semibold">Mode</th>
                    <th className="px-3 py-2 font-semibold">Bound To</th>
                    <th className="px-3 py-2 font-semibold">Sent Value</th>
                  </tr>
                </thead>
                <tbody>
                  {paramsInfo.parameters.map((p) => (
                    <tr key={p.name} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-primary">@{p.name}</code>
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground">
                        {p.dataType}
                        {p.maxLength != null && p.maxLength > 0 ? `(${p.maxLength})` : ""}
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                          {p.mode}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground">{p.filter}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {p.filter.startsWith("Auto default") ? `default (${p.sample || "-"})` : "from dashboard filter"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {searched && !loading && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {rows.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No records found matching your filters.
              <p className="mt-1 text-xs opacity-80">
                Tip: if this report&apos;s SP is a detail SP (needs a Ref No / ID), it returns nothing without that key — use a list-style SP.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      {tableColumns.map((col) => (
                        <th key={col} className={`px-5 py-3 font-semibold ${isNumericColumn(col) ? "text-right" : ""}`}>
                          {prettyColumn(col)}
                        </th>
                      ))}
                      <th className="px-5 py-3 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={`${r.sno}-${idx}`} className="border-b border-border last:border-0 hover:bg-muted/30">
                        {tableColumns.map((col) => {
                          const val = r[col];
                          if (isStatusColumn(col)) {
                            let st = String(val ?? "").trim().toUpperCase();
                            if (st === "APPROVAL") st = "APPROVED";
                            const style = STATUS_STYLE[st] || STATUS_STYLE.PENDING;
                            return (
                              <td key={col} className="px-5 py-3">
                                {val == null || val === "" ? (
                                  <span className="text-muted-foreground">-</span>
                                ) : (
                                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}>
                                    {st}
                                  </span>
                                )}
                              </td>
                            );
                          }
                          const text = val == null || val === "" ? "-" : String(val);
                          return (
                            <td key={col} className={`px-5 py-3 text-foreground ${isNumericColumn(col) ? "text-right" : ""}`}>
                              {text}
                            </td>
                          );
                        })}
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => setDetailRow(r)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            <FileText className="h-3 w-3" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground font-medium">
                  Showing {total === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total.toLocaleString()} entries
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="h-8 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map((s) => (
                        <SelectItem key={s} value={String(s)}>{s} / page</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => goToPage(page - 1)}
                        className="h-8 text-xs"
                      >
                        <ChevronLeft className="h-3 w-3" />
                        Prev
                      </Button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let p: number;
                        if (totalPages <= 5) p = i + 1;
                        else if (page <= 3) p = i + 1;
                        else if (page >= totalPages - 2) p = totalPages - 4 + i;
                        else p = page - 2 + i;
                        return (
                          <Button
                            key={p}
                            variant={page === p ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(p)}
                            className="h-8 w-8 p-0 text-xs"
                          >
                            {p}
                          </Button>
                        );
                      })}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages}
                        onClick={() => goToPage(page + 1)}
                        className="h-8 text-xs"
                      >
                        Next
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {detailRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-auto rounded-xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Request Details</h2>
              <button
                onClick={() => setDetailRow(null)}
                className="rounded-lg p-1 hover:bg-muted"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Header info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Ref No</p>
                  <p className="text-sm font-medium text-foreground">{getRefNo(detailRow)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  {(() => {
                    const st = getEffectiveStatus(detailRow);
                    const style = STATUS_STYLE[st] || STATUS_STYLE.PENDING;
                    return (
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}>
                        {st}
                      </span>
                    );
                  })()}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Requested By</p>
                  <p className="text-sm font-medium text-foreground">{getEmployeeName(detailRow) || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-medium text-foreground">{formatAmount(detailRow)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="text-sm font-medium text-foreground">{String(detailRow.companyName || detailRow.COMPANY_NAME || "-")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="text-sm font-medium text-foreground">{String(detailRow.departmentName || detailRow.DEPARTMENT_NAME || "-")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Camp</p>
                  <p className="text-sm font-medium text-foreground">{String(detailRow.campName || detailRow.CAMP_NAME || "-")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Store</p>
                  <p className="text-sm font-medium text-foreground">{String(detailRow.storeName || detailRow.STORE_NAME || "-")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Created Date</p>
                  <p className="text-sm font-medium text-foreground">{formatDateTime(detailRow.createdDate || detailRow.CREATED_DATE)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Modified Date</p>
                  <p className="text-sm font-medium text-foreground">{formatDateTime(detailRow.MODIFIED_DATE)}</p>
                </div>
              </div>

              {/* Approval Flow */}
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Approval Flow</h3>
                <div className="space-y-3">
{[ 
                    { label: "Section Head", status: detailRow.sectionHeadStatus ?? detailRow.SECTION_HEAD_RESPONSE_STATUS, remarks: detailRow.sectionHeadRemarks ?? detailRow.SECTION_HEAD_RESPONSE_REMARKS, date: detailRow.sectionHeadDate ?? detailRow.SECTION_HEAD_RESPONSE_DATE },
                    { label: "Response 1", status: detailRow.response1Status ?? detailRow.RESPONSE_1_STATUS, remarks: detailRow.response1Remarks ?? detailRow.RESPONSE_1_REMARKS, date: detailRow.response1Date ?? detailRow.RESPONSE_1_DATE },
                    { label: "Response 2", status: detailRow.response2Status ?? detailRow.RESPONSE_2_STATUS, remarks: detailRow.response2Remarks ?? detailRow.RESPONSE_2_REMARKS, date: detailRow.response2Date ?? detailRow.RESPONSE_2_DATE },
                    { label: "Final", status: detailRow.finalResponseStatus ?? detailRow.FINAL_RESPONSE_STATUS, remarks: detailRow.finalResponseRemarks ?? detailRow.FINAL_RESPONSE_REMARKS, date: detailRow.finalResponseDate ?? detailRow.FINAL_RESPONSE_DATE },
                  ].map((level) => {
                    const val = String(level.status || "").trim().toUpperCase();
                    const normalized = val === "APPROVAL" ? "APPROVED" : val || "N/A";
                    const style = STATUS_STYLE[normalized] || STATUS_STYLE.PENDING;
                    return (
                      <div key={level.label} className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2">
                        <div className="min-w-[100px]">
                          <p className="text-xs font-medium text-muted-foreground">{level.label}</p>
                          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}>
                            {normalized}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          {level.remarks ? (
                            <p className="text-xs text-foreground truncate" title={String(level.remarks)}>{String(level.remarks)}</p>
                          ) : null}
                          {level.date ? (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{formatDateTime(level.date)}</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Full details */}
              {fullDetails.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <h3 className="mb-1 text-sm font-semibold text-foreground">Full Details</h3>
                  <p className="mb-3 text-xs text-muted-foreground">All columns returned by this stored procedure.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {fullDetails.map((f) => (
                      <div key={f.key} className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground">{f.label}</p>
                        <p className="text-xs font-medium text-foreground break-words">{f.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailRow.REMARKS && (
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <h3 className="mb-1 text-sm font-semibold text-foreground">Remarks</h3>
                  <p className="text-sm text-foreground">{String(detailRow.REMARKS)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}