"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchPermitAuthorities, addPermitAuthority, updatePermitAuthority, deletePermitAuthority, clearPermitAuthoritiesError, PermitAuthorityGridData } from "@/lib/permitAuthorityMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { validateEmail, validateWebsite, validateTanzaniaPhone, formatTanzaniaPhone, cleanPhoneForStorage } from "@/lib/validation";

const fields: MasterField[] = [
  {
    key: "PERMIT_AUTHORITY_NAME",
    label: "Permit Authority Name",
    type: "text",
    required: true,
    placeholder: "e.g., Ngorongoro Conservation Area Authority",
    maxLength: 150,
    validate: (val: any) => {
      const v = String(val ?? "").trim();
      if (!v) return undefined;
      if (v.length < 2) return "Permit Authority Name must be at least 2 characters";
      if (v.length > 150) return "Permit Authority Name cannot exceed 150 characters";
      return undefined;
    },
  },
  {
    key: "COUNTRY_ID",
    label: "Country",
    type: "searchable",
    required: true,
    options: [],
  },
  {
    key: "CONTACT_PERSON",
    label: "Contact Person",
    type: "text",
    placeholder: "e.g., John Doe",
    maxLength: 100,
    validate: (val: any) => {
      const v = String(val ?? "").trim();
      if (!v) return undefined;
      if (v.length < 2) return "Contact Person must be at least 2 characters";
      if (!/^[A-Za-z][A-Za-z .'-]*$/.test(v)) return "Contact Person can contain only letters, spaces, dots and hyphens";
      if (v.length > 100) return "Contact Person cannot exceed 100 characters";
      return undefined;
    },
  },
  {
    key: "CONTACT_NUMBER",
    label: "Contact Number",
    type: "text",
    placeholder: "e.g., +255 700 000 000",
    maxLength: 16,
    formatter: formatTanzaniaPhone,
    storageFormatter: cleanPhoneForStorage,
    validate: (value: any) => {
      const v = String(value ?? "");
      if (v && !validateTanzaniaPhone(v)) return "Contact Number must be in Tanzania format (e.g., +255700000000)";
      return undefined;
    },
  },
  {
    key: "EMAIL",
    label: "Email",
    type: "text",
    placeholder: "e.g., info@example.com",
    maxLength: 100,
    validate: (value: any) => {
      const v = String(value ?? "");
      if (v && !validateEmail(v)) return "Enter a valid email address";
      if (v.length > 100) return "Email cannot exceed 100 characters";
      return undefined;
    },
  },
  {
    key: "WEBSITE",
    label: "Website",
    type: "text",
    placeholder: "e.g., https://www.example.com",
    maxLength: 200,
    validate: (value: any) => {
      const v = String(value ?? "").trim();
      if (!v) return undefined;
      if (!validateWebsite(v)) return "Website must start with http:// or https://";
      if (v.length > 200) return "Website cannot exceed 200 characters";
      return undefined;
    },
  },
  {
    key: "ADDRESS",
    label: "Address",
    type: "textarea",
    placeholder: "Enter address",
    validate: (val: any) => {
      const v = String(val ?? "").trim();
      if (!v) return undefined;
      if (v.length > 500) return "Address cannot exceed 500 characters";
      return undefined;
    },
  },
  {
    key: "REMARKS",
    label: "Remarks",
    type: "textarea",
    placeholder: "Enter any remarks",
    validate: (val: any) => {
      const v = String(val ?? "").trim();
      if (!v) return undefined;
      if (v.length > 100) return "Remarks cannot exceed 100 characters";
      return undefined;
    },
  },
  {
    key: "STATUS_MASTER",
    label: "Status",
    type: "select",
    options: [{ label: "Active", value: "ACTIVE" }, { label: "Inactive", value: "INACTIVE" }],
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
  { key: "PERMIT_AUTHORITY_NAME", label: "Permit Authority Name" },
  { key: "COUNTRY_NAME", label: "Country" },
  { key: "CONTACT_PERSON", label: "Contact Person" },
  { key: "CONTACT_NUMBER", label: "Contact Number" },
  { key: "EMAIL", label: "Email" },
  { key: "WEBSITE", label: "Website" },
  { key: "ADDRESS", label: "Address" },
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

export default function PermitAuthorityMasterPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.permitAuthorityMaster);
  const { toast } = useToast();

  const { data: countries } = useApiQuery("permit-authority-country-list", async () => {
    const res = await fetch(`${API_URL}/country-master`);
    if (!res.ok) throw new Error("Failed to fetch countries");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.Country_Id }));
  });

  const countryOptions = useMemo(() => {
    if (!Array.isArray(countries)) return [];
    return countries.map((c: any) => ({
      value: String(c.Country_Id),
      label: c.Country_Name || `Country #${c.Country_Id}`,
    }));
  }, [countries]);

  const fieldsWithOptions: MasterField[] = useMemo(() => {
    return fields.map((f) => {
      if (f.key === "COUNTRY_ID") {
        return { ...f, options: countryOptions };
      }
      return f;
    });
  }, [countryOptions]);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.map((u: any) => {
      const country = Array.isArray(countries)
        ? countries.find((c: any) => Number(c.Country_Id) === Number(u.COUNTRY_ID))
        : undefined;
      return {
        id: u.PERMIT_AUTHORITY_ID,
        PERMIT_AUTHORITY_ID: u.PERMIT_AUTHORITY_ID,
        PERMIT_AUTHORITY_NAME: u.PERMIT_AUTHORITY_NAME,
        COUNTRY_ID: u.COUNTRY_ID != null ? String(u.COUNTRY_ID) : "",
        CONTACT_PERSON: u.CONTACT_PERSON,
        CONTACT_NUMBER: u.CONTACT_NUMBER,
        EMAIL: u.EMAIL,
        WEBSITE: u.WEBSITE,
        ADDRESS: u.ADDRESS,
        REMARKS: u.REMARKS,
        STATUS_MASTER: u.STATUS_MASTER,
        COUNTRY_NAME: country?.Country_Name || u.COUNTRY_NAME || `ID: ${u.COUNTRY_ID}`,
      };
    });
  }, [items, countries]);

  useEffect(() => {
    dispatch(fetchPermitAuthorities());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearPermitAuthoritiesError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: PermitAuthorityGridData) => {
      const res = await dispatch(addPermitAuthority(item)).unwrap();
      dispatch(fetchPermitAuthorities());
      return res;
    },
    update: async (item: PermitAuthorityGridData) => {
      const res = await dispatch(updatePermitAuthority(item)).unwrap();
      dispatch(fetchPermitAuthorities());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deletePermitAuthority(id)).unwrap();
      dispatch(fetchPermitAuthorities());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deletePermitAuthority(id)).unwrap();
      }
      dispatch(fetchPermitAuthorities());
      return res;
    },
  }), [enrichedData, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Permit Authority Master"
      description="Manage permit authority master data"
      idPrefix="PA"
      domain="permit-authority-master"
      fields={fieldsWithOptions}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}