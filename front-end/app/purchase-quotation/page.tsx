"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Search, Pencil, Trash2, Loader2, FileText, MessageSquare, Send } from "lucide-react";
import ConversationDialog from "./conversation-dialog";
import QuotationReview from "./quotation-review";
import WizardShell from "@/components/wizard/WizardShell";
import WizardSection from "@/components/wizard/WizardSection";
import DetailLineCard from "@/components/wizard/DetailLineCard";
import {
  HDR_STEP,
  DTL_STEP,
  REVIEW_STEP,
  lineStepKey,
  SECTION_ORDER,
  type FieldGroup,
  type StepErrors,
} from "@/components/wizard/types";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchPurchaseQuotations,
  addPurchaseQuotation,
  updatePurchaseQuotation,
  deletePurchaseQuotationHdr,
  submitPurchaseQuotation,
  fetchPurchaseQuotationHdr,
  fetchPurchaseQuotationDtls,
  clearPurchaseQuotationMasterError,
  PurchaseQuotationGridData,
} from "@/lib/purchaseQuotationMasterSlice";
import {
  fetchPurchaseRequestHdr,
  fetchPurchaseRequestDtls,
} from "@/lib/purchaseRequestMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { formatDate, clampNonNegative } from "@/lib/validation";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

/* Status Entry is owned by the workflow, not the user: CF (Pending for
   Submitted) until the row is submitted, then CL (Submitted). It is displayed
   as a read-only label so nobody can hand-pick a value that contradicts the
   quotation's real state.

   Exactly two states are possible here. Anything that is not CL - including a
   blank or a legacy value from before the codes were normalised - is still on
   its way to approval, so it reads as Pending for Submitted rather than leaking
   a raw code into the UI. Detail lines keep their own Active/Inactive status
   separately. The stored codes stay CF/CL; only this display text is longer. */
const entryLabel = (s: any) => {
  const v = String(s ?? "").trim().toUpperCase();
  return v === "CL" || v === "SUBMITTED" ? "Submitted" : "Pending for Submitted";
};

const entryBadgeClass = (s: any) => {
  const v = String(s ?? "").trim().toUpperCase();
  return v === "CL" || v === "SUBMITTED"
    ? "bg-green-500/10 text-green-600 border-green-200"
    : "bg-amber-500/10 text-amber-700 border-amber-200";
};

const finalLabel = (s: any) => {
  const v = String(s).toUpperCase();
  if (v === "APPROVED" || v === "APPROVAL") return "Approved";
  if (v === "REJECTED" || v === "REJECT") return "Rejected";
  if (v === "HOLD") return "Hold";
  return "Pending";
};

const finalBadgeClass = (s: any) => {
  const v = String(s).toUpperCase();
  if (v === "APPROVED" || v === "APPROVAL") return "bg-green-500/10 text-green-600 border-green-200";
  if (v === "REJECTED" || v === "REJECT") return "bg-red-500/10 text-red-600 border-red-200";
  if (v === "HOLD") return "bg-orange-500/10 text-orange-600 border-orange-200";
  return "bg-blue-500/10 text-blue-600 border-blue-200";
};

/* The DB returns dates in several shapes: ISO strings, JS Dates, and SQL Server's
   "dd-mm-yyyy hh:mm:ss.fff". `new Date("26-09-2026 ...")` is invalid in every browser,
   so the SQL shape is matched explicitly and read as local calendar parts. */

