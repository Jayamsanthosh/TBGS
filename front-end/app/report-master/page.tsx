"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchReports, addReport, updateReport, deleteReport, clearReportMasterError, ReportMasterGridData } from "@/lib/reportMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  {
    key: "REPORT_NAME",
    label: "Report Name",
    type: "text",
    required: true,
    placeholder: "e.g., Attendance Request",
  },
  {
    key: "PROCEDURE_NAME",
    label: "Stored Procedure",
    type: "text",
    required: true,
    placeholder: "e.g., VRequest.GET_REQUEST_LIST_BY_TYPE",
  },
  { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks" },
  {
    key: "STATUS_MASTER",
    label: "Status",
    type: "select",
    options: [{ label: "Active", value: "ACTIVE" }, { label: "Inactive", value: "INACTIVE" }],
    defaultValue: "ACTIVE",
    formatter: (val: unknown) => {
      const s = String(val ?? "").toLowerCase();
      if (s === "ac") return "ACTIVE";
      if (s === "in") return "INACTIVE";
      return val;
    },
  },
];

const columns = [
  { key: "REPORT_NAME", label: "Report Name" },
  { key: "PROCEDURE_NAME", label: "Stored Procedure" },
  { key: "REMARKS", label: "Remarks" },
  {
    key: "STATUS_MASTER",
    label: "Status",
    render: (val: unknown) => {
      const sv = String(val ?? "").toLowerCase();
      const isActive = sv === "active" || sv === "ac";
      const isInactive = sv === "inactive" || sv === "in";
      const colorClass = isActive
        ? "bg-green-500/10 text-green-600 border-green-200"
        : isInactive
          ? "bg-red-500/10 text-red-600 border-red-200"
          : "bg-blue-500/10 text-blue-600 border-blue-200";
      return (
        <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
          {isActive ? "Active" : isInactive ? "Inactive" : String(val ?? "")}
        </Badge>
      );
    },
  },
];

export default function ReportMasterPage() {
  const dispatch = useAppDispatch();
  const { reports, loading, error } = useAppSelector((s) => s.reportMaster);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchReports());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearReportMasterError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: reports,
    isLoading: loading,
    add: async (item: ReportMasterGridData) => {
      const res = await dispatch(addReport(item)).unwrap();
      dispatch(fetchReports());
      return res;
    },
    update: async (item: ReportMasterGridData) => {
      const res = await dispatch(updateReport(item)).unwrap();
      dispatch(fetchReports());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteReport(id)).unwrap();
      dispatch(fetchReports());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteReport(id)).unwrap();
      }
      dispatch(fetchReports());
      return res;
    },
  }), [reports, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Report Master"
      description="Manage the Report Name to Stored Procedure mapping used by the Report Dashboard. New reports added here show up in the dashboard and run their configured stored procedure."
      idPrefix="REPORT"
      domain="report-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}