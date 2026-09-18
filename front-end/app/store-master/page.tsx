"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchStores, addStore, updateStore, deleteStore, clearStoreError, StoreGridData } from "@/lib/storeMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { validateEmail, enforceStoreValidation } from "@/lib/validation";

const fields: MasterField[] = [
  {
    key: "STORE_NAME",
    label: "Store Name",
    type: "text",
    required: true,
    placeholder: "e.g., Main Store"
  },
  {
    key: "STORE_SHORT_NAME",
    label: "Short Name",
    type: "text",
    placeholder: "e.g., Main"
  },
  {
    key: "CAMP_ID",
    label: "Camp",
    type: "select",
    options: [],
  },
  {
    key: "MANAGER_NAME",
    label: "Manager Name",
    type: "text",
    placeholder: "e.g., John Doe"
  },
  {
    key: "STORE_SHORT_CODE",
    label: "Short Code",
    type: "text",
    placeholder: "e.g., MS01",
    maxLength: 5,
  },
  {
    key: "EMAIL_ADDRESS",
    label: "Email",
    type: "text",
    placeholder: "store@example.com",
    validate: (value: any) => {
      const v = String(value ?? "");
      if (v && !validateEmail(v)) return "Invalid Email format";
      return undefined;
    },
  },
  {
    key: "CC_EMAIL_ADDRESS",
    label: "CC Email",
    type: "text",
    placeholder: "cc@example.com",
    validate: (value: any) => {
      const v = String(value ?? "");
      if (v && !validateEmail(v)) return "Invalid CC Email format";
      return undefined;
    },
  },
  {
    key: "BCC_EMAIL_ADDRESS",
    label: "BCC Email",
    type: "text",
    placeholder: "bcc@example.com",
    validate: (value: any) => {
      const v = String(value ?? "");
      if (v && !validateEmail(v)) return "Invalid BCC Email format";
      return undefined;
    },
  },
  {
    key: "RESPONSE_DIRECTORS_NAME",
    label: "Response Director",
    type: "text",
    placeholder: "Director Name"
  },
  {
    key: "REMARKS",
    label: "Remarks",
    type: "textarea",
    placeholder: "Additional notes..."
  },
  {
    key: "STATUS_MASTER",
    label: "Status",
    type: "select",
    options: [
      { label: "Active", value: "ACTIVE" },
      { label: "Inactive", value: "INACTIVE" }
    ],
    defaultValue: "ACTIVE",
    formatter: (val: any) => {
      const s = String(val || "").toLowerCase();
      if (s === "ac") return "ACTIVE";
      if (s === "in") return "INACTIVE";
      return val;
    },
  },
];

const columns = [
  { key: "STORE_NAME", label: "Store Name" },
  { key: "STORE_SHORT_NAME", label: "Short Name" },
  { key: "CAMP_NAME", label: "Camp" },
  { key: "MANAGER_NAME", label: "Manager" },
  { key: "STORE_SHORT_CODE", label: "Code" },
  { key: "EMAIL_ADDRESS", label: "Email" },
  { key: "RESPONSE_DIRECTORS_NAME", label: "Director" },
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

export default function StoreMasterPage() {
  const dispatch = useAppDispatch();
  const { stores, loading, error } = useAppSelector((s) => s.store);
  const { toast } = useToast();

  const { data: camps } = useApiQuery("store-camp-list", async () => {
    const res = await fetch(`${API_URL}/camp-master`);
    if (!res.ok) throw new Error("Failed to fetch camps");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.CAMP_ID }));
  });

  const campOptions = useMemo(() => {
    if (!Array.isArray(camps)) return [];
    return camps.map((c: any) => ({
      value: String(c.CAMP_ID),
      label: c.CAMP_NAME || `Camp #${c.CAMP_ID}`,
    }));
  }, [camps]);

  const fieldsWithOptions: MasterField[] = useMemo(() => {
    return fields.map((f) => {
      if (f.key === "CAMP_ID") {
        return { ...f, options: campOptions };
      }
      return f;
    });
  }, [campOptions]);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(stores)) return [];
    return stores.map((u: any) => {
      const camp = Array.isArray(camps)
        ? camps.find((c: any) => Number(c.CAMP_ID) === Number(u.Camp_Id))
        : undefined;
      return {
        id: u.Store_Id,
        STORE_ID: u.Store_Id,
        STORE_NAME: u.Store_Name,
        STORE_SHORT_NAME: u.Store_Short_Name,
        CAMP_ID: String(u.Camp_Id),
        MANAGER_NAME: u.Manager_Name,
        STORE_SHORT_CODE: u.Store_Short_Code,
        EMAIL_ADDRESS: u.Email_Address,
        CC_EMAIL_ADDRESS: u.CC_Email_Address,
        BCC_EMAIL_ADDRESS: u.BCC_Email_Address,
        RESPONSE_DIRECTORS_NAME: u.Response_Directors_Name,
        REMARKS: u.Remarks,
        STATUS_MASTER: u.Status_Master,
        CAMP_NAME: camp?.CAMP_NAME || `ID: ${u.Camp_Id}`,
      };
    });
  }, [stores, camps]);

  useEffect(() => {
    dispatch(fetchStores());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearStoreError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: StoreGridData) => {
      const res = await dispatch(addStore(item)).unwrap();
      dispatch(fetchStores());
      return res;
    },
    update: async (item: StoreGridData) => {
      const res = await dispatch(updateStore(item)).unwrap();
      dispatch(fetchStores());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteStore(id)).unwrap();
      dispatch(fetchStores());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteStore(id)).unwrap();
      }
      dispatch(fetchStores());
      return res;
    },
  }), [enrichedData, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Store Master"
      description="Manage store master data"
      idPrefix="STR"
      domain="store-master"
      fields={fieldsWithOptions}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      onSaveValidate={(form) => { try { enforceStoreValidation(form); return undefined; } catch (e: any) { return e?.message; } }}
    />
  );
}
