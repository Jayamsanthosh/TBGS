"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as LucideIcons from "lucide-react";
import { AlertCircle, RefreshCw, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { API_URL } from "@/lib/config";
import { useSidebar } from "@/components/sidebar";
import InsightsTab from "../management-insights/insights-tab";

interface DashboardCard {
  sno: number;
  routeSlug: string;
  iconKey: string;
  permissionColumn: string;
  backgroundColor: string;
  approvalType: string;
  cardTitle: string;
  pendingCount: number;
  approvedCount: number;
  holdCount: number;
  rejectedCount: number;
  totalCount: number;
}

interface RequestRecord {
  [key: string]: unknown;
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "bg-amber-100", text: "text-amber-700" },
  APPROVED: { bg: "bg-green-100", text: "text-green-700" },
  HOLD: { bg: "bg-blue-100", text: "text-blue-700" },
  REJECTED: { bg: "bg-red-100", text: "text-red-700" },
  ACTIVE: { bg: "bg-green-100", text: "text-green-700" },
  SUBMITTED: { bg: "bg-green-100", text: "text-green-700" },
  CLOSED: { bg: "bg-slate-100", text: "text-slate-700" },
  INACTIVE: { bg: "bg-slate-100", text: "text-slate-700" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700" },
  PAID: { bg: "bg-green-100", text: "text-green-700" },
  UNPAID: { bg: "bg-red-100", text: "text-red-700" },
};

/* The list procedures return both approval statuses
   (PENDING / APPROVED / HOLD / REJECTED) and entry statuses
   (CF / AC / CL / CA). Both are shown as readable badges instead of raw
   two-letter codes. */
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  HOLD: "Hold",
  REJECTED: "Rejected",
  AC: "Active",
  CF: "Pending",
  CL: "Submitted",
  CA: "Cancelled",
  ACTIVE: "Active",
  SUBMITTED: "Submitted",
  CLOSED: "Closed",
  INACTIVE: "Inactive",
  CANCELLED: "Cancelled",
  CANCELED: "Cancelled",
  PAID: "Paid",
  UNPAID: "Unpaid",
};

/* The list procedures return a union of columns across every request type, so
   one card's rows carry a lot of empty placeholders and aliases. These are
   hidden from the summary table; the meaningful columns are kept. */
const HIDDEN_COLUMNS = new Set([
  /* Duplicate reference/name aliases — one canonical column is kept. */
  "poRefNo",
  "requestRefNo",
  "department",
  "designation",
  "requestedByName",
  "poDate",
  "createdDate",
  /* Placeholders the list procedures add for the purchase-shaped columns. */
  "purchaseType",
  "requestTypeName",
  "totalFinalProductionHdrAmount",
  "requestAmount",
  "vatHdrAmount",
  "grossAmount",
  "cell",
]);

/* Per-level approval workflow fields are shown in the approval panel's detail
   view; the dashboard summary only needs the rolled-up final status. */
const HIDDEN_COLUMN_PREFIXES = [
  /^sectionHead/,
  /^response1/,
  /^response2/,
  /^finalResponse(?!Status$)/,
];

const MONEY_COLUMNS = new Set([
  "amount",
  "approvedAmount",
  "requestAmount",
  "vatHdrAmount",
  "grossAmount",
  "oldGrossAmount",
  "newGrossAmount",
  "grossPay",
  "netPay",
  "eligibleAmount",
  "monthlyDeduction",
]);

/* Friendly headers for the technical column names returned by the SPs. */
const COLUMN_LABELS: Record<string, string> = {
  refNo: "Reference No",
  statusEntry: "Entry Status",
  finalResponseStatus: "Approval Status",
  requestedBy: "Requested By",
  requestedDate: "Requested Date",
  paidStatus: "Payment Status",
  paymentModeName: "Payment Mode",
  approvedLevels: "Approved Levels",
  lineCount: "Line Count",
  currencyType: "Currency",
  currencyName: "Currency",
  requestStoreName: "Request Store",
  deliveryLocationName: "Delivery Location",
  branchName: "Branch",
  priorityName: "Priority",
  otFromDate: "OT From Date",
  otToDate: "OT To Date",
  otHours: "OT Hours",
  noOfDays: "No. of Days",
  noOfMonths: "No. of Months",
  accountNo: "Account No",
  purchaseQuotationNo: "Quotation No",
  purchaseRequestNo: "Request No",
  managerRecommendedYn: "Manager Recommended (Y/N)",
};

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value);
}

