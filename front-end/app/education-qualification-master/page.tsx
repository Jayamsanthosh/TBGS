"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchEducationQualifications,
  addEducationQualification,
  updateEducationQualification,
  deleteEducationQualification,
  clearEducationQualificationError,
  EducationQualificationGridData,
} from "@/lib/educationQualificationMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const statusFormatter = (val: any) => {
  const s = String(val || "").toUpperCase();
  if (s === "AC") return "ACTIVE";
  if (s === "IN") return "INACTIVE";
  return val;
};

export default function EducationQualificationMasterPage() {
  const dispatch = useAppDispatch();
  const { educationQualifications, loading, error } = useAppSelector((s) => s.educationQualification);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchEducationQualifications("ALL"));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearEducationQualificationError());
    }
  }, [error, dispatch, toast]);

  const fields: MasterField[] = [
    { key: "EDUCATION_QUALIFICATION_NAME", label: "Qualification Name", type: "text", required: true, placeholder: "e.g., B.Tech", maxLength: 50 },
    { key: "SKILL_TYPE", label: "Skill Type", type: "text", placeholder: "e.g., Technical", maxLength: 50 },
    { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks", maxLength: 1000 },
    {
      key: "STATUS_MASTER",
      label: "Status",
      type: "select",
      options: [{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }],
      defaultValue: "AC",
      formatter: statusFormatter,
    },
  ];

  const columns = [
    { key: "EDUCATION_QUALIFICATION_ID", label: "ID" },
    { key: "EDUCATION_QUALIFICATION_NAME", label: "Qualification" },
    { key: "SKILL_TYPE", label: "Skill Type" },
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

  const storeOverrides = useMemo(() => ({
    data: educationQualifications,
    isLoading: loading,
    add: async (item: EducationQualificationGridData) => {
      const res = await dispatch(addEducationQualification(item)).unwrap();
      dispatch(fetchEducationQualifications("ALL"));
      return res;
    },
    update: async (item: EducationQualificationGridData) => {
      const res = await dispatch(updateEducationQualification(item)).unwrap();
      dispatch(fetchEducationQualifications("ALL"));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteEducationQualification(id)).unwrap();
      dispatch(fetchEducationQualifications("ALL"));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteEducationQualification(id)).unwrap();
      }
      dispatch(fetchEducationQualifications("ALL"));
      return res;
    },
  }), [educationQualifications, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Education Qualification Master"
      description="Manage education qualification master data"
      idPrefix="EQ"
      domain="education-qualification-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }]}
    />
  );
}
