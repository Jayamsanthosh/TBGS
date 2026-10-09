"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Search, Pencil, Trash2, Loader2, FileText, Send } from "lucide-react";
import PurchaseOrderReview from "./purchase-order-review";
import WizardShell from "@/components/wizard/WizardShell";
import WizardSection from "@/components/wizard/WizardSection";
import DetailLineCard from "@/components/wizard/DetailLineCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AttachmentsPanel from "@/components/AttachmentsPanel";
import AdditionalChargesPanel from "./additional-charges-panel";
import { useLinkPagesId } from "@/hooks/useLinkPagesId";
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
  fetchPurchaseOrders,
  addPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrderHdr,
  submitPurchaseOrder,
  fetchPurchaseOrderHdr,
  fetchPurchaseOrderDtls,
  clearPurchaseOrderMasterError,
  PurchaseOrderGridData,
} from "@/lib/purchaseOrderMasterSlice";
import {
  fetchPurchaseQuotationHdr,
  fetchPurchaseQuotationDtls,
} from "@/lib/purchaseQuotationMasterSlice";
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

const PURCHASE_ORDER_TAB = "purchase-order";
const DOCUMENTS_TAB = "documents";
const CHARGES_TAB = "additional-charges";

/* Status Entry is owned by the workflow, not the user: CF (Pending for
   Submitted) until the order is submitted, then CL (Submitted). */
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

/* Same tolerant SQL/ISO date reader as the quotation screen. */
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
  const rates = Array.from(new Set(rows.map((r) => toNum(r.EXCHANGE_RATE)).filter((n) => n > 0)));
  return {
    EXCHANGE_RATE: rates.length === 1 ? rates[0] : 0,
    EXCHANGE_RATE_VALUES: rates,
    TOTAL_SUB_TOTAL_HDR_AMOUNT_FC: s("SUB_TOTAL_AMOUNT_FC"),
    TOTAL_DISCOUNT_HDR_AMOUNT_FC: s("DISCOUNT_AMOUNT_FC"),
    /* The PO has no additional-charges module, so these stay 0. */
    TOTAL_ADDITIONAL_COST_AMOUNT_FC: 0,
    TOTAL_PRODUCT_HDR_AMOUNT_FC: s("TOTAL_PRODUCT_AMOUNT_FC"),
    TOTAL_VAT_HDR_AMOUNT_FC: s("TAX_AMOUNT_FC"),
    FINAL_PRODUCT_HDR_AMOUNT_FC: s("FINAL_AMOUNT_FC"),
    TOTAL_SUB_TOTAL_HDR_AMOUNT_LC: s("SUB_TOTAL_AMOUNT_LC"),
    TOTAL_DISCOUNT_HDR_AMOUNT_LC: s("DISCOUNT_AMOUNT_LC"),
    TOTAL_ADDITIONAL_COST_AMOUNT_LC: 0,
    TOTAL_PRODUCT_HDR_AMOUNT_LC: s("TOTAL_PRODUCT_AMOUNT_LC"),
    TOTAL_TAX_HDR_AMOUNT_LC: s("TAX_AMOUNT_LC"),
    FINAL_PRODUCT_HDR_AMOUNT_LC: s("FINAL_AMOUNT_LC"),
  };
};

const money = (v: any) => (toNum(v) === 0 ? "-" : toNum(v).toFixed(3));

const rate6 = (v: any) => (toNum(v) > 0 ? toNum(v).toFixed(6) : "-");

const taxPct = (t: any) =>
  t && t.TAX_PERCENTAGE != null && t.TAX_PERCENTAGE !== "" ? String(t.TAX_PERCENTAGE) : "";

const previewQty = (v: any) => {
  if (v === "" || v === null || v === undefined) return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
};

