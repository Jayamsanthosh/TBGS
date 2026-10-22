"use client";

import { useState, useEffect, useMemo, useId } from "react";
import {
  MessageSquare, Pencil, Trash2, Plus, Loader2, X, User, Clock, Check, ChevronsUpDown,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchInvoiceConversations,
  fetchInvoiceResponseStatuses,
  addInvoiceConversation,
  updateInvoiceConversation,
  deleteInvoiceConversation,
  clearInvoiceConversationError,
  type InvoiceConversationData,
} from "@/lib/purchaseInvoiceConversationSlice";
import { API_URL } from "@/lib/config";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* Column widths from the live table. */
const MAX_STATUS = 50;
const MAX_REMARK = 500;
const MAX_DISCUSSION = 10000;

/* There is no response-status master, so the picker is fed the statuses this
   table has collected plus the ones this workflow actually uses. Anything typed
   is still accepted, so an unusual status is never blocked. */
const SUGGESTED_STATUSES = ["QUERY", "RESPONSE", "RESOLVED", "APPROVED", "REJECTED"];

const COLLAPSE_AT = 500;

const ENTRY_OPTIONS = [
  { value: "CF", label: "Confirmed" },
  { value: "AC", label: "Active" },
  { value: "IN", label: "Inactive" },
];

const entryBadgeClass = (v: any) => {
  const s = String(v ?? "").toUpperCase();
  if (s === "CF") return "bg-blue-500/10 text-blue-600 border-blue-200";
  if (s === "AC") return "bg-green-500/10 text-green-600 border-green-200";
  return "bg-muted/50 text-muted-foreground border-border";
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

/* CREATED_DATE arrives as "yyyy-mm-dd hh:mm:ss(.fff)" from CONVERT(...,120) -
   server wall clock, no timezone marker. It is split by hand rather than handed
   to Date, which would otherwise read it as UTC and can shift the day. */
const parseStamp = (value: any) => {
  if (!value) return null;
  const s = String(value).trim().replace("T", " ");
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?/);
  if (!m) return { day: "", date: s, time: "" };
  return {
    day: `${m[1]}-${m[2]}-${m[3]}`,
    date: `${m[3]}-${m[2]}-${m[1]}`,
    time: m[4] ? `${m[4]}:${m[5]}` : "",
  };
};

const dayKeyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const dayLabel = (key: string) => {
  if (!key) return "Earlier";
  const now = new Date();
  if (key === dayKeyOf(now)) return "Today";
  if (key === dayKeyOf(new Date(now.getTime() - 86400000))) return "Yesterday";
  const m = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : key;
};

const stampLine = (value: any) => {
  const p = parseStamp(value);
  if (!p) return "";
  return p.time ? `${p.date} at ${p.time}` : p.date;
};

const emptyForm = (): Record<string, any> => ({
  RESPONSE_EMP_ID: "",
  RESPONSE_STATUS: "",
  DISCUSSION_DETAILS: "",
  STATUS_ENTRY: "CF",
  REMARKS: "",
});

/* Searchable, but never restrictive: a typed value that matches nothing becomes
   a real option instead of being refused. */
