"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Plus, Search, Pencil, Trash2, Upload, FileText, X, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchBpVatFiles,
  fetchBpVatFileById,
  addBpVatFile,
  updateBpVatFile,
  deleteBpVatFile,
  clearBpVatFileError,
  type BpProductVatFileGridData
} from "@/lib/bpProductVatPercentageSettingsFilesSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const STATUS_OPTIONS = [
  { label: "Active", value: "AC" },
  { label: "Inactive", value: "IN" },
];

interface PickedFile {
  name: string;
  contentType: string;
  contentData: string;
  sizeMB: string;
}

const emptyForm = (): Record<string, any> => ({
  BP_PROD_VAT_ID: "",
  DOCUMENT_TYPE: "",
  DESCRIPTIONS: "",
  FILE_NAME: "",
  CONTENT_TYPE: "",
  CONTENT_DATA: "",
  REMARKS: "",
  STATUS_MASTER: "AC",
});

const readFileAsBase64 = (file: File): Promise<PickedFile> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = (event.target?.result as string).split(",")[1];
      resolve({
        name: file.name,
        contentType: file.type || "application/octet-stream",
        contentData: base64String,
        sizeMB: (file.size / (1024 * 1024)).toFixed(2),
      });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const MAX_MB = 10;

const toStatusCode = (val: any) => {
  const sv = String(val ?? "").toUpperCase().trim();
  if (sv === "ACTIVE" || sv === "AC") return "AC";
  return "IN";
};

const dataUrlFrom = (base64: string, contentType: string) =>
  `data:${contentType || "application/octet-stream"};base64,${base64}`;

