"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchRackMasters, addRackMaster, updateRackMaster, deleteRackMaster, fetchRackMasterById, clearRackMasterError } from "@/lib/rackMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
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

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

export default function RackMasterPage() {
  const dispatch = useAppDispatch();
  const { records, loading, error } = useAppSelector((s) => s.rackMaster);
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

  const { data: companies } = useApiQuery("rm-company", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.COMPANY_ID }));
  });

  const { data: camps } = useApiQuery("rm-camp", async () => {
    const res = await fetch(`${API_URL}/camp-master`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.CAMP_ID }));
  });

  const { data: stores } = useApiQuery("rm-store", async () => {
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

  const { data: campStoreMappings } = useApiQuery("rm-camp-store-map", async () => {
    const res = await fetch(`${API_URL}/company-camp-store-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return json.data || [];
  });

  const { data: rackSections } = useApiQuery("rm-rack-section", async () => {
    const res = await fetch(`${API_URL}/rack-section-master`);
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.RACK_SECTION_ID }));
  });

  const companyOptions = useMemo(() =>
    (Array.isArray(companies) ? companies : []).map((c: any) => ({ value: String(c.COMPANY_ID), label: c.COMPANY_NAME })),
    [companies]
  );

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

  const rackSectionOptions = useMemo(() =>
    (Array.isArray(rackSections) ? rackSections : []).map((r: any) => ({ value: String(r.RACK_SECTION_ID), label: r.RACK_SECTION_NAME })),
    [rackSections]
  );

  const filtered = useMemo(() => {
    if (!Array.isArray(records)) return [];
    return records.filter((d: any) => {
      const searchable = [d.RACK_NAME, d.RACK_DESCRIPTION, d.COMPANY_NAME, d.CAMP_NAME, d.STORE_NAME, d.RACK_SECTION_NAME, d.REMARKS].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => Number(b.id || b.RACK_ID) - Number(a.id || a.RACK_ID));
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
    dispatch(fetchRackMasters());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearRackMasterError());
    }
  }, [error, dispatch, toast]);

  const emptyForm = () => ({
    RACK_NAME: "",
    RACK_DESCRIPTION: "",
    COMPANY_ID: "",
    CAMP_ID: "",
    STORE_ID: "",
    RACK_SECTION_ID: "",
    MAX_CAPACITY: "",
    STATUS_MASTER: "ACTIVE",
    REMARKS: "",
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
      const response = await dispatch(fetchRackMasterById(Number(item.RACK_ID))).unwrap();
      if (response) {
        setForm({
          RACK_NAME: response.RACK_NAME || "",
          RACK_DESCRIPTION: response.RACK_DESCRIPTION || "",
          COMPANY_ID: String(response.COMPANY_ID || ""),
          CAMP_ID: String(response.CAMP_ID || ""),
          STORE_ID: String(response.STORE_ID || ""),
          RACK_SECTION_ID: String(response.RACK_SECTION_ID || ""),
          MAX_CAPACITY: response.MAX_CAPACITY ?? "",
          STATUS_MASTER: response.STATUS_MASTER === "AC" ? "ACTIVE" : "INACTIVE",
          REMARKS: response.REMARKS || "",
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
    if (!form.RACK_NAME?.trim()) {
      toast({ title: "Rack name is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (form.RACK_NAME.trim().length > 40) {
      toast({ title: "Rack name must be 40 characters or less", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    if (!editing && normalizeStatus(form.STATUS_MASTER) === "INACTIVE") {
      toast({ title: "New rack cannot be set to Inactive", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    try {
      const payload: Record<string, any> = {
        RACK_NAME: form.RACK_NAME.trim(),
        RACK_DESCRIPTION: form.RACK_DESCRIPTION?.trim() || null,
        COMPANY_ID: form.COMPANY_ID ? Number(form.COMPANY_ID) : null,
        CAMP_ID: form.CAMP_ID ? Number(form.CAMP_ID) : null,
        STORE_ID: form.STORE_ID ? Number(form.STORE_ID) : null,
        RACK_SECTION_ID: form.RACK_SECTION_ID ? Number(form.RACK_SECTION_ID) : null,
        MAX_CAPACITY: form.MAX_CAPACITY !== "" ? Math.max(0, Number(form.MAX_CAPACITY) || 0) : null,
        STATUS_MASTER: form.STATUS_MASTER || "ACTIVE",
        REMARKS: form.REMARKS?.trim() || null,
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (editing) {
        payload.id = editing.id;
        payload.RACK_ID = Number(editing.id);
        const res = await dispatch(updateRackMaster(payload)).unwrap();
        toast({ title: res?.message ?? "Rack updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addRackMaster(payload)).unwrap();
        toast({ title: res?.message ?? "Rack created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchRackMasters());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error saving rack"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteRackMaster(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Rack deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchRackMasters());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error deleting rack"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (key: string, label: string, type: "text" | "number" | "select" | "textarea" | "date", options?: { value: string; label: string }[], required?: boolean, placeholder?: string, maxLength?: number) => {
    const baseClass = "flex flex-col gap-1.5";
    const fieldEmpty = required && !form[key];
    const borderClass = fieldEmpty ? "border-destructive ring-1 ring-destructive/30" : "";
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : baseClass}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {type === "select" ? (
          <Select
            value={form[key] || ""}
            onValueChange={(v) => {
              const reset: Record<string, any> = {};
              if (key === "COMPANY_ID") { reset.CAMP_ID = ""; reset.STORE_ID = ""; }
              if (key === "CAMP_ID") { reset.STORE_ID = ""; }
              setForm({ ...form, [key]: v, ...reset });
            }}
          >
            <SelectTrigger className={`h-9 text-xs ${borderClass}`} disabled={
              key === "CAMP_ID" ? !form.COMPANY_ID :
              key === "STORE_ID" ? !form.CAMP_ID : false
            }><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
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
            value={form[key] ?? ""}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            placeholder={placeholder}
            className={`h-9 text-xs ${borderClass}`}
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
          <h1 className="text-2xl font-bold text-foreground">Rack Master</h1>
          <p className="text-sm text-muted-foreground">Manage racks</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Rack
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search racks..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
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
                  {[...Array(8)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Camp</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Store</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Section</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Max Capacity</th>
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
                    <td className="p-3 font-medium">{item.RACK_ID}</td>
                    <td className="p-3">{item.RACK_NAME}</td>
                    <td className="p-3">{item.COMPANY_NAME || "-"}</td>
                    <td className="p-3">{item.CAMP_NAME || "-"}</td>
                    <td className="p-3">{item.STORE_NAME || "-"}</td>
                    <td className="p-3">{item.RACK_SECTION_NAME || "-"}</td>
                    <td className="p-3">{item.MAX_CAPACITY != null ? item.MAX_CAPACITY : "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No records found</td></tr>
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
            <DialogTitle>{editing ? "Edit Rack" : "Add Rack"}</DialogTitle>
          </DialogHeader>
          {loadingEdit ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Rack Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("RACK_NAME", "Rack Name", "text", undefined, true, "e.g., RACK-A1", 40)}
                {renderField("RACK_DESCRIPTION", "Description", "text", undefined, false, "e.g., Main storage rack A1")}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Location</h3>
              <div className="grid grid-cols-3 gap-4">
                {renderField("COMPANY_ID", "Company", "select", companyOptions, false, "Select company")}
                {renderField("CAMP_ID", "Camp", "select", campOptions, false, "Select camp")}
                {renderField("STORE_ID", "Store", "select", storeOptions, false, "Select store")}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Rack Config</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("RACK_SECTION_ID", "Rack Section", "select", rackSectionOptions, false, "Select section")}
                {renderField("MAX_CAPACITY", "Max Capacity", "number", undefined, false, "e.g., 500")}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Status & Notes</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("STATUS_MASTER", "Status", "select", [{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }], false)}
              </div>
              <div className="mt-4">
                {renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}
              </div>
            </div>
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
            <AlertDialogDescription>This will permanently delete this rack.</AlertDialogDescription>
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