function formatCellValue(column: string, value: unknown): string {
  if (value == null || value === "") return "-";
  if (isIsoDate(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    }
  }
  if (typeof value === "number" && MONEY_COLUMNS.has(column)) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return String(value);
}

function formatKey(k: string): string {
  return k
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isStatusColumn(col: string): boolean {
  const t = col.replace(/[^A-Za-z]/g, "").toLowerCase();
  return t.includes("status") || t === "finalresponsestatus";
}

function isRawIdColumn(col: string): boolean {
  if (col.toLowerCase() === "sno" || col.toLowerCase() === "id") return true;
  if (/Id$/.test(col)) return true;
  if (/_ID$/.test(col)) return true;
  return false;
}

export default function DashboardPage() {
  const { isCollapsed, isMobile } = useSidebar();
  const sidebarOffset = isMobile ? 0 : isCollapsed ? 80 : 260;
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCard, setSelectedCard] = useState<DashboardCard | null>(null);
  const [rows, setRows] = useState<RequestRecord[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  /* Guards against an older response overwriting a newer card/filter request. */
  const requestSeqRef = useRef(0);

  const loadCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/dashboard/cards`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load dashboard");
      const data = await res.json();
      setCards(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const fetchRecords = useCallback(
    async (card: DashboardCard, st: string, q: string, fd: string, td: string, pg: number, ps: number) => {
      const seq = requestSeqRef.current + 1;
      requestSeqRef.current = seq;
      setDetailLoading(true);
      setDetailError(null);
      try {
        /* Each card is served by the approval list procedure for its own
           request type, so every card on the dashboard (not just the first
           four) returns its real rows. */
        const params = new URLSearchParams();
        params.set("page", String(pg));
        params.set("pageSize", String(ps));
        if (fd) params.set("fromDate", fd);
        if (td) params.set("toDate", td);
        if (st && st !== "ALL") params.set("status", st);
        if (q.trim()) params.set("search", q.trim());
        const res = await fetch(
          `${API_URL}/dashboard/requests/${encodeURIComponent(card.routeSlug)}?${params.toString()}`,
          { credentials: "include" }
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || "Failed to fetch records");
        }
        const data = await res.json();
        if (seq !== requestSeqRef.current) return;
        const nextRows = Array.isArray(data.data) ? data.data : [];
        setRows(nextRows);
        setColumns(
          Array.isArray(data.columns) && data.columns.length > 0
            ? data.columns
            : nextRows.length > 0
              ? Object.keys(nextRows[0])
              : []
        );
        setTotal(Number(data.total ?? 0));
        setPage(pg);
      } catch (err) {
        if (seq !== requestSeqRef.current) return;
        const message = err instanceof Error ? err.message : "Failed to fetch records";
        setDetailError(message);
        setRows([]);
        setColumns([]);
        setTotal(0);
      } finally {
        if (seq === requestSeqRef.current) setDetailLoading(false);
      }
    },
    []
  );

  const openRecords = (card: DashboardCard) => {
    /* Invalidate any in-flight request from the previously open card so a
       late response cannot repopulate the table. */
    requestSeqRef.current += 1;
    setSelectedCard(card);
    setStatus("ALL");
    setSearch("");
    setFromDate("");
    setToDate("");
    setRows([]);
    setColumns([]);
    setTotal(0);
  };

  const applyFilter = () => {
    if (!selectedCard) return;
    fetchRecords(selectedCard, status, search, fromDate, toDate, 1, pageSize);
  };

  const prevCardRef = useRef<DashboardCard | null>(null);

  useEffect(() => {
    if (!selectedCard) return;
    const prev = prevCardRef.current;
    prevCardRef.current = selectedCard;
    if (prev !== selectedCard) {
      fetchRecords(selectedCard, status, search, fromDate, toDate, 1, pageSize);
      return;
    }
    const t = setTimeout(() => {
      fetchRecords(selectedCard, status, search, fromDate, toDate, 1, pageSize);
    }, 400);
    return () => clearTimeout(t);
  }, [selectedCard, status, search, fromDate, toDate, pageSize, fetchRecords]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handlePageSizeChange = (val: string) => {
    const ps = Number(val) || 10;
    setPageSize(ps);
  };

  const displayColumns = useMemo(() => {
    const source = columns.length > 0 ? columns : rows.length > 0 ? Object.keys(rows[0] ?? {}) : [];
    const hasCurrencyName = source.includes("currencyName");
    return source.filter((column) => {
      if (isRawIdColumn(column)) return false;
      if (HIDDEN_COLUMNS.has(column)) return false;
      /* Purchase rows carry the currency id in `currencyType` and the label in
         `currencyName`; the numeric id is not useful when the name exists. */
      if (hasCurrencyName && column === "currencyType") return false;
      if (HIDDEN_COLUMN_PREFIXES.some((prefix) => prefix.test(column))) return false;
      /* Raw UPPERCASE aliases are duplicated by the camelCase columns. */
      if (/^[A-Z0-9_]+$/.test(column)) return false;
      /* Drop columns that are empty for every row of this result page. */
      return rows.some((row) => {
        const value = row[column];
        return value !== null && value !== undefined && String(value).trim() !== "";
      });
    });
  }, [columns, rows]);

  const isNumericColumn = (col: string): boolean => {
    if (!rows.length) return false;
    return rows.every((r) => {
      const v = r[col];
      if (v == null || v === "") return true;
      return typeof v === "number" || (!isIsoDate(v) && !Number.isNaN(Number(v)));
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Dashboard <span className="ml-2 text-xs font-medium text-muted-foreground">Confidential - Admin / Manager only</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Company-wide approval summary across all employees.
          </p>
        </div>
        <button
          onClick={loadCards}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {cards.length === 0 && !loading ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No approval data available.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((c) => {
              const Icon = (LucideIcons as any)[c.iconKey] || LucideIcons.LayoutDashboard;
              return (
                <button
                  key={c.sno}
                  onClick={() => openRecords(c)}
                  className="rounded-xl border border-border bg-card p-5 text-left shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      {c.pendingCount ?? 0} pending
                    </span>
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-foreground">{c.cardTitle}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{c.totalCount ?? 0} total requests</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
  {/* Approved */}
  <div className="rounded-md border border-[#B7E4C7] bg-[#EAFBF1] px-2 py-1.5 text-[#15803D]">
    <span className="font-bold">
      {c.approvedCount ?? 0}
    </span>{" "}
    <span className="font-bold">Approved</span>
  </div>

  {/* Hold */}
  <div className="rounded-md border border-[#BFDBFE] bg-[#EEF6FF] px-2 py-1.5 text-[#2563EB]">
    <span className="font-bold">
      {c.holdCount ?? 0}
    </span>{" "}
    <span className="font-bold">Hold</span>
  </div>

  {/* Rejected */}
  <div className="rounded-md border border-[#FECACA] bg-[#FFF0F0] px-2 py-1.5 text-[#DC2626]">
    <span className="font-bold">
      {c.rejectedCount ?? 0}
    </span>{" "}
    <span className="font-bold">Rejected</span>
  </div>

  {/* Total */}
  <div className="rounded-md border border-[#CBD5E1] bg-[#F1F5F9] px-2 py-1.5 text-[#1E293B]">
    <span className="font-bold">
      {c.totalCount ?? 0}
    </span>{" "}
    <span className="font-bold">Total</span>
  </div>
</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {cards.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">Approval Summary by Request Type</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Request Type</th>
                  <th className="px-5 py-3 font-semibold">Pending</th>
                  <th className="px-5 py-3 font-semibold">Hold</th>
                  <th className="px-5 py-3 font-semibold">Approved</th>
                  <th className="px-5 py-3 font-semibold">Rejected</th>
                  <th className="px-5 py-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => (
                  <tr
                    key={c.sno}
                    role="button"
                    tabIndex={0}
                    onClick={() => openRecords(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openRecords(c);
                      }
                    }}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30 focus:bg-muted/30 focus:outline-none"
                  >
                    <td className="px-5 py-3 font-medium text-foreground">{c.cardTitle}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        {c.pendingCount ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        {c.holdCount ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        {c.approvedCount ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                        {c.rejectedCount ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {c.totalCount ?? 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InsightsTab />

      {selectedCard && (
        <div className="fixed inset-y-0 right-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4" style={{ left: sidebarOffset }}>
          <div className="relative my-auto w-full max-w-6xl rounded-xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card px-6 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-foreground">{selectedCard.cardTitle}</h2>
                <p className="text-xs text-muted-foreground">{total} record(s) found</p>
              </div>
              <button onClick={() => setSelectedCard(null)} className="rounded-lg p-1 hover:bg-muted">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search reference, employee, name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyFilter();
                    }}
                    className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  title="From date"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  title="To date"
                />
                <div className="flex gap-2">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Hold">Hold</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <button
                    onClick={applyFilter}
                    disabled={detailLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    <Search className="h-4 w-4" />
                    Search
                  </button>
                </div>
              </div>

              {detailError && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {detailError}
                </div>
              )}

              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      {displayColumns.map((col) => (
                        <th key={col} className={`whitespace-nowrap px-4 py-3 font-semibold ${isNumericColumn(col) ? "text-right" : ""}`}>
                          {COLUMN_LABELS[col] || formatKey(col)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detailLoading ? (
                      <tr>
                        <td colSpan={displayColumns.length + 1} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          Loading...
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={displayColumns.length + 1} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          No records match the current filter.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, idx) => (
                        <tr key={`${String(row.sno ?? row.id ?? "")}-${idx}`} className="border-b border-border last:border-0 hover:bg-muted/30">
                          {displayColumns.map((col) => {
                            const val = row[col];
                            if (isStatusColumn(col)) {
                              let st = String(val ?? "").trim().toUpperCase();
                              if (st === "APPROVAL") st = "APPROVED";
                              const style = STATUS_STYLE[st] || STATUS_STYLE.PENDING;
                              return (
                                <td key={col} className="whitespace-nowrap px-4 py-2.5">
                                  {val == null || val === "" ? (
                                    <span className="text-muted-foreground">-</span>
                                  ) : (
                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}>
                                      {STATUS_LABELS[st] || st}
                                    </span>
                                  )}
                                </td>
                              );
                            }
                            const text = formatCellValue(col, val);
                            return (
                              <td
                                key={col}
                                className={`max-w-[260px] truncate whitespace-nowrap px-4 py-2.5 text-foreground ${isNumericColumn(col) ? "text-right" : ""}`}
                                title={String(val ?? "")}
                              >
                                {text}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs text-muted-foreground">
                    Showing {total === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total.toLocaleString()} entries
                  </p>
                  <select
                    value={String(pageSize)}
                    onChange={(e) => handlePageSizeChange(e.target.value)}
                    className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    title="Rows per page"
                  >
                    {[10, 20, 50, 100].map((s) => (
                      <option key={s} value={String(s)}>{s} / page</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchRecords(selectedCard, status, search, fromDate, toDate, Math.max(1, page - 1), pageSize)}
                    disabled={page <= 1 || detailLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>
                  <button
                    onClick={() => fetchRecords(selectedCard, status, search, fromDate, toDate, Math.min(totalPages, page + 1), pageSize)}
                    disabled={page >= totalPages || detailLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
