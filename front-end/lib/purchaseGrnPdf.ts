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
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
    : text(v);
};

const qtyText = (v: any) => {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return text(v);
  return n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
};

const acceptedQty = (r: any) => {
  const stored = r?.ACCEPTED_QUANTITY;
  if (stored !== null && stored !== undefined && stored !== "") return stored;
  const received = Number(r?.RECEIVED_QUANTITY);
  if (!Number.isFinite(received)) return null;
  const rejected = Number(r?.REJECTED_QUANTITY);
  return received - (Number.isFinite(rejected) ? rejected : 0);
};

const entryText = (hdr: any) => {
  const entry = String(hdr?.STATUS_ENTRY ?? hdr?.statusEntry ?? "").trim().toUpperCase();
  return entry === "CL" || entry === "SUBMITTED" ? "Submitted" : "Pending for Submitted";
};

const statusText = (hdr: any) => {
  const name = hdr?.STATUS_NAME ?? hdr?.statusName;
  if (name) return String(name);
  return entryText(hdr);
};

export const purchaseGrnPdfFileName = (hdr: any) => {
  const no = text(hdr?.PURCHASE_GRN_REF_NO ?? hdr?.grnNo, "PurchaseGRN");
  return `PurchaseGRN-${no.replace(/[\\/:*?"<>|]+/g, "-")}.pdf`;
};

