"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchPromotionDemotionTransferRequests,
  addPromotionDemotionTransferRequest,
  updatePromotionDemotionTransferRequest,
  deletePromotionDemotionTransferRequest,
  submitPromotionDemotionTransferRequest,
  clearPromotionDemotionTransferRequestError,
  PromotionDemotionTransferRequestGridData,
} from "@/lib/promotionDemotionTransferRequestSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";
import { MONTHS, YEARS } from "@/lib/utils";
import { validateNonNegativeNumber, validateNonNegativeInteger, validatePositiveInteger } from "@/lib/validation";

const TRANSFER_TYPES = ["Promotion", "Demotion", "Transfer", "Promotion & Transfer", "Demotion & Transfer"];

const ALLOWANCE_KEYS = [
  "BASIC_SALARY",
  "FOT_ALLOWANCE",
  "ATTENDANCE_ALLOWANCE",
  "ONE_1YP_ALLOWANCE",
  "TECHNICAL",
  "POLYVALENT",
  "RESPONSIBILITY",
  "LOYALTY",
  "PRODUCTIVITY",
  "CAPACITY",
  "DISCIPLINARY",
  "HOUSE_ALLOW",
  "MEDICIAL",
  "EDUCATION",
  "MISCELLANIES",
  "NIGHT_ALLOWANCE",
  "EXTRA1",
  "EXTRA2",
  "EXTRA3",
  "EXTRA4",
  "EXTRA5",
  "EXTRA6",
  "GROSS_AMOUNT",
] as const;

const ALLOW_LABELS: Record<string, string> = {
  BASIC_SALARY: "Basic Salary",
  FOT_ALLOWANCE: "FOT Allowance",
  ATTENDANCE_ALLOWANCE: "Attendance Allowance",
  ONE_1YP_ALLOWANCE: "One 1YP Allowance",
  TECHNICAL: "Technical",
  POLYVALENT: "Polyvalent",
  RESPONSIBILITY: "Responsibility",
  LOYALTY: "Loyalty",
  PRODUCTIVITY: "Productivity",
  CAPACITY: "Capacity",
  DISCIPLINARY: "Disciplinary",
  HOUSE_ALLOW: "House Allow",
  MEDICIAL: "Medicial",
  EDUCATION: "Education",
  MISCELLANIES: "Miscellanies",
  NIGHT_ALLOWANCE: "Night Allowance",
  EXTRA1: "Extra 1",
  EXTRA2: "Extra 2",
  EXTRA3: "Extra 3",
  EXTRA4: "Extra 4",
  EXTRA5: "Extra 5",
  EXTRA6: "Extra 6",
  GROSS_AMOUNT: "Gross Amount",
};

const SCALE_TO_ALLOW: Record<string, string> = {
  BASIC: "NEW_BASIC_SALARY",
  FOT: "NEW_FOT_ALLOWANCE",
  ATTENDANCE: "NEW_ATTENDANCE_ALLOWANCE",
  ONE_1YP: "NEW_ONE_1YP_ALLOWANCE",
  TECHNICAL: "NEW_TECHNICAL",
  POLYVALENT: "NEW_POLYVALENT",
  RESPONSIBILITY: "NEW_RESPONSIBILITY",
  LOYALTY: "NEW_LOYALTY",
  PRODUCTIVITY: "NEW_PRODUCTIVITY",
  CAPACITY: "NEW_CAPACITY",
  DISCIPLINARY: "NEW_DISCIPLINARY",
  HOUSE_ALLOW: "NEW_HOUSE_ALLOW",
  MEDICIAL: "NEW_MEDICIAL",
  EDUCATION: "NEW_EDUCATION",
  MISCELLANIES: "NEW_MISCELLANIES",
  NIGHT_ALLOWANCE: "NEW_NIGHT_ALLOWANCE",
  EXTRA1: "NEW_EXTRA1",
  EXTRA2: "NEW_EXTRA2",
  EXTRA3: "NEW_EXTRA3",
  EXTRA4: "NEW_EXTRA4",
  EXTRA5: "NEW_EXTRA5",
  EXTRA6: "NEW_EXTRA6",
  TOTAL: "NEW_GROSS_AMOUNT",
};

const statusBadge = (val: any) => {
  const sv = String(val || "").toLowerCase();
  const isActive = sv === "active" || sv === "ac";
  const isInactive = sv === "inactive" || sv === "in";
  const isSubmitted = sv === "cl" || sv === "submitted" || sv === "closed";
  const isPending = sv === "pen" || sv === "pending";
  const isRejected = sv === "rej" || sv === "rejected";
  const isCancelled = sv === "ca" || sv === "cancelled" || sv === "canceled";
  const colorClass = isActive
    ? "bg-green-500/10 text-green-600 border-green-200"
    : isInactive
      ? "bg-red-500/10 text-red-600 border-red-200"
      : isSubmitted
        ? "bg-blue-500/10 text-blue-600 border-blue-200"
        : isPending
          ? "bg-yellow-500/10 text-yellow-600 border-yellow-200"
          : isRejected
            ? "bg-orange-500/10 text-orange-600 border-orange-200"
            : isCancelled
              ? "bg-red-500/10 text-red-600 border-red-200"
              : "bg-muted/40 text-muted-foreground border-border";
  const label = isActive ? "Active" : isInactive ? "Inactive" : isSubmitted ? "Submitted" : isPending ? "Pending" : isRejected ? "Rejected" : isCancelled ? "Cancelled" : val;
  return (
    <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
      {label}
    </Badge>
  );
};

const toId = (key: string) => (arr: any[], id: any) =>
  (Array.isArray(arr) ? arr.find((x: any) => Number(x[key]) === Number(id)) : undefined) || undefined;

