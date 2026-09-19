"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as LucideIcons from "lucide-react";
import { AlertCircle, RefreshCw, Search, X, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { API_URL } from "@/lib/config";
import { useSidebar } from "@/components/sidebar";

interface InsightCard {
  CardKey: string;
  CardTitle: string;
  GroupKey: string;
  GroupTitle: string;
  IconKey: string;
  ColorKey: string;
  OrderSeq: number;
  Filters: string;
  TotalCount: number;
  PendingCount: number;
  ApprovedCount: number;
  HoldCount: number;
  RejectedCount: number;
  ExtraCount1: number;
  ExtraCount2: number;
  ExtraLabel1: string | null;
  ExtraLabel2: string | null;
  ApproxNote: string | null;
}

interface InsightRow {
  id: number;
  refNo?: string;
  title?: string;
  subtitle?: string;
  empName?: string;
  dept?: string;
  store?: string;
  camp?: string;
  amount?: number;
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
  expiryDate?: string;
  reqDate?: string;
  st?: string;
  paid?: string;
  extra?: string;
}

interface HighlightChip {
  label: string;
  field: keyof InsightCard;
  color: string;
}

interface CardDef {
  primaryLabel: string;
  primaryField: keyof InsightCard;
  primaryColor: string;
  chips: HighlightChip[];
  headerBadgeField?: keyof InsightCard;
}

const COLOR_MAP: Record<string, string> = {
  red: "bg-red-500",
  indigo: "bg-indigo-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  teal: "bg-teal-500",
  orange: "bg-orange-500",
  blue: "bg-blue-500",
  zinc: "bg-zinc-500",
  slate: "bg-slate-500",
};

const STATUS_CHIP_STYLE: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "bg-amber-100", text: "text-amber-700" },
  APPROVED: { bg: "bg-green-100", text: "text-green-700" },
  ACTIVE: { bg: "bg-green-100", text: "text-green-700" },
  HOLD: { bg: "bg-blue-100", text: "text-blue-700" },
  REJECTED: { bg: "bg-red-100", text: "text-red-700" },
  INACTIVE: { bg: "bg-zinc-200", text: "text-zinc-700" },
  EXPIRED: { bg: "bg-red-100", text: "text-red-700" },
  OVERDUE: { bg: "bg-red-100", text: "text-red-700" },
  SOON5: { bg: "bg-red-100", text: "text-red-700" },
  SOON10: { bg: "bg-amber-100", text: "text-amber-700" },
  SOON30: { bg: "bg-amber-100", text: "text-amber-700" },
  SOON60: { bg: "bg-orange-100", text: "text-orange-700" },
  VALID: { bg: "bg-green-100", text: "text-green-700" },
  LOW: { bg: "bg-amber-100", text: "text-amber-700" },
  CRITICAL: { bg: "bg-red-100", text: "text-red-700" },
  OK: { bg: "bg-green-100", text: "text-green-700" },
  PRESENT: { bg: "bg-green-100", text: "text-green-700" },
  ABSENT: { bg: "bg-red-100", text: "text-red-700" },
  SICK: { bg: "bg-blue-100", text: "text-blue-700" },
  LATE: { bg: "bg-orange-100", text: "text-orange-700" },
  ONLEAVE: { bg: "bg-purple-100", text: "text-purple-700" },
  MAINTENANCE: { bg: "bg-orange-100", text: "text-orange-700" },
  AVAILABLE: { bg: "bg-green-100", text: "text-green-700" },
  PAID: { bg: "bg-green-100", text: "text-green-700" },
  UNPAID: { bg: "bg-amber-100", text: "text-amber-700" },
  CLOSED: { bg: "bg-zinc-200", text: "text-zinc-700" },
  OTHER: { bg: "bg-slate-100", text: "text-slate-700" },
};

