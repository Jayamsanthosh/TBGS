"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchCustomerCreditLimits,
  getCustomerCreditLimitById,
  addCustomerCreditLimit,
  updateCustomerCreditLimit,
  deleteCustomerCreditLimit,
  clearCustomerCreditLimitError,
  type CustomerCreditLimitGridData,
} from "@/lib/customerCreditLimitDetailsSlice";
import { API_URL } from "@/lib/config";
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

interface DropdownItem {
  value: string;
  label: string;
}

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const VALID_TYPE_OPTIONS = ["PERMANENT", "TEMPORARY", "COD"];
const REQUEST_FOR_OPTIONS = ["Due to Credit Days", "Due to Credit Amount"];

const toDateInput = (val: any): string => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fmtAmount = (val: any): string => {
  if (val === null || val === undefined || val === "") return "-";
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

const normalizeOption = (val: any, options: string[]): string => {
  const s = String(val || "").trim().toUpperCase();
  if (!s) return "";
  const match = options.find((o) => o.toUpperCase() === s);
  return match || "";
};

export default function CustomerCreditLimitDetailsPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.customerCreditLimitDetails);
  const { user } = useAppSelector((s) => s.auth);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [companies, setCompanies] = useState<DropdownItem[]>([]);
  const [businessPartners, setBusinessPartners] = useState<DropdownItem[]>([]);
  const [paymentModes, setPaymentModes] = useState<DropdownItem[]>([]);
  const [currencies, setCurrencies] = useState<DropdownItem[]>([]);
  const selectedCompanyRef = useRef("");

  const fetchDropdowns = useCallback(async () => {
    const fetches = [
      fetch(`${API_URL}/company-master`).then(r => r.json())
        .then((d) => {
          const list = (d.data || []).map((x: any) => ({
            value: String(x.COMPANY_ID),
            label: x.COMPANY_NAME
          }));
          setCompanies(list);
          if (list.length > 0 && !selectedCompanyRef.current) {
            selectedCompanyRef.current = list[0].value;
            setSelectedCompany(list[0].value);
          }
        }).catch(() => {}),
      fetch(`${API_URL}/business-partner-master`).then(r => r.json())
        .then(d => setBusinessPartners((d.data || []).map((x: any) => ({
          value: String(x.BP_ID),
          label: x.BP_NAME
        })))).catch(() => {}),
      fetch(`${API_URL}/payment-mode-master`).then(r => r.json())
        .then(d => setPaymentModes((d.data || []).map((x: any) => ({
          value: String(x.PAYMENT_MODE_ID),
          label: x.PAYMENT_MODE_NAME
        })))).catch(() => {}),
      fetch(`${API_URL}/currency-master`).then(r => r.json())
        .then(d => setCurrencies((d.data || []).map((x: any) => ({
          value: String(x.CURRENCY_ID),
          label: x.CURRENCY_NAME
        })))).catch(() => {}),
    ];
    await Promise.all(fetches);
  }, []);

  useEffect(() => { fetchDropdowns(); }, [fetchDropdowns]);

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
    if (selectedCompany) {
      dispatch(fetchCustomerCreditLimits({ companyId: selectedCompany, status: statusFilter === "ALL" ? "ALL" : statusFilter }));
    }
  }, [dispatch, selectedCompany, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearCustomerCreditLimitError());
    }
  }, [error, dispatch, toast]);

  const bpName = useCallback((id: any) => {
    const f = businessPartners.find((x) => String(x.value) === String(id));
    return f ? f.label : (id != null && id !== "" ? id : "-");
  }, [businessPartners]);

  const paymentModeName = useCallback((id: any) => {
    const f = paymentModes.find((x) => String(x.value) === String(id));
    return f ? f.label : (id != null && id !== "" ? id : "-");
  }, [paymentModes]);

  const currencyName = useCallback((id: any) => {
    const f = currencies.find((x) => String(x.value) === String(id));
    return f ? f.label : (id != null && id !== "" ? id : "-");
  }, [currencies]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((d: any) => {
      const searchable = [
        d.COMPANY_NAME || "",
        bpName(d.BP_ID),
        d.CREDIT_LIMIT_DAYS || "",
        d.CREDIT_LIMIT_AMOUNT || "",
        paymentModeName(d.PAYMENT_MODE_ID),
        currencyName(d.CURRENCY_ID),
        d.REQUEST_FOR || "",
        d.REMARKS || "",
      ].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => Number(b.SNO || b.id || 0) - Number(a.SNO || a.id || 0));
  }, [items, search, bpName, paymentModeName, currencyName]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  const emptyForm = () => ({
    COMPANY_ID: selectedCompany && selectedCompany !== "ALL" ? selectedCompany : "",
    BP_ID: "",
    CREDIT_LIMIT_DAYS: "",
    CREDIT_LIMIT_AMOUNT: "",
    PAYMENT_MODE_ID: "",
    EFFECTIVE_FROM: "",
    EFFECTIVE_TO: "",
    VALID_TYPE: "",
    CURRENCY_ID: "",
    EXPECTED_NEXT_PAYMENT_DATE: "",
    EXPECTED_NEXT_PAYMENT_AMOUNT: "",
    REQUEST_FOR: "",
    SINGLE_INVOICE_REQUEST_AMOUNT: "",
    CREDIT_LIMIT_BUFFER_DAYS: "",
    TOTAL_OUTSTANDING_AMOUNT: "",
    OVER_DUE_OUTSTANDING_AMOUNT: "",
    REQUESTED_BY: user?.loginName || "",
    REQUESTED_DATE: toDateInput(new Date()),
    REMARKS: "",
    STATUS_MASTER: "AC",
    USER: "Admin",
    MAC_ADDRESS: "WEB",
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = async (item: any) => {
    setEditing(item);
    setDialogOpen(true);
    setForm(emptyForm());
    try {
      const detail = await dispatch(getCustomerCreditLimitById(item.id)).unwrap();
      if (detail) {
        setForm({
          COMPANY_ID: String(detail.COMPANY_ID || ""),
          BP_ID: String(detail.BP_ID || ""),
          CREDIT_LIMIT_DAYS: detail.CREDIT_LIMIT_DAYS != null ? String(detail.CREDIT_LIMIT_DAYS) : "",
          CREDIT_LIMIT_AMOUNT: detail.CREDIT_LIMIT_AMOUNT != null ? String(detail.CREDIT_LIMIT_AMOUNT) : "",
          PAYMENT_MODE_ID: String(detail.PAYMENT_MODE_ID || ""),
          EFFECTIVE_FROM: toDateInput(detail.EFFECTIVE_FROM),
          EFFECTIVE_TO: toDateInput(detail.EFFECTIVE_TO),
          VALID_TYPE: normalizeOption(detail.VALID_TYPE, VALID_TYPE_OPTIONS),
          CURRENCY_ID: String(detail.CURRENCY_ID || ""),
          EXPECTED_NEXT_PAYMENT_DATE: toDateInput(detail.EXPECTED_NEXT_PAYMENT_DATE),
          EXPECTED_NEXT_PAYMENT_AMOUNT: detail.EXPECTED_NEXT_PAYMENT_AMOUNT != null ? String(detail.EXPECTED_NEXT_PAYMENT_AMOUNT) : "",
          REQUEST_FOR: normalizeOption(detail.REQUEST_FOR, REQUEST_FOR_OPTIONS),
          SINGLE_INVOICE_REQUEST_AMOUNT: detail.SINGLE_INVOICE_REQUEST_AMOUNT != null ? String(detail.SINGLE_INVOICE_REQUEST_AMOUNT) : "",
          CREDIT_LIMIT_BUFFER_DAYS: detail.CREDIT_LIMIT_BUFFER_DAYS != null ? String(detail.CREDIT_LIMIT_BUFFER_DAYS) : "",
          TOTAL_OUTSTANDING_AMOUNT: detail.TOTAL_OUTSTANDING_AMOUNT != null ? String(detail.TOTAL_OUTSTANDING_AMOUNT) : "",
          OVER_DUE_OUTSTANDING_AMOUNT: detail.OVER_DUE_OUTSTANDING_AMOUNT != null ? String(detail.OVER_DUE_OUTSTANDING_AMOUNT) : "",
          REQUESTED_BY: detail.REQUESTED_BY || "",
          REQUESTED_DATE: toDateInput(detail.REQUESTED_DATE),
          REMARKS: detail.REMARKS || "",
          STATUS_MASTER: detail.STATUS_MASTER === "ACTIVE" ? "AC" : detail.STATUS_MASTER === "INACTIVE" ? "IN" : (detail.STATUS_MASTER || "AC"),
          USER: "Admin",
          MAC_ADDRESS: "WEB",
        });
      }
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Failed to load record"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const buildPayload = (addMode: boolean): Record<string, any> => {
    const payload: Record<string, any> = {
      COMPANY_ID: Number(form.COMPANY_ID),
      BP_ID: Number(form.BP_ID),
      CREDIT_LIMIT_DAYS: form.CREDIT_LIMIT_DAYS ? Math.max(0, Number(form.CREDIT_LIMIT_DAYS) || 0) : null,
      CREDIT_LIMIT_AMOUNT: form.CREDIT_LIMIT_AMOUNT ? Math.max(0, Number(form.CREDIT_LIMIT_AMOUNT) || 0) : null,
      PAYMENT_MODE_ID: Number(form.PAYMENT_MODE_ID),
      EFFECTIVE_FROM: form.EFFECTIVE_FROM || null,
      EFFECTIVE_TO: form.EFFECTIVE_TO || null,
      VALID_TYPE: form.VALID_TYPE?.trim() || null,
      CURRENCY_ID: Number(form.CURRENCY_ID),
      EXPECTED_NEXT_PAYMENT_DATE: form.EXPECTED_NEXT_PAYMENT_DATE || null,
      EXPECTED_NEXT_PAYMENT_AMOUNT: form.EXPECTED_NEXT_PAYMENT_AMOUNT ? Math.max(0, Number(form.EXPECTED_NEXT_PAYMENT_AMOUNT) || 0) : null,
      REQUEST_FOR: form.REQUEST_FOR?.trim() || null,
      SINGLE_INVOICE_REQUEST_AMOUNT: form.SINGLE_INVOICE_REQUEST_AMOUNT ? Math.max(0, Number(form.SINGLE_INVOICE_REQUEST_AMOUNT) || 0) : null,
      CREDIT_LIMIT_BUFFER_DAYS: form.CREDIT_LIMIT_BUFFER_DAYS ? Math.max(0, Number(form.CREDIT_LIMIT_BUFFER_DAYS) || 0) : null,
      TOTAL_OUTSTANDING_AMOUNT: form.TOTAL_OUTSTANDING_AMOUNT ? Math.max(0, Number(form.TOTAL_OUTSTANDING_AMOUNT) || 0) : null,
      OVER_DUE_OUTSTANDING_AMOUNT: form.OVER_DUE_OUTSTANDING_AMOUNT ? Math.max(0, Number(form.OVER_DUE_OUTSTANDING_AMOUNT) || 0) : null,
      REMARKS: form.REMARKS?.trim() || null,
      STATUS_MASTER: form.STATUS_MASTER,
      USER: "Admin",
      MAC_ADDRESS: "WEB",
    };
    if (addMode) {
      payload.REQUESTED_BY = form.REQUESTED_BY?.trim() || null;
      payload.REQUESTED_DATE = form.REQUESTED_DATE || null;
    }
    return payload;
  };

  const handleSave = async () => {
    if (!form.COMPANY_ID) {
      toast({ title: "Company is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.BP_ID) {
      toast({ title: "Business partner is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.PAYMENT_MODE_ID) {
      toast({ title: "Payment mode is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.CURRENCY_ID) {
      toast({ title: "Currency is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    try {
      if (editing) {
        const payload = buildPayload(false);
        payload.SNO = Number(editing.id);
        const res = await dispatch(updateCustomerCreditLimit(payload as CustomerCreditLimitGridData)).unwrap();
        toast({ title: res?.message ?? "Customer credit limit updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const payload = buildPayload(true);
        const res = await dispatch(addCustomerCreditLimit(payload as CustomerCreditLimitGridData)).unwrap();
        toast({ title: res?.message ?? "Customer credit limit created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchCustomerCreditLimits({ companyId: selectedCompany, status: statusFilter === "ALL" ? "ALL" : statusFilter }));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error saving record"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteCustomerCreditLimit(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Record deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchCustomerCreditLimits({ companyId: selectedCompany, status: statusFilter === "ALL" ? "ALL" : statusFilter }));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error deleting record"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const setFormKey = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customer Credit Limit Details</h1>
          <p className="text-sm text-muted-foreground">Manage customer credit limit requests</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Record
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 w-full sm:max-w-3xl flex-wrap">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Company:</span>
              <Select value={selectedCompany} onValueChange={(v) => { selectedCompanyRef.current = v; setSelectedCompany(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-48 h-9 text-xs"><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Companies</SelectItem>
                  {companies.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-28 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="AC">Active</SelectItem>
                <SelectItem value="IN">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search records..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
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
                  {[...Array(12)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">SNO</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Business Partner</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Days</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Limit Amount</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Payment Mode</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Effective From</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Effective To</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Currency</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Request For</th>
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
                    <td className="p-3 font-medium">{item.SNO}</td>
                    <td className="p-3">{item.COMPANY_NAME || "-"}</td>
                    <td className="p-3">{bpName(item.BP_ID)}</td>
                    <td className="p-3">{item.CREDIT_LIMIT_DAYS ?? "-"}</td>
                    <td className="p-3">{fmtAmount(item.CREDIT_LIMIT_AMOUNT)}</td>
                    <td className="p-3">{paymentModeName(item.PAYMENT_MODE_ID)}</td>
                    <td className="p-3">{formatDate(item.EFFECTIVE_FROM)}</td>
                    <td className="p-3">{formatDate(item.EFFECTIVE_TO)}</td>
                    <td className="p-3">{currencyName(item.CURRENCY_ID)}</td>
                    <td className="p-3">{item.REQUEST_FOR || "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={12} className="p-8 text-center text-muted-foreground">No records found</td></tr>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Customer Credit Limit" : "Add Customer Credit Limit"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Company <span className="text-destructive">*</span></Label>
                <Select value={form.COMPANY_ID || ""} onValueChange={(v) => setFormKey("COMPANY_ID", v)}>
                  <SelectTrigger className={`h-9 text-xs ${!form.COMPANY_ID ? "border-red-500" : ""}`}><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Business Partner <span className="text-destructive">*</span></Label>
                <Select value={form.BP_ID || ""} onValueChange={(v) => setFormKey("BP_ID", v)}>
                  <SelectTrigger className={`h-9 text-xs ${!form.BP_ID ? "border-red-500" : ""}`}><SelectValue placeholder="Select business partner" /></SelectTrigger>
                  <SelectContent>
                    {businessPartners.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Payment Mode <span className="text-destructive">*</span></Label>
                <Select value={form.PAYMENT_MODE_ID || ""} onValueChange={(v) => setFormKey("PAYMENT_MODE_ID", v)}>
                  <SelectTrigger className={`h-9 text-xs ${!form.PAYMENT_MODE_ID ? "border-red-500" : ""}`}><SelectValue placeholder="Select payment mode" /></SelectTrigger>
                  <SelectContent>
                    {paymentModes.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Currency <span className="text-destructive">*</span></Label>
                <Select value={form.CURRENCY_ID || ""} onValueChange={(v) => setFormKey("CURRENCY_ID", v)}>
                  <SelectTrigger className={`h-9 text-xs ${!form.CURRENCY_ID ? "border-red-500" : ""}`}><SelectValue placeholder="Select currency" /></SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Credit Limit Days</Label>
                <Input type="number" min="0" step="any" className="h-9 text-xs" value={form.CREDIT_LIMIT_DAYS || ""} onChange={(e) => setFormKey("CREDIT_LIMIT_DAYS", clampNonNegative(e.target.value))} placeholder="e.g., 30" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Credit Limit Amount</Label>
                <Input type="number" min="0" step="any" className="h-9 text-xs" value={form.CREDIT_LIMIT_AMOUNT || ""} onChange={(e) => setFormKey("CREDIT_LIMIT_AMOUNT", clampNonNegative(e.target.value))} placeholder="e.g., 500000" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Effective From</Label>
                <DatePicker value={form.EFFECTIVE_FROM || ""} onChange={(v) => setFormKey("EFFECTIVE_FROM", v)} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Effective To</Label>
                <DatePicker value={form.EFFECTIVE_TO || ""} onChange={(v) => setFormKey("EFFECTIVE_TO", v)} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Valid Type</Label>
                <Select value={form.VALID_TYPE || ""} onValueChange={(v) => setFormKey("VALID_TYPE", v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select valid type" /></SelectTrigger>
                  <SelectContent>
                    {VALID_TYPE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Request For</Label>
                <Select value={form.REQUEST_FOR || ""} onValueChange={(v) => setFormKey("REQUEST_FOR", v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select request for" /></SelectTrigger>
                  <SelectContent>
                    {REQUEST_FOR_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Expected Next Payment Date</Label>
                <DatePicker value={form.EXPECTED_NEXT_PAYMENT_DATE || ""} onChange={(v) => setFormKey("EXPECTED_NEXT_PAYMENT_DATE", v)} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Expected Next Payment Amount</Label>
                <Input type="number" min="0" step="any" className="h-9 text-xs" value={form.EXPECTED_NEXT_PAYMENT_AMOUNT || ""} onChange={(e) => setFormKey("EXPECTED_NEXT_PAYMENT_AMOUNT", clampNonNegative(e.target.value))} placeholder="e.g., 25000" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Single Invoice Request Amount</Label>
                <Input type="number" min="0" step="any" className="h-9 text-xs" value={form.SINGLE_INVOICE_REQUEST_AMOUNT || ""} onChange={(e) => setFormKey("SINGLE_INVOICE_REQUEST_AMOUNT", clampNonNegative(e.target.value))} placeholder="e.g., 100000" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Credit Limit Buffer Days</Label>
                <Input type="number" min="0" step="any" className="h-9 text-xs" value={form.CREDIT_LIMIT_BUFFER_DAYS || ""} onChange={(e) => setFormKey("CREDIT_LIMIT_BUFFER_DAYS", clampNonNegative(e.target.value))} placeholder="e.g., 5" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Total Outstanding Amount</Label>
                <Input type="number" min="0" step="any" className="h-9 text-xs" value={form.TOTAL_OUTSTANDING_AMOUNT || ""} onChange={(e) => setFormKey("TOTAL_OUTSTANDING_AMOUNT", clampNonNegative(e.target.value))} placeholder="e.g., 0" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Over Due Outstanding Amount</Label>
                <Input type="number" min="0" step="any" className="h-9 text-xs" value={form.OVER_DUE_OUTSTANDING_AMOUNT || ""} onChange={(e) => setFormKey("OVER_DUE_OUTSTANDING_AMOUNT", clampNonNegative(e.target.value))} placeholder="e.g., 0" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Requested By</Label>
                <Input type="text" className="h-9 text-xs" value={form.REQUESTED_BY || ""} readOnly placeholder="-" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Requested Date</Label>
                <Input type="text" className="h-9 text-xs" value={form.REQUESTED_DATE ? formatDate(form.REQUESTED_DATE) : ""} readOnly placeholder="-" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Status</Label>
                <Select value={form.STATUS_MASTER || "AC"} onValueChange={(v) => setFormKey("STATUS_MASTER", v)} disabled={!editing}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AC">Active</SelectItem>
                    <SelectItem value="IN">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Remarks</Label>
                <Textarea value={form.REMARKS || ""} onChange={(e) => setFormKey("REMARKS", e.target.value)} placeholder="Additional notes..." className="text-xs" />
              </div>
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
            <AlertDialogDescription>This will permanently delete this customer credit limit record.</AlertDialogDescription>
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