function StatusCombobox({
  value,
  onChange,
  options,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const typed = search.trim();
  const matches = typed
    ? options.filter((o) => o.toLowerCase().includes(typed.toLowerCase()))
    : options;
  const alreadyListed = options.some((o) => o.toLowerCase() === typed.toLowerCase());

  const pick = (v: string) => {
    onChange(v);
    setSearch("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(""); }}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-10 px-3 font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <span className="truncate">{value || "Select or type a status"}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0 pointer-events-auto"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or type a new status..."
            value={search}
            onValueChange={setSearch}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>No status matches that text.</CommandEmpty>
            {matches.map((o) => (
              <CommandItem key={o} value={o} onSelect={() => pick(o)}>
                <Check className={cn("mr-2 h-4 w-4", value === o ? "opacity-100" : "opacity-0")} />
                {o}
              </CommandItem>
            ))}
            {typed && !alreadyListed && (
              <CommandItem value={`__use__${typed}`} onSelect={() => pick(typed.toUpperCase())}>
                <Plus className="mr-2 h-4 w-4" />
                Use &quot;{typed.toUpperCase()}&quot;
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function InvoiceConversationPanel({
  refNo,
  linkPagesId,
  statusEntry,
  className,
  emptyHint = "Use the box below to raise a query, record a response, or note how this invoice was agreed with the supplier.",
}: {
  refNo: string;
  linkPagesId?: number;
  statusEntry?: string;
  className?: string;
  emptyHint?: string;
}) {
  const dispatch = useAppDispatch();
  const { items, statuses, loading, saving, error } = useAppSelector(
    (s) => s.purchaseInvoiceConversation
  );
  const user = useAppSelector((s) => s.auth.user);
  const { toast } = useToast();

  const [form, setForm] = useState<Record<string, any>>(emptyForm());
  const [editing, setEditing] = useState<InvoiceConversationData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceConversationData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeesFailed, setEmployeesFailed] = useState(false);
  /* Unique per instance, because the panel can be mounted twice on the page
     (grid dialog and wizard tab). */
  const discussionId = `piConvDiscussion-${useId()}`;

  /* The server accepts the literal role 'Admin' and nothing else, and refuses
     outright once the invoice is submitted. Matching that here means the
     control is hidden instead of failing after the click. Adding and editing
     have no such rule, so they stay available. */
  const isAdmin = String(user?.role ?? "").trim() === "Admin";
  const locked = String(statusEntry ?? "").trim().toUpperCase() === "CL";
  const canDelete = isAdmin && !locked;

  useEffect(() => {
    if (!refNo) return;
    dispatch(fetchInvoiceConversations({ refNo, linkPagesId }));
  }, [refNo, linkPagesId, dispatch]);

  useEffect(() => {
    dispatch(fetchInvoiceResponseStatuses(linkPagesId));
  }, [linkPagesId, dispatch]);

  /* Loaded per opening rather than cached forever, and a failure is reported
     instead of leaving an empty picker that looks like "no employees exist". */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/employee-database?status=AC`);
        if (!res.ok) throw new Error("request failed");
        const json = await res.json();
        if (cancelled) return;
        setEmployees(json.data || []);
        setEmployeesFailed(false);
      } catch {
        if (cancelled) return;
        setEmployees([]);
        setEmployeesFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [refNo]);

  /* Leaving rows behind would show the previous invoice's thread. The list is
     emptied when the fetch starts, so nothing stale is ever on screen. */
  useEffect(() => {
    if (!error) return;
    toast({ variant: "destructive", title: "Error", description: error });
    dispatch(clearInvoiceConversationError());
  }, [error, dispatch, toast]);

  const statusOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of [...SUGGESTED_STATUSES, ...statuses]) {
      const k = String(s ?? "").trim();
      if (k && !seen.has(k.toUpperCase())) seen.set(k.toUpperCase(), k);
    }
    return [...seen.values()];
  }, [statuses]);

  const setField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  /* Default to whoever is signed in, so the common case needs no picking. It
     stays blank for a login with no employee row rather than guessing one. */
  const currentEmpId = user?.employee?.empId ? String(user.employee.empId) : "";

  const startEdit = (item: InvoiceConversationData) => {
    setEditing(item);
    setForm({
      RESPONSE_EMP_ID: item.RESPONSE_EMP_ID == null ? "" : String(item.RESPONSE_EMP_ID),
      RESPONSE_STATUS: item.RESPONSE_STATUS ?? "",
      DISCUSSION_DETAILS: item.DISCUSSION_DETAILS ?? "",
      STATUS_ENTRY: item.STATUS_ENTRY || "CF",
      REMARKS: item.REMARKS ?? "",
    });
    setErrors({});
  };

  /* Put the cursor in the box that is being edited. */
  useEffect(() => {
    if (!editing) return;
    document.getElementById(discussionId)?.focus();
  }, [editing, discussionId]);

  const cancelEdit = () => {
    setEditing(null);
    setForm({ ...emptyForm(), RESPONSE_EMP_ID: currentEmpId });
    setErrors({});
  };

  const handleSave = async () => {
    const details = String(form.DISCUSSION_DETAILS ?? "").trim();
    const status = String(form.RESPONSE_STATUS ?? "").trim();
    const remarks = String(form.REMARKS ?? "").trim();

    /* The whole point of an entry is the discussion, so it is required whether
       this is a new one or an edit. */
    const next: Record<string, string> = {};
    if (!details) next.DISCUSSION_DETAILS = "Enter what needs to be discussed or confirmed";
    else if (details.length > MAX_DISCUSSION) {
      next.DISCUSSION_DETAILS = `Discussion must be ${MAX_DISCUSSION} characters or less`;
    }
    if (status.length > MAX_STATUS) {
      next.RESPONSE_STATUS = `Response status must be ${MAX_STATUS} characters or less`;
    }
    if (remarks.length > MAX_REMARK) {
      next.REMARKS = `Remarks must be ${MAX_REMARK} characters or less`;
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload: any = {
      PAGE_REF_NO: refNo,
      LINK_PAGES_ID: linkPagesId,
      RESPONSE_EMP_ID: form.RESPONSE_EMP_ID === "" ? null : Number(form.RESPONSE_EMP_ID),
      DISCUSSION_DETAILS: details,
      RESPONSE_STATUS: status,
      STATUS_ENTRY: form.STATUS_ENTRY || "CF",
      REMARKS: remarks,
    };

    try {
      if (editing) {
        const id = Number(editing.CONVERSATION_ID ?? editing.id);
        const res: any = await dispatch(
          updateInvoiceConversation({ ...payload, CONVERSATION_ID: id })
        ).unwrap();
        toast({ title: res?.message || "Conversation updated successfully" });
      } else {
        const res: any = await dispatch(addInvoiceConversation(payload)).unwrap();
        toast({ title: res?.message || "Conversation saved successfully" });
      }
      cancelEdit();
      dispatch(fetchInvoiceConversations({ refNo, linkPagesId }));
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: typeof e === "string" ? e : e?.message || "Failed to save the conversation",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = Number(deleteTarget.CONVERSATION_ID ?? deleteTarget.id);
    setDeleting(true);
    try {
      const res: any = await dispatch(deleteInvoiceConversation(id)).unwrap();
      toast({ title: res?.message || "Conversation deleted successfully" });
      setDeleteTarget(null);
      dispatch(fetchInvoiceConversations({ refNo, linkPagesId }));
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

  /* Newest first: this is a record of what was said and when, not a chat to
     scroll up through. */
  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) => Number(b.CONVERSATION_ID ?? b.id ?? 0) - Number(a.CONVERSATION_ID ?? a.id ?? 0)
      ),
    [items]
  );

  const groups = useMemo(() => {
    const out: { key: string; label: string; entries: InvoiceConversationData[] }[] = [];
    for (const e of sorted) {
      const key = parseStamp(e.CREATED_DATE)?.day ?? "";
      const last = out[out.length - 1];
      if (last && last.key === key) last.entries.push(e);
      else out.push({ key, label: dayLabel(key), entries: [e] });
    }
    return out;
  }, [sorted]);

  const lastActivity = sorted[0]?.CREATED_DATE;
  const discussionLength = String(form.DISCUSSION_DETAILS ?? "").length;

  if (!refNo) {
    return (
      <div className={cn("rounded-lg border border-dashed bg-muted/20 p-8 text-center", className)}>
        <MessageSquare className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">Save the invoice first</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          A conversation belongs to a saved purchase invoice. Save this invoice and its
          reference number will appear here.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex h-full min-h-0 flex-1 flex-col overflow-hidden", className)}>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="space-y-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2 pt-1">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No conversation yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{emptyHint}</p>
            </div>
          ) : (
            groups.map((g, gi) => (
              <div key={g.key || gi} className="mb-2">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {g.label}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                {g.entries.map((item, ei) => {
                  const id = String(item.CONVERSATION_ID ?? item.id);
                  const name = item.RESPONSE_EMP_NAME?.trim() ||
                    (item.RESPONSE_EMP_ID ? `Employee #${item.RESPONSE_EMP_ID}` : "");
                  const who = name || item.CREATED_BY || "Unknown";
                  const text = String(item.DISCUSSION_DETAILS ?? "");
                  const isLong = text.length > COLLAPSE_AT;
                  const isOpen = !!expanded[id];
                  const shown = isLong && !isOpen ? text.slice(0, COLLAPSE_AT) : text;
                  const edited = !!item.MODIFIED_DATE && !!parseStamp(item.MODIFIED_DATE);
                  const isLast = gi === groups.length - 1 && ei === g.entries.length - 1;

                  return (
                    <div key={id} className="group relative flex gap-4 pb-6">
                      {!isLast && (
                        <span aria-hidden className="absolute left-5 top-11 bottom-0 w-px bg-border" />
                      )}
                      <div
                        className={cn(
                          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                          name
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "border-border bg-muted text-muted-foreground"
                        )}
                      >
                        {name ? initials(who) : <User className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold">{who}</span>
                          {item.RESPONSE_STATUS && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-2 py-0 text-[11px] font-semibold uppercase",
                                responseBadgeClass(item.RESPONSE_STATUS)
                              )}
                            >
                              {item.RESPONSE_STATUS}
                            </Badge>
                          )}
                          {item.STATUS_ENTRY && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-2 py-0 text-[11px] font-semibold uppercase",
                                entryBadgeClass(item.STATUS_ENTRY)
                              )}
                            >
                              {item.STATUS_ENTRY}
                            </Badge>
                          )}
                          <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {stampLine(item.CREATED_DATE)}
                          </span>
                        </div>

                        {text && (
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
                            {shown}
                            {isLong && (
                              <>
                                {!isOpen && "…"}
                                {" "}
                                <button
                                  type="button"
                                  className="font-medium text-primary underline-offset-2 hover:underline"
                                  onClick={() => setExpanded((p) => ({ ...p, [id]: !isOpen }))}
                                >
                                  {isOpen ? "Show less" : `Show all ${text.length} characters`}
                                </button>
                              </>
                            )}
                          </p>
                        )}

                        {item.REMARKS && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            <span className="font-medium">Remarks:</span> {item.REMARKS}
                          </p>
                        )}

                        <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                          <Button
                            variant="ghost" size="sm" className="h-7 w-7 p-0"
                            title="Edit this entry" aria-label="Edit this entry"
                            onClick={() => startEdit(item)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          {canDelete ? (
                            <Button
                              variant="ghost" size="sm"
                              className="h-7 w-7 p-0 text-destructive"
                              title="Delete this entry" aria-label="Delete this entry"
                              onClick={() => setDeleteTarget(item)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex h-7 w-7 items-center justify-center" tabIndex={0}>
                                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground/40" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {!isAdmin
                                  ? "Only Admin can delete a conversation entry"
                                  : "This invoice is submitted, so its conversation is locked"}
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {edited && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              edited by {item.MODIFIED_BY || "unknown"}{" "}
                              {stampLine(item.MODIFIED_DATE)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="border-t bg-background px-6 py-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">{editing ? "Edit response" : "Add response"}</h3>
              <p className="text-xs text-muted-foreground">
                {editing ? "Update the selected entry" : "Discussion is required. Everything else is optional."}
              </p>
            </div>
            {editing && (
              <Button
                variant="ghost" size="sm" className="h-7 w-7 p-0"
                title="Cancel editing" aria-label="Cancel editing"
                onClick={cancelEdit}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="piConvEmp">Response Employee</Label>
              <EmployeeCombobox
                value={form.RESPONSE_EMP_ID}
                onChange={(v) => setField("RESPONSE_EMP_ID", v)}
                options={employees}
              />
              {employeesFailed && (
                <p className="text-xs text-destructive">
                  The employee list could not be loaded. Leave blank to record this against nobody.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="piConvStatus">Response Status</Label>
              <StatusCombobox
                id="piConvStatus"
                value={String(form.RESPONSE_STATUS ?? "")}
                onChange={(v) => setField("RESPONSE_STATUS", v)}
                options={statusOptions}
              />
              {errors.RESPONSE_STATUS && (
                <p className="text-xs text-destructive">{errors.RESPONSE_STATUS}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Status Entry</Label>
              <Select
                value={form.STATUS_ENTRY || "CF"}
                onValueChange={(v) => setField("STATUS_ENTRY", v)}
              >
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENTRY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="piConvRemarks">Remarks</Label>
              <Input
                id="piConvRemarks"
                className="h-9 text-sm" value={form.REMARKS} maxLength={MAX_REMARK}
                onChange={(e) => setField("REMARKS", e.target.value)} placeholder="Optional"
              />
              {errors.REMARKS && (
                <p className="text-xs text-destructive">{errors.REMARKS}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs" htmlFor={discussionId}>
                  Discussion Details <span className="text-destructive">*</span>
                </Label>
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    discussionLength >= MAX_DISCUSSION
                      ? "font-medium text-destructive"
                      : discussionLength >= MAX_DISCUSSION * 0.9
                        ? "font-medium text-amber-600"
                        : "text-muted-foreground"
                  )}
                >
                  {discussionLength}/{MAX_DISCUSSION}
                </span>
              </div>
              <Textarea
                id={discussionId}
                className="min-h-[88px] text-sm leading-relaxed"
                value={form.DISCUSSION_DETAILS}
                maxLength={MAX_DISCUSSION}
                onChange={(e) => setField("DISCUSSION_DETAILS", e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                placeholder="What needs to be discussed or confirmed?"
                aria-invalid={!!errors.DISCUSSION_DETAILS}
              />
              {errors.DISCUSSION_DETAILS && (
                <p className="text-xs text-destructive">{errors.DISCUSSION_DETAILS}</p>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            {editing && (
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={cancelEdit}>
                Cancel
              </Button>
            )}
            <Button size="sm" className="h-8 text-xs" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              {editing ? "Save changes" : "Add response"}
            </Button>
          </div>
        </div>

        {(lastActivity || sorted.length > 0) && (
          <p className="shrink-0 border-t bg-background px-4 py-2 text-xs text-muted-foreground">
            {sorted.length} {sorted.length === 1 ? "entry" : "entries"}
            {lastActivity ? ` · last activity ${stampLine(lastActivity)}` : ""}
          </p>
        )}
      </div>

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
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
