"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchShiftNames, addShiftName, updateShiftName, deleteShiftName, clearShiftNameError, type ShiftNameMasterGridData } from "@/lib/shiftNameMasterSlice";
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
import { clampNonNegative } from "@/lib/validation";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

const parseTimeToMinutes = (t: string): number | null => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h)) return null;
  return h * 60 + (isNaN(m) ? 0 : m);
};

const round2 = (n: number) => Math.round(n * 100) / 100;

const computeShiftHours = (inTime: string, outTime: string, breakHours: any) => {
  const start = parseTimeToMinutes(inTime);
  const end = parseTimeToMinutes(outTime);
  if (start === null || end === null) {
    return { TOTAL_HOURS: 0, ACTUAL_WORKING_HOURS: 0 };
  }
  let diff = end - start;
  if (diff <= 0) diff += 24 * 60;
  const total = round2(diff / 60);
  const brk = Number(breakHours) || 0;
  return { TOTAL_HOURS: total, ACTUAL_WORKING_HOURS: round2(total - brk) };
};

export default function ShiftNameMasterPage() {
  const dispatch = useAppDispatch();
  const { shiftNames, loading, error } = useAppSelector((s) => s.shiftNameMaster);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
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

  useEffect(() => {
    dispatch(fetchShiftNames(statusFilter));
  }, [dispatch, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearShiftNameError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    if (!Array.isArray(shiftNames)) return [];
    return shiftNames.filter((d: any) => {
      const searchable = [d.SHIFT_NAME, d.SHIFT_DESCRIPTION, d.REMARKS].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => Number(b.SHIFT_NAME_ID) - Number(a.SHIFT_NAME_ID));
  }, [shiftNames, search]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  const emptyForm = () => ({
    SHIFT_NAME: "",
    SHIFT_DESCRIPTION: "",
    IN_TIME: "",
    OUT_TIME: "",
    TOTAL_HOURS: 0,
    BREAK_HOURS: "",
    ACTUAL_WORKING_HOURS: 0,
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
    const next: Record<string, any> = {
      SHIFT_NAME: item.SHIFT_NAME || "",
      SHIFT_DESCRIPTION: item.SHIFT_DESCRIPTION || "",
      IN_TIME: item.IN_TIME || "",
      OUT_TIME: item.OUT_TIME || "",
      BREAK_HOURS: item.BREAK_HOURS ?? "",
      REMARKS: item.REMARKS || "",
      STATUS_MASTER: item.STATUS_MASTER || "AC",
      USER: "Admin",
      MAC_ADDRESS: "WEB",
    };
    const calc = computeShiftHours(next.IN_TIME, next.OUT_TIME, next.BREAK_HOURS);
    next.TOTAL_HOURS = calc.TOTAL_HOURS;
    next.ACTUAL_WORKING_HOURS = calc.ACTUAL_WORKING_HOURS;
    setForm(next);
    setDialogOpen(true);
  };

  const handleFormChange = (key: string, value: any) => {
    const next = { ...form, [key]: value };
    if (["IN_TIME", "OUT_TIME", "BREAK_HOURS"].includes(key)) {
      const calc = computeShiftHours(next.IN_TIME, next.OUT_TIME, next.BREAK_HOURS);
      next.TOTAL_HOURS = calc.TOTAL_HOURS;
      next.ACTUAL_WORKING_HOURS = calc.ACTUAL_WORKING_HOURS;
    }
    setForm(next);
  };

  const handleSave = async () => {
    if (!editing && normalizeStatus(form.STATUS_MASTER) === "INACTIVE") {
      toast({ title: "New records cannot be inactive", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.SHIFT_NAME?.trim()) {
      toast({ title: "Shift name is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    try {
      const payload: Record<string, any> = {
        SHIFT_NAME: form.SHIFT_NAME.trim(),
        SHIFT_DESCRIPTION: form.SHIFT_DESCRIPTION?.trim() || null,
        IN_TIME: form.IN_TIME || null,
        OUT_TIME: form.OUT_TIME || null,
        TOTAL_HOURS: form.TOTAL_HOURS,
        BREAK_HOURS: form.BREAK_HOURS === "" || form.BREAK_HOURS === null || form.BREAK_HOURS === undefined ? null : Math.max(0, Number(form.BREAK_HOURS) || 0),
        ACTUAL_WORKING_HOURS: form.ACTUAL_WORKING_HOURS,
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_MASTER: form.STATUS_MASTER,
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (editing) {
        payload.SHIFT_NAME_ID = Number(editing.id);
        const res = await dispatch(updateShiftName(payload as ShiftNameMasterGridData)).unwrap();
        toast({ title: res?.message ?? "Shift name updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addShiftName(payload as ShiftNameMasterGridData)).unwrap();
        toast({ title: res?.message ?? "Shift name created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchShiftNames(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error saving shift name"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteShiftName(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Shift name deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchShiftNames(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error deleting shift name"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shift Name Master</h1>
          <p className="text-sm text-muted-foreground">Manage shift name master data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Shift Name
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search shift names..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Shift Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Description</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">In Time</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Out Time</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Total Hrs</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Break Hrs</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Actual Hrs</th>
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
                    <td className="p-3 font-medium">{item.SHIFT_NAME_ID}</td>
                    <td className="p-3 font-medium">{item.SHIFT_NAME}</td>
                    <td className="p-3">{item.SHIFT_DESCRIPTION || "-"}</td>
                    <td className="p-3">{item.IN_TIME || "-"}</td>
                    <td className="p-3">{item.OUT_TIME || "-"}</td>
                    <td className="p-3">{item.TOTAL_HOURS ?? "-"}</td>
                    <td className="p-3">{item.BREAK_HOURS ?? "-"}</td>
                    <td className="p-3">{item.ACTUAL_WORKING_HOURS ?? "-"}</td>
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Shift Name" : "Add Shift Name"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-xs">Shift Name <span className="text-destructive">*</span></Label>
                <Input value={form.SHIFT_NAME || ""} onChange={(e) => handleFormChange("SHIFT_NAME", e.target.value)} placeholder="e.g., General Shift" className={`h-9 text-xs ${!form.SHIFT_NAME ? "border-destructive ring-1 ring-destructive/30" : ""}`} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Shift Description</Label>
                <Input value={form.SHIFT_DESCRIPTION || ""} onChange={(e) => handleFormChange("SHIFT_DESCRIPTION", e.target.value)} placeholder="Short description" className="h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs">In Time</Label>
                <Input type="time" value={form.IN_TIME || ""} onChange={(e) => handleFormChange("IN_TIME", e.target.value)} className="h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Out Time</Label>
                <Input type="time" value={form.OUT_TIME || ""} onChange={(e) => handleFormChange("OUT_TIME", e.target.value)} className="h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Total Hours</Label>
                <Input value={form.TOTAL_HOURS ?? ""} disabled placeholder="Auto calculated" className="h-9 text-xs bg-muted" />
              </div>
              <div>
                <Label className="text-xs">Break Hours</Label>
                <Input type="number" step="0.01" min="0" value={form.BREAK_HOURS ?? ""} onChange={(e) => handleFormChange("BREAK_HOURS", clampNonNegative(e.target.value))} placeholder="e.g., 1.00" className="h-9 text-xs" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Actual Working Hours</Label>
                <Input value={form.ACTUAL_WORKING_HOURS ?? ""} disabled placeholder="Auto calculated" className="h-9 text-xs bg-muted" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Status</Label>
                <Select value={form.STATUS_MASTER || "AC"} onValueChange={(v) => handleFormChange("STATUS_MASTER", v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AC">Active</SelectItem>
                    <SelectItem value="IA">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Remarks</Label>
                <Textarea value={form.REMARKS || ""} onChange={(e) => handleFormChange("REMARKS", e.target.value)} placeholder="Additional notes..." className="text-xs" />
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
            <AlertDialogDescription>This will permanently delete this shift name record.</AlertDialogDescription>
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
