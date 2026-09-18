"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchOverTimeReferenceEntries, addOverTimeReferenceEntries, updateOverTimeReferenceEntries, deleteOverTimeReferenceEntries, clearOverTimeReferenceEntriesError, type OverTimeReferenceEntriesGridData } from "@/lib/overtimeReferenceEntriesSlice";
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
import { MONTHS, YEARS } from "@/lib/utils";
import { clampNonNegative } from "@/lib/validation";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

export default function OverTimeReferenceEntriesPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.overtimeReferenceEntries);
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: companies } = useApiQuery("ot-ref-companies", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed to fetch companies");
    const json = await res.json();
    return json.data || [];
  });

  const { data: currencies } = useApiQuery("ot-ref-currencies", async () => {
    const res = await fetch(`${API_URL}/currency-master?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch currencies");
    const json = await res.json();
    return json.data || [];
  });

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
    dispatch(fetchOverTimeReferenceEntries(statusFilter));
  }, [dispatch, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearOverTimeReferenceEntriesError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((d: any) => {
      const searchable = [d.OT_REF_NO, d.MONTH_ENTERED, d.YEAR_ENTERED, d.COMPANY_NAME, d.ACC_OT_REF_NO, d.AMOUNT, d.CURRENCY_NAME, d.REMARKS].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => Number(b.id || 0) - Number(a.id || 0));
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
    MONTH_ENTERED: user?.monthProcess || "",
    YEAR_ENTERED: user?.yearProcess || "",
    COMPANY_ID: "",
    ACC_OT_REF_NO: "",
    AMOUNT: "",
    CURRENCY_ID: "",
    REMARKS: "",
    STATUS_MASTER: "AC",
    USER: user?.loginName || "Admin",
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
      OT_REF_NO: item.OT_REF_NO || "",
      MONTH_ENTERED: item.MONTH_ENTERED || user?.monthProcess || "",
      YEAR_ENTERED: item.YEAR_ENTERED || user?.yearProcess || "",
      COMPANY_ID: item.COMPANY_ID ?? "",
      ACC_OT_REF_NO: item.ACC_OT_REF_NO || "",
      AMOUNT: item.AMOUNT ?? "",
      CURRENCY_ID: item.CURRENCY_ID ?? "",
      REMARKS: item.REMARKS || "",
      STATUS_MASTER: item.STATUS_MASTER || "AC",
      USER: user?.loginName || "Admin",
      MAC_ADDRESS: "WEB",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.MONTH_ENTERED) {
      toast({ title: "Month is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.YEAR_ENTERED) {
      toast({ title: "Year is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.COMPANY_ID) {
      toast({ title: "Company is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    if (!editing && normalizeStatus(form.STATUS_MASTER) === "INACTIVE") {
      toast({ title: "Status cannot be inactive for new records", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    try {
      const payload: Record<string, any> = {
        MONTH_ENTERED: form.MONTH_ENTERED || user?.monthProcess || "",
        YEAR_ENTERED: String(form.YEAR_ENTERED || user?.yearProcess || ""),
        COMPANY_ID: Number(form.COMPANY_ID),
        ACC_OT_REF_NO: form.ACC_OT_REF_NO?.trim() || null,
        AMOUNT: form.AMOUNT === "" || form.AMOUNT === null || form.AMOUNT === undefined ? null : String(Math.max(0, Number(form.AMOUNT) || 0)),
        CURRENCY_ID: form.CURRENCY_ID ? Number(form.CURRENCY_ID) : null,
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_MASTER: editing ? form.STATUS_MASTER : "AC",
        USER: user?.loginName || "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (editing) {
        payload.SNO = Number(editing.id);
        payload.OT_REF_NO = editing.OT_REF_NO || form.OT_REF_NO || "";
        const res = await dispatch(updateOverTimeReferenceEntries(payload as OverTimeReferenceEntriesGridData)).unwrap();
        toast({ title: res?.message ?? "Over time reference entry updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addOverTimeReferenceEntries(payload as OverTimeReferenceEntriesGridData)).unwrap();
        toast({ title: res?.message ?? "Over time reference entry created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchOverTimeReferenceEntries(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error saving over time reference entry"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteOverTimeReferenceEntries(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Over time reference entry deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchOverTimeReferenceEntries(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error deleting over time reference entry"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Over Time Reference Entries</h1>
          <p className="text-sm text-muted-foreground">Manage over time reference entries master data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Reference Entry
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search reference entries..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
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
                  {[...Array(7)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Ref No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Month</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Year</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">ACC Ref No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Amount</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Currency</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Remarks</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                      {isAdmin && <button onClick={() => setDeleteId(item.OT_REF_NO)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>}
                    </td>
                    <td className="p-3 font-medium">{item.OT_REF_NO}</td>
                    <td className="p-3">{item.MONTH_ENTERED}</td>
                    <td className="p-3">{item.YEAR_ENTERED}</td>
                    <td className="p-3">{item.COMPANY_NAME || "-"}</td>
                    <td className="p-3">{item.ACC_OT_REF_NO || "-"}</td>
                    <td className="p-3">{item.AMOUNT || "-"}</td>
                    <td className="p-3">{item.CURRENCY_NAME || "-"}</td>
                    <td className="p-3">{item.REMARKS || "-"}</td>
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Over Time Reference Entry" : "Add Over Time Reference Entry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {editing && (
                <div className="col-span-2">
                  <Label className="text-xs">OT Ref No</Label>
                  <Input value={form.OT_REF_NO || ""} disabled className="h-9 text-xs" />
                </div>
              )}
              <div className="col-span-1">
                <Label className="text-xs">Process Month <span className="text-destructive">*</span></Label>
                <Select value={form.MONTH_ENTERED || ""} onValueChange={(v) => setForm({ ...form, MONTH_ENTERED: v })}>
                  <SelectTrigger className="h-9 text-xs" disabled><SelectValue placeholder="Select month" /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Label className="text-xs">Process Year <span className="text-destructive">*</span></Label>
                <Select value={form.YEAR_ENTERED || ""} onValueChange={(v) => setForm({ ...form, YEAR_ENTERED: v })}>
                  <SelectTrigger className="h-9 text-xs" disabled><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Company <span className="text-destructive">*</span></Label>
                <Select value={form.COMPANY_ID ? String(form.COMPANY_ID) : ""} onValueChange={(v) => setForm({ ...form, COMPANY_ID: v })}>
                  <SelectTrigger className={`h-9 text-xs${!form.COMPANY_ID ? " border-destructive ring-1 ring-destructive/30" : ""}`}><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>
                    {(companies || []).map((c: any) => <SelectItem key={c.COMPANY_ID} value={String(c.COMPANY_ID)}>{c.COMPANY_NAME}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">ACC OT Ref No</Label>
                <Input value={form.ACC_OT_REF_NO || ""} onChange={(e) => setForm({ ...form, ACC_OT_REF_NO: e.target.value })} placeholder="Accounts ref no" className="h-9 text-xs" />
              </div>
              <div className="col-span-1">
                <Label className="text-xs">Amount</Label>
                <Input type="number" min="0" step="any" value={form.AMOUNT ?? ""} onChange={(e) => setForm({ ...form, AMOUNT: clampNonNegative(e.target.value) })} placeholder="e.g., 5000" className="h-9 text-xs" />
              </div>
              <div className="col-span-1">
                <Label className="text-xs">Currency</Label>
                <Select value={form.CURRENCY_ID ? String(form.CURRENCY_ID) : ""} onValueChange={(v) => setForm({ ...form, CURRENCY_ID: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select currency" /></SelectTrigger>
                  <SelectContent>
                    {(currencies || []).map((c: any) => <SelectItem key={c.CURRENCY_ID} value={String(c.CURRENCY_ID)}>{c.CURRENCY_NAME}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
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
              <Button onClick={handleSave} className={editing ? "bg-info text-info-foreground hover:bg-info/90 text-xs" : "bg-primary text-primary-foreground hover:bg-primary/90 text-xs"}>{editing ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this over time reference entry record.</AlertDialogDescription>
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