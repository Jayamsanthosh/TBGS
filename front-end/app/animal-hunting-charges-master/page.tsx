"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchAnimalHuntingChargesMaster, addAnimalHuntingChargesMaster, updateAnimalHuntingChargesMaster, deleteAnimalHuntingChargesMaster, fetchAnimalHuntingChargesHdr, fetchAnimalHuntingChargesDtl, clearAnimalHuntingChargesMasterError, AnimalHuntingChargesMasterGridData } from "@/lib/animalHuntingChargesMasterCombinedSlice";
import { fetchCompanies } from "@/lib/companyMasterSlice";
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

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

const statusOptions = [
  { value: "AC", label: "Active" },
  { value: "IN", label: "Inactive" },
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

export default function AnimalHuntingChargesMasterPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.animalHuntingChargesMaster);
  const companies = useAppSelector((s) => s.company.companies);
  const currencies = useAppSelector((s) => s.currencies.currencies);
  const animals = useAppSelector((s) => s.animals.animals);
  const authUser = useAppSelector((s) => s.auth.user);
  const sessionYear = authUser?.yearProcess || String(new Date().getFullYear());
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [hdrStatusFilter, setHdrStatusFilter] = useState<string>("ALL");
  const [dtlStatusFilter, setDtlStatusFilter] = useState<string>("ALL");
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AnimalHuntingChargesMasterGridData | null>(null);
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
      const s = d.STATUS_HDR;
      if (s) set.add(String(s));
    });
    return Array.from(set);
  }, [items]);

  const uniqueDtlStatuses = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const set = new Set<string>();
    items.forEach((d: any) => {
      const s = d.STATUS_DTL;
      if (s) set.add(String(s));
    });
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((d: any) => {
      const matchesHdrStatus = hdrStatusFilter === "ALL" || normalizeStatus(d.STATUS_HDR) === normalizeStatus(hdrStatusFilter);
      const matchesDtlStatus = dtlStatusFilter === "ALL" || normalizeStatus(d.STATUS_DTL) === normalizeStatus(dtlStatusFilter);
      if (!matchesHdrStatus || !matchesDtlStatus) return false;
      const searchable = [d.COMPANY_NAME, d.EFFECTIVE_YEAR, d.ISSUING_AUTHORITY, d.APPROVAL_REFERENCE_NO, d.ANIMAL_NAME].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => Number(b.ANIMAL_HUNT_CHARGE_ID) - Number(a.ANIMAL_HUNT_CHARGE_ID));
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
    dispatch(fetchAnimalHuntingChargesMaster());
    dispatch(fetchCompanies());
    dispatch(fetchCurrencies());
    dispatch(fetchAnimals());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearAnimalHuntingChargesMasterError());
    }
  }, [error, dispatch, toast]);

  const newKey = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random();

  const emptyDtl = () => ({
    key: newKey(),
    SNO: undefined as number | undefined,
    ANIMAL_ID: undefined as number | undefined,
    GOVT_RATE: "",
    ACTUAL_AMOUNT: "",
    REMARKS: "",
    STATUS_MASTER: "AC",
  });

  const [dtls, setDtls] = useState<any[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [currentDtl, setCurrentDtl] = useState(emptyDtl());

  const emptyForm = () => ({
    COMPANY_ID: "",
    EFFECTIVE_YEAR: sessionYear,
    ISSUING_AUTHORITY: "",
    APPROVAL_REFERENCE_NO: "",
    APPROVAL_DATE: "",
    EFFECTIVE_FROM: "",
    EFFECTIVE_TO: "",
    CURRENCY_ID: "",
    REMARKS_HDR: "",
    STATUS_HDR: "AC",
  });

  const updateForm = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddDtlList = () => {
    if (!currentDtl.ANIMAL_ID) {
      toast({ title: "Please select an animal", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (dtls.some((d) => String(d.ANIMAL_ID) === String(currentDtl.ANIMAL_ID))) {
      toast({ title: "Animal already exists in the list", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setDtls((prev) => [...prev, currentDtl]);
    setCurrentDtl(emptyDtl());
  };

  const editDtl = (row: any) => {
    setCurrentDtl(row);
    setDtls((prev) => prev.filter((r) => r.key !== row.key));
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
    setForm(emptyForm());
    setDtls([]);
    setCurrentDtl(emptyDtl());
    setDeletedIds([]);
    setStep(1);
    setDialogOpen(true);
  };

  const openEdit = async (item: any) => {
    setEditing(item);
    try {
      const hdr = await dispatch(fetchAnimalHuntingChargesHdr(item.ANIMAL_HUNT_CHARGE_ID)).unwrap();
      setForm({
        COMPANY_ID: hdr.COMPANY_ID != null ? String(hdr.COMPANY_ID) : "",
        EFFECTIVE_YEAR: hdr.EFFECTIVE_YEAR || "",
        ISSUING_AUTHORITY: hdr.ISSUING_AUTHORITY || "",
        APPROVAL_REFERENCE_NO: hdr.APPROVAL_REFERENCE_NO || "",
        APPROVAL_DATE: fmtDate(hdr.APPROVAL_DATE),
        EFFECTIVE_FROM: fmtDate(hdr.EFFECTIVE_FROM),
        EFFECTIVE_TO: fmtDate(hdr.EFFECTIVE_TO),
        CURRENCY_ID: hdr.CURRENCY_ID != null ? String(hdr.CURRENCY_ID) : "",
        REMARKS_HDR: hdr.REMARKS || item.REMARKS_HDR || "",
        STATUS_HDR: hdr.STATUS_MASTER || item.STATUS_HDR || "AC",
      });

      const dtlRows = Array.isArray(items) ? items.filter((r: any) => String(r.ANIMAL_HUNT_CHARGE_ID) === String(item.ANIMAL_HUNT_CHARGE_ID)) : [];
      let rows: any[] = [];
      if (dtlRows.length) {
        const fetched = await Promise.all(
          dtlRows.map((r: any) => dispatch(fetchAnimalHuntingChargesDtl(r.SNO)).unwrap())
        );
        rows = fetched.map((d: any) => ({
          key: newKey(),
          SNO: d.SNO != null ? Number(d.SNO) : undefined,
          ANIMAL_ID: d.ANIMAL_ID != null ? Number(d.ANIMAL_ID) : undefined,
          GOVT_RATE: d.GOVT_RATE != null ? String(d.GOVT_RATE) : "",
          ACTUAL_AMOUNT: d.ACTUAL_AMOUNT != null ? String(d.ACTUAL_AMOUNT) : "",
          REMARKS: d.REMARKS || "",
          STATUS_MASTER: d.STATUS_MASTER || "AC",
        }));
      }
      setDtls(rows);
      setCurrentDtl(emptyDtl());
      setDeletedIds([]);
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Failed to load record"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setStep(1);
    setDialogOpen(true);
  };

  const handleNext = () => {
    if (!form.COMPANY_ID || !form.EFFECTIVE_YEAR) {
      toast({ title: "Company and Effective Year are required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSave = async () => {
    let finalDtls = [...dtls];
    if (currentDtl.ANIMAL_ID && !finalDtls.some(d => String(d.ANIMAL_ID) === String(currentDtl.ANIMAL_ID))) {
      finalDtls.push(currentDtl);
    }

    if (!editing && normalizeStatus(form.STATUS_HDR) === "INACTIVE") {
      toast({ title: "New records cannot be inactive", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!editing) {
      for (const r of finalDtls) {
        if (r.ANIMAL_ID && normalizeStatus(r.STATUS_MASTER) === "INACTIVE") {
          toast({ title: "New record detail rows cannot be inactive", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
          return;
        }
      }
    }
    const validRows = finalDtls.filter((r: any) => r.ANIMAL_ID);
    if (validRows.length === 0) {
      toast({ title: "At least one Animal is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    const animalIds = validRows.map((r: any) => String(r.ANIMAL_ID));
    if (new Set(animalIds).size !== animalIds.length) {
      toast({ title: "Animal already exists for this hunting charge", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        ANIMAL_HUNT_CHARGE_ID: editing ? Number(editing.ANIMAL_HUNT_CHARGE_ID) : 0,
        COMPANY_ID: Number(form.COMPANY_ID) || null,
        EFFECTIVE_YEAR: form.EFFECTIVE_YEAR || null,
        ISSUING_AUTHORITY: form.ISSUING_AUTHORITY?.trim() || null,
        APPROVAL_REFERENCE_NO: form.APPROVAL_REFERENCE_NO?.trim() || null,
        APPROVAL_DATE: form.APPROVAL_DATE || null,
        EFFECTIVE_FROM: form.EFFECTIVE_FROM || null,
        EFFECTIVE_TO: form.EFFECTIVE_TO || null,
        CURRENCY_ID: Number(form.CURRENCY_ID) || null,
        REMARKS_HDR: form.REMARKS_HDR?.trim() || null,
        STATUS_HDR: form.STATUS_HDR || "AC",
        dtls: validRows.map((r: any) => ({
          SNO: r.SNO || undefined,
          ANIMAL_ID: Number(r.ANIMAL_ID) || null,
          GOVT_RATE: r.GOVT_RATE ? Math.max(0, Number(r.GOVT_RATE) || 0) : null,
          ACTUAL_AMOUNT: r.ACTUAL_AMOUNT ? Math.max(0, Number(r.ACTUAL_AMOUNT) || 0) : null,
          REMARKS: r.REMARKS?.trim() || null,
          STATUS_MASTER: r.STATUS_MASTER || "AC",
        })),
        deletedIds,
        USER: "Admin",
        MAC_ADDRESS: "WEB",
        ROLE: role,
      };

      if (editing) {
        const res = await dispatch(updateAnimalHuntingChargesMaster(payload as AnimalHuntingChargesMasterGridData)).unwrap();
        toast({ title: res?.message ?? "Animal hunting charges updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addAnimalHuntingChargesMaster(payload as AnimalHuntingChargesMasterGridData)).unwrap();
        toast({ title: res?.message ?? "Animal hunting charges created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchAnimalHuntingChargesMaster());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error saving animal hunting charges"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteAnimalHuntingChargesMaster(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Animal hunting charges deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchAnimalHuntingChargesMaster());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error deleting animal hunting charges"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (key: string, label: string, type: "text" | "number" | "date" | "select" | "textarea", options?: { value: string; label: string }[], required?: boolean, placeholder?: string) => {
    const baseClass = "flex flex-col gap-1.5";
    const fieldEmpty = required && !form[key];
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : baseClass}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {type === "select" ? (
          <Select value={form[key] || ""} onValueChange={(v) => updateForm(key, v)}>
            <SelectTrigger className={`h-9 text-xs ${fieldEmpty ? "border-destructive ring-1 ring-destructive/30" : ""}`}><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={`text-xs ${fieldEmpty ? "border-destructive ring-1 ring-destructive/30" : ""}`} />
        ) : type === "date" ? (
          <DatePicker value={form[key] || ""} onChange={(v) => setForm({ ...form, [key]: v })} placeholder={placeholder} />
        ) : (
          <Input type={type === "number" ? "number" : "text"} value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={`h-9 text-xs ${fieldEmpty ? "border-destructive ring-1 ring-destructive/30" : ""}`} />
        )}
      </div>
    );
  };

  const money = (v: any) => (v === null || v === undefined || v === "" ? "-" : Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Animal Hunting Charges Master</h1>
          <p className="text-sm text-muted-foreground">Manage hunting charges header and animal detail data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Charges
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search charges..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Year</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Issuing Authority</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Approval Ref</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Approval Date</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Effective From</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Effective To</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Currency</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">HDR Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Animal</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Govt Rate</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Actual Amount</th>
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
                    <td className="p-3 font-medium">{item.ANIMAL_HUNT_CHARGE_ID || "-"}</td>
                    <td className="p-3 font-medium">{item.COMPANY_NAME || "-"}</td>
                    <td className="p-3">{item.EFFECTIVE_YEAR || "-"}</td>
                    <td className="p-3">{item.ISSUING_AUTHORITY || "-"}</td>
                    <td className="p-3">{item.APPROVAL_REFERENCE_NO || "-"}</td>
                    <td className="p-3">{formatDate(item.APPROVAL_DATE)}</td>
                    <td className="p-3">{formatDate(item.EFFECTIVE_FROM)}</td>
                    <td className="p-3">{formatDate(item.EFFECTIVE_TO)}</td>
                    <td className="p-3">{item.CURRENCY_NAME || "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${statusBadgeClass(item.STATUS_HDR)} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {statusLabel(item.STATUS_HDR)}
                      </Badge>
                    </td>
                    <td className="p-3">{item.ANIMAL_NAME || "-"}</td>
                    <td className="p-3">{money(item.GOVT_RATE)}</td>
                    <td className="p-3">{money(item.ACTUAL_AMOUNT)}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${statusBadgeClass(item.STATUS_DTL)} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {statusLabel(item.STATUS_DTL)}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={15} className="p-8 text-center text-muted-foreground">No animal hunting charges found</td></tr>
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
            <DialogTitle>{editing ? "Edit Animal Hunting Charges" : "Add Animal Hunting Charges"}</DialogTitle>
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
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Effective Year</Label>
                  <Input value={form.EFFECTIVE_YEAR || ""} readOnly className="h-9 text-xs bg-muted/50 cursor-not-allowed" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("ISSUING_AUTHORITY", "Issuing Authority", "text", undefined, false, "e.g., Government")}
                {renderField("APPROVAL_REFERENCE_NO", "Approval Reference No", "text", undefined, false, "e.g., REF001")}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("APPROVAL_DATE", "Approval Date", "date", undefined, false)}
                {renderField("CURRENCY_ID", "Currency", "select", currencyOptions, false, "Select currency")}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("EFFECTIVE_FROM", "Effective From", "date", undefined, false)}
                {renderField("EFFECTIVE_TO", "Effective To", "date", undefined, false)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("STATUS_HDR", "Status", "select", statusOptions, false)}
              </div>
              {renderField("REMARKS_HDR", "Remarks", "textarea", undefined, false, "Additional notes...")}
              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-xs">Cancel</Button>
                <Button onClick={handleNext} className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
                  Next <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 w-full">Animal Detail Information</h3>
              </div>
              <div className="space-y-4">
                {dtls.length > 0 && (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-2 font-semibold">Animal</th>
                          <th className="p-2 font-semibold text-right">Govt Rate</th>
                          <th className="p-2 font-semibold text-right">Actual Amt</th>
                          <th className="p-2 font-semibold text-center">Status</th>
                          <th className="p-2 font-semibold">Remarks</th>
                          <th className="p-2 font-semibold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dtls.map(row => (
                          <tr key={row.key} className="border-t hover:bg-muted/30">
                            <td className="p-2">{animalOptions.find(a => a.value === String(row.ANIMAL_ID))?.label || "-"}</td>
                            <td className="p-2 text-right">{money(row.GOVT_RATE)}</td>
                            <td className="p-2 text-right">{money(row.ACTUAL_AMOUNT)}</td>
                            <td className="p-2 text-center">
                              <Badge variant="outline" className={`${statusBadgeClass(row.STATUS_MASTER)} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                                {statusLabel(row.STATUS_MASTER)}
                              </Badge>
                            </td>
                            <td className="p-2">{row.REMARKS || "-"}</td>
                            <td className="p-2 text-center flex justify-center gap-2">
                              <button type="button" onClick={() => editDtl(row)} className="text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                              <button type="button" onClick={() => removeDtl(row.key)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">Add/Edit Detail</h4>
                  <div className="flex flex-wrap gap-3 items-start">
                    <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                      <Label className="text-[11px] font-medium text-muted-foreground">Animal *</Label>
                      <Select value={currentDtl.ANIMAL_ID ? String(currentDtl.ANIMAL_ID) : ""} onValueChange={(v) => setCurrentDtl(prev => ({...prev, ANIMAL_ID: Number(v)}))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select animal" /></SelectTrigger>
                        <SelectContent>
                          {animalOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1 w-28">
                      <Label className="text-[11px] font-medium text-muted-foreground">Govt Rate</Label>
                      <Input type="number" min="0" step="any" value={currentDtl.GOVT_RATE} onChange={(e) => setCurrentDtl(prev => ({...prev, GOVT_RATE: clampNonNegative(e.target.value)}))} className="h-8 text-xs" />
                    </div>
                    <div className="flex flex-col gap-1 w-28">
                      <Label className="text-[11px] font-medium text-muted-foreground">Actual Amount</Label>
                      <Input type="number" min="0" step="any" value={currentDtl.ACTUAL_AMOUNT} onChange={(e) => setCurrentDtl(prev => ({...prev, ACTUAL_AMOUNT: clampNonNegative(e.target.value)}))} className="h-8 text-xs" />
                    </div>
                    <div className="flex flex-col gap-1 w-28">
                      <Label className="text-[11px] font-medium text-muted-foreground">Status</Label>
                      <Select value={currentDtl.STATUS_MASTER || "AC"} onValueChange={(v) => setCurrentDtl(prev => ({...prev, STATUS_MASTER: v}))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="flex flex-col gap-1 flex-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">Remarks</Label>
                      <Input value={currentDtl.REMARKS} onChange={(e) => setCurrentDtl(prev => ({...prev, REMARKS: e.target.value}))} placeholder="Remarks" className="h-8 text-xs" />
                    </div>
                    <Button type="button" onClick={handleAddDtlList} className="h-8 text-xs mt-5 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add to List
                    </Button>
                  </div>
                </div>
              </div>
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
            <AlertDialogDescription>This will permanently delete this animal hunting charges record.</AlertDialogDescription>
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
