"use client";

import { useMemo, useEffect, useCallback, useState } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchVisaTypes,
  addVisaType,
  updateVisaType,
  deleteVisaType,
  clearVisaTypeError,
  VisaTypeGridData,
} from "@/lib/visaTypeMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  { key: "VISA_TYPE_NAME", label: "Visa Type Name", type: "text", required: true, placeholder: "e.g., Tourist Visa" },
  { key: "VISA_VALIDITY_DAYS", label: "Validity (Days)", type: "text", placeholder: "e.g., 30" },
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
  { key: "VISA_TYPE_NAME", label: "Visa Type Name" },
  { key: "VISA_VALIDITY_DAYS", label: "Validity (Days)" },
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

export default function VisaTypeMasterPage() {
  const dispatch = useAppDispatch();
  const { visaTypes, loading, error } = useAppSelector((s) => s.visaType);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("AC");

  useEffect(() => {
    dispatch(fetchVisaTypes(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearVisaTypeError());
    }
  }, [error, dispatch, toast]);

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "AC");
  }, []);

  const storeOverrides = useMemo(() => ({
    data: visaTypes,
    isLoading: loading,
    add: async (item: VisaTypeGridData) => {
      const res = await dispatch(addVisaType(item)).unwrap();
      dispatch(fetchVisaTypes(currentStatus));
      return res;
    },
    update: async (item: VisaTypeGridData) => {
      const res = await dispatch(updateVisaType(item)).unwrap();
      dispatch(fetchVisaTypes(currentStatus));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteVisaType(id)).unwrap();
      dispatch(fetchVisaTypes(currentStatus));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteVisaType(id)).unwrap();
      }
      dispatch(fetchVisaTypes(currentStatus));
      return res;
    },
  }), [visaTypes, loading, dispatch, currentStatus]);

  return (
    <MasterCrudPage
      title="Visa Type Master"
      description="Manage visa type master data"
      idPrefix="VST"
      domain="visa-type-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }]}
      onStatusFilterChange={handleStatusFilterChange}
    />
  );
}
