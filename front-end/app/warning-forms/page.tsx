"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchWarningForms,
  addWarningForm,
  updateWarningForm,
  deleteWarningForm,
  clearWarningFormsError,
  WarningFormGridData,
} from "@/lib/warningFormsSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";
import { MONTHS, YEARS } from "@/lib/utils";
import {
  validateNonNegativeNumber,
  validateDateRange,
} from "@/lib/validation";

const statusBadge = (val: any) => {
  const sv = String(val || "").toUpperCase();
  const isSubmitted = sv === "CL" || sv === "SUBMITTED" || sv === "CLOSED";
  const isPending = !sv || sv === "PENDING" || sv === "OPEN";
  const colorClass = isSubmitted
    ? "bg-blue-500/10 text-blue-600 border-blue-200"
    : isPending
      ? "bg-amber-500/10 text-amber-600 border-amber-200"
      : "bg-muted/40 text-muted-foreground border-border";
  const label = isSubmitted ? "Submitted" : isPending ? "Pending" : val;
  return (
    <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
      {label}
    </Badge>
  );
};

const numFmt = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? (v ?? "") : n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const empFullName = (u: any) => [u?.FIRST_NAME, u?.MIDDLE_NAME, u?.LAST_NAME].filter(Boolean).join(" ") || "";

const computeDeductionMonths = (from: any, to: any): string => {
  if (!from || !to) return "";
  const f = new Date(from);
  const t = new Date(to);
  if (isNaN(f.getTime()) || isNaN(t.getTime()) || t < f) return "";
  const months = (t.getFullYear() - f.getFullYear()) * 12 + (t.getMonth() - f.getMonth()) + 1;
  return String(months);
};

