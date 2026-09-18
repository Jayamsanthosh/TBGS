"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchGunMasters, fetchGunMasterById, addGunMaster, updateGunMaster, deleteGunMaster, clearGunMasterError, type GunMasterGridData } from "@/lib/gunMasterSlice";
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
  CAMP_ID?: string;
}

export default function GunMasterPage() {
  const dispatch = useAppDispatch();
  const { guns, loading, error } = useAppSelector((s) => s.gunMaster);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AC");
  const [gunCategoryFilter, setGunCategoryFilter] = useState("");
  const [gunTypeFilter, setGunTypeFilter] = useState("");
  const [gunBrandFilter, setGunBrandFilter] = useState("");
  const [caliberFilter, setCaliberFilter] = useState("");
  const [campFilter, setCampFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [gunCategories, setGunCategories] = useState<DropdownItem[]>([]);
  const [gunTypes, setGunTypes] = useState<DropdownItem[]>([]);
  const [gunBrands, setGunBrands] = useState<DropdownItem[]>([]);
  const [calibers, setCalibers] = useState<DropdownItem[]>([]);
  const [camps, setCamps] = useState<DropdownItem[]>([]);
  const [stores, setStores] = useState<DropdownItem[]>([]);

  const storeOptions = useMemo(() => {
    if (!form.CAMP_ID) return [];
    return (stores || []).filter((s) => s.CAMP_ID === String(form.CAMP_ID));
  }, [stores, form.CAMP_ID]);

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

  const filterParams = useMemo(() => ({
    status: statusFilter,
    gunCategoryId: gunCategoryFilter,
    gunTypeId: gunTypeFilter,
    gunBrandId: gunBrandFilter,
    caliberId: caliberFilter,
    campId: campFilter,
    storeId: storeFilter,
  }), [statusFilter, gunCategoryFilter, gunTypeFilter, gunBrandFilter, caliberFilter, campFilter, storeFilter]);

  const fetchDropdowns = useCallback(async () => {
    const fetches = [
      fetch(`${API_URL}/gun-category-master`).then(r => r.json()).then(d => setGunCategories((d.data || []).map((x: any) => ({ value: String(x.GUN_CATEGORY_ID || x.id), label: x.GUN_CATEGORY_NAME || x.CATEGORY_NAME })))).catch(() => {}),
      fetch(`${API_URL}/gun-type-master`).then(r => r.json()).then(d => setGunTypes((d.data || []).map((x: any) => ({ value: String(x.GUN_TYPE_ID || x.id), label: x.TYPE_NAME || x.GUN_TYPE_NAME })))).catch(() => {}),
      fetch(`${API_URL}/gun-brand-master`).then(r => r.json()).then(d => setGunBrands((d.data || []).map((x: any) => ({ value: String(x.GUN_BRAND_ID || x.id), label: x.BRAND_NAME })))).catch(() => {}),
      fetch(`${API_URL}/caliber-master`).then(r => r.json()).then(d => setCalibers((d.data || []).map((x: any) => ({ value: String(x.CALIBER_ID || x.id), label: x.CALIBER_NAME })))).catch(() => {}),
      fetch(`${API_URL}/camp-master`).then(r => r.json()).then(d => setCamps((d.data || []).map((x: any) => ({ value: String(x.CAMP_ID || x.id), label: x.CAMP_NAME })))).catch(() => {}),
      fetch(`${API_URL}/store-master`).then(r => r.json()).then(d => setStores((d.data || []).map((x: any) => ({
        value: String(x.Store_Id ?? x.STORE_ID ?? x.id),
        label: x.Store_Name ?? x.STORE_NAME,
        CAMP_ID: String(x.Camp_Id ?? x.CAMP_ID ?? ""),
      })))).catch(() => {}),
    ];
    await Promise.all(fetches);
  }, []);

  useEffect(() => {
    dispatch(fetchGunMasters(filterParams));
  }, [dispatch, filterParams]);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearGunMasterError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    if (!Array.isArray(guns)) return [];
    return guns.filter((d: any) => {
      const searchable = [d.GUN_CODE, d.GUN_NAME, d.GUN_CATEGORY_NAME, d.TYPE_NAME, d.BRAND_Name, d.CALIBER_NAME, d.MODEL, d.SERIAL_NUMBER, d.LICENSE_NUMBER, d.CAMP_NAME, d.STORE_name].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => Number(b.GUN_ID) - Number(a.GUN_ID));
  }, [guns, search]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  const emptyForm = () => ({
    GUN_CODE: "",
    GUN_NAME: "",
    GUN_CATEGORY_ID: "",
    GUN_TYPE_ID: "",
    GUN_BRAND_ID: "",
    CALIBER_ID: "",
    CAMP_ID: "",
    STORE_ID: "",
    MODEL: "",
    SERIAL_NUMBER: "",
    BARREL_LENGTH: "",
    MAGAZINE_CAPACITY: "",
    LICENSE_NUMBER: "",
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
    setLoadingEdit(true);
    setDialogOpen(true);
    try {
      const id = Number(item.id || item.GUN_ID);
      const resultAction = await dispatch(fetchGunMasterById(id));
      if (fetchGunMasterById.fulfilled.match(resultAction)) {
        const raw = resultAction.payload;
        setEditing(item);
        setForm({
          GUN_CODE: raw.GUN_CODE || "",
          GUN_NAME: raw.GUN_NAME || "",
          GUN_CATEGORY_ID: String(raw.GUN_CATEGORY_ID || ""),
          GUN_TYPE_ID: String(raw.GUN_TYPE_ID || ""),
          GUN_BRAND_ID: String(raw.GUN_BRAND_ID || ""),
          CALIBER_ID: String(raw.CALIBER_ID || ""),
          CAMP_ID: String(raw.CAMP_ID || ""),
          STORE_ID: String(raw.STORE_ID || ""),
          MODEL: raw.MODEL || "",
          SERIAL_NUMBER: raw.SERIAL_NUMBER || "",
          BARREL_LENGTH: raw.BARREL_LENGTH ?? "",
          MAGAZINE_CAPACITY: raw.MAGAZINE_CAPACITY ?? "",
          LICENSE_NUMBER: raw.LICENSE_NUMBER || "",
          REMARKS: raw.REMARKS || "",
          STATUS_MASTER: raw.STATUS_MASTER || "AC",
          USER: "Admin",
          MAC_ADDRESS: "WEB",
        });
      } else {
         toast({ title: "Failed to load gun details", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
        setDialogOpen(false);
      }
    } catch (e: any) {
      toast({ title: "Error loading gun details", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      setDialogOpen(false);
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleSave = async () => {
    if (!form.GUN_NAME?.trim()) {
      toast({ title: "Gun name is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!editing && normalizeStatus(form.STATUS_MASTER) !== "ACTIVE") {
      toast({ title: "New gun cannot be set to Inactive", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    try {
      const payload: Record<string, any> = {
        GUN_CODE: form.GUN_CODE?.trim() || null,
        GUN_NAME: form.GUN_NAME.trim(),
        GUN_CATEGORY_ID: form.GUN_CATEGORY_ID ? Number(form.GUN_CATEGORY_ID) : null,
        GUN_TYPE_ID: form.GUN_TYPE_ID ? Number(form.GUN_TYPE_ID) : null,
        GUN_BRAND_ID: form.GUN_BRAND_ID ? Number(form.GUN_BRAND_ID) : null,
        CALIBER_ID: form.CALIBER_ID ? Number(form.CALIBER_ID) : null,
        CAMP_ID: form.CAMP_ID ? Number(form.CAMP_ID) : null,
        STORE_ID: form.STORE_ID ? Number(form.STORE_ID) : null,
        MODEL: form.MODEL?.trim() || null,
        SERIAL_NUMBER: form.SERIAL_NUMBER?.trim() || null,
        BARREL_LENGTH: form.BARREL_LENGTH ? Math.max(0, Number(form.BARREL_LENGTH) || 0) : null,
        MAGAZINE_CAPACITY: form.MAGAZINE_CAPACITY ? Math.max(0, Number(form.MAGAZINE_CAPACITY) || 0) : null,
        LICENSE_NUMBER: form.LICENSE_NUMBER?.trim() || null,
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_MASTER: form.STATUS_MASTER,
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (editing) {
        payload.GUN_ID = Number(editing.id);
        const res = await dispatch(updateGunMaster(payload as GunMasterGridData)).unwrap();
        toast({ title: res?.message ?? "Gun updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addGunMaster(payload as GunMasterGridData)).unwrap();
        toast({ title: res?.message ?? "Gun created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchGunMasters(filterParams));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error saving gun"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteGunMaster(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Gun deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchGunMasters(filterParams));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error deleting gun"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (key: string, label: string, type: "text" | "number" | "select" | "textarea", options?: DropdownItem[], required?: boolean, placeholder?: string, maxLength?: number, disabled?: boolean) => {
    const reqClass = required && !String(form[key] ?? "").trim() ? " border-destructive ring-1 ring-destructive/30" : "";
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : ""}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {type === "select" ? (
          <Select value={form[key] || ""} onValueChange={(v) => {
            const reset: Record<string, any> = {};
            if (key === "CAMP_ID") reset.STORE_ID = "";
            setForm({ ...form, [key]: v, ...reset });
          }}>
            <SelectTrigger className={`h-9 text-xs${reqClass}`} disabled={disabled}><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={`text-xs${reqClass}`} />
        ) : (
          <Input
            type={type === "number" ? "number" : "text"}
            value={form[key] ?? ""}
            onChange={(e) => setForm({ ...form, [key]: type === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value })}
            placeholder={placeholder}
            className={`h-9 text-xs${reqClass}`}
            maxLength={maxLength}
            {...(type === "number" ? { min: "0", step: "any" } : {})}
          />
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gun Master</h1>
          <p className="text-sm text-muted-foreground">Manage gun master data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Gun
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search guns..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">Category</Label>
              <Select value={gunCategoryFilter} onValueChange={(v) => { setGunCategoryFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {gunCategories.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Type</Label>
              <Select value={gunTypeFilter} onValueChange={(v) => { setGunTypeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {gunTypes.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Brand</Label>
              <Select value={gunBrandFilter} onValueChange={(v) => { setGunBrandFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {gunBrands.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Caliber</Label>
              <Select value={caliberFilter} onValueChange={(v) => { setCaliberFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {calibers.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Camp</Label>
              <Select value={campFilter} onValueChange={(v) => { setCampFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {camps.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Store</Label>
              <Select value={storeFilter} onValueChange={(v) => { setStoreFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {stores.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Code</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Category</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Type</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Brand</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Caliber</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Model</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Serial No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Camp</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Store</th>
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
                    <td className="p-3 font-medium">{item.GUN_ID}</td>
                    <td className="p-3">{item.GUN_CODE || "-"}</td>
                    <td className="p-3">{item.GUN_NAME}</td>
                    <td className="p-3">{item.GUN_CATEGORY_NAME || "-"}</td>
                    <td className="p-3">{item.TYPE_NAME || "-"}</td>
                    <td className="p-3">{item.BRAND_Name || "-"}</td>
                    <td className="p-3">{item.CALIBER_NAME || "-"}</td>
                    <td className="p-3">{item.MODEL || "-"}</td>
                    <td className="p-3">{item.SERIAL_NUMBER || "-"}</td>
                    <td className="p-3">{item.CAMP_NAME || "-"}</td>
                    <td className="p-3">{item.STORE_name || "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={13} className="p-8 text-center text-muted-foreground">No records found</td></tr>
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

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setDialogOpen(false); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{loadingEdit ? "Loading..." : (editing ? "Edit Gun" : "Add Gun")}</DialogTitle>
          </DialogHeader>
          {loadingEdit ? (
            <div className="space-y-4 p-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Basic Information</Label>
                  <div className="h-px bg-border mt-1" />
                </div>
                {renderField("GUN_CODE", "Gun Code", "text", undefined, false, "e.g., GUN-001", 30)}
                {renderField("GUN_NAME", "Gun Name", "text", undefined, true, "e.g., Winchester Model 70", 100)}
                {renderField("MODEL", "Model", "text", undefined, false, "e.g., Model 70", 100)}
                {renderField("SERIAL_NUMBER", "Serial Number", "text", undefined, false, "Enter serial number", 100)}

                <div className="col-span-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Classification</Label>
                  <div className="h-px bg-border mt-1" />
                </div>
                {renderField("GUN_CATEGORY_ID", "Gun Category", "select", gunCategories, false, "Select Category")}
                {renderField("GUN_TYPE_ID", "Gun Type", "select", gunTypes, false, "Select Type")}
                {renderField("GUN_BRAND_ID", "Gun Brand", "select", gunBrands, false, "Select Brand")}
                {renderField("CALIBER_ID", "Caliber", "select", calibers, false, "Select Caliber")}

                <div className="col-span-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Assignment</Label>
                  <div className="h-px bg-border mt-1" />
                </div>
                {renderField("CAMP_ID", "Camp", "select", camps, false, "Select Camp", undefined, false)}
                {renderField("STORE_ID", "Store", "select", storeOptions, false, "Select Store", undefined, !form.CAMP_ID)}

                <div className="col-span-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Technical Details</Label>
                  <div className="h-px bg-border mt-1" />
                </div>
                {renderField("BARREL_LENGTH", "Barrel Length", "number", undefined, false, "e.g., 24.5")}
                {renderField("MAGAZINE_CAPACITY", "Magazine Capacity", "number", undefined, false, "e.g., 5")}
                {renderField("LICENSE_NUMBER", "License Number", "text", undefined, false, "Enter license number", 100)}

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
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this gun record.</AlertDialogDescription>
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
