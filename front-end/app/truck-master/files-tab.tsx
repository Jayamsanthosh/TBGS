"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Plus, Search, Pencil, Trash2, Upload, FileText, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchDMSFiles, fetchDMSFileById, addDMSFile, updateDMSFile, deleteDMSFile,
  clearDMSError, type DMSFileGridData
} from "@/lib/dmsSlice";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;
const STATUS_OPTIONS = [
  { label: "Active", value: "AC" },
  { label: "Inactive", value: "IN" },
];
const MAX_MB = 10;

interface PickedFile {
  name: string;
  contentType: string;
  contentData: string;
  sizeMB: string;
}

const readFileAsBase64 = (file: File): Promise<PickedFile> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = (e.target?.result as string).split(",")[1];
      resolve({ name: file.name, contentType: file.type || "application/octet-stream", contentData: b64, sizeMB: (file.size / 1024 / 1024).toFixed(2) });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const emptyForm = (): Record<string, any> => ({
  LINK_PAGES_ID: "",
  PAGE_REF_NO: "",
  DOCUMENT_TYPE: "",
  DESCRIPTIONS: "",
  FILE_NAME: "",
  CONTENT_TYPE: "",
  CONTENT_DATA: "",
  REMARKS: "",
  STATUS_MASTER: "AC",
});

interface Props {
  linkPagesId: number;
  pageRefNo?: string;
  onClearFilter?: () => void;
  entityLabel?: string; // e.g. "Truck", "Driver"
}

