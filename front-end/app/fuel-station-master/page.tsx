"use client";

import { useEffect, useMemo, useState } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchFuelStations,
  addFuelStation,
  updateFuelStation,
  deleteFuelStation,
  clearFuelStationError,
  FuelStationGridData,
} from "@/lib/fuelStationMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_URL } from "@/lib/config";

function AsyncSelectField({
  field,
  form,
  setForm,
  optionsUrl,
  mapOptions,
  dependsOn,
  filterBy,
  clearDependents,
}: {
  field: MasterField;
  form: Record<string, any>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  optionsUrl: string;
  mapOptions: (item: any) => { value: string; label: string };
  dependsOn?: string;
  filterBy?: (item: any, form: Record<string, any>) => boolean;
  clearDependents?: string[];
}) {
  const [rawItems, setRawItems] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    fetch(optionsUrl)
      .then((r) => r.json())
      .then((json) => {
        if (active) setRawItems(json.data || []);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [optionsUrl]);

  const options = useMemo(() => {
    const base = Array.isArray(rawItems) ? rawItems : [];
    const filtered = filterBy ? base.filter((item) => filterBy(item, form)) : base;
    return filtered.map(mapOptions);
  }, [rawItems, filterBy, form, mapOptions]);

  const disabled = dependsOn ? !form[dependsOn] : false;
  const currentValue = form[field.key] !== undefined && form[field.key] !== null ? String(form[field.key]) : "";

  return (
    <Select
      value={currentValue}
      disabled={disabled}
      onValueChange={(v) => {
        setForm((f) => {
          const next = { ...f, [field.key]: v };
          (clearDependents || []).forEach((k) => { next[k] = ""; });
          return next;
        });
      }}
    >
      <SelectTrigger className="h-9 text-xs">
        <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
      </SelectTrigger>
      <SelectContent>
        {(options || []).map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const statusFormatter = (val: any) => {
  const s = String(val || "").toUpperCase();
  if (s === "AC") return "ACTIVE";
  if (s === "IN") return "INACTIVE";
  return val;
};

const fields: MasterField[] = [
  { key: "FUEL_STATIONE_NAME", label: "Fuel Station Name", type: "text", required: true, placeholder: "e.g., Total Energies Arusha", maxLength: 50 },
  {
    key: "COUNTRY_ID",
    label: "Country",
    type: "select",
    required: true,
    placeholder: "Select Country",
    renderField: (props) => (
      <AsyncSelectField
        {...props}
        optionsUrl={`${API_URL}/country-master`}
        mapOptions={(c: any) => ({ value: String(c.Country_Id || c.COUNTRY_ID), label: c.Country_Name || c.COUNTRY_NAME })}
      />
    ),
  },
  {
    key: "REGION_ID",
    label: "Region",
    type: "select",
    required: true,
    placeholder: "Select Region",
    renderField: (props) => (
      <AsyncSelectField
        {...props}
        dependsOn="COUNTRY_ID"
        clearDependents={["DISTRICT_ID"]}
        filterBy={(r: any, form) => form.COUNTRY_ID != null && String(r.COUNTRY_ID ?? r.Country_Id) === String(form.COUNTRY_ID)}
        optionsUrl={`${API_URL}/region-master`}
        mapOptions={(r: any) => ({ value: String(r.REGION_ID), label: r.REGION_NAME })}
      />
    ),
  },
  {
    key: "DISTRICT_ID",
    label: "District",
    type: "select",
    required: true,
    placeholder: "Select District",
    renderField: (props) => (
      <AsyncSelectField
        {...props}
        dependsOn="REGION_ID"
        filterBy={(d: any, form) => form.REGION_ID != null && String(d.REGION_ID ?? d.Region_Id) === String(form.REGION_ID)}
        optionsUrl={`${API_URL}/district-master`}
        mapOptions={(d: any) => ({ value: String(d.District_id || d.DISTRICT_ID), label: d.District_Name || d.DISTRICT_NAME })}
      />
    ),
  },
  { key: "FUEL_STATION_ADDRESS", label: "Address", type: "textarea", placeholder: "e.g., Njiro, Arusha" },
  { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks" },
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
  { key: "FUEL_STATIONE_NAME", label: "Fuel Station Name" },
  { key: "COUNTRY_NAME", label: "Country" },
  { key: "REGION_NAME", label: "Region" },
  { key: "DISTRICT_NAME", label: "District" },
  { key: "FUEL_STATION_ADDRESS", label: "Address" },
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

export default function FuelStationMasterPage() {
  const dispatch = useAppDispatch();
  const { fuelStations, loading, error } = useAppSelector((s) => s.fuelStation);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchFuelStations("ALL"));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearFuelStationError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: fuelStations,
    isLoading: loading,
    add: async (item: FuelStationGridData) => {
      const res = await dispatch(addFuelStation(item)).unwrap();
      dispatch(fetchFuelStations("ALL"));
      return res;
    },
    update: async (item: FuelStationGridData) => {
      const res = await dispatch(updateFuelStation(item)).unwrap();
      dispatch(fetchFuelStations("ALL"));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteFuelStation(id)).unwrap();
      dispatch(fetchFuelStations("ALL"));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteFuelStation(id)).unwrap();
      }
      dispatch(fetchFuelStations("ALL"));
      return res;
    },
  }), [fuelStations, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Fuel Station Master"
      description="Manage fuel station master data"
      idPrefix="FS"
      domain="fuel-station-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }]}
    />
  );
}
