"use client";

import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Send, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { formatDate as formatDateDisplay } from "@/lib/validation";
import { DatePicker } from "@/components/ui/date-picker";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchBpProductVat,
  fetchBpProductVatById,
  addBpProductVat,
  updateBpProductVat,
  submitBpProductVat,
  deleteBpProductVat,
  clearBpProductVatError,
  type BpProductVatGridData
} from "@/lib/bpProductVatPercentageSettingsSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import FilesViewerDialog from "./files-viewer-dialog";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const STATUS_OPTIONS = [
  { label: "Active", value: "AC" },
  { label: "Inactive", value: "IN" },
];

const STATUS_FILTERS = [
  { label: "Active", value: "AC" },
  { label: "Inactive", value: "IN" },
  { label: "Closed", value: "CL" },
  { label: "Cancelled", value: "CA" },
];

const emptyForm = (): Record<string, any> => ({
  COMPANY_ID: "",
  BP_ID: "",
  MAIN_CATEGORY_ID: "",
  SUB_CATEGORY_ID: "",
  PRODUCT_ID: "",
  VAT_PERCENTAGE: "",
  EFFECTIVE_FROM: "",
  EFFECTIVE_TO: "",
  REQUEST_STATUS: "",
  REMARKS: "",
  STATUS_MASTER: "AC",
});

const formatDate = (v: any) => formatDateDisplay(v);

