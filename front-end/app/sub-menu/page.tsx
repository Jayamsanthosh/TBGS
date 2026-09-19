"use client";

import { useMemo, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { IconPicker } from "@/components/IconPicker";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchSubMenus, addSubMenu, updateSubMenu, deleteSubMenu, clearSubMenusError, SubMenuGridData } from "@/lib/subMenuSlice";
import { refreshNavigationForUser } from "@/lib/navigationSlice";
import { useToast } from "@/hooks/use-toast";

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

const columns = [
  { key: "MAIN_MENU_NAME", label: "Main Menu" },
  { key: "SUB_MENU_NAME", label: "Sub Menu Name" },
  { key: "SUB_MENU_LOCATION", label: "Location" },
  { key: "SUB_MENU_SEQ_ID", label: "Sequence" },
  {
    key: "STYLE_CSS",
    label: "Icon",
    render: (val: any) => {
      const stringVal = typeof val === 'string' ? val : "";
      const IconComp = stringVal ? (LucideIcons as any)[stringVal] : null;
      return IconComp ? <IconComp className="w-4 h-4" /> : <span className="text-xs text-muted-foreground">{stringVal || "—"}</span>;
    },
  },
  { key: "PAGE_ACTION", label: "Page Action" },
  { key: "IS_PARENT", label: "Parent" },
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

export default function SubMenuPage() {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s: any) => s.auth.user);
  const { subMenus, loading, error } = useAppSelector((s) => s.subMenus);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchSubMenus());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearSubMenusError());
    }
  }, [error, dispatch, toast]);

  const { data: mainMenus } = useApiQuery("main-menu-page", async () => {
    const res = await fetch(`${API_URL}/main-menu`);
    if (!res.ok) throw new Error("Failed to fetch main menus");
    const json = await res.json();
    // The DB returns the PK as "MENU ID" (with a space), so we normalize it here
    return (json.data || []).map((m: any) => ({
      ...m,
      MAIN_MENU_ID: Number(m["MENU ID"] ?? m.MAIN_MENU_ID ?? m.menuId ?? 0),
    }));
  });

  const mainMenuOptions = useMemo(() => {
    if (!Array.isArray(mainMenus)) return [];
    return mainMenus.map((m: any) => ({
      value: Number(m.MAIN_MENU_ID),
      label: m.MAIN_MENU_NAME || `Menu #${m.MAIN_MENU_ID}`,
    }));
  }, [mainMenus]);

  const enrichedSubMenus = useMemo(() => {
    if (!Array.isArray(subMenus)) return [];
    return subMenus.map((u: any) => {
      // If MAIN_MENU_ID is already a number, keep it; otherwise look it up by name
      if (u.MAIN_MENU_ID) return u;
      const matched = Array.isArray(mainMenus)
        ? mainMenus.find(
            (m: any) => String(m.MAIN_MENU_NAME || "").trim().toLowerCase() === String(u.MAIN_MENU_NAME || "").trim().toLowerCase()
          )
        : undefined;
      return {
        ...u,
        MAIN_MENU_ID: matched ? Number(matched.MAIN_MENU_ID) : undefined,
      };
    });
  }, [subMenus, mainMenus]);

  const fields: MasterField[] = useMemo(() => [
    {
      key: "MAIN_MENU_ID",
      label: "Main Menu",
      type: "select",
      required: true,
      options: mainMenuOptions,
    },
    { key: "SUB_MENU_NAME", label: "Sub Menu Name", type: "text", required: true, placeholder: "e.g. User Master" },
    { key: "SUB_MENU_LOCATION", label: "Location", type: "text", placeholder: "e.g. /user-master" },
    { key: "SUB_MENU_SEQ_ID", label: "Sequence", type: "number", placeholder: "e.g. 1" },
    {
      key: "STYLE_CSS",
      label: "Icon",
      type: "text",
      renderField: ({ form, setForm }) => {
        const value = typeof form.STYLE_CSS === 'string' ? form.STYLE_CSS : "";
        return (
          <IconPicker
            value={value}
            onChange={(v) => setForm((prev: any) => ({ ...prev, STYLE_CSS: v }))}
          />
        );
      },
    },
    { key: "PAGE_ACTION", label: "Page Action", type: "text", placeholder: "e.g. UserMaster" },
    {
      key: "IS_PARENT",
      label: "Is Parent",
      type: "select",
      options: [
        { value: "Y", label: "Yes" },
        { value: "N", label: "No" },
      ],
      defaultValue: "N",
    },
    {
      key: "STATUS_MASTER",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "AC" },
        { label: "Inactive", value: "IN" },
      ],
      defaultValue: "AC",
    },
  ], [mainMenuOptions]);

  const storeOverrides = useMemo(() => ({
    data: enrichedSubMenus,
    isLoading: loading,
    add: async (item: SubMenuGridData) => {
      // Coerce numeric fields before sending to backend
      const payload: SubMenuGridData = {
        ...item,
        MAIN_MENU_ID: Number(item.MAIN_MENU_ID) || 0,
        SUB_MENU_SEQ_ID: Number(item.SUB_MENU_SEQ_ID) || 0,
        USER: getUser(),
      };
      const res = await dispatch(addSubMenu(payload)).unwrap();
      dispatch(fetchSubMenus());
      dispatch(refreshNavigationForUser(authUser));
      return res;
    },
    update: async (item: SubMenuGridData) => {
      const payload: SubMenuGridData = {
        ...item,
        MAIN_MENU_ID: Number(item.MAIN_MENU_ID) || 0,
        SUB_MENU_SEQ_ID: Number(item.SUB_MENU_SEQ_ID) || 0,
        USER: getUser(),
      };
      const res = await dispatch(updateSubMenu(payload)).unwrap();
      dispatch(fetchSubMenus());
      dispatch(refreshNavigationForUser(authUser));
      return res;
    },
    remove: async (id: string) => {
      // Cast id to number — SUB_MENU_ID is an integer in the DB
      const res = await dispatch(deleteSubMenu(Number(id))).unwrap();
      dispatch(fetchSubMenus());
      dispatch(refreshNavigationForUser(authUser));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteSubMenu(Number(id))).unwrap();
      }
      dispatch(fetchSubMenus());
      dispatch(refreshNavigationForUser(authUser));
      return res;
    },
  }), [subMenus, loading, dispatch, authUser]);

  return (
    <MasterCrudPage
      title="Sub Menus"
      description="Manage sub navigation menus and their properties"
      idPrefix="SUB"
      domain="sub-menu"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
