"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchBulletMasters, fetchBulletMasterById, addBulletMaster, updateBulletMaster, deleteBulletMaster, clearBulletMasterError, type BulletMasterGridData } from "@/lib/bulletMasterSlice";
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

interface DropdownItem {
  value: string;
  label: string;
}

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

export default function BulletMasterPage() {
  const dispatch = useAppDispatch();
  const { bullets, loading, error } = useAppSelector((s) => s.bulletMaster);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AC");
  const [ammunitionBrandFilter, setAmmunitionBrandFilter] = useState("");
  const [caliberFilter, setCaliberFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [bulletTypes, setBulletTypes] = useState<DropdownItem[]>([]);
  const [ammunitionBrands, setAmmunitionBrands] = useState<DropdownItem[]>([]);
  const [calibers, setCalibers] = useState<DropdownItem[]>([]);

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
    ammunitionBrandId: ammunitionBrandFilter,
    caliberId: caliberFilter,
  }), [statusFilter, ammunitionBrandFilter, caliberFilter]);

  const fetchDropdowns = useCallback(async () => {
    const fetches = [
      fetch(`${API_URL}/bullet-type-master`).then(r => r.json()).then(d => setBulletTypes((d.data || []).map((x: any) => ({ value: String(x.BULLET_TYPE_ID || x.id), label: x.BULLET_TYPE_NAME })))).catch(() => {}),
      fetch(`${API_URL}/ammunition-brand-master`).then(r => r.json()).then(d => setAmmunitionBrands((d.data || []).map((x: any) => ({ value: String(x.AMMUNITION_BRAND_ID || x.id), label: x.BRAND_NAME })))).catch(() => {}),
      fetch(`${API_URL}/caliber-master`).then(r => r.json()).then(d => setCalibers((d.data || []).map((x: any) => ({ value: String(x.CALIBER_ID || x.id), label: x.CALIBER_NAME })))).catch(() => {}),
    ];
    await Promise.all(fetches);
  }, []);

  useEffect(() => {
    dispatch(fetchBulletMasters(filterParams));
  }, [dispatch, filterParams]);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearBulletMasterError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    if (!Array.isArray(bullets)) return [];
    return bullets.filter((d: any) => {
      const searchable = [d.BULLET_CODE, d.BULLET_NAME, d.BRAND_NAME, d.CALIBER_NAME, d.GRAIN_WEIGHT, d.REMARKS].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => (b.BULLET_ID ?? b.id ?? 0) - (a.BULLET_ID ?? a.id ?? 0));
  }, [bullets, search]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  const emptyForm = () => ({
    BULLET_CODE: "",
    BULLET_NAME: "",
    BULLET_TYPE_ID: "",
    AMMUNITION_BRAND_ID: "",
    CALIBER_ID: "",
    GRAIN_WEIGHT: "",
    PACK_SIZE: "",
    ROUNDS_PER_BOX: "",
    REORDER_LEVEL: "",
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
      const id = Number(item.id || item.BULLET_ID);
      const resultAction = await dispatch(fetchBulletMasterById(id));
      if (fetchBulletMasterById.fulfilled.match(resultAction)) {
        const raw = resultAction.payload;
        setEditing(item);
        setForm({
          BULLET_CODE: raw.BULLET_CODE || "",
          BULLET_NAME: raw.BULLET_NAME || "",
          BULLET_TYPE_ID: String(raw.BULLET_TYPE_ID || ""),
          AMMUNITION_BRAND_ID: String(raw.AMMUNITION_BRAND_ID || ""),
          CALIBER_ID: String(raw.CALIBER_ID || ""),
          GRAIN_WEIGHT: raw.GRAIN_WEIGHT ?? "",
          PACK_SIZE: raw.PACK_SIZE ?? "",
          ROUNDS_PER_BOX: raw.ROUNDS_PER_BOX ?? "",
          REORDER_LEVEL: raw.REORDER_LEVEL ?? "",
          REMARKS: raw.REMARKS || "",
          STATUS_MASTER: raw.STATUS_MASTER || "AC",
          USER: "Admin",
          MAC_ADDRESS: "WEB",
        });
      } else {
        toast({ title: "Failed to load bullet details", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
        setDialogOpen(false);
      }
    } catch (e: any) {
      toast({ title: "Error loading bullet details", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      setDialogOpen(false);
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleSave = async () => {
    if (!form.BULLET_NAME?.trim()) {
      toast({ title: "Bullet name is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    try {
      const payload: Record<string, any> = {
        BULLET_CODE: form.BULLET_CODE?.trim() || null,
        BULLET_NAME: form.BULLET_NAME.trim(),
        BULLET_TYPE_ID: form.BULLET_TYPE_ID ? Number(form.BULLET_TYPE_ID) : null,
        AMMUNITION_BRAND_ID: form.AMMUNITION_BRAND_ID ? Number(form.AMMUNITION_BRAND_ID) : null,
        CALIBER_ID: form.CALIBER_ID ? Number(form.CALIBER_ID) : null,
        GRAIN_WEIGHT: form.GRAIN_WEIGHT ? Math.max(0, Number(form.GRAIN_WEIGHT) || 0) : null,
        PACK_SIZE: form.PACK_SIZE ? Math.max(0, Number(form.PACK_SIZE) || 0) : null,
        ROUNDS_PER_BOX: form.ROUNDS_PER_BOX ? Math.max(0, Number(form.ROUNDS_PER_BOX) || 0) : null,
        REORDER_LEVEL: form.REORDER_LEVEL ? Math.max(0, Number(form.REORDER_LEVEL) || 0) : null,
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_MASTER: "AC",
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (editing) {
        payload.BULLET_ID = Number(editing.id);
        const res = await dispatch(updateBulletMaster(payload as BulletMasterGridData)).unwrap();
        toast({ title: res?.message ?? "Bullet updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addBulletMaster(payload as BulletMasterGridData)).unwrap();
        toast({ title: res?.message ?? "Bullet created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchBulletMasters(filterParams));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error saving bullet"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteBulletMaster(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Bullet deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchBulletMasters(filterParams));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error deleting bullet"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (key: string, label: string, type: "text" | "number" | "select" | "textarea", options?: DropdownItem[], required?: boolean, placeholder?: string, maxLength?: number) => {
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : ""}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {type === "select" ? (
          <Select value={form[key] || ""} onValueChange={(v) => setForm({ ...form, [key]: v })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className="text-xs" />
        ) : (
          <Input
            type="text"
            inputMode={type === "number" ? "numeric" : undefined}
            pattern={type === "number" ? "[0-9]*" : undefined}
            value={form[key] ?? ""}
            onChange={(e) => {
              if (type === "number") {
                const digits = e.target.value.replace(/[^0-9]/g, "");
                setForm({ ...form, [key]: digits === "" ? null : Number(digits) });
              } else {
                setForm({ ...form, [key]: e.target.value });
              }
            }}
            placeholder={placeholder}
            className={`h-9 text-xs ${required && !form[key] ? "border-destructive ring-1 ring-destructive/30" : ""}`}
            maxLength={maxLength}
          />
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bullet Master</h1>
          <p className="text-sm text-muted-foreground">Manage bullet master data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Bullet
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search bullets..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">Ammunition Brand</Label>
              <Select value={ammunitionBrandFilter} onValueChange={(v) => { setAmmunitionBrandFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {ammunitionBrands.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Brand</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Caliber</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Grain</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Pack</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Rounds</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Reorder</th>
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
                    <td className="p-3 font-medium">{item.BULLET_ID}</td>
                    <td className="p-3">{item.BULLET_CODE || "-"}</td>
                    <td className="p-3">{item.BULLET_NAME}</td>
                    <td className="p-3">{item.BRAND_NAME || "-"}</td>
                    <td className="p-3">{item.CALIBER_NAME || "-"}</td>
                    <td className="p-3">{item.GRAIN_WEIGHT ?? "-"}</td>
                    <td className="p-3">{item.PACK_SIZE ?? "-"}</td>
                    <td className="p-3">{item.ROUNDS_PER_BOX ?? "-"}</td>
                    <td className="p-3">{item.REORDER_LEVEL ?? "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">No records found</td></tr>
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
            <DialogTitle>{loadingEdit ? "Loading..." : (editing ? "Edit Bullet" : "Add Bullet")}</DialogTitle>
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
                {renderField("BULLET_CODE", "Bullet Code", "text", undefined, false, "e.g., BUL-001", 20)}
                {renderField("BULLET_NAME", "Bullet Name", "text", undefined, true, "e.g., 223 Remington", 100)}

                <div className="col-span-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Classification</Label>
                  <div className="h-px bg-border mt-1" />
                </div>
                {renderField("BULLET_TYPE_ID", "Bullet Type", "select", bulletTypes, false, "Select Type")}
                {renderField("AMMUNITION_BRAND_ID", "Ammunition Brand", "select", ammunitionBrands, false, "Select Brand")}
                {renderField("CALIBER_ID", "Caliber", "select", calibers, false, "Select Caliber")}

                <div className="col-span-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Technical Details</Label>
                  <div className="h-px bg-border mt-1" />
                </div>
                {renderField("GRAIN_WEIGHT", "Grain Weight", "number", undefined, false, "e.g., 55")}
                {renderField("PACK_SIZE", "Pack Size", "number", undefined, false, "e.g., 20")}
                {renderField("ROUNDS_PER_BOX", "Rounds Per Box", "number", undefined, false, "e.g., 50")}
                {renderField("REORDER_LEVEL", "Reorder Level", "number", undefined, false, "e.g., 10")}

                <div className="col-span-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Status & Notes</Label>
                  <div className="h-px bg-border mt-1" />
                </div>
                {renderField("STATUS_MASTER", "Status", "select", [{ value: "AC", label: "Active" }, { value: "IA", label: "Inactive" }])}
              </div>
              {renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}
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
            <AlertDialogDescription>This will permanently delete this bullet record.</AlertDialogDescription>
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
