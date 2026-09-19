"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchDepartmentGroups,
  addDepartmentGroup,
  updateDepartmentGroup,
  deleteDepartmentGroup,
  clearDepartmentGroupError,
  DepartmentGroupGridData,
} from "@/lib/departmentGroupMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { validateEmail } from "@/lib/validation";

const fields: MasterField[] = [
  { key: "DEPARTMENT_GROUP_NAME", label: "Department Group Name", type: "text", required: true, placeholder: "e.g., Finance Group" },
  { key: "MANAGER_EMP_ID", label: "Manager Employee ID", type: "employee", placeholder: "Select Manager ID" },
  { key: "TO_MAIL_ADDRESS", label: "To Mail Address", type: "text", placeholder: "finance@example.com", validate: (value: any) => {
    const v = String(value ?? "");
    if (v && !validateEmail(v)) return "Invalid email format (e.g., name@domain.com)";
    return undefined;
  } },
  { key: "CC_MAIL_ADDRESS", label: "CC Mail Address", type: "text", placeholder: "accounts@example.com", validate: (value: any) => {
    const v = String(value ?? "");
    if (v && !validateEmail(v)) return "Invalid email format (e.g., name@domain.com)";
    return undefined;
  } },
  { key: "BCC_MAIL_ADDRESS", label: "BCC Mail Address", type: "text", placeholder: "audit@example.com", validate: (value: any) => {
    const v = String(value ?? "");
    if (v && !validateEmail(v)) return "Invalid email format (e.g., name@domain.com)";
    return undefined;
  } },
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
  { key: "DEPARTMENT_GROUP_NAME", label: "Department Group Name" },
  { key: "MANAGER_EMP_ID", label: "Manager ID" },
  { key: "TO_MAIL_ADDRESS", label: "To Mail" },
  { key: "CC_MAIL_ADDRESS", label: "CC Mail" },
  { key: "BCC_MAIL_ADDRESS", label: "BCC Mail" },
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

export default function DepartmentGroupMasterPage() {
  const dispatch = useAppDispatch();
  const { departmentGroups, loading, error } = useAppSelector((s) => s.departmentGroup);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchDepartmentGroups());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearDepartmentGroupError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: departmentGroups,
    isLoading: loading,
    add: async (item: DepartmentGroupGridData) => {
      const res = await dispatch(addDepartmentGroup(item)).unwrap();
      dispatch(fetchDepartmentGroups());
      return res;
    },
    update: async (item: DepartmentGroupGridData) => {
      const res = await dispatch(updateDepartmentGroup(item)).unwrap();
      dispatch(fetchDepartmentGroups());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteDepartmentGroup(id)).unwrap();
      dispatch(fetchDepartmentGroups());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteDepartmentGroup(id)).unwrap();
      }
      dispatch(fetchDepartmentGroups());
      return res;
    },
  }), [departmentGroups, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Department Group Master"
      description="Manage department group master data"
      idPrefix="DGP"
      domain="department-group-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
