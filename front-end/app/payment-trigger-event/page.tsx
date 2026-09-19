"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchPaymentTriggerEvents,
  addPaymentTriggerEvent,
  updatePaymentTriggerEvent,
  deletePaymentTriggerEvent,
  clearPaymentTriggerEventsError,
  PaymentTriggerEventGridData,
} from "@/lib/paymentTriggerEventMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  { key: "TRIGGER_EVENT_CODE", label: "Trigger Event Code", type: "text", required: true, placeholder: "e.g., PAY001" },
  { key: "TRIGGER_EVENT_NAME", label: "Trigger Event Name", type: "text", required: true, placeholder: "e.g., Advance Payment" },
  { key: "DESCRIPTION", label: "Description", type: "textarea", placeholder: "Describe when this event triggers" },
  { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks" },
  {
    key: "STATUS_MASTER",
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
  { key: "TRIGGER_EVENT_CODE", label: "Code" },
  { key: "TRIGGER_EVENT_NAME", label: "Trigger Event Name" },
  { key: "DESCRIPTION", label: "Description" },
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

export default function PaymentTriggerEventMasterPage() {
  const dispatch = useAppDispatch();
  const { triggerEvents, loading, error } = useAppSelector((s) => s.paymentTriggerEvents);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchPaymentTriggerEvents());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearPaymentTriggerEventsError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: triggerEvents,
    isLoading: loading,
    add: async (item: PaymentTriggerEventGridData) => {
      const res = await dispatch(addPaymentTriggerEvent(item)).unwrap();
      dispatch(fetchPaymentTriggerEvents());
      return res;
    },
    update: async (item: PaymentTriggerEventGridData) => {
      const res = await dispatch(updatePaymentTriggerEvent(item)).unwrap();
      dispatch(fetchPaymentTriggerEvents());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deletePaymentTriggerEvent(id)).unwrap();
      dispatch(fetchPaymentTriggerEvents());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deletePaymentTriggerEvent(id)).unwrap();
      }
      dispatch(fetchPaymentTriggerEvents());
      return res;
    },
  }), [triggerEvents, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Payment Trigger Events"
      description="Manage payment trigger event master data"
      idPrefix="PTE"
      domain="payment-trigger-event"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
