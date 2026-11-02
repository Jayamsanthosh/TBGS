import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate } from "./validation";
import { loadPdfLogo } from "./pdfLogo";

const text = (v: any, fallback = "-") =>
  v === null || v === undefined || String(v).trim() === "" ? fallback : String(v);

const dateText = (v: any) => {
  const formatted = formatDate(v);
  return formatted === "-" ? "-" : formatted;
};

const amount = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
    : "0.000";
};

const qtyText = (v: any) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return text(v);
  return n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
};

const percentage = (v: any) => {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  return Number.isFinite(n) ? `${qtyText(n)}%` : text(v);
};

const statusText = (hdr: any) => {
  const name = hdr?.STATUS_NAME ?? hdr?.statusName;
  if (name) return String(name);
  const entry = String(hdr?.STATUS_ENTRY ?? hdr?.statusEntry ?? "").trim().toUpperCase();
  return entry === "CL" || entry === "SUBMITTED" ? "Pending for Approval" : "Draft";
};

export const purchaseInvoicePdfFileName = (hdr: any) => {
  const no = text(hdr?.PURCHASE_INVOICE_REF_NO ?? hdr?.purchaseInvoiceRefNo, "PurchaseInvoice");
  return `PurchaseInvoice-${no.replace(/[\\/:*?"<>|]+/g, "-")}.pdf`;
};

