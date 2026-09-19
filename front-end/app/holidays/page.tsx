"use client";

import { useMemo, useEffect, useCallback, useState } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchHolidays,
  addHoliday,
  updateHoliday,
  deleteHoliday,
  clearHolidayEntriesError,
  HolidayEntriesGridData,
} from "@/lib/holidayEntriesSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  { key: "HOLIDAY_DATE", label: "Holiday Date", type: "date", required: true, placeholder: "e.g., 2026-01-01" },
  { key: "HOLIDAY_REASON", label: "Holiday Reason", type: "text", required: true, placeholder: "e.g., New Year" },
  { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks" },
  {
    key: "STATUS_MASTER",
    label: "Status",
    type: "select",
    options: [{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }],
    defaultValue: "AC",
    formatter: (val: unknown) => {
      const s = String(val || "").toUpperCase();
      if (s === "AC" || s === "ACTIVE") return "AC";
      if (s === "IN" || s === "INACTIVE") return "IN";
      return val;
    },
  },
];

const columns = [
  { key: "HOLIDAY_DATE", label: "Holiday Date" },
  { key: "HOLIDAY_REASON", label: "Holiday Reason" },
  { key: "REMARKS", label: "Remarks" },
  {
    key: "STATUS_MASTER",
    label: "Status",
    render: (val: unknown) => {
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
          {isActive ? "Active" : isInactive ? "Inactive" : String(val ?? "")}
        </Badge>
      );
    },
  },
];

export default function HolidaysPage() {
  const dispatch = useAppDispatch();
  const { holidays, loading, error } = useAppSelector((s) => s.holidayEntries);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("AC");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  useEffect(() => {
    dispatch(fetchHolidays({ status: currentStatus, fromDate, toDate }));
  }, [dispatch, currentStatus, fromDate, toDate]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearHolidayEntriesError());
    }
  }, [error, dispatch, toast]);

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "");
  }, []);

  const handleDateRangeChange = useCallback((from: string, to: string) => {
    setFromDate(from || "");
    setToDate(to || "");
  }, []);

  const assertUniqueHolidayReason = useCallback((item: HolidayEntriesGridData) => {
    const reason = String(item.HOLIDAY_REASON || "").trim();
    if (!reason || !Array.isArray(holidays)) return;
    const currentId = String(item.id ?? item.HOLIDAY_ID ?? "");
    const duplicate = holidays.find((h) => {
      const otherId = String(h.id ?? h.HOLIDAY_ID ?? "");
      const otherReason = String(h.HOLIDAY_REASON || "").trim();
      return otherReason.toLowerCase() === reason.toLowerCase() && otherId !== currentId;
    });
    if (duplicate) {
      throw new Error(`Holiday Reason "${reason}" already exists.`);
    }
  }, [holidays]);

  const storeOverrides = useMemo(() => ({
    data: holidays,
    isLoading: loading,
    add: async (item: HolidayEntriesGridData) => {
      assertUniqueHolidayReason(item);
      const res = await dispatch(addHoliday(item)).unwrap();
      dispatch(fetchHolidays({ status: currentStatus, fromDate, toDate }));
      return res;
    },
    update: async (item: HolidayEntriesGridData) => {
      assertUniqueHolidayReason(item);
      const res = await dispatch(updateHoliday(item)).unwrap();
      dispatch(fetchHolidays({ status: currentStatus, fromDate, toDate }));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteHoliday(id)).unwrap();
      dispatch(fetchHolidays({ status: currentStatus, fromDate, toDate }));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteHoliday(id)).unwrap();
      }
      dispatch(fetchHolidays({ status: currentStatus, fromDate, toDate }));
      return res;
    },
  }), [holidays, loading, dispatch, currentStatus, fromDate, toDate, assertUniqueHolidayReason]);

  return (
    <MasterCrudPage
      title="Holidays"
      description="Manage holiday entries"
      idPrefix="HLY"
      domain="holiday-entries"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[
        { label: "All Status", value: "" },
        { label: "Active", value: "AC" },
        { label: "Inactive", value: "IN" },
        { label: "Closed", value: "CL" },
      ]}
      onStatusFilterChange={handleStatusFilterChange}
      enableDateRangeFilter
      onDateRangeFilterChange={handleDateRangeChange}
    />
  );
}
