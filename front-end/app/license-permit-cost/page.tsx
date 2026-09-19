"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchLicensePermitCosts, addLicensePermitCost, updateLicensePermitCost, deleteLicensePermitCost, clearLicensePermitCostError, LicensePermitCostGridData } from "@/lib/licensePermitCostSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  { key: "LICENSE_PERMIT_ID", label: "License Permit", type: "select", required: true, options: [], placeholder: "Select license permit" },
  { key: "SALES_PACKAGE_TYPE_ID", label: "Sales Package Type", type: "select", required: true, options: [], placeholder: "Select sales package type" },
  { key: "PRICE_TYPE_ID", label: "Price Type", type: "select", required: true, options: [], placeholder: "Select price type" },
  { key: "PRICE_PACKAGE_ID", label: "Price Package", type: "select", required: true, options: [], placeholder: "Select price package" },
  { key: "GOVT_RATE", label: "Govt Rate", type: "number", required: true, placeholder: "e.g., 1000.00" },
  { key: "ACTUAL_AMOUNT", label: "Actual Amount", type: "number", required: true, placeholder: "e.g., 1200.00" },
  { key: "CURRENCY_ID", label: "Currency", type: "select", required: true, options: [], placeholder: "Select currency" },
  { key: "EFFECTIVE_FROM", label: "Effective From", type: "date", required: true },
  { key: "EFFECTIVE_TO", label: "Effective To", type: "date", required: true },
  { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Additional notes..." },
  {
    key: "STATUS_MASTER",
    label: "Status",
    type: "select",
    options: [
      { label: "Active", value: "AC" },
      { label: "Inactive", value: "IN" }
    ],
    defaultValue: "AC",
    formatter: (val: any) => {
      const s = String(val || "").toLowerCase();
      if (s === "active") return "AC";
      if (s === "inactive") return "IN";
      return val;
    },
  },
];

