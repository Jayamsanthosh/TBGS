"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Plus, Search, Pencil, Trash2, ArrowLeft, ArrowRight, Loader2,
  Upload, FileText, Download, X, Eye,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchDMSFiles, fetchDMSFileById, fetchDocumentTypes,
  addDMSFile, updateDMSFile, deleteDMSFile, clearDMSError, type DMSFileGridData,
} from "@/lib/dmsSlice";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
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
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;
const MAX_MB = 10;
/* Must match VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM exactly. */
const MAX_REF = 50;
const MAX_TYPE = 50;
const MAX_DESC = 100;
const MAX_REMARK = 100;
const MAX_FILE_NAME = 150;

const statusOptions = [
  { value: "AC", label: "Active" },
  { value: "IN", label: "Inactive" },
];

const isActive = (s: any) => {
  const v = String(s ?? "").trim().toUpperCase();
  return v === "AC" || v === "ACTIVE";
};

const statusBadgeClass = (s: any) =>
  isActive(s)
    ? "bg-green-500/10 text-green-600 border-green-200"
    : "bg-red-500/10 text-red-600 border-red-200";

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
      resolve({
        name: file.name,
        contentType: file.type || "application/octet-stream",
        contentData: b64,
        sizeMB: (file.size / 1024 / 1024).toFixed(2),
      });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

