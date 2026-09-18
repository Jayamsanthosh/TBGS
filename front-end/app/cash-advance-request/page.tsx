"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchCashAdvanceRequests,
  addCashAdvanceRequest,
  updateCashAdvanceRequest,
  deleteCashAdvanceRequest,
  submitCashAdvanceRequest,
  clearCashAdvanceRequestError,
  CashAdvanceRequestGridData,
} from "@/lib/cashAdvanceRequestSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";
import { MONTHS, YEARS, SALARY_DEDUCTION_TYPE } from "@/lib/utils";
import {
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateMaxAmount,
  validateDateRange,
  validatePositiveInteger,
} from "@/lib/validation";

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

export default function CashAdvanceRequestPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.cashAdvanceRequest);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [submittingId, setSubmittingId] = useState<string | number | null>(null);

  const { user } = useAppSelector((state) => state.auth);

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "");
  }, []);

  const { data: userStoreMappings } = useApiQuery("car-req-user-map", async () => {
    const res = await fetch(`${API_URL}/user-store-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch user mappings");
    const json = await res.json();
    return json.data || [];
  });

  const { data: employees } = useApiQuery("car-req-employees", async () => {
    const res = await fetch(`${API_URL}/employee-database?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch employees");
    const json = await res.json();
    return json.data || [];
  });

  const { data: companies } = useApiQuery("car-req-companies", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed to fetch companies");
    const json = await res.json();
    return json.data || [];
  });

  const { data: departments } = useApiQuery("car-req-departments", async () => {
    const res = await fetch(`${API_URL}/department-master`);
    if (!res.ok) throw new Error("Failed to fetch departments");
    const json = await res.json();
    return json.data || [];
  });

  const { data: designations } = useApiQuery("car-req-designations", async () => {
    const res = await fetch(`${API_URL}/designation-master`);
    if (!res.ok) throw new Error("Failed to fetch designations");
    const json = await res.json();
    return json.data || [];
  });

  const { data: departmentGroups } = useApiQuery("car-req-dept-groups", async () => {
    const res = await fetch(`${API_URL}/department-group-master`);
    if (!res.ok) throw new Error("Failed to fetch department groups");
    const json = await res.json();
    return json.data || [];
  });

  const { data: designationGroups } = useApiQuery("car-req-desig-groups", async () => {
    const res = await fetch(`${API_URL}/designation-group-master`);
    if (!res.ok) throw new Error("Failed to fetch designation groups");
    const json = await res.json();
    return json.data || [];
  });

  const { data: camps } = useApiQuery("car-req-camps", async () => {
    const res = await fetch(`${API_URL}/camp-master`);
    if (!res.ok) throw new Error("Failed to fetch camps");
    const json = await res.json();
    return json.data || [];
  });

  const { data: stores } = useApiQuery("car-req-stores", async () => {
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

  const { data: employmentTypes } = useApiQuery("car-req-employment-types", async () => {
    const res = await fetch(`${API_URL}/employment-type-master`);
    if (!res.ok) throw new Error("Failed to fetch employment types");
    const json = await res.json();
    return json.data || [];
  });

  const { data: currencies } = useApiQuery("car-req-currencies", async () => {
    const res = await fetch(`${API_URL}/currency-master`);
    if (!res.ok) throw new Error("Failed to fetch currencies");
    const json = await res.json();
    return json.data || [];
  });

  const { data: paymentModes } = useApiQuery("car-req-payment-modes", async () => {
    const res = await fetch(`${API_URL}/payment-mode-master`);
    if (!res.ok) throw new Error("Failed to fetch payment modes");
    const json = await res.json();
    return json.data || [];
  });

  const { data: banks } = useApiQuery("car-req-banks", async () => {
    const res = await fetch(`${API_URL}/bank-master`);
    if (!res.ok) throw new Error("Failed to fetch banks");
    const json = await res.json();
    return json.data || [];
  });

  const { data: deptDesigMappings } = useApiQuery("car-req-dept-desig-map", async () => {
    const res = await fetch(`${API_URL}/company-department-designation-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch department-designation mappings");
    const json = await res.json();
    return json.data || [];
  });

  const { data: campStoreMappings } = useApiQuery("car-req-camp-store-map", async () => {
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
    {
      key: "SALARY_DEDUCTION_TYPE",
      label: "Salary Deduction Type",
      type: "select",
      required: true,
      options: SALARY_DEDUCTION_TYPE.map((s) => ({ value: s, label: s })),
      placeholder: "Select salary deduction type",
    },
    { key: "ADVANCE_TYPE", label: "Advance Type", type: "text", defaultValue: "Cash Advance", disabled: true },
    { key: "GROSS_PAY", label: "Gross Pay", type: "number", placeholder: "0.00", validate: (value: any) => {
      if (value != null && value !== "" && !validateNonNegativeNumber(value)) return "Gross Pay must be 0 or greater";
      return undefined;
    } },
    { key: "NET_PAY", label: "Net Pay", type: "number", placeholder: "0.00", validate: (value: any) => {
      if (value != null && value !== "" && !validateNonNegativeNumber(value)) return "Net Pay must be 0 or greater";
      return undefined;
    } },
    { key: "ELIGIBLE_AMOUNT", label: "Eligible Amount", type: "number", placeholder: "0.00", validate: (value: any) => {
      if (value != null && value !== "" && !validateNonNegativeNumber(value)) return "Eligible Amount must be 0 or greater";
      return undefined;
    } },
    { key: "REQUEST_AMOUNT", label: "Request Amount", type: "number", required: true, placeholder: "0.00", validate: (value: any, form: any) => {
      if (value != null && value !== "" && !validatePositiveNumber(value)) return "Request Amount must be greater than 0";
      if (value != null && value !== "" && form.ELIGIBLE_AMOUNT != null && form.ELIGIBLE_AMOUNT !== "" && !validateMaxAmount(value, form.ELIGIBLE_AMOUNT)) return "Request Amount cannot exceed Eligible Amount";
      return undefined;
    } },
    { key: "APPROVED_AMOUNT", label: "Approved Amount", type: "number", placeholder: "0.00", validate: (value: any, form: any) => {
      if (value != null && value !== "" && !validateNonNegativeNumber(value)) return "Approved Amount must be 0 or greater";
      if (value != null && value !== "" && form.REQUEST_AMOUNT != null && form.REQUEST_AMOUNT !== "" && !validateMaxAmount(value, form.REQUEST_AMOUNT)) return "Approved Amount cannot exceed Request Amount";
      return undefined;
    } },
    { key: "DEDUCTION_FROM_DATE", label: "Deduction From", type: "date", required: true, placeholder: "Select Date" },
    { key: "DEDUCTION_TO_DATE", label: "Deduction To", type: "date", required: true, placeholder: "Select Date", validate: (_value: any, form: any) => {
      if (form.DEDUCTION_FROM_DATE && form.DEDUCTION_TO_DATE && !validateDateRange(form.DEDUCTION_FROM_DATE, form.DEDUCTION_TO_DATE)) return "Deduction To must be on or after Deduction From";
      return undefined;
    } },
    { key: "NO_OF_MONTHS", label: "No. of Months", type: "number", required: true, placeholder: "0", validate: (value: any) => {
      if (value != null && value !== "" && !validatePositiveInteger(value)) return "No. of Months must be a positive whole number";
      return undefined;
    } },
    { key: "MONTHLY_DEDUCTION", label: "Monthly Deduction", type: "number", disabled: true, placeholder: "0.00" },
    {
      key: "PAYMENT_MODE_ID",
      label: "Payment Mode",
      type: "select",
      options: selectOptions("PAYMENT_MODE_ID", paymentModes, "PAYMENT_MODE_NAME"),
      placeholder: "Select payment mode",
    },
    {
      key: "BANK_ID",
      label: "Bank",
      type: "select",
      options: selectOptions("BANK_ID", banks, "BANK_NAME"),
      placeholder: "Select bank",
    },
    { key: "ACCOUNT_NO", label: "Account No", type: "text", placeholder: "Enter account number" },
    { key: "REASON", label: "Reason", type: "textarea", placeholder: "Enter reason...", maxLength: 3000 },
    { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter remarks...", maxLength: 1000 },
  ];

  const fields: MasterField[] = useMemo(() => {
    return baseFields.map((f) => {
      switch (f.key) {
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
  }, [companies, departments, designations, departmentGroups, designationGroups, camps, stores, employmentTypes, paymentModes, banks, currencies, cascadeMaps]);

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
                GROSS_PAY: fullEmp.GROSS ? Number(fullEmp.GROSS) : prev.GROSS_PAY || "",
                PAYMENT_MODE_ID: fullEmp.PAYMENT_MODE_ID ? String(fullEmp.PAYMENT_MODE_ID) : "",
                BANK_ID: fullEmp.BANK_ID ? String(fullEmp.BANK_ID) : "",
                ACCOUNT_NO: fullEmp.ACCOUNT_NO || "",
              }));
            }
          });
      } else {
        setForm({ ...form, EMP_ID: value });
      }
      return true;
    }

    if (key === "REQUEST_AMOUNT" || key === "NO_OF_MONTHS") {
      const fieldUpdate = { ...form, [key]: value };
      const amt = Number(fieldUpdate.REQUEST_AMOUNT);
      const months = Number(fieldUpdate.NO_OF_MONTHS);
      fieldUpdate.MONTHLY_DEDUCTION = amt > 0 && months > 0 ? Number((amt / months).toFixed(2)) : "";
      setForm(fieldUpdate);
      return true;
    }

    return false;
  }, [filteredEmployees]);

  const handleSubmit = useCallback(async (item: any) => {
    const ref = item?.CASH_ADV_REQUEST_REF_NO;
    if (!ref) {
      toast({ variant: "destructive", title: "Error", description: "Missing reference number" });
      return;
    }
    setSubmittingId(item.id ?? item.SNO);
    try {
      const res = await dispatch(submitCashAdvanceRequest(ref)).unwrap();
      toast({ title: res?.message ?? "Cash advance request submitted successfully!" });
      dispatch(fetchCashAdvanceRequests(currentStatus));
    } catch (e: any) {
      const msg = typeof e === "string" ? e : (e?.message || "Failed to submit cash advance request");
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setSubmittingId(null);
    }
  }, [dispatch, currentStatus, toast]);

  const columns = useMemo(() => [
    { key: "SNO", label: "ID" },
    { key: "CASH_ADV_REQUEST_REF_NO", label: "Ref No" },
    { key: "SALARY_DEDUCTION_TYPE", label: "Salary Deduction" },
    { key: "MONTH_ENTERED", label: "Month" },
    { key: "YEAR_ENTERED", label: "Year" },
    { key: "EMP_NAME", label: "Employee" },
    { key: "COMPANY_NAME", label: "Company" },
    { key: "DEPARTMENT_NAME", label: "Department" },
    { key: "DESIGNATION_NAME", label: "Designation" },
    { key: "REQUEST_AMOUNT", label: "Request Amt", render: (val: any) => numFmt(val) },
    { key: "NO_OF_MONTHS", label: "No of Months" },
    { key: "MONTHLY_DEDUCTION", label: "Monthly Deduction", render: (val: any) => numFmt(val) },
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
        COMPANY_NAME: toId("COMPANY_ID")(companies, u.COMPANY_ID)?.COMPANY_NAME || u.COMPANY_NAME || "",
        DEPARTMENT_NAME: toId("DEPARTMENT_ID")(departments, u.DEPARTMENT_ID)?.DEPARTMENT_NAME || u.DEPARTMENT_NAME || "",
        DESIGNATION_NAME: toId("DESIGNATION_ID")(designations, u.DESIGNATION_ID)?.DESIGNATION_NAME || u.DESIGNATION_NAME || "",
      };
    });
  }, [items, employees, companies, departments, designations]);

  useEffect(() => {
    dispatch(fetchCashAdvanceRequests(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearCashAdvanceRequestError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: CashAdvanceRequestGridData) => {
      const DATE_INPUT_KEYS = ["DEDUCTION_FROM_DATE", "DEDUCTION_TO_DATE"];
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
        "GROSS_PAY",
        "NET_PAY",
        "ELIGIBLE_AMOUNT",
        "REQUEST_AMOUNT",
        "APPROVED_AMOUNT",
        "NO_OF_MONTHS",
        "MONTHLY_DEDUCTION",
        "PAYMENT_MODE_ID",
        "BANK_ID",
        ...DATE_INPUT_KEYS,
      ];
      const month = user?.monthProcess || new Date().toLocaleString("en", { month: "long" });
      const payload: Record<string, any> = {
        ...item,
        MONTH_ENTERED: item.MONTH_ENTERED || user?.monthProcess || month,
        YEAR_ENTERED: item.YEAR_ENTERED || user?.yearProcess || new Date().getFullYear(),
        ADVANCE_TYPE: item.ADVANCE_TYPE || "Cash Advance",
        CASH_ADV_REQUEST_REF_NO: item.CASH_ADV_REQUEST_REF_NO || `AD/${new Date().toISOString().slice(0, 10).replace(/-/g, "")}/${Date.now()}`,
        USER: user?.loginName || "Admin",
        MAC_ADDRESS: "WEB",
      };
      NUM_KEYS.forEach((k) => {
        const v = payload[k];
        if (v === "" || v === undefined || v === null) delete payload[k];
      });
      const res = await dispatch(addCashAdvanceRequest(payload as CashAdvanceRequestGridData)).unwrap();
      dispatch(fetchCashAdvanceRequests(currentStatus));
      return res;
    },
    update: async (item: CashAdvanceRequestGridData) => {
      const res = await dispatch(updateCashAdvanceRequest(item)).unwrap();
      dispatch(fetchCashAdvanceRequests(currentStatus));
      return res;
    },
    remove: async (id: string) => {
      const row = (Array.isArray(enrichedData) ? enrichedData.find((r: any) => String(r.SNO) === String(id)) : undefined);
      const ref = row?.CASH_ADV_REQUEST_REF_NO || id;
      const res = await dispatch(deleteCashAdvanceRequest(ref)).unwrap();
      dispatch(fetchCashAdvanceRequests(currentStatus));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        const row = (Array.isArray(enrichedData) ? enrichedData.find((r: any) => String(r.SNO) === String(id)) : undefined);
        const ref = row?.CASH_ADV_REQUEST_REF_NO || id;
        res = await dispatch(deleteCashAdvanceRequest(ref)).unwrap();
      }
      dispatch(fetchCashAdvanceRequests(currentStatus));
      return res;
    },
    onFieldChange: handleFieldChange,
  }), [enrichedData, loading, dispatch, currentStatus, handleFieldChange]);

  return (
    <div className="space-y-4">
      <MasterCrudPage
      title="Cash Advance Request"
      description="Manage cash advance requests"
      idPrefix="AD"
      domain="cash-advance-request"
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
        const ref = item.CASH_ADV_REQUEST_REF_NO || item.CASH_ADVANCEMENT_REF_NO;
        if (!ref) return undefined;
        const res = await fetch(`${API_URL}/cash-advance-request/${encodeURIComponent(ref)}`);
        if (!res.ok) return undefined;
        const json = await res.json();
        return json.data;
      }}
    />
    </div>
  );
}