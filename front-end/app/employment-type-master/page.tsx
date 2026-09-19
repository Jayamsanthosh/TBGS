"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchEmploymentTypes,
  addEmploymentType,
  updateEmploymentType,
  deleteEmploymentType,
  clearEmploymentTypeError,
  EmploymentTypeGridData,
} from "@/lib/employmentTypeMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const statusFormatter = (val: any) => {
  const s = String(val || "").toUpperCase();
  if (s === "AC") return "ACTIVE";
  if (s === "IN") return "INACTIVE";
  return val;
};

export default function EmploymentTypeMasterPage() {
  const dispatch = useAppDispatch();
  const { employmentTypes, loading, error } = useAppSelector((s) => s.employmentType);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchEmploymentTypes("ALL"));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearEmploymentTypeError());
    }
  }, [error, dispatch, toast]);

  const fields: MasterField[] = [
    { key: "EMPLOYMENT_TYPE_NAME", label: "Employment Type Name", type: "text", required: true, placeholder: "e.g., Permanent", maxLength: 50 },
    { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks", maxLength: 1000 },
    {
      key: "STATUS_MASTER",
      label: "Status",
      type: "select",
      options: [{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }],
      defaultValue: "AC",
      formatter: statusFormatter,
    },
  ];

  const columns = [
    { key: "EMPLOYMENT_TYPE_ID", label: "ID" },
    { key: "EMPLOYMENT_TYPE_NAME", label: "Name" },
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

  const storeOverrides = useMemo(() => ({
    data: employmentTypes,
    isLoading: loading,
    add: async (item: EmploymentTypeGridData) => {
      const res = await dispatch(addEmploymentType(item)).unwrap();
      dispatch(fetchEmploymentTypes("ALL"));
      return res;
    },
    update: async (item: EmploymentTypeGridData) => {
      const res = await dispatch(updateEmploymentType(item)).unwrap();
      dispatch(fetchEmploymentTypes("ALL"));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteEmploymentType(id)).unwrap();
      dispatch(fetchEmploymentTypes("ALL"));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteEmploymentType(id)).unwrap();
      }
      dispatch(fetchEmploymentTypes("ALL"));
      return res;
    },
  }), [employmentTypes, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Employment Type Master"
      description="Manage employment type master data"
      idPrefix="ET"
      domain="employment-type-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }]}
    />
  );
}
