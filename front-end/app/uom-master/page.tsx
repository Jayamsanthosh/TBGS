"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchUoms, addUom, updateUom, deleteUom, clearUomsError, UomGridData } from "@/lib/uomMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  { key: "UOM_NAME", label: "UOM Name", type: "text", required: true, placeholder: "e.g., KG" },
  {
    key: "KG_PER_UOM",
    label: "KG per UOM",
    type: "number",
    placeholder: "e.g., 1.00",
    formatter: (val: any) => {
      if (val === "" || val === undefined || val === null) return "";
      const n = parseFloat(String(val));
      return isNaN(n) ? "" : n.toFixed(2);
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
  { key: "UOM_NAME", label: "UOM Name" },
  { key: "KG_PER_UOM", label: "KG per UOM" },
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

export default function UomMasterPage() {
  const dispatch = useAppDispatch();
  const { uoms, loading, error } = useAppSelector((s) => s.uoms);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchUoms());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearUomsError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: uoms,
    isLoading: loading,
    add: async (item: UomGridData) => {
      const res = await dispatch(addUom(item)).unwrap();
      dispatch(fetchUoms());
      return res;
    },
    update: async (item: UomGridData) => {
      const res = await dispatch(updateUom(item)).unwrap();
      dispatch(fetchUoms());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteUom(id)).unwrap();
      dispatch(fetchUoms());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteUom(id)).unwrap();
      }
      dispatch(fetchUoms());
      return res;
    },
  }), [uoms, loading, dispatch]);

  return (
    <MasterCrudPage
      title="UOM Master"
      description="Manage units of measure"
      idPrefix="UOM"
      domain="uom-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
