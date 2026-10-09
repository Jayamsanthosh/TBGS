"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, FileText, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchDMSFiles,
  fetchDMSFileById,
  addDMSFile,
  updateDMSFile,
  deleteDMSFile,
  clearDMSError,
  clearDMSFiles,
  type DMSFileGridData,
} from "@/lib/dmsSlice";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import EntityFilesViewerDialog from "@/components/EntityFilesViewerDialog";
import { API_URL } from "@/lib/config";

const STATUS_OPTIONS = [
  { label: "Active", value: "AC" },
  { label: "Inactive", value: "IN" },
] as const;

const MAX_MB = 10;
/* Column widths on VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM. The server rejects
   anything wider with a 400, so the inputs stop at the same lengths. */
const MAX_LEN = {
  DOCUMENT_TYPE: 50,
  DESCRIPTIONS: 100,
  REMARKS: 100,
} as const;

interface PickedFile {
  name: string;
  contentType: string;
  contentData: string;
  sizeMB: string;
}

/* Renders image files (picked or reloaded) as a data-URL; anything else has no
   preview and stays as a file entry. */
const previewOf = (contentType?: string, data?: string | null): string | null =>
  data && contentType && contentType.startsWith("image/") ? `data:${contentType};base64,${data}` : null;

const readFileAsBase64 = (file: File): Promise<PickedFile> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const b64 = result.split(",")[1];
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

const emptyForm = (): DMSFileGridData => ({
  LINK_PAGES_ID: 0,
  PAGE_REF_NO: "",
  DOCUMENT_TYPE: "",
  DESCRIPTIONS: "",
  FILE_NAME: "",
  CONTENT_TYPE: "",
  CONTENT_DATA: "",
  REMARKS: "",
  STATUS_MASTER: "AC",
});

interface AttachmentsPanelProps {
  linkPagesId: number;
  entityRefNo?: string;
  entityLabel?: string;
  title?: string;
  readOnly?: boolean;
  allowUpload?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  showCount?: boolean;
  className?: string;
  emptyMessage?: string;
  statusFilter?: "AC" | "IN" | "ALL";
  onChange?: () => void;
}