/* Decoded byte size from base64, so stored files can show a size too. */
const base64SizeMB = (b64: string | null | undefined) => {
  if (!b64) return "";
  const bytes = Math.floor((b64.length * 3) / 4);
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

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

interface LinkOption {
  LINK_ID: number;
  LINK_NAME: string;
}

export default function DocumentManagementPage() {
  const dispatch = useAppDispatch();
  const { files, documentTypes, loading, error } = useAppSelector((s) => s.dms);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [linkFilter, setLinkFilter] = useState("ALL");
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [links, setLinks] = useState<LinkOption[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"VIEW" | "EDIT">("VIEW");
  const [editing, setEditing] = useState<DMSFileGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>(emptyForm());
  const [detailLoading, setDetailLoading] = useState(false);
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DMSFileGridData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadFiles = () => {
    dispatch(fetchDMSFiles({ status: statusFilter }));
  };

  useEffect(() => { loadFiles(); }, [dispatch, statusFilter]);
  useEffect(() => { dispatch(fetchDocumentTypes()); }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearDMSError());
    }
  }, [error, dispatch, toast]);

  /* Link pages only ever contain LINK_ID + LINK_NAME, so a narrow read is enough. */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLinksLoading(true);
      try {
        const res = await fetch(`${API_URL}/links-and-pages`);
        if (!res.ok) throw new Error("Failed to load link pages");
        const json = await res.json();
        const rows: any[] = Array.isArray(json?.data) ? json.data : [];
        if (alive) {
          setLinks(
            rows
              .filter((r) => r?.LINK_ID != null && r?.LINK_NAME)
              .map((r) => ({ LINK_ID: Number(r.LINK_ID), LINK_NAME: String(r.LINK_NAME) }))
              .sort((a, b) => a.LINK_NAME.localeCompare(b.LINK_NAME))
          );
        }
      } catch (e: any) {
        if (alive) toast({ variant: "destructive", title: e?.message || "Failed to load link pages" });
      } finally {
        if (alive) setLinksLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [toast]);

  const linkName = (id: any) =>
    links.find((l) => l.LINK_ID === Number(id))?.LINK_NAME ||
    (files.find((f) => f.LINK_PAGES_ID === id) as any)?.LINK_PAGES_NAME ||
    "";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files.filter((d) => {
      const linkMatch = linkFilter === "ALL" ? true : Number(d.LINK_PAGES_ID) === Number(linkFilter);
      const textMatch = !q
        ? true
        : [d.PAGE_REF_NO, d.DOCUMENT_TYPE, d.DESCRIPTIONS, d.FILE_NAME, d.CONTENT_TYPE, d.REMARKS, d.LINK_PAGES_NAME]
            .filter(Boolean).join(" ").toLowerCase().includes(q);
      return linkMatch && textMatch;
    });
  }, [files, search, linkFilter]);

  const effectivePageSize: number | "ALL" =
    pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;
  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter(
    (s) => s === "ALL" || s <= filtered.length
  );
  const totalPages = effectivePageSize === "ALL" ? 1 : Math.max(1, Math.ceil(filtered.length / effectivePageSize));
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * (effectivePageSize as number);
    return filtered.slice(start, start + (effectivePageSize as number));
  }, [filtered, currentPage, effectivePageSize]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, linkFilter, pageSize]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(1); }, [currentPage, totalPages]);

  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openAdd = () => {
    setEditing(null);
    setMode("EDIT");
    setForm(emptyForm());
    setPickedFile(null);
    resetFileInput();
    setDialogOpen(true);
  };

  const openView = async (item: DMSFileGridData) => {
    setEditing(item);
    setMode("VIEW");
    setPickedFile(null);
    resetFileInput();
    setForm({ ...emptyForm(), ...item, LINK_PAGES_ID: String(item.LINK_PAGES_ID ?? "") });
    setDialogOpen(true);
    await loadDetail(item, "VIEW");
  };

  const openEdit = async (item: DMSFileGridData) => {
    setEditing(item);
    setMode("EDIT");
    setPickedFile(null);
    resetFileInput();
    setForm({ ...emptyForm(), ...item, LINK_PAGES_ID: String(item.LINK_PAGES_ID ?? "") });
    setDialogOpen(true);
    await loadDetail(item, "EDIT");
  };

  const loadDetail = async (item: DMSFileGridData, nextMode: "VIEW" | "EDIT") => {
    const id = Number(item.DMS_ID) || Number(item.id);
    setDetailLoading(true);
    try {
      const res: any = await dispatch(fetchDMSFileById(id)).unwrap();
      if (res) {
        setForm({
          ...emptyForm(), ...res,
          LINK_PAGES_ID: String(res.LINK_PAGES_ID ?? ""),
          PAGE_REF_NO: res.PAGE_REF_NO ?? "",
          DOCUMENT_TYPE: res.DOCUMENT_TYPE ?? "",
        });
      }
    } catch {
      toast({ variant: "destructive", title: "Could not load the full document" });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size / 1024 / 1024 > MAX_MB) {
      toast({ variant: "destructive", title: `File exceeds the ${MAX_MB} MB limit` });
      resetFileInput();
      return;
    }
    try {
      const picked = await readFileAsBase64(file);
      setPickedFile(picked);
      setForm((prev) => ({
        ...prev,
        FILE_NAME: picked.name,
        CONTENT_TYPE: picked.contentType,
        CONTENT_DATA: picked.contentData,
      }));
    } catch (e: any) {
      toast({ variant: "destructive", title: e?.message || "Failed to read file" });
    }
  };

  const clearPickedFile = () => {
    setPickedFile(null);
    resetFileInput();
    /* Keeps the stored file on edit; the server ignores a null CONTENT_DATA. */
    setForm((prev) => ({ ...prev, FILE_NAME: "", CONTENT_TYPE: "", CONTENT_DATA: "" }));
  };

  const setField = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.LINK_PAGES_ID) {
      toast({ variant: "destructive", title: "Link Page is required" });
      return;
    }
    if (!String(form.PAGE_REF_NO ?? "").trim()) {
      toast({ variant: "destructive", title: "Page Ref No is required" });
      return;
    }
    if (!pickedFile && !form.CONTENT_DATA) {
      toast({ variant: "destructive", title: "Please choose a file to upload" });
      return;
    }
    if (String(form.DESCRIPTIONS ?? "").length > MAX_DESC) {
      toast({ variant: "destructive", title: `Description is limited to ${MAX_DESC} characters` });
      return;
    }
    if (String(form.REMARKS ?? "").length > MAX_REMARK) {
      toast({ variant: "destructive", title: `Remarks is limited to ${MAX_REMARK} characters` });
      return;
    }
    if (String(form.PAGE_REF_NO ?? "").trim().length > MAX_REF) {
      toast({ variant: "destructive", title: `Page Ref No is limited to ${MAX_REF} characters` });
      return;
    }
    if (String(form.DOCUMENT_TYPE ?? "").trim().length > MAX_TYPE) {
      toast({ variant: "destructive", title: `Document Type is limited to ${MAX_TYPE} characters` });
      return;
    }
    /* The file name comes from the browser and can exceed the column width. */
    if (String(form.FILE_NAME ?? "").length > MAX_FILE_NAME) {
      toast({
        variant: "destructive",
        title: `File name is limited to ${MAX_FILE_NAME} characters`,
        description: "Rename the file and upload it again.",
      });
      return;
    }
    /* CONTENT_TYPE can outrun the column for Office files; the server normalises
       that to a generic binary type, so it is not blocked here. */

    setSaving(true);
    try {
      const payload: any = {
        LINK_PAGES_ID: Number(form.LINK_PAGES_ID),
        PAGE_REF_NO: String(form.PAGE_REF_NO).trim(),
        DOCUMENT_TYPE: String(form.DOCUMENT_TYPE ?? "").trim(),
        DESCRIPTIONS: String(form.DESCRIPTIONS ?? "").trim(),
        FILE_NAME: String(form.FILE_NAME ?? "").trim(),
        CONTENT_TYPE: String(form.CONTENT_TYPE ?? "").trim(),
        CONTENT_DATA: pickedFile?.contentData || form.CONTENT_DATA || null,
        REMARKS: String(form.REMARKS ?? "").trim(),
        STATUS_MASTER: form.STATUS_MASTER || "AC",
      };
      if (editing) {
        const res: any = await dispatch(
          updateDMSFile({ ...payload, DMS_ID: Number(editing.DMS_ID) || Number(editing.id) })
        ).unwrap();
        toast({ title: res?.message || "Document updated successfully" });
      } else {
        const res: any = await dispatch(addDMSFile(payload)).unwrap();
        if (!res?.DMS_ID) throw new Error(res?.message || "Failed to retrieve the new document ID");
        toast({ title: res?.message || "Document uploaded successfully" });
        dispatch(fetchDocumentTypes());
      }
      setDialogOpen(false);
      loadFiles();
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : e?.message || "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = Number(deleteTarget.DMS_ID) || Number(deleteTarget.id);
    setDeleting(true);
    try {
      const res: any = await dispatch(deleteDMSFile(id)).unwrap();
      toast({ title: res?.message || "Document deleted successfully" });
      setDeleteTarget(null);
      loadFiles();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: typeof e === "string" ? e : e?.message || "Failed to delete",
      });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const downloadDocument = (item: DMSFileGridData, contentData?: string | null) => {
    const b64 = contentData ?? item.CONTENT_DATA;
    if (!b64) {
      toast({ variant: "destructive", title: "This document has no stored file" });
      return;
    }
    try {
      const clean = b64.includes(",") ? b64.split(",")[1] : b64;
      const mime = item.CONTENT_TYPE || "application/octet-stream";
      const bytes = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
      const name = item.FILE_NAME || `document-${item.DMS_ID}`;
      /* Preview inline when the browser can render it, otherwise download. */
      if (/^(image\/|application\/pdf|audio\/|video\/)/i.test(mime)) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      toast({ variant: "destructive", title: "The stored file could not be read" });
    }
  };

  /* Grid rows are served without the file bytes, so fetch the record first. */
  const downloadFromGrid = async (item: DMSFileGridData) => {
    const id = Number(item.DMS_ID) || Number(item.id);
    if (!id) {
      toast({ variant: "destructive", title: "This document has no stored file" });
      return;
    }
    try {
      const res: any = await dispatch(fetchDMSFileById(id)).unwrap();
      if (!res?.CONTENT_DATA) {
        toast({ variant: "destructive", title: "This document has no stored file" });
        return;
      }
      downloadDocument({ ...item, CONTENT_TYPE: res.CONTENT_TYPE || item.CONTENT_TYPE }, res.CONTENT_DATA);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: typeof e === "string" ? e : e?.message || "Failed to open the file",
      });
    }
  };

  const storedSize = pickedFile?.sizeMB || base64SizeMB(form.CONTENT_DATA);
  const readOnly = mode === "VIEW" || detailLoading;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Management</h1>
          <p className="text-sm text-muted-foreground">Upload and track files against any page reference</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Document
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Link Page:</span>
              <Select value={linkFilter} onValueChange={setLinkFilter}>
                <SelectTrigger className="w-44 h-9 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {links.map((l) => <SelectItem key={l.LINK_ID} value={String(l.LINK_ID)}>{l.LINK_NAME}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-muted-foreground">Show</span>
            <Select value={String(effectivePageSize)} onValueChange={(v) => setPageSize(v === "ALL" ? "ALL" : Number(v))}>
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
                  {[...Array(8)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No documents found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-24">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-16">ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Link Page</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Page Ref No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Document Type</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">File</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Description</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Remarks</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((d, i) => (
                  <tr key={d.DMS_ID ?? d.id ?? i} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View" onClick={() => openView(d)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit" onClick={() => openEdit(d)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" title="Delete"
                          onClick={() => setDeleteTarget(d)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{d.DMS_ID ?? d.id}</td>
                    <td className="p-3 text-xs" title={String(d.LINK_PAGES_ID ?? "")}>
                      {linkName(d.LINK_PAGES_ID) || "—"}
                    </td>
                    <td className="p-3 text-xs font-medium">{d.PAGE_REF_NO || "—"}</td>
                    <td className="p-3 text-xs">{d.DOCUMENT_TYPE || "—"}</td>
                    <td className="p-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <button
                          onClick={() => downloadFromGrid(d)}
                          className="text-xs text-primary hover:underline truncate max-w-52 text-left"
                          title={d.FILE_NAME || ""}
                        >
                          {d.FILE_NAME || "—"}
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground" title={d.DESCRIPTIONS || ""}>
                      <span className="line-clamp-2">{d.DESCRIPTIONS || "—"}</span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground" title={d.REMARKS || ""}>
                      <span className="line-clamp-2">{d.REMARKS || "—"}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={`px-2 py-0.5 text-[10px] uppercase font-bold ${statusBadgeClass(d.STATUS_MASTER)}`}>
                        {isActive(d.STATUS_MASTER) ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <span>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * (effectivePageSize === "ALL" ? 0 : effectivePageSize) + 1}
            {" - "}
            {effectivePageSize === "ALL" ? filtered.length : Math.min(currentPage * (effectivePageSize as number), filtered.length)}
            {" of "}{filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add / View / Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? (mode === "VIEW" ? "View Document" : "Edit Document") : "Add Document"}
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground font-medium">Mode:</span>
              {(["VIEW", "EDIT"] as const).map((m) => (
                <label key={m} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="radio" name="dmsMode" checked={mode === m} onChange={() => setMode(m)} className="accent-primary" />
                  {m}
                </label>
              ))}
            </div>
          )}

          {detailLoading ? (
            <div className="space-y-3 py-6">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dmsLink">Link Page <span className="text-destructive">*</span></Label>
                <Select
                  value={String(form.LINK_PAGES_ID ?? "")}
                  onValueChange={(v) => setField("LINK_PAGES_ID", v)}
                  disabled={readOnly}
                >
                  <SelectTrigger id="dmsLink" className="h-9 text-xs">
                    <SelectValue placeholder={linksLoading ? "Loading link pages..." : "Select a link page"} />
                  </SelectTrigger>
                  <SelectContent>
                    {links.map((l) => (
                      <SelectItem key={l.LINK_ID} value={String(l.LINK_ID)}>{l.LINK_NAME}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dmsRef">Page Ref No <span className="text-destructive">*</span></Label>
                <Input
                  id="dmsRef" className="h-9 text-xs" value={form.PAGE_REF_NO ?? ""} maxLength={MAX_REF}
                  onChange={(e) => setField("PAGE_REF_NO", e.target.value)} disabled={readOnly}
                  placeholder="Record reference this file belongs to"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dmsType">Document Type</Label>
                <Input
                  id="dmsType" className="h-9 text-xs" list="dmsDocTypes" value={form.DOCUMENT_TYPE ?? ""} maxLength={MAX_TYPE}
                  onChange={(e) => setField("DOCUMENT_TYPE", e.target.value)} disabled={readOnly}
                  placeholder="Type of document"
                />
                {/* No document-type master exists, so suggest what is already in use. */}
                <datalist id="dmsDocTypes">
                  {documentTypes.map((t) => <option key={t} value={t} />)}
                </datalist>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dmsStatus">Status</Label>
                <Select
                  value={form.STATUS_MASTER || "AC"}
                  onValueChange={(v) => setField("STATUS_MASTER", v)}
                  disabled={readOnly}
                >
                  <SelectTrigger id="dmsStatus" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dmsDesc">Description</Label>
                <Textarea
                  id="dmsDesc" className="text-xs min-h-20" value={form.DESCRIPTIONS ?? ""} maxLength={MAX_DESC}
                  onChange={(e) => setField("DESCRIPTIONS", e.target.value)} disabled={readOnly}
                  placeholder={`Up to ${MAX_DESC} characters`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {String(form.DESCRIPTIONS ?? "").length}/{MAX_DESC}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dmsRemarks">Remarks</Label>
                <Textarea
                  id="dmsRemarks" className="text-xs min-h-20" value={form.REMARKS ?? ""} maxLength={MAX_REMARK}
                  onChange={(e) => setField("REMARKS", e.target.value)} disabled={readOnly}
                  placeholder={`Up to ${MAX_REMARK} characters`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {String(form.REMARKS ?? "").length}/{MAX_REMARK}
                </span>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>File <span className="text-destructive">*</span></Label>
                {mode === "EDIT" ? (
                  <div className="border border-dashed rounded-lg p-4">
                    <input
                      ref={fileInputRef} type="file" className="hidden"
                      onChange={handleFileChange}
                    />
                    {pickedFile ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium truncate">{pickedFile.name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{pickedFile.sizeMB} MB</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={clearPickedFile} title="Remove">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : form.CONTENT_DATA ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-xs truncate">{form.FILE_NAME || "Stored file"}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{storedSize}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="outline" size="sm" className="h-7 text-xs"
                            onClick={() => downloadDocument({ DMS_ID: editing?.DMS_ID, FILE_NAME: form.FILE_NAME, CONTENT_TYPE: form.CONTENT_TYPE } as DMSFileGridData, form.CONTENT_DATA)}>
                            <Download className="w-3 h-3 mr-1" /> Open
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="w-3 h-3 mr-1" /> Replace
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" className="w-full h-9 text-xs" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" /> Choose a file
                      </Button>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Up to {MAX_MB} MB. Leave the stored file as is to edit only the details.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 border border-dashed rounded-lg p-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-xs truncate">{form.FILE_NAME || "No file"}</span>
                      {storedSize && <span className="text-[10px] text-muted-foreground shrink-0">{storedSize}</span>}
                    </div>
                    {form.CONTENT_DATA && (
                      <Button variant="outline" size="sm" className="h-7 text-xs shrink-0"
                        onClick={() => downloadDocument({ DMS_ID: editing?.DMS_ID, FILE_NAME: form.FILE_NAME, CONTENT_TYPE: form.CONTENT_TYPE } as DMSFileGridData, form.CONTENT_DATA)}>
                        <Download className="w-3 h-3 mr-1" /> Open
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="sticky bottom-0 bg-background pt-4 mt-2 border-t flex justify-end gap-2">
            {editing && mode === "VIEW" && form.CONTENT_DATA && (
              <Button variant="outline"
                onClick={() => downloadDocument({ DMS_ID: editing.DMS_ID, FILE_NAME: form.FILE_NAME, CONTENT_TYPE: form.CONTENT_TYPE } as DMSFileGridData, form.CONTENT_DATA)}>
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {mode === "VIEW" ? "Close" : "Cancel"}
            </Button>
            {mode === "EDIT" && (
              <Button onClick={handleSave} disabled={saving || detailLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? "Update" : "Save"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.FILE_NAME || `Document #${deleteTarget?.DMS_ID}`} will be permanently removed.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete} disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