const approvalDef = (key?: string): CardDef => {
  const chips: HighlightChip[] = [
    { label: "Pending", field: "PendingCount", color: "text-amber-600" },
    { label: "Approved", field: "ApprovedCount", color: "text-green-600" },
  ];
  if (key === "attendance" || key === "leave" || key === "drivers" || key === "trucks" || key === "contracts") {
    chips.push({ label: "Other", field: "HoldCount", color: "text-blue-600" });
  }
  if (key !== "attendance" && key !== "leave") {
    chips.push({ label: "Rejected", field: "RejectedCount", color: "text-red-500" });
  }
  return {
    primaryLabel: "Total",
    primaryField: "TotalCount",
    primaryColor: "text-foreground",
    chips,
  };
};

const registryDef = (key: string): CardDef => {
  const def: CardDef = {
    primaryLabel: "Total",
    primaryField: "TotalCount",
    primaryColor: "text-foreground",
    chips: [
      { label: "Active", field: "PendingCount", color: "text-green-600" },
      { label: "Inactive", field: "ExtraCount1", color: "text-zinc-500" },
    ],
  };
  return def;
};

const CARD_DEFS: Record<string, CardDef> = {
  "management-attention": {
    primaryLabel: "Critical Issues",
    primaryField: "TotalCount",
    primaryColor: "text-red-600",
    chips: [
      { label: "Overdue Approvals", field: "PendingCount", color: "text-red-600" },
      { label: "Expired Licences", field: "ApprovedCount", color: "text-orange-600" },
      { label: "Low Stock", field: "HoldCount", color: "text-amber-600" },
      { label: "Expiring Contracts", field: "RejectedCount", color: "text-amber-600" },
    ],
  },
  "employees": {
    primaryLabel: "Total Employees",
    primaryField: "TotalCount",
    primaryColor: "text-foreground",
    chips: [
      { label: "Present Today", field: "PendingCount", color: "text-green-600" },
      { label: "Active", field: "ApprovedCount", color: "text-green-600" },
      { label: "Inactive", field: "HoldCount", color: "text-zinc-500" },
      { label: "Absent Today", field: "RejectedCount", color: "text-red-500" },
    ],
  },
  "attendance": {
    primaryLabel: "Present Today",
    primaryField: "TotalCount",
    primaryColor: "text-green-600",
    chips: [
      { label: "Absent", field: "PendingCount", color: "text-red-500" },
      { label: "Sick", field: "ApprovedCount", color: "text-blue-600" },
      { label: "Late", field: "HoldCount", color: "text-orange-600" },
    ],
  },
  "leave": {
    primaryLabel: "On Leave Today",
    primaryField: "TotalCount",
    primaryColor: "text-purple-600",
    chips: [
      { label: "Pending Approval", field: "PendingCount", color: "text-amber-600" },
      { label: "Leave Types", field: "ApprovedCount", color: "text-green-600" },
      { label: "Balance (days)", field: "HoldCount", color: "text-blue-600" },
    ],
  },
  "drivers": {
    primaryLabel: "Total Drivers",
    primaryField: "TotalCount",
    primaryColor: "text-foreground",
    chips: [
      { label: "Expiring 30d", field: "PendingCount", color: "text-amber-600" },
      { label: "Active", field: "ApprovedCount", color: "text-green-600" },
      { label: "Inactive", field: "HoldCount", color: "text-zinc-500" },
      { label: "Expired", field: "RejectedCount", color: "text-red-500" },
    ],
  },
  "trucks": {
    primaryLabel: "Total Trucks",
    primaryField: "TotalCount",
    primaryColor: "text-foreground",
    chips: [
      { label: "Expiring/Expired", field: "PendingCount", color: "text-amber-600" },
      { label: "Active", field: "ApprovedCount", color: "text-green-600" },
      { label: "Inactive", field: "HoldCount", color: "text-zinc-500" },
      { label: "Maintenance", field: "RejectedCount", color: "text-orange-600" },
      { label: "Available", field: "ExtraCount1", color: "text-green-600" },
    ],
  },
  "trailers": {
    primaryLabel: "Total Trailers",
    primaryField: "TotalCount",
    primaryColor: "text-foreground",
    chips: [
      { label: "Active", field: "ApprovedCount", color: "text-green-600" },
      { label: "Inactive", field: "HoldCount", color: "text-zinc-500" },
    ],
  },
  "contracts": {
    primaryLabel: "Total",
    primaryField: "TotalCount",
    primaryColor: "text-foreground",
    chips: [
      { label: "Active", field: "PendingCount", color: "text-green-600" },
      { label: "Inactive", field: "RejectedCount", color: "text-zinc-500" },
    ],
  },
  "overtime-requests": {
    primaryLabel: "Total",
    primaryField: "TotalCount",
    primaryColor: "text-foreground",
    headerBadgeField: "TotalCount",
    chips: [
      { label: "Pending", field: "PendingCount", color: "text-amber-600" },
      { label: "Approved", field: "ApprovedCount", color: "text-green-600" },
      { label: "OT Hours", field: "ExtraCount1", color: "text-blue-600" },
      { label: "OT Amount", field: "ExtraCount2", color: "text-green-600" },
    ],
  },
  "cash-advance-requests": {
    primaryLabel: "Pending",
    primaryField: "PendingCount",
    primaryColor: "text-amber-600",
    headerBadgeField: "TotalCount",
    chips: [
      { label: "Approved", field: "ApprovedCount", color: "text-green-600" },
      { label: "Hold", field: "HoldCount", color: "text-blue-600" },
      { label: "Rejected", field: "RejectedCount", color: "text-red-500" },
    ],
  },
  "bonus-requests": {
    primaryLabel: "Pending",
    primaryField: "PendingCount",
    primaryColor: "text-amber-600",
    headerBadgeField: "TotalCount",
    chips: [
      { label: "Approved", field: "ApprovedCount", color: "text-green-600" },
      { label: "Hold", field: "HoldCount", color: "text-blue-600" },
      { label: "Rejected", field: "RejectedCount", color: "text-red-500" },
    ],
  },
  "arrears-requests": {
    primaryLabel: "Pending",
    primaryField: "PendingCount",
    primaryColor: "text-amber-600",
    headerBadgeField: "TotalCount",
    chips: [
      { label: "Approved", field: "ApprovedCount", color: "text-green-600" },
      { label: "Hold", field: "HoldCount", color: "text-blue-600" },
      { label: "Rejected", field: "RejectedCount", color: "text-red-500" },
    ],
  },
  "salary-deductions": {
    primaryLabel: "Deduction Entries",
    primaryField: "TotalCount",
    primaryColor: "text-foreground",
    chips: [
      { label: "Monthly Deduction", field: "ExtraCount1", color: "text-blue-600" },
    ],
  },
  "employee-benefits": {
    primaryLabel: "Total",
    primaryField: "TotalCount",
    primaryColor: "text-foreground",
    chips: [
      { label: "Unpaid", field: "PendingCount", color: "text-amber-600" },
      { label: "Paid", field: "ApprovedCount", color: "text-green-600" },
      { label: "Total Amount", field: "ExtraCount1", color: "text-green-600" },
    ],
  },
  "promotion-transfer-requests": {
    primaryLabel: "Pending",
    primaryField: "PendingCount",
    primaryColor: "text-amber-600",
    headerBadgeField: "TotalCount",
    chips: [
      { label: "Approved", field: "ApprovedCount", color: "text-green-600" },
      { label: "Hold", field: "HoldCount", color: "text-blue-600" },
      { label: "Rejected", field: "RejectedCount", color: "text-red-500" },
    ],
  },
  "products": registryDef("products"),
  "business-partners": registryDef("business-partners"),
  "fuel": {
    primaryLabel: "Fuel Stations",
    primaryField: "TotalCount",
    primaryColor: "text-foreground",
    chips: [
      { label: "Active", field: "PendingCount", color: "text-green-600" },
      { label: "Fuel Types", field: "ExtraCount1", color: "text-blue-600" },
    ],
  },
  "guns": registryDef("guns"),
  "hotels-travel": {
    primaryLabel: "Hotels",
    primaryField: "TotalCount",
    primaryColor: "text-foreground",
    chips: [
      { label: "Airlines", field: "PendingCount", color: "text-blue-600" },
      { label: "Room Types", field: "ApprovedCount", color: "text-purple-600" },
      { label: "Airports", field: "HoldCount", color: "text-amber-600" },
      { label: "Travel Pricing", field: "ExtraCount1", color: "text-green-600" },
    ],
  },
  "animals": registryDef("animals"),
  "camps": {
    primaryLabel: "Camps",
    primaryField: "TotalCount",
    primaryColor: "text-foreground",
    chips: [
      { label: "Active", field: "PendingCount", color: "text-green-600" },
      { label: "Gun Categories", field: "ExtraCount1", color: "text-blue-600" },
    ],
  },
  "hotels": registryDef("hotels"),
};

