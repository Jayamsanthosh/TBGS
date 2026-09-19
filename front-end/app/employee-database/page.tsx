"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  formatDate,
  validateEmail,
  validateTanzaniaPhone,
  formatTanzaniaPhone,
  cleanPhoneForStorage,
  validateNonNegativeNumber,
  validateNonNegativeInteger,
  validatePositiveInteger,
  clampNonNegative,
} from "@/lib/validation";
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
  fetchEmployees,
  fetchEmployeeById,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  clearEmployeeDatabaseError,
  type EmployeeDatabaseGridData
} from "@/lib/employeeDatabaseSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";

const PAGE_SIZES = [10, 25, 50, "ALL"] as const;

const STATUS_OPTIONS = [
  { label: "Active", value: "AC" },
  { label: "Inactive", value: "IN" },
];

const TITLE_OPTIONS = ["Mr", "Mrs", "Ms", "Miss", "Dr"].map((v) => ({ label: v, value: v }));
const GENDER_OPTIONS = ["Male", "Female", "Other"].map((v) => ({ label: v, value: v }));
const MARITAL_OPTIONS = ["Single", "Married", "Divorced", "Widowed"].map((v) => ({ label: v, value: v }));

const LOOKUPS = {
  company: { endpoint: "company-master", id: "COMPANY_ID", name: "COMPANY_NAME" },
  department: { endpoint: "department-master", id: "DEPARTMENT_ID", name: "DEPARTMENT_NAME" },
  designation: { endpoint: "designation-master", id: "DESIGNATION_ID", name: "DESIGNATION_NAME" },
  departmentGroup: { endpoint: "department-group-master", id: "DEPARTMENT_GROUP_ID", name: "DEPARTMENT_GROUP_NAME" },
  designationGroup: { endpoint: "designation-group-master", id: "DESIGNATION_GROUP_ID", name: "DESIGNATION_GROUP_NAME" },
  camp: { endpoint: "camp-master", id: "CAMP_ID", name: "CAMP_NAME" },
  store: { endpoint: "store-master", id: "Store_Id", name: "Store_Name" },
  bloodGroup: { endpoint: "blood-group-master", id: "BLOOD_GROUP_ID", name: "BLOOD_GROUP_NAME" },
  employmentType: { endpoint: "employment-type-master", id: "EMPLOYMENT_TYPE_ID", name: "EMPLOYMENT_TYPE_NAME" },
  salaryScale: { endpoint: "new-salary-scale", id: "SALARY_SCALE_ID", name: "SALARY_SCALE_NAME" },
  currency: { endpoint: "currency-master", id: "CURRENCY_ID", name: "CURRENCY_NAME" },
  country: { endpoint: "country-master", id: "Country_Id", name: "Country_Name" },
  region: { endpoint: "region-master", id: "REGION_ID", name: "REGION_NAME" },
  district: { endpoint: "district-master", id: "District_id", name: "District_Name" },
  location: { endpoint: "location-master", id: "LOCATION_ID", name: "LOCATION_NAME" },
  paymentMode: { endpoint: "payment-mode-master", id: "PAYMENT_MODE_ID", name: "PAYMENT_MODE_NAME" },
  bank: { endpoint: "bank-master", id: "BANK_ID", name: "BANK_NAME" },
} as const;