export default function DMSFilesTab({ linkPagesId, pageRefNo, onClearFilter, entityLabel = "Record" }: Props) {
  const dispatch = useAppDispatch();
  const { files, loading, error } = useAppSelector((s) => s.dms);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AC");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DMSFileGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>(emptyForm());
  const [editLoading, setEditLoading] = useState(false);
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);

  const loadFiles = () => {
    dispatch(fetchDMSFiles({ status: statusFilter, linkPagesId }));
  };

  useEffect(() => { loadFiles(); }, [dispatch, statusFilter, linkPagesId]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearDMSError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return files.filter((d: any) => {
      const refMatch = pageRefNo ? String(d.PAGE_REF_NO) === String(pageRefNo) : true;
      const textMatch = [d.PAGE_REF_NO, d.DOCUMENT_TYPE, d.DESCRIPTIONS, d.FILE_NAME, d.CONTENT_TYPE, d.REMARKS]
        .join(" ").toLowerCase().includes(q);
      return refMatch && textMatch;
    });
  }, [files, search, pageRefNo]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.max(1, Math.ceil(filtered.length / effectivePageSize));
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * (effectivePageSize as number);
    return filtered.slice(start, start + (effectivePageSize as number));
  }, [filtered, currentPage, effectivePageSize]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm(), LINK_PAGES_ID: String(linkPagesId), PAGE_REF_NO: pageRefNo || "" });
    setPickedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDialogOpen(true);
  };

  const openEdit = async (item: DMSFileGridData) => {
    setEditing(item);
    setEditLoading(true);
    setDialogOpen(true);
    setPickedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setForm({ ...emptyForm(), ...item, LINK_PAGES_ID: String(item.LINK_PAGES_ID ?? linkPagesId), PAGE_REF_NO: item.PAGE_REF_NO ?? "" });
    try {
      const res: any = await dispatch(fetchDMSFileById(Number(item.DMS_ID) || Number(item.id))).unwrap();
      if (res) setForm({ ...emptyForm(), ...res, LINK_PAGES_ID: String(res.LINK_PAGES_ID ?? linkPagesId) });
    } catch { /* use grid row fallback */ } finally { setEditLoading(false); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setPickedFile(null); return; }
    if (file.size / 1024 / 1024 > MAX_MB) {
      toast({ variant: "destructive", title: `File exceeds ${MAX_MB} MB limit` });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    try {
      const picked = await readFileAsBase64(file);
      setPickedFile(picked);
      setForm((prev) => ({ ...prev, FILE_NAME: picked.name, CONTENT_TYPE: picked.contentType, CONTENT_DATA: picked.contentData }));
    } catch (e: any) { toast({ variant: "destructive", title: e?.message || "Failed to read file" }); }
  };

  const clearPickedFile = () => {
    setPickedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setForm((prev) => ({
      ...prev,
      FILE_NAME: editing ? prev.FILE_NAME : "",
      CONTENT_TYPE: editing ? prev.CONTENT_TYPE : "",
      CONTENT_DATA: editing ? prev.CONTENT_DATA : "",
    }));
  };

  const handleSave = async () => {
    if (!form.PAGE_REF_NO || !String(form.PAGE_REF_NO).trim()) {
      toast({ variant: "destructive", title: `${entityLabel} ID (Page Ref No) is required` });
      return;
    }
    const fileData = pickedFile?.contentData || form.CONTENT_DATA;
    if (!fileData) {
      toast({ variant: "destructive", title: "Please select a file to upload" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        PAGE_REF_NO: form.PAGE_REF_NO?.trim(),
        DOCUMENT_TYPE: form.DOCUMENT_TYPE?.trim(),
        DESCRIPTIONS: form.DESCRIPTIONS?.trim(),
        REMARKS: form.REMARKS?.trim(),
        LINK_PAGES_ID: Number(form.LINK_PAGES_ID) || linkPagesId,
        CONTENT_DATA: fileData,
      };
      if (editing) {
        const res: any = await dispatch(updateDMSFile({ ...payload, DMS_ID: Number(editing.DMS_ID) || Number(editing.id) })).unwrap();
        toast({ title: res?.message ?? "File updated successfully!" });
      } else {
        const res: any = await dispatch(addDMSFile(payload)).unwrap();
        if (!res?.DMS_ID) throw new Error(res?.message || "Failed to retrieve new DMS ID");
        toast({ title: res?.message ?? "File uploaded successfully!" });
      }
      await loadFiles();
      setDialogOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === 'string' ? e : (e?.message || "Failed to save file") });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (deletingId == null) return;
    try {
      const res: any = await dispatch(deleteDMSFile(deletingId)).unwrap();
      setDeletingId(null);
      toast({ title: res?.message ?? "File deleted successfully!" });
      loadFiles();
    } catch (e: any) { toast({ variant: "destructive", title: typeof e === 'string' ? e : (e?.message || "Failed to delete file") }); }
  };

  const handleBulkDelete = async () => {
    try {
      let lastRes: any = null;
      for (const id of Array.from(selectedIds)) { lastRes = await dispatch(deleteDMSFile(id)).unwrap(); }
      setSelectedIds(new Set());
      setIsBulkDeleting(false);
      toast({ title: lastRes?.message ?? "Files deleted successfully!" });
      loadFiles();
    } catch (e: any) { toast({ variant: "destructive", title: typeof e === 'string' ? e : (e?.message || "Failed to delete items!") }); }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length && paginated.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginated.filter((i: any) => i?.id).map((i: any) => i.id)));
  };
  const toggleSelect = (id: string | number) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const setField = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const statusBadge = (val: any) => {
    const sv = String(val ?? "").toLowerCase().trim();
    const isActive = sv === "ac" || sv === "active";
    const isInactive = sv === "in" || sv === "inactive";
    return (
      <Badge variant="outline" className={`px-2 py-0.5 text-[10px] uppercase font-bold ${isActive ? "bg-success/10 text-success border-success/20" : isInactive ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-info/10 text-info border-info/20"}`}>
        {isActive ? "Active" : isInactive ? "Inactive" : String(val)}
      </Badge>
    );
  };

  const currentFileLabel = pickedFile ? pickedFile.name : form.FILE_NAME || "";

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Files</h1>
          <p className="text-sm text-muted-foreground">
            {pageRefNo
              ? <>{`Showing files for ${entityLabel}`} <span className="font-semibold text-primary">{pageRefNo}</span></>
              : `All ${entityLabel.toLowerCase()} document files`}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {pageRefNo && onClearFilter && (
            <Button variant="outline" size="sm" onClick={onClearFilter} className="text-xs gap-1">
              <X className="w-3 h-3" /> Clear Filter
            </Button>
          )}
          <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> Upload File
          </Button>
        </div>
      </div>

      {pageRefNo && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">Filtered to Truck: <strong>{pageRefNo}</strong></span>
        </div>
      )}

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search files..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Status:</span>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-28 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AC">Active</SelectItem>
                  <SelectItem value="IN">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedIds.size > 0 && (
              <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleting(true)} className="animate-in fade-in zoom-in duration-200">
                <Trash2 className="w-4 h-4 mr-2" /> Delete ({selectedIds.size})
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">Show</span>
            <Select value={String(effectivePageSize)} onValueChange={(v) => { setPageSize(v === "ALL" ? "ALL" : Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{availablePageSizes.map((s) => <SelectItem key={String(s)} value={String(s)}>{String(s)}</SelectItem>)}</SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground uppercase tracking-wider text-[10px]">entries</span>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          {loading ? (
            <div className="w-full space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 w-10">
                    <input type="checkbox" className="rounded border-border w-4 h-4 accent-primary"
                      checked={paginated.length > 0 && selectedIds.size === paginated.length} onChange={toggleSelectAll} />
                  </th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">{entityLabel} ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Doc Type</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Description</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">File Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Content Type</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Remarks</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => (
                  <tr key={item.id || `row-${idx}`}
                    className={`border-b hover:bg-muted/30 transition-colors ${selectedIds.has(item.id) ? "bg-primary/5 border-primary/20" : ""}`}>
                    <td className="p-3 w-10">
                      <input type="checkbox" className="rounded border-border w-4 h-4 accent-primary"
                        checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} />
                    </td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => setDeletingId(item.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </td>
                    <td className="p-3 font-medium">{item.PAGE_REF_NO || "—"}</td>
                    <td className="p-3">{item.DOCUMENT_TYPE || "—"}</td>
                    <td className="p-3">{item.DESCRIPTIONS || "—"}</td>
                    <td className="p-3 font-medium">{item.FILE_NAME || "—"}</td>
                    <td className="p-3">{item.CONTENT_TYPE || "—"}</td>
                    <td className="p-3">{item.REMARKS || "—"}</td>
                    <td className="p-3">{statusBadge(item.STATUS_MASTER)}</td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No files found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground font-medium">
            Showing <span className="text-foreground">{filtered.length === 0 ? 0 : (currentPage - 1) * (effectivePageSize === "ALL" ? 0 : effectivePageSize) + 1}</span>{" "}
            to <span className="text-foreground">{Math.min(currentPage * (effectivePageSize === "ALL" ? filtered.length : effectivePageSize), filtered.length)}</span>{" "}
            of <span className="text-foreground">{filtered.length}</span> entries
          </p>
          {effectivePageSize !== "ALL" && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="h-8 text-xs">Previous</Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page = i + 1;
                if (totalPages > 5) {
                  if (currentPage <= 3) page = i + 1;
                  else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                  else page = currentPage - 2 + i;
                }
                return (
                  <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm"
                    onClick={() => setCurrentPage(page)} className="h-8 w-8 text-xs p-0">{page}</Button>
                );
              })}
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="h-8 text-xs">Next</Button>
            </div>
          )}
        </div>
      </div>

      {/* Upload / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Document" : "Upload Document"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {/* PAGE_REF_NO = Entity ID */}
              <div>
                <Label className="text-xs">{entityLabel} ID (Ref) <span className="text-destructive">*</span></Label>
                <Input value={String(form.PAGE_REF_NO ?? "")} onChange={(e) => setField("PAGE_REF_NO", e.target.value)}
                  placeholder={`e.g., ${entityLabel === 'Truck' ? 'TRK-001' : 'DRV-001'}`} />
              </div>
              <div>
                <Label className="text-xs">Document Type</Label>
                <Input value={String(form.DOCUMENT_TYPE ?? "")} onChange={(e) => setField("DOCUMENT_TYPE", e.target.value)}
                  placeholder="e.g., Registration, Insurance" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Description</Label>
                <Input value={String(form.DESCRIPTIONS ?? "")} onChange={(e) => setField("DESCRIPTIONS", e.target.value)}
                  placeholder="Brief description of the document" />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={String(form.STATUS_MASTER ?? "AC")} onValueChange={(v) => setField("STATUS_MASTER", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Remarks</Label>
                <Textarea value={String(form.REMARKS ?? "")} onChange={(e) => setField("REMARKS", e.target.value)} placeholder="Additional notes..." />
              </div>
            </div>

            {/* File picker */}
            <div>
              <Label className="text-xs">
                File {editing && !pickedFile
                  ? <span className="text-muted-foreground font-normal">(leave unchanged to keep current)</span>
                  : <span className="text-destructive">*</span>}
              </Label>
              <div className="mt-1.5">
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                {currentFileLabel ? (
                  <div className="flex items-center justify-between p-4 border rounded-[14px] bg-card shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 border rounded-[10px] flex items-center justify-center text-emerald-500 bg-emerald-50/50 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{currentFileLabel}</p>
                        <p className="text-xs text-muted-foreground">{pickedFile ? `${pickedFile.sizeMB} MB` : "Current file"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => fileInputRef.current?.click()}>Replace</Button>
                      <button onClick={clearPickedFile} className="text-red-300 hover:text-red-500 transition-colors p-2" type="button">
                        <X className="w-[18px] h-[18px]" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center py-10 px-6 border-2 border-dashed border-muted-foreground/30 rounded-[16px] bg-muted/20 hover:border-primary/30 transition-colors group">
                    <div className="w-12 h-12 bg-card rounded-[14px] flex items-center justify-center text-muted-foreground mb-3 shadow-sm border group-hover:text-primary group-hover:scale-105 transition-all duration-300">
                      <Upload className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                    <p className="font-semibold text-foreground text-sm mb-1">Click to choose a file</p>
                    <p className="text-muted-foreground text-xs">PDF, JPG, PNG, DOCX up to {MAX_MB}MB</p>
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || editLoading} className="bg-primary text-primary-foreground">
                {saving ? "Saving..." : editLoading ? "Loading..." : editing ? "Update" : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingId != null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this file?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleting} onOpenChange={setIsBulkDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} files?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
