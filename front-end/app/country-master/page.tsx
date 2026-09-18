"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchCountries, addCountry, updateCountry, deleteCountry, clearCountriesError, CountryGridData } from "@/lib/countryMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  { key: "Country_Name", label: "Country Name", type: "text", required: true, placeholder: "e.g., India" },
  { key: "nicename", label: "Nice Name", type: "text", placeholder: "e.g., India" },
  { key: "iso3", label: "ISO3 Code", type: "text", placeholder: "e.g., IND", maxLength: 3 },
  { key: "numcode", label: "Num Code", type: "number", placeholder: "e.g., 356" },
  { key: "phonecode", label: "Phone Code", type: "number", placeholder: "e.g., 91" },
  { key: "Batch_No", label: "Batch No", type: "text", placeholder: "e.g., B1", maxLength: 2 },
  { key: "Remarks", label: "Remarks", type: "textarea", placeholder: "Enter any remarks" },
  {
    key: "Status_Master",
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
  { key: "Country_Name", label: "Country Name" },
  { key: "nicename", label: "Nice Name" },
  { key: "iso3", label: "ISO3" },
  { key: "numcode", label: "Num Code" },
  { key: "phonecode", label: "Phone Code" },
  { key: "Batch_No", label: "Batch No" },
  { key: "Remarks", label: "Remarks" },
  {
    key: "Status_Master",
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

export default function CountryMasterPage() {
  const dispatch = useAppDispatch();
  const { countries, loading, error } = useAppSelector((s) => s.countries);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchCountries());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearCountriesError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: countries,
    isLoading: loading,
    add: async (item: CountryGridData) => {
      const res = await dispatch(addCountry(item)).unwrap();
      dispatch(fetchCountries());
      return res;
    },
    update: async (item: CountryGridData) => {
      const res = await dispatch(updateCountry(item)).unwrap();
      dispatch(fetchCountries());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteCountry(id)).unwrap();
      dispatch(fetchCountries());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteCountry(id)).unwrap();
      }
      dispatch(fetchCountries());
      return res;
    },
  }), [countries, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Country Master"
      description="Manage country master data"
      idPrefix="CTY"
      domain="country-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
