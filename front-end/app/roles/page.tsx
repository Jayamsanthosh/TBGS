"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchRoles, addRole, updateRole, deleteRole, clearRolesError, RoleGridData } from "@/lib/rolesSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  { key: "ROLE_NAME", label: "Role Name", type: "text", required: true, placeholder: "e.g., Admin" },
  { key: "ROLE_DESCRIPTION", label: "Description", type: "text", placeholder: "e.g., System Administrator" },
  {
    key: "STATUS_MASTER",
    label: "Status",
    type: "select",
    options: [{ label: "Active", value: "ACTIVE" }, { label: "Inactive", value: "INACTIVE" }],
    defaultValue: "ACTIVE",
    formatter: (val: any) => {
      const s = String(val || "").toLowerCase();
      if (s === "ac") return "ACTIVE";
      if (s === "ia") return "INACTIVE";
      return val;
    },
  },
  { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks" },
];

const columns = [
  { key: "ROLE_NAME", label: "Role Name" },
  { key: "ROLE_DESCRIPTION", label: "Description" },
  {
    key: "STATUS_MASTER",
    label: "Status",
    render: (val: any, item: any) => {
      const raw = item?.STATUS_MASTER || item?.status || val || "";
      const u = String(raw).toUpperCase();
      const isActive = u === "ACTIVE" || u === "AC";
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
            isActive
              ? "bg-green-500/10 text-green-600 border border-green-200"
              : "bg-red-500/10 text-red-600 border border-red-200"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      );
    },
  },
];

export default function RolesPage() {
  const dispatch = useAppDispatch();
  const { roles, loading, error } = useAppSelector((s) => s.roles);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchRoles());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearRolesError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: roles,
    isLoading: loading,
    add: async (item: RoleGridData) => {
      const res = await dispatch(addRole(item)).unwrap();
      dispatch(fetchRoles());
      return res;
    },
    update: async (item: RoleGridData) => {
      const res = await dispatch(updateRole(item)).unwrap();
      dispatch(fetchRoles());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteRole(id)).unwrap();
      dispatch(fetchRoles());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteRole(id)).unwrap();
      }
      dispatch(fetchRoles());
      return res;
    },
  }), [roles, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Roles"
      description="Manage system roles and their permissions"
      idPrefix="RL"
      domain="roles"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
