"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchTruckTypes,
  addTruckType,
  updateTruckType,
  deleteTruckType,
  clearTruckTypeError,
  TruckTypeGridData,
} from "@/lib/truckTypeMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  { key: "TRUCK_TYPE_NAME", label: "Truck Type Name", type: "text", required: true, placeholder: "e.g., Flatbed Truck", maxLength: 50 },
  { key: "TRUCK_TYPE_DESCRIPTION", label: "Description", type: "text", placeholder: "e.g., Flatbed transport truck", maxLength: 50 },
  { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks" },
  {
    key: "STATUS_MASTER",
    label: "Status",
    type: "select",
    options: [{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }],
    defaultValue: "AC",
    formatter: (val: any) => {
      const s = String(val || "").toUpperCase();
      if (s === "AC") return "ACTIVE";
      if (s === "IN") return "INACTIVE";
      return val;
    },
  },
];

const columns = [
  { key: "TRUCK_TYPE_NAME", label: "Truck Type Name" },
  { key: "TRUCK_TYPE_DESCRIPTION", label: "Description" },
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

export default function TruckTypeMasterPage() {
  const dispatch = useAppDispatch();
  const { truckTypes, loading, error } = useAppSelector((s) => s.truckType);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchTruckTypes("ALL"));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearTruckTypeError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: truckTypes,
    isLoading: loading,
    add: async (item: TruckTypeGridData) => {
      const res = await dispatch(addTruckType(item)).unwrap();
      dispatch(fetchTruckTypes("ALL"));
      return res;
    },
    update: async (item: TruckTypeGridData) => {
      const res = await dispatch(updateTruckType(item)).unwrap();
      dispatch(fetchTruckTypes("ALL"));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteTruckType(id)).unwrap();
      dispatch(fetchTruckTypes("ALL"));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteTruckType(id)).unwrap();
      }
      dispatch(fetchTruckTypes("ALL"));
      return res;
    },
  }), [truckTypes, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Truck Type Master"
      description="Manage truck type master data"
      idPrefix="TRK"
      domain="truck-type-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }]}
    />
  );
}
