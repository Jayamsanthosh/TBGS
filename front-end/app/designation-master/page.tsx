"use client";

import { useMemo, useEffect, useState } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchDesignations,
  addDesignation,
  updateDesignation,
  deleteDesignation,
  clearDesignationError,
  DesignationGridData,
} from "@/lib/designationMasterSlice";

import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/lib/config";


const columns = [
  { key: "DESIGNATION_NAME", label: "Designation Name" },
  { key: "DESIGNATION_GROUP_NAME", label: "Designation Group" },
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

export default function DesignationMasterPage() {
  const dispatch = useAppDispatch();
  const { designations, loading, error } = useAppSelector((s) => s.designation);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchDesignations());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearDesignationError());
    }
  }, [error, dispatch, toast]);
  const [groupOptions, setGroupOptions] = useState<{label: string, value: string}[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/designation-group-master`)
      .then(r => r.json())
      .then(d => {
         const opts = (d.data || []).map((x: any) => ({
           value: String(x.DESIGNATION_GROUP_ID),
           label: x.DESIGNATION_GROUP_NAME
         }));
         setGroupOptions(opts);
      }).catch(console.error);
  }, []);

  const fields: MasterField[] = useMemo(() => [
    { key: "DESIGNATION_NAME", label: "Designation Name", type: "text", required: true, placeholder: "e.g., Manager" },
    { key: "designation_group_id", label: "Designation Group", type: "select", options: groupOptions, required: true },
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
  ], [groupOptions]);

  const mappedDesignations = useMemo(() => designations.map((d: any) => {
    let groupId = d.DESIGNATION_GROUP_ID ? String(d.DESIGNATION_GROUP_ID) : "";
    if (!groupId && d.DESIGNATION_GROUP_NAME && groupOptions.length > 0) {
       const found = groupOptions.find(o => o.label === d.DESIGNATION_GROUP_NAME);
       if (found) groupId = found.value;
    }
    return { ...d, designation_group_id: groupId };
  }), [designations, groupOptions]);

  const storeOverrides = useMemo(() => ({
    data: mappedDesignations,
    isLoading: loading,
    add: async (item: DesignationGridData) => {
      let res;
      try {
        res = await dispatch(addDesignation(item)).unwrap();
      } catch (e) {
        dispatch(clearDesignationError());
        throw e;
      }
      dispatch(fetchDesignations());
      return res;
    },
    update: async (item: DesignationGridData) => {
      let res;
      try {
        res = await dispatch(updateDesignation(item)).unwrap();
      } catch (e) {
        dispatch(clearDesignationError());
        throw e;
      }
      dispatch(fetchDesignations());
      return res;
    },
    remove: async (id: string) => {
      let res;
      try {
        res = await dispatch(deleteDesignation(id)).unwrap();
      } catch (e) {
        dispatch(clearDesignationError());
        throw e;
      }
      dispatch(fetchDesignations());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        try {
          res = await dispatch(deleteDesignation(id)).unwrap();
        } catch (e) {
          dispatch(clearDesignationError());
          throw e;
        }
      }
      dispatch(fetchDesignations());
      return res;
    },
  }), [mappedDesignations, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Designation Master"
      description="Manage designation master data"
      idPrefix="DSG"
      domain="designation-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
