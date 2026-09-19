"use client";

import { useMemo, useEffect, useCallback } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchCompanies, addCompany, updateCompany, deleteCompany, clearCompanyError, CompanyGridData } from "@/lib/companyMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MONTHS, TIMEZONES } from "@/lib/utils";
import { validateTin, validateEmail, validateWebsite, validateTanzaniaPhone, formatTanzaniaPhone, cleanPhoneForStorage, enforceValidation } from "@/lib/validation";

const logoFields: Array<{ key: string; label: string }> = [
  { key: "COMP_BIG_LOGO", label: "Big Logo" },
  { key: "COMP_SMALL_LOGO", label: "Small Logo" },
  { key: "COMP_LETTER_HEAD", label: "Letter Head" },
  { key: "COMP_STAMP_LOGO", label: "Stamp Logo" },
];

const fields: MasterField[] = [
  { key: "COMPANY_NAME", label: "Company Name", type: "text", required: true, placeholder: "e.g., TBGS Ltd" },
  { key: "COMPANY_FULL_NAME", label: "Full Company Name", type: "text", placeholder: "e.g., TBGS Limited" },
  { key: "SHORT_CODE", label: "Short Code", type: "text", placeholder: "e.g., TBG", maxLength: 4 },
  { key: "TIN_NUMBER", label: "TIN Number", type: "text", placeholder: "e.g., 123456789", maxLength: 9, formatter: (val: any) => String(val).replace(/\D/g, ""), validate: (value: any) => {
    const v = String(value ?? "");
    if (v && !validateTin(v)) return "TIN Number must be exactly 9 digits";
    return undefined;
  } },
  { key: "VRN_NUMBER", label: "VRN Number", type: "text", placeholder: "e.g., VAT-001" },
  { key: "ADDRESS", label: "Address", type: "textarea", placeholder: "e.g., Dar es Salaam" },
  { key: "CONTACT_PERSON", label: "Contact Person", type: "text", placeholder: "e.g., John Doe" },
  { key: "CONTACT_NUMBER", label: "Contact Number", type: "text", placeholder: "e.g., +255 700 000 000", formatter: formatTanzaniaPhone, storageFormatter: cleanPhoneForStorage, validate: (value: any) => {
    const v = String(value ?? "");
    if (v && !validateTanzaniaPhone(v)) return "Contact Number must be in Tanzania format (e.g., +255XXXXXXXXX)";
    return undefined;
  } },
  { key: "EMAIL", label: "Email", type: "text", placeholder: "e.g., info@tbgs.co.tz", validate: (value: any) => {
    const v = String(value ?? "");
    if (v && !validateEmail(v)) return "Invalid Email format";
    return undefined;
  } },
  { key: "WEBSITE", label: "Website", type: "text", placeholder: "e.g., https://www.tbgs.co.tz", validate: (value: any) => {
    const v = String(value ?? "");
    if (v && !validateWebsite(v)) return "Website must start with http:// or https://";
    return undefined;
  } },
  {
    key: "DEFAULT_CURRENCY_ID",
    label: "Default Currency",
    type: "select",
    options: [],
  },
  {
    key: "FINANCE_START_MONTH",
    label: "Finance Start Month",
    type: "select",
    options: MONTHS,
  },
  {
    key: "FINANCE_END_MONTH",
    label: "Finance End Month",
    type: "select",
    options: MONTHS,
  },
  { key: "YEAR_CODE", label: "Year Code", type: "text", placeholder: "e.g., FY2026" },
  { key: "TIMEZONE", label: "Timezone", type: "select", options:TIMEZONES
    
   },
  { key: "NO_OF_USER", label: "No of Users", type: "number", placeholder: "e.g., 10" },
  { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Additional notes..." },
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
  ...logoFields.map((lf) => ({
    key: lf.key,
    label: lf.label,
    type: "text" as const,
    renderField: (props: {
      field: MasterField;
      form: Record<string, any>;
      setForm: React.Dispatch<React.SetStateAction<Record<string, any>>>;
      editing: any;
    }) => {
      const { field, form, setForm } = props;
      return (
        <div className="space-y-2" key={field.key}>
          <label className="text-sm font-medium">{field.label}</label>
          {form[field.key] && (
            <div className="mb-2">
              <img
                src={`data:image/png;base64,${form[field.key]}`}
                alt={field.label}
                className="max-h-20 rounded border"
              />
            </div>
          )}
          <Input
            type="file"
            accept="image/*"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(",")[1] || "";
                setForm((prev: any) => ({ ...prev, [field.key]: base64 }));
              };
              reader.readAsDataURL(file);
            }}
          />
          {form[field.key] && (
            <button
              type="button"
              className="text-xs text-red-500 hover:underline"
              onClick={() => setForm((prev: any) => ({ ...prev, [field.key]: "" }))}
            >
              Remove
            </button>
          )}
        </div>
      );
    },
  })),
];