export const createPurchaseGrnPdf = async (hdr: any, lines: any[] = []) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const green: [number, number, number] = [34, 68, 50];
  const logo = await loadPdfLogo();

  doc.setFillColor(...green);
  doc.rect(0, 0, pageWidth, 72, "F");

  if (logo) {
    const maxWidth = 50;
    const maxHeight = 46;
    const scale = Math.min(maxWidth / logo.width, maxHeight / logo.height);
    const logoWidth = logo.width * scale;
    const logoHeight = logo.height * scale;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin - 4, 4, logoWidth + 8, logoHeight + 6, 3, 3, "F");
    doc.addImage(logo.dataUrl, "JPEG", margin, 7, logoWidth, logoHeight);
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(text(hdr?.COMPANY_NAME ?? hdr?.companyName, "Company"), margin, 32);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("PURCHASE GRN", pageWidth - margin, 44, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `GRN No: ${text(hdr?.PURCHASE_GRN_REF_NO ?? hdr?.grnNo)}`,
    pageWidth - margin,
    60,
    { align: "right" }
  );

  const vehicle = [text(hdr?.VEHICLE_NAME, ""), text(hdr?.VEHICLE_SOURCE_STATUS, "")]
    .filter(Boolean)
    .join(" / ");
  const driver = [text(hdr?.DRIVER_NAME, ""), text(hdr?.DRIVER_PHONE_NUMBER, "")]
    .filter(Boolean)
    .join(" · ");

  const leftRows: [string, string][] = [
    ["GRN No", text(hdr?.PURCHASE_GRN_REF_NO ?? hdr?.grnNo)],
    ["GRN Date", dateText(hdr?.PURCHASE_GRN_DATE ?? hdr?.grnDate)],
    ["Purchase Order", text(hdr?.PURCHASE_ORDER_NO ?? hdr?.purchaseOrderNo)],
    ["Supplier", text(hdr?.SUPPLIER_NAME ?? hdr?.supplierName ?? hdr?.BP_NAME)],
    ["Delivery Note No", text(hdr?.SUPPLIER_DELIVERY_NOTE_NO)],
    ["Delivery Note Date", dateText(hdr?.SUPPLIER_DELIVERY_NOTE_DATE)],
    ["Purchase Invoice", text(hdr?.PURCHASE_INVOICE_REF_NO)],
    ["Container No", text(hdr?.CONTAINER_NO)],
  ];
  const rightRows: [string, string][] = [
    ["Status", statusText(hdr)],
    ["Status Entry", entryText(hdr)],
    ["Company", text(hdr?.COMPANY_NAME ?? hdr?.companyName)],
    ["Camp", text(hdr?.CAMP_NAME ?? hdr?.campName)],
    ["Store", text(hdr?.STORE_NAME ?? hdr?.storeName)],
    ["Location", text(hdr?.LOCATION_NAME ?? hdr?.locationName)],
    [
      "Currency / Rate",
      `${text(hdr?.CURRENCY_NAME ?? hdr?.currencyName)} / ${text(
        hdr?.EXCHANGE_RATE ?? hdr?.exchangeRate
      )}`,
    ],
    ["Vehicle / Source", vehicle || "-"],
    ["Driver", driver || "-"],
    ["Seal No", text(hdr?.SEAL_NUMBER)],
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
      y += 16;
    });
  };

  const colWidth = (pageWidth - margin * 2 - 36) / 2;
  drawMeta(leftRows, margin, colWidth, 94);
  drawMeta(rightRows, margin + colWidth + 36, colWidth, 94);

  const tableRows = lines.map((r: any, i: number) => [
    String(r.LINE_NO ?? i + 1),
    text(r.PRODUCT_NAME ?? r.PRODUCT_ID),
    qtyText(r.PO_QUANTITY),
    qtyText(r.RECEIVED_QUANTITY),
    qtyText(r.REJECTED_QUANTITY),
    qtyText(acceptedQty(r)),
    text(r.UOM_NAME ?? r.UOM_ID),
    amount(r.RATE_FC),
    amount(r.TOTAL_COST_FC),
    amount(r.TOTAL_COST_LC),
    text(r.BATCH_NO ?? r.SERIAL_NO),
    dateText(r.EXPIRY_DATE),
  ]);

  autoTable(doc, {
    startY: 258,
    head: [[
      "#",
      "Product",
      "PO Qty",
      "Received",
      "Rejected",
      "Accepted",
      "UOM",
      "Rate (FC)",
      "Cost (FC)",
      "Cost (LC)",
      "Batch / Serial",
      "Expiry",
    ]],
    body: tableRows,
    theme: "grid",
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
      textColor: [35, 35, 35],
      lineColor: [225, 225, 225],
      overflow: "linebreak",
    },
    headStyles: { fillColor: green, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: [247, 249, 247] },
    columnStyles: {
      0: { halign: "center", cellWidth: 22 },
      1: { cellWidth: "auto" },
      2: { halign: "right", cellWidth: 42 },
      3: { halign: "right", cellWidth: 46 },
      4: { halign: "right", cellWidth: 46 },
      5: { halign: "right", cellWidth: 48 },
      6: { halign: "center", cellWidth: 34 },
      7: { halign: "right", cellWidth: 50 },
      8: { halign: "right", cellWidth: 56 },
      9: { halign: "right", cellWidth: 56 },
      10: { cellWidth: 60 },
      11: { halign: "center", cellWidth: 50 },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? 280;

  const sumReceived = lines.reduce((a, r) => a + (Number(r?.RECEIVED_QUANTITY) || 0), 0);
  const sumCostFc = lines.reduce((a, r) => a + (Number(r?.TOTAL_COST_FC) || 0), 0);
  const sumCostLc = lines.reduce((a, r) => a + (Number(r?.TOTAL_COST_LC) || 0), 0);

  const totals: [string, string][] = [
    ["Total Quantity", qtyText(hdr?.TOTAL_QUANTITY ?? sumReceived)],
    ["Total Value (FC)", amount(hdr?.TOTAL_VALUE_FC ?? sumCostFc)],
    ["Total Value (LC)", amount(hdr?.TOTAL_VALUE_LC ?? sumCostLc)],
  ];

  let totalY = finalY + 18;
  if (totalY > pageHeight - 150) {
    doc.addPage();
    totalY = 48;
  }

  const boxWidth = 260;
  const boxX = pageWidth - margin - boxWidth;

  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(249, 250, 249);
  doc.roundedRect(boxX, totalY, boxWidth, 30 + totals.length * 16, 4, 4, "FD");
  doc.setTextColor(110, 110, 110);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOTALS", boxX + 10, totalY + 15);

  totals.forEach(([label, value], i) => {
    const y = totalY + 32 + i * 16;
    const isFinal = i === totals.length - 1;
    doc.setTextColor(isFinal ? 25 : 90, isFinal ? 25 : 90, isFinal ? 25 : 90);
    doc.setFont("helvetica", isFinal ? "bold" : "normal");
    doc.setFontSize(isFinal ? 9 : 8);
    doc.text(label, boxX + 10, y);
    doc.text(value, boxX + boxWidth - 10, y, { align: "right" });
  });

  const lineNotes = lines
    .map((r: any, i: number) => {
      const parts: string[] = [];
      if (r?.REJECTION_REMARKS) parts.push(`Rejected: ${r.REJECTION_REMARKS}`);
      if (r?.REMARKS) parts.push(`Remarks: ${r.REMARKS}`);
      if (!parts.length) return "";
      return `Line ${r?.LINE_NO ?? i + 1}: ${parts.join(" | ")}`;
    })
    .filter(Boolean);
  const headerNotes = hdr?.REMARKS ?? hdr?.remarks;

  let notesY = totalY + 30 + totals.length * 16 + 18;
  const notesWidth = pageWidth - margin * 2;
  const drawNotes = (label: string, value: string) => {
    const body = doc.splitTextToSize(value, notesWidth - 10);
    const height = 20 + body.length * 11;
    if (notesY + height > pageHeight - 50) {
      doc.addPage();
      notesY = 48;
    }
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(249, 250, 249);
    doc.roundedRect(margin, notesY, notesWidth, height, 4, 4, "FD");
    doc.setTextColor(110, 110, 110);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(label, margin + 10, notesY + 14);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(body, margin + 74, notesY + 14, { maxWidth: notesWidth - 84 });
    notesY += height + 10;
  };

  if (headerNotes) drawNotes("REMARKS", String(headerNotes));
  if (lineNotes.length) drawNotes("LINE NOTES", lineNotes.join("\n"));

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, pageHeight - 36, pageWidth - margin, pageHeight - 36);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(
      `${text(hdr?.PURCHASE_GRN_REF_NO ?? hdr?.grnNo)} - Generated ${dateText(new Date())}`,
      margin,
      pageHeight - 22
    );
    doc.text(`Page ${i} of ${pages}`, pageWidth - margin, pageHeight - 22, { align: "right" });
  }

  return doc;
};
