"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchBatchesBySource,
  addBatch,
  updateBatch,
  deleteBatch,
  clearBatches,
  type BatchMasterData,
} from "@/lib/batchMasterSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";

export interface BatchTabLine {
  [key: string]: any;
}

interface Option {
  value: string;
  label: string;
}

export interface BatchHeaderContext {
  COMPANY_ID?: number | string | null;
  CAMP_ID?: number | string | null;
  STORE_ID?: number | string | null;
  LINK_PAGES_ID?: number | string | null;
}

/* The Batch tab is attached to a saved inventory document (Purchase GRN /
   Opening Stock). Each batch row links back to its detail line through
   BATCH_SOURCE_REF_NO (the document ref) and BATCH_SOURCE_DTL_ID (the line); a
   line may hold several batches. Because the document ref only exists after the
   header is saved, the tab is usable in edit mode; a fresh record shows a hint
   instead. */
export default function BatchTab({
  refNo,
  lines,
  header,
  dtlIdKey,
  productOptions = [],
  uomOptions = [],
  documentLabel = "document",
  onBatchesChange,
  openFor,
  pendingBatches,
  onPendingBatchesChange,
}: {
  refNo: string;
  lines: BatchTabLine[];
  header: BatchHeaderContext;
  dtlIdKey: string;
  productOptions?: Option[];
  uomOptions?: Option[];
  documentLabel?: string;
  onBatchesChange?: (batches: BatchMasterData[]) => void;
  /* Pop the add dialog pre-filled for a specific detail line. The nonce makes
     repeated clicks on the same line re-trigger the popup. */
  openFor?: { dtlId: string; nonce: number } | null;
  /* Create (unsaved) mode: batches are held in memory until the host document
     is saved, because the document ref / detail ids do not exist yet. Lines are
     keyed by LINE_NO in this mode and re-pointed after the save. */
  pendingBatches?: BatchMasterData[];
  onPendingBatchesChange?: (batches: BatchMasterData[]) => void;
}) {
  const dispatch = useAppDispatch();
  const { items: storeItems, loading } = useAppSelector((s) => s.batchMaster);
  const { toast } = useToast();

  /* pendingBatches !== undefined switches this tab into create mode. */
  const isPending = pendingBatches !== undefined;
  const items = isPending ? pendingBatches || [] : storeItems;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BatchMasterData | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  /* Latest batches, readable from the openFor effect without making it re-run
     every time the list is refetched. */
  const itemsRef = useRef<BatchMasterData[]>([]);
  const lastOpenNonce = useRef<number | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (refNo) {
      dispatch(fetchBatchesBySource(refNo));
    } else {
      dispatch(clearBatches());
    }
    setFormOpen(false);
    setEditing(null);
    setForm({});
  }, [refNo, isPending, dispatch]);

  /* Report the current batch set so a host document can mirror its mapped /
     balance quantities onto the linked detail lines. */
  useEffect(() => {
    itemsRef.current = items || [];
    onBatchesChange?.(items || []);
  }, [items, onBatchesChange]);

  const productName = (id: any) =>
    productOptions.find((o) => o.value === String(id ?? ""))?.label || (id ? String(id) : "-");
  const uomName = (id: any) =>
    uomOptions.find((o) => o.value === String(id ?? ""))?.label || (id ? String(id) : "-");

  /* A line is keyed by its real detail id once saved; before the document is
     saved every line only has a LINE_NO, so that is the fallback key. */
  const idOfLine = (l: BatchTabLine | undefined): any => {
    if (!l) return "";
    if (l[dtlIdKey] != null && l[dtlIdKey] !== "") return l[dtlIdKey];
    return l.LINE_NO != null && l.LINE_NO !== "" ? l.LINE_NO : "";
  };

  const lineByDtlId = useMemo(() => {
    const map = new Map<string, BatchTabLine>();
    (Array.isArray(lines) ? lines : []).forEach((l) => {
      const id = idOfLine(l);
      if (id !== "") map.set(String(id), l);
    });
    return map;
  }, [lines, dtlIdKey]);

  const lineOptions = useMemo(() => {
    return (Array.isArray(lines) ? lines : [])
      .filter((l) => idOfLine(l) !== "")
      .map((l) => ({
        value: String(idOfLine(l)),
        label: `Line ${l.LINE_NO ?? "?"} - ${productName(l.PRODUCT_ID)}`,
        line: l,
      }));
  }, [lines, dtlIdKey, productOptions]);

  const toIsoDate = (v: any) => {
    if (!v) return "";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  };

  const lineQty = (l: BatchTabLine | undefined) => {
    if (!l) return "";
    if (l.ACCEPTED_QUANTITY != null && l.ACCEPTED_QUANTITY !== "") return l.ACCEPTED_QUANTITY;
    if (l.RECEIVED_QUANTITY != null && l.RECEIVED_QUANTITY !== "") {
      const received = Number(l.RECEIVED_QUANTITY) || 0;
      const rejected = Number(l.REJECTED_QUANTITY || 0) || 0;
      return String(Math.max(0, received - rejected));
    }
    if (l.TOTAL_QUANTITY != null && l.TOTAL_QUANTITY !== "") return l.TOTAL_QUANTITY;
    return "";
  };

  const labelOfLine = (dtlId: any) => {
    const l = lineByDtlId.get(String(dtlId ?? ""));
    return l ? `Line ${l.LINE_NO ?? "?"}` : "-";
  };

  const fmt3 = (n: number) =>
    (Math.round((Number.isFinite(n) ? n : 0) * 1000) / 1000).toFixed(3);

  /* Sum of BATCH_QTY already mapped to a line; an in-progress edit can exclude
     its own current qty so raising it is judged against the real headroom. */
  const mappedForDtl = (dtlId: any, excludeBatchId?: number) =>
    (itemsRef.current || [])
      .filter(
        (b) =>
          String(b.BATCH_SOURCE_DTL_ID) === String(dtlId ?? "") &&
          (excludeBatchId == null || Number(b.BATCH_ID) !== Number(excludeBatchId))
      )
      .reduce((sum, b) => sum + (Number(b.BATCH_QTY) || 0), 0);

  const remainingForDtl = (dtlId: any, excludeBatchId?: number) => {
    const accepted = Number(lineQty(lineByDtlId.get(String(dtlId ?? "")))) || 0;
    return accepted - mappedForDtl(dtlId, excludeBatchId);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({});
    setFormOpen(true);
  };

  const openEdit = (row: BatchMasterData) => {
    setEditing(row);
    setForm({
      BATCH_SOURCE_DTL_ID: row.BATCH_SOURCE_DTL_ID != null ? String(row.BATCH_SOURCE_DTL_ID) : "",
      BATCH_NO: row.BATCH_NO ?? "",
      BATCH_QTY: row.BATCH_QTY ?? "",
      MANUFACTURE_DATE: toIsoDate(row.MANUFACTURE_DATE),
      EXPIRY_DATE: toIsoDate(row.EXPIRY_DATE),
      REMARKS: row.REMARKS ?? "",
    });
    setFormOpen(true);
  };

  const applyLine = (dtlId: string) => {
    const l = lineByDtlId.get(String(dtlId));
    setForm((prev) => ({
      ...prev,
      BATCH_SOURCE_DTL_ID: dtlId,
      MANUFACTURE_DATE: toIsoDate(l?.MANUFACTURE_DATE),
      EXPIRY_DATE: toIsoDate(l?.EXPIRY_DATE),
      REMARKS: l?.REMARKS || "",
    }));
  };

  const updateForm = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm({});
  };

  /* Opening from a "Balance to Map" click: pre-fill the add form from the clicked
     line. Batch No and Batch Qty stay blank so the next batch quantity is typed in
     by the user; the running totals are shown in the dialog header. */
  useEffect(() => {
    if (!openFor || (!refNo && !isPending)) return;
    if (lastOpenNonce.current === openFor.nonce) return;
    lastOpenNonce.current = openFor.nonce;
    const dtlId = String(openFor.dtlId);
    const l = lineByDtlId.get(dtlId);
    if (!l) return;
    setEditing(null);
    setForm({
      BATCH_SOURCE_DTL_ID: dtlId,
      BATCH_NO: "",
      BATCH_QTY: "",
      MANUFACTURE_DATE: toIsoDate(l?.MANUFACTURE_DATE),
      EXPIRY_DATE: toIsoDate(l?.EXPIRY_DATE),
      REMARKS: l?.REMARKS || "",
    });
    setFormOpen(true);
  }, [openFor, refNo, isPending, lineByDtlId]);

  const toNumOrNull = (v: any) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  const nextPendingId = () =>
    (pendingBatches || []).reduce((m, b) => Math.max(m, Number(b.BATCH_ID) || 0), 0) + 1;

  const handleSave = async () => {
    const dtlId = toNumOrNull(form.BATCH_SOURCE_DTL_ID);
    if (!dtlId) {
      toast({ title: "Select a detail line", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.BATCH_NO || !String(form.BATCH_NO).trim()) {
      toast({ title: "Batch No is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!(Number(form.BATCH_QTY) > 0)) {
      toast({ title: "Batch Quantity must be greater than 0", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (form.EXPIRY_DATE && form.MANUFACTURE_DATE && form.EXPIRY_DATE < form.MANUFACTURE_DATE) {
      toast({ title: "Expiry Date cannot be before Manufacture Date", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    const line = lineByDtlId.get(String(dtlId));
    const remaining = remainingForDtl(
      dtlId,
      editing?.BATCH_ID != null ? Number(editing.BATCH_ID) : undefined
    );
    if (Number(form.BATCH_QTY) > remaining) {
      toast({
        title: `Only ${fmt3(Math.max(0, remaining))} remains to map for this line`,
        variant: "destructive",
        duration: DEFAULT_TOAST_DURATION,
      });
      return;
    }
    const payload: BatchMasterData = {
      BATCH_ID: editing?.BATCH_ID,
      BATCH_NO: String(form.BATCH_NO).trim(),
      LINK_PAGES_ID: toNumOrNull(header.LINK_PAGES_ID),
      BATCH_SOURCE_REF_NO: refNo,
      BATCH_SOURCE_DTL_ID: dtlId,
      COMPANY_ID: toNumOrNull(header.COMPANY_ID),
      CAMP_ID: toNumOrNull(header.CAMP_ID),
      STORE_ID: toNumOrNull(header.STORE_ID),
      PRODUCT_ID: toNumOrNull(line?.PRODUCT_ID),
      BATCH_QTY: Number(form.BATCH_QTY),
      UOM_ID: toNumOrNull(line?.UOM_ID),
      MANUFACTURE_DATE: form.MANUFACTURE_DATE || null,
      EXPIRY_DATE: form.EXPIRY_DATE || null,
      REMARKS: form.REMARKS?.trim() || null,
      STATUS_MASTER: "AC",
    };

    /* Create mode: keep the batch in memory only; the ref / detail ids are
       assigned once the document has been saved. */
    if (isPending) {
      const next: BatchMasterData = {
        ...payload,
        BATCH_ID: editing?.BATCH_ID ?? nextPendingId(),
      };
      const updated = editing
        ? (pendingBatches || []).map((b) =>
            Number(b.BATCH_ID) === Number(editing.BATCH_ID) ? next : b
          )
        : [...(pendingBatches || []), next];
      onPendingBatchesChange?.(updated);
      closeForm();
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const res = await dispatch(updateBatch(payload)).unwrap();
        toast({ title: res?.message ?? "Batch updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addBatch(payload)).unwrap();
        toast({ title: res?.message ?? "Batch saved successfully", duration: DEFAULT_TOAST_DURATION });
      }
      closeForm();
      dispatch(fetchBatchesBySource(refNo));
    } catch (e: any) {
      toast({
        title: typeof e === "string" ? e : e?.message || "Failed to save batch",
        variant: "destructive",
        duration: DEFAULT_TOAST_DURATION,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    if (isPending) {
      onPendingBatchesChange?.(
        (pendingBatches || []).filter((b) => Number(b.BATCH_ID) !== Number(deleteId))
      );
      setDeleteId(null);
      toast({ title: "Batch deleted", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    try {
      const res = await dispatch(deleteBatch(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Batch deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchBatchesBySource(refNo));
    } catch (e: any) {
      toast({
        title: typeof e === "string" ? e : e?.message || "Failed to delete batch",
        variant: "destructive",
        duration: DEFAULT_TOAST_DURATION,
      });
    }
  };

  if (!refNo && !isPending) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Save the {documentLabel} first to manage batches.
      </div>
    );
  }

  const summaryLine = form.BATCH_SOURCE_DTL_ID ? lineByDtlId.get(String(form.BATCH_SOURCE_DTL_ID)) : undefined;
  const summaryAccepted = summaryLine ? Number(lineQty(summaryLine)) || 0 : 0;
  const summaryMapped = form.BATCH_SOURCE_DTL_ID ? mappedForDtl(form.BATCH_SOURCE_DTL_ID) : 0;
  const summaryRemaining = summaryAccepted - summaryMapped;
  const typedQty = Number(form.BATCH_QTY) || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Batches</h3>
          <p className="text-xs text-muted-foreground">Add one or more batches for {refNo}</p>
        </div>
        <Button
          type="button"
          onClick={openAdd}
          disabled={formOpen || lineOptions.length === 0}
          className="h-8 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Batch
        </Button>
      </div>

      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) closeForm(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Batch" : "Add Batch"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update this batch." : `Add a batch for ${refNo}.`}
            </DialogDescription>
          </DialogHeader>
          {form.BATCH_SOURCE_DTL_ID ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-md border bg-muted/30 px-3 py-2 text-xs">
              <span>
                Line: <b>{labelOfLine(form.BATCH_SOURCE_DTL_ID)}</b>
              </span>
              <span>
                Line Total: <b className="tabular-nums">{fmt3(summaryAccepted)}</b>
              </span>
              <span>
                Mapped: <b className="tabular-nums">{fmt3(summaryMapped)}</b>
              </span>
              <span>
                Remaining: <b className="tabular-nums">{fmt3(summaryRemaining)}</b>
              </span>
              {!editing && typedQty > 0 ? (
                <span className="text-primary">
                  After this batch ⇒ Remaining:{" "}
                  <b className="tabular-nums">{fmt3(summaryRemaining - typedQty)}</b>
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Detail Line<span className="text-destructive ml-0.5">*</span></Label>
              <Select
                value={form.BATCH_SOURCE_DTL_ID || ""}
                onValueChange={(v) => applyLine(v)}
                disabled={!!editing}
              >
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select line" /></SelectTrigger>
                <SelectContent>
                  {lineOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Batch No<span className="text-destructive ml-0.5">*</span></Label>
              <Input
                value={form.BATCH_NO ?? ""}
                onChange={(e) => updateForm("BATCH_NO", e.target.value)}
                placeholder="Batch no"
                className="h-9 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Batch Quantity<span className="text-destructive ml-0.5">*</span></Label>
              <Input
                type="number"
                min={0}
                step="any"
                value={form.BATCH_QTY ?? ""}
                onChange={(e) => updateForm("BATCH_QTY", e.target.value)}
                placeholder="0"
                className="h-9 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Manufacture Date</Label>
              <DatePicker value={form.MANUFACTURE_DATE || ""} onChange={(v) => updateForm("MANUFACTURE_DATE", v)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Expiry Date</Label>
              <DatePicker value={form.EXPIRY_DATE || ""} onChange={(v) => updateForm("EXPIRY_DATE", v)} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
              <Label className="text-xs">Remarks</Label>
              <Input
                value={form.REMARKS ?? ""}
                onChange={(e) => updateForm("REMARKS", e.target.value)}
                placeholder="Remarks"
                className="h-9 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-8 text-xs"
              onClick={closeForm}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="button" className="h-8 text-xs" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
              {editing ? "Update Batch" : "Save Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border overflow-x-auto">
        {loading ? (
          <div className="space-y-3 p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                {[...Array(6)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Actions</th>
                <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Line</th>
                <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Batch No</th>
                <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Product</th>
                <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">UOM</th>
                <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Qty</th>
                <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Mfg Date</th>
                <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Expiry Date</th>
                <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map((b: BatchMasterData) => (
                <tr key={b.BATCH_ID} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3 flex gap-2">
                    <button type="button" onClick={() => openEdit(b)} className="p-1.5 rounded hover:bg-muted transition-colors">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button type="button" onClick={() => setDeleteId(Number(b.BATCH_ID))} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </td>
                  <td className="p-3">{labelOfLine(b.BATCH_SOURCE_DTL_ID)}</td>
                  <td className="p-3 font-medium">{b.BATCH_NO || "-"}</td>
                  <td className="p-3">{productName(b.PRODUCT_ID)}</td>
                  <td className="p-3">{uomName(b.UOM_ID)}</td>
                  <td className="p-3">{b.BATCH_QTY ?? "-"}</td>
                  <td className="p-3">{toIsoDate(b.MANUFACTURE_DATE) || "-"}</td>
                  <td className="p-3">{toIsoDate(b.EXPIRY_DATE) || "-"}</td>
                  <td className="p-3">{b.REMARKS || "-"}</td>
                </tr>
              ))}
              {(items || []).length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">No batches added yet</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <AlertDialog open={deleteId != null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Batch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this batch? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
