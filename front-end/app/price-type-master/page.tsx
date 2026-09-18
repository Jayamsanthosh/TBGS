"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchPriceTypes, addPriceType, updatePriceType, deletePriceType, clearPriceTypeError, PriceTypeGridData } from "@/lib/priceTypeMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  {
    key: "PRICE_TYPE_NAME",
    label: "Price Type Name",
    type: "text",
    required: true,
    placeholder: "e.g., Hunt With Gun"
  },
  {
    key: "PRICE_TYPE_DESCRIPTION",
    label: "Description",
    type: "text",
    placeholder: "e.g., Hunting package with firearm"
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
  { key: "PRICE_TYPE_NAME", label: "Price Type Name" },
  { key: "PRICE_TYPE_DESCRIPTION", label: "Description" },
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

export default function PriceTypeMasterPage() {
  const dispatch = useAppDispatch();
  const { priceTypes, loading, error } = useAppSelector((s) => s.priceTypes);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchPriceTypes());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearPriceTypeError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: priceTypes,
    isLoading: loading,
    add: async (item: PriceTypeGridData) => {
      const res = await dispatch(addPriceType(item)).unwrap();
      dispatch(fetchPriceTypes());
      return res;
    },
    update: async (item: PriceTypeGridData) => {
      const res = await dispatch(updatePriceType(item)).unwrap();
      dispatch(fetchPriceTypes());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deletePriceType(id)).unwrap();
      dispatch(fetchPriceTypes());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deletePriceType(id)).unwrap();
      }
      dispatch(fetchPriceTypes());
      return res;
    },
  }), [priceTypes, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Price Type Master"
      description="Manage price type master data"
      idPrefix="PT"
      domain="price-type-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