type LookupKey = keyof typeof LOOKUPS;
type FieldType = "text" | "number" | "date" | "textarea" | "select";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  lookup?: LookupKey;
  options?: { label: string; value: string }[];
  placeholder?: string;
  editOnly?: boolean;
}

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Basic Details",
    fields: [
      { key: "EMP_ID", label: "Employee ID", type: "number", required: true, placeholder: "e.g., 1001" },
      { key: "INT_TITLES", label: "Title", type: "select", options: TITLE_OPTIONS },
      { key: "FIRST_NAME", label: "First Name", type: "text", required: true, placeholder: "e.g., Harish" },
      { key: "MIDDLE_NAME", label: "Middle Name", type: "text" },
      { key: "LAST_NAME", label: "Last Name", type: "text", required: true, placeholder: "e.g., Prabhu" },
      { key: "DATE_OF_BIRTH", label: "Date of Birth", type: "date" },
      { key: "AGE", label: "Age", type: "text", placeholder: "e.g., 28" },
      { key: "GENDER", label: "Gender", type: "select", options: GENDER_OPTIONS },
      { key: "MARITAL_STATUS", label: "Marital Status", type: "select", options: MARITAL_OPTIONS },
      { key: "BLOOD_GROUP_ID", label: "Blood Group", type: "select", lookup: "bloodGroup" },
      { key: "EMPLOYEE_SKILL_STATUS", label: "Skill Status", type: "text", placeholder: "e.g., Skilled" },
      { key: "RELAVANT_EXPERIENCE", label: "Relevant Experience", type: "text", placeholder: "e.g., 3 Years" },
      { key: "TRIAL_PERIOD_VALID_FROM", label: "Trial Period From", type: "date" },
      { key: "TRIAL_PERIOD_VALID_TO", label: "Trial Period To", type: "date" },
      { key: "DATE_OF_JOINING", label: "Date of Joining", type: "date" },
    ],
  },
  {
    title: "Organization",
    fields: [
      { key: "COMPANY_ID", label: "Company", type: "select", lookup: "company", required: true },
      { key: "DEPARTMENT_ID", label: "Department", type: "select", lookup: "department", required: true },
      { key: "DESIGNATION_ID", label: "Designation", type: "select", lookup: "designation", required: true },
      { key: "DEPARTMENT_GROUP_ID", label: "Department Group", type: "select", lookup: "departmentGroup" },
      { key: "DESIGNATION_GROUP_ID", label: "Designation Group", type: "select", lookup: "designationGroup" },
      { key: "CAMP_ID", label: "Camp", type: "select", lookup: "camp" },
      { key: "STORE_ID", label: "Store", type: "select", lookup: "store" },
      { key: "EMPLOYMENT_TYPE_ID", label: "Employment Type", type: "select", lookup: "employmentType" },
      { key: "SALARY_SCALE_ID", label: "Salary Scale", type: "select", lookup: "salaryScale" },
      { key: "CURRENCY_ID", label: "Currency", type: "select", lookup: "currency" },
      { key: "COUNTRY_ID", label: "Country", type: "select", lookup: "country" },
      { key: "REGION_ID", label: "Region", type: "select", lookup: "region" },
      { key: "DISTRICT_ID", label: "District", type: "select", lookup: "district" },
      { key: "LOCATION_ID", label: "Location", type: "select", lookup: "location" },
      { key: "PAYMENT_MODE_ID", label: "Payment Mode", type: "select", lookup: "paymentMode" },
    ],
  },
  {
    title: "Salary & Payments",
    fields: [
      { key: "BASIC_SALARY", label: "Basic Salary", type: "number", placeholder: "e.g., 25000.00" },
      { key: "GROSS", label: "Gross Salary", type: "number", placeholder: "e.g., 30000.00" },
      { key: "BANK_ID", label: "Bank", type: "select", lookup: "bank" },
      { key: "ACCOUNT_NO", label: "Account Number", type: "text", placeholder: "e.g., 123456789012" },
      { key: "EMP_PH_NO", label: "Phone Number", type: "text", placeholder: "e.g., 9876543210" },
      { key: "EMP_MAILID", label: "Email", type: "text", placeholder: "e.g., harish@example.com" },
      { key: "APPROVED_BY", label: "Approved By", type: "text", placeholder: "e.g., Manager" },
      { key: "ADDRESS_STREET", label: "Address", type: "textarea", placeholder: "Enter street address" },
      { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Additional notes..." },
      { key: "STATUS_MASTER", label: "Status", type: "select", options: STATUS_OPTIONS },
    ],
  },
];

const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

const toDateInput = (v: any): string => {
  if (!v) return "";
  const s = String(v).split("T")[0];
  const parts = s.split("-");
  if (parts.length === 3 && parts[0].length === 2) {
    const month = MONTHS[parts[1].toLowerCase().slice(0, 3)];
    if (month) return `${parts[2]}-${month}-${parts[0]}`;
  }
  return s;
};