export default function PurchaseOrderPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.purchaseOrderMaster);
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const activeCompanyId = user?.context?.companyId ?? user?.companies?.[0]?.companyId ?? null;

  /* Company and Branch belong to the logged-in user; PO Store is a fixed
     destination that only ever reads "PURCHASE STORE". */
  const sessionEmployee = user?.employee ?? null;
  const sessionEmployeeDefaults = useMemo(
    () => ({
      companyId: sessionEmployee?.companyId ?? activeCompanyId ?? null,
      branchId:
        sessionEmployee?.branchId ??
        user?.context?.branchId ??
        user?.companies?.[0]?.branchId ??
        null,
    }),
    [
      sessionEmployee?.companyId,
      sessionEmployee?.branchId,
      user?.context,
      user?.companies,
      activeCompanyId,
    ]
  );

  const [search, setSearch] = useState("");
  const [finalStatusFilter, setFinalStatusFilter] = useState<string>("ALL");
  const [statusEntryFilter, setStatusEntryFilter] = useState<string>("ALL");
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseOrderGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [stepErrors, setStepErrors] = useState<StepErrors>({});
  const [lineErrors, setLineErrors] = useState<StepErrors>({});
  const [lineFieldErrors, setLineFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submittingRef, setSubmittingRef] = useState<string | null>(null);
  const [dtls, setDtls] = useState<any[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [quoteNo, setQuoteNo] = useState<string>("");
  const [loadingQuote, setLoadingQuote] = useState(false);
  /* The quotation picked in the dropdown is previewed beside it before any lines
     are brought over, so the order is only ever built from a quotation already
     reviewed line by line. */
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHdr, setPreviewHdr] = useState<any>(null);
  const [previewLines, setPreviewLines] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(PURCHASE_ORDER_TAB);
  /* Charges are only staged while an Add dialog is open; once the header exists
     the tab reads them straight from the API instead. */
  const [stagedCharges, setStagedCharges] = useState<any[]>([]);

  const linkPagesId = useLinkPagesId(0);
  const currentPoNo =
    form.PURCHASE_ORDER_NO ||
    editing?.purchaseOrderNo ||
    editing?.PURCHASE_ORDER_NO ||
    "";

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

  const { data: companies } = useApiQuery("po-master-companies", () => fetchList(`${API_URL}/company-master`));
  const { data: branches } = useApiQuery("po-master-branches", () => fetchList(`${API_URL}/branch-master?status=AC`));
  const { data: stores } = useApiQuery("po-master-stores", () => fetchList(`${API_URL}/store-master`));
  const { data: camps } = useApiQuery("po-master-camps", () => fetchList(`${API_URL}/camp-master`));
  const { data: locations } = useApiQuery("po-master-locations", () => fetchList(`${API_URL}/location-master`));
  const { data: suppliers } = useApiQuery("po-master-suppliers", () => fetchList(`${API_URL}/business-partner-master?status=AC`));
  const { data: paymentTerms } = useApiQuery("po-master-payment-terms", () => fetchList(`${API_URL}/payment-term-master`));
  const { data: paymentModes } = useApiQuery("po-master-payment-modes", () => fetchList(`${API_URL}/payment-mode-master`));
  const { data: shipmentModes } = useApiQuery("po-master-shipment-modes", () => fetchList(`${API_URL}/shipment-mode-master/load`));
  const { data: taxes } = useApiQuery("po-master-taxes", () => fetchList(`${API_URL}/tax-master`));
  const { data: currencies } = useApiQuery("po-master-currencies", () => fetchList(`${API_URL}/currency-master`));
  const { data: uoms } = useApiQuery("po-master-uoms", () => fetchList(`${API_URL}/uom-master`));
  const { data: poStatuses } = useApiQuery("po-master-statuses", () => fetchList(`${API_URL}/status-master/load?includeInactive=false`));

  /* A Purchase Order is always raised against a submitted quotation, so the
     dropdown lists the quotations that have reached the submitted state (CL)
     and are not already driving another order. The list is company-agnostic,
     exactly like the Purchase Quotation module's own grid and its request
     dropdown - the header company belongs to the session, but the source
     quotations must not disappear just because a login is scoped to a
     different company than the one the quotation was created under. */
  const { data: quoteOptions } = useApiQuery("po-master-source-quotations", () => {
    const qs = new URLSearchParams();
    qs.set("statusEntry", "CL");
    const url = `${API_URL}/purchase-order/source-quotations${qs.toString() ? `?${qs.toString()}` : ""}`;
    return fetchList(url);
  });

  const pendingTaxDefaults = useRef<Set<string>>(new Set());

  useEffect(() => {
    const list = Array.isArray(taxes) ? taxes : [];
    const def = list[0];
    if (!def || def.TAX_ID == null || pendingTaxDefaults.current.size === 0) return;
    const ids = pendingTaxDefaults.current;
    pendingTaxDefaults.current = new Set();
    setDtls((prev) => prev.map((r: any) =>
      ids.has(r.key) && r.TAX_ID == null
        ? { ...r, TAX_ID: Number(def.TAX_ID), TAX_NAME: def.TAX_NAME || "", TAX_PERCENTAGE: taxPct(def) }
        : r
    ));
  }, [taxes]);

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

  /* SHOW_PURCHASE_ORDER_DTL returns no ALT_UOM_NAME, so every Alt UOM cell
     resolves its name from the master here instead of showing a bare id. */
  const uomNameById = useMemo(() => {
    const m = new Map<string, string>();
    (Array.isArray(uoms) ? uoms : []).forEach((u: any) => {
      if (u.UOM_ID != null) m.set(String(u.UOM_ID), String(u.UOM_NAME ?? ""));
    });
    return m;
  }, [uoms]);

  const locationOptions = useMemo(() => opt(locations, "LOCATION_ID", "LOCATION_NAME"), [locations]);
  const paymentTermOptions = useMemo(() => opt(paymentTerms, "PAYMENT_TERM_ID", "PAYMENT_TERM_NAME"), [paymentTerms]);
  const paymentModeOptions = useMemo(() => opt(paymentModes, "PAYMENT_MODE_ID", "PAYMENT_MODE_NAME"), [paymentModes]);
  const shipmentModeOptions = useMemo(() => opt(shipmentModes, "SHIPMENT_MODE_ID", "SHIPMENT_MODE_NAME"), [shipmentModes]);
  const taxOptions = useMemo(() => opt(taxes, "TAX_ID", "TAX_NAME"), [taxes]);
  const currencyOptions = useMemo(() => opt(currencies, "CURRENCY_ID", "CURRENCY_NAME"), [currencies]);
  const poStatusOptions = useMemo(
    () =>
      (Array.isArray(poStatuses) ? poStatuses : []).map((s: any) => ({
        value: String(s.statusId ?? s.STATUS_ID ?? ""),
        label: s.displayText || s.statusName || s.STATUS_NAME || "",
      })).filter((o: any) => o.value),
    [poStatuses]
  );

  /* The order status is decided by the workflow, not picked by hand: a new order
     starts at DRAFT, and the row's Submit action moves it to CL via the submit
     proc. Default only when the master can actually resolve a DRAFT id. */
  const statusIdFor = (code: string) =>
    String(
      (Array.isArray(poStatuses) ? poStatuses : []).find(
        (s: any) => String(s.statusCode ?? s.STATUS_CODE ?? "") === code
      )?.statusId ?? ""
    );
  const draftStatusId = statusIdFor("DRAFT");

  const supplierOptions = useMemo(
    () =>
      (Array.isArray(suppliers) ? suppliers : [])
        .filter((r: any) => String(r.BP_TYPE ?? "").trim().toLowerCase() === "supplier")
        .map((r: any) => ({ value: String(r.BP_ID ?? ""), label: String(r.BP_NAME ?? "") }))
        .filter((o: any) => o.value && o.label),
    [suppliers]
  );

  /* How many lines this order has taken from each quotation, keyed by quotation
     number. Counted from the detail rows themselves so it stays correct when a
     line is removed again. */
  const importedCountByQuote = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of dtls as any[]) {
      const no = String(r.PURCHASE_QUOTATION_NO ?? "").trim();
      if (!no) continue;
      counts.set(no, (counts.get(no) ?? 0) + 1);
    }
    return counts;
  }, [dtls]);

  /* A quotation drops out of the dropdown once every one of its lines is already
     on this order - the backend has already pruned the quotations that fully
     drive another order, so this only tracks the current order's usage. */
  const isFullyOrdered = (r: any) => {
    const no = String(r.purchaseQuotationNo ?? "").trim();
    if (!no) return false;
    const total = Number(r.detailLineCount);
    if (!Number.isFinite(total) || total <= 0) return false;
    return (importedCountByQuote.get(no) ?? 0) >= total;
  };

  const allQuotesFullyOrdered = useMemo(() => {
    const eligible = (Array.isArray(quoteOptions) ? quoteOptions : []).filter(
      (r: any) => !/reject/i.test(String(r.finalResponseStatus ?? ""))
    );
    return eligible.length > 0 && eligible.every((r: any) => isFullyOrdered(r));
  }, [quoteOptions, importedCountByQuote]);

  const quotePickerOptions = useMemo(
    () =>
      (Array.isArray(quoteOptions) ? quoteOptions : [])
        .filter((r: any) => !/reject/i.test(String(r.finalResponseStatus ?? "")))
        .filter((r: any) => !isFullyOrdered(r))
        .map((r: any) => ({
          value: String(r.purchaseQuotationNo ?? ""),
          label: r.label || r.displayText || r.purchaseQuotationNo || "",
          summary:
            r.itemSummary ||
            (Number.isFinite(Number(r.detailLineCount)) && Number(r.detailLineCount) > 0
              ? `${r.detailLineCount} item${Number(r.detailLineCount) === 1 ? "" : "s"}`
              : ""),
        }))
        .filter((o: any) => o.value),
    [quoteOptions, importedCountByQuote]
  );

  /* While editing, the order's own quotation is not offered by the source list
     (an order already exists for it), so a synthetic option keeps it visible in
     the trigger. */
  const effectiveQuoteOptions = useMemo(() => {
    if (!editing) return quotePickerOptions;
    const current = String(form.PURCHASE_QUOTATION_NO ?? "").trim();
    if (!current) return quotePickerOptions;
    if (quotePickerOptions.some((o: any) => o.value === current)) return quotePickerOptions;
    return [
      {
        value: current,
        label: `${current} (current)`,
        summary: `${dtls.length} line${dtls.length === 1 ? "" : "s"} imported`,
      },
      ...quotePickerOptions,
    ];
  }, [editing, quotePickerOptions, form.PURCHASE_QUOTATION_NO, dtls.length]);

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
        d.purchaseOrderNo,
        d.purchaseQuotationNo,
        d.supplierName,
        d.companyName,
        d.branchName,
        d.poStoreName,
        d.shipmentModeName,
        d.purchaseOrderStatusName,
        d.deliveryLocationName,
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

  const computed = useMemo(
    () => dtls.map((r: any) => ({ ...r, ...calcLine(r, form.EXCHANGE_RATE) })),
    [dtls, form.EXCHANGE_RATE]
  );
  const totals = useMemo(() => rollup(computed), [computed]);

  useEffect(() => {
    dispatch(fetchPurchaseOrders());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearPurchaseOrderMasterError());
    }
  }, [error, dispatch, toast]);

  const newKey = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random();

  const emptyForm = () => ({
    PURCHASE_ORDER_DATE: fmtDate(new Date()),
    /* Company and Branch are taken from the session, never picked. PO Store is
       a fixed destination and only ever reads "PURCHASE STORE". */
    COMPANY_ID: sessionEmployeeDefaults.companyId != null ? String(sessionEmployeeDefaults.companyId) : "",
    SUPPLIER_BP_ID: "",
    BRANCH_ID: sessionEmployeeDefaults.branchId != null ? String(sessionEmployeeDefaults.branchId) : "",
    PO_STORE_ID: "",
    PURCHASE_QUOTATION_NO: "",
    PAYMENT_TERM_ID: "",
    PAYMENT_MODE_ID: "",
    SHIPMENT_MODE_ID: "",
    DELIVERY_DATE: "",
    DELIVERY_TERM: "",
    DELIVERY_LOCATION_ID: "",
    CURRENCY_ID: "",
    EXCHANGE_RATE: "",
    PURCHASE_ORDER_STATUS_ID: "",
    SHIPMENT_REMARKS: "",
    REMARKS: "",
    STATUS_ENTRY: "CF",
  });

  const updateForm = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  /* A new order starts as DRAFT. Applied once the id is known; editing never
     re-stamps its status. */
  useEffect(() => {
    if (editing) return;
    if (!draftStatusId) return;
    if (form.PURCHASE_ORDER_STATUS_ID) return;
    setForm((prev) => (prev.PURCHASE_ORDER_STATUS_ID ? prev : { ...prev, PURCHASE_ORDER_STATUS_ID: draftStatusId }));
  }, [draftStatusId, editing, form.PURCHASE_ORDER_STATUS_ID]);

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

  const renumberDtls = (rows: any[]) => rows.map((r, i) => ({ ...r, LINE_NO: i + 1 }));

  const removeDtl = (key: string) => {
    const row = dtls.find((r) => r.key === key);
    if (row?.PURCHASE_ORDER_DTL_ID) {
      setDeletedIds((d) => [...d, Number(row.PURCHASE_ORDER_DTL_ID)]);
    }
    setDtls((prev) => renumberDtls(prev.filter((r) => r.key !== key)));
  };

  const clearQuoteSelection = () => {
    setQuoteNo("");
    setPreviewOpen(false);
    setPreviewHdr(null);
    setPreviewLines([]);
  };

  /* Selecting a quotation asks the backend for its header and lines on the spot,
     so the "Review in Purchase Quotation" panel beside it stays live. */
  const onQuoteNoChange = async (v: string) => {
    if (!v) {
      clearQuoteSelection();
      return;
    }
    setQuoteNo(v);
    setForm((prev) => ({ ...prev, PURCHASE_QUOTATION_NO: v }));
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewHdr(null);
    setPreviewLines([]);
    try {
      const [hdr, lines] = await Promise.all([
        dispatch(fetchPurchaseQuotationHdr(v)).unwrap(),
        dispatch(fetchPurchaseQuotationDtls(v)).unwrap(),
      ]);
      setPreviewHdr(hdr ?? null);
      setPreviewLines(Array.isArray(lines) ? lines : []);

      /* New orders only: the quotation sets the supplier, currency, rate and
         delivery terms so the header is prefilled from what was already agreed. */
      if (!editing) {
        const toStr = (x: any) => (x == null || x === "" ? "" : String(x));
        setForm((prev) => ({
          ...prev,
          PURCHASE_QUOTATION_NO: v,
          SUPPLIER_BP_ID: prev.SUPPLIER_BP_ID || toStr(hdr?.SUPPLIER_BP_ID),
          CURRENCY_ID: prev.CURRENCY_ID || toStr(hdr?.CURRENCY_ID),
          EXCHANGE_RATE:
            prev.EXCHANGE_RATE ||
            (hdr?.EXCHANGE_RATE != null ? String(hdr.EXCHANGE_RATE) : ""),
          PAYMENT_TERM_ID: prev.PAYMENT_TERM_ID || toStr(hdr?.PAYMENT_TERM_ID),
          PAYMENT_MODE_ID: prev.PAYMENT_MODE_ID || toStr(hdr?.PAYMENT_MODE_ID),
          SHIPMENT_MODE_ID: prev.SHIPMENT_MODE_ID || toStr(hdr?.SHIPMENT_MODE_ID),
          DELIVERY_DATE: prev.DELIVERY_DATE || fmtDate(hdr?.DELIVERY_DATE),
          DELIVERY_TERM: prev.DELIVERY_TERM || hdr?.DELIVERY_TERM || "",
          DELIVERY_LOCATION_ID: prev.DELIVERY_LOCATION_ID || toStr(hdr?.DELIVERY_LOCATION_ID),
        }));
      }
    } catch (e: any) {
      toast({
        title: typeof e === "string" ? e : e?.message || "Failed to load quotation for review",
        variant: "destructive",
        duration: DEFAULT_TOAST_DURATION,
      });
      setPreviewHdr(null);
      setPreviewLines([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const previewDeliveryName = useMemo(() => {
    const id = previewHdr?.DELIVERY_LOCATION_ID;
    return id == null ? "" : (locationOptions.find((o: any) => o.value === String(id))?.label ?? "");
  }, [previewHdr, locationOptions]);

  /* Pull the purchase quotation header (for delivery / supplier context) and its
     lines, then append one order line per quotation line (carrying its rate,
     discount and tax so the order is priced from what was quoted). */
  const addLinesFromQuotation = async () => {
    if (!quoteNo) {
      toast({ title: "Please select a Purchase Quotation", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setLoadingQuote(true);
    try {
      const qHdr: any = await dispatch(fetchPurchaseQuotationHdr(quoteNo)).unwrap();
      const qLines: any[] = await dispatch(fetchPurchaseQuotationDtls(quoteNo)).unwrap();

      let added = 0;
      let skipped = 0;
      const newRows: any[] = [];

      const defTax = (Array.isArray(taxes) ? taxes : [])[0];
      const hasDef = !!(defTax && defTax.TAX_ID != null);
      const queuedForTax: string[] = [];
      for (const p of qLines) {
        const qDtlId = p.PURCHASE_QUOTATION_DTL_ID;
        if (
          qDtlId != null &&
          dtls.some((r: any) => String(r.PURCHASE_QUOTATION_DTL_ID) === String(qDtlId))
        ) {
          skipped += 1;
          continue;
        }
        const rowKey = newKey();
        if (!hasDef) queuedForTax.push(rowKey);
        newRows.push({
          key: rowKey,
          PURCHASE_ORDER_DTL_ID: undefined,
          PURCHASE_QUOTATION_NO: quoteNo,
          PURCHASE_QUOTATION_DTL_ID: qDtlId != null ? Number(qDtlId) : undefined,
          PURCHASE_REQUEST_NO: p.PURCHASE_REQUEST_NO || "",
          PURCHASE_REQUEST_DTL_ID: p.PURCHASE_REQUEST_DTL_ID != null ? Number(p.PURCHASE_REQUEST_DTL_ID) : undefined,
          CAMP_ID: p.CAMP_ID != null ? Number(p.CAMP_ID) : undefined,
          CAMP_NAME: p.CAMP_NAME || (p.CAMP_ID != null ? (campNameMap.get(String(p.CAMP_ID)) ?? "") : ""),
          REQUEST_STORE_ID: p.REQUEST_STORE_ID != null ? Number(p.REQUEST_STORE_ID) : undefined,
          REQUEST_STORE_NAME: p.REQUEST_STORE_NAME || (p.REQUEST_STORE_ID != null ? (storeNameMap.get(String(p.REQUEST_STORE_ID)) ?? "") : ""),
          REFERENCE_TYPE_ID: p.REFERENCE_TYPE_ID != null ? Number(p.REFERENCE_TYPE_ID) : undefined,
          REFERENCE_TYPE_NAME: p.REFERENCE_TYPE_NAME || "",
          /* The reference belongs to the quotation line. The backend re-derives
             it the same way from the linked request when it is blank. */
          REFERENCE_NO: (p.REFERENCE_NO || "").trim(),
          LINE_NO: 0,
          ITEM_TYPE: p.ITEM_TYPE || null,
          SOURCE_LINE_NO: p.LINE_NO != null ? Number(p.LINE_NO) : undefined,
          MAIN_CATEGORY_ID: p.MAIN_CATEGORY_ID != null ? Number(p.MAIN_CATEGORY_ID) : undefined,
          MAIN_CATEGORY_NAME: p.MAIN_CATEGORY_NAME || "",
          SUB_CATEGORY_ID: p.SUB_CATEGORY_ID != null ? Number(p.SUB_CATEGORY_ID) : undefined,
          SUB_CATEGORY_NAME: p.SUB_CATEGORY_NAME || "",
          PRODUCT_ID: p.PRODUCT_ID != null ? Number(p.PRODUCT_ID) : undefined,
          PRODUCT_NAME: p.PRODUCT_NAME || "",
          NO_OF_PCS_PER_PACKING: p.NO_OF_PCS_PER_PACKING ?? "",
          TOTAL_QUANTITY: p.TOTAL_QUANTITY ?? "",
          UOM_ID: p.UOM_ID != null ? Number(p.UOM_ID) : undefined,
          UOM_NAME: p.UOM_NAME || "",
          ALT_UOM_ID: p.ALT_UOM_ID != null ? Number(p.ALT_UOM_ID) : undefined,
          ALT_UOM_NAME: (p.ALT_UOM_NAME || "").trim()
            || (p.ALT_UOM_ID != null ? uomNameById.get(String(Number(p.ALT_UOM_ID))) ?? "" : ""),
          RATE: p.RATE ?? "",
          DISCOUNT_PERCENTAGE: p.DISCOUNT_PERCENTAGE ?? "",
          TAX_ID: p.TAX_ID != null ? Number(p.TAX_ID) : (hasDef ? Number(defTax.TAX_ID) : undefined),
          TAX_NAME: p.TAX_NAME || (hasDef ? defTax.TAX_NAME || "" : ""),
          TAX_PERCENTAGE: p.TAX_PERCENTAGE ?? (hasDef ? taxPct(defTax) : ""),
          EXCHANGE_RATE: p.EXCHANGE_RATE ?? "",
          REQUIRED_DATE: fmtDate(p.REQUIRED_DATE) || form.DELIVERY_DATE || qHdr?.DELIVERY_DATE || "",
          REASON: p.REASON || "",
          REMARKS: p.REMARKS || "",
          STATUS_ENTRY: "AC",
        });
      }

      setDtls((prev) => renumberDtls([...prev, ...newRows]));
      if (queuedForTax.length) {
        pendingTaxDefaults.current = new Set([...pendingTaxDefaults.current, ...queuedForTax]);
      }

      added = newRows.length;
      if (!added) {
        toast({
          title: skipped > 0
            ? "All lines of this Purchase Quotation are already added to this order"
            : "This Purchase Quotation has no detail lines",
          variant: "destructive",
          duration: DEFAULT_TOAST_DURATION,
        });
      } else {
        toast({
          title: `${added} line(s) added from ${quoteNo}${skipped ? ` - ${skipped} already added` : ""}`,
          duration: DEFAULT_TOAST_DURATION,
        });
        /* A fully imported quotation has nothing left to offer, so it drops out
           of the dropdown. Clearing the selection keeps the trigger in sync. */
        const total = Number(
          (Array.isArray(quoteOptions) ? quoteOptions : []).find(
            (o: any) => String(o.purchaseQuotationNo ?? "").trim() === quoteNo
          )?.detailLineCount
        );
        if (Number.isFinite(total) && total > 0 && added + skipped >= total) {
          setQuoteNo("");
          setPreviewOpen(false);
          setPreviewHdr(null);
          setPreviewLines([]);
        }
      }
    } catch (e: any) {
      toast({
        title: typeof e === "string" ? e : e?.message || "Failed to load quotation lines",
        variant: "destructive",
        duration: DEFAULT_TOAST_DURATION,
      });
    } finally {
      setLoadingQuote(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDtls([]);
    setDeletedIds([]);
    setStagedCharges([]);
    clearQuoteSelection();
    setStepErrors({});
    setLineErrors({});
    setFocusRequest(null);
    setDialogOpen(true);
  };

  const openEdit = async (item: any) => {
    setEditing(item);
    clearQuoteSelection();
    try {
      const refNo = item.purchaseOrderNo ?? item.PURCHASE_ORDER_NO;
      const hdr: any = await dispatch(fetchPurchaseOrderHdr(refNo)).unwrap();
      const toStr = (v: any) => (v == null || v === "" ? "" : String(v));
      const poQuoteNo = hdr.PURCHASE_QUOTATION_NO || "";
      setForm({
        PURCHASE_ORDER_NO: hdr.PURCHASE_ORDER_NO || refNo || "",
        PURCHASE_ORDER_DATE: fmtDate(hdr.PURCHASE_ORDER_DATE),
        /* Company / Branch are session-owned, so an edit shows the session values.
           PO Store is a fixed destination. */
        COMPANY_ID: sessionEmployeeDefaults.companyId != null ? String(sessionEmployeeDefaults.companyId) : "",
        SUPPLIER_BP_ID: toStr(hdr.SUPPLIER_BP_ID),
        BRANCH_ID: sessionEmployeeDefaults.branchId != null ? String(sessionEmployeeDefaults.branchId) : "",
        PO_STORE_ID: "",
        PURCHASE_QUOTATION_NO: poQuoteNo,
        PAYMENT_TERM_ID: toStr(hdr.PAYMENT_TERM_ID),
        PAYMENT_MODE_ID: toStr(hdr.PAYMENT_MODE_ID),
        SHIPMENT_MODE_ID: toStr(hdr.SHIPMENT_MODE_ID),
        DELIVERY_DATE: fmtDate(hdr.DELIVERY_DATE),
        DELIVERY_TERM: hdr.DELIVERY_TERM || "",
        DELIVERY_LOCATION_ID: toStr(hdr.DELIVERY_LOCATION_ID),
        CURRENCY_ID: toStr(hdr.CURRENCY_ID),
        EXCHANGE_RATE: hdr.EXCHANGE_RATE != null ? String(hdr.EXCHANGE_RATE) : "",
        PURCHASE_ORDER_STATUS_ID: toStr(hdr.PURCHASE_ORDER_STATUS_ID),
        SHIPMENT_REMARKS: hdr.SHIPMENT_REMARKS || "",
        REMARKS: hdr.REMARKS || "",
        STATUS_ENTRY: hdr.STATUS_ENTRY || "CF",
      });
      setQuoteNo(poQuoteNo);

      const dtlRows: any[] = await dispatch(fetchPurchaseOrderDtls(refNo)).unwrap();
      const rows = (dtlRows || []).map((d: any) => ({
        key: newKey(),
        PURCHASE_ORDER_DTL_ID: d.PURCHASE_ORDER_DTL_ID != null ? Number(d.PURCHASE_ORDER_DTL_ID) : undefined,
        PURCHASE_QUOTATION_NO: d.PURCHASE_QUOTATION_NO || "",
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
        ITEM_TYPE: d.ITEM_TYPE || null,
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
        /* SHOW_PURCHASE_ORDER_DTL returns no ALT_UOM_NAME, so the master name
           is resolved here, the same way new lines are resolved. */
        ALT_UOM_NAME: (d.ALT_UOM_NAME || "").trim()
          || (d.ALT_UOM_ID != null ? uomNameById.get(String(Number(d.ALT_UOM_ID))) ?? "" : ""),
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

  /* Save only. The status is never advanced from here: a new order is saved as
     DRAFT and the row's Submit action moves it to Submitted via the submit proc. */
  const handleSave = async () => {
    const { stepErrors, lineErrors, invalidFields } = validateOrder();
    setStepErrors(stepErrors);
    setLineErrors(lineErrors);
    setLineFieldErrors(invalidFields);
    const firstBad = SECTION_ORDER.find((k) => (stepErrors[k]?.length ?? 0) > 0);
    if (firstBad) {
      setActiveTab(PURCHASE_ORDER_TAB);
      const firstLine = Object.keys(lineErrors)[0];
      focusOn(firstBad === DTL_STEP && firstLine ? lineStepKey(firstLine) : firstBad);
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
      const { EXCHANGE_RATE: _shownRate, EXCHANGE_RATE_VALUES: _shownRates, ...sums } = rollup(
        dtls.map((r: any) => calcLine(r, form.EXCHANGE_RATE)),
      );
      void _shownRate;
      void _shownRates;

      const payload: Record<string, any> = {
        PURCHASE_ORDER_NO: editing
          ? String(editing.purchaseOrderNo ?? editing.PURCHASE_ORDER_NO)
          : "",
        PURCHASE_ORDER_DATE: form.PURCHASE_ORDER_DATE || null,
        PURCHASE_QUOTATION_NO: form.PURCHASE_QUOTATION_NO?.trim() || null,
        COMPANY_ID: nOrNull(form.COMPANY_ID),
        SUPPLIER_BP_ID: nOrNull(form.SUPPLIER_BP_ID),
        BRANCH_ID: nOrNull(form.BRANCH_ID),
        PO_STORE_ID: nOrNull(form.PO_STORE_ID),
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
        PURCHASE_ORDER_STATUS_ID: nOrNull(form.PURCHASE_ORDER_STATUS_ID),
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_ENTRY: form.STATUS_ENTRY || "CF",
        dtls: dtls.map((r: any) => {
          const c = calcLine(r, form.EXCHANGE_RATE);
          return {
            PURCHASE_ORDER_DTL_ID: r.PURCHASE_ORDER_DTL_ID || undefined,
            PURCHASE_QUOTATION_NO: r.PURCHASE_QUOTATION_NO || form.PURCHASE_QUOTATION_NO || null,
            PURCHASE_QUOTATION_DTL_ID: nOrNull(r.PURCHASE_QUOTATION_DTL_ID),
            PURCHASE_REQUEST_NO: r.PURCHASE_REQUEST_NO || null,
            PURCHASE_REQUEST_DTL_ID: nOrNull(r.PURCHASE_REQUEST_DTL_ID),
            CAMP_ID: nOrNull(r.CAMP_ID),
            REQUEST_STORE_ID: nOrNull(r.REQUEST_STORE_ID),
            REFERENCE_TYPE_ID: nOrNull(r.REFERENCE_TYPE_ID),
            REFERENCE_NO: r.REFERENCE_NO?.trim() || null,
            LINE_NO: nOrNull(r.LINE_NO),
            ITEM_TYPE: r.ITEM_TYPE || null,
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
        const res = await dispatch(updatePurchaseOrder(payload as PurchaseOrderGridData)).unwrap();
        toast({ title: res?.message ?? "Purchase Order updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addPurchaseOrder(payload as PurchaseOrderGridData)).unwrap();
        toast({ title: res?.message ?? "Purchase Order created successfully", duration: DEFAULT_TOAST_DURATION });
        /* Charges staged in Add mode have no ref no, so they are written now the
           header exists. Failures warn but never roll back the order. */
        const newRefNo = res?.PURCHASE_ORDER_NO;
        if (stagedCharges.length && newRefNo) {
          const failed: string[] = [];
          for (const c of stagedCharges) {
            try {
              const response = await fetch(`${API_URL}/purchase-order/charge`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...c, PURCHASE_ORDER_NO: newRefNo, STATUS_ENTRY: "CF" }),
              });
              const json = await response.json().catch(() => ({}));
              if (!response.ok) failed.push(`Line ${c?.LINE_NO ?? "-"}: ${json?.message || "failed"}`);
            } catch (err: any) {
              failed.push(`Line ${c?.LINE_NO ?? "-"}: ${err?.message || "failed"}`);
            }
          }
          if (failed.length) {
            toast({
              variant: "destructive",
              title: `${failed.length} additional charge${failed.length === 1 ? "" : "s"} could not be saved.`,
              description: failed.join(" · "),
              duration: DEFAULT_TOAST_DURATION,
            });
          }
          setStagedCharges([]);
        }
      }
      setDialogOpen(false);
      setStepErrors({});
      setLineErrors({});
      setFocusRequest(null);
      dispatch(fetchPurchaseOrders());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : e?.message || "Error saving purchase order", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deletePurchaseOrderHdr(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Purchase Order deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchPurchaseOrders());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : e?.message || "Error deleting purchase order", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleSubmitRow = async (row: any) => {
    const refNo = row?.purchaseOrderNo ?? row?.PURCHASE_ORDER_NO;
    if (!refNo) return;
    if (submittingRef === refNo) return;
    /* Mirrors SUBMIT_PURCHASE_QUOTATION: no uploaded document means the order
       cannot be submitted yet, so the click is refused with a reason instead of
       a silent no-op from the SP. */
    if (!row?.hasDocument) {
      toast({
        title: "Upload the purchase order document first (Documents tab).",
        variant: "destructive",
        duration: DEFAULT_TOAST_DURATION,
      });
      return;
    }
    setSubmittingRef(refNo);
    try {
      const res = await dispatch(submitPurchaseOrder({ refNo })).unwrap();
      toast({
        title: res?.message ?? "Purchase Order submitted",
        duration: DEFAULT_TOAST_DURATION,
      });
      dispatch(fetchPurchaseOrders());
    } catch (e: any) {
      toast({
        title: typeof e === "string" ? e : e?.message || "Error submitting purchase order",
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
      title: "Quantity & Pricing",
      fields: [
        { key: "LINE_NO", label: "Line No", kind: "computed", hint: "auto", display: (r: any) => r.LINE_NO ?? "-" },
        { key: "REFERENCE_NO", label: "Reference No", kind: "text", maxLength: 50, placeholder: "Ref no",
          /* Locked when the line came from a quotation, because the value is the
             quotation's (ultimately the request's). */
          disabled: (r: any) => r.PURCHASE_QUOTATION_DTL_ID != null || !!r.PURCHASE_QUOTATION_NO,
          hint: "from quotation" },
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
      title: "From Purchase Quotation",
      fields: [
        {
          key: "PURCHASE_QUOTATION_NO",
          label: "Purchase Quotation",
          kind: "readOnly",
          display: (r: any) =>
            r.PURCHASE_QUOTATION_NO
              ? `${r.PURCHASE_QUOTATION_NO}${r.SOURCE_LINE_NO != null ? ` (quote line ${r.SOURCE_LINE_NO})` : ""}`
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
        { key: "ALT_UOM", label: "Alt UOM", kind: "readOnly", display: (r: any) => r.ALT_UOM_NAME || (r.ALT_UOM_ID != null ? uomNameById.get(String(r.ALT_UOM_ID)) ?? "" : "") || (r.ALT_UOM_ID ?? "-") },
      ],
    },
    {
      title: "Totals in LC",
      fields: [
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
      /* PO Store is a fixed destination - it only ever reads "PURCHASE STORE". */
      PO_STORE_ID: "PURCHASE STORE",
      PURCHASE_QUOTATION_NO: form.PURCHASE_QUOTATION_NO || "",
      PURCHASE_ORDER_STATUS_ID: pick(poStatusOptions, form.PURCHASE_ORDER_STATUS_ID),
      PAYMENT_TERM_ID: pick(paymentTermOptions, form.PAYMENT_TERM_ID),
      PAYMENT_MODE_ID: pick(paymentModeOptions, form.PAYMENT_MODE_ID),
      SHIPMENT_MODE_ID: pick(shipmentModeOptions, form.SHIPMENT_MODE_ID),
      DELIVERY_LOCATION_ID: pick(locationOptions, form.DELIVERY_LOCATION_ID),
      CURRENCY_ID: pick(currencyOptions, form.CURRENCY_ID),
      STATUS_ENTRY: entryLabel(form.STATUS_ENTRY),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, supplierOptions, companyOptions, branchOptions, poStatusOptions, paymentTermOptions, paymentModeOptions, shipmentModeOptions, locationOptions, currencyOptions]);

  const validateOrder = (): {
    stepErrors: StepErrors;
    lineErrors: StepErrors;
    invalidFields: Record<string, string[]>;
  } => {
    const out: StepErrors = {};
    const lines: StepErrors = {};
    const invalidFields: Record<string, string[]> = {};
    const push = (key: string, message: string) => {
      if (!out[key]) out[key] = [];
      out[key].push(message);
    };
    const pushLine = (lineKey: string, message: string) => {
      if (!lines[lineKey]) lines[lineKey] = [];
      lines[lineKey].push(message);
    };

    if (!form.PURCHASE_ORDER_DATE) push(HDR_STEP, "Purchase Order Date is required");
    if (!form.PURCHASE_QUOTATION_NO) push(HDR_STEP, "Please select a Purchase Quotation");
    if (!form.SUPPLIER_BP_ID) push(HDR_STEP, "Please select a Supplier");
    if (!form.CURRENCY_ID) push(HDR_STEP, "Please select a Currency");
    if (!(toNum(form.EXCHANGE_RATE) > 0)) push(HDR_STEP, "Exchange Rate must be greater than 0");

    if (dtls.length === 0) push(REVIEW_STEP, "At least one purchase order line is required");

    const lineNos = dtls.map((r: any) => String(r.LINE_NO ?? ""));
    if (new Set(lineNos).size !== lineNos.length) {
      push(REVIEW_STEP, "Line No must be unique within the same Purchase Order");
    }
    const dup = dtls.find((r: any, i: number) =>
      dtls.findIndex((o: any) =>
        o.PURCHASE_QUOTATION_DTL_ID != null &&
        String(o.PURCHASE_QUOTATION_DTL_ID) === String(r.PURCHASE_QUOTATION_DTL_ID)
      ) !== i
    );
    if (dup) {
      push(REVIEW_STEP, `Purchase Quotation line already ordered on Line ${dup.LINE_NO}`);
    }

    dtls.forEach((r: any) => {
      const problems: string[] = [];

      if (!r.PRODUCT_ID) {
        problems.push(
          r.PRODUCT_NAME
            ? `Product id missing for "${r.PRODUCT_NAME}" - remove this line and add it again`
            : "Product is required",
        );
      }
      if (!(toNum(r.TOTAL_QUANTITY) > 0)) problems.push("Quantity must be greater than 0");

      const rateMissing = r.RATE === "" || r.RATE === null || r.RATE === undefined;
      const rateNegative = toNum(r.RATE) < 0;
      if (rateMissing) problems.push("Rate is required");
      else if (rateNegative) problems.push("Rate cannot be negative");

      if (problems.length > 0) {
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
          <h1 className="text-2xl font-bold text-foreground">Purchase Order</h1>
          <p className="text-sm text-muted-foreground">Manage purchase order header and detail data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Purchase Order
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search purchase orders..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Order No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Order Date</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Quote No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Supplier</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Branch</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">PURCHASE STORE</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Delivery</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Final Amount (LC)</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Order Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Final Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs whitespace-nowrap">Status Entry</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => {
                  const refNo = item.purchaseOrderNo ?? item.PURCHASE_ORDER_NO;
                  const isSubmitting = submittingRef === refNo;
                  const isSubmitted = String(item.statusEntry ?? "").trim().toUpperCase() === "CL";
                  /* A missing document does NOT disable the button - the click is
                     refused with a message instead, so the user knows why. */
                  const lacksDocument = !item.hasDocument;
                  return (
                  <tr key={item.id || idx} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                      {isAdmin && <button onClick={() => setDeleteId(refNo)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>}
                      <button
                        onClick={() => handleSubmitRow(item)}
                        disabled={isSubmitting || isSubmitted}
                        title={
                          lacksDocument
                            ? "Upload the purchase order document first (Documents tab)"
                            : isSubmitted
                              ? "Already submitted"
                              : "Submit purchase order"
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
                    <td className="p-3 font-medium">{item.purchaseOrderNo || "-"}</td>
                    <td className="p-3">{formatDate(item.purchaseOrderDate)}</td>
                    <td className="p-3">{item.purchaseQuotationNo || "-"}</td>
                    <td className="p-3">{item.supplierName || "-"}</td>
                    <td className="p-3">{item.companyName || "-"}</td>
                    <td className="p-3">{item.branchName || "-"}</td>
                    <td className="p-3">PURCHASE STORE</td>
                    <td className="p-3">{item.deliveryLocationName || "-"}</td>
                    <td className="p-3 font-medium">{money(item.finalProductHdrAmountLc)}</td>
                    <td className="p-3">{item.purchaseOrderStatusName || "-"}</td>
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
                  <tr><td colSpan={13} className="p-8 text-center text-muted-foreground">No purchase orders found</td></tr>
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
            /* A cancelled/closed dialog must not leak staged charges into the
               next open; a successful save already flushed and cleared them. */
            setStagedCharges([]);
          }
          if (v) {
            setActiveTab(PURCHASE_ORDER_TAB);
          }
          setDialogOpen(v);
        }}
        title={
        editing
          ? `Edit Purchase Order (${editing.purchaseOrderNo ?? editing.PURCHASE_ORDER_NO})`
          : "Add Purchase Order"
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-4">
          <TabsList className="w-full flex-wrap">
            <TabsTrigger value={PURCHASE_ORDER_TAB}>Purchase Order</TabsTrigger>
            <TabsTrigger value={DOCUMENTS_TAB}>
              Documents
              {currentPoNo && (
                <span className="ml-1.5 text-[9px] font-semibold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                  {currentPoNo}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value={CHARGES_TAB}>Additional Charges</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={PURCHASE_ORDER_TAB} className="space-y-6 mt-0">
        <WizardSection
          stepKey={HDR_STEP}
          title="Purchase Order Header Information"
          subtitle="Dates, supplier, quotation, currency and delivery"
          errors={stepErrors[HDR_STEP]}
        >

          <div className="grid grid-cols-2 gap-4">
            {renderField("PURCHASE_ORDER_DATE", "Order Date", "date", undefined, true)}
            {renderField("SUPPLIER_BP_ID", "Supplier", "select", supplierOptions, true, "Select supplier")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField("COMPANY_ID", "Company", "select", companyOptions, true, "No company mapped to your login", true, "from your login")}
            {renderField("BRANCH_ID", "Branch", "select", branchOptions, false, "No branch mapped to your login", true, "from your login")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">
                PO Store
                <span className="text-muted-foreground font-normal ml-1">(fixed)</span>
              </Label>
              <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-xs font-medium">
                PURCHASE STORE
              </div>
            </div>
            {renderField("PURCHASE_ORDER_STATUS_ID", "Order Status", "select", poStatusOptions, false, undefined, true, "set by the workflow")}
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
          <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-xs font-semibold text-foreground">Lines from Purchase Quotation</h4>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {dtls.length} line{dtls.length === 1 ? "" : "s"} added
              </span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex flex-col gap-2 w-full lg:w-80 shrink-0">
                <div className="flex flex-col gap-1.5 w-full">
                  <Label className="text-xs">Purchase Quotation</Label>
                  <Select value={quoteNo} onValueChange={onQuoteNoChange}>
                    <SelectTrigger className="!h-9 text-xs">
                      <SelectValue placeholder="Select purchase quotation" />
                    </SelectTrigger>
                    <SelectContent>
                      {effectiveQuoteOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          <span className="block">{o.label}</span>
                          {o.summary ? (
                            <span className="mt-0.5 block w-full rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground leading-snug">
                              {o.summary}
                            </span>
                          ) : null}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={addLinesFromQuotation}
                  disabled={loadingQuote || !quoteNo}
                  className="h-9 w-full text-xs"
                >
                  {loadingQuote ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1" />}
                  {loadingQuote ? "Loading..." : "Add Lines from Quotation"}
                </Button>
              </div>

              <div className="min-w-0 flex-1">
                {previewOpen ? (
                  <div className="rounded-lg border bg-card shadow-sm">
                    <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                      <h5 className="text-xs font-semibold text-foreground">Review in Purchase Quotation</h5>
                      {!previewLoading ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {previewLines.length} line{previewLines.length === 1 ? "" : "s"}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                        </span>
                      )}
                    </div>
                    <div className="border-b px-3 py-1.5 text-[11px] text-muted-foreground">
                      Delivery Location:{" "}
                      <span className="font-medium text-foreground">{previewDeliveryName || "-"}</span>
                    </div>
                    {previewLoading ? (
                      <div className="flex items-center justify-center gap-2 px-3 py-6 text-xs text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading quotation lines...
                      </div>
                    ) : previewLines.length === 0 ? (
                      <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                        This quotation has no detail lines.
                      </p>
                    ) : (
                      <div className="max-h-72 overflow-auto">
                        <table className="w-full text-[11px]">
                          <thead className="sticky top-0 bg-muted/60 text-muted-foreground">
                            <tr>
                              <th className="px-2 py-1.5 text-left font-medium whitespace-nowrap">Line</th>
                              <th className="px-2 py-1.5 text-left font-medium whitespace-nowrap">Ref Type</th>
                              <th className="px-2 py-1.5 text-left font-medium whitespace-nowrap">Main Category</th>
                              <th className="px-2 py-1.5 text-left font-medium whitespace-nowrap">Sub Category</th>
                              <th className="px-2 py-1.5 text-left font-medium whitespace-nowrap">Product</th>
                              <th className="px-2 py-1.5 text-right font-medium whitespace-nowrap">Qty</th>
                              <th className="px-2 py-1.5 text-right font-medium whitespace-nowrap">Pcs/Packing</th>
                              <th className="px-2 py-1.5 text-left font-medium whitespace-nowrap">UOM</th>
                              <th className="px-2 py-1.5 text-right font-medium whitespace-nowrap">Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewLines.map((r: any, idx: number) => (
                              <tr key={String(r.PURCHASE_QUOTATION_DTL_ID ?? r.ID ?? idx)} className="border-t">
                                <td className="px-2 py-1.5 whitespace-nowrap">{r.LINE_NO ?? "-"}</td>
                                <td className="px-2 py-1.5 whitespace-nowrap">{r.REFERENCE_TYPE_NAME || (r.REFERENCE_TYPE_ID ?? "-")}</td>
                                <td className="px-2 py-1.5 whitespace-nowrap">{r.MAIN_CATEGORY_NAME || (r.MAIN_CATEGORY_ID ?? "-")}</td>
                                <td className="px-2 py-1.5 whitespace-nowrap">{r.SUB_CATEGORY_NAME || (r.SUB_CATEGORY_ID ?? "-")}</td>
                                <td className="px-2 py-1.5 min-w-[120px]">{r.PRODUCT_NAME || (r.PRODUCT_ID ?? "-")}</td>
                                <td className="px-2 py-1.5 whitespace-nowrap text-right">{previewQty(r.TOTAL_QUANTITY)}</td>
                                <td className="px-2 py-1.5 whitespace-nowrap text-right">{r.NO_OF_PCS_PER_PACKING ?? "-"}</td>
                                <td className="px-2 py-1.5 whitespace-nowrap">{r.UOM_NAME || (r.UOM_ID ?? "-")}</td>
                                <td className="px-2 py-1.5 whitespace-nowrap text-right">{money(r.RATE)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              {effectiveQuoteOptions.length === 0 && quoteOptions
                ? allQuotesFullyOrdered
                  ? "Every eligible Purchase Quotation is already ordered"
                  : "No Purchase Quotation is available to order"
                : "Only submitted Purchase Quotations that are not already ordered are listed"}
            </p>
          </div>
        </WizardSection>

        <WizardSection
          stepKey={DTL_STEP}
          title="Purchase Order Lines"
          subtitle="Pulled from the Purchase Quotation selected above. Line numbers are automatic."
          errors={stepErrors[DTL_STEP]}
        >
          {dtls.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              No lines yet. Select a Purchase Quotation in the Lines from Purchase Quotation panel
              above, then use Add Lines from Quotation.
            </p>
          ) : (
            <div className="space-y-3">
              {computed.map((row: any) => (
                <DetailLineCard
                  key={row.key}
                  anchor={lineStepKey(row.key)}
                  title={`Line ${row.LINE_NO ?? "?"}${row.PRODUCT_NAME ? ` - ${row.PRODUCT_NAME}` : ""}`}
                  subtitle={
                    row.PURCHASE_QUOTATION_NO
                      ? `From ${row.PURCHASE_QUOTATION_NO}${row.SOURCE_LINE_NO != null ? ` quote line ${row.SOURCE_LINE_NO}` : ""}`
                      : "No linked quotation line"
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
          <PurchaseOrderReview
            form={form}
            headerLabels={headerLabels}
            totals={totals}
            money={money}
            rate6={rate6}
          />
        </WizardSection>
        </TabsContent>

        <TabsContent value={DOCUMENTS_TAB} className="space-y-6 mt-0">
          <div className="rounded-lg border p-4 bg-card">
            <p className="text-xs text-muted-foreground mb-3">
              A document is required before this order can be submitted for approval.
            </p>
            <AttachmentsPanel
              linkPagesId={linkPagesId}
              entityRefNo={currentPoNo}
              entityLabel="Purchase Order"
              title="Documents / Attachments"
              emptyMessage="No documents attached to this Purchase Order"
              allowUpload={!!currentPoNo}
              allowEdit={!!currentPoNo}
              allowDelete={!!currentPoNo && isAdmin}
              /* Refresh the grid so the row's hasDocument reflects the upload and
                 Submit stops refusing with "upload the document first". */
              onChange={() => dispatch(fetchPurchaseOrders())}
            />
          </div>
        </TabsContent>

        <TabsContent value={CHARGES_TAB} className="space-y-6 mt-0">
          <div className="rounded-lg border p-4 bg-card">
            <p className="text-xs text-muted-foreground mb-3">
              Non-product costs (freight, insurance, packing, customs, delivery) added to this
              order. Amounts are recomputed from quantity, rate, tax and the exchange rate
              when saved.
            </p>
            <AdditionalChargesPanel
              entityRefNo={currentPoNo}
              defaultExchangeRate={form.EXCHANGE_RATE}
              isAdmin={isAdmin}
              charges={stagedCharges}
              onChargesChange={setStagedCharges}
            />
          </div>
        </TabsContent>
      </Tabs>
    </WizardShell>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this purchase order along with all its detail lines.
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