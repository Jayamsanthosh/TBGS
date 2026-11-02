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

const qtyText = (v: any) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return text(v);
  return n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
};

const statusText = (hdr: any) => {
  const name = hdr?.statusName ?? hdr?.STATUS_NAME;
  if (name) return String(name);
  const entry = String(hdr?.statusEntry ?? hdr?.STATUS_ENTRY ?? "").trim().toUpperCase();
  if (entry === "CL" || entry === "SUBMITTED") return "Submitted";
  return entry || "-";
};

const entryText = (hdr: any) => {
  const entry = String(hdr?.statusEntry ?? hdr?.STATUS_ENTRY ?? "").trim().toUpperCase();
  if (entry === "CL" || entry === "SUBMITTED") return "Submitted";
  return entry || "-";
};

export const purchaseRequestPdfFileName = (hdr: any) => {
  const no = text(hdr?.PURCHASE_REQUEST_NO ?? hdr?.purchaseRequestNo, "PurchaseRequest");
  return `PurchaseRequest-${no.replace(/[\\/:*?"<>|]+/g, "-")}.pdf`;
};

export const createPurchaseRequestPdf = async (hdr: any, lines: any[] = []) => {
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
    doc.text(text(hdr?.companyName ?? hdr?.COMPANY_NAME, "Company"), margin, 32);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("PURCHASE REQUEST", pageWidth - margin, 44, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Request No: ${text(hdr?.PURCHASE_REQUEST_NO ?? hdr?.purchaseRequestNo)}`,
    pageWidth - margin,
    60,
    { align: "right" }
  );

  const leftRows: [string, string][] = [
    ["Request No", text(hdr?.PURCHASE_REQUEST_NO ?? hdr?.purchaseRequestNo)],
    ["Request Date", dateText(hdr?.PURCHASE_REQUEST_DATE ?? hdr?.purchaseRequestDate)],
    ["Requested By", text(hdr?.requestedBy ?? hdr?.REQUESTED_BY_NAME)],
    ["Company", text(hdr?.companyName ?? hdr?.COMPANY_NAME)],
    ["Branch", text(hdr?.branchName ?? hdr?.BRANCH_NAME)],
    ["Request Store", text(hdr?.requestStoreName ?? hdr?.REQUEST_STORE_NAME)],
    ["Purchase Store", text(hdr?.poStoreName, "PURCHASE STORE")],
    ["Camp", text(hdr?.campName ?? hdr?.CAMP_NAME)],
  ];
  const rightRows: [string, string][] = [
    ["Request Type", text(hdr?.requestTypeName ?? hdr?.REQUEST_TYPE_NAME)],
    ["Priority", text(hdr?.priorityName ?? hdr?.PRIORITY_NAME)],
    ["Required Date", dateText(hdr?.requiredDate ?? hdr?.REQUIRED_DATE)],
    [
      "Delivery Location",
      text(hdr?.deliveryLocationName ?? hdr?.DELIVERY_LOCATION_NAME),
    ],
    ["Status", statusText(hdr)],
    ["Status Entry", entryText(hdr)],
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
    text(r.REFERENCE_TYPE_NAME),
    text(r.REFERENCE_NO),
    text(r.MAIN_CATEGORY_NAME),
    text(r.SUB_CATEGORY_NAME),
    text(r.DESCRIPTION),
    qtyText(r.Total_Quantity ?? r.TOTAL_QUANTITY),
    text(r.UOM_NAME ?? r.UOM_ID),
    qtyText(r.Total_Packing ?? r.TOTAL_PACKING),
    text(r.TRUCK_NO),
    dateText(r.REQUIRED_DATE),
  ]);

  autoTable(doc, {
    startY: 218,
    head: [[
      "#",
      "Product",
      "Ref Type",
      "Ref No",
      "Main Category",
      "Sub Category",
      "Description",
      "Qty",
      "UOM",
      "Packing",
      "Truck",
      "Required Date",
    ]],
    body: tableRows,
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 4, textColor: [35, 35, 35], lineColor: [225, 225, 225], overflow: "linebreak" },
    headStyles: { fillColor: green, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: [247, 249, 247] },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? 250;
  let notesY = finalY + 18;
  if (notesY > pageHeight - 100) {
    doc.addPage();
    notesY = 48;
  }

  const reason = hdr?.REASON ?? hdr?.reason;
  const remarks = hdr?.REMARKS ?? hdr?.remarks;
  if (reason || remarks) {
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(249, 250, 249);
    doc.roundedRect(margin, notesY, pageWidth - margin * 2, 58, 4, 4, "FD");
    doc.setTextColor(110, 110, 110);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("REASON", margin + 10, notesY + 15);
    doc.text("REMARKS", margin + 10, notesY + 34);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(String(reason || "-"), margin + 72, notesY + 15, { maxWidth: pageWidth - margin * 2 - 84 });
    doc.text(String(remarks || "-"), margin + 72, notesY + 34, { maxWidth: pageWidth - margin * 2 - 84 });
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, pageHeight - 36, pageWidth - margin, pageHeight - 36);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(
      `${text(hdr?.PURCHASE_REQUEST_NO ?? hdr?.purchaseRequestNo)} - Generated ${dateText(new Date())}`,
      margin,
      pageHeight - 22
    );
    doc.text(`Page ${i} of ${pages}`, pageWidth - margin, pageHeight - 22, { align: "right" });
  }

  return doc;
};
