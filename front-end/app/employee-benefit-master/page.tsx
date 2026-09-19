"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchEmployeeBenefitMaster, addEmployeeBenefitMaster, updateEmployeeBenefitMaster, deleteEmployeeBenefitMaster, fetchEmployeeBenefitHdr, fetchEmployeeBenefitDtl, clearEmployeeBenefitMasterError, EmployeeBenefitMasterGridData } from "@/lib/employeeBenefitMasterCombinedSlice";
import { fetchEmployeeBenefitTypes } from "@/lib/employeeBenefitTypeMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { formatDate, clampNonNegative } from "@/lib/validation";
import { DatePicker } from "@/components/ui/date-picker";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";
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
import { MONTHS } from "@/lib/utils";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const statusOptions = [
  { value: "AC", label: "Active" },
  { value: "IN", label: "Inactive" },
];

const paidOptions = [
  { value: "PAID", label: "PAID" },
  { value: "UNPAID", label: "UNPAID" },
];

const statusLabel = (s: any) => {
  const v = String(s).toUpperCase();
  if (v === "AC" || v === "ACTIVE") return "Active";
  if (v === "CL" || v === "SUBMITTED") return "Submitted";
  if (v === "CA" || v === "CANCELLED") return "Cancelled";
  return "Inactive";
};

const statusBadgeClass = (s: any) => {
  const v = String(s).toUpperCase();
  if (v === "AC" || v === "ACTIVE") return "bg-green-500/10 text-green-600 border-green-200";
  if (v === "CL" || v === "SUBMITTED") return "bg-blue-500/10 text-blue-600 border-blue-200";
  if (v === "CA" || v === "CANCELLED") return "bg-orange-500/10 text-orange-600 border-orange-200";
  return "bg-red-500/10 text-red-600 border-red-200";
};

const paidBadge = (s: any) => {
  const v = String(s).toUpperCase();
  return v === "PAID"
    ? <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 px-2 py-0.5 text-[10px] uppercase font-bold">PAID</Badge>
    : <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 px-2 py-0.5 text-[10px] uppercase font-bold">UNPAID</Badge>;
};

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

const fmtDate = (d: any) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
};

export default function EmployeeBenefitMasterPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.employeeBenefitMaster);
  const benefitTypes = useAppSelector((s) => s.employeeBenefitTypeMaster.benefitTypes);
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [hdrStatusFilter, setHdrStatusFilter] = useState<string>("ALL");
  const [dtlStatusFilter, setDtlStatusFilter] = useState<string>("ALL");
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeBenefitMasterGridData | null>(null);
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

  const normalizeMonth = (m?: string): string => {
    if (m) {
      const up = m.trim().toUpperCase();
      const match = MONTHS.find(x => x.value.toUpperCase() === up || x.value.toUpperCase().startsWith(up));
      if (match) return match.value.toUpperCase();
    }
    return new Date().toLocaleString('en', { month: 'long' }).toUpperCase();
  };
  const sessionMonth = normalizeMonth(user?.monthProcess);
  const sessionYear = user?.yearProcess || String(new Date().getFullYear());

  const { data: employees } = useApiQuery("eb-master-employees", async () => {
    const res = await fetch(`${API_URL}/employee-database?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch employees");
    const json = await res.json();
    return json.data || [];
  });
  const { data: currencies } = useApiQuery("eb-master-currencies", async () => {
    const res = await fetch(`${API_URL}/currency-master`);
    if (!res.ok) throw new Error("Failed to fetch currencies");
    const json = await res.json();
    return json.data || [];
  });

  const currencyOptions = useMemo(
    () => (Array.isArray(currencies) ? currencies.map((c: any) => ({ value: String(c.CURRENCY_ID), label: c.CURRENCY_NAME })) : []),
    [currencies]
  );
  const benefitTypeOptions = useMemo(
    () => (Array.isArray(benefitTypes) ? benefitTypes.map((b: any) => ({ value: String(b.BENEFIT_TYPE_ID), label: b.BENEFIT_TYPE_NAME })) : []),
    [benefitTypes]
  );

  const uniqueHdrStatuses = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const set = new Set<string>();
    items.forEach((d: any) => {
      const s = d.HDR_STATUS ?? d.STATUS_MASTER;
      if (s) set.add(String(s));
    });
    return Array.from(set);
  }, [items]);

  const uniqueDtlStatuses = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const set = new Set<string>();
    items.forEach((d: any) => {
      const s = d.DTL_STATUS;
      if (s) set.add(String(s));
    });
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((d: any) => {
      const hdrSt = d.HDR_STATUS ?? d.STATUS_MASTER;
      const dtlSt = d.DTL_STATUS;
      const matchesHdrStatus = hdrStatusFilter === "ALL" || normalizeStatus(hdrSt) === normalizeStatus(hdrStatusFilter);
      const matchesDtlStatus = dtlStatusFilter === "ALL" || normalizeStatus(dtlSt) === normalizeStatus(dtlStatusFilter);
      if (!matchesHdrStatus || !matchesDtlStatus) return false;
      const searchable = [d.EMP_BENEFIT_REF_NO, d.EMP_ID, d.FIRST_NAME, d.LAST_NAME, d.COMPANY_NAME, d.CURRENCY_NAME, d.BENEFIT_TYPE_NAME].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => (b.EMP_BENEFIT_REF_NO || 0) - (a.EMP_BENEFIT_REF_NO || 0));
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
    dispatch(fetchEmployeeBenefitMaster());
    dispatch(fetchEmployeeBenefitTypes());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearEmployeeBenefitMasterError());
    }
  }, [error, dispatch, toast]);

  const newKey = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random();

  const emptyDtl = (empId?: any, grossAmount?: any) => ({
    key: newKey(),
    SNO: undefined as number | undefined,
    EMP_ID: empId != null ? Number(empId) : undefined,
    BENEFIT_TYPE_ID: undefined as number | undefined,
    GROSS_AMOUNT: grossAmount != null && grossAmount !== "" ? String(grossAmount) : "",
    PAID_STATUS: "UNPAID",
    REASON: "",
    REMARKS: "",
    STATUS_MASTER: "AC",
  });

  const [dtls, setDtls] = useState<any[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);

  const emptyForm = () => ({
    EMP_BENEFIT_REF_NO: "",
    BENEFIT_DATE: "",
    MONTH_ENTERED: sessionMonth || "",
    YEAR_ENTERED: sessionYear || "",
    EMP_ID: "",
    FIRST_NAME: "",
    MIDDLE_NAME: "",
    LAST_NAME: "",
    COMPANY_ID: "",
    DEPARTMENT_ID: "",
    DESIGNATION_ID: "",
    DEPARTMENT_GROUP_ID: "",
    DESIGNATION_GROUP_ID: "",
    CAMP_ID: "",
    STORE_ID: "",
    EMPLOYMENT_TYPE_ID: "",
    CURRENCY_ID: "",
    TOTAL_GROSS_AMOUNT: "",
    PAID_STATUS: "UNPAID",
    REASON: "",
    REMARKS: "",
    STATUS_MASTER: "AC",
  });

  const updateForm = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateDtl = (key: string, field: string, value: any) => {
    setDtls((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        return { ...r, [field]: value };
      })
    );
  };

  const addDtl = () => {
    setDtls((prev) => [...prev, emptyDtl(form.EMP_ID, form.TOTAL_GROSS_AMOUNT)]);
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
    setDtls([emptyDtl()]);
    setDeletedIds([]);
    setStep(1);
    setDialogOpen(true);
  };

  const handleEmpSelect = (empId: string) => {
    const empGrid = (Array.isArray(employees) ? employees.find((e: any) => String(e.EMP_ID) === String(empId)) : undefined);
    setForm((prev) => ({ ...prev, EMP_ID: empId, FIRST_NAME: "", MIDDLE_NAME: "", LAST_NAME: "", COMPANY_ID: "", DEPARTMENT_ID: "", DESIGNATION_ID: "", DEPARTMENT_GROUP_ID: "", DESIGNATION_GROUP_ID: "", CAMP_ID: "", STORE_ID: "", EMPLOYMENT_TYPE_ID: "", CURRENCY_ID: "", TOTAL_GROSS_AMOUNT: "" }));
    if (empGrid && empGrid.SNO) {
      fetch(`${API_URL}/employee-database/${empGrid.SNO}`)
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data) {
            const fullEmp = json.data;
            setForm((prev) => ({
              ...prev,
              EMP_ID: empId,
              FIRST_NAME: fullEmp.FIRST_NAME || "",
              MIDDLE_NAME: fullEmp.MIDDLE_NAME || "",
              LAST_NAME: fullEmp.LAST_NAME || "",
              COMPANY_ID: fullEmp.COMPANY_ID ? String(fullEmp.COMPANY_ID) : "",
              DEPARTMENT_ID: fullEmp.DEPARTMENT_ID ? String(fullEmp.DEPARTMENT_ID) : "",
              DESIGNATION_ID: fullEmp.DESIGNATION_ID ? String(fullEmp.DESIGNATION_ID) : "",
              DEPARTMENT_GROUP_ID: fullEmp.DEPARTMENT_GROUP_ID ? String(fullEmp.DEPARTMENT_GROUP_ID) : "",
              DESIGNATION_GROUP_ID: fullEmp.DESIGNATION_GROUP_ID ? String(fullEmp.DESIGNATION_GROUP_ID) : "",
              CAMP_ID: fullEmp.CAMP_ID ? String(fullEmp.CAMP_ID) : "",
              STORE_ID: fullEmp.STORE_ID ? String(fullEmp.STORE_ID) : "",
              EMPLOYMENT_TYPE_ID: fullEmp.EMPLOYMENT_TYPE_ID ? String(fullEmp.EMPLOYMENT_TYPE_ID) : "",
              CURRENCY_ID: fullEmp.CURRENCY_ID ? String(fullEmp.CURRENCY_ID) : "",
              TOTAL_GROSS_AMOUNT: fullEmp.GROSS != null && fullEmp.GROSS !== "" ? String(fullEmp.GROSS) : "",
            }));
            setDtls((prev) => prev.length === 0 ? [emptyDtl(empId, fullEmp.GROSS)] : prev.map((r: any) => ({ ...r, EMP_ID: Number(empId) })));
          }
        });
    } else {
      setDtls((prev) => prev.map((r: any) => ({ ...r, EMP_ID: Number(empId) })));
    }
  };

  const openEdit = async (item: any) => {
    setEditing(item);
    try {
      const refNo = item.EMP_BENEFIT_REF_NO;
      const hdr = await dispatch(fetchEmployeeBenefitHdr(refNo)).unwrap();
      const toStr = (v: any) => (v == null || v === "" ? "" : String(v));
      const toNum = (v: any) => (v == null || v === "" ? "" : Number(v));
      setForm({
        EMP_BENEFIT_REF_NO: hdr.EMP_BENEFIT_REF_NO || refNo || "",
        BENEFIT_DATE: fmtDate(hdr.BENEFIT_DATE),
        MONTH_ENTERED: hdr.MONTH_ENTERED || sessionMonth || "",
        YEAR_ENTERED: hdr.YEAR_ENTERED != null ? String(hdr.YEAR_ENTERED) : sessionYear || "",
        EMP_ID: toStr(hdr.EMP_ID),
        FIRST_NAME: hdr.FIRST_NAME || "",
        MIDDLE_NAME: hdr.MIDDLE_NAME || "",
        LAST_NAME: hdr.LAST_NAME || "",
        COMPANY_ID: toStr(hdr.COMPANY_ID),
        DEPARTMENT_ID: toStr(hdr.DEPARTMENT_ID),
        DESIGNATION_ID: toStr(hdr.DESIGNATION_ID),
        DEPARTMENT_GROUP_ID: toStr(hdr.DEPARTMENT_GROUP_ID),
        DESIGNATION_GROUP_ID: toStr(hdr.DESIGNATION_GROUP_ID),
        CAMP_ID: toStr(hdr.CAMP_ID),
        STORE_ID: toStr(hdr.STORE_ID),
        EMPLOYMENT_TYPE_ID: toStr(hdr.EMPLOYMENT_TYPE_ID),
        CURRENCY_ID: toStr(hdr.CURRENCY_ID),
        TOTAL_GROSS_AMOUNT: toNum(hdr.TOTAL_GROSS_AMOUNT),
        PAID_STATUS: hdr.PAID_STATUS || "UNPAID",
        REASON: hdr.REASON || "",
        REMARKS: hdr.REMARKS || "",
        STATUS_MASTER: hdr.STATUS_MASTER || "AC",
      });

      const dtlRows = Array.isArray(items) ? items.filter((r: any) => String(r.EMP_BENEFIT_REF_NO) === String(refNo)) : [];
      let rows: any[] = [];
      if (dtlRows.length) {
        const fetched = await Promise.all(
          dtlRows.map((r: any) => dispatch(fetchEmployeeBenefitDtl(r.SNO)).unwrap())
        );
        rows = fetched.map((d: any) => ({
          key: newKey(),
          SNO: d.SNO != null ? Number(d.SNO) : undefined,
          EMP_ID: d.EMP_ID != null ? Number(d.EMP_ID) : undefined,
          BENEFIT_TYPE_ID: d.BENEFIT_TYPE_ID != null ? Number(d.BENEFIT_TYPE_ID) : undefined,
          GROSS_AMOUNT: d.GROSS_AMOUNT != null ? String(d.GROSS_AMOUNT) : "",
          PAID_STATUS: d.PAID_STATUS || "UNPAID",
          REASON: d.REASON || "",
          REMARKS: d.REMARKS || "",
          STATUS_MASTER: d.STATUS_MASTER || "AC",
        }));
      }
      setDtls(rows.length ? rows : [emptyDtl(hdr.EMP_ID, hdr.TOTAL_GROSS_AMOUNT)]);
      setDeletedIds([]);
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Failed to load record"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setStep(1);
    setDialogOpen(true);
  };

  const handleNext = () => {
    if (!form.EMP_ID) {
      toast({ title: "Please select an Employee", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.BENEFIT_DATE) {
      toast({ title: "Benefit Date is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSave = async () => {
    const validRows = dtls.filter((r: any) => r.BENEFIT_TYPE_ID);
    if (validRows.length === 0) {
      toast({ title: "At least one Benefit Type is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    const benefitIds = validRows.map((r: any) => String(r.BENEFIT_TYPE_ID));
    if (new Set(benefitIds).size !== benefitIds.length) {
      toast({ title: "Benefit Type already exists for this record", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (form.TOTAL_GROSS_AMOUNT === "" || form.TOTAL_GROSS_AMOUNT === null || form.TOTAL_GROSS_AMOUNT === undefined || isNaN(Number(form.TOTAL_GROSS_AMOUNT))) {
      toast({ title: "Total Gross Amount is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    setSaving(true);
    try {
      if (!editing) {
        const hdrNorm = normalizeStatus(form.STATUS_MASTER);
        if (hdrNorm === "INACTIVE") {
          toast({ title: "Status cannot be inactive for a new record", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
          setSaving(false);
          return;
        }
      }
      const toNum = (v: any) => {
        if (v === "" || v === null || v === undefined) return null;
        const n = Number(v);
        return isNaN(n) ? null : Math.max(0, n);
      };
      const payload: Record<string, any> = {
        EMP_BENEFIT_REF_NO: editing ? String(editing.EMP_BENEFIT_REF_NO) : "",
        BENEFIT_DATE: form.BENEFIT_DATE || null,
        MONTH_ENTERED: form.MONTH_ENTERED?.trim() || null,
        YEAR_ENTERED: toNum(form.YEAR_ENTERED),
        EMP_ID: toNum(form.EMP_ID),
        FIRST_NAME: form.FIRST_NAME?.trim() || null,
        MIDDLE_NAME: form.MIDDLE_NAME?.trim() || null,
        LAST_NAME: form.LAST_NAME?.trim() || null,
        COMPANY_ID: toNum(form.COMPANY_ID),
        DEPARTMENT_ID: toNum(form.DEPARTMENT_ID),
        DESIGNATION_ID: toNum(form.DESIGNATION_ID),
        DEPARTMENT_GROUP_ID: toNum(form.DEPARTMENT_GROUP_ID),
        DESIGNATION_GROUP_ID: toNum(form.DESIGNATION_GROUP_ID),
        CAMP_ID: toNum(form.CAMP_ID),
        STORE_ID: toNum(form.STORE_ID),
        EMPLOYMENT_TYPE_ID: toNum(form.EMPLOYMENT_TYPE_ID),
        CURRENCY_ID: toNum(form.CURRENCY_ID),
        TOTAL_GROSS_AMOUNT: toNum(form.TOTAL_GROSS_AMOUNT),
        PAID_STATUS: form.PAID_STATUS || "UNPAID",
        REASON: form.REASON?.trim() || null,
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_MASTER: form.STATUS_MASTER || "AC",
        dtls: validRows.map((r: any) => ({
          SNO: r.SNO || undefined,
          EMP_ID: toNum(r.EMP_ID),
          BENEFIT_TYPE_ID: toNum(r.BENEFIT_TYPE_ID),
          GROSS_AMOUNT: toNum(r.GROSS_AMOUNT),
          PAID_STATUS: r.PAID_STATUS || "UNPAID",
          REASON: r.REASON?.trim() || null,
          REMARKS: r.REMARKS?.trim() || null,
          STATUS_MASTER: r.STATUS_MASTER || "AC",
        })),
        deletedIds,
        USER: user?.loginName || "Admin",
        MAC_ADDRESS: "WEB",
        ROLE: role,
      };

      if (editing) {
        const res = await dispatch(updateEmployeeBenefitMaster(payload as EmployeeBenefitMasterGridData)).unwrap();
        toast({ title: res?.message ?? "Employee benefit updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addEmployeeBenefitMaster(payload as EmployeeBenefitMasterGridData)).unwrap();
        toast({ title: res?.message ?? "Employee benefit created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchEmployeeBenefitMaster());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error saving employee benefit"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteEmployeeBenefitMaster(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Employee benefit deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchEmployeeBenefitMaster());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error deleting employee benefit"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (key: string, label: string, type: "text" | "number" | "date" | "select" | "textarea", options?: { value: string; label: string }[], required?: boolean, placeholder?: string) => {
    const baseClass = "flex flex-col gap-1.5";
    const isEmpty = required && !form[key];
    const fieldBorderClass = isEmpty ? "border-destructive ring-1 ring-destructive/30" : "";
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : baseClass}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {type === "select" ? (
          <Select value={form[key] || ""} onValueChange={(v) => updateForm(key, v)}>
            <SelectTrigger className={`h-9 text-xs ${fieldBorderClass}`}><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={`text-xs ${fieldBorderClass}`} />
        ) : type === "date" ? (
          <DatePicker value={form[key] || ""} onChange={(v) => setForm({ ...form, [key]: v })} placeholder={placeholder} className={fieldBorderClass || undefined} />
        ) : (
          <Input type={type === "number" ? "number" : "text"} min={type === "number" ? "0" : undefined} step={type === "number" ? "any" : undefined} value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={`h-9 text-xs ${fieldBorderClass}`} />
        )}
      </div>
    );
  };

  const money = (v: any) => (v === null || v === undefined || v === "" ? "-" : Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Benefit Master</h1>
          <p className="text-sm text-muted-foreground">Manage employee benefit header and detail data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Benefit
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search benefits..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Ref No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Benefit Date</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Employee</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Month/Year</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Total Gross</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">HDR Paid</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">HDR Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Benefit Type</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Gross Amount</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">DTL Paid</th>
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
                    <td className="p-3 font-medium">{item.EMP_BENEFIT_REF_NO || "-"}</td>
                    <td className="p-3">{formatDate(item.BENEFIT_DATE)}</td>
                    <td className="p-3">{[item.FIRST_NAME, item.MIDDLE_NAME, item.LAST_NAME].filter(Boolean).join(" ") || "-"} (#{item.EMP_ID ?? "-"})</td>
                    <td className="p-3">{item.MONTH_ENTERED || "-"} {item.YEAR_ENTERED || ""}</td>
                    <td className="p-3">{item.COMPANY_NAME || "-"}</td>
                    <td className="p-3">{money(item.TOTAL_GROSS_AMOUNT)}</td>
                    <td className="p-3">{paidBadge(item.HDR_PAID_STATUS ?? item.PAID_STATUS)}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${statusBadgeClass(item.HDR_STATUS ?? item.STATUS_MASTER)} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {statusLabel(item.HDR_STATUS ?? item.STATUS_MASTER)}
                      </Badge>
                    </td>
                    <td className="p-3">{item.BENEFIT_TYPE_NAME || "-"}</td>
                    <td className="p-3">{money(item.GROSS_AMOUNT)}</td>
                    <td className="p-3">{paidBadge(item.DTL_PAID_STATUS)}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${statusBadgeClass(item.DTL_STATUS)} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {statusLabel(item.DTL_STATUS)}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={13} className="p-8 text-center text-muted-foreground">No employee benefits found</td></tr>
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
            <DialogTitle>{editing ? `Edit Employee Benefit (${editing.EMP_BENEFIT_REF_NO})` : "Add Employee Benefit"}</DialogTitle>
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
              Benefit Details
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Header Information</h3>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Employee <span className="text-destructive ml-0.5">*</span></Label>
                <EmployeeCombobox
                  value={form.EMP_ID}
                  onChange={handleEmpSelect}
                  options={employees || []}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("BENEFIT_DATE", "Benefit Date", "date", undefined, true)}
                {renderField("CURRENCY_ID", "Currency", "select", currencyOptions, false, "Select currency")}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("MONTH_ENTERED", "Month Entered", "text", undefined, false)}
                {renderField("YEAR_ENTERED", "Year Entered", "number", undefined, false)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("TOTAL_GROSS_AMOUNT", "Total Gross Amount", "number", undefined, true)}
                {renderField("PAID_STATUS", "Paid Status", "select", paidOptions, false)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("STATUS_MASTER", "Status", "select", statusOptions, false)}
              </div>
              {renderField("REASON", "Reason", "textarea", undefined, false, "Reason...")}
              {renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}
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
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Benefit Detail Information</h3>
                <Button variant="outline" size="sm" onClick={addDtl} className="h-8 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
                </Button>
              </div>
              {dtls.length === 0 ? (
                <p className="p-4 text-center text-muted-foreground text-xs border rounded-lg">No benefits added</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[50vh] overflow-y-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                          <th className="p-2 font-semibold w-[24%]">Benefit Type *</th>
                          <th className="p-2 font-semibold w-[15%]">Gross Amount</th>
                          <th className="p-2 font-semibold">Paid Status</th>
                          <th className="p-2 font-semibold">Status</th>
                          <th className="p-2 font-semibold">Reason</th>
                          <th className="p-2 font-semibold">Remarks</th>
                          <th className="p-2 w-9" />
                        </tr>
                      </thead>
                      <tbody>
                        {dtls.map((row) => (
                          <tr key={row.key} className="border-t hover:bg-muted/30 transition-colors">
                            <td className="p-1 pl-2">
                              <Select value={row.BENEFIT_TYPE_ID ? String(row.BENEFIT_TYPE_ID) : ""} onValueChange={(v) => updateDtl(row.key, "BENEFIT_TYPE_ID", Number(v))}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select benefit type" /></SelectTrigger>
                                <SelectContent>
                                  {benefitTypeOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-1">
                              <Input type="number" min="0" step="any" value={row.GROSS_AMOUNT} onChange={(e) => updateDtl(row.key, "GROSS_AMOUNT", clampNonNegative(e.target.value))} className="h-8 text-xs w-28" />
                            </td>
                            <td className="p-1">
                              <Select value={row.PAID_STATUS || "UNPAID"} onValueChange={(v) => updateDtl(row.key, "PAID_STATUS", v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {paidOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                              <Input value={row.REASON} onChange={(e) => updateDtl(row.key, "REASON", e.target.value)} placeholder="Reason" className="h-8 text-xs" />
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
              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button variant="outline" onClick={handleBack} className="text-xs" disabled={saving}>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                </Button>
                <Button onClick={handleSave} disabled={saving} className={editing ? "bg-info text-info-foreground hover:bg-info/90 text-xs" : "bg-primary text-primary-foreground hover:bg-primary/90 text-xs"}>
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
            <AlertDialogDescription>This will permanently delete this employee benefit detail record.</AlertDialogDescription>
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