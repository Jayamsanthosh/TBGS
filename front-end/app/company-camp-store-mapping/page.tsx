"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchMappings, addMapping, updateMapping, deleteMapping, clearMappingError, type MappingGridData } from "@/lib/companyCampStoreMappingSlice";
import { API_URL } from "@/lib/config";
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
  campId?: string;
}

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const toDisplayStatus = (val: string) => {
  const u = (val || "").toUpperCase();
  return u === "AC" || u === "ACTIVE" ? "ACTIVE" : "INACTIVE";
};

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

export default function CompanyCampStoreMappingPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.companyCampStoreMapping);
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

  const fetchDropdowns = useCallback(async () => {
    const fetches = [
      fetch(`${API_URL}/company-master`).then(r => r.json())
        .then(d => setCompanies((d.data || []).filter((x: any) => x.COMPANY_ID != null && x.COMPANY_NAME).map((x: any) => ({
          value: String(x.COMPANY_ID),
          label: x.COMPANY_NAME
        })))).catch(() => {}),
      fetch(`${API_URL}/camp-master`).then(r => r.json())
        .then(d => setCamps((d.data || []).filter((x: any) => x.CAMP_ID != null && x.CAMP_NAME).map((x: any) => ({
          value: String(x.CAMP_ID),
          label: x.CAMP_NAME
        })))).catch(() => {}),
      fetch(`${API_URL}/store-master`).then(r => r.json())
        .then(d => setStores((d.data || []).filter((x: any) => (x.Store_Id ?? x.STORE_ID) != null && (x.Store_Name ?? x.STORE_NAME)).map((x: any) => ({
          value: String(x.Store_Id ?? x.STORE_ID),
          label: x.Store_Name ?? x.STORE_NAME,
          campId: String(x.Camp_Id ?? x.CAMP_ID ?? ""),
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
    dispatch(fetchMappings(statusFilter));
  }, [dispatch, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearMappingError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const targetStatus = normalizeStatus(statusFilter);
    return items
      .filter((d: any) => {
        const company = companies.find((c) => c.value === String(d.COMPANY_ID))?.label || "";
        const camp = camps.find((c) => c.value === String(d.CAMP_ID))?.label || "";
        const store = stores.find((c) => c.value === String(d.STORE_ID))?.label || "";
        const searchable = [company, camp, store, d.REMARKS || ""].join(" ").toLowerCase();
        const statusMatch = !targetStatus || normalizeStatus(d.STATUS_MASTER) === targetStatus;
        return searchable.includes(search.toLowerCase()) && statusMatch;
      })
      .sort((a: any, b: any) => Number(b.MAP_ID || b.id) - Number(a.MAP_ID || a.id));
  }, [items, search, statusFilter, companies, camps, stores]);

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

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      COMPANY_ID: String(item.COMPANY_ID || ""),
      CAMP_ID: String(item.CAMP_ID || ""),
      STORE_ID: String(item.STORE_ID || ""),
      REMARKS: item.REMARKS || "",
      STATUS_MASTER: toDisplayStatus(item.STATUS_MASTER) === "ACTIVE" ? "AC" : "IA",
      USER: "Admin",
      MAC_ADDRESS: "WEB",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.COMPANY_ID) {
      toast({ title: "Company is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.CAMP_ID) {
      toast({ title: "Camp is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.STORE_ID) {
      toast({ title: "Store is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    try {
      const payload: Record<string, any> = {
        COMPANY_ID: Number(form.COMPANY_ID),
        CAMP_ID: Number(form.CAMP_ID),
        STORE_ID: Number(form.STORE_ID),
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_MASTER: form.STATUS_MASTER,
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (!editing) {
        payload.STATUS_MASTER = "AC";
      }

      if (editing) {
        payload.MAP_ID = Number(editing.id);
        const res = await dispatch(updateMapping(payload as MappingGridData)).unwrap();
        toast({ title: res?.message ?? "Mapping updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addMapping(payload as MappingGridData)).unwrap();
        toast({ title: res?.message ?? "Mapping created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchMappings(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error saving mapping"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteMapping(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Mapping deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchMappings(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error deleting mapping"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const getCompanyName = (id: any) => companies.find((c) => c.value === String(id))?.label || id;
  const getCampName = (id: any) => camps.find((c) => c.value === String(id))?.label || id;
  const getStoreName = (id: any) => stores.find((c) => c.value === String(id))?.label || id;

  const availableCamps = useMemo(() => {
    if (!form.COMPANY_ID) return [];
    const mapped = camps.filter((c) =>
      items.some((m) => String(m.COMPANY_ID) === String(form.COMPANY_ID) && String(m.CAMP_ID) === c.value)
    );
    const result = mapped.length > 0 ? mapped : camps;
    const selected = form.CAMP_ID ? camps.find((c) => c.value === String(form.CAMP_ID)) : undefined;
    if (selected && !result.some((c) => c.value === selected.value)) {
      return [...result, selected];
    }
    return result;
  }, [camps, items, form.COMPANY_ID, form.CAMP_ID]);

  const availableStores = useMemo(() => {
    if (!form.CAMP_ID) return [];
    const filtered = stores.filter((s) => s.campId === String(form.CAMP_ID));
    const selected = form.STORE_ID ? stores.find((s) => s.value === String(form.STORE_ID)) : undefined;
    if (selected && !filtered.some((s) => s.value === selected.value)) {
      return [...filtered, selected];
    }
    return filtered;
  }, [stores, form.CAMP_ID, form.STORE_ID]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Company Camp Store Mapping</h1>
          <p className="text-sm text-muted-foreground">Manage company-camp-store mapping</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Mapping
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search mappings..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
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
                  {[...Array(5)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">MAP ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Camp</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Store</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Remarks</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => {
                  const displayStatus = toDisplayStatus(item.STATUS_MASTER);
                  const isActive = displayStatus === "ACTIVE";
                  return (
                    <tr key={item.id || idx} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 flex gap-2">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                        {isAdmin && <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>}
                      </td>
                      <td className="p-3 font-medium">{item.MAP_ID}</td>
                      <td className="p-3">{getCompanyName(item.COMPANY_ID)}</td>
                      <td className="p-3">{getCampName(item.CAMP_ID)}</td>
                      <td className="p-3">{getStoreName(item.STORE_ID)}</td>
                      <td className="p-3">{item.REMARKS || "-"}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={`${isActive ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                          {isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No records found</td></tr>
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Mapping" : "Add Mapping"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Company <span className="text-destructive">*</span></Label>
                <Select value={form.COMPANY_ID || ""} onValueChange={(v) => setForm({ ...form, COMPANY_ID: v, CAMP_ID: "", STORE_ID: "" })}>
                  <SelectTrigger className={`h-9 text-xs ${!form.COMPANY_ID ? "border-destructive" : ""}`}><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Camp <span className="text-destructive">*</span></Label>
                <Select
                  value={form.CAMP_ID || ""}
                  onValueChange={(v) => setForm({ ...form, CAMP_ID: v, STORE_ID: "" })}
                  disabled={!form.COMPANY_ID}
                >
                  <SelectTrigger className={`h-9 text-xs ${!form.CAMP_ID ? "border-destructive" : ""}`}><SelectValue placeholder={form.COMPANY_ID ? "Select camp" : "Select company first"} /></SelectTrigger>
                  <SelectContent>
                    {availableCamps.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Store <span className="text-destructive">*</span></Label>
                <Select
                  value={form.STORE_ID || ""}
                  onValueChange={(v) => setForm({ ...form, STORE_ID: v })}
                  disabled={!form.CAMP_ID}
                >
                  <SelectTrigger className={`h-9 text-xs ${!form.STORE_ID ? "border-destructive" : ""}`}><SelectValue placeholder={form.CAMP_ID ? "Select store" : "Select camp first"} /></SelectTrigger>
                  <SelectContent>
                    {availableStores.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Status</Label>
                <Select value={form.STATUS_MASTER || "AC"} onValueChange={(v) => setForm({ ...form, STATUS_MASTER: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AC">Active</SelectItem>
                    <SelectItem value="IA">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Remarks</Label>
                <Textarea value={form.REMARKS || ""} onChange={(e) => setForm({ ...form, REMARKS: e.target.value })} placeholder="Additional notes..." className="text-xs" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-xs">Cancel</Button>
              <Button
                onClick={handleSave}
                className={editing ? "bg-info text-info-foreground hover:bg-info/90 text-xs" : "bg-primary text-primary-foreground hover:bg-primary/90 text-xs"}
              >
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this mapping record.</AlertDialogDescription>
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
