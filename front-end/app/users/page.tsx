"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchUsers, addUser, updateUser, deleteUser, clearUsersError, UserGridData } from "@/lib/usersSlice";
import { fetchRoles } from "@/lib/rolesSlice";
import { useToast } from "@/hooks/use-toast";
import { validateEmail, validateTanzaniaPhone, formatTanzaniaPhone, cleanPhoneForStorage } from "@/lib/validation";

const columns = [
  { key: "LOGIN_NAME", label: "Login Name" },
  { key: "ROLE", label: "Role" },
  { key: "MOBILE_NO", label: "Mobile No" },
  { key: "MAIL_ID", label: "Email" },
  { key: "STOCK_SHOW_STATUS", label: "Stock Visibility" },
  {
    key: "STATUS_MASTER",
    label: "Status",
    render: (val: any, item: any) => {
      const raw = item?.STATUS_MASTER || item?.status || val || "";
      const u = String(raw).toUpperCase();
      const isActive = u === "ACTIVE" || u === "AC";
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${isActive
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

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { users, loading, error } = useAppSelector((s) => s.users);
  const currentUser = useAppSelector((s) => s.auth.user);
  const rolesList = useAppSelector((s) => s.roles.roles);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchRoles());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearUsersError());
    }
  }, [error, dispatch, toast]);

  const roleOptions = useMemo(() => {
    if (!Array.isArray(rolesList)) return [];
    return rolesList.map((r) => ({
      value: r.ROLE_NAME,
      label: r.ROLE_NAME,
    }));
  }, [rolesList]);

  const fields: MasterField[] = useMemo(() => [
    { key: "EMP_ID", label: "Employee ID", type: "employee", placeholder: "Select Employee ID" },
    { key: "LOGIN_NAME", label: "Login Name", type: "text", required: true, placeholder: "johndoe" },
    { key: "PASSWORD", label: "Password", type: "password", placeholder: "Leave blank to keep current" },
    { key: "ROLE", label: "Role", type: "select", required: true, options: roleOptions, placeholder: "Select a role" },
    { key: "MOBILE_NO", label: "Mobile No", type: "text", placeholder: "+255 700 000 000", formatter: formatTanzaniaPhone, storageFormatter: cleanPhoneForStorage, validate: (value: any) => {
      const v = String(value ?? "");
      if (v && !validateTanzaniaPhone(v)) return "Mobile No must be in Tanzania format (e.g., +255XXXXXXXXX)";
      return undefined;
    } },
    { key: "MAIL_ID", label: "Email ID", type: "text", placeholder: "john@example.com", validate: (value: any) => {
      const v = String(value ?? "");
      if (v && !validateEmail(v)) return "Invalid Email format";
      return undefined;
    } },
    {
      key: "STOCK_SHOW_STATUS",
      label: "Stock Show Status",
      type: "select",
      options: ["YES", "NO"],
      defaultValue: "YES",
    },
    {
      key: "OUTSIDE_ACCESS_Y_N",
      label: "Outside Access",
      type: "select",
      options: ["YES", "NO"],
      defaultValue: "NO",
    },
    {
      key: "STATUS_MASTER",
      label: "Status",
      type: "select",
      options: [{ label: "Active", value: "ACTIVE" }, { label: "Inactive", value: "INACTIVE" }],
      defaultValue: "ACTIVE",
    },
    { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks" },
  ], [roleOptions]);

  const filteredUsers = useMemo(() => {
    if (!currentUser?.id) return users;
    return users.filter((u) => String(u.id) !== String(currentUser.id) && String(u.LOGIN_ID) !== String(currentUser.id));
  }, [users, currentUser]);

  const storeOverrides = useMemo(() => ({
    data: filteredUsers,
    isLoading: loading,
    add: async (item: UserGridData) => {
      const res = await dispatch(addUser(item)).unwrap();
      dispatch(fetchUsers());
      return res;
    },
    update: async (item: UserGridData) => {
      const res = await dispatch(updateUser(item)).unwrap();
      dispatch(fetchUsers());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteUser(id)).unwrap();
      dispatch(fetchUsers());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteUser(id)).unwrap();
      }
      dispatch(fetchUsers());
      return res;
    },
  }), [users, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Users"
      description="Manage system users and their permissions"
      idPrefix="USR"
      domain="users"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
