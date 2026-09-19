"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchCompanyBankAccounts, addCompanyBankAccount, updateCompanyBankAccount, deleteCompanyBankAccount, clearCompanyBankAccountError, type CompanyBankAccountGridData } from "@/lib/companyBankAccountMasterSlice";
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
import { API_URL } from "@/lib/config";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

interface DropdownItem {
  value: string;
  label: string;
}

export default function CompanyBankAccountMasterPage() {
  const dispatch = useAppDispatch();
  const { accounts, loading, error } = useAppSelector((s) => s.companyBankAccount);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AC");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [companies, setCompanies] = useState<DropdownItem[]>([]);
  const [banks, setBanks] = useState<DropdownItem[]>([]);
  const [currencies, setCurrencies] = useState<DropdownItem[]>([]);

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
    dispatch(fetchCompanyBankAccounts(statusFilter));
  }, [dispatch, statusFilter]);

  const fetchDropdowns = useCallback(async () => {
    const fetches = [
      fetch(`${API_URL}/company-master`).then(r => r.json()).then(d => setCompanies((d.data || []).map((x: any) => ({ value: String(x.COMPANY_ID || x.id), label: x.COMPANY_NAME })))).catch(() => {}),
      fetch(`${API_URL}/bank-master`).then(r => r.json()).then(d => setBanks((d.data || []).map((x: any) => ({ value: String(x.BANK_ID || x.id), label: x.BANK_NAME })))).catch(() => {}),
      fetch(`${API_URL}/currency-master`).then(r => r.json()).then(d => setCurrencies((d.data || []).map((x: any) => ({ value: String(x.CURRENCY_ID || x.id), label: x.CURRENCY_NAME })))).catch(() => {}),
    ];
    await Promise.all(fetches);
  }, []);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearCompanyBankAccountError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    if (!Array.isArray(accounts)) return [];
    return accounts.filter((d: any) => {
      const searchable = [d.ACCOUNT_NAME, d.ACCOUNT_NUMBER, d.BANK_NAME, d.COMPANY_NAME, d.SWIFT_CODE, d.BANK_BRANCH_NAME].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => Number(b.ACCOUNT_ID) - Number(a.ACCOUNT_ID));
  }, [accounts, search]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  const emptyForm = () => ({
    ACCOUNT_NAME: "",
    ACCOUNT_NUMBER: "",
    COMPANY_ID: "",
    BANK_ID: "",
    CURRENCY_ID: "",
    SWIFT_CODE: "",
    BRANCH_ADDRESS: "",
    BANK_BRANCH_NAME: "",
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
    setForm({
      ACCOUNT_NAME: item.ACCOUNT_NAME || "",
      ACCOUNT_NUMBER: item.ACCOUNT_NUMBER || "",
      COMPANY_ID: String(item.COMPANY_ID || ""),
      BANK_ID: String(item.BANK_ID || ""),
      CURRENCY_ID: String(item.CURRENCY_ID || ""),
      SWIFT_CODE: item.SWIFT_CODE || "",
      BRANCH_ADDRESS: item.BRANCH_ADDRESS || "",
      BANK_BRANCH_NAME: item.BANK_BRANCH_NAME || "",
      REMARKS: item.REMARKS || "",
      STATUS_MASTER: item.STATUS_MASTER || "AC",
      USER: "Admin",
      MAC_ADDRESS: "WEB",
    });
    setDialogOpen(true);

    const id = Number(item.id ?? item.ACCOUNT_ID);
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/company-bank-account-master/${id}`);
      if (!res.ok) return;
      const json = await res.json();
      const d = json.data;
      if (!d) return;
      setForm((prev) => ({
        ...prev,
        ACCOUNT_NAME: d.ACCOUNT_NAME || prev.ACCOUNT_NAME,
        ACCOUNT_NUMBER: d.ACCOUNT_NUMBER || prev.ACCOUNT_NUMBER,
        COMPANY_ID: d.COMPANY_ID != null ? String(d.COMPANY_ID) : prev.COMPANY_ID,
        BANK_ID: d.BANK_ID != null ? String(d.BANK_ID) : prev.BANK_ID,
        CURRENCY_ID: d.CURRENCY_ID != null ? String(d.CURRENCY_ID) : prev.CURRENCY_ID,
        SWIFT_CODE: d.SWIFT_CODE || prev.SWIFT_CODE,
        BRANCH_ADDRESS: d.BRANCH_ADDRESS || prev.BRANCH_ADDRESS,
        BANK_BRANCH_NAME: d.BANK_BRANCH_NAME || prev.BANK_BRANCH_NAME,
        REMARKS: d.REMARKS || prev.REMARKS,
        STATUS_MASTER: d.STATUS_MASTER || prev.STATUS_MASTER,
      }));
    } catch {}
  };

  const handleSave = async () => {
    if (!form.ACCOUNT_NAME?.trim()) {
      toast({ title: "Account name is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.ACCOUNT_NUMBER?.trim()) {
      toast({ title: "Account number is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    if (!editing && normalizeStatus(form.STATUS_MASTER) !== "ACTIVE") {
      toast({ title: "New account cannot be set to Inactive", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    try {
      const payload: Record<string, any> = {
        ACCOUNT_NAME: form.ACCOUNT_NAME.trim(),
        ACCOUNT_NUMBER: form.ACCOUNT_NUMBER.trim(),
        COMPANY_ID: form.COMPANY_ID ? Number(form.COMPANY_ID) : null,
        BANK_ID: form.BANK_ID ? Number(form.BANK_ID) : null,
        CURRENCY_ID: form.CURRENCY_ID ? Number(form.CURRENCY_ID) : null,
        SWIFT_CODE: form.SWIFT_CODE?.trim() || null,
        BRANCH_ADDRESS: form.BRANCH_ADDRESS?.trim() || null,
        BANK_BRANCH_NAME: form.BANK_BRANCH_NAME?.trim() || null,
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_MASTER: form.STATUS_MASTER,
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (editing) {
        payload.ACCOUNT_ID = Number(editing.id);
        const res = await dispatch(updateCompanyBankAccount(payload as CompanyBankAccountGridData)).unwrap();
        toast({ title: res?.message ?? "Account updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addCompanyBankAccount(payload as CompanyBankAccountGridData)).unwrap();
        toast({ title: res?.message ?? "Account created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchCompanyBankAccounts(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error saving account"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteCompanyBankAccount(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Account deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchCompanyBankAccounts(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error deleting account"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (key: string, label: string, type: "text" | "select" | "textarea", options?: DropdownItem[], required?: boolean, placeholder?: string, maxLength?: number) => {
    const reqClass = required && !String(form[key] ?? "").trim() ? " border-destructive ring-1 ring-destructive/30" : "";
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : ""}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {type === "select" ? (
          <Select value={form[key] || ""} onValueChange={(v) => setForm({ ...form, [key]: v })}>
            <SelectTrigger className={`h-9 text-xs${reqClass}`}><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={`text-xs${reqClass}`} />
        ) : (
          <Input value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={`h-9 text-xs${reqClass}`} maxLength={maxLength} />
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Company Bank Account Master</h1>
          <p className="text-sm text-muted-foreground">Manage company bank account master data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Account
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search accounts..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
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
                  {[...Array(7)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Bank</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Account Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Account No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Currency</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Swift</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Branch</th>
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
                    <td className="p-3 font-medium">{item.ACCOUNT_ID}</td>
                    <td className="p-3">{item.COMPANY_NAME || "-"}</td>
                    <td className="p-3">{item.BANK_NAME || "-"}</td>
                    <td className="p-3">{item.ACCOUNT_NAME}</td>
                    <td className="p-3">{item.ACCOUNT_NUMBER}</td>
                    <td className="p-3">{item.CURRENCY_NAME || "-"}</td>
                    <td className="p-3">{item.SWIFT_CODE || "-"}</td>
                    <td className="p-3">{item.BANK_BRANCH_NAME || "-"}</td>
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Account" : "Add Account"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground">Account Information</Label>
                <div className="h-px bg-border mt-1" />
              </div>
              {renderField("ACCOUNT_NAME", "Account Name", "text", undefined, true, "e.g., Main Operating Account", 100)}
              {renderField("ACCOUNT_NUMBER", "Account Number", "text", undefined, true, "e.g., 1234567890", 100)}

              <div className="col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground">Entity Selection</Label>
                <div className="h-px bg-border mt-1" />
              </div>
              {renderField("COMPANY_ID", "Company", "select", companies, false, "Select Company")}
              {renderField("BANK_ID", "Bank", "select", banks, false, "Select Bank")}
              {renderField("CURRENCY_ID", "Currency", "select", currencies, false, "Select Currency")}

              <div className="col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground">Bank Details</Label>
                <div className="h-px bg-border mt-1" />
              </div>
              {renderField("SWIFT_CODE", "SWIFT Code", "text", undefined, false, "e.g., SBZAUSBB", 50)}
              {renderField("BANK_BRANCH_NAME", "Branch Name", "text", undefined, false, "e.g., Main Branch", 50)}
              {renderField("BRANCH_ADDRESS", "Branch Address", "text", undefined, false, "e.g., 123 Bank Street", 200)}

              <div className="col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground">Status & Notes</Label>
                <div className="h-px bg-border mt-1" />
              </div>
              {renderField("STATUS_MASTER", "Status", "select", [{ value: "AC", label: "Active" }, { value: "IA", label: "Inactive" }])}
            </div>
            {renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-xs">Cancel</Button>
              <Button onClick={handleSave} className={editing ? "bg-info text-info-foreground hover:bg-info/90 text-xs" : "bg-primary text-primary-foreground hover:bg-primary/90 text-xs"}>{editing ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this bank account record.</AlertDialogDescription>
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
