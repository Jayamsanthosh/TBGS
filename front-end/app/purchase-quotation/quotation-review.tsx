"use client";

import StepReview from "@/components/wizard/StepReview";

/* Final step of the quotation wizard. The detail lines are already on screen
   directly above this as editable strips, so the review only confirms the
   header and the money totals. */
export default function QuotationReview({
  form,
  headerLabels,
  totals,
  money,
  rate6,
}: {
  form: Record<string, any>;
  /* Resolved display names for the header select fields, keyed by form field. */
  headerLabels: Record<string, string>;
  totals: any;
  money: (v: any) => string;
  rate6: (v: any) => string;
}) {
  const shown = (v: any) => (v === null || v === undefined || v === "" ? "" : v);

  const headerFields = [
    { label: "Quotation No", value: form.PURCHASE_QUOTATION_NO },
    { label: "Quotation Date", value: form.PURCHASE_QUOTATION_DATE },
    { label: "Supplier", value: headerLabels.SUPPLIER_BP_ID },
    { label: "Company", value: headerLabels.COMPANY_ID },
    { label: "Branch", value: headerLabels.BRANCH_ID },
    { label: "PO Store", value: headerLabels.PO_STORE_ID },
    { label: "Quotation Status", value: headerLabels.QUOTATION_STATUS_ID },
    { label: "Supplier Quotation No", value: form.SUPPLIER_QUOTATION_NO },
    { label: "Valid From", value: form.VALID_FROM_DATE },
    { label: "Valid To", value: form.VALID_TO_DATE },
    { label: "Payment Term", value: headerLabels.PAYMENT_TERM_ID },
    { label: "Payment Mode", value: headerLabels.PAYMENT_MODE_ID },
    { label: "Shipment Mode", value: headerLabels.SHIPMENT_MODE_ID },
    { label: "Delivery Location", value: headerLabels.DELIVERY_LOCATION_ID },
    { label: "Delivery Date", value: form.DELIVERY_DATE },
    { label: "Delivery Term", value: form.DELIVERY_TERM },
    { label: "Currency", value: headerLabels.CURRENCY_ID },
    { label: "Exchange Rate", value: form.EXCHANGE_RATE },
    { label: "Status Entry", value: headerLabels.STATUS_ENTRY },
    { label: "Remarks", value: form.REMARKS },
    { label: "Shipment Remarks", value: form.SHIPMENT_REMARKS },
  ].filter((f) => shown(f.value) !== "");

  const totalCards = [
    /* Sits with the LC figures it produced, not up in the header block, so the
       rate and the amounts it converted read as one set. rollup hands back every
       distinct rate the lines used - normally one, but a line may carry its
       own, and collapsing that to a single number would misstate the others. */
    {
      label: "Exchange Rate",
      value: (totals.EXCHANGE_RATE_VALUES || []).length > 1
        ? (totals.EXCHANGE_RATE_VALUES as any[]).map((n: any) => rate6(n)).join(", ")
        : rate6((totals.EXCHANGE_RATE_VALUES || [])[0]),
    },
    { label: "Sub Total FC", value: money(totals.TOTAL_SUB_TOTAL_HDR_AMOUNT_FC) },
    { label: "Discount FC", value: money(totals.TOTAL_DISCOUNT_HDR_AMOUNT_FC) },
    { label: "Product FC", value: money(totals.TOTAL_PRODUCT_HDR_AMOUNT_FC) },
    { label: "VAT FC", value: money(totals.TOTAL_VAT_HDR_AMOUNT_FC) },
    { label: "Final FC", value: money(totals.FINAL_PRODUCT_HDR_AMOUNT_FC) },
    { label: "Sub Total LC", value: money(totals.TOTAL_SUB_TOTAL_HDR_AMOUNT_LC) },
    { label: "Discount LC", value: money(totals.TOTAL_DISCOUNT_HDR_AMOUNT_LC) },
    { label: "Product LC", value: money(totals.TOTAL_PRODUCT_HDR_AMOUNT_LC) },
    { label: "Tax LC", value: money(totals.TOTAL_TAX_HDR_AMOUNT_LC) },
    { label: "Final LC", value: money(totals.FINAL_PRODUCT_HDR_AMOUNT_LC) },
  ];

  return (
    <StepReview
      headerTitle="Quotation Header"
      headerFields={headerFields}
      columns={[]}
      rows={[]}
      showLines={false}
      totals={totalCards}
      emptyMessage=""
    />
  );
}
