"use client";

import StepReview from "@/components/wizard/StepReview";
import type { ReviewColumn } from "@/components/wizard/types";

/* Final step of the purchase GRN wizard: the header and every detail line on
   one page. The amount columns are re-derived from line qty/rate for a
   consistent preview - the backend is the authority for what is stored. */
export default function PurchaseGrnReview({
  form,
  headerLabels,
  supplierLabel,
  rows,
  headerRate,
  onEditLine,
  onAddLine,
  onOpenBatch,
}: {
  form: Record<string, any>;
  headerLabels: Record<string, string>;
  supplierLabel: string;
  rows: any[];
  headerRate: number;
  onEditLine: (row: any) => void;
  onAddLine: () => void;
  onOpenBatch?: (row: any) => void;
}) {
  const shown = (v: any) => (v === null || v === undefined || v === "" ? "" : v);
  const num = (v: any) => (v === "" || v == null ? "-" : v);

  const headerFields = [
    { label: "GRN Date", value: form.PURCHASE_GRN_DATE },
    { label: "Purchase Order", value: form.PURCHASE_ORDER_NO },
    { label: "Supplier", value: supplierLabel },
    { label: "Delivery Note No", value: form.SUPPLIER_DELIVERY_NOTE_NO },
    { label: "Delivery Note Date", value: form.SUPPLIER_DELIVERY_NOTE_DATE },
    { label: "Company", value: headerLabels.COMPANY_ID },
    { label: "Camp", value: headerLabels.CAMP_ID },
    { label: "Store", value: headerLabels.STORE_ID },
    { label: "Location", value: headerLabels.LOCATION_ID },
    { label: "Currency", value: headerLabels.CURRENCY_ID },
    { label: "Exchange Rate", value: form.EXCHANGE_RATE },
    { label: "Status", value: headerLabels.STATUS_ID },
    { label: "Remarks", value: form.REMARKS },
  ].filter((f) => shown(f.value) !== "");

  const rate = Number.isFinite(Number(headerRate)) ? Number(headerRate) : 0;
  const accepted = (r: any) =>
    (Number(r.RECEIVED_QUANTITY || 0) || 0) - (Number(r.REJECTED_QUANTITY || 0) || 0);
  const costFc = (r: any) => accepted(r) * (Number(r.RATE_FC || 0) || 0);
  const costLc = (r: any) => costFc(r) * rate;

  const columns: ReviewColumn[] = [
    { label: "Line", render: (r) => r.LINE_NO ?? "", emphasis: true },
    { label: "Product", render: (r) => r.PRODUCT_NAME || r.PRODUCT_ID || "-" },
    { label: "PO Qty", render: (r) => num(r.PO_QUANTITY), numeric: true },
    { label: "Already Recv", render: (r) => num(r.ALREADY_RECEIVED_QTY), numeric: true },
    { label: "Balance", render: (r) => num(r.BALANCE_TO_RECEIVE_QTY), numeric: true },
    { label: "Received", render: (r) => num(r.RECEIVED_QUANTITY), numeric: true },
    { label: "Rejected", render: (r) => num(r.REJECTED_QUANTITY), numeric: true },
    { label: "Accepted", render: (r) => accepted(r).toFixed(3), numeric: true },
    { label: "Batch Mapped", render: (r) => num(r.BATCH_MAPPED_QUANTITY), numeric: true },
    { label: "Balance to Map", render: (r) => num(r.BALANCE_TO_MAP_BATCH_QTY), numeric: true, onClick: (r) => onOpenBatch?.(r) },
    { label: "UOM", render: (r) => r.UOM_NAME || r.UOM_ID || "-" },
    { label: "Alt Qty", render: (r) => num(r.ALT_QUANTITY), numeric: true },
    { label: "Alt UOM", render: (r) => r.ALT_UOM_NAME || r.ALT_UOM_ID || "-" },
    { label: "Rate FC", render: (r) => num(r.RATE_FC), numeric: true },
    { label: "Cost FC", render: (r) => costFc(r).toFixed(3), numeric: true },
    { label: "Rate LC", render: (r) => ((Number(r.RATE_FC || 0) || 0) * rate).toFixed(3), numeric: true },
    { label: "Cost LC", render: (r) => costLc(r).toFixed(3), numeric: true },
    { label: "Batch No", render: (r) => r.BATCH_NO || "-" },
    { label: "Serial No", render: (r) => r.SERIAL_NO || "-" },
    { label: "Mfg Date", render: (r) => r.MANUFACTURE_DATE || "-" },
    { label: "Expiry Date", render: (r) => r.EXPIRY_DATE || "-" },
    { label: "Rack", render: (r) => r.RACK_NAME || r.RACK_ID || "-" },
    { label: "Rejection Remarks", render: (r) => r.REJECTION_REMARKS || "-" },
    { label: "Remarks", render: (r) => r.REMARKS || "-" },
  ];

  return (
    <StepReview
      headerTitle="Purchase GRN Header"
      headerFields={headerFields}
      dtlTitle="Purchase GRN Detail Lines"
      columns={columns}
      rows={rows}
      onEditLine={onEditLine}
      emptyMessage="No detail lines added. Use Add Line to create one."
      onAddLine={onAddLine}
      addLabel="Add Line"
    />
  );
}
