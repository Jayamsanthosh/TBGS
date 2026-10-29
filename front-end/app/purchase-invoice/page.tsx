"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Search, Pencil, Trash2, Loader2, FileText, MessageSquare } from "lucide-react";
import PurchaseInvoiceReview from "./purchase-invoice-review";
import WizardShell from "@/components/wizard/WizardShell";
import WizardSection from "@/components/wizard/WizardSection";
import DetailLineCard from "@/components/wizard/DetailLineCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AttachmentsPanel, { type PendingAttachment } from "@/components/AttachmentsPanel";
import { DMS_LINK_ID } from "@/lib/dmsSlice";
import AdditionalChargesPanel from "./additional-charges-panel";
import InvoiceConversationPanel from "./conversation-panel";
import ConversationDialog from "./conversation-dialog";
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
  fetchPurchaseInvoices,
  addPurchaseInvoice,
  updatePurchaseInvoice,
  deletePurchaseInvoiceHdr,
  fetchPurchaseInvoiceHdr,
  fetchPurchaseInvoiceDtls,
  loadPurchaseInvoiceSourceOrders,
  clearPurchaseInvoiceMasterError,
  PurchaseInvoiceGridData,
} from "@/lib/purchaseInvoiceMasterSlice";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const INVOICE_TAB = "purchase-invoice";
const DOCUMENTS_TAB = "documents";
const CHARGES_TAB = "additional-charges";
const CONVERSATION_TAB = "conversation";

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

/* Status Entry has no submission flow here - every record is created with CF,
   so a new invoice reads as Pending for Submitted rather than leaking a raw
   Draft / Inactive code. Mirrors the Purchase GRN / Opening Stock screens. */
const entryLabel = (s: any) => {
  const v = String(s).toUpperCase();
  return v === "CL" || v === "SUBMITTED" ? "Submitted" : "Pending for Submitted";
};

const entryBadgeClass = (s: any) => {
  const v = String(s).toUpperCase();
  return v === "CL" || v === "SUBMITTED"
    ? "bg-green-500/10 text-green-600 border-green-200"
    : "bg-orange-500/10 text-orange-600 border-orange-200";
};

