"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchItems, addItem, updateItem, deleteItem, clearError, type SalaryScaleGridData } from "@/lib/newSalaryScaleSlice";
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
}

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

const COMPONENT_FIELDS = [
  { key: "BASIC", label: "Basic" },
  { key: "FOT", label: "FOT" },
  { key: "ATTENDANCE", label: "Attendance" },
  { key: "ONE_1YP", label: "One 1YP" },
  { key: "TECHNICAL", label: "Technical" },
  { key: "POLYVALENT", label: "Polyvalent" },
  { key: "RESPONSIBILITY", label: "Responsibility" },
  { key: "LOYALTY", label: "Loyalty" },
  { key: "NIGHT_ALLOWANCE", label: "Night All." },
  { key: "MISCELLANIES", label: "Miscellanies" },
  { key: "PRODUCTIVITY", label: "Productivity" },
  { key: "CAPACITY", label: "Capacity" },
  { key: "DISCIPLINARY", label: "Disciplinary" },
];

const ALLOWANCE_FIELDS = [
  { key: "HOUSE_ALLOW", label: "House Allow." },
  { key: "MEDICIAL", label: "Medicial" },
  { key: "EDUCATION", label: "Education" },
];

const EXTRA_FIELDS = [
  { key: "EXTRA1", label: "Extra 1" },
  { key: "EXTRA2", label: "Extra 2" },
  { key: "EXTRA3", label: "Extra 3" },
  { key: "EXTRA4", label: "Extra 4" },
  { key: "EXTRA5", label: "Extra 5" },
  { key: "EXTRA6", label: "Extra 6" },
];

const SALARY_SCALE_OPTIONS: DropdownItem[] = ["A", "B", "C", "D", "E", "F"].map((g) => ({
  value: `Grade ${g}`,
  label: `Grade ${g}`,
}));