const columns = [
  { key: "COMPANY_NAME", label: "Company Name" },
  { key: "SHORT_CODE", label: "Code" },
  { key: "TIN_NUMBER", label: "TIN" },
  { key: "CONTACT_PERSON", label: "Contact" },
  { key: "CONTACT_NUMBER", label: "Phone" },
  { key: "CURRENCY_NAME", label: "Currency" },
  { key: "NO_OF_USER", label: "Users" },
  {
    key: "STATUS_MASTER",
    label: "Status",
    render: (val: any) => {
      const sv = String(val || "").toLowerCase();
      const colorClass = sv === "active"
        ? "bg-green-500/10 text-green-600 border-green-200"
        : "bg-red-500/10 text-red-600 border-red-200";
      return (
        <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
          {sv === "active" ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
];

export default function CompanyMasterPage() {
  const dispatch = useAppDispatch();
  const { companies, loading, error } = useAppSelector((s) => s.company);
  const { toast } = useToast();

  const { data: currencies } = useApiQuery("company-currency-list", async () => {
    const res = await fetch(`${API_URL}/currency-master`);
    if (!res.ok) throw new Error("Failed to fetch currencies");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.CURRENCY_ID }));
  });

  const currencyOptions = useMemo(() => {
    if (!Array.isArray(currencies)) return [];
    return currencies.map((c: any) => ({
      value: String(c.CURRENCY_ID),
      label: `${c.CURRENCY_NAME}${c.REMARKS ? ` (${c.REMARKS})` : ""}`,
    }));
  }, [currencies]);

  const fieldsWithOptions: MasterField[] = useMemo(() => {
    return fields.map((f) => {
      if (f.key === "DEFAULT_CURRENCY_ID") {
        return { ...f, options: currencyOptions };
      }
      return f;
    });
  }, [currencyOptions]);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(companies)) return [];
    return companies.map((u: any) => {
      const currency = Array.isArray(currencies)
        ? currencies.find((c: any) => Number(c.CURRENCY_ID) === Number(u.DEFAULT_CURRENCY_ID))
        : undefined;
      return {
        ...u,
        CURRENCY_NAME: currency?.CURRENCY_NAME || currency?.REMARKS || `ID: ${u.DEFAULT_CURRENCY_ID}`,
      };
    });
  }, [companies, currencies]);

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearCompanyError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: CompanyGridData) => {
      const res = await dispatch(addCompany(item)).unwrap();
      dispatch(fetchCompanies());
      return res;
    },
    update: async (item: CompanyGridData) => {
      const res = await dispatch(updateCompany(item)).unwrap();
      dispatch(fetchCompanies());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteCompany(id)).unwrap();
      dispatch(fetchCompanies());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteCompany(id)).unwrap();
      }
      dispatch(fetchCompanies());
      return res;
    },
  }), [enrichedData, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Company Master"
      description="Manage company master data"
      idPrefix="CMP"
      domain="company-master"
      fields={fieldsWithOptions}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      onSaveValidate={(form) => { try { enforceValidation(form); return undefined; } catch (e: any) { return e?.message; } }}
    />
  );
}