const toNum = (v: any): number => {
  if (v === "" || v === null || v === undefined) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const calcLine = (row: any, headerRate: any) => {
  const qty = toNum(row.INVOICED_QUANTITY);
  const rate = toNum(row.RATE_FC);
  const discPct = toNum(row.DISCOUNT_PERCENTAGE);
  const taxPct = toNum(row.TAX_PERCENTAGE);
  const exRate = toNum(headerRate) > 0 ? toNum(headerRate) : toNum(row.EXCHANGE_RATE);

  const subFc = r3(qty * rate);
  const discFc = r3((subFc * discPct) / 100);
  const prodFc = r3(subFc - discFc);
  const taxFc = r3((prodFc * taxPct) / 100);
  const finalFc = r3(prodFc + taxFc);

  return {
    EXCHANGE_RATE: exRate,
    SUB_TOTAL_AMOUNT_FC: subFc,
    DISCOUNT_AMOUNT_FC: discFc,
    TOTAL_PRODUCT_AMOUNT_FC: prodFc,
    TAX_AMOUNT_FC: taxFc,
    FINAL_AMOUNT_FC: finalFc,
    SUB_TOTAL_AMOUNT_LC: r3(subFc * exRate),
    DISCOUNT_AMOUNT_LC: r3(discFc * exRate),
    TOTAL_PRODUCT_AMOUNT_LC: r3(prodFc * exRate),
    TAX_AMOUNT_LC: r3(taxFc * exRate),
    FINAL_AMOUNT_LC: r3(finalFc * exRate),
  };
};

const rollup = (rows: any[], additional: { fc: number; lc: number; taxFc: number; taxLc: number }) => {
  const s = (k: string) => r3(rows.reduce((a, r) => a + toNum(r[k]), 0));
  const productTaxFc = s("TAX_AMOUNT_FC");
  const productTaxLc = s("TAX_AMOUNT_LC");
  const taxFc = r3(productTaxFc + additional.taxFc);
  const taxLc = r3(productTaxLc + additional.taxLc);
  return {
    TOTAL_SUB_TOTAL_HDR_AMOUNT_FC: s("SUB_TOTAL_AMOUNT_FC"),
    TOTAL_DISCOUNT_HDR_AMOUNT_FC: s("DISCOUNT_AMOUNT_FC"),
    TOTAL_ADDITIONAL_COST_AMOUNT_FC: additional.fc,
    TOTAL_PRODUCT_HDR_AMOUNT_FC: s("TOTAL_PRODUCT_AMOUNT_FC"),
    TOTAL_TAX_HDR_AMOUNT_FC: taxFc,
    FINAL_PRODUCT_HDR_AMOUNT_FC: r3(s("TOTAL_PRODUCT_AMOUNT_FC") + taxFc + additional.fc),
    TOTAL_SUB_TOTAL_HDR_AMOUNT_LC: s("SUB_TOTAL_AMOUNT_LC"),
    TOTAL_DISCOUNT_HDR_AMOUNT_LC: s("DISCOUNT_AMOUNT_LC"),
    TOTAL_ADDITIONAL_COST_AMOUNT_LC: additional.lc,
    TOTAL_PRODUCT_HDR_AMOUNT_LC: s("TOTAL_PRODUCT_AMOUNT_LC"),
    TOTAL_TAX_HDR_AMOUNT_LC: taxLc,
    FINAL_PRODUCT_HDR_AMOUNT_LC: r3(s("TOTAL_PRODUCT_AMOUNT_LC") + taxLc + additional.lc),
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

export default function PurchaseInvoicePage() {
  const dispatch = useAppDispatch();
  const { items, options: sourceOrders, loading, error } = useAppSelector((s) => s.purchaseInvoiceMaster);
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const activeCompanyId = user?.context?.companyId ?? user?.companies?.[0]?.companyId ?? null;
  const sessionEmployee = user?.employee ?? null;
  const sessionDefaults = useMemo(
    () => ({
      companyId: sessionEmployee?.companyId ?? activeCompanyId ?? null,
      branchId:
        sessionEmployee?.branchId ??
        user?.context?.branchId ??
        user?.companies?.[0]?.branchId ??
        null,
      campId: sessionEmployee?.campId ?? user?.context?.campId ?? null,
      storeId: sessionEmployee?.storeId ?? user?.context?.storeId ?? null,
    }),
    [
      sessionEmployee?.companyId,
      sessionEmployee?.branchId,
      sessionEmployee?.campId,
      sessionEmployee?.storeId,
      user?.context,
      user?.companies,
      activeCompanyId,
    ]
  );

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseInvoiceGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [stepErrors, setStepErrors] = useState<StepErrors>({});
  const [lineErrors, setLineErrors] = useState<StepErrors>({});
  const [lineFieldErrors, setLineFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dtls, setDtls] = useState<any[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [poNo, setPoNo] = useState<string>("");
  const [loadingPo, setLoadingPo] = useState(false);
  const [previewHdr, setPreviewHdr] = useState<any>(null);
  const [previewLines, setPreviewLines] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(INVOICE_TAB);
  const [stagedCharges, setStagedCharges] = useState<any[]>([]);
  const [savedCharges, setSavedCharges] = useState<any[]>([]);
  const [pendingDocs, setPendingDocs] = useState<PendingAttachment[]>([]);
  const [focusRequest, setFocusRequest] = useState<{ key: string; nonce: number } | null>(null);
  const [conversationFor, setConversationFor] = useState<{ refNo: string; statusEntry?: string } | null>(null);

  const linkPagesId = useLinkPagesId(286);
  const currentRef =
    form.PURCHASE_INVOICE_REF_NO ||
    editing?.purchaseInvoiceRefNo ||
    editing?.PURCHASE_INVOICE_REF_NO ||
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

  const { data: companies } = useApiQuery("invoice-master-companies", () => fetchList(`${API_URL}/company-master`));
  const { data: branches } = useApiQuery("invoice-master-branches", () => fetchList(`${API_URL}/branch-master?status=AC`));
  const { data: stores } = useApiQuery("invoice-master-stores", () => fetchList(`${API_URL}/store-master`));
  const { data: camps } = useApiQuery("invoice-master-camps", () => fetchList(`${API_URL}/camp-master`));
  const { data: suppliers } = useApiQuery("invoice-master-suppliers", () => fetchList(`${API_URL}/business-partner-master?status=AC`));
  const { data: paymentTerms } = useApiQuery("invoice-master-payment-terms", () => fetchList(`${API_URL}/payment-term-master`));
  const { data: paymentModes } = useApiQuery("invoice-master-payment-modes", () => fetchList(`${API_URL}/payment-mode-master`));
  const { data: taxes } = useApiQuery("invoice-master-taxes", () => fetchList(`${API_URL}/tax-master`));
  const { data: currencies } = useApiQuery("invoice-master-currencies", () => fetchList(`${API_URL}/currency-master`));
  const { data: uoms } = useApiQuery("invoice-master-uoms", () => fetchList(`${API_URL}/uom-master`));

  useEffect(() => {
    dispatch(loadPurchaseInvoiceSourceOrders({}));
  }, [dispatch]);

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
  const campOptions = useMemo(() => opt(camps, "CAMP_ID", "CAMP_NAME"), [camps]);
  const storeOptions = useMemo(() => opt(stores, "STORE_ID", "STORE_NAME"), [stores]);
  const paymentTermOptions = useMemo(() => opt(paymentTerms, "PAYMENT_TERM_ID", "PAYMENT_TERM_NAME"), [paymentTerms]);
  const paymentModeOptions = useMemo(() => opt(paymentModes, "PAYMENT_MODE_ID", "PAYMENT_MODE_NAME"), [paymentModes]);
  const taxOptions = useMemo(() => opt(taxes, "TAX_ID", "TAX_NAME"), [taxes]);
  const currencyOptions = useMemo(() => opt(currencies, "CURRENCY_ID", "CURRENCY_NAME"), [currencies]);
  const supplierOptions = useMemo(
    () =>
      (Array.isArray(suppliers) ? suppliers : [])
        .filter((r: any) => String(r.BP_TYPE ?? "").trim().toLowerCase() === "supplier")
        .map((r: any) => ({ value: String(r.BP_ID ?? ""), label: String(r.BP_NAME ?? "") }))
        .filter((o: any) => o.value && o.label),
    [suppliers]
  );

  const importedIds = useMemo(
    () => new Set(dtls.map((r: any) => String(r.PURCHASE_ORDER_DTL_ID ?? "")).filter(Boolean)),
    [dtls]
  );

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

  const computed = useMemo(
    () => dtls.map((r: any) => ({ ...r, ...calcLine(r, form.EXCHANGE_RATE) })),
    [dtls, form.EXCHANGE_RATE]
  );

  const additional = useMemo(() => {
    const rows = stagedCharges.length ? stagedCharges : savedCharges;
    let fc = 0, lc = 0, taxFc = 0, taxLc = 0;
    for (const r of rows) {
      const amountFc = r.AMOUNT_FC != null ? toNum(r.AMOUNT_FC) : r3(toNum(r.QUANTITY) * toNum(r.RATE_FC));
      const rowTaxFc = r.TAX_AMOUNT_FC != null
        ? toNum(r.TAX_AMOUNT_FC)
        : r3((amountFc * toNum(r.TAX_PERCENTAGE)) / 100);
      const exRate = toNum(r.EXCHANGE_RATE) > 0 ? toNum(r.EXCHANGE_RATE) : toNum(form.EXCHANGE_RATE);
      fc = r3(fc + amountFc);
      taxFc = r3(taxFc + rowTaxFc);
      lc = r3(lc + (r.AMOUNT_LC != null ? toNum(r.AMOUNT_LC) : r3(amountFc * exRate)));
      taxLc = r3(taxLc + (r.TAX_AMOUNT_LC != null ? toNum(r.TAX_AMOUNT_LC) : r3(rowTaxFc * exRate)));
    }
    return { fc, lc, taxFc, taxLc };
  }, [stagedCharges, savedCharges, form.EXCHANGE_RATE]);

  const totals = useMemo(() => rollup(computed, additional), [computed, additional]);

  useEffect(() => {
    dispatch(fetchPurchaseInvoices());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearPurchaseInvoiceMasterError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((d: any) => {
      const searchable = [
        d.purchaseInvoiceRefNo,
        d.purchaseOrderNo,
        d.supplierInvoiceNo,
        d.supplierName,
        d.companyName,
        d.branchName,
        d.storeName,
        d.campName,
      ].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => ((b.sno || 0) - (a.sno || 0)));
  }, [items, search]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;
  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);
  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  const newKey = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random();

  const emptyForm = () => ({
    PURCHASE_INVOICE_DATE: fmtDate(new Date()),
    SUPPLIER_INVOICE_NO: "",
    SUPPLIER_INVOICE_DATE: "",
    PURCHASE_ORDER_NO: "",
    COMPANY_ID: sessionDefaults.companyId != null ? String(sessionDefaults.companyId) : "",
    BRANCH_ID: sessionDefaults.branchId != null ? String(sessionDefaults.branchId) : "",
    CAMP_ID: sessionDefaults.campId != null ? String(sessionDefaults.campId) : "",
    STORE_ID: sessionDefaults.storeId != null ? String(sessionDefaults.storeId) : "",
    SUPPLIER_BP_ID: "",
    CURRENCY_ID: "",
    EXCHANGE_RATE: "",
    PAYMENT_TERM_ID: "",
    PAYMENT_MODE_ID: "",
    DUE_DATE: "",
    REMARKS: "",
    STATUS_ENTRY: "CF",
  });

  const updateForm = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

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
      return { ...r, [field]: value };
    }));
  };

  const renumber = (rows: any[]) => rows.map((r, i) => ({ ...r, LINE_NO: i + 1 }));

  const removeDtl = (key: string) => {
    const row = dtls.find((r) => r.key === key);
    if (row?.PURCHASE_INVOICE_DTL_ID) {
      setDeletedIds((d) => [...d, Number(row.PURCHASE_INVOICE_DTL_ID)]);
    }
    setDtls((prev) => renumber(prev.filter((r) => r.key !== key)));
  };

  const loadSourceOrder = async (value: string) => {
    if (!value) {
      setPoNo("");
      setPreviewHdr(null);
      setPreviewLines([]);
      return;
    }
    setPoNo(value);
    setForm((prev) => ({ ...prev, PURCHASE_ORDER_NO: value }));
    setLoadingPo(true);
    try {
      const response = await fetch(`${API_URL}/purchase-invoice/source-order/${encodeURIComponent(value)}`);
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json?.message || "Failed to load purchase order");
      const src = json.data || {};
      setPreviewHdr(src.header || null);
      setPreviewLines(Array.isArray(src.dtls) ? src.dtls : []);

      if (!editing && src.header) {
        const h = src.header;
        const first = (src.dtls || [])[0] || {};
        const toStr = (x: any) => (x == null || x === "" ? "" : String(x));
        setForm((prev) => ({
          ...prev,
          PURCHASE_ORDER_NO: value,
          STORE_ID: prev.STORE_ID || toStr(h.STORE_ID),
          CAMP_ID: prev.CAMP_ID || toStr(first.CAMP_ID),
          SUPPLIER_BP_ID: prev.SUPPLIER_BP_ID || toStr(h.SUPPLIER_BP_ID),
          CURRENCY_ID: prev.CURRENCY_ID || toStr(h.CURRENCY_ID),
          EXCHANGE_RATE: prev.EXCHANGE_RATE || (h.EXCHANGE_RATE != null ? String(h.EXCHANGE_RATE) : ""),
          PAYMENT_TERM_ID: prev.PAYMENT_TERM_ID || toStr(h.PAYMENT_TERM_ID),
          PAYMENT_MODE_ID: prev.PAYMENT_MODE_ID || toStr(h.PAYMENT_MODE_ID),
        }));
      }
    } catch (e: any) {
      toast({
        title: typeof e === "string" ? e : e?.message || "Failed to load purchase order",
        variant: "destructive",
        duration: DEFAULT_TOAST_DURATION,
      });
      setPreviewHdr(null);
      setPreviewLines([]);
    } finally {
      setLoadingPo(false);
    }
  };

  const addLinesFromPo = () => {
    if (!poNo) {
      toast({ title: "Please select a Purchase Order", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!previewHdr) {
      toast({ title: "Load the Purchase Order first", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    let added = 0;
    let skipped = 0;
    const rows: any[] = [];
    const taxDefaults: string[] = [];
    const defTax = (Array.isArray(taxes) ? taxes : [])[0];
    const hasDefTax = !!(defTax && defTax.TAX_ID != null);

    for (const p of previewLines) {
      const remaining = toNum(p.REMAINING_QUANTITY);
      if (remaining <= 0) continue;
      if (p.PURCHASE_ORDER_DTL_ID != null && importedIds.has(String(p.PURCHASE_ORDER_DTL_ID))) {
        skipped += 1;
        continue;
      }
      const key = newKey();
      if (p.TAX_ID == null && !hasDefTax) taxDefaults.push(key);
      rows.push({
        key,
        PURCHASE_INVOICE_DTL_ID: undefined,
        PURCHASE_ORDER_NO: poNo,
        PURCHASE_ORDER_DTL_ID: p.PURCHASE_ORDER_DTL_ID != null ? Number(p.PURCHASE_ORDER_DTL_ID) : undefined,
        CAMP_ID: p.CAMP_ID != null ? Number(p.CAMP_ID) : (form.CAMP_ID ? Number(form.CAMP_ID) : undefined),
        STORE_ID: p.STORE_ID != null ? Number(p.STORE_ID) : (form.STORE_ID ? Number(form.STORE_ID) : undefined),
        MAIN_CATEGORY_ID: p.MAIN_CATEGORY_ID != null ? Number(p.MAIN_CATEGORY_ID) : undefined,
        SUB_CATEGORY_ID: p.SUB_CATEGORY_ID != null ? Number(p.SUB_CATEGORY_ID) : undefined,
        PRODUCT_ID: p.PRODUCT_ID != null ? Number(p.PRODUCT_ID) : undefined,
        PRODUCT_NAME: p.PRODUCT_NAME || "",
        NO_OF_PCS_PER_PACKING: p.NO_OF_PCS_PER_PACKING ?? "",
        INVOICED_QUANTITY: remaining,
        REMAINING_QUANTITY: remaining,
        UOM_ID: p.UOM_ID != null ? Number(p.UOM_ID) : undefined,
        UOM_NAME: p.UOM_NAME || "",
        ALT_UOM_ID: p.ALT_UOM_ID != null ? Number(p.ALT_UOM_ID) : undefined,
        ALT_UOM_NAME: p.ALT_UOM_NAME || "",
        RATE_FC: p.RATE_FC ?? "",
        DISCOUNT_PERCENTAGE: p.DISCOUNT_PERCENTAGE ?? "",
        TAX_ID: p.TAX_ID != null ? Number(p.TAX_ID) : (hasDefTax ? Number(defTax.TAX_ID) : undefined),
        TAX_NAME: p.TAX_NAME || (hasDefTax ? defTax.TAX_NAME || "" : ""),
        TAX_PERCENTAGE: p.TAX_PERCENTAGE ?? (hasDefTax ? taxPct(defTax) : ""),
        REMARKS: p.REMARKS || "",
        STATUS_ENTRY: "AC",
      });
      added += 1;
    }

    if (!added) {
      toast({
        title: skipped > 0
          ? "All remaining lines of this Purchase Order are already on the invoice"
          : "This Purchase Order has no remaining quantity to invoice",
        variant: "destructive",
        duration: DEFAULT_TOAST_DURATION,
      });
      return;
    }

    setDtls((prev) => renumber([...prev, ...rows]));
    if (taxDefaults.length) {
      pendingTaxDefaults.current = new Set([...pendingTaxDefaults.current, ...taxDefaults]);
    }
    toast({
      title: `${added} line(s) added from ${poNo}${skipped ? ` - ${skipped} already added` : ""}`,
      duration: DEFAULT_TOAST_DURATION,
    });
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDtls([]);
    setDeletedIds([]);
    setStagedCharges([]);
    setSavedCharges([]);
    setPendingDocs([]);
    setPoNo("");
    setPreviewHdr(null);
    setPreviewLines([]);
    setStepErrors({});
    setLineErrors({});
    setLineFieldErrors({});
    setFocusRequest(null);
    setActiveTab(INVOICE_TAB);
    setDialogOpen(true);
  };

  const openEdit = async (item: any) => {
    setEditing(item);
    setPoNo("");
    setPreviewHdr(null);
    setPreviewLines([]);
    setStagedCharges([]);
    setSavedCharges([]);
    setPendingDocs([]);
    try {
      const refNo = item.purchaseInvoiceRefNo ?? item.PURCHASE_INVOICE_REF_NO;
      const hdr: any = await dispatch(fetchPurchaseInvoiceHdr(refNo)).unwrap();
      const toStr = (v: any) => (v == null || v === "" ? "" : String(v));
      setForm({
        PURCHASE_INVOICE_REF_NO: hdr.PURCHASE_INVOICE_REF_NO || refNo || "",
        PURCHASE_INVOICE_DATE: fmtDate(hdr.PURCHASE_INVOICE_DATE),
        PURCHASE_ORDER_NO: hdr.PURCHASE_ORDER_NO || "",
        SUPPLIER_INVOICE_NO: hdr.SUPPLIER_INVOICE_NO || "",
        SUPPLIER_INVOICE_DATE: fmtDate(hdr.SUPPLIER_INVOICE_DATE),
        COMPANY_ID: toStr(hdr.COMPANY_ID),
        BRANCH_ID: toStr(hdr.BRANCH_ID),
        CAMP_ID: toStr(hdr.CAMP_ID),
        STORE_ID: toStr(hdr.STORE_ID),
        SUPPLIER_BP_ID: toStr(hdr.SUPPLIER_BP_ID),
        CURRENCY_ID: toStr(hdr.CURRENCY_ID),
        EXCHANGE_RATE: hdr.EXCHANGE_RATE != null ? String(hdr.EXCHANGE_RATE) : "",
        PAYMENT_TERM_ID: toStr(hdr.PAYMENT_TERM_ID),
        PAYMENT_MODE_ID: toStr(hdr.PAYMENT_MODE_ID),
        DUE_DATE: fmtDate(hdr.DUE_DATE),
        REMARKS: hdr.REMARKS || "",
        STATUS_ENTRY: hdr.STATUS_ENTRY || "CF",
      });
      const poVal = hdr.PURCHASE_ORDER_NO || "";
      setPoNo(poVal);
      if (poVal) {
        try {
          await loadSourceOrder(poVal);
        } catch {
          // ignore
        }
      }

      const dtlRows: any[] = await dispatch(fetchPurchaseInvoiceDtls(refNo)).unwrap();
      setDtls(renumber((dtlRows || []).map((d: any) => ({
        key: newKey(),
        PURCHASE_INVOICE_DTL_ID: d.PURCHASE_INVOICE_DTL_ID != null ? Number(d.PURCHASE_INVOICE_DTL_ID) : undefined,
        PURCHASE_ORDER_NO: d.PURCHASE_ORDER_NO || "",
        PURCHASE_ORDER_DTL_ID: d.PURCHASE_ORDER_DTL_ID != null ? Number(d.PURCHASE_ORDER_DTL_ID) : undefined,
        CAMP_ID: d.CAMP_ID != null ? Number(d.CAMP_ID) : undefined,
        STORE_ID: d.STORE_ID != null ? Number(d.STORE_ID) : undefined,
        MAIN_CATEGORY_ID: d.MAIN_CATEGORY_ID != null ? Number(d.MAIN_CATEGORY_ID) : undefined,
        SUB_CATEGORY_ID: d.SUB_CATEGORY_ID != null ? Number(d.SUB_CATEGORY_ID) : undefined,
        PRODUCT_ID: d.PRODUCT_ID != null ? Number(d.PRODUCT_ID) : undefined,
        PRODUCT_NAME: d.PRODUCT_NAME || "",
        MAIN_CATEGORY_NAME: d.MAIN_CATEGORY_NAME || "",
        SUB_CATEGORY_NAME: d.SUB_CATEGORY_NAME || "",
        NO_OF_PCS_PER_PACKING: d.NO_OF_PCS_PER_PACKING ?? "",
        INVOICED_QUANTITY: d.INVOICED_QUANTITY ?? "",
        UOM_ID: d.UOM_ID != null ? Number(d.UOM_ID) : undefined,
        UOM_NAME: d.UOM_NAME || "",
        ALT_UOM_ID: d.ALT_UOM_ID != null ? Number(d.ALT_UOM_ID) : undefined,
        ALT_UOM_NAME: d.ALT_UOM_NAME || "",
        RATE_FC: d.RATE_FC ?? "",
        DISCOUNT_PERCENTAGE: d.DISCOUNT_PERCENTAGE ?? "",
        TAX_ID: d.TAX_ID != null ? Number(d.TAX_ID) : undefined,
        TAX_NAME: d.TAX_NAME || "",
        TAX_PERCENTAGE: d.TAX_PERCENTAGE ?? "",
        REMARKS: d.REMARKS || "",
        STATUS_ENTRY: d.STATUS_ENTRY || "AC",
      }))));
      setDeletedIds([]);

      const chargeResponse = await fetch(`${API_URL}/purchase-invoice/charges/${encodeURIComponent(refNo)}`);
      if (chargeResponse.ok) {
        const chargeJson = await chargeResponse.json().catch(() => ({}));
        setSavedCharges(Array.isArray(chargeJson.data) ? chargeJson.data : []);
      }
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : e?.message || "Failed to load record", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setStepErrors({});
    setLineErrors({});
    setLineFieldErrors({});
    setFocusRequest(null);
    setActiveTab(INVOICE_TAB);
    setDialogOpen(true);
  };

  const focusOn = (key: string) => setFocusRequest((prev) => ({ key, nonce: (prev?.nonce ?? 0) + 1 }));

  const validateInvoice = () => {
    const out: StepErrors = {};
    const lines: StepErrors = {};
    const invalidFields: Record<string, string[]> = {};
    const push = (key: string, message: string) => {
      if (!out[key]) out[key] = [];
      out[key].push(message);
    };
    const pushLine = (key: string, message: string) => {
      if (!lines[key]) lines[key] = [];
      lines[key].push(message);
    };

    if (!form.PURCHASE_INVOICE_DATE) push(HDR_STEP, "Purchase Invoice Date is required");
    if (!form.PURCHASE_ORDER_NO) push(HDR_STEP, "Please select a Purchase Order");
    if (!form.SUPPLIER_INVOICE_NO?.trim()) push(HDR_STEP, "Supplier Invoice No is required");
    if (!form.SUPPLIER_INVOICE_DATE) push(HDR_STEP, "Supplier Invoice Date is required");
    if (!form.SUPPLIER_BP_ID) push(HDR_STEP, "Please select a Supplier");
    if (!form.CURRENCY_ID) push(HDR_STEP, "Please select a Currency");
    if (!(toNum(form.EXCHANGE_RATE) > 0)) push(HDR_STEP, "Exchange Rate must be greater than 0");

    if (dtls.length === 0) push(REVIEW_STEP, "At least one purchase invoice line is required");

    dtls.forEach((r: any) => {
      const problems: string[] = [];
      if (!r.PRODUCT_ID) problems.push(r.PRODUCT_NAME ? `Product id missing for "${r.PRODUCT_NAME}"` : "Product is required");
      if (!(toNum(r.INVOICED_QUANTITY) > 0)) problems.push("Invoiced Quantity must be greater than 0");
      const rateMissing = r.RATE_FC === "" || r.RATE_FC === null || r.RATE_FC === undefined;
      if (rateMissing) problems.push("Rate is required");
      else if (toNum(r.RATE_FC) < 0) problems.push("Rate cannot be negative");

      if (problems.length > 0) {
        const fields: string[] = [];
        if (!r.PRODUCT_ID) fields.push("PRODUCT_ID");
        if (!(toNum(r.INVOICED_QUANTITY) > 0)) fields.push("INVOICED_QUANTITY");
        if (rateMissing || toNum(r.RATE_FC) < 0) fields.push("RATE_FC");
        invalidFields[r.key] = fields;
        pushLine(r.key, `Line ${r.LINE_NO ?? "?"}: ${problems.join("; ")}`);
      }

      if (toNum(r.DISCOUNT_PERCENTAGE) < 0 || toNum(r.DISCOUNT_PERCENTAGE) > 100) {
        invalidFields[r.key] = [...(invalidFields[r.key] ?? []), "DISCOUNT_PERCENTAGE"];
        pushLine(r.key, `Line ${r.LINE_NO ?? "?"}: Discount % must be between 0 and 100`);
      }
    });

    const broken = Object.keys(lines);
    if (broken.length > 0) push(DTL_STEP, `${broken.length} line${broken.length === 1 ? "" : "s"} need attention`);

    return { stepErrors: out, lineErrors: lines, invalidFields };
  };

  const handleSave = async () => {
    const { stepErrors: nextStepErrors, lineErrors: nextLineErrors, invalidFields } = validateInvoice();
    setStepErrors(nextStepErrors);
    setLineErrors(nextLineErrors);
    setLineFieldErrors(invalidFields);
    const firstBad = SECTION_ORDER.find((k) => (nextStepErrors[k]?.length ?? 0) > 0);
    if (firstBad) {
      setActiveTab(INVOICE_TAB);
      const firstLine = Object.keys(nextLineErrors)[0];
      focusOn(firstBad === DTL_STEP && firstLine ? lineStepKey(firstLine) : firstBad);
      const detail = firstBad === DTL_STEP && firstLine ? nextLineErrors[firstLine]?.[0] : undefined;
      toast({ title: detail ?? nextStepErrors[firstBad][0], variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    setSaving(true);
    try {
      const nOrNull = (v: any) => {
        if (v === "" || v === null || v === undefined) return null;
        const n = Number(v);
        return isNaN(n) ? null : n;
      };
      const computedRows = dtls.map((r: any) => ({ ...r, ...calcLine(r, form.EXCHANGE_RATE) }));
      const sums = rollup(computedRows, additional);

      const payload: Record<string, any> = {
        PURCHASE_INVOICE_REF_NO: editing
          ? String(editing.purchaseInvoiceRefNo ?? editing.PURCHASE_INVOICE_REF_NO)
          : "",
        PURCHASE_INVOICE_DATE: form.PURCHASE_INVOICE_DATE || null,
        PURCHASE_ORDER_NO: form.PURCHASE_ORDER_NO || null,
        SUPPLIER_INVOICE_NO: form.SUPPLIER_INVOICE_NO?.trim() || null,
        SUPPLIER_INVOICE_DATE: form.SUPPLIER_INVOICE_DATE || null,
        COMPANY_ID: nOrNull(form.COMPANY_ID),
        BRANCH_ID: nOrNull(form.BRANCH_ID),
        CAMP_ID: nOrNull(form.CAMP_ID),
        STORE_ID: nOrNull(form.STORE_ID),
        SUPPLIER_BP_ID: nOrNull(form.SUPPLIER_BP_ID),
        CURRENCY_ID: nOrNull(form.CURRENCY_ID),
        EXCHANGE_RATE: nOrNull(form.EXCHANGE_RATE),
        PAYMENT_TERM_ID: nOrNull(form.PAYMENT_TERM_ID),
        PAYMENT_MODE_ID: nOrNull(form.PAYMENT_MODE_ID),
        DUE_DATE: form.DUE_DATE || null,
        ...sums,
        REMARKS: form.REMARKS?.trim() || null,
        /* The raw code goes to the server. The label is for display only, so
           sending it here stored "Pending for Submitted" in a code column. */
        STATUS_ENTRY: form.STATUS_ENTRY || "CF",
        LINK_PAGES_ID: linkPagesId || null,
        dtls: dtls.map((r: any) => {
          const c = calcLine(r, form.EXCHANGE_RATE);
          return {
            PURCHASE_INVOICE_DTL_ID: r.PURCHASE_INVOICE_DTL_ID || undefined,
            PURCHASE_ORDER_NO: r.PURCHASE_ORDER_NO || form.PURCHASE_ORDER_NO || null,
            PURCHASE_ORDER_DTL_ID: nOrNull(r.PURCHASE_ORDER_DTL_ID),
            CAMP_ID: nOrNull(r.CAMP_ID),
            STORE_ID: nOrNull(r.STORE_ID),
            MAIN_CATEGORY_ID: nOrNull(r.MAIN_CATEGORY_ID),
            SUB_CATEGORY_ID: nOrNull(r.SUB_CATEGORY_ID),
            PRODUCT_ID: nOrNull(r.PRODUCT_ID),
            NO_OF_PCS_PER_PACKING: nOrNull(r.NO_OF_PCS_PER_PACKING),
            INVOICED_QUANTITY: nOrNull(r.INVOICED_QUANTITY),
            UOM_ID: nOrNull(r.UOM_ID),
            ALT_UOM_ID: nOrNull(r.ALT_UOM_ID),
            RATE_FC: nOrNull(r.RATE_FC),
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
        const res = await dispatch(updatePurchaseInvoice(payload as PurchaseInvoiceGridData)).unwrap();
        toast({ title: res?.message ?? "Purchase Invoice updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addPurchaseInvoice(payload as PurchaseInvoiceGridData)).unwrap();
        toast({ title: res?.message ?? "Purchase Invoice created successfully", duration: DEFAULT_TOAST_DURATION });
        const newRefNo = res?.PURCHASE_INVOICE_REF_NO;
        if (stagedCharges.length && newRefNo) {
          const failed: string[] = [];
          for (const c of stagedCharges) {
            try {
              const response = await fetch(`${API_URL}/purchase-invoice/charge`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...c, PURCHASE_INVOICE_REF_NO: newRefNo, STATUS_ENTRY: "AC" }),
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
        if (pendingDocs.length && newRefNo) {
          const failed: string[] = [];
          for (const doc of pendingDocs) {
            try {
              const response = await fetch(`${API_URL}/dms`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  LINK_PAGES_ID: linkPagesId,
                  PAGE_REF_NO: newRefNo,
                  DOCUMENT_TYPE: doc.DOCUMENT_TYPE || "",
                  DESCRIPTIONS: doc.DESCRIPTIONS || "",
                  FILE_NAME: doc.FILE_NAME,
                  CONTENT_TYPE: doc.CONTENT_TYPE,
                  CONTENT_DATA: doc.CONTENT_DATA,
                  REMARKS: doc.REMARKS || "",
                  STATUS_MASTER: doc.STATUS_MASTER || "AC",
                  LINK_ID: DMS_LINK_ID,
                }),
              });
              const json = await response.json().catch(() => ({}));
              if (!response.ok) failed.push(`${doc.FILE_NAME || "file"}: ${json?.message || "failed"}`);
            } catch (err: any) {
              failed.push(`${doc.FILE_NAME || "file"}: ${err?.message || "failed"}`);
            }
          }
          if (failed.length) {
            toast({
              variant: "destructive",
              title: `${failed.length} document${failed.length === 1 ? "" : "s"} could not be saved.`,
              description: failed.join(" · "),
              duration: DEFAULT_TOAST_DURATION,
            });
          }
          setPendingDocs([]);
        }
      }
      setDialogOpen(false);
      setStepErrors({});
      setLineErrors({});
      setFocusRequest(null);
      dispatch(fetchPurchaseInvoices());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : e?.message || "Error saving purchase invoice", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deletePurchaseInvoiceHdr(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Purchase Invoice deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchPurchaseInvoices());
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : e?.message || "Error deleting purchase invoice", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
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
    const isEmpty = required && !form[key];
    const fieldBorderClass = isEmpty ? "border-destructive ring-1 ring-destructive/30" : "";
    const set = (v: string) => (onChange ? onChange(v) : updateForm(key, v));
    return (
      <div key={key} className={type === "textarea" ? "col-span-2 flex flex-col gap-1.5" : "flex flex-col gap-1.5"}>
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

  const lineGroups = (): FieldGroup[] => [
    {
      title: "Invoice Line",
      fields: [
        { key: "LINE_NO", label: "Line No", kind: "computed", hint: "auto", display: (r: any) => r.LINE_NO ?? "-" },
        { key: "PURCHASE_ORDER_NO", label: "Purchase Order", kind: "readOnly", display: (r: any) => r.PURCHASE_ORDER_NO || "-" },
        { key: "PRODUCT_ID", label: "Product", kind: "readOnly", display: (r: any) => r.PRODUCT_NAME || (r.PRODUCT_ID ?? "-") },
        { key: "INVOICED_QUANTITY", label: "Invoiced Qty", kind: "number", required: true, min: 0, transform: clampNonNegative },
        { key: "UOM", label: "UOM", kind: "readOnly", display: (r: any) => r.UOM_NAME || (r.UOM_ID ?? "-") },
        { key: "RATE_FC", label: "Rate FC", kind: "number", required: true, min: 0, placeholder: "0.000", transform: clampNonNegative },
        { key: "DISCOUNT_PERCENTAGE", label: "Discount %", kind: "number", min: 0, max: 100, transform: clampNonNegative },
        { key: "SUB_TOTAL_AMOUNT_FC", label: "Sub Total FC", kind: "computed", display: (r: any) => money(r.SUB_TOTAL_AMOUNT_FC) },
      ],
    },
    {
      title: "Tax & Total",
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
          display: (r: any) => (r.TAX_PERCENTAGE === "" || r.TAX_PERCENTAGE == null ? "-" : `${r.TAX_PERCENTAGE}%`),
        },
        { key: "TAX_AMOUNT_FC", label: "Tax Amt FC", kind: "computed", display: (r: any) => money(r.TAX_AMOUNT_FC) },
        { key: "FINAL_AMOUNT_FC", label: "Final Amt FC", kind: "computed", display: (r: any) => money(r.FINAL_AMOUNT_FC) },
      ],
    },
    {
      title: "Source Line",
      fields: [
        { key: "REMAINING_QUANTITY", label: "Remaining Qty", kind: "readOnly", display: (r: any) => (r.REMAINING_QUANTITY != null ? previewQty(r.REMAINING_QUANTITY) : "-") },
        { key: "CAMP", label: "Camp", kind: "readOnly", display: (r: any) => (r.CAMP_ID != null ? campOptions.find((o) => o.value === String(r.CAMP_ID))?.label ?? `#${r.CAMP_ID}` : "-") },
        { key: "STORE", label: "Store", kind: "readOnly", display: (r: any) => (r.STORE_ID != null ? storeOptions.find((o) => o.value === String(r.STORE_ID))?.label ?? `#${r.STORE_ID}` : "-") },
        { key: "NO_OF_PCS_PER_PACKING", label: "Pcs/Packing", kind: "readOnly", display: (r: any) => r.NO_OF_PCS_PER_PACKING || "-" },
        { key: "REMARKS", label: "Remarks", kind: "text", maxLength: 500 },
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
      CAMP_ID: pick(campOptions, form.CAMP_ID),
      STORE_ID: pick(storeOptions, form.STORE_ID),
      PAYMENT_TERM_ID: pick(paymentTermOptions, form.PAYMENT_TERM_ID),
      PAYMENT_MODE_ID: pick(paymentModeOptions, form.PAYMENT_MODE_ID),
      CURRENCY_ID: pick(currencyOptions, form.CURRENCY_ID),
      STATUS_ENTRY: entryLabel(form.STATUS_ENTRY),
    };
  }, [form, supplierOptions, companyOptions, branchOptions, campOptions, storeOptions, paymentTermOptions, paymentModeOptions, currencyOptions]);

  const previewCamp = useMemo(() => {
    const id = previewHdr?.CAMP_ID ?? previewLines[0]?.CAMP_ID;
    return id == null ? "-" : campOptions.find((o) => o.value === String(id))?.label ?? `#${id}`;
  }, [previewHdr, previewLines, campOptions]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Invoice</h1>
          <p className="text-sm text-muted-foreground">Record supplier invoices against submitted purchase orders</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Purchase Invoice
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search purchase invoices..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-24">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Invoice No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Invoice Date</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">PO No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Supplier Invoice No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Supplier</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Branch</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Store</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Final Amount (LC)</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status Entry</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => {
                  const refNo = item.purchaseInvoiceRefNo ?? item.PURCHASE_INVOICE_REF_NO;
                  return (
                    <tr key={item.id || idx} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 flex gap-2">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                        {refNo && (
                          <button
                            onClick={() => setConversationFor({ refNo, statusEntry: item.statusEntry ?? item.STATUS_ENTRY })}
                            title={`Conversation for ${refNo}`}
                            aria-label={`Conversation for ${refNo}`}
                            className="p-1.5 rounded hover:bg-muted transition-colors"
                          >
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                        {isAdmin && <button onClick={() => setDeleteId(refNo)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>}
                      </td>
                      <td className="p-3 font-medium">{item.purchaseInvoiceRefNo || "-"}</td>
                      <td className="p-3">{formatDate(item.purchaseInvoiceDate)}</td>
                      <td className="p-3">{item.purchaseOrderNo || "-"}</td>
                      <td className="p-3">{item.supplierInvoiceNo || "-"}</td>
                      <td className="p-3">{item.supplierName || "-"}</td>
                      <td className="p-3">{item.companyName || "-"}</td>
                      <td className="p-3">{item.branchName || "-"}</td>
                      <td className="p-3">{item.storeName || "-"}</td>
                      <td className="p-3 font-medium">{money(item.finalProductHdrAmountLc)}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={`${entryBadgeClass(item.statusEntry ?? item.STATUS_ENTRY)} px-2 py-0.5 text-xs font-semibold whitespace-nowrap`}>
                          {entryLabel(item.statusEntry ?? item.STATUS_ENTRY)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">No purchase invoices found</td></tr>
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
            setStagedCharges([]);
          }
          if (v) setActiveTab(INVOICE_TAB);
          setDialogOpen(v);
        }}
        title={
          editing
            ? `Edit Purchase Invoice (${editing.purchaseInvoiceRefNo ?? editing.PURCHASE_INVOICE_REF_NO})`
            : "Add Purchase Invoice"
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
              <TabsTrigger value={INVOICE_TAB}>Purchase Invoice</TabsTrigger>
              <TabsTrigger value={DOCUMENTS_TAB}>
                Documents
                {currentRef && (
                  <span className="ml-1.5 text-[9px] font-semibold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                    {currentRef}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value={CHARGES_TAB}>Additional Charges</TabsTrigger>
              <TabsTrigger value={CONVERSATION_TAB}>Conversation</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={INVOICE_TAB} className="space-y-6 mt-0">
            <WizardSection
              stepKey={HDR_STEP}
              title="Purchase Invoice Header Information"
              subtitle="Invoice references, purchase order, supplier and amounts"
              errors={stepErrors[HDR_STEP]}
            >
              <div className="grid grid-cols-2 gap-4">
                {renderField("PURCHASE_INVOICE_DATE", "Invoice Date", "date", undefined, true)}
                {renderField("PURCHASE_ORDER_NO", "Purchase Order", "select",
                  (Array.isArray(sourceOrders) ? sourceOrders : []).map((o: any) => ({ value: String(o.purchaseOrderNo ?? ""), label: String(o.label ?? o.purchaseOrderNo ?? "") })),
                  true, "Select purchase order", false, undefined, loadSourceOrder)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("SUPPLIER_INVOICE_NO", "Supplier Invoice No", "text", undefined, true, "Supplier's invoice number")}
                {renderField("SUPPLIER_INVOICE_DATE", "Supplier Invoice Date", "date", undefined, true)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("SUPPLIER_BP_ID", "Supplier", "select", supplierOptions, true, "Select supplier", editing != null, editing != null ? "from purchase order" : undefined)}
                {renderField("CURRENCY_ID", "Currency", "select", currencyOptions, true, "Select currency", editing != null, editing != null ? "from purchase order" : undefined, handleCurrencyChange)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("COMPANY_ID", "Company", "select", companyOptions, true, "No company mapped to your login", true, "from your login")}
                {renderField("BRANCH_ID", "Branch", "select", branchOptions, false, "No branch mapped to your login", true, "from your login")}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("CAMP_ID", "Camp", "select", campOptions, false, "No camp mapped to your login", true, "from your login")}
                {renderField("STORE_ID", "Store", "select", storeOptions, false, "No store mapped to your login", true, "from your login")}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("PAYMENT_TERM_ID", "Payment Term", "select", paymentTermOptions, false, "Select payment term")}
                {renderField("PAYMENT_MODE_ID", "Payment Mode", "select", paymentModeOptions, false, "Select payment mode")}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("EXCHANGE_RATE", "Exchange Rate", "number", undefined, true, "1.000000", false, "applies to all lines")}
                {renderField("DUE_DATE", "Due Date", "date")}
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

              <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-xs font-semibold text-foreground">Lines from Purchase Order</h4>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {dtls.length} line{dtls.length === 1 ? "" : "s"} added
                  </span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex flex-col gap-2 w-full lg:w-80 shrink-0">
                    <div className="flex flex-col gap-1.5 w-full">
                      <Label className="text-xs">Purchase Order</Label>
                      <Select value={poNo} onValueChange={loadSourceOrder} disabled={!!editing}>
                        <SelectTrigger className="!h-9 text-xs">
                          <SelectValue placeholder="Select purchase order" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const base = (Array.isArray(sourceOrders) ? sourceOrders : []).map((o: any) => ({
                              value: String(o.purchaseOrderNo ?? ""),
                              label: o.label || o.purchaseOrderNo,
                              itemSummary: o.itemSummary,
                            }));
                            const cur = String(poNo ?? "").trim();
                            if (cur && !base.some((o) => o.value === cur)) {
                              base.unshift({ value: cur, label: cur, itemSummary: undefined });
                            }
                            return base;
                          })().map((o: any) => (
                            <SelectItem key={String(o.value)} value={String(o.value)}>
                              <span className="block">{o.label || o.value}</span>
                              {o.itemSummary ? (
                                <span className="mt-0.5 block w-full rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground leading-snug">
                                  {o.itemSummary}
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
                      onClick={addLinesFromPo}
                      disabled={loadingPo || !poNo}
                      className="h-9 w-full text-xs"
                    >
                      {loadingPo ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1" />}
                      {loadingPo ? "Loading..." : "Add Lines from Purchase Order"}
                    </Button>
                  </div>

                  <div className="min-w-0 flex-1">
                    {loadingPo ? (
                      <div className="flex items-center justify-center gap-2 rounded-lg border bg-card px-3 py-6 text-xs text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading purchase order lines...
                      </div>
                    ) : previewHdr ? (
                      <div className="rounded-lg border bg-card shadow-sm">
                        <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                          <h5 className="text-xs font-semibold text-foreground">Review Purchase Order</h5>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {previewLines.length} line{previewLines.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="border-b px-3 py-1.5 text-[11px] text-muted-foreground">
                          Supplier: <span className="font-medium text-foreground">{previewHdr.SUPPLIER_BP_ID ?? "-"}</span>
                          {" · "}Store: <span className="font-medium text-foreground">{previewHdr.STORE_ID ?? "-"}</span>
                          {" · "}Camp: <span className="font-medium text-foreground">{previewCamp}</span>
                        </div>
                        {previewLines.length === 0 ? (
                          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                            This purchase order has no detail lines.
                          </p>
                        ) : (
                          <div className="max-h-72 overflow-auto">
                            <table className="w-full text-[11px]">
                              <thead className="sticky top-0 bg-muted/60 text-muted-foreground">
                                <tr>
                                  <th className="px-2 py-1.5 text-left font-medium whitespace-nowrap">Line</th>
                                  <th className="px-2 py-1.5 text-left font-medium whitespace-nowrap">Product</th>
                                  <th className="px-2 py-1.5 text-right font-medium whitespace-nowrap">Ordered</th>
                                  <th className="px-2 py-1.5 text-right font-medium whitespace-nowrap">Invoiced</th>
                                  <th className="px-2 py-1.5 text-right font-medium whitespace-nowrap">Remaining</th>
                                  <th className="px-2 py-1.5 text-left font-medium whitespace-nowrap">UOM</th>
                                  <th className="px-2 py-1.5 text-right font-medium whitespace-nowrap">Rate</th>
                                </tr>
                              </thead>
                              <tbody>
                                {previewLines.map((r: any, idx: number) => (
                                  <tr key={String(r.PURCHASE_ORDER_DTL_ID ?? idx)} className="border-t">
                                    <td className="px-2 py-1.5 whitespace-nowrap">{r.LINE_NO ?? "-"}</td>
                                    <td className="px-2 py-1.5 min-w-[140px]">{r.PRODUCT_NAME || (r.PRODUCT_ID ?? "-")}</td>
                                    <td className="px-2 py-1.5 whitespace-nowrap text-right">{previewQty(r.TOTAL_QUANTITY)}</td>
                                    <td className="px-2 py-1.5 whitespace-nowrap text-right">{previewQty(r.ALREADY_INVOICED_QUANTITY)}</td>
                                    <td className="px-2 py-1.5 whitespace-nowrap text-right font-medium">{previewQty(r.REMAINING_QUANTITY)}</td>
                                    <td className="px-2 py-1.5 whitespace-nowrap">{r.UOM_NAME || (r.UOM_ID ?? "-")}</td>
                                    <td className="px-2 py-1.5 whitespace-nowrap text-right">{money(r.RATE_FC)}</td>
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
                  Only submitted purchase orders are listed. Lines are imported with the remaining (un-invoiced)
                  quantity, so a purchase order can be invoiced in parts.
                </p>
              </div>
            </WizardSection>

            <WizardSection
              stepKey={DTL_STEP}
              title="Purchase Invoice Lines"
              subtitle="Imported from the purchase order. Line numbers are automatic."
              errors={stepErrors[DTL_STEP]}
            >
              {dtls.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                  No lines yet. Select a Purchase Order in the Lines from Purchase Order panel above,
                  then use Add Lines from Purchase Order.
                </p>
              ) : (
                <div className="space-y-3">
                  {computed.map((row: any) => (
                    <DetailLineCard
                      key={row.key}
                      anchor={lineStepKey(row.key)}
                      title={`Line ${row.LINE_NO ?? "?"}${row.PRODUCT_NAME ? ` - ${row.PRODUCT_NAME}` : ""}`}
                      subtitle={row.PURCHASE_ORDER_NO ? `From ${row.PURCHASE_ORDER_NO}` : "No linked purchase order"}
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
              title="Review & Save"
              subtitle="Header and every detail line on one page"
              errors={stepErrors[REVIEW_STEP]}
            >
              <PurchaseInvoiceReview
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
                Attach the supplier invoice and supporting documents to this purchase invoice.
              </p>
              <AttachmentsPanel
                linkPagesId={linkPagesId}
                entityRefNo={currentRef}
                entityLabel="Purchase Invoice"
                title="Documents / Attachments"
                emptyMessage="No documents attached to this Purchase Invoice"
                allowUpload={!!currentRef || !editing}
                allowEdit={!!currentRef}
                allowDelete={!!currentRef && isAdmin}
                pendingFiles={editing ? undefined : pendingDocs}
                onPendingFilesChange={editing ? undefined : setPendingDocs}
                onChange={() => dispatch(fetchPurchaseInvoices())}
              />
            </div>
          </TabsContent>

          <TabsContent value={CHARGES_TAB} className="space-y-6 mt-0">
            <div className="rounded-lg border p-4 bg-card">
              <p className="text-xs text-muted-foreground mb-3">
                Non-product costs (freight, insurance, packing, customs, delivery) added to this
                invoice. Tax on these charges is included in the invoice total.
              </p>
              <AdditionalChargesPanel
                entityRefNo={currentRef}
                defaultExchangeRate={form.EXCHANGE_RATE}
                isAdmin={isAdmin}
                charges={stagedCharges}
                onChargesChange={setStagedCharges}
              />
            </div>
          </TabsContent>

          <TabsContent value={CONVERSATION_TAB} className="mt-0">
            <div className="flex h-[60vh] flex-col rounded-lg border p-4 bg-card">
              <p className="mb-3 text-xs text-muted-foreground">
                Queries and responses recorded against this purchase invoice.
              </p>
              <InvoiceConversationPanel
                key={currentRef || "new"}
                refNo={currentRef}
                linkPagesId={linkPagesId}
                statusEntry={form.STATUS_ENTRY}
                className="min-h-0 flex-1"
              />
            </div>
          </TabsContent>
        </Tabs>
      </WizardShell>

      <ConversationDialog
        open={!!conversationFor}
        onOpenChange={(v) => { if (!v) setConversationFor(null); }}
        purchaseInvoiceRefNo={conversationFor?.refNo ?? ""}
        statusEntry={conversationFor?.statusEntry}
        linkPagesId={linkPagesId}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this purchase invoice along with all its detail lines and charges.
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
