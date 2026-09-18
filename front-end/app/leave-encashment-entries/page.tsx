"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchLeaveEncashmentEntries,
  addLeaveEncashmentEntry,
  updateLeaveEncashmentEntry,
  deleteLeaveEncashmentEntry,
  clearLeaveEncashmentEntriesError,
  LeaveEncashmentEntriesGridData,
} from "@/lib/leaveEncashmentEntriesSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";
import { MONTHS, YEARS } from "@/lib/utils";
import {
  validatePositiveNumber,
  validateNonNegativeNumber,
} from "@/lib/validation";

const statusBadge = (val: any) => {
  const sv = String(val || "").toLowerCase();
  const isActive = sv === "active" || sv === "ac";
  const isInactive = sv === "inactive" || sv === "in";
  const isClosed = sv === "closed" || sv === "cl";
  const colorClass = isActive
    ? "bg-green-500/10 text-green-600 border-green-200"
    : isInactive
      ? "bg-red-500/10 text-red-600 border-red-200"
      : isClosed
        ? "bg-blue-500/10 text-blue-600 border-blue-200"
        : "bg-gray-500/10 text-gray-600 border-gray-200";
  return (
    <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
      {isActive ? "Active" : isInactive ? "Inactive" : isClosed ? "Closed" : val}
    </Badge>
  );
};

const toId = (key: string) => (arr: any[], id: any) =>
  (Array.isArray(arr) ? arr.find((x: any) => Number(x[key]) === Number(id)) : undefined) || undefined;