const fmtDate = (d: any) => {
  if (!d) return "";
  if (d instanceof Date) {
    if (isNaN(d.getTime())) return "";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
  if (typeof d === "string") {
    const sql = d.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
    if (sql) return `${sql[3]}-${sql[2].padStart(2, "0")}-${sql[1].padStart(2, "0")}`;
  }
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
};

const r3 = (n: number) => Math.round(n * 1000) / 1000;

const toNum = (v: any): number => {
  if (v === "" || v === null || v === undefined) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

/* ------------------------------------------------ line level calculations */
const calcLine = (row: any, headerRate: any) => {
  const qty = toNum(row.TOTAL_QUANTITY);
  const rate = toNum(row.RATE);
  const discPct = toNum(row.DISCOUNT_PERCENTAGE);
  const taxPct = toNum(row.TAX_PERCENTAGE);
  const pcs = toNum(row.NO_OF_PCS_PER_PACKING);

  const exRate = toNum(headerRate) > 0 ? toNum(headerRate) : toNum(row.EXCHANGE_RATE);

  const subFc = r3(qty * rate);
  const discFc = r3((subFc * discPct) / 100);
  const prodFc = r3(subFc - discFc);
  const taxFc = r3((prodFc * taxPct) / 100);
  const finalFc = r3(prodFc + taxFc);

  const subLc = r3(subFc * exRate);
  const discLc = r3(discFc * exRate);
  const taxLc = r3(taxFc * exRate);
  /* Per the DTL DDL every LC column is "FC x EXCHANGE_RATE". */
  const prodLc = r3(prodFc * exRate);
  const finalLc = r3(finalFc * exRate);

  return {
    EXCHANGE_RATE: exRate,
    TOTAL_PACKING: pcs > 0 ? r3(qty / pcs) : "",
    SUB_TOTAL_AMOUNT_FC: subFc,
    DISCOUNT_AMOUNT_FC: discFc,
    TOTAL_PRODUCT_AMOUNT_FC: prodFc,
    TAX_AMOUNT_FC: taxFc,
    FINAL_AMOUNT_FC: finalFc,
    SUB_TOTAL_AMOUNT_LC: subLc,
    DISCOUNT_AMOUNT_LC: discLc,
    TOTAL_PRODUCT_AMOUNT_LC: prodLc,
    TAX_AMOUNT_LC: taxLc,
    FINAL_AMOUNT_LC: finalLc,
  };
};

/* ----------------------------------------------- header level roll-ups ---------*/
const rollup = (rows: any[]) => {
  const s = (k: string) => r3(rows.reduce((a, r) => a + toNum(r[k]), 0));
  /* The distinct positive rates the LC columns were built from. Normally one
     rate for the whole quotation, but a line can carry its own, so keep the
     whole set rather than letting the first row stand in for all of them. */
  const rates = Array.from(new Set(rows.map((r) => toNum(r.EXCHANGE_RATE)).filter((n) => n > 0)));
  return {
    EXCHANGE_RATE: rates.length === 1 ? rates[0] : 0,
    EXCHANGE_RATE_VALUES: rates,
    TOTAL_SUB_TOTAL_HDR_AMOUNT_FC: s("SUB_TOTAL_AMOUNT_FC"),
    TOTAL_DISCOUNT_HDR_AMOUNT_FC: s("DISCOUNT_AMOUNT_FC"),
    TOTAL_PRODUCT_HDR_AMOUNT_FC: s("TOTAL_PRODUCT_AMOUNT_FC"),
    TOTAL_VAT_HDR_AMOUNT_FC: s("TAX_AMOUNT_FC"),
    FINAL_PRODUCT_HDR_AMOUNT_FC: s("FINAL_AMOUNT_FC"),
    TOTAL_SUB_TOTAL_HDR_AMOUNT_LC: s("SUB_TOTAL_AMOUNT_LC"),
    TOTAL_DISCOUNT_HDR_AMOUNT_LC: s("DISCOUNT_AMOUNT_LC"),
    TOTAL_PRODUCT_HDR_AMOUNT_LC: s("TOTAL_PRODUCT_AMOUNT_LC"),
    TOTAL_TAX_HDR_AMOUNT_LC: s("TAX_AMOUNT_LC"),
    FINAL_PRODUCT_HDR_AMOUNT_LC: s("FINAL_AMOUNT_LC"),
  };
};

const money = (v: any) => (toNum(v) === 0 ? "-" : toNum(v).toFixed(3));

/* EXCHANGE_RATE is DECIMAL(15,6) and the header field carries six decimals, so
   the rate must print with six too - money()'s three would misreport a rate
   like 83.512345 as 83.512, and LC amounts are derived from the full value. */
const rate6 = (v: any) => (toNum(v) > 0 ? toNum(v).toFixed(6) : "-");

/* A tax master row's percentage as the string the line keeps. Empty means "no
   usable rate" - never coerce that to 0, or a blank tax would price as free. */
const taxPct = (t: any) =>
  t && t.TAX_PERCENTAGE != null && t.TAX_PERCENTAGE !== "" ? String(t.TAX_PERCENTAGE) : "";

export default function PurchaseQuotationPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.purchaseQuotationMaster);
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [finalStatusFilter, setFinalStatusFilter] = useState<string>("ALL");
  const [statusEntryFilter, setStatusEntryFilter] = useState<string>("ALL");
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseQuotationGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [stepErrors, setStepErrors] = useState<StepErrors>({});
  const [lineErrors, setLineErrors] = useState<StepErrors>({});
  /* line key -> form field keys that failed, so the card can ring the input. */
  const [lineFieldErrors, setLineFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submittingRef, setSubmittingRef] = useState<string | null>(null);
  const [conversationFor, setConversationFor] = useState<string | null>(null);
  const [dtls, setDtls] = useState<any[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [reqNo, setReqNo] = useState<string>("");
  const [loadingReq, setLoadingReq] = useState(false);

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

  const fetchList = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Request failed");
    const json = await res.json();
    return json.data || [];
  };

  const { data: companies } = useApiQuery("pq-master-companies", () => fetchList(`${API_URL}/company-master`));
  const { data: branches } = useApiQuery("pq-master-branches", () => fetchList(`${API_URL}/branch-master?status=AC`));
  const { data: stores } = useApiQuery("pq-master-stores", () => fetchList(`${API_URL}/store-master`));
const { data: camps } = useApiQuery("pq-master-camps", () => fetchList(`${API_URL}/camp-master`));
  const { data: locations } = useApiQuery("pq-master-locations", () => fetchList(`${API_URL}/location-master`));
  const { data: suppliers } = useApiQuery("pq-master-suppliers", () => fetchList(`${API_URL}/business-partner-master?status=AC`));
  const { data: paymentTerms } = useApiQuery("pq-master-payment-terms", () => fetchList(`${API_URL}/payment-term-master`));
  const { data: paymentModes } = useApiQuery("pq-master-payment-modes", () => fetchList(`${API_URL}/payment-mode-master`));
  const { data: shipmentModes } = useApiQuery("pq-master-shipment-modes", () => fetchList(`${API_URL}/shipment-mode-master/load`));
  const { data: taxes } = useApiQuery("pq-master-taxes", () => fetchList(`${API_URL}/tax-master`));
  const { data: currencies } = useApiQuery("pq-master-currencies", () => fetchList(`${API_URL}/currency-master`));
  const { data: quoteStatuses } = useApiQuery("pq-master-quote-statuses", () => fetchList(`${API_URL}/status-master/load?includeInactive=false`));
  /* Only submitted requests may be quoted, so a draft cannot be priced by accident.

     This filters on STATUS_ENTRY = 'CL' rather than on final approval.
     FINAL_RESPONSE_STATUS can never become 'APPROVED' for a Purchase Request:
     the proc that writes it, UPDATE_APPROVAL_STATUS_PURCHASE_REQUEST, has no
     caller, and the approval screen's UPDATE_REQUEST_STATUS rejects 'Purchase
     Request' as an invalid type. Gating on final approval therefore matched
     nothing and left this dropdown permanently empty.

     A request rejected at the final level is still STATUS_ENTRY = 'CL', so it
     would still be offered here. Rejection is filtered client-side below, and
     the same rule is re-checked on save. */
  const { data: prOptions } = useApiQuery("pq-master-purchase-requests", () =>
    fetchList(`${API_URL}/purchase-request/load?statusEntry=CL&includeInactive=false`)
  );

  /* A new line defaults to the first tax in the master (VAT STANDARD) so the
     percentage is never blank and the line is ready to price. The master loads
     asynchronously, so a line added before it arrives is queued here and stamped
     once the list turns up. Only queued lines are ever touched, and never one
     where the user has already picked a tax or saved a quotation with no tax. */
  const pendingTaxDefaults = useRef<Set<string>>(new Set());

  useEffect(() => {
    const list = Array.isArray(taxes) ? taxes : [];
    const def = list[0];
    if (!def || def.TAX_ID == null || pendingTaxDefaults.current.size === 0) return;
    /* Take the set and clear the ref before touching state. Mutating the ref
       inside the updater would make StrictMode's double-invoke return the
       original rows on the second pass and drop the default. */
    const ids = pendingTaxDefaults.current;
    pendingTaxDefaults.current = new Set();
    setDtls((prev) => prev.map((r: any) =>
      ids.has(r.key) && r.TAX_ID == null
        ? { ...r, TAX_ID: Number(def.TAX_ID), TAX_NAME: def.TAX_NAME || "", TAX_PERCENTAGE: taxPct(def) }
        : r
    ));
  }, [taxes]);

  /* The master SPs do not agree on column naming: SHOW_STORE_MASTER returns
     "Store_Id"/"Store_Name" and LOAD_SHIPMENT_MODE_MASTER returns
     "shipmentModeId"/"shipmentModeName", so neither a plain SNAKE_CASE nor a
     case-only lookup resolves them. Keys are therefore compared with separators
     removed, which matches SNAKE_CASE, PascalCase and camelCase alike.
     The shared store-master screen depends on the PascalCase aliases, so the SPs
     are left as-is (same tolerant approach as the shipment-mode-master page). */
  const pickVal = (src: any, key: string) => {
    if (!src) return "";
    if (src[key] !== undefined && src[key] !== null) return src[key];
    const norm = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "");
    const want = norm(key);
    const hit = Object.keys(src).find((k) => norm(k) === want);
    return hit !== undefined ? src[hit] : "";
  };

  const opt = (rows: any[] | undefined, valueKey: string, labelKey: string) =>
    (Array.isArray(rows) ? rows : []).map((r: any) => ({
      value: String(pickVal(r, valueKey) ?? ""),
      label: String(pickVal(r, labelKey) ?? ""),
    })).filter((o) => o.value && o.label);

  const companyOptions = useMemo(() => opt(companies, "COMPANY_ID", "COMPANY_NAME"), [companies]);
  const branchOptions = useMemo(() => opt(branches, "BRANCH_ID", "BRANCH_NAME"), [branches]);
  const storeOptions = useMemo(() => opt(stores, "STORE_ID", "STORE_NAME"), [stores]);

  /* Camp and Request Store travel on the quotation detail line as bare ids picked
     from the purchase-request header, so the readable names are resolved here from
     the same masters the header dropdowns use. */
  const nameMap = (rows: any[] | undefined, idKey: string, nameKey: string) => {
    const m = new Map<string, string>();
    (Array.isArray(rows) ? rows : []).forEach((r: any) => {
      const id = pickVal(r, idKey);
      const name = pickVal(r, nameKey);
      if (id !== "" && id != null && name) m.set(String(id), String(name));
    });
    return m;
  };
  const campNameMap = useMemo(() => nameMap(camps, "CAMP_ID", "CAMP_NAME"), [camps]);
  const storeNameMap = useMemo(() => nameMap(stores, "STORE_ID", "STORE_NAME"), [stores]);

  const locationOptions = useMemo(() => opt(locations, "LOCATION_ID", "LOCATION_NAME"), [locations]);
  const paymentTermOptions = useMemo(() => opt(paymentTerms, "PAYMENT_TERM_ID", "PAYMENT_TERM_NAME"), [paymentTerms]);
  const paymentModeOptions = useMemo(() => opt(paymentModes, "PAYMENT_MODE_ID", "PAYMENT_MODE_NAME"), [paymentModes]);
  const shipmentModeOptions = useMemo(() => opt(shipmentModes, "SHIPMENT_MODE_ID", "SHIPMENT_MODE_NAME"), [shipmentModes]);
  const taxOptions = useMemo(() => opt(taxes, "TAX_ID", "TAX_NAME"), [taxes]);
  const currencyOptions = useMemo(() => opt(currencies, "CURRENCY_ID", "CURRENCY_NAME"), [currencies]);
  const quoteStatusOptions = useMemo(
    () =>
      (Array.isArray(quoteStatuses) ? quoteStatuses : []).map((s: any) => ({
        value: String(s.statusId ?? s.STATUS_ID ?? ""),
        label: s.displayText || s.statusName || s.STATUS_NAME || "",
      })).filter((o: any) => o.value),
    [quoteStatuses]
  );

  /* The quotation status is decided by the workflow, not picked by hand: a new
     quotation starts at DRAFT, and the row's Submit action moves it to PENDING
     APPROVAL. Ids are resolved from the master by STATUS_CODE so no numeric id
     is hard-coded. */
  const statusIdFor = (code: string) =>
    String(
      (Array.isArray(quoteStatuses) ? quoteStatuses : []).find(
        (s: any) => String(s.statusCode ?? s.STATUS_CODE ?? "") === code
      )?.statusId ?? ""
    );
  const draftStatusId = statusIdFor("DRAFT");
  const pendingStatusId = statusIdFor("PENDING_APPROVAL");
  /* Submit from the table is blocked until both statuses can be resolved. */
  const missingStatusMaster = quoteStatusOptions.length === 0 || !draftStatusId || !pendingStatusId;

  /* only supplier-type business partners can be quoted to */
  const supplierOptions = useMemo(
    () =>
      (Array.isArray(suppliers) ? suppliers : [])
        .filter((r: any) => String(r.BP_TYPE ?? "").trim().toLowerCase() === "supplier")
        .map((r: any) => ({ value: String(r.BP_ID ?? ""), label: String(r.BP_NAME ?? "") }))
        .filter((o: any) => o.value && o.label),
    [suppliers]
  );

