"use client";

import { useMemo, useEffect, useCallback, useState } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchBusBoardingLocations,
  addBusBoardingLocation,
  updateBusBoardingLocation,
  deleteBusBoardingLocation,
  clearBusBoardingLocationError,
  BusBoardingLocationGridData,
} from "@/lib/busBoardingLocationMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  { key: "BUS_BOARDING_LOCATION_NAME", label: "Location Name", type: "text", required: true, placeholder: "e.g., Chennai CMBT" },
  { key: "BUS_CODE", label: "Bus Code", type: "text", required: true, placeholder: "e.g., CMBT" },
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
  { key: "BUS_BOARDING_LOCATION_NAME", label: "Location Name" },
  { key: "BUS_CODE", label: "Bus Code" },
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

export default function BusBoardingLocationMasterPage() {
  const dispatch = useAppDispatch();
  const { busBoardingLocations, loading, error } = useAppSelector((s) => s.busBoardingLocation);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("AC");

  useEffect(() => {
    dispatch(fetchBusBoardingLocations(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearBusBoardingLocationError());
    }
  }, [error, dispatch, toast]);

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "AC");
  }, []);

  const storeOverrides = useMemo(() => ({
    data: busBoardingLocations,
    isLoading: loading,
    add: async (item: BusBoardingLocationGridData) => {
      const res = await dispatch(addBusBoardingLocation(item)).unwrap();
      dispatch(fetchBusBoardingLocations(currentStatus));
      return res;
    },
    update: async (item: BusBoardingLocationGridData) => {
      const res = await dispatch(updateBusBoardingLocation(item)).unwrap();
      dispatch(fetchBusBoardingLocations(currentStatus));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteBusBoardingLocation(id)).unwrap();
      dispatch(fetchBusBoardingLocations(currentStatus));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteBusBoardingLocation(id)).unwrap();
      }
      dispatch(fetchBusBoardingLocations(currentStatus));
      return res;
    },
  }), [busBoardingLocations, loading, dispatch, currentStatus]);

  return (
    <MasterCrudPage
      title="Bus Boarding Location Master"
      description="Manage bus boarding location master data"
      idPrefix="BBL"
      domain="bus-boarding-location-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }]}
      onStatusFilterChange={handleStatusFilterChange}
    />
  );
}