const numFmt = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? (v ?? "") : n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function LeaveEncashmentEntriesPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.leaveEncashmentEntries);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("");

  const { user } = useAppSelector((state) => state.auth);

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "");
  }, []);

  const { data: userStoreMappings } = useApiQuery("le-entries-user-map", async () => {
    const res = await fetch(`${API_URL}/user-store-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch user mappings");
    const json = await res.json();
    return json.data || [];
  });

  const { data: employees } = useApiQuery("le-entries-employees", async () => {
    const res = await fetch(`${API_URL}/employee-database?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch employees");
    const json = await res.json();
    return json.data || [];
  });

  const { data: leaveEncashmentRequests } = useApiQuery("le-entries-requests", async () => {
    const res = await fetch(`${API_URL}/leave-encashment-request`);
    if (!res.ok) throw new Error("Failed to fetch leave encashment requests");
    const json = await res.json();
    return json.data || [];
  });

  const { data: companies } = useApiQuery("le-entries-companies", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed to fetch companies");
    const json = await res.json();
    return json.data || [];
  });

  const { data: departments } = useApiQuery("le-entries-departments", async () => {
    const res = await fetch(`${API_URL}/department-master`);
    if (!res.ok) throw new Error("Failed to fetch departments");
    const json = await res.json();
    return json.data || [];
  });

  const { data: designations } = useApiQuery("le-entries-designations", async () => {
    const res = await fetch(`${API_URL}/designation-master`);
    if (!res.ok) throw new Error("Failed to fetch designations");
    const json = await res.json();
    return json.data || [];
  });

  const { data: departmentGroups } = useApiQuery("le-entries-dept-groups", async () => {
    const res = await fetch(`${API_URL}/department-group-master`);
    if (!res.ok) throw new Error("Failed to fetch department groups");
    const json = await res.json();
    return json.data || [];
  });

  const { data: designationGroups } = useApiQuery("le-entries-desig-groups", async () => {
    const res = await fetch(`${API_URL}/designation-group-master`);
    if (!res.ok) throw new Error("Failed to fetch designation groups");
    const json = await res.json();
    return json.data || [];
  });

  const { data: camps } = useApiQuery("le-entries-camps", async () => {
    const res = await fetch(`${API_URL}/camp-master`);
    if (!res.ok) throw new Error("Failed to fetch camps");
    const json = await res.json();
    return json.data || [];
  });

  const { data: stores } = useApiQuery("le-entries-stores", async () => {
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

  const { data: employmentTypes } = useApiQuery("le-entries-employment-types", async () => {
    const res = await fetch(`${API_URL}/employment-type-master`);
    if (!res.ok) throw new Error("Failed to fetch employment types");
    const json = await res.json();
    return json.data || [];
  });

  const { data: currencies } = useApiQuery("le-entries-currencies", async () => {
    const res = await fetch(`${API_URL}/currency-master`);
    if (!res.ok) throw new Error("Failed to fetch currencies");
    const json = await res.json();
    return json.data || [];
  });

  const { data: deptDesigMappings } = useApiQuery("le-entries-dept-desig-map", async () => {
    const res = await fetch(`${API_URL}/company-department-designation-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch department-designation mappings");
    const json = await res.json();
    return json.data || [];
  });

  const { data: campStoreMappings } = useApiQuery("le-entries-camp-store-map", async () => {
    const res = await fetch(`${API_URL}/company-camp-store-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch camp-store mappings");
    const json = await res.json();
    return json.data || [];
  });

  const empName = (e: any) => [e?.FIRST_NAME, e?.MIDDLE_NAME, e?.LAST_NAME].filter(Boolean).join(" ") || "";

  const filteredEmployees = useMemo(() => {
    if (!Array.isArray(employees) || !user) return [];
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

  const baseFields: MasterField[] = [
    {
      key: "MONTH_ENTERED",
      label: "Process Month",
      type: "select",
      options: MONTHS.map((m) => ({ value: m.value, label: m.label })),
      defaultValue: user?.monthProcess || "",
      disabled: true,
    },
    {
      key: "YEAR_ENTERED",
      label: "Process Year",
      type: "select",
      options: YEARS.map((y) => ({ value: y, label: y })),
      defaultValue: user?.yearProcess || "",
      disabled: true,
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
    {
      key: "LEAVE_ENCASHMENT_REQUEST_REF_NO",
      label: "Request Ref No",
      type: "select",
      required: true,
      dependsOn: "EMP_ID",
      options: [],
      placeholder: "Select request ref no",
    },
    { key: "FIRST_NAME", label: "First Name", type: "text", disabled: true },
    { key: "MIDDLE_NAME", label: "Middle Name", type: "text", disabled: true },
    { key: "LAST_NAME", label: "Last Name", type: "text", disabled: true },
    { key: "COMPANY_ID", label: "Company", type: "select", options: selectOptions("COMPANY_ID", companies, "COMPANY_NAME"), disabled: true },
    { key: "CAMP_ID", label: "Camp", type: "select", options: selectOptions("CAMP_ID", camps, "CAMP_NAME"), disabled: true },
    { key: "STORE_ID", label: "Store", type: "select", options: selectOptions("STORE_ID", stores, "STORE_NAME"), disabled: true },
    { key: "DEPARTMENT_ID", label: "Department", type: "select", options: selectOptions("DEPARTMENT_ID", departments, "DEPARTMENT_NAME"), disabled: true },
    { key: "DESIGNATION_ID", label: "Designation", type: "select", options: selectOptions("DESIGNATION_ID", designations, "DESIGNATION_NAME"), disabled: true },
    { key: "DEPARTMENT_GROUP_ID", label: "Department Group", type: "select", options: selectOptions("DEPARTMENT_GROUP_ID", departmentGroups, "DEPARTMENT_GROUP_NAME"), disabled: true },
    { key: "DESIGNATION_GROUP_ID", label: "Designation Group", type: "select", options: selectOptions("DESIGNATION_GROUP_ID", designationGroups, "DESIGNATION_GROUP_NAME"), disabled: true },
    { key: "EMPLOYMENT_TYPE_ID", label: "Employment Type", type: "select", options: selectOptions("EMPLOYMENT_TYPE_ID", employmentTypes, "EMPLOYMENT_TYPE_NAME"), disabled: true },
    { key: "CURRENCY_ID", label: "Currency", type: "select", options: selectOptions("CURRENCY_ID", currencies, "CURRENCY_NAME"), disabled: true },
    { key: "BALANCE_LEAVE_DAYS", label: "Balance Leave Days", type: "number", disabled: true },
    { key: "LEAVE_ENCASHMENT_DAYS", label: "Encashment Days", type: "number", disabled: true },

    // Salary breakdown fields
    { key: "BASIC_SALARY", label: "Basic Salary", type: "number", disabled: true },
    { key: "FOT_ALLOWANCE", label: "FOT Allow", type: "number", disabled: true },
    { key: "ATTENDANCE_ALLOWANCE", label: "Att Allow", type: "number", disabled: true },
    { key: "ONE_1YP_ALLOWANCE", label: "1YP Allow", type: "number", disabled: true },
    { key: "TECHNICAL", label: "Technical", type: "number", disabled: true },
    { key: "POLYVALENT", label: "Polyvalent", type: "number", disabled: true },
    { key: "RESPONSIBILITY", label: "Responsibility", type: "number", disabled: true },
    { key: "LOYALTY", label: "Loyalty", type: "number", disabled: true },
    { key: "PRODUCTIVITY", label: "Productivity", type: "number", disabled: true },
    { key: "CAPACITY", label: "Capacity", type: "number", disabled: true },
    { key: "DISCIPLINARY", label: "Disciplinary", type: "number", disabled: true },
    { key: "HOUSE_ALLOW", label: "House Allow", type: "number", disabled: true },
    { key: "MEDICIAL", label: "Medical Allow", type: "number", disabled: true },
    { key: "EDUCATION", label: "Education Allow", type: "number", disabled: true },
    { key: "MISCELLANIES", label: "Misc Allow", type: "number", disabled: true },
    { key: "NIGHT_ALLOWANCE", label: "Night Allow", type: "number", disabled: true },
    { key: "EXTRA1", label: "Extra 1", type: "number", disabled: true },
    { key: "EXTRA2", label: "Extra 2", type: "number", disabled: true },
    { key: "EXTRA3", label: "Extra 3", type: "number", disabled: true },
    { key: "EXTRA4", label: "Extra 4", type: "number", disabled: true },
    { key: "EXTRA5", label: "Extra 5", type: "number", disabled: true },
    { key: "EXTRA6", label: "Extra 6", type: "number", disabled: true },

    {
      key: "LEAVE_ENCASHMENT_GROSS_AMOUNT", label: "Gross Amount", type: "number", required: true, placeholder: "0.00", validate: (value: any) => {
        if (value == null || value === "") return "Gross amount is required";
        if (!validatePositiveNumber(value)) return "Gross amount must be greater than 0";
        return undefined;
      }
    },
    {
      key: "PAID_STATUS", label: "Paid Status", type: "select", options: [
        { value: "PAID", label: "PAID" },
        { value: "UNPAID", label: "UNPAID" }
      ], disabled: true, defaultValue: "UNPAID"
    },
    { key: "REASON", label: "Reason", type: "textarea", placeholder: "Enter reason...", maxLength: 3000 },
    { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter remarks...", maxLength: 1000 },
  ];

  const fields: MasterField[] = useMemo(() => {
    return baseFields.map((f) => {
      switch (f.key) {
        case "LEAVE_ENCASHMENT_REQUEST_REF_NO": return {
          ...f,
          options: (form: Record<string, any>) =>
            (Array.isArray(leaveEncashmentRequests) ? leaveEncashmentRequests : [])
              .filter((r: any) => String(r.EMP_ID) === String(form.EMP_ID) && r.LEAVE_ENCASHMENT_REQUEST_REF_NO)
              .map((r: any) => ({ value: String(r.LEAVE_ENCASHMENT_REQUEST_REF_NO), label: String(r.LEAVE_ENCASHMENT_REQUEST_REF_NO) })),
        };
        case "COMPANY_ID": return { ...f, options: selectOptions("COMPANY_ID", companies, "COMPANY_NAME") };
        case "DEPARTMENT_ID": return { ...f, dependsOn: "COMPANY_ID", options: filteredOptions("DEPARTMENT_ID", departments, "DEPARTMENT_NAME", (form) => cascadeMaps.companyDept.get(String(form.COMPANY_ID ?? ""))) };
        case "DESIGNATION_ID": return { ...f, dependsOn: "DEPARTMENT_ID", options: filteredOptions("DESIGNATION_ID", designations, "DESIGNATION_NAME", (form) => cascadeMaps.companyDeptDesig.get(`${String(form.COMPANY_ID ?? "")}#${String(form.DEPARTMENT_ID ?? "")}`)) };
        case "DEPARTMENT_GROUP_ID": return { ...f, options: selectOptions("DEPARTMENT_GROUP_ID", departmentGroups, "DEPARTMENT_GROUP_NAME") };
        case "DESIGNATION_GROUP_ID": return { ...f, options: selectOptions("DESIGNATION_GROUP_ID", designationGroups, "DESIGNATION_GROUP_NAME") };
        case "CAMP_ID": return { ...f, dependsOn: "COMPANY_ID", options: filteredOptions("CAMP_ID", camps, "CAMP_NAME", (form) => cascadeMaps.companyCamp.get(String(form.COMPANY_ID ?? ""))) };
        case "STORE_ID": return { ...f, dependsOn: "CAMP_ID", options: filteredOptions("STORE_ID", stores, "STORE_NAME", (form) => cascadeMaps.companyCampStore.get(`${String(form.COMPANY_ID ?? "")}#${String(form.CAMP_ID ?? "")}`)) };
        case "EMPLOYMENT_TYPE_ID": return { ...f, options: selectOptions("EMPLOYMENT_TYPE_ID", employmentTypes, "EMPLOYMENT_TYPE_NAME") };
        case "CURRENCY_ID": return { ...f, options: selectOptions("CURRENCY_ID", currencies, "CURRENCY_NAME") };
        default: return f;
      }
    });
  }, [companies, departments, designations, departmentGroups, designationGroups, camps, stores, employmentTypes, currencies, cascadeMaps, leaveEncashmentRequests, items]);

  const handleFieldChange = useCallback((key: string, value: any, setForm: any, form: Record<string, any>): boolean => {
    if (key === "LEAVE_ENCASHMENT_REQUEST_REF_NO") {
      const req = (Array.isArray(leaveEncashmentRequests) ? leaveEncashmentRequests : []).find(
        (r: any) => String(r.LEAVE_ENCASHMENT_REQUEST_REF_NO) === String(value)
      );
      if (req) {
        const toStr = (v: any) => (v == null || v === "" ? "" : String(v));
        const toNum = (v: any) => (v == null || v === "" ? "" : Number(v));
        setForm({
          ...form,
          LEAVE_ENCASHMENT_REQUEST_REF_NO: value,
          MONTH_ENTERED: req.MONTH_ENTERED ?? "",
          YEAR_ENTERED: toStr(req.YEAR_ENTERED),
          EMP_ID: toStr(req.EMP_ID),
          FIRST_NAME: req.FIRST_NAME ?? "",
          MIDDLE_NAME: req.MIDDLE_NAME ?? "",
          LAST_NAME: req.LAST_NAME ?? "",
          COMPANY_ID: toStr(req.COMPANY_ID),
          DEPARTMENT_ID: toStr(req.DEPARTMENT_ID),
          DESIGNATION_ID: toStr(req.DESIGNATION_ID),
          DEPARTMENT_GROUP_ID: toStr(req.DEPARTMENT_GROUP_ID),
          DESIGNATION_GROUP_ID: toStr(req.DESIGNATION_GROUP_ID),
          CAMP_ID: toStr(req.CAMP_ID),
          STORE_ID: toStr(req.STORE_ID),
          EMPLOYMENT_TYPE_ID: toStr(req.EMPLOYMENT_TYPE_ID),
          CURRENCY_ID: toStr(req.CURRENCY_ID),
          BALANCE_LEAVE_DAYS: toNum(req.BALANCE_LEAVE_DAYS),
          LEAVE_ENCASHMENT_DAYS: toNum(req.LEAVE_ENCASHMENT_DAYS),
          LEAVE_ENCASHMENT_GROSS_AMOUNT: toNum(req.LEAVE_ENCASHMENT_GROSS_AMOUNT),
          REASON: req.REASON ?? "",
          REMARKS: req.REMARKS ?? "",
        });
      } else {
        setForm({ ...form, LEAVE_ENCASHMENT_REQUEST_REF_NO: value });
      }
      return true;
    }

    if (key === "EMP_ID") {
      const empGrid = (Array.isArray(filteredEmployees) ? filteredEmployees.find((e: any) => String(e.EMP_ID) === String(value)) : undefined);
      if (empGrid && empGrid.SNO) {
        fetch(`${API_URL}/employee-database/${empGrid.SNO}`)
          .then(res => res.json())
          .then(json => {
            if (json.success && json.data) {
              const fullEmp = json.data;
              setForm((prev: any) => ({
                ...prev,
                EMP_ID: value,
                LEAVE_ENCASHMENT_REQUEST_REF_NO: "",
                FIRST_NAME: fullEmp.FIRST_NAME || "",
                MIDDLE_NAME: fullEmp.MIDDLE_NAME || "",
                LAST_NAME: fullEmp.LAST_NAME || "",
                COMPANY_ID: fullEmp.COMPANY_ID ? String(fullEmp.COMPANY_ID) : "",
                CAMP_ID: fullEmp.CAMP_ID ? String(fullEmp.CAMP_ID) : "",
                STORE_ID: fullEmp.STORE_ID ? String(fullEmp.STORE_ID) : "",
                DEPARTMENT_ID: fullEmp.DEPARTMENT_ID ? String(fullEmp.DEPARTMENT_ID) : "",
                DESIGNATION_ID: fullEmp.DESIGNATION_ID ? String(fullEmp.DESIGNATION_ID) : "",
                DEPARTMENT_GROUP_ID: fullEmp.DEPARTMENT_GROUP_ID ? String(fullEmp.DEPARTMENT_GROUP_ID) : "",
                DESIGNATION_GROUP_ID: fullEmp.DESIGNATION_GROUP_ID ? String(fullEmp.DESIGNATION_GROUP_ID) : "",
                EMPLOYMENT_TYPE_ID: fullEmp.EMPLOYMENT_TYPE_ID ? String(fullEmp.EMPLOYMENT_TYPE_ID) : "",
                CURRENCY_ID: fullEmp.CURRENCY_ID ? String(fullEmp.CURRENCY_ID) : "",
                BALANCE_LEAVE_DAYS: fullEmp.LEAVE != null && fullEmp.LEAVE !== "" ? String(fullEmp.LEAVE) : "",

                BASIC_SALARY: fullEmp.BASIC_SALARY ? String(fullEmp.BASIC_SALARY) : "",
                FOT_ALLOWANCE: fullEmp.FOT_ALLOWANCE ? String(fullEmp.FOT_ALLOWANCE) : "",
                ATTENDANCE_ALLOWANCE: fullEmp.ATTENDANCE_ALLOWANCE ? String(fullEmp.ATTENDANCE_ALLOWANCE) : "",
                ONE_1YP_ALLOWANCE: fullEmp.ONE_1YP_ALLOWANCE ? String(fullEmp.ONE_1YP_ALLOWANCE) : "",
                TECHNICAL: fullEmp.TECHNICAL ? String(fullEmp.TECHNICAL) : "",
                POLYVALENT: fullEmp.POLYVALENT ? String(fullEmp.POLYVALENT) : "",
                RESPONSIBILITY: fullEmp.RESPONSIBILITY ? String(fullEmp.RESPONSIBILITY) : "",
                LOYALTY: fullEmp.LOYALTY ? String(fullEmp.LOYALTY) : "",
                PRODUCTIVITY: fullEmp.PRODUCTIVITY ? String(fullEmp.PRODUCTIVITY) : "",
                CAPACITY: fullEmp.CAPACITY ? String(fullEmp.CAPACITY) : "",
                DISCIPLINARY: fullEmp.DISCIPLINARY ? String(fullEmp.DISCIPLINARY) : "",
                HOUSE_ALLOW: fullEmp.HOUSE_ALLOW ? String(fullEmp.HOUSE_ALLOW) : "",
                MEDICIAL: fullEmp.MEDICIAL ? String(fullEmp.MEDICIAL) : "",
                EDUCATION: fullEmp.EDUCATION ? String(fullEmp.EDUCATION) : "",
                MISCELLANIES: fullEmp.MISCELLANIES ? String(fullEmp.MISCELLANIES) : "",
                NIGHT_ALLOWANCE: fullEmp.NIGHT_ALLOWANCE ? String(fullEmp.NIGHT_ALLOWANCE) : "",
                EXTRA1: fullEmp.EXTRA1 ? String(fullEmp.EXTRA1) : "",
                EXTRA2: fullEmp.EXTRA2 ? String(fullEmp.EXTRA2) : "",
                EXTRA3: fullEmp.EXTRA3 ? String(fullEmp.EXTRA3) : "",
                EXTRA4: fullEmp.EXTRA4 ? String(fullEmp.EXTRA4) : "",
                EXTRA5: fullEmp.EXTRA5 ? String(fullEmp.EXTRA5) : "",
                EXTRA6: fullEmp.EXTRA6 ? String(fullEmp.EXTRA6) : "",
              }));
            }
          });
      } else {
        setForm({ ...form, EMP_ID: value, LEAVE_ENCASHMENT_REQUEST_REF_NO: "" });
      }
      return true;
    }

    return false;
  }, [filteredEmployees, leaveEncashmentRequests]);

  const columns = useMemo(() => [
    { key: "SNO", label: "ID" },
    { key: "LEAVE_ENCASHMENT_REQUEST_REF_NO", label: "Ref No" },
    { key: "MONTH_ENTERED", label: "Month" },
    { key: "YEAR_ENTERED", label: "Year" },
    { key: "EMP_NAME", label: "Employee" },
    { key: "COMPANY_NAME", label: "Company" },
    { key: "DEPARTMENT_NAME", label: "Department" },
    { key: "DESIGNATION_NAME", label: "Designation" },
    { key: "BALANCE_LEAVE_DAYS", label: "Balance Days", render: (val: any) => numFmt(val) },
    { key: "LEAVE_ENCASHMENT_DAYS", label: "Encash Days", render: (val: any) => numFmt(val) },
    { key: "LEAVE_ENCASHMENT_GROSS_AMOUNT", label: "Gross Amt", render: (val: any) => numFmt(val) },
    { key: "REMARKS", label: "Remarks" },
    {
      key: "STATUS_MASTER",
      label: "Status",
      render: (val: any) => statusBadge(val),
    },
  ], []);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.map((u: any) => {
      const emp = toId("EMP_ID")(employees, u.EMP_ID);
      return {
        ...u,
        id: u.SNO,
        SNO: u.SNO,
        EMP_NAME: empName(emp) || (u.EMP_ID ? `#${u.EMP_ID}` : ""),
        COMPANY_NAME: toId("COMPANY_ID")(companies, u.COMPANY_ID)?.COMPANY_NAME || u.COMPANY_NAME || "",
        DEPARTMENT_NAME: toId("DEPARTMENT_ID")(departments, u.DEPARTMENT_ID)?.DEPARTMENT_NAME || u.DEPARTMENT_NAME || "",
        DESIGNATION_NAME: toId("DESIGNATION_ID")(designations, u.DESIGNATION_ID)?.DESIGNATION_NAME || u.DESIGNATION_NAME || "",
      };
    });
  }, [items, employees, companies, departments, designations]);

  useEffect(() => {
    dispatch(fetchLeaveEncashmentEntries(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearLeaveEncashmentEntriesError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: LeaveEncashmentEntriesGridData) => {
      const NUM_KEYS = [
        "YEAR_ENTERED",
        "EMP_ID",
        "COMPANY_ID",
        "DEPARTMENT_ID",
        "DESIGNATION_ID",
        "DEPARTMENT_GROUP_ID",
        "DESIGNATION_GROUP_ID",
        "CAMP_ID",
        "STORE_ID",
        "EMPLOYMENT_TYPE_ID",
        "CURRENCY_ID",
        "BALANCE_LEAVE_DAYS",
        "LEAVE_ENCASHMENT_DAYS",
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
        "LEAVE_ENCASHMENT_GROSS_AMOUNT",
      ];
      const month = user?.monthProcess || new Date().toLocaleString("en", { month: "long" });
      const payload: Record<string, any> = {
        ...item,
        MONTH_ENTERED: item.MONTH_ENTERED || user?.monthProcess || month,
        YEAR_ENTERED: item.YEAR_ENTERED || user?.yearProcess || new Date().getFullYear(),
        STATUS_MASTER: item.STATUS_MASTER || "AC",
        PAID_STATUS: item.PAID_STATUS || "UNPAID",
        USER: user?.loginName || "Admin",
        MAC_ADDRESS: "WEB",
      };
      NUM_KEYS.forEach((k) => {
        const v = payload[k];
        if (v === "" || v === undefined || v === null) delete payload[k];
      });
      const res = await dispatch(addLeaveEncashmentEntry(payload as LeaveEncashmentEntriesGridData)).unwrap();
      dispatch(fetchLeaveEncashmentEntries(currentStatus));
      return res;
    },
    update: async (item: LeaveEncashmentEntriesGridData) => {
      const res = await dispatch(updateLeaveEncashmentEntry(item)).unwrap();
      dispatch(fetchLeaveEncashmentEntries(currentStatus));
      return res;
    },
    remove: async (id: string) => {
      const row = (Array.isArray(enrichedData) ? enrichedData.find((r: any) => String(r.SNO) === String(id)) : undefined);
      const ref = row?.LEAVE_ENCASHMENT_REQUEST_REF_NO || id;
      const res = await dispatch(deleteLeaveEncashmentEntry(ref)).unwrap();
      dispatch(fetchLeaveEncashmentEntries(currentStatus));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        const row = (Array.isArray(enrichedData) ? enrichedData.find((r: any) => String(r.SNO) === String(id)) : undefined);
        const ref = row?.LEAVE_ENCASHMENT_REQUEST_REF_NO || id;
        res = await dispatch(deleteLeaveEncashmentEntry(ref)).unwrap();
      }
      dispatch(fetchLeaveEncashmentEntries(currentStatus));
      return res;
    },
    onFieldChange: handleFieldChange,
  }), [enrichedData, loading, dispatch, currentStatus, handleFieldChange, user?.monthProcess, user?.yearProcess, user?.loginName]);

  return (
    <div className="space-y-4">
      <MasterCrudPage
        title="Leave Encashment Entries"
        description="Manage leave encashment entries and salary components"
        idPrefix="LEE"
        domain="leave-encashment-entries"
        fields={fields}
        columns={columns}
        initialData={[]}
        customStoreOverrides={storeOverrides}
        statusOptions={[
          { label: "All Status", value: "" },
          { label: "Active", value: "AC" },
          { label: "Inactive", value: "IN" },
          { label: "Closed", value: "CL" },
        ]}
        onStatusFilterChange={handleStatusFilterChange}
        enableViewDetails
        onBeforeEdit={async (item) => {
          const ref = item.LEAVE_ENCASHMENT_REQUEST_REF_NO;
          if (!ref) return undefined;
          const res = await fetch(`${API_URL}/leave-encashment-entries/${encodeURIComponent(ref)}`);
          if (!res.ok) return undefined;
          const json = await res.json();
          return json.data;
        }}
      />
    </div>
  );
}