/* How many lines this quotation has taken from each request, keyed by request
     number. Counted from the detail rows themselves so it stays correct when a
     line is removed again - the request then goes back into the dropdown. */
  const importedCountByRequest = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of dtls as any[]) {
      const no = String(r.PURCHASE_REQUEST_NO ?? "").trim();
      if (!no) continue;
      counts.set(no, (counts.get(no) ?? 0) + 1);
    }
    return counts;
  }, [dtls]);

  /* A request drops out of the dropdown once every one of its lines is already
     on this quotation: there is nothing left to take from it, and picking it
     again only produced an "already added" refusal.

     Comparing against the request's own detailLineCount is what makes this
     exact. Counting the imported rows alone cannot tell a fully quoted request
     from a partly used one, so a request whose lines were pulled in two goes
     would still be offered even with nothing left to add.

     detailLineCount is only present on rows loaded after the column was added,
     so a missing value means "unknown" and the request is left in the list
     rather than wrongly hidden. A request with no lines keeps a count of 0 and
     stays listed, so selecting it still reports that it has no detail lines. */
  const isFullyImported = (r: any) => {
    const no = String(r.purchaseRequestNo ?? "").trim();
    if (!no) return false;
    const total = Number(r.detailLineCount);
    if (!Number.isFinite(total) || total <= 0) return false;
    return (importedCountByRequest.get(no) ?? 0) >= total;
  };

/* True only when there really were eligible requests and the only reason the
     list is empty is that all of them are already on this quotation. This keeps
     the empty-list message honest: a list emptied by the rejected/approved
     filter, or by the request not having arrived yet, is a different thing. */
  const allRequestsFullyImported = useMemo(() => {
    const eligible = (Array.isArray(prOptions) ? prOptions : []).filter(
      (r: any) => !/reject/i.test(String(r.finalResponseStatus ?? ""))
    );
    return eligible.length > 0 && eligible.every((r: any) => isFullyImported(r));
  }, [prOptions, importedCountByRequest]);

  /* Rejected requests are hidden here as well as by STATUS_ENTRY, because a
   rejection leaves the entry at 'CL' and would otherwise still be quotable. */