const numFmt = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? (v ?? "") : n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function PromotionDemotionTransferRequestPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.promotionDemotionTransferRequest);
  const { toast } = useToast();
  const { user } = useAppSelector((state) => state.auth);
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [submittingId, setSubmittingId] = useState<string | number | null>(null);

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "");
  }, []);

  const { data: userStoreMappings } = useApiQuery("pdt-req-user-map", async () => {
    const res = await fetch(`${API_URL}/user-store-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch user mappings");
    const json = await res.json();
    return json.data || [];
  });

  const { data: employees } = useApiQuery("pdt-req-employees", async () => {
    const res = await fetch(`${API_URL}/employee-database?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch employees");
    const json = await res.json();
    return json.data || [];
  });

  const { data: companies } = useApiQuery("pdt-req-companies", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed to fetch companies");
    const json = await res.json();
    return json.data || [];
  });

  const { data: departments } = useApiQuery("pdt-req-departments", async () => {
    const res = await fetch(`${API_URL}/department-master`);
    if (!res.ok) throw new Error("Failed to fetch departments");
    const json = await res.json();
    return json.data || [];
  });

  const { data: designations } = useApiQuery("pdt-req-designations", async () => {
    const res = await fetch(`${API_URL}/designation-master`);
    if (!res.ok) throw new Error("Failed to fetch designations");
    const json = await res.json();
    return json.data || [];
  });

  const { data: departmentGroups } = useApiQuery("pdt-req-dept-groups", async () => {
    const res = await fetch(`${API_URL}/department-group-master`);
    if (!res.ok) throw new Error("Failed to fetch department groups");
    const json = await res.json();
    return json.data || [];
  });

  const { data: designationGroups } = useApiQuery("pdt-req-desig-groups", async () => {
    const res = await fetch(`${API_URL}/designation-group-master`);
    if (!res.ok) throw new Error("Failed to fetch designation groups");
    const json = await res.json();
    return json.data || [];
  });

  const { data: camps } = useApiQuery("pdt-req-camps", async () => {
    const res = await fetch(`${API_URL}/camp-master`);
    if (!res.ok) throw new Error("Failed to fetch camps");
    const json = await res.json();
    return json.data || [];
  });

  const { data: stores } = useApiQuery("pdt-req-stores", async () => {
    const res = await fetch(`${API_URL}/store-master`);
    if (!res.ok) throw new Error("Failed to fetch stores");
    const json = await res.json();
    return (json.data || []).map((s: any) => ({
      ...s,
      STORE_ID: s.Store_Id ?? s.STORE_ID,
      STORE_NAME: s.Store_Name ?? s.STORE_NAME,
      CAMP_ID: s.Camp_Id ?? s.CAMP_ID,
    }));
  });

  const { data: employmentTypes } = useApiQuery("pdt-req-employment-types", async () => {
    const res = await fetch(`${API_URL}/employment-type-master`);
    if (!res.ok) throw new Error("Failed to fetch employment types");
    const json = await res.json();
    return json.data || [];
  });

  const { data: currencies } = useApiQuery("pdt-req-currencies", async () => {
    const res = await fetch(`${API_URL}/currency-master`);
    if (!res.ok) throw new Error("Failed to fetch currencies");
    const json = await res.json();
    return json.data || [];
  });

  const { data: salaryScales } = useApiQuery("pdt-req-salary-scales", async () => {
    const res = await fetch(`${API_URL}/new-salary-scale`);
    if (!res.ok) throw new Error("Failed to fetch salary scales");
    const json = await res.json();
    return json.data || [];
  });

  const { data: deptDesigMappings } = useApiQuery("pdt-req-dept-desig-map", async () => {
    const res = await fetch(`${API_URL}/company-department-designation-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch department-designation mappings");
    const json = await res.json();
    return json.data || [];
  });

  const { data: campStoreMappings } = useApiQuery("pdt-req-camp-store-map", async () => {
    const res = await fetch(`${API_URL}/company-camp-store-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch camp-store mappings");
    const json = await res.json();
    return json.data || [];
  });

  const { data: approvedSettings } = useApiQuery("pdt-req-approved-mp", async () => {
    const res = await fetch(`${API_URL}/man-power-approved-settings?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch approved man power settings");
    const json = await res.json();
    return json.data || [];
  });

  const empName = (e: any) => [e?.FIRST_NAME, e?.MIDDLE_NAME, e?.LAST_NAME].filter(Boolean).join(" ") || "";

  const filteredEmployees = useMemo(() => {
    if (!Array.isArray(employees) || !user) return employees || [];
    if (user.role === "Admin" || user.role === "Super Admin") return employees;

    const maps = (userStoreMappings || []).filter((m: any) => String(m.LOGIN_ID) === String(user.id));
    if (maps.length === 0) return [];

    return employees.filter((emp: any) => {
      const cId = companies?.find((c: any) => c.COMPANY_NAME === emp.COMPANY_NAME)?.COMPANY_ID;
      const cmpId = camps?.find((c: any) => c.CAMP_NAME === emp.CAMP_NAME)?.CAMP_ID;
      const sId = stores?.find((s: any) => s.STORE_NAME === emp.STORE_NAME)?.STORE_ID;

      return maps.some((m: any) => {
        const companyMatch = !m.COMPANY_ID || String(m.COMPANY_ID) === String(cId);
        const campMatch = !m.CAMP_ID || String(m.CAMP_ID) === String(cmpId);
        const storeMatch = !m.STORE_ID || String(m.STORE_ID) === String(sId);
        return companyMatch && campMatch && storeMatch;
      });
    });
  }, [employees, userStoreMappings, user, companies, camps, stores]);

  const selectOptions = (key: string, arr: any[] | undefined, nameKey: string) =>
    (Array.isArray(arr) ? arr.map((x: any) => ({ value: String(x[key]), label: x[nameKey] || `ID: ${x[key]}` })) : []);

  const cascadeMaps = useMemo(() => {
    const companyDept = new Map<string, Set<string>>();
    const companyDeptDesig = new Map<string, Set<string>>();
    const companyCamp = new Map<string, Set<string>>();
    const companyCampStore = new Map<string, Set<string>>();

    if (Array.isArray(deptDesigMappings)) {
      for (const m of deptDesigMappings) {
        if (m.COMPANY_ID == null || m.DEPARTMENT_ID == null) continue;
        const ck = String(m.COMPANY_ID);
        const dk = String(m.DEPARTMENT_ID);
        const deptSet = companyDept.get(ck) || new Set<string>();
        deptSet.add(dk);
        companyDept.set(ck, deptSet);
        if (m.DESIGNATION_ID != null) {
          const key = `${ck}#${dk}`;
          const desigSet = companyDeptDesig.get(key) || new Set<string>();
          desigSet.add(String(m.DESIGNATION_ID));
          companyDeptDesig.set(key, desigSet);
        }
      }
    }

    if (Array.isArray(campStoreMappings)) {
      for (const m of campStoreMappings) {
        if (m.COMPANY_ID == null || m.CAMP_ID == null) continue;
        const ck = String(m.COMPANY_ID);
        const campSet = companyCamp.get(ck) || new Set<string>();
        campSet.add(String(m.CAMP_ID));
        companyCamp.set(ck, campSet);
        if (m.STORE_ID != null) {
          const key = `${ck}#${String(m.CAMP_ID)}`;
          const storeSet = companyCampStore.get(key) || new Set<string>();
          storeSet.add(String(m.STORE_ID));
          companyCampStore.set(key, storeSet);
        }
      }
    }

    return { companyDept, companyDeptDesig, companyCamp, companyCampStore };
  }, [deptDesigMappings, campStoreMappings]);

  const filteredOptions = (
    key: string,
    arr: any[] | undefined,
    nameKey: string,
    getIds: (form: Record<string, any>) => Set<string> | undefined,
  ) =>
    (form: Record<string, any>) => {
      if (!Array.isArray(arr)) return [];
      const ids = getIds(form);
      const filtered = ids ? arr.filter((x: any) => ids.has(String(x[key]))) : [];
      const selected =
        form[key] != null && form[key] !== ""
          ? arr.find((x: any) => String(x[key]) === String(form[key]))
          : undefined;
      if (selected && !filtered.some((x: any) => String(x[key]) === String(selected[key]))) {
        return [...filtered, selected].map((x: any) => ({ value: String(x[key]), label: x[nameKey] || `ID: ${x[key]}` }));
      }
      return filtered.map((x: any) => ({ value: String(x[key]), label: x[nameKey] || `ID: ${x[key]}` }));
    };

  const sectionIdField = (
    prefix: "OLD" | "NEW",
    field: string,
    label: string,
    opts: (string | { value: string | number; label: string })[] | ((form: Record<string, any>) => (string | { value: string | number; label: string })[])
  ): MasterField => ({
    key: `${prefix}_${field}`,
    label: `${prefix === "OLD" ? "Old " : "New "}${label}`,
    type: "select",
    options: opts,
    placeholder: `Select ${label.toLowerCase()}`,
    required: prefix === "NEW" && field === "COMPANY_ID",
    disabled: prefix === "OLD",
  });

  const numberField = (key: string, label: string, required = false, disabled = false): MasterField => ({
    key,
    label,
    type: "number",
    required,
    disabled,
    placeholder: "0.00",
    validate: (value: any) => {
      if (value != null && value !== "" && !validateNonNegativeNumber(value)) return `${label} must be 0 or greater`;
      return undefined;
    },
  });

  const defaultProcessMonth = (() => {
    const mp = user?.monthProcess;
    if (!mp) return new Date().toLocaleString("en", { month: "long" });
    const n = Number(mp);
    if (Number.isInteger(n) && n >= 1 && n <= 12) return new Date(2000, n - 1, 1).toLocaleString("en", { month: "long" });
    return String(mp);
  })();
  const defaultProcessYear = user?.yearProcess || String(new Date().getFullYear());

  const baseFields: MasterField[] = [
    {
      key: "MONTH_ENTERED",
      label: "Process Month",
      type: "select",
      options: MONTHS.map((m) => ({ value: m.value, label: m.label })),
      defaultValue: defaultProcessMonth,
      disabled: true,
    },
    {
      key: "YEAR_ENTERED",
      label: "Process Year",
      type: "select",
      options: YEARS.map((y) => ({ value: y, label: y })),
      defaultValue: defaultProcessYear,
      disabled: true,
    },
    {
      key: "TRANSFER_TYPE",
      label: "Transfer Type",
      type: "select",
      required: true,
      options: TRANSFER_TYPES.map((t) => ({ value: t, label: t })),
      placeholder: "Select transfer type",
    },
    {
      key: "EMP_ID",
      label: "Employee",
      type: "select",
      required: true,
      renderField: ({ form, setForm }) => (
        <EmployeeCombobox
          value={form.EMP_ID}
          options={filteredEmployees}
          onChange={(val) => handleFieldChange("EMP_ID", val, setForm, form)}
        />
      )
    },
    { key: "FIRST_NAME", label: "First Name", type: "text", disabled: true },
    { key: "MIDDLE_NAME", label: "Middle Name", type: "text", disabled: true },
    { key: "LAST_NAME", label: "Last Name", type: "text", disabled: true },
    {
      key: "EMPLOYMENT_TYPE_ID",
      label: "Employment Type",
      type: "select",
      options: selectOptions("EMPLOYMENT_TYPE_ID", employmentTypes, "EMPLOYMENT_TYPE_NAME"),
      disabled: true,
    },
    {
      key: "CURRENCY_ID",
      label: "Currency",
      type: "select",
      options: selectOptions("CURRENCY_ID", currencies, "CURRENCY_NAME"),
      disabled: true,
    },

    sectionIdField("OLD", "COMPANY_ID", "Company", selectOptions("COMPANY_ID", companies, "COMPANY_NAME")),
    sectionIdField("OLD", "DEPARTMENT_ID", "Department", selectOptions("DEPARTMENT_ID", departments, "DEPARTMENT_NAME")),
    sectionIdField("OLD", "DESIGNATION_ID", "Designation", selectOptions("DESIGNATION_ID", designations, "DESIGNATION_NAME")),
    sectionIdField("OLD", "DEPARTMENT_GROUP_ID", "Department Group", selectOptions("DEPARTMENT_GROUP_ID", departmentGroups, "DEPARTMENT_GROUP_NAME")),
    sectionIdField("OLD", "DESIGNATION_GROUP_ID", "Designation Group", selectOptions("DESIGNATION_GROUP_ID", designationGroups, "DESIGNATION_GROUP_NAME")),
    sectionIdField("OLD", "CAMP_ID", "Camp", selectOptions("CAMP_ID", camps, "CAMP_NAME")),
    sectionIdField("OLD", "STORE_ID", "Store", selectOptions("STORE_ID", stores, "STORE_NAME")),
    sectionIdField("OLD", "SALARY_SCALE_ID", "Salary Scale", selectOptions("SALARY_SCALE_ID", salaryScales, "SALARY_SCALE_NAME")),
    ...ALLOWANCE_KEYS.map((a) => numberField(`OLD_${a}`, `Old ${ALLOW_LABELS[a]}`, false, true)),

    sectionIdField("NEW", "COMPANY_ID", "Company", selectOptions("COMPANY_ID", companies, "COMPANY_NAME")),
    sectionIdField("NEW", "DEPARTMENT_ID", "Department", selectOptions("DEPARTMENT_ID", departments, "DEPARTMENT_NAME")),
    sectionIdField("NEW", "DESIGNATION_ID", "Designation", selectOptions("DESIGNATION_ID", designations, "DESIGNATION_NAME")),
    sectionIdField("NEW", "DEPARTMENT_GROUP_ID", "Department Group", selectOptions("DEPARTMENT_GROUP_ID", departmentGroups, "DEPARTMENT_GROUP_NAME")),
    sectionIdField("NEW", "DESIGNATION_GROUP_ID", "Designation Group", selectOptions("DESIGNATION_GROUP_ID", designationGroups, "DESIGNATION_GROUP_NAME")),
    sectionIdField("NEW", "CAMP_ID", "Camp", selectOptions("CAMP_ID", camps, "CAMP_NAME")),
    sectionIdField("NEW", "STORE_ID", "Store", selectOptions("STORE_ID", stores, "STORE_NAME")),
    sectionIdField("NEW", "SALARY_SCALE_ID", "Salary Scale", selectOptions("SALARY_SCALE_ID", salaryScales, "SALARY_SCALE_NAME")),
    ...ALLOWANCE_KEYS.map((a) => numberField(`NEW_${a}`, `New ${ALLOW_LABELS[a]}`)),
    {
      key: "NEW_APPROVED_MAN_POWER",
      label: "New Approved Man Power",
      type: "number",
      disabled: true,
      placeholder: "0",
      validate: (value: any) => {
        if (value != null && value !== "" && !validateNonNegativeInteger(value)) return "Approved man power must be 0 or greater";
        return undefined;
      },
    },
    {
      key: "NEW_CURRENT_MAN_POWER",
      label: "New Current Man Power",
      type: "number",
      disabled: true,
      placeholder: "0",
      validate: (value: any) => {
        if (value != null && value !== "" && !validateNonNegativeInteger(value)) return "Current man power must be 0 or greater";
        return undefined;
      },
    },
    {
      key: "NEW_PENDING_MAN_POWER",
      label: "New Pending Man Power",
      type: "number",
      disabled: true,
      placeholder: "0",
      validate: (value: any) => {
        if (value != null && value !== "" && !validateNonNegativeInteger(value)) return "Pending man power must be 0 or greater";
        return undefined;
      },
    },
    {
      key: "NEW_BALANCE_MAN_POWER",
      label: "New Balance Man Power",
      type: "number",
      disabled: true,
      placeholder: "0",
      validate: (value: any) => {
        if (value != null && value !== "" && !validatePositiveInteger(value)) return "Balance man power must be a positive whole number";
        return undefined;
      },
    },

    {
      key: "REPORTING_MANAGER_ID",
      label: "Reporting Manager",
      type: "select",
      options: (Array.isArray(filteredEmployees) ? filteredEmployees.map((x: any) => ({ value: String(x.EMP_ID), label: `${empName(x) || `#${x.EMP_ID}`} (#${x.EMP_ID})` })) : []),
      placeholder: "Select reporting manager",
    },
    { key: "REPORTING_MANAGER_COMMENTS", label: "Reporting Manager Comments", type: "textarea", placeholder: "Enter comments...", maxLength: 1000 },
    {
      key: "MANAGER_RECOMMENDED_YN",
      label: "Manager Recommended",
      type: "select",
      options: [
        { value: "Y", label: "Yes" },
        { value: "N", label: "No" },
      ],
      placeholder: "Select recommendation",
    },
    { key: "REASON", label: "Reason", type: "textarea", placeholder: "Enter reason...", maxLength: 3000 },

    { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter remarks...", maxLength: 1000 },
  ];

  const fields: MasterField[] = useMemo(() => {
    return baseFields.map((f) => {
      switch (f.key) {
        case "OLD_COMPANY_ID": return { ...f, options: selectOptions("COMPANY_ID", companies, "COMPANY_NAME") };
        case "OLD_DEPARTMENT_ID": return { ...f, dependsOn: "OLD_COMPANY_ID", options: filteredOptions("DEPARTMENT_ID", departments, "DEPARTMENT_NAME", (form) => cascadeMaps.companyDept.get(String(form.OLD_COMPANY_ID ?? ""))) };
        case "OLD_DESIGNATION_ID": return { ...f, dependsOn: "OLD_DEPARTMENT_ID", options: filteredOptions("DESIGNATION_ID", designations, "DESIGNATION_NAME", (form) => cascadeMaps.companyDeptDesig.get(`${String(form.OLD_COMPANY_ID ?? "")}#${String(form.OLD_DEPARTMENT_ID ?? "")}`)) };
        case "OLD_DEPARTMENT_GROUP_ID": return { ...f, options: selectOptions("DEPARTMENT_GROUP_ID", departmentGroups, "DEPARTMENT_GROUP_NAME") };
        case "OLD_DESIGNATION_GROUP_ID": return { ...f, options: selectOptions("DESIGNATION_GROUP_ID", designationGroups, "DESIGNATION_GROUP_NAME") };
        case "OLD_CAMP_ID": return { ...f, dependsOn: "OLD_COMPANY_ID", options: filteredOptions("CAMP_ID", camps, "CAMP_NAME", (form) => cascadeMaps.companyCamp.get(String(form.OLD_COMPANY_ID ?? ""))) };
        case "OLD_STORE_ID": return { ...f, dependsOn: "OLD_CAMP_ID", options: filteredOptions("STORE_ID", stores, "STORE_NAME", (form) => cascadeMaps.companyCampStore.get(`${String(form.OLD_COMPANY_ID ?? "")}#${String(form.OLD_CAMP_ID ?? "")}`)) };
        case "OLD_SALARY_SCALE_ID": return { ...f, options: selectOptions("SALARY_SCALE_ID", salaryScales, "SALARY_SCALE_NAME") };

        case "NEW_COMPANY_ID": return { ...f, options: selectOptions("COMPANY_ID", companies, "COMPANY_NAME") };
        case "NEW_DEPARTMENT_ID": return { ...f, dependsOn: "NEW_COMPANY_ID", options: filteredOptions("DEPARTMENT_ID", departments, "DEPARTMENT_NAME", (form) => cascadeMaps.companyDept.get(String(form.NEW_COMPANY_ID ?? ""))) };
        case "NEW_DESIGNATION_ID": return { ...f, dependsOn: "NEW_DEPARTMENT_ID", options: filteredOptions("DESIGNATION_ID", designations, "DESIGNATION_NAME", (form) => cascadeMaps.companyDeptDesig.get(`${String(form.NEW_COMPANY_ID ?? "")}#${String(form.NEW_DEPARTMENT_ID ?? "")}`)) };
        case "NEW_DEPARTMENT_GROUP_ID": return { ...f, options: selectOptions("DEPARTMENT_GROUP_ID", departmentGroups, "DEPARTMENT_GROUP_NAME") };
        case "NEW_DESIGNATION_GROUP_ID": return { ...f, options: selectOptions("DESIGNATION_GROUP_ID", designationGroups, "DESIGNATION_GROUP_NAME") };
        case "NEW_CAMP_ID": return { ...f, dependsOn: "NEW_COMPANY_ID", options: filteredOptions("CAMP_ID", camps, "CAMP_NAME", (form) => cascadeMaps.companyCamp.get(String(form.NEW_COMPANY_ID ?? ""))) };
        case "NEW_STORE_ID": return { ...f, dependsOn: "NEW_CAMP_ID", options: filteredOptions("STORE_ID", stores, "STORE_NAME", (form) => cascadeMaps.companyCampStore.get(`${String(form.NEW_COMPANY_ID ?? "")}#${String(form.NEW_CAMP_ID ?? "")}`)) };
        case "NEW_SALARY_SCALE_ID": return { ...f, options: (form: Record<string, any>) => {
          const list = Array.isArray(salaryScales) ? salaryScales : [];
          const gid = form.NEW_DESIGNATION_GROUP_ID;
          const filtered = gid ? list.filter((s: any) => String(s.DESIGNATION_GROUP_ID) === String(gid)) : list;
          const selected = form.NEW_SALARY_SCALE_ID != null && form.NEW_SALARY_SCALE_ID !== ""
            ? list.find((s: any) => String(s.SALARY_SCALE_ID) === String(form.NEW_SALARY_SCALE_ID))
            : undefined;
          if (selected && !filtered.some((s: any) => String(s.SALARY_SCALE_ID) === String(selected.SALARY_SCALE_ID))) {
            return [...filtered, selected].map((s: any) => ({ value: String(s.SALARY_SCALE_ID), label: s.SALARY_SCALE_NAME || `ID: ${s.SALARY_SCALE_ID}` }));
          }
          return filtered.map((s: any) => ({ value: String(s.SALARY_SCALE_ID), label: s.SALARY_SCALE_NAME || `ID: ${s.SALARY_SCALE_ID}` }));
        } };

        case "EMPLOYMENT_TYPE_ID": return { ...f, options: selectOptions("EMPLOYMENT_TYPE_ID", employmentTypes, "EMPLOYMENT_TYPE_NAME") };
        case "CURRENCY_ID": return { ...f, options: selectOptions("CURRENCY_ID", currencies, "CURRENCY_NAME") };

        default: return f;
      }
    });
  }, [companies, departments, designations, departmentGroups, designationGroups, camps, stores, employmentTypes, currencies, salaryScales, cascadeMaps]);

  const handleFieldChange = useCallback((key: string, value: any, setForm: any, form: Record<string, any>): boolean => {
    const clearNewAllowances = (target: Record<string, any>): Record<string, any> => {
      const next = { ...target };
      ALLOWANCE_KEYS.forEach((a) => {
        next[`NEW_${a}`] = "";
      });
      return next;
    };

    const clearNewPower = (target: Record<string, any>): Record<string, any> => ({
      ...target,
      NEW_APPROVED_MAN_POWER: "",
      NEW_CURRENT_MAN_POWER: "",
      NEW_PENDING_MAN_POWER: "",
      NEW_BALANCE_MAN_POWER: "",
    });

    const computeNewPower = (target: Record<string, any>): Record<string, any> => {
      const cId = target.NEW_COMPANY_ID;
      const dId = target.NEW_DEPARTMENT_ID;
      const dsId = target.NEW_DESIGNATION_ID;
      if (!cId || !dId || !dsId) return clearNewPower(target);

      const approvedRow = (Array.isArray(approvedSettings) ? approvedSettings.find((m: any) =>
        String(m.COMPANY_ID) === String(cId) && String(m.DEPARTMENT_ID) === String(dId) && String(m.DESIGNATION_ID) === String(dsId)
      ) : undefined);
      const approvedRaw = approvedRow?.NEW_APPROVED_MAN_POWER;
      const approved = approvedRaw === undefined || approvedRaw === null || approvedRaw === "" ? "" : Number(approvedRaw);

      const companyName = companies?.find((c: any) => String(c.COMPANY_ID) === String(cId))?.COMPANY_NAME;
      const deptName = departments?.find((d: any) => String(d.DEPARTMENT_ID) === String(dId))?.DEPARTMENT_NAME;
      const desigName = designations?.find((d: any) => String(d.DESIGNATION_ID) === String(dsId))?.DESIGNATION_NAME;
      const current = Array.isArray(employees) ? employees.filter((e: any) =>
        e.COMPANY_NAME === companyName && e.DEPARTMENT_NAME === deptName && e.DESIGNATION_NAME === desigName
      ).length : 0;

      const pending = Array.isArray(items) ? items.filter((r: any) => {
        const st = String(r.STATUS_MASTER || "").toUpperCase();
        return st !== "CL" && st !== "CA"
          && String(r.NEW_COMPANY_ID) === String(cId)
          && String(r.NEW_DEPARTMENT_ID) === String(dId)
          && String(r.NEW_DESIGNATION_ID) === String(dsId);
      }).length : 0;

      const balance = approved === "" ? "" : Math.max(Number(approved) - current - pending, 0);
      return {
        ...clearNewPower(target),
        NEW_APPROVED_MAN_POWER: approved,
        NEW_CURRENT_MAN_POWER: current,
        NEW_PENDING_MAN_POWER: pending,
        NEW_BALANCE_MAN_POWER: balance,
      };
    };

    if (key === "EMP_ID") {
      const empGrid = (Array.isArray(filteredEmployees) ? filteredEmployees.find((e: any) => String(e.EMP_ID) === String(value)) : undefined);
      const setBase = (next: Record<string, any>) => setForm((prev: any) => ({ ...prev, ...next }));

      setBase({
        EMP_ID: value,
        FIRST_NAME: empGrid?.FIRST_NAME || "",
        MIDDLE_NAME: empGrid?.MIDDLE_NAME || "",
        LAST_NAME: empGrid?.LAST_NAME || "",
        REPORTING_MANAGER_ID: "",
      });

      if (empGrid && empGrid.SNO) {
        fetch(`${API_URL}/employee-database/${empGrid.SNO}`)
          .then((res) => res.json())
          .then((json) => {
            if (json.success && json.data) {
              const fe = json.data;
              const oldAllows: Record<string, any> = {};
              ALLOWANCE_KEYS.forEach((a) => {
                const v = a === "GROSS_AMOUNT" ? fe.GROSS : fe[a];
                oldAllows[`OLD_${a}`] = v != null && v !== "" ? Number(v) : "";
              });
              setBase({
                FIRST_NAME: fe.FIRST_NAME || "",
                MIDDLE_NAME: fe.MIDDLE_NAME || "",
                LAST_NAME: fe.LAST_NAME || "",
                EMPLOYMENT_TYPE_ID: fe.EMPLOYMENT_TYPE_ID ? String(fe.EMPLOYMENT_TYPE_ID) : "",
                CURRENCY_ID: fe.CURRENCY_ID ? String(fe.CURRENCY_ID) : "",
                OLD_COMPANY_ID: fe.COMPANY_ID ? String(fe.COMPANY_ID) : "",
                OLD_DEPARTMENT_ID: fe.DEPARTMENT_ID ? String(fe.DEPARTMENT_ID) : "",
                OLD_DESIGNATION_ID: fe.DESIGNATION_ID ? String(fe.DESIGNATION_ID) : "",
                OLD_DEPARTMENT_GROUP_ID: fe.DEPARTMENT_GROUP_ID ? String(fe.DEPARTMENT_GROUP_ID) : "",
                OLD_DESIGNATION_GROUP_ID: fe.DESIGNATION_GROUP_ID ? String(fe.DESIGNATION_GROUP_ID) : "",
                OLD_CAMP_ID: fe.CAMP_ID ? String(fe.CAMP_ID) : "",
                OLD_STORE_ID: fe.STORE_ID ? String(fe.STORE_ID) : "",
                OLD_SALARY_SCALE_ID: fe.SALARY_SCALE_ID ? String(fe.SALARY_SCALE_ID) : "",
                REPORTING_MANAGER_ID: fe.REPORTING_MANAGER_EMP_ID ? String(fe.REPORTING_MANAGER_EMP_ID) : "",
                ...oldAllows,
              });
            }
          });
      }
      return true;
    }

    if (key === "NEW_COMPANY_ID") {
      setForm(clearNewPower(clearNewAllowances({
        ...form,
        NEW_COMPANY_ID: value,
        NEW_DEPARTMENT_ID: "",
        NEW_DESIGNATION_ID: "",
        NEW_CAMP_ID: "",
        NEW_STORE_ID: "",
        NEW_DEPARTMENT_GROUP_ID: "",
        NEW_SALARY_SCALE_ID: "",
      })));
      return true;
    }

    if (key === "NEW_DEPARTMENT_ID") {
      setForm(clearNewPower(clearNewAllowances({
        ...form,
        NEW_DEPARTMENT_ID: value,
        NEW_DESIGNATION_ID: "",
        NEW_DEPARTMENT_GROUP_ID: "",
        NEW_SALARY_SCALE_ID: "",
      })));
      return true;
    }

    if (key === "NEW_DESIGNATION_ID") {
      const next: Record<string, any> = { ...form, NEW_DESIGNATION_ID: value };
      if (value) {
        const mapping = (Array.isArray(deptDesigMappings) ? deptDesigMappings.find((m: any) =>
          String(m.COMPANY_ID) === String(next.NEW_COMPANY_ID) && String(m.DEPARTMENT_ID) === String(next.NEW_DEPARTMENT_ID) && String(m.DESIGNATION_ID) === String(value)
        ) : undefined);
        next.NEW_DEPARTMENT_GROUP_ID = mapping?.DEPARTMENT_GROUP_ID ? String(mapping.DEPARTMENT_GROUP_ID) : "";
        next.NEW_SALARY_SCALE_ID = "";
        setForm(computeNewPower(clearNewAllowances(next)));
      } else {
        next.NEW_DEPARTMENT_GROUP_ID = "";
        next.NEW_SALARY_SCALE_ID = "";
        setForm(clearNewPower(clearNewAllowances(next)));
      }
      return true;
    }

    if (key === "NEW_DESIGNATION_GROUP_ID") {
      setForm(clearNewAllowances({ ...form, NEW_DESIGNATION_GROUP_ID: value, NEW_SALARY_SCALE_ID: "" }));
      return true;
    }

    if (key === "NEW_SALARY_SCALE_ID") {
      setForm(clearNewAllowances({ ...form, NEW_SALARY_SCALE_ID: value }));
      if (value) {
        const scale = (Array.isArray(salaryScales) ? salaryScales.find((s: any) => String(s.SALARY_SCALE_ID) === String(value)) : undefined);
        if (scale) {
          const allowVals: Record<string, any> = {};
          Object.keys(SCALE_TO_ALLOW).forEach((col) => {
            const v = scale[col];
            allowVals[SCALE_TO_ALLOW[col]] = v != null && v !== "" ? Number(v) : "";
          });
          setForm((prev: any) => ({ ...prev, NEW_SALARY_SCALE_ID: value, ...allowVals }));
        }
      }
      return true;
    }

    return false;
  }, [filteredEmployees, salaryScales, deptDesigMappings, companies, departments, designations, employees, approvedSettings, items]);

  const handleSubmit = useCallback(async (item: any) => {
    const ref = item?.TRANSFER_REQUEST_REF_NO;
    if (!ref) {
      toast({ variant: "destructive", title: "Error", description: "Missing reference number" });
      return;
    }
    setSubmittingId(item.id ?? item.SNO);
    try {
      await dispatch(submitPromotionDemotionTransferRequest(String(ref))).unwrap();
      toast({ title: "Promotion / demotion / transfer request submitted successfully!" });
      dispatch(fetchPromotionDemotionTransferRequests(currentStatus));
    } catch (e: any) {
      const msg = typeof e === "string" ? e : (e?.message || "Failed to submit promotion / demotion / transfer request");
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setSubmittingId(null);
    }
  }, [dispatch, currentStatus, toast]);

  const columns = useMemo(() => [
    { key: "SNO", label: "ID" },
    { key: "TRANSFER_REQUEST_REF_NO", label: "Ref No" },
    { key: "TRANSFER_TYPE", label: "Type" },
    { key: "MONTH_ENTERED", label: "Month" },
    { key: "YEAR_ENTERED", label: "Year" },
    { key: "EMP_NAME", label: "Employee" },
    { key: "OLD_COMPANY_NAME", label: "Old Company" },
    { key: "OLD_DESIGNATION_NAME", label: "Old Designation" },
    { key: "NEW_COMPANY_NAME", label: "New Company" },
    { key: "NEW_DESIGNATION_NAME", label: "New Designation" },
    { key: "OLD_GROSS_AMOUNT", label: "Old Gross", render: (val: any) => numFmt(val) },
    { key: "NEW_GROSS_AMOUNT", label: "New Gross", render: (val: any) => numFmt(val) },
    {
      key: "MANAGER_RECOMMENDED_YN",
      label: "Manager Recommended",
      render: (val: any) => (String(val || "").toUpperCase() === "Y" ? "Yes" : String(val || "").toUpperCase() === "N" ? "No" : (val ?? "")),
    },
    { key: "REMARKS", label: "Remarks" },
    {
      key: "STATUS_MASTER",
      label: "Status",
      render: (val: any) => statusBadge(val),
    },
    {
      key: "_action",
      label: "Action",
      render: (_val: any, item: any) => {
        const sv = String(item.STATUS_MASTER || "").toUpperCase();
        const locked = sv === "CL" || sv === "CA";
        if (locked) return <span className="text-xs text-muted-foreground">-</span>;
        const submitting = submittingId != null && String(submittingId) === String(item.id ?? item.SNO);
        return (
          <button
            onClick={() => handleSubmit(item)}
            disabled={submitting}
            className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        );
      },
    },
  ], [submittingId, handleSubmit]);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.map((u: any) => {
      const emp = toId("EMP_ID")(employees, u.EMP_ID);
      return {
        ...u,
        id: u.SNO,
        SNO: u.SNO,
        EMP_NAME: empName(emp) || (u.EMP_ID ? `#${u.EMP_ID}` : ""),
        OLD_COMPANY_NAME: toId("COMPANY_ID")(companies, u.OLD_COMPANY_ID)?.COMPANY_NAME || u.OLD_COMPANY_NAME || "",
        OLD_DEPARTMENT_NAME: toId("DEPARTMENT_ID")(departments, u.OLD_DEPARTMENT_ID)?.DEPARTMENT_NAME || u.OLD_DEPARTMENT_NAME || "",
        OLD_DESIGNATION_NAME: toId("DESIGNATION_ID")(designations, u.OLD_DESIGNATION_ID)?.DESIGNATION_NAME || u.OLD_DESIGNATION_NAME || "",
        NEW_COMPANY_NAME: toId("COMPANY_ID")(companies, u.NEW_COMPANY_ID)?.COMPANY_NAME || u.NEW_COMPANY_NAME || "",
        NEW_DEPARTMENT_NAME: toId("DEPARTMENT_ID")(departments, u.NEW_DEPARTMENT_ID)?.DEPARTMENT_NAME || u.NEW_DEPARTMENT_NAME || "",
        NEW_DESIGNATION_NAME: toId("DESIGNATION_ID")(designations, u.NEW_DESIGNATION_ID)?.DESIGNATION_NAME || u.NEW_DESIGNATION_NAME || "",
      };
    });
  }, [items, employees, companies, departments, designations]);

  useEffect(() => {
    dispatch(fetchPromotionDemotionTransferRequests(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearPromotionDemotionTransferRequestError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: PromotionDemotionTransferRequestGridData) => {
      const payload: Record<string, any> = {
        ...item,
        MONTH_ENTERED: item.MONTH_ENTERED || defaultProcessMonth,
        YEAR_ENTERED: item.YEAR_ENTERED || defaultProcessYear,
        USER: user?.loginName || "Admin",
        MAC_ADDRESS: "WEB",
      };
      const res = await dispatch(addPromotionDemotionTransferRequest(payload as PromotionDemotionTransferRequestGridData)).unwrap();
      dispatch(fetchPromotionDemotionTransferRequests(currentStatus));
      return res;
    },
    update: async (item: PromotionDemotionTransferRequestGridData) => {
      const res = await dispatch(updatePromotionDemotionTransferRequest(item)).unwrap();
      dispatch(fetchPromotionDemotionTransferRequests(currentStatus));
      return res;
    },
    remove: async (id: string) => {
      const row = (Array.isArray(enrichedData) ? enrichedData.find((r: any) => String(r.SNO) === String(id)) : undefined);
      const ref = row?.TRANSFER_REQUEST_REF_NO || id;
      const res = await dispatch(deletePromotionDemotionTransferRequest(String(ref))).unwrap();
      dispatch(fetchPromotionDemotionTransferRequests(currentStatus));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        const row = (Array.isArray(enrichedData) ? enrichedData.find((r: any) => String(r.SNO) === String(id)) : undefined);
        const ref = row?.TRANSFER_REQUEST_REF_NO || id;
        res = await dispatch(deletePromotionDemotionTransferRequest(String(ref))).unwrap();
      }
      dispatch(fetchPromotionDemotionTransferRequests(currentStatus));
      return res;
    },
    onFieldChange: handleFieldChange,
  }), [enrichedData, loading, dispatch, currentStatus, handleFieldChange]);

  return (
    <div className="space-y-4">
      <MasterCrudPage
        title="Promotion / Demotion / Transfer Request"
        description="Manage promotion, demotion and transfer requests"
        idPrefix="PDT"
        domain="promotion-demotion-transfer-request"
        fields={fields}
        columns={columns}
        initialData={[]}
        customStoreOverrides={storeOverrides}
        statusOptions={[
          { label: "All Status", value: "" },
          { label: "Active", value: "AC" },
          { label: "Inactive", value: "IN" },
          { label: "Submitted", value: "CL" },
          { label: "Cancelled", value: "CA" },
        ]}
        onStatusFilterChange={handleStatusFilterChange}
        enableViewDetails
        onBeforeEdit={async (item) => {
          const ref = item.TRANSFER_REQUEST_REF_NO;
          if (!ref) return undefined;
          const res = await fetch(`${API_URL}/promotion-demotion-transfer-request/${encodeURIComponent(ref)}`);
          if (!res.ok) return undefined;
          const json = await res.json();
          return json.data;
        }}
      />
    </div>
  );
}