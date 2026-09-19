"use client";

import { useMemo, useEffect, useCallback, useState } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchEmployeeWorkingStatuses,
  addEmployeeWorkingStatus,
  updateEmployeeWorkingStatus,
  deleteEmployeeWorkingStatus,
  clearEmployeeWorkingStatusError,
  EmployeeWorkingStatusGridData,
} from "@/lib/employeeWorkingStatusMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  { key: "EMP_CURRENT_STATUS_NAME", label: "Status Name", type: "text", required: true, placeholder: "e.g., Active" },
  { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks" },
  {
    key: "STATUS_MASTER",
    label: "Master Status",
    type: "select",
    options: [{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }],
    defaultValue: "AC",
    formatter: (val: any) => {
      const s = String(val || "").toUpperCase();
      if (s === "AC") return "ACTIVE";
      if (s === "IN") return "INACTIVE";
      return val;
    },
  },
];

const columns = [
  { key: "EMP_CURRENT_STATUS_NAME", label: "Status Name" },
  { key: "REMARKS", label: "Remarks" },
  {
    key: "STATUS_MASTER",
    label: "Master Status",
    render: (val: any) => {
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
    },
  },
];

export default function EmployeeWorkingStatusMasterPage() {
  const dispatch = useAppDispatch();
  const { employeeWorkingStatuses, loading, error } = useAppSelector((s) => s.employeeWorkingStatus);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("AC");

  useEffect(() => {
    dispatch(fetchEmployeeWorkingStatuses(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearEmployeeWorkingStatusError());
    }
  }, [error, dispatch, toast]);

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "AC");
  }, []);

  const storeOverrides = useMemo(() => ({
    data: employeeWorkingStatuses,
    isLoading: loading,
    add: async (item: EmployeeWorkingStatusGridData) => {
      const res = await dispatch(addEmployeeWorkingStatus(item)).unwrap();
      dispatch(fetchEmployeeWorkingStatuses(currentStatus));
      return res;
    },
    update: async (item: EmployeeWorkingStatusGridData) => {
      const res = await dispatch(updateEmployeeWorkingStatus(item)).unwrap();
      dispatch(fetchEmployeeWorkingStatuses(currentStatus));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteEmployeeWorkingStatus(id)).unwrap();
      dispatch(fetchEmployeeWorkingStatuses(currentStatus));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteEmployeeWorkingStatus(id)).unwrap();
      }
      dispatch(fetchEmployeeWorkingStatuses(currentStatus));
      return res;
    },
  }), [employeeWorkingStatuses, loading, dispatch, currentStatus]);

  return (
    <MasterCrudPage
      title="Employee Working Status Master"
      description="Manage employee working status master data"
      idPrefix="EWS"
      domain="employee-working-status-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }]}
      onStatusFilterChange={handleStatusFilterChange}
    />
  );
}
