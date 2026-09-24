"use client";

import { useMemo, useEffect, useCallback, useState } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchAttendanceDetails,
  addAttendanceDetail,
  updateAttendanceDetail,
  deleteAttendanceDetail,
  submitAttendanceDetail,
  clearAttendanceDetailsError,
  AttendanceDetailsGridData,
} from "@/lib/attendanceDetailsSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { MONTHS, YEARS } from "@/lib/utils";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";

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

const responseStatusBadge = (val: unknown) => {
  const sv = String(val || "").trim().toLowerCase();
  const isPending = sv === "" || sv === "pending";
  const isApproved = sv === "approved" || sv === "approval";
  const isRejected = sv === "rejected" || sv === "reject";
  const isHold = sv === "hold";
  const colorClass = isPending
    ? "bg-warning/10 text-warning border-warning/40"
    : isApproved
      ? "bg-green-500/10 text-green-600 border-green-200"
      : isRejected
        ? "bg-red-500/10 text-red-600 border-red-200"
        : isHold
          ? "bg-info/10 text-info border-info/200"
          : "bg-gray-500/10 text-gray-600 border-gray-200";
  const label = isPending
    ? "Pending"
    : isApproved
      ? "Approved"
      : isRejected
        ? "Rejected"
        : sv
          ? sv.toUpperCase()
          : "Pending";
  return (
    <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
      {label}
    </Badge>
  );
};

const toOptions = (rows: any[], idKey: string, nameKey: string) =>
  Array.isArray(rows)
    ? rows
        .filter((x) => x && (x[idKey] ?? x[idKey.replace("_ID", "_Id")] ?? x.id) != null)
        .map((x) => ({
          value: String(x[idKey] ?? x[idKey.replace("_ID", "_Id")] ?? x.id),
          label: x[nameKey] ?? `ID: ${x[idKey] ?? x.id}`,
        }))
    : [];

export default function AttendanceDetailsPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.attendanceDetails);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [submittingId, setSubmittingId] = useState<string | number | null>(null);
  const [finalStatusMap, setFinalStatusMap] = useState<Record<string, string>>({});

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "");
  }, []);

  const handleDateRangeChange = useCallback((from: string, to: string) => {
    setFromDate(from || "");
    setToDate(to || "");
  }, []);

  const handleSubmit = useCallback(async (item: any) => {
    const sno = item?.SNO ?? item?.id;
    if (!sno) { toast({ variant: "destructive", title: "Error", description: "Missing attendance detail reference" }); return; }
    setSubmittingId(sno);
    try {
      const res = await dispatch(submitAttendanceDetail({ ...item, SNO: sno } as AttendanceDetailsGridData)).unwrap();
      toast({ title: res?.message ?? "Attendance detail submitted successfully!" });
      dispatch(fetchAttendanceDetails({ status: currentStatus || "ALL", fromDate, toDate }));
    } catch (e: any) {
      const msg = typeof e === "string" ? e : (e?.message || "Failed to submit attendance detail");
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setSubmittingId(null);
    }
  }, [dispatch, currentStatus, fromDate, toDate, toast]);

  const { data: companies } = useApiQuery("ad-companies", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: departments } = useApiQuery("ad-departments", async () => {
    const res = await fetch(`${API_URL}/department-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: designations } = useApiQuery("ad-designations", async () => {
    const res = await fetch(`${API_URL}/designation-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: departmentGroups } = useApiQuery("ad-department-groups", async () => {
    const res = await fetch(`${API_URL}/department-group-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: designationGroups } = useApiQuery("ad-designation-groups", async () => {
    const res = await fetch(`${API_URL}/designation-group-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: camps } = useApiQuery("ad-camps", async () => {
    const res = await fetch(`${API_URL}/camp-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: stores } = useApiQuery("ad-stores", async () => {
    const res = await fetch(`${API_URL}/store-master`);
    const json = await res.json();
    return (json.data || []).map((s: any) => ({
      ...s,
      STORE_ID: s.Store_Id ?? s.STORE_ID,
      STORE_NAME: s.Store_Name ?? s.STORE_NAME,
      CAMP_ID: s.Camp_Id ?? s.CAMP_ID,
    }));
  });
  const { data: employmentTypes } = useApiQuery("ad-employment-types", async () => {
    const res = await fetch(`${API_URL}/employment-type-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: attendanceTypes } = useApiQuery("ad-attendance-types", async () => {
    const res = await fetch(`${API_URL}/attendance-type-master`);
    const json = await res.json();
    return json.data || [];
  });
  const { data: employees } = useApiQuery("ad-employees", async () => {
    const res = await fetch(`${API_URL}/employee-database?status=AC`);
    const json = await res.json();
    return json.data || [];
  });

  const { data: attendanceRequests } = useApiQuery("ad-att-requests-pending", async () => {
    const url = new URL(`${API_URL}/attendance-request`);
    url.searchParams.set("pendingOnly", "true");
    const res = await fetch(url.toString());
    const json = await res.json();
    return json.data || [];
  });

  const { data: deptDesigMappings } = useApiQuery("ad-dept-desig-map", async () => {
    const res = await fetch(`${API_URL}/company-department-designation-mapping?status=AC`);
    const json = await res.json();
    return json.data || [];
  });

  const { data: campStoreMappings } = useApiQuery("ad-camp-store-map", async () => {
    const res = await fetch(`${API_URL}/company-camp-store-mapping?status=AC`);
    const json = await res.json();
    return json.data || [];
  });

  const companyOptions = useMemo(() => toOptions(companies, "COMPANY_ID", "COMPANY_NAME"), [companies]);
  const departmentOptions = useMemo(() => toOptions(departments, "DEPARTMENT_ID", "DEPARTMENT_NAME"), [departments]);
  const designationOptions = useMemo(() => toOptions(designations, "DESIGNATION_ID", "DESIGNATION_NAME"), [designations]);
  const departmentGroupOptions = useMemo(() => toOptions(departmentGroups, "DEPARTMENT_GROUP_ID", "DEPARTMENT_GROUP_NAME"), [departmentGroups]);
  const designationGroupOptions = useMemo(() => toOptions(designationGroups, "DESIGNATION_GROUP_ID", "DESIGNATION_GROUP_NAME"), [designationGroups]);
  const campOptions = useMemo(() => toOptions(camps, "CAMP_ID", "CAMP_NAME"), [camps]);
  const storeOptions = useMemo(() => toOptions(stores, "STORE_ID", "STORE_NAME"), [stores]);
  const employmentTypeOptions = useMemo(() => toOptions(employmentTypes, "EMPLOYMENT_TYPE_ID", "EMPLOYMENT_TYPE_NAME"), [employmentTypes]);
  const attendanceTypeOptions = useMemo(() => toOptions(attendanceTypes, "ATTENDANCE_TYPE_ID", "ATTENDANCE_TYPE_NAME"), [attendanceTypes]);

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
    { key: "MONTH_ENTERED", label: "Month", type: "select", options: MONTHS, placeholder: "Select month", disabled: true },
    { key: "YEAR_ENTERED", label: "Year", type: "select", options: YEARS, placeholder: "Select year", disabled: true },
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
    { key: "ATT_REQUEST_REF_NO", label: "Attendance Request Ref No", type: "select", required: true, dependsOn: "EMP_ID", options: [], placeholder: "Select request ref no" },
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
    { key: "ATTENDANCE_TYPE_ID", label: "Attendance Type", type: "select", options: attendanceTypeOptions, disabled: true, placeholder: "Select attendance type" },
    { key: "ELIGIBLE_DAYS", label: "Eligible Days", type: "number", disabled: true, placeholder: "0" },
    { key: "DATE_FROM", label: "Date From", type: "date", disabled: true, placeholder: "Select date" },
    { key: "DATE_TO", label: "Date To", type: "date", disabled: true, placeholder: "Select date" },
    { key: "NO_OF_DAYS", label: "No of Days", type: "number", disabled: true, placeholder: "0" },
    { key: "REASON", label: "Reason", type: "textarea", disabled: true, placeholder: "Enter reason" },
  ];

  const fields: MasterField[] = useMemo(
    () =>
      baseFields.map((f) => {
        switch (f.key) {
          case "ATT_REQUEST_REF_NO": return {
            ...f,
            options: (form: Record<string, any>) =>
              (Array.isArray(attendanceRequests) ? attendanceRequests : [])
                .filter((r: any) => String(r.EMP_ID) === String(form.EMP_ID) && r.ATT_REQUEST_REF_NO)
                .map((r: any) => ({ value: String(r.ATT_REQUEST_REF_NO), label: String(r.ATT_REQUEST_REF_NO) })),
          };
          case "COMPANY_ID": return { ...f, options: companyOptions };
          case "DEPARTMENT_ID": return { ...f, dependsOn: "COMPANY_ID", options: filteredOptions("DEPARTMENT_ID", departments, "DEPARTMENT_NAME", (form) => cascadeMaps.companyDept.get(String(form.COMPANY_ID ?? ""))) };
          case "DESIGNATION_ID": return { ...f, dependsOn: "DEPARTMENT_ID", options: filteredOptions("DESIGNATION_ID", designations, "DESIGNATION_NAME", (form) => cascadeMaps.companyDeptDesig.get(`${String(form.COMPANY_ID ?? "")}#${String(form.DEPARTMENT_ID ?? "")}`)) };
          case "DEPARTMENT_GROUP_ID": return { ...f, options: departmentGroupOptions };
          case "DESIGNATION_GROUP_ID": return { ...f, options: designationGroupOptions };
          case "CAMP_ID": return { ...f, dependsOn: "COMPANY_ID", options: filteredOptions("CAMP_ID", camps, "CAMP_NAME", (form) => cascadeMaps.companyCamp.get(String(form.COMPANY_ID ?? ""))) };
          case "STORE_ID": return { ...f, dependsOn: "CAMP_ID", options: filteredOptions("STORE_ID", stores, "STORE_NAME", (form) => cascadeMaps.companyCampStore.get(`${String(form.COMPANY_ID ?? "")}#${String(form.CAMP_ID ?? "")}`)) };
          case "EMPLOYMENT_TYPE_ID": return { ...f, options: employmentTypeOptions };
          case "ATTENDANCE_TYPE_ID": return { ...f, options: attendanceTypeOptions };
          default: return f;
        }
      }),
    [
      companyOptions,
      departmentOptions,
      designationOptions,
      departmentGroupOptions,
      designationGroupOptions,
      campOptions,
      storeOptions,
      employmentTypeOptions,
      attendanceTypeOptions,
      cascadeMaps,
      departments,
      designations,
      camps,
      stores,
      attendanceRequests,
    ]
  );

  const columns = useMemo(() => [
    { key: "SNO", label: "SNO" },
    { key: "ATT_REQUEST_REF_NO", label: "Request Ref No" },
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
      key: "ATTENDANCE_TYPE_NAME",
      label: "Attendance Type",
      render: (_val: any, item: any) => {
        const found = attendanceTypeOptions.find((o) => String(o.value) === String(item.ATTENDANCE_TYPE_ID));
        return found ? found.label : item.ATTENDANCE_TYPE_ID != null ? `ID: ${item.ATTENDANCE_TYPE_ID}` : "-";
      },
    },
    { key: "DATE_FROM", label: "From" },
    { key: "DATE_TO", label: "To" },
    { key: "NO_OF_DAYS", label: "Days" },
    {
      key: "SECTION_HEAD_RESPONSE_STATUS",
      label: "Section Head",
      render: (val: unknown, item: any) => responseStatusBadge(String(val ?? item.SECTION_HEAD_RESPONSE_STATUS ?? "")),
    },
    {
      key: "FINAL_RESPONSE_STATUS",
      label: "Final",
      render: (val: any) => responseStatusBadge(val),
    },
    {
      key: "STATUS_MASTER",
      label: "Status",
      render: (val: any) => statusBadge(val),
    },
  ], [attendanceTypeOptions, employeeFullName]);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.map((u: any) => ({
      ...u,
      id: u.SNO,
      SNO: u.SNO,
      FINAL_RESPONSE_STATUS: u.FINAL_RESPONSE_STATUS ?? finalStatusMap[String(u.SNO)] ?? "",
      COMPANY_ID: u.COMPANY_ID != null ? String(u.COMPANY_ID) : "",
      DEPARTMENT_ID: u.DEPARTMENT_ID != null ? String(u.DEPARTMENT_ID) : "",
      DESIGNATION_ID: u.DESIGNATION_ID != null ? String(u.DESIGNATION_ID) : "",
      DEPARTMENT_GROUP_ID: u.DEPARTMENT_GROUP_ID != null ? String(u.DEPARTMENT_GROUP_ID) : "",
      DESIGNATION_GROUP_ID: u.DESIGNATION_GROUP_ID != null ? String(u.DESIGNATION_GROUP_ID) : "",
      CAMP_ID: u.CAMP_ID != null ? String(u.CAMP_ID) : "",
      STORE_ID: u.STORE_ID != null ? String(u.STORE_ID) : "",
      EMPLOYMENT_TYPE_ID: u.EMPLOYMENT_TYPE_ID != null ? String(u.EMPLOYMENT_TYPE_ID) : "",
      ATTENDANCE_TYPE_ID: u.ATTENDANCE_TYPE_ID != null ? String(u.ATTENDANCE_TYPE_ID) : "",
      EMP_ID: u.EMP_ID != null ? String(u.EMP_ID) : "",
    }));
  }, [items, finalStatusMap]);

  const cleanPayload = (item: AttendanceDetailsGridData): AttendanceDetailsGridData => {
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
      "ATTENDANCE_TYPE_ID",
      "ELIGIBLE_DAYS",
      "NO_OF_DAYS",
      "BALANCE_LEAVE",
      "SECTION_HEAD_RESPONSE_PERSON_EMP_ID",
    ].forEach((k) => {
      const val = (copy as any)[k];
      if (val === "" || val === undefined || val === null) {
        (copy as any)[k] = undefined;
      }
    });
    return copy;
  };

  const handleFieldChange = useCallback((key: string, value: any, setForm: any, form: Record<string, any>): boolean => {
    if (key === "ATT_REQUEST_REF_NO") {
      const req = (Array.isArray(attendanceRequests) ? attendanceRequests : []).find(
        (r: any) => String(r.ATT_REQUEST_REF_NO) === String(value)
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
          ATT_REQUEST_REF_NO: value,
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
          ATTENDANCE_TYPE_ID: toStr(req.ATTENDANCE_TYPE_ID),
          ELIGIBLE_DAYS: toNum(req.ELIGIBLE_DAYS),
          DATE_FROM: fmtDate(req.DATE_FROM),
          DATE_TO: fmtDate(req.DATE_TO),
          NO_OF_DAYS: toNum(req.NO_OF_DAYS),
          BALANCE_LEAVE: toNum(req.BALANCE_LEAVE),
          REASON: req.REASON ?? "",
          SECTION_HEAD_RESPONSE_PERSON_EMP_ID: toStr(req.SECTION_HEAD_RESPONSE_PERSON_EMP_ID),
          SECTION_HEAD_RESPONSE_DATE: fmtDate(req.SECTION_HEAD_RESPONSE_DATE),
          SECTION_HEAD_RESPONSE_STATUS: req.SECTION_HEAD_RESPONSE_STATUS ?? "",
          SECTION_HEAD_RESPONSE_REMARKS: req.SECTION_HEAD_RESPONSE_REMARKS ?? "",
          FINAL_RESPONSE_PERSON: req.FINAL_RESPONSE_PERSON ?? "",
          FINAL_RESPONSE_DATE: fmtDate(req.FINAL_RESPONSE_DATE),
          FINAL_RESPONSE_STATUS: req.FINAL_RESPONSE_STATUS ?? "",
          FINAL_RESPONSE_REMARKS: req.FINAL_RESPONSE_REMARKS ?? "",
        });
      } else {
        setForm({ ...form, ATT_REQUEST_REF_NO: value });
      }
      return true;
    }
    if (key === "EMP_ID") {
      const emp = (Array.isArray(employees) ? employees : []).find((e: any) => String(e.EMP_ID) === String(value));
      if (emp && emp.SNO) {
        // Fetch detailed employee record to get all internal IDs correctly
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
                ATT_REQUEST_REF_NO: "",
              }));
            }
          });
      } else {
        setForm({ ...form, EMP_ID: value, ATT_REQUEST_REF_NO: "" });
      }
      return true;
    }
    return false;
  }, [attendanceRequests, employees]);

  useEffect(() => {
    dispatch(fetchAttendanceDetails({ status: currentStatus || "ALL", fromDate, toDate }));
  }, [dispatch, currentStatus, fromDate, toDate]);

  useEffect(() => {
    let cancelled = false;
    const rows = Array.isArray(items) ? items : [];
    const ids = rows.map((r: any) => Number(r.SNO ?? r.id)).filter(Boolean);
    if (ids.length === 0) {
      setFinalStatusMap({});
      return;
    }
    (async () => {
      const entries = await Promise.all(
        ids.map(async (id: number) => {
          try {
            const res = await fetch(`${API_URL}/attendance-details/${id}`);
            if (!res.ok) return [String(id), ""] as const;
            const json = await res.json();
            return [String(id), (json.data?.FINAL_RESPONSE_STATUS ?? "") as string] as const;
          } catch {
            return [String(id), ""] as const;
          }
        })
      );
      if (!cancelled) setFinalStatusMap(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearAttendanceDetailsError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: AttendanceDetailsGridData) => {
      const res = await dispatch(addAttendanceDetail({ ...cleanPayload(item), STATUS_MASTER: "AC" })).unwrap();
      dispatch(fetchAttendanceDetails({ status: currentStatus || "ALL", fromDate, toDate }));
      return res;
    },
    update: async (item: AttendanceDetailsGridData) => {
      const res = await dispatch(updateAttendanceDetail(cleanPayload(item))).unwrap();
      dispatch(fetchAttendanceDetails({ status: currentStatus || "ALL", fromDate, toDate }));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteAttendanceDetail(id)).unwrap();
      dispatch(fetchAttendanceDetails({ status: currentStatus || "ALL", fromDate, toDate }));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteAttendanceDetail(id)).unwrap();
      }
      dispatch(fetchAttendanceDetails({ status: currentStatus || "ALL", fromDate, toDate }));
      return res;
    },
    onFieldChange: handleFieldChange,
  }), [enrichedData, loading, dispatch, currentStatus, fromDate, toDate, handleFieldChange]);

  return (
    <MasterCrudPage
      title="Attendance Details"
      description="Manage attendance details entries"
      idPrefix="ATT"
      domain="attendance-details"
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
      hideLockedModifyActions
      enableDateRangeFilter
      onDateRangeFilterChange={handleDateRangeChange}
      rowActions={(item) => {
        const sv = String(item.STATUS_MASTER || "").toUpperCase();
        if (sv === "CL" || sv === "CA") return null;
        const submitting = submittingId != null && String(submittingId) === String(item.id ?? item.SNO);
        return (
          <button
            onClick={() => handleSubmit(item)}
            disabled={submitting}
            title="Submit attendance detail"
            className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        );
      }}
      onBeforeEdit={async (item) => {
        const id = Number(item.SNO ?? item.id);
        if (!id) return undefined;
        const res = await fetch(`${API_URL}/attendance-details/${id}`);
        if (!res.ok) return undefined;
        const json = await res.json();
        return json.data;
      }}
    />
  );
}