const calcAge = (dob: string): string => {
  if (!dob) return "";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "";
  const t = new Date();
  let age = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
  return age >= 0 ? String(age) : "";
};

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

const emptyForm = (): Record<string, any> => {
  const f: Record<string, any> = {};
  ALL_FIELDS.forEach((field) => {
    f[field.key] = "";
  });
  f.STATUS_MASTER = "AC";
  return f;
};

export default function EmployeeDatabasePage() {
  const dispatch = useAppDispatch();
  const { employees, loading, error } = useAppSelector((s) => s.employeeDatabase);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AC");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeDatabaseGridData | null>(null);
  const [form, setForm] = useState<Record<string, any>>(emptyForm());
  const [editLoading, setEditLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const lookupData: Record<LookupKey, any[]> = useMemo(() => {
    const map: Record<string, any[]> = {};
    (Object.keys(LOOKUPS) as LookupKey[]).forEach((key) => {
      map[key] = [];
    });
    return map as Record<LookupKey, any[]>;
  }, []);

  const { data: companyRows } = useApiQuery("employee-company", async () => (await (await fetch(`${API_URL}/${LOOKUPS.company.endpoint}`)).json()).data || []);
  const { data: departmentRows } = useApiQuery("employee-department", async () => (await (await fetch(`${API_URL}/${LOOKUPS.department.endpoint}`)).json()).data || []);
  const { data: designationRows } = useApiQuery("employee-designation", async () => (await (await fetch(`${API_URL}/${LOOKUPS.designation.endpoint}`)).json()).data || []);
  const { data: deptGroupRows } = useApiQuery("employee-dept-group", async () => (await (await fetch(`${API_URL}/${LOOKUPS.departmentGroup.endpoint}`)).json()).data || []);
  const { data: desigGroupRows } = useApiQuery("employee-desig-group", async () => (await (await fetch(`${API_URL}/${LOOKUPS.designationGroup.endpoint}`)).json()).data || []);
  const { data: campRows } = useApiQuery("employee-camp", async () => (await (await fetch(`${API_URL}/${LOOKUPS.camp.endpoint}`)).json()).data || []);
  const { data: storeRows } = useApiQuery("employee-store", async () => (await (await fetch(`${API_URL}/${LOOKUPS.store.endpoint}`)).json()).data || []);
  const { data: bloodRows } = useApiQuery("employee-blood-group", async () => (await (await fetch(`${API_URL}/${LOOKUPS.bloodGroup.endpoint}`)).json()).data || []);
  const { data: empTypeRows } = useApiQuery("employee-employment-type", async () => (await (await fetch(`${API_URL}/${LOOKUPS.employmentType.endpoint}`)).json()).data || []);
  const { data: salaryRows } = useApiQuery("employee-salary-scale", async () => (await (await fetch(`${API_URL}/${LOOKUPS.salaryScale.endpoint}`)).json()).data || []);
  const { data: currencyRows } = useApiQuery("employee-currency", async () => (await (await fetch(`${API_URL}/${LOOKUPS.currency.endpoint}`)).json()).data || []);
  const { data: countryRows } = useApiQuery("employee-country", async () => (await (await fetch(`${API_URL}/${LOOKUPS.country.endpoint}`)).json()).data || []);
  const { data: regionRows } = useApiQuery("employee-region", async () => (await (await fetch(`${API_URL}/${LOOKUPS.region.endpoint}`)).json()).data || []);
  const { data: districtRows } = useApiQuery("employee-district", async () => (await (await fetch(`${API_URL}/${LOOKUPS.district.endpoint}`)).json()).data || []);
  const { data: locationRows } = useApiQuery("employee-location", async () => (await (await fetch(`${API_URL}/${LOOKUPS.location.endpoint}`)).json()).data || []);
  const { data: paymentRows } = useApiQuery("employee-payment-mode", async () => (await (await fetch(`${API_URL}/${LOOKUPS.paymentMode.endpoint}`)).json()).data || []);
  const { data: bankRows } = useApiQuery("employee-bank", async () => (await (await fetch(`${API_URL}/${LOOKUPS.bank.endpoint}`)).json()).data || []);
  const { data: mappingRows } = useApiQuery("employee-company-camp-store-mapping", async () => (await (await fetch(`${API_URL}/company-camp-store-mapping`)).json()).data || []);
  const { data: deptDesigMapRows } = useApiQuery("employee-dept-desig-map", async () => (await (await fetch(`${API_URL}/company-department-designation-mapping?status=AC`)).json()).data || []);

  const rawLookups: Record<LookupKey, any[]> = {
    company: companyRows, department: departmentRows, designation: designationRows,
    departmentGroup: deptGroupRows, designationGroup: desigGroupRows,
    camp: campRows, store: storeRows, bloodGroup: bloodRows, employmentType: empTypeRows,
    salaryScale: salaryRows, currency: currencyRows, country: countryRows, region: regionRows,
    district: districtRows, location: locationRows, paymentMode: paymentRows, bank: bankRows,
  };

  const lookupOptions = useMemo(() => {
    const map: Record<LookupKey, { value: string; label: string }[]> = {} as any;
    (Object.keys(LOOKUPS) as LookupKey[]).forEach((key) => {
      const def = LOOKUPS[key];
      const rows = Array.isArray(rawLookups[key]) ? rawLookups[key] : [];
      map[key] = rows.map((r: any) => ({
        value: String(r[def.id]),
        label: String(r[def.name] || r[def.id]),
      }));
    });
    return map;
  }, [rawLookups]);

  const availableCamps = useMemo(() => {
    if (!form.COMPANY_ID) return [];
    const mapped = (Array.isArray(mappingRows) ? mappingRows : [])
      .filter((m: any) => String(m.COMPANY_ID) === String(form.COMPANY_ID) && m.CAMP_ID != null)
      .map((m: any) => {
        const camp = (lookupOptions.camp || []).find((c) => c.value === String(m.CAMP_ID));
        return camp ? { value: camp.value, label: camp.label } : null;
      })
      .filter(Boolean) as { value: string; label: string }[];
    const result = mapped.length > 0 ? mapped : lookupOptions.camp || [];
    const selected = form.CAMP_ID ? (lookupOptions.camp || []).find((c) => c.value === String(form.CAMP_ID)) : undefined;
    if (selected && !result.some((c) => c.value === selected.value)) {
      return [...result, selected];
    }
    return result;
  }, [mappingRows, lookupOptions, form.COMPANY_ID, form.CAMP_ID]);

  const availableStores = useMemo(() => {
    if (!form.CAMP_ID) return [];
    const rows = Array.isArray(rawLookups.store) ? rawLookups.store : [];
    const filtered = rows
      .filter((s: any) => {
        const campId = s.Camp_Id ?? s.CAMP_ID;
        return campId != null && String(campId) === String(form.CAMP_ID);
      })
      .map((s: any) => ({
        value: String(s.Store_Id ?? s.STORE_ID),
        label: String(s.Store_Name ?? s.STORE_NAME),
      }));
    const selected = form.STORE_ID ? (lookupOptions.store || []).find((c) => c.value === String(form.STORE_ID)) : undefined;
    if (selected && !filtered.some((c) => c.value === selected.value)) {
      return [...filtered, selected];
    }
    return filtered;
  }, [rawLookups.store, lookupOptions, form.CAMP_ID, form.STORE_ID]);

  const availableRegions = useMemo(() => {
    const all = lookupOptions.region || [];
    if (!form.COUNTRY_ID) return [];
    const rows = Array.isArray(rawLookups.region) ? rawLookups.region : [];
    const filtered = rows
      .filter((r: any) => {
        const cid = r.COUNTRY_ID ?? r.Country_Id;
        return cid != null && String(cid) === String(form.COUNTRY_ID);
      })
      .map((r: any) => ({
        value: String(r.REGION_ID ?? r.id),
        label: String(r.REGION_NAME ?? r.NAME ?? r.REGION_ID),
      }));
    const selected = form.REGION_ID ? all.find((c) => c.value === String(form.REGION_ID)) : undefined;
    if (selected && !filtered.some((c) => c.value === selected.value)) {
      return [...filtered, selected];
    }
    return filtered;
  }, [rawLookups.region, lookupOptions, form.COUNTRY_ID, form.REGION_ID]);

  const availableDistricts = useMemo(() => {
    const all = lookupOptions.district || [];
    if (!form.REGION_ID) return [];
    const rows = Array.isArray(rawLookups.district) ? rawLookups.district : [];
    const filtered = rows
      .filter((d: any) => {
        const rid = d.REGION_ID ?? d.Region_Id;
        return rid != null && String(rid) === String(form.REGION_ID);
      })
      .map((d: any) => ({
        value: String(d.District_id ?? d.DISTRICT_ID ?? d.id),
        label: String(d.District_Name ?? d.DISTRICT_NAME ?? d.District_id ?? d.DISTRICT_ID),
      }));
    const selected = form.DISTRICT_ID ? all.find((c) => c.value === String(form.DISTRICT_ID)) : undefined;
    if (selected && !filtered.some((c) => c.value === selected.value)) {
      return [...filtered, selected];
    }
    return filtered;
  }, [rawLookups.district, lookupOptions, form.REGION_ID, form.DISTRICT_ID]);

  const companyDeptMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (Array.isArray(deptDesigMapRows)) {
      for (const m of deptDesigMapRows) {
        if (m.COMPANY_ID == null || m.DEPARTMENT_ID == null) continue;
        const ck = String(m.COMPANY_ID);
        const set = map.get(ck) || new Set<string>();
        set.add(String(m.DEPARTMENT_ID));
        map.set(ck, set);
      }
    }
    return map;
  }, [deptDesigMapRows]);

  const companyDeptDesigMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (Array.isArray(deptDesigMapRows)) {
      for (const m of deptDesigMapRows) {
        if (m.COMPANY_ID == null || m.DEPARTMENT_ID == null || m.DESIGNATION_ID == null) continue;
        const key = `${String(m.COMPANY_ID)}#${String(m.DEPARTMENT_ID)}`;
        const set = map.get(key) || new Set<string>();
        set.add(String(m.DESIGNATION_ID));
        map.set(key, set);
      }
    }
    return map;
  }, [deptDesigMapRows]);

  const availableDepartments = useMemo(() => {
    const all = lookupOptions.department || [];
    if (!form.COMPANY_ID) return all;
    const ids = companyDeptMap.get(String(form.COMPANY_ID));
    const filtered = ids ? all.filter((d: any) => ids.has(d.value)) : [];
    const selected = form.DEPARTMENT_ID ? all.find((d: any) => d.value === String(form.DEPARTMENT_ID)) : undefined;
    if (selected && !filtered.some((d: any) => d.value === selected.value)) {
      return [...filtered, selected];
    }
    return filtered;
  }, [companyDeptMap, lookupOptions, form.COMPANY_ID, form.DEPARTMENT_ID]);

  const availableDesignations = useMemo(() => {
    if (!form.COMPANY_ID || !form.DEPARTMENT_ID) return [];
    const ids = companyDeptDesigMap.get(`${String(form.COMPANY_ID)}#${String(form.DEPARTMENT_ID)}`);
    const all = lookupOptions.designation || [];
    const filtered = ids ? all.filter((d: any) => ids.has(d.value)) : [];
    const selected = form.DESIGNATION_ID ? all.find((d: any) => d.value === String(form.DESIGNATION_ID)) : undefined;
    if (selected && !filtered.some((d: any) => d.value === selected.value)) {
      return [...filtered, selected];
    }
    return filtered;
  }, [companyDeptDesigMap, lookupOptions, form.COMPANY_ID, form.DEPARTMENT_ID, form.DESIGNATION_ID]);

  useEffect(() => {
    dispatch(fetchEmployees(statusFilter));
  }, [dispatch, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error, duration: DEFAULT_TOAST_DURATION });
      dispatch(clearEmployeeDatabaseError());
    }
  }, [error, dispatch, toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (employees || []).filter((d: any) => {
      const itemStatus = normalizeStatus(d.STATUS_MASTER);
      const filterStatus = normalizeStatus(statusFilter);

      let matchesStatus = false;
      if (filterStatus === "ACTIVE") matchesStatus = itemStatus === "ACTIVE";
      else if (filterStatus === "INACTIVE") matchesStatus = itemStatus === "INACTIVE";
      else matchesStatus = itemStatus === filterStatus;

      if (!matchesStatus) return false;
      return [
        d.EMP_ID, d.FIRST_NAME, d.MIDDLE_NAME, d.LAST_NAME,
        d.COMPANY_NAME, d.DEPARTMENT_NAME, d.DESIGNATION_NAME,
        d.EMP_PH_NO, d.EMP_MAILID, d.STATUS_MASTER,
      ].join(" ").toLowerCase().includes(q);
    }).sort((a: any, b: any) => {
      const aId = Number(a.EMP_ID) || 0;
      const bId = Number(b.EMP_ID) || 0;
      return bId - aId;
    });
  }, [employees, search, statusFilter]);

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
    setForm(emptyForm());
    setFieldErrors({});
    setDialogOpen(true);
  };

  const fillForm = (item: any) => {
    const f = emptyForm();
    ALL_FIELDS.forEach((field) => {
      let raw = item?.[field.key];

      if ((raw === undefined || raw === null) && field.type === "select" && field.lookup) {
        const lookupDef = LOOKUPS[field.lookup];
        if (lookupDef && item[lookupDef.name]) {
          const nameVal = String(item[lookupDef.name]).toLowerCase().trim();
          const opts = lookupOptions[field.lookup] || [];
          const found = opts.find((o) => o.label.toLowerCase().trim() === nameVal);
          if (found) raw = found.value;
        }
      }

      if (field.key === "STATUS_MASTER" && raw) {
        const sm = String(raw).toUpperCase().trim();
        if (sm === "ACTIVE" || sm === "AC") raw = "AC";
        else if (sm === "INACTIVE" || sm === "IN") raw = "IN";
      }

      if (raw === undefined || raw === null) {
        f[field.key] = "";
        return;
      }
      if (field.key === "EMP_PH_NO") {
        f[field.key] = formatTanzaniaPhone(String(raw));
        return;
      }
      f[field.key] = field.type === "date" ? toDateInput(raw) : String(raw);
    });
    setForm(f);
  };

  const openEdit = async (item: EmployeeDatabaseGridData) => {
    setEditing(item);
    setEditLoading(true);
    setDialogOpen(true);
    setFieldErrors({});
    fillForm(item);
    try {
      const res: any = await dispatch(fetchEmployeeById(Number(item.SNO) || Number(item.id))).unwrap();
      if (res) fillForm(res);
    } catch {
      // fallback to grid row data
    } finally {
      setEditLoading(false);
    }
  };

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (form.EMP_ID !== "" && form.EMP_ID != null && !validatePositiveInteger(form.EMP_ID)) {
      errors.EMP_ID = "Employee ID must be a whole number";
    }
    if (form.AGE !== "" && form.AGE != null && !validateNonNegativeInteger(form.AGE)) {
      errors.AGE = "Age must be a valid non-negative number";
    }
    if (form.BASIC_SALARY !== "" && form.BASIC_SALARY != null && !validateNonNegativeNumber(form.BASIC_SALARY)) {
      errors.BASIC_SALARY = "Basic Salary must be a positive number";
    }
    if (form.GROSS !== "" && form.GROSS != null && !validateNonNegativeNumber(form.GROSS)) {
      errors.GROSS = "Gross Salary must be a positive number";
    }
    if (form.EMP_PH_NO && !validateTanzaniaPhone(form.EMP_PH_NO)) {
      errors.EMP_PH_NO = "Phone Number must be in Tanzania format (e.g., +255XXXXXXXXX)";
    }
    if (form.EMP_MAILID && !validateEmail(form.EMP_MAILID)) {
      errors.EMP_MAILID = "Invalid Email format";
    }
    return errors;
  };

  const handleSave = async () => {
    const missing = ALL_FIELDS.filter((f) => f.required && (!form[f.key] || form[f.key] === ""));
    if (missing.length > 0) {
      toast({ variant: "destructive", title: `${missing[0].label} is required`, duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!editing && normalizeStatus(form.STATUS_MASTER) === "INACTIVE") {
      toast({ variant: "destructive", title: "New employees cannot be inactive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({ variant: "destructive", title: Object.values(errors)[0], duration: DEFAULT_TOAST_DURATION });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.EMP_PH_NO) payload.EMP_PH_NO = cleanPhoneForStorage(payload.EMP_PH_NO);
      let res: any;
      if (editing) {
        res = await dispatch(updateEmployee({ ...payload, SNO: Number(editing.SNO) || Number(editing.id) })).unwrap();
      } else {
        res = await dispatch(addEmployee({ ...payload })).unwrap();
      }
      await dispatch(fetchEmployees(statusFilter));
      setDialogOpen(false);
      toast({ title: res?.message ?? (editing ? "Employee updated successfully!" : "Employee created successfully!"), duration: DEFAULT_TOAST_DURATION });
    } catch (e: any) {
      const msg = typeof e === "string" ? e : (e?.message || "Failed to save employee");
      toast({ variant: "destructive", title: msg, duration: DEFAULT_TOAST_DURATION });
    } finally {
      setSaving(false);
    }
  };

  const handleSingleDeleteFinal = async () => {
    if (deletingId == null) return;
    try {
      const res = await dispatch(deleteEmployee(deletingId)).unwrap();
      setDeletingId(null);
      toast({ title: res?.message ?? "Employee deleted successfully!", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchEmployees(statusFilter));
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to delete employee"), duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleBulkDeleteFinal = async () => {
    try {
      let lastRes: any = null;
      for (const id of Array.from(selectedIds)) {
        lastRes = await dispatch(deleteEmployee(id)).unwrap();
      }
      setSelectedIds(new Set());
      setIsBulkDeleting(false);
      toast({ title: lastRes?.message ?? "Employees deleted successfully!", duration: DEFAULT_TOAST_DURATION });
      dispatch(fetchEmployees(statusFilter));
    } catch (e: any) {
      toast({ variant: "destructive", title: typeof e === "string" ? e : (e?.message || "Failed to delete items!"), duration: DEFAULT_TOAST_DURATION });
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

  const setField = useCallback((key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const renderField = (field: FieldDef) => {
    if (field.editOnly && !editing) return null;
    const value = form[field.key] ?? "";
    const isEmpty = !value || value === "";
    const requiredBorder = field.required && isEmpty ? "border-destructive ring-1 ring-destructive/30" : "";
    let options = field.lookup ? lookupOptions[field.lookup] : field.options || [];
    if (field.key === "DEPARTMENT_ID") {
      options = availableDepartments;
    } else if (field.key === "DESIGNATION_ID") {
      options = availableDesignations;
    } else if (field.key === "CAMP_ID") {
      options = availableCamps;
    } else if (field.key === "STORE_ID") {
      options = availableStores;
    } else if (field.key === "REGION_ID") {
      options = availableRegions;
    } else if (field.key === "DISTRICT_ID") {
      options = availableDistricts;
    }
    return (
      <div key={field.key} className={field.type === "textarea" ? "col-span-2" : ""}>
        <Label className="text-xs">
          {field.label} {field.required && <span className="text-destructive">*</span>}
        </Label>
        {field.type === "select" ? (
          <Select value={String(value)} onValueChange={(v) => {
            if (field.key === "COMPANY_ID") {
              setField(field.key, v);
              setField("DEPARTMENT_ID", "");
              setField("DESIGNATION_ID", "");
              setField("CAMP_ID", "");
              setField("STORE_ID", "");
            } else if (field.key === "DEPARTMENT_ID") {
              setField(field.key, v);
              setField("DESIGNATION_ID", "");
            } else if (field.key === "CAMP_ID") {
              setField(field.key, v);
              setField("STORE_ID", "");
            } else if (field.key === "COUNTRY_ID") {
              setField(field.key, v);
              setField("REGION_ID", "");
              setField("DISTRICT_ID", "");
            } else if (field.key === "REGION_ID") {
              setField(field.key, v);
              setField("DISTRICT_ID", "");
            } else {
              setField(field.key, v);
            }
          }}>
            <SelectTrigger className={`w-full ${requiredBorder}`} disabled={field.key === "DEPARTMENT_ID" ? !form.COMPANY_ID : field.key === "DESIGNATION_ID" ? !form.DEPARTMENT_ID : field.key === "CAMP_ID" ? !form.COMPANY_ID : field.key === "STORE_ID" ? !form.CAMP_ID : field.key === "REGION_ID" ? !form.COUNTRY_ID : field.key === "DISTRICT_ID" ? !form.REGION_ID : false}>
              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.key !== "STATUS_MASTER" && <SelectItem value="__none__">— None —</SelectItem>}
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === "textarea" ? (
          <Textarea value={String(value)} onChange={(e) => setField(field.key, e.target.value)} placeholder={field.placeholder} className={requiredBorder} />
        ) : field.type === "date" ? (
          <DatePicker
            value={String(value)}
            onChange={(v) => {
              if (field.key === "DATE_OF_BIRTH") setField("AGE", calcAge(v));
              setField(field.key, v);
            }}
            placeholder={field.placeholder}
          />
        ) : (
          <Input
            type={field.type}
            value={String(value)}
            placeholder={field.placeholder}
            className={requiredBorder}
            onChange={(e) => {
              let val: any = e.target.value;
              if (field.type === "number") val = clampNonNegative(e.target.value) === "" ? "" : Number(clampNonNegative(e.target.value));
              if (field.key === "EMP_PH_NO") val = formatTanzaniaPhone(val);
              setField(field.key, val);
            }}
          />
        )}
        {fieldErrors[field.key] && (
          <p className="text-xs text-destructive mt-1">{fieldErrors[field.key]}</p>
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

  const fullName = (d: any) =>
    [d.FIRST_NAME, d.MIDDLE_NAME, d.LAST_NAME].filter(Boolean).join(" ") || "—";

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Database</h1>
          <p className="text-sm text-muted-foreground">Manage employee database entries</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Employee
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:max-w-3xl">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
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
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AC">Active</SelectItem>
                  <SelectItem value="IN">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedIds.size > 0 && (
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
                    />
                  </th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Actions</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">EMP ID</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Company</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Department</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Designation</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Joined</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Gross</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Phone</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-xs">Email</th>
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
                      />
                    </td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => setDeletingId(item.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </td>
                    <td className="p-3 font-medium">{item.EMP_ID}</td>
                    <td className="p-3">{fullName(item)}</td>
                    <td className="p-3">{item.COMPANY_NAME || "—"}</td>
                    <td className="p-3">{item.DEPARTMENT_NAME || "—"}</td>
                    <td className="p-3">{item.DESIGNATION_NAME || "—"}</td>
                    <td className="p-3">{formatDate(item.DATE_OF_JOINING) || "—"}</td>
                    <td className="p-3">{item.GROSS != null ? Number(item.GROSS).toLocaleString() : "—"}</td>
                    <td className="p-3">{item.EMP_PH_NO || "—"}</td>
                    <td className="p-3">{item.EMP_MAILID || "—"}</td>
                    <td className="p-3">{statusBadge(item.STATUS_MASTER)}</td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-muted-foreground">
                      No records found matching your filters
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Employee" : "Add Employee"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 border-b pb-2">
                  {section.title}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {section.fields.map((field) => renderField(field))}
                </div>
              </div>
            ))}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || editLoading}
                className={editing ? "bg-info text-info-foreground hover:bg-info/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}
              >
                {saving ? "Saving..." : editLoading ? "Loading..." : editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingId != null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this employee.
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
