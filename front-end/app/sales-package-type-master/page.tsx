"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchSalesPackageTypes, addSalesPackageType, updateSalesPackageType, deleteSalesPackageType, clearSalesPackageTypeError, SalesPackageTypeGridData } from "@/lib/salesPackageTypeMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  {
    key: "SALES_PACKAGE_TYPE_NAME",
    label: "Sales Package Type Name",
    type: "text",
    required: true,
    placeholder: "e.g., Premium Package"
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
      { label: "Active", value: "AC" },
      { label: "Inactive", value: "IN" }
    ],
    defaultValue: "AC",
    formatter: (val: any) => {
      const s = String(val || "").toLowerCase();
      if (s === "active" || s === "ac") return "AC";
      if (s === "inactive" || s === "in") return "IN";
      return val;
    },
  },
];

const columns = [
  { key: "SALES_PACKAGE_TYPE_NAME", label: "Sales Package Type Name" },
  { key: "REMARKS", label: "Remarks" },
  {
    key: "STATUS_MASTER",
    label: "Status",
    render: (val: any) => {
      const sv = String(val || "").toLowerCase();
      const colorClass = sv === "active" || sv === "ac"
        ? "bg-green-500/10 text-green-600 border-green-200"
        : "bg-red-500/10 text-red-600 border-red-200";
      return (
        <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
          {sv === "active" || sv === "ac" ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
];

export default function SalesPackageTypeMasterPage() {
  const dispatch = useAppDispatch();
  const { salesPackageTypes, loading, error } = useAppSelector((s) => s.salesPackageTypes);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchSalesPackageTypes());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearSalesPackageTypeError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: salesPackageTypes,
    isLoading: loading,
    add: async (item: SalesPackageTypeGridData) => {
      const res = await dispatch(addSalesPackageType(item)).unwrap();
      dispatch(fetchSalesPackageTypes());
      return res;
    },
    update: async (item: SalesPackageTypeGridData) => {
      const res = await dispatch(updateSalesPackageType(item)).unwrap();
      dispatch(fetchSalesPackageTypes());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteSalesPackageType(id)).unwrap();
      dispatch(fetchSalesPackageTypes());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteSalesPackageType(id)).unwrap();
      }
      dispatch(fetchSalesPackageTypes());
      return res;
    },
  }), [salesPackageTypes, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Sales Package Type Master"
      description="Manage sales package type master data"
      idPrefix="SPT"
      domain="sales-package-type-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
