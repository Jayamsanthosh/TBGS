"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchCreditLimitPaymentModes,
  addCreditLimitPaymentMode,
  updateCreditLimitPaymentMode,
  deleteCreditLimitPaymentMode,
  clearCreditLimitPaymentModeError,
  CreditLimitPaymentModeGridData,
} from "@/lib/creditLimitPaymentModeMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  { key: "PAYMENT_MODE_NAME", label: "Payment Mode Name", type: "text", required: true, placeholder: "e.g., Credit Card" },
  { key: "PAYMENT_MODE_PERCENTAGE", label: "Percentage", type: "text", placeholder: "e.g., 2.50" },
  { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks" },
  {
    key: "STATUS_ENTRY",
    label: "Status",
    type: "select",
    options: [{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }],
    defaultValue: "AC",
    formatter: (val: any) => {
      const s = String(val || "").toUpperCase();
      if (s === "AC") return "ACTIVE";
      if (s === "IN") return "INACTIVE";
      return val;
    },
  },
];

const columns = [
  { key: "PAYMENT_MODE_NAME", label: "Payment Mode Name" },
  { key: "PAYMENT_MODE_PERCENTAGE", label: "Percentage" },
  { key: "REMARKS", label: "Remarks" },
  {
    key: "STATUS_ENTRY",
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

export default function CreditLimitPaymentModeMasterPage() {
  const dispatch = useAppDispatch();
  const { creditLimitPaymentModes, loading, error } = useAppSelector((s) => s.creditLimitPaymentMode);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("");

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "");
  }, []);

  useEffect(() => {
    dispatch(fetchCreditLimitPaymentModes(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearCreditLimitPaymentModeError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: creditLimitPaymentModes,
    isLoading: loading,
    add: async (item: CreditLimitPaymentModeGridData) => {
      const res = await dispatch(addCreditLimitPaymentMode(item)).unwrap();
      dispatch(fetchCreditLimitPaymentModes(currentStatus));
      return res;
    },
    update: async (item: CreditLimitPaymentModeGridData) => {
      const res = await dispatch(updateCreditLimitPaymentMode(item)).unwrap();
      dispatch(fetchCreditLimitPaymentModes(currentStatus));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteCreditLimitPaymentMode(id)).unwrap();
      dispatch(fetchCreditLimitPaymentModes(currentStatus));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteCreditLimitPaymentMode(id)).unwrap();
      }
      dispatch(fetchCreditLimitPaymentModes(currentStatus));
      return res;
    },
  }), [creditLimitPaymentModes, loading, dispatch, currentStatus]);

  return (
    <MasterCrudPage
      title="Credit Limit Payment Mode Master"
      description="Manage credit limit payment mode master data"
      idPrefix="CPM"
      domain="credit-limit-payment-mode-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[
        { label: "All Status", value: "" },
        { label: "Active", value: "AC" },
        { label: "Inactive", value: "IN" },
      ]}
      onStatusFilterChange={handleStatusFilterChange}
    />
  );
}
