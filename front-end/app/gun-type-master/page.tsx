"use client";

import { useMemo, useEffect, useCallback, useState } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchGunTypes,
  addGunType,
  updateGunType,
  deleteGunType,
  clearGunTypeError,
  GunTypeGridData,
} from "@/lib/gunTypeMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  { key: "TYPE_NAME", label: "Type Name", type: "text", required: true, placeholder: "e.g., BOLT ACTION" },
  { key: "DESCRIPTION", label: "Description", type: "text", placeholder: "e.g., Rifle Gun Type" },
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
  { key: "TYPE_NAME", label: "Type Name" },
  { key: "DESCRIPTION", label: "Description" },
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

export default function GunTypeMasterPage() {
  const dispatch = useAppDispatch();
  const { gunTypes, loading, error } = useAppSelector((s) => s.gunType);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("AC");

  useEffect(() => {
    dispatch(fetchGunTypes(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearGunTypeError());
    }
  }, [error, dispatch, toast]);

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "AC");
  }, []);

  const storeOverrides = useMemo(() => ({
    data: gunTypes,
    isLoading: loading,
    add: async (item: GunTypeGridData) => {
      const res = await dispatch(addGunType(item)).unwrap();
      dispatch(fetchGunTypes(currentStatus));
      return res;
    },
    update: async (item: GunTypeGridData) => {
      const res = await dispatch(updateGunType(item)).unwrap();
      dispatch(fetchGunTypes(currentStatus));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteGunType(id)).unwrap();
      dispatch(fetchGunTypes(currentStatus));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteGunType(id)).unwrap();
      }
      dispatch(fetchGunTypes(currentStatus));
      return res;
    },
  }), [gunTypes, loading, dispatch, currentStatus]);

  return (
    <MasterCrudPage
      title="Gun Type Master"
      description="Manage gun type master data"
      idPrefix="GNT"
      domain="gun-type-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }]}
      onStatusFilterChange={handleStatusFilterChange}
    />
  );
}