export default function AttachmentsPanel({
  linkPagesId,
  entityRefNo,
  entityLabel = "Record",
  title = "Documents / Attachments",
  readOnly = false,
  allowUpload = true,
  allowEdit = true,
  allowDelete = true,
  showCount = true,
  className = "",
  emptyMessage,
  statusFilter = "AC",
  onChange,
}: AttachmentsPanelProps) {
  const dispatch = useAppDispatch();
  const { files, loading, error } = useAppSelector((s) => s.dms);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DMSFileGridData | null>(null);
  const [form, setForm] = useState<DMSFileGridData>(emptyForm());
  const [editLoading, setEditLoading] = useState(false);
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const canManage = !readOnly && (allowUpload || allowEdit || allowDelete);
  /* A document can only be written once both halves of its identity are known: the
     link page and the record reference. Without them the upload would land on a
     row nothing else can find, so the whole panel stays locked. */
  const scopeReady = linkPagesId > 0 && !!entityRefNo;

  /* The viewer reads the same scoped list itself, so it is given the same
     identity rather than the rows already on screen. */
  const listUrl = useMemo(
    () =>
      `${API_URL}/dms?linkPagesId=${encodeURIComponent(String(linkPagesId))}&pageRefNo=${encodeURIComponent(
        String(entityRefNo ?? "")
      )}&status=ALL`,
    [linkPagesId, entityRefNo]
  );
  /* Held in a ref-free memo: the viewer refetches whenever this identity changes,
     so it must stay stable across renders. */
  const contentUrlBuilder = useCallback((row: { DMS_ID?: number }) => `${API_URL}/dms/${Number(row?.DMS_ID) || ""}`, []);

  const loadFiles = () => {
    if (!scopeReady) {
      dispatch(clearDMSFiles());
      return;
    }
    dispatch(
      fetchDMSFiles({
        status: statusFilter,
        linkPagesId,
        pageRefNo: entityRefNo,
      })
    );
  };

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, statusFilter, linkPagesId, entityRefNo, scopeReady]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearDMSError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    if (!entityRefNo) return files;
    return files.filter((d: DMSFileGridData) => String(d.PAGE_REF_NO) === String(entityRefNo));
  }, [files, entityRefNo]);

  const openAdd = () => {
    if (!allowUpload || readOnly || !scopeReady) return;
    setEditing(null);
    setForm({
      ...emptyForm(),
      LINK_PAGES_ID: linkPagesId,
      PAGE_REF_NO: entityRefNo || "",
      STATUS_MASTER: "AC",
    });
    setPickedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDialogOpen(true);
  };

  const openEdit = async (item: DMSFileGridData) => {
    if (!allowEdit || readOnly) return;
    setEditing(item);
    setEditLoading(true);
    setDialogOpen(true);
    setPickedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setForm({
      ...emptyForm(),
      ...item,
      LINK_PAGES_ID: Number(item.LINK_PAGES_ID ?? linkPagesId),
      PAGE_REF_NO: String(item.PAGE_REF_NO ?? entityRefNo ?? ""),
    });
    try {
      const id = Number(item.DMS_ID) || Number(item.id);
      if (id) {
        const res = await dispatch(fetchDMSFileById(id)).unwrap();
        if (res) {
          const r = (res ?? {}) as DMSFileGridData;
          setForm({
            ...emptyForm(),
            ...r,
            LINK_PAGES_ID: Number(r.LINK_PAGES_ID ?? linkPagesId),
          });
        }
      }
    } catch {
      // keep the row values when the full record cannot be reloaded
    } finally {
      setEditLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPickedFile(null);
      return;
    }
    if (file.size / 1024 / 1024 > MAX_MB) {
      toast({ variant: "destructive", title: `File exceeds ${MAX_MB} MB limit` });
      if (fileInputRef.current) fileInputRef.current.value = "";
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to read file";
      toast({ variant: "destructive", title: msg });
    }
  };

  const handleSave = async () => {
    if (!scopeReady) {
      toast({ variant: "destructive", title: "Save the record before attaching documents" });
      return;
    }
    if (!form.FILE_NAME && !pickedFile) {
      toast({ variant: "destructive", title: "Please choose a file" });
      return;
    }
    setSaving(true);
    try {
      const payload: DMSFileGridData = {
        ...form,
        LINK_PAGES_ID: Number(form.LINK_PAGES_ID) || linkPagesId,
        PAGE_REF_NO: String(form.PAGE_REF_NO || entityRefNo || ""),
        STATUS_MASTER: String(form.STATUS_MASTER || "AC"),
      };
      if (editing) {
        const id = Number(editing.id) || editing.DMS_ID;
        await dispatch(updateDMSFile({ ...payload, id, DMS_ID: editing.DMS_ID })).unwrap();
        toast({ title: "File updated successfully" });
      } else {
        await dispatch(addDMSFile(payload)).unwrap();
        toast({ title: "File uploaded successfully" });
      }
      setDialogOpen(false);
      setPickedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadFiles();
      onChange?.();
    } catch (e: unknown) {
      const msg = typeof e === "string" ? e : e instanceof Error ? e.message : "Error saving file";
      toast({
        variant: "destructive",
        title: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await dispatch(deleteDMSFile(Number(deletingId))).unwrap();
      setDeletingId(null);
      toast({ title: "File deleted successfully" });
      loadFiles();
      onChange?.();
    } catch (e: unknown) {
      const msg = typeof e === "string" ? e : e instanceof Error ? e.message : "Error deleting file";
      toast({
        variant: "destructive",
        title: msg,
      });
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          {showCount && (
            <span className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded-full">{filtered.length}</span>
          )}
        </div>
        {canManage && allowUpload && (
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={openAdd} disabled={!scopeReady}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Attachment
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-200/80 rounded-lg bg-slate-50/30 text-center px-3">
          <FileText className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground font-medium">
            {emptyMessage || `No documents attached${entityLabel ? ` to this ${entityLabel}` : ""}`}
          </p>
          {linkPagesId <= 0 ? (
            <p className="text-[10px] text-muted-foreground mt-1">
              This page is not linked yet, so attachments cannot be stored
            </p>
          ) : (
            canManage &&
            allowUpload &&
            !entityRefNo && (
              <p className="text-[10px] text-muted-foreground mt-1">Save to enable attachments</p>
            )
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((f: DMSFileGridData, idx: number) => (
            <div
              key={String(f.DMS_ID ?? f.id ?? idx)}
              className="flex items-center justify-between gap-2 border rounded-md px-3 py-2 bg-card/60"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{String(f.FILE_NAME || `File ${idx + 1}`)}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {f.DOCUMENT_TYPE && <span className="truncate">{String(f.DOCUMENT_TYPE)}</span>}
                    {f.CONTENT_TYPE && <span className="truncate">{String(f.CONTENT_TYPE)}</span>}
                    {f.STATUS_MASTER && <span>({String(f.STATUS_MASTER)})</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                  {/* Viewing is always open: it only reads, so it stays available
                      even where the caller has switched editing off. */}
                  <button
                    onClick={() => setViewerOpen(true)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="View"
                  >
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  {canManage && allowEdit && (
                    <button onClick={() => openEdit(f)} className="p-1 rounded hover:bg-muted transition-colors" title="Edit">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                  {canManage && allowDelete && (
                    <button onClick={() => setDeletingId(f.DMS_ID ?? f.id ?? null)} className="p-1 rounded hover:bg-destructive/10 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  )}
                </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Attachment" : "Add Attachment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">File</Label>
              <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-muted file:hover:bg-muted/80"
                />
                {pickedFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setPickedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      setForm((prev) => ({ ...prev, FILE_NAME: "", CONTENT_TYPE: "", CONTENT_DATA: "" }));
                    }}
                    className="ml-auto p-1 rounded hover:bg-muted"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {(pickedFile || form.FILE_NAME) && (() => {
                const src = previewOf(
                  pickedFile?.contentType || form.CONTENT_TYPE,
                  pickedFile?.contentData || (editing ? form.CONTENT_DATA : null) || null
                );
                return (
                  <div className="space-y-2">
                    {src ? (
                      <img
                        src={src}
                        alt={pickedFile?.name || form.FILE_NAME || "Attachment"}
                        className="max-h-40 w-full object-contain rounded-md border bg-muted/30"
                      />
                    ) : (
                      <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-muted/30">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">
                          {pickedFile?.name || form.FILE_NAME}
                        </span>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground truncate">
                      Selected: {pickedFile?.name || form.FILE_NAME}
                      {pickedFile && ` (${pickedFile.sizeMB} MB)`}
                    </p>
                  </div>
                );
              })()}
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Document Type</Label>
              <Input
                value={form.DOCUMENT_TYPE || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, DOCUMENT_TYPE: e.target.value }))}
                placeholder="e.g. Quotation, PO, Invoice"
                maxLength={MAX_LEN.DOCUMENT_TYPE}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Input
                value={form.DESCRIPTIONS || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, DESCRIPTIONS: e.target.value }))}
                placeholder="Brief description"
                maxLength={MAX_LEN.DESCRIPTIONS}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Remarks</Label>
              <Textarea
                value={form.REMARKS || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, REMARKS: e.target.value }))}
                placeholder="Notes..."
                maxLength={MAX_LEN.REMARKS}
                className="text-xs min-h-[60px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Status</Label>
              <Select value={String(form.STATUS_MASTER ?? "AC")} onValueChange={(v) => setForm((prev) => ({ ...prev, STATUS_MASTER: v }))}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || editLoading}>
                {saving ? "Saving..." : editLoading ? "Loading..." : editing ? "Update" : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the selected attachment.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EntityFilesViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        entityId={entityRefNo ?? ""}
        entityLabel={entityLabel}
        title="Files Viewer"
        emptyMessage="No files attached"
        listUrl={listUrl}
        contentUrlBuilder={contentUrlBuilder}
      />
    </div>
  );
}
