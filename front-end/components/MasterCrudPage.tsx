"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Download, FileSpreadsheet, FileText, X, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatDate } from "@/lib/validation";
import { DatePicker } from "@/components/ui/date-picker";

const DATE_KEY_RE = /(DATE|_FROM|_TO|_UPTO|EXPIRY|BIRTH|JOINING|ISSUE|VALID|HOLIDAY|APPROVAL|AMENDMENT|PURCHASE)/i;
const DATE_VALUE_RE = /^(\d{4})-(\d{2})-(\d{2})|^(\d{2})[-/](\d{2})[-/](\d{4})|^(\d{2})-[A-Za-z]{3}-\d{4}/;

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

const formatCellDate = (key: string, val: any): string => {
  const s = val === null || val === undefined ? "" : String(val);
  if (!s) return "";
  if (!DATE_KEY_RE.test(key)) return s;
  if (!DATE_VALUE_RE.test(s)) return s;
  return formatDate(s);
};

export interface MasterField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "searchable" | "textarea" | "date" | "password" | "image" | "employee";
  required?: boolean;
  disabled?: boolean; // renders as a locked read-only field (system-computed values)
  disabledOnEdit?: boolean; // read-only (disabled) only when editing an existing record — e.g. requested amounts on the response screen
  options?: (string | { value: string | number; label: string })[] | ((form: Record<string, any>) => (string | { value: string | number; label: string })[]);
  placeholder?: string;
  maxLength?: number;
  formatter?: (val: any) => any;
  defaultValue?: any;
  dependsOn?: string; // key of another field this select depends on (cascade reset)
  hideOnEdit?: boolean; // if true, the field is hidden when editing an existing record
  validate?: (value: any, form?: Record<string, any>) => string | undefined;
  storageFormatter?: (val: any) => any; // transforms the formatted display value into its stored form on save
  renderField?: (props: { field: MasterField; form: Record<string, any>; setForm: React.Dispatch<React.SetStateAction<Record<string, any>>>; editing: any }) => React.ReactNode;
}

import { useRouter } from "next/navigation";
import { EmployeeDropdown } from "@/components/EmployeeDropdown";

interface MasterPageProps {
  title: string;
  description: string;
  idPrefix: string;
  domain: string;
  fields: MasterField[];
  initialData: Record<string, any>[];
  columns: { key: string; label: string; render?: (val: any, item: Record<string, any>) => React.ReactNode }[];
  customAddUrl?: string;
  customEditUrl?: (id: string) => string;
  customStoreOverrides?: {
    data?: any[];
    add?: (item: any, next?: any) => any;
    update?: (item: any, next?: any) => any;
    remove?: (id: any, next?: any) => any;
    bulkRemove?: (ids: any[], next?: any) => any;
    isLoading?: boolean;
    onFieldChange?: (key: string, value: any, setForm: any, form: any) => boolean;
  };
  onPrint?: (item: any) => void;
  onBeforeEdit?: (item: Record<string, any>) => Promise<Record<string, any> | undefined>;
  onViewData?: (item: Record<string, any>) => Promise<Record<string, any> | undefined>;
  hideAllStatusFilter?: boolean;
  statusOptions?: { label: string; value: string }[];
  onStatusFilterChange?: (value: string) => void;
  onSaveValidate?: (form: Record<string, any>) => string | undefined;
  enableViewDetails?: boolean;
  lockedStatuses?: string[];
  hideLockedModifyActions?: boolean;
  rowActions?: (item: Record<string, any>) => React.ReactNode;
  enableDateRangeFilter?: boolean;
  onDateRangeFilterChange?: (from: string, to: string) => void;
}

const getNestedValue = (obj: any, path: string) => {
  if (!obj || !path) return "";
  const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
  if (value !== undefined && value !== null) return value;
  // Resilient fallback: if the path is nested (e.g. 'header.ref') but missing, try the flat property ('ref')
  if (path.includes('.')) {
    const parts = path.split('.');
    return obj[parts[parts.length - 1]] || "";
  }
  return obj[path] || "";
};

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

import { useMasterData } from "@/hooks/useMasterData";

