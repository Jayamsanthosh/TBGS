"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchPriceLists, addPriceList, updatePriceList, deletePriceList, clearPriceListError, PriceListGridData } from "@/lib/priceListMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/validation";

const fields: MasterField[] = [
  {
    key: "PRICE_TYPE_ID",
    label: "Price Type",
    type: "select",
    options: [],
    required: true,
  },
  {
    key: "COMPANY_ID",
    label: "Company",
    type: "select",
    options: [],
    required: true,
  },
  {
    key: "PRICE_PACKAGE_ID",
    label: "Price Package",
    type: "select",
    options: [],
  },
  {
    key: "CURRENCY_ID",
    label: "Currency",
    type: "select",
    options: [],
  },
  {
    key: "PER_DAY_OR_TRIP_OR_QTY_PRICE",
    label: "Per Day / Trip / Qty Price",
    type: "number",
    placeholder: "0.00"
  },
  {
    key: "FOOD_LIMIT_AMOUNT",
    label: "Food Limit Amount",
    type: "number",
    placeholder: "0.00"
  },
  {
    key: "DRINKS_LIMIT_AMOUNT",
    label: "Drinks Limit Amount",
    type: "number",
    placeholder: "0.00"
  },
  {
    key: "ACCOMDATION_LIMIT_AMOUNT",
    label: "Accommodation Limit Amount",
    type: "number",
    placeholder: "0.00"
  },
  {
    key: "EFFECTIVE_FROM",
    label: "Effective From",
    type: "date",
  },
  {
    key: "EFFECTIVE_TO",
    label: "Effective To",
    type: "date",
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
  { key: "PRICE_TYPE_NAME", label: "Price Type" },
  { key: "COMPANY_NAME", label: "Company" },
  { key: "PRICE_PACKAGE_NAME", label: "Package" },
  { key: "CURRENCY_NAME", label: "Currency" },
  {
    key: "PER_DAY_OR_TRIP_OR_QTY_PRICE",
    label: "Price",
    render: (val: any) => {
      const n = Number(val);
      return isNaN(n) ? "-" : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
  },
  {
    key: "EFFECTIVE_FROM",
    label: "From",
    render: (val: any) => formatDate(val),
  },
  {
    key: "EFFECTIVE_TO",
    label: "To",
    render: (val: any) => formatDate(val),
  },
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

export default function PriceListMasterPage() {
  const dispatch = useAppDispatch();
  const { priceLists, loading, error } = useAppSelector((s) => s.priceLists);
  const { toast } = useToast();

  const { data: priceTypes } = useApiQuery("pl-price-types", async () => {
    const res = await fetch(`${API_URL}/price-type-master`);
    if (!res.ok) throw new Error("Failed to fetch price types");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.PRICE_TYPE_ID }));
  });

  const { data: companies } = useApiQuery("pl-companies", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    if (!res.ok) throw new Error("Failed to fetch companies");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.COMPANY_ID }));
  });

  const { data: packages } = useApiQuery("pl-packages", async () => {
    const res = await fetch(`${API_URL}/price-package-master`);
    if (!res.ok) throw new Error("Failed to fetch packages");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.PRICE_PACKAGE_ID }));
  });

  const { data: currencies } = useApiQuery("pl-currencies", async () => {
    const res = await fetch(`${API_URL}/currency-master`);
    if (!res.ok) throw new Error("Failed to fetch currencies");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.CURRENCY_ID }));
  });

  const priceTypeOptions = useMemo(() =>
    (Array.isArray(priceTypes) ? priceTypes : []).map((c: any) => ({
      value: String(c.PRICE_TYPE_ID), label: c.PRICE_TYPE_NAME || `#${c.PRICE_TYPE_ID}`,
    })), [priceTypes]);

  const companyOptions = useMemo(() =>
    (Array.isArray(companies) ? companies : []).map((c: any) => ({
      value: String(c.COMPANY_ID), label: c.COMPANY_NAME || `#${c.COMPANY_ID}`,
    })), [companies]);

  const packageOptions = useMemo(() =>
    (Array.isArray(packages) ? packages : []).map((c: any) => ({
      value: String(c.PRICE_PACKAGE_ID), label: c.PRICE_PACKAGE_NAME || `#${c.PRICE_PACKAGE_ID}`,
    })), [packages]);

  const currencyOptions = useMemo(() =>
    (Array.isArray(currencies) ? currencies : []).map((c: any) => ({
      value: String(c.CURRENCY_ID), label: c.CURRENCY_NAME || `#${c.CURRENCY_ID}`,
    })), [currencies]);

  const fieldsWithOptions: MasterField[] = useMemo(() =>
    fields.map((f) => {
      if (f.key === "PRICE_TYPE_ID") return { ...f, options: priceTypeOptions };
      if (f.key === "COMPANY_ID") return { ...f, options: companyOptions };
      if (f.key === "PRICE_PACKAGE_ID") return { ...f, options: packageOptions };
      if (f.key === "CURRENCY_ID") return { ...f, options: currencyOptions };
      return f;
    }), [priceTypeOptions, companyOptions, packageOptions, currencyOptions]);

  useEffect(() => {
    dispatch(fetchPriceLists());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearPriceListError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: priceLists,
    isLoading: loading,
    add: async (item: PriceListGridData) => {
      const res = await dispatch(addPriceList(item)).unwrap();
      dispatch(fetchPriceLists());
      return res;
    },
    update: async (item: PriceListGridData) => {
      const res = await dispatch(updatePriceList(item)).unwrap();
      dispatch(fetchPriceLists());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deletePriceList(id)).unwrap();
      dispatch(fetchPriceLists());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deletePriceList(id)).unwrap();
      }
      dispatch(fetchPriceLists());
      return res;
    },
  }), [priceLists, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Price List Master"
      description="Manage price list master data"
      idPrefix="PL"
      domain="price-list-master"
      fields={fieldsWithOptions}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
