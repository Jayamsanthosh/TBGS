"use client";

import { useMemo } from "react";
import * as LucideIcons from "lucide-react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useApiQuery, useApiMutation } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { IconPicker } from "@/components/IconPicker";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { refreshNavigationForUser } from "@/lib/navigationSlice";

interface LinksAndPagesGridData {
  id?: string | number;
  LINK_ID?: number;
  SUB_MENU_ID?: number;
  SUB_MENU_NAME?: string;
  LINK_NAME: string;
  PAGE_ACTION: string;
  REDIRECTION_TYPE: string;
  LINK_LOCATION: string;
  LINK_SEQ_ID: number;
  STYLE_CSS: string;
  STATUS_MASTER: string;
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
const STATUS_LABELS: Record<string, string> = { ACTIVE: "Active", INACTIVE: "Inactive" };

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

const columns = [
  { key: "SUB_MENU_NAME", label: "Sub Menu" },
  { key: "LINK_NAME", label: "Link Name" },
  { key: "PAGE_ACTION", label: "Page Action" },
  { key: "REDIRECTION_TYPE", label: "Redirection Type" },
  { key: "LINK_LOCATION", label: "Location" },
  { key: "LINK_SEQ_ID", label: "Sequence" },
  {
    key: "STYLE_CSS",
    label: "Icon",
    render: (val: string) => {
      const IconComp = (LucideIcons as any)[val];
      return IconComp ? <IconComp className="w-4 h-4" /> : <span className="text-xs text-muted-foreground">{val || "—"}</span>;
    },
  },
  {
    key: "status",
    label: "Status",
    render: (_val: string, item: any) => {
      const raw = item?.STATUS_MASTER || item?.status || "";
      const u = raw.toUpperCase();
      const isActive = u === "ACTIVE" || u === "AC";
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
            isActive
              ? "bg-green-500/10 text-green-600 border border-green-200"
              : "bg-red-500/10 text-red-600 border border-red-200"
          }`}
        >
          {STATUS_LABELS[u] || (isActive ? "Active" : "Inactive")}
        </span>
      );
    },
  },
];

export default function LinksAndPagesPage() {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s: any) => s.auth.user);
  const { data: subMenus } = useApiQuery("sub-menu-dropdown", async () => {
    const res = await fetch(`${API_URL}/sub-menu`);
    if (!res.ok) throw new Error("Failed to fetch sub menus");
    const json = await res.json();
    return (json.data || []).map((m: any) => ({
      ...m,
      id: m.SUB_MENU_ID ?? m.subMenuId,
    }));
  });

  const subMenuOptions = useMemo(() => {
    if (!Array.isArray(subMenus)) return [];
    return subMenus.map((m: any) => ({
      value: Number(m.SUB_MENU_ID ?? m.id),
      label: m.SUB_MENU_NAME || `Sub Menu #${m.id}`,
    }));
  }, [subMenus]);

  const fields: MasterField[] = useMemo(() => [
    {
      key: "SUB_MENU_ID",
      label: "Sub Menu",
      type: "select",
      required: true,
      options: subMenuOptions,
    },
    { key: "LINK_NAME", label: "Link Name", type: "text", required: true, placeholder: "e.g. Dashboard" },
    { key: "PAGE_ACTION", label: "Page Action", type: "text", placeholder: "e.g. Dashboard" },
    {
      key: "REDIRECTION_TYPE",
      label: "Redirection Type",
      type: "select",
      options: [
        { value: "URL", label: "URL" },
        { value: "internal", label: "Internal" },
      ],
      defaultValue: "internal",
    },
    { key: "LINK_LOCATION", label: "Link Location", type: "text", placeholder: "e.g. /dashboard" },
    { key: "LINK_SEQ_ID", label: "Sequence", type: "number", placeholder: "e.g. 1" },
    {
      key: "STYLE_CSS",
      label: "Icon",
      type: "text",
      renderField: ({ form, setForm }) => (
        <IconPicker
          value={form.STYLE_CSS || ""}
          onChange={(v) => setForm((prev: any) => ({ ...prev, STYLE_CSS: v }))}
        />
      ),
    },
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
  ], [subMenuOptions]);

  const { data: rawData, loading } = useApiQuery("links-and-pages-page", async () => {
    const res = await fetch(`${API_URL}/links-and-pages`);
    if (!res.ok) throw new Error("Failed to fetch links and pages");
    const json = await res.json();
    return json.data || [];
  });

  const normalizedSubMenus = useMemo(() => {
    if (!Array.isArray(subMenus)) return new Map<string, any>();
    const map = new Map<string, any>();
    subMenus.forEach((m: any) => {
      const key = String(m.SUB_MENU_NAME || "").trim().toLowerCase();
      if (key && !map.has(key)) map.set(key, m);
    });
    return map;
  }, [subMenus]);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(rawData)) return [];
    return rawData.map((u: any) => {
      const displayStatus = toDisplayStatus(u.STATUS);
      const subMenuName = String(u.SUB_MENU_NAME || "").trim().toLowerCase();
      const matchedSubMenu = subMenuName ? normalizedSubMenus.get(subMenuName) : undefined;
      return {
        ...u,
        id: u.LINK_ID ?? u.linkId,
        LINK_ID: Number(u.LINK_ID),
        SUB_MENU_ID: matchedSubMenu ? Number(matchedSubMenu.SUB_MENU_ID) : u.SUB_MENU_ID,
        SUB_MENU_NAME: matchedSubMenu?.SUB_MENU_NAME || u.SUB_MENU_NAME,
        STATUS_MASTER: displayStatus,
        status: displayStatus,
      };
    });
  }, [rawData, normalizedSubMenus]);

  const sortedData = useMemo(() => {
    return [...enrichedData].sort((a, b) => {
      const aId = Number(a.LINK_ID ?? a.id ?? 0) || 0;
      const bId = Number(b.LINK_ID ?? b.id ?? 0) || 0;
      return bId - aId;
    });
  }, [enrichedData]);

  const { mutateAsync } = useApiMutation(["links-and-pages-page"]);

  const storeOverrides = useMemo(() => ({
    data: sortedData,
    isLoading: loading,
    add: async (item: LinksAndPagesGridData) => {
      const body = { ...item, STATUS_MASTER: toDbStatus(item.STATUS_MASTER), USER: getUser() };
      const res = await mutateAsync(async () => {
        const resp = await fetch(`${API_URL}/links-and-pages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!resp.ok) {
          const errResp = await resp.json().catch(() => ({}));
          throw new Error(errResp.message || "Failed to add link");
        }
        return resp.json();
      });
      dispatch(refreshNavigationForUser(authUser));
      return res;
    },
    update: async (item: LinksAndPagesGridData) => {
      const linkId = Number(item.id) || item.LINK_ID!;
      const body = {
        ...item,
        LINK_ID: linkId,
        STATUS_MASTER: toDbStatus(item.STATUS_MASTER),
        USER: getUser(),
      };
      const res = await mutateAsync(async () => {
        const resp = await fetch(`${API_URL}/links-and-pages/${linkId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!resp.ok) {
          const errResp = await resp.json().catch(() => ({}));
          throw new Error(errResp.message || "Failed to update link");
        }
        return resp.json();
      });
      dispatch(refreshNavigationForUser(authUser));
      return res;
    },
    remove: async (id: string) => {
      const res = await mutateAsync(async () => {
        const resp = await fetch(`${API_URL}/links-and-pages/${id}`, {
          method: "DELETE",
        });
        if (!resp.ok) {
          const errResp = await resp.json().catch(() => ({}));
          throw new Error(errResp.message || "Failed to delete link");
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
          const resp = await fetch(`${API_URL}/links-and-pages/${id}`, {
            method: "DELETE",
          });
          if (!resp.ok) {
            const errResp = await resp.json().catch(() => ({}));
            throw new Error(errResp.message || `Failed to delete link ${id}`);
          }
          return resp.json();
        });
      }
      dispatch(refreshNavigationForUser(authUser));
      return res;
    },
  }), [sortedData, loading, mutateAsync, dispatch, authUser]);

  return (
    <MasterCrudPage
      title="Links & Pages"
      description="Manage links and pages for navigation"
      idPrefix="LNK"
      domain="links-and-pages"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
