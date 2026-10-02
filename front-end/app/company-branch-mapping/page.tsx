"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchMappings,
  loadMappings,
  addMapping,
  updateMapping,
  deleteMapping,
  clearMappingError,
  type CompanyBranchMappingData,
} from "@/lib/companyBranchMappingSlice";
import { API_URL } from "@/lib/config";
import { useToast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface DropdownItem {
  value: string;
  label: string;
}

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

/* The table stores AC/IA, the read procedure reports ACTIVE/INACTIVE, and the
   form posts AC/IA back - so every direction needs normalising. */
const toDisplayStatus = (val: string) => {
  const u = (val || "").toUpperCase();
  return u === "AC" || u === "ACTIVE" ? "ACTIVE" : "INACTIVE";
};

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IA" || u === "IN" || u === "INACTIVE") return "INACTIVE";
  return String(val || "");
};

const fmtDateTime = (v: any) => {
  if (!v) return "-";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
};

export default function CompanyBranchMappingPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.companyBranchMapping);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AC");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [companies, setCompanies] = useState<DropdownItem[]>([]);
  const [branches, setBranches] = useState<DropdownItem[]>([]);

  const fetchDropdowns = useCallback(async () => {
    /* /company-master lists the table directly; /branch-master goes through
       SHOW_BRANCH_MASTER, which filters on a single status per call. */
    await Promise.all([
      fetch(`${API_URL}/company-master`)
        .then((r) => r.json())
        .then((d) =>
          setCompanies(
            (d.data || [])
              .filter((x: any) => x.COMPANY_ID != null && x.COMPANY_NAME)
              .map((x: any) => ({ value: String(x.COMPANY_ID), label: x.COMPANY_NAME }))
          )
        )
        .catch(() => {}),
      fetch(`${API_URL}/branch-master?status=AC`)
        .then((r) => r.json())
        .then((d) =>
          setBranches(
            (d.data || [])
              .filter((x: any) => x.BRANCH_ID != null && x.BRANCH_NAME)
              .map((x: any) => ({ value: String(x.BRANCH_ID), label: x.BRANCH_NAME }))
          )
        )
        .catch(() => {}),
    ]);
  }, []);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  const role = useMemo(() => {
    if (typeof window !== "undefined") {
      const userJson = localStorage.getItem("user");
      if (userJson) {
        try {
          return JSON.parse(userJson).role || "Manager";
        } catch {}
      }
    }
    return "Manager";
  }, []);
  /* Kept in step with the role whitelist in SP_COMPANY_BRANCH_MAPPING_DELETE so
     the button is never offered to a caller the procedure would reject. */
  const isAdmin = role === "Admin" || role === "Super Admin" || role === "Administrator";

  useEffect(() => {
    dispatch(fetchMappings(statusFilter));
  }, [dispatch, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearMappingError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const targetStatus = normalizeStatus(statusFilter);
    const byId = (rows: DropdownItem[], id: any) =>
      rows.find((c) => c.value === String(id))?.label || (id == null ? "" : String(id));

    return items
      .filter((d: any) => {
        const searchable = [
          byId(companies, d.COMPANY_ID),
          byId(branches, d.BRANCH_ID),
          d.MAPPING_ID == null ? "" : String(d.MAPPING_ID),
          d.CREATED_BY || "",
          d.MODIFIED_BY || "",
        ]
          .join(" ")
          .toLowerCase();
        const statusMatch = !targetStatus || normalizeStatus(d.STATUS_MASTER) === targetStatus;
        return searchable.includes(search.toLowerCase()) && statusMatch;
      })
      .sort((a: any, b: any) => Number(b.MAPPING_ID || b.id) - Number(a.MAPPING_ID || a.id));
  }, [items, search, statusFilter, companies, branches]);

  const effectivePageSize: number | "ALL" =
    pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter(
    (s) => s === "ALL" || s <= filtered.length
  );

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  const emptyForm = () => ({
    COMPANY_ID: "",
    BRANCH_ID: "",
    STATUS_MASTER: "AC",
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
      BRANCH_ID: String(item.BRANCH_ID || ""),
      STATUS_MASTER: toDisplayStatus(item.STATUS_MASTER) === "ACTIVE" ? "AC" : "IA",
    });
    setDialogOpen(true);
  };

  /* Guards the unique (COMPANY_ID, BRANCH_ID) pair before the round trip, using
     the same read path the grid uses. The procedure re-checks regardless. */
  const pairAlreadyMapped = async (companyId: number, branchId: number, ignoreId?: number) => {
    try {
      const existing = await dispatch(loadMappings({ companyId, branchId, status: "ALL" })).unwrap();
      return (existing || []).some((m: any) => Number(m.MAPPING_ID) !== Number(ignoreId));
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!form.COMPANY_ID) {
      toast({ title: "Company is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.BRANCH_ID) {
      toast({ title: "Branch is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    const companyId = Number(form.COMPANY_ID);
    const branchId = Number(form.BRANCH_ID);
    const editingId = editing ? Number(editing.MAPPING_ID ?? editing.id) : undefined;

    setSaving(true);
    try {
      if (await pairAlreadyMapped(companyId, branchId, editingId)) {
        toast({
          title: "This company and branch are already mapped",
          variant: "destructive",
          duration: DEFAULT_TOAST_DURATION,
        });
        return;
      }

      const payload: CompanyBranchMappingData = {
        COMPANY_ID: companyId,
        BRANCH_ID: branchId,
        STATUS_MASTER: form.STATUS_MASTER,
      };

      if (editing) {
        payload.MAPPING_ID = editingId;
        const res = await dispatch(updateMapping(payload)).unwrap();
        toast({ title: res?.message ?? "Mapping updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addMapping(payload)).unwrap();
        toast({ title: res?.message ?? "Mapping created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchMappings(statusFilter));
    } catch (e: any) {
      toast({
        title: typeof e === "string" ? e : e?.payload || e?.message || "Error saving mapping",
        variant: "destructive",
        duration: DEFAULT_TOAST_DURATION,
      });
    } finally {
      setSaving(false);
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
      toast({
        title: typeof e === "string" ? e : e?.payload || e?.message || "Error deleting mapping",
        variant: "destructive",
        duration: DEFAULT_TOAST_DURATION,
      });
    }
  };

  const getCompanyName = (id: any) => companies.find((c) => c.value === String(id))?.label || id;
  const getBranchName = (id: any) => branches.find((c) => c.value === String(id))?.label || id;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Company Branch Mapping</h1>
          <p className="text-sm text-muted-foreground">
            Map each company to the branches it operates from
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Mapping
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search mappings..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-32 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AC">Active</SelectItem>
                <SelectItem value="IA">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-muted-foreground">Show</span>
            <Select
              value={String(effectivePageSize)}
              onValueChange={(v) => {
                setPageSize(v === "ALL" ? "ALL" : Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePageSizes.map((s) => (
                  <SelectItem key={String(s)} value={String(s)}>
                    {String(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground uppercase tracking-wider text-[10px]">
              entries
            </span>
          </div>
        </div>

        <div className="overflow-x-auto w-full max-w-[calc(100vw-2rem)] sm:max-w-none">
          {loading ? (
            <div className="w-full space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-4 border-b">
                  <Skeleton className="h-4 w-4" />
                  {[...Array(7)].map((_, j) => (
                    <Skeleton key={j} className="h-4 flex-1" />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">
                    Actions
                  </th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">
                    Mapping ID
                  </th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">
                    Company
                  </th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">
                    Branch
                  </th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">
                    Status
                  </th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">
                    Created By
                  </th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">
                    Created On
                  </th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">
                    Modified By
                  </th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">
                    Modified On
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => {
                  const displayStatus = toDisplayStatus(item.STATUS_MASTER);
                  const isActive = displayStatus === "ACTIVE";
                  return (
                    <tr key={item.id || idx} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 flex gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded hover:bg-muted transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteId(String(item.MAPPING_ID ?? item.id))}
                            className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        )}
                      </td>
                      <td className="p-3 font-medium">{item.MAPPING_ID}</td>
                      <td className="p-3">{getCompanyName(item.COMPANY_ID)}</td>
                      <td className="p-3">{getBranchName(item.BRANCH_ID)}</td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={`${
                            isActive
                              ? "bg-green-500/10 text-green-600 border-green-200"
                              : "bg-red-500/10 text-red-600 border-red-200"
                          } px-2 py-0.5 text-[10px] uppercase font-bold`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-3">{item.CREATED_BY || "-"}</td>
                      <td className="p-3 whitespace-nowrap">{fmtDateTime(item.CREATED_DATE)}</td>
                      <td className="p-3">{item.MODIFIED_BY || "-"}</td>
                      <td className="p-3 whitespace-nowrap">{fmtDateTime(item.MODIFIED_DATE)}</td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground font-medium">
            Showing{" "}
            {filtered.length === 0
              ? 0
              : (currentPage - 1) * (effectivePageSize === "ALL" ? 0 : effectivePageSize) + 1}{" "}
            to{" "}
            {Math.min(
              currentPage * (effectivePageSize === "ALL" ? filtered.length : effectivePageSize),
              filtered.length
            )}{" "}
            of {filtered.length} entries
          </p>
          {effectivePageSize !== "ALL" && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="h-8 text-xs"
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="h-8 w-8 text-xs p-0"
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="h-8 text-xs"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Mapping" : "Add Mapping"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">
                  Company <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.COMPANY_ID || ""}
                  onValueChange={(v) => setForm({ ...form, COMPANY_ID: v })}
                >
                  <SelectTrigger
                    className={`h-9 text-xs ${!form.COMPANY_ID ? "border-destructive" : ""}`}
                  >
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">
                  Branch <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.BRANCH_ID || ""}
                  onValueChange={(v) => setForm({ ...form, BRANCH_ID: v })}
                >
                  <SelectTrigger
                    className={`h-9 text-xs ${!form.BRANCH_ID ? "border-destructive" : ""}`}
                  >
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Status</Label>
                <Select
                  value={form.STATUS_MASTER || "AC"}
                  onValueChange={(v) => setForm({ ...form, STATUS_MASTER: v })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AC">Active</SelectItem>
                    <SelectItem value="IA">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="text-xs"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className={
                  editing
                    ? "bg-info text-info-foreground hover:bg-info/90 text-xs"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                }
              >
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this company-branch mapping record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
