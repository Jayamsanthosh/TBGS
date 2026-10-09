"use client";

import StepReview from "@/components/wizard/StepReview";
import type { ReviewColumn } from "@/components/wizard/types";

/* Final step of the purchase request wizard: the header and every line on one
   page. Only lines with content are listed, matching what gets saved. */
export default function RequestReview({
  form,
  headerLabels,
  rows,
  onEditLine,
  onAddLine,
}: {
  form: Record<string, any>;
  headerLabels: Record<string, string>;
  rows: any[];
  onEditLine: (row: any) => void;
  onAddLine: () => void;
}) {
  const shown = (v: any) => (v === null || v === undefined || v === "" ? "" : v);
  const num = (v: any) => (v === "" || v == null ? "-" : v);

  const headerFields = [
    { label: "Request No", value: form.PURCHASE_REQUEST_NO },
    { label: "Request Date", value: form.PURCHASE_REQUEST_DATE },
    { label: "Requested By", value: headerLabels.REQUESTED_BY_EMP_ID },
    { label: "Company", value: headerLabels.COMPANY_ID },
    { label: "Branch", value: headerLabels.BRANCH_ID },
    { label: "PURCHASE STORE", value: headerLabels.PO_STORE_ID },
    { label: "Camp", value: headerLabels.CAMP_ID },
    { label: "Request Store", value: headerLabels.REQUEST_STORE_ID },
    { label: "Request Type", value: headerLabels.REQUEST_TYPE_ID },
    { label: "Priority", value: headerLabels.PRIORITY_ID },
    { label: "Status", value: headerLabels.STATUS_ID },
    { label: "Delivery Location", value: headerLabels.DELIVERY_LOCATION_ID },
    { label: "Required Date", value: form.REQUIRED_DATE },
    { label: "Status Entry", value: headerLabels.STATUS_ENTRY },
    { label: "Reason", value: form.REASON },
    { label: "Remarks", value: form.REMARKS },
  ].filter((f) => shown(f.value) !== "");

  const columns: ReviewColumn[] = [
    { label: "Line", render: (r) => r.LINE_NO ?? "", emphasis: true },
    { label: "Ref Type", render: (r) => r.REFERENCE_TYPE_NAME || r.REFERENCE_TYPE_ID || "-" },
    { label: "Ref No", render: (r) => r.REFERENCE_NO || "-" },
    { label: "Main Category", render: (r) => r.MAIN_CATEGORY_NAME || r.MAIN_CATEGORY_ID || "-" },
    { label: "Sub Category", render: (r) => r.SUB_CATEGORY_NAME || r.SUB_CATEGORY_ID || "-" },
    { label: "Product", render: (r) => r.PRODUCT_NAME || r.PRODUCT_ID || "-" },
    { label: "Description", render: (r) => r.DESCRIPTION || "-" },
    { label: "Qty", render: (r) => num(r.Total_Quantity), numeric: true },
    { label: "UOM", render: (r) => r.UOM_NAME || r.UOM_ID || "-" },
    { label: "Packing", render: (r) => num(r.Total_Packing), numeric: true },
    { label: "Truck", render: (r) => r.TRUCK_NAME || r.TRUCK_ID || "-" },
    { label: "Required Date", render: (r) => r.REQUIRED_DATE || "-" },
  ];

  return (
    <StepReview
      headerTitle="Request Header"
      headerFields={headerFields}
      dtlTitle="Request Detail Lines"
      columns={columns}
      rows={rows}
      onEditLine={onEditLine}
      emptyMessage="No detail lines added. Use Add Line to create one."
      onAddLine={onAddLine}
      addLabel="Add Line"
    />
  );
}
