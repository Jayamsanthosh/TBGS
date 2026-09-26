"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchPurchaseRequests,
  addPurchaseRequest,
  updatePurchaseRequest,
  deletePurchaseRequestHdr,
  fetchPurchaseRequestHdr,
  fetchPurchaseRequestDtls,
  fetchPurchaseRequestDtl,
  clearPurchaseRequestMasterError,
  PurchaseRequestGridData,
} from "@/lib/purchaseRequestMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { formatDate, clampNonNegative } from "@/lib/validation";
import { DatePicker } from "@/components/ui/date-picker";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";
import { useToast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const statusEntryOptions = [
  { value: "CF", label: "Draft" },
  { value: "CL", label: "Submitted" },
  { value: "INACTIVE", label: "Inactive" },
];

const entryLabel = (s: any) => {
  const v = String(s).toUpperCase();
  if (v === "CF") return "Draft";
  if (v === "CL" || v === "SUBMITTED") return "Submitted";
  if (v === "INACTIVE" || v === "IN" || v === "IA") return "Inactive";
  return String(s || "");
};

const entryBadgeClass = (s: any) => {
  const v = String(s).toUpperCase();
  if (v === "CF") return "bg-blue-500/10 text-blue-600 border-blue-200";
  if (v === "CL" || v === "SUBMITTED") return "bg-green-500/10 text-green-600 border-green-200";
  return "bg-red-500/10 text-red-600 border-red-200";
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

const fmtDate = (d: any) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
};

export default function PurchaseRequestPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.purchaseRequestMaster);
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [finalStatusFilter, setFinalStatusFilter] = useState<string>("ALL");
  const [statusEntryFilter, setStatusEntryFilter] = useState<string>("ALL");
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseRequestGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [step, setStep] = useState(1);
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

  const { data: employees } = useApiQuery("pr-master-employees", () => fetchList(`${API_URL}/employee-database?status=AC`));
  const { data: companies } = useApiQuery("pr-master-companies", () => fetchList(`${API_URL}/company-master`));
  const { data: branches } = useApiQuery("pr-master-branches", () => fetchList(`${API_URL}/branch-master?status=AC`));
  const { data: stores } = useApiQuery("pr-master-stores", () => fetchList(`${API_URL}/store-master`));
  const { data: camps } = useApiQuery("pr-master-camps", () => fetchList(`${API_URL}/camp-master`));
  const { data: requestTypes } = useApiQuery("pr-master-request-types", () => fetchList(`${API_URL}/purchase-request-type-master/load?includeInactive=false`));
  const { data: priorities } = useApiQuery("pr-master-priorities", () => fetchList(`${API_URL}/priority-master?status=AC`));
  const { data: statuses } = useApiQuery("pr-master-statuses", () => fetchList(`${API_URL}/status-master/load?includeInactive=false`));
  const { data: locations } = useApiQuery("pr-master-locations", () => fetchList(`${API_URL}/location-master`));
  const { data: refTypes } = useApiQuery("pr-master-ref-types", () => fetchList(`${API_URL}/reference-type-master/load?includeInactive=false`));
  const { data: mainCategories } = useApiQuery("pr-master-main-categories", () => fetchList(`${API_URL}/product-main-category`));
  const { data: subCategories } = useApiQuery("pr-master-sub-categories", () => fetchList(`${API_URL}/product-sub-category`));
  const { data: products } = useApiQuery("pr-master-products", () => fetchList(`${API_URL}/product-master`));
  const { data: uoms } = useApiQuery("pr-master-uoms", () => fetchList(`${API_URL}/uom-master`));
  const { data: trucks } = useApiQuery("pr-master-trucks", () => fetchList(`${API_URL}/truck-master?status=AC`));

  const opt = (rows: any[] | undefined, valueKey: string, labelKey: string) =>
    (Array.isArray(rows) ? rows : []).map((r: any) => ({
      value: String(r[valueKey] ?? ""),
      label: String(r[labelKey] ?? ""),
    }));

  const companyOptions = useMemo(
    () => opt(companies, "COMPANY_ID", "COMPANY_NAME").filter((o) => o.value),
    [companies]
  );
  const branchOptions = useMemo(() => opt(branches, "BRANCH_ID", "BRANCH_NAME").filter((o) => o.value), [branches]);
  const storeOptions = useMemo(
    () =>
      (Array.isArray(stores) ? stores : []).map((r: any) => ({
        value: String(r.STORE_ID ?? r.Store_Id ?? ""),
        label: String(r.STORE_NAME ?? r.Store_Name ?? ""),
      })).filter((o) => o.value),
    [stores]
  );
  const campOptions = useMemo(() => opt(camps, "CAMP_ID", "CAMP_NAME").filter((o) => o.value), [camps]);
  const priorityOptions = useMemo(() => opt(priorities, "PRIORITY_ID", "PRIORITY_NAME").filter((o) => o.value), [priorities]);
  const statusOptions = useMemo(
    () =>
      (Array.isArray(statuses) ? statuses : []).map((s: any) => ({
        value: String(s.statusId ?? ""),
        label: s.displayText || s.statusName || "",
      })).filter((o) => o.value),
    [statuses]
  );
  const requestTypeOptions = useMemo(
    () =>
      (Array.isArray(requestTypes) ? requestTypes : []).map((r: any) => ({
        value: String(r.requestTypeId ?? ""),
        label: r.displayText || r.requestTypeName || "",
      })).filter((o) => o.value),
    [requestTypes]
  );
  const refTypeOptions = useMemo(
    () =>
      (Array.isArray(refTypes) ? refTypes : []).map((r: any) => ({
        value: String(r.referenceTypeId ?? ""),
        label: r.displayText || r.referenceTypeName || "",
      })).filter((o) => o.value),
    [refTypes]
  );
  const locationOptions = useMemo(() => opt(locations, "LOCATION_ID", "LOCATION_NAME").filter((o) => o.value), [locations]);
  const mainCategoryOptions = useMemo(() => opt(mainCategories, "MAIN_CATEGORY_ID", "MAIN_CATEGORY_NAME").filter((o) => o.value), [mainCategories]);
  const uomOptions = useMemo(() => opt(uoms, "UOM_ID", "UOM_NAME").filter((o) => o.value), [uoms]);
  const truckOptions = useMemo(
    () =>
      (Array.isArray(trucks) ? trucks : []).map((t: any) => ({
        value: String(t.TRUCK_ID ?? ""),
        label: t.TRUCK_NO || "",
      })).filter((o) => o.value),
    [trucks]
  );

  const subCategoryOptionsFor = (mainId?: any) =>
    (Array.isArray(subCategories) ? subCategories : [])
      .filter((s: any) => !mainId || String(s.MAIN_CATEGORY_ID) === String(mainId))
      .map((s: any) => ({ value: String(s.SUB_CATEGORY_ID), label: s.SUB_CATEGORY_NAME }));

  const productOptionsFor = (companyId?: any, mainId?: any) =>
    (Array.isArray(products) ? products : [])
      .filter((p: any) => (!companyId || String(p.COMPANY_ID) === String(companyId)) && (!mainId || String(p.MAIN_CATEGORY_ID) === String(mainId)))
      .map((p: any) => ({ value: String(p.PRODUCT_ID), label: p.PRODUCT_NAME }));

  const uniqueFinalStatuses = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const set = new Set<string>();
    items.forEach((d: any) => {
      const s = d.finalResponseStatus;
      if (s) set.add(String(s));
    });
    return Array.from(set);
  }, [items]);

  const uniqueStatusEntries = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const set = new Set<string>();
    items.forEach((d: any) => {
      const s = d.statusEntry;
      if (s) set.add(String(s));
    });
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((d: any) => {
      const matchesFinal = finalStatusFilter === "ALL" || String(d.finalResponseStatus) === finalStatusFilter;
      const matchesEntry = statusEntryFilter === "ALL" || String(d.statusEntry) === statusEntryFilter;
      if (!matchesFinal || !matchesEntry) return false;
      const searchable = [
        d.purchaseRequestNo,
        d.requestedBy,
        d.companyName,
        d.branchName,
        d.poStoreName,
        d.campName,
        d.requestStoreName,
        d.requestTypeName,
        d.priorityName,
        d.statusName,
      ].join(" ").toLowerCase();
      return searchable.includes(search.toLowerCase());
    }).sort((a: any, b: any) => (b.sno || b.purchaseRequestNo || "") > (a.sno || a.purchaseRequestNo || "") ? 1 : -1);
  }, [items, search, finalStatusFilter, statusEntryFilter]);

  const effectivePageSize: number | "ALL" = pageSize === "ALL" ? "ALL" : pageSize > filtered.length ? "ALL" : pageSize;
  const availablePageSizes = (PAGE_SIZES as readonly (number | "ALL")[]).filter((s) => s === "ALL" || s <= filtered.length);
  const totalPages = effectivePageSize === "ALL" ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const paginated = useMemo(() => {
    if (effectivePageSize === "ALL") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize]);

  useEffect(() => {
    dispatch(fetchPurchaseRequests({}));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearPurchaseRequestMasterError());
    }
  }, [error, dispatch, toast]);

  const newKey = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random();

  const emptyDtl = (lineNo: number) => ({
    key: newKey(),
    PURCHASE_REQUEST_DTL_ID: undefined as number | undefined,
    REFERENCE_TYPE_ID: undefined as number | undefined,
    REFERENCE_NO: "",
    LINE_NO: lineNo,
    MAIN_CATEGORY_ID: undefined as number | undefined,
    SUB_CATEGORY_ID: undefined as number | undefined,
    PRODUCT_ID: undefined as number | undefined,
    DESCRIPTION: "",
    NO_OF_PCS_PER_PACKING: "",
    Total_Quantity: "",
    UOM_ID: undefined as number | undefined,
    Total_Packing: "",
    ALT_UOM_ID: undefined as number | undefined,
    TRUCK_ID: undefined as number | undefined,
    REQUIRED_DATE: "",
    REASON: "",
    STATUS_ENTRY: "CF",
  });

  const [dtls, setDtls] = useState<any[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);

  const emptyForm = () => ({
    PURCHASE_REQUEST_NO: "",
    PURCHASE_REQUEST_DATE: fmtDate(new Date()),
    REQUESTED_BY_EMP_ID: "",
    COMPANY_ID: "",
    BRANCH_ID: "",
    PO_STORE_ID: "",
    CAMP_ID: "",
    REQUEST_STORE_ID: "",
    REQUEST_TYPE_ID: "",
    PRIORITY_ID: "",
    REQUIRED_DATE: "",
    REASON: "",
    STATUS_ID: "",
    REMARKS: "",
    STATUS_ENTRY: "CF",
    DELIVERY_LOCATION_ID: "",
  });

  const updateForm = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRequestedByChange = (empId: string) => {
    setForm((prev) => ({ ...prev, REQUESTED_BY_EMP_ID: empId }));

    const empGrid = Array.isArray(employees)
      ? employees.find((e: any) => String(e.EMP_ID) === String(empId))
      : undefined;

    const applyFullEmp = (fullEmp: any) => {
      if (!fullEmp) {
        setForm((prev) => ({ ...prev, COMPANY_ID: "", CAMP_ID: "", PO_STORE_ID: "" }));
        return;
      }
      setForm((prev) => ({
        ...prev,
        REQUESTED_BY_EMP_ID: empId,
        COMPANY_ID: fullEmp.COMPANY_ID != null && fullEmp.COMPANY_ID !== "" ? String(fullEmp.COMPANY_ID) : "",
        CAMP_ID: fullEmp.CAMP_ID != null && fullEmp.CAMP_ID !== "" ? String(fullEmp.CAMP_ID) : "",
        PO_STORE_ID: fullEmp.STORE_ID != null && fullEmp.STORE_ID !== "" ? String(fullEmp.STORE_ID) : "",
      }));
    };

    if (!empGrid) {
      applyFullEmp(null);
      return;
    }

    if (empGrid.SNO != null && empGrid.SNO !== "") {
      fetch(`${API_URL}/employee-database/${empGrid.SNO}`)
        .then((res) => res.json())
        .then((json: any) => applyFullEmp(json?.success && json.data ? json.data : null))
        .catch(() => applyFullEmp(null));
    } else {
      applyFullEmp({
        COMPANY_ID: empGrid.COMPANY_ID ?? "",
        CAMP_ID: empGrid.CAMP_ID ?? "",
        PO_STORE_ID: empGrid.STORE_ID ?? "",
      });
    }
  };

  const updateDtl = (key: string, field: string, value: any) => {
    setDtls((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        if (field === "MAIN_CATEGORY_ID") {
          return { ...r, MAIN_CATEGORY_ID: value, SUB_CATEGORY_ID: undefined, PRODUCT_ID: undefined };
        }
        if (field === "PRODUCT_ID") {
          const p = (Array.isArray(products) ? products : []).find((x: any) => String(x.PRODUCT_ID) === String(value));
          if (!p) return { ...r, PRODUCT_ID: value };
          return {
            ...r,
            PRODUCT_ID: value,
            MAIN_CATEGORY_ID: p.MAIN_CATEGORY_ID != null ? Number(p.MAIN_CATEGORY_ID) : r.MAIN_CATEGORY_ID,
            SUB_CATEGORY_ID: p.SUB_CATEGORY_ID != null ? Number(p.SUB_CATEGORY_ID) : r.SUB_CATEGORY_ID,
            NO_OF_PCS_PER_PACKING: p.NO_OF_PCS_PER_PACKING != null && p.NO_OF_PCS_PER_PACKING !== "" ? String(p.NO_OF_PCS_PER_PACKING) : r.NO_OF_PCS_PER_PACKING,
            UOM_ID: p.UOM_ID != null ? Number(p.UOM_ID) : r.UOM_ID,
            ALT_UOM_ID: p.ALTERNATE_UOM_ID != null ? Number(p.ALTERNATE_UOM_ID) : r.ALT_UOM_ID,
            DESCRIPTION: r.DESCRIPTION || p.PRODUCT_NAME || r.DESCRIPTION,
          };
        }
        if (field === "Total_Quantity" || field === "NO_OF_PCS_PER_PACKING") {
          const qty = field === "Total_Quantity" ? value : r.Total_Quantity;
          const pcs = field === "NO_OF_PCS_PER_PACKING" ? value : r.NO_OF_PCS_PER_PACKING;
          const qn = Number(qty);
          const pn = Number(pcs);
          const packing = qty !== "" && pcs !== "" && !isNaN(qn) && !isNaN(pn) && pn > 0 ? (qn / pn).toFixed(3) : r.Total_Packing;
          return { ...r, [field]: value, Total_Packing: packing };
        }
        if (field === "REQUIRED_DATE") {
          return { ...r, REQUIRED_DATE: value || form.REQUIRED_DATE || "" };
        }
        return { ...r, [field]: value };
      })
    );
  };

  const nextLineNo = () => {
    const lines = dtls.map((r: any) => Number(r.LINE_NO) || 0);
    return lines.length ? Math.max(...lines) + 1 : 1;
  };

  const addDtl = () => {
    setDtls((prev) => [...prev, emptyDtl(nextLineNo())]);
  };

  const removeDtl = (key: string) => {
    const row = dtls.find((r) => r.key === key);
    if (row?.PURCHASE_REQUEST_DTL_ID) {
      setDeletedIds((d) => [...d, Number(row.PURCHASE_REQUEST_DTL_ID)]);
    }
    setDtls((prev) => prev.filter((r) => r.key !== key));
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDtls([emptyDtl(1)]);
    setDeletedIds([]);
    setStep(1);
    setDialogOpen(true);
  };

  const openEdit = async (item: any) => {
    setEditing(item);
    try {
      const refNo = item.purchaseRequestNo ?? item.PURCHASE_REQUEST_NO;
      const hdr = await dispatch(fetchPurchaseRequestHdr(refNo)).unwrap();
      const toStr = (v: any) => (v == null || v === "" ? "" : String(v));
      setForm({
        PURCHASE_REQUEST_NO: hdr.PURCHASE_REQUEST_NO || refNo || "",
        PURCHASE_REQUEST_DATE: fmtDate(hdr.PURCHASE_REQUEST_DATE),
        REQUESTED_BY_EMP_ID: toStr(hdr.REQUESTED_BY_EMP_ID),
        COMPANY_ID: toStr(hdr.COMPANY_ID),
        BRANCH_ID: toStr(hdr.BRANCH_ID),
        PO_STORE_ID: toStr(hdr.PO_STORE_ID),
        CAMP_ID: toStr(hdr.CAMP_ID),
        REQUEST_STORE_ID: toStr(hdr.REQUEST_STORE_ID),
        REQUEST_TYPE_ID: toStr(hdr.REQUEST_TYPE_ID),
        PRIORITY_ID: toStr(hdr.PRIORITY_ID),
        REQUIRED_DATE: fmtDate(hdr.REQUIRED_DATE),
        REASON: hdr.REASON || "",
        STATUS_ID: toStr(hdr.STATUS_ID),
        REMARKS: hdr.REMARKS || "",
        STATUS_ENTRY: hdr.STATUS_ENTRY || "CF",
        DELIVERY_LOCATION_ID: toStr(hdr.DELIVERY_LOCATION_ID),
      });

      const showRows = await dispatch(fetchPurchaseRequestDtls(refNo)).unwrap();
      let rows: any[] = [];
      if (showRows.length) {
        const fetched = await Promise.all(
          showRows.map((r: any) => dispatch(fetchPurchaseRequestDtl(r.ID)).unwrap())
        );
        const toStrAny = (v: any) => (v == null || v === "" ? "" : String(v));
        rows = fetched.map((d: any) => ({
          key: newKey(),
          PURCHASE_REQUEST_DTL_ID: d.PURCHASE_REQUEST_DTL_ID != null ? Number(d.PURCHASE_REQUEST_DTL_ID) : undefined,
          REFERENCE_TYPE_ID: d.REFERENCE_TYPE_ID != null ? Number(d.REFERENCE_TYPE_ID) : undefined,
          REFERENCE_NO: d.REFERENCE_NO || "",
          LINE_NO: d.LINE_NO != null ? Number(d.LINE_NO) : undefined,
          MAIN_CATEGORY_ID: d.MAIN_CATEGORY_ID != null ? Number(d.MAIN_CATEGORY_ID) : undefined,
          SUB_CATEGORY_ID: d.SUB_CATEGORY_ID != null ? Number(d.SUB_CATEGORY_ID) : undefined,
          PRODUCT_ID: d.PRODUCT_ID != null ? Number(d.PRODUCT_ID) : undefined,
          DESCRIPTION: d.DESCRIPTION || "",
          NO_OF_PCS_PER_PACKING: toStrAny(d.NO_OF_PCS_PER_PACKING),
          Total_Quantity: toStrAny(d.Total_Quantity),
          UOM_ID: d.UOM_ID != null ? Number(d.UOM_ID) : undefined,
          Total_Packing: toStrAny(d.Total_Packing),
          ALT_UOM_ID: d.ALT_UOM_ID != null ? Number(d.ALT_UOM_ID) : undefined,
          TRUCK_ID: d.TRUCK_ID != null ? Number(d.TRUCK_ID) : undefined,
          REQUIRED_DATE: fmtDate(d.REQUIRED_DATE),
          REASON: d.REASON || "",
          STATUS_ENTRY: d.STATUS_ENTRY || "CF",
        }));
      }
      setDtls(rows.length ? rows : [emptyDtl(1)]);
      setDeletedIds([]);
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Failed to load record"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setStep(1);
    setDialogOpen(true);
  };

  const handleNext = () => {
    if (!form.PURCHASE_REQUEST_DATE) {
      toast({ title: "Purchase Request Date is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.REQUESTED_BY_EMP_ID) {
      toast({ title: "Please select the Requested By Employee", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!form.COMPANY_ID) {
      toast({ title: "Please select a Company", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSave = async () => {
    const validRows = dtls.filter((r: any) =>
      r.REFERENCE_TYPE_ID || r.PRODUCT_ID || r.MAIN_CATEGORY_ID || (r.DESCRIPTION || "").trim()
    );
    if (validRows.length === 0) {
      toast({ title: "At least one purchase request detail line is required", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    const lineNos = validRows.map((r: any) => String(r.LINE_NO ?? ""));
    if (new Set(lineNos).size !== lineNos.length) {
      toast({ title: "Line No must be unique within the same Purchase Request", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    const incomplete = validRows.find((r: any) => !r.REFERENCE_TYPE_ID || !r.MAIN_CATEGORY_ID || !r.PRODUCT_ID || !r.UOM_ID);
    if (incomplete) {
      toast({
        title: `Line ${incomplete.LINE_NO ?? "?"}: Reference Type, Main Category, Product and UOM are required`,
        variant: "destructive",
        duration: DEFAULT_TOAST_DURATION,
      });
      return;
    }

    setSaving(true);
    try {
      if (!editing) {
        const entryUp = String(form.STATUS_ENTRY || "").toUpperCase();
        if (entryUp === "INACTIVE" || entryUp === "IN" || entryUp === "IA") {
          toast({ title: "Status Entry cannot be inactive for a new record", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
          setSaving(false);
          return;
        }
      }
      const toNum = (v: any) => {
        if (v === "" || v === null || v === undefined) return null;
        const n = Number(v);
        return isNaN(n) ? null : Math.max(0, n);
      };
      const payload: Record<string, any> = {
        PURCHASE_REQUEST_NO: editing ? String(editing.purchaseRequestNo ?? editing.PURCHASE_REQUEST_NO) : "",
        PURCHASE_REQUEST_DATE: form.PURCHASE_REQUEST_DATE || null,
        REQUESTED_BY_EMP_ID: toNum(form.REQUESTED_BY_EMP_ID),
        COMPANY_ID: toNum(form.COMPANY_ID),
        BRANCH_ID: toNum(form.BRANCH_ID),
        PO_STORE_ID: toNum(form.PO_STORE_ID),
        CAMP_ID: toNum(form.CAMP_ID),
        REQUEST_STORE_ID: toNum(form.REQUEST_STORE_ID),
        REQUEST_TYPE_ID: toNum(form.REQUEST_TYPE_ID),
        PRIORITY_ID: toNum(form.PRIORITY_ID),
        REQUIRED_DATE: form.REQUIRED_DATE || null,
        REASON: form.REASON?.trim() || null,
        STATUS_ID: toNum(form.STATUS_ID),
        REMARKS: form.REMARKS?.trim() || null,
        STATUS_ENTRY: form.STATUS_ENTRY || "CF",
        DELIVERY_LOCATION_ID: toNum(form.DELIVERY_LOCATION_ID),
        dtls: validRows.map((r: any) => ({
          PURCHASE_REQUEST_DTL_ID: r.PURCHASE_REQUEST_DTL_ID || undefined,
          REFERENCE_TYPE_ID: toNum(r.REFERENCE_TYPE_ID),
          REFERENCE_NO: r.REFERENCE_NO?.trim() || null,
          LINE_NO: toNum(r.LINE_NO),
          MAIN_CATEGORY_ID: toNum(r.MAIN_CATEGORY_ID),
          SUB_CATEGORY_ID: toNum(r.SUB_CATEGORY_ID),
          PRODUCT_ID: toNum(r.PRODUCT_ID),
          DESCRIPTION: r.DESCRIPTION?.trim() || null,
          NO_OF_PCS_PER_PACKING: toNum(r.NO_OF_PCS_PER_PACKING),
          Total_Quantity: toNum(r.Total_Quantity),
          UOM_ID: toNum(r.UOM_ID),
          Total_Packing: toNum(r.Total_Packing),
          ALT_UOM_ID: toNum(r.ALT_UOM_ID),
          TRUCK_ID: toNum(r.TRUCK_ID),
          REQUIRED_DATE: r.REQUIRED_DATE || null,
          REASON: r.REASON?.trim() || null,
          STATUS_ENTRY: r.STATUS_ENTRY || "CF",
        })),
        deletedIds,
        USER: user?.loginName || "Admin",
        MAC_ADDRESS: "WEB",
        ROLE: role,
      };

      if (editing) {
        const res = await dispatch(updatePurchaseRequest(payload as PurchaseRequestGridData)).unwrap();
        toast({ title: res?.message ?? "Purchase Request updated successfully", duration: DEFAULT_TOAST_DURATION });
      } else {
        const res = await dispatch(addPurchaseRequest(payload as PurchaseRequestGridData)).unwrap();
        toast({ title: res?.message ?? "Purchase Request created successfully", duration: DEFAULT_TOAST_DURATION });
      }
      setDialogOpen(false);
      dispatch(fetchPurchaseRequests({}));
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error saving purchase request"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await dispatch(deletePurchaseRequestHdr(deleteId)).unwrap();
      setDeleteId(null);
      toast({ title: res?.message ?? "Purchase Request deleted successfully", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchPurchaseRequests({}));
    } catch (e: any) {
      toast({ title: typeof e === "string" ? e : (e?.message || "Error deleting purchase request"), variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const renderField = (key: string, label: string, type: "text" | "number" | "date" | "select" | "textarea", options?: { value: string; label: string }[], required?: boolean, placeholder?: string, disabled?: boolean, helper?: string) => {
    const baseClass = "flex flex-col gap-1.5";
    const isEmpty = required && !form[key];
    const fieldBorderClass = isEmpty ? "border-destructive ring-1 ring-destructive/30" : "";
    return (
      <div key={key} className={type === "textarea" ? "col-span-2" : baseClass}>
        <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}{helper && <span className="text-muted-foreground font-normal ml-1">({helper})</span>}</Label>
        {type === "select" ? (
          <Select value={form[key] || ""} onValueChange={(v) => { if (!disabled) updateForm(key, v); }} disabled={disabled}>
            <SelectTrigger className={`h-9 text-xs ${fieldBorderClass} ${disabled ? "opacity-70" : ""}`}><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
            <SelectContent>
              {(options || []).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={`text-xs ${fieldBorderClass}`} />
        ) : type === "date" ? (
          <DatePicker value={form[key] || ""} onChange={(v) => setForm({ ...form, [key]: v })} placeholder={placeholder} className={fieldBorderClass || undefined} />
        ) : (
          <Input type={type === "number" ? "number" : "text"} min={type === "number" ? "0" : undefined} step={type === "number" ? "any" : undefined} value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={`h-9 text-xs ${fieldBorderClass}`} />
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Request</h1>
          <p className="text-sm text-muted-foreground">Manage purchase request header and detail data</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Purchase Request
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search purchase requests..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
            {uniqueFinalStatuses.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Final Status:</span>
                <Select value={finalStatusFilter} onValueChange={(v) => { setFinalStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-35 h-9 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    {uniqueFinalStatuses.map(s => <SelectItem key={s} value={s}>{finalLabel(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {uniqueStatusEntries.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Entry:</span>
                <Select value={statusEntryFilter} onValueChange={(v) => { setStatusEntryFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-35 h-9 text-xs"><SelectValue placeholder="All Entry" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Entry</SelectItem>
                    {uniqueStatusEntries.map(s => <SelectItem key={s} value={s}>{entryLabel(s)}</SelectItem>)}
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Ref No</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">PR Date</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Requested By</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Branch</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">PO Store</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Camp</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Req Type</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Required Date</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Final Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status Entry</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                      {isAdmin && <button onClick={() => setDeleteId(item.purchaseRequestNo ?? item.PURCHASE_REQUEST_NO)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>}
                    </td>
                    <td className="p-3 font-medium">{item.purchaseRequestNo || "-"}</td>
                    <td className="p-3">{formatDate(item.purchaseRequestDate)}</td>
                    <td className="p-3">{(item.requestedBy || "-")}{item.requestedByEmpId ? ` (#${item.requestedByEmpId})` : ""}</td>
                    <td className="p-3">{item.companyName || "-"}</td>
                    <td className="p-3">{item.branchName || "-"}</td>
                    <td className="p-3">{item.poStoreName || "-"}</td>
                    <td className="p-3">{item.campName || "-"}</td>
                    <td className="p-3">{item.requestTypeName || "-"}</td>
                    <td className="p-3">{formatDate(item.requiredDate)}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${finalBadgeClass(item.finalResponseStatus)} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {finalLabel(item.finalResponseStatus)}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={`${entryBadgeClass(item.statusEntry)} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                        {entryLabel(item.statusEntry)}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={12} className="p-8 text-center text-muted-foreground">No purchase requests found</td></tr>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit Purchase Request (${editing.purchaseRequestNo ?? editing.PURCHASE_REQUEST_NO})` : "Add Purchase Request"}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-4">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 1 ? "text-primary" : "text-muted-foreground"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 1 ? "bg-primary text-primary-foreground" : "bg-green-500 text-white"}`}>
                {step > 1 ? "✓" : "1"}
              </span>
              Header
            </div>
            <div className="h-px flex-1 bg-border" />
            <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 2 ? "text-primary" : "text-muted-foreground"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</span>
              Request Details
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Header Information</h3>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Requested By <span className="text-destructive ml-0.5">*</span></Label>
                <EmployeeCombobox
                  value={form.REQUESTED_BY_EMP_ID}
                  onChange={handleRequestedByChange}
                  options={employees || []}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("PURCHASE_REQUEST_DATE", "Purchase Request Date", "date", undefined, true)}
                {renderField("COMPANY_ID", "Company", "select", companyOptions, true, "Select company", true, "from employee")}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("BRANCH_ID", "Branch", "select", branchOptions, false, "Select branch")}
                {renderField("PO_STORE_ID", "PO Store", "select", storeOptions, false, "Select PO store", true, "from employee")}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("CAMP_ID", "Camp", "select", campOptions, false, "Select camp", true, "from employee")}
                {renderField("REQUEST_STORE_ID", "Request Store", "select", storeOptions, false, "Select request store")}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("REQUEST_TYPE_ID", "Request Type", "select", requestTypeOptions, false, "Select request type")}
                {renderField("PRIORITY_ID", "Priority", "select", priorityOptions, false, "Select priority")}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("REQUIRED_DATE", "Required Date", "date", undefined, false)}
                {renderField("DELIVERY_LOCATION_ID", "Delivery Location", "select", locationOptions, false, "Select delivery location")}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderField("STATUS_ID", "Status", "select", statusOptions, false, "Select status")}
                {renderField("STATUS_ENTRY", "Status Entry", "select", statusEntryOptions, false)}
              </div>
              {renderField("REASON", "Reason", "textarea", undefined, false, "Reason...")}
              {renderField("REMARKS", "Remarks", "textarea", undefined, false, "Additional notes...")}
              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-xs">Cancel</Button>
                <Button onClick={handleNext} className="bg-primary text-primary-foreground text-xs">
                  Next <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Purchase Request Detail Lines</h3>
                <Button variant="outline" size="sm" onClick={addDtl} className="h-8 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
                </Button>
              </div>
              {dtls.length === 0 ? (
                <p className="p-4 text-center text-muted-foreground text-xs border rounded-lg">No detail lines added</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[52vh] overflow-auto">
                    <table className="w-full text-sm border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                          <th className="p-2 font-semibold min-w-[130px]">Ref Type *</th>
                          <th className="p-2 font-semibold min-w-[110px]">Line No</th>
                          <th className="p-2 font-semibold min-w-[120px]">Main Category</th>
                          <th className="p-2 font-semibold min-w-[120px]">Sub Category</th>
                          <th className="p-2 font-semibold min-w-[140px]">Product</th>
                          <th className="p-2 font-semibold min-w-[120px]">Reference No</th>
                          <th className="p-2 font-semibold min-w-[160px]">Description</th>
                          <th className="p-2 font-semibold min-w-[90px]">Pcs/Packing</th>
                          <th className="p-2 font-semibold min-w-[90px]">Quantity</th>
                          <th className="p-2 font-semibold min-w-[90px]">UOM</th>
                          <th className="p-2 font-semibold min-w-[90px]">Total Packing</th>
                          <th className="p-2 font-semibold min-w-[90px]">Alt UOM</th>
                          <th className="p-2 font-semibold min-w-[90px]">Truck</th>
                          <th className="p-2 font-semibold min-w-[120px]">Required Date</th>
                          <th className="p-2 font-semibold min-w-[130px]">Reason</th>
                          <th className="p-2 font-semibold min-w-[110px]">Status Entry</th>
                          <th className="p-2 w-9" />
                        </tr>
                      </thead>
                      <tbody>
                        {dtls.map((row) => {
                          const subOpts = subCategoryOptionsFor(row.MAIN_CATEGORY_ID);
                          const productOpts = productOptionsFor(form.COMPANY_ID, row.MAIN_CATEGORY_ID);
                          return (
                            <tr key={row.key} className="border-t hover:bg-muted/30 transition-colors">
                              <td className="p-1 pl-2">
                                <Select value={row.REFERENCE_TYPE_ID ? String(row.REFERENCE_TYPE_ID) : ""} onValueChange={(v) => updateDtl(row.key, "REFERENCE_TYPE_ID", Number(v))}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select ref type" /></SelectTrigger>
                                  <SelectContent>
                                    {refTypeOptions.map((o) => (
                                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-1">
                                <Input type="number" min="1" step="1" value={row.LINE_NO ?? ""} onChange={(e) => updateDtl(row.key, "LINE_NO", clampNonNegative(e.target.value))} className="h-8 text-xs w-24" />
                              </td>
                              <td className="p-1">
                                <Select value={row.MAIN_CATEGORY_ID ? String(row.MAIN_CATEGORY_ID) : ""} onValueChange={(v) => updateDtl(row.key, "MAIN_CATEGORY_ID", Number(v))}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Main category" /></SelectTrigger>
                                  <SelectContent>
                                    {mainCategoryOptions.map((o) => (
                                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-1">
                                <Select value={row.SUB_CATEGORY_ID ? String(row.SUB_CATEGORY_ID) : ""} onValueChange={(v) => updateDtl(row.key, "SUB_CATEGORY_ID", Number(v))}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Sub category" /></SelectTrigger>
                                  <SelectContent>
                                    {subOpts.map((o) => (
                                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-1">
                                <Select value={row.PRODUCT_ID ? String(row.PRODUCT_ID) : ""} onValueChange={(v) => updateDtl(row.key, "PRODUCT_ID", Number(v))}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Product" /></SelectTrigger>
                                  <SelectContent>
                                    {productOpts.map((o) => (
                                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-1">
                                <Input maxLength={50} value={row.REFERENCE_NO} onChange={(e) => updateDtl(row.key, "REFERENCE_NO", e.target.value)} placeholder="Ref no" className="h-8 text-xs" />
                              </td>
                              <td className="p-1">
                                <Input maxLength={500} value={row.DESCRIPTION} onChange={(e) => updateDtl(row.key, "DESCRIPTION", e.target.value)} placeholder="Description" className="h-8 text-xs" />
                              </td>
                              <td className="p-1">
                                <Input type="number" min="0" step="any" readOnly value={row.NO_OF_PCS_PER_PACKING} placeholder="From product" className="h-8 text-xs w-24 bg-muted" />
                              </td>
                              <td className="p-1">
                                <Input type="number" min="0" step="any" value={row.Total_Quantity} onChange={(e) => updateDtl(row.key, "Total_Quantity", clampNonNegative(e.target.value))} className="h-8 text-xs w-24" />
                              </td>
                              <td className="p-1">
                                <div className="w-24 rounded-md border bg-muted px-2 py-1.5 text-xs text-muted-foreground truncate" title={String(uomOptions.find((o: any) => o.value === String(row.UOM_ID))?.label || "")}>
                                  {uomOptions.find((o: any) => o.value === String(row.UOM_ID))?.label || "-"}
                                </div>
                              </td>
                              <td className="p-1">
                                <Input type="number" min="0" step="any" readOnly value={row.Total_Packing} placeholder="Auto" className="h-8 text-xs w-24 bg-muted" />
                              </td>
                              <td className="p-1">
                                <div className="w-24 rounded-md border bg-muted px-2 py-1.5 text-xs text-muted-foreground truncate" title={String(uomOptions.find((o: any) => o.value === String(row.ALT_UOM_ID))?.label || "")}>
                                  {uomOptions.find((o: any) => o.value === String(row.ALT_UOM_ID))?.label || "-"}
                                </div>
                              </td>
                              <td className="p-1">
                                <Select value={row.TRUCK_ID ? String(row.TRUCK_ID) : ""} onValueChange={(v) => updateDtl(row.key, "TRUCK_ID", Number(v))}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Truck" /></SelectTrigger>
                                  <SelectContent>
                                    {truckOptions.map((o) => (
                                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-1">
                                <div className="w-36">
                                  <DatePicker value={row.REQUIRED_DATE || ""} onChange={(v) => updateDtl(row.key, "REQUIRED_DATE", v)} placeholder="Required date" />
                                </div>
                              </td>
                              <td className="p-1">
                                <Input maxLength={500} value={row.REASON} onChange={(e) => updateDtl(row.key, "REASON", e.target.value)} placeholder="Reason" className="h-8 text-xs" />
                              </td>
                              <td className="p-1">
                                <Select value={row.STATUS_ENTRY || "CF"} onValueChange={(v) => updateDtl(row.key, "STATUS_ENTRY", v)}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {statusEntryOptions.map((o) => (
                                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-1 pr-2 text-center">
                                <button type="button" onClick={() => removeDtl(row.key)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors" title="Remove row">
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button variant="outline" onClick={handleBack} className="text-xs" disabled={saving}>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                </Button>
                <Button onClick={handleSave} disabled={saving} className={editing ? "bg-info text-info-foreground hover:bg-info/90 text-xs" : "bg-primary text-primary-foreground hover:bg-primary/90 text-xs"}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this purchase request along with all its detail lines.</AlertDialogDescription>
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