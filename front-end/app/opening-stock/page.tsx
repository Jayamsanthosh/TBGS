"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import OpeningStockReview from "./opening-stock-review";
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
  type FieldDescriptor,
} from "@/components/wizard/types";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchOpeningStocks,
  addOpeningStock,
  updateOpeningStock,
  deleteOpeningStockHdr,
  fetchOpeningStockHdr,
  fetchOpeningStockDtls,
  clearOpeningStockMasterError,
  OpeningStockGridData,
} from "@/lib/openingStockMasterSlice";
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

/* Status Entry has no submission flow here - every record is created with CF,
   so a new opening stock reads as Pending for Submitted rather than leaking a
   raw Draft / Inactive code. Mirrors the Purchase Request presentation. */
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

const fmtDate = (d: any) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
};

export default function OpeningStockPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.openingStockMaster);
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  /* Company / Camp / Store are the logged-in user's, so a new record is filled
     from the session rather than picked. They stay editable in case a user with
     no employee mapping (or a different destination) needs to change them - the
     backend stores whatever header values are sent. */
  const activeCompanyId = user?.context?.companyId ?? user?.companies?.[0]?.companyId ?? null;
  const sessionEmployee = user?.employee ?? null;
  const sessionEmployeeDefaults = useMemo(
    () => ({
      companyId: sessionEmployee?.companyId ?? activeCompanyId ?? null,
      campId: sessionEmployee?.campId ?? user?.context?.campId ?? null,
      storeId: sessionEmployee?.storeId ?? user?.context?.storeId ?? null,
    }),
    [
      sessionEmployee?.companyId,
      sessionEmployee?.campId,
      sessionEmployee?.storeId,
      user?.context,
      activeCompanyId,
      user?.companies,
    ]
  );

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OpeningStockGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [stepErrors, setStepErrors] = useState<StepErrors>({});
  const [lineErrors, setLineErrors] = useState<StepErrors>({});
  const [focusRequest, setFocusRequest] = useState<{ key: string; nonce: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const { data: companies } = useApiQuery("os-master-companies", () => fetchList(`${API_URL}/company-master`));
  const { data: camps } = useApiQuery("os-master-camps", () => fetchList(`${API_URL}/camp-master`));
  const { data: stores } = useApiQuery("os-master-stores", () => fetchList(`${API_URL}/store-master`));
  const { data: locations } = useApiQuery("os-master-locations", () => fetchList(`${API_URL}/location-master`));
  const { data: currencies } = useApiQuery("os-master-currencies", () => fetchList(`${API_URL}/currency-master`));
  const { data: statuses } = useApiQuery("os-master-statuses", () => fetchList(`${API_URL}/status-master/load?includeInactive=false`));
  const { data: mainCategories } = useApiQuery("os-master-main-categories", () => fetchList(`${API_URL}/product-main-category`));
  const { data: subCategories } = useApiQuery("os-master-sub-categories", () => fetchList(`${API_URL}/product-sub-category`));
  const { data: products } = useApiQuery("os-master-products", () => fetchList(`${API_URL}/product-master`));
  const { data: uoms } = useApiQuery("os-master-uoms", () => fetchList(`${API_URL}/uom-master`));
  const { data: racks } = useApiQuery("os-master-racks", () => fetchList(`${API_URL}/rack-master`));

  const opt = (rows: any[] | undefined, valueKey: string, labelKey: string) =>
    (Array.isArray(rows) ? rows : []).map((r: any) => ({
      value: String(r[valueKey] ?? ""),
      label: String(r[labelKey] ?? ""),
    }));

  const labelOf = (options: { value: string; label: string }[], v: any) =>
    (options || []).find((o) => o.value === String(v ?? ""))?.label || "";

  /* Company is session-owned, so the dropdown only ever carries the session's
     company. The row's current value is merged back in when editing so a stored
     company can never blank the field, even if the session points elsewhere. */
  const companyOptions = useMemo(() => {
    const sessionId = sessionEmployeeDefaults.companyId != null ? String(sessionEmployeeDefaults.companyId) : "";
    const all = opt(companies, "COMPANY_ID", "COMPANY_NAME").filter((o) => o.value);
    const list = sessionId ? all.filter((o) => o.value === sessionId) : all;
    const own = String(form.COMPANY_ID ?? "").trim();
    if (own && !list.some((o) => o.value === own)) {
      const cur = all.find((o) => o.value === own);
      if (cur) list.unshift(cur);
    }
    return list;
  }, [companies, sessionEmployeeDefaults.companyId, form.COMPANY_ID]);
  const campOptions = useMemo(() => opt(camps, "CAMP_ID", "CAMP_NAME").filter((o) => o.value), [camps]);
  const storeOptions = useMemo(
    () =>
      (Array.isArray(stores) ? stores : []).map((r: any) => ({
        value: String(r.STORE_ID ?? r.Store_Id ?? ""),
        label: String(r.STORE_NAME ?? r.Store_Name ?? ""),
      })).filter((o) => o.value),
    [stores]
  );
  const locationOptions = useMemo(() => opt(locations, "LOCATION_ID", "LOCATION_NAME").filter((o) => o.value), [locations]);
  const currencyOptions = useMemo(() => opt(currencies, "CURRENCY_ID", "CURRENCY_NAME").filter((o) => o.value), [currencies]);
  const statusOptions = useMemo(
    () =>
      (Array.isArray(statuses) ? statuses : []).map((s: any) => ({
        value: String(s.statusId ?? ""),
        label: s.displayText || s.statusName || "",
      })).filter((o) => o.value),
    [statuses]
  );

  /* The opening stock status is set at creation, not picked by hand: a new
     record starts at DRAFT, resolved from the status master by STATUS_CODE so
     no numeric id is ever hard-coded. */
  const statusIdFor = (code: string) =>
    String(
      (Array.isArray(statuses) ? statuses : []).find(
        (s: any) => String(s.statusCode ?? s.STATUS_CODE ?? "") === code
      )?.statusId ?? ""
    );
  const draftStatusId = statusIdFor("DRAFT");

  const mainCategoryOptions = useMemo(() => opt(mainCategories, "MAIN_CATEGORY_ID", "MAIN_CATEGORY_NAME").filter((o) => o.value), [mainCategories]);
  const uomOptions = useMemo(() => opt(uoms, "UOM_ID", "UOM_NAME").filter((o) => o.value), [uoms]);
  const rackOptions = useMemo(
    () =>
      (Array.isArray(racks) ? racks : []).map((r: any) => ({
        value: String(r.RACK_ID ?? ""),
        label: String(r.RACK_NAME ?? r.RACK_NO ?? ""),
      })).filter((o) => o.value),
    [racks]
  );

  const subCategoryOptionsFor = (mainId?: any) =>
    (Array.isArray(subCategories) ? subCategories : [])
      .filter((s: any) => !mainId || String(s.MAIN_CATEGORY_ID) === String(mainId))
      .map((s: any) => ({ value: String(s.SUB_CATEGORY_ID), label: s.SUB_CATEGORY_NAME }));

  const productOptionsFor = (companyId?: any, mainId?: any) =>
    (Array.isArray(products) ? products : [])
      .filter((p: any) => (!companyId || String(p.COMPANY_ID) === String(companyId)) && (!mainId || String(p.MAIN_CATEGORY_ID) === String(mainId)))
      .map((p: any) => ({ value: String(p.PRODUCT_ID), label: p.PRODUCT_NAME }));

  const productOf = (id: any) =>
    (Array.isArray(products) ? products : []).find((p: any) => String(p.PRODUCT_ID) === String(id));

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((d: any) => {
      const searchable = [
        d.openingStockNo,
        d.OPENING_STOCK_REF_NO,
        d.companyName,
        d.campName,
        d.storeName,
        d.locationName,
        d.currencyName,
        d.statusName,
        d.STATUS_NAME,
      ].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) =>
      (b.openingStockNo || b.OPENING_STOCK_REF_NO || "") > (a.openingStockNo || a.OPENING_STOCK_REF_NO || "") ? 1 : -1
    );
  }, [items, search]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;
  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);
  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  useEffect(() => {
    dispatch(fetchOpeningStocks({}));
  }, [dispatch]);

  /* A new record starts at DRAFT. The default is applied once the id is known
     from the status master rather than baked into the initial state, because the
     master is loaded asynchronously. Editing an existing record never re-stamps
     its status. */
  useEffect(() => {
    if (editing) return;
    if (!draftStatusId) return;
    if (form.STATUS_ID) return;
    setForm((prev) => (prev.STATUS_ID ? prev : { ...prev, STATUS_ID: draftStatusId }));
  }, [draftStatusId, editing, form.STATUS_ID]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearOpeningStockMasterError());
    }
  }, [error, dispatch, toast]);

  const newKey = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random();

  const emptyDtl = (lineNo: number) => ({
    key: newKey(),
    OPENING_STOCK_DTL_ID: undefined as number | undefined,
    LINE_NO: lineNo,
    MAIN_CATEGORY_ID: undefined as number | undefined,
    SUB_CATEGORY_ID: undefined as number | undefined,
    PRODUCT_ID: undefined as number | undefined,
    NO_OF_PCS_PER_PACKING: "",
    TOTAL_QUANTITY: "",
    UOM_ID: undefined as number | undefined,
    ALT_QUANTITY: "",
    ALT_UOM_ID: undefined as number | undefined,
    RATE_FC: "",
    TOTAL_COST_FC: "",
    EXCHANGE_RATE: "",
    RATE_LC: "",
    TOTAL_COST_LC: "",
    BATCH_NO: "",
    SERIAL_NO: "",
    MANUFACTURE_DATE: "",
    EXPIRY_DATE: "",
    RACK_ID: undefined as number | undefined,
    REMARKS: "",
    STATUS_ENTRY: "CF",
  });

  const [dtls, setDtls] = useState<any[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);

  const emptyForm = () => ({
    OPENING_STOCK_REF_NO: "",
    OPENING_STOCK_DATE: fmtDate(new Date()),
    /* Company / Camp / Store come from the session. */
    COMPANY_ID: sessionEmployeeDefaults.companyId != null ? String(sessionEmployeeDefaults.companyId) : "",
    CAMP_ID: sessionEmployeeDefaults.campId != null ? String(sessionEmployeeDefaults.campId) : "",
    STORE_ID: sessionEmployeeDefaults.storeId != null ? String(sessionEmployeeDefaults.storeId) : "",
    LOCATION_ID: "",
    CURRENCY_ID: "",
    /* Picking a currency fills this from the currency master (see
       handleCurrencyChange), so a new record starts blank instead of echoing a
       rate that was never derived from the selected currency. */
    EXCHANGE_RATE: "",
    TOTAL_QUANTITY: "",
    TOTAL_VALUE_FC: "",
    TOTAL_VALUE_LC: "",
    STATUS_ID: "",
    REMARKS: "",
    STATUS_ENTRY: "CF",
  });

  /* SHOW_CURRENCY_MASTER returns the rate as "Exchange_Rate", so both spellings
     are read. Selecting the currency stamps the document rate from the master,
     exactly like the purchase order and quotation screens. */
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

  const altQty = (r: any) => {
    const qty = Number(r.TOTAL_QUANTITY);
    const pcs = Number(r.NO_OF_PCS_PER_PACKING);
    if (r.TOTAL_QUANTITY === "" || r.TOTAL_QUANTITY == null || r.NO_OF_PCS_PER_PACKING === "" || r.NO_OF_PCS_PER_PACKING == null) return "";
    if (isNaN(qty) || isNaN(pcs) || pcs <= 0) return "";
    return (qty / pcs).toFixed(3);
  };

  /* Line amount preview only - the backend recomputes and stores the real
     numbers (TOTAL_COST_FC = qty x rate, RATE_LC = rate x header rate,
     TOTAL_COST_LC = cost FC x header rate), so a line whose rate was edited
     always previews what will be persisted. */
  const lineAmounts = (r: any, headerRate: any) => {
    const qty = Number(r.TOTAL_QUANTITY || 0) || 0;
    const rate = Number(r.RATE_FC || 0) || 0;
    const exRate = Number(headerRate) > 0 ? Number(headerRate) : 0;
    return {
      TOTAL_COST_FC: (qty * rate).toFixed(3),
      RATE_LC: (rate * exRate).toFixed(3),
      TOTAL_COST_LC: (qty * rate * exRate).toFixed(3),
    };
  };

  const updateDtl = (key: string, field: string, value: any) => {
    setDtls((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        if (field === "MAIN_CATEGORY_ID") {
          return { ...r, MAIN_CATEGORY_ID: value, SUB_CATEGORY_ID: undefined, PRODUCT_ID: undefined, NO_OF_PCS_PER_PACKING: "", UOM_ID: undefined, ALT_UOM_ID: undefined, ALT_QUANTITY: "" };
        }
        if (field === "PRODUCT_ID") {
          const p = productOf(value);
          if (!p) return { ...r, PRODUCT_ID: value };
          const next = {
            ...r,
            PRODUCT_ID: value,
            MAIN_CATEGORY_ID: p.MAIN_CATEGORY_ID != null ? Number(p.MAIN_CATEGORY_ID) : r.MAIN_CATEGORY_ID,
            SUB_CATEGORY_ID: p.SUB_CATEGORY_ID != null ? Number(p.SUB_CATEGORY_ID) : r.SUB_CATEGORY_ID,
            NO_OF_PCS_PER_PACKING: p.NO_OF_PCS_PER_PACKING != null && p.NO_OF_PCS_PER_PACKING !== "" ? String(p.NO_OF_PCS_PER_PACKING) : r.NO_OF_PCS_PER_PACKING,
            UOM_ID: p.UOM_ID != null ? Number(p.UOM_ID) : r.UOM_ID,
            ALT_UOM_ID: p.ALTERNATE_UOM_ID != null ? Number(p.ALTERNATE_UOM_ID) : r.ALT_UOM_ID,
          };
          return { ...next, ALT_QUANTITY: altQty(next) };
        }
        if (field === "TOTAL_QUANTITY" || field === "NO_OF_PCS_PER_PACKING") {
          const next = { ...r, [field]: value };
          return { ...next, ALT_QUANTITY: altQty(next) };
        }
        return { ...r, [field]: value };
      })
    );
  };

  const renumberDtls = (rows: any[]) => rows.map((r, i) => ({ ...r, LINE_NO: i + 1 }));

  const addDtl = () => {
    setDtls((prev) => renumberDtls([...prev, emptyDtl(prev.length + 1)]));
  };

  const removeDtl = (key: string) => {
    const row = dtls.find((r) => r.key === key);
    if (row?.OPENING_STOCK_DTL_ID) {
      setDeletedIds((d) => [...d, Number(row.OPENING_STOCK_DTL_ID)]);
    }
    setDtls((prev) => renumberDtls(prev.filter((r) => r.key !== key)));
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDtls([emptyDtl(1)]);
    setDeletedIds([]);
    setStepErrors({});
    setLineErrors({});
    setFocusRequest(null);
    setDialogOpen(true);
  };

  const openEdit = async (item: any) => {
    setEditing(item);
    try {
      const refNo = item.openingStockNo ?? item.OPENING_STOCK_REF_NO ?? item.refNo;
      const hdr = await dispatch(fetchOpeningStockHdr(refNo)).unwrap();
      const toStr = (v: any) => (v == null || v === "" ? "" : String(v));
      setForm({
        SNO: hdr.SNO != null ? Number(hdr.SNO) : undefined,
        OPENING_STOCK_REF_NO: hdr.OPENING_STOCK_REF_NO || refNo || "",
        OPENING_STOCK_DATE: fmtDate(hdr.OPENING_STOCK_DATE),
        COMPANY_ID: toStr(hdr.COMPANY_ID),
        CAMP_ID: toStr(hdr.CAMP_ID),
        STORE_ID: toStr(hdr.STORE_ID),
        LOCATION_ID: toStr(hdr.LOCATION_ID),
        CURRENCY_ID: toStr(hdr.CURRENCY_ID),
        EXCHANGE_RATE: toStr(hdr.EXCHANGE_RATE ?? ""),
        TOTAL_QUANTITY: toStr(hdr.TOTAL_QUANTITY),
        TOTAL_VALUE_FC: toStr(hdr.TOTAL_VALUE_FC),
        TOTAL_VALUE_LC: toStr(hdr.TOTAL_VALUE_LC),
        STATUS_ID: toStr(hdr.STATUS_ID),
        REMARKS: hdr.REMARKS || "",
        STATUS_ENTRY: hdr.STATUS_ENTRY || "CF",
      });

      const showRows = await dispatch(fetchOpeningStockDtls(refNo)).unwrap();
      let rows: any[] = [];
      if (showRows.length) {
        const toStrAny = (v: any) => (v == null || v === "" ? "" : String(v));
        rows = showRows.map((d: any) => ({
          key: newKey(),
          OPENING_STOCK_DTL_ID: d.OPENING_STOCK_DTL_ID != null ? Number(d.OPENING_STOCK_DTL_ID) : undefined,
          LINE_NO: d.LINE_NO != null ? Number(d.LINE_NO) : undefined,
          MAIN_CATEGORY_ID: d.MAIN_CATEGORY_ID != null ? Number(d.MAIN_CATEGORY_ID) : undefined,
          SUB_CATEGORY_ID: d.SUB_CATEGORY_ID != null ? Number(d.SUB_CATEGORY_ID) : undefined,
          PRODUCT_ID: d.PRODUCT_ID != null ? Number(d.PRODUCT_ID) : undefined,
          NO_OF_PCS_PER_PACKING: toStrAny(d.NO_OF_PCS_PER_PACKING),
          TOTAL_QUANTITY: toStrAny(d.TOTAL_QUANTITY),
          UOM_ID: d.UOM_ID != null ? Number(d.UOM_ID) : undefined,
          ALT_QUANTITY: toStrAny(d.ALT_QUANTITY),
          ALT_UOM_ID: d.ALT_UOM_ID != null ? Number(d.ALT_UOM_ID) : undefined,
          RATE_FC: toStrAny(d.RATE_FC),
          TOTAL_COST_FC: toStrAny(d.TOTAL_COST_FC),
          EXCHANGE_RATE: toStrAny(d.EXCHANGE_RATE),
          RATE_LC: toStrAny(d.RATE_LC),
          TOTAL_COST_LC: toStrAny(d.TOTAL_COST_LC),
          BATCH_NO: d.BATCH_NO || "",
          SERIAL_NO: d.SERIAL_NO || "",
          MANUFACTURE_DATE: fmtDate(d.MANUFACTURE_DATE),
          EXPIRY_DATE: fmtDate(d.EXPIRY_DATE),
          RACK_ID: d.RACK_ID != null ? Number(d.RACK_ID) : undefined,
          REMARKS: d.REMARKS || "",
          STATUS_ENTRY: d.STATUS_ENTRY || "CF",
        }));
      }
      setDtls(renumberDtls(rows.length ? rows : [emptyDtl(1)]));
      setDeletedIds([]);
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Failed to load record"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setStepErrors({});
    setLineErrors({});
    setFocusRequest(null);
    setDialogOpen(true);
  };

  const validateOpeningStock = (): { stepErrors: StepErrors; lineErrors: StepErrors } => {
    const stepErrors: StepErrors = {};
    const lineErrors: StepErrors = {};
    const push = (step: string, message: string) => {
      if (!stepErrors[step]) stepErrors[step] = [];
      stepErrors[step].push(message);
    };
    const pushLine = (lineKey: string, message: string) => {
      if (!lineErrors[lineKey]) lineErrors[lineKey] = [];
      lineErrors[lineKey].push(message);
    };

    if (!form.OPENING_STOCK_DATE) push(HDR_STEP, "Opening Stock Date is required");
    if (!form.COMPANY_ID) push(HDR_STEP, "Company is required");
    if (!form.CAMP_ID) push(HDR_STEP, "Camp is required");
    if (!form.STORE_ID) push(HDR_STEP, "Store is required");
    if (!form.LOCATION_ID) push(HDR_STEP, "Location is required");
    if (!form.CURRENCY_ID) push(HDR_STEP, "Currency is required");
    if (form.EXCHANGE_RATE === "" || form.EXCHANGE_RATE == null || Number(form.EXCHANGE_RATE) <= 0) {
      push(HDR_STEP, "Exchange Rate is required and must be greater than 0");
    }
    if (!form.STATUS_ID) push(HDR_STEP, "Status is required");

    const meaningful = (r: any) => r.PRODUCT_ID || r.MAIN_CATEGORY_ID;

    const validRows = dtls.filter(meaningful);
    if (validRows.length === 0) {
      push(REVIEW_STEP, "At least one opening stock detail line is required");
    } else {
      const lineNos = validRows.map((r: any) => String(r.LINE_NO ?? ""));
      if (new Set(lineNos).size !== lineNos.length) {
        push(REVIEW_STEP, "Line No must be unique within the same Opening Stock");
      }
    }

    validRows.forEach((r: any) => {
      const label = `Line ${r.LINE_NO ?? "?"}`;
      if (!r.MAIN_CATEGORY_ID) pushLine(r.key, `${label}: Main Category is required`);
      if (!r.PRODUCT_ID) pushLine(r.key, `${label}: Product is required`);
      if (r.TOTAL_QUANTITY === "" || r.TOTAL_QUANTITY == null || Number(r.TOTAL_QUANTITY) < 0) {
        pushLine(r.key, `${label}: Quantity is required`);
      }
      if (r.RATE_FC === "" || r.RATE_FC == null || Number(r.RATE_FC) < 0) {
        pushLine(r.key, `${label}: Rate (FC) is required`);
      }
      if (r.EXPIRY_DATE && r.MANUFACTURE_DATE && fmtDate(r.EXPIRY_DATE) < fmtDate(r.MANUFACTURE_DATE)) {
        pushLine(r.key, `${label}: Expiry Date cannot be before Manufacture Date`);
      }
    });

    const broken = Object.keys(lineErrors);
    if (broken.length > 0) {
      push(DTL_STEP, `${broken.length} line${broken.length === 1 ? "" : "s"} need attention`);
    }

    return { stepErrors, lineErrors };
  };

  const handleSave = async () => {
    const { stepErrors, lineErrors } = validateOpeningStock();
    setStepErrors(stepErrors);
    setLineErrors(lineErrors);
    const firstBad = SECTION_ORDER.find((k) => (stepErrors[k]?.length ?? 0) > 0);
    if (firstBad) {
      const firstLine = Object.keys(lineErrors)[0];
      focusOn(firstBad === DTL_STEP && firstLine ? lineStepKey(firstLine) : firstBad);
      toast({ title: stepErrors[firstBad][0], variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    const validRows = dtls.filter((r: any) => r.PRODUCT_ID || r.MAIN_CATEGORY_ID);

    setSaving(true);
    try {
      const toNum = (v: any) => {
        if (v === "" || v === null || v === undefined) return null;
        const n = Number(v);
        return isNaN(n) ? null : Math.max(0, n);
      };
      const headerRate = toNum(form.EXCHANGE_RATE) ?? 0;
      const payload: Record<string, any> = {
        SNO: editing ? toNum(form.SNO) : undefined,
        OPENING_STOCK_REF_NO: editing ? String(editing.openingStockNo ?? editing.OPENING_STOCK_REF_NO ?? form.OPENING_STOCK_REF_NO) : "",
        OPENING_STOCK_DATE: form.OPENING_STOCK_DATE || null,
        COMPANY_ID: toNum(form.COMPANY_ID),
        CAMP_ID: toNum(form.CAMP_ID),
        STORE_ID: toNum(form.STORE_ID),
        LOCATION_ID: toNum(form.LOCATION_ID),
        CURRENCY_ID: toNum(form.CURRENCY_ID),
        EXCHANGE_RATE: headerRate,
        STATUS_ID: toNum(form.STATUS_ID),
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_ENTRY: form.STATUS_ENTRY || "CF",
        dtls: validRows.map((r: any) => ({
          OPENING_STOCK_DTL_ID: r.OPENING_STOCK_DTL_ID || undefined,
          LINE_NO: toNum(r.LINE_NO),
          MAIN_CATEGORY_ID: toNum(r.MAIN_CATEGORY_ID),
          SUB_CATEGORY_ID: toNum(r.SUB_CATEGORY_ID),
          PRODUCT_ID: toNum(r.PRODUCT_ID),
          NO_OF_PCS_PER_PACKING: toNum(r.NO_OF_PCS_PER_PACKING),
          TOTAL_QUANTITY: toNum(r.TOTAL_QUANTITY),
          UOM_ID: toNum(r.UOM_ID),
          ALT_QUANTITY: toNum(r.ALT_QUANTITY),
          ALT_UOM_ID: toNum(r.ALT_UOM_ID),
          RATE_FC: toNum(r.RATE_FC),
          EXCHANGE_RATE: headerRate,
          BATCH_NO: r.BATCH_NO?.trim() || null,
          SERIAL_NO: r.SERIAL_NO?.trim() || null,
          MANUFACTURE_DATE: r.MANUFACTURE_DATE || null,
          EXPIRY_DATE: r.EXPIRY_DATE || null,
          RACK_ID: toNum(r.RACK_ID),
          REMARKS: r.REMARKS?.trim() || null,
          STATUS_ENTRY: r.STATUS_ENTRY || "CF",
        })),
        deletedIds,
        USER: user?.loginName || "Admin",
        MAC_ADDRESS: "WEB",
        ROLE: role,
      };

      if (editing) {
        const res = await dispatch(updateOpeningStock(payload as OpeningStockGridData)).unwrap();
        toast({ title: res?.message ?? "Opening Stock updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addOpeningStock(payload as OpeningStockGridData)).unwrap();
        toast({ title: res?.message ?? "Opening Stock created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      setStepErrors({});
      setLineErrors({});
      setFocusRequest(null);
      dispatch(fetchOpeningStocks({}));
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error saving opening stock"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deleteOpeningStockHdr(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Opening Stock deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchOpeningStocks({}));
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error deleting opening stock"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (key: string, label: string, type: "text" | "number" | "date" | "select" | "textarea", options?: { value: string; label: string }[], required?: boolean, placeholder?: string, disabled?: boolean, helper?: string, onChange?: (value: string) => void) => {
    const baseClass = "flex flex-col gap-1.5";
    const isEmpty = required && !form[key];
    const fieldBorderClass = isEmpty ? "border-destructive ring-1 ring-destructive/30" : "";
    const set = (v: string) => (onChange ? onChange(v) : updateForm(key, v));
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : baseClass}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}{helper && <span className="text-muted-foreground font-normal ml-1">({helper})</span>}</Label>
        {type === "select" ? (
          <Select value={form[key] || ""} onValueChange={(v) => { if (!disabled) set(v); }} disabled={disabled}>
            <SelectTrigger className={`h-9 text-xs ${fieldBorderClass} ${disabled ? "opacity-70" : ""}`}><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
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
          <Input type={type === "number" ? "number" : "text"} min={type === "number" ? "0" : undefined} step={type === "number" ? "any" : undefined} value={form[key] ?? ""} onChange={(e) => set(e.target.value)} placeholder={placeholder} className={`h-9 text-xs ${fieldBorderClass}`} />
        )}
      </div>
    );
  };

  const updateForm = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const productField: FieldDescriptor = {
    key: "PRODUCT_ID",
    label: "Product",
    kind: "searchable",
    required: true,
    options: (row: any) => productOptionsFor(form.COMPANY_ID, row.MAIN_CATEGORY_ID),
    transform: (v) => Number(v),
    placeholder: "Search & select product",
  };

  /* ------------------------------------------------- wizard line groups --- */
  const lineGroups = (): FieldGroup[] => [
    {
      title: "Product",
      fields: [
        {
          key: "MAIN_CATEGORY_ID",
          label: "Main Category",
          kind: "select",
          required: true,
          options: mainCategoryOptions,
          transform: (v) => Number(v),
          placeholder: "Select main category",
        },
        {
          key: "SUB_CATEGORY_ID",
          label: "Sub Category",
          kind: "select",
          options: (row: any) => subCategoryOptionsFor(row.MAIN_CATEGORY_ID),
          transform: (v) => Number(v),
          placeholder: "Select sub category",
        },
        {
          key: "NO_OF_PCS_PER_PACKING",
          label: "Pcs / Packing",
          kind: "computed",
          hint: "from product",
          display: (row: any) => row.NO_OF_PCS_PER_PACKING ?? "-",
        },
      ],
    },
    {
      title: "Quantity & UOM",
      fields: [
        {
          key: "TOTAL_QUANTITY",
          label: "Quantity",
          kind: "number",
          min: 0,
          step: "any",
          transform: (v) => clampNonNegative(v),
        },
        {
          key: "UOM_ID",
          label: "UOM",
          kind: "computed",
          required: true,
          display: (row: any) =>
            uomOptions.find((o: any) => o.value === String(row.UOM_ID))?.label || "-",
        },
        {
          key: "ALT_QUANTITY",
          label: "Alt Quantity",
          kind: "computed",
          hint: "auto",
          display: (row: any) => row.ALT_QUANTITY || "-",
        },
        {
          key: "ALT_UOM_ID",
          label: "Alt UOM",
          kind: "computed",
          display: (row: any) =>
            uomOptions.find((o: any) => o.value === String(row.ALT_UOM_ID))?.label || "-",
        },
      ],
    },
    {
      title: "Rates & Totals",
      fields: [
        {
          key: "RATE_FC",
          label: "Rate (FC)",
          kind: "number",
          min: 0,
          step: "any",
          transform: (v) => clampNonNegative(v),
        },
        {
          key: "EXCHANGE_RATE",
          label: "Exchange Rate",
          kind: "computed",
          hint: "from header",
          display: (row: any) => form.EXCHANGE_RATE || "-",
        },
        {
          key: "TOTAL_COST_FC",
          label: "Total Cost (FC)",
          kind: "computed",
          hint: "auto",
          display: (row: any) => lineAmounts(row, form.EXCHANGE_RATE).TOTAL_COST_FC,
        },
        {
          key: "RATE_LC",
          label: "Rate (LC)",
          kind: "computed",
          hint: "auto",
          display: (row: any) => lineAmounts(row, form.EXCHANGE_RATE).RATE_LC,
        },
        {
          key: "TOTAL_COST_LC",
          label: "Total Cost (LC)",
          kind: "computed",
          hint: "auto",
          display: (row: any) => lineAmounts(row, form.EXCHANGE_RATE).TOTAL_COST_LC,
        },
      ],
    },
    {
      title: "Batch & Storage",
      fields: [
        {
          key: "BATCH_NO",
          label: "Batch No",
          kind: "text",
          maxLength: 100,
          placeholder: "Batch no",
        },
        {
          key: "SERIAL_NO",
          label: "Serial No",
          kind: "text",
          maxLength: 100,
          placeholder: "Serial no",
        },
        {
          key: "MANUFACTURE_DATE",
          label: "Manufacture Date",
          kind: "date",
        },
        {
          key: "EXPIRY_DATE",
          label: "Expiry Date",
          kind: "date",
        },
        {
          key: "RACK_ID",
          label: "Rack",
          kind: "select",
          options: rackOptions,
          transform: (v) => Number(v),
          placeholder: "Select rack",
        },
        {
          key: "REMARKS",
          label: "Remarks",
          kind: "textarea",
          placeholder: "Remarks",
        },
      ],
    },
  ];

  const headerLabels = useMemo(() => {
    return {
      COMPANY_ID: labelOf(companyOptions, form.COMPANY_ID),
      CAMP_ID: labelOf(campOptions, form.CAMP_ID),
      STORE_ID: labelOf(storeOptions, form.STORE_ID),
      LOCATION_ID: labelOf(locationOptions, form.LOCATION_ID),
      CURRENCY_ID: labelOf(currencyOptions, form.CURRENCY_ID),
      STATUS_ID: labelOf(statusOptions, form.STATUS_ID),
    };
  }, [
    form.COMPANY_ID, form.CAMP_ID, form.STORE_ID, form.LOCATION_ID, form.CURRENCY_ID, form.STATUS_ID,
    companyOptions, campOptions, storeOptions, locationOptions, currencyOptions, statusOptions,
  ]);

  const reviewRows = useMemo(
    () =>
      dtls.map((r: any) => ({
        ...r,
        ...(productOf(r.PRODUCT_ID) ? { PRODUCT_NAME: productOf(r.PRODUCT_ID)?.PRODUCT_NAME } : {}),
        MAIN_CATEGORY_NAME: labelOf(mainCategoryOptions, r.MAIN_CATEGORY_ID),
        SUB_CATEGORY_NAME: labelOf(subCategoryOptionsFor(r.MAIN_CATEGORY_ID), r.SUB_CATEGORY_ID),
        UOM_NAME: labelOf(uomOptions, r.UOM_ID),
        ALT_UOM_NAME: labelOf(uomOptions, r.ALT_UOM_ID),
        RACK_NAME: labelOf(rackOptions, r.RACK_ID),
      })).filter(
        (r: any) => r.PRODUCT_ID || r.MAIN_CATEGORY_ID
      ),
    [dtls, mainCategoryOptions, subCategories, uomOptions, rackOptions, products]
  );

  const focusOn = (key: string) => setFocusRequest({ key, nonce: Date.now() });
  const scrollToLine = (row: any) => {
    focusOn(lineStepKey(row.key));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Opening Stock</h1>
          <p className="text-sm text-muted-foreground">Manage opening stock header and detail data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Opening Stock
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search opening stock records..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs w-20">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Ref No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Date</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Camp</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Store</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Location</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Currency</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Ex. Rate</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Total Qty</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Value FC</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Value LC</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status Entry</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => {
                  const refNo = item.openingStockNo ?? item.OPENING_STOCK_REF_NO;
                  return (
                  <tr key={item.id || idx} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                      {isAdmin && <button onClick={() => setDeleteId(refNo)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>}
                    </td>
                    <td className="p-3 font-medium">{refNo || "-"}</td>
                    <td className="p-3">{formatDate(item.openingStockDate)}</td>
                    <td className="p-3">{item.companyName || "-"}</td>
                    <td className="p-3">{item.campName || "-"}</td>
                    <td className="p-3">{item.storeName || item.STORE_NAME || "-"}</td>
                    <td className="p-3">{item.locationName || "-"}</td>
                    <td className="p-3">{item.currencyName || "-"}</td>
                    <td className="p-3">{item.EXCHANGE_RATE ?? "-"}</td>
                    <td className="p-3">{item.TOTAL_QUANTITY ?? "-"}</td>
                    <td className="p-3">{item.TOTAL_VALUE_FC ?? "-"}</td>
                    <td className="p-3">{item.TOTAL_VALUE_LC ?? "-"}</td>
                    <td className="p-3">{item.statusName || item.STATUS_NAME || "-"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${entryBadgeClass(item.STATUS_ENTRY)} px-2 py-0.5 text-xs font-semibold whitespace-nowrap`}>
                        {entryLabel(item.STATUS_ENTRY)}
                      </Badge>
                    </td>
                    <td className="p-3">{item.REMARKS || "-"}</td>
                  </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr><td colSpan={15} className="p-8 text-center text-muted-foreground">No opening stock records found</td></tr>
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
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="h-8 text-xs">Previous</Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="h-8 w-8 text-xs p-0">{page}</Button>;
              })}
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="h-8 text-xs">Next</Button>
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
            ? `Edit Opening Stock (${editing.openingStockNo ?? editing.OPENING_STOCK_REF_NO})`
            : "Add Opening Stock"
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
          title="Header Information"
          subtitle="Company, date, currency and status"
          errors={stepErrors[HDR_STEP]}
        >
          <div className="grid grid-cols-2 gap-4">
            {renderField("OPENING_STOCK_DATE", "Opening Stock Date", "date", undefined, true)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField("COMPANY_ID", "Company", "select", companyOptions, true, "No company mapped to your login", true, "from your login")}
            {renderField("CAMP_ID", "Camp", "select", campOptions, true, "No camp mapped to your login", true, "from your login")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField("STORE_ID", "Store", "select", storeOptions, true, "No store mapped to your login", true, "from your login")}
            {renderField("LOCATION_ID", "Location", "select", locationOptions, true, "Select location")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField("CURRENCY_ID", "Currency", "select", currencyOptions, true, "Select currency", false, undefined, handleCurrencyChange)}
            {renderField("EXCHANGE_RATE", "Exchange Rate", "number", undefined, true, "Auto-filled from the selected currency")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField("STATUS_ID", "Status", "select", statusOptions, false, "Status Master is unavailable - set on creation", true, "set by the workflow")}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">
                Status Entry
                <span className="text-muted-foreground font-normal ml-1">(set by the workflow)</span>
              </Label>
              <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-xs font-medium">
                {entryLabel(form.STATUS_ENTRY)}
              </div>
            </div>
          </div>
          {renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}
        </WizardSection>

        <WizardSection
          stepKey={DTL_STEP}
          title="Detail Lines"
          subtitle="Line numbers are assigned automatically and renumber when a line is removed"
          errors={stepErrors[DTL_STEP]}
          actions={
            <Button variant="outline" size="sm" onClick={addDtl} className="h-8 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Line
            </Button>
          }
        >
          {dtls.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              No detail lines yet. Use Add Line to start one.
            </p>
          ) : (
            <div className="space-y-3">
              {dtls.map((row: any) => (
                <DetailLineCard
                  key={row.key}
                  anchor={lineStepKey(row.key)}
                  title={`Line ${row.LINE_NO ?? "?"}`}
                  subtitle={
                    (row.PRODUCT_NAME && String(row.PRODUCT_NAME)) ||
                    labelOf(productOptionsFor(form.COMPANY_ID, row.MAIN_CATEGORY_ID), row.PRODUCT_ID) ||
                    "Not filled in yet"
                  }
                  groups={lineGroups()}
                  row={row}
                  primaryField={productField}
                  errors={lineErrors[row.key]}
                  onChange={(field, value) => updateDtl(row.key, field, value)}
                  onRemove={() => removeDtl(row.key)}
                />
              ))}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            Blank lines stay while you work and are dropped on save.
          </p>
        </WizardSection>

        <WizardSection
          stepKey={REVIEW_STEP}
          title="Review & Create"
          subtitle="Header and every detail line on one page"
          errors={stepErrors[REVIEW_STEP]}
        >
          <OpeningStockReview
            form={form}
            headerLabels={headerLabels}
            rows={reviewRows}
            headerRate={Number(form.EXCHANGE_RATE) || 0}
            onEditLine={scrollToLine}
            onAddLine={addDtl}
          />
        </WizardSection>
      </WizardShell>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this opening stock record along with all its detail lines.</AlertDialogDescription>
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