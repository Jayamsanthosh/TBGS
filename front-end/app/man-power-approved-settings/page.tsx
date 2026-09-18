"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchManPowerApprovedSettings,
  addManPowerApprovedSettings,
  updateManPowerApprovedSettings,
  deleteManPowerApprovedSettings,
  clearManPowerApprovedSettingsError,
  type ManPowerApprovedSettingsGridData,
} from "@/lib/manPowerApprovedSettingsSlice";
import { API_URL } from "@/lib/config";
import { clampNonNegative } from "@/lib/validation";
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

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

export default function ManPowerApprovedSettingsPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.manPowerApprovedSettings);
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
  const [departments, setDepartments] = useState<DropdownItem[]>([]);
  const [designations, setDesignations] = useState<DropdownItem[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<DropdownItem[]>([]);
  const [deptDesigMappings, setDeptDesigMappings] = useState<any[]>([]);

  const fetchDropdowns = useCallback(async () => {
    const fetches = [
      fetch(`${API_URL}/company-master`).then(r => r.json())
        .then(d => setCompanies((d.data || []).map((x: any) => ({
          value: String(x.COMPANY_ID),
          label: x.COMPANY_NAME
        })))).catch(() => {}),
      fetch(`${API_URL}/department-master`).then(r => r.json())
        .then(d => setDepartments((d.data || []).map((x: any) => ({
          value: String(x.DEPARTMENT_ID),
          label: x.DEPARTMENT_NAME
        })))).catch(() => {}),
      fetch(`${API_URL}/designation-master`).then(r => r.json())
        .then(d => setDesignations((d.data || []).map((x: any) => ({
          value: String(x.DESIGNATION_ID),
          label: x.DESIGNATION_NAME
        })))).catch(() => {}),
      fetch(`${API_URL}/employment-type-master`).then(r => r.json())
        .then(d => setEmploymentTypes((d.data || []).map((x: any) => ({
          value: String(x.EMPLOYMENT_TYPE_ID),
          label: x.EMPLOYMENT_TYPE_NAME
        })))).catch(() => {}),
      fetch(`${API_URL}/company-department-designation-mapping?status=AC`).then(r => r.json())
        .then(d => setDeptDesigMappings(d.data || [])).catch(() => {}),
    ];
    await Promise.all(fetches);
  }, []);

  useEffect(() => { fetchDropdowns(); }, [fetchDropdowns]);

  const cascadeMaps = useMemo(() => {
    const companyDept = new Map<string, Set<string>>();
    const companyDeptDesig = new Map<string, Set<string>>();

    if (Array.isArray(deptDesigMappings)) {
      for (const m of deptDesigMappings) {
        if (m.COMPANY_ID == null || m.DEPARTMENT_ID == null) continue;
        const ck = String(m.COMPANY_ID);
        const dk = String(m.DEPARTMENT_ID);
        const deptSet = companyDept.get(ck) || new Set<string>();
        deptSet.add(dk);
        companyDept.set(ck, deptSet);
        if (m.DESIGNATION_ID != null) {
          const key = `${ck}#${dk}`;
          const desigSet = companyDeptDesig.get(key) || new Set<string>();
          desigSet.add(String(m.DESIGNATION_ID));
          companyDeptDesig.set(key, desigSet);
        }
      }
    }

    return { companyDept, companyDeptDesig };
  }, [deptDesigMappings]);

  const cascadeFiltered = (
    key: string,
    arr: DropdownItem[] | undefined,
    ids: Set<string> | undefined
  ) =>
    (form: Record<string, any>) => {
      if (!Array.isArray(arr)) return [];
      const filtered = ids ? arr.filter((x: any) => ids.has(String(x.value))) : [];
      const selected =
        form[key] != null && form[key] !== ""
          ? arr.find((x: any) => String(x.value) === String(form[key]))
          : undefined;
      if (selected && !filtered.some((x: any) => String(x.value) === String(selected.value))) {
        return [...filtered, selected];
      }
      return filtered;
    };

  const departmentOptionsByCompany = useMemo(
    () =>
      cascadeFiltered(
        "DEPARTMENT_ID",
        departments,
        form.COMPANY_ID != null && form.COMPANY_ID !== "" ? cascadeMaps.companyDept.get(String(form.COMPANY_ID)) : undefined
      ),
    [departments, cascadeMaps, form.COMPANY_ID]
  );

  const designationOptionsByCompanyDept = useMemo(
    () =>
      cascadeFiltered(
        "DESIGNATION_ID",
        designations,
        form.COMPANY_ID != null && form.COMPANY_ID !== "" && form.DEPARTMENT_ID != null && form.DEPARTMENT_ID !== ""
          ? cascadeMaps.companyDeptDesig.get(`${String(form.COMPANY_ID)}#${String(form.DEPARTMENT_ID)}`)
          : undefined
      ),
    [designations, cascadeMaps, form.COMPANY_ID, form.DEPARTMENT_ID]
  );

  const setField = (key: string, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "COMPANY_ID") {
        next.DEPARTMENT_ID = "";
        next.DESIGNATION_ID = "";
      }
      if (key === "DEPARTMENT_ID") {
        next.DESIGNATION_ID = "";
      }
      return next;
    });
  };

  const role = useMemo(() => {
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        try { return JSON.parse(userJson).role || 'Admin'; } catch { }
      }
    }
    return 'Admin';
  }, []);
  const isAdmin = role === "Admin" || role === "Super Admin" || role === "Administrator";

  useEffect(() => {
    dispatch(fetchManPowerApprovedSettings(statusFilter));
  }, [dispatch, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearManPowerApprovedSettingsError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((d: any) => {
      const searchable = [
        d.COMPANY_NAME || "",
        d.DEPARTMENT_NAME || "",
        d.DESIGNATION_NAME || "",
        d.EMPLOYMENT_TYPE_NAME || "",
        d.NEW_APPROVED_MAN_POWER || "",
        d.APPROVED_BY || "",
        d.REMARKS || "",
      ].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => Number(b.MAN_POWER_APPROVED_ID || 0) - Number(a.MAN_POWER_APPROVED_ID || 0));
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
    COMPANY_ID: "",
    DEPARTMENT_ID: "",
    DESIGNATION_ID: "",
    EMPLOYMENT_TYPE_ID: "",
    NEW_APPROVED_MAN_POWER: "",
    MAN_POWER_REQUEST_ID: "",
    APPROVED_BY: "",
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
      DEPARTMENT_ID: String(item.DEPARTMENT_ID || ""),
      DESIGNATION_ID: String(item.DESIGNATION_ID || ""),
      EMPLOYMENT_TYPE_ID: String(item.EMPLOYMENT_TYPE_ID || ""),
      NEW_APPROVED_MAN_POWER: item.NEW_APPROVED_MAN_POWER != null ? String(item.NEW_APPROVED_MAN_POWER) : "",
      MAN_POWER_REQUEST_ID: item.MAN_POWER_REQUEST_ID != null ? String(item.MAN_POWER_REQUEST_ID) : "",
      APPROVED_BY: item.APPROVED_BY || "",
      REMARKS: item.REMARKS || "",
      STATUS_MASTER: item.STATUS_MASTER === "ACTIVE" ? "AC" : item.STATUS_MASTER === "INACTIVE" ? "IA" : (item.STATUS_MASTER || "AC"),
      USER: "Admin",
      MAC_ADDRESS: "WEB",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing && normalizeStatus(form.STATUS_MASTER) === "INACTIVE") {
      toast({ title: "New records cannot be set to Inactive", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.COMPANY_ID) {
      toast({ title: "Company is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.DEPARTMENT_ID) {
      toast({ title: "Department is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.DESIGNATION_ID) {
      toast({ title: "Designation is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.EMPLOYMENT_TYPE_ID) {
      toast({ title: "Employment type is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    const payload: Record<string, any> = {
      COMPANY_ID: Number(form.COMPANY_ID),
      DEPARTMENT_ID: Number(form.DEPARTMENT_ID),
      DESIGNATION_ID: Number(form.DESIGNATION_ID),
      EMPLOYMENT_TYPE_ID: Number(form.EMPLOYMENT_TYPE_ID),
      NEW_APPROVED_MAN_POWER: form.NEW_APPROVED_MAN_POWER ? Math.max(0, Number(form.NEW_APPROVED_MAN_POWER) || 0) : null,
      MAN_POWER_REQUEST_ID: form.MAN_POWER_REQUEST_ID ? Math.max(0, Number(form.MAN_POWER_REQUEST_ID) || 0) : null,
      APPROVED_BY: form.APPROVED_BY?.trim() || null,
      REMARKS: form.REMARKS?.trim() || null,
      STATUS_MASTER: form.STATUS_MASTER,
      USER: "Admin",
      MAC_ADDRESS: "WEB",
    };

    try {
      if (editing) {
        payload.MAN_POWER_APPROVED_ID = Number(editing.id);
        const res = await dispatch(updateManPowerApprovedSettings(payload as ManPowerApprovedSettingsGridData)).unwrap();
        toast({ title: res?.message ?? "Settings updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addManPowerApprovedSettings(payload as ManPowerApprovedSettingsGridData)).unwrap();
        toast({ title: res?.message ?? "Settings created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchManPowerApprovedSettings(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error saving settings"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteManPowerApprovedSettings(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Settings deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchManPowerApprovedSettings(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error deleting settings"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const setFormKey = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Man Power Approved Settings</h1>
          <p className="text-sm text-muted-foreground">Manage approved man power settings</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Settings
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search settings..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Department</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Designation</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Emp Type</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">New Approved MP</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Request ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Approved By</th>
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
                    <td className="p-3 font-medium">{item.MAN_POWER_APPROVED_ID}</td>
                    <td className="p-3">{item.COMPANY_NAME || "-"}</td>
                    <td className="p-3">{item.DEPARTMENT_NAME || "-"}</td>
                    <td className="p-3">{item.DESIGNATION_NAME || "-"}</td>
                    <td className="p-3">{item.EMPLOYMENT_TYPE_NAME || "-"}</td>
                    <td className="p-3">{item.NEW_APPROVED_MAN_POWER ?? "-"}</td>
                    <td className="p-3">{item.MAN_POWER_REQUEST_ID ?? "-"}</td>
                    <td className="p-3">{item.APPROVED_BY || "-"}</td>
                    <td className="p-3">{item.REMARKS || "-"}</td>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Approved Settings" : "Add Approved Settings"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Company <span className="text-destructive">*</span></Label>
                <Select value={form.COMPANY_ID || ""} onValueChange={(v) => setField("COMPANY_ID", v)}>
                  <SelectTrigger className={`h-9 text-xs ${!form.COMPANY_ID ? "border-destructive ring-1 ring-destructive/30" : ""}`}><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Department <span className="text-destructive">*</span></Label>
                <Select value={form.DEPARTMENT_ID || ""} onValueChange={(v) => setField("DEPARTMENT_ID", v)}>
                  <SelectTrigger className={`h-9 text-xs ${!form.DEPARTMENT_ID ? "border-destructive ring-1 ring-destructive/30" : ""}`} disabled={!form.COMPANY_ID}><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departmentOptionsByCompany(form).map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Designation <span className="text-destructive">*</span></Label>
                <Select value={form.DESIGNATION_ID || ""} onValueChange={(v) => setFormKey("DESIGNATION_ID", v)}>
                  <SelectTrigger className={`h-9 text-xs ${!form.DESIGNATION_ID ? "border-destructive ring-1 ring-destructive/30" : ""}`} disabled={!form.DEPARTMENT_ID}><SelectValue placeholder="Select designation" /></SelectTrigger>
                  <SelectContent>
                    {designationOptionsByCompanyDept(form).map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Employment Type <span className="text-destructive">*</span></Label>
                <Select value={form.EMPLOYMENT_TYPE_ID || ""} onValueChange={(v) => setFormKey("EMPLOYMENT_TYPE_ID", v)}>
                  <SelectTrigger className={`h-9 text-xs ${!form.EMPLOYMENT_TYPE_ID ? "border-destructive ring-1 ring-destructive/30" : ""}`}><SelectValue placeholder="Select employment type" /></SelectTrigger>
                  <SelectContent>
                    {employmentTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">New Approved Man Power</Label>
                <Input type="number" min="0" step="any" className="h-9 text-xs" value={form.NEW_APPROVED_MAN_POWER || ""} onChange={(e) => setFormKey("NEW_APPROVED_MAN_POWER", clampNonNegative(e.target.value))} placeholder="0" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Man Power Request ID</Label>
                <Input type="number" min="0" step="any" className="h-9 text-xs" value={form.MAN_POWER_REQUEST_ID || ""} onChange={(e) => setFormKey("MAN_POWER_REQUEST_ID", clampNonNegative(e.target.value))} placeholder="0" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Approved By</Label>
                <Input className="h-9 text-xs" value={form.APPROVED_BY || ""} onChange={(e) => setFormKey("APPROVED_BY", e.target.value)} placeholder="Approver name" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Status</Label>
                <Select value={form.STATUS_MASTER || "AC"} onValueChange={(v) => setFormKey("STATUS_MASTER", v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AC">Active</SelectItem>
                    <SelectItem value="IA">Inactive</SelectItem>
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
              <Button onClick={handleSave} className={`${editing ? "bg-info text-info-foreground hover:bg-info/90" : "bg-primary text-primary-foreground hover:bg-primary/90"} text-xs`}>{editing ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete these man power approved settings.</AlertDialogDescription>
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