export default function FilesTab({ initialSettingId = "", onClearSetting }: { initialSettingId?: string; onClearSetting?: () => void }) {
  const dispatch = useAppDispatch();
  const { files, loading, error } = useAppSelector((s) => s.bpVatFiles);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [role] = useState(() => {
    if (typeof window !== "undefined") {
      const userJson = localStorage.getItem("user");
      if (userJson) {
        try { return JSON.parse(userJson).role || "Manager"; } catch {}
      }
    }
    return "Manager";
  });
  const isAdmin = role === "Admin" || role === "Super Admin" || role === "Administrator";

  const [selectedSetting, setSelectedSetting] = useState<string>(initialSettingId);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AC");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BpProductVatFileGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>(emptyForm());
  const [editLoading, setEditLoading] = useState(false);
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [viewing, setViewing] = useState<{ name: string; contentType: string; dataUrl: string } | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);

  const { data: settings } = useApiQuery("bp-vat-files-settings", async () => {
    const res = await fetch(`${API_URL}/bp-product-vat-percentage-settings?status=ALL`);
    if (!res.ok) throw new Error("Failed to fetch settings");
    const json = await res.json();
    return (json.data || []).map((t: any) => ({ ...t, id: t.BP_PROD_VAT_ID }));
  });

  const settingOptions = useMemo(
    () =>
      Array.isArray(settings)
        ? settings.map((s: any) => ({
            value: String(s.BP_PROD_VAT_ID),
            label: `#${s.BP_PROD_VAT_ID} — ${s.COMPANY_NAME || "?"} / ${s.BP_NAME || "?"} / ${s.PRODUCT_NAME || "?"} (${s.VAT_PERCENTAGE != null ? `${s.VAT_PERCENTAGE}%` : "?"})`,
          }))
        : [],
    [settings]
  );

  useEffect(() => {
    if (initialSettingId && initialSettingId !== selectedSetting) {
      setSelectedSetting(initialSettingId);
      setCurrentPage(1);
      setSelectedIds(new Set());
    }
  }, [initialSettingId, selectedSetting]);

  useEffect(() => {
    if (!selectedSetting && settingOptions.length > 0) {
      setSelectedSetting(settingOptions[0].value);
    }
  }, [settingOptions, selectedSetting]);

  useEffect(() => {
    if (!selectedSetting) return;
    dispatch(fetchBpVatFiles({ settingId: selectedSetting, status: statusFilter }));
  }, [dispatch, selectedSetting, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearBpVatFileError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return files.filter((d: any) => {
      return (
        [
          d.DOCUMENT_TYPE,
          d.DESCRIPTIONS,
          d.FILE_NAME,
          d.CONTENT_TYPE,
          d.REMARKS,
          d.STATUS_MASTER,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [files, search]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;

  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);

  const totalPages = effectivePageSize === "ALL" ? 1 : Math.max(1, Math.ceil(filtered.length / effectivePageSize));
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm(), BP_PROD_VAT_ID: selectedSetting });
    setPickedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDialogOpen(true);
  };

  const openEdit = async (item: BpProductVatFileGridData) => {
    setEditing(item);
    setEditLoading(true);
    setDialogOpen(true);
    setPickedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setForm({
      ...emptyForm(),
      ...item,
      BP_PROD_VAT_ID: item.BP_PROD_VAT_ID != null ? String(item.BP_PROD_VAT_ID) : selectedSetting,
      STATUS_MASTER: toStatusCode(item.STATUS_MASTER),
    });
    try {
      const res: any = await dispatch(
        fetchBpVatFileById(Number(item.SNO) || Number(item.id))
      ).unwrap();
      if (res) {
        setForm({
          ...emptyForm(),
          ...res,
          BP_PROD_VAT_ID: res.BP_PROD_VAT_ID != null ? String(res.BP_PROD_VAT_ID) : selectedSetting,
          STATUS_MASTER: toStatusCode(res.STATUS_MASTER),
        });
      }
    } catch {
      // fallback to grid row data
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
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_MB) {
      toast({ variant: "destructive", title: `File exceeds the ${MAX_MB} MB upload limit` });
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
    } catch (e: any) {
      toast({ variant: "destructive", title: e?.message || "Failed to read file" });
    }
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
    if (!form.BP_PROD_VAT_ID || form.BP_PROD_VAT_ID === "") {
      toast({ variant: "destructive", title: "Setting is required" });
      return;
    }
    const fileData = form.CONTENT_DATA || pickedFile?.contentData;
    if (!fileData) {
      toast({ variant: "destructive", title: "Please select a file to upload" });
      return;
    }
    if (Math.floor(String(fileData).length * 3) / 4 > MAX_MB * 1024 * 1024) {
      toast({ variant: "destructive", title: `File exceeds the ${MAX_MB} MB upload limit` });
      return;
    }
    setSaving(true);
    try {
      const cleanForm = {
        ...form,
        DOCUMENT_TYPE: form.DOCUMENT_TYPE?.trim(),
        DESCRIPTIONS: form.DESCRIPTIONS?.trim(),
        REMARKS: form.REMARKS?.trim(),
      };
      if (editing) {
        const res: any = await dispatch(
          updateBpVatFile({
            ...cleanForm,
            SNO: Number(editing.SNO) || Number(editing.id),
            CONTENT_DATA: fileData,
          })
        ).unwrap();
        toast({ title: res?.message ?? "File updated successfully!" });
      } else {
        const res: any = await dispatch(addBpVatFile({ ...cleanForm, CONTENT_DATA: fileData })).unwrap();
        if (!res?.SNO) {
          throw new Error(res?.message || "Failed to retrieve new file SNO");
        }
        toast({ title: res?.message ?? "File uploaded successfully!" });
      }
      await dispatch(fetchBpVatFiles({ settingId: form.BP_PROD_VAT_ID, status: statusFilter }));
      setDialogOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to save file") });
    } finally {
      setSaving(false);
    }
  };

  const handleSingleDeleteFinal = async () => {
    if (deletingId == null) return;
    try {
      const res: any = await dispatch(deleteBpVatFile(deletingId)).unwrap();
      setDeletingId(null);
      toast({ title: res?.message ?? "File deleted successfully!" });
      dispatch(fetchBpVatFiles({ settingId: selectedSetting, status: statusFilter }));
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to delete file") });
    }
  };

  const handleBulkDeleteFinal = async () => {
    try {
      let lastRes: any = null;
      for (const id of Array.from(selectedIds)) {
        lastRes = await dispatch(deleteBpVatFile(id)).unwrap();
      }
      setSelectedIds(new Set());
      setIsBulkDeleting(false);
      toast({ title: lastRes?.message ?? "Files deleted successfully!" });
      dispatch(fetchBpVatFiles({ settingId: selectedSetting, status: statusFilter }));
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to delete items!") });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length && paginated.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.filter((i: any) => i && i.id).map((i: any) => i.id)));
    }
  };

  const toggleSelect = (id: string | number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handlePageSizeChange = (val: string) => {
    setPageSize(val === "ALL" ? "ALL" : Number(val));
    setCurrentPage(1);
  };

  const openView = async (item: BpProductVatFileGridData) => {
    setViewLoading(true);
    try {
      const res: any = await dispatch(
        fetchBpVatFileById(Number(item.SNO) || Number(item.id))
      ).unwrap();
      if (res?.CONTENT_DATA) {
        setViewing({
          name: res.FILE_NAME || item.FILE_NAME || "file",
          contentType: res.CONTENT_TYPE || "application/octet-stream",
          dataUrl: dataUrlFrom(res.CONTENT_DATA, res.CONTENT_TYPE),
        });
      } else {
        toast({ variant: "destructive", title: "File content not available" });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: e?.message || "Failed to load file" });
    } finally {
      setViewLoading(false);
    }
  };

  const setField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const renderField = (
    key: string,
    label: string,
    type: "text" | "textarea" | "select",
    options?: { value: string; label: string }[],
    required?: boolean,
    placeholder?: string
  ) => {
    const value = form[key] ?? "";
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : ""}>
        <Label className="text-xs">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        {type === "select" ? (
          <Select value={String(value)} onValueChange={(v) => setField(key, v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={placeholder || `Select ${label}`} />
            </SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={String(value)} onChange={(e) => setField(key, e.target.value)} placeholder={placeholder} />
        ) : (
          <Input value={String(value)} placeholder={placeholder} onChange={(e) => setField(key, e.target.value)} />
        )}
      </div>
    );
  };

  const statusBadge = (val: any) => {
    const sv = String(val ?? "").toLowerCase().trim();
    const isActive = sv === "active" || sv === "ac";
    const isInactive = sv === "inactive" || sv === "in";
    const colorClass = isActive
      ? "bg-success/10 text-success border-success/20"
      : isInactive
        ? "bg-destructive/10 text-destructive border-destructive/20"
        : "bg-info/10 text-info border-info/20";
    return (
      <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
        {isActive ? "Active" : isInactive ? "Inactive" : String(val)}
      </Badge>
    );
  };

  const currentFileLabel = pickedFile
    ? pickedFile.name
    : form.FILE_NAME
      ? form.FILE_NAME
      : "";

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">BP Product VAT Files</h1>
          <p className="text-sm text-muted-foreground">Manage files uploaded against VAT percentage settings</p>
        </div>
        <Button onClick={openAdd} disabled={!selectedSetting} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Upload File
        </Button>
      </div>

      {initialSettingId && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-sm text-primary font-medium">Filtered to Setting: <strong>#{initialSettingId}</strong></span>
          {onClearSetting && (
            <button
              onClick={() => {
                setSelectedSetting("");
                onClearSetting();
              }}
              className="ml-auto text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Clear Filter
            </button>
          )}
        </div>
      )}

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-4xl">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Setting:</span>
              <Select value={selectedSetting} onValueChange={(v) => { setSelectedSetting(v); setCurrentPage(1); setSelectedIds(new Set()); }}>
                <SelectTrigger className="w-80 h-9 text-xs">
                  <SelectValue placeholder="Select a setting" />
                </SelectTrigger>
                <SelectContent>
                  {settingOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Filter Status:</span>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-32 h-9 text-xs">
                  <SelectValue placeholder="Active" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AC">Active</SelectItem>
                  <SelectItem value="IN">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isAdmin && selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsBulkDeleting(true)}
                className="animate-in fade-in zoom-in duration-200 shadow-sm border border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Selected ({selectedIds.size})
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-end">
            <span className="text-xs text-muted-foreground">Show</span>
            <Select value={String(effectivePageSize)} onValueChange={handlePageSizeChange}>
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
            <span className="text-xs text-muted-foreground uppercase tracking-wider text-[10px]">entries</span>
          </div>
        </div>

        <div className="overflow-x-auto w-full max-w-[calc(100vw-2rem)] sm:max-w-none">
          {loading ? (
            <div className="w-full space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 transition-colors">
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-border w-4 h-4 accent-primary"
                      checked={paginated.length > 0 && selectedIds.size === paginated.length}
                      onChange={toggleSelectAll}
                      disabled={!isAdmin}
                    />
                  </th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">SNO</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Setting ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Document Type</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Descriptions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">File Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Content Type</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Remarks</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => (
                  <tr
                    key={item.id || `row-${idx}`}
                    className={`border-b hover:bg-muted/30 transition-colors ${selectedIds.has(item.id) ? "bg-primary/5 border-primary/20" : ""}`}
                  >
                    <td className="p-3 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-border w-4 h-4 accent-primary"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        disabled={!isAdmin}
                      />
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => openView(item)}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                        title="View file"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      )}
                    </td>
                    <td className="p-3 font-medium">{item.SNO}</td>
                    <td className="p-3">{item.BP_PROD_VAT_ID}</td>
                    <td className="p-3">{item.DOCUMENT_TYPE || "—"}</td>
                    <td className="p-3">{item.DESCRIPTIONS || "—"}</td>
                    <td className="p-3 font-medium">{item.FILE_NAME || "—"}</td>
                    <td className="p-3">{item.CONTENT_TYPE || "—"}</td>
                    <td className="p-3">{item.REMARKS || "—"}</td>
                    <td className="p-3">{statusBadge(item.STATUS_MASTER)}</td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-muted-foreground">
                      {selectedSetting ? "No records found matching your filters" : "Select a setting to view its files"}
                    </td>
                  </tr>
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
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="h-8 text-xs">
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
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="h-8 text-xs">
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => setDialogOpen(v)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit File" : "Upload File"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {renderField("BP_PROD_VAT_ID", "Setting", "select", settingOptions, true, "Select setting")}
              {renderField("DOCUMENT_TYPE", "Document Type", "text", undefined, false, "e.g., Agreement")}
              {renderField("DESCRIPTIONS", "Descriptions", "text", undefined, false, "e.g., VAT agreement document")}
              {renderField("STATUS_MASTER", "Status", "select", STATUS_OPTIONS, false, "Select status")}
              {renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}
            </div>

            <div>
              <Label className="text-xs">
                File {editing && !pickedFile ? <span className="text-muted-foreground font-normal">(leave unchanged to keep current file)</span> : <span className="text-destructive">*</span>}
              </Label>
              <div className="mt-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {currentFileLabel ? (
                  <div className="flex items-center justify-between p-4 border border-slate-200/70 rounded-[14px] bg-white shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 border border-emerald-100/50 rounded-[10px] flex items-center justify-center text-emerald-500 bg-emerald-50/50 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-slate-800 leading-tight">{currentFileLabel}</span>
                        <span className="text-xs font-semibold text-slate-400">
                          {pickedFile ? `${pickedFile.sizeMB} MB` : editing ? "Current file" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => fileInputRef.current?.click()}>
                        Replace
                      </Button>
                      <button onClick={clearPickedFile} className="text-red-300 hover:text-red-500 transition-colors p-2 shrink-0" type="button">
                        <X className="w-[18px] h-[18px]" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center py-10 px-6 border-2 border-dashed border-slate-200/80 rounded-[16px] bg-slate-50/30 hover:border-primary/30 transition-colors group"
                  >
                    <div className="w-12 h-12 bg-white rounded-[14px] flex items-center justify-center text-slate-400 mb-3 shadow-sm border border-slate-200/60 group-hover:scale-105 transition-transform duration-300 group-hover:text-primary">
                      <Upload className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                    <p className="font-semibold text-slate-700 text-sm mb-1">Click to choose a file</p>
                    <p className="text-slate-400 text-xs font-medium">PDF, JPG, PNG up to {MAX_MB}MB</p>
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || editLoading} className="bg-primary text-primary-foreground">
                {saving ? "Saving..." : editLoading ? "Loading..." : editing ? "Update" : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing || viewLoading} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              {viewing?.name || "Loading file..."}
            </DialogTitle>
          </DialogHeader>
          {viewLoading ? (
            <div className="w-full space-y-4">
              <Skeleton className="h-72 w-full" />
            </div>
          ) : viewing ? (
            <div className="space-y-4">
              {viewing.contentType.startsWith("image/") ? (
                <img
                  src={viewing.dataUrl}
                  alt={viewing.name}
                  className="max-h-[60vh] w-auto mx-auto rounded-lg border border-border"
                />
              ) : viewing.contentType === "application/pdf" ? (
                <iframe
                  src={viewing.dataUrl}
                  title={viewing.name}
                  className="w-full h-[60vh] rounded-lg border border-border"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200/80 rounded-[16px] bg-slate-50/30">
                  <FileText className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">Preview not available for this file type</p>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setViewing(null)}>
                  Close
                </Button>
                <a href={viewing.dataUrl} download={viewing.name}>
                  <Button className="bg-primary text-primary-foreground">
                    <Download className="w-4 h-4 mr-2" /> Download
                  </Button>
                </a>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingId != null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSingleDeleteFinal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleting} onOpenChange={setIsBulkDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete multiple records?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} selected items? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeleteFinal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