export const createPurchaseInvoicePdf = async (
  hdr: any,
  lines: any[] = [],
  charges: any[] = []
) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const green: [number, number, number] = [34, 68, 50];
  const logo = await loadPdfLogo();

  doc.setFillColor(...green);
  doc.rect(0, 0, pageWidth, 78, "F");

  if (logo) {
    const maxWidth = 54;
    const maxHeight = 50;
    const scale = Math.min(maxWidth / logo.width, maxHeight / logo.height);
    const logoWidth = logo.width * scale;
    const logoHeight = logo.height * scale;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin - 4, 5, logoWidth + 8, logoHeight + 6, 3, 3, "F");
    doc.addImage(logo.dataUrl, "JPEG", margin, 8, logoWidth, logoHeight);
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(text(hdr?.COMPANY_NAME ?? hdr?.companyName, "Company"), margin, 34);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("PURCHASE INVOICE", pageWidth - margin, 46, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Invoice No: ${text(hdr?.PURCHASE_INVOICE_REF_NO ?? hdr?.purchaseInvoiceRefNo)}`,
    pageWidth - margin,
    62,
    { align: "right" }
  );

  const leftRows: [string, string][] = [
    ["Invoice No", text(hdr?.PURCHASE_INVOICE_REF_NO ?? hdr?.purchaseInvoiceRefNo)],
    ["Invoice Date", dateText(hdr?.PURCHASE_INVOICE_DATE ?? hdr?.purchaseInvoiceDate)],
    ["Purchase Order", text(hdr?.PURCHASE_ORDER_NO ?? hdr?.purchaseOrderNo)],
    ["Supplier Invoice No", text(hdr?.SUPPLIER_INVOICE_NO ?? hdr?.supplierInvoiceNo)],
    ["Supplier Invoice Date", dateText(hdr?.SUPPLIER_INVOICE_DATE ?? hdr?.supplierInvoiceDate)],
    ["Supplier", text(hdr?.SUPPLIER_BP_NAME ?? hdr?.supplierName ?? hdr?.SUPPLIER_NAME)],
    ["Company", text(hdr?.COMPANY_NAME ?? hdr?.companyName)],
    ["Branch", text(hdr?.BRANCH_NAME ?? hdr?.branchName)],
  ];
  const rightRows: [string, string][] = [
    ["Status", statusText(hdr)],
    ["Camp", text(hdr?.CAMP_NAME ?? hdr?.campName)],
    ["Store", text(hdr?.STORE_NAME ?? hdr?.storeName)],
    ["Due Date", dateText(hdr?.DUE_DATE ?? hdr?.dueDate)],
    ["Payment Term", text(hdr?.PAYMENT_TERM_NAME ?? hdr?.paymentTermName)],
    ["Payment Mode", text(hdr?.PAYMENT_MODE_NAME ?? hdr?.paymentModeName)],
    [
      "Currency / Rate",
      `${text(hdr?.CURRENCY_NAME ?? hdr?.currencyName)} / ${text(
        hdr?.EXCHANGE_RATE ?? hdr?.exchangeRate
      )}`,
    ],
  ];

  const drawMeta = (rows: [string, string][], startX: number, width: number, startY: number) => {
    let y = startY;
    rows.forEach(([label, value]) => {
      doc.setTextColor(110, 110, 110);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(label.toUpperCase(), startX, y);
      doc.setTextColor(25, 25, 25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(value, startX + width, y, { align: "right", maxWidth: width - 8 });
      y += 18;
    });
  };

  const colWidth = (pageWidth - margin * 2 - 24) / 2;
  drawMeta(leftRows, margin, colWidth, 104);
  drawMeta(rightRows, margin + colWidth + 24, colWidth, 104);

  const tableRows = lines.map((r: any, i: number) => [
    String(r.LINE_NO ?? i + 1),
    text(r.PRODUCT_NAME ?? r.PRODUCT_ID),
    qtyText(r.INVOICED_QUANTITY),
    text(r.UOM_NAME ?? r.UOM_ID),
    amount(r.RATE_FC),
    percentage(r.DISCOUNT_PERCENTAGE),
    percentage(r.TAX_PERCENTAGE),
    amount(r.TAX_AMOUNT_FC),
    amount(r.FINAL_AMOUNT_FC),
  ]);

  autoTable(doc, {
    startY: 248,
    head: [["#", "Product", "Qty", "UOM", "Rate (FC)", "Disc %", "Tax %", "Tax (FC)", "Amount (FC)"]],
    body: tableRows,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 5, textColor: [35, 35, 35], lineColor: [225, 225, 225] },
    headStyles: { fillColor: green, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [247, 249, 247] },
    columnStyles: {
      0: { halign: "center", cellWidth: 24 },
      1: { cellWidth: "auto" },
      2: { halign: "right", cellWidth: 46 },
      3: { halign: "center", cellWidth: 38 },
      4: { halign: "right", cellWidth: 56 },
      5: { halign: "right", cellWidth: 40 },
      6: { halign: "right", cellWidth: 40 },
      7: { halign: "right", cellWidth: 58 },
      8: { halign: "right", cellWidth: 66 },
    },
    margin: { left: margin, right: margin },
  });

  let finalY = (doc as any).lastAutoTable?.finalY ?? 260;

  if (charges.length) {
    const chargeRows = charges.map((r: any, i: number) => [
      String(r.LINE_NO ?? i + 1),
      text(r.ADDITIONAL_CHARGE_TYPE_NAME ?? r.ADDITIONAL_CHARGE_TYPE_ID),
      text(r.DESCRIPTION, ""),
      qtyText(r.QUANTITY),
      amount(r.RATE_FC),
      amount(r.TAX_AMOUNT_FC),
      amount(r.FINAL_AMOUNT_FC),
    ]);

    autoTable(doc, {
      startY: finalY + 18,
      head: [["#", "Additional Charge", "Description", "Qty", "Rate (FC)", "Tax (FC)", "Amount (FC)"]],
      body: chargeRows,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 5, textColor: [35, 35, 35], lineColor: [225, 225, 225] },
      headStyles: { fillColor: [70, 100, 82], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [247, 249, 247] },
      columnStyles: {
        0: { halign: "center", cellWidth: 24 },
        1: { cellWidth: 110 },
        2: { cellWidth: "auto" },
        3: { halign: "right", cellWidth: 44 },
        4: { halign: "right", cellWidth: 60 },
        5: { halign: "right", cellWidth: 60 },
        6: { halign: "right", cellWidth: 68 },
      },
      margin: { left: margin, right: margin },
    });
    finalY = (doc as any).lastAutoTable?.finalY ?? finalY;
  }

  const totals: [string, string, string][] = [
    [
      "Sub Total (FC)",
      amount(hdr?.TOTAL_SUB_TOTAL_HDR_AMOUNT_FC ?? hdr?.totalSubTotalHdrAmountFc),
      amount(hdr?.TOTAL_SUB_TOTAL_HDR_AMOUNT_LC ?? hdr?.totalSubTotalHdrAmountLc),
    ],
    [
      "Discount (FC)",
      amount(hdr?.TOTAL_DISCOUNT_HDR_AMOUNT_FC ?? hdr?.totalDiscountHdrAmountFc),
      amount(hdr?.TOTAL_DISCOUNT_HDR_AMOUNT_LC ?? hdr?.totalDiscountHdrAmountLc),
    ],
    [
      "Product Amount (FC)",
      amount(hdr?.TOTAL_PRODUCT_HDR_AMOUNT_FC ?? hdr?.totalProductHdrAmountFc),
      amount(hdr?.TOTAL_PRODUCT_HDR_AMOUNT_LC ?? hdr?.totalProductHdrAmountLc),
    ],
    [
      "Additional Cost (FC)",
      amount(hdr?.TOTAL_ADDITIONAL_COST_AMOUNT_FC ?? hdr?.totalAdditionalCostAmountFc),
      amount(hdr?.TOTAL_ADDITIONAL_COST_AMOUNT_LC ?? hdr?.totalAdditionalCostAmountLc),
    ],
    [
      "Tax (FC)",
      amount(hdr?.TOTAL_TAX_HDR_AMOUNT_FC ?? hdr?.totalTaxHdrAmountFc),
      amount(hdr?.TOTAL_TAX_HDR_AMOUNT_LC ?? hdr?.totalTaxHdrAmountLc),
    ],
    [
      "Final Amount (FC)",
      amount(hdr?.FINAL_PRODUCT_HDR_AMOUNT_FC ?? hdr?.finalProductHdrAmountFc),
      amount(hdr?.FINAL_PRODUCT_HDR_AMOUNT_LC ?? hdr?.finalProductHdrAmountLc),
    ],
  ];

  let totalY = finalY + 18;
  if (totalY > pageHeight - 170) {
    doc.addPage();
    totalY = 48;
  }

  const boxWidth = 285;
  const boxX = pageWidth - margin - boxWidth;

  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(249, 250, 249);
  doc.roundedRect(boxX, totalY, boxWidth, 30 + totals.length * 16, 4, 4, "FD");
  doc.setTextColor(110, 110, 110);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOTALS", boxX + 10, totalY + 15);
  doc.text("FC", boxX + boxWidth - 80, totalY + 15, { align: "right" });
  doc.text("LC", boxX + boxWidth - 10, totalY + 15, { align: "right" });

  totals.forEach(([label, fc, lc], i) => {
    const y = totalY + 32 + i * 16;
    const isFinal = i === totals.length - 1;
    doc.setTextColor(isFinal ? 25 : 90, isFinal ? 25 : 90, isFinal ? 25 : 90);
    doc.setFont("helvetica", isFinal ? "bold" : "normal");
    doc.setFontSize(isFinal ? 9 : 8);
    doc.text(label, boxX + 10, y);
    doc.text(fc, boxX + boxWidth - 80, y, { align: "right" });
    doc.text(lc, boxX + boxWidth - 10, y, { align: "right" });
  });

  const notes = hdr?.REMARKS ?? hdr?.remarks;
  if (notes) {
    const notesY = totalY + 40 + totals.length * 16;
    doc.setTextColor(110, 110, 110);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("REMARKS", margin, notesY);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(String(notes), margin, notesY + 14, { maxWidth: pageWidth - margin * 2 - boxWidth - 24 });
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, pageHeight - 38, pageWidth - margin, pageHeight - 38);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(
      `${text(hdr?.PURCHASE_INVOICE_REF_NO ?? hdr?.purchaseInvoiceRefNo)} - Generated ${dateText(new Date())}`,
      margin,
      pageHeight - 24
    );
    doc.text(`Page ${i} of ${pages}`, pageWidth - margin, pageHeight - 24, { align: "right" });
  }

  return doc;
};
