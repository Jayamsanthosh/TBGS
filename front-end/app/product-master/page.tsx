"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchProducts, fetchProductById, addProduct, updateProduct, deleteProduct, clearProductError, ProductGridData } from "@/lib/productMasterSlice";
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

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

export default function ProductMasterPage() {
  const dispatch = useAppDispatch();
  const { products, loading, error } = useAppSelector((s) => s.product);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
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

  const { data: mainCategories } = useApiQuery("prod-main-cat", async () => {
    const res = await fetch(`${API_URL}/product-main-category`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.MAIN_CATEGORY_ID }));
  });

  const { data: subCategories } = useApiQuery("prod-sub-cat", async () => {
    const res = await fetch(`${API_URL}/product-sub-category`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.SUB_CATEGORY_ID }));
  });

  const { data: uoms } = useApiQuery("prod-uom", async () => {
    const res = await fetch(`${API_URL}/uom-master`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.UOM_ID }));
  });

  const { data: companies } = useApiQuery("prod-company", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.COMPANY_ID }));
  });

  const { data: costCentres } = useApiQuery("prod-cost-centre", async () => {
    const res = await fetch(`${API_URL}/cost-centre-master`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.COST_CENTRE_ID }));
  });

  const { data: trucks } = useApiQuery("prod-truck", async () => {
    const res = await fetch(`${API_URL}/truck-master`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.TRUCK_ID }));
  });

  const mainCatOptions = useMemo(() =>
    (Array.isArray(mainCategories) ? mainCategories : []).map((c: any) => ({ value: String(c.MAIN_CATEGORY_ID), label: c.MAIN_CATEGORY_NAME })),
    [mainCategories]
  );

  const subCatOptions = useMemo(() => {
    if (!Array.isArray(subCategories)) return [];
    const selectedMain = form.MAIN_CATEGORY_ID;
    if (!selectedMain) return [];
    const filtered = subCategories.filter((s: any) => Number(s.MAIN_CATEGORY_ID) === Number(selectedMain));
    return filtered.map((s: any) => ({ value: String(s.SUB_CATEGORY_ID), label: s.SUB_CATEGORY_NAME }));
  }, [subCategories, form.MAIN_CATEGORY_ID]);

  const uomOptions = useMemo(() =>
    (Array.isArray(uoms) ? uoms : []).map((u: any) => ({ value: String(u.UOM_ID), label: u.UOM_NAME || u.UOM_Short_Name || `UOM #${u.UOM_ID}` })),
    [uoms]
  );

  const companyOptions = useMemo(() =>
    (Array.isArray(companies) ? companies : []).map((c: any) => ({ value: String(c.COMPANY_ID), label: c.COMPANY_NAME })),
    [companies]
  );

  const costCentreOptions = useMemo(() => {
    if (!Array.isArray(costCentres)) return [];
    const selectedCompany = form.COMPANY_ID;
    const filtered = selectedCompany ? costCentres.filter((c: any) => Number(c.COMPANY_ID) === Number(selectedCompany)) : costCentres;
    return filtered.map((c: any) => ({ value: String(c.COST_CENTRE_ID), label: c.COST_CENTRE_NAME }));
  }, [costCentres, form.COMPANY_ID]);

  const truckOptions = useMemo(() =>
    (Array.isArray(trucks) ? trucks : []).map((t: any) => ({ value: String(t.TRUCK_ID), label: t.TRUCK_NO || `Truck #${t.TRUCK_ID}` })),
    [trucks]
  );

  const enrichedData = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.map((p: any) => {
      const mainCat = Array.isArray(mainCategories) ? mainCategories.find((c: any) => Number(c.MAIN_CATEGORY_ID) === Number(p.MAIN_CATEGORY_ID)) : undefined;
      const subCat = Array.isArray(subCategories) ? subCategories.find((s: any) => Number(s.SUB_CATEGORY_ID) === Number(p.SUB_CATEGORY_ID)) : undefined;
      const uom = Array.isArray(uoms) ? uoms.find((u: any) => Number(u.UOM_ID) === Number(p.UOM_ID)) : undefined;
      const altUom = Array.isArray(uoms) ? uoms.find((u: any) => Number(u.UOM_ID) === Number(p.ALTERNATE_UOM_ID)) : undefined;
      const company = Array.isArray(companies) ? companies.find((c: any) => Number(c.COMPANY_ID) === Number(p.COMPANY_ID)) : undefined;
      const costCentre = Array.isArray(costCentres) ? costCentres.find((c: any) => Number(c.COST_CENTRE_ID) === Number(p.COST_CENTRE_ID)) : undefined;
      const truck = Array.isArray(trucks) ? trucks.find((t: any) => Number(t.TRUCK_ID) === Number(p.TRUCK_ID)) : undefined;
      return {
        ...p,
        id: p.PRODUCT_ID,
        MAIN_CATEGORY_NAME: mainCat?.MAIN_CATEGORY_NAME || `ID: ${p.MAIN_CATEGORY_ID}`,
        SUB_CATEGORY_NAME: subCat?.SUB_CATEGORY_NAME || `ID: ${p.SUB_CATEGORY_ID}`,
        UOM_NAME: uom?.UOM_NAME || uom?.UOM_Short_Name || `ID: ${p.UOM_ID}`,
        ALTERNATE_UOM_NAME: altUom?.UOM_NAME || altUom?.UOM_Short_Name || `ID: ${p.ALTERNATE_UOM_ID}`,
        COMPANY_NAME: company?.COMPANY_NAME || `ID: ${p.COMPANY_ID}`,
        COST_CENTRE_NAME: costCentre?.COST_CENTRE_NAME || `ID: ${p.COST_CENTRE_ID}`,
        TRUCK_NAME: p.TRUCK_ID ? (truck?.TRUCK_NO || `ID: ${p.TRUCK_ID}`) : null,
      };
    });
  }, [products, mainCategories, subCategories, uoms, companies, costCentres, trucks]);

  const uniqueStatuses = useMemo(() => {
    if (!Array.isArray(enrichedData)) return [];
    const set = new Set<string>();
    enrichedData.forEach((d: any) => {
      const s = d.STATUS_MASTER;
      if (s) set.add(String(s));
    });
    return Array.from(set);
  }, [enrichedData]);

  const filtered = useMemo(() => {
    if (!Array.isArray(enrichedData)) return [];
    return enrichedData.filter((d: any) => {
      const matchesStatus = statusFilter === "ALL" || normalizeStatus(d.STATUS_MASTER) === statusFilter;
      if (!matchesStatus) return false;
      const searchable = [d.PRODUCT_NAME, d.MAIN_CATEGORY_NAME, d.SUB_CATEGORY_NAME, d.COMPANY_NAME].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => Number(b.id || b.PRODUCT_ID) - Number(a.id || a.PRODUCT_ID));
  }, [enrichedData, search, statusFilter]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearProductError());
    }
  }, [error, dispatch, toast]);

  const emptyForm = () => ({
    PRODUCT_NAME: "",
    TBS_PRODUCT_NAME: "",
    MAIN_CATEGORY_ID: "",
    SUB_CATEGORY_ID: "",
    UOM_ID: "",
    NO_OF_PCS_PER_PACKING: "",
    ALTERNATE_UOM_ID: "",
    COMPANY_ID: "",
    COST_CENTRE_ID: "",
    TRUCK_ID: "",
    PRODUCTION_COST: "",
    VAT_PERCENTAGE: "",
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
    setEditing(item);
    const detail = item && item.id != null
      ? await dispatch(fetchProductById(Number(item.id))).unwrap().catch(() => null)
      : null;
    const src: any = detail ? detail : item;
    setForm({
      PRODUCT_NAME: src.PRODUCT_NAME || "",
      TBS_PRODUCT_NAME: src.TBS_PRODUCT_NAME || "",
      MAIN_CATEGORY_ID: String(src.MAIN_CATEGORY_ID || ""),
      SUB_CATEGORY_ID: String(src.SUB_CATEGORY_ID || ""),
      UOM_ID: String(src.UOM_ID || ""),
      NO_OF_PCS_PER_PACKING: src.NO_OF_PCS_PER_PACKING ?? "",
      ALTERNATE_UOM_ID: String(src.ALTERNATE_UOM_ID || ""),
      COMPANY_ID: String(src.COMPANY_ID || ""),
      COST_CENTRE_ID: String(src.COST_CENTRE_ID || ""),
      TRUCK_ID: src.TRUCK_ID ? String(src.TRUCK_ID) : "",
      PRODUCTION_COST: src.PRODUCTION_COST ?? "",
      VAT_PERCENTAGE: src.VAT_PERCENTAGE ?? "",
      REMARKS: src.REMARKS || "",
      STATUS_MASTER: src.STATUS_MASTER || "ACTIVE",
      USER: "Admin",
      MAC_ADDRESS: "WEB",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.PRODUCT_NAME?.trim()) {
      toast({ title: "Product Name is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.MAIN_CATEGORY_ID) {
      toast({ title: "Main Category is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.UOM_ID) {
      toast({ title: "UOM is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.COMPANY_ID) {
      toast({ title: "Company is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    if (!editing && normalizeStatus(form.STATUS_MASTER) === "INACTIVE") {
      toast({ title: "New product cannot be set to Inactive", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    try {
      const payload: Record<string, any> = {
        PRODUCT_NAME: form.PRODUCT_NAME?.trim(),
        TBS_PRODUCT_NAME: form.TBS_PRODUCT_NAME?.trim() || null,
        MAIN_CATEGORY_ID: form.MAIN_CATEGORY_ID ? Number(form.MAIN_CATEGORY_ID) : null,
        SUB_CATEGORY_ID: form.SUB_CATEGORY_ID ? Number(form.SUB_CATEGORY_ID) : null,
        UOM_ID: form.UOM_ID ? Number(form.UOM_ID) : null,
        NO_OF_PCS_PER_PACKING: form.NO_OF_PCS_PER_PACKING !== "" ? Math.max(0, Number(form.NO_OF_PCS_PER_PACKING) || 0) : null,
        ALTERNATE_UOM_ID: form.ALTERNATE_UOM_ID ? Number(form.ALTERNATE_UOM_ID) : null,
        COMPANY_ID: form.COMPANY_ID ? Number(form.COMPANY_ID) : null,
        COST_CENTRE_ID: form.COST_CENTRE_ID ? Number(form.COST_CENTRE_ID) : null,
        TRUCK_ID: form.TRUCK_ID ? Number(form.TRUCK_ID) : null,
        PRODUCTION_COST: form.PRODUCTION_COST !== "" ? Math.max(0, Number(form.PRODUCTION_COST) || 0) : null,
        VAT_PERCENTAGE: form.VAT_PERCENTAGE !== "" ? Math.max(0, Number(form.VAT_PERCENTAGE) || 0) : null,
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_MASTER: form.STATUS_MASTER || "ACTIVE",
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (editing) {
        payload.id = editing.id;
        payload.PRODUCT_ID = Number(editing.id);
        const res = await dispatch(updateProduct(payload)).unwrap();
        toast({ title: res?.message ?? "Product updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addProduct(payload)).unwrap();
        toast({ title: res?.message ?? "Product created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchProducts());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error saving product"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteProduct(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Product deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchProducts());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error deleting product"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (key: string, label: string, type: "text" | "number" | "select" | "textarea", options?: { value: string; label: string }[], required?: boolean, placeholder?: string, searchable?: boolean) => {
    const baseClass = "flex flex-col gap-1.5";
    const fieldEmpty = required && !form[key];
    const borderClass = fieldEmpty ? "border-destructive ring-1 ring-destructive/30" : "";
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : baseClass}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {type === "select" && searchable ? (
          <SearchableSelect
            value={form[key] || ""}
            onChange={(v) => setForm({ ...form, [key]: v, ...(key === "MAIN_CATEGORY_ID" ? { SUB_CATEGORY_ID: "" } : {}) })}
            options={options || []}
            placeholder={placeholder || `Select ${label}`}
            disabled={key === "SUB_CATEGORY_ID" ? !form.MAIN_CATEGORY_ID : false}
            className={borderClass}
          />
        ) : type === "select" ? (
          <Select value={form[key] || ""} onValueChange={(v) => setForm({ ...form, [key]: v, ...(key === "MAIN_CATEGORY_ID" ? { SUB_CATEGORY_ID: "" } : {}), ...(key === "COMPANY_ID" ? { COST_CENTRE_ID: "" } : {}) })}>
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
          <Input
            type={type === "number" ? "number" : "text"}
            min={type === "number" ? "0" : undefined}
            value={form[key] ?? ""}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            placeholder={placeholder}
            className={`h-9 text-xs ${borderClass}`}
            step={type === "number" ? "0.01" : undefined}
          />
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Master</h1>
          <p className="text-sm text-muted-foreground">Manage product master data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
            {uniqueStatuses.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Filter Status:</span>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-35 h-9 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    {uniqueStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Product Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Main Category</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Sub Category</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">UOM</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">PCS/Pack</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Truck</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Cost Centre</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Prod Cost</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">VAT%</th>
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
                    <td className="p-3 font-medium">{item.PRODUCT_NAME}</td>
                    <td className="p-3">{item.MAIN_CATEGORY_NAME}</td>
                    <td className="p-3">{item.SUB_CATEGORY_NAME}</td>
                    <td className="p-3">{item.UOM_NAME}</td>
                    <td className="p-3">{item.NO_OF_PCS_PER_PACKING ?? "-"}</td>
                    <td className="p-3">{item.COMPANY_NAME}</td>
                    <td className="p-3">{item.TRUCK_NAME || "-"}</td>
                    <td className="p-3">{item.COST_CENTRE_NAME}</td>
                    <td className="p-3">{item.PRODUCTION_COST != null ? Number(item.PRODUCTION_COST).toFixed(2) : "-"}</td>
                    <td className="p-3">{item.VAT_PERCENTAGE != null ? `${Number(item.VAT_PERCENTAGE).toFixed(2)}%` : "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={12} className="p-8 text-center text-muted-foreground">No products found</td></tr>
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
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Product Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("PRODUCT_NAME", "Product Name", "text", undefined, true, "e.g., Fresh Milk")}
                {renderField("TBS_PRODUCT_NAME", "TBS Product Name", "text", undefined, false, "e.g., TBS Fresh Milk")}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Category</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("MAIN_CATEGORY_ID", "Main Category", "select", mainCatOptions, true, "Select main category", true)}
                {renderField("SUB_CATEGORY_ID", "Sub Category", "select", subCatOptions, false, "Select sub category", true)}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">UOM & Packing</h3>
              <div className="grid grid-cols-3 gap-4">
                {renderField("UOM_ID", "UOM", "select", uomOptions, true, "Select UOM")}
                {renderField("NO_OF_PCS_PER_PACKING", "PCS per Packing", "number", undefined, false, "e.g., 12")}
                {renderField("ALTERNATE_UOM_ID", "Alternate UOM", "select", uomOptions, false, "Select alt UOM")}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Company & Cost Centre</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("COMPANY_ID", "Company", "select", companyOptions, true, "Select company")}
                {renderField("COST_CENTRE_ID", "Cost Centre", "select", costCentreOptions, false, "Select cost centre")}
                <div className="col-span-2">{renderField("TRUCK_ID", "Truck", "select", truckOptions, false, "Select truck (optional)", true)}</div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("PRODUCTION_COST", "Production Cost", "number", undefined, false, "e.g., 150.00")}
                {renderField("VAT_PERCENTAGE", "VAT %", "number", undefined, false, "e.g., 18.00")}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Status</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("STATUS_MASTER", "Status", "select", [{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }], false)}
                <div className="col-span-2">{renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}</div>
              </div>
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
            <AlertDialogDescription>This will permanently delete this product.</AlertDialogDescription>
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