const COLUMNS: Record<string, { key: keyof InsightRow; label: string }[]> = {
  standardRequests: [
    { key: "refNo", label: "Ref No" },
    { key: "empName", label: "Employee" },
    { key: "dept", label: "Department" },
    { key: "store", label: "Store" },
    { key: "camp", label: "Camp" },
    { key: "amount", label: "Amount" },
    { key: "dateFrom", label: "From" },
    { key: "dateTo", label: "To" },
    { key: "reqDate", label: "Requested" },
    { key: "st", label: "Status" },
    { key: "extra", label: "Remarks" },
  ],
  managementAttention: [
    { key: "refNo", label: "Ref No" },
    { key: "title", label: "Type" },
    { key: "empName", label: "Employee" },
    { key: "dept", label: "Department" },
    { key: "store", label: "Store" },
    { key: "camp", label: "Camp" },
    { key: "amount", label: "Amount" },
    { key: "expiryDate", label: "Expiry" },
    { key: "st", label: "Status" },
    { key: "extra", label: "Remarks" },
  ],
  employees: [
    { key: "refNo", label: "EMP ID" },
    { key: "title", label: "Name" },
    { key: "subtitle", label: "Work Status" },
    { key: "dept", label: "Department" },
    { key: "store", label: "Store" },
    { key: "camp", label: "Camp" },
    { key: "amount", label: "Gross" },
    { key: "dateFrom", label: "Joined" },
    { key: "expiryDate", label: "Contract End" },
    { key: "st", label: "Status" },
    { key: "extra", label: "Remarks" },
  ],
  attendanceLeave: [
    { key: "refNo", label: "Ref No" },
    { key: "title", label: "Type" },
    { key: "empName", label: "Employee" },
    { key: "dept", label: "Department" },
    { key: "dateFrom", label: "From" },
    { key: "dateTo", label: "To" },
    { key: "reqDate", label: "Requested" },
    { key: "st", label: "Status" },
    { key: "extra", label: "Remarks" },
  ],
  drivers: [
    { key: "refNo", label: "Licence No" },
    { key: "title", label: "Name" },
    { key: "subtitle", label: "Categories" },
    { key: "dept", label: "Department" },
    { key: "expiryDate", label: "Licence Expiry" },
    { key: "st", label: "Status" },
    { key: "extra", label: "Phone" },
  ],
  trucks: [
    { key: "refNo", label: "Truck No" },
    { key: "title", label: "Truck" },
    { key: "subtitle", label: "Type" },
    { key: "empName", label: "Driver" },
    { key: "amount", label: "Capacity" },
    { key: "expiryDate", label: "Licence Expiry" },
    { key: "st", label: "Status" },
    { key: "paid", label: "Truck Status" },
    { key: "extra", label: "Insurance" },
  ],
  trailers: [
    { key: "refNo", label: "Trailer No" },
    { key: "title", label: "Trailer" },
    { key: "subtitle", label: "Type" },
    { key: "amount", label: "Capacity" },
    { key: "st", label: "Status" },
  ],
  contracts: [
    { key: "refNo", label: "Contract" },
    { key: "title", label: "Type" },
    { key: "empName", label: "Employee" },
    { key: "dept", label: "Department" },
    { key: "camp", label: "Camp" },
    { key: "dateFrom", label: "From" },
    { key: "dateTo", label: "To" },
    { key: "expiryDate", label: "Expiry" },
    { key: "st", label: "Status" },
    { key: "extra", label: "Months" },
  ],
  salaryDeductions: [
    { key: "refNo", label: "Ref No" },
    { key: "title", label: "Type" },
    { key: "empName", label: "Employee" },
    { key: "amount", label: "Amount" },
    { key: "dateFrom", label: "From" },
    { key: "dateTo", label: "To" },
    { key: "st", label: "Status" },
    { key: "extra", label: "Monthly" },
  ],
  employeeBenefits: [
    { key: "refNo", label: "Ref No" },
    { key: "title", label: "Benefit" },
    { key: "empName", label: "Employee" },
    { key: "dept", label: "Department" },
    { key: "amount", label: "Amount" },
    { key: "reqDate", label: "Date" },
    { key: "st", label: "Status" },
    { key: "extra", label: "Remarks" },
  ],
  registry: [
    { key: "refNo", label: "Ref No" },
    { key: "title", label: "Name" },
    { key: "subtitle", label: "Detail" },
    { key: "st", label: "Status" },
  ],
  registryWithAmount: [
    { key: "refNo", label: "Ref No" },
    { key: "title", label: "Name" },
    { key: "subtitle", label: "Detail" },
    { key: "amount", label: "Amount" },
    { key: "st", label: "Status" },
  ],
  fuel: [
    { key: "refNo", label: "Ref No" },
    { key: "title", label: "Name" },
    { key: "subtitle", label: "District" },
    { key: "st", label: "Status" },
  ],
  guns: [
    { key: "refNo", label: "Serial No" },
    { key: "title", label: "Name" },
    { key: "subtitle", label: "Category" },
    { key: "store", label: "Store" },
    { key: "camp", label: "Camp" },
    { key: "st", label: "Status" },
    { key: "extra", label: "Licence" },
  ],
  hotelsTravel: [
    { key: "refNo", label: "Source" },
    { key: "title", label: "Name" },
    { key: "subtitle", label: "Category" },
    { key: "amount", label: "Amount" },
    { key: "st", label: "Status" },
  ],
  animals: [
    { key: "refNo", label: "ID" },
    { key: "title", label: "Name" },
    { key: "subtitle", label: "Category" },
    { key: "st", label: "Status" },
  ],
  camps: [
    { key: "refNo", label: "ID" },
    { key: "title", label: "Camp Name" },
    { key: "st", label: "Status" },
  ],
  hotels: [
    { key: "refNo", label: "ID" },
    { key: "title", label: "Hotel Name" },
    { key: "subtitle", label: "Type" },
    { key: "st", label: "Status" },
    { key: "extra", label: "Star" },
  ],
};

