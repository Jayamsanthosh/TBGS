"use client";

import { useMemo, useEffect, useState } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchPaymentTerms,
  addPaymentTerm,
  updatePaymentTerm,
  deletePaymentTerm,
  clearPaymentTermError,
  PaymentTermGridData,
} from "@/lib/paymentTermMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_URL } from "@/lib/config";

function TriggerEventSelect({
  field,
  form,
  setForm,
  triggerEvents,
}: {
  field: MasterField;
  form: Record<string, any>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  triggerEvents: any[];
}) {
  return (
    <Select value={form[field.key] !== undefined && form[field.key] !== null ? String(form[field.key]) : ""} onValueChange={(v) => setForm((f) => ({ ...f, [field.key]: v }))}>
      <SelectTrigger className="h-9 text-xs">
        <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
      </SelectTrigger>
      <SelectContent>
        {(triggerEvents || []).map((e) => (
          <SelectItem key={String(e.TRIGGER_EVENT_ID)} value={String(e.TRIGGER_EVENT_ID)}>{e.TRIGGER_EVENT_NAME}</SelectItem>
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

export default function PaymentTermMasterPage() {
  const dispatch = useAppDispatch();
  const { paymentTerms, loading, error } = useAppSelector((s) => s.paymentTerm);
  const { toast } = useToast();
  const [triggerEvents, setTriggerEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/payment-trigger-event-master`)
      .then((r) => r.json())
      .then((json) => setTriggerEvents(json.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    dispatch(fetchPaymentTerms("ALL"));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearPaymentTermError());
    }
  }, [error, dispatch, toast]);

  const cleanPayload = (item: PaymentTermGridData): PaymentTermGridData => {
    const copy = { ...item };
    (["NO_OF_DAYS", "DOWN_PAYMENT_PERCENTAGE", "BALANCE_PAYMENT_PERCENTAGE", "NO_OF_INSTALLMENTS", "INTEREST_RATE", "GRACE_PERIOD_DAYS"] as const).forEach((k) => {
      if (!copy[k]) copy[k] = undefined;
    });
    return copy;
  };

  const fields: MasterField[] = [
    { key: "PAYMENT_TERM_CODE", label: "Payment Term Code", type: "text", required: true, placeholder: "e.g., NET30", maxLength: 20 },
    { key: "PAYMENT_TERM_NAME", label: "Payment Term Name", type: "text", required: true, placeholder: "e.g., Net 30 Days", maxLength: 150 },
    {
      key: "TRIGGER_EVENT_ID",
      label: "Trigger Event",
      type: "select",
      required: true,
      placeholder: "Select Trigger Event",
      renderField: (props) => <TriggerEventSelect {...props} triggerEvents={triggerEvents} />,
    },
    { key: "DUE_DATE_CALCULATION", label: "Due Date Calculation", type: "text", placeholder: "e.g., FIXED_DAYS", maxLength: 20 },
    { key: "NO_OF_DAYS", label: "No of Days", type: "number", placeholder: "e.g., 30" },
    { key: "DOWN_PAYMENT_PERCENTAGE", label: "Down Payment %", type: "number", placeholder: "e.g., 20" },
    { key: "BALANCE_PAYMENT_PERCENTAGE", label: "Balance Payment %", type: "number", placeholder: "e.g., 80" },
    {
      key: "INSTALLMENT_ALLOWED",
      label: "Installment Allowed",
      type: "select",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
      defaultValue: "NO",
    },
    { key: "NO_OF_INSTALLMENTS", label: "No of Installments", type: "number", placeholder: "e.g., 4" },
    { key: "INTEREST_RATE", label: "Interest Rate", type: "number", placeholder: "e.g., 2.5" },
    { key: "GRACE_PERIOD_DAYS", label: "Grace Period Days", type: "number", placeholder: "e.g., 5" },
    { key: "DESCRIPTION", label: "Description", type: "textarea", placeholder: "Enter description" },
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
    { key: "PAYMENT_TERM_CODE", label: "Code" },
    { key: "PAYMENT_TERM_NAME", label: "Name" },
    {
      key: "TRIGGER_EVENT_ID",
      label: "Trigger Event",
      render: (val: any) => {
        const found = (triggerEvents || []).find((e: any) => String(e.TRIGGER_EVENT_ID) === String(val));
        return found ? found.TRIGGER_EVENT_NAME : val != null && val !== "" ? val : "-";
      },
    },
    { key: "DUE_DATE_CALCULATION", label: "Due Date Calc" },
    { key: "NO_OF_DAYS", label: "Days" },
    { key: "DOWN_PAYMENT_PERCENTAGE", label: "Down %" },
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

  const storeOverrides = useMemo(() => ({
    data: paymentTerms,
    isLoading: loading,
    add: async (item: PaymentTermGridData) => {
      const res = await dispatch(addPaymentTerm(cleanPayload(item))).unwrap();
      dispatch(fetchPaymentTerms("ALL"));
      return res;
    },
    update: async (item: PaymentTermGridData) => {
      const res = await dispatch(updatePaymentTerm(cleanPayload(item))).unwrap();
      dispatch(fetchPaymentTerms("ALL"));
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deletePaymentTerm(id)).unwrap();
      dispatch(fetchPaymentTerms("ALL"));
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deletePaymentTerm(id)).unwrap();
      }
      dispatch(fetchPaymentTerms("ALL"));
      return res;
    },
  }), [paymentTerms, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Payment Term Master"
      description="Manage payment term master data"
      idPrefix="PT"
      domain="payment-term-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[{ label: "Active", value: "AC" }, { label: "Inactive", value: "IN" }]}
    />
  );
}
