"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchAdditionalChargeTypes,
  fetchAdditionalChargeTypeById,
  addAdditionalChargeType,
  updateAdditionalChargeType,
  deleteAdditionalChargeType,
  clearAdditionalChargeTypeError,
  AdditionalChargeTypeGridData,
} from "@/lib/additionalChargeTypeMasterSlice";
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

/** Column limits from the DDL: CODE VARCHAR(30), NAME VARCHAR(100), REMARKS VARCHAR(100) */
const CODE_MAX = 30;
const NAME_MAX = 100;
const REMARKS_MAX = 100;
const DESCRIPTION_MAX = 500;

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

const pickVal = (src: any, keys: string[]) => {
  for (const key of keys) {
    if (src[key] !== undefined && src[key] !== null) return src[key];
  }
  return "";
};

export default function AdditionalChargeTypeMasterPage() {
  const dispatch = useAppDispatch();
  const { items, total, loading, error } = useAppSelector((s) => s.additionalChargeTypeMaster);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdditionalChargeTypeGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const role = useMemo(() => {
    if (typeof window !== "undefined") {
      const userJson = localStorage.getItem("user");
      if (userJson) {
        try { return JSON.parse(userJson).role || "Manager"; } catch { }
      }
    }
    return "Manager";
  }, []);
  const isAdmin = role === "Admin" || role === "Super Admin" || role === "Administrator";

  const data = useMemo(() => Array.isArray(items) ? items : [], [items]);

  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    data.forEach((d: any) => {
      const s = d.statusMaster || d.STATUS_MASTER;
      if (s) set.add(String(s));
    });
    return Array.from(set);
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((d: any) => {
      const status = normalizeStatus(d.statusMaster || d.STATUS_MASTER);
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;
      if (!matchesStatus) return false;
      const searchable = [
        d.additionalChargeTypeCode, d.ADDITIONAL_CHARGE_TYPE_CODE,
        d.additionalChargeTypeName, d.ADDITIONAL_CHARGE_TYPE_NAME,
        d.description, d.DESCRIPTION,
        d.remarks, d.REMARKS,
      ].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => {
      // SP orders by SORT_ORDER then ID - keep the same order on screen.
      const sa = a.sortOrder ?? a.SORT_ORDER;
      const sb = b.sortOrder ?? b.SORT_ORDER;
      if (sa == null && sb == null) return Number(b.id || b.additionalChargeTypeId) - Number(a.id || a.additionalChargeTypeId);
      if (sa == null) return 1;
      if (sb == null) return -1;
      if (Number(sa) !== Number(sb)) return Number(sa) - Number(sb);
      return Number(a.id || a.additionalChargeTypeId) - Number(b.id || b.additionalChargeTypeId);
    });
  }, [data, search, statusFilter]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  useEffect(() => {
    dispatch(fetchAdditionalChargeTypes({}));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearAdditionalChargeTypeError());
    }
  }, [error, dispatch, toast]);

  const emptyForm = () => ({
    ADDITIONAL_CHARGE_TYPE_CODE: "",
    ADDITIONAL_CHARGE_TYPE_NAME: "",
    DESCRIPTION: "",
    SORT_ORDER: "",
    REMARKS: "",
    STATUS_MASTER: "ACTIVE",
    USER: "Admin",
    MAC_ADDRESS: "WEB",
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = async (item: any) => {
    setEditing(item);
    const detail = item && item.id != null
      ? await dispatch(fetchAdditionalChargeTypeById(Number(item.id))).unwrap().catch(() => null)
      : null;
    const src: any = detail ? detail : item;
    setForm({
      ADDITIONAL_CHARGE_TYPE_CODE: pickVal(src, ["additionalChargeTypeCode", "ADDITIONAL_CHARGE_TYPE_CODE"]),
      ADDITIONAL_CHARGE_TYPE_NAME: pickVal(src, ["additionalChargeTypeName", "ADDITIONAL_CHARGE_TYPE_NAME"]),
      DESCRIPTION: pickVal(src, ["description", "DESCRIPTION"]),
      SORT_ORDER: pickVal(src, ["sortOrder", "SORT_ORDER"]),
      REMARKS: pickVal(src, ["remarks", "REMARKS"]),
      STATUS_MASTER: pickVal(src, ["statusMaster", "STATUS_MASTER"]) || "ACTIVE",
      USER: "Admin",
      MAC_ADDRESS: "WEB",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const code = String(form.ADDITIONAL_CHARGE_TYPE_CODE || "").trim();
    const name = String(form.ADDITIONAL_CHARGE_TYPE_NAME || "").trim();

    if (!code) {
      toast({ title: "Additional Charge Type Code is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!name) {
      toast({ title: "Additional Charge Type Name is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    if (!editing && normalizeStatus(form.STATUS_MASTER) === "INACTIVE") {
      toast({ title: "New additional charge type cannot be set to Inactive", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    const sortRaw = String(form.SORT_ORDER ?? "").trim();
    if (sortRaw !== "" && !Number.isFinite(Number(sortRaw))) {
      toast({ title: "Sort Order must be a number", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    try {
      const payload: Record<string, any> = {
        ADDITIONAL_CHARGE_TYPE_CODE: code,
        ADDITIONAL_CHARGE_TYPE_NAME: name,
        DESCRIPTION: String(form.DESCRIPTION || "").trim() || null,
        SORT_ORDER: sortRaw === "" ? null : Number(sortRaw),
        REMARKS: String(form.REMARKS || "").trim() || null,
        STATUS_MASTER: form.STATUS_MASTER || "ACTIVE",
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (editing) {
        payload.id = editing.id;
        payload.ADDITIONAL_CHARGE_TYPE_ID = Number(editing.id) || editing.additionalChargeTypeId;
        const res = await dispatch(updateAdditionalChargeType(payload)).unwrap();
        toast({ title: res?.message ?? "Additional Charge Type updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addAdditionalChargeType(payload)).unwrap();
        toast({ title: res?.message ?? "Additional Charge Type created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchAdditionalChargeTypes({}));
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error saving additional charge type"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteAdditionalChargeType(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Additional Charge Type deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchAdditionalChargeTypes({}));
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error deleting additional charge type"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (key: string, label: string, type: "text" | "select" | "textarea" | "number", options?: { value: string; label: string }[], required?: boolean, placeholder?: string, maxLength?: number) => {
    const baseClass = "flex flex-col gap-1.5";
    const fieldEmpty = required && !form[key];
    const borderClass = fieldEmpty ? "border-destructive ring-1 ring-destructive/30" : "";
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : baseClass}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {type === "select" ? (
          <Select value={form[key] || ""} onValueChange={(v) => setForm({ ...form, [key]: v })}>
            <SelectTrigger className={`h-9 text-xs ${borderClass}`}><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} maxLength={maxLength} className={`text-xs ${borderClass}`} />
        ) : (
          <Input
            type={type === "number" ? "number" : "text"}
            min={type === "number" ? 0 : undefined}
            step={type === "number" ? "1" : undefined}
            value={form[key] ?? ""}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            placeholder={placeholder}
            maxLength={maxLength}
            className={`h-9 text-xs ${borderClass}`}
          />
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Additional Charge Type Master</h1>
          <p className="text-sm text-muted-foreground">Manage additional charge type master data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Charge Type
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search additional charge types..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
            {uniqueStatuses.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Filter Status:</span>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-35 h-9 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    {uniqueStatuses.map(s => <SelectItem key={s} value={normalizeStatus(s)}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Charge Type Code</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Charge Type Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Sort Order</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Description</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Remarks</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => {
                  const id = item.id ?? item.additionalChargeTypeId;
                  const code = item.additionalChargeTypeCode ?? item.ADDITIONAL_CHARGE_TYPE_CODE;
                  const name = item.additionalChargeTypeName ?? item.ADDITIONAL_CHARGE_TYPE_NAME;
                  const sortOrder = item.sortOrder ?? item.SORT_ORDER;
                  const description = item.description ?? item.DESCRIPTION;
                  const remarks = item.remarks ?? item.REMARKS;
                  const status = item.statusMaster ?? item.STATUS_MASTER;
                  return (
                    <tr key={id ?? idx} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 flex gap-2">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                        {isAdmin && <button onClick={() => setDeleteId(String(id))} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>}
                      </td>
                      <td className="p-3 font-medium">{code}</td>
                      <td className="p-3">{name}</td>
                      <td className="p-3">{sortOrder ?? "-"}</td>
                      <td className="p-3">{description || "-"}</td>
                      <td className="p-3">{remarks || "-"}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={`${normalizeStatus(status) === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                          {normalizeStatus(status) === "ACTIVE" ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No additional charge types found</td></tr>
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
            <DialogTitle>{editing ? "Edit Additional Charge Type" : "Add Additional Charge Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Charge Type Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("ADDITIONAL_CHARGE_TYPE_CODE", "Charge Type Code", "text", undefined, true, "e.g., FREIGHT", CODE_MAX)}
                {renderField("ADDITIONAL_CHARGE_TYPE_NAME", "Charge Type Name", "text", undefined, true, "e.g., Freight Charges", NAME_MAX)}
                {renderField("SORT_ORDER", "Sort Order", "number", undefined, false, "e.g., 1")}
                {renderField("STATUS_MASTER", "Status", "select", [{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }], false)}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("DESCRIPTION", "Description", "textarea", undefined, false, "Additional description...", DESCRIPTION_MAX)}
                {renderField("REMARKS", "Remarks", "text", undefined, false, "Additional notes...", REMARKS_MAX)}
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
            <AlertDialogDescription>
              This will permanently delete this additional charge type. It cannot be deleted if it is already used by an existing quotation additional charge.
            </AlertDialogDescription>
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