const RECORD_COLUMNS: Record<string, { key: keyof InsightRow; label: string }[]> = {
  "management-attention": COLUMNS.managementAttention,
  "employees": COLUMNS.employees,
  "attendance": COLUMNS.attendanceLeave,
  "leave": COLUMNS.attendanceLeave,
  "drivers": COLUMNS.drivers,
  "trucks": COLUMNS.trucks,
  "trailers": COLUMNS.trailers,
  "contracts": COLUMNS.contracts,
  "overtime-requests": COLUMNS.standardRequests,
  "cash-advance-requests": COLUMNS.standardRequests,
  "bonus-requests": COLUMNS.standardRequests,
  "arrears-requests": COLUMNS.standardRequests,
  "salary-deductions": COLUMNS.salaryDeductions,
  "employee-benefits": COLUMNS.employeeBenefits,
  "promotion-transfer-requests": COLUMNS.standardRequests,
  "products": COLUMNS.registry,
  "business-partners": COLUMNS.registry,
  "fuel": COLUMNS.fuel,
  "guns": COLUMNS.guns,
  "hotels-travel": COLUMNS.hotelsTravel,
  "animals": COLUMNS.animals,
  "camps": COLUMNS.camps,
  "hotels": COLUMNS.hotels,
};

const FALLBACK_COLUMNS: { key: keyof InsightRow; label: string }[] = [
  { key: "refNo", label: "Ref No" },
  { key: "title", label: "Name" },
  { key: "subtitle", label: "Detail" },
  { key: "amount", label: "Amount" },
  { key: "reqDate", label: "Created" },
  { key: "st", label: "Status" },
];

