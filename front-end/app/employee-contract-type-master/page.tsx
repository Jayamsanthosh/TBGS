"use client";

import { useMemo, useEffect, useCallback, useState } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchEmployeeContractTypes,
  addEmployeeContractType,
  updateEmployeeContractType,
  deleteEmployeeContractType,
  clearEmployeeContractTypeError,
  EmployeeContractTypeGridData,
} from "@/lib/employeeContractTypeMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  { key: "CONTRACT_TYPE_NAME", label: "Contract Type Name", type: "text", required: true, placeholder: "e.g., Permanent" },
  { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks" },
  {
    key: "STATUS_MASTER",
    label: "Status",
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
  { key: "CONTRACT_TYPE_NAME", label: "Contract Type Name" },
  { key: "REMARKS", label: "Remarks" },
  {
    key: "STATUS_MASTER",
    label: "Status",
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

export default function EmployeeContractTypeMasterPage() {
  const dispatch = useAppDispatch();
  const { employeeContractTypes, loading, error } = useAppSelector((s) => s.employeeContractType);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("AC");

  useEffect(() => {
    dispatch(fetchEmployeeContractTypes(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearEmployeeContractTypeError());
    }
  }, [error, dispatch, toast]);

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "AC");
  }, []);

  const storeOverrides = useMemo(() => ({
    data: employeeContractTypes,
    isLoading: loading,
    add: async (item: EmployeeContractTypeGridData) => {
      const res = await dispatch(addEmployeeContractType(item)).unwrap();
      dispatch(fetchEmployeeContractTypes(currentStatus));
      return res;
    },
    update: async (item: EmployeeContractTypeGridData) => {
      const res = await dispatch(updateEmployeeContractType(item)).unwrap();
      dispatch(fetchEmployeeContractTypes(currentStatus));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteEmployeeContractType(id)).unwrap();
      dispatch(fetchEmployeeContractTypes(currentStatus));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteEmployeeContractType(id)).unwrap();
      }
      dispatch(fetchEmployeeContractTypes(currentStatus));
      return res;
    },
  }), [employeeContractTypes, loading, dispatch, currentStatus]);

  return (
    <MasterCrudPage
      title="Employee Contract Type Master"
      description="Manage employee contract type master data"
      idPrefix="ECT"
      domain="employee-contract-type-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }]}
      onStatusFilterChange={handleStatusFilterChange}
    />
  );
}
