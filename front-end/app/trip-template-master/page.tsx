"use client";

import { useMemo, useEffect, useCallback, useState } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchTripTemplates,
  addTripTemplate,
  updateTripTemplate,
  deleteTripTemplate,
  clearTripTemplateError,
  type TripTemplateGridData,
} from "@/lib/tripTemplateMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const columns = [
  { key: "TRIP_TEMPLATE_NAME", label: "Trip Template Name" },
  { key: "TRIP_TEMPLATE_DESCRIPTION", label: "Description" },
  { key: "FROM_LOCATION", label: "From Location" },
  { key: "TO_LOCATION", label: "To Location" },
  { key: "DISTANCE_KM", label: "Distance (km)" },
  { key: "REMARKS", label: "Remarks" },
  {
    key: "STATUS_MASTER",
    label: "Status",
    render: (val: any) => {
      const sv = String(val ?? "").toLowerCase().trim();
      const isGreen = sv === "active" || sv === "ac";
      const isRed = sv === "inactive" || sv === "ia";
      return (
        <Badge
          variant="outline"
          className={`${isGreen ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"} px-2 py-0.5 text-[10px] uppercase font-bold`}
        >
          {isGreen ? "Active" : isRed ? "Inactive" : String(val)}
        </Badge>
      );
    },
  },
];

export default function TripTemplateMasterPage() {
  const dispatch = useAppDispatch();
  const { tripTemplates, loading, error } = useAppSelector((s) => s.tripTemplate);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("AC");

  const { data: locations } = useApiQuery("trip-template-locations", async () => {
    const res = await fetch(`${API_URL}/location-master?status=Active`);
    if (!res.ok) throw new Error("Failed to fetch locations");
    const json = await res.json();
    return json.data || [];
  });

  const locationOptions = useMemo(
    () =>
      (Array.isArray(locations) ? locations : [])
        .filter((x: any) => x?.LOCATION_ID != null)
        .map((x: any) => ({ value: String(x.LOCATION_ID), label: x.LOCATION_NAME })),
    [locations]
  );

  const fields = useMemo<MasterField[]>(
    () => [
      { key: "TRIP_TEMPLATE_NAME", label: "Trip Template Name", type: "text", required: true, placeholder: "e.g., Trip Template 1", maxLength: 50 },
      { key: "TRIP_TEMPLATE_DESCRIPTION", label: "Description", type: "text", placeholder: "e.g., Sample Trip Template", maxLength: 100 },
      { key: "FROM_LOCATION_ID", label: "From Location", type: "select", options: locationOptions, placeholder: "Select from location" },
      { key: "TO_LOCATION_ID", label: "To Location", type: "select", options: locationOptions, placeholder: "Select to location" },
      { key: "DISTANCE_KM", label: "Distance (km)", type: "number", placeholder: "e.g., 25.50" },
      { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks" },
      {
        key: "STATUS_MASTER",
        label: "Status",
        type: "select",
        options: [
          { label: "Active", value: "AC" },
          { label: "Inactive", value: "IN" },
        ],
        defaultValue: "AC",
      },
    ],
    [locationOptions]
  );

  useEffect(() => {
    dispatch(fetchTripTemplates(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearTripTemplateError());
    }
  }, [error, dispatch, toast]);

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "AC");
  }, []);

  const storeOverrides = useMemo(
    () => ({
      data: tripTemplates,
      isLoading: loading,
      add: async (item: TripTemplateGridData) => {
        const res = await dispatch(addTripTemplate(item)).unwrap();
        dispatch(fetchTripTemplates(currentStatus));
        return res;
      },
      update: async (item: TripTemplateGridData) => {
        const res = await dispatch(updateTripTemplate(item)).unwrap();
        dispatch(fetchTripTemplates(currentStatus));
        return res;
      },
      remove: async (id: string) => {
        const res = await dispatch(deleteTripTemplate(id)).unwrap();
        dispatch(fetchTripTemplates(currentStatus));
        return res;
      },
      bulkRemove: async (ids: string[]) => {
        let res;
        for (const id of ids) {
          res = await dispatch(deleteTripTemplate(id)).unwrap();
        }
        dispatch(fetchTripTemplates(currentStatus));
        return res;
      },
    }),
    [tripTemplates, loading, dispatch, currentStatus]
  );

  return (
    <MasterCrudPage
      title="Trip Template Master"
      description="Manage trip template master data"
      idPrefix="TRIP"
      domain="trip-template-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[
        { label: "Active", value: "AC" },
        { label: "Inactive", value: "IN" },
      ]}
      onStatusFilterChange={handleStatusFilterChange}
    />
  );
}
