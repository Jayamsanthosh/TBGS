"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchItems, addItem, updateItem, deleteItem, clearError, type StoreProductMinimumStockGridData } from "@/lib/storeProductMinimumStockSlice";
import { API_URL } from "@/lib/config";
import { formatDate } from "@/lib/validation";
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
import { DatePicker } from "@/components/ui/date-picker";

interface DropdownItem {
  value: string;
  label: string;
  campId?: string;
  mainCategoryId?: string;
  subCategoryId?: string;
}

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

const renderField = (
  key: string,
  label: string,
  type: "text" | "number" | "date" | "select" | "textarea",
  form: Record<string, any>,
  setForm: (f: Record<string, any>) => void,
  options?: DropdownItem[],
  required?: boolean,
  placeholder?: string,
) => (
  <div key={key} className={type === "textarea" ? "col-span-full flex flex-col gap-1.5" : "flex flex-col gap-1.5"}>
    <Label className="text-xs">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
    {type === "select" ? (
      <Select value={form[key] || ""} onValueChange={(v) => setForm({ ...form, [key]: v })}>
        <SelectTrigger className="h-9 text-xs">
          <SelectValue placeholder={placeholder || `Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {(options || []).map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : type === "textarea" ? (
      <Textarea
        value={form[key] || ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="text-xs"
      />
    ) : type === "date" ? (
      <DatePicker
        value={form[key] ?? ""}
        onChange={(v) => setForm({ ...form, [key]: v })}
        placeholder={placeholder}
      />
    ) : (
      <Input
        type={type === "number" ? "number" : "text"}
        value={form[key] ?? ""}
        onChange={(e) =>
          setForm({
            ...form,
            [key]: type === "number"
              ? (e.target.value ? Number(e.target.value) : "")
              : e.target.value,
          })
        }
        placeholder={placeholder}
        className={`h-9 text-xs${required && !form[key] ? " border-destructive ring-1 ring-destructive/30" : ""}`}
        {...(type === "number" ? { min: "0", step: "any" } : {})}
      />
    )}
  </div>
);

export default function StoreProductMinimumStockPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.storeProductMinimumStock);
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
  const [camps, setCamps] = useState<DropdownItem[]>([]);
  const [stores, setStores] = useState<DropdownItem[]>([]);
  const [mappings, setMappings] = useState<{ COMPANY_ID: number; CAMP_ID: number; STORE_ID: number }[]>([]);
  const [mainCategories, setMainCategories] = useState<DropdownItem[]>([]);
  const [subCategories, setSubCategories] = useState<DropdownItem[]>([]);
  const [products, setProducts] = useState<DropdownItem[]>([]);

  const fetchDropdownData = useCallback(async (url: string) => {
    try {
      const res = await fetch(url);
      const json = await res.json();
      return (json.data || []).map((x: any) => ({
        value: String(x.id ?? x[Object.keys(x).find(k => k.endsWith('_ID') || k.endsWith('_ID')) || Object.keys(x)[0]]),
        label: x[Object.keys(x).find(k => k.includes('NAME') || k.includes('Name')) || Object.keys(x)[1]] || x.name || Object.values(x)[1] || Object.values(x)[0],
      }));
    } catch { return []; }
  }, []);

  useEffect(() => {
    Promise.all([
      fetchDropdownData(`${API_URL}/company-master`).then(setCompanies),
      fetchDropdownData(`${API_URL}/camp-master`).then(setCamps),
      fetch(`${API_URL}/store-master`).then(r => r.json())
        .then(d => setStores((d.data || []).filter((x: any) => (x.Store_Id ?? x.STORE_ID) != null && (x.Store_Name ?? x.STORE_NAME)).map((x: any) => ({
          value: String(x.Store_Id ?? x.STORE_ID),
          label: x.Store_Name ?? x.STORE_NAME,
          campId: String(x.Camp_Id ?? x.CAMP_ID ?? ""),
        })))).catch(() => {}),
      fetchDropdownData(`${API_URL}/product-main-category`).then(setMainCategories),
      fetch(`${API_URL}/product-sub-category`).then(r => r.json())
        .then(d => setSubCategories((d.data || []).filter((x: any) => x.SUB_CATEGORY_ID != null && x.SUB_CATEGORY_NAME).map((x: any) => ({
          value: String(x.SUB_CATEGORY_ID),
          label: x.SUB_CATEGORY_NAME,
          mainCategoryId: String(x.MAIN_CATEGORY_ID ?? ""),
        })))).catch(() => {}),
      fetch(`${API_URL}/product-master`).then(r => r.json())
        .then(d => setProducts((d.data || []).filter((x: any) => x.PRODUCT_ID != null && x.PRODUCT_NAME).map((x: any) => ({
          value: String(x.PRODUCT_ID),
          label: x.PRODUCT_NAME,
          subCategoryId: String(x.SUB_CATEGORY_ID ?? ""),
        })))).catch(() => {}),
      fetch(`${API_URL}/company-camp-store-mapping?status=AC`).then(r => r.json())
        .then(d => setMappings((d.data || []).filter((x: any) => x.COMPANY_ID != null && x.CAMP_ID != null))).catch(() => {}),
    ]);
  }, [fetchDropdownData]);

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

  const companyCampMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const m of mappings) {
      const companyId = String(m.COMPANY_ID);
      const campId = String(m.CAMP_ID);
      const existing = map.get(companyId);
      if (existing) existing.add(campId);
      else map.set(companyId, new Set<string>([campId]));
    }
    return map;
  }, [mappings]);

  const availableCamps = useMemo(() => {
    if (!form.COMPANY_ID) return [];
    const ids = companyCampMap.get(String(form.COMPANY_ID)) || new Set<string>();
    const filtered = camps.filter((c) => ids.has(c.value));
    const selected = form.CAMP_ID ? camps.find((c) => c.value === String(form.CAMP_ID)) : undefined;
    if (selected && !filtered.some((c) => c.value === selected.value)) {
      return [...filtered, selected];
    }
    return filtered;
  }, [camps, companyCampMap, form.COMPANY_ID, form.CAMP_ID]);

  const availableStores = useMemo(() => {
    if (!form.CAMP_ID) return [];
    const filtered = stores.filter((s) => s.campId === String(form.CAMP_ID));
    const selected = form.STORE_ID ? stores.find((s) => s.value === String(form.STORE_ID)) : undefined;
    if (selected && !filtered.some((s) => s.value === selected.value)) {
      return [...filtered, selected];
    }
    return filtered;
  }, [stores, form.CAMP_ID, form.STORE_ID]);

  const availableSubCategories = useMemo(() => {
    if (!form.MAIN_CATEGORY_ID) return [];
    const filtered = subCategories.filter((s) => s.mainCategoryId === String(form.MAIN_CATEGORY_ID));
    const selected = form.SUB_CATEGORY_ID ? subCategories.find((s) => s.value === String(form.SUB_CATEGORY_ID)) : undefined;
    if (selected && !filtered.some((s) => s.value === selected.value)) {
      return [...filtered, selected];
    }
    return filtered;
  }, [subCategories, form.MAIN_CATEGORY_ID, form.SUB_CATEGORY_ID]);

  const availableProducts = useMemo(() => {
    if (!form.SUB_CATEGORY_ID) return [];
    const filtered = products.filter((p) => p.subCategoryId === String(form.SUB_CATEGORY_ID));
    const selected = form.PRODUCT_ID ? products.find((p) => p.value === String(form.PRODUCT_ID)) : undefined;
    if (selected && !filtered.some((p) => p.value === selected.value)) {
      return [...filtered, selected];
    }
    return filtered;
  }, [products, form.SUB_CATEGORY_ID, form.PRODUCT_ID]);

  useEffect(() => {
    dispatch(fetchItems(statusFilter));
  }, [dispatch, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((d: any) => {
      const searchable = [
        d.COMPANY_NAME, d.CAMP_NAME, d.STORE_NAME,
        d.MAIN_CATEGORY_NAME, d.SUB_CATEGORY_NAME, d.PRODUCT_NAME,
        d.REQUESTED_BY, d.REMARKS,
      ].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => Number(b.id || b.SNO || 0) - Number(a.id || a.SNO || 0));
  }, [items, search]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  const emptyForm = () => ({
    COMPANY_ID: "",
    CAMP_ID: "",
    STORE_ID: "",
    MAIN_CATEGORY_ID: "",
    SUB_CATEGORY_ID: "",
    PRODUCT_ID: "",
    MINIMUM_STOCK_PCS: "",
    PURCHASE_ALERT_QTY: "",
    REQUESTED_BY: "",
    EFFECTIVE_FROM: "",
    EFFECTIVE_TO: "",
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
    setForm(emptyForm());
    try {
      const res = await fetch(`${API_URL}/store-product-minimum-stock/${item.id}`);
      const json = await res.json();
      const d = json.data || {};
      setForm({
        COMPANY_ID: String(d.COMPANY_ID ?? ""),
        CAMP_ID: String(d.CAMP_ID ?? ""),
        STORE_ID: String(d.STORE_ID ?? ""),
        MAIN_CATEGORY_ID: String(d.MAIN_CATEGORY_ID ?? ""),
        SUB_CATEGORY_ID: String(d.SUB_CATEGORY_ID ?? ""),
        PRODUCT_ID: String(d.PRODUCT_ID ?? ""),
        MINIMUM_STOCK_PCS: d.MINIMUM_STOCK_PCS ?? "",
        PURCHASE_ALERT_QTY: d.PURCHASE_ALERT_QTY ?? "",
        REQUESTED_BY: d.REQUESTED_BY || "",
        EFFECTIVE_FROM: d.EFFECTIVE_FROM || "",
        EFFECTIVE_TO: d.EFFECTIVE_TO || "",
        REMARKS: d.REMARKS || "",
        STATUS_MASTER: d.STATUS_MASTER === "ACTIVE" ? "AC" : d.STATUS_MASTER === "INACTIVE" ? "IA" : (d.STATUS_MASTER || "AC"),
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      });
      setDialogOpen(true);
    } catch {
      toast({ title: "Failed to load record for editing", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      setEditing(null);
    }
  };

  const handleSave = async () => {
    if (!form.COMPANY_ID) {
      toast({ title: "Company is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.STORE_ID) {
      toast({ title: "Store is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.MAIN_CATEGORY_ID) {
      toast({ title: "Main category is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.PRODUCT_ID) {
      toast({ title: "Product is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!editing && normalizeStatus(form.STATUS_MASTER) === "INACTIVE") {
      toast({ title: "Status cannot be inactive for new records", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    const payload: Record<string, any> = {
      COMPANY_ID: Number(form.COMPANY_ID),
      CAMP_ID: form.CAMP_ID ? Number(form.CAMP_ID) : null,
      STORE_ID: Number(form.STORE_ID),
      MAIN_CATEGORY_ID: form.MAIN_CATEGORY_ID ? Number(form.MAIN_CATEGORY_ID) : null,
      SUB_CATEGORY_ID: form.SUB_CATEGORY_ID ? Number(form.SUB_CATEGORY_ID) : null,
      PRODUCT_ID: Number(form.PRODUCT_ID),
      MINIMUM_STOCK_PCS: form.MINIMUM_STOCK_PCS !== "" ? Math.max(0, Number(form.MINIMUM_STOCK_PCS) || 0) : null,
      PURCHASE_ALERT_QTY: form.PURCHASE_ALERT_QTY !== "" ? Math.max(0, Number(form.PURCHASE_ALERT_QTY) || 0) : null,
      REQUESTED_BY: form.REQUESTED_BY?.trim() || null,
      EFFECTIVE_FROM: form.EFFECTIVE_FROM || null,
      EFFECTIVE_TO: form.EFFECTIVE_TO || null,
      REMARKS: form.REMARKS?.trim() || null,
      STATUS_MASTER: editing ? form.STATUS_MASTER : "AC",
      USER: "Admin",
      MAC_ADDRESS: "WEB",
    };

    try {
      if (editing) {
        payload.SNO = Number(editing.id);
        const res = await dispatch(updateItem(payload as StoreProductMinimumStockGridData)).unwrap();
        toast({ title: res?.message ?? "Minimum stock updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addItem(payload as StoreProductMinimumStockGridData)).unwrap();
        toast({ title: res?.message ?? "Minimum stock created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchItems(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error saving minimum stock"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteItem(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Minimum stock deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchItems(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error deleting minimum stock"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Store Product Minimum Stock</h1>
          <p className="text-sm text-muted-foreground">Manage minimum stock levels for store products</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Minimum Stock
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search records..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Store</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Product</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Min Stock</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Alert Qty</th>
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
                      {isAdmin && <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>}
                    </td>
                    <td className="p-3 font-medium">{item.SNO}</td>
                    <td className="p-3">{item.COMPANY_NAME}</td>
                    <td className="p-3">{item.STORE_NAME}</td>
                    <td className="p-3">{item.PRODUCT_NAME}</td>
                    <td className="p-3">{item.MINIMUM_STOCK_PCS ?? "-"}</td>
                    <td className="p-3">{item.PURCHASE_ALERT_QTY ?? "-"}</td>
                    <td className="p-3">{formatDate(item.EFFECTIVE_FROM)}</td>
                    <td className="p-3">{formatDate(item.EFFECTIVE_TO)}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {normalizeStatus(item.STATUS_MASTER)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Minimum Stock" : "Add Minimum Stock"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-full">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pb-1 border-b">Store Information</h3>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Company <span className="text-destructive ml-0.5">*</span></Label>
                <Select value={form.COMPANY_ID || ""} onValueChange={(v) => setForm({ ...form, COMPANY_ID: v, CAMP_ID: "", STORE_ID: "" })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Camp</Label>
                <Select
                  value={form.CAMP_ID || ""}
                  onValueChange={(v) => setForm({ ...form, CAMP_ID: v, STORE_ID: "" })}
                  disabled={!form.COMPANY_ID}
                >
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={form.COMPANY_ID ? "Select camp" : "Select company first"} /></SelectTrigger>
                  <SelectContent>
                    {availableCamps.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Store <span className="text-destructive ml-0.5">*</span></Label>
                <Select
                  value={form.STORE_ID || ""}
                  onValueChange={(v) => setForm({ ...form, STORE_ID: v })}
                  disabled={!form.CAMP_ID}
                >
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={form.CAMP_ID ? "Select store" : "Select camp first"} /></SelectTrigger>
                  <SelectContent>
                    {availableStores.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-full">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pb-1 border-b">Product Information</h3>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Main Category <span className="text-destructive ml-0.5">*</span></Label>
                <SearchableSelect value={form.MAIN_CATEGORY_ID || ""} onChange={(v) => setForm({ ...form, MAIN_CATEGORY_ID: v, SUB_CATEGORY_ID: "", PRODUCT_ID: "" })} options={mainCategories} placeholder="Select main category" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Sub Category</Label>
                <SearchableSelect
                  value={form.SUB_CATEGORY_ID || ""}
                  onChange={(v) => setForm({ ...form, SUB_CATEGORY_ID: v, PRODUCT_ID: "" })}
                  options={availableSubCategories}
                  placeholder={form.MAIN_CATEGORY_ID ? "Select sub category" : "Select main category first"}
                  disabled={!form.MAIN_CATEGORY_ID}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Product <span className="text-destructive ml-0.5">*</span></Label>
                <SearchableSelect
                  value={form.PRODUCT_ID || ""}
                  onChange={(v) => setForm({ ...form, PRODUCT_ID: v })}
                  options={availableProducts}
                  placeholder={form.SUB_CATEGORY_ID ? "Select product" : "Select sub category first"}
                  disabled={!form.SUB_CATEGORY_ID}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-full">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pb-1 border-b">Details</h3>
              </div>
              {renderField("MINIMUM_STOCK_PCS", "Min Stock (Qty)", "number", form, setForm, undefined, false, "0")}
              {renderField("PURCHASE_ALERT_QTY", "Purchase Alert Qty", "number", form, setForm, undefined, false, "0.00")}
              {renderField("REQUESTED_BY", "Requested By", "text", form, setForm, undefined, false, "Person name")}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Effective From</Label>
                <DatePicker
                  value={form.EFFECTIVE_FROM || ""}
                  onChange={(v) => setForm({ ...form, EFFECTIVE_FROM: v })}
                  placeholder="Select effective from"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Effective To</Label>
                <DatePicker
                  value={form.EFFECTIVE_TO || ""}
                  onChange={(v) => setForm({ ...form, EFFECTIVE_TO: v })}
                  placeholder="Select effective to"
                />
              </div>
              {renderField("STATUS_MASTER", "Status", "select", form, setForm, [
                { value: "AC", label: "Active" },
                { value: "IA", label: "Inactive" },
              ])}
              {renderField("REMARKS", "Remarks", "textarea", form, setForm, undefined, false, "Additional notes...")}
            </div>

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
            <AlertDialogDescription>This will permanently delete this minimum stock record.</AlertDialogDescription>
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
