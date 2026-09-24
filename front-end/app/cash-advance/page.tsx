"use client";

import { useMemo, useEffect, useCallback, useState } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchCashAdvances,
  addCashAdvance,
  updateCashAdvance,
  deleteCashAdvance,
  clearCashAdvanceError,
  CashAdvanceGridData,
} from "@/lib/cashAdvanceSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { MONTHS, YEARS, SALARY_DEDUCTION_TYPE } from "@/lib/utils";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";
import { validatePositiveNumber, validateMaxAmount } from "@/lib/validation";

const statusBadge = (val: any) => {
  const sv = String(val || "").toLowerCase();
  const isActive = sv === "active" || sv === "ac";
  const isInactive = sv === "inactive" || sv === "in";
  const colorClass = isActive
    ? "bg-green-500/10 text-green-600 border-green-200"
    : isInactive
      ? "bg-red-500/10 text-red-600 border-red-200"
      : "bg-blue-500/10 text-blue-600 border-blue-200";
  return (
    <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
      {isActive ? "Active" : isInactive ? "Inactive" : val}
    </Badge>
  );
};

export default function CashAdvancePage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.cashAdvance);
  const { toast } = useToast();
  const { user } = useAppSelector((state) => state.auth);
  const [currentStatus, setCurrentStatus] = useState<string>("");

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "");
  }, []);

  const { data: companies } = useApiQuery("ca-companies", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: departments } = useApiQuery("ca-departments", async () => {
    const res = await fetch(`${API_URL}/department-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: designations } = useApiQuery("ca-designations", async () => {
    const res = await fetch(`${API_URL}/designation-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: departmentGroups } = useApiQuery("ca-department-groups", async () => {
    const res = await fetch(`${API_URL}/department-group-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: designationGroups } = useApiQuery("ca-designation-groups", async () => {
    const res = await fetch(`${API_URL}/designation-group-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: camps } = useApiQuery("ca-camps", async () => {
    const res = await fetch(`${API_URL}/camp-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: stores } = useApiQuery("ca-stores", async () => {
    const res = await fetch(`${API_URL}/store-master`);
    const json = await res.json();
    return (json.data || []).map((s: any) => ({
      ...s,
      STORE_ID: s.Store_Id ?? s.STORE_ID,
      STORE_NAME: s.Store_Name ?? s.STORE_NAME,
      CAMP_ID: s.Camp_Id ?? s.CAMP_ID,
    }));
  });
  const { data: employmentTypes } = useApiQuery("ca-employment-types", async () => {
    const res = await fetch(`${API_URL}/employment-type-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: currencies } = useApiQuery("ca-currencies", async () => {
    const res = await fetch(`${API_URL}/currency-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: employees } = useApiQuery("ca-employees", async () => {
    const res = await fetch(`${API_URL}/employee-database?status=AC`);
    const json = await res.json();
    return json.data || [];
  });

  const { data: requests } = useApiQuery("ca-requests-pending", async () => {
    const url = new URL(`${API_URL}/cash-advance-request`);
    url.searchParams.set("pendingOnly", "true");
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Failed to fetch cash advance requests");
    const json = await res.json();
    return json.data || [];
  });

  const toOptions = useCallback(
    (rows: any[], idKey: string, nameKey: string) =>
      Array.isArray(rows)
        ? rows
            .filter((x) => x && (x[idKey] ?? x[idKey.replace("_ID", "_Id")] ?? x.id) != null)
            .map((x) => ({
              value: String(x[idKey] ?? x[idKey.replace("_ID", "_Id")] ?? x.id),
              label: x[nameKey] ?? `ID: ${x[idKey] ?? x.id}`,
            }))
        : [],
    []
  );

  const companyOptions = useMemo(() => toOptions(companies, "COMPANY_ID", "COMPANY_NAME"), [companies, toOptions]);
  const departmentOptions = useMemo(() => toOptions(departments, "DEPARTMENT_ID", "DEPARTMENT_NAME"), [departments, toOptions]);
  const designationOptions = useMemo(() => toOptions(designations, "DESIGNATION_ID", "DESIGNATION_NAME"), [designations, toOptions]);
  const departmentGroupOptions = useMemo(() => toOptions(departmentGroups, "DEPARTMENT_GROUP_ID", "DEPARTMENT_GROUP_NAME"), [departmentGroups, toOptions]);
  const designationGroupOptions = useMemo(() => toOptions(designationGroups, "DESIGNATION_GROUP_ID", "DESIGNATION_GROUP_NAME"), [designationGroups, toOptions]);
  const campOptions = useMemo(() => toOptions(camps, "CAMP_ID", "CAMP_NAME"), [camps, toOptions]);
  const storeOptions = useMemo(() => toOptions(stores, "STORE_ID", "STORE_NAME"), [stores, toOptions]);
  const employmentTypeOptions = useMemo(() => toOptions(employmentTypes, "EMPLOYMENT_TYPE_ID", "EMPLOYMENT_TYPE_NAME"), [employmentTypes, toOptions]);
  const currencyOptions = useMemo(() => toOptions(currencies, "CURRENCY_ID", "CURRENCY_NAME"), [currencies, toOptions]);

  const employeeFullName = useCallback(
    (empId: any) => {
      if (empId === undefined || empId === null || empId === "") return "";
      const emp = (Array.isArray(employees) ? employees : []).find(
        (e: any) => String(e.EMP_ID) === String(empId)
      );
      if (!emp) return `#${empId}`;
      return [emp.FIRST_NAME, emp.MIDDLE_NAME, emp.LAST_NAME].filter(Boolean).join(" ");
    },
    [employees]
  );

  const fields: MasterField[] = [
    { key: "MONTH_ENTERED", label: "Month", type: "select", options: MONTHS, disabled: true, defaultValue: user?.monthProcess || "", placeholder: "Select month" },
    { key: "YEAR_ENTERED", label: "Year", type: "select", options: YEARS, disabled: true, defaultValue: user?.yearProcess || "", placeholder: "Select year" },
    {
      key: "EMP_ID",
      label: "Search Employee",
      type: "select",
      required: true,
      renderField: ({ form, setForm }) => (
        <EmployeeCombobox
          value={form.EMP_ID}
          options={Array.isArray(employees) ? employees : []}
          onChange={(val) => handleFieldChange("EMP_ID", val, setForm, form)}
        />
      ),
    },
    {
      key: "SALARY_DEDUCTION_TYPE",
      label: "Salary Deduction Type",
      type: "select",
      required: true,
      dependsOn: "EMP_ID",
      options: SALARY_DEDUCTION_TYPE.map((s) => ({ value: s, label: s })),
      placeholder: "Select salary deduction type",
    },
    {
      key: "CASH_ADV_REQUEST_REF_NO",
      label: "Cash Advance Ref No",
      type: "select",
      required: true,
      dependsOn: "SALARY_DEDUCTION_TYPE",
      placeholder: "Select request ref no",
      options: (form: Record<string, any>) =>
        (Array.isArray(requests) ? requests : [])
          .filter(
            (r: any) =>
              String(r.EMP_ID) === String(form.EMP_ID) &&
              String(r.SALARY_DEDUCTION_TYPE ?? "").toUpperCase() ===
                String(form.SALARY_DEDUCTION_TYPE ?? "").toUpperCase() &&
              r.CASH_ADV_REQUEST_REF_NO &&
              String(r.STATUS_MASTER ?? "").toUpperCase() === "CL"
          )
          .map((r: any) => ({ value: String(r.CASH_ADV_REQUEST_REF_NO), label: String(r.CASH_ADV_REQUEST_REF_NO) })),
    },
    { key: "ADVANCE_TYPE", label: "Advance Type", type: "text", disabled: true, defaultValue: "Cash Advance", maxLength: 50 },
      { key: "FIRST_NAME", label: "First Name", type: "text", disabled: true, maxLength: 50 },
      { key: "MIDDLE_NAME", label: "Middle Name", type: "text", disabled: true, maxLength: 50 },
      { key: "LAST_NAME", label: "Last Name", type: "text", disabled: true, maxLength: 50 },
      { key: "COMPANY_ID", label: "Company", type: "select", options: companyOptions, disabled: true, placeholder: "Select company" },
      { key: "CAMP_ID", label: "Camp", type: "select", options: campOptions, disabled: true, placeholder: "Select camp" },
      { key: "STORE_ID", label: "Store", type: "select", options: storeOptions, disabled: true, placeholder: "Select store" },
      { key: "DEPARTMENT_ID", label: "Department", type: "select", options: departmentOptions, disabled: true, placeholder: "Select department" },
      { key: "DESIGNATION_ID", label: "Designation", type: "select", options: designationOptions, disabled: true, placeholder: "Select designation" },
      { key: "DEPARTMENT_GROUP_ID", label: "Department Group", type: "select", options: departmentGroupOptions, disabled: true, placeholder: "Select department group" },
      { key: "DESIGNATION_GROUP_ID", label: "Designation Group", type: "select", options: designationGroupOptions, disabled: true, placeholder: "Select designation group" },
      { key: "EMPLOYMENT_TYPE_ID", label: "Employment Type", type: "select", options: employmentTypeOptions, disabled: true, placeholder: "Select employment type" },
      { key: "CURRENCY_ID", label: "Currency", type: "select", options: currencyOptions, disabled: true, placeholder: "Select currency" },
      {
        key: "ADVANCE_AMOUNT",
        label: "Advance Amount",
        type: "number",
        required: true,
        placeholder: "0.00",
        validate: (value: any, form?: Record<string, any>) => {
          if (value != null && value !== "" && !validatePositiveNumber(value)) {
            return "Advance Amount must be greater than 0";
          }
          if (value != null && value !== "" && form?.CASH_ADV_REQUEST_REF_NO) {
            const req = (Array.isArray(requests) ? requests : []).find(
              (r: any) => String(r.CASH_ADV_REQUEST_REF_NO) === String(form?.CASH_ADV_REQUEST_REF_NO)
            );
            const limit = req?.APPROVED_AMOUNT ?? req?.REQUEST_AMOUNT;
            if (limit != null && limit !== "" && !validateMaxAmount(value, limit)) {
              return `Advance Amount cannot exceed ${Number(limit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
          }
          return undefined;
        },
      },
      { key: "REQUEST_AMOUNT", label: "Requested Amount", type: "number", disabled: true, placeholder: "Auto from request" },
      { key: "REASON", label: "Reason", type: "textarea", placeholder: "Enter reason", maxLength: 3000 },
      { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter remarks", maxLength: 1000 },
      {
        key: "STATUS_MASTER",
        label: "Status",
        type: "select",
        options: [
          { value: "AC", label: "Active" },
          { value: "IN", label: "Inactive" },
        ],
        defaultValue: "AC",
      },
    ];

  const columns = useMemo(() => [
    { key: "SNO", label: "SNO" },
    { key: "CASH_ADV_REQUEST_REF_NO", label: "Ref No" },
    {
      key: "MONTH_YEAR",
      label: "Month / Year",
      render: (_val: any, item: any) => `${item.MONTH_ENTERED || ""} ${item.YEAR_ENTERED || ""}`.trim() || "-",
    },
    {
      key: "EMP_NAME",
      label: "Employee",
      render: (_val: any, item: any) => {
        const full = employeeFullName(item.EMP_ID);
        return full || "-";
      },
    },
    {
      key: "ADVANCE_TYPE",
      label: "Advance Type",
      render: (val: any) => val || "-",
    },
    {
      key: "ADVANCE_AMOUNT",
      label: "Amount",
      render: (val: any) => (val != null && val !== "" ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"),
    },
    {
      key: "STATUS_MASTER",
      label: "Status",
      render: (val: any) => statusBadge(val),
    },
    {
      key: "SUBMISSION_STATUS",
      label: "Submission",
      render: (_val: any, item: any) => {
        const req = (Array.isArray(requests) ? requests : []).find(
          (r: any) => String(r.CASH_ADV_REQUEST_REF_NO) === String(item.CASH_ADV_REQUEST_REF_NO)
        );
        const sv = String(req?.STATUS_MASTER || "").toUpperCase();
        const isSubmitted = sv === "CL";
        return (
          <Badge variant="outline" className={`px-2 py-0.5 text-[10px] uppercase font-bold ${
            isSubmitted
              ? "bg-blue-500/10 text-blue-600 border-blue-200"
              : "bg-yellow-500/10 text-yellow-600 border-yellow-200"
          }`}>
            {isSubmitted ? "Submitted" : "Pending"}
          </Badge>
        );
      },
    },
  ], [employeeFullName, requests]);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.map((u: any) => ({
      ...u,
      id: u.SNO,
      SNO: u.SNO,
      COMPANY_ID: u.COMPANY_ID != null ? String(u.COMPANY_ID) : "",
      DEPARTMENT_ID: u.DEPARTMENT_ID != null ? String(u.DEPARTMENT_ID) : "",
      DESIGNATION_ID: u.DESIGNATION_ID != null ? String(u.DESIGNATION_ID) : "",
      DEPARTMENT_GROUP_ID: u.DEPARTMENT_GROUP_ID != null ? String(u.DEPARTMENT_GROUP_ID) : "",
      DESIGNATION_GROUP_ID: u.DESIGNATION_GROUP_ID != null ? String(u.DESIGNATION_GROUP_ID) : "",
      CAMP_ID: u.CAMP_ID != null ? String(u.CAMP_ID) : "",
      STORE_ID: u.STORE_ID != null ? String(u.STORE_ID) : "",
      EMPLOYMENT_TYPE_ID: u.EMPLOYMENT_TYPE_ID != null ? String(u.EMPLOYMENT_TYPE_ID) : "",
      CURRENCY_ID: u.CURRENCY_ID != null ? String(u.CURRENCY_ID) : "",
      EMP_ID: u.EMP_ID != null ? String(u.EMP_ID) : "",
      STATUS_MASTER: u.STATUS_MASTER ?? "AC",
    }));
  }, [items]);

  const cleanPayload = (item: CashAdvanceGridData): CashAdvanceGridData => {
    const copy = { ...item };
    [
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
    ].forEach((k) => {
      const val = (copy as any)[k];
      if (val === "" || val === undefined || val === null) {
        (copy as any)[k] = undefined;
      }
    });
    const amount = (copy as any).ADVANCE_AMOUNT;
    if (amount === "" || amount === undefined || amount === null) {
      (copy as any).ADVANCE_AMOUNT = undefined;
    }
    return copy;
  };

  const handleFieldChange = useCallback((key: string, value: any, setForm: any, form: Record<string, any>): boolean => {
    if (key === "CASH_ADV_REQUEST_REF_NO") {
      const req = (Array.isArray(requests) ? requests : []).find(
        (r: any) => String(r.CASH_ADV_REQUEST_REF_NO) === String(value)
      );
      if (req) {
        const toStr = (v: any) => (v == null || v === "" ? "" : String(v));
        setForm({
          ...form,
          CASH_ADV_REQUEST_REF_NO: value,
          SALARY_DEDUCTION_TYPE: req.SALARY_DEDUCTION_TYPE ?? "",
          ADVANCE_TYPE: req.ADVANCE_TYPE ?? "Cash Advance",
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
          REQUEST_AMOUNT: req.REQUEST_AMOUNT ?? "",
          ADVANCE_AMOUNT: req.APPROVED_AMOUNT ? req.APPROVED_AMOUNT : (req.REQUEST_AMOUNT ?? ""),
        });
      } else {
        setForm({ ...form, CASH_ADV_REQUEST_REF_NO: value, REQUEST_AMOUNT: "", ADVANCE_AMOUNT: "" });
      }
      return true;
    }

    if (key === "EMP_ID") {
      const emp = (Array.isArray(employees) ? employees : []).find((e: any) => String(e.EMP_ID) === String(value));
      if (emp && emp.SNO) {
        fetch(`${API_URL}/employee-database/${emp.SNO}`)
          .then((res) => res.json())
          .then((json) => {
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
                CASH_ADV_REQUEST_REF_NO: "",
                MONTH_ENTERED: "",
                YEAR_ENTERED: "",
                SALARY_DEDUCTION_TYPE: "",
                REQUEST_AMOUNT: "",
                ADVANCE_AMOUNT: "",
              }));
            }
          });
      } else {
        setForm({ ...form, EMP_ID: value });
      }
      return true;
    }
    return false;
  }, [employees, requests]);

  useEffect(() => {
    dispatch(fetchCashAdvances(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearCashAdvanceError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: CashAdvanceGridData) => {
      const payload: Record<string, any> = {
        ...item,
        MONTH_ENTERED: item.MONTH_ENTERED || user?.monthProcess || new Date().toLocaleString("en", { month: "long" }),
        YEAR_ENTERED: item.YEAR_ENTERED || user?.yearProcess || new Date().getFullYear(),
      };
      const res = await dispatch(addCashAdvance(cleanPayload(payload as CashAdvanceGridData))).unwrap();
      dispatch(fetchCashAdvances(currentStatus));
      return res;
    },
    update: async (item: CashAdvanceGridData) => {
      const res = await dispatch(updateCashAdvance(cleanPayload(item))).unwrap();
      dispatch(fetchCashAdvances(currentStatus));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteCashAdvance(id)).unwrap();
      dispatch(fetchCashAdvances(currentStatus));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteCashAdvance(id)).unwrap();
      }
      dispatch(fetchCashAdvances(currentStatus));
      return res;
    },
    onFieldChange: handleFieldChange,
  }), [enrichedData, loading, dispatch, currentStatus, handleFieldChange, user?.monthProcess, user?.yearProcess]);

  return (
    <MasterCrudPage
      title="Cash Advance Response"
      description="Manage cash advance responses"
      idPrefix="CA"
      domain="cash-advance"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[
        { label: "Active", value: "AC" },
        { label: "Inactive", value: "IN" },
      ]}
      onStatusFilterChange={handleStatusFilterChange}
      enableViewDetails
      onBeforeEdit={async (item) => {
        const id = Number(item.SNO ?? item.id);
        if (!id) return undefined;
        const res = await fetch(`${API_URL}/cash-advance/${id}`);
        if (!res.ok) return undefined;
        const json = await res.json();
        return json.data;
      }}
    />
  );
}