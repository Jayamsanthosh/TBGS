"use client";

import { useMemo, useEffect, useCallback, useState } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchBloodGroups,
  addBloodGroup,
  updateBloodGroup,
  deleteBloodGroup,
  clearBloodGroupError,
  type BloodGroupGridData,
} from "@/lib/bloodGroupMasterSlice";
import { useToast } from "@/hooks/use-toast";

const fields: MasterField[] = [
  { key: "BLOOD_GROUP_NAME", label: "Blood Group Name", type: "text", required: true, placeholder: "e.g., A+", maxLength: 50 },
  { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks" },
  {
    key: "STATUS_MASTER",
    label: "Status",
    type: "select",
    options: [
      { label: "Active", value: "Active" },
      { label: "Inactive", value: "Inactive" },
    ],
    defaultValue: "Active",
  },
];

const columns = [
  { key: "BLOOD_GROUP_NAME", label: "Blood Group Name" },
  { key: "REMARKS", label: "Remarks" },
  { key: "STATUS", label: "Status" },
];

export default function BloodGroupMasterPage() {
  const dispatch = useAppDispatch();
  const { bloodGroups, loading, error } = useAppSelector((s) => s.bloodGroup);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("Active");

  const enrichedData = useMemo(() => {
    if (!Array.isArray(bloodGroups)) return [];
    return bloodGroups.map((b: any) => ({
      ...b,
      STATUS_MASTER: b.STATUS_MASTER ?? b.STATUS ?? "Active",
    }));
  }, [bloodGroups]);

  useEffect(() => {
    dispatch(fetchBloodGroups(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearBloodGroupError());
    }
  }, [error, dispatch, toast]);

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "Active");
  }, []);

  const storeOverrides = useMemo(
    () => ({
      data: enrichedData,
      isLoading: loading,
      add: async (item: BloodGroupGridData) => {
        const res = await dispatch(addBloodGroup(item)).unwrap();
        dispatch(fetchBloodGroups(currentStatus));
        return res;
      },
      update: async (item: BloodGroupGridData) => {
        const res = await dispatch(updateBloodGroup(item)).unwrap();
        dispatch(fetchBloodGroups(currentStatus));
        return res;
      },
      remove: async (id: string) => {
        const res = await dispatch(deleteBloodGroup(id)).unwrap();
        dispatch(fetchBloodGroups(currentStatus));
        return res;
      },
      bulkRemove: async (ids: string[]) => {
        let res;
        for (const id of ids) {
          res = await dispatch(deleteBloodGroup(id)).unwrap();
        }
        dispatch(fetchBloodGroups(currentStatus));
        return res;
      },
    }),
    [enrichedData, loading, dispatch, currentStatus]
  );

  return (
    <MasterCrudPage
      title="Blood Group Master"
      description="Manage blood group master data"
      idPrefix="BG"
      domain="blood-group-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[
        { label: "Active", value: "Active" },
        { label: "Inactive", value: "Inactive" },
      ]}
      onStatusFilterChange={handleStatusFilterChange}
    />
  );
}
