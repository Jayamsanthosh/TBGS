"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchApprovalStageHdr,
  fetchApprovalStageHdrById,
  fetchApprovalStageDtls,
  addApprovalStageHdr,
  updateApprovalStageHdr,
  deleteApprovalStageHdr,
  clearApprovalStageError,
  ApprovalStageHdrGridData,
} from "@/lib/approvalStageSlice";
import { API_URL } from "@/lib/config";
import { useToast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";
import { SearchableSelect } from "@/components/SearchableSelect";
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

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const statusLabel = (s: any) => {
  const v = String(s || "").toUpperCase();
  return v === "ACTIVE" || v === "AC" ? "Active" : "Inactive";
};

const isActive = (s: any) => {
  const v = String(s || "").toUpperCase();
  return v === "ACTIVE" || v === "AC";
};

const statusBadgeClass = (s: any) =>
  isActive(s)
    ? "bg-green-500/10 text-green-600 border-green-200"
    : "bg-red-500/10 text-red-600 border-red-200";

const newKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();

export default function ApprovalStagePage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.approvalStage);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApprovalStageHdrGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [dtls, setDtls] = useState<any[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [links, setLinks] = useState<{ LINK_ID: number; LINK_NAME: string }[]>([]);
  const [users, setUsers] = useState<{ LOGIN_ID: number; LOGIN_NAME: string }[]>([]);

  useEffect(() => {
    dispatch(fetchApprovalStageHdr());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearApprovalStageError());
    }
  }, [error, dispatch, toast]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [linksRes, usersRes] = await Promise.all([
          fetch(`${API_URL}/links-and-pages`),
          fetch(`${API_URL}/users`),
        ]);
        const linksJson = linksRes.ok ? await linksRes.json() : { data: [] };
        const usersJson = usersRes.ok ? await usersRes.json() : { data: [] };
        if (!alive) return;
        setLinks(
          (Array.isArray(linksJson?.data) ? linksJson.data : [])
            .filter((r: any) => r?.LINK_ID != null && r?.LINK_NAME)
            .map((r: any) => ({ LINK_ID: Number(r.LINK_ID), LINK_NAME: String(r.LINK_NAME) }))
            .sort((a: any, b: any) => a.LINK_NAME.localeCompare(b.LINK_NAME))
        );
        setUsers(
          (Array.isArray(usersJson?.data) ? usersJson.data : [])
            .filter((u: any) => u?.LOGIN_ID != null && u?.LOGIN_NAME)
            .map((u: any) => ({ LOGIN_ID: Number(u.LOGIN_ID), LOGIN_NAME: String(u.LOGIN_NAME) }))
            .sort((a: any, b: any) => a.LOGIN_NAME.localeCompare(b.LOGIN_NAME))
        );
      } catch {
        /* dropdown data is non-critical; form stays usable without it */
      }
    })();
    return () => { alive = false; };
  }, []);

  const linkOptions = useMemo(
    () => links.map((l) => ({ value: String(l.LINK_ID), label: l.LINK_NAME })),
    [links]
  );
  const userOptions = useMemo(
    () => users.map((u) => ({ value: String(u.LOGIN_ID), label: u.LOGIN_NAME })),
    [users]
  );

  const linkName = (id: any) => links.find((l) => l.LINK_ID === Number(id))?.LINK_NAME || "";

  const uniqueStatuses = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const set = new Set<string>();
    items.forEach((d: any) => { if (d.STATUS_MASTER) set.add(String(d.STATUS_MASTER)); });
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const q = search.trim().toLowerCase();
    return items
      .filter((d: any) => {
        const matchStatus = statusFilter === "ALL" || isActive(d.STATUS_MASTER) === isActive(statusFilter);
        if (!matchStatus) return false;
        const searchable = [d.APPROVAL_STAGE_NAME, d.APPROVAL_STAGE_ORDER, d.REMARKS, linkName(d.LINK_PAGES_ID)]
          .filter(Boolean).join(" ").toLowerCase();
        return searchable.includes(q);
      })
      .sort((a: any, b: any) => Number(a.APPROVAL_STAGE_ORDER) - Number(b.APPROVAL_STAGE_ORDER));
  }, [items, search, statusFilter, links]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;
  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);
  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  const updateForm = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const emptyForm = () => ({
    APPROVAL_STAGE_NAME: "",
    APPROVAL_STAGE_ORDER: "",
    NO_OF_APPROVALS_REQUIRED: "",
    NO_OF_REJECT_REQUIRED: "",
    REMARKS: "",
    LINK_PAGES_ID: "",
    STATUS_MASTER: "ACTIVE",
  });

  const emptyDtl = () => ({ key: newKey(), APPROVAL_STAGE_DTL_ID: undefined as number | undefined, USER_ID: undefined as number | undefined, REMARKS: "" });

  const addDtl = () => setDtls((prev) => [...prev, emptyDtl()]);
  const updateDtl = (key: string, field: string, value: any) =>
    setDtls((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  const removeDtl = (key: string) => {
    const row = dtls.find((r) => r.key === key);
    if (row?.APPROVAL_STAGE_DTL_ID) setDeletedIds((d) => [...d, Number(row.APPROVAL_STAGE_DTL_ID)]);
    setDtls((prev) => prev.filter((r) => r.key !== key));
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDtls([]);
    setDeletedIds([]);
    setDialogOpen(true);
  };

  const openEdit = async (item: any) => {
    setEditing(item);
    try {
      const hdr = await dispatch(fetchApprovalStageHdrById(item.APPROVAL_STAGE_ID)).unwrap();
      setForm({
        APPROVAL_STAGE_NAME: hdr.APPROVAL_STAGE_NAME || "",
        APPROVAL_STAGE_ORDER: hdr.APPROVAL_STAGE_ORDER != null ? String(hdr.APPROVAL_STAGE_ORDER) : "",
        NO_OF_APPROVALS_REQUIRED: hdr.NO_OF_APPROVALS_REQUIRED != null ? String(hdr.NO_OF_APPROVALS_REQUIRED) : "",
        NO_OF_REJECT_REQUIRED: hdr.NO_OF_REJECT_REQUIRED != null ? String(hdr.NO_OF_REJECT_REQUIRED) : "",
        REMARKS: hdr.REMARKS || "",
        LINK_PAGES_ID: hdr.LINK_PAGES_ID != null ? String(hdr.LINK_PAGES_ID) : "",
        STATUS_MASTER: hdr.STATUS_MASTER || "ACTIVE",
      });

      const dtlRows = await dispatch(fetchApprovalStageDtls(item.APPROVAL_STAGE_ID)).unwrap();
      setDtls(
        (Array.isArray(dtlRows) ? dtlRows : []).map((d: any) => ({
          key: newKey(),
          APPROVAL_STAGE_DTL_ID: d.APPROVAL_STAGE_DTL_ID != null ? Number(d.APPROVAL_STAGE_DTL_ID) : undefined,
          USER_ID: d.USER_ID != null ? Number(d.USER_ID) : undefined,
          REMARKS: d.REMARKS || "",
        }))
      );
      setDeletedIds([]);
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : e?.message || "Failed to load record", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.APPROVAL_STAGE_NAME?.trim()) {
      toast({ title: "Approval Stage Name is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    const order = Number(form.APPROVAL_STAGE_ORDER);
    if (!form.APPROVAL_STAGE_ORDER || isNaN(order)) {
      toast({ title: "Approval Stage Order is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    const approvals = Number(form.NO_OF_APPROVALS_REQUIRED);
    if (!approvals || approvals <= 0) {
      toast({ title: "Number of Approvals Required must be greater than 0", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    const rejects = Number(form.NO_OF_REJECT_REQUIRED);
    if (!rejects || rejects <= 0) {
      toast({ title: "Number of Rejects Required must be greater than 0", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    const validRows = dtls.filter((r) => r.USER_ID);
    if (validRows.length === 0) {
      toast({ title: "At least one user is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    const userIds = validRows.map((r) => String(r.USER_ID));
    if (new Set(userIds).size !== userIds.length) {
      toast({ title: "A user can only be assigned once per stage", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        APPROVAL_STAGE_ID: editing ? Number(editing.APPROVAL_STAGE_ID) : undefined,
        APPROVAL_STAGE_NAME: form.APPROVAL_STAGE_NAME.trim(),
        APPROVAL_STAGE_ORDER: order,
        NO_OF_APPROVALS_REQUIRED: approvals,
        NO_OF_REJECT_REQUIRED: rejects,
        REMARKS: form.REMARKS?.trim() || null,
        LINK_PAGES_ID: form.LINK_PAGES_ID ? Number(form.LINK_PAGES_ID) : null,
        STATUS_MASTER: form.STATUS_MASTER || "ACTIVE",
        dtls: validRows.map((r: any) => ({
          APPROVAL_STAGE_DTL_ID: r.APPROVAL_STAGE_DTL_ID || undefined,
          USER_ID: Number(r.USER_ID),
          REMARKS: r.REMARKS?.trim() || "",
        })),
        deletedIds,
        USER: "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (editing) {
        const res = await dispatch(updateApprovalStageHdr(payload as ApprovalStageHdrGridData)).unwrap();
        toast({ title: res?.message ?? "Approval stage updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addApprovalStageHdr(payload as ApprovalStageHdrGridData)).unwrap();
        toast({ title: res?.message ?? "Approval stage created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchApprovalStageHdr());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : e?.message || "Error saving approval stage", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteApprovalStageHdr(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Approval stage deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchApprovalStageHdr());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : e?.message || "Error deleting approval stage", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (key: string, label: string, type: "text" | "number" | "select" | "textarea", options?: { value: string; label: string }[], required?: boolean, placeholder?: string) => {
    const fieldEmpty = required && !form[key];
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : "flex flex-col gap-1.5"}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {type === "select" ? (
          <Select value={form[key] || ""} onValueChange={(v) => updateForm(key, v)}>
            <SelectTrigger className={`h-9 text-xs ${fieldEmpty ? "border-destructive ring-1 ring-destructive/30" : ""}`}><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className="text-xs" />
        ) : (
          <Input type={type === "number" ? "number" : "text"} value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={`h-9 text-xs ${fieldEmpty ? "border-destructive ring-1 ring-destructive/30" : ""}`} />
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Approval Stage Master</h1>
          <p className="text-sm text-muted-foreground">Manage approval stages and the users assigned to each stage</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Stage
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search stages..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
            {uniqueStatuses.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Status:</span>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-35 h-9 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {uniqueStatuses.map((s) => (<SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>))}
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
                {availablePageSizes.map((s) => (<SelectItem key={String(s)} value={String(s)}>{String(s)}</SelectItem>))}
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
                  {[...Array(7)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Stage Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Order</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Approvals Req.</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Rejects Req.</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Link Page</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                      <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>
                    </td>
                    <td className="p-3 font-medium">{item.APPROVAL_STAGE_ID || "-"}</td>
                    <td className="p-3 font-medium">{item.APPROVAL_STAGE_NAME || "-"}</td>
                    <td className="p-3">{item.APPROVAL_STAGE_ORDER ?? "-"}</td>
                    <td className="p-3">{item.NO_OF_APPROVALS_REQUIRED ?? "-"}</td>
                    <td className="p-3">{item.NO_OF_REJECT_REQUIRED ?? "-"}</td>
                    <td className="p-3">{linkName(item.LINK_PAGES_ID) || "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${statusBadgeClass(item.STATUS_MASTER)} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {statusLabel(item.STATUS_MASTER)}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No approval stages found</td></tr>
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
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="h-8 text-xs">Previous</Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="h-8 w-8 text-xs p-0">{page}</Button>;
              })}
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="h-8 text-xs">Next</Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Approval Stage" : "Add Approval Stage"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Stage Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {renderField("APPROVAL_STAGE_NAME", "Stage Name", "text", undefined, true, "e.g., Manager Approval")}
              {renderField("APPROVAL_STAGE_ORDER", "Stage Order", "number", undefined, true, "e.g., 1")}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderField("NO_OF_APPROVALS_REQUIRED", "No. of Approvals Required", "number", undefined, true, "e.g., 2")}
              {renderField("NO_OF_REJECT_REQUIRED", "No. of Rejects Required", "number", undefined, true, "e.g., 1")}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Link Page</Label>
                <SearchableSelect
                  value={form.LINK_PAGES_ID || ""}
                  onChange={(v) => updateForm("LINK_PAGES_ID", v)}
                  options={linkOptions}
                  placeholder="Select page"
                />
              </div>
              {renderField("STATUS_MASTER", "Status", "select", statusOptions, false)}
            </div>
            {renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}

            <div className="flex items-center justify-between pt-2">
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 flex-1">Stage Users</h3>
              <Button variant="outline" size="sm" onClick={addDtl} className="h-8 text-xs ml-2">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add User
              </Button>
            </div>
            {dtls.length === 0 ? (
              <p className="p-4 text-center text-muted-foreground text-xs border rounded-lg">No users assigned</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[40vh] overflow-y-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="p-2 font-semibold w-[40%]">User *</th>
                        <th className="p-2 font-semibold">Remarks</th>
                        <th className="p-2 w-9" />
                      </tr>
                    </thead>
                    <tbody>
                      {dtls.map((row) => (
                        <tr key={row.key} className="border-t hover:bg-muted/30 transition-colors">
                          <td className="p-1 pl-2">
                            <SearchableSelect
                              value={row.USER_ID ? String(row.USER_ID) : ""}
                              onChange={(v) => updateDtl(row.key, "USER_ID", Number(v))}
                              options={userOptions}
                              placeholder="Select user"
                              className="h-8"
                            />
                          </td>
                          <td className="p-1">
                            <Input value={row.REMARKS} onChange={(e) => updateDtl(row.key, "REMARKS", e.target.value)} placeholder="Remarks" className="h-8 text-xs" />
                          </td>
                          <td className="p-1 pr-2 text-center">
                            <button type="button" onClick={() => removeDtl(row.key)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors" title="Remove row">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-xs" disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className={`${editing ? "bg-info text-info-foreground hover:bg-info/90" : "bg-primary text-primary-foreground hover:bg-primary/90"} text-xs`}>
                {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
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
            <AlertDialogDescription>This will permanently delete this approval stage. Stages referenced by other records cannot be deleted.</AlertDialogDescription>
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
