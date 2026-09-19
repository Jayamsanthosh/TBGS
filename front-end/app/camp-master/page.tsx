"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchCamps, addCamp, updateCamp, deleteCamp, clearCampError, CampGridData } from "@/lib/campMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  {
    key: "CAMP_NAME",
    label: "Camp Name",
    type: "text",
    required: true,
    placeholder: "e.g., Main Camp"
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
  { key: "CAMP_NAME", label: "Camp Name" },
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

export default function CampMasterPage() {
  const dispatch = useAppDispatch();
  const { camps, loading, error } = useAppSelector((s) => s.camp);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchCamps());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearCampError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: camps,
    isLoading: loading,
    add: async (item: CampGridData) => {
      const res = await dispatch(addCamp(item)).unwrap();
      dispatch(fetchCamps());
      return res;
    },
    update: async (item: CampGridData) => {
      const res = await dispatch(updateCamp(item)).unwrap();
      dispatch(fetchCamps());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteCamp(id)).unwrap();
      dispatch(fetchCamps());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteCamp(id)).unwrap();
      }
      dispatch(fetchCamps());
      return res;
    },
  }), [camps, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Camp Master"
      description="Manage camp master data"
      idPrefix="CMP"
      domain="camp-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
