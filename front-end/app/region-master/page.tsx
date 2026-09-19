"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchRegions, addRegion, updateRegion, deleteRegion, clearRegionsError, RegionGridData } from "@/lib/regionMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { TANZANIA_ZONES } from "@/lib/validation";

const fields: MasterField[] = [
  { key: "REGION_NAME", label: "Region Name", type: "text", required: true, placeholder: "e.g., Arusha" },
  { key: "COUNTRY_ID", label: "Country", type: "select", required: true, options: [] },
  { key: "CAPITAL", label: "Capital", type: "text", placeholder: "e.g., Arusha City" },
  { key: "NO_OF_DISTRICTS", label: "No of Districts", type: "number", placeholder: "e.g., 7" },
  {
    key: "TOTAL_POPULATION",
    label: "Total Population",
    type: "number",
    placeholder: "e.g., 2000000.00",
    formatter: (val: any) => {
      if (val === "" || val === undefined || val === null) return "";
      const n = parseFloat(String(val));
      return isNaN(n) ? "" : n.toFixed(2);
    },
  },
  { key: "ZONE_NAME", label: "Zone Name", type: "select", options: TANZANIA_ZONES, placeholder: "e.g., Northern Zone" },
  {
    key: "DISTANCE_FROM_ARUSHA",
    label: "Distance from Arusha",
    type: "number",
    placeholder: "e.g., 0.00",
    formatter: (val: any) => {
      if (val === "" || val === undefined || val === null) return "";
      const n = parseFloat(String(val));
      return isNaN(n) ? "" : n.toFixed(2);
    },
  },
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
  { key: "REGION_NAME", label: "Region Name" },
  { key: "COUNTRY_NAME", label: "Country" },
  { key: "CAPITAL", label: "Capital" },
  { key: "NO_OF_DISTRICTS", label: "Districts" },
  { key: "TOTAL_POPULATION", label: "Population" },
  { key: "ZONE_NAME", label: "Zone" },
  { key: "DISTANCE_FROM_ARUSHA", label: "Distance (km)" },
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

export default function RegionMasterPage() {
  const dispatch = useAppDispatch();
  const { regions, loading, error } = useAppSelector((s) => s.regions);
  const { toast } = useToast();

  const { data: countries } = useApiQuery("region-country-list", async () => {
    const res = await fetch(`${API_URL}/country-master`);
    if (!res.ok) throw new Error("Failed to fetch countries");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.Country_Id }));
  });

  const countryOptions = useMemo(() => {
    if (!Array.isArray(countries)) return [];
    return countries.map((c: any) => ({
      value: String(c.Country_Id),
      label: c.Country_Name || `Country #${c.Country_Id}`,
    }));
  }, [countries]);

  const fieldsWithOptions: MasterField[] = useMemo(() => {
    return fields.map((f) => {
      if (f.key === "COUNTRY_ID") return { ...f, options: countryOptions };
      return f;
    });
  }, [countryOptions]);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(regions)) return [];
    return regions.map((u: any) => {
      const country = Array.isArray(countries)
        ? countries.find((c: any) => Number(c.Country_Id) === Number(u.COUNTRY_ID))
        : undefined;
      return {
        ...u,
        COUNTRY_NAME: country?.Country_Name || `ID: ${u.COUNTRY_ID}`,
      };
    });
  }, [regions, countries]);

  useEffect(() => {
    dispatch(fetchRegions());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearRegionsError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: RegionGridData) => {
      const res = await dispatch(addRegion(item)).unwrap();
      dispatch(fetchRegions());
      return res;
    },
    update: async (item: RegionGridData) => {
      const res = await dispatch(updateRegion(item)).unwrap();
      dispatch(fetchRegions());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteRegion(id)).unwrap();
      dispatch(fetchRegions());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteRegion(id)).unwrap();
      }
      dispatch(fetchRegions());
      return res;
    },
  }), [enrichedData, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Region Master"
      description="Manage region master data"
      idPrefix="REG"
      domain="region-master"
      fields={fieldsWithOptions}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
