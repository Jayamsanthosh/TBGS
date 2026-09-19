"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchProductOpeningStocks, addProductOpeningStock, updateProductOpeningStock, deleteProductOpeningStock, fetchProductOpeningStockById, clearProductOpeningStockError } from "@/lib/productOpeningStockSlice";
import { useApiQuery } from "@/lib/reduxQuery";
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
import { formatDate } from "@/lib/validation";
import { DatePicker } from "@/components/ui/date-picker";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

export default function ProductOpeningStockPage() {
  const dispatch = useAppDispatch();
  const { records, loading, error } = useAppSelector((s) => s.productOpeningStock);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

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

  const { data: companies } = useApiQuery("pos-company", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.COMPANY_ID }));
  });

  const { data: camps } = useApiQuery("pos-camp", async () => {
    const res = await fetch(`${API_URL}/camp-master`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({
      ...c,
      CAMP_ID: c.CAMP_ID,
      CAMP_NAME: c.CAMP_NAME,
      COMPANY_ID: c.COMPANY_ID ?? c.Company_Id ?? null,
    }));
  });

  const { data: stores } = useApiQuery("pos-store", async () => {
    const res = await fetch(`${API_URL}/store-master`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({
      ...c,
      STORE_ID: c.Store_Id ?? c.STORE_ID,
      STORE_NAME: c.Store_Name ?? c.STORE_NAME,
      CAMP_ID: c.Camp_Id ?? c.CAMP_ID,
    }));
  });

  const { data: campStoreMappings } = useApiQuery("pos-camp-store-map", async () => {
    const res = await fetch(`${API_URL}/company-camp-store-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return json.data || [];
  });

  const { data: mainCategories } = useApiQuery("pos-main-cat", async () => {
    const res = await fetch(`${API_URL}/product-main-category`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.MAIN_CATEGORY_ID }));
  });

  const { data: subCategories } = useApiQuery("pos-sub-cat", async () => {
    const res = await fetch(`${API_URL}/product-sub-category`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.SUB_CATEGORY_ID }));
  });

  const { data: products } = useApiQuery("pos-product", async () => {
    const res = await fetch(`${API_URL}/product-master`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.PRODUCT_ID }));
  });

  const cascadeMaps = useMemo(() => {
    const companyCamp = new Map<string, Set<string>>();
    const companyCampStore = new Map<string, Set<string>>();

    if (Array.isArray(campStoreMappings)) {
      for (const m of campStoreMappings) {
        if (m.COMPANY_ID == null || m.CAMP_ID == null) continue;
        const ck = String(m.COMPANY_ID);
        const campSet = companyCamp.get(ck) || new Set<string>();
        campSet.add(String(m.CAMP_ID));
        companyCamp.set(ck, campSet);
        if (m.STORE_ID != null) {
          const key = `${ck}#${String(m.CAMP_ID)}`;
          const storeSet = companyCampStore.get(key) || new Set<string>();
          storeSet.add(String(m.STORE_ID));
          companyCampStore.set(key, storeSet);
        }
      }
    }

    return { companyCamp, companyCampStore };
  }, [campStoreMappings]);

  const companyOptions = useMemo(() =>
    (Array.isArray(companies) ? companies : []).map((c: any) => ({ value: String(c.COMPANY_ID), label: c.COMPANY_NAME })),
    [companies]
  );

  const campOptions = useMemo(() => {
    if (!Array.isArray(camps)) return [];
    const selectedCompany = form.COMPANY_ID;
    const ids = selectedCompany ? cascadeMaps.companyCamp.get(String(selectedCompany)) : undefined;
    let list = ids ? camps.filter((c: any) => ids.has(String(c.CAMP_ID))) : [];
    const selected = form.CAMP_ID != null && form.CAMP_ID !== ""
      ? camps.find((c: any) => String(c.CAMP_ID) === String(form.CAMP_ID))
      : undefined;
    if (selected && !list.some((c: any) => String(c.CAMP_ID) === String(selected.CAMP_ID))) {
      list = [...list, selected];
    }
    return list.map((c: any) => ({ value: String(c.CAMP_ID), label: c.CAMP_NAME }));
  }, [camps, cascadeMaps, form.COMPANY_ID, form.CAMP_ID]);

  const storeOptions = useMemo(() => {
    if (!Array.isArray(stores)) return [];
    const selectedCompany = form.COMPANY_ID;
    const selectedCamp = form.CAMP_ID;
    const ids = selectedCompany && selectedCamp
      ? cascadeMaps.companyCampStore.get(`${String(selectedCompany)}#${String(selectedCamp)}`)
      : undefined;
    let list = ids ? stores.filter((s: any) => ids.has(String(s.STORE_ID))) : [];
    const selected = form.STORE_ID != null && form.STORE_ID !== ""
      ? stores.find((s: any) => String(s.STORE_ID) === String(form.STORE_ID))
      : undefined;
    if (selected && !list.some((s: any) => String(s.STORE_ID) === String(selected.STORE_ID))) {
      list = [...list, selected];
    }
    return list.map((s: any) => ({ value: String(s.STORE_ID), label: s.STORE_NAME }));
  }, [stores, cascadeMaps, form.COMPANY_ID, form.CAMP_ID, form.STORE_ID]);

  const mainCatOptions = useMemo(() =>
    (Array.isArray(mainCategories) ? mainCategories : []).map((c: any) => ({ value: String(c.MAIN_CATEGORY_ID), label: c.MAIN_CATEGORY_NAME })),
    [mainCategories]
  );

  const subCatOptions = useMemo(() => {
    if (!Array.isArray(subCategories)) return [];
    const selectedMain = form.MAIN_CATEGORY_ID;
    if (!selectedMain) return [];
    return subCategories
      .filter((s: any) => Number(s.MAIN_CATEGORY_ID) === Number(selectedMain))
      .map((s: any) => ({ value: String(s.SUB_CATEGORY_ID), label: s.SUB_CATEGORY_NAME }));
  }, [subCategories, form.MAIN_CATEGORY_ID]);

  const productOptions = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const mainId = form.MAIN_CATEGORY_ID;
    const subId = form.SUB_CATEGORY_ID;
    return products
      .filter((p: any) =>
        (mainId ? String(p.MAIN_CATEGORY_ID) === String(mainId) : true) &&
        (subId ? String(p.SUB_CATEGORY_ID) === String(subId) : true)
      )
      .map((p: any) => ({ value: String(p.PRODUCT_ID), label: p.PRODUCT_NAME }));
  }, [products, form.MAIN_CATEGORY_ID, form.SUB_CATEGORY_ID]);

  const filtered = useMemo(() => {
    if (!Array.isArray(records)) return [];
    return records.filter((d: any) => {
      const searchable = [d.PRODUCT_NAME, d.COMPANY_NAME, d.STORE_NAME, d.MAIN_CATEGORY_NAME].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => Number(b.SNO) - Number(a.SNO));
  }, [records, search]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  useEffect(() => {
    dispatch(fetchProductOpeningStocks());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearProductOpeningStockError());
    }
  }, [error, dispatch, toast]);

  const emptyForm = () => ({
    OPENING_STOCK_DATE: "",
    COMPANY_ID: "",
    CAMP_ID: "",
    STORE_ID: "",
    MAIN_CATEGORY_ID: "",
    SUB_CATEGORY_ID: "",
    PRODUCT_ID: "",
    QTY: "",
    APPROVED_BY: "",
    REMARKS: "",
    STATUS_MASTER: "ACTIVE",
    USER: "Admin",
    MAC_ADDRESS: "WEB",
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = async (item: any) => {
    setLoadingEdit(true);
    setEditing(item);
    try {
      const response = await dispatch(fetchProductOpeningStockById(Number(item.SNO))).unwrap();
      if (response) {
        let dateVal = "";
        if (response.OPENING_STOCK_DATE) {
          const d = new Date(response.OPENING_STOCK_DATE);
          if (!isNaN(d.getTime())) {
            dateVal = d.toISOString().split("T")[0];
          }
        }
        setForm({
          OPENING_STOCK_DATE: dateVal,
          COMPANY_ID: String(response.COMPANY_ID || ""),
          CAMP_ID: String(response.CAMP_ID || ""),
          STORE_ID: String(response.STORE_ID || ""),
          MAIN_CATEGORY_ID: String(response.MAIN_CATEGORY_ID || ""),
          SUB_CATEGORY_ID: String(response.SUB_CATEGORY_ID || ""),
          PRODUCT_ID: String(response.PRODUCT_ID || ""),
          QTY: response.QTY ?? "",
          APPROVED_BY: response.APPROVED_BY || "",
          REMARKS: response.REMARKS || "",
          STATUS_MASTER: response.STATUS_MASTER === "AC" ? "ACTIVE" : "INACTIVE",
          USER: "Admin",
          MAC_ADDRESS: "WEB",
        });
      }
      setDialogOpen(true);
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error fetching record"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleSave = async () => {
    if (!editing && normalizeStatus(form.STATUS_MASTER) === "INACTIVE") {
      toast({ title: "New records cannot be inactive", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.OPENING_STOCK_DATE) {
      toast({ title: "Opening stock date is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.COMPANY_ID) {
      toast({ title: "Company is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.PRODUCT_ID) {
      toast({ title: "Product is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    try {
      const payload: Record<string, any> = {
        OPENING_STOCK_DATE: form.OPENING_STOCK_DATE,
        COMPANY_ID: form.COMPANY_ID ? Number(form.COMPANY_ID) : null,
        CAMP_ID: form.CAMP_ID ? Number(form.CAMP_ID) : null,
        STORE_ID: form.STORE_ID ? Number(form.STORE_ID) : null,
        MAIN_CATEGORY_ID: form.MAIN_CATEGORY_ID ? Number(form.MAIN_CATEGORY_ID) : null,
        SUB_CATEGORY_ID: form.SUB_CATEGORY_ID ? Number(form.SUB_CATEGORY_ID) : null,
        PRODUCT_ID: form.PRODUCT_ID ? Number(form.PRODUCT_ID) : null,
        QTY: form.QTY !== "" ? Math.max(0, Number(form.QTY) || 0) : null,
        APPROVED_BY: form.APPROVED_BY?.trim() || null,
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_MASTER: form.STATUS_MASTER || "ACTIVE",
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (editing) {
        payload.id = editing.id;
        payload.SNO = Number(editing.id);
        const res = await dispatch(updateProductOpeningStock(payload)).unwrap();
        toast({ title: res?.message ?? "Product opening stock updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addProductOpeningStock(payload)).unwrap();
        toast({ title: res?.message ?? "Product opening stock created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchProductOpeningStocks());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error saving product opening stock"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const userName = typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('user') || '{}').username || "Admin") : "Admin";
      const res = await dispatch(deleteProductOpeningStock({
        id: deleteId,
        USER: userName,
        ROLE: "Admin",
        MAC_ADDRESS: "WEB",
      })).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Product opening stock deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchProductOpeningStocks());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error deleting product opening stock"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (key: string, label: string, type: "text" | "number" | "select" | "textarea" | "date", options?: { value: string; label: string }[], required?: boolean, placeholder?: string, searchable?: boolean) => {
    const baseClass = "flex flex-col gap-1.5";
    const fieldEmpty = required && !form[key];
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : baseClass}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {type === "select" && searchable ? (
          <SearchableSelect
            value={form[key] || ""}
            onChange={(v) => {
              const reset: Record<string, any> = {};
              if (key === "MAIN_CATEGORY_ID") { reset.SUB_CATEGORY_ID = ""; reset.PRODUCT_ID = ""; }
              if (key === "SUB_CATEGORY_ID") { reset.PRODUCT_ID = ""; }
              setForm({ ...form, [key]: v, ...reset });
            }}
            options={options || []}
            placeholder={placeholder || `Select ${label}`}
            disabled={
              key === "SUB_CATEGORY_ID" ? !form.MAIN_CATEGORY_ID :
              key === "PRODUCT_ID" ? !form.SUB_CATEGORY_ID : false
            }
            className={fieldEmpty ? "border-destructive ring-1 ring-destructive/30" : ""}
          />
        ) : type === "select" ? (
          <Select
            value={form[key] || ""}
            onValueChange={(v) => {
              const reset: Record<string, any> = {};
              if (key === "COMPANY_ID") { reset.CAMP_ID = ""; reset.STORE_ID = ""; }
              if (key === "CAMP_ID") { reset.STORE_ID = ""; }
              if (key === "MAIN_CATEGORY_ID") { reset.SUB_CATEGORY_ID = ""; reset.PRODUCT_ID = ""; }
              if (key === "SUB_CATEGORY_ID") { reset.PRODUCT_ID = ""; }
              setForm({ ...form, [key]: v, ...reset });
            }}
          >
            <SelectTrigger className={`h-9 text-xs ${fieldEmpty ? "border-destructive ring-1 ring-destructive/30" : ""}`} disabled={
              key === "CAMP_ID" ? !form.COMPANY_ID :
              key === "STORE_ID" ? !form.CAMP_ID :
              key === "SUB_CATEGORY_ID" ? !form.MAIN_CATEGORY_ID :
              key === "PRODUCT_ID" ? !form.SUB_CATEGORY_ID : false
            }><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={`text-xs ${fieldEmpty ? "border-destructive ring-1 ring-destructive/30" : ""}`} />
        ) : type === "date" ? (
          <DatePicker
            value={form[key] || ""}
            onChange={(v) => setForm({ ...form, [key]: v })}
            placeholder={placeholder}
          />
        ) : (
          <Input
            type={type === "number" ? "number" : "text"}
            value={form[key] ?? ""}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            placeholder={placeholder}
            className={`h-9 text-xs ${fieldEmpty ? "border-destructive ring-1 ring-destructive/30" : ""}`}
            step={type === "number" ? "any" : undefined}
            {...(type === "number" ? { min: "0" } : {})}
          />
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Opening Stock</h1>
          <p className="text-sm text-muted-foreground">Manage product opening stock data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Opening Stock
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search records..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Date</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Camp</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Store</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Main Category</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Sub Category</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Product</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Qty</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Approved By</th>
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
                    <td className="p-3 font-medium">{item.SNO || "-"}</td>
                    <td className="p-3">{formatDate(item.OPENING_STOCK_DATE)}</td>
                    <td className="p-3 font-medium">{item.COMPANY_NAME}</td>
                    <td className="p-3">{item.CAMP_NAME}</td>
                    <td className="p-3">{item.STORE_NAME}</td>
                    <td className="p-3">{item.MAIN_CATEGORY_NAME}</td>
                    <td className="p-3">{item.SUB_CATEGORY_NAME}</td>
                    <td className="p-3">{item.PRODUCT_NAME}</td>
                    <td className="p-3">{item.QTY != null ? Number(item.QTY).toFixed(2) : "-"}</td>
                    <td className="p-3">{item.APPROVED_BY || "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${String(item.STATUS_MASTER).toLowerCase() === "active" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {(String(item.STATUS_MASTER).toLowerCase() === "active") ? "Active" : "Inactive"}
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product Opening Stock" : "Add Product Opening Stock"}</DialogTitle>
          </DialogHeader>
          {loadingEdit ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Stock Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("OPENING_STOCK_DATE", "Opening Stock Date", "date", undefined, true)}
                {renderField("APPROVED_BY", "Approved By", "text", undefined, false, "e.g., Manager Name")}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Location</h3>
              <div className="grid grid-cols-3 gap-4">
                {renderField("COMPANY_ID", "Company", "select", companyOptions, true, "Select company")}
                {renderField("CAMP_ID", "Camp", "select", campOptions, false, "Select camp")}
                {renderField("STORE_ID", "Store", "select", storeOptions, false, "Select store")}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Product</h3>
              <div className="grid grid-cols-3 gap-4">
                {renderField("MAIN_CATEGORY_ID", "Main Category", "select", mainCatOptions, true, "Select main category", true)}
                {renderField("SUB_CATEGORY_ID", "Sub Category", "select", subCatOptions, false, "Select sub category", true)}
                {renderField("PRODUCT_ID", "Product", "select", productOptions, true, "Select product", true)}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Quantity & Status</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("QTY", "Quantity", "number", undefined, false, "e.g., 100.00")}
                {renderField("STATUS_MASTER", "Status", "select", [{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }], false)}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Notes</h3>
              <div className="grid grid-cols-1 gap-4">
                {renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-xs">Cancel</Button>
              <Button onClick={handleSave} className={`${editing ? "bg-info text-info-foreground hover:bg-info/90" : "bg-primary text-primary-foreground hover:bg-primary/90"} text-xs`}>{editing ? "Update" : "Create"}</Button>
            </div>
          </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this product opening stock record.</AlertDialogDescription>
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
