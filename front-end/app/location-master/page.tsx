"use client";

import { useMemo, useEffect, useCallback, useState } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchLocations,
  addLocation,
  updateLocation,
  deleteLocation,
  clearLocationError,
  type LocationGridData,
} from "@/lib/locationMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";

const columns = [
  { key: "LOCATION_NAME", label: "Location Name" },
  { key: "Country_Name", label: "Country" },
  { key: "REGION_NAME", label: "Region" },
  { key: "District_Name", label: "District" },
  { key: "CAMP_NAME", label: "Camp" },
  { key: "STORE_NAME", label: "Store" },
  { key: "REMARKS", label: "Remarks" },
  { key: "STATUS", label: "Status" },
];

export default function LocationMasterPage() {
  const dispatch = useAppDispatch();
  const { locations, loading, error } = useAppSelector((s) => s.location);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("Active");

  const { data: countries } = useApiQuery("location-countries", async () => {
    const res = await fetch(`${API_URL}/country-master`);
    if (!res.ok) throw new Error("Failed to fetch countries");
    const json = await res.json();
    return json.data || [];
  });

  const { data: regions } = useApiQuery("location-regions", async () => {
    const res = await fetch(`${API_URL}/region-master`);
    if (!res.ok) throw new Error("Failed to fetch regions");
    const json = await res.json();
    return json.data || [];
  });

  const { data: districts } = useApiQuery("location-districts", async () => {
    const res = await fetch(`${API_URL}/district-master`);
    if (!res.ok) throw new Error("Failed to fetch districts");
    const json = await res.json();
    return json.data || [];
  });

  const { data: camps } = useApiQuery("location-camps", async () => {
    const res = await fetch(`${API_URL}/camp-master`);
    if (!res.ok) throw new Error("Failed to fetch camps");
    const json = await res.json();
    return json.data || [];
  });

  const { data: stores } = useApiQuery("location-stores", async () => {
    const res = await fetch(`${API_URL}/store-master`);
    if (!res.ok) throw new Error("Failed to fetch stores");
    const json = await res.json();
    return json.data || [];
  });

  const toOptions = (list: any[], idKey: string, nameKey: string) =>
    (Array.isArray(list) ? list : [])
      .filter((x: any) => x?.[idKey] != null)
      .map((x: any) => ({ value: String(x[idKey]), label: x[nameKey] }));

  const optionSets = useMemo(
    () => ({
      countryOptions: toOptions(countries, "Country_Id", "Country_Name"),
      regionOptions: toOptions(regions, "REGION_ID", "REGION_NAME"),
      districtOptions: toOptions(districts, "District_id", "District_Name"),
      campOptions: toOptions(camps, "CAMP_ID", "CAMP_NAME"),
      storeOptions: toOptions(stores, "Store_Id", "Store_Name"),
    }),
    [countries, regions, districts, camps, stores]
  );

  const fields = useMemo<MasterField[]>(
    () => [
      { key: "LOCATION_NAME", label: "Location Name", type: "text", required: true, placeholder: "e.g., Main Location" },
      { key: "COUNTRY_ID", label: "Country", type: "select", options: optionSets.countryOptions, placeholder: "Select country" },
      {
        key: "REGION_ID",
        label: "Region",
        type: "select",
        dependsOn: "COUNTRY_ID",
        placeholder: "Select region",
        options: (form: Record<string, any>) => {
          if (!Array.isArray(regions)) return [];
          const selectedCountryId = form["COUNTRY_ID"];
          const filtered = selectedCountryId
            ? regions.filter((r: any) => String(r.COUNTRY_ID) === String(selectedCountryId))
            : [];
          return filtered.map((r: any) => ({
            value: String(r.REGION_ID),
            label: r.REGION_NAME || `Region #${r.REGION_ID}`,
          }));
        },
      },
      {
        key: "DISTRICT_ID",
        label: "District",
        type: "select",
        dependsOn: "REGION_ID",
        placeholder: "Select district",
        options: (form: Record<string, any>) => {
          if (!Array.isArray(districts)) return [];
          const selectedRegionId = form["REGION_ID"];
          const filtered = selectedRegionId
            ? districts.filter((d: any) => String(d.REGION_ID) === String(selectedRegionId))
            : [];
          return filtered.map((d: any) => ({
            value: String(d.District_id ?? d.DISTRICT_ID),
            label: d.District_Name || `District #${d.District_id ?? d.DISTRICT_ID}`,
          }));
        },
      },
      { key: "CAMP_ID", label: "Camp", type: "select", options: optionSets.campOptions, placeholder: "Select camp" },
      { key: "STORE_ID", label: "Store", type: "select", options: optionSets.storeOptions, placeholder: "Select store" },
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
    ],
    [optionSets, regions, districts]
  );

  const idByName = useMemo(() => {
    const build = (list: any[], idKey: string, nameKey: string) => {
      const map: Record<string, string> = {};
      (Array.isArray(list) ? list : []).forEach((x: any) => {
        if (x?.[idKey] != null) map[String(x[nameKey]).toLowerCase()] = String(x[idKey]);
      });
      return map;
    };
    return {
      country: build(countries, "Country_Id", "Country_Name"),
      region: build(regions, "REGION_ID", "REGION_NAME"),
      district: build(districts, "District_id", "District_Name"),
      camp: build(camps, "CAMP_ID", "CAMP_NAME"),
      store: build(stores, "Store_Id", "Store_Name"),
    };
  }, [countries, regions, districts, camps, stores]);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(locations)) return [];
    return locations.map((l: any) => ({
      ...l,
      COUNTRY_ID: l.COUNTRY_ID ?? (idByName.country[String(l.Country_Name || "").toLowerCase()] ?? ""),
      REGION_ID: l.REGION_ID ?? (idByName.region[String(l.REGION_NAME || "").toLowerCase()] ?? ""),
      DISTRICT_ID: l.DISTRICT_ID ?? (idByName.district[String(l.District_Name || "").toLowerCase()] ?? ""),
      CAMP_ID: l.CAMP_ID ?? (idByName.camp[String(l.CAMP_NAME || "").toLowerCase()] ?? ""),
      STORE_ID: l.STORE_ID ?? (idByName.store[String(l.STORE_NAME || "").toLowerCase()] ?? ""),
      STATUS_MASTER: l.STATUS_MASTER ?? l.STATUS ?? "Active",
    }));
  }, [locations, idByName]);

  useEffect(() => {
    dispatch(fetchLocations(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearLocationError());
    }
  }, [error, dispatch, toast]);

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "Active");
  }, []);

  const storeOverrides = useMemo(
    () => ({
      data: enrichedData,
      isLoading: loading,
      add: async (item: LocationGridData) => {
        const res = await dispatch(addLocation(item)).unwrap();
        dispatch(fetchLocations(currentStatus));
        return res;
      },
      update: async (item: LocationGridData) => {
        const res = await dispatch(updateLocation(item)).unwrap();
        dispatch(fetchLocations(currentStatus));
        return res;
      },
      remove: async (id: string) => {
        const res = await dispatch(deleteLocation(id)).unwrap();
        dispatch(fetchLocations(currentStatus));
        return res;
      },
      bulkRemove: async (ids: string[]) => {
        let res;
        for (const id of ids) {
          res = await dispatch(deleteLocation(id)).unwrap();
        }
        dispatch(fetchLocations(currentStatus));
        return res;
      },
    }),
    [enrichedData, loading, dispatch, currentStatus]
  );

  return (
    <MasterCrudPage
      title="Location Master"
      description="Manage location master data"
      idPrefix="LOC"
      domain="location-master"
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
