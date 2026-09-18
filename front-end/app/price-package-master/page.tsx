"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchPricePackages, addPricePackage, updatePricePackage, deletePricePackage, clearPricePackageError, PricePackageGridData } from "@/lib/pricePackageMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  {
    key: "PRICE_PACKAGE_TYPE",
    label: "Package Type",
    type: "text",
    placeholder: "e.g., Hunting, Fishing"
  },
  {
    key: "PRICE_PACKAGE_NAME",
    label: "Package Name",
    type: "text",
    required: true,
    placeholder: "e.g., Premium Hunt Package"
  },
  {
    key: "PRICE_PACKAGE_DAYS",
    label: "Package Days",
    type: "number",
    placeholder: "e.g., 7"
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
  { key: "PRICE_PACKAGE_TYPE", label: "Package Type" },
  { key: "PRICE_PACKAGE_NAME", label: "Package Name" },
  {
    key: "PRICE_PACKAGE_DAYS",
    label: "Days",
    render: (val: any) => {
      const n = val === null || val === undefined ? "" : Number(val);
      return n !== "" && !isNaN(n) ? `${n} day${n === 1 ? "" : "s"}` : "-";
    },
  },
  { key: "REMARKS", label: "Remarks" },
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

export default function PricePackageMasterPage() {
  const dispatch = useAppDispatch();
  const { pricePackages, loading, error } = useAppSelector((s) => s.pricePackages);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchPricePackages());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearPricePackageError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: pricePackages,
    isLoading: loading,
    add: async (item: PricePackageGridData) => {
      const res = await dispatch(addPricePackage(item)).unwrap();
      dispatch(fetchPricePackages());
      return res;
    },
    update: async (item: PricePackageGridData) => {
      const res = await dispatch(updatePricePackage(item)).unwrap();
      dispatch(fetchPricePackages());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deletePricePackage(id)).unwrap();
      dispatch(fetchPricePackages());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deletePricePackage(id)).unwrap();
      }
      dispatch(fetchPricePackages());
      return res;
    },
  }), [pricePackages, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Price Package Master"
      description="Manage price package master data"
      idPrefix="PP"
      domain="price-package-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
