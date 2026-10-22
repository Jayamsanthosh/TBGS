"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchApprovalTemplateHdr,
  fetchApprovalTemplateHdrById,
  fetchApprovalTemplateRequesterDtls,
  fetchApprovalTemplateStageDtls,
  addApprovalTemplateHdr,
  updateApprovalTemplateHdr,
  deleteApprovalTemplateHdr,
  clearApprovalTemplateError,
  ApprovalTemplateHdrGridData,
} from "@/lib/approvalTemplateSlice";
import { API_URL } from "@/lib/config";
import { useToast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";
import { SearchableSelect } from "@/components/SearchableSelect";
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
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const amountValidationOptions = [
  { value: "NO", label: "No" },
  { value: "YES", label: "Yes" },
];

const statusLabel = (s: any) => {
  const v = String(s || "").toUpperCase();
  return v === "ACTIVE" || v === "AC" ? "Active" : "Inactive";
};

const isActive = (s: any) => {
  const v = String(s || "").toUpperCase();
  return v === "ACTIVE" || v === "AC";
};

const statusBadgeClass = (s: any) =>
  isActive(s)
    ? "bg-green-500/10 text-green-600 border-green-200"
    : "bg-red-500/10 text-red-600 border-red-200";

const newKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* SQL `date` columns arrive as UTC-midnight ISO strings (tedious returns the
   date at 00:00Z), so slicing the UTC date part is timezone-safe. GET instead
   returns the SP-formatted "15-Oct-2026" (style 106 with '-' separators). */
const toIsoDate = (v: any): string => {
  if (!v) return "";
  if (typeof v === "string") {
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v.trim());
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const styled = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(v.trim());
    if (styled) {
      const mi = MONTHS.findIndex((m) => m.toLowerCase() === styled[2].toLowerCase());
      if (mi >= 0) {
        return `${styled[3]}-${String(mi + 1).padStart(2, "0")}-${styled[1].padStart(2, "0")}`;
      }
    }
  }
  const d = v instanceof Date ? v : new Date(v);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return "";
};

const formatDate = (v: any) => {
  const iso = toIsoDate(v);
  if (!iso) return "";
  const [, m, day] = iso.split("-");
  return `${day}-${MONTHS[Number(m) - 1]}-${iso.slice(0, 4)}`;
};

