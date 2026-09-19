"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchMappings, addMapping, updateMapping, deleteMapping, clearMappingError, type DriverTruckMasterMappingGridData } from "@/lib/driverTruckMasterMappingSlice";
import { API_URL } from "@/lib/config";
import { formatDate } from "@/lib/validation";
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

const RESPONSE_PREFIXES = ["SECTION_HEAD_RESPONSE", "RESPONSE_1", "RESPONSE_2", "FINAL_RESPONSE"] as const;

const toDisplayStatus = (val: string) => {
  const u = (val || "").toUpperCase().trim();
  return u === "AC" || u === "ACTIVE" ? "ACTIVE" : u === "IN" || u === "INACTIVE" ? "INACTIVE" : u;
};

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

const toDateInput = (val: any): string => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function DriverTruckMasterMappingPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.driverTruckMasterMapping);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AC");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [drivers, setDrivers] = useState<DropdownItem[]>([]);
  const [trucks, setTrucks] = useState<DropdownItem[]>([]);

  const fetchDropdowns = useCallback(async () => {
    const fetches = [
      fetch(`${API_URL}/driver-truck-master-mapping/driver-options`).then(r => r.json())
        .then(d => setDrivers((d.data || []).map((x: any) => ({
          value: String(x.DRIVER_EMP_ID),
          label: x.DRIVER_FULL_NAME
        })))).catch(() => {}),
      fetch(`${API_URL}/driver-truck-master-mapping/truck-options`).then(r => r.json())
        .then(d => setTrucks((d.data || []).map((x: any) => ({
          value: String(x.TRUCK_ID),
          label: x.TRUCK_NO
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
    return items.filter((d: any) => {
      const statusNorm = normalizeStatus(d.STATUS_MASTER);
      const matchesStatus = statusFilter === "AC" ? statusNorm === "ACTIVE" : statusNorm === "INACTIVE";
      const searchable = [
        d.DRIVER_FULL_NAME || "",
        d.TRUCK_NO || "",
        d.EFFECTIVE_FROM || "",
        d.REMARKS || "",
      ].join(" ").toLowerCase();
      return matchesStatus && searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => {
      const aId = Number(a.id || a.SNO || 0);
      const bId = Number(b.id || b.SNO || 0);
      return bId - aId;
    });
  }, [items, search, statusFilter]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  const emptyForm = () => ({
    DRIVER_EMP_ID: "",
    TRUCK_ID: "",
    EFFECTIVE_FROM: "",
    SECTION_HEAD_RESPONSE_PERSON_EMP_ID: "",
    SECTION_HEAD_RESPONSE_DATE: "",
    SECTION_HEAD_RESPONSE_STATUS: "",
    SECTION_HEAD_RESPONSE_REMARKS: "",
    RESPONSE_1_EMP_ID: "",
    RESPONSE_1_DATE: "",
    RESPONSE_1_STATUS: "",
    RESPONSE_1_REMARKS: "",
    RESPONSE_2_EMP_ID: "",
    RESPONSE_2_DATE: "",
    RESPONSE_2_STATUS: "",
    RESPONSE_2_REMARKS: "",
    FINAL_RESPONSE_PERSON: "",
    FINAL_RESPONSE_DATE: "",
    FINAL_RESPONSE_STATUS: "",
    FINAL_RESPONSE_REMARKS: "",
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
      DRIVER_EMP_ID: String(item.DRIVER_EMP_ID || ""),
      TRUCK_ID: String(item.TRUCK_ID || ""),
      EFFECTIVE_FROM: toDateInput(item.EFFECTIVE_FROM),
      SECTION_HEAD_RESPONSE_PERSON_EMP_ID: String(item.SECTION_HEAD_RESPONSE_PERSON_EMP_ID ?? item.SECTION_HEAD_RESPONSE_PERSON ?? ""),
      SECTION_HEAD_RESPONSE_DATE: toDateInput(item.SECTION_HEAD_RESPONSE_DATE),
      SECTION_HEAD_RESPONSE_STATUS: item.SECTION_HEAD_RESPONSE_STATUS || "",
      SECTION_HEAD_RESPONSE_REMARKS: item.SECTION_HEAD_RESPONSE_REMARKS || "",
      RESPONSE_1_EMP_ID: String(item.RESPONSE_1_EMP_ID ?? item.RESPONSE_1_PERSON ?? ""),
      RESPONSE_1_DATE: toDateInput(item.RESPONSE_1_DATE),
      RESPONSE_1_STATUS: item.RESPONSE_1_STATUS || "",
      RESPONSE_1_REMARKS: item.RESPONSE_1_REMARKS || "",
      RESPONSE_2_EMP_ID: String(item.RESPONSE_2_EMP_ID ?? item.RESPONSE_2_PERSON ?? ""),
      RESPONSE_2_DATE: toDateInput(item.RESPONSE_2_DATE),
      RESPONSE_2_STATUS: item.RESPONSE_2_STATUS || "",
      RESPONSE_2_REMARKS: item.RESPONSE_2_REMARKS || "",
      FINAL_RESPONSE_PERSON: item.FINAL_RESPONSE_PERSON || "",
      FINAL_RESPONSE_DATE: toDateInput(item.FINAL_RESPONSE_DATE),
      FINAL_RESPONSE_STATUS: item.FINAL_RESPONSE_STATUS || "",
      FINAL_RESPONSE_REMARKS: item.FINAL_RESPONSE_REMARKS || "",
      REMARKS: item.REMARKS || "",
      STATUS_MASTER: toDisplayStatus(item.STATUS_MASTER) === "ACTIVE" ? "AC" : "IN",
      USER: "Admin",
      MAC_ADDRESS: "WEB",
    });
    setDialogOpen(true);
  };

  const buildPayload = (): Record<string, any> => {
    const payload: Record<string, any> = {
      DRIVER_EMP_ID: Number(form.DRIVER_EMP_ID),
      TRUCK_ID: Number(form.TRUCK_ID),
      EFFECTIVE_FROM: form.EFFECTIVE_FROM || null,
      REMARKS: form.REMARKS?.trim() || null,
      STATUS_MASTER: form.STATUS_MASTER,
      USER: "Admin",
      MAC_ADDRESS: "WEB",
    };
    for (const p of RESPONSE_PREFIXES) {
      const empKey = p === "SECTION_HEAD_RESPONSE" ? "SECTION_HEAD_RESPONSE_PERSON_EMP_ID" : p === "FINAL_RESPONSE" ? null : `${p}_EMP_ID`;
      if (empKey) {
        payload[empKey] = form[empKey] ? Number(form[empKey]) : null;
      } else {
        payload.FINAL_RESPONSE_PERSON = form.FINAL_RESPONSE_PERSON?.trim() || null;
      }
      payload[`${p}_DATE`] = form[`${p}_DATE`] || null;
      payload[`${p}_STATUS`] = form[`${p}_STATUS`]?.trim() || null;
      payload[`${p}_REMARKS`] = form[`${p}_REMARKS`]?.trim() || null;
    }
    return payload;
  };

  const handleSave = async () => {
    if (!form.DRIVER_EMP_ID) {
      toast({ title: "Driver is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.TRUCK_ID) {
      toast({ title: "Truck is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    try {
      const payload = buildPayload();
      if (editing) {
        payload.SNO = Number(editing.id);
        const res = await dispatch(updateMapping(payload as DriverTruckMasterMappingGridData)).unwrap();
        toast({ title: res?.message ?? "Mapping updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addMapping(payload as DriverTruckMasterMappingGridData)).unwrap();
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

  const setFormKey = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Driver Truck Master Mapping</h1>
          <p className="text-sm text-muted-foreground">Manage driver-truck master mapping</p>
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
                <SelectItem value="IN">Inactive</SelectItem>
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
                  {[...Array(10)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">SNO</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Driver</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Truck</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Effective From</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Remarks</th>
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
                    <td className="p-3">{item.DRIVER_FULL_NAME}</td>
                    <td className="p-3">{item.TRUCK_NO}</td>
                    <td className="p-3">{formatDate(item.EFFECTIVE_FROM)}</td>
                    <td className="p-3">{item.REMARKS || "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${toDisplayStatus(item.STATUS_MASTER) === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {toDisplayStatus(item.STATUS_MASTER) === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Mapping" : "Add Mapping"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Driver <span className="text-destructive">*</span></Label>
                <Select value={form.DRIVER_EMP_ID || ""} onValueChange={(v) => setFormKey("DRIVER_EMP_ID", v)}>
                  <SelectTrigger className={`h-9 text-xs ${!form.DRIVER_EMP_ID ? "border-red-500" : ""}`}><SelectValue placeholder="Select driver" /></SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Truck <span className="text-destructive">*</span></Label>
                <Select value={form.TRUCK_ID || ""} onValueChange={(v) => setFormKey("TRUCK_ID", v)}>
                  <SelectTrigger className={`h-9 text-xs ${!form.TRUCK_ID ? "border-red-500" : ""}`}><SelectValue placeholder="Select truck" /></SelectTrigger>
                  <SelectContent>
                    {trucks.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Effective From</Label>
                <DatePicker value={form.EFFECTIVE_FROM || ""} onChange={(v) => setFormKey("EFFECTIVE_FROM", v)} />
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
              <Button onClick={handleSave} className={editing ? "bg-info text-info-foreground hover:bg-info/90 text-xs" : "bg-primary text-primary-foreground hover:bg-primary/90 text-xs"}>{editing ? "Update" : "Create"}</Button>
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