export default function NewSalaryScalePage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.newSalaryScale);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AC");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [designationGroups, setDesignationGroups] = useState<DropdownItem[]>([]);

  const fetchDropdowns = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/designation-group-master`);
      const json = await res.json();
      setDesignationGroups((json.data || []).map((x: any) => ({
        value: String(x.DESIGNATION_GROUP_ID),
        label: x.DESIGNATION_GROUP_NAME
      })));
    } catch { }
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
    dispatch(fetchItems(statusFilter));
  }, [dispatch, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((d: any) => {
      const group = designationGroups.find((g) => g.value === String(d.DESIGNATION_GROUP_ID))?.label || "";
      const searchable = [d.SALARY_SCALE_NAME, group, d.REMARKS || ""].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => Number(b.SALARY_SCALE_ID || 0) - Number(a.SALARY_SCALE_ID || 0));
  }, [items, search, designationGroups]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  const emptyForm = () => ({
    DESIGNATION_GROUP_ID: "",
    SALARY_SCALE_NAME: "",
    BASIC: "",
    FOT: "",
    ATTENDANCE: "",
    ONE_1YP: "",
    TECHNICAL: "",
    POLYVALENT: "",
    RESPONSIBILITY: "",
    LOYALTY: "",
    NIGHT_ALLOWANCE: "",
    MISCELLANIES: "",
    PRODUCTIVITY: "",
    CAPACITY: "",
    DISCIPLINARY: "",
    HOUSE_ALLOW: "",
    MEDICIAL: "",
    EDUCATION: "",
    EXTRA1: "",
    EXTRA2: "",
    EXTRA3: "",
    EXTRA4: "",
    EXTRA5: "",
    EXTRA6: "",
    TOTAL: "",
    OT_NONOT: "",
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
    const f: Record<string, any> = {};
    const keys = Object.keys(emptyForm());
    for (const k of keys) {
      const val = item[k];
      if (k === "DESIGNATION_GROUP_ID") f[k] = String(val ?? "");
      else if (k === "STATUS_MASTER") f[k] = val === "ACTIVE" ? "AC" : val === "INACTIVE" ? "IA" : (val || "AC");
      else if (k === "USER") f[k] = "Admin";
      else if (k === "MAC_ADDRESS") f[k] = "WEB";
      else if (k === "REMARKS" || k === "OT_NONOT" || k === "SALARY_SCALE_NAME") f[k] = val ?? "";
      else f[k] = val ?? "";
    }
    setEditing(item);
    setForm(f);
    setDialogOpen(true);
  };

  const renderField = (
    key: string,
    label: string,
    type: "text" | "number" | "select" | "textarea",
    options?: DropdownItem[],
    required?: boolean,
    placeholder?: string,
  ) => {
    const isEmpty = required && !String(form[key] || "").trim();
    const borderClass = isEmpty ? "border-destructive ring-1 ring-destructive/30" : "";
    return (
    <div key={key} className={type === "textarea" ? "col-span-full" : "flex flex-col gap-1.5"}>
      <Label className="text-xs">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {type === "select" ? (
        <Select value={form[key] || ""} onValueChange={(v) => setForm({ ...form, [key]: v })}>
          <SelectTrigger className={`h-9 text-xs ${borderClass}`}>
            <SelectValue placeholder={placeholder || `Select ${label}`} />
          </SelectTrigger>
          <SelectContent>
            {(options || []).map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : type === "textarea" ? (
        <Textarea
          value={form[key] || ""}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          className={`text-xs ${borderClass}`}
        />
      ) : (
        <Input
          type={type === "number" ? "number" : "text"}
          min={type === "number" ? "0" : undefined}
          step={type === "number" ? "any" : undefined}
          value={form[key] ?? ""}
          onChange={(e) =>
            setForm({
              ...form,
              [key]: type === "number"
                ? (e.target.value ? Number(e.target.value) : null)
                : e.target.value,
            })
          }
          placeholder={placeholder}
          className={`h-9 text-xs ${borderClass}`}
        />
      )}
    </div>
  );
  };

  const handleSave = async () => {
    if (!editing && normalizeStatus(form.STATUS_MASTER) !== "ACTIVE") {
      toast({ title: "New records cannot be set to Inactive", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.SALARY_SCALE_NAME?.trim()) {
      toast({ title: "Salary scale name is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.DESIGNATION_GROUP_ID) {
      toast({ title: "Designation group is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    try {
      const numFields = [
        "BASIC", "FOT", "ATTENDANCE", "ONE_1YP", "TECHNICAL", "POLYVALENT",
        "RESPONSIBILITY", "LOYALTY", "NIGHT_ALLOWANCE", "MISCELLANIES",
        "PRODUCTIVITY", "CAPACITY", "DISCIPLINARY", "HOUSE_ALLOW", "MEDICIAL",
        "EDUCATION", "EXTRA1", "EXTRA2", "EXTRA3", "EXTRA4", "EXTRA5", "EXTRA6", "TOTAL"
      ];
      const payload: Record<string, any> = {
        SALARY_SCALE_NAME: form.SALARY_SCALE_NAME.trim(),
        DESIGNATION_GROUP_ID: Number(form.DESIGNATION_GROUP_ID),
        OT_NONOT: form.OT_NONOT?.trim() || null,
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_MASTER: form.STATUS_MASTER,
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      };
      for (const f of numFields) {
        payload[f] = form[f] === "" || form[f] === null || form[f] === undefined ? null : Math.max(0, Number(form[f]) || 0);
      }

      if (editing) {
        payload.SALARY_SCALE_ID = Number(editing.id);
        const res = await dispatch(updateItem(payload as SalaryScaleGridData)).unwrap();
        toast({ title: res?.message ?? "Salary scale updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addItem(payload as SalaryScaleGridData)).unwrap();
        toast({ title: res?.message ?? "Salary scale created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchItems(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error saving salary scale"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteItem(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Salary scale deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchItems(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error deleting salary scale"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const getGroupName = (id: any) => designationGroups.find((g) => g.value === String(id))?.label || id;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Salary Scale Master</h1>
          <p className="text-sm text-muted-foreground">Manage new salary scale master data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Salary Scale
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search salary scales..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Group</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Basic</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Total</th>
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
                    <td className="p-3 font-medium">{item.SALARY_SCALE_ID}</td>
                    <td className="p-3">{item.SALARY_SCALE_NAME}</td>
                    <td className="p-3">{item.DESIGNATION_GROUP_NAME || getGroupName(item.DESIGNATION_GROUP_ID)}</td>
                    <td className="p-3">{item.BASIC ?? "-"}</td>
                    <td className="p-3">{item.TOTAL ?? "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "Active" : "Inactive"}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Salary Scale" : "Add Salary Scale"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-full">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pb-1 border-b">Basic Information</h3>
              </div>
              {renderField("DESIGNATION_GROUP_ID", "Designation Group", "select", designationGroups, true, "Select group")}
              {renderField("SALARY_SCALE_NAME", "Scale Name", "select", SALARY_SCALE_OPTIONS, true, "Select grade")}
              {renderField("STATUS_MASTER", "Status", "select", [
                { value: "AC", label: "Active" },
                { value: "IA", label: "Inactive" },
              ])}
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-full">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pb-1 border-b">Salary Components</h3>
              </div>
              {COMPONENT_FIELDS.map(({ key, label }) =>
                renderField(key, label, "number", undefined, false, "0")
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-full">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pb-1 border-b">Allowances & Education</h3>
              </div>
              {ALLOWANCE_FIELDS.map(({ key, label }) =>
                renderField(key, label, "number", undefined, false, "0")
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-full">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pb-1 border-b">Extra Fields</h3>
              </div>
              {EXTRA_FIELDS.map(({ key, label }) =>
                renderField(key, label, "number", undefined, false, "0")
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-full">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pb-1 border-b">Summary</h3>
              </div>
              {renderField("TOTAL", "Total", "number", undefined, false, "0")}
              {renderField("OT_NONOT", "OT / Non-OT", "text", undefined, false, "e.g., OT")}
              <div className="col-span-full">
                {renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}
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
            <AlertDialogDescription>This will permanently delete this salary scale record.</AlertDialogDescription>
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
