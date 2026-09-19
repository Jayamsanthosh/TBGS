"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  clearDepartmentError,
  DepartmentGridData,
} from "@/lib/departmentMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  { key: "DEPARTMENT_NAME", label: "Department Name", type: "text", required: true, placeholder: "e.g., Accounts" },
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
  { key: "DEPARTMENT_NAME", label: "Department Name" },
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

export default function DepartmentMasterPage() {
  const dispatch = useAppDispatch();
  const { departments, loading, error } = useAppSelector((s) => s.department);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearDepartmentError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: departments,
    isLoading: loading,
    add: async (item: DepartmentGridData) => {
      const res = await dispatch(addDepartment(item)).unwrap();
      dispatch(fetchDepartments());
      return res;
    },
    update: async (item: DepartmentGridData) => {
      const res = await dispatch(updateDepartment(item)).unwrap();
      dispatch(fetchDepartments());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteDepartment(id)).unwrap();
      dispatch(fetchDepartments());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteDepartment(id)).unwrap();
      }
      dispatch(fetchDepartments());
      return res;
    },
  }), [departments, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Department Master"
      description="Manage department master data"
      idPrefix="DEPT"
      domain="department-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
