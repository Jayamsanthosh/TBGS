"use client";

import { useMemo } from "react";
import * as LucideIcons from "lucide-react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useApiQuery, useApiMutation } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { IconPicker } from "@/components/IconPicker";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { refreshNavigationForUser } from "@/lib/navigationSlice";

interface MainMenuGridData {
  id?: string | number;
  MAIN_MENU_ID?: number;
  MAIN_MENU_NAME: string;
  MAIN_MENU_LOCATION: string;
  MAIN_MENU_SEQ_ID: number;
  STATUS_MASTER: string;
  STYLE_CSS: string;
  PAGE_ACTION: string;
}

const getUser = () => {
  if (typeof window === 'undefined') return 'Admin';
  try {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const u = JSON.parse(userJson);
      return u.LOGIN_NAME || u.username || 'Admin';
    }
  } catch {}
  return 'Admin';
};

const toDbStatus = (val: string) => (val === "INACTIVE" ? "IN" : "AC");
const toDisplayStatus = (val: string) => {
  const u = (val || "").toUpperCase();
  return u === "AC" || u === "ACTIVE" ? "ACTIVE" : "INACTIVE";
};

const columns = [
  { key: "MAIN_MENU_NAME", label: "Menu Name" },
  { key: "MAIN_MENU_LOCATION", label: "Location" },
  { key: "MAIN_MENU_SEQ_ID", label: "Sequence" },
  {
    key: "STYLE_CSS",
    label: "Icon",
    render: (val: string) => {
      const IconComp = (LucideIcons as any)[val];
      return IconComp ? <IconComp className="w-4 h-4" /> : <span className="text-xs text-muted-foreground">{val || "—"}</span>;
    },
  },
  { key: "PAGE_ACTION", label: "Action" },
  {
    key: "status",
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

export default function MainMenuPage() {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s: any) => s.auth.user);
  const { data, loading } = useApiQuery("main-menu-page", async () => {
    const res = await fetch(`${API_URL}/main-menu`);
    if (!res.ok) throw new Error("Failed to fetch main menus");
    const json = await res.json();
    return (json.data || []).map((u: any) => {
      const id = u["MENU ID"] ?? u.MAIN_MENU_ID ?? u.menuId;
      const displayStatus = toDisplayStatus(u.STATUS_MASTER);
      return {
        ...u,
        id,
        MAIN_MENU_ID: Number(id),
        STATUS_MASTER: displayStatus,
        status: displayStatus,
      };
    });
  });

  const { mutateAsync } = useApiMutation(["main-menu-page"]);

  const fields: MasterField[] = useMemo(() => [
    { key: "MAIN_MENU_NAME", label: "Menu Name", type: "text", required: true, placeholder: "e.g. Dashboard" },
    { key: "MAIN_MENU_LOCATION", label: "Location", type: "text", placeholder: "e.g. /dashboard" },
    { key: "MAIN_MENU_SEQ_ID", label: "Sequence", type: "number", placeholder: "e.g. 1" },
    {
      key: "STYLE_CSS",
      label: "Icon",
      type: "text",
      required: true,
      renderField: ({ form, setForm }) => (
        <IconPicker
          value={form.STYLE_CSS || ""}
          onChange={(v) => setForm((prev: any) => ({ ...prev, STYLE_CSS: v }))}
        />
      ),
    },
    { key: "PAGE_ACTION", label: "Page Action", type: "text", placeholder: "e.g. Dashboard" },
    {
      key: "STATUS_MASTER",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "ACTIVE" },
        { label: "Inactive", value: "INACTIVE" },
      ],
      defaultValue: "ACTIVE",
    },
  ], []);

  const storeOverrides = useMemo(() => ({
    data: data || [],
    isLoading: loading,
    add: async (item: MainMenuGridData) => {
      const body = { ...item, STATUS_MASTER: toDbStatus(item.STATUS_MASTER), USER: getUser() };
      const res = await mutateAsync(async () => {
        const resp = await fetch(`${API_URL}/main-menu`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!resp.ok) {
          const errResp = await resp.json().catch(() => ({}));
          throw new Error(errResp.message || "Failed to add main menu");
        }
        return resp.json();
      });
      dispatch(refreshNavigationForUser(authUser));
      return res;
    },
    update: async (item: MainMenuGridData) => {
      const menuId = Number(item.id) || item.MAIN_MENU_ID!;
      const body = {
        ...item,
        MAIN_MENU_ID: menuId,
        STATUS_MASTER: toDbStatus(item.STATUS_MASTER),
        USER: getUser(),
      };
      const res = await mutateAsync(async () => {
        const resp = await fetch(`${API_URL}/main-menu/${menuId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!resp.ok) {
          const errResp = await resp.json().catch(() => ({}));
          throw new Error(errResp.message || "Failed to update main menu");
        }
        return resp.json();
      });
      dispatch(refreshNavigationForUser(authUser));
      return res;
    },
    remove: async (id: string) => {
      const res = await mutateAsync(async () => {
        const resp = await fetch(`${API_URL}/main-menu/${id}`, {
          method: "DELETE",
        });
        if (!resp.ok) {
          const errResp = await resp.json().catch(() => ({}));
          throw new Error(errResp.message || "Failed to delete main menu");
        }
        return resp.json();
      });
      dispatch(refreshNavigationForUser(authUser));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await mutateAsync(async () => {
          const resp = await fetch(`${API_URL}/main-menu/${id}`, {
            method: "DELETE",
          });
          if (!resp.ok) {
            const errResp = await resp.json().catch(() => ({}));
            throw new Error(errResp.message || `Failed to delete main menu ${id}`);
          }
          return resp.json();
        });
      }
      dispatch(refreshNavigationForUser(authUser));
      return res;
    },
  }), [data, loading, mutateAsync, dispatch, authUser]);

  return (
    <MasterCrudPage
      title="Main Menus"
      description="Manage main navigation menus and their properties"
      idPrefix="MENU"
      domain="main-menu"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
