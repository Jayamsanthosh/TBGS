"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchBanks, addBank, updateBank, deleteBank, clearBankMasterError, type BankMasterGridData } from "@/lib/bankMasterSlice";
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

export default function BankMasterPage() {
  const dispatch = useAppDispatch();
  const { banks, loading, error } = useAppSelector((s) => s.bankMaster);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AC");
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
    dispatch(fetchBanks(statusFilter));
  }, [dispatch, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearBankMasterError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    if (!Array.isArray(banks)) return [];
    return banks.filter((d: any) => {
      const searchable = [d.BANK_NAME, d.ADDRESS, d.REMARKS].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => (b.BANK_ID ?? b.id ?? 0) - (a.BANK_ID ?? a.id ?? 0));
  }, [banks, search]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  const emptyForm = () => ({
    BANK_NAME: "",
    ADDRESS: "",
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
      BANK_NAME: item.BANK_NAME || "",
      ADDRESS: item.ADDRESS || "",
      REMARKS: item.REMARKS || "",
      STATUS_MASTER: item.STATUS_MASTER === "ACTIVE" ? "AC" : item.STATUS_MASTER === "INACTIVE" ? "IA" : (item.STATUS_MASTER || "AC"),
      USER: "Admin",
      MAC_ADDRESS: "WEB",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.BANK_NAME?.trim()) {
      toast({ title: "Bank name is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    try {
      const payload: Record<string, any> = {
        BANK_NAME: form.BANK_NAME.trim(),
        ADDRESS: form.ADDRESS?.trim() || null,
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_MASTER: "AC",
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (editing) {
        payload.BANK_ID = Number(editing.id);
        const res = await dispatch(updateBank(payload as BankMasterGridData)).unwrap();
        toast({ title: res?.message ?? "Bank updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addBank(payload as BankMasterGridData)).unwrap();
        toast({ title: res?.message ?? "Bank created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchBanks(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error saving bank"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteBank(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Bank deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchBanks(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error deleting bank"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bank Master</h1>
          <p className="text-sm text-muted-foreground">Manage bank master data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Bank
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search banks..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
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
                  {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Bank Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Address</th>
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
                    <td className="p-3 font-medium">{item.BANK_ID}</td>
                    <td className="p-3">{item.BANK_NAME}</td>
                    <td className="p-3">{item.ADDRESS || "-"}</td>
                    <td className="p-3">{item.REMARKS || "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No records found</td></tr>
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
            <DialogTitle>{editing ? "Edit Bank" : "Add Bank"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-xs">Bank Name <span className="text-destructive">*</span></Label>
                <Input value={form.BANK_NAME || ""} onChange={(e) => setForm({ ...form, BANK_NAME: e.target.value })} placeholder="e.g., Standard Bank" className={`h-9 text-xs ${!form.BANK_NAME?.trim() ? "border-destructive ring-1 ring-destructive/30" : ""}`} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Address</Label>
                <Input value={form.ADDRESS || ""} onChange={(e) => setForm({ ...form, ADDRESS: e.target.value })} placeholder="Enter bank address" className="h-9 text-xs" />
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
              <Button onClick={handleSave} className={`${editing ? "bg-info text-info-foreground hover:bg-info/90" : "bg-primary text-primary-foreground hover:bg-primary/90"} text-xs`}>{editing ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this bank record.</AlertDialogDescription>
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