export default function SettingsTab({ onViewFiles }: { onViewFiles?: (settingId: string) => void }) {
  const dispatch = useAppDispatch();
  const { rows, loading, error } = useAppSelector((s) => s.bpProductVat);
  const { toast } = useToast();

  const [role] = useState(() => {
    if (typeof window !== "undefined") {
      const userJson = localStorage.getItem("user");
      if (userJson) {
        try { return JSON.parse(userJson).role || "Manager"; } catch {}
      }
    }
    return "Manager";
  });
  const isAdmin = role === "Admin" || role === "Super Admin" || role === "Administrator";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AC");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BpProductVatGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>(emptyForm());
  const [editLoading, setEditLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | number | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [filesDialogSettingId, setFilesDialogSettingId] = useState<string | number | null>(null);
  const [filesDialogSettingLabel, setFilesDialogSettingLabel] = useState("");

  const { data: companies } = useApiQuery("bp-product-vat-companies", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed to fetch companies");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.COMPANY_ID }));
  });

  const { data: businessPartners } = useApiQuery("bp-product-vat-bps", async () => {
    const res = await fetch(`${API_URL}/business-partner-master`);
    if (!res.ok) throw new Error("Failed to fetch business partners");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.BP_ID }));
  });

  const { data: mainCategories } = useApiQuery("bp-product-vat-main-cats", async () => {
    const res = await fetch(`${API_URL}/product-main-category`);
    if (!res.ok) throw new Error("Failed to fetch main categories");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.MAIN_CATEGORY_ID }));
  });

  const { data: subCategories } = useApiQuery("bp-product-vat-sub-cats", async () => {
    const res = await fetch(`${API_URL}/product-sub-category`);
    if (!res.ok) throw new Error("Failed to fetch sub categories");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.SUB_CATEGORY_ID }));
  });

  const { data: products } = useApiQuery("bp-product-vat-products", async () => {
    const res = await fetch(`${API_URL}/product-master`);
    if (!res.ok) throw new Error("Failed to fetch products");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.PRODUCT_ID }));
  });

  const companyOptions = useMemo(
    () => (Array.isArray(companies) ? companies.map((c: any) => ({ value: String(c.COMPANY_ID), label: c.COMPANY_NAME })) : []),
    [companies]
  );
  const bpOptions = useMemo(
    () => (Array.isArray(businessPartners) ? businessPartners.map((b: any) => ({ value: String(b.BP_ID), label: b.BP_NAME })) : []),
    [businessPartners]
  );
  const mainCategoryOptions = useMemo(
    () => (Array.isArray(mainCategories) ? mainCategories.map((m: any) => ({ value: String(m.MAIN_CATEGORY_ID), label: m.MAIN_CATEGORY_NAME })) : []),
    [mainCategories]
  );
  const subCategoryOptions = useMemo(() => {
    if (!Array.isArray(subCategories)) return [];
    const mainId = form.MAIN_CATEGORY_ID;
    if (!mainId || mainId === "") return [];
    return subCategories
      .filter((s: any) => String(s.MAIN_CATEGORY_ID) === String(mainId))
      .map((s: any) => ({ value: String(s.SUB_CATEGORY_ID), label: s.SUB_CATEGORY_NAME }));
  }, [subCategories, form.MAIN_CATEGORY_ID]);
  const productOptions = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const mainId = form.MAIN_CATEGORY_ID;
    const subId = form.SUB_CATEGORY_ID;
    if (!mainId || mainId === "" || !subId || subId === "") return [];
    return products
      .filter((p: any) =>
        String(p.MAIN_CATEGORY_ID) === String(mainId) &&
        String(p.SUB_CATEGORY_ID) === String(subId)
      )
      .map((p: any) => ({ value: String(p.PRODUCT_ID), label: p.PRODUCT_NAME }));
  }, [products, form.MAIN_CATEGORY_ID, form.SUB_CATEGORY_ID]);

  useEffect(() => {
    dispatch(fetchBpProductVat(statusFilter));
  }, [dispatch, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearBpProductVatError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((d: any) => {
      return (
        [
          d.COMPANY_NAME,
          d.BP_NAME,
          d.MAIN_CATEGORY_NAME,
          d.SUB_CATEGORY_NAME,
          d.PRODUCT_NAME,
          d.VAT_PERCENTAGE,
          d.REQUEST_STATUS,
          d.REMARKS,
          d.STATUS_MASTER,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [rows, search]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.max(1, Math.ceil(filtered.length / effectivePageSize));
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const fillForm = (item: any) => {
    setForm({
      ...emptyForm(),
      ...item,
      COMPANY_ID: item.COMPANY_ID != null ? String(item.COMPANY_ID) : "",
      BP_ID: item.BP_ID != null ? String(item.BP_ID) : "",
      MAIN_CATEGORY_ID: item.MAIN_CATEGORY_ID != null ? String(item.MAIN_CATEGORY_ID) : "",
      SUB_CATEGORY_ID: item.SUB_CATEGORY_ID != null ? String(item.SUB_CATEGORY_ID) : "",
      PRODUCT_ID: item.PRODUCT_ID != null ? String(item.PRODUCT_ID) : "",
      VAT_PERCENTAGE: item.VAT_PERCENTAGE != null ? String(item.VAT_PERCENTAGE) : "",
      EFFECTIVE_FROM: item.EFFECTIVE_FROM ? String(item.EFFECTIVE_FROM).split("T")[0] : "",
      EFFECTIVE_TO: item.EFFECTIVE_TO ? String(item.EFFECTIVE_TO).split("T")[0] : "",
    });
  };

  const openEdit = async (item: BpProductVatGridData) => {
    setEditing(item);
    setEditLoading(true);
    setDialogOpen(true);
    fillForm(item);
    try {
      const res: any = await dispatch(
        fetchBpProductVatById(Number(item.BP_PROD_VAT_ID) || Number(item.id))
      ).unwrap();
      if (res) {
        fillForm(res);
      }
    } catch {
      // fallback to grid row data
    } finally {
      setEditLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.COMPANY_ID || form.COMPANY_ID === "") {
      toast({ variant: "destructive", title: "Company is required" });
      return;
    }
    if (!form.BP_ID || form.BP_ID === "") {
      toast({ variant: "destructive", title: "Business Partner is required" });
      return;
    }
    if (!form.MAIN_CATEGORY_ID || form.MAIN_CATEGORY_ID === "") {
      toast({ variant: "destructive", title: "Main Category is required" });
      return;
    }
    if (!form.SUB_CATEGORY_ID || form.SUB_CATEGORY_ID === "") {
      toast({ variant: "destructive", title: "Sub Category is required" });
      return;
    }
    if (!form.PRODUCT_ID || form.PRODUCT_ID === "") {
      toast({ variant: "destructive", title: "Product is required" });
      return;
    }
    if (form.VAT_PERCENTAGE === "" || form.VAT_PERCENTAGE == null) {
      toast({ variant: "destructive", title: "VAT Percentage is required" });
      return;
    }
    setSaving(true);
    try {
      const cleanForm = {
        ...form,
        REQUEST_STATUS: form.REQUEST_STATUS?.trim(),
        REMARKS: form.REMARKS?.trim(),
        VAT_PERCENTAGE: Math.max(0, Number(form.VAT_PERCENTAGE) || 0),
      };
      if (editing) {
        const res: any = await dispatch(
          updateBpProductVat({ ...cleanForm, BP_PROD_VAT_ID: Number(editing.BP_PROD_VAT_ID) || Number(editing.id) })
        ).unwrap();
        toast({ title: res?.message ?? "Record updated successfully!" });
      } else {
        const res: any = await dispatch(addBpProductVat({ ...cleanForm })).unwrap();
        if (!res?.BP_PROD_VAT_ID) {
          throw new Error(res?.message || "Failed to retrieve new record ID");
        }
        toast({ title: res?.message ?? "Record created successfully!" });
      }
      await dispatch(fetchBpProductVat(statusFilter));
      setDialogOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to save record") });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitFinal = async () => {
    if (submittingId == null) return;
    try {
      const res: any = await dispatch(submitBpProductVat(submittingId)).unwrap();
      setSubmittingId(null);
      toast({ title: res?.message ?? "Record submitted successfully!" });
      dispatch(fetchBpProductVat(statusFilter));
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to submit record") });
    }
  };

  const handleSingleDeleteFinal = async () => {
    if (deletingId == null) return;
    try {
      const res: any = await dispatch(deleteBpProductVat(deletingId)).unwrap();
      setDeletingId(null);
      toast({ title: res?.message ?? "Record deleted successfully!" });
      dispatch(fetchBpProductVat(statusFilter));
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to delete record") });
    }
  };

  const handleBulkDeleteFinal = async () => {
    try {
      let lastRes: any = null;
      for (const id of Array.from(selectedIds)) {
        lastRes = await dispatch(deleteBpProductVat(id)).unwrap();
      }
      setSelectedIds(new Set());
      setIsBulkDeleting(false);
      toast({ title: lastRes?.message ?? "Records deleted successfully!" });
      dispatch(fetchBpProductVat(statusFilter));
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to delete items!") });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length && paginated.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.filter((i: any) => i && i.id).map((i: any) => i.id)));
    }
  };

  const toggleSelect = (id: string | number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handlePageSizeChange = (val: string) => {
    setPageSize(val === "ALL" ? "ALL" : Number(val));
    setCurrentPage(1);
  };

  const setField = (key: string, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "MAIN_CATEGORY_ID") {
        next.SUB_CATEGORY_ID = "";
        next.PRODUCT_ID = "";
      } else if (key === "SUB_CATEGORY_ID") {
        next.PRODUCT_ID = "";
      }
      return next;
    });
  };

  const renderField = (
    key: string,
    label: string,
    type: "text" | "number" | "date" | "textarea" | "select",
    options?: { value: string; label: string }[],
    required?: boolean,
    placeholder?: string,
    searchable?: boolean,
    disabled?: boolean
  ) => {
    const value = form[key] ?? "";
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : ""}>
        <Label className="text-xs">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        {type === "select" && searchable ? (
          <SearchableSelect value={value} onChange={(v) => setField(key, v)} options={options || []} placeholder={placeholder || `Select ${label}`} disabled={disabled} />
        ) : type === "select" ? (
          <Select value={String(value)} onValueChange={(v) => setField(key, v)} disabled={disabled}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={placeholder || `Select ${label}`} />
            </SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={String(value)} onChange={(e) => setField(key, e.target.value)} placeholder={placeholder} />
        ) : type === "date" ? (
          <DatePicker value={String(value)} onChange={(v) => setField(key, v)} placeholder={placeholder} />
        ) : (
          <Input
            type={type}
            value={String(value)}
            placeholder={placeholder}
            min={type === "number" ? "0" : undefined}
            step={type === "number" ? "any" : undefined}
            onChange={(e) => {
              let val: any = e.target.value;
              if (type === "number") val = e.target.value === "" ? "" : Number(e.target.value);
              setField(key, val);
            }}
          />
        )}
      </div>
    );
  };

  const statusBadge = (val: any) => {
    const sv = String(val ?? "").toUpperCase().trim();
    const map: Record<string, { label: string; cls: string }> = {
      AC: { label: "Active", cls: "bg-success/10 text-success border-success/20" },
      IN: { label: "Inactive", cls: "bg-destructive/10 text-destructive border-destructive/20" },
      CL: { label: "Closed", cls: "bg-info/10 text-info border-info/20" },
      CA: { label: "Cancelled", cls: "bg-warning/10 text-warning border-warning/20" },
    };
    const entry = map[sv] || { label: sv, cls: "bg-info/10 text-info border-info/20" };
    return (
      <Badge variant="outline" className={`${entry.cls} px-2 py-0.5 text-[10px] uppercase font-bold`}>
        {entry.label}
      </Badge>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">BP Product VAT Percentage Settings</h1>
          <p className="text-sm text-muted-foreground">Manage business partner product VAT percentage settings</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Setting
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search settings..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Filter Status:</span>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-32 h-9 text-xs">
                  <SelectValue placeholder="Active" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isAdmin && selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsBulkDeleting(true)}
                className="animate-in fade-in zoom-in duration-200 shadow-sm border border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Selected ({selectedIds.size})
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-end">
            <span className="text-xs text-muted-foreground">Show</span>
            <Select value={String(effectivePageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePageSizes.map((s) => (
                  <SelectItem key={String(s)} value={String(s)}>
                    {String(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground uppercase tracking-wider text-[10px]">entries</span>
          </div>
        </div>

        <div className="overflow-x-auto w-full max-w-[calc(100vw-2rem)] sm:max-w-none">
          {loading ? (
            <div className="w-full space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
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
                      disabled={!isAdmin}
                    />
                  </th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Files</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Business Partner</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Main Category</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Sub Category</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Product</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">VAT %</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Effective From</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Effective To</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Request Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Remarks</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => {
                  const closed = String(item.STATUS_MASTER).toUpperCase() === "CL";
                  const cancelled = String(item.STATUS_MASTER).toUpperCase() === "CA";
                  const submittable = !closed && !cancelled;
                  return (
                    <tr
                      key={item.id || `row-${idx}`}
                      className={`border-b hover:bg-muted/30 transition-colors ${selectedIds.has(item.id) ? "bg-primary/5 border-primary/20" : ""}`}
                    >
                      <td className="p-3 w-10">
                        <input
                          type="checkbox"
                          className="rounded border-border w-4 h-4 accent-primary"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          disabled={!isAdmin}
                        />
                      </td>
                      <td className="p-3 flex gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded hover:bg-muted transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </button>
                        {submittable && (
                          <button
                            onClick={() => setSubmittingId(item.id)}
                            className="p-1.5 rounded hover:bg-info/10 transition-colors"
                            title="Submit"
                          >
                            <Send className="w-4 h-4 text-info" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setDeletingId(item.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setFilesDialogSettingId(item.BP_PROD_VAT_ID);
                              setFilesDialogSettingLabel(
                                `${item.COMPANY_NAME || "?"} / ${item.BP_NAME || "?"} / ${item.PRODUCT_NAME || "?"}`
                              );
                            }}
                            className="text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            title="View attached files"
                          >
                            Files ({Number(item.FILE_COUNT ?? 0)})
                          </button>
                          {onViewFiles && (
                            <button
                              onClick={() => onViewFiles(String(item.BP_PROD_VAT_ID || ""))}
                              className="p-1 rounded hover:bg-muted transition-colors"
                              title="Manage / Upload files for this Setting"
                            >
                              <FolderOpen className="w-4 h-4 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-medium">{item.BP_PROD_VAT_ID}</td>
                      <td className="p-3">{item.COMPANY_NAME || "—"}</td>
                      <td className="p-3">{item.BP_NAME || "—"}</td>
                      <td className="p-3">{item.MAIN_CATEGORY_NAME || "—"}</td>
                      <td className="p-3">{item.SUB_CATEGORY_NAME || "—"}</td>
                      <td className="p-3">{item.PRODUCT_NAME || "—"}</td>
                      <td className="p-3 font-medium">{item.VAT_PERCENTAGE != null ? `${item.VAT_PERCENTAGE}%` : "—"}</td>
                      <td className="p-3">{formatDate(item.EFFECTIVE_FROM) || "—"}</td>
                      <td className="p-3">{formatDate(item.EFFECTIVE_TO) || "—"}</td>
                      <td className="p-3">{item.REQUEST_STATUS || "—"}</td>
                      <td className="p-3">{item.REMARKS || "—"}</td>
                      <td className="p-3">{statusBadge(item.STATUS_MASTER)}</td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={15} className="p-8 text-center text-muted-foreground">
                      No records found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground font-medium">
            Showing <span className="text-foreground">{filtered.length === 0 ? 0 : (currentPage - 1) * (effectivePageSize === "ALL" ? 0 : effectivePageSize) + 1}</span>{" "}
            to <span className="text-foreground">{Math.min(currentPage * (effectivePageSize === "ALL" ? filtered.length : effectivePageSize), filtered.length)}</span>{" "}
            of <span className="text-foreground">{filtered.length}</span> entries
          </p>
          {effectivePageSize !== "ALL" && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="h-8 text-xs">
                Previous
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="h-8 w-8 text-xs p-0"
                  >
                    {page}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="h-8 text-xs">
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => setDialogOpen(v)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Setting" : "Add Setting"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {renderField("COMPANY_ID", "Company", "select", companyOptions, true, "Select company")}
              {renderField("BP_ID", "Business Partner", "select", bpOptions, true, "Select business partner")}
              {renderField("MAIN_CATEGORY_ID", "Main Category", "select", mainCategoryOptions, true, "Select main category", true)}
              {renderField("SUB_CATEGORY_ID", "Sub Category", "select", subCategoryOptions, true, "Select sub category", true, !form.MAIN_CATEGORY_ID)}
              {renderField("PRODUCT_ID", "Product", "select", productOptions, true, "Select product", true, !form.SUB_CATEGORY_ID)}
              {renderField("VAT_PERCENTAGE", "VAT Percentage", "number", undefined, true, "e.g., 18")}
              {renderField("EFFECTIVE_FROM", "Effective From", "date", undefined, false)}
              {renderField("EFFECTIVE_TO", "Effective To", "date", undefined, false)}
              {renderField("REQUEST_STATUS", "Request Status", "text", undefined, false, "e.g., Pending")}
              {renderField("STATUS_MASTER", "Status", "select", STATUS_OPTIONS, false, "Select status")}
              {renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || editLoading} className="bg-primary text-primary-foreground">
                {saving ? "Saving..." : editLoading ? "Loading..." : editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={submittingId != null} onOpenChange={(open) => !open && setSubmittingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit this setting?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the record as Submitted (Closed) and it can no longer be submitted again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitFinal} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deletingId != null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this setting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSingleDeleteFinal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
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
            <AlertDialogAction onClick={handleBulkDeleteFinal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FilesViewerDialog
        settingId={filesDialogSettingId ?? ""}
        settingLabel={filesDialogSettingLabel}
        open={filesDialogSettingId != null}
        onOpenChange={(open) => {
          if (!open) setFilesDialogSettingId(null);
        }}
      />
    </div>
  );
}
