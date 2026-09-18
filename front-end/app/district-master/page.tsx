"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchDistricts, addDistrict, updateDistrict, deleteDistrict, clearDistrictsError, DistrictGridData } from "@/lib/districtMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { TANZANIA_ZONES } from "@/lib/validation";

const fields: MasterField[] = [
  {
    key: "DISTRICT_NAME",
    label: "District Name",
    type: "text",
    required: true,
    placeholder: "e.g., Meru"
  },
  {
    key: "COUNTRY_ID",
    label: "Country",
    type: "searchable",
    required: true,
    options: [],
  },
  {
    key: "REGION_ID",
    label: "Region",
    type: "searchable",
    required: true,
    dependsOn: "COUNTRY_ID",
    options: (form: Record<string, any>) => {
      return [];
    },
  },
  {
    key: "TOTAL_POPULATION",
    label: "Total Population",
    type: "number",
    placeholder: "e.g., 500000.00",
    formatter: (val: any) => {
      if (val === "" || val === undefined || val === null) return "";
      const n = parseFloat(String(val));
      return isNaN(n) ? "" : n.toFixed(2);
    },
  },
  { key: "ZONE_NAME", label: "Zone Name", type: "select", options: TANZANIA_ZONES, placeholder: "e.g., Eastern Zone" },
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
  { key: "DISTRICT_NAME", label: "District Name" },
  { key: "COUNTRY_NAME", label: "Country" },
  { key: "REGION_NAME", label: "Region" },
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

export default function DistrictMasterPage() {
  const dispatch = useAppDispatch();
  const { districts, loading, error } = useAppSelector((s) => s.districts);
  const { toast } = useToast();

  const { data: countries } = useApiQuery("district-country-list", async () => {
    const res = await fetch(`${API_URL}/country-master`);
    if (!res.ok) throw new Error("Failed to fetch countries");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.Country_Id }));
  });

  const { data: regions } = useApiQuery("district-region-list", async () => {
    const res = await fetch(`${API_URL}/region-master`);
    if (!res.ok) throw new Error("Failed to fetch regions");
    const json = await res.json();
    return (json.data || []).map((r: any) => ({ ...r, id: r.REGION_ID }));
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
      if (f.key === "COUNTRY_ID") {
        return { ...f, options: countryOptions };
      }
      if (f.key === "REGION_ID") {
        return {
          ...f,
          options: (form: Record<string, any>) => {
            const selectedCountryId = form["COUNTRY_ID"];
            if (!Array.isArray(regions)) return [];
            const filtered = selectedCountryId
              ? regions.filter((r: any) => Number(r.COUNTRY_ID) === Number(selectedCountryId))
              : regions;
            return filtered.map((r: any) => ({
              value: String(r.REGION_ID),
              label: r.REGION_NAME || `Region #${r.REGION_ID}`,
            }));
          },
        };
      }
      return f;
    });
  }, [countryOptions, regions]);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(districts)) return [];
    return districts.map((u: any) => {
      const country = Array.isArray(countries)
        ? countries.find((c: any) => Number(c.Country_Id) === Number(u.Country_Id))
        : undefined;
      const region = Array.isArray(regions)
        ? regions.find((r: any) => Number(r.REGION_ID) === Number(u.Region_Id))
        : undefined;
      return {
        id: u.District_id,
        District_id: u.District_id,
        DISTRICT_NAME: u.District_Name,
        COUNTRY_ID: String(u.Country_Id),
        REGION_ID: String(u.Region_Id),
        TOTAL_POPULATION: u.Total_Population,
        ZONE_NAME: u.Zone_Name,
        DISTANCE_FROM_ARUSHA: u.Distance_From_Arusha,
        STATUS_MASTER: u.Status_Master,
        COUNTRY_NAME: country?.Country_Name || `ID: ${u.Country_Id}`,
        REGION_NAME: region?.REGION_NAME || `ID: ${u.Region_Id}`,
      };
    });
  }, [districts, countries, regions]);

  useEffect(() => {
    dispatch(fetchDistricts());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearDistrictsError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: DistrictGridData) => {
      const res = await dispatch(addDistrict(item)).unwrap();
      dispatch(fetchDistricts());
      return res;
    },
    update: async (item: DistrictGridData) => {
      const res = await dispatch(updateDistrict(item)).unwrap();
      dispatch(fetchDistricts());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteDistrict(id)).unwrap();
      dispatch(fetchDistricts());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteDistrict(id)).unwrap();
      }
      dispatch(fetchDistricts());
      return res;
    },
  }), [enrichedData, loading, dispatch]);

  return (
    <MasterCrudPage
      title="District Master"
      description="Manage district master data"
      idPrefix="DST"
      domain="district-master"
      fields={fieldsWithOptions}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