export default function ApprovalTemplatePage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.approvalTemplate);
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  /* Company / Camp / Store belong to the logged-in user, so a new template takes
     them from the session instead of asking. The fallbacks mirror the rest of the
     app (employee block first, then the login's context/company). */
  const activeCompanyId = user?.context?.companyId ?? user?.companies?.[0]?.companyId ?? null;
  const sessionEmployee = user?.employee ?? null;
  const sessionDefaults = useMemo(
    () => ({
      companyId: sessionEmployee?.companyId ?? activeCompanyId ?? null,
      campId: sessionEmployee?.campId ?? user?.context?.campId ?? null,
      storeId: sessionEmployee?.storeId ?? user?.context?.storeId ?? null,
    }),
    [
      sessionEmployee?.companyId,
      sessionEmployee?.campId,
      sessionEmployee?.storeId,
      user?.context,
      activeCompanyId,
      user?.companies,
    ]
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApprovalTemplateHdrGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [requesters, setRequesters] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [deletedRequesterIds, setDeletedRequesterIds] = useState<number[]>([]);
  const [deletedStageIds, setDeletedStageIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [links, setLinks] = useState<{ LINK_ID: number; LINK_NAME: string }[]>([]);
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
  const [camps, setCamps] = useState<{ id: number; name: string }[]>([]);
  const [stores, setStores] = useState<{ id: number; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [approvalStages, setApprovalStages] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    dispatch(fetchApprovalTemplateHdr());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearApprovalTemplateError());
    }
  }, [error, dispatch, toast]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [linksRes, companyRes, campRes, storeRes, usersRes, stageRes] = await Promise.all([
          fetch(`${API_URL}/links-and-pages`),
          fetch(`${API_URL}/company-master`),
          fetch(`${API_URL}/camp-master`),
          fetch(`${API_URL}/store-master`),
          fetch(`${API_URL}/users`),
          fetch(`${API_URL}/approval-stage`),
        ]);
        const json = async (r: Response) => (r.ok ? await r.json() : { data: [] });
        const [linksJson, companyJson, campJson, storeJson, usersJson, stageJson] = await Promise.all([
          json(linksRes), json(companyRes), json(campRes), json(storeRes), json(usersRes), json(stageRes),
        ]);
        if (!alive) return;

        const rows = (j: any) => (Array.isArray(j?.data) ? j.data : []);

        setLinks(
          rows(linksJson)
            .filter((r: any) => r?.LINK_ID != null && r?.LINK_NAME)
            .map((r: any) => ({ LINK_ID: Number(r.LINK_ID), LINK_NAME: String(r.LINK_NAME) }))
            .sort((a: any, b: any) => a.LINK_NAME.localeCompare(b.LINK_NAME))
        );
        setCompanies(
          rows(companyJson)
            .filter((r: any) => r?.COMPANY_ID != null && r?.COMPANY_NAME)
            .map((r: any) => ({ id: Number(r.COMPANY_ID), name: String(r.COMPANY_NAME) }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
        );
        setCamps(
          rows(campJson)
            .filter((r: any) => r?.CAMP_ID != null && r?.CAMP_NAME)
            .map((r: any) => ({ id: Number(r.CAMP_ID), name: String(r.CAMP_NAME) }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
        );
        setStores(
          rows(storeJson)
            .filter((r: any) => r?.Store_Id != null && r?.Store_Name)
            .map((r: any) => ({ id: Number(r.Store_Id), name: String(r.Store_Name) }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
        );
        setUsers(
          rows(usersJson)
            .filter((r: any) => r?.LOGIN_ID != null && r?.LOGIN_NAME)
            .map((r: any) => ({ id: Number(r.LOGIN_ID), name: String(r.LOGIN_NAME) }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
        );
        setApprovalStages(
          rows(stageJson)
            .filter((r: any) => r?.APPROVAL_STAGE_ID != null && r?.APPROVAL_STAGE_NAME)
            .map((r: any) => ({ id: Number(r.APPROVAL_STAGE_ID), name: String(r.APPROVAL_STAGE_NAME) }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
        );
      } catch {
        /* dropdown data is non-critical; form stays usable without it */
      }
    })();
    return () => { alive = false; };
  }, []);

  const linkOptions = useMemo(() => links.map((l) => ({ value: String(l.LINK_ID), label: l.LINK_NAME })), [links]);
  const companyOptions = useMemo(() => companies.map((c) => ({ value: String(c.id), label: c.name })), [companies]);
  const campOptions = useMemo(() => camps.map((c) => ({ value: String(c.id), label: c.name })), [camps]);
  const storeOptions = useMemo(() => stores.map((s) => ({ value: String(s.id), label: s.name })), [stores]);
  const userOptions = useMemo(() => users.map((u) => ({ value: String(u.id), label: u.name })), [users]);
  const approvalStageOptions = useMemo(() => approvalStages.map((s) => ({ value: String(s.id), label: s.name })), [approvalStages]);

  const linkName = (id: any) => links.find((l) => l.LINK_ID === Number(id))?.LINK_NAME || "";
  const companyName = (id: any) => companies.find((c) => c.id === Number(id))?.name || "";
  const campName = (id: any) => camps.find((c) => c.id === Number(id))?.name || "";
  const storeName = (id: any) => stores.find((s) => s.id === Number(id))?.name || "";

  const uniqueStatuses = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const set = new Set<string>();
    items.forEach((d: any) => { if (d.STATUS_MASTER) set.add(String(d.STATUS_MASTER)); });
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const q = search.trim().toLowerCase();
    return items
      .filter((d: any) => {
        const matchStatus = statusFilter === "ALL" || isActive(d.STATUS_MASTER) === isActive(statusFilter);
        if (!matchStatus) return false;
        const searchable = [
          d.APPROVAL_TEMPLATE_NAME,
          d.REMARKS,
          linkName(d.PAGE_LINK_ID ?? d.LINK_PAGES_ID),
          companyName(d.COMPANY_ID),
          campName(d.CAMP_ID),
          storeName(d.STORE_ID),
        ]
          .filter(Boolean).join(" ").toLowerCase();
        return searchable.includes(q);
      })
      .sort((a: any, b: any) => Number(a.APPROVAL_TEMPLATE_ID) - Number(b.APPROVAL_TEMPLATE_ID));
  }, [items, search, statusFilter, links, companies, camps, stores]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;
  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);
  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  const updateForm = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const emptyForm = () => ({
    APPROVAL_TEMPLATE_NAME: "",
    PAGE_LINK_ID: "",
    COMPANY_ID: sessionDefaults.companyId != null ? String(sessionDefaults.companyId) : "",
    CAMP_ID: sessionDefaults.campId != null ? String(sessionDefaults.campId) : "",
    STORE_ID: sessionDefaults.storeId != null ? String(sessionDefaults.storeId) : "",
    AMOUNT_VALIDATION_STATUS: "NO",
    MIN_AMOUNT: "",
    MAX_AMOUNT: "",
    EFFECTIVE_FROM: "",
    EFFECTIVE_TO: "",
    REMARKS: "",
    STATUS_MASTER: "ACTIVE",
  });

  const emptyRequester = () => ({ key: newKey(), APPROVAL_TEMPLATE_REQ_DTL_ID: undefined as number | undefined, USER_ID: undefined as number | undefined, REMARKS: "" });
  const emptyStage = () => ({ key: newKey(), APPROVAL_TEMPLATE_STAGE_DTL_ID: undefined as number | undefined, APPROVAL_STAGE_ID: undefined as number | undefined, STAGE_ORDER: "", REMARKS: "" });

  const addRequester = () => setRequesters((prev) => [...prev, emptyRequester()]);
  const updateRequester = (key: string, field: string, value: any) =>
    setRequesters((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  const removeRequester = (key: string) => {
    const row = requesters.find((r) => r.key === key);
    if (row?.APPROVAL_TEMPLATE_REQ_DTL_ID) setDeletedRequesterIds((d) => [...d, Number(row.APPROVAL_TEMPLATE_REQ_DTL_ID)]);
    setRequesters((prev) => prev.filter((r) => r.key !== key));
  };

  const addStage = () => setStages((prev) => [...prev, emptyStage()]);
  const updateStage = (key: string, field: string, value: any) =>
    setStages((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  const removeStage = (key: string) => {
    const row = stages.find((r) => r.key === key);
    if (row?.APPROVAL_TEMPLATE_STAGE_DTL_ID) setDeletedStageIds((d) => [...d, Number(row.APPROVAL_TEMPLATE_STAGE_DTL_ID)]);
    setStages((prev) => prev.filter((r) => r.key !== key));
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setRequesters([]);
    setStages([]);
    setDeletedRequesterIds([]);
    setDeletedStageIds([]);
    setDialogOpen(true);
  };

  const openEdit = async (item: any) => {
    setEditing(item);
    try {
      const hdr = await dispatch(fetchApprovalTemplateHdrById(item.APPROVAL_TEMPLATE_ID)).unwrap();
      const pageLink = hdr.PAGE_LINK_ID ?? hdr.LINK_PAGES_ID;
      setForm({
        APPROVAL_TEMPLATE_NAME: hdr.APPROVAL_TEMPLATE_NAME || "",
        PAGE_LINK_ID: pageLink != null ? String(pageLink) : "",
        COMPANY_ID: hdr.COMPANY_ID != null ? String(hdr.COMPANY_ID) : (sessionDefaults.companyId != null ? String(sessionDefaults.companyId) : ""),
        CAMP_ID: hdr.CAMP_ID != null ? String(hdr.CAMP_ID) : (sessionDefaults.campId != null ? String(sessionDefaults.campId) : ""),
        STORE_ID: hdr.STORE_ID != null ? String(hdr.STORE_ID) : (sessionDefaults.storeId != null ? String(sessionDefaults.storeId) : ""),
        AMOUNT_VALIDATION_STATUS: (hdr.AMOUNT_VALIDATION_STATUS || "NO").toUpperCase(),
        MIN_AMOUNT: hdr.MIN_AMOUNT != null ? String(hdr.MIN_AMOUNT) : "",
        MAX_AMOUNT: hdr.MAX_AMOUNT != null ? String(hdr.MAX_AMOUNT) : "",
        EFFECTIVE_FROM: toIsoDate(hdr.EFFECTIVE_FROM),
        EFFECTIVE_TO: toIsoDate(hdr.EFFECTIVE_TO),
        REMARKS: hdr.REMARKS || "",
        STATUS_MASTER: hdr.STATUS_MASTER || "ACTIVE",
      });

      const [requesterRows, stageRows] = await Promise.all([
        dispatch(fetchApprovalTemplateRequesterDtls(item.APPROVAL_TEMPLATE_ID)).unwrap(),
        dispatch(fetchApprovalTemplateStageDtls(item.APPROVAL_TEMPLATE_ID)).unwrap(),
      ]);
      setRequesters(
        (Array.isArray(requesterRows) ? requesterRows : []).map((d: any) => ({
          key: newKey(),
          APPROVAL_TEMPLATE_REQ_DTL_ID: d.APPROVAL_TEMPLATE_REQ_DTL_ID != null ? Number(d.APPROVAL_TEMPLATE_REQ_DTL_ID) : undefined,
          USER_ID: d.USER_ID != null ? Number(d.USER_ID) : undefined,
          REMARKS: d.REMARKS || "",
        }))
      );
      setStages(
        (Array.isArray(stageRows) ? stageRows : []).map((d: any) => ({
          key: newKey(),
          APPROVAL_TEMPLATE_STAGE_DTL_ID: d.APPROVAL_TEMPLATE_STAGE_DTL_ID != null ? Number(d.APPROVAL_TEMPLATE_STAGE_DTL_ID) : undefined,
          APPROVAL_STAGE_ID: d.APPROVAL_STAGE_ID != null ? Number(d.APPROVAL_STAGE_ID) : undefined,
          STAGE_ORDER: d.STAGE_ORDER != null ? String(d.STAGE_ORDER) : "",
          REMARKS: d.REMARKS || "",
        }))
      );
      setDeletedRequesterIds([]);
      setDeletedStageIds([]);
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : e?.message || "Failed to load record", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.APPROVAL_TEMPLATE_NAME?.trim()) {
      toast({ title: "Approval Template Name is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.PAGE_LINK_ID) {
      toast({ title: "Link Page is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    const minAmount = form.MIN_AMOUNT === "" || form.MIN_AMOUNT == null ? null : Number(form.MIN_AMOUNT);
    const maxAmount = form.MAX_AMOUNT === "" || form.MAX_AMOUNT == null ? null : Number(form.MAX_AMOUNT);
    if (form.MIN_AMOUNT !== "" && (minAmount === null || isNaN(minAmount))) {
      toast({ title: "Min Amount must be a valid number", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (form.MAX_AMOUNT !== "" && (maxAmount === null || isNaN(maxAmount))) {
      toast({ title: "Max Amount must be a valid number", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (minAmount !== null && maxAmount !== null && minAmount > maxAmount) {
      toast({ title: "Min Amount cannot be greater than Max Amount", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    const amountValid = String(form.AMOUNT_VALIDATION_STATUS || "").toUpperCase() === "YES";
    if (amountValid && minAmount === null) {
      toast({ title: "Min Amount is required when amount validation is YES", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (form.EFFECTIVE_FROM && form.EFFECTIVE_TO && form.EFFECTIVE_FROM > form.EFFECTIVE_TO) {
      toast({ title: "Effective From cannot be greater than Effective To", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    const validRequesters = requesters.filter((r) => r.USER_ID);
    const userIds = validRequesters.map((r) => String(r.USER_ID));
    if (new Set(userIds).size !== userIds.length) {
      toast({ title: "A user can only be assigned once per template", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    const validStages = stages.filter((r) => r.APPROVAL_STAGE_ID);
    for (const r of validStages) {
      if (r.STAGE_ORDER === "" || r.STAGE_ORDER == null || isNaN(Number(r.STAGE_ORDER))) {
        toast({ title: "Each approval stage requires a Stage Order", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
        return;
      }
    }
    const stageIds = validStages.map((r) => String(r.APPROVAL_STAGE_ID));
    if (new Set(stageIds).size !== stageIds.length) {
      toast({ title: "An approval stage can only be assigned once per template", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    const stageOrders = validStages.map((r) => String(r.STAGE_ORDER));
    if (new Set(stageOrders).size !== stageOrders.length) {
      toast({ title: "Each approval stage must have a unique Stage Order", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        APPROVAL_TEMPLATE_ID: editing ? Number(editing.APPROVAL_TEMPLATE_ID) : undefined,
        APPROVAL_TEMPLATE_NAME: form.APPROVAL_TEMPLATE_NAME.trim(),
        PAGE_LINK_ID: Number(form.PAGE_LINK_ID),
        LINK_PAGES_ID: Number(form.PAGE_LINK_ID),
        COMPANY_ID: form.COMPANY_ID ? Number(form.COMPANY_ID) : null,
        CAMP_ID: form.CAMP_ID ? Number(form.CAMP_ID) : null,
        STORE_ID: form.STORE_ID ? Number(form.STORE_ID) : null,
        AMOUNT_VALIDATION_STATUS: String(form.AMOUNT_VALIDATION_STATUS || "NO").toUpperCase(),
        MIN_AMOUNT: minAmount,
        MAX_AMOUNT: maxAmount,
        EFFECTIVE_FROM: form.EFFECTIVE_FROM || null,
        EFFECTIVE_TO: form.EFFECTIVE_TO || null,
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_MASTER: form.STATUS_MASTER || "ACTIVE",
        requesterDtls: validRequesters.map((r: any) => ({
          APPROVAL_TEMPLATE_REQ_DTL_ID: r.APPROVAL_TEMPLATE_REQ_DTL_ID || undefined,
          USER_ID: Number(r.USER_ID),
          REMARKS: r.REMARKS?.trim() || "",
        })),
        stageDtls: validStages.map((r: any) => ({
          APPROVAL_TEMPLATE_STAGE_DTL_ID: r.APPROVAL_TEMPLATE_STAGE_DTL_ID || undefined,
          APPROVAL_STAGE_ID: Number(r.APPROVAL_STAGE_ID),
          STAGE_ORDER: Number(r.STAGE_ORDER),
          REMARKS: r.REMARKS?.trim() || "",
        })),
        deletedRequesterIds,
        deletedStageIds,
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (editing) {
        const res = await dispatch(updateApprovalTemplateHdr(payload as ApprovalTemplateHdrGridData)).unwrap();
        toast({ title: res?.message ?? "Approval template updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addApprovalTemplateHdr(payload as ApprovalTemplateHdrGridData)).unwrap();
        toast({ title: res?.message ?? "Approval template created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchApprovalTemplateHdr());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : e?.message || "Error saving approval template", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteApprovalTemplateHdr(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Approval template deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchApprovalTemplateHdr());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : e?.message || "Error deleting approval template", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (
    key: string,
    label: string,
    type: "text" | "number" | "select" | "textarea" | "date",
    options?: { value: string; label: string }[],
    required?: boolean,
    placeholder?: string,
    disabled?: boolean
  ) => {
    const fieldEmpty = required && !form[key];
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : "flex flex-col gap-1.5"}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {type === "select" ? (
          <Select value={form[key] || ""} onValueChange={(v) => updateForm(key, v)} disabled={disabled}>
            <SelectTrigger className={`h-9 text-xs ${fieldEmpty ? "border-destructive ring-1 ring-destructive/30" : ""}`}><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className="text-xs" disabled={disabled} />
        ) : (
          <Input type={type === "number" ? "number" : type === "date" ? "date" : "text"} value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={`h-9 text-xs ${fieldEmpty ? "border-destructive ring-1 ring-destructive/30" : ""}`} disabled={disabled} />
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Approval Template Master</h1>
          <p className="text-sm text-muted-foreground">Manage approval templates, requesters and approval stages</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Template
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search templates..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
            {uniqueStatuses.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Status:</span>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-35 h-9 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {uniqueStatuses.map((s) => (<SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>))}
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
                {availablePageSizes.map((s) => (<SelectItem key={String(s)} value={String(s)}>{String(s)}</SelectItem>))}
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
                  {[...Array(9)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Template Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Link Page</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Camp</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Store</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Amount Validation</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Min Amount</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Max Amount</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Effective From</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Effective To</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                      <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>
                    </td>
                    <td className="p-3 font-medium">{item.APPROVAL_TEMPLATE_ID || "-"}</td>
                    <td className="p-3 font-medium">{item.APPROVAL_TEMPLATE_NAME || "-"}</td>
                    <td className="p-3">{linkName(item.PAGE_LINK_ID ?? item.LINK_PAGES_ID) || "-"}</td>
                    <td className="p-3">{companyName(item.COMPANY_ID) || "-"}</td>
                    <td className="p-3">{campName(item.CAMP_ID) || "-"}</td>
                    <td className="p-3">{storeName(item.STORE_ID) || "-"}</td>
                    <td className="p-3">
                      {String(item.AMOUNT_VALIDATION_STATUS || "NO").toUpperCase() === "YES" ? (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 px-2 py-0.5 text-[10px] uppercase font-bold">Yes</Badge>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </td>
                    <td className="p-3">{item.MIN_AMOUNT ?? "-"}</td>
                    <td className="p-3">{item.MAX_AMOUNT ?? "-"}</td>
                    <td className="p-3">{formatDate(item.EFFECTIVE_FROM) || "-"}</td>
                    <td className="p-3">{formatDate(item.EFFECTIVE_TO) || "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${statusBadgeClass(item.STATUS_MASTER)} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {statusLabel(item.STATUS_MASTER)}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={13} className="p-8 text-center text-muted-foreground">No approval templates found</td></tr>
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
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="h-8 text-xs">Previous</Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="h-8 w-8 text-xs p-0">{page}</Button>;
              })}
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="h-8 text-xs">Next</Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Approval Template" : "Add Approval Template"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Template Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {renderField("APPROVAL_TEMPLATE_NAME", "Template Name", "text", undefined, true, "e.g., Purchase Order Approval")}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Link Page<span className="text-destructive ml-0.5">*</span></Label>
                <SearchableSelect
                  value={form.PAGE_LINK_ID || ""}
                  onChange={(v) => updateForm("PAGE_LINK_ID", v)}
                  options={linkOptions}
                  placeholder="Select page"
                  className={!form.PAGE_LINK_ID ? "border-destructive ring-1 ring-destructive/30" : ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderField("COMPANY_ID", "Company", "select", companyOptions, false, "Select company", sessionDefaults.companyId != null)}
              {renderField("CAMP_ID", "Camp", "select", campOptions, false, "Select camp", sessionDefaults.campId != null)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderField("STORE_ID", "Store", "select", storeOptions, false, "Select store", sessionDefaults.storeId != null)}
              {renderField("AMOUNT_VALIDATION_STATUS", "Amount Validation", "select", amountValidationOptions, false)}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {renderField("MIN_AMOUNT", "Min Amount", "number", undefined, false, "0.00")}
              {renderField("MAX_AMOUNT", "Max Amount", "number", undefined, false, "0.00")}
              {renderField("STATUS_MASTER", "Status", "select", statusOptions, false)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderField("EFFECTIVE_FROM", "Effective From", "date")}
              {renderField("EFFECTIVE_TO", "Effective To", "date")}
            </div>
            {renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}

            <div className="flex items-center justify-between pt-2">
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 flex-1">Requesters</h3>
              <Button variant="outline" size="sm" onClick={addRequester} className="h-8 text-xs ml-2">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Requester
              </Button>
            </div>
            {requesters.length === 0 ? (
              <p className="p-4 text-center text-muted-foreground text-xs border rounded-lg">No requesters added</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[30vh] overflow-y-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="p-2 font-semibold w-[40%]">User *</th>
                        <th className="p-2 font-semibold">Remarks</th>
                        <th className="p-2 w-9" />
                      </tr>
                    </thead>
                    <tbody>
                      {requesters.map((row) => (
                        <tr key={row.key} className="border-t hover:bg-muted/30 transition-colors">
                          <td className="p-1 pl-2">
                            <Select value={row.USER_ID ? String(row.USER_ID) : ""} onValueChange={(v) => updateRequester(row.key, "USER_ID", Number(v))}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select user" /></SelectTrigger>
                              <SelectContent>
                                {userOptions.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-1">
                            <Input value={row.REMARKS} onChange={(e) => updateRequester(row.key, "REMARKS", e.target.value)} placeholder="Remarks" className="h-8 text-xs" />
                          </td>
                          <td className="p-1 pr-2 text-center">
                            <button type="button" onClick={() => removeRequester(row.key)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors" title="Remove row">
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

            <div className="flex items-center justify-between pt-2">
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 flex-1">Approval Stages</h3>
              <Button variant="outline" size="sm" onClick={addStage} className="h-8 text-xs ml-2">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Stage
              </Button>
            </div>
            {stages.length === 0 ? (
              <p className="p-4 text-center text-muted-foreground text-xs border rounded-lg">No approval stages added</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[30vh] overflow-y-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="p-2 font-semibold w-[40%]">Approval Stage *</th>
                        <th className="p-2 font-semibold w-24">Stage Order *</th>
                        <th className="p-2 font-semibold">Remarks</th>
                        <th className="p-2 w-9" />
                      </tr>
                    </thead>
                    <tbody>
                      {stages.map((row) => (
                        <tr key={row.key} className="border-t hover:bg-muted/30 transition-colors">
                          <td className="p-1 pl-2">
                            <Select value={row.APPROVAL_STAGE_ID ? String(row.APPROVAL_STAGE_ID) : ""} onValueChange={(v) => updateStage(row.key, "APPROVAL_STAGE_ID", Number(v))}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select stage" /></SelectTrigger>
                              <SelectContent>
                                {approvalStageOptions.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-1">
                            <Input type="number" value={row.STAGE_ORDER} onChange={(e) => updateStage(row.key, "STAGE_ORDER", e.target.value)} placeholder="1" className="h-8 text-xs" />
                          </td>
                          <td className="p-1">
                            <Input value={row.REMARKS} onChange={(e) => updateStage(row.key, "REMARKS", e.target.value)} placeholder="Remarks" className="h-8 text-xs" />
                          </td>
                          <td className="p-1 pr-2 text-center">
                            <button type="button" onClick={() => removeStage(row.key)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors" title="Remove row">
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
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-xs" disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className={`${editing ? "bg-info text-info-foreground hover:bg-info/90" : "bg-primary text-primary-foreground hover:bg-primary/90"} text-xs`}>
                {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this approval template along with its assigned requesters and approval stages.</AlertDialogDescription>
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
