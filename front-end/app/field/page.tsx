"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchFieldCombined, addFieldCombined, updateFieldCombined, deleteFieldCombined, clearFieldCombinedError, FieldCombinedGridData } from "@/lib/fieldCombinedSlice";
import { useToast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE" || u === "A" || u === "Y" || u === "YES" || u === "TRUE" || u === "1" || u === "ON" || u === "ENABLED") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA" || u === "I" || u === "N" || u === "NO" || u === "FALSE" || u === "0" || u === "OFF" || u === "DISABLED") return "INACTIVE";
  return String(val || "");
};

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const PROJECT_NAME = "tgbs";

const statusOptions = [
  { value: "AC", label: "Active" },
  { value: "IN", label: "Inactive" },
];

export default function FieldPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.fieldCombined);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [hdrStatusFilter, setHdrStatusFilter] = useState<string>("ALL");
  const [dtlStatusFilter, setDtlStatusFilter] = useState<string>("ALL");
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FieldCombinedGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [removeDtlKey, setRemoveDtlKey] = useState<string | null>(null);

  const role = useMemo(() => {
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        try { return JSON.parse(userJson).role || 'Manager'; } catch { }
      }
    }
    return 'Manager';
  }, []);
  const isAdmin = role === "Admin" || role === "Super Admin" || role === "Administrator";

  const uniqueHdrStatuses = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const set = new Set<string>();
    items.forEach((d: any) => {
      const n = normalizeStatus(d.STATUS_FLD_HDR);
      if (n === "ACTIVE" || n === "INACTIVE") set.add(n);
    });
    return Array.from(set);
  }, [items]);

  const uniqueDtlStatuses = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const set = new Set<string>();
    items.forEach((d: any) => {
      const n = normalizeStatus(d.STATUS_FLD_DTL);
      if (n === "ACTIVE" || n === "INACTIVE") set.add(n);
    });
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((d: any) => {
      const matchesHdrStatus = hdrStatusFilter === "ALL" || normalizeStatus(d.STATUS_FLD_HDR) === hdrStatusFilter;
      const matchesDtlStatus = dtlStatusFilter === "ALL" || normalizeStatus(d.STATUS_FLD_DTL) === dtlStatusFilter;
      if (!matchesHdrStatus || !matchesDtlStatus) return false;
      const searchable = [d.PROJECT_NAME_FLD_HDR, d.FIELD_CATEGORY_FLD_HDR, d.ACTIVITY_NAME_FLD_DTL, d.ACTIVITY_DESC_FLD_DTL].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => Number(b.FIELD_ID_FLD_HDR || 0) - Number(a.FIELD_ID_FLD_HDR || 0));
  }, [items, search, hdrStatusFilter, dtlStatusFilter]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  useEffect(() => {
    dispatch(fetchFieldCombined());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearFieldCombinedError());
    }
  }, [error, dispatch, toast]);

  const [dtls, setDtls] = useState<any[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);

  const newKey = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random();

  const emptyDtl = (activityName: string = "") => ({
    key: newKey(),
    ACTIVITY_ID_FLD_DTL: undefined as number | undefined,
    ACTIVITY_NAME_FLD_DTL: activityName,
    STATUS_FLD_DTL: "AC",
    REMARKS_FLD_DTL: "",
  });

  const emptyForm = () => ({
    PROJECT_NAME_FLD_HDR: PROJECT_NAME,
    FIELD_CATEGORY_FLD_HDR: "",
    FIELD_DESC_FLD_HDR: "",
    REMARKS_FLD_HDR: "",
    STATUS_FLD_HDR: "AC",
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDtls([emptyDtl()]);
    setDeletedIds([]);
    setStep(1);
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      PROJECT_NAME_FLD_HDR: PROJECT_NAME,
      FIELD_CATEGORY_FLD_HDR: item.FIELD_CATEGORY_FLD_HDR || "",
      FIELD_DESC_FLD_HDR: item.FIELD_DESC_FLD_HDR || "",
      REMARKS_FLD_HDR: item.REMARKS_FLD_HDR || "",
      STATUS_FLD_HDR: item.STATUS_FLD_HDR || "AC",
    });
    const rows = (Array.isArray(items) ? items.filter((r: any) => String(r.FIELD_ID_FLD_HDR) === String(item.FIELD_ID_FLD_HDR)) : []).map((r: any) => ({
      key: newKey(),
      ACTIVITY_ID_FLD_DTL: r.ACTIVITY_ID_FLD_DTL != null ? Number(r.ACTIVITY_ID_FLD_DTL) : undefined,
      ACTIVITY_NAME_FLD_DTL: r.ACTIVITY_NAME_FLD_DTL || "",
      STATUS_FLD_DTL: r.STATUS_FLD_DTL || "AC",
      REMARKS_FLD_DTL: r.REMARKS_FLD_DTL || "",
    }));
    setDtls(rows.length ? rows : [emptyDtl()]);
    setDeletedIds([]);
    setStep(1);
    setDialogOpen(true);
  };

  const updateDtl = (key: string, field: string, value: any) => {
    setDtls((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  };

  const addDtl = () => {
    setDtls((prev) => [...prev, emptyDtl()]);
  };

  const removeDtl = (key: string) => {
    const row = dtls.find((r) => r.key === key);
    if (row?.ACTIVITY_ID_FLD_DTL) {
      setDeletedIds((d) => [...d, Number(row.ACTIVITY_ID_FLD_DTL)]);
    }
    setDtls((prev) => prev.filter((r) => r.key !== key));
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const closeAddDialog = () => {
    setDialogOpen(false);
  };

  const handleSave = async () => {
    if (!editing && normalizeStatus(form.STATUS_FLD_HDR) === "INACTIVE") {
      toast({ title: "New records cannot be set to Inactive", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!editing) {
      const inactiveDtl = dtls.some((r: any) => normalizeStatus(r.STATUS_FLD_DTL) === "INACTIVE");
      if (inactiveDtl) {
        toast({ title: "New records cannot have Inactive detail rows", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
        return;
      }
    }
    const validRows = dtls.filter((r: any) => r.ACTIVITY_NAME_FLD_DTL && String(r.ACTIVITY_NAME_FLD_DTL).trim() !== "");
    if (validRows.length === 0) {
      toast({ title: "At least one Activity Name is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    const names = validRows.map((r: any) => String(r.ACTIVITY_NAME_FLD_DTL).trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      toast({ title: "Activity Name already exists within this field", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        PROJECT_NAME_FLD_HDR: form.PROJECT_NAME_FLD_HDR,
        FIELD_CATEGORY_FLD_HDR: form.FIELD_CATEGORY_FLD_HDR || null,
        FIELD_DESC_FLD_HDR: form.FIELD_DESC_FLD_HDR || null,
        REMARKS_FLD_HDR: form.REMARKS_FLD_HDR || null,
        STATUS_FLD_HDR: form.STATUS_FLD_HDR || "AC",
        dtls: validRows.map((r: any) => ({
          ACTIVITY_ID_FLD_DTL: r.ACTIVITY_ID_FLD_DTL || undefined,
          ACTIVITY_NAME_FLD_DTL: r.ACTIVITY_NAME_FLD_DTL,
          STATUS_FLD_DTL: r.STATUS_FLD_DTL || "AC",
          REMARKS_FLD_DTL: r.REMARKS_FLD_DTL || null,
        })),
        deletedIds,
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (editing) {
        payload.FIELD_ID_FLD_HDR = Number(editing.FIELD_ID_FLD_HDR);
        const res = await dispatch(updateFieldCombined(payload as FieldCombinedGridData)).unwrap();
        toast({ title: res?.message ?? "Field updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addFieldCombined(payload as FieldCombinedGridData)).unwrap();
        toast({ title: res?.message ?? "Field created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      setCurrentPage(1);
      dispatch(fetchFieldCombined());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error saving field"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteFieldCombined(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Field deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchFieldCombined());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error deleting field"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (key: string, label: string, type: "text" | "select" | "textarea", options?: { value: string; label: string }[], required?: boolean, placeholder?: string) => {
    const baseClass = "flex flex-col gap-1.5";
    const isEmpty = !form[key] || String(form[key]).trim() === "";
    const borderClass = required && isEmpty ? "border-destructive ring-1 ring-destructive/30" : "";
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : baseClass}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {type === "select" ? (
          <Select value={form[key] || ""} onValueChange={(v) => setForm({ ...form, [key]: v })}>
            <SelectTrigger className={`h-9 text-xs ${borderClass}`}><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={`text-xs ${borderClass}`} />
        ) : (
          <Input type="text" value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={`h-9 text-xs ${borderClass}`} />
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Field</h1>
          <p className="text-sm text-muted-foreground">Manage field header and detail data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Field
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search fields..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
            {uniqueHdrStatuses.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">HDR Status:</span>
                <Select value={hdrStatusFilter} onValueChange={(v) => { setHdrStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-35 h-9 text-xs"><SelectValue placeholder="All HDR" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All HDR</SelectItem>
                    {uniqueHdrStatuses.map(s => <SelectItem key={s} value={s}>{s === "ACTIVE" ? "Active" : "Inactive"}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {uniqueDtlStatuses.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">DTL Status:</span>
                <Select value={dtlStatusFilter} onValueChange={(v) => { setDtlStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-35 h-9 text-xs"><SelectValue placeholder="All DTL" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All DTL</SelectItem>
                    {uniqueDtlStatuses.map(s => <SelectItem key={s} value={s}>{s === "ACTIVE" ? "Active" : "Inactive"}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-muted-foreground">Show</span>
            <Select value={String(effectivePageSize)} onValueChange={(v) => { setPageSize(v === "ALL" ? "ALL" : Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availablePageSizes.map((s) => <SelectItem key={String(s)} value={String(s)}>{String(s)}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground uppercase tracking-wider text-[10px]">entries</span>
          </div>
        </div>

        <div className="overflow-x-auto w-full max-w-[calc(100vw-2rem)] sm:max-w-none">
          {loading ? (
            <div className="w-full space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-4 border-b">
                  <Skeleton className="h-4 w-4" />
                  {[...Array(6)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Project Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Category</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Header Description</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">HDR Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Activity Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Activity Description</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">DTL Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                      {isAdmin && <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>}
                    </td>
                    <td className="p-3 font-medium">{item.FIELD_ID_FLD_HDR}</td>
                    <td className="p-3 font-medium">{item.PROJECT_NAME_FLD_HDR}</td>
                    <td className="p-3">{item.FIELD_CATEGORY_FLD_HDR || "-"}</td>
                    <td className="p-3">{item.FIELD_DESC_FLD_HDR || "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${normalizeStatus(item.STATUS_FLD_HDR) === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {normalizeStatus(item.STATUS_FLD_HDR) === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-3">{item.ACTIVITY_NAME_FLD_DTL}</td>
                    <td className="p-3">{item.ACTIVITY_DESC_FLD_DTL || "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${normalizeStatus(item.STATUS_FLD_DTL) === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {normalizeStatus(item.STATUS_FLD_DTL) === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No fields found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground font-medium">
            Showing {filtered.length === 0 ? 0 : ((currentPage - 1) * (effectivePageSize === "ALL" ? 0 : effectivePageSize)) + 1} to {Math.min(currentPage * (effectivePageSize === "ALL" ? filtered.length : effectivePageSize), filtered.length)} of {filtered.length} entries
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
                return <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="h-8 w-8 text-xs p-0">{page}</Button>;
              })}
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="h-8 text-xs">Next</Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Field" : "Add Field"}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-4">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 1 ? "text-primary" : "text-muted-foreground"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 1 ? "bg-primary text-primary-foreground" : "bg-green-500 text-white"}`}>
                {step > 1 ? "✓" : "1"}
              </span>
              Header
            </div>
            <div className="h-px flex-1 bg-border" />
            <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 2 ? "text-primary" : "text-muted-foreground"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</span>
              Details
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Header Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("FIELD_CATEGORY_FLD_HDR", "Category", "text", undefined, false, "e.g., Customer")}
              </div>
              {renderField("FIELD_DESC_FLD_HDR", "Header Description", "textarea", undefined, false, "Enter description...")}
              <div className="grid grid-cols-2 gap-4">
                {renderField("STATUS_FLD_HDR", "Status", "select", statusOptions, false)}
                {renderField("REMARKS_FLD_HDR", "Remarks", "textarea", undefined, false, "Additional notes...")}
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button variant="outline" onClick={closeAddDialog} className="text-xs">Cancel</Button>
                <Button onClick={handleNext} className="bg-primary text-primary-foreground text-xs">
                  Next <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Detail Information</h3>
                <Button variant="outline" size="sm" onClick={addDtl} className="h-8 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
                </Button>
              </div>
              {dtls.length === 0 ? (
                <p className="p-4 text-center text-muted-foreground text-xs border rounded-lg">No details added</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[50vh] overflow-y-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                          <th className="p-2 font-semibold w-[38%]">Activity Name *</th>
                          <th className="p-2 font-semibold w-[16%]">Status</th>
                          <th className="p-2 font-semibold">Remarks</th>
                          <th className="p-2 w-9" />
                        </tr>
                      </thead>
                      <tbody>
                        {dtls.map((row) => (
                          <tr key={row.key} className="border-t hover:bg-muted/30 transition-colors">
                            <td className="p-1 pl-2">
                              <Input value={row.ACTIVITY_NAME_FLD_DTL ?? ""} onChange={(e) => updateDtl(row.key, "ACTIVITY_NAME_FLD_DTL", e.target.value)} placeholder="Activity name" className={`h-8 text-xs ${!row.ACTIVITY_NAME_FLD_DTL ? "border-destructive ring-1 ring-destructive/30" : ""}`} />
                            </td>
                            <td className="p-1">
                              <Select value={row.STATUS_FLD_DTL || "AC"} onValueChange={(v) => updateDtl(row.key, "STATUS_FLD_DTL", v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-1">
                              <Input value={row.REMARKS_FLD_DTL ?? ""} onChange={(e) => updateDtl(row.key, "REMARKS_FLD_DTL", e.target.value)} placeholder="Remarks" className="h-8 text-xs" />
                            </td>
                            <td className="p-1 pr-2 text-center">
                              <button type="button" onClick={() => setRemoveDtlKey(row.key)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors" title="Remove row">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button variant="outline" onClick={handleBack} className="text-xs" disabled={saving}>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                </Button>
                <Button variant="outline" onClick={closeAddDialog} className="text-xs" disabled={saving}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className={`${editing ? "bg-info text-info-foreground hover:bg-info/90" : "bg-primary text-primary-foreground hover:bg-primary/90"} text-xs`}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure need to delete?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this field record.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!removeDtlKey} onOpenChange={(open) => !open && setRemoveDtlKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure need to delete?</AlertDialogTitle>
            <AlertDialogDescription>This detail row will be removed from this field. Existing rows are deleted permanently when you save.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (removeDtlKey) removeDtl(removeDtlKey); setRemoveDtlKey(null); }} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