export default function WarningFormsPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.warningForms);
  const { toast } = useToast();
  const { user } = useAppSelector((state) => state.auth);
  const [currentStatus, setCurrentStatus] = useState<string>("");

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "");
  }, []);

  const { data: userStoreMappings } = useApiQuery("wf-user-map", async () => {
    const res = await fetch(`${API_URL}/user-store-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch user mappings");
    const json = await res.json();
    return json.data || [];
  });

  const { data: employees } = useApiQuery("wf-employees", async () => {
    const res = await fetch(`${API_URL}/employee-database?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch employees");
    const json = await res.json();
    return json.data || [];
  });

  const { data: companies } = useApiQuery("wf-companies", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed to fetch companies");
    const json = await res.json();
    return json.data || [];
  });

  const { data: departments } = useApiQuery("wf-departments", async () => {
    const res = await fetch(`${API_URL}/department-master`);
    if (!res.ok) throw new Error("Failed to fetch departments");
    const json = await res.json();
    return json.data || [];
  });

  const { data: designations } = useApiQuery("wf-designations", async () => {
    const res = await fetch(`${API_URL}/designation-master`);
    if (!res.ok) throw new Error("Failed to fetch designations");
    const json = await res.json();
    return json.data || [];
  });

  const { data: departmentGroups } = useApiQuery("wf-dept-groups", async () => {
    const res = await fetch(`${API_URL}/department-group-master`);
    if (!res.ok) throw new Error("Failed to fetch department groups");
    const json = await res.json();
    return json.data || [];
  });

  const { data: designationGroups } = useApiQuery("wf-desig-groups", async () => {
    const res = await fetch(`${API_URL}/designation-group-master`);
    if (!res.ok) throw new Error("Failed to fetch designation groups");
    const json = await res.json();
    return json.data || [];
  });

  const { data: camps } = useApiQuery("wf-camps", async () => {
    const res = await fetch(`${API_URL}/camp-master`);
    if (!res.ok) throw new Error("Failed to fetch camps");
    const json = await res.json();
    return json.data || [];
  });

  const { data: stores } = useApiQuery("wf-stores", async () => {
    const res = await fetch(`${API_URL}/store-master`);
    if (!res.ok) throw new Error("Failed to fetch stores");
    const json = await res.json();
    return (json.data || []).map((s: any) => ({
      ...s,
      STORE_ID: s.Store_Id ?? s.STORE_ID,
      STORE_NAME: s.Store_Name ?? s.STORE_NAME,
    }));
  });

  const { data: employmentTypes } = useApiQuery("wf-employment-types", async () => {
    const res = await fetch(`${API_URL}/employment-type-master`);
    if (!res.ok) throw new Error("Failed to fetch employment types");
    const json = await res.json();
    return json.data || [];
  });

  const { data: currencies } = useApiQuery("wf-currencies", async () => {
    const res = await fetch(`${API_URL}/currency-master`);
    if (!res.ok) throw new Error("Failed to fetch currencies");
    const json = await res.json();
    return json.data || [];
  });

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
    { key: "FIRST_NAME", label: "First Name", type: "text", disabled: true },
    { key: "MIDDLE_NAME", label: "Middle Name", type: "text", disabled: true },
    { key: "LAST_NAME", label: "Last Name", type: "text", disabled: true },
    { key: "DATE_OF_ISSUE", label: "Date of Issue", type: "date", required: true, placeholder: "Select date" },
    { key: "COMPANY_ID", label: "Company", type: "select", options: selectOptions("COMPANY_ID", companies, "COMPANY_NAME"), disabled: true },
    { key: "CAMP_ID", label: "Camp", type: "select", options: selectOptions("CAMP_ID", camps, "CAMP_NAME"), disabled: true },
    { key: "STORE_ID", label: "Store", type: "select", options: selectOptions("STORE_ID", stores, "STORE_NAME"), disabled: true },
    { key: "DEPARTMENT_ID", label: "Department", type: "select", options: selectOptions("DEPARTMENT_ID", departments, "DEPARTMENT_NAME"), disabled: true },
    { key: "DESIGNATION_ID", label: "Designation", type: "select", options: selectOptions("DESIGNATION_ID", designations, "DESIGNATION_NAME"), disabled: true },
    { key: "DEPARTMENT_GROUP_ID", label: "Department Group", type: "select", options: selectOptions("DEPARTMENT_GROUP_ID", departmentGroups, "DEPARTMENT_GROUP_NAME"), disabled: true },
    { key: "DESIGNATION_GROUP_ID", label: "Designation Group", type: "select", options: selectOptions("DESIGNATION_GROUP_ID", designationGroups, "DESIGNATION_GROUP_NAME"), disabled: true },
    { key: "EMPLOYMENT_TYPE_ID", label: "Employment Type", type: "select", options: selectOptions("EMPLOYMENT_TYPE_ID", employmentTypes, "EMPLOYMENT_TYPE_NAME"), disabled: true },
    { key: "CURRENCY_ID", label: "Currency", type: "select", options: selectOptions("CURRENCY_ID", currencies, "CURRENCY_NAME"), disabled: true },
    {
      key: "FINE_REQUIRED_STATUS",
      label: "Fine Required",
      type: "select",
      options: [
        { value: "YES", label: "Yes" },
        { value: "NO", label: "No" },
      ],
      placeholder: "Select yes/no",
    },
    { key: "FINE_AMOUNT", label: "Fine Amount", type: "number", placeholder: "0.00", validate: (value: any) => {
      if (value != null && value !== "" && !validateNonNegativeNumber(value)) return "Fine Amount must be 0 or greater";
      return undefined;
    } },
    { key: "DEDUCTION_FROM_DATE", label: "Deduction From Date", type: "date", placeholder: "Select date" },
    {
      key: "DEDUCTION_TO_DATE",
      label: "Deduction To Date",
      type: "date",
      placeholder: "Select date",
      validate: (_value: any, form: any) => {
        if (form.DEDUCTION_FROM_DATE && form.DEDUCTION_TO_DATE && !validateDateRange(form.DEDUCTION_FROM_DATE, form.DEDUCTION_TO_DATE)) return "Deduction To Date must be on or after Deduction From Date";
        return undefined;
      },
    },
    { key: "NO_OF_MONTHS", label: "No of Months", type: "number", disabled: true, placeholder: "Auto calculated" },
    { key: "MONTHLY_DEDUCTION_AMOUNT", label: "Monthly Deduction Amount", type: "number", placeholder: "0.00", validate: (value: any) => {
      if (value != null && value !== "" && !validateNonNegativeNumber(value)) return "Monthly Deduction Amount must be 0 or greater";
      return undefined;
    } },
    { key: "EMPLOYEE_COMMENTS", label: "Employee Comments", type: "textarea", placeholder: "Enter employee comments...", maxLength: 5000 },
    {
      key: "REPORTING_MANAGER_ID",
      label: "Reporting Manager",
      type: "select",
      renderField: ({ form, setForm }) => (
        <EmployeeCombobox
          value={form.REPORTING_MANAGER_ID}
          options={filteredEmployees}
          onChange={(val) => handleFieldChange("REPORTING_MANAGER_ID", val, setForm, form)}
        />
      )
    },
    { key: "MANAGER_COMMENTS", label: "Manager Comments", type: "textarea", placeholder: "Enter manager comments...", maxLength: 5000 },
    { key: "COMMITTEE_MEMBER_NAME", label: "Committee Member Name", type: "text", placeholder: "Enter committee member name", maxLength: 50 },
    { key: "COMMITTEE_MEMBER_COMMENTS", label: "Committee Member Comments", type: "textarea", placeholder: "Enter committee member comments...", maxLength: 5000 },
    { key: "HR_MANAGER_NAME", label: "HR Manager Name", type: "text", placeholder: "Enter HR manager name", maxLength: 50 },
    { key: "HR_COMMENTS", label: "HR Comments", type: "textarea", placeholder: "Enter HR comments...", maxLength: 5000 },
    { key: "REASON", label: "Reason", type: "textarea", placeholder: "Enter reason...", maxLength: 5000 },
  ];

  const fields: MasterField[] = useMemo(() => {
    return baseFields.map((f) => {
      switch (f.key) {
        case "COMPANY_ID": return { ...f, options: selectOptions("COMPANY_ID", companies, "COMPANY_NAME") };
        case "DEPARTMENT_ID": return { ...f, options: selectOptions("DEPARTMENT_ID", departments, "DEPARTMENT_NAME") };
        case "DESIGNATION_ID": return { ...f, options: selectOptions("DESIGNATION_ID", designations, "DESIGNATION_NAME") };
        case "DEPARTMENT_GROUP_ID": return { ...f, options: selectOptions("DEPARTMENT_GROUP_ID", departmentGroups, "DEPARTMENT_GROUP_NAME") };
        case "DESIGNATION_GROUP_ID": return { ...f, options: selectOptions("DESIGNATION_GROUP_ID", designationGroups, "DESIGNATION_GROUP_NAME") };
        case "CAMP_ID": return { ...f, options: selectOptions("CAMP_ID", camps, "CAMP_NAME") };
        case "STORE_ID": return { ...f, options: selectOptions("STORE_ID", stores, "STORE_NAME") };
        case "EMPLOYMENT_TYPE_ID": return { ...f, options: selectOptions("EMPLOYMENT_TYPE_ID", employmentTypes, "EMPLOYMENT_TYPE_NAME") };
        case "CURRENCY_ID": return { ...f, options: selectOptions("CURRENCY_ID", currencies, "CURRENCY_NAME") };
        default: return f;
      }
    });
  }, [companies, departments, designations, departmentGroups, designationGroups, camps, stores, employmentTypes, currencies]);

  const handleFieldChange = useCallback((key: string, value: any, setForm: any, form: Record<string, any>): boolean => {
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
              }));
            }
          });
      } else {
        setForm({ ...form, EMP_ID: value });
      }
      return true;
    }

    if (key === "REPORTING_MANAGER_ID") {
      setForm({ ...form, REPORTING_MANAGER_ID: value });
      return true;
    }

    if (key === "DEDUCTION_FROM_DATE" || key === "DEDUCTION_TO_DATE") {
      setForm((prev: any) => {
        const from = key === "DEDUCTION_FROM_DATE" ? value : prev.DEDUCTION_FROM_DATE;
        const to = key === "DEDUCTION_TO_DATE" ? value : prev.DEDUCTION_TO_DATE;
        return { ...prev, [key]: value, NO_OF_MONTHS: computeDeductionMonths(from, to) };
      });
      return true;
    }

    return false;
  }, [filteredEmployees]);

  const columns = useMemo(() => [
    { key: "SNO", label: "ID" },
    { key: "WARNING_REQUEST_REF_NO", label: "Ref No" },
    { key: "WARNING_FORM_NO", label: "Form No" },
    { key: "DATE_OF_ISSUE", label: "Date of Issue" },
    { key: "MONTH_ENTERED", label: "Month" },
    { key: "YEAR_ENTERED", label: "Year" },
    { key: "EMP_NAME", label: "Employee", render: (v: any) => v || "-" },
    { key: "COMPANY_NAME", label: "Company", render: (v: any) => v || "-" },
    { key: "DEPARTMENT_NAME", label: "Department", render: (v: any) => v || "-" },
    { key: "DESIGNATION_NAME", label: "Designation", render: (v: any) => v || "-" },
    { key: "FINE_REQUIRED_STATUS", label: "Fine Req" },
    { key: "FINE_AMOUNT", label: "Fine Amount", render: (val: any) => numFmt(val) },
    { key: "DEDUCTION_FROM_DATE", label: "Ded From" },
    { key: "DEDUCTION_TO_DATE", label: "Ded To" },
    { key: "NO_OF_MONTHS", label: "No of Months" },
    { key: "MONTHLY_DEDUCTION_AMOUNT", label: "Monthly Deduction", render: (val: any) => numFmt(val) },
    {
      key: "REQUEST_STATUS",
      label: "Request Status",
      render: (val: any) => statusBadge(val),
    },
  ], []);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.map((u: any) => ({
      ...u,
      id: u.SNO,
      SNO: u.SNO,
      EMP_NAME: empFullName(u) || (u.EMP_ID ? `#${u.EMP_ID}` : ""),
      DESIGNATION_NAME: u.DESIGNATION_NAME || u.DESIGNATION_name || "",
    }));
  }, [items]);

  useEffect(() => {
    dispatch(fetchWarningForms(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearWarningFormsError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: WarningFormGridData) => {
      const DATE_INPUT_KEYS = ["DATE_OF_ISSUE", "DEDUCTION_FROM_DATE", "DEDUCTION_TO_DATE"];
      const NUM_KEYS = [
        "WARNING_FORM_NO",
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
        "REPORTING_MANAGER_ID",
        "FINE_AMOUNT",
        "NO_OF_MONTHS",
        "MONTHLY_DEDUCTION_AMOUNT",
        ...DATE_INPUT_KEYS,
      ];
      const month = user?.monthProcess || new Date().toLocaleString("en", { month: "long" });
      const payload: Record<string, any> = {
        ...item,
        MONTH_ENTERED: item.MONTH_ENTERED || user?.monthProcess || month,
        YEAR_ENTERED: item.YEAR_ENTERED || user?.yearProcess || new Date().getFullYear(),
        USER: user?.loginName || "Admin",
        MAC_ADDRESS: "WEB",
      };
      NUM_KEYS.forEach((k) => {
        const v = payload[k];
        if (v === "" || v === undefined || v === null || v === 0) delete payload[k];
      });
      const res = await dispatch(addWarningForm(payload as WarningFormGridData)).unwrap();
      dispatch(fetchWarningForms(currentStatus));
      return res;
    },
    update: async (item: WarningFormGridData) => {
      const res = await dispatch(updateWarningForm(item)).unwrap();
      dispatch(fetchWarningForms(currentStatus));
      return res;
    },
    remove: async (id: string) => {
      const row = (Array.isArray(enrichedData) ? enrichedData.find((r: any) => String(r.SNO) === String(id)) : undefined);
      const ref = row?.WARNING_REQUEST_REF_NO || id;
      const res = await dispatch(deleteWarningForm(ref)).unwrap();
      dispatch(fetchWarningForms(currentStatus));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        const row = (Array.isArray(enrichedData) ? enrichedData.find((r: any) => String(r.SNO) === String(id)) : undefined);
        const ref = row?.WARNING_REQUEST_REF_NO || id;
        res = await dispatch(deleteWarningForm(ref)).unwrap();
      }
      dispatch(fetchWarningForms(currentStatus));
      return res;
    },
    onFieldChange: handleFieldChange,
  }), [enrichedData, loading, dispatch, currentStatus, handleFieldChange, user?.monthProcess, user?.yearProcess, user?.loginName]);

  return (
    <div className="space-y-4">
      <MasterCrudPage
      title="Warning Form"
      description="Manage warning forms"
      idPrefix="WAR"
      domain="warning-forms"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[
        { label: "All Status", value: "" },
        { label: "Pending", value: "PENDING" },
        { label: "Submitted", value: "CL" },
      ]}
      onStatusFilterChange={handleStatusFilterChange}
      enableViewDetails
      onBeforeEdit={async (item) => {
        const ref = item.WARNING_REQUEST_REF_NO;
        if (!ref) return undefined;
        const res = await fetch(`${API_URL}/warning-forms/${encodeURIComponent(ref)}`);
        if (!res.ok) return undefined;
        const json = await res.json();
        return json.data;
      }}
    />
    </div>
  );
}