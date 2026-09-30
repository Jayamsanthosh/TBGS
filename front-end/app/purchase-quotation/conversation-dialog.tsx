"use client";

import { useState, useEffect, useMemo } from "react";
import {
  MessageSquare, Pencil, Trash2, Plus, Loader2, X, User, Clock,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchConversations,
  fetchConversation,
  fetchResponseStatuses,
  addConversation,
  updateConversation,
  deleteConversation,
  clearConversationError,
  type ConversationGridData,
} from "@/lib/purchaseQuotationConversationSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";
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

/* Column widths from the live table. */
const MAX_STATUS = 50;
const MAX_REMARK = 50;
const MAX_DISCUSSION = 10000;

const ENTRY_OPTIONS = [
  { value: "CF", label: "Confirmed" },
  { value: "AC", label: "Active" },
  { value: "IN", label: "Inactive" },
];

const entryBadgeClass = (v: any) => {
  const s = String(v ?? "").toUpperCase();
  if (s === "CF") return "bg-blue-500/10 text-blue-600 border-blue-200";
  if (s === "AC") return "bg-green-500/10 text-green-600 border-green-200";
  return "bg-red-500/10 text-red-600 border-red-200";
};

const responseBadgeClass = (v: any) => {
  const s = String(v ?? "").toUpperCase();
  if (!s) return "bg-muted/50 text-muted-foreground border-border";
  if (s === "QUERY") return "bg-amber-500/10 text-amber-600 border-amber-200";
  if (s === "RESPONSE") return "bg-blue-500/10 text-blue-600 border-blue-200";
  if (s === "RESOLVED" || s === "CLOSED") return "bg-green-500/10 text-green-600 border-green-200";
  return "bg-purple-500/10 text-purple-600 border-purple-200";
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

/* CREATED_DATE comes back as "yyyy-mm-dd hh:mm:ss(.fff)" from CONVERT(...,120). */
const formatStamp = (value: any) => {
  if (!value) return "";
  const s = String(value).replace("T", " ").trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
  if (!m) return s;
  return `${m[3]}-${m[2]}-${m[1]} ${m[4]}:${m[5]}`;
};

const emptyForm = (): Record<string, any> => ({
  RESPONSE_EMP_ID: "",
  RESPONSE_STATUS: "",
  DISCUSSION_DETAILS: "",
  STATUS_ENTRY: "CF",
  REMARKS: "",
});

export default function ConversationDialog({
  open,
  onOpenChange,
  purchaseQuotationNo,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  purchaseQuotationNo: string;
}) {
  const dispatch = useAppDispatch();
  const { items, statuses, loading, saving, error } = useAppSelector(
    (s) => s.purchaseQuotationConversation
  );
  const { toast } = useToast();

  const [form, setForm] = useState<Record<string, any>>(emptyForm());
  const [editing, setEditing] = useState<ConversationGridData | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ConversationGridData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: employees } = useApiQuery("pq-conversation-employees", async () => {
    const res = await fetch(`${API_URL}/employee-database?status=AC`);
    const json = await res.json();
    return json.data || [];
  });

  useEffect(() => {
    if (!open || !purchaseQuotationNo) return;
    dispatch(fetchConversations({ refNo: purchaseQuotationNo }));
    dispatch(fetchResponseStatuses());
  }, [open, purchaseQuotationNo, dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearConversationError());
    }
  }, [error, dispatch, toast]);

  const setField = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = async (item: ConversationGridData) => {
    setEditing(item);
    setForm({
      ...emptyForm(),
      RESPONSE_EMP_ID: item.RESPONSE_EMP_ID == null ? "" : String(item.RESPONSE_EMP_ID),
      RESPONSE_STATUS: item.RESPONSE_STATUS ?? "",
      DISCUSSION_DETAILS: item.DISCUSSION_DETAILS ?? "",
      STATUS_ENTRY: item.STATUS_ENTRY || "CF",
      REMARKS: item.REMARKS ?? "",
    });
    setFormOpen(true);
    const sno = Number(item.SNO ?? item.id);
    if (sno > 0) {
      try {
        const res: any = await dispatch(fetchConversation(sno)).unwrap();
        if (res) {
          setForm({
            RESPONSE_EMP_ID: res.RESPONSE_EMP_ID == null ? "" : String(res.RESPONSE_EMP_ID),
            RESPONSE_STATUS: res.RESPONSE_STATUS ?? "",
            DISCUSSION_DETAILS: res.DISCUSSION_DETAILS ?? "",
            STATUS_ENTRY: res.STATUS_ENTRY || "CF",
            REMARKS: res.REMARKS ?? "",
          });
        }
      } catch {
        /* the grid row already carries every editable field */
      }
    }
  };

  const cancelForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm());
  };

  const handleSave = async () => {
    const details = String(form.DISCUSSION_DETAILS ?? "").trim();
    if (!details && !editing) {
      toast({ variant: "destructive", title: "Discussion details are required" });
      return;
    }
    if (String(form.RESPONSE_STATUS ?? "").length > MAX_STATUS) {
      toast({ variant: "destructive", title: `Response status is limited to ${MAX_STATUS} characters` });
      return;
    }
    if (String(form.REMARKS ?? "").length > MAX_REMARK) {
      toast({ variant: "destructive", title: `Remarks is limited to ${MAX_REMARK} characters` });
      return;
    }
    if (details.length > MAX_DISCUSSION) {
      toast({ variant: "destructive", title: `Discussion is limited to ${MAX_DISCUSSION} characters` });
      return;
    }

    const payload: any = {
      PURCHASE_QUOTATION_NO: purchaseQuotationNo,
      RESPONSE_EMP_ID: form.RESPONSE_EMP_ID === "" ? null : Number(form.RESPONSE_EMP_ID),
      DISCUSSION_DETAILS: details,
      RESPONSE_STATUS: String(form.RESPONSE_STATUS ?? "").trim(),
      STATUS_ENTRY: form.STATUS_ENTRY || "CF",
      REMARKS: String(form.REMARKS ?? "").trim(),
    };

    try {
      if (editing) {
        const sno = Number(editing.SNO ?? editing.id);
        const res: any = await dispatch(updateConversation({ ...payload, SNO: sno })).unwrap();
        toast({ title: res?.message || "Conversation updated successfully" });
      } else {
        const res: any = await dispatch(addConversation(payload)).unwrap();
        toast({ title: res?.message || "Conversation saved successfully" });
      }
      cancelForm();
      dispatch(fetchConversations({ refNo: purchaseQuotationNo }));
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: typeof e === "string" ? e : e?.message || "Failed to save the conversation",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const sno = Number(deleteTarget.SNO ?? deleteTarget.id);
    setDeleting(true);
    try {
      const res: any = await dispatch(deleteConversation(sno)).unwrap();
      toast({ title: res?.message || "Conversation deleted successfully" });
      setDeleteTarget(null);
      dispatch(fetchConversations({ refNo: purchaseQuotationNo }));
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

  const sorted = useMemo(() => [...items].sort((a, b) => (b.SNO ?? 0) - (a.SNO ?? 0)), [items]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-w-4xl max-h-[88vh] flex-col overflow-hidden w-[calc(100vw-2rem)] p-0">
          <DialogHeader className="shrink-0 space-y-0 px-6 pt-6 pb-3">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Conversation
            </DialogTitle>
            <p className="text-xs text-muted-foreground">Purchase Quotation {purchaseQuotationNo}</p>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 space-y-3">
            {loading ? (
              <div className="space-y-3 py-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="py-14 text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No conversation for this quotation yet</p>
              </div>
            ) : (
              sorted.map((item: ConversationGridData) => {
                const name = item.RESPONSE_EMP_NAME?.trim() || (item.RESPONSE_EMP_ID ? `Employee #${item.RESPONSE_EMP_ID}` : "");
                const who = name || item.CREATED_BY || "Unknown";
                return (
                  <div key={item.SNO ?? item.id} className="flex gap-3 rounded-lg border p-3 bg-card">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {name ? initials(who) : <User className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{who}</span>
                        {item.RESPONSE_STATUS && (
                          <Badge variant="outline" className={`px-2 py-0.5 text-[10px] uppercase font-bold ${responseBadgeClass(item.RESPONSE_STATUS)}`}>
                            {item.RESPONSE_STATUS}
                          </Badge>
                        )}
                        {item.STATUS_ENTRY && (
                          <Badge variant="outline" className={`px-2 py-0.5 text-[10px] uppercase font-bold ${entryBadgeClass(item.STATUS_ENTRY)}`}>
                            {item.STATUS_ENTRY}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {formatStamp(item.CREATED_DATE)}
                        </span>
                      </div>
                      {item.DISCUSSION_DETAILS && (
                        <p className="text-sm whitespace-pre-wrap break-words">{item.DISCUSSION_DETAILS}</p>
                      )}
                      {item.REMARKS && (
                        <p className="text-[11px] text-muted-foreground mt-1">Remarks: {item.REMARKS}</p>
                      )}
                      <div className="flex items-center gap-1 mt-2">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Edit" onClick={() => openEdit(item)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" title="Delete"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        {item.MODIFIED_DATE && item.MODIFIED_DATE !== item.CREATED_DATE && (
                          <span className="text-[10px] text-muted-foreground ml-1">
                            edited by {item.MODIFIED_BY || "unknown"} {formatStamp(item.MODIFIED_DATE)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* add / edit form */}
          {formOpen && (
            <div className="shrink-0 border-t bg-muted/30 px-6 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {editing ? "Edit Conversation" : "Add Response"}
                </h3>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={cancelForm}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Response Employee</Label>
                  <EmployeeCombobox
                    value={form.RESPONSE_EMP_ID}
                    onChange={(v) => setField("RESPONSE_EMP_ID", v)}
                    options={employees || []}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Response Status</Label>
                  <Input
                    className="h-9 text-xs" list="pqConvStatuses" value={form.RESPONSE_STATUS}
                    maxLength={MAX_STATUS} onChange={(e) => setField("RESPONSE_STATUS", e.target.value)}
                    placeholder="e.g. QUERY"
                  />
                  <datalist id="pqConvStatuses">
                    {statuses.map((s) => <option key={s} value={s} />)}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Status Entry</Label>
                  <Select value={form.STATUS_ENTRY || "CF"} onValueChange={(v) => setField("STATUS_ENTRY", v)}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ENTRY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Remarks</Label>
                  <Input
                    className="h-9 text-xs" value={form.REMARKS} maxLength={MAX_REMARK}
                    onChange={(e) => setField("REMARKS", e.target.value)} placeholder="Optional"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">
                    Discussion Details {!editing && <span className="text-destructive">*</span>}
                  </Label>
                  <Textarea
                    className="text-xs min-h-24" value={form.DISCUSSION_DETAILS}
                    onChange={(e) => setField("DISCUSSION_DETAILS", e.target.value)}
                    placeholder="What needs to be discussed or confirmed?"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {String(form.DISCUSSION_DETAILS ?? "").length}/{MAX_DISCUSSION}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" className="h-9 text-xs" onClick={cancelForm}>Cancel</Button>
                <Button
                  className="h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleSave} disabled={saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editing ? "Update" : "Save"}
                </Button>
              </div>
            </div>
          )}

          <div className="flex shrink-0 items-center justify-end gap-3 border-t bg-background px-6 py-4">
            {!formOpen && (
              <Button
                className="h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={openAdd}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Response
              </Button>
            )}
            <Button variant="outline" className="h-9 text-xs" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the entry. This cannot be undone.
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
    </>
  );
}
