"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchAttendanceTypes,
  addAttendanceType,
  updateAttendanceType,
  deleteAttendanceType,
  clearAttendanceTypeError,
  AttendanceTypeGridData,
} from "@/lib/attendanceTypeMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const statusFormatter = (val: any) => {
  const s = String(val || "").toUpperCase();
  if (s === "AC") return "ACTIVE";
  if (s === "IN") return "INACTIVE";
  return val;
};

export default function AttendanceTypeMasterPage() {
  const dispatch = useAppDispatch();
  const { attendanceTypes, loading, error } = useAppSelector((s) => s.attendanceType);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchAttendanceTypes("ALL"));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearAttendanceTypeError());
    }
  }, [error, dispatch, toast]);

  const cleanPayload = (item: AttendanceTypeGridData): AttendanceTypeGridData => {
    const copy = { ...item };
    if (copy.ELIGIBLE_DAYS === undefined || copy.ELIGIBLE_DAYS === null || (copy.ELIGIBLE_DAYS as any) === "") {
      copy.ELIGIBLE_DAYS = undefined;
    }
    if (!copy.REMARKS) copy.REMARKS = undefined;
    return copy;
  };

  const fields: MasterField[] = [
    {
      key: "ATTENDANCE_TYPE_NAME",
      label: "Attendance Type Name",
      type: "text",
      required: true,
      placeholder: "e.g., Present",
      maxLength: 50,
    },
    {
      key: "ELIGIBLE_DAYS",
      label: "Eligible Days",
      type: "number",
      placeholder: "e.g., 1",
    },
    {
      key: "REMARKS",
      label: "Remarks",
      type: "textarea",
      placeholder: "Enter any remarks",
      maxLength: 1000,
    },
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
    { key: "ATTENDANCE_TYPE_NAME", label: "Attendance Type Name" },
    { key: "ELIGIBLE_DAYS", label: "Eligible Days" },
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
    data: attendanceTypes,
    isLoading: loading,
    add: async (item: AttendanceTypeGridData) => {
      const res = await dispatch(addAttendanceType(cleanPayload(item))).unwrap();
      dispatch(fetchAttendanceTypes("ALL"));
      return res;
    },
    update: async (item: AttendanceTypeGridData) => {
      const res = await dispatch(updateAttendanceType(cleanPayload(item))).unwrap();
      dispatch(fetchAttendanceTypes("ALL"));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteAttendanceType(id)).unwrap();
      dispatch(fetchAttendanceTypes("ALL"));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteAttendanceType(id)).unwrap();
      }
      dispatch(fetchAttendanceTypes("ALL"));
      return res;
    },
  }), [attendanceTypes, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Attendance Type Master"
      description="Manage attendance type master data"
      idPrefix="AT"
      domain="attendance-type-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }]}
    />
  );
}