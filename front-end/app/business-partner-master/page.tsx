"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchBusinessPartners, addBusinessPartner, updateBusinessPartner, deleteBusinessPartner, clearBusinessPartnerError, type BusinessPartnerGridData } from "@/lib/businessPartnerMasterSlice";
import { API_URL } from "@/lib/config";
import { useToast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { validateEmail, validateTanzaniaPhone, validateTin, formatTanzaniaPhone, cleanPhoneForStorage } from "@/lib/validation";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

export default function BusinessPartnerMasterPage() {
  const dispatch = useAppDispatch();
  const { businessPartners, loading, error } = useAppSelector((s) => s.businessPartner);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [countries, setCountries] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<any[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const regionCacheRef = useRef<Record<string, any[]>>({});
  const districtCacheRef = useRef<Record<string, any[]>>({});

  const countryOptions = useMemo(() =>
    (Array.isArray(countries) ? countries : []).map((c: any) => ({
      value: String(c.Country_Id ?? c.COUNTRY_ID),
      label: c.Country_Name || c.COUNTRY_NAME || `Country #${c.Country_Id ?? c.COUNTRY_ID}`,
    })), [countries]);

  const regionOptions = useMemo(() =>
    (Array.isArray(regions) ? regions : []).map((r: any) => ({
      value: String(r.REGION_ID),
      label: r.REGION_NAME || `Region #${r.REGION_ID}`,
    })), [regions]);

  const districtOptions = useMemo(() =>
    (Array.isArray(districts) ? districts : []).map((d: any) => ({
      value: String(d.District_id ?? d.DISTRICT_ID),
      label: d.District_Name || d.DISTRICT_NAME || `District #${d.District_id ?? d.DISTRICT_ID}`,
    })), [districts]);

  const paymentTermOptions = useMemo(() => {
    const seen = new Set<string>();
    const result: { value: string; label: string }[] = [];
    (Array.isArray(paymentTerms) ? paymentTerms : []).forEach((t: any) => {
      const name = String(t.PAYMENT_TERM_NAME || "").trim();
      if (name && !seen.has(name)) {
        seen.add(name);
        result.push({ value: name, label: name });
      }
    });
    return result.sort((a, b) => a.label.localeCompare(b.label));
  }, [paymentTerms]);

  const loadRegionsForCountry = useCallback(async (countryId: string) => {
    const key = String(countryId);
    if (!key) return;
    if (regionCacheRef.current[key]) {
      setRegions(regionCacheRef.current[key]);
      return;
    }
    setLoadingRegions(true);
    try {
      const res = await fetch(`${API_URL}/region-master`).then(r => r.json());
      const all = res.data || [];
      const filtered = all.filter((r: any) => Number(r.COUNTRY_ID) === Number(key));
      regionCacheRef.current[key] = filtered;
      setRegions(filtered);
    } finally {
      setLoadingRegions(false);
    }
  }, []);

  const loadDistrictsForRegion = useCallback(async (regionId: string) => {
    const key = String(regionId);
    if (!key) return;
    if (districtCacheRef.current[key]) {
      setDistricts(districtCacheRef.current[key]);
      return;
    }
    setLoadingDistricts(true);
    try {
      const res = await fetch(`${API_URL}/district-master`).then(r => r.json());
      const all = res.data || [];
      const filtered = all.filter((d: any) => Number(d.Region_Id ?? d.REGION_ID) === Number(key));
      districtCacheRef.current[key] = filtered;
      setDistricts(filtered);
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

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

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/country-master`).then(r => r.json()),
      fetch(`${API_URL}/currency-master`).then(r => r.json()),
      fetch(`${API_URL}/payment-term-master`).then(r => r.json()),
    ])
    .then(([cData, curData, ptData]) => {
      setCountries(cData.data || []);
      setCurrencies(curData.data || []);
      setPaymentTerms(ptData.data || []);
    })
    .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!Array.isArray(businessPartners)) return [];
    return businessPartners.filter((d: any) => {
      const searchable = [d.BP_NAME, d.BP_SHORT_CODE, d.BP_TYPE, d.CONTACT_PERSON, d.TIN_NUMBER, d.COUNTRY_NAME, d.REMARKS].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => (b.BP_ID ?? b.id ?? 0) - (a.BP_ID ?? a.id ?? 0));
  }, [businessPartners, search]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  useEffect(() => {
    dispatch(fetchBusinessPartners(statusFilter));
  }, [dispatch, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearBusinessPartnerError());
    }
  }, [error, dispatch, toast]);

  const emptyForm = () => ({
    BP_ID: 0,
    BP_TYPE: "",
    BP_NAME: "",
    BP_SHORT_CODE: "",
    TIN_NUMBER: "",
    VAT_NUMBER: "",
    CONTACT_PERSON: "",
    CONTACT_NUMBER: "",
    ADDRESS: "",
    EMAIL_ADDRESS: "",
    PHONE_NUMBER_2: "",
    COUNTRY_ID: "",
    REGION_ID: "",
    DISTRICT_ID: "",
    LOCATION: "",
    NATURE_OF_BUSINESS: "",
    CREDIT_ALLOWED: "",
    COMPANY_HEAD_CONTACT_PERSON: "",
    COMPANY_HEAD_PHONE_NO: "",
    COMPANY_HEAD_EMAIL: "",
    ACCOUNTS_CONTACT_PERSON: "",
    ACCOUNTS_PHONE_NO: "",
    ACCOUNTS_EMAIL: "",
    CURRENCY_ID: "",
    PAYMENT_TERMS: "",
    REMARKS: "",
    STATUS_MASTER: "AC",
    USER: "Admin",
    MAC_ADDRESS: "WEB",
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      BP_ID: item.BP_ID || 0,
      BP_TYPE: String(item.BP_TYPE || "").toUpperCase(),
      BP_NAME: item.BP_NAME || "",
      BP_SHORT_CODE: item.BP_SHORT_CODE || "",
      TIN_NUMBER: item.TIN_NUMBER || "",
      VAT_NUMBER: item.VAT_NUMBER || "",
      CONTACT_PERSON: item.CONTACT_PERSON || "",
      CONTACT_NUMBER: formatTanzaniaPhone(item.CONTACT_NUMBER),
      ADDRESS: item.ADDRESS || "",
      EMAIL_ADDRESS: item.EMAIL_ADDRESS || "",
      PHONE_NUMBER_2: formatTanzaniaPhone(item.PHONE_NUMBER_2),
      COUNTRY_ID: item.COUNTRY_ID != null ? String(item.COUNTRY_ID) : "",
      REGION_ID: item.REGION_ID != null ? String(item.REGION_ID) : "",
      DISTRICT_ID: item.DISTRICT_ID != null ? String(item.DISTRICT_ID) : "",
      LOCATION: item.LOCATION || "",
      NATURE_OF_BUSINESS: item.NATURE_OF_BUSINESS || "",
      CREDIT_ALLOWED: item.CREDIT_ALLOWED || "",
      COMPANY_HEAD_CONTACT_PERSON: item.COMPANY_HEAD_CONTACT_PERSON || "",
      COMPANY_HEAD_PHONE_NO: formatTanzaniaPhone(item.COMPANY_HEAD_PHONE_NO),
      COMPANY_HEAD_EMAIL: item.COMPANY_HEAD_EMAIL || "",
      ACCOUNTS_CONTACT_PERSON: item.ACCOUNTS_CONTACT_PERSON || "",
      ACCOUNTS_PHONE_NO: formatTanzaniaPhone(item.ACCOUNTS_PHONE_NO),
      ACCOUNTS_EMAIL: item.ACCOUNTS_EMAIL || "",
      CURRENCY_ID: item.CURRENCY_ID != null ? String(item.CURRENCY_ID) : "",
      PAYMENT_TERMS: item.PAYMENT_TERMS || "",
      REMARKS: item.REMARKS || "",
      STATUS_MASTER: item.STATUS_MASTER || "AC",
      USER: "Admin",
      MAC_ADDRESS: "WEB",
    });
    setFieldErrors({});
    setDialogOpen(true);
    const editCountryId = item.COUNTRY_ID != null ? String(item.COUNTRY_ID) : "";
    const editRegionId = item.REGION_ID != null ? String(item.REGION_ID) : "";
    if (editCountryId) loadRegionsForCountry(editCountryId);
    if (editRegionId) loadDistrictsForRegion(editRegionId);
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};

    if (!form.BP_NAME?.trim()) {
      nextErrors.BP_NAME = "BP Name is required";
    }
    if (form.TIN_NUMBER && !validateTin(String(form.TIN_NUMBER))) {
      nextErrors.TIN_NUMBER = "TIN Number must be exactly 9 digits";
    }
    const emailFields: Array<[string, string]> = [
      ["EMAIL_ADDRESS", "Email Address"],
      ["COMPANY_HEAD_EMAIL", "Company Head Email"],
      ["ACCOUNTS_EMAIL", "Accounts Email"],
    ];
    for (const [key, label] of emailFields) {
      if (form[key] && !validateEmail(String(form[key]))) {
        nextErrors[key] = `${label} is invalid`;
      }
    }
    const phoneFields: Array<[string, string]> = [
      ["CONTACT_NUMBER", "Contact Number"],
      ["PHONE_NUMBER_2", "Phone Number 2"],
      ["COMPANY_HEAD_PHONE_NO", "Company Head Phone"],
      ["ACCOUNTS_PHONE_NO", "Accounts Phone"],
    ];
    for (const [key, label] of phoneFields) {
      if (form[key] && !validateTanzaniaPhone(String(form[key]))) {
        nextErrors[key] = `${label} must be in Tanzania format (e.g., +255XXXXXXXXX)`;
      }
    }

    const firstErrorKey = Object.keys(nextErrors)[0];
    if (firstErrorKey) {
      setFieldErrors(nextErrors);
      toast({
        title: nextErrors[firstErrorKey],
        variant: "destructive",
        duration: DEFAULT_TOAST_DURATION,
      });
      return;
    }
    setFieldErrors({});

    try {
      const payload: Record<string, any> = {
        BP_NAME: form.BP_NAME.trim(),
        BP_TYPE: form.BP_TYPE?.trim() || null,
        BP_SHORT_CODE: form.BP_SHORT_CODE?.trim() || null,
        TIN_NUMBER: form.TIN_NUMBER?.trim() || null,
        VAT_NUMBER: form.VAT_NUMBER?.trim() || null,
        CONTACT_PERSON: form.CONTACT_PERSON?.trim() || null,
        CONTACT_NUMBER: cleanPhoneForStorage(form.CONTACT_NUMBER?.trim()) || null,
        ADDRESS: form.ADDRESS?.trim() || null,
        EMAIL_ADDRESS: form.EMAIL_ADDRESS?.trim() || null,
        PHONE_NUMBER_2: cleanPhoneForStorage(form.PHONE_NUMBER_2?.trim()) || null,
        COUNTRY_ID: form.COUNTRY_ID ? Number(form.COUNTRY_ID) : null,
        REGION_ID: form.REGION_ID ? Number(form.REGION_ID) : null,
        DISTRICT_ID: form.DISTRICT_ID ? Number(form.DISTRICT_ID) : null,
        LOCATION: form.LOCATION?.trim() || null,
        NATURE_OF_BUSINESS: form.NATURE_OF_BUSINESS?.trim() || null,
        CREDIT_ALLOWED: form.CREDIT_ALLOWED?.trim() || null,
        COMPANY_HEAD_CONTACT_PERSON: form.COMPANY_HEAD_CONTACT_PERSON?.trim() || null,
        COMPANY_HEAD_PHONE_NO: cleanPhoneForStorage(form.COMPANY_HEAD_PHONE_NO?.trim()) || null,
        COMPANY_HEAD_EMAIL: form.COMPANY_HEAD_EMAIL?.trim() || null,
        ACCOUNTS_CONTACT_PERSON: form.ACCOUNTS_CONTACT_PERSON?.trim() || null,
        ACCOUNTS_PHONE_NO: cleanPhoneForStorage(form.ACCOUNTS_PHONE_NO?.trim()) || null,
        ACCOUNTS_EMAIL: form.ACCOUNTS_EMAIL?.trim() || null,
        CURRENCY_ID: form.CURRENCY_ID ? Number(form.CURRENCY_ID) : null,
        PAYMENT_TERMS: form.PAYMENT_TERMS?.trim() || null,
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_MASTER: "AC",
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (editing) {
        payload.BP_ID = Number(editing.id);
        const res = await dispatch(updateBusinessPartner(payload as BusinessPartnerGridData)).unwrap();
        toast({ title: res?.message ?? "Business partner updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addBusinessPartner(payload as BusinessPartnerGridData)).unwrap();
        toast({ title: res?.message ?? "Business partner created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchBusinessPartners(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error saving business partner"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteBusinessPartner(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Business partner deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchBusinessPartners(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error deleting business partner"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (key: string, label: string, type: "text" | "number" | "select" | "textarea" | "date", options?: { value: string; label: string }[], required?: boolean, placeholder?: string, maxLength?: number, formatter?: (val: any) => any, onChange?: (val: string) => void, disabled?: boolean, searchable?: boolean) => {
    const baseClass = "flex flex-col gap-1.5";
    const errorText = fieldErrors[key];
    const hasError = !!errorText;
    const errorRing = "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive/40";
    const clearError = () => setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : baseClass}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {type === "select" && searchable ? (
          <div className="flex flex-col gap-1">
            <SearchableSelect
              value={form[key] || ""}
              onChange={(v) => { clearError(); if (onChange) onChange(v); else setForm({ ...form, [key]: v }); }}
              options={options || []}
              placeholder={placeholder || `Select ${label}`}
              disabled={disabled}
              className={`${hasError ? errorRing : ""} ${required && !form[key] ? "border-destructive ring-1 ring-destructive/30" : ""}`}
            />
            {hasError && <span className="text-[10px] text-destructive">{errorText}</span>}
          </div>
        ) : type === "select" ? (
          <div className="flex flex-col gap-1">
            <Select value={form[key] || ""} onValueChange={(v) => { clearError(); if (onChange) onChange(v); else setForm({ ...form, [key]: v }); }} disabled={disabled}>
              <SelectTrigger className={`h-9 text-xs ${hasError ? errorRing : ""} ${required && !form[key] ? "border-destructive ring-1 ring-destructive/30" : ""}`}><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
              <SelectContent>
                {(options || []).map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && <span className="text-[10px] text-destructive">{errorText}</span>}
          </div>
        ) : type === "textarea" ? (
          <div className="flex flex-col gap-1">
            <Textarea value={form[key] || ""} onChange={(e) => { clearError(); setForm({ ...form, [key]: e.target.value }); }} placeholder={placeholder} className={`text-xs ${hasError ? errorRing : ""}`} />
            {hasError && <span className="text-[10px] text-destructive">{errorText}</span>}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <Input
              type={type === "number" ? "number" : "text"}
              value={form[key] ?? ""}
              onChange={(e) => { clearError(); setForm({ ...form, [key]: formatter ? formatter(e.target.value) : (type === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value) }); }}
              placeholder={placeholder}
              className={`h-9 text-xs ${hasError ? errorRing : ""} ${required && !form[key] ? "border-destructive ring-1 ring-destructive/30" : ""}`}
              maxLength={maxLength}
            />
            {hasError && <span className="text-[10px] text-destructive">{errorText}</span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Business Partner Master</h1>
          <p className="text-sm text-muted-foreground">Manage business partner master data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Business Partner
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search business partners..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="AC">Active</SelectItem>
                <SelectItem value="IA">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
                  {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Short Code</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Type</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">TIN</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Contact Person</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Email</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Country</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                      {isAdmin && <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>}
                    </td>
                    <td className="p-3 font-medium">{item.BP_ID}</td>
                    <td className="p-3 font-medium">{item.BP_NAME}</td>
                    <td className="p-3">{item.BP_SHORT_CODE || "-"}</td>
                    <td className="p-3">{item.BP_TYPE || "-"}</td>
                    <td className="p-3">{item.TIN_NUMBER || "-"}</td>
                    <td className="p-3">{item.CONTACT_PERSON || "-"}</td>
                    <td className="p-3">{item.EMAIL_ADDRESS || "-"}</td>
                    <td className="p-3">{item.COUNTRY_NAME || "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">No records found</td></tr>
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
            <DialogTitle>{editing ? "Edit Business Partner" : "Add Business Partner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 pb-1 border-b">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("BP_NAME", "BP Name", "text", undefined, true, "e.g., Acme Corp", 250)}
                {renderField("STATUS_MASTER", "Status", "select", [{ value: "AC", label: "Active" }, { value: "IA", label: "Inactive" }])}
                {renderField("BP_TYPE", "BP Type", "select", [{ value: "CUSTOMER", label: "Customer" }, { value: "SUPPLIER", label: "Supplier" }], false, "Select BP Type")}
                {renderField("BP_SHORT_CODE", "Short Code", "text", undefined, false, "e.g., ACME", 50)}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 pb-1 border-b">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("CONTACT_PERSON", "Contact Person", "text", undefined, false, "Enter contact person", 50)}
                {renderField("CONTACT_NUMBER", "Contact Number", "text", undefined, false, "e.g., +255 700 000 000", 50, formatTanzaniaPhone)}
                {renderField("EMAIL_ADDRESS", "Email Address", "text", undefined, false, "e.g., contact@example.com", 100)}
                {renderField("PHONE_NUMBER_2", "Phone Number 2", "text", undefined, false, "e.g., +255 700 000 001", 50, formatTanzaniaPhone)}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 pb-1 border-b">Address</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("COUNTRY_ID", "Country", "select", countryOptions, false, "Select Country", undefined, undefined, (v) => { setForm({ ...form, COUNTRY_ID: v, REGION_ID: "", DISTRICT_ID: "" }); setRegions([]); setDistricts([]); loadRegionsForCountry(v); }, false, true)}
                {renderField("REGION_ID", "Region", "select", regionOptions, false, loadingRegions ? "Loading regions..." : "Select Region", undefined, undefined, (v) => { setForm({ ...form, REGION_ID: v, DISTRICT_ID: "" }); setDistricts([]); loadDistrictsForRegion(v); }, !form.COUNTRY_ID || loadingRegions, true)}
                {renderField("DISTRICT_ID", "District", "select", districtOptions, false, loadingDistricts ? "Loading districts..." : "Select District", undefined, undefined, (v) => setForm({ ...form, DISTRICT_ID: v }), !form.REGION_ID || loadingDistricts, true)}
                {renderField("LOCATION", "Location", "text", undefined, false, "e.g., Plot No, Street", 100)}
              </div>
              {renderField("ADDRESS", "Address", "textarea", undefined, false, "Full address details...")}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 pb-1 border-b">Business Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("TIN_NUMBER", "TIN Number", "text", undefined, false, "Tax Identification Number", 100)}
                {renderField("VAT_NUMBER", "VAT Number", "text", undefined, false, "VAT Registration Number", 50)}
                {renderField("NATURE_OF_BUSINESS", "Nature of Business", "text", undefined, false, "e.g., Manufacturing", 50)}
                {renderField("CREDIT_ALLOWED", "Credit Allowed", "select", [{ value: "YES", label: "Yes" }, { value: "NO", label: "No" }], false, "Select")}
              </div>
              {renderField("PAYMENT_TERMS", "Payment Terms", "select", paymentTermOptions, false, "Select Payment Terms")}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 pb-1 border-b">Company Head</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("COMPANY_HEAD_CONTACT_PERSON", "Contact Person", "text", undefined, false, "Company head name", 250)}
                {renderField("COMPANY_HEAD_PHONE_NO", "Phone No", "text", undefined, false, "e.g., +255 700 000 000", 250, formatTanzaniaPhone)}
                {renderField("COMPANY_HEAD_EMAIL", "Email", "text", undefined, false, "Company head email", 250)}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 pb-1 border-b">Accounts</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("ACCOUNTS_CONTACT_PERSON", "Contact Person", "text", undefined, false, "Accounts contact", 250)}
                {renderField("ACCOUNTS_PHONE_NO", "Phone No", "text", undefined, false, "e.g., +255 700 000 000", 250, formatTanzaniaPhone)}
                {renderField("ACCOUNTS_EMAIL", "Email", "text", undefined, false, "Accounts email", 250)}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 pb-1 border-b">Currency & Remarks</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("CURRENCY_ID", "Currency", "select", currencies.map((c: any) => ({ value: String(c.CURRENCY_ID), label: c.CURRENCY_NAME })), false, "Select Currency")}
              </div>
              {renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-xs">Cancel</Button>
              <Button onClick={handleSave} className={`${editing ? "bg-info text-info-foreground hover:bg-info/90" : "bg-primary text-primary-foreground hover:bg-primary/90"} text-xs`}>{editing ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this business partner.</AlertDialogDescription>
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
