"use client";

import StepReview from "@/components/wizard/StepReview";
import type { ReviewColumn } from "@/components/wizard/types";

/* Final step of the opening stock wizard: the header and every detail line on
   one page. Only lines with content are listed, matching what gets saved. The
   amount columns are re-derived from line qty/rate for a consistent preview -
   the backend is the authority for what is stored. */
export default function OpeningStockReview({
  form,
  headerLabels,
  rows,
  headerRate,
  onEditLine,
  onAddLine,
}: {
  form: Record<string, any>;
  headerLabels: Record<string, string>;
  rows: any[];
  headerRate: number;
  onEditLine: (row: any) => void;
  onAddLine: () => void;
}) {
  const shown = (v: any) => (v === null || v === undefined || v === "" ? "" : v);
  const num = (v: any) => (v === "" || v == null ? "-" : v);

  const headerFields = [
    { label: "Opening Stock Date", value: form.OPENING_STOCK_DATE },
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
  const costFc = (r: any) => (Number(r.TOTAL_QUANTITY || 0) || 0) * (Number(r.RATE_FC || 0) || 0);
  const costLc = (r: any) => costFc(r) * rate;

  const columns: ReviewColumn[] = [
    { label: "Line", render: (r) => r.LINE_NO ?? "", emphasis: true },
    { label: "Main Category", render: (r) => r.MAIN_CATEGORY_NAME || r.MAIN_CATEGORY_ID || "-" },
    { label: "Sub Category", render: (r) => r.SUB_CATEGORY_NAME || r.SUB_CATEGORY_ID || "-" },
    { label: "Product", render: (r) => r.PRODUCT_NAME || r.PRODUCT_ID || "-" },
    { label: "Pcs / Packing", render: (r) => num(r.NO_OF_PCS_PER_PACKING), numeric: true },
    { label: "Qty", render: (r) => num(r.TOTAL_QUANTITY), numeric: true },
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
    { label: "Remarks", render: (r) => r.REMARKS || "-" },
  ];

  return (
    <StepReview
      headerTitle="Opening Stock Header"
      headerFields={headerFields}
      dtlTitle="Opening Stock Detail Lines"
      columns={columns}
      rows={rows}
      onEditLine={onEditLine}
      emptyMessage="No detail lines added. Use Add Line to create one."
      onAddLine={onAddLine}
      addLabel="Add Line"
    />
  );
}