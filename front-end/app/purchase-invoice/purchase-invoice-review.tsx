"use client";

import StepReview from "@/components/wizard/StepReview";

export default function PurchaseInvoiceReview({
  form,
  headerLabels,
  totals,
  money,
  rate6,
}: {
  form: Record<string, any>;
  headerLabels: Record<string, string>;
  totals: any;
  money: (v: any) => string;
  rate6: (v: any) => string;
}) {
  const shown = (v: any) => (v === null || v === undefined || v === "" ? "" : v);

  const headerFields = [
    { label: "Invoice No", value: form.PURCHASE_INVOICE_REF_NO },
    { label: "Invoice Date", value: form.PURCHASE_INVOICE_DATE },
    { label: "Purchase Order", value: form.PURCHASE_ORDER_NO },
    { label: "Supplier Invoice No", value: form.SUPPLIER_INVOICE_NO },
    { label: "Supplier Invoice Date", value: form.SUPPLIER_INVOICE_DATE },
    { label: "Supplier", value: headerLabels.SUPPLIER_BP_ID },
    { label: "Company", value: headerLabels.COMPANY_ID },
    { label: "Branch", value: headerLabels.BRANCH_ID },
    { label: "Camp", value: headerLabels.CAMP_ID },
    { label: "Store", value: headerLabels.STORE_ID },
    { label: "Payment Term", value: headerLabels.PAYMENT_TERM_ID },
    { label: "Payment Mode", value: headerLabels.PAYMENT_MODE_ID },
    { label: "Due Date", value: form.DUE_DATE },
    { label: "Currency", value: headerLabels.CURRENCY_ID },
    { label: "Exchange Rate", value: form.EXCHANGE_RATE },
    { label: "Status Entry", value: headerLabels.STATUS_ENTRY },
    { label: "Remarks", value: form.REMARKS },
  ].filter((f) => shown(f.value) !== "");

  const totalCards = [
    { label: "Exchange Rate", value: rate6(form.EXCHANGE_RATE) },
    { label: "Sub Total FC", value: money(totals.TOTAL_SUB_TOTAL_HDR_AMOUNT_FC) },
    { label: "Discount FC", value: money(totals.TOTAL_DISCOUNT_HDR_AMOUNT_FC) },
    { label: "Product FC", value: money(totals.TOTAL_PRODUCT_HDR_AMOUNT_FC) },
    { label: "Product Tax FC", value: money(totals.TOTAL_TAX_HDR_AMOUNT_FC) },
    { label: "Additional FC", value: money(totals.TOTAL_ADDITIONAL_COST_AMOUNT_FC) },
    { label: "Final FC", value: money(totals.FINAL_PRODUCT_HDR_AMOUNT_FC) },
    { label: "Sub Total LC", value: money(totals.TOTAL_SUB_TOTAL_HDR_AMOUNT_LC) },
    { label: "Discount LC", value: money(totals.TOTAL_DISCOUNT_HDR_AMOUNT_LC) },
    { label: "Product LC", value: money(totals.TOTAL_PRODUCT_HDR_AMOUNT_LC) },
    { label: "Tax LC", value: money(totals.TOTAL_TAX_HDR_AMOUNT_LC) },
    { label: "Additional LC", value: money(totals.TOTAL_ADDITIONAL_COST_AMOUNT_LC) },
    { label: "Final LC", value: money(totals.FINAL_PRODUCT_HDR_AMOUNT_LC) },
  ];

  return (
    <StepReview
      headerTitle="Purchase Invoice Header"
      headerFields={headerFields}
      columns={[]}
      rows={[]}
      showLines={false}
      totals={totalCards}
      emptyMessage=""
    />
  );
}
