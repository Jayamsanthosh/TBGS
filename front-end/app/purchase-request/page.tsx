"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Loader2, Send } from "lucide-react";
import RequestReview from "./request-review";
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
  fetchPurchaseRequests,
  addPurchaseRequest,
  updatePurchaseRequest,
  deletePurchaseRequestHdr,
  fetchPurchaseRequestHdr,
  fetchPurchaseRequestDtls,
  fetchPurchaseRequestDtl,
  clearPurchaseRequestMasterError,
  submitPurchaseRequest,
  PurchaseRequestGridData,
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

/* Status Entry only has two meaningful positions on the request itself:
   CL once it has been sent for approval, and everything else still waiting.
   The row's Submit action moves CF -> CL, so a new request reads as Pending
   for Submitted rather than leaking a raw Draft / Inactive code. */
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
  const [stepErrors, setStepErrors] = useState<StepErrors>({});
  const [lineErrors, setLineErrors] = useState<StepErrors>({});
  const [focusRequest, setFocusRequest] = useState<{ key: string; nonce: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submittingRef, setSubmittingRef] = useState<string | null>(null);

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

  /* Select needs a non-empty value, but a login that is not an employee has no
     REQUESTED_BY_EMP_ID to show. This sentinel stands in for it in the dropdown only;
     the backend still resolves the real requester from the session and stores a null
     id, which is what the foreign key requires. */
  const NO_EMPLOYEE_ID = "__session__";

  /* The login's mapped (active) company and its branch, from the session. These are
     only a fallback for a login with no employee record. Note an employee's own
     company can differ from the company the login is mapped to. */
  const activeCompanyId = user?.companies?.[0]?.companyId ?? null;

  const fetchList = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Request failed");
    const json = await res.json();
    return json.data || [];
  };

  /* No employee lookup here on purpose - the requester comes from the session. */
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

  /* The request status is decided by the workflow, not picked by hand: a new
     request starts at DRAFT, and the row's Submit action moves it to PENDING
     APPROVAL. Ids are resolved from the master by STATUS_CODE so no numeric id
     is hard-coded. */
  const statusIdFor = (code: string) =>
    String(
      (Array.isArray(statuses) ? statuses : []).find(
        (s: any) => String(s.statusCode ?? s.STATUS_CODE ?? "") === code
      )?.statusId ?? ""
    );
  const draftStatusId = statusIdFor("DRAFT");
  const pendingStatusId = statusIdFor("PENDING_APPROVAL");
  /* Submit from the table is blocked until both statuses can be resolved. */
  const missingStatusMaster = statusOptions.length === 0 || !draftStatusId || !pendingStatusId;
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

  /* A new request starts at DRAFT. The default is applied once the id is known
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
    /* Pre-filled with the logged-in user's employee, from the session. Empty for a
       login that is not an employee, which is allowed - the request is still raised
       under that login's name, just with a null employee id. */
    REQUESTED_BY_EMP_ID: sessionRequesterEmpId,
    /* Company / Branch / PO Store / Camp are the logged-in user's, so they are filled
       from the session rather than picked. Each stays empty when the session has no
       value for it (e.g. an employee with no camp), which is a valid state. */
    COMPANY_ID: sessionEmployeeDefaults.companyId != null ? String(sessionEmployeeDefaults.companyId) : "",
    BRANCH_ID: sessionEmployeeDefaults.branchId != null ? String(sessionEmployeeDefaults.branchId) : "",
    PO_STORE_ID: sessionEmployeeDefaults.storeId != null ? String(sessionEmployeeDefaults.storeId) : "",
    CAMP_ID: sessionEmployeeDefaults.campId != null ? String(sessionEmployeeDefaults.campId) : "",
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

  /* The requester is whoever is logged in, resolved by the backend into the
     session, so this screen never fetches the employee list. That list was only
     ever needed to let a user pick a requester - and picking yourself is not a
     choice. Dropping the query also stops a few hundred employee rows from being
     pulled into a screen that needs one person.

     empId is null for a login that is not an employee (no EMP_ID, or an EMP_ID with
     no employee row) - which is a valid state and must not block the screen. The
     name is never empty; the backend falls back to the login name. */
  const sessionEmployee = user?.employee ?? null;
  const sessionRequesterName = String(sessionEmployee?.empName || user?.loginName || "").trim();
  const sessionRequesterEmpId =
    sessionEmployee?.empId != null && sessionEmployee.empId > 0 ? String(sessionEmployee.empId) : "";

  /* Company / Branch / PO Store / Camp all belong to the logged-in user, so the header
     takes them from the session instead of asking.

     Company is the employee's own company, falling back to the login's mapped company
     because it is required. Branch comes from the session's employee block, which the
     backend resolves against whichever company wins above - so Company and Branch are
     always a real pair rather than one company's id beside another company's branch.
     Camp / PO Store are the employee's and have no fallback: an employee without a camp
     simply has none. */
  const sessionEmployeeDefaults = useMemo(
    () => ({
      companyId: sessionEmployee?.companyId ?? activeCompanyId ?? null,
      branchId: sessionEmployee?.branchId ?? user?.companies?.[0]?.branchId ?? null,
      campId: sessionEmployee?.campId ?? null,
      storeId: sessionEmployee?.storeId ?? null,
    }),
    [
      sessionEmployee?.companyId,
      sessionEmployee?.branchId,
      sessionEmployee?.campId,
      sessionEmployee?.storeId,
      activeCompanyId,
      user?.companies,
    ]
  );

  /* The only entry in the dropdown is the logged-in user, so selecting it just
     re-applies their defaults. Kept as a handler so the field stays a real
     dropdown, as required. */
  const handleRequestedByChange = (empId: string) => {
    const realEmpId = empId === NO_EMPLOYEE_ID ? "" : empId;
    setForm((prev) => ({
      ...prev,
      REQUESTED_BY_EMP_ID: realEmpId,
      COMPANY_ID:
        sessionEmployeeDefaults.companyId != null ? String(sessionEmployeeDefaults.companyId) : "",
      BRANCH_ID:
        sessionEmployeeDefaults.branchId != null ? String(sessionEmployeeDefaults.branchId) : "",
      CAMP_ID: sessionEmployeeDefaults.campId != null ? String(sessionEmployeeDefaults.campId) : "",
      PO_STORE_ID: sessionEmployeeDefaults.storeId != null ? String(sessionEmployeeDefaults.storeId) : "",
    }));
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

  /* Line numbers are always the row's position, so a line added or removed in
     the middle never leaves a gap behind. */
  const renumberDtls = (rows: any[]) => rows.map((r, i) => ({ ...r, LINE_NO: i + 1 }));

  const addDtl = () => {
    setDtls((prev) => renumberDtls([...prev, emptyDtl(prev.length + 1)]));
  };

  const removeDtl = (key: string) => {
    const row = dtls.find((r) => r.key === key);
    if (row?.PURCHASE_REQUEST_DTL_ID) {
      setDeletedIds((d) => [...d, Number(row.PURCHASE_REQUEST_DTL_ID)]);
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
      const refNo = item.purchaseRequestNo ?? item.PURCHASE_REQUEST_NO;
      const hdr = await dispatch(fetchPurchaseRequestHdr(refNo)).unwrap();
      const toStr = (v: any) => (v == null || v === "" ? "" : String(v));
      setForm({
        PURCHASE_REQUEST_NO: hdr.PURCHASE_REQUEST_NO || refNo || "",
        PURCHASE_REQUEST_DATE: fmtDate(hdr.PURCHASE_REQUEST_DATE),
        /* The requester is always the logged-in user, and the backend re-stamps it on
           save, so load the session identity rather than the stored one - otherwise
           the field would show the original requester right up until the save
           silently changed it. The stored name is still what the grid shows. */
        REQUESTED_BY_EMP_ID: sessionRequesterEmpId,
        /* Company / Branch / PO Store / Camp are session-owned too, so load them from
           the session for the same reason: otherwise the form would show the stored
           values while the save stamps the session's. */
        COMPANY_ID:
          sessionEmployeeDefaults.companyId != null ? String(sessionEmployeeDefaults.companyId) : "",
        BRANCH_ID:
          sessionEmployeeDefaults.branchId != null ? String(sessionEmployeeDefaults.branchId) : "",
        PO_STORE_ID:
          sessionEmployeeDefaults.storeId != null ? String(sessionEmployeeDefaults.storeId) : "",
        CAMP_ID:
          sessionEmployeeDefaults.campId != null ? String(sessionEmployeeDefaults.campId) : "",
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

  /* One scrolling page, so nothing blocks the way down - every rule is checked
     on Save. Section problems land in stepErrors; per-line problems stay with the
     card so the user sees which line is at fault. */
  const validateRequest = (): { stepErrors: StepErrors; lineErrors: StepErrors } => {
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

    if (!form.PURCHASE_REQUEST_DATE) push(HDR_STEP, "Purchase Request Date is required");
    /* The requester is the logged-in user, so the only thing worth checking is that
       we resolved one. Requiring an employee id here would lock out the logins that
       have no employee record ('sandy', 'sri'), which are valid requesters. */
    if (!sessionRequesterName) push(HDR_STEP, "Your login could not be resolved to a requester. Please sign in again.");
    /* Company comes from the session and cannot be picked here, so if it is missing the
       message has to say who can fix it - telling the user to "select a Company" would
       leave them with a disabled, empty field and no way forward. */
    if (!form.COMPANY_ID)
      push(HDR_STEP, "No company is mapped to your login, so a request cannot be raised. Please contact your administrator.");

    const meaningful = (r: any) =>
      r.REFERENCE_TYPE_ID || r.PRODUCT_ID || r.MAIN_CATEGORY_ID || (r.DESCRIPTION || "").trim();

    const validRows = dtls.filter(meaningful);
    if (validRows.length === 0) {
      push(REVIEW_STEP, "At least one purchase request detail line is required");
    } else {
      const lineNos = validRows.map((r: any) => String(r.LINE_NO ?? ""));
      if (new Set(lineNos).size !== lineNos.length) {
        push(REVIEW_STEP, "Line No must be unique within the same Purchase Request");
      }
    }

    validRows.forEach((r: any) => {
      const label = `Line ${r.LINE_NO ?? "?"}`;
      if (!r.REFERENCE_TYPE_ID) pushLine(r.key, `${label}: Reference Type is required`);
      if (!r.MAIN_CATEGORY_ID) pushLine(r.key, `${label}: Main Category is required`);
      if (!r.PRODUCT_ID) pushLine(r.key, `${label}: Product is required`);
      if (!r.UOM_ID) pushLine(r.key, `${label}: UOM is required`);
    });

    /* One marker on the section so it shows as needing attention. */
    const broken = Object.keys(lineErrors);
    if (broken.length > 0) {
      push(DTL_STEP, `${broken.length} line${broken.length === 1 ? "" : "s"} need attention`);
    }

    return { stepErrors, lineErrors };
  };

  const handleSave = async () => {
    const { stepErrors, lineErrors } = validateRequest();
    setStepErrors(stepErrors);
    setLineErrors(lineErrors);
    const firstBad = SECTION_ORDER.find((k) => (stepErrors[k]?.length ?? 0) > 0);
    if (firstBad) {
      /* Jump to the first failing line when the detail section is at fault. */
      const firstLine = Object.keys(lineErrors)[0];
      focusOn(firstBad === DTL_STEP && firstLine ? lineStepKey(firstLine) : firstBad);
      toast({ title: stepErrors[firstBad][0], variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    const validRows = dtls.filter((r: any) =>
      r.REFERENCE_TYPE_ID || r.PRODUCT_ID || r.MAIN_CATEGORY_ID || (r.DESCRIPTION || "").trim()
    );

    setSaving(true);
    try {
      const toNum = (v: any) => {
        if (v === "" || v === null || v === undefined) return null;
        const n = Number(v);
        return isNaN(n) ? null : Math.max(0, n);
      };
      const payload: Record<string, any> = {
        PURCHASE_REQUEST_NO: editing ? String(editing.purchaseRequestNo ?? editing.PURCHASE_REQUEST_NO) : "",
        PURCHASE_REQUEST_DATE: form.PURCHASE_REQUEST_DATE || null,
        /* Sent for display consistency only. The backend overrides both with the
           verified session, so a tampered body cannot change the requester. */
        REQUESTED_BY_EMP_ID: toNum(form.REQUESTED_BY_EMP_ID),
        REQUESTED_BY_NAME: sessionRequesterName,
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
      setStepErrors({});
      setLineErrors({});
      setFocusRequest(null);
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

  /* Per-row Submit: moves a saved request to Pending for Approval through the
     dedicated endpoint, so the request is submitted without re-saving the record
     and Status / Status Entry are both set by the workflow. */
  const handleSubmitRow = async (row: any) => {
    const refNo = row?.purchaseRequestNo ?? row?.PURCHASE_REQUEST_NO;
    if (!refNo || missingStatusMaster || !pendingStatusId) return;
    if (submittingRef === refNo) return;
    setSubmittingRef(refNo);
    try {
      const res: any = await dispatch(
        submitPurchaseRequest({ refNo, statusId: Number(pendingStatusId) })
      ).unwrap();
      toast({ title: res?.message ?? "Purchase Request submitted for approval", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchPurchaseRequests({}));
    } catch (e: any) {
      toast({
        title: typeof e === "string" ? e : e?.message || "Error submitting purchase request",
        variant: "destructive",
        duration: DEFAULT_TOAST_DURATION,
      });
    } finally {
      setSubmittingRef(null);
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

  /* ------------------------------------------------- wizard line groups --- */
  const lineGroups = (): FieldGroup[] => [
    {
      title: "Reference",
      fields: [
        {
          key: "REFERENCE_TYPE_ID",
          label: "Reference Type",
          kind: "select",
          required: true,
          options: refTypeOptions,
          transform: (v) => Number(v),
          placeholder: "Select ref type",
        },
        { key: "REFERENCE_NO", label: "Reference No", kind: "text", placeholder: "Reference no" },
        {
          key: "LINE_NO",
          label: "Line No",
          kind: "computed",
          hint: "auto",
          display: (r: any) => r.LINE_NO ?? "-",
        },
      ],
    },
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
          key: "PRODUCT_ID",
          label: "Product",
          kind: "select",
          required: true,
          options: (row: any) => productOptionsFor(form.COMPANY_ID, row.MAIN_CATEGORY_ID),
          transform: (v) => Number(v),
          placeholder: "Select product",
        },
        {
          key: "DESCRIPTION",
          label: "Description",
          kind: "textarea",
          placeholder: "Description",
        },
      ],
    },
    {
      title: "Quantity & Packing",
      fields: [
        {
          key: "Total_Quantity",
          label: "Quantity",
          kind: "number",
          min: 0,
          step: "any",
          transform: (v) => clampNonNegative(v),
        },
        {
          key: "NO_OF_PCS_PER_PACKING",
          label: "Pcs / Packing",
          kind: "computed",
          hint: "from product",
          display: (row: any) => row.NO_OF_PCS_PER_PACKING ?? "-",
        },
        {
          key: "Total_Packing",
          label: "Total Packing",
          kind: "computed",
          hint: "auto",
          display: (row: any) => row.Total_Packing ?? "-",
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
          key: "ALT_UOM_ID",
          label: "Alternate UOM",
          kind: "computed",
          display: (row: any) =>
            uomOptions.find((o: any) => o.value === String(row.ALT_UOM_ID))?.label || "-",
        },
        {
          key: "TRUCK_ID",
          label: "Truck",
          kind: "select",
          options: truckOptions,
          transform: (v) => Number(v),
          placeholder: "Select truck",
        },
      ],
    },
    {
      title: "Schedule & Status",
      fields: [
        {
          key: "REQUIRED_DATE",
          label: "Required Date",
          kind: "date",
          hint: "defaults to the request date",
        },
        {
          key: "REASON",
          label: "Reason",
          kind: "text",
          maxLength: 500,
          placeholder: "Reason",
        },
      ],
    },
  ];

  const headerLabels = useMemo(() => {
    const labelOf = (options: { value: string; label: string }[] | undefined, v: any) =>
      (options || []).find((o) => o.value === String(v ?? ""))?.label || "";
    return {
      /* The requester is the session user, so the review shows that name directly
         rather than looking it up in an employee list. */
      REQUESTED_BY_EMP_ID: sessionRequesterName,
      COMPANY_ID: labelOf(companyOptions, form.COMPANY_ID),
      BRANCH_ID: labelOf(branchOptions, form.BRANCH_ID),
      PO_STORE_ID: labelOf(storeOptions, form.PO_STORE_ID),
      CAMP_ID: labelOf(campOptions, form.CAMP_ID),
      REQUEST_STORE_ID: labelOf(storeOptions, form.REQUEST_STORE_ID),
      REQUEST_TYPE_ID: labelOf(requestTypeOptions, form.REQUEST_TYPE_ID),
      PRIORITY_ID: labelOf(priorityOptions, form.PRIORITY_ID),
      STATUS_ID: labelOf(statusOptions, form.STATUS_ID),
      STATUS_ENTRY: entryLabel(form.STATUS_ENTRY),
      DELIVERY_LOCATION_ID: labelOf(locationOptions, form.DELIVERY_LOCATION_ID),
    };
  }, [
    sessionRequesterName, form.COMPANY_ID, form.BRANCH_ID, form.PO_STORE_ID,
    form.CAMP_ID, form.REQUEST_STORE_ID, form.REQUEST_TYPE_ID, form.PRIORITY_ID, form.STATUS_ID,
    form.STATUS_ENTRY, form.DELIVERY_LOCATION_ID, companyOptions, branchOptions, storeOptions, campOptions,
    requestTypeOptions, priorityOptions, statusOptions, locationOptions,
  ]);

  /* Only lines with content reach the review and the payload. */
  const reviewRows = useMemo(
    () =>
      dtls.filter(
        (r: any) =>
          r.REFERENCE_TYPE_ID || r.PRODUCT_ID || r.MAIN_CATEGORY_ID || (r.DESCRIPTION || "").trim()
      ),
    [dtls]
  );

  const focusOn = (key: string) => setFocusRequest({ key, nonce: Date.now() });
  const scrollToLine = (row: any) => {
    focusOn(lineStepKey(row.key));
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
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Final Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs whitespace-nowrap">Status Entry</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => {
                  const refNo = item.purchaseRequestNo ?? item.PURCHASE_REQUEST_NO;
                  const isSubmitting = submittingRef === refNo;
                  /* Submitting is one-way: once a row is pending the button stays
                     disabled. The status comes from the server row, not local state. */
                  const isPending = !!pendingStatusId && String(item.statusId ?? "") === pendingStatusId;
                  return (
                  <tr key={item.id || idx} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                      {isAdmin && <button onClick={() => setDeleteId(item.purchaseRequestNo ?? item.PURCHASE_REQUEST_NO)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>}
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
                    <td className="p-3 font-medium">{item.purchaseRequestNo || "-"}</td>
                    <td className="p-3">{formatDate(item.purchaseRequestDate)}</td>
                    <td className="p-3">{(item.requestedBy || "-")}{item.requestedByEmpId ? ` (#${item.requestedByEmpId})` : ""}</td>
                    <td className="p-3">{item.companyName || "-"}</td>
                    <td className="p-3">{item.branchName || "-"}</td>
                    <td className="p-3">{item.poStoreName || "-"}</td>
                    <td className="p-3">{item.campName || "-"}</td>
                    <td className="p-3">{item.requestTypeName || "-"}</td>
                    <td className="p-3">{formatDate(item.requiredDate)}</td>
                    <td className="p-3">{item.statusName || "-"}</td>
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
                  <tr><td colSpan={13} className="p-8 text-center text-muted-foreground">No purchase requests found</td></tr>
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
            ? `Edit Purchase Request (${editing.purchaseRequestNo ?? editing.PURCHASE_REQUEST_NO})`
            : "Add Purchase Request"
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
          subtitle="Requester, company, dates and status"
          errors={stepErrors[HDR_STEP]}
        >
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">
                Requested By <span className="text-destructive ml-0.5">*</span>
                <span className="text-muted-foreground font-normal ml-1">(your login)</span>
              </Label>
              {/* Still a dropdown as required, but it holds only the logged-in user -
                  picking a requester is not a choice anyone gets to make. A login
                  with no employee row has no id, so the option carries a sentinel
                  instead of an empty id; the backend resolves the real requester
                  from the session anyway and stores a null id for that case. */}
              <Select value={form.REQUESTED_BY_EMP_ID || NO_EMPLOYEE_ID} onValueChange={handleRequestedByChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select requester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={sessionRequesterEmpId || NO_EMPLOYEE_ID}>
                    {sessionRequesterName}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderField("PURCHASE_REQUEST_DATE", "Purchase Request Date", "date", undefined, true)}
              {renderField("COMPANY_ID", "Company", "select", companyOptions, true, "No company mapped to your login", true, "from your login")}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderField("BRANCH_ID", "Branch", "select", branchOptions, false, "No branch mapped to your login", true, "from your login")}
              {renderField("PO_STORE_ID", "PO Store", "select", storeOptions, false, "No PO store for your employee", true, "from your login")}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderField("CAMP_ID", "Camp", "select", campOptions, false, "No camp for your employee", true, "from your login")}
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
              {renderField("STATUS_ID", "Status", "select", statusOptions, false, undefined, true, "set by the workflow")}
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
            {renderField("REASON", "Reason", "textarea", undefined, false, "Reason...")}
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
                    (row.DESCRIPTION && String(row.DESCRIPTION).slice(0, 80)) ||
                    "Not filled in yet"
                  }
                  groups={lineGroups()}
                  row={row}
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
          title="Review & Submit"
          subtitle="Header and every detail line on one page"
          errors={stepErrors[REVIEW_STEP]}
        >
          <RequestReview
            form={form}
            headerLabels={headerLabels}
            rows={reviewRows}
            onEditLine={scrollToLine}
            onAddLine={addDtl}
          />
        </WizardSection>
      </WizardShell>

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
