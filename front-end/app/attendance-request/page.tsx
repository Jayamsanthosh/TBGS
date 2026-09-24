"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchAttendanceRequests,
  addAttendanceRequest,
  updateAttendanceRequest,
  deleteAttendanceRequest,
  clearAttendanceRequestError,
  getPendingConflictRef,
  AttendanceRequestGridData,
} from "@/lib/attendanceRequestSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";

const responseStatusBadge = (val: unknown) => {
  const sv = String(val || "").trim().toLowerCase();
  const isPending = sv === "" || sv === "pending" || sv === "ac";
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
  const label = isPending ? "Pending" : isApproved ? "Approved" : isRejected ? "Rejected" : sv ? sv.toUpperCase() : "Pending";
  return (
    <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
      {label}
    </Badge>
  );
};

const deriveApprovalStatus = (item?: Record<string, unknown>) =>
  item?.FINAL_RESPONSE_STATUS || item?.RESPONSE_2_STATUS || item?.RESPONSE_1_STATUS || item?.SECTION_HEAD_RESPONSE_STATUS || "";

const toId = (key: string) => (arr: any[], id: any) =>
  (Array.isArray(arr) ? arr.find((x: any) => Number(x[key]) === Number(id)) : undefined) || undefined;

export default function AttendanceRequestPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.attendanceRequest);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [pendingRefNo, setPendingRefNo] = useState<string | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  const { user } = useAppSelector((state) => state.auth);
  
  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "");
  }, []);

  const { data: userStoreMappings } = useApiQuery("att-req-user-map", async () => {
    const res = await fetch(`${API_URL}/user-store-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch user mappings");
    const json = await res.json();
    return json.data || [];
  });

  const { data: employees } = useApiQuery("att-req-employees", async () => {
    const res = await fetch(`${API_URL}/employee-database?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch employees");
    const json = await res.json();
    return json.data || [];
  });

  const { data: attendanceTypes } = useApiQuery("att-req-attendance-types", async () => {
    const res = await fetch(`${API_URL}/attendance-type-master`);
    if (!res.ok) throw new Error("Failed to fetch attendance types");
    const json = await res.json();
    return json.data || [];
  });

  const { data: companies } = useApiQuery("att-req-companies", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed to fetch companies");
    const json = await res.json();
    return json.data || [];
  });

  const { data: departments } = useApiQuery("att-req-departments", async () => {
    const res = await fetch(`${API_URL}/department-master`);
    if (!res.ok) throw new Error("Failed to fetch departments");
    const json = await res.json();
    return json.data || [];
  });

  const { data: designations } = useApiQuery("att-req-designations", async () => {
    const res = await fetch(`${API_URL}/designation-master`);
    if (!res.ok) throw new Error("Failed to fetch designations");
    const json = await res.json();
    return json.data || [];
  });

  const { data: departmentGroups } = useApiQuery("att-req-dept-groups", async () => {
    const res = await fetch(`${API_URL}/department-group-master`);
    if (!res.ok) throw new Error("Failed to fetch department groups");
    const json = await res.json();
    return json.data || [];
  });

  const { data: designationGroups } = useApiQuery("att-req-desig-groups", async () => {
    const res = await fetch(`${API_URL}/designation-group-master`);
    if (!res.ok) throw new Error("Failed to fetch designation groups");
    const json = await res.json();
    return json.data || [];
  });

  const { data: camps } = useApiQuery("att-req-camps", async () => {
    const res = await fetch(`${API_URL}/camp-master`);
    if (!res.ok) throw new Error("Failed to fetch camps");
    const json = await res.json();
    return json.data || [];
  });

  const { data: stores } = useApiQuery("att-req-stores", async () => {
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

  const { data: employmentTypes } = useApiQuery("att-req-employment-types", async () => {
    const res = await fetch(`${API_URL}/employment-type-master`);
    if (!res.ok) throw new Error("Failed to fetch employment types");
    const json = await res.json();
    return json.data || [];
  });

  const { data: deptDesigMappings } = useApiQuery("att-req-dept-desig-map", async () => {
    const res = await fetch(`${API_URL}/company-department-designation-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch department-designation mappings");
    const json = await res.json();
    return json.data || [];
  });

  const { data: campStoreMappings } = useApiQuery("att-req-camp-store-map", async () => {
    const res = await fetch(`${API_URL}/company-camp-store-mapping?status=AC`);
    if (!res.ok) throw new Error("Failed to fetch camp-store mappings");
    const json = await res.json();
    return json.data || [];
  });

  const empName = (e: any) => [e?.FIRST_NAME, e?.MIDDLE_NAME, e?.LAST_NAME].filter(Boolean).join(" ") || "";

  const filteredEmployees = useMemo(() => {
    if (!Array.isArray(employees) || !user) return [];
    if (user.role === "Admin" || user.role === "Super Admin") return employees; // Admin sees all
    
    // Get mappings for current user
    const maps = (userStoreMappings || []).filter((m: any) => String(m.LOGIN_ID) === String(user.id));
    if (maps.length === 0) return []; // No rights

    return employees.filter((emp: any) => {
      // Resolve IDs from the grid names using master lists
      const cId = companies?.find((c: any) => c.COMPANY_NAME === emp.COMPANY_NAME)?.COMPANY_ID;
      const cmpId = camps?.find((c: any) => c.CAMP_NAME === emp.CAMP_NAME)?.CAMP_ID;
      const sId = stores?.find((s: any) => s.STORE_NAME === emp.STORE_NAME)?.STORE_ID;

      // Check if employee satisfies any of the user's mapped access levels
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
    { key: "MONTH_ENTERED", label: "Process Month", type: "text", defaultValue: user?.monthProcess || "", disabled: true },
    { key: "YEAR_ENTERED", label: "Process Year", type: "text", defaultValue: user?.yearProcess || "", disabled: true },
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
    { key: "ATTENDANCE_TYPE_ID", label: "Attendance Type", type: "select", required: true, options: selectOptions("ATTENDANCE_TYPE_ID", attendanceTypes, "ATTENDANCE_TYPE_NAME"), placeholder: "Select attendance type" },
    { key: "ELIGIBLE_DAYS", label: "Eligible Days", type: "number", disabled: true, placeholder: "0" },
    { key: "DATE_FROM", label: "Date From", type: "date", required: true, placeholder: "Select Date" },
    { key: "DATE_TO", label: "Date To", type: "date", required: true, placeholder: "Select Date" },
    { key: "NO_OF_DAYS", label: "No. of Days", type: "number", disabled: true, placeholder: "0" },
    { key: "REASON", label: "Reason", type: "textarea", placeholder: "Enter reason...", maxLength: 3000 },
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
        case "ATTENDANCE_TYPE_ID": return { ...f, options: selectOptions("ATTENDANCE_TYPE_ID", attendanceTypes, "ATTENDANCE_TYPE_NAME") };
        default: return f;
      }
    });
  }, [companies, departments, designations, departmentGroups, designationGroups, camps, stores, employmentTypes, attendanceTypes, cascadeMaps]);

  const handleFieldChange = useCallback((key: string, value: any, setForm: any, form: Record<string, any>): boolean => {
    if (key === "EMP_ID") {
      const empGrid = (Array.isArray(filteredEmployees) ? filteredEmployees.find((e: any) => String(e.EMP_ID) === String(value)) : undefined);
      if (empGrid && empGrid.SNO) {
        // Fetch detailed employee record to get all internal IDs correctly
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
              }));
            }
          });
      } else {
        setForm({ ...form, EMP_ID: value });
      }
      return true;
    }
    
    // Auto fill eligible days for attendance type
    if (key === "ATTENDANCE_TYPE_ID") {
      const at = (Array.isArray(attendanceTypes) ? attendanceTypes.find((a: any) => String(a.ATTENDANCE_TYPE_ID) === String(value)) : undefined);
      if (at) {
        setForm({ ...form, ATTENDANCE_TYPE_ID: value, ELIGIBLE_DAYS: at.ELIGIBLE_DAYS ?? "" });
      } else {
        setForm({ ...form, ATTENDANCE_TYPE_ID: value });
      }
      return true;
    }

    // Auto calculate NO_OF_DAYS difference
    if (key === "DATE_FROM" || key === "DATE_TO") {
      const fieldUpdate = { ...form, [key]: value };
      if (fieldUpdate.DATE_FROM && fieldUpdate.DATE_TO) {
        const from = new Date(fieldUpdate.DATE_FROM);
        const to = new Date(fieldUpdate.DATE_TO);
        if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
          if (to < from) {
            fieldUpdate.NO_OF_DAYS = 0;
          } else {
            const diffTime = Math.abs(to.getTime() - from.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            fieldUpdate.NO_OF_DAYS = diffDays;
          }
        } else {
          fieldUpdate.NO_OF_DAYS = 0;
        }
      } else {
        fieldUpdate.NO_OF_DAYS = 0;
      }
      setForm(fieldUpdate);
      return true;
    }

    return false;
  }, [filteredEmployees, attendanceTypes]);

  const columns = useMemo(() => [
    { key: "SNO", label: "ID" },
    {
      key: "ATT_REQUEST_REF_NO",
      label: "Ref No",
      render: (val: unknown, item: Record<string, unknown>) => (
        <span className="flex items-center gap-1.5 flex-wrap">
          <span>{val != null && val !== "" ? String(val) : "-"}</span>
          {pendingRefNo && String(item?.ATT_REQUEST_REF_NO ?? "").toLowerCase() === pendingRefNo.toLowerCase() && (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/40 px-1.5 py-0 text-[9px] uppercase font-bold">Pending</Badge>
          )}
        </span>
      ),
    },
    { key: "MONTH_ENTERED", label: "Month" },
    { key: "YEAR_ENTERED", label: "Year" },
    { key: "EMP_NAME", label: "Employee" },
    { key: "COMPANY_NAME", label: "Company" },
    { key: "DEPARTMENT_NAME", label: "Department" },
    { key: "DESIGNATION_NAME", label: "Designation" },
    { key: "ATTENDANCE_TYPE_NAME", label: "Attendance Type" },
    { key: "NO_OF_DAYS", label: "No of Days" },
    { key: "SECTION_HEAD_RESPONSE_STATUS", label: "Section Head", render: (val: unknown, item?: Record<string, unknown>) =>
      responseStatusBadge(String(val ?? item?.SECTION_HEAD_RESPONSE_STATUS ?? "")),
    },
    { key: "FINAL_RESPONSE_STATUS", label: "Final", render: (val: unknown) => responseStatusBadge(val) },
    {
      key: "REMARKS",
      label: "Remarks",
      render: (_val: unknown, item?: Record<string, unknown>) =>
        (item?.SECTION_HEAD_RESPONSE_REMARKS || item?.RESPONSE_1_REMARKS || item?.RESPONSE_2_REMARKS || item?.FINAL_RESPONSE_REMARKS || item?.REMARKS || "-") as string,
    },
    {
      key: "STATUS_MASTER",
      label: "Status",
      render: (_val: any, item: any) => responseStatusBadge(deriveApprovalStatus(item)),
    },
  ], [pendingRefNo]);

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
        ATTENDANCE_TYPE_NAME: toId("ATTENDANCE_TYPE_ID")(attendanceTypes, u.ATTENDANCE_TYPE_ID)?.ATTENDANCE_TYPE_NAME || u.ATTENDANCE_TYPE_NAME || "",
      };
    });
  }, [items, employees, companies, departments, designations, attendanceTypes]);

  useEffect(() => {
    dispatch(fetchAttendanceRequests(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearAttendanceRequestError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: AttendanceRequestGridData) => {
      const DATE_INPUT_KEYS = ["DATE_FROM", "DATE_TO", "SECTION_HEAD_RESPONSE_DATE"];
      const EMPTY_AS_UNDEFINED_KEYS = [
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
        ...DATE_INPUT_KEYS,
      ];
      const month = user?.monthProcess || new Date().toLocaleString("en", { month: "long" });
      const payload: Record<string, any> = {
        ...item,
        MONTH_ENTERED: item.MONTH_ENTERED || user?.monthProcess || month,
        YEAR_ENTERED: item.YEAR_ENTERED || user?.yearProcess || new Date().getFullYear(),
        ATT_REQUEST_REF_NO: item.ATT_REQUEST_REF_NO || `ATT/${new Date().toISOString().slice(0, 10).replace(/-/g, "")}/${Date.now()}`,
        USER: user?.loginName || "Admin",
        MAC_ADDRESS: "WEB",
      };
      EMPTY_AS_UNDEFINED_KEYS.forEach((k) => {
        const v = payload[k];
        if (v === "" || v === undefined || v === null) delete payload[k];
      });
      try {
        const res = await dispatch(addAttendanceRequest(payload as AttendanceRequestGridData)).unwrap();
        dispatch(fetchAttendanceRequests(currentStatus));
        return res;
      } catch (raw) {
        const msg = typeof raw === "string"
          ? raw
          : (typeof raw === "object" && raw !== null && "message" in raw ? String((raw as { message: unknown }).message) : "");
        const conflict = getPendingConflictRef(msg);
        if (conflict) {
          try {
            const inGrid = (Array.isArray(enrichedData) ? enrichedData : []).find(
              (r) => String(r.ATT_REQUEST_REF_NO).toLowerCase() === conflict.refNo.toLowerCase()
            );
            let match = inGrid;
            if (!match) {
              const listRes = await fetch(`${API_URL}/attendance-request?status=`);
              const listJson = await listRes.json().catch(() => null);
              match = (listJson?.data || []).find(
                (r: AttendanceRequestGridData) => String(r.ATT_REQUEST_REF_NO).toLowerCase() === conflict.refNo.toLowerCase()
              );
            }
            if (match) {
              setPendingRefNo(conflict.refNo);
              setPendingRequestId(String(match.SNO ?? match.id));
              if (!inGrid) setCurrentStatus("");
            }
          } catch { /* highlighting the existing request is non-critical */ }
        }
        throw raw;
      }
    },
    update: async (item: AttendanceRequestGridData) => {
      const res = await dispatch(updateAttendanceRequest(item)).unwrap();
      dispatch(fetchAttendanceRequests(currentStatus));
      setPendingRefNo(null);
      setPendingRequestId(null);
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteAttendanceRequest(id)).unwrap();
      dispatch(fetchAttendanceRequests(currentStatus));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteAttendanceRequest(id)).unwrap();
      }
      dispatch(fetchAttendanceRequests(currentStatus));
      return res;
    },
    onFieldChange: handleFieldChange,
  }), [enrichedData, loading, dispatch, currentStatus, handleFieldChange]);

  return (
    <div className="space-y-4">
      <MasterCrudPage
      title="Attendance Request"
      description="Manage attendance requests"
      idPrefix="ATT"
      domain="attendance-request"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[
        { label: "All Status", value: "" },
        { label: "Active", value: "AC" },
        { label: "Inactive", value: "IN" },
      ]}
      onStatusFilterChange={handleStatusFilterChange}
      enableViewDetails
      highlightId={pendingRequestId}
      onBeforeEdit={async (item) => {
        const id = Number(item.SNO ?? item.id);
        if (!id) return undefined;
        const res = await fetch(`${API_URL}/attendance-request/${id}`);
        if (!res.ok) return undefined;
        const json = await res.json();
        return json.data;
      }}
    />
    </div>
  );
}