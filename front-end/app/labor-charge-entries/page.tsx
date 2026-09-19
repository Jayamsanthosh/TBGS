"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchLaborChargeEntries, addLaborChargeEntries, updateLaborChargeEntries, deleteLaborChargeEntries, submitLaborChargeEntries, clearLaborChargeEntriesError, type LaborChargeEntriesGridData } from "@/lib/laborChargeEntriesSlice";
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
import { DatePicker } from "@/components/ui/date-picker";

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  if (u === "CL" || u === "CLOSED" || u === "SUBMITTED") return "CL";
  if (u === "CA" || u === "CANCELLED" || u === "CANCELED") return "CA";
  return String(val || "");
};

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

export default function LaborChargeEntriesPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.laborChargeEntries);
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [submittingId, setSubmittingId] = useState<string | number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<any>(null);

  const { data: companies } = useApiQuery("lc-entries-companies", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed to fetch companies");
    const json = await res.json();
    return json.data || [];
  });

  const { data: currencies } = useApiQuery("lc-entries-currencies", async () => {
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
    dispatch(fetchLaborChargeEntries({ status: statusFilter, fromDate, toDate }));
  }, [dispatch, statusFilter, fromDate, toDate]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearLaborChargeEntriesError());
    }
  }, [error, dispatch, toast]);

  const handleSubmit = useCallback(async (item: any) => {
    const sno = item?.id ?? item?.SNO;
    if (sno === undefined || sno === null || sno === "") {
      toast({ variant: 'destructive', title: 'Error', description: 'Missing SNO', duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setSubmittingId(sno);
    try {
      const res = await dispatch(submitLaborChargeEntries(sno)).unwrap();
      toast({ title: res?.message ?? "Labor charge entry submitted successfully!", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchLaborChargeEntries({ status: statusFilter, fromDate, toDate }));
    } catch (e: any) {
      const msg = typeof e === "string" ? e : (e?.message || "Failed to submit labor charge entry");
      toast({ variant: 'destructive', title: 'Error', description: msg, duration: DEFAULT_TOAST_DURATION });
    } finally {
      setSubmittingId(null);
    }
  }, [dispatch, statusFilter, fromDate, toDate, toast]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((d: any) => {
      const searchable = [d.MONTH_ENTERED, d.YEAR_ENTERED, d.COMPANY_NAME, d.AMOUNT, d.CURRENCY_NAME, d.REMARKS].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => Number(b.SNO || 0) - Number(a.SNO || 0));
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
      MONTH_ENTERED: item.MONTH_ENTERED || user?.monthProcess || "",
      YEAR_ENTERED: item.YEAR_ENTERED || user?.yearProcess || "",
      COMPANY_ID: item.COMPANY_ID ?? "",
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
    if (!editing && normalizeStatus(form.STATUS_MASTER) === "INACTIVE") {
      toast({ title: "New records cannot be set to Inactive", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
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

    try {
      const payload: Record<string, any> = {
        MONTH_ENTERED: form.MONTH_ENTERED || user?.monthProcess || "",
        YEAR_ENTERED: String(form.YEAR_ENTERED || user?.yearProcess || ""),
        COMPANY_ID: Number(form.COMPANY_ID),
        AMOUNT: form.AMOUNT === "" || form.AMOUNT === null || form.AMOUNT === undefined ? null : String(Math.max(0, Number(form.AMOUNT) || 0)),
        CURRENCY_ID: form.CURRENCY_ID ? Number(form.CURRENCY_ID) : null,
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_MASTER: form.STATUS_MASTER,
        USER: user?.loginName || "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (editing) {
        payload.SNO = Number(editing.id);
        const res = await dispatch(updateLaborChargeEntries(payload as LaborChargeEntriesGridData)).unwrap();
        toast({ title: res?.message ?? "Labor charge entry updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addLaborChargeEntries(payload as LaborChargeEntriesGridData)).unwrap();
        toast({ title: res?.message ?? "Labor charge entry created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchLaborChargeEntries({ status: statusFilter, fromDate, toDate }));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error saving labor charge entry"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteLaborChargeEntries(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Labor charge entry deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchLaborChargeEntries({ status: statusFilter, fromDate, toDate }));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error deleting labor charge entry"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Labor Charge Entries</h1>
          <p className="text-sm text-muted-foreground">Manage labor charge entries master data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Labor Charge Entry
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2 w-full sm:max-w-none">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search labor charge entries..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="AC">Active</SelectItem>
                <SelectItem value="IA">Inactive</SelectItem>
                <SelectItem value="CL">Submitted</SelectItem>
                <SelectItem value="CA">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">From</span>
              <DatePicker value={fromDate} onChange={(v) => { setFromDate(v || ""); setCurrentPage(1); }} placeholder="Created from" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">To</span>
              <DatePicker value={toDate} onChange={(v) => { setToDate(v || ""); setCurrentPage(1); }} placeholder="Created to" />
            </div>
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Month</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Year</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Amount</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Currency</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Remarks</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Submission</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 flex flex-wrap gap-2 items-center">
                      {(() => {
                        const lockStatus = String(item.STATUS_MASTER || "").toUpperCase();
                        const locked = lockStatus === "CL" || lockStatus === "CA";
                        if (locked) return (
                          <button onClick={() => setViewItem(item)} title="View" className="p-1.5 rounded hover:bg-muted transition-colors"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                        );
                        const submitting = submittingId != null && String(submittingId) === String(item.id ?? item.SNO);
                        return (
                          <>
                            <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                            {isAdmin && <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>}
                            <button
                              onClick={() => handleSubmit(item)}
                              disabled={submitting}
                              className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                            >
                              {submitting ? "Submitting..." : "Submit"}
                            </button>
                          </>
                        );
                      })()}
                    </td>
                    <td className="p-3 font-medium">{item.SNO}</td>
                    <td className="p-3">{item.MONTH_ENTERED}</td>
                    <td className="p-3">{item.YEAR_ENTERED}</td>
                    <td className="p-3">{item.COMPANY_NAME || "-"}</td>
                    <td className="p-3">{item.AMOUNT || "-"}</td>
                    <td className="p-3">{item.CURRENCY_NAME || "-"}</td>
                    <td className="p-3">{item.REMARKS || "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : normalizeStatus(item.STATUS_MASTER) === "CL" ? "bg-blue-500/10 text-blue-600 border-blue-200" : normalizeStatus(item.STATUS_MASTER) === "CA" ? "bg-yellow-500/10 text-yellow-600 border-yellow-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {normalizeStatus(item.STATUS_MASTER) === "CL" ? "Submitted" : normalizeStatus(item.STATUS_MASTER) === "CA" ? "Cancelled" : normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={`px-2 py-0.5 text-[10px] uppercase font-bold ${
                        normalizeStatus(item.STATUS_MASTER) === "CL"
                          ? "bg-blue-500/10 text-blue-600 border-blue-200"
                          : "bg-yellow-500/10 text-yellow-600 border-yellow-200"
                      }`}>
                        {normalizeStatus(item.STATUS_MASTER) === "CL" ? "Submitted" : "Pending"}
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
            <DialogTitle>{editing ? "Edit Labor Charge Entry" : "Add Labor Charge Entry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
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
                  <SelectTrigger className={`h-9 text-xs ${!form.COMPANY_ID ? "border-destructive ring-1 ring-destructive/30" : ""}`}><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>
                    {(companies || []).map((c: any) => <SelectItem key={c.COMPANY_ID} value={String(c.COMPANY_ID)}>{c.COMPANY_NAME}</SelectItem>)}
                  </SelectContent>
                </Select>
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
              <Button onClick={handleSave} className={`${editing ? "bg-info text-info-foreground hover:bg-info/90" : "bg-primary text-primary-foreground hover:bg-primary/90"} text-xs`}>{editing ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Labor Charge Entry</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "ID", value: viewItem.SNO },
                  { label: "Process Month", value: viewItem.MONTH_ENTERED },
                  { label: "Process Year", value: viewItem.YEAR_ENTERED },
                  { label: "Company", value: viewItem.COMPANY_NAME },
                  { label: "Amount", value: viewItem.AMOUNT },
                  { label: "Currency", value: viewItem.CURRENCY_NAME },
                  { label: "Status", value: normalizeStatus(viewItem.STATUS_MASTER) === "CL" ? "Submitted" : normalizeStatus(viewItem.STATUS_MASTER) === "CA" ? "Cancelled" : normalizeStatus(viewItem.STATUS_MASTER) },
                ].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">{f.label}</Label>
                    <div className="text-sm font-medium">{f.value ?? "-"}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Remarks</Label>
                <div className="text-sm font-medium">{viewItem.REMARKS || "-"}</div>
              </div>
              <div className="flex justify-end pt-2 border-t">
                <Button variant="outline" onClick={() => setViewItem(null)} className="text-xs">Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this labor charge entry record.</AlertDialogDescription>
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