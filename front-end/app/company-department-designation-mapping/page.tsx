"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, Check, ChevronsUpDown, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchMappings, addMapping, updateMapping, deleteMapping, clearMappingError, type MappingGridData } from "@/lib/companyDepartmentDesignationMappingSlice";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

interface DropdownItem {
  value: string;
  label: string;
}

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

export default function CompanyDepartmentDesignationMappingPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.companyDepartmentDesignationMapping);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AC");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteGroup, setDeleteGroup] = useState<any>(null);
  const [designationsOpen, setDesignationsOpen] = useState(false);

  const [companies, setCompanies] = useState<DropdownItem[]>([]);
  const [departments, setDepartments] = useState<DropdownItem[]>([]);
  const [designations, setDesignations] = useState<DropdownItem[]>([]);
  const [departmentGroups, setDepartmentGroups] = useState<DropdownItem[]>([]);

  const fetchDropdowns = useCallback(async () => {
    const fetches = [
      fetch(`${API_URL}/company-master`).then(r => r.json())
        .then(d => setCompanies((d.data || []).filter((x: any) => x.COMPANY_ID != null && x.COMPANY_NAME).map((x: any) => ({
          value: String(x.COMPANY_ID),
          label: x.COMPANY_NAME
        })))).catch(() => {}),
      fetch(`${API_URL}/department-master`).then(r => r.json())
        .then(d => setDepartments((d.data || []).filter((x: any) => x.DEPARTMENT_ID != null && x.DEPARTMENT_NAME).map((x: any) => ({
          value: String(x.DEPARTMENT_ID),
          label: x.DEPARTMENT_NAME
        })))).catch(() => {}),
      fetch(`${API_URL}/designation-master`).then(r => r.json())
        .then(d => setDesignations((d.data || []).filter((x: any) => x.DESIGNATION_ID != null && x.DESIGNATION_NAME).map((x: any) => ({
          value: String(x.DESIGNATION_ID),
          label: x.DESIGNATION_NAME
        })))).catch(() => {}),
      fetch(`${API_URL}/department-group-master`).then(r => r.json())
        .then(d => setDepartmentGroups((d.data || []).filter((x: any) => x.DEPARTMENT_GROUP_ID != null && x.DEPARTMENT_GROUP_NAME).map((x: any) => ({
          value: String(x.DEPARTMENT_GROUP_ID),
          label: x.DEPARTMENT_GROUP_NAME
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

  const filteredRecords = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((d: any) => {
      const company = companies.find((c) => c.value === String(d.COMPANY_ID))?.label || "";
      const department = departments.find((c) => c.value === String(d.DEPARTMENT_ID))?.label || "";
      const designation = designations.find((c) => c.value === String(d.DESIGNATION_ID))?.label || "";
      const group = departmentGroups.find((c) => c.value === String(d.DEPARTMENT_GROUP_ID))?.label || "";
      const searchable = [company, department, designation, group, d.REMARKS || ""].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => {
      const aId = Number(a.SNO ?? a.COMPANY_ID ?? 0);
      const bId = Number(b.SNO ?? b.COMPANY_ID ?? 0);
      return bId - aId;
    });
  }, [items, search, companies, departments, designations, departmentGroups]);

  const groupedFull = useMemo(() => {
    if (!Array.isArray(filteredRecords)) return [];
    const groups: any[] = [];
    const map = new Map<string, any>();
    for (const item of filteredRecords) {
      if (item.DESIGNATION_ID == null) continue;
      const key = `${item.COMPANY_ID}|${item.DEPARTMENT_ID}|${item.DEPARTMENT_GROUP_ID ?? ""}|${item.STATUS_MASTER ?? ""}`;
      if (!map.has(key)) {
        const g = {
          COMPANY_ID: item.COMPANY_ID,
          DEPARTMENT_ID: item.DEPARTMENT_ID,
          DEPARTMENT_GROUP_ID: item.DEPARTMENT_GROUP_ID,
          STATUS_MASTER: item.STATUS_MASTER,
          REMARKS: item.REMARKS,
          key,
          snoIds: [] as (string | number)[],
          designIds: [] as string[],
        };
        map.set(key, g);
        groups.push(g);
      }
      const g = map.get(key);
      if (item.SNO != null) g.snoIds.push(item.SNO);
      g.designIds.push(String(item.DESIGNATION_ID));
    }
    return groups;
  }, [filteredRecords]);

  const getBlockedDesignations = useCallback((company: string, department: string) => {
    const set = new Set<string>();
    if (!company || !department || !Array.isArray(items)) return set;
    const editSnoSet = editing ? new Set(editing.snoIds.map((n: any) => String(n))) : null;
    for (const item of items) {
      if (String(item.COMPANY_ID) === String(company) && String(item.DEPARTMENT_ID) === String(department)) {
        if (editSnoSet && editSnoSet.has(String(item.SNO))) continue;
        set.add(String(item.DESIGNATION_ID));
      }
    }
    return set;
  }, [items, editing]);

  const blockedDesignations = useMemo(
    () => getBlockedDesignations(form.COMPANY_ID, form.DEPARTMENT_ID),
    [getBlockedDesignations, form.COMPANY_ID, form.DEPARTMENT_ID]
  );

  const cleanDesignations = useCallback(
    (current: string[] | undefined, company: string, department: string) => {
      const blocked = getBlockedDesignations(company, department);
      return (Array.isArray(current) ? current : []).filter((id: string) => !blocked.has(id));
    },
    [getBlockedDesignations]
  );

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > groupedFull.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= groupedFull.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(groupedFull.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return groupedFull;
    const start = (currentPage - 1) * effectivePageSize;
    return groupedFull.slice(start, start + effectivePageSize);
  }, [groupedFull, currentPage, effectivePageSize]);

  const emptyForm = () => ({
    COMPANY_ID: "",
    DEPARTMENT_ID: "",
    DESIGNATION_ID: [],
    DEPARTMENT_GROUP_ID: "",
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

  const openEdit = (group: any) => {
    setEditing(group);
    setForm({
      COMPANY_ID: String(group.COMPANY_ID || ""),
      DEPARTMENT_ID: String(group.DEPARTMENT_ID || ""),
      DESIGNATION_ID: (Array.isArray(group.designIds) ? group.designIds : []).map((id: string) => String(id)),
      DEPARTMENT_GROUP_ID: String(group.DEPARTMENT_GROUP_ID || ""),
      REMARKS: group.REMARKS || "",
      STATUS_MASTER: group.STATUS_MASTER === "ACTIVE" ? "AC" : group.STATUS_MASTER === "INACTIVE" ? "IA" : (group.STATUS_MASTER || "AC"),
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
    if (!form.DEPARTMENT_ID) {
      toast({ title: "Department is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.DESIGNATION_ID || form.DESIGNATION_ID.length === 0) {
      toast({ title: "Designation is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.DEPARTMENT_GROUP_ID) {
      toast({ title: "Department Group is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    try {
      const companyNum = Number(form.COMPANY_ID);
      const deptNum = Number(form.DEPARTMENT_ID);
      const groupNum = form.DEPARTMENT_GROUP_ID ? Number(form.DEPARTMENT_GROUP_ID) : null;
      const remark = form.REMARKS?.trim() || null;

      if (editing) {
        const desired = (Array.isArray(form.DESIGNATION_ID) ? form.DESIGNATION_ID : [form.DESIGNATION_ID]).map((id: string) => String(id));
        const originalSnos = new Set((editing.snoIds || []).map((n: any) => String(n)));
        const originalItems = (Array.isArray(items) ? items : []).filter((x: any) => originalSnos.has(String(x.SNO)));

        const sameCombo =
          String(editing.COMPANY_ID) === String(form.COMPANY_ID) &&
          String(editing.DEPARTMENT_ID) === String(form.DEPARTMENT_ID) &&
          String(editing.DEPARTMENT_GROUP_ID || "") === String(form.DEPARTMENT_GROUP_ID || "");

        if (!sameCombo) {
          for (const sno of originalSnos) {
            await dispatch(deleteMapping(Number(sno))).unwrap();
          }
          let lastRes: any = null;
          for (const desigId of desired) {
            const payload: Record<string, any> = {
              COMPANY_ID: companyNum,
              DEPARTMENT_ID: deptNum,
              DESIGNATION_ID: Number(desigId),
              DEPARTMENT_GROUP_ID: groupNum ?? undefined,
              REMARKS: remark,
              STATUS_MASTER: form.STATUS_MASTER,
              USER: "Admin",
              MAC_ADDRESS: "WEB",
            };
            lastRes = await dispatch(addMapping(payload as MappingGridData)).unwrap();
          }
          toast({ title: lastRes?.message ?? "Mapping updated successfully", duration: DEFAULT_TOAST_DURATION });
        } else {
          const existingByDesign = new Map<string, any>();
          for (const x of originalItems) existingByDesign.set(String(x.DESIGNATION_ID), x);

          const toDelete: number[] = [];
          const forUpdate: Record<string, any>[] = [];
          const toAdd: string[] = [];

          for (const x of originalItems) {
            if (desired.includes(String(x.DESIGNATION_ID))) {
              forUpdate.push({
                SNO: Number(x.SNO),
                COMPANY_ID: companyNum,
                DEPARTMENT_ID: deptNum,
                DESIGNATION_ID: Number(x.DESIGNATION_ID),
                DEPARTMENT_GROUP_ID: groupNum ?? undefined,
                REMARKS: remark,
                STATUS_MASTER: form.STATUS_MASTER,
                USER: "Admin",
                MAC_ADDRESS: "WEB",
              });
            } else {
              toDelete.push(Number(x.SNO));
            }
          }
          for (const des of desired) {
            if (!existingByDesign.has(des)) toAdd.push(des);
          }

          for (const sno of toDelete) {
            await dispatch(deleteMapping(sno)).unwrap();
          }
          for (const payload of forUpdate) {
            await dispatch(updateMapping(payload as MappingGridData)).unwrap();
          }
          let lastRes: any = null;
          for (const desigId of toAdd) {
            const payload: Record<string, any> = {
              COMPANY_ID: companyNum,
              DEPARTMENT_ID: deptNum,
              DESIGNATION_ID: Number(desigId),
              DEPARTMENT_GROUP_ID: groupNum ?? undefined,
              REMARKS: remark,
              STATUS_MASTER: form.STATUS_MASTER,
              USER: "Admin",
              MAC_ADDRESS: "WEB",
            };
            lastRes = await dispatch(addMapping(payload as MappingGridData)).unwrap();
          }
          toast({ title: lastRes?.message ?? "Mapping updated successfully", duration: DEFAULT_TOAST_DURATION });
        }
      } else {
        const selectedDesignations = (Array.isArray(form.DESIGNATION_ID) ? form.DESIGNATION_ID : [form.DESIGNATION_ID]).filter((id: string) => !blockedDesignations.has(id));
        let lastRes: any = null;
        for (const desigId of selectedDesignations) {
          const payload: Record<string, any> = {
            COMPANY_ID: companyNum,
            DEPARTMENT_ID: deptNum,
            DESIGNATION_ID: Number(desigId),
            DEPARTMENT_GROUP_ID: groupNum ?? undefined,
            REMARKS: remark,
            STATUS_MASTER: form.STATUS_MASTER,
            USER: "Admin",
            MAC_ADDRESS: "WEB",
          };
          lastRes = await dispatch(addMapping(payload as MappingGridData)).unwrap();
        }
        toast({ title: lastRes?.message ?? "Mapping(s) created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchMappings(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error saving mapping"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteGroup || !Array.isArray(deleteGroup.snoIds)) return;
    try {
      let lastRes: any = null;
      for (const sno of deleteGroup.snoIds) {
        lastRes = await dispatch(deleteMapping(sno)).unwrap();
      }
      setDeleteGroup(null);
      toast({ title: lastRes?.message ?? "Mapping(s) deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchMappings(statusFilter));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : (e?.payload || e?.message || "Error deleting mapping"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const getCompanyName = (id: any) => companies.find((c) => c.value === String(id))?.label || id;
  const getDeptName = (id: any) => departments.find((c) => c.value === String(id))?.label || id;
  const getDesigName = (id: any) => designations.find((c) => c.value === String(id))?.label || id;
  const getGroupName = (id: any) => departmentGroups.find((c) => c.value === String(id))?.label || id;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Company Department Designation Mapping</h1>
          <p className="text-sm text-muted-foreground">Manage company-department-designation mapping</p>
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
                  {[...Array(6)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">SNO</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Department</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Designation</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Group</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Remarks</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => (
                  <tr key={item.key || (item.designIds?.join() || idx)} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                      {isAdmin && <button onClick={() => setDeleteGroup(item)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>}
                    </td>
                    <td className="p-3 font-medium">{Array.isArray(item.snoIds) ? item.snoIds[0] : item.SNO}</td>
                    <td className="p-3">{getCompanyName(item.COMPANY_ID)}</td>
                    <td className="p-3">{getDeptName(item.DEPARTMENT_ID)}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        {(item.designIds || []).map((id: any) => (
                          <Badge key={String(id)} variant="secondary" className="font-normal text-[10px] px-2 py-0.5">
                            {getDesigName(id)}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">{item.DEPARTMENT_GROUP_ID ? getGroupName(item.DEPARTMENT_GROUP_ID) : "-"}</td>
                    <td className="p-3">{item.REMARKS || "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {normalizeStatus(item.STATUS_MASTER) === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No records found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground font-medium">
            Showing {groupedFull.length === 0 ? 0 : ((currentPage - 1) * (effectivePageSize === "ALL" ? 0 : effectivePageSize)) + 1} to {Math.min(currentPage * (effectivePageSize === "ALL" ? groupedFull.length : effectivePageSize), groupedFull.length)} of {groupedFull.length} entries
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
                <Select value={form.COMPANY_ID || ""} onValueChange={(v) => setForm((prev) => ({ ...prev, COMPANY_ID: v, DESIGNATION_ID: cleanDesignations(prev.DESIGNATION_ID, v, prev.DEPARTMENT_ID) }))}>
                  <SelectTrigger className={cn("h-9 text-xs", !form.COMPANY_ID && "border-destructive")}><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Department <span className="text-destructive">*</span></Label>
                <Select value={form.DEPARTMENT_ID || ""} onValueChange={(v) => setForm((prev) => ({ ...prev, DEPARTMENT_ID: v, DESIGNATION_ID: cleanDesignations(prev.DESIGNATION_ID, prev.COMPANY_ID, v) }))}>
                  <SelectTrigger className={cn("h-9 text-xs", !form.DEPARTMENT_ID && "border-destructive")}><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Department Group <span className="text-destructive">*</span></Label>
                <Select value={form.DEPARTMENT_GROUP_ID || ""} onValueChange={(v) => setForm({ ...form, DEPARTMENT_GROUP_ID: v })}>
                  <SelectTrigger className={cn("h-9 text-xs", !form.DEPARTMENT_GROUP_ID && "border-destructive")}><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>
                    {departmentGroups.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs mb-1 block">Designation(s) <span className="text-destructive">*</span></Label>
                <Popover open={designationsOpen} onOpenChange={setDesignationsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={designationsOpen}
                      className={cn("w-full justify-between min-h-10 h-auto p-2", (!form.DESIGNATION_ID || form.DESIGNATION_ID.length === 0) && "border-destructive")}
                      disabled={loading}
                    >
                      <div className="flex flex-wrap gap-1 items-center">
                        {form.DESIGNATION_ID && form.DESIGNATION_ID.length > 0 ? (
                          <>
                            <Badge variant="secondary" className="font-normal text-[10px]">
                              {form.DESIGNATION_ID.length} selected
                            </Badge>
                            {form.DESIGNATION_ID.slice(0, 3).map((id: string) => {
                              const desig = designations.find(d => String(d.value) === id);
                              return (
                                <Badge key={id} variant="outline" className="font-normal hidden sm:inline-flex text-[10px]">
                                  {desig?.label || id}
                                </Badge>
                              );
                            })}
                            {form.DESIGNATION_ID.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{form.DESIGNATION_ID.length - 3} more</span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground font-normal text-xs">{loading ? "Loading..." : "Select Designations..."}</span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search designation..." />
                      <CommandList>
                        <CommandEmpty>No designation found.</CommandEmpty>
                        <CommandGroup>
                          {designations.map((l) => {
                            const sid = String(l.value);
                            const blocked = blockedDesignations.has(sid);
                            return (
                            <CommandItem
                              key={l.value}
                              value={l.label}
                              disabled={blocked}
                              onSelect={() => {
                                if (blocked) return;
                                let curr = Array.isArray(form.DESIGNATION_ID) ? [...form.DESIGNATION_ID] : [];
                                curr = curr.includes(sid) ? curr.filter(p => p !== sid) : [...curr, sid];
                                setForm({ ...form, DESIGNATION_ID: curr });
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  Array.isArray(form.DESIGNATION_ID) && form.DESIGNATION_ID.includes(sid) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {l.label}
                              {blocked && <span className="ml-auto text-[10px] text-muted-foreground">Already mapped</span>}
                            </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <div className="flex items-center justify-between mt-2 mb-1">
                  <Label className="text-[10px] text-muted-foreground">Selected ({Array.isArray(form.DESIGNATION_ID) ? form.DESIGNATION_ID.length : 0})</Label>
                  {Array.isArray(form.DESIGNATION_ID) && form.DESIGNATION_ID.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 text-[10px] px-2"
                        onClick={() => setForm({ ...form, DESIGNATION_ID: designations.filter(d => !blockedDesignations.has(String(d.value))).map(d => String(d.value)) })}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 text-[10px] px-2 text-destructive hover:text-destructive"
                        onClick={() => setForm({ ...form, DESIGNATION_ID: [] })}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
                <div className="rounded-md border p-2 max-h-32 overflow-y-auto bg-background/50">
                  {(() => {
                    const selectedIds = Array.isArray(form.DESIGNATION_ID) ? form.DESIGNATION_ID : [];
                    const blockedIds = Array.from(blockedDesignations).filter(id => designations.some(d => String(d.value) === id));
                    const hasAny = selectedIds.length > 0 || blockedIds.length > 0;
                    if (!hasAny) {
                      return <p className="text-xs text-muted-foreground text-center py-2">No designations selected</p>;
                    }
                    return (
                      <>
                        {selectedIds.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedIds.map((id: string) => {
                              const desig = designations.find(l => String(l.value) === id);
                              return (
                                <span
                                  key={id}
                                  className="inline-flex items-center gap-1 rounded-sm border bg-secondary/50 px-2 py-1 text-[10px] font-medium"
                                >
                                  {desig?.label || id}
                                  <button
                                    type="button"
                                    onClick={() => setForm({ ...form, DESIGNATION_ID: form.DESIGNATION_ID.filter((p: string) => p !== id) })}
                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {blockedIds.length > 0 && (
                          <div className="mt-1.5">
                            <p className="text-[10px] text-muted-foreground mb-1">Already mapped for this company &amp; department ({blockedIds.length})</p>
                            <div className="flex flex-wrap gap-1.5">
                              {blockedIds.map((id: string) => {
                                const desig = designations.find(l => String(l.value) === id);
                                return (
                                  <span
                                    key={id}
                                    className="inline-flex items-center gap-1 rounded-sm border border-dashed bg-muted/40 px-2 py-1 text-[10px] font-medium text-muted-foreground"
                                  >
                                    {desig?.label || id}
                                    <span className="rounded bg-muted px-1 py-0.5 text-[9px] uppercase tracking-wide">Already mapped</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Status</Label>
                <Select value={form.STATUS_MASTER || "AC"} onValueChange={(v) => setForm({ ...form, STATUS_MASTER: v })} disabled={!editing}>
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
              {editing ? (
                <Button onClick={handleSave} className="bg-info text-info-foreground hover:bg-info/90 text-xs">Update</Button>
              ) : (
                <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs">Create</Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteGroup} onOpenChange={(open) => !open && setDeleteGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this mapping group and all its designations.</AlertDialogDescription>
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