const requestOptions = useMemo(
    () =>
      (Array.isArray(prOptions) ? prOptions : [])
        .filter((r: any) => !/reject/i.test(String(r.finalResponseStatus ?? "")))
        .filter((r: any) => !isFullyImported(r))
        .map((r: any) => ({
        value: String(r.purchaseRequestNo ?? ""),
        label: r.displayText || r.purchaseRequestNo || "",
      }))
        .filter((o: any) => o.value),
    [prOptions, importedCountByRequest]
  );

  const uniqueFinalStatuses = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const set = new Set<string>();
    items.forEach((d: any) => { if (d.finalResponseStatus) set.add(String(d.finalResponseStatus)); });
    return Array.from(set);
  }, [items]);

  const uniqueStatusEntries = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const set = new Set<string>();
    items.forEach((d: any) => { if (d.statusEntry) set.add(String(d.statusEntry)); });
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((d: any) => {
      const matchesFinal = finalStatusFilter === "ALL" || String(d.finalResponseStatus) === finalStatusFilter;
      const matchesEntry = statusEntryFilter === "ALL" || String(d.statusEntry) === statusEntryFilter;
      if (!matchesFinal || !matchesEntry) return false;
      const searchable = [
        d.purchaseQuotationNo,
        d.supplierName,
        d.supplierQuotationNo,
        d.companyName,
        d.branchName,
        d.poStoreName,
        d.shipmentModeName,
        d.quotationStatusName,
      ].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => ((b.sno || 0) - (a.sno || 0)));
  }, [items, search, finalStatusFilter, statusEntryFilter]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;
  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);
  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  /* derived per-line values, kept in sync with the header exchange rate */
  const computed = useMemo(
    () => dtls.map((r: any) => ({ ...r, ...calcLine(r, form.EXCHANGE_RATE) })),
    [dtls, form.EXCHANGE_RATE]
  );
  const totals = useMemo(() => rollup(computed), [computed]);

  useEffect(() => {
    dispatch(fetchPurchaseQuotations({}));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearPurchaseQuotationMasterError());
    }
  }, [error, dispatch, toast]);

  const newKey = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random();

  const emptyForm = () => ({
    PURCHASE_QUOTATION_DATE: fmtDate(new Date()),
    COMPANY_ID: "",
    SUPPLIER_BP_ID: "",
    BRANCH_ID: "",
    PO_STORE_ID: "",
    SUPPLIER_QUOTATION_NO: "",
    SUPPLIER_QUOTATION_DATE: "",
    VALID_FROM_DATE: "",
    VALID_TO_DATE: "",
    PAYMENT_TERM_ID: "",
    PAYMENT_MODE_ID: "",
    SHIPMENT_MODE_ID: "",
    DELIVERY_DATE: "",
    DELIVERY_TERM: "",
    DELIVERY_LOCATION_ID: "",
    CURRENCY_ID: "",
    EXCHANGE_RATE: "",
    QUOTATION_STATUS_ID: "",
    SHIPMENT_REMARKS: "",
    REMARKS: "",
    STATUS_ENTRY: "CF",
  });

  const updateForm = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  /* A new quotation starts as DRAFT. The master loads asynchronously, so the
     default is applied once the id is known rather than baked into the initial
     state. Editing an existing record never re-stamps its status. */
  useEffect(() => {
    if (editing) return;
    if (!draftStatusId) return;
    if (form.QUOTATION_STATUS_ID) return;
    setForm((prev) => (prev.QUOTATION_STATUS_ID ? prev : { ...prev, QUOTATION_STATUS_ID: draftStatusId }));
  }, [draftStatusId, editing, form.QUOTATION_STATUS_ID]);

  /* SHOW_CURRENCY_MASTER returns the rate as "Exchange_Rate" (mixed case), so both
     spellings are accepted before falling back to the rate the user already typed. */
  const handleCurrencyChange = (value: string) => {
    const cur = (Array.isArray(currencies) ? currencies : []).find(
      (c: any) => String(c.CURRENCY_ID) === String(value)
    );
    const rate = cur?.EXCHANGE_RATE ?? cur?.Exchange_Rate;
    setForm((prev) => ({
      ...prev,
      CURRENCY_ID: value,
      EXCHANGE_RATE:
        rate !== undefined && rate !== null && rate !== "" ? String(rate) : prev.EXCHANGE_RATE,
    }));
  };

  const updateDtl = (key: string, field: string, value: any) => {
    setDtls((prev) => prev.map((r) => {
      if (r.key !== key) return r;
      if (field === "TAX_ID") {
        const t = (Array.isArray(taxes) ? taxes : []).find((x: any) => String(x.TAX_ID) === String(value));
        return { ...r, TAX_ID: value, TAX_NAME: t?.TAX_NAME, TAX_PERCENTAGE: taxPct(t) };
      }
      if (field === "REQUIRED_DATE") {
        return { ...r, REQUIRED_DATE: value || form.DELIVERY_DATE || "" };
      }
      return { ...r, [field]: value };
    }));
  };

  /* Line numbers are always the row's position, so pulling a request twice or
     removing a line never leaves a gap behind. */
  const renumberDtls = (rows: any[]) => rows.map((r, i) => ({ ...r, LINE_NO: i + 1 }));

  const removeDtl = (key: string) => {
    const row = dtls.find((r) => r.key === key);
    if (row?.PURCHASE_QUOTATION_DTL_ID) {
      setDeletedIds((d) => [...d, Number(row.PURCHASE_QUOTATION_DTL_ID)]);
    }
    setDtls((prev) => renumberDtls(prev.filter((r) => r.key !== key)));
  };

  /* Pull the purchase request header (for camp / request store) and its
     lines, then append one quotation line per request line. */
  const addLinesFromRequest = async () => {
    if (!reqNo) {
      toast({ title: "Please select a Purchase Request", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setLoadingReq(true);
    try {
      const prHdr: any = await dispatch(fetchPurchaseRequestHdr(reqNo)).unwrap();
      const prLines: any[] = await dispatch(fetchPurchaseRequestDtls(reqNo)).unwrap();

      const campId = prHdr?.CAMP_ID ?? null;
      const reqStoreId = prHdr?.REQUEST_STORE_ID ?? null;

      let added = 0;
      let skipped = 0;
      const newRows: any[] = [];

      /* New lines start on the first tax in the master. If the master has not
         arrived yet, leave the tax off and queue the key so the effect above
         stamps it in as soon as the list does. */
      const defTax = (Array.isArray(taxes) ? taxes : [])[0];
      const hasDef = !!(defTax && defTax.TAX_ID != null);
      const queuedForTax: string[] = [];
      for (const p of prLines) {
        const prDtlId = p.ID ?? p.PURCHASE_REQUEST_DTL_ID;
        if (
          prDtlId != null &&
          dtls.some((r: any) => String(r.PURCHASE_REQUEST_DTL_ID) === String(prDtlId))
        ) {
          skipped += 1;
          continue;
        }
        const rowKey = newKey();
        if (!hasDef) queuedForTax.push(rowKey);
        newRows.push({
          key: rowKey,
          PURCHASE_QUOTATION_DTL_ID: undefined,
          PURCHASE_REQUEST_NO: reqNo,
          PURCHASE_REQUEST_DTL_ID: prDtlId != null ? Number(prDtlId) : undefined,
          CAMP_ID: campId,
          CAMP_NAME: campId != null ? (campNameMap.get(String(campId)) ?? "") : "",
          REQUEST_STORE_ID: reqStoreId,
          REQUEST_STORE_NAME: reqStoreId != null ? (storeNameMap.get(String(reqStoreId)) ?? "") : "",
          REFERENCE_TYPE_ID: p.REFERENCE_TYPE_ID != null ? Number(p.REFERENCE_TYPE_ID) : undefined,
          REFERENCE_TYPE_NAME: p.REFERENCE_TYPE_NAME || "",
          /* The reference belongs to the request line, not to whoever quotes it.
             Take the request's own ref no, and fall back to the request number so a
             line always traces back to where it came from - the request's ref no is
             optional and in practice usually blank. The backend re-derives this the
             same way, so a hand-crafted request body cannot change it. */
          REFERENCE_NO: (p.REFERENCE_NO || "").trim() || reqNo,
          LINE_NO: 0,
          SOURCE_LINE_NO: p.LINE_NO != null ? Number(p.LINE_NO) : undefined,
          MAIN_CATEGORY_ID: p.MAIN_CATEGORY_ID != null ? Number(p.MAIN_CATEGORY_ID) : undefined,
          MAIN_CATEGORY_NAME: p.MAIN_CATEGORY_NAME || "",
          SUB_CATEGORY_ID: p.SUB_CATEGORY_ID != null ? Number(p.SUB_CATEGORY_ID) : undefined,
          SUB_CATEGORY_NAME: p.SUB_CATEGORY_NAME || "",
          PRODUCT_ID: p.PRODUCT_ID != null ? Number(p.PRODUCT_ID) : undefined,
          PRODUCT_NAME: p.PRODUCT_NAME || "",
          NO_OF_PCS_PER_PACKING: p.NO_OF_PCS_PER_PACKING ?? "",
          TOTAL_QUANTITY: p.Total_Quantity ?? "",
          UOM_ID: p.UOM_ID != null ? Number(p.UOM_ID) : undefined,
          UOM_NAME: p.UOM_NAME || "",
          ALT_UOM_ID: p.ALT_UOM_ID != null ? Number(p.ALT_UOM_ID) : undefined,
          TOTAL_QUANTITY_SRC: p.Total_Quantity ?? "",
          RATE: "",
          DISCOUNT_PERCENTAGE: "",
          TAX_ID: hasDef ? Number(defTax.TAX_ID) : undefined,
          TAX_NAME: hasDef ? defTax.TAX_NAME || "" : "",
          TAX_PERCENTAGE: hasDef ? taxPct(defTax) : "",
          REQUIRED_DATE: fmtDate(p.REQUIRED_DATE) || form.DELIVERY_DATE || "",
          REASON: p.REASON || "",
          REMARKS: "",
          STATUS_ENTRY: "AC",
        });
      }

      /* append, then renumber the whole detail list from 1 */
      setDtls((prev) => renumberDtls([...prev, ...newRows]));
      if (queuedForTax.length) {
        pendingTaxDefaults.current = new Set([...pendingTaxDefaults.current, ...queuedForTax]);
      }

      added = newRows.length;
      if (!added) {
        toast({
          /* "added", not "quoted": the dedupe only knows about this quotation, so
             naming it "quoted" would overstate what was checked. */
          title: skipped > 0
            ? "All lines of this Purchase Request are already added to this quotation"
            : "This Purchase Request has no detail lines",
          variant: "destructive",
          duration: DEFAULT_TOAST_DURATION,
        });
      } else {
        toast({
          title: `${added} line(s) added from ${reqNo}${skipped ? ` - ${skipped} already added` : ""}`,
          duration: DEFAULT_TOAST_DURATION,
        });
        /* Every remaining line of this request is now on the quotation, so it
           drops out of the dropdown. Clearing the selection keeps the trigger
           from holding a value the list no longer offers: left in place it would
           show blank while the Add button stayed enabled, and pressing it again
           would only repeat the "already added" refusal. */
        setReqNo("");
      }
    } catch (e: any) {
      toast({
        title: typeof e === "string" ? e : e?.message || "Failed to load purchase request lines",
        variant: "destructive",
        duration: DEFAULT_TOAST_DURATION,
      });
    } finally {
      setLoadingReq(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDtls([]);
    setDeletedIds([]);
    setReqNo("");
    setStepErrors({});
    setLineErrors({});
    setFocusRequest(null);
    setDialogOpen(true);
  };

  const openEdit = async (item: any) => {
    setEditing(item);
    /* The lines of the quotation being opened decide which requests the
       dropdown offers, so the previous selection is meaningless here. */
    setReqNo("");
    try {
      const refNo = item.purchaseQuotationNo ?? item.PURCHASE_QUOTATION_NO;
      const hdr: any = await dispatch(fetchPurchaseQuotationHdr(refNo)).unwrap();
      const toStr = (v: any) => (v == null || v === "" ? "" : String(v));
      setForm({
        PURCHASE_QUOTATION_NO: hdr.PURCHASE_QUOTATION_NO || refNo || "",
        PURCHASE_QUOTATION_DATE: fmtDate(hdr.PURCHASE_QUOTATION_DATE),
        COMPANY_ID: toStr(hdr.COMPANY_ID),
        SUPPLIER_BP_ID: toStr(hdr.SUPPLIER_BP_ID),
        BRANCH_ID: toStr(hdr.BRANCH_ID),
        PO_STORE_ID: toStr(hdr.PO_STORE_ID),
        SUPPLIER_QUOTATION_NO: hdr.SUPPLIER_QUOTATION_NO || "",
        SUPPLIER_QUOTATION_DATE: fmtDate(hdr.SUPPLIER_QUOTATION_DATE),
        VALID_FROM_DATE: fmtDate(hdr.VALID_FROM_DATE),
        VALID_TO_DATE: fmtDate(hdr.VALID_TO_DATE),
        PAYMENT_TERM_ID: toStr(hdr.PAYMENT_TERM_ID),
        PAYMENT_MODE_ID: toStr(hdr.PAYMENT_MODE_ID),
        SHIPMENT_MODE_ID: toStr(hdr.SHIPMENT_MODE_ID),
        DELIVERY_DATE: fmtDate(hdr.DELIVERY_DATE),
        DELIVERY_TERM: hdr.DELIVERY_TERM || "",
        DELIVERY_LOCATION_ID: toStr(hdr.DELIVERY_LOCATION_ID),
        CURRENCY_ID: toStr(hdr.CURRENCY_ID),
        EXCHANGE_RATE: hdr.EXCHANGE_RATE != null ? String(hdr.EXCHANGE_RATE) : "",
        QUOTATION_STATUS_ID: toStr(hdr.QUOTATION_STATUS_ID),
        SHIPMENT_REMARKS: hdr.SHIPMENT_REMARKS || "",
        REMARKS: hdr.REMARKS || "",
        STATUS_ENTRY: hdr.STATUS_ENTRY || "CF",
      });

      const dtlRows: any[] = await dispatch(fetchPurchaseQuotationDtls(refNo)).unwrap();
      const rows = (dtlRows || []).map((d: any) => ({
        key: newKey(),
        PURCHASE_QUOTATION_DTL_ID: d.PURCHASE_QUOTATION_DTL_ID != null ? Number(d.PURCHASE_QUOTATION_DTL_ID) : undefined,
        PURCHASE_REQUEST_NO: d.PURCHASE_REQUEST_NO || "",
        PURCHASE_REQUEST_DTL_ID: d.PURCHASE_REQUEST_DTL_ID != null ? Number(d.PURCHASE_REQUEST_DTL_ID) : undefined,
        CAMP_ID: d.CAMP_ID != null ? Number(d.CAMP_ID) : undefined,
        CAMP_NAME: d.CAMP_NAME || (d.CAMP_ID != null ? (campNameMap.get(String(d.CAMP_ID)) ?? "") : ""),
        REQUEST_STORE_ID: d.REQUEST_STORE_ID != null ? Number(d.REQUEST_STORE_ID) : undefined,
        REQUEST_STORE_NAME: d.REQUEST_STORE_NAME || (d.REQUEST_STORE_ID != null ? (storeNameMap.get(String(d.REQUEST_STORE_ID)) ?? "") : ""),
        REFERENCE_TYPE_ID: d.REFERENCE_TYPE_ID != null ? Number(d.REFERENCE_TYPE_ID) : undefined,
        REFERENCE_TYPE_NAME: d.REFERENCE_TYPE_NAME || "",
        REFERENCE_NO: d.REFERENCE_NO || "",
        LINE_NO: d.LINE_NO != null ? Number(d.LINE_NO) : undefined,
        SOURCE_LINE_NO: undefined,
        MAIN_CATEGORY_ID: d.MAIN_CATEGORY_ID != null ? Number(d.MAIN_CATEGORY_ID) : undefined,
        MAIN_CATEGORY_NAME: d.MAIN_CATEGORY_NAME || "",
        SUB_CATEGORY_ID: d.SUB_CATEGORY_ID != null ? Number(d.SUB_CATEGORY_ID) : undefined,
        SUB_CATEGORY_NAME: d.SUB_CATEGORY_NAME || "",
        PRODUCT_ID: d.PRODUCT_ID != null ? Number(d.PRODUCT_ID) : undefined,
        PRODUCT_NAME: d.PRODUCT_NAME || "",
        NO_OF_PCS_PER_PACKING: d.NO_OF_PCS_PER_PACKING ?? "",
        TOTAL_QUANTITY: d.TOTAL_QUANTITY ?? "",
        UOM_ID: d.UOM_ID != null ? Number(d.UOM_ID) : undefined,
        UOM_NAME: d.UOM_NAME || "",
        ALT_UOM_ID: d.ALT_UOM_ID != null ? Number(d.ALT_UOM_ID) : undefined,
        ALT_UOM_NAME: d.ALT_UOM_NAME || "",
        RATE: d.RATE ?? "",
        DISCOUNT_PERCENTAGE: d.DISCOUNT_PERCENTAGE ?? "",
        TAX_ID: d.TAX_ID != null ? Number(d.TAX_ID) : undefined,
        TAX_NAME: d.TAX_NAME || "",
        TAX_PERCENTAGE: d.TAX_PERCENTAGE ?? "",
        EXCHANGE_RATE: d.EXCHANGE_RATE ?? "",
        REQUIRED_DATE: fmtDate(d.REQUIRED_DATE),
        REASON: d.REASON || "",
        REMARKS: d.REMARKS || "",
        STATUS_ENTRY: d.STATUS_ENTRY || "AC",
      }));
      setDtls(renumberDtls(rows));
      setDeletedIds([]);
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : e?.message || "Failed to load record", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setStepErrors({});
    setLineErrors({});
    setFocusRequest(null);
    setDialogOpen(true);
  };

  /* Save only. The status is never advanced from here: a new quotation is saved
     as DRAFT and the row's Submit action moves it to PENDING FOR APPROVAL. */
  const handleSave = async () => {
    /* One scrolling page, so nothing blocks the way down - every rule is checked
       here and the page scrolls to the first thing that failed. */
    const { stepErrors, lineErrors, invalidFields } = validateQuotation();
    setStepErrors(stepErrors);
    setLineErrors(lineErrors);
    setLineFieldErrors(invalidFields);
    const firstBad = SECTION_ORDER.find((k) => (stepErrors[k]?.length ?? 0) > 0);
    if (firstBad) {
      /* Jump to the first failing line when the detail section is at fault. */
      const firstLine = Object.keys(lineErrors)[0];
      focusOn(firstBad === DTL_STEP && firstLine ? lineStepKey(firstLine) : firstBad);
      /* For line failures show the actual reason on the offending line, not just
         "1 line needs attention", so the cause is visible without scrolling. */
      const detail = firstBad === DTL_STEP && firstLine ? lineErrors[firstLine]?.[0] : undefined;
      toast({ title: detail ?? stepErrors[firstBad][0], variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    setSaving(true);
    try {
      const nOrNull = (v: any) => {
        if (v === "" || v === null || v === undefined) return null;
        const n = Number(v);
        return isNaN(n) ? null : n;
      };
      /* rollup also reports the rate set, but only so the UI can display it. The
         header rate in the payload has to stay the one typed on the form, so keep
         those two display-only fields out of the spread - otherwise a quotation
         whose lines carry differing rates would report EXCHANGE_RATE 0. */
      const { EXCHANGE_RATE: _shownRate, EXCHANGE_RATE_VALUES: _shownRates, ...sums } = rollup(
        dtls.map((r: any) => calcLine(r, form.EXCHANGE_RATE)),
      );
      void _shownRate;
      void _shownRates;

      const payload: Record<string, any> = {
        PURCHASE_QUOTATION_NO: editing
          ? String(editing.purchaseQuotationNo ?? editing.PURCHASE_QUOTATION_NO)
          : "",
        PURCHASE_QUOTATION_DATE: form.PURCHASE_QUOTATION_DATE || null,
        COMPANY_ID: nOrNull(form.COMPANY_ID),
        SUPPLIER_BP_ID: nOrNull(form.SUPPLIER_BP_ID),
        BRANCH_ID: nOrNull(form.BRANCH_ID),
        PO_STORE_ID: nOrNull(form.PO_STORE_ID),
        SUPPLIER_QUOTATION_NO: form.SUPPLIER_QUOTATION_NO?.trim() || null,
        /* No longer an input, but still round-tripped: the update SP overwrites
           every column, so omitting it would null the value on any existing row. */
        SUPPLIER_QUOTATION_DATE: form.SUPPLIER_QUOTATION_DATE || null,
        VALID_FROM_DATE: form.VALID_FROM_DATE || null,
        VALID_TO_DATE: form.VALID_TO_DATE || null,
        PAYMENT_TERM_ID: nOrNull(form.PAYMENT_TERM_ID),
        PAYMENT_MODE_ID: nOrNull(form.PAYMENT_MODE_ID),
        SHIPMENT_MODE_ID: nOrNull(form.SHIPMENT_MODE_ID),
        DELIVERY_DATE: form.DELIVERY_DATE || null,
        DELIVERY_TERM: form.DELIVERY_TERM?.trim() || null,
        SHIPMENT_REMARKS: form.SHIPMENT_REMARKS?.trim() || null,
        DELIVERY_LOCATION_ID: nOrNull(form.DELIVERY_LOCATION_ID),
        CURRENCY_ID: nOrNull(form.CURRENCY_ID),
        EXCHANGE_RATE: nOrNull(form.EXCHANGE_RATE),
        ...sums,
        QUOTATION_STATUS_ID: nOrNull(form.QUOTATION_STATUS_ID),
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_ENTRY: form.STATUS_ENTRY || "CF",
        dtls: dtls.map((r: any) => {
          const c = calcLine(r, form.EXCHANGE_RATE);
          return {
            PURCHASE_QUOTATION_DTL_ID: r.PURCHASE_QUOTATION_DTL_ID || undefined,
            PURCHASE_REQUEST_NO: r.PURCHASE_REQUEST_NO || null,
            PURCHASE_REQUEST_DTL_ID: nOrNull(r.PURCHASE_REQUEST_DTL_ID),
            CAMP_ID: nOrNull(r.CAMP_ID),
            REQUEST_STORE_ID: nOrNull(r.REQUEST_STORE_ID),
            REFERENCE_TYPE_ID: nOrNull(r.REFERENCE_TYPE_ID),
            REFERENCE_NO: r.REFERENCE_NO?.trim() || null,
            LINE_NO: nOrNull(r.LINE_NO),
            MAIN_CATEGORY_ID: nOrNull(r.MAIN_CATEGORY_ID),
            SUB_CATEGORY_ID: nOrNull(r.SUB_CATEGORY_ID),
            PRODUCT_ID: nOrNull(r.PRODUCT_ID),
            NO_OF_PCS_PER_PACKING: nOrNull(r.NO_OF_PCS_PER_PACKING),
            TOTAL_QUANTITY: nOrNull(r.TOTAL_QUANTITY),
            UOM_ID: nOrNull(r.UOM_ID),
            TOTAL_PACKING: nOrNull(c.TOTAL_PACKING),
            ALT_UOM_ID: nOrNull(r.ALT_UOM_ID),
            RATE: nOrNull(r.RATE),
            SUB_TOTAL_AMOUNT_FC: c.SUB_TOTAL_AMOUNT_FC,
            DISCOUNT_PERCENTAGE: nOrNull(r.DISCOUNT_PERCENTAGE),
            DISCOUNT_AMOUNT_FC: c.DISCOUNT_AMOUNT_FC,
            TOTAL_PRODUCT_AMOUNT_FC: c.TOTAL_PRODUCT_AMOUNT_FC,
            TAX_ID: nOrNull(r.TAX_ID),
            TAX_PERCENTAGE: nOrNull(r.TAX_PERCENTAGE),
            TAX_AMOUNT_FC: c.TAX_AMOUNT_FC,
            FINAL_AMOUNT_FC: c.FINAL_AMOUNT_FC,
            EXCHANGE_RATE: c.EXCHANGE_RATE,
            SUB_TOTAL_AMOUNT_LC: c.SUB_TOTAL_AMOUNT_LC,
            DISCOUNT_AMOUNT_LC: c.DISCOUNT_AMOUNT_LC,
            TOTAL_PRODUCT_AMOUNT_LC: c.TOTAL_PRODUCT_AMOUNT_LC,
            TAX_AMOUNT_LC: c.TAX_AMOUNT_LC,
            FINAL_AMOUNT_LC: c.FINAL_AMOUNT_LC,
            REQUIRED_DATE: r.REQUIRED_DATE || null,
            REASON: r.REASON?.trim() || null,
            REMARKS: r.REMARKS?.trim() || null,
            STATUS_ENTRY: r.STATUS_ENTRY || "AC",
          };
        }),
        deletedIds,
        USER: user?.loginName || "Admin",
        MAC_ADDRESS: "WEB",
        ROLE: role,
      };

      if (editing) {
        const res = await dispatch(updatePurchaseQuotation(payload as PurchaseQuotationGridData)).unwrap();
        toast({ title: res?.message ?? "Purchase Quotation updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addPurchaseQuotation(payload as PurchaseQuotationGridData)).unwrap();
        toast({ title: res?.message ?? "Purchase Quotation created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      setStepErrors({});
      setLineErrors({});
      setFocusRequest(null);
      dispatch(fetchPurchaseQuotations({}));
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : e?.message || "Error saving purchase quotation", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deletePurchaseQuotationHdr(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Purchase Quotation deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchPurchaseQuotations({}));
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : e?.message || "Error deleting purchase quotation", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  /* Per-row Submit: moves a saved quotation to Pending for Approval through the
     dedicated endpoint, so the row is submitted without re-saving the record. */
  const handleSubmitRow = async (row: any) => {
    const refNo = row?.purchaseQuotationNo ?? row?.PURCHASE_QUOTATION_NO;
    if (!refNo) return;
    if (submittingRef === refNo) return;
    setSubmittingRef(refNo);
    try {
      const res = await dispatch(
        submitPurchaseQuotation({ refNo, quotationStatusId: Number(pendingStatusId) })
      ).unwrap();
      toast({
        title: res?.message ?? "Purchase Quotation submitted for approval",
        duration: DEFAULT_TOAST_DURATION,
      });
      dispatch(fetchPurchaseQuotations({}));
    } catch (e: any) {
      toast({
        title: typeof e === "string" ? e : e?.message || "Error submitting purchase quotation",
        variant: "destructive",
        duration: DEFAULT_TOAST_DURATION,
      });
    } finally {
      setSubmittingRef(null);
    }
  };

  const renderField = (
    key: string,
    label: string,
    type: "text" | "number" | "date" | "select" | "textarea",
    options?: { value: string; label: string }[],
    required?: boolean,
    placeholder?: string,
    disabled?: boolean,
    helper?: string,
    onChange?: (value: string) => void
  ) => {
    const baseClass = "flex flex-col gap-1.5";
    const isEmpty = required && !form[key];
    const fieldBorderClass = isEmpty ? "border-destructive ring-1 ring-destructive/30" : "";
    const set = (v: string) => (onChange ? onChange(v) : updateForm(key, v));
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : baseClass}>
        <Label className="text-xs">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
          {helper && <span className="text-muted-foreground font-normal ml-1">({helper})</span>}
        </Label>
        {type === "select" ? (
          <Select value={form[key] || ""} onValueChange={(v) => { if (!disabled) set(v); }} disabled={disabled}>
            <SelectTrigger className={`h-9 text-xs ${fieldBorderClass} ${disabled ? "opacity-70" : ""}`}>
              <SelectValue placeholder={placeholder || `Select ${label}`} />
            </SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={form[key] || ""} onChange={(e) => set(e.target.value)} placeholder={placeholder} className={`text-xs ${fieldBorderClass}`} />
        ) : type === "date" ? (
          <DatePicker value={form[key] || ""} onChange={(v) => set(v)} placeholder={placeholder} className={fieldBorderClass || undefined} />
        ) : (
          <Input
            type={type === "number" ? "number" : "text"}
            min={type === "number" ? "0" : undefined}
            step={type === "number" ? "any" : undefined}
            value={form[key] ?? ""}
            onChange={(e) => set(e.target.value)}
            placeholder={placeholder}
            className={`h-9 text-xs ${fieldBorderClass}`}
          />
        )}
      </div>
    );
  };

  /* ------------------------------------------------- wizard line groups --- */
  const lineGroups = (): FieldGroup[] => [
    {
      title: "From Purchase Request",
      fields: [
        {
          key: "PURCHASE_REQUEST_NO",
          label: "Purchase Request",
          kind: "readOnly",
          display: (r: any) =>
            r.PURCHASE_REQUEST_NO
              ? `${r.PURCHASE_REQUEST_NO}${r.SOURCE_LINE_NO != null ? ` (line ${r.SOURCE_LINE_NO})` : ""}`
              : "-",
        },
        { key: "CAMP", label: "Camp", kind: "readOnly", display: (r: any) => r.CAMP_NAME || (r.CAMP_ID ?? "-") },
        { key: "REQUEST_STORE", label: "Req Store", kind: "readOnly", display: (r: any) => r.REQUEST_STORE_NAME || (r.REQUEST_STORE_ID ?? "-") },
        { key: "REFERENCE_TYPE", label: "Ref Type", kind: "readOnly", display: (r: any) => r.REFERENCE_TYPE_NAME || (r.REFERENCE_TYPE_ID ?? "-") },
      ],
    },
    {
      title: "Item",
      fields: [
        { key: "MAIN_CATEGORY_ID", label: "Main Category", kind: "readOnly", display: (r: any) => r.MAIN_CATEGORY_NAME || (r.MAIN_CATEGORY_ID ?? "-") },
        { key: "SUB_CATEGORY_ID", label: "Sub Category", kind: "readOnly", display: (r: any) => r.SUB_CATEGORY_NAME || (r.SUB_CATEGORY_ID ?? "-") },
        { key: "PRODUCT_ID", label: "Product", kind: "readOnly", display: (r: any) => r.PRODUCT_NAME || (r.PRODUCT_ID ?? "-") },
        { key: "NO_OF_PCS_PER_PACKING", label: "Pcs/Packing", kind: "readOnly", display: (r: any) => r.NO_OF_PCS_PER_PACKING || "From product" },
        { key: "UOM", label: "UOM", kind: "readOnly", display: (r: any) => r.UOM_NAME || (r.UOM_ID ?? "-") },
        { key: "ALT_UOM", label: "Alt UOM", kind: "readOnly", display: (r: any) => r.ALT_UOM_NAME || (r.ALT_UOM_ID ?? "-") },
      ],
    },
    {
      title: "Quantity & Pricing",
      fields: [
        { key: "LINE_NO", label: "Line No", kind: "computed", hint: "auto", display: (r: any) => r.LINE_NO ?? "-" },
        { key: "REFERENCE_NO", label: "Reference No", kind: "text", maxLength: 50, placeholder: "Ref no",
          /* Locked when the line came from a request, because the value is the
             request's. A line added by hand has no request to trace, so it stays
             typeable. */
          disabled: (r: any) => r.PURCHASE_REQUEST_DTL_ID != null || !!r.PURCHASE_REQUEST_NO,
          hint: "from request" },
        { key: "TOTAL_QUANTITY", label: "Quantity", kind: "number", required: true, min: 0, transform: clampNonNegative },
        { key: "TOTAL_PACKING", label: "Total Packing", kind: "computed", display: (r: any) => (r.TOTAL_PACKING === "" || r.TOTAL_PACKING == null ? "Auto" : r.TOTAL_PACKING) },
        { key: "RATE", label: "Rate", kind: "number", required: true, min: 0, placeholder: "0.000", transform: clampNonNegative },
        { key: "DISCOUNT_PERCENTAGE", label: "Discount %", kind: "number", min: 0, max: 100, transform: clampNonNegative },
        { key: "DISCOUNT_AMOUNT_FC", label: "Discount Amt FC", kind: "computed", display: (r: any) => money(r.DISCOUNT_AMOUNT_FC) },
        { key: "SUB_TOTAL_AMOUNT_FC", label: "Sub Total FC", kind: "computed", display: (r: any) => money(r.SUB_TOTAL_AMOUNT_FC) },
        { key: "FINAL_AMOUNT_FC", label: "Final Amt FC", kind: "computed", display: (r: any) => money(r.FINAL_AMOUNT_FC) },
      ],
    },
    {
      title: "Tax",
      fields: [
        {
          key: "TAX_ID",
          label: "Tax",
          kind: "select",
          options: taxOptions,
          placeholder: "Tax",
          transform: (v: string) => (v ? Number(v) : undefined),
        },
        {
          key: "TAX_PERCENTAGE",
          label: "Tax %",
          /* Derived from the tax picked above, never typed. updateDtl fills this
             from the tax master whenever TAX_ID changes, so an editable box here
             would only let the percentage and the chosen tax disagree. The value
             still saves - the payload reads it from row state, not from here. */
          kind: "computed",
          display: (r: any) =>
            r.TAX_PERCENTAGE === "" || r.TAX_PERCENTAGE == null ? "-" : `${r.TAX_PERCENTAGE}%`,
        },
        { key: "TAX_AMOUNT_FC", label: "Tax Amt FC", kind: "computed", display: (r: any) => money(r.TAX_AMOUNT_FC) },
      ],
    },
    {
      title: "Additional",
      fields: [
        { key: "REQUIRED_DATE", label: "Required Date", kind: "date" },
        { key: "REASON", label: "Reason", kind: "text", maxLength: 500 },
        { key: "REMARKS", label: "Remarks", kind: "text", maxLength: 500 },
      ],
    },
    {
      title: "Totals in LC",
      fields: [
        /* The rate that produced every LC figure below, so a line never has to
           be back-calculated to find out which rate was used on it. */
        { key: "EXCHANGE_RATE", label: "Exchange Rate", kind: "computed", display: (r: any) => rate6(r.EXCHANGE_RATE) },
        { key: "SUB_TOTAL_AMOUNT_LC", label: "Sub Total LC", kind: "computed", display: (r: any) => money(r.SUB_TOTAL_AMOUNT_LC) },
        { key: "DISCOUNT_AMOUNT_LC", label: "Disc Amt LC", kind: "computed", display: (r: any) => money(r.DISCOUNT_AMOUNT_LC) },
        { key: "TOTAL_PRODUCT_AMOUNT_LC", label: "Total Prod LC", kind: "computed", display: (r: any) => money(r.TOTAL_PRODUCT_AMOUNT_LC) },
        { key: "TAX_AMOUNT_LC", label: "Tax Amt LC", kind: "computed", display: (r: any) => money(r.TAX_AMOUNT_LC) },
        { key: "FINAL_AMOUNT_LC", label: "Final Amt LC", kind: "computed", display: (r: any) => money(r.FINAL_AMOUNT_LC) },
      ],
    },
  ];

  const headerLabels = useMemo(() => {
    const pick = (list: any[] | undefined, v: any) =>
      (list || []).find((o: any) => o.value === String(v ?? ""))?.label ?? "";
    return {
      SUPPLIER_BP_ID: pick(supplierOptions, form.SUPPLIER_BP_ID),
      COMPANY_ID: pick(companyOptions, form.COMPANY_ID),
      BRANCH_ID: pick(branchOptions, form.BRANCH_ID),
      PO_STORE_ID: pick(storeOptions, form.PO_STORE_ID),
      QUOTATION_STATUS_ID: pick(quoteStatusOptions, form.QUOTATION_STATUS_ID),
      PAYMENT_TERM_ID: pick(paymentTermOptions, form.PAYMENT_TERM_ID),
      PAYMENT_MODE_ID: pick(paymentModeOptions, form.PAYMENT_MODE_ID),
      SHIPMENT_MODE_ID: pick(shipmentModeOptions, form.SHIPMENT_MODE_ID),
      DELIVERY_LOCATION_ID: pick(locationOptions, form.DELIVERY_LOCATION_ID),
      CURRENCY_ID: pick(currencyOptions, form.CURRENCY_ID),
      /* Not a select on the form, so it has no option list to pick from.
         entryLabel turns the stored CF/CL code into the Pending for
         Submitted / Submitted label shown on this step. */
      STATUS_ENTRY: entryLabel(form.STATUS_ENTRY),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, supplierOptions, companyOptions, branchOptions, storeOptions, quoteStatusOptions, paymentTermOptions, paymentModeOptions, shipmentModeOptions, locationOptions, currencyOptions]);

  /* Every rule the old step-1/step-2 gates enforced. Section problems land in
     stepErrors; per-line problems stay with the card so the user sees which
     line is at fault. */
  const validateQuotation = (): {
    stepErrors: StepErrors;
    lineErrors: StepErrors;
    invalidFields: Record<string, string[]>;
  } => {
    const out: StepErrors = {};
    const lines: StepErrors = {};
    /* line key -> form field keys that failed, used to ring the inputs. */
    const invalidFields: Record<string, string[]> = {};
    const push = (key: string, message: string) => {
      if (!out[key]) out[key] = [];
      out[key].push(message);
    };
    const pushLine = (lineKey: string, message: string) => {
      if (!lines[lineKey]) lines[lineKey] = [];
      lines[lineKey].push(message);
    };

    if (!form.PURCHASE_QUOTATION_DATE) push(HDR_STEP, "Purchase Quotation Date is required");
    if (!form.SUPPLIER_BP_ID) push(HDR_STEP, "Please select a Supplier");
    if (!form.CURRENCY_ID) push(HDR_STEP, "Please select a Currency");
    if (!(toNum(form.EXCHANGE_RATE) > 0)) push(HDR_STEP, "Exchange Rate must be greater than 0");
    if (form.VALID_FROM_DATE && form.VALID_TO_DATE && form.VALID_TO_DATE < form.VALID_FROM_DATE) {
      push(HDR_STEP, "Valid To Date cannot be before Valid From Date");
    }

    if (dtls.length === 0) push(REVIEW_STEP, "At least one quotation line is required");

    const lineNos = dtls.map((r: any) => String(r.LINE_NO ?? ""));
    if (new Set(lineNos).size !== lineNos.length) {
      push(REVIEW_STEP, "Line No must be unique within the same Quotation");
    }
    const dup = dtls.find((r: any, i: number) =>
      dtls.findIndex((o: any) =>
        o.PURCHASE_REQUEST_DTL_ID != null &&
        String(o.PURCHASE_REQUEST_DTL_ID) === String(r.PURCHASE_REQUEST_DTL_ID)
      ) !== i
    );
    if (dup) {
      push(REVIEW_STEP, `Purchase Request line already quoted on Line ${dup.LINE_NO}`);
    }

    dtls.forEach((r: any) => {
      /* Name only the fields that actually failed. A fixed "Product, Quantity
         and Rate are required" string re-blames all three no matter what the
         user fixes, so a line missing just the rate kept looking like a
         quantity problem. Listing the real cause makes the fix obvious. */
      const problems: string[] = [];

      if (!r.PRODUCT_ID) {
        /* Product renders read-only from the name, so a missing id can never be
           typed in by hand. A name without an id means the source request line
           came through incomplete, so point at the cause and the way out instead
           of "Product is required", which just looks like we forgot the product. */
        problems.push(
          r.PRODUCT_NAME
            ? `Product id missing for "${r.PRODUCT_NAME}" - remove this line and add it again`
            : "Product is required",
        );
      }
      if (!(toNum(r.TOTAL_QUANTITY) > 0)) problems.push("Quantity must be greater than 0");

      /* Rate is required, so test that a value was actually entered. toNum("")
         is 0, so a plain "< 0" guard would wave an empty rate straight through
         and save a line worth nothing. Lines pulled in from a Purchase Request
         start with an empty RATE on purpose, so this is the common case. The
         negative guard is kept too: the input clamps negatives as you type, but
         a stored value could still arrive from the database. A deliberate 0 is
         accepted. */
      const rateMissing = r.RATE === "" || r.RATE === null || r.RATE === undefined;
      const rateNegative = toNum(r.RATE) < 0;
      if (rateMissing) problems.push("Rate is required");
      else if (rateNegative) problems.push("Rate cannot be negative");

      if (problems.length > 0) {
        /* These keys drive the red ring on the offending inputs. */
        const fields: string[] = [];
        if (!r.PRODUCT_ID) fields.push("PRODUCT_ID");
        if (!(toNum(r.TOTAL_QUANTITY) > 0)) fields.push("TOTAL_QUANTITY");
        if (rateMissing || rateNegative) fields.push("RATE");
        invalidFields[r.key] = fields;
        pushLine(r.key, `Line ${r.LINE_NO ?? "?"}: ${problems.join("; ")}`);
      }

      if (toNum(r.DISCOUNT_PERCENTAGE) < 0 || toNum(r.DISCOUNT_PERCENTAGE) > 100) {
        invalidFields[r.key] = [...(invalidFields[r.key] ?? []), "DISCOUNT_PERCENTAGE"];
        pushLine(r.key, `Line ${r.LINE_NO ?? "?"}: Discount % must be between 0 and 100`);
      }
    });

    /* One marker on the section so it shows as needing attention. */
    const broken = Object.keys(lines);
    if (broken.length > 0) {
      push(DTL_STEP, `${broken.length} line${broken.length === 1 ? "" : "s"} need attention`);
    }

    return { stepErrors: out, lineErrors: lines, invalidFields };
  };

  const [focusRequest, setFocusRequest] = useState<{ key: string; nonce: number } | null>(null);
  const focusOn = (key: string) => setFocusRequest((prev) => ({ key, nonce: (prev?.nonce ?? 0) + 1 }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Quotation</h1>
          <p className="text-sm text-muted-foreground">Manage purchase quotation header and detail data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Purchase Quotation
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search purchase quotations..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
            {uniqueFinalStatuses.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Final Status:</span>
                <Select value={finalStatusFilter} onValueChange={(v) => { setFinalStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-35 h-9 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    {uniqueFinalStatuses.map((s) => <SelectItem key={s} value={s}>{finalLabel(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {uniqueStatusEntries.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Entry:</span>
                <Select value={statusEntryFilter} onValueChange={(v) => { setStatusEntryFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-52 h-9 text-xs"><SelectValue placeholder="All Entry" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Entry</SelectItem>
                    {uniqueStatusEntries.map((s) => <SelectItem key={s} value={s}>{entryLabel(s)}</SelectItem>)}
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
                  {[...Array(8)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Quotation No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Quotation Date</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Supplier</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Supplier Quote No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Branch</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">PO Store</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Valid To</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Final Amount (LC)</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Quotation Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Final Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs whitespace-nowrap">Status Entry</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => {
                  const refNo = item.purchaseQuotationNo ?? item.PURCHASE_QUOTATION_NO;
                  const isSubmitting = submittingRef === refNo;
                  /* Submitting is one-way: once a row is pending the button stays
                     disabled. The status comes from the server row, not local state. */
                  const isPending = !!pendingStatusId && String(item.quotationStatusId ?? "") === pendingStatusId;
                  return (
                  <tr key={item.id || idx} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                      <button
                        onClick={() => setConversationFor(refNo)}
                        title="Conversation"
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      </button>
                      {isAdmin && <button onClick={() => setDeleteId(refNo)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>}
                      <button
                        onClick={() => handleSubmitRow(item)}
                        disabled={isSubmitting || isPending}
                        title={
                          missingStatusMaster
                            ? "Status Master is unavailable - PENDING_APPROVAL could not be resolved"
                            : isPending
                              ? "Already pending for approval"
                              : "Submit for approval"
                        }
                        className="p-1.5 rounded hover:bg-info/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin text-info" />
                        ) : (
                          <Send className="w-4 h-4 text-info" />
                        )}
                      </button>
                    </td>
                    <td className="p-3 font-medium">{item.purchaseQuotationNo || "-"}</td>
                    <td className="p-3">{formatDate(item.purchaseQuotationDate)}</td>
                    <td className="p-3">{item.supplierName || "-"}</td>
                    <td className="p-3">{item.supplierQuotationNo || "-"}</td>
                    <td className="p-3">{item.companyName || "-"}</td>
                    <td className="p-3">{item.branchName || "-"}</td>
                    <td className="p-3">{item.poStoreName || "-"}</td>
                    <td className="p-3">{formatDate(item.validToDate)}</td>
                    <td className="p-3 font-medium">{money(item.finalProductHdrAmountLc)}</td>
                    <td className="p-3">{item.quotationStatusName || "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${finalBadgeClass(item.finalResponseStatus)} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {finalLabel(item.finalResponseStatus)}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${entryBadgeClass(item.statusEntry)} px-2 py-0.5 text-xs font-semibold whitespace-nowrap`}>
                        {entryLabel(item.statusEntry)}
                      </Badge>
                    </td>
                  </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr><td colSpan={13} className="p-8 text-center text-muted-foreground">No purchase quotations found</td></tr>
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

      <WizardShell
        open={dialogOpen}
        onOpenChange={(v) => {
          if (!v) {
            setStepErrors({});
            setLineErrors({});
            setFocusRequest(null);
          }
          setDialogOpen(v);
        }}
        title={
          editing
            ? `Edit Purchase Quotation (${editing.purchaseQuotationNo ?? editing.PURCHASE_QUOTATION_NO})`
            : "Add Purchase Quotation"
        }
        errors={stepErrors}
        saving={saving}
        saveLabel={editing ? "Update" : "Create"}
        saveClassName={
          editing
            ? "bg-info text-info-foreground hover:bg-info/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }
        onSave={handleSave}
        focusStep={focusRequest}
        footerNote={`${dtls.length} line${dtls.length === 1 ? "" : "s"}`}
      >
        <WizardSection
          stepKey={HDR_STEP}
          title="Quotation Header Information"
          subtitle="Dates, supplier, currency and validity"
          errors={stepErrors[HDR_STEP]}
        >

          <div className="grid grid-cols-2 gap-4">
            {renderField("PURCHASE_QUOTATION_DATE", "Quotation Date", "date", undefined, true)}
            {renderField("SUPPLIER_BP_ID", "Supplier", "select", supplierOptions, true, "Select supplier")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField("COMPANY_ID", "Company", "select", companyOptions, false, "Select company")}
            {renderField("BRANCH_ID", "Branch", "select", branchOptions, false, "Select branch")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField("PO_STORE_ID", "PO Store", "select", storeOptions, false, "Select PO store")}
            {renderField("QUOTATION_STATUS_ID", "Quotation Status", "select", quoteStatusOptions, false, undefined, true, "set by the workflow")}
          </div>
          {renderField("SUPPLIER_QUOTATION_NO", "Supplier Quotation No", "text", undefined, false, "Supplier reference")}
          <div className="grid grid-cols-2 gap-4">
            {renderField("VALID_FROM_DATE", "Valid From", "date")}
            {renderField("VALID_TO_DATE", "Valid To", "date")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField("PAYMENT_TERM_ID", "Payment Term", "select", paymentTermOptions, false, "Select payment term")}
            {renderField("PAYMENT_MODE_ID", "Payment Mode", "select", paymentModeOptions, false, "Select payment mode")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField("SHIPMENT_MODE_ID", "Shipment Mode", "select", shipmentModeOptions, false, "Select shipment mode")}
            {renderField("DELIVERY_LOCATION_ID", "Delivery Location", "select", locationOptions, false, "Select delivery location")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField("DELIVERY_DATE", "Delivery Date", "date", undefined, false, undefined, false, "default for lines")}
            {renderField("DELIVERY_TERM", "Delivery Term", "text", undefined, false, "e.g. DDP")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField("CURRENCY_ID", "Currency", "select", currencyOptions, true, "Select currency", false, undefined, handleCurrencyChange)}
            {renderField("EXCHANGE_RATE", "Exchange Rate", "number", undefined, true, "1.000000", false, "applies to all lines")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">
                Status Entry
                <span className="text-muted-foreground font-normal ml-1">(set by the workflow)</span>
              </Label>
              <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-xs font-medium">
                {entryLabel(form.STATUS_ENTRY)}
              </div>
            </div>
            {renderField("REMARKS", "Remarks", "text", undefined, false, "Additional notes")}
          </div>
          {renderField("SHIPMENT_REMARKS", "Shipment Remarks", "textarea", undefined, false, "Shipment notes...")}
          <div className="rounded-lg border border-border p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Lines from Purchase Request
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1.5 w-72">
                <Label className="text-xs">Purchase Request</Label>
                <Select value={reqNo} onValueChange={setReqNo}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select purchase request" />
                  </SelectTrigger>
                  <SelectContent>
                    {requestOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {requestOptions.length === 0 && prOptions && (
                  <p className="text-[11px] text-muted-foreground">
                    {allRequestsFullyImported
                      ? "Every eligible Purchase Request is already on this quotation"
                      : "No Purchase Request is available to quote"}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addLinesFromRequest}
                disabled={loadingReq || !reqNo}
                className="h-9 text-xs"
              >
                {loadingReq ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1" />}
                {loadingReq ? "Loading..." : "Add Lines from Request"}
              </Button>
              <span className="text-[11px] text-muted-foreground pb-2">
                {dtls.length} line{dtls.length === 1 ? "" : "s"} added
              </span>
            </div>
          </div>
        </WizardSection>

        <WizardSection
          stepKey={DTL_STEP}
          title="Quotation Lines"
          subtitle="Pulled from the Purchase Request selected above. Line numbers are automatic."
          errors={stepErrors[DTL_STEP]}
        >
          {dtls.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              No lines yet. Pick a Purchase Request above and use Add Lines from Request.
            </p>
          ) : (
            <div className="space-y-3">
              {computed.map((row: any) => (
                <DetailLineCard
                  key={row.key}
                  anchor={lineStepKey(row.key)}
                  title={`Line ${row.LINE_NO ?? "?"}${row.PRODUCT_NAME ? ` - ${row.PRODUCT_NAME}` : ""}`}
                  subtitle={
                    row.PURCHASE_REQUEST_NO
                      ? `From ${row.PURCHASE_REQUEST_NO}${row.SOURCE_LINE_NO != null ? ` line ${row.SOURCE_LINE_NO}` : ""}`
                      : "No linked request line"
                  }
                  groups={lineGroups()}
                  row={row}
                  errors={lineErrors[row.key]}
                  invalidFieldKeys={lineFieldErrors[row.key]}
                  onChange={(field, value) => updateDtl(row.key, field, value)}
                  onRemove={() => removeDtl(row.key)}
                />
              ))}
            </div>
          )}
        </WizardSection>

        <WizardSection
          stepKey={REVIEW_STEP}
          title="Review & Submit"
          subtitle="Header and every detail line on one page"
          errors={stepErrors[REVIEW_STEP]}
        >
          <QuotationReview
            form={form}
            headerLabels={headerLabels}
            totals={totals}
            money={money}
            rate6={rate6}
          />
        </WizardSection>
      </WizardShell>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this purchase quotation along with all its detail lines.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConversationDialog
        open={!!conversationFor}
        onOpenChange={(v) => !v && setConversationFor(null)}
        purchaseQuotationNo={conversationFor ?? ""}
      />
    </div>
  );
}