const columns = [
  { key: "SNO", label: "SNO" },
  { key: "LICENSE_PERMIT_NAME", label: "License Permit" },
  { key: "SALES_PACKAGE_TYPE_NAME", label: "Sales Package" },
  { key: "PRICE_TYPE_NAME", label: "Price Type" },
  { key: "PRICE_PACKAGE_NAME", label: "Price Package" },
  { key: "GOVT_RATE", label: "Govt Rate" },
  { key: "ACTUAL_AMOUNT", label: "Actual Amount" },
  { key: "CURRENCY_NAME", label: "Currency" },
  { key: "EFFECTIVE_FROM", label: "Effective From" },
  { key: "EFFECTIVE_TO", label: "Effective To" },
  {
    key: "STATUS_MASTER",
    label: "Status",
    render: (val: any) => {
      const sv = String(val || "").toLowerCase();
      const isActive = sv === "active" || sv === "ac";
      const colorClass = isActive
        ? "bg-green-500/10 text-green-600 border-green-200"
        : "bg-red-500/10 text-red-600 border-red-200";
      return (
        <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
];

export default function LicensePermitCostPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.licensePermitCost);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("");

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "");
  }, []);

  const { data: licensePermits } = useApiQuery("lpc-license-permits", async () => {
    const res = await fetch(`${API_URL}/license-permit-type`);
    if (!res.ok) throw new Error("Failed to fetch license permits");
    const json = await res.json();
    return (json.data || []).map((u: any) => ({ ...u, id: u.LICENSE_PERMIT_ID }));
  });

  const { data: salesPackageTypes } = useApiQuery("lpc-sales-package-types", async () => {
    const res = await fetch(`${API_URL}/sales-package-type-master`);
    if (!res.ok) throw new Error("Failed to fetch sales package types");
    const json = await res.json();
    return (json.data || []).map((u: any) => ({ ...u, id: u.SALES_PACKAGE_TYPE_ID }));
  });

  const { data: priceTypes } = useApiQuery("lpc-price-types", async () => {
    const res = await fetch(`${API_URL}/price-type-master`);
    if (!res.ok) throw new Error("Failed to fetch price types");
    const json = await res.json();
    return (json.data || []).map((u: any) => ({ ...u, id: u.PRICE_TYPE_ID }));
  });

  const { data: pricePackages } = useApiQuery("lpc-price-packages", async () => {
    const res = await fetch(`${API_URL}/price-package-master`);
    if (!res.ok) throw new Error("Failed to fetch price packages");
    const json = await res.json();
    return (json.data || []).map((u: any) => ({ ...u, id: u.PRICE_PACKAGE_ID }));
  });

  const { data: currencies } = useApiQuery("lpc-currencies", async () => {
    const res = await fetch(`${API_URL}/currency-master`);
    if (!res.ok) throw new Error("Failed to fetch currencies");
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ ...c, id: c.CURRENCY_ID }));
  });

  const licensePermitOptions = useMemo(() => {
    if (!Array.isArray(licensePermits)) return [];
    return licensePermits.map((u: any) => ({
      value: String(u.LICENSE_PERMIT_ID),
      label: u.LICENSE_PERMIT_NAME || `ID: ${u.LICENSE_PERMIT_ID}`,
    }));
  }, [licensePermits]);

  const salesPackageTypeOptions = useMemo(() => {
    if (!Array.isArray(salesPackageTypes)) return [];
    return salesPackageTypes.map((u: any) => ({
      value: String(u.SALES_PACKAGE_TYPE_ID),
      label: u.SALES_PACKAGE_TYPE_NAME || `ID: ${u.SALES_PACKAGE_TYPE_ID}`,
    }));
  }, [salesPackageTypes]);

  const priceTypeOptions = useMemo(() => {
    if (!Array.isArray(priceTypes)) return [];
    return priceTypes.map((u: any) => ({
      value: String(u.PRICE_TYPE_ID),
      label: u.PRICE_TYPE_NAME || `ID: ${u.PRICE_TYPE_ID}`,
    }));
  }, [priceTypes]);

  const pricePackageOptions = useMemo(() => {
    if (!Array.isArray(pricePackages)) return [];
    return pricePackages.map((u: any) => ({
      value: String(u.PRICE_PACKAGE_ID),
      label: u.PRICE_PACKAGE_NAME || `ID: ${u.PRICE_PACKAGE_ID}`,
    }));
  }, [pricePackages]);

  const currencyOptions = useMemo(() => {
    if (!Array.isArray(currencies)) return [];
    return currencies.map((c: any) => ({
      value: String(c.CURRENCY_ID),
      label: c.CURRENCY_NAME || `ID: ${c.CURRENCY_ID}`,
    }));
  }, [currencies]);

  const fieldsWithOptions: MasterField[] = useMemo(() => {
    return fields.map((f) => {
      if (f.key === "LICENSE_PERMIT_ID") return { ...f, options: licensePermitOptions };
      if (f.key === "SALES_PACKAGE_TYPE_ID") return { ...f, options: salesPackageTypeOptions };
      if (f.key === "PRICE_TYPE_ID") return { ...f, options: priceTypeOptions };
      if (f.key === "PRICE_PACKAGE_ID") return { ...f, options: pricePackageOptions };
      if (f.key === "CURRENCY_ID") return { ...f, options: currencyOptions };
      return f;
    });
  }, [licensePermitOptions, salesPackageTypeOptions, priceTypeOptions, pricePackageOptions, currencyOptions]);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.map((u: any) => {
      const licensePermit = Array.isArray(licensePermits)
        ? licensePermits.find((lp: any) => Number(lp.LICENSE_PERMIT_ID) === Number(u.LICENSE_PERMIT_ID))
        : undefined;
      const salesPackage = Array.isArray(salesPackageTypes)
        ? salesPackageTypes.find((sp: any) => Number(sp.SALES_PACKAGE_TYPE_ID) === Number(u.SALES_PACKAGE_TYPE_ID))
        : undefined;
      const pricePkg = Array.isArray(pricePackages)
        ? pricePackages.find((pp: any) => Number(pp.PRICE_PACKAGE_ID) === Number(u.PRICE_PACKAGE_ID))
        : undefined;
      return {
        ...u,
        id: u.SNO,
        SNO: u.SNO,
        LICENSE_PERMIT_ID: String(u.LICENSE_PERMIT_ID ?? ""),
        SALES_PACKAGE_TYPE_ID: String(u.SALES_PACKAGE_TYPE_ID ?? ""),
        PRICE_TYPE_ID: String(u.PRICE_TYPE_ID ?? ""),
        PRICE_PACKAGE_ID: String(u.PRICE_PACKAGE_ID ?? ""),
        CURRENCY_ID: String(u.CURRENCY_ID ?? ""),
        LICENSE_PERMIT_NAME: licensePermit?.LICENSE_PERMIT_NAME || u.LICENSE_PERMIT_NAME || `ID: ${u.LICENSE_PERMIT_ID}`,
        SALES_PACKAGE_TYPE_NAME: salesPackage?.SALES_PACKAGE_TYPE_NAME || u.SALES_PACKAGE_TYPE_NAME || `ID: ${u.SALES_PACKAGE_TYPE_ID}`,
        PRICE_TYPE_NAME: u.PRICE_TYPE_NAME || pricePkg?.PRICE_TYPE_NAME || "",
        PRICE_PACKAGE_NAME: u.PRICE_PACKAGE_name || u.PRICE_PACKAGE_NAME || pricePkg?.PRICE_PACKAGE_NAME || "",
        CURRENCY_NAME: u.CURRENCY_NAME || "",
      };
    });
  }, [items, licensePermits, salesPackageTypes, pricePackages]);

  useEffect(() => {
    dispatch(fetchLicensePermitCosts(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearLicensePermitCostError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: LicensePermitCostGridData) => {
      const res = await dispatch(addLicensePermitCost(item)).unwrap();
      dispatch(fetchLicensePermitCosts(currentStatus));
      return res;
    },
    update: async (item: LicensePermitCostGridData) => {
      const res = await dispatch(updateLicensePermitCost(item)).unwrap();
      dispatch(fetchLicensePermitCosts(currentStatus));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteLicensePermitCost(id)).unwrap();
      dispatch(fetchLicensePermitCosts(currentStatus));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteLicensePermitCost(id)).unwrap();
      }
      dispatch(fetchLicensePermitCosts(currentStatus));
      return res;
    },
  }), [enrichedData, loading, dispatch, currentStatus]);

  return (
    <MasterCrudPage
      title="License Permit Cost"
      description="Manage license permit cost master data"
      idPrefix="LPC"
      domain="license-permit-cost"
      fields={fieldsWithOptions}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      onBeforeEdit={async (item) => {
        const id = Number(item.SNO ?? item.id);
        if (!id) return undefined;
        const res = await fetch(`${API_URL}/license-permit-cost/${id}`);
        if (!res.ok) return undefined;
        const json = await res.json();
        return json.data;
      }}
      statusOptions={[
        { label: "All Status", value: "" },
        { label: "Active", value: "AC" },
        { label: "Inactive", value: "IN" },
      ]}
      onStatusFilterChange={handleStatusFilterChange}
    />
  );
}
