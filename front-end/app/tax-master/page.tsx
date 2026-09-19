"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchTaxes,
  addTax,
  updateTax,
  deleteTax,
  clearTaxMasterError,
  TaxMasterGridData,
} from "@/lib/taxMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const normalizeStatus = (val: unknown): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

const fields: MasterField[] = [
  {
    key: "TAX_CODE",
    label: "Tax Code",
    type: "text",
    required: true,
    maxLength: 20,
    placeholder: "e.g., VAT18 / VAT0 / EXEMPT",
    formatter: (val: unknown) => String(val).toUpperCase(),
  },
  {
    key: "TAX_NAME",
    label: "Tax Name",
    type: "text",
    required: true,
    maxLength: 100,
    placeholder: "e.g., VAT STANDARD",
  },
  {
    key: "TAX_TYPE",
    label: "Tax Type",
    type: "select",
    required: true,
    defaultValue: "VAT",
    options: [
      { value: "VAT", label: "VAT" },
      { value: "EXEMPT", label: "Exempt" },
    ],
  },
  {
    key: "TAX_PERCENTAGE",
    label: "Tax Percentage (%)",
    type: "number",
    placeholder: "e.g., 18.00",
    validate: (value: unknown, form?: Record<string, unknown>) => {
      const isVat = String(form?.TAX_TYPE || "").toUpperCase() === "VAT";
      if (isVat && (value == null || value === "")) {
        return "Tax Percentage is required for VAT";
      }
      if (value != null && value !== "") {
        const num = Number(value);
        if (Number.isNaN(num)) return "Enter a valid number";
        if (num < 0 || num > 100) return "Must be between 0 and 100";
      }
      return undefined;
    },
  },
  {
    key: "EFFECTIVE_FROM",
    label: "Effective From",
    type: "date",
  },
  {
    key: "EFFECTIVE_TO",
    label: "Effective To",
    type: "date",
    validate: (value: unknown, form?: Record<string, unknown>) => {
      if (!value || !form?.EFFECTIVE_FROM) return undefined;
      const from = new Date(String(form.EFFECTIVE_FROM)).getTime();
      const to = new Date(String(value)).getTime();
      if (!Number.isNaN(from) && !Number.isNaN(to) && to < from) {
        return "Cannot be before Effective From date";
      }
      return undefined;
    },
  },
  {
    key: "REMARKS",
    label: "Remarks",
    type: "textarea",
    maxLength: 2000,
    placeholder: "Enter any remarks",
  },
  {
    key: "STATUS_MASTER",
    label: "Status",
    type: "select",
    options: [{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }],
    defaultValue: "AC",
    formatter: (val: unknown) => {
      const s = String(val || "").toUpperCase();
      if (s === "AC") return "ACTIVE";
      if (s === "IN" || s === "IA") return "INACTIVE";
      return val;
    },
  },
];

const columns = [
  { key: "TAX_CODE", label: "Tax Code" },
  { key: "TAX_NAME", label: "Tax Name" },
  {
    key: "TAX_PERCENTAGE",
    label: "Tax %",
    render: (val: unknown) => (val != null && val !== "" ? `${Number(val).toFixed(2)}%` : "-"),
  },
  { key: "TAX_TYPE", label: "Tax Type" },
  { key: "EFFECTIVE_FROM", label: "Effective From" },
  { key: "EFFECTIVE_TO", label: "Effective To" },
  { key: "REMARKS", label: "Remarks" },
  {
    key: "STATUS_MASTER",
    label: "Status",
    render: (val: unknown) => {
      const s = normalizeStatus(val);
      const isActive = s === "ACTIVE";
      const colorClass = isActive
        ? "bg-green-500/10 text-green-600 border-green-200"
        : "bg-red-500/10 text-red-600 border-red-200";
      return (
        <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
          {s}
        </Badge>
      );
    },
  },
];

export default function TaxMasterPage() {
  const dispatch = useAppDispatch();
  const { taxes, loading, error } = useAppSelector((s) => s.taxMaster);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchTaxes());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearTaxMasterError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: taxes,
    isLoading: loading,
    add: async (item: TaxMasterGridData) => {
      const res = await dispatch(addTax(item)).unwrap();
      dispatch(fetchTaxes());
      return res;
    },
    update: async (item: TaxMasterGridData) => {
      const res = await dispatch(updateTax(item)).unwrap();
      dispatch(fetchTaxes());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteTax(id)).unwrap();
      dispatch(fetchTaxes());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteTax(id)).unwrap();
      }
      dispatch(fetchTaxes());
      return res;
    },
  }), [taxes, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Tax Master"
      description="Manage tax master data"
      idPrefix="TAX"
      domain="tax-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}