export default function MasterCrudPage({ title, description, idPrefix, domain, fields, initialData, columns, customAddUrl, customEditUrl, customStoreOverrides, onPrint, onBeforeEdit, onViewData, statusOptions, onStatusFilterChange, onSaveValidate, enableViewDetails, lockedStatuses = ["CL", "CA"], hideLockedModifyActions, rowActions, enableDateRangeFilter, onDateRangeFilterChange }: MasterPageProps) {
  const router = useRouter();
  const overrides = customStoreOverrides || {};
  const masterData = overrides.data
    ? {} as ReturnType<typeof useMasterData>
    : (useMasterData(domain, initialData, idPrefix) || {});
  const { data, isLoading, add, update, remove, bulkRemove } = { ...masterData, ...overrides };
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Record<string, any> | null>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Prune selections that no longer exist (e.g., rows deleted / refreshed) so "Delete Selected" never shows stale counts.
  useEffect(() => {
    if (selectedIds.size === 0 || !Array.isArray(data)) return;
    const existing = new Set(data.map((d: Record<string, any>) => d.id).filter(Boolean));
    const pruned = new Set(Array.from(selectedIds).filter((id) => existing.has(id)));
    if (pruned.size !== selectedIds.size) setSelectedIds(pruned);
  }, [data]);

  const isLockedStatus = (item: Record<string, any>): boolean => {
    const s = String(item.STATUS_MASTER || item.status || "").toUpperCase();
    return lockedStatuses.includes(s);
  };

  const role = useMemo(() => {
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        try {
          const u = JSON.parse(userJson);
          return u.role || 'Manager';
        } catch (e) { }
      }
    }
    return 'Manager';
  }, []);

  const isAdmin = role === "Admin" || role === "Super Admin" || role === "Administrator";

  const STATUS_LABEL_MAP: Record<string, string> = {
    AC: "Active",
    ACTIVE: "Active",
    IA: "Inactive",
    IN: "Inactive",
    INACTIVE: "Inactive",
  };

  // Get unique statuses for the filter dropdown
  const uniqueStatuses = useMemo(() => {
    if (statusOptions) {
      return statusOptions.filter((s: any) => {
        const val = typeof s === "string" ? s : (s as any).value;
        return val !== undefined && val !== null && val !== "";
      });
    }
    const statuses = new Set<string>();
    if (Array.isArray(data)) {
      data.forEach((d: Record<string, any>) => {
        const status = d.status || d.STATUS_MASTER || d.statusMaster || d.statusEntry;
        if (status) statuses.add(normalizeStatus(status));
      });
    }
    return Array.from(statuses).map((s) => ({
      value: s,
      label: STATUS_LABEL_MAP[s.toUpperCase()] || s,
    }));
  }, [data, statusOptions]);



  const filtered = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const result = (() => {
      if (onStatusFilterChange) {
        return data.filter((d: Record<string, any>) => {
          const searchable = columns.map((c) => String(getNestedValue(d, c.key) || "").toLowerCase()).join(" ");
          return searchable.includes(search.toLowerCase());
        });
      }
      return data.filter((d: Record<string, any>) => {
        const searchable = columns.map((c) => String(getNestedValue(d, c.key) || "").toLowerCase()).join(" ");
        const matchesSearch = searchable.includes(search.toLowerCase());

        const itemStatus = getNestedValue(d, "status") || getNestedValue(d, "header.status") || d.STATUS_MASTER || d.statusMaster || d.statusEntry;
        const normalizedItemStatus = normalizeStatus(itemStatus);
        const normalizedFilter = normalizeStatus(statusFilter);
        const matchesStatus = statusFilter === "" || normalizedItemStatus === normalizedFilter;

        return matchesSearch && matchesStatus;
      });
    })();
    return [...result].sort((a: Record<string, any>, b: Record<string, any>) => {
      const aId = a.id ?? 0;
      const bId = b.id ?? 0;
      if (typeof aId === "number" && typeof bId === "number") return bId - aId;
      return String(bId).localeCompare(String(aId));
    });
  }, [data, search, columns, statusFilter]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;
  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);
  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length && paginated.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.filter(i => i && i.id && !isLockedStatus(i)).map((i: Record<string, any>) => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDeleteFinal = async () => {
    try {
      const ids = Array.from(selectedIds);
      let res: any;
      if (customStoreOverrides?.bulkRemove) {
        res = await customStoreOverrides.bulkRemove(ids, (p: any) => masterData.bulkRemove(p));
      } else if (masterData.bulkRemove) {
        res = await masterData.bulkRemove(ids);
      } else {
        // Fallback to sequential remove if bulkRemove is missing
        for (const id of ids) {
          if (customStoreOverrides?.remove) {
            res = await customStoreOverrides.remove(id, (p: any) => masterData.remove(p));
          } else {
            res = await masterData.remove(id);
          }
        }
      }
      setSelectedIds(new Set());
      setIsBulkDeleting(false);
      const successMsg = res?.message ?? res?.payload?.message;
      toast({ title: successMsg || `${title} deleted successfully!`, duration: DEFAULT_TOAST_DURATION });
    } catch (e: any) {
      toast({ title: (typeof e === "string" ? e : e?.message ?? e?.payload?.message) || `Failed to delete items!`, variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleSingleDeleteFinal = async () => {
    if (!deleteId) return;
    try {
      let res: any;
      if (customStoreOverrides?.remove) {
        res = await customStoreOverrides.remove(deleteId, (p: any) => masterData.remove(p));
      } else {
        res = await masterData.remove(deleteId);
      }
      setDeleteId(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteId);
        return next;
      });
      const successMsg = res?.message ?? res?.payload?.message;
      toast({ title: successMsg || `${title.replace(/s$/, "")} deleted successfully!`, duration: DEFAULT_TOAST_DURATION });
    } catch (e: any) {
      toast({ title: (typeof e === "string" ? e : e?.message ?? e?.payload?.message) || `Failed to delete ${title.replace(/s$/, "")}!`, variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const emptyForm = () => {
    const f: Record<string, any> = {};
    fields.forEach((field) => {
      if (field.key.toLowerCase().includes("status") && field.type === "select" && field.options) {
        const opts = typeof field.options === "function" ? field.options({}) : field.options;
        const activeOpt = opts.find((o: any) => {
          const val = typeof o === "string" ? o : String(o.value);
          return normalizeStatus(val) === "ACTIVE";
        });
        f[field.key] = activeOpt ? (typeof activeOpt === "string" ? activeOpt : String(activeOpt.value)) : (field.defaultValue !== undefined ? field.defaultValue : "ACTIVE");
      } else {
        f[field.key] = field.defaultValue !== undefined ? field.defaultValue : (field.type === "number" ? 0 : "");
      }
    });
    return f;
  };

  const openAdd = () => { if (customAddUrl) router.push(customAddUrl); else { setEditing(null); setForm(emptyForm()); setDialogOpen(true); } };
  const openEdit = async (item: Record<string, any>) => {
    if (customEditUrl) {
      router.push(customEditUrl(item.id));
    } else {
      const fullItem = onBeforeEdit ? (await onBeforeEdit(item)) || item : item;
      setEditing(fullItem);
      // Apply formatters to loaded values so fields like phone numbers display correctly
      const formData = { ...fullItem };
      fields.forEach((field) => {
        // Auto-format date fields: <input type="date"> requires "YYYY-MM-DD"
        if (field.type === "date" && formData[field.key] != null) {
          const raw = formData[field.key];
          try {
            const d = new Date(raw);
            if (!isNaN(d.getTime())) {
              formData[field.key] = d.toISOString().split("T")[0];
            }
          } catch (_) {}
        }
        if (field.type === "number") {
          const raw = formData[field.key];
          formData[field.key] = (raw !== undefined && raw !== null && raw !== "") ? Number(raw) : "";
        }
        if (field.type !== "select" && field.formatter && formData[field.key] !== undefined && formData[field.key] !== null) {
          formData[field.key] = field.formatter(String(formData[field.key]));
        }
        if (field.type === "select" && field.options && formData[field.key] !== undefined && formData[field.key] !== null) {
          const opts = typeof field.options === "function" ? field.options(formData) : (field.options || []);
          for (const o of opts) {
            if (!o) continue;
            const optLabel = typeof o === "string" ? o : o.label;
            const optValue = typeof o === "string" ? o : String(o.value);
            if (String(formData[field.key]).toUpperCase() === optLabel.toUpperCase()) {
              formData[field.key] = optValue;
              break;
            }
          }
        }
      });
      setForm(formData);
      setDialogOpen(true);
    }
  };

  const openView = async (item: Record<string, any>) => {
    let record = item;
    try {
      if (onViewData) {
        const full = await onViewData(item);
        if (full) record = full;
      } else if (onBeforeEdit) {
        const full = await onBeforeEdit(item);
        if (full) record = full;
      }
    } catch (_) {}
    setViewItem(record && typeof record === "object" ? record : item);
  };


  const handleSave = async () => {
    if (!editing) {
      const statusField = fields.find(f => f.key.toLowerCase().includes("status") && f.type === "select");
      if (statusField) {
        const statusVal = form[statusField.key];
        if (normalizeStatus(statusVal) === "INACTIVE") {
          toast({ title: `New ${title.replace(/s$/, "")} cannot be set to Inactive`, variant: "destructive", duration: DEFAULT_TOAST_DURATION });
          return;
        }
      }
    }
    if (onSaveValidate) {
      const formError = onSaveValidate(form);
      if (formError) {
        toast({ title: formError, variant: "destructive", duration: DEFAULT_TOAST_DURATION });
        return;
      }
    }
    const requiredMissing = fields.filter((f) => {
      if (!f.required) return false;
      const v = form[f.key];
      return !v || (typeof v === "string" && v.trim() === "");
    });
    if (requiredMissing.length > 0) {
      const labels = requiredMissing.map((f) => f.label);
      toast({ title: `${labels.join(", ")} ${requiredMissing.length > 1 ? "are" : "is"} required`, variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    const errors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.validate) {
        const err = field.validate(form[field.key], form);
        if (err) errors[field.key] = err;
      }
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast({ title: "Please fix validation errors", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    const payload: Record<string, any> = { ...form };
    fields.forEach((field) => {
      if (field.storageFormatter && payload[field.key] !== undefined && payload[field.key] !== null && payload[field.key] !== "") {
        payload[field.key] = field.storageFormatter(payload[field.key]);
      }
    });
    fields.forEach((field) => {
      const v = payload[field.key];
      if (typeof v === "string" && field.type !== "date" && field.type !== "number") {
        payload[field.key] = v.trim();
      }
    });
    try {
      let res: any;
      if (editing) {
        if (customStoreOverrides?.update) {
          res = await customStoreOverrides.update({ ...editing, ...payload }, (p: any) => masterData.update(p));
        } else {
          res = await masterData.update({ ...editing, ...payload });
        }
        const successMsg = res?.message ?? res?.payload?.message;
        toast({ title: successMsg || `${title.replace(/s$/, "")} updated successfully!`, duration: DEFAULT_TOAST_DURATION });
      } else {
        if (customStoreOverrides?.add) {
          res = await customStoreOverrides.add(payload, (p: any) => masterData.add(p));
        } else {
          res = await masterData.add(payload);
        }
        const successMsg = res?.message ?? res?.payload?.message;
        toast({ title: successMsg || `${title.replace(/s$/, "")} created successfully!`, duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
    } catch (e: any) {
      const msg = (typeof e === "string" ? e : e?.message) || `Error saving ${title.toLowerCase()}!`;
      toast({ title: msg, variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };


  const handlePageSizeChange = (val: string) => {
    if (val === "ALL") { setPageSize("ALL"); setCurrentPage(1); }
    else { setPageSize(Number(val)); setCurrentPage(1); }
  };

  // Export functions
  const exportPDF = async () => {
    const doc = new jsPDF();

    // Header & Logo — Logo LEFT, Title RIGHT
    // Handle logo with proper aspect ratio (placed on the left)
    try {
      const logoImg = new Image();
      logoImg.src = "/assets/logo.png";
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve; // Continue even if logo fails
      });

      if (logoImg.complete && logoImg.naturalWidth) {
        const imgWidth = 30; // Slightly smaller for list reports
        const imgHeight = (logoImg.naturalHeight * imgWidth) / logoImg.naturalWidth;
        doc.addImage(logoImg, "PNG", 14, 8, imgWidth, imgHeight);
      }
    } catch (e) {
      console.warn("Logo failed to load", e);
    }

    // Title on the right
    doc.setFontSize(16);
    doc.text(title, 196, 20, { align: "right" });

    doc.setFontSize(10);
    doc.text(`Exported: ${new Date().toLocaleString()}`, 196, 28, { align: "right" });
    const headers = ["ID", ...(columns || []).map(c => c.label)];
    const rows = (filtered || []).map((item: Record<string, any>) => [item.id, ...(columns || []).map(c => formatCellDate(c.key, getNestedValue(item, c.key)))]);
    autoTable(doc, { head: [headers], body: rows, startY: 34, styles: { fontSize: 8 }, headStyles: { fillColor: [34, 68, 50] } });
    doc.save(`${title.toLowerCase().replace(/\s+/g, "_")}.pdf`);
  };

  const exportExcel = () => {
    const wsData = [["ID", ...columns.map(c => c.label)], ...filtered.map((item: Record<string, any>) => [item.id, ...columns.map(c => formatCellDate(c.key, getNestedValue(item, c.key)))])];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title);
    XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, "_")}.xlsx`);
  };

  const exportCSV = () => {
    const headers = ["ID", ...columns.map(c => c.label)];
    const rows = filtered.map((item: Record<string, any>) => [item.id, ...columns.map(c => `"${formatCellDate(c.key, getNestedValue(item, c.key)).replace(/"/g, '""')}"`)]);
    const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${title.toLowerCase().replace(/\s+/g, "_")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportPDF}><FileText className="w-4 h-4 mr-2" /> Export as PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={exportExcel}><FileSpreadsheet className="w-4 h-4 mr-2" /> Export as Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={exportCSV}><FileText className="w-4 h-4 mr-2" /> Export as CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> Add {title.replace(/s$/, "")}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9" />
            </div>

            {uniqueStatuses.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Filter Status:</span>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); onStatusFilterChange?.(v); }}>
                  <SelectTrigger className="w-35 h-9 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    {uniqueStatuses.map(s => {
                      const val = typeof s === "string" ? s : (s as any).value;
                      const lbl = typeof s === "string" ? s : (s as any).label;
                      return <SelectItem key={val} value={val}>{lbl}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {enableDateRangeFilter && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">From:</span>
                <DatePicker
                  value={dateFrom}
                  placeholder="From date"
                  className="w-36 h-9 text-xs"
                  onChange={(v) => {
                    const next = v ?? "";
                    setDateFrom(next);
                    setCurrentPage(1);
                    onDateRangeFilterChange?.(next, dateTo);
                  }}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">To:</span>
                <DatePicker
                  value={dateTo}
                  placeholder="To date"
                  className="w-36 h-9 text-xs"
                  onChange={(v) => {
                    const next = v ?? "";
                    setDateTo(next);
                    setCurrentPage(1);
                    onDateRangeFilterChange?.(dateFrom, next);
                  }}
                />
              </div>
            )}

            {selectedIds.size > 0 && isAdmin && (
              <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleting(true)} className="animate-in fade-in zoom-in duration-200 shadow-sm border border-red-200">
                <Trash2 className="w-4 h-4 mr-2" /> Delete Selected ({selectedIds.size})
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-end">
            <span className="text-xs text-muted-foreground">Show</span>
            <Select value={String(effectivePageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availablePageSizes.map(s => <SelectItem key={String(s)} value={String(s)}>{String(s)}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground uppercase tracking-wider text-[10px]">entries</span>
          </div>
        </div>

        <div className="overflow-x-auto w-full max-w-[calc(100vw-2rem)] sm:max-w-none">
          {isLoading ? (
            <div className="w-full space-y-4">
              <div className="flex items-center space-x-4 border-b pb-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
                {columns.map((_, i) => (
                  <Skeleton key={i} className="h-4 flex-1" />
                ))}
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-4 border-b">
                  <Skeleton className="h-4 w-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                  {columns.map((_, j) => (
                    <Skeleton key={j} className="h-4 flex-1" />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 transition-colors">
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-border w-4 h-4 accent-primary"
                      checked={paginated.length > 0 && selectedIds.size === paginated.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-16">ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Actions</th>
                  {columns.map((c) => (
                    <th key={c.key} className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: Record<string, any>, idx: number) => {
                    const isLocked = isLockedStatus(item);
                    return (
                    <tr key={item.id || `row-${idx}`} className={`border-b hover:bg-muted/30 transition-colors ${selectedIds.has(item.id) ? 'bg-primary/5 border-primary/20' : ''}`}>
                    <td className="p-3 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-border w-4 h-4 accent-primary"
                        checked={selectedIds.has(item.id)}
                        disabled={isLocked}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td className="p-3 text-xs font-mono text-muted-foreground">{item.id ?? ""}</td>
                    <td className="p-3">
                      <div className="flex gap-2 items-center">
                      {enableViewDetails && (
                        <button onClick={() => openView(item)} className="p-1.5 rounded hover:bg-muted transition-colors" title={`View ${title.replace(/s$/, "")} details`}>
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                      )}
                      {(!hideLockedModifyActions || !isLocked) && (
                      <button
                        onClick={() => openEdit(item)}
                        disabled={isLocked}
                        title={isLocked ? "This record is submitted and locked" : undefined}
                        className={`p-1.5 rounded transition-colors ${isLocked ? "opacity-40 cursor-not-allowed text-muted-foreground" : "hover:bg-muted text-muted-foreground"}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      )}
                      {onPrint && (
                        <button onClick={() => onPrint(item)} className="p-1.5 rounded hover:bg-muted text-blue-600 transition-colors" title="Export as PDF">
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      {isAdmin && (!hideLockedModifyActions || !isLocked) && (
                        <button
                          onClick={() => setDeleteId(item.id)}
                          disabled={isLocked}
                          title={isLocked ? "This record is submitted and locked" : undefined}
                          className={`p-1.5 rounded transition-colors ${isLocked ? "opacity-40 cursor-not-allowed" : "hover:bg-destructive/10"}`}
                        >
                          <Trash2 className={`w-4 h-4 ${isLocked ? "text-muted-foreground" : "text-destructive"}`} />
                        </button>
                      )}
                      {rowActions && <span className="flex gap-1 items-center">{rowActions(item)}</span>}
                      </div>
                    </td>
                    {columns.map((c) => (
                      <td key={c.key} className="p-3">
                        {c.render ? (
                          c.render(getNestedValue(item, c.key), item)
                        ) : (
                          (() => {
                            const val = getNestedValue(item, c.key);
                            const field = fields.find(f => f.key === c.key);

                            // 1. Image rendering
                            if (field?.type === "image" || (typeof val === 'string' && val.startsWith('data:image'))) {
                              return val ? (
                                <div
                                  className="w-10 h-10 rounded border overflow-hidden bg-muted flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                                  onClick={() => setPreviewImage(val)}
                                  title="Click to preview"
                                >
                                  <img src={val} alt="Thumbnail" className="w-full h-full object-cover" />
                                </div>
                              ) : <div className="w-10 h-10 rounded border bg-muted flex items-center justify-center text-[10px] text-muted-foreground">N/A</div>;
                            }

                            // 2. Select rendering
                            if (field?.type === "select" && field.options) {
                              const resolvedOpts = typeof field.options === "function" ? field.options(item) : field.options;
                              const found = resolvedOpts.find((o: any) => typeof o === "object" && String(o.value) === String(val));
                              if (found && typeof found === "object") return found.label;
                            }

                            // 3. Status rendering (fallback)
                            if (c.key.toLowerCase().includes("status")) {
                              const sv = String(val ?? "").toLowerCase().trim();
                              const isGreen = sv === "active" || sv === "ac" || sv === "approved" || sv === "received" || sv === "delivered" || sv === "success" || sv === "confirmed" || sv === "paid";
                              const isAmber = sv === "draft" || sv === "pending" || sv === "in transit" || sv === "transit";
                              const isRed = sv === "inactive" || sv === "ia" || sv === "rejected" || sv === "cancelled" || sv === "canceled";
                              
                              const colorClass = isGreen
                                ? "bg-success/10 text-success border-success/20"
                                : isAmber
                                  ? "bg-warning/10 text-warning border-warning/20"
                                  : isRed
                                    ? "bg-destructive/10 text-destructive border-destructive/20"
                                    : "bg-info/10 text-info border-info/20";
                              
                              return (
                                <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                                  {isGreen ? "Active" : isRed ? "Inactive" : String(val)}
                                </Badge>
                              );
                            }

                            // 4. Default plain text rendering
                            return formatCellDate(c.key, val);
                          })()
                        )}
                      </td>
                    ))}
                  </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr><td colSpan={columns.length + 2} className="p-8 text-center text-muted-foreground">No records found matching your filters</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Info */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground font-medium">
            Showing <span className="text-foreground">{filtered.length === 0 ? 0 : ((currentPage - 1) * (effectivePageSize === "ALL" ? 0 : effectivePageSize)) + 1}</span>
            {" "}to <span className="text-foreground">{Math.min(currentPage * (effectivePageSize === "ALL" ? filtered.length : effectivePageSize), filtered.length)}</span>
            {" "}of <span className="text-foreground">{filtered.length}</span> entries
          </p>
          {effectivePageSize !== "ALL" && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="h-8 text-xs">Previous</Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return (
                  <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="h-8 w-8 text-xs p-0">
                    {page}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="h-8 text-xs">Next</Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) setFieldErrors({}); setDialogOpen(v); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${title.replace(/s$/, "")}` : `Add ${title.replace(/s$/, "")}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {fields.map((field) => {
                if (editing && field.hideOnEdit) return null;
                return (
                  <div key={field.key} className={field.type === "textarea" ? "col-span-2" : ""}>
                    <Label className="text-xs">{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
                  {field.disabled || (field.disabledOnEdit && editing) ? (
                    <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-1 text-sm text-muted-foreground cursor-not-allowed select-none overflow-hidden text-ellipsis whitespace-nowrap">
                      {(() => {
                        const raw = form[field.key];
                        if (raw === undefined || raw === null || raw === "") {
                          return <span className="italic opacity-50">Auto-calculated</span>;
                        }
                        
                        if (field.type === "select" && field.options) {
                           const resolvedOpts = typeof field.options === "function" ? field.options(form) : field.options;
                           const found = resolvedOpts.find((o: any) => typeof o === "object" ? String(o.value) === String(raw) : String(o) === String(raw));
                           if (found) return typeof found === "object" ? found.label : found;
                        }
                        
                        return String(raw);
                      })()}
                    </div>
                  ) : field.renderField ? (
                    field.renderField({ field, form, setForm, editing })
                  ) : field.type === "employee" ? (
                    <EmployeeDropdown
                      value={form[field.key] !== undefined && form[field.key] !== null ? String(form[field.key]) : ""}
                      onChange={(v) => {
                        if (customStoreOverrides?.onFieldChange) {
                          const handled = customStoreOverrides.onFieldChange(field.key, v, setForm, form);
                          if (handled) return;
                        }
                        setFieldErrors((prev) => { const next = { ...prev }; delete next[field.key]; return next; });
                        setForm({ ...form, [field.key]: v });
                      }}
                      hideLabel
                      required={field.required}
                      disabled={field.disabled}
                      placeholder={field.placeholder}
                    />
                  ) : field.type === "searchable" ? (
                    <SearchableSelect
                      value={form[field.key] !== undefined && form[field.key] !== null ? String(form[field.key]) : ""}
                      onChange={(v) => {
                        if (customStoreOverrides?.onFieldChange) {
                          const handled = customStoreOverrides.onFieldChange(field.key, v, setForm, form);
                          if (handled) return;
                        }
                        setFieldErrors((prev) => { const next = { ...prev }; delete next[field.key]; return next; });
                        const update: Record<string, any> = { ...form, [field.key]: v };
                        const resetDependents = (parentKey: string) => {
                          fields.forEach((f) => {
                            if (f.dependsOn === parentKey) {
                              update[f.key] = "";
                              resetDependents(f.key);
                            }
                          });
                        };
                        resetDependents(field.key);
                        setForm(update);
                      }}
                      options={(() => {
                        const seen = new Set();
                        const resolvedOptions = typeof field.options === "function" ? field.options(form) : (field.options || []);
                        return resolvedOptions.map((o) => {
                          if (!o) return null;
                          const val = typeof o === "string" ? o : String(o.value);
                          const lab = typeof o === "string" ? o : o.label;
                          if (seen.has(val)) return null;
                          seen.add(val);
                          return { value: val, label: lab };
                        }).filter(Boolean) as { value: string; label: string }[];
                      })()}
                      placeholder={field.placeholder || `Select ${field.label}`}
                      disabled={field.dependsOn ? !form[field.dependsOn] : false}
                      className={field.required && !form[field.key] ? "border-destructive ring-1 ring-destructive/30" : ""}
                    />
                  ) : field.type === "select" ? (
                    <Select
                      value={form[field.key] !== undefined && form[field.key] !== null ? String(form[field.key]) : ""}
                      onValueChange={(v) => {
                        if (customStoreOverrides?.onFieldChange) {
                          const handled = customStoreOverrides.onFieldChange(field.key, v, setForm, form);
                          if (handled) return;
                        }
                        setFieldErrors((prev) => { const next = { ...prev }; delete next[field.key]; return next; });
                        const update: Record<string, any> = { ...form, [field.key]: v };
                        const resetDependents = (parentKey: string) => {
                          fields.forEach((f) => {
                            if (f.dependsOn === parentKey) {
                              update[f.key] = "";
                              resetDependents(f.key);
                            }
                          });
                        };
                        resetDependents(field.key);
                        setForm(update);
                      }}
                    >
                      <SelectTrigger disabled={field.dependsOn ? !form[field.dependsOn] : false} className={field.required && !form[field.key] ? "border-destructive ring-1 ring-destructive/30" : ""}>
                        <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const seen = new Set();
                          const resolvedOptions = typeof field.options === "function" ? field.options(form) : (field.options || []);
                          return resolvedOptions.map((o, idx) => {
                            if (!o) return null;
                            const val = typeof o === "string" ? o : String(o.value);
                            const lab = typeof o === "string" ? o : o.label;
                            if (seen.has(val)) return null;
                            seen.add(val);
                            return <SelectItem key={`${val}-${idx}`} value={val}>{lab}</SelectItem>;
                          });
                        })()}
                      </SelectContent>
                    </Select>
                  ) : field.type === "textarea" ? (
                    <Textarea value={form[field.key] || ""} onChange={(e) => { setFieldErrors((prev) => { const next = { ...prev }; delete next[field.key]; return next; }); setForm({ ...form, [field.key]: e.target.value }); }} placeholder={field.placeholder} className={field.required && !form[field.key] ? "border-destructive ring-1 ring-destructive/30" : ""} />
                  ) : field.type === "image" ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {form[field.key] ? (
                            <img src={form[field.key]} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <Plus className="w-6 h-6 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="flex-1">
                          <Input
                            type="file"
                            accept="image/*"
                            className="text-xs"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setForm({
                                    ...form,
                                    [field.key]: reader.result as string,
                                    contentType: file.type,
                                    fileName: file.name
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">Recommended: Square image, max 2MB</p>
                        </div>
                      </div>
                    </div>
                  ) : field.type === "date" ? (
                    <DatePicker
                      value={form[field.key] ?? ""}
                      placeholder={field.placeholder}
                      disabled={field.disabled}
                      className={field.required && !form[field.key] ? "border-destructive ring-1 ring-destructive/30" : ""}
                      onChange={(val) => {
                        if (field.formatter) val = field.formatter(val);

                        if (customStoreOverrides?.onFieldChange) {
                          const handled = customStoreOverrides.onFieldChange(field.key, val, setForm, form);
                          if (handled) return;
                        }

                        setFieldErrors((prev) => { const next = { ...prev }; delete next[field.key]; return next; });
                        setForm({ ...form, [field.key]: val });
                      }}
                    />
                  ) : (
                    <Input
                      type={field.type === "password" ? "password" : field.type}
                      min={field.type === "number" ? 0 : undefined}
                      step={field.type === "number" ? "any" : undefined}
                      inputMode={field.type === "number" ? "decimal" : undefined}
                      placeholder={field.placeholder}
                      value={form[field.key] ?? ""}
                      maxLength={field.maxLength}
                      disabled={field.disabled}
                      className={`${field.disabled ? "bg-muted/50 cursor-not-allowed text-muted-foreground" : ""} ${field.required && !form[field.key] ? "border-destructive ring-1 ring-destructive/30" : ""}`}
                      onChange={(e) => {
                        let val: any = e.target.value;
                        if (field.type === "number") {
                          const raw = e.target.value;
                          const num = raw.trim() === "" ? 0 : Number(raw);
                          if (raw.trim() !== "" && Number.isNaN(num)) {
                            setFieldErrors((prev) => ({ ...prev, [field.key]: "Enter a valid number" }));
                            return;
                          }
                          if (num < 0) {
                            setFieldErrors((prev) => ({ ...prev, [field.key]: "Cannot be negative" }));
                            return;
                          }
                          val = num;
                        }
                        if (field.formatter) val = field.formatter(val);

                        if (customStoreOverrides?.onFieldChange) {
                          const handled = customStoreOverrides.onFieldChange(field.key, val, setForm, form);
                          if (handled) return;
                        }

                        setFieldErrors((prev) => { const next = { ...prev }; delete next[field.key]; return next; });
                        setForm({ ...form, [field.key]: val });
                      }}
                    />
                  )}
                  {fieldErrors[field.key] && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors[field.key]}</p>
                  )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              {editing ? (
                <Button onClick={handleSave} className="bg-info text-info-foreground hover:bg-info/90">Update</Button>
              ) : (
                <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Create</Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View {title.replace(/s$/, "")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(() => {
                if (!viewItem) return null;
                const APPROVAL_KEY_RE = /^(section_heading_response_|section_head_response_|response_1_|response_2_|final_response_)/i;
                const entries: { key: string; label: string; value: React.ReactNode; fullWidth?: boolean }[] = [];
                const seenKeys = new Set<string>();
                const seenLabels = new Map<string, number>();
                fields.forEach((field) => {
                  if (APPROVAL_KEY_RE.test(String(field.key))) return;
                  if (seenKeys.has(field.key)) return;
                  seenKeys.add(field.key);
                  const raw = getNestedValue(viewItem, field.key);
                  const opts = typeof field.options === "function" ? field.options(viewItem || {}) : field.options;
                  let value: React.ReactNode = raw;
                  if (field.type === "select" && opts) {
                    const found = (opts || []).find((o: any) => o && typeof o === "object" && String(o.value) === String(raw));
                    value = found ? (found as any).label : raw;
                  } else if (field.type === "date") {
                    value = formatCellDate(field.key, raw);
                  }
                  const norm = String(field.label).trim().toLowerCase();
                  if (seenLabels.has(norm)) return;
                  seenLabels.set(norm, entries.length);
                  entries.push({ key: field.key, label: field.label, value, fullWidth: field.type === "textarea" });
                });
                columns.forEach((col) => {
                  if (/^(id|sno)$/i.test(String(col.key))) return;
                  if (APPROVAL_KEY_RE.test(String(col.key))) return;
                  if (seenKeys.has(col.key)) return;
                  seenKeys.add(col.key);
                  const colLabel = String(col.label).trim();
                  const norm = colLabel.toLowerCase();
                  const existingIdx = seenLabels.get(norm);
                  const raw = getNestedValue(viewItem, col.key);
                  const colValue = col.render ? col.render(raw, viewItem) : formatCellDate(col.key, raw);
                  const isEmpty = (v: React.ReactNode) => v === undefined || v === null || v === "";
                  if (existingIdx !== undefined) {
                    const existing = entries[existingIdx];
                    if (isEmpty(existing.value)) {
                      existing.value = colValue;
                    } else if (
                      !isEmpty(colValue) &&
                      String(existing.value).trim() !== "" &&
                      /^\d+(\.\d+)?$/.test(String(existing.value).trim())
                    ) {
                      existing.value = `${colValue} (#${existing.value})`;
                    }
                    return;
                  }
                  seenLabels.set(norm, entries.length);
                  entries.push({ key: col.key, label: colLabel, value: colValue });
                });
                Object.keys(viewItem).forEach((key) => {
                  if (seenKeys.has(key)) return;
                  if (/^(id|sno|status|user|username|login_name|mac_address|role|created_by|created_date|created_mac_address|modified_by|modified_date|modified_mac_address)$/i.test(key)) return;
                  if (APPROVAL_KEY_RE.test(key)) return;
                  const raw = (viewItem as any)[key];
                  if (raw === null || raw === undefined) return;
                  if (typeof raw === "object") return;
                  seenKeys.add(key);
                  const human = key.replace(/_/g, " ").replace(/\b[a-z]/g, (c) => c.toUpperCase());
                  entries.push({ key, label: human, value: formatCellDate(key, raw), fullWidth: /remark|reason|address|note/i.test(key) });
                });
                const isRefEntry = (e: { key: string; label: string }) => /ref/i.test(String(e.key)) || /ref/i.test(String(e.label));
                const refEntries = entries.filter(isRefEntry);
                if (refEntries.length) {
                  const rest = entries.filter((e) => !isRefEntry(e));
                  const yearIdx = rest.findIndex((e) => /year/i.test(String(e.key)) || /year/i.test(String(e.label)));
                  const insertAt = yearIdx >= 0 ? yearIdx + 1 : 0;
                  rest.splice(insertAt, 0, ...refEntries);
                  entries.length = 0;
                  entries.push(...rest);
                }
                return entries.map((e) => (
                  <div key={e.key} className={e.fullWidth ? "col-span-2" : ""}>
                    <Label className="text-xs">{e.label}</Label>
                    <div className="mt-1 min-h-9 w-full rounded-md border border-input bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
                      {e.value === undefined || e.value === null || e.value === "" ? (
                        <span className="text-muted-foreground/60">—</span>
                      ) : (
                        e.value
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
            {(() => {
              if (!viewItem) return null;
              const APPROVAL_TIERS = [
                { prefix: "SECTION_HEAD_RESPONSE", label: "Section Head", personKey: "SECTION_HEAD_RESPONSE_PERSON_EMP_ID" },
                { prefix: "RESPONSE_1", label: "Response 1", personKey: "RESPONSE_1_EMP_ID" },
                { prefix: "RESPONSE_2", label: "Response 2", personKey: "RESPONSE_2_EMP_ID" },
                { prefix: "FINAL_RESPONSE", label: "Final Response", personKey: "FINAL_RESPONSE_PERSON" },
              ];
              const hasApproval = APPROVAL_TIERS.some((t) =>
                ["_PERSON_EMP_ID", "_PERSON", "_DATE", "_STATUS", "_REMARKS"].some((suf) =>
                  Object.prototype.hasOwnProperty.call(viewItem, t.prefix + suf)
                )
              );
              if (!hasApproval) return null;
              return (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Approval Responses</p>
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                          <th className="p-2 font-semibold">Response</th>
                          <th className="p-2 font-semibold">Person</th>
                          <th className="p-2 font-semibold">Date</th>
                          <th className="p-2 font-semibold">Status</th>
                          <th className="p-2 font-semibold">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {APPROVAL_TIERS.map((tier) => {
                          const person = viewItem[tier.personKey];
                          const date = viewItem[tier.prefix + "_DATE"];
                          const status = viewItem[tier.prefix + "_STATUS"];
                          const remarks = viewItem[tier.prefix + "_REMARKS"];
                          return (
                            <tr key={tier.prefix} className="border-b last:border-0">
                              <td className="p-2 font-medium">{tier.label}</td>
                              <td className="p-2">{person != null && person !== "" ? person : "—"}</td>
                              <td className="p-2">{date ? formatDate(date) : "—"}</td>
                              <td className="p-2">{status || "—"}</td>
                              <td className="p-2">{remarks || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setViewItem(null)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this {title.toLowerCase().replace(/s$/, "")}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSingleDeleteFinal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleting} onOpenChange={setIsBulkDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete multiple records?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} selected items? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeleteFinal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl border-none bg-transparent shadow-none p-0 flex items-center justify-center outline-none">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <div className="relative group">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 z-100 bg-white text-black hover:bg-destructive hover:text-white p-1.5 rounded-full shadow-2xl border border-black/10 transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                className="max-h-[85vh] max-w-[95vw] rounded-xl shadow-[0_0_60px_-15px_rgba(0,0,0,0.8)] object-contain animate-in zoom-in-95 duration-200"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}