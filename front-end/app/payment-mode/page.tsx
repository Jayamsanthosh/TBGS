"use client";

import { useMemo, useEffect, useCallback, useState } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchPaymentModes,
  addPaymentMode,
  updatePaymentMode,
  deletePaymentMode,
  clearPaymentModesError,
  PaymentModeGridData,
} from "@/lib/paymentModeMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  { key: "PAYMENT_MODE_NAME", label: "Payment Mode Name", type: "text", required: true, placeholder: "e.g., Cash" },
  {
    key: "PAYMENT_MODE_PERCENTAGE",
    label: "Percentage",
    type: "number",
    placeholder: "e.g., 2.50",
    formatter: (val: any) => {
      if (val === "" || val === undefined || val === null) return "";
      const n = parseFloat(String(val));
      return isNaN(n) ? "" : n.toFixed(2);
    },
  },
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

export default function PaymentModeMasterPage() {
  const dispatch = useAppDispatch();
  const { paymentModes, loading, error } = useAppSelector((s) => s.paymentModes);
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("AC");

  useEffect(() => {
    dispatch(fetchPaymentModes(currentStatus));
  }, [dispatch, currentStatus]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearPaymentModesError());
    }
  }, [error, dispatch, toast]);

  const handleStatusFilterChange = useCallback((value: string) => {
    setCurrentStatus(value || "AC");
  }, []);

  const storeOverrides = useMemo(() => ({
    data: paymentModes,
    isLoading: loading,
    add: async (item: PaymentModeGridData) => {
      const res = await dispatch(addPaymentMode(item)).unwrap();
      dispatch(fetchPaymentModes(currentStatus));
      return res;
    },
    update: async (item: PaymentModeGridData) => {
      const res = await dispatch(updatePaymentMode(item)).unwrap();
      dispatch(fetchPaymentModes(currentStatus));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deletePaymentMode(id)).unwrap();
      dispatch(fetchPaymentModes(currentStatus));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deletePaymentMode(id)).unwrap();
      }
      dispatch(fetchPaymentModes(currentStatus));
      return res;
    },
  }), [paymentModes, loading, dispatch, currentStatus]);

  return (
    <MasterCrudPage
      title="Payment Modes"
      description="Manage payment mode master data"
      idPrefix="PMD"
      domain="payment-mode"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }]}
      onStatusFilterChange={handleStatusFilterChange}
    />
  );
}