function labelForStatus(token: string): string {
  const map: Record<string, string> = {
    OVERDUE: "Overdue (>7d)",
    PENDING_ALL: "Pending (all)",
    PENDING: "Pending",
    APPROVED: "Approved",
    HOLD: "Hold",
    REJECTED: "Rejected",
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    EXPIRED: "Expired",
    SOON5: "Expiring <5d",
    SOON10: "Expiring <10d",
    SOON30: "Expiring 30d",
    SOON60: "Expiring 60d",
    VALID: "Valid",
    LOW: "Low",
    CRITICAL: "Critical",
    OK: "OK",
    PRESENT: "Present",
    ABSENT: "Absent",
    SICK: "Sick",
    LATE: "Late",
    ONLEAVE: "On Leave",
    MAINTENANCE: "Maintenance",
    AVAILABLE: "Available",
    PAID: "Paid",
    UNPAID: "Unpaid",
    CLOSED: "Closed",
    OTHER: "Other",
  };
  return map[token] || token;
}

function formatDate(v: any): string {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "-";
  }
}

function cellValue(row: InsightRow, key: keyof InsightRow): string {
  const v = row[key];
  if (v == null || v === "") return "-";
  if (key === "amount") {
    const n = Number(v);
    return isNaN(n) ? String(v) : n.toLocaleString();
  }
  if (key === "dateFrom" || key === "dateTo" || key === "expiryDate" || key === "reqDate") {
    return formatDate(v);
  }
  return String(v);
}

export default function InsightsTab() {
  const { isCollapsed, isMobile } = useSidebar();
  const sidebarOffset = isMobile ? 0 : isCollapsed ? 80 : 260;
  const [cards, setCards] = useState<InsightCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCard, setSelectedCard] = useState<InsightCard | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [rows, setRows] = useState<InsightRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const loadCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/report-dashboard/cards`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load insight cards");
      const data = await res.json();
      setCards(Array.isArray(data.data) ? data.data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load insight cards");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const loadRecords = useCallback(
    async (card: InsightCard, st: string, q: string, fd: string, td: string, pg: number) => {
      setDialogLoading(true);
      setDialogError(null);
      try {
        const params = new URLSearchParams({ status: st, page: String(pg), pageSize: String(pageSize) });
        if (q.trim()) params.set("search", q.trim());
        if (fd) params.set("fromDate", fd);
        if (td) params.set("toDate", td);
        const res = await fetch(`${API_URL}/report-dashboard/records/${card.CardKey}?${params.toString()}`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load records");
        const data = await res.json();
        setRows(Array.isArray(data.data) ? data.data : []);
        setTotal(data.total || 0);
      } catch (err: any) {
        setDialogError(err?.message || "Failed to load records");
        setRows([]);
        setTotal(0);
      } finally {
        setDialogLoading(false);
      }
    },
    [pageSize]
  );

  const openCard = (card: InsightCard) => {
    setSelectedCard(card);
    setStatus("ALL");
    setSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
    setRows([]);
    setTotal(0);
    loadRecords(card, "ALL", "", "", "", 1);
  };

  const applyFilter = (st: string, q: string, fd: string, td: string, pg: number) => {
    if (!selectedCard) return;
    setPage(pg);
    loadRecords(selectedCard, st, q, fd, td, pg);
  };

  const groups = useMemo(() => {
    const order = ["attention", "workforce", "fleet", "contracts", "hrpayroll", "registry", "travel"];
    const map: Record<string, { title: string; cards: InsightCard[] }> = {};
    for (const c of cards) {
      if (!map[c.GroupKey]) map[c.GroupKey] = { title: c.GroupTitle, cards: [] };
      map[c.GroupKey].cards.push(c);
    }
    return order
      .filter((k) => map[k])
      .map((k) => map[k])
      .filter((g) => g.cards.length > 0);
  }, [cards]);

  const statusOptions = useMemo(() => {
    if (!selectedCard || !selectedCard.Filters) return ["ALL"];
    return selectedCard.Filters.split(",").filter(Boolean);
  }, [selectedCard]);

  const activeColumns = useMemo(() => {
    if (!selectedCard) return [];
    return RECORD_COLUMNS[selectedCard.CardKey] || FALLBACK_COLUMNS;
  }, [selectedCard]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handlePageSizeChange = (val: string) => {
    const ps = Number(val) || 10;
    setPageSize(ps);
    if (selectedCard) loadRecords(selectedCard, status, search, fromDate, toDate, 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Management Insights</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Approximate operational snapshots built from the live database. Click any card for details.
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

      {!loading && !error && groups.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No insight cards available.
        </div>
      )}

      {groups.map((group) => (
        <div key={group.title} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{group.title}</h3>
          <div className="grid gap-3 sm:gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,10rem),1fr))]">
            {group.cards.map((card) => {
              const def = CARD_DEFS[card.CardKey] || registryDef(card.CardKey);
              const Icon = (LucideIcons as any)[card.IconKey] || LucideIcons.LayoutGrid;
              const colorBg = COLOR_MAP[card.ColorKey] || COLOR_MAP.slate;
              const primary = card[def.primaryField] ?? 0;
              const headerBadge = def.headerBadgeField ? card[def.headerBadgeField] : undefined;
              return (
                <button
                  key={card.CardKey}
                  onClick={() => openCard(card)}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorBg} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground" title={card.CardTitle}>
                        {card.CardTitle}
                      </p>
                      {headerBadge != null && (
                        <p className="text-xs text-muted-foreground">Total: {headerBadge}</p>
                      )}
                    </div>
                    {card.ApproxNote && (
                      <span className="shrink-0 text-muted-foreground/60" title={card.ApproxNote}>
                        <Info className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  <p className={`mt-4 text-3xl font-bold ${def.primaryColor}`}>
                    {loading ? "..." : primary}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{def.primaryLabel}</p>
                  {def.chips.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3">
                      {def.chips.map((chip) => (
                        <div key={chip.label} className="flex items-center gap-1.5">
                          <span className={`text-sm font-semibold ${chip.color}`}>{card[chip.field] ?? 0}</span>
                          <span className="text-xs text-muted-foreground">{chip.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {card.ApproxNote && (
                    <p className="mt-3 text-[11px] italic leading-snug text-muted-foreground/80">~ {card.ApproxNote}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedCard && (
        <div className="fixed inset-y-0 right-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4" style={{ left: sidebarOffset }}>
          <div className="relative my-auto w-full max-w-5xl rounded-xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card px-6 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-foreground">{selectedCard.CardTitle}</h2>
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
                    placeholder="Search reference, name, title..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyFilter(status, search, fromDate, toDate, 1);
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
                    onChange={(e) => applyFilter(e.target.value, search, fromDate, toDate, 1)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{labelForStatus(s)}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => applyFilter(status, search, fromDate, toDate, 1)}
                    disabled={dialogLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    <Search className="h-4 w-4" />
                    Search
                  </button>
                </div>
              </div>

              {dialogError && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {dialogError}
                </div>
              )}

              {selectedCard.ApproxNote && (
                <p className="mt-3 flex items-start gap-1.5 text-xs italic text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {selectedCard.ApproxNote}
                </p>
              )}

              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      {activeColumns.map((col) => (
                        <th key={col.key} className="whitespace-nowrap px-4 py-3 font-semibold">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dialogLoading ? (
                      <tr>
                        <td colSpan={activeColumns.length + 1} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          Loading...
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={activeColumns.length + 1} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          No records match the current filter.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, idx) => (
                        <tr key={`${row.id}-${idx}`} className="border-b border-border last:border-0 hover:bg-muted/30">
                          {activeColumns.map((col) => {
                            if (col.key === "st") {
                              const style = STATUS_CHIP_STYLE[row.st || "PENDING"] || STATUS_CHIP_STYLE.PENDING;
                              return (
                                <td key={col.key} className="whitespace-nowrap px-4 py-2.5">
                                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}>
                                    {row.st || "-"}
                                  </span>
                                </td>
                              );
                            }
                            return (
                              <td key={col.key} className="max-w-[260px] whitespace-nowrap overflow-hidden text-ellipsis px-4 py-2.5 text-foreground" title={String(row[col.key] ?? "")}>
                                {cellValue(row, col.key)}
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
                    onClick={() => applyFilter(status, search, fromDate, toDate, Math.max(1, page - 1))}
                    disabled={page <= 1 || dialogLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>
                  <button
                    onClick={() => applyFilter(status, search, fromDate, toDate, Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages || dialogLoading}
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