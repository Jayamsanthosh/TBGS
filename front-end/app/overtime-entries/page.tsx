"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchOvertimeEntries,
  addOvertimeEntries,
  updateOvertimeEntries,
  deleteOvertimeEntries,
  clearOvertimeEntriesError,
  OvertimeEntriesGridData,
} from "@/lib/overtimeEntriesSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";
import { MONTHS, YEARS } from "@/lib/utils";

const statusBadge = (val: any) => {
  const sv = String(val || "").toLowerCase();
  const isActive = sv === "active" || sv === "ac";
  const isInactive = sv === "inactive" || sv === "in";
  const isSubmitted = sv === "cl" || sv === "closed" || sv === "submitted";
  const isCancelled = sv === "ca" || sv === "cancelled" || sv === "canceled";
  const colorClass = isActive
    ? "bg-green-500/10 text-green-600 border-green-200"
    : isInactive
      ? "bg-red-500/10 text-red-600 border-red-200"
      : isSubmitted
        ? "bg-blue-500/10 text-blue-600 border-blue-200"
        : isCancelled
          ? "bg-yellow-500/10 text-yellow-600 border-yellow-200"
          : "bg-muted/40 text-muted-foreground border-border";
  const label = isActive ? "Active" : isInactive ? "Inactive" : isSubmitted ? "Submitted" : isCancelled ? "Cancelled" : val;
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

export default function OvertimeEntriesPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.overtimeEntries);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("");

  const { user } = useAppSelector((state) => state.auth);

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "");
  }, []);

  const { data: userStoreMappings } = useApiQuery("ot-entry-user-map", async () => {
    const res = await fetch(`${API_URL}/user-store-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch user mappings");
    const json = await res.json();
    return json.data || [];
  });

  const { data: employees } = useApiQuery("ot-entry-employees", async () => {
    const res = await fetch(`${API_URL}/employee-database?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch employees");
    const json = await res.json();
    return json.data || [];
  });

  const { data: overtimeRequests } = useApiQuery("ot-entry-requests", async () => {
    const res = await fetch(`${API_URL}/overtime-request`);
    if (!res.ok) throw new Error("Failed to fetch overtime requests");
    const json = await res.json();
    return json.data || [];
  });

  const { data: companies } = useApiQuery("ot-entry-companies", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed to fetch companies");
    const json = await res.json();
    return json.data || [];
  });

  const { data: departments } = useApiQuery("ot-entry-departments", async () => {
    const res = await fetch(`${API_URL}/department-master`);
    if (!res.ok) throw new Error("Failed to fetch departments");
    const json = await res.json();
    return json.data || [];
  });

  const { data: designations } = useApiQuery("ot-entry-designations", async () => {
    const res = await fetch(`${API_URL}/designation-master`);
    if (!res.ok) throw new Error("Failed to fetch designations");
    const json = await res.json();
    return json.data || [];
  });

  const { data: departmentGroups } = useApiQuery("ot-entry-dept-groups", async () => {
    const res = await fetch(`${API_URL}/department-group-master`);
    if (!res.ok) throw new Error("Failed to fetch department groups");
    const json = await res.json();
    return json.data || [];
  });

  const { data: designationGroups } = useApiQuery("ot-entry-desig-groups", async () => {
    const res = await fetch(`${API_URL}/designation-group-master`);
    if (!res.ok) throw new Error("Failed to fetch designation groups");
    const json = await res.json();
    return json.data || [];
  });

  const { data: camps } = useApiQuery("ot-entry-camps", async () => {
    const res = await fetch(`${API_URL}/camp-master`);
    if (!res.ok) throw new Error("Failed to fetch camps");
    const json = await res.json();
    return json.data || [];
  });

  const { data: stores } = useApiQuery("ot-entry-stores", async () => {
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

  const { data: employmentTypes } = useApiQuery("ot-entry-employment-types", async () => {
    const res = await fetch(`${API_URL}/employment-type-master`);
    if (!res.ok) throw new Error("Failed to fetch employment types");
    const json = await res.json();
    return json.data || [];
  });

  const { data: currencies } = useApiQuery("ot-entry-currencies", async () => {
    const res = await fetch(`${API_URL}/currency-master`);
    if (!res.ok) throw new Error("Failed to fetch currencies");
    const json = await res.json();
    return json.data || [];
  });

  const { data: paymentModes } = useApiQuery("ot-entry-payment-modes", async () => {
    const res = await fetch(`${API_URL}/payment-mode-master`);
    if (!res.ok) throw new Error("Failed to fetch payment modes");
    const json = await res.json();
    return json.data || [];
  });

  const { data: banks } = useApiQuery("ot-entry-banks", async () => {
    const res = await fetch(`${API_URL}/bank-master`);
    if (!res.ok) throw new Error("Failed to fetch banks");
    const json = await res.json();
    return json.data || [];
  });

  const { data: deptDesigMappings } = useApiQuery("ot-entry-dept-desig-map", async () => {
    const res = await fetch(`${API_URL}/company-department-designation-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch department-designation mappings");
    const json = await res.json();
    return json.data || [];
  });

  const { data: campStoreMappings } = useApiQuery("ot-entry-camp-store-map", async () => {
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
      key: "OT_REQUEST_REF_NO",
      label: "Overtime Request Ref No",
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
    { key: "OT_FROM_DATE", label: "OT From Date", type: "date", placeholder: "Select Date", disabled: true },
    { key: "OT_TO_DATE", label: "OT To Date", type: "date", placeholder: "Select Date", disabled: true },
    { key: "OT_HOURS", label: "OT Hours", type: "number", placeholder: "0.00", disabled: true },
    { key: "OT_AMOUNT", label: "OT Amount", type: "number", placeholder: "0.00", disabled: true },
    { key: "PAYMENT_REF_NO", label: "Payment Ref No", type: "text", placeholder: "Enter payment reference number", disabled: true },
    {
      key: "PAYMENT_MODE_ID",
      label: "Payment Mode",
      type: "select",
      options: selectOptions("PAYMENT_MODE_ID", paymentModes, "PAYMENT_MODE_NAME"),
      placeholder: "Select payment mode",
      disabled: true,
    },
    {
      key: "BANK_ID",
      label: "Bank",
      type: "select",
      options: selectOptions("BANK_ID", banks, "BANK_NAME"),
      placeholder: "Select bank",
      disabled: true,
    },
    { key: "ACCOUNT_NO", label: "Account No", type: "text", placeholder: "Enter account number", disabled: true },
    {
      key: "PAID_STATUS",
      label: "Paid Status",
      type: "select",
      options: [
        { value: "Paid", label: "Paid" },
        { value: "Unpaid", label: "Unpaid" },
      ],
      placeholder: "Select paid status",
      disabled: true,
    },
    { key: "REASON", label: "Reason", type: "textarea", placeholder: "Enter reason...", maxLength: 3000, disabled: true },
    { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter remarks...", maxLength: 1000, disabled: true },
  ];

  const fields: MasterField[] = useMemo(() => {
    return baseFields.map((f) => {
      switch (f.key) {
        case "OT_REQUEST_REF_NO": return {
          ...f,
          options: (form: Record<string, any>) =>
            (Array.isArray(overtimeRequests) ? overtimeRequests : [])
              .filter((r: any) => String(r.EMP_ID) === String(form.EMP_ID) && r.OT_REQUEST_REF_NO)
              .map((r: any) => ({ value: String(r.OT_REQUEST_REF_NO), label: String(r.OT_REQUEST_REF_NO) })),
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
        case "PAYMENT_MODE_ID": return { ...f, options: selectOptions("PAYMENT_MODE_ID", paymentModes, "PAYMENT_MODE_NAME") };
        case "BANK_ID": return { ...f, options: selectOptions("BANK_ID", banks, "BANK_NAME") };
        default: return f;
      }
    });
  }, [companies, departments, designations, departmentGroups, designationGroups, camps, stores, employmentTypes, paymentModes, banks, currencies, cascadeMaps, overtimeRequests]);

  const handleFieldChange = useCallback((key: string, value: any, setForm: any, form: Record<string, any>): boolean => {
    if (key === "OT_REQUEST_REF_NO") {
      const req = (Array.isArray(overtimeRequests) ? overtimeRequests : []).find(
        (r: any) => String(r.OT_REQUEST_REF_NO) === String(value)
      );
      if (req) {
        const fmtDate = (d: any) => {
          if (d == null || d === "") return "";
          const dt = new Date(d);
          return isNaN(dt.getTime()) ? String(d) : dt.toISOString().split("T")[0];
        };
        const toNum = (v: any) => (v == null || v === "" ? "" : Number(v));
        const toStr = (v: any) => (v == null || v === "" ? "" : String(v));
        setForm({
          ...form,
          OT_REQUEST_REF_NO: value,
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
          OT_FROM_DATE: fmtDate(req.OT_FROM_DATE),
          OT_TO_DATE: fmtDate(req.OT_TO_DATE),
          OT_HOURS: toNum(req.OT_HOURS),
          OT_AMOUNT: toNum(req.APPROVED_AMOUNT ?? req.REQUEST_AMOUNT),
          PAYMENT_REF_NO: req.PAYMENT_REF_NO ?? "",
          PAYMENT_MODE_ID: toStr(req.PAYMENT_MODE_ID),
          BANK_ID: toStr(req.BANK_ID),
          ACCOUNT_NO: req.ACCOUNT_NO ?? "",
          PAID_STATUS: req.PAID_STATUS ?? "",
          REASON: req.REASON ?? "",
          REMARKS: req.REMARKS ?? "",
        });
      } else {
        setForm({ ...form, OT_REQUEST_REF_NO: value });
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
                OT_REQUEST_REF_NO: "",
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
                PAYMENT_MODE_ID: fullEmp.PAYMENT_MODE_ID ? String(fullEmp.PAYMENT_MODE_ID) : "",
                BANK_ID: fullEmp.BANK_ID ? String(fullEmp.BANK_ID) : "",
                ACCOUNT_NO: fullEmp.ACCOUNT_NO || "",
              }));
            }
          });
      } else {
        setForm({ ...form, EMP_ID: value, OT_REQUEST_REF_NO: "" });
      }
      return true;
    }

    return false;
  }, [filteredEmployees, overtimeRequests]);

  const columns = useMemo(() => [
    { key: "SNO", label: "ID" },
    { key: "OT_REQUEST_REF_NO", label: "Ref No" },
    { key: "MONTH_ENTERED", label: "Month" },
    { key: "YEAR_ENTERED", label: "Year" },
    { key: "EMP_NAME", label: "Employee" },
    { key: "COMPANY_NAME", label: "Company" },
    { key: "DEPARTMENT_NAME", label: "Department" },
    { key: "DESIGNATION_NAME", label: "Designation" },
    { key: "OT_FROM_DATE", label: "OT From", render: (val: any) => (val ? String(val).slice(0, 10) : "") },
    { key: "OT_TO_DATE", label: "OT To", render: (val: any) => (val ? String(val).slice(0, 10) : "") },
    { key: "OT_HOURS", label: "OT Hours" },
    { key: "OT_AMOUNT", label: "OT Amt", render: (val: any) => numFmt(val) },
    { key: "PAID_STATUS", label: "Paid Status" },
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
    dispatch(fetchOvertimeEntries(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearOvertimeEntriesError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: OvertimeEntriesGridData) => {
      const DATE_INPUT_KEYS = ["OT_FROM_DATE", "OT_TO_DATE"];
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
        "OT_HOURS",
        "OT_AMOUNT",
        "PAYMENT_MODE_ID",
        "BANK_ID",
        ...DATE_INPUT_KEYS,
      ];
      const month = user?.monthProcess || new Date().toLocaleString("en", { month: "long" });
      const payload: Record<string, any> = {
        ...item,
        MONTH_ENTERED: item.MONTH_ENTERED || user?.monthProcess || month,
        YEAR_ENTERED: item.YEAR_ENTERED || user?.yearProcess || new Date().getFullYear(),
        STATUS_MASTER: item.STATUS_MASTER || "AC",
        USER: user?.loginName || "Admin",
        MAC_ADDRESS: "WEB",
      };
      NUM_KEYS.forEach((k) => {
        const v = payload[k];
        if (v === "" || v === undefined || v === null) delete payload[k];
      });
      const res = await dispatch(addOvertimeEntries(payload as OvertimeEntriesGridData)).unwrap();
      dispatch(fetchOvertimeEntries(currentStatus));
      return res;
    },
    update: async (item: OvertimeEntriesGridData) => {
      const res = await dispatch(updateOvertimeEntries(item)).unwrap();
      dispatch(fetchOvertimeEntries(currentStatus));
      return res;
    },
    remove: async (id: string) => {
      const row = (Array.isArray(enrichedData) ? enrichedData.find((r: any) => String(r.SNO) === String(id)) : undefined);
      const ref = row?.OT_REQUEST_REF_NO || id;
      const res = await dispatch(deleteOvertimeEntries(ref)).unwrap();
      dispatch(fetchOvertimeEntries(currentStatus));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        const row = (Array.isArray(enrichedData) ? enrichedData.find((r: any) => String(r.SNO) === String(id)) : undefined);
        const ref = row?.OT_REQUEST_REF_NO || id;
        res = await dispatch(deleteOvertimeEntries(ref)).unwrap();
      }
      dispatch(fetchOvertimeEntries(currentStatus));
      return res;
    },
    onFieldChange: handleFieldChange,
  }), [enrichedData, loading, dispatch, currentStatus, handleFieldChange, user?.monthProcess, user?.yearProcess, user?.loginName]);

  return (
    <div className="space-y-4">
      <MasterCrudPage
      title="Overtime Entry"
      description="Manage overtime entries"
      idPrefix="OT"
      domain="overtime-entries"
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
        const ref = item.OT_REQUEST_REF_NO;
        if (!ref) return undefined;
        const res = await fetch(`${API_URL}/overtime-entries/${encodeURIComponent(ref)}`);
        if (!res.ok) return undefined;
        const json = await res.json();
        return json.data;
      }}
    />
    </div>
  );
}
