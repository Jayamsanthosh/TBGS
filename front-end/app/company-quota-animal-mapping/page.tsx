"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchCompanyQuotaAnimalMapping, addCompanyQuotaAnimalMapping, updateCompanyQuotaAnimalMapping, deleteCompanyQuotaAnimalMapping, fetchCompanyQuotaHdr, fetchCompanyQuotaDtl, clearCompanyQuotaAnimalMappingError, CompanyQuotaAnimalMappingGridData } from "@/lib/companyQuotaAnimalMappingCombinedSlice";
import { fetchCompanies } from "@/lib/companyMasterSlice";
import { fetchCamps } from "@/lib/campMasterSlice";
import { fetchMappings } from "@/lib/companyCampStoreMappingSlice";
import { fetchCurrencies } from "@/lib/currencyMasterSlice";
import { fetchAnimals } from "@/lib/animalMasterSlice";
import { formatDate, clampNonNegative } from "@/lib/validation";
import { DatePicker } from "@/components/ui/date-picker";
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

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const statusOptions = [
  { value: "AC", label: "Active" },
  { value: "IN", label: "Inactive" },
];

const revisionOptions = [
  { value: "NEW", label: "New" },
  { value: "REVISION", label: "Revision" },
];

const statusLabel = (s: any) => {
  const v = String(s).toUpperCase();
  if (v === "AC" || v === "ACTIVE") return "Active";
  return "Inactive";
};

const statusBadgeClass = (s: any) => {
  const v = String(s).toUpperCase();
  return v === "AC" || v === "ACTIVE"
    ? "bg-green-500/10 text-green-600 border-green-200"
    : "bg-red-500/10 text-red-600 border-red-200";
};

const fmtDate = (d: any) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
};

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

export default function CompanyQuotaAnimalMappingPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.companyQuotaAnimalMapping);
  const companies = useAppSelector((s) => s.company.companies);
  const camps = useAppSelector((s) => s.camp.camps);
  const currencies = useAppSelector((s) => s.currencies.currencies);
  const animals = useAppSelector((s) => s.animals.animals);
  const mappings = useAppSelector((s) => s.companyCampStoreMapping.items);
  const authUser = useAppSelector((s) => s.auth.user);
  const sessionYear = authUser?.yearProcess || String(new Date().getFullYear());
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [hdrStatusFilter, setHdrStatusFilter] = useState<string>("ALL");
  const [dtlStatusFilter, setDtlStatusFilter] = useState<string>("ALL");
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyQuotaAnimalMappingGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const companyOptions = useMemo(
    () => (Array.isArray(companies) ? companies.map((c: any) => ({ value: String(c.COMPANY_ID), label: c.COMPANY_NAME })) : []),
    [companies]
  );
  const campOptions = useMemo(
    () => (Array.isArray(camps) ? camps.map((c: any) => ({ value: String(c.CAMP_ID), label: c.CAMP_NAME })) : []),
    [camps]
  );
  const mappedCamps = useMemo(() => {
    if (!form.COMPANY_ID) return [];
    const mappedIds = new Set(
      (Array.isArray(mappings) ? mappings : [])
        .filter((m: any) => String(m.COMPANY_ID) === String(form.COMPANY_ID))
        .map((m: any) => String(m.CAMP_ID))
    );
    const opts = campOptions.filter((c) => mappedIds.has(c.value));
    if (form.CAMP_ID && !opts.some((c) => c.value === form.CAMP_ID)) {
      const current = campOptions.find((c) => c.value === form.CAMP_ID);
      if (current) return [current, ...opts];
    }
    return opts;
  }, [mappings, form.COMPANY_ID, form.CAMP_ID, campOptions]);
  const currencyOptions = useMemo(
    () => (Array.isArray(currencies) ? currencies.map((c: any) => ({ value: String(c.CURRENCY_ID), label: c.CURRENCY_NAME })) : []),
    [currencies]
  );
  const animalOptions = useMemo(
    () => (Array.isArray(animals) ? animals.map((a: any) => ({ value: String(a.ANIMAL_ID), label: a.ANIMAL_NAME })) : []),
    [animals]
  );

  const uniqueHdrStatuses = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const set = new Set<string>();
    items.forEach((d: any) => {
      const s = d.STATUS_QUOTA_HDR;
      if (s) set.add(String(s));
    });
    return Array.from(set);
  }, [items]);

  const uniqueDtlStatuses = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const set = new Set<string>();
    items.forEach((d: any) => {
      const s = d.STATUS_QUOTA_DTL;
      if (s) set.add(String(s));
    });
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((d: any) => {
      const matchesHdrStatus = hdrStatusFilter === "ALL" || normalizeStatus(d.STATUS_QUOTA_HDR) === normalizeStatus(hdrStatusFilter);
      const matchesDtlStatus = dtlStatusFilter === "ALL" || normalizeStatus(d.STATUS_QUOTA_DTL) === normalizeStatus(dtlStatusFilter);
      if (!matchesHdrStatus || !matchesDtlStatus) return false;
      const searchable = [d.COMPANY_NAME, d.CAMP_NAME, d.EFFECTIVE_YEAR, d.NEW_REVISION, d.ISSUING_AUTHORITY, d.APPROVAL_REFERENCE_NO, d.ANIMAL_NAME].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => Number(b.id || b.QUOTA_ID || 0) - Number(a.id || a.QUOTA_ID || 0));
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
    dispatch(fetchCompanyQuotaAnimalMapping());
    dispatch(fetchCompanies());
    dispatch(fetchCamps());
    dispatch(fetchCurrencies());
    dispatch(fetchAnimals());
    dispatch(fetchMappings("AC"));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearCompanyQuotaAnimalMappingError());
    }
  }, [error, dispatch, toast]);

  const newKey = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random();

  const emptyDtl = () => ({
    key: newKey(),
    SNO: undefined as number | undefined,
    ANIMAL_ID: undefined as number | undefined,
    OLD_APPROVED_QTY: "",
    ADD_REMOVE_QTY: "",
    NEW_APPROVED_QTY: "",
    REMARKS: "",
    STATUS_MASTER: "AC",
  });

  const [dtls, setDtls] = useState<any[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);

  const emptyForm = () => ({
    COMPANY_ID: "",
    CAMP_ID: "",
    EFFECTIVE_YEAR: sessionYear,
    NEW_REVISION: "NEW",
    OLD_QUOTA_ID: "",
    ISSUING_AUTHORITY: "",
    APPROVAL_REFERENCE_NO: "",
    APPROVAL_DATE: "",
    LAST_AMENDMENT_DATE: "",
    EFFECTIVE_FROM: "",
    EFFECTIVE_TO: "",
    QUOTA_AMOUNT: "",
    VAT_AMOUNT: "",
    FINAL_QUOTA_AMOUNT: "",
    CURRENCY_ID: "",
    REMARKS_HDR: "",
    STATUS_HDR: "AC",
  });

  const updateForm = (key: string, value: any) => {
    const next = { ...form, [key]: value };
    if (key === "COMPANY_ID") {
      next.CAMP_ID = "";
    }
    if (key === "QUOTA_AMOUNT" || key === "VAT_AMOUNT") {
      const quota = Number(next.QUOTA_AMOUNT) || 0;
      const vat = Number(next.VAT_AMOUNT) || 0;
      next.FINAL_QUOTA_AMOUNT = String(quota + vat);
    }
    setForm(next);
  };

  const updateDtl = (key: string, field: string, value: any) => {
    setDtls((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, [field]: value };
        if (field === "OLD_APPROVED_QTY" || field === "ADD_REMOVE_QTY") {
          const old = Number(next.OLD_APPROVED_QTY) || 0;
          const add = Number(next.ADD_REMOVE_QTY) || 0;
          next.NEW_APPROVED_QTY = String(old + add);
        }
        return next;
      })
    );
  };

  const addDtl = () => {
    setDtls((prev) => [...prev, emptyDtl()]);
  };

  const removeDtl = (key: string) => {
    const row = dtls.find((r) => r.key === key);
    if (row?.SNO) {
      setDeletedIds((d) => [...d, Number(row.SNO)]);
    }
    setDtls((prev) => prev.filter((r) => r.key !== key));
  };

  const openAdd = () => {
    setEditing(null);
    const newForm = emptyForm();
    newForm.STATUS_HDR = "AC";
    setForm(newForm);
    const newDtl = emptyDtl();
    newDtl.STATUS_MASTER = "AC";
    setDtls([newDtl]);
    setDeletedIds([]);
    setStep(1);
    setDialogOpen(true);
  };

  const openEdit = async (item: any) => {
    setEditing(item);
    try {
      const hdr = await dispatch(fetchCompanyQuotaHdr(item.QUOTA_ID)).unwrap();
      setForm({
        COMPANY_ID: hdr.COMPANY_ID != null ? String(hdr.COMPANY_ID) : "",
        CAMP_ID: hdr.CAMP_ID != null ? String(hdr.CAMP_ID) : "",
        EFFECTIVE_YEAR: hdr.EFFECTIVE_YEAR || "",
        NEW_REVISION: hdr.NEW_REVISION || "NEW",
        OLD_QUOTA_ID: hdr.OLD_QUOTA_ID != null ? String(hdr.OLD_QUOTA_ID) : "",
        ISSUING_AUTHORITY: hdr.ISSUING_AUTHORITY || "",
        APPROVAL_REFERENCE_NO: hdr.APPROVAL_REFERENCE_NO || "",
        APPROVAL_DATE: fmtDate(hdr.APPROVAL_DATE),
        LAST_AMENDMENT_DATE: fmtDate(hdr.LAST_AMENDMENT_DATE),
        EFFECTIVE_FROM: fmtDate(hdr.EFFECTIVE_FROM),
        EFFECTIVE_TO: fmtDate(hdr.EFFECTIVE_TO),
        QUOTA_AMOUNT: hdr.QUOTA_AMOUNT != null ? String(hdr.QUOTA_AMOUNT) : "",
        VAT_AMOUNT: hdr.VAT_AMOUNT != null ? String(hdr.VAT_AMOUNT) : "",
        FINAL_QUOTA_AMOUNT: hdr.FINAL_QUOTA_AMOUNT != null ? String(hdr.FINAL_QUOTA_AMOUNT) : "",
        CURRENCY_ID: hdr.CURRENCY_ID != null ? String(hdr.CURRENCY_ID) : "",
        REMARKS_HDR: hdr.REMARKS || item.REMARKS_QUOTA_HDR || "",
        STATUS_HDR: hdr.STATUS_MASTER || item.STATUS_QUOTA_HDR || "AC",
      });

      const dtlRows = Array.isArray(items) ? items.filter((r: any) => String(r.QUOTA_ID) === String(item.QUOTA_ID)) : [];
      let rows: any[] = [];
      if (dtlRows.length) {
        const fetched = await Promise.all(
          dtlRows.map((r: any) => dispatch(fetchCompanyQuotaDtl(r.SNO)).unwrap())
        );
        rows = fetched.map((d: any) => ({
          key: newKey(),
          SNO: d.SNO != null ? Number(d.SNO) : undefined,
          ANIMAL_ID: d.ANIMAL_ID != null ? Number(d.ANIMAL_ID) : undefined,
          OLD_APPROVED_QTY: d.OLD_APPROVED_QTY != null ? String(d.OLD_APPROVED_QTY) : "",
          ADD_REMOVE_QTY: d.ADD_REMOVE_QTY != null ? String(d.ADD_REMOVE_QTY) : "",
          NEW_APPROVED_QTY: d.NEW_APPROVED_QTY != null ? String(d.NEW_APPROVED_QTY) : "",
          REMARKS: d.REMARKS || "",
          STATUS_MASTER: d.STATUS_MASTER || "AC",
        }));
      }
      setDtls(rows.length ? rows : [emptyDtl()]);
      setDeletedIds([]);
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Failed to load record"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setStep(1);
    setDialogOpen(true);
  };

  const handleNext = () => {
    if (!form.COMPANY_ID || !form.CAMP_ID || !form.EFFECTIVE_YEAR) {
      toast({ title: "Company, Camp and Effective Year are required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSave = async () => {
    const validRows = dtls.filter((r: any) => r.ANIMAL_ID);
    if (validRows.length === 0) {
      toast({ title: "At least one Animal is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    const animalIds = validRows.map((r: any) => String(r.ANIMAL_ID));
    if (new Set(animalIds).size !== animalIds.length) {
      toast({ title: "Animal already exists for this quota", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!editing) {
      const hdrStatus = normalizeStatus(form.STATUS_HDR);
      if (hdrStatus === "INACTIVE") {
        toast({ title: "New records cannot be set to Inactive", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
        return;
      }
      const hasInactiveDtl = validRows.some((r: any) => normalizeStatus(r.STATUS_MASTER) === "INACTIVE");
      if (hasInactiveDtl) {
        toast({ title: "New records cannot have Inactive animal details", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
        return;
      }
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        QUOTA_ID: editing ? Number(editing.QUOTA_ID) : 0,
        COMPANY_ID: Number(form.COMPANY_ID) || null,
        CAMP_ID: Number(form.CAMP_ID) || null,
        EFFECTIVE_YEAR: form.EFFECTIVE_YEAR || null,
        NEW_REVISION: form.NEW_REVISION || "NEW",
        OLD_QUOTA_ID: form.OLD_QUOTA_ID ? Math.max(0, Number(form.OLD_QUOTA_ID) || 0) : null,
        ISSUING_AUTHORITY: form.ISSUING_AUTHORITY?.trim() || null,
        APPROVAL_REFERENCE_NO: form.APPROVAL_REFERENCE_NO?.trim() || null,
        APPROVAL_DATE: form.APPROVAL_DATE || null,
        LAST_AMENDMENT_DATE: form.LAST_AMENDMENT_DATE || null,
        EFFECTIVE_FROM: form.EFFECTIVE_FROM || null,
        EFFECTIVE_TO: form.EFFECTIVE_TO || null,
        QUOTA_AMOUNT: form.QUOTA_AMOUNT ? Math.max(0, Number(form.QUOTA_AMOUNT) || 0) : null,
        VAT_AMOUNT: form.VAT_AMOUNT ? Math.max(0, Number(form.VAT_AMOUNT) || 0) : null,
        FINAL_QUOTA_AMOUNT: form.FINAL_QUOTA_AMOUNT ? Math.max(0, Number(form.FINAL_QUOTA_AMOUNT) || 0) : null,
        CURRENCY_ID: Number(form.CURRENCY_ID) || null,
        REMARKS_HDR: form.REMARKS_HDR?.trim() || null,
        STATUS_HDR: !editing ? "AC" : (form.STATUS_HDR || "AC"),
        dtls: validRows.map((r: any) => ({
          SNO: r.SNO || undefined,
          ANIMAL_ID: Number(r.ANIMAL_ID) || null,
          OLD_APPROVED_QTY: r.OLD_APPROVED_QTY ? Math.max(0, Number(r.OLD_APPROVED_QTY) || 0) : null,
          ADD_REMOVE_QTY: r.ADD_REMOVE_QTY ? Math.max(0, Number(r.ADD_REMOVE_QTY) || 0) : null,
          NEW_APPROVED_QTY: r.NEW_APPROVED_QTY ? Math.max(0, Number(r.NEW_APPROVED_QTY) || 0) : null,
          REMARKS: r.REMARKS?.trim() || null,
          STATUS_MASTER: !editing ? "AC" : (r.STATUS_MASTER || "AC"),
        })),
        deletedIds,
        USER: "Admin",
        MAC_ADDRESS: "WEB",
        ROLE: role,
      };

      if (editing) {
        const res = await dispatch(updateCompanyQuotaAnimalMapping(payload as CompanyQuotaAnimalMappingGridData)).unwrap();
        toast({ title: res?.message ?? "Company quota animal mapping updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addCompanyQuotaAnimalMapping(payload as CompanyQuotaAnimalMappingGridData)).unwrap();
        toast({ title: res?.message ?? "Company quota animal mapping created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchCompanyQuotaAnimalMapping());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error saving company quota animal mapping"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteCompanyQuotaAnimalMapping(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Company quota animal mapping deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchCompanyQuotaAnimalMapping());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error deleting company quota animal mapping"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (key: string, label: string, type: "text" | "number" | "date" | "select" | "textarea", options?: { value: string; label: string }[], required?: boolean, placeholder?: string) => {
    const baseClass = "flex flex-col gap-1.5";
    const isEmpty = !form[key] || form[key] === "";
    const requiredBorderClass = required && isEmpty ? "border-destructive ring-1 ring-destructive/30" : "";
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : baseClass}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {type === "select" ? (
          <Select value={form[key] || ""} onValueChange={(v) => updateForm(key, v)}>
            <SelectTrigger className={`h-9 text-xs ${requiredBorderClass}`}><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={form[key] || ""} onChange={(e) => updateForm(key, e.target.value)} placeholder={placeholder} className={`text-xs ${requiredBorderClass}`} />
        ) : type === "date" ? (
          <DatePicker value={form[key] || ""} onChange={(v) => updateForm(key, v)} placeholder={placeholder} />
        ) : (
          <Input type={type === "number" ? "number" : "text"} min={type === "number" ? "0" : undefined} value={form[key] ?? ""} onChange={(e) => updateForm(key, type === "number" ? clampNonNegative(e.target.value) : e.target.value)} placeholder={placeholder} className={`h-9 text-xs ${requiredBorderClass}`} />
        )}
      </div>
    );
  };

  const money = (v: any) => (v === null || v === undefined || v === "" ? "-" : Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Company Quota Animal Mapping</h1>
          <p className="text-sm text-muted-foreground">Manage quota header and animal detail data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Mapping
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search mappings..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
            {uniqueHdrStatuses.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">HDR Status:</span>
                <Select value={hdrStatusFilter} onValueChange={(v) => { setHdrStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-35 h-9 text-xs"><SelectValue placeholder="All HDR" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All HDR</SelectItem>
                    {uniqueHdrStatuses.map(s => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}
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
                    {uniqueDtlStatuses.map(s => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}
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
                  {[...Array(8)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Camp</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Year</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Revision</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Issuing Authority</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Approval Ref</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Effective From</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Effective To</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Quota Amount</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Currency</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Animal</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Old Qty</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Add/Remove</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">New Qty</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">HDR Status</th>
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
                    <td className="p-3 font-medium">{item.id ?? item.QUOTA_ID ?? "-"}</td>
                    <td className="p-3 font-medium">{item.COMPANY_NAME || "-"}</td>
                    <td className="p-3">{item.CAMP_NAME || "-"}</td>
                    <td className="p-3">{item.EFFECTIVE_YEAR || "-"}</td>
                    <td className="p-3">{item.NEW_REVISION || "-"}</td>
                    <td className="p-3">{item.ISSUING_AUTHORITY || "-"}</td>
                    <td className="p-3">{item.APPROVAL_REFERENCE_NO || "-"}</td>
                    <td className="p-3">{formatDate(item.EFFECTIVE_FROM)}</td>
                    <td className="p-3">{formatDate(item.EFFECTIVE_TO)}</td>
                    <td className="p-3">{money(item.QUOTA_AMOUNT)}</td>
                    <td className="p-3">{item.CURRENCY_NAME || "-"}</td>
                    <td className="p-3">{item.ANIMAL_NAME || "-"}</td>
                    <td className="p-3">{item.OLD_APPROVED_QTY ?? "-"}</td>
                    <td className="p-3">{item.ADD_REMOVE_QTY ?? "-"}</td>
                    <td className="p-3 font-medium">{item.NEW_APPROVED_QTY ?? "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${statusBadgeClass(item.STATUS_QUOTA_HDR)} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {statusLabel(item.STATUS_QUOTA_HDR)}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${statusBadgeClass(item.STATUS_QUOTA_DTL)} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {statusLabel(item.STATUS_QUOTA_DTL)}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={18} className="p-8 text-center text-muted-foreground">No company quota animal mappings found</td></tr>
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Company Quota Animal Mapping" : "Add Company Quota Animal Mapping"}</DialogTitle>
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
              Animal Details
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Header Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("COMPANY_ID", "Company", "select", companyOptions, true, "Select company")}
                {renderField("CAMP_ID", "Camp", "select", mappedCamps, true, form.COMPANY_ID ? "Select camp" : "Select company first")}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Effective Year</Label>
                  <Input value={form.EFFECTIVE_YEAR || ""} readOnly className="h-9 text-xs bg-muted/50 cursor-not-allowed" />
                </div>
                {renderField("NEW_REVISION", "Revision Type", "select", revisionOptions, false)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("OLD_QUOTA_ID", "Old Quota Id", "number", undefined, false, "If revision")}
                {renderField("ISSUING_AUTHORITY", "Issuing Authority", "text", undefined, false, "e.g., Government")}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("APPROVAL_REFERENCE_NO", "Approval Reference No", "text", undefined, false, "e.g., REF001")}
                {renderField("APPROVAL_DATE", "Approval Date", "date", undefined, false)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("LAST_AMENDMENT_DATE", "Last Amendment Date", "date", undefined, false)}
                {renderField("EFFECTIVE_FROM", "Effective From", "date", undefined, false)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("EFFECTIVE_TO", "Effective To", "date", undefined, false)}
                {renderField("CURRENCY_ID", "Currency", "select", currencyOptions, false, "Select currency")}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("QUOTA_AMOUNT", "Quota Amount", "number", undefined, false)}
                {renderField("VAT_AMOUNT", "VAT Amount", "number", undefined, false)}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Final Quota Amount</Label>
                <Input type="number" value={form.FINAL_QUOTA_AMOUNT ?? ""} readOnly className="h-9 text-xs bg-muted/50 cursor-not-allowed" />
              </div>
              <p className="text-xs text-muted-foreground -mt-2">Final Quota Amount is calculated automatically (Quota Amount + VAT Amount).</p>
              <div className="grid grid-cols-2 gap-4">
                {renderField("STATUS_HDR", "Status", "select", statusOptions, false)}
              </div>
              {renderField("REMARKS_HDR", "Remarks", "textarea", undefined, false, "Additional notes...")}
              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-xs">Cancel</Button>
                <Button onClick={handleNext} className="bg-primary text-primary-foreground text-xs">
                  Next <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Animal Detail Information</h3>
                <Button variant="outline" size="sm" onClick={addDtl} className="h-8 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
                </Button>
              </div>
              {dtls.length === 0 ? (
                <p className="p-4 text-center text-muted-foreground text-xs border rounded-lg">No animals added</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[50vh] overflow-y-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                          <th className="p-2 font-semibold w-[22%]">Animal *</th>
                          <th className="p-2 font-semibold">Old Qty</th>
                          <th className="p-2 font-semibold">Add/Remove</th>
                          <th className="p-2 font-semibold">New Qty</th>
                          <th className="p-2 font-semibold">Status</th>
                          <th className="p-2 font-semibold">Remarks</th>
                          <th className="p-2 w-9" />
                        </tr>
                      </thead>
                      <tbody>
                        {dtls.map((row) => (
                          <tr key={row.key} className="border-t hover:bg-muted/30 transition-colors">
                            <td className="p-1 pl-2">
                              <Select value={row.ANIMAL_ID ? String(row.ANIMAL_ID) : ""} onValueChange={(v) => updateDtl(row.key, "ANIMAL_ID", Number(v))}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select animal" /></SelectTrigger>
                                <SelectContent>
                                  {animalOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-1">
                              <Input type="number" min="0" value={row.OLD_APPROVED_QTY} onChange={(e) => updateDtl(row.key, "OLD_APPROVED_QTY", clampNonNegative(e.target.value))} className="h-8 text-xs w-24" />
                            </td>
                            <td className="p-1">
                              <Input type="number" min="0" value={row.ADD_REMOVE_QTY} onChange={(e) => updateDtl(row.key, "ADD_REMOVE_QTY", clampNonNegative(e.target.value))} className="h-8 text-xs w-24" />
                            </td>
                            <td className="p-1">
                              <Input type="number" value={row.NEW_APPROVED_QTY} readOnly className="h-8 text-xs w-24 bg-muted/50" />
                            </td>
                            <td className="p-1">
                              <Select value={row.STATUS_MASTER || "AC"} onValueChange={(v) => updateDtl(row.key, "STATUS_MASTER", v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-1">
                              <Input value={row.REMARKS} onChange={(e) => updateDtl(row.key, "REMARKS", e.target.value)} placeholder="Remarks" className="h-8 text-xs" />
                            </td>
                            <td className="p-1 pr-2 text-center">
                              <button type="button" onClick={() => removeDtl(row.key)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors" title="Remove row">
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
              <p className="text-xs text-muted-foreground -mt-2">New Qty is calculated automatically (Old + Add/Remove).</p>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button variant="outline" onClick={handleBack} className="text-xs" disabled={saving}>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                </Button>
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this company quota animal mapping record.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
