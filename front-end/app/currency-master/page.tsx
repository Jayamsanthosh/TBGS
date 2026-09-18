"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchCurrencies, addCurrency, updateCurrency, deleteCurrency, clearCurrenciesError, CurrencyGridData } from "@/lib/currencyMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  { key: "CURRENCY_NAME", label: "Currency Name", type: "text", required: true, placeholder: "e.g., USD" },
  { key: "ADDRESS", label: "Address", type: "text", placeholder: "e.g., United States" },
  {
    key: "Exchange_Rate",
    label: "Exchange Rate",
    type: "number",
    placeholder: "e.g., 1.00000",
    formatter: (val: any) => {
      if (val === "" || val === undefined || val === null) return "";
      const n = parseFloat(String(val));
      return isNaN(n) ? "" : n.toFixed(5);
    },
  },
  { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks" },
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
  { key: "CURRENCY_NAME", label: "Currency Name" },
  { key: "ADDRESS", label: "Address" },
  { key: "Exchange_Rate", label: "Exchange Rate" },
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

export default function CurrencyMasterPage() {
  const dispatch = useAppDispatch();
  const { currencies, loading, error } = useAppSelector((s) => s.currencies);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchCurrencies());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearCurrenciesError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: currencies,
    isLoading: loading,
    add: async (item: CurrencyGridData) => {
      const res = await dispatch(addCurrency(item)).unwrap();
      dispatch(fetchCurrencies());
      return res;
    },
    update: async (item: CurrencyGridData) => {
      const res = await dispatch(updateCurrency(item)).unwrap();
      dispatch(fetchCurrencies());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteCurrency(id)).unwrap();
      dispatch(fetchCurrencies());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteCurrency(id)).unwrap();
      }
      dispatch(fetchCurrencies());
      return res;
    },
  }), [currencies, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Currencies"
      description="Manage currency master data"
      idPrefix="CUR"
      domain="currency-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
