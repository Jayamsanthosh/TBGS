"use client";

import { useMemo, useEffect, useCallback, useState } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchMonthlyAutoDeductions,
  addMonthlyAutoDeduction,
  updateMonthlyAutoDeduction,
  deleteMonthlyAutoDeduction,
  clearMonthlyAutoDeductionError,
  MonthlyAutoDeductionGridData,
} from "@/lib/monthlyAutoDeductionSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { MONTHS, YEARS, SALARY_DEDUCTION_TYPE } from "@/lib/utils";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";
import { validatePositiveNumber } from "@/lib/validation";

const statusBadge = (val: any) => {
  const sv = String(val || "").toLowerCase();
  const isApproved = sv === "approved" || sv === "approve";
  const isRejected = sv === "rejected" || sv === "reject";
  const isPending = sv === "pending";
  const colorClass = isApproved
    ? "bg-green-500/10 text-green-600 border-green-200"
    : isRejected
      ? "bg-red-500/10 text-red-600 border-red-200"
      : isPending
        ? "bg-blue-500/10 text-blue-600 border-blue-200"
        : "bg-gray-500/10 text-gray-600 border-gray-200";
  return (
    <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
      {val ?? "-"}
    </Badge>
  );
};

export default function MonthlyAutoDeductionPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.monthlyAutoDeduction);
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "");
  }, []);

  const handleDateRangeChange = useCallback((from: string, to: string) => {
    setFromDate(from || "");
    setToDate(to || "");
  }, []);

  const { data: companies } = useApiQuery("mad-companies", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: departments } = useApiQuery("mad-departments", async () => {
    const res = await fetch(`${API_URL}/department-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: designations } = useApiQuery("mad-designations", async () => {
    const res = await fetch(`${API_URL}/designation-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: departmentGroups } = useApiQuery("mad-department-groups", async () => {
    const res = await fetch(`${API_URL}/department-group-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: designationGroups } = useApiQuery("mad-designation-groups", async () => {
    const res = await fetch(`${API_URL}/designation-group-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: camps } = useApiQuery("mad-camps", async () => {
    const res = await fetch(`${API_URL}/camp-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: stores } = useApiQuery("mad-stores", async () => {
    const res = await fetch(`${API_URL}/store-master`);
    const json = await res.json();
    return (json.data || []).map((s: any) => ({
      ...s,
      STORE_ID: s.Store_Id ?? s.STORE_ID,
      STORE_NAME: s.Store_Name ?? s.STORE_NAME,
      CAMP_ID: s.Camp_Id ?? s.CAMP_ID,
    }));
  });
  const { data: employmentTypes } = useApiQuery("mad-employment-types", async () => {
    const res = await fetch(`${API_URL}/employment-type-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: currencies } = useApiQuery("mad-currencies", async () => {
    const res = await fetch(`${API_URL}/currency-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: deductionTypes } = useApiQuery("mad-deduction-types", async () => {
    const res = await fetch(`${API_URL}/payroll-deduction-type-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: employees } = useApiQuery("mad-employees", async () => {
    const res = await fetch(`${API_URL}/employee-database?status=AC`);
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
  const deductionTypeOptions = useMemo(() => toOptions(deductionTypes, "DEDUCTION_TYPE_ID", "DEDUCTION_TYPE_NAME"), [deductionTypes, toOptions]);

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
    { key: "MONTH_ENTERED", label: "Process Month", type: "select", options: MONTHS, defaultValue: user?.monthProcess || "", disabled: true },
    { key: "YEAR_ENTERED", label: "Process Year", type: "select", options: YEARS, defaultValue: user?.yearProcess || "", disabled: true },
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
      options: SALARY_DEDUCTION_TYPE.map((s) => ({ value: s, label: s })),
      placeholder: "Select salary deduction type",
    },
    {
      key: "DEDUCTION_TYPE_ID",
      label: "Deduction Type",
      type: "select",
      options: deductionTypeOptions,
      placeholder: "Select deduction type",
    },
    {
      key: "REQUEST_TYPE",
      label: "Request Type",
      type: "select",
      required: true,
      options: [
        { value: "Cash Advance", label: "Cash Advance" },
        { value: "Warning Form", label: "Warning Form" },
      ],
      placeholder: "Select request type",
    },
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
    { key: "GROSS_PAY", label: "Gross Pay", type: "number", disabled: true, placeholder: "0.00" },
    { key: "NET_PAY", label: "Net Pay", type: "number", disabled: true, placeholder: "0.00" },
    { key: "TOTAL_DEDUCTION_AMOUNT", label: "Total Deduction Amount", type: "number", placeholder: "0.00", validate: (value: any) => (value != null && value !== "" && !validatePositiveNumber(value) ? "Total Deduction Amount must be greater than 0" : undefined) },
    { key: "DEDUCTION_FROM_DATE", label: "Deduction From Date", type: "date", placeholder: "Select date" },
    { key: "DEDUCTION_TO_DATE", label: "Deduction To Date", type: "date", placeholder: "Select date" },
    { key: "NO_OF_MONTHS", label: "No Of Months", type: "number", disabled: true, placeholder: "0" },
    { key: "MONTHLY_DEDUCTION", label: "Monthly Deduction", type: "number", disabled: true, placeholder: "0.00" },
    { key: "REASON", label: "Reason", type: "textarea", placeholder: "Enter reason", maxLength: 3000 },
    { key: "APPROVED_BY", label: "Approved By", type: "text", placeholder: "Enter approver", maxLength: 50 },
    { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter remarks", maxLength: 1000 },
    {
      key: "STATUS_ENTRY",
      label: "Status",
      type: "select",
      options: [
        { value: "Pending", label: "Pending" },
        { value: "Approved", label: "Approved" },
        { value: "Rejected", label: "Rejected" },
      ],
      defaultValue: "Pending",
    },
  ];

  const columns = useMemo(() => [
    { key: "M_AUTO_REF_NO", label: "Ref No" },
    { key: "REQUEST_REF_NO", label: "Request Ref No" },
    {
      key: "MONTH_YEAR",
      label: "Month / Year",
      render: (_val: any, item: any) => `${item.MONTH_ENTERED || ""} ${item.YEAR_ENTERED || ""}`.trim() || "-",
    },
    {
      key: "EMP_NAME",
      label: "Employee",
      render: (_val: any, item: any) => employeeFullName(item.EMP_ID) || "-",
    },
    {
      key: "REQUEST_TYPE",
      label: "Request Type",
      render: (val: any) => val || "-",
    },
    {
      key: "MONTHLY_DEDUCTION",
      label: "Monthly Deduction",
      render: (val: any) => (val != null && val !== "" ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"),
    },
    {
      key: "STATUS_ENTRY",
      label: "Status",
      render: (val: any) => statusBadge(val),
    },
  ], [employeeFullName]);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.map((u: any) => ({
      ...u,
      id: u.M_AUTO_REF_NO,
      M_AUTO_REF_NO: u.M_AUTO_REF_NO,
      COMPANY_ID: u.COMPANY_ID != null ? String(u.COMPANY_ID) : "",
      DEPARTMENT_ID: u.DEPARTMENT_ID != null ? String(u.DEPARTMENT_ID) : "",
      DESIGNATION_ID: u.DESIGNATION_ID != null ? String(u.DESIGNATION_ID) : "",
      DEPARTMENT_GROUP_ID: u.DEPARTMENT_GROUP_ID != null ? String(u.DEPARTMENT_GROUP_ID) : "",
      DESIGNATION_GROUP_ID: u.DESIGNATION_GROUP_ID != null ? String(u.DESIGNATION_GROUP_ID) : "",
      CAMP_ID: u.CAMP_ID != null ? String(u.CAMP_ID) : "",
      STORE_ID: u.STORE_ID != null ? String(u.STORE_ID) : "",
      EMPLOYMENT_TYPE_ID: u.EMPLOYMENT_TYPE_ID != null ? String(u.EMPLOYMENT_TYPE_ID) : "",
      CURRENCY_ID: u.CURRENCY_ID != null ? String(u.CURRENCY_ID) : "",
      DEDUCTION_TYPE_ID: u.DEDUCTION_TYPE_ID != null ? String(u.DEDUCTION_TYPE_ID) : "",
      EMP_ID: u.EMP_ID != null ? String(u.EMP_ID) : "",
      STATUS_ENTRY: u.STATUS_ENTRY ?? "Pending",
    }));
  }, [items]);

  const cleanPayload = (item: MonthlyAutoDeductionGridData): MonthlyAutoDeductionGridData => {
    const copy = { ...item };
    [
      "YEAR_ENTERED",
      "EMP_ID",
      "DEDUCTION_TYPE_ID",
      "COMPANY_ID",
      "DEPARTMENT_ID",
      "DESIGNATION_ID",
      "DEPARTMENT_GROUP_ID",
      "DESIGNATION_GROUP_ID",
      "CAMP_ID",
      "STORE_ID",
      "EMPLOYMENT_TYPE_ID",
      "CURRENCY_ID",
      "NO_OF_MONTHS",
      "GROSS_PAY",
      "NET_PAY",
      "TOTAL_DEDUCTION_AMOUNT",
      "MONTHLY_DEDUCTION",
    ].forEach((k) => {
      const val = (copy as any)[k];
      if (val === "" || val === undefined || val === null) {
        (copy as any)[k] = undefined;
      }
    });
    return copy;
  };

  const handleFieldChange = useCallback((key: string, value: any, setForm: any, form: Record<string, any>): boolean => {
    if (key === "EMP_ID") {
      const emp = (Array.isArray(employees) ? employees : []).find((e: any) => String(e.EMP_ID) === String(value));
      if (emp && emp.SNO) {
        fetch(`${API_URL}/employee-database/${emp.SNO}`)
          .then((res) => res.json())
          .then((json: any) => {
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
                DESIGNATION_GROUP_ID: (fullEmp.DESIGNATION_GROUP_ID ?? fullEmp.Designation_Group_Id ?? "") ? String(fullEmp.DESIGNATION_GROUP_ID ?? fullEmp.Designation_Group_Id) : "",
                EMPLOYMENT_TYPE_ID: fullEmp.EMPLOYMENT_TYPE_ID ? String(fullEmp.EMPLOYMENT_TYPE_ID) : "",
                CURRENCY_ID: fullEmp.CURRENCY_ID ? String(fullEmp.CURRENCY_ID) : "",
                GROSS_PAY: fullEmp.GROSS_PAY ?? "",
                NET_PAY: fullEmp.NET_PAY ?? "",
              }));
            }
          });
      } else {
        setForm({ ...form, EMP_ID: value });
      }
      return true;
    }
    
    if (key === "DEDUCTION_FROM_DATE" || key === "DEDUCTION_TO_DATE") {
      const fromDate = key === "DEDUCTION_FROM_DATE" ? value : form.DEDUCTION_FROM_DATE;
      const toDate = key === "DEDUCTION_TO_DATE" ? value : form.DEDUCTION_TO_DATE;
      
      let noOfMonths = "";
      if (fromDate && toDate) {
         const from = new Date(fromDate);
         const to = new Date(toDate);
         if (!isNaN(from.getTime()) && !isNaN(to.getTime()) && to >= from) {
            noOfMonths = String((to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1);
         }
      }
      
      const totalAmount = parseFloat(form.TOTAL_DEDUCTION_AMOUNT);
      let monthlyDeduction = "";
      if (noOfMonths && !isNaN(totalAmount) && totalAmount > 0) {
         monthlyDeduction = (totalAmount / parseInt(noOfMonths, 10)).toFixed(2);
      }
      
      setForm((prev: any) => ({
         ...prev,
         [key]: value,
         NO_OF_MONTHS: noOfMonths,
         MONTHLY_DEDUCTION: monthlyDeduction,
      }));
      return true;
    }
    
    if (key === "TOTAL_DEDUCTION_AMOUNT") {
       const totalAmount = parseFloat(value);
       const noOfMonths = parseInt(form.NO_OF_MONTHS, 10);
       let monthlyDeduction = "";
       if (!isNaN(totalAmount) && !isNaN(noOfMonths) && noOfMonths > 0) {
          monthlyDeduction = (totalAmount / noOfMonths).toFixed(2);
       }
       setForm((prev: any) => ({
         ...prev,
         [key]: value,
         MONTHLY_DEDUCTION: monthlyDeduction,
       }));
       return true;
    }
    
    return false;
  }, [employees]);

  useEffect(() => {
    dispatch(fetchMonthlyAutoDeductions({ status: currentStatus, fromDate, toDate }));
  }, [dispatch, currentStatus, fromDate, toDate]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearMonthlyAutoDeductionError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: MonthlyAutoDeductionGridData) => {
      const payload: Record<string, any> = {
        ...item,
        MONTH_ENTERED: item.MONTH_ENTERED || user?.monthProcess || new Date().toLocaleString("en", { month: "long" }),
        YEAR_ENTERED: item.YEAR_ENTERED || user?.yearProcess || new Date().getFullYear(),
        USER: user?.loginName || "Admin",
        MAC_ADDRESS: "WEB",
      };
      const res = await dispatch(addMonthlyAutoDeduction(cleanPayload(payload as MonthlyAutoDeductionGridData))).unwrap();
      dispatch(fetchMonthlyAutoDeductions({ status: currentStatus, fromDate, toDate }));
      return res;
    },
    update: async (item: MonthlyAutoDeductionGridData) => {
      const res = await dispatch(updateMonthlyAutoDeduction(cleanPayload(item))).unwrap();
      dispatch(fetchMonthlyAutoDeductions({ status: currentStatus, fromDate, toDate }));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteMonthlyAutoDeduction(id)).unwrap();
      dispatch(fetchMonthlyAutoDeductions({ status: currentStatus, fromDate, toDate }));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteMonthlyAutoDeduction(id)).unwrap();
      }
      dispatch(fetchMonthlyAutoDeductions({ status: currentStatus, fromDate, toDate }));
      return res;
    },
    onFieldChange: handleFieldChange,
  }), [enrichedData, loading, dispatch, currentStatus, fromDate, toDate, handleFieldChange, user?.monthProcess, user?.yearProcess, user?.loginName]);

  return (
    <MasterCrudPage
      title="Monthly Auto Deduction"
      description="Manage monthly auto deduction entries"
      idPrefix="MAD"
      domain="monthly-auto-deduction"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[
        { label: "All Status", value: "" },
        { label: "Pending", value: "Pending" },
        { label: "Approved", value: "Approved" },
        { label: "Rejected", value: "Rejected" },
      ]}
      onStatusFilterChange={handleStatusFilterChange}
      enableViewDetails
      hideLockedModifyActions
      enableDateRangeFilter
      onDateRangeFilterChange={handleDateRangeChange}
      onBeforeEdit={async (item) => {
        const id = Number(item.M_AUTO_REF_NO ?? item.id);
        if (!id) return undefined;
        const res = await fetch(`${API_URL}/monthly-auto-deduction/${id}`);
        if (!res.ok) return undefined;
        const json = await res.json();
        return json.data;
      }}
    />
  );
}