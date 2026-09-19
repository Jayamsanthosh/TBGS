"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchLicensePermitTypes, addLicensePermitType, updateLicensePermitType, deleteLicensePermitType, clearLicensePermitTypesError, LicensePermitTypeGridData } from "@/lib/licensePermitTypeSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  { key: "LICENSE_PERMIT_NAME", label: "License Permit Name", type: "text", required: true, placeholder: "e.g. Fireworks License" },
  { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks" },
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
  { key: "LICENSE_PERMIT_NAME", label: "License Permit Name" },
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

export default function LicensePermitTypePage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.licensePermitTypes);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchLicensePermitTypes());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearLicensePermitTypesError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: items,
    isLoading: loading,
    add: async (item: LicensePermitTypeGridData) => {
      const res = await dispatch(addLicensePermitType(item)).unwrap();
      dispatch(fetchLicensePermitTypes());
      return res;
    },
    update: async (item: LicensePermitTypeGridData) => {
      const res = await dispatch(updateLicensePermitType(item)).unwrap();
      dispatch(fetchLicensePermitTypes());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteLicensePermitType(id)).unwrap();
      dispatch(fetchLicensePermitTypes());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteLicensePermitType(id)).unwrap();
      }
      dispatch(fetchLicensePermitTypes());
      return res;
    },
  }), [items, loading, dispatch]);

  return (
    <MasterCrudPage
      title="License Permit Types"
      description="Manage license permit type master data"
      idPrefix="LPT"
      domain="license-permit-type"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
