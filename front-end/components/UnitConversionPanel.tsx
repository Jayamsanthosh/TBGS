"use client";

import { useMemo } from "react";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

/* A purchase line, from any of the purchase documents (request, quotation,
   order, invoice, GRN, opening stock). Only the conversion-related columns are
   read, and every lookup is defensive because the six SPs do not return the
   same casing for the same column (TOTAL_QUANTITY vs Total_Quantity). */
type ConversionSourceRow = {
  key?: any;
  LINE_NO?: any;
  PRODUCT_ID?: any;
  PRODUCT_NAME?: any;
  UOM_ID?: any;
  UOM_NAME?: any;
  ALT_UOM_ID?: any;
  /* Product master spells the same relationship ALTERNATE_UOM_ID. Supporting
     both keeps the panel working when a caller passes a raw master row. */
  ALTERNATE_UOM_ID?: any;
  ALT_UOM_NAME?: any;
  ALTERNATE_UOM_NAME?: any;
  NO_OF_PCS_PER_PACKING?: any;
  TOTAL_QUANTITY?: any;
  Total_Quantity?: any;
  /* GRN lines carry the physical quantity as received / accepted instead of a
     single TOTAL_QUANTITY, and invoice lines record the invoiced quantity. */
  ACCEPTED_QUANTITY?: any;
  RECEIVED_QUANTITY?: any;
  INVOICED_QUANTITY?: any;
  ALT_QUANTITY?: any;
  TOTAL_PACKING?: any;
  Total_Packing?: any;
  PURCHASE_REQUEST_DTL_ID?: any;
  PURCHASE_QUOTATION_DTL_ID?: any;
  PURCHASE_ORDER_DTL_ID?: any;
  PURCHASE_GRN_DTL_ID?: any;
  OPENING_STOCK_DTL_ID?: any;
};

const numberOrNaN = (value: any) => {
  if (value === null || value === undefined || value === "") return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
};

/* A document line can expose the same quantity under different names
   (TOTAL_QUANTITY vs Total_Quantity, INVOICED_QUANTITY, ACCEPTED_QUANTITY...).
   Take the first value that actually parses instead of the first non-null one:
   an empty string in a higher-priority column must not hide a real value in a
   fallback column. */
const firstNumber = (...values: any[]) => {
  for (const value of values) {
    const n = numberOrNaN(value);
    if (Number.isFinite(n)) return n;
  }
  return NaN;
};

const formatNumber = (value: any) => {
  const n = numberOrNaN(value);
  if (Number.isNaN(n)) return "-";
  return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
};

export default function UnitConversionPanel({
  rows,
  uoms,
  products,
  title = "Unit Conversion Details",
  subtitle,
  className,
}: {
  rows: ConversionSourceRow[];
  /* UOM master rows (UOM_ID / UOM_NAME / KG_PER_UOM). Several document SPs
     return only ALT_UOM_ID, so the name is resolved here instead of showing a
     bare id. */
  uoms?: any[];
  /* Product master rows. Their packing / alternate-unit columns are the
     fallback when a saved document line does not carry them, which keeps the
     conversion visible for older documents and for any document whose product
     is configured with a conversion. */
  products?: any[];
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  const uomById = useMemo(() => {
    const map = new Map<string, { name: string; kgPerUom: number }>();
    (Array.isArray(uoms) ? uoms : []).forEach((u: any) => {
      if (u?.UOM_ID == null) return;
      map.set(String(u.UOM_ID), {
        name: String(u.UOM_NAME ?? ""),
        kgPerUom: numberOrNaN(u.KG_PER_UOM),
      });
    });
    return map;
  }, [uoms]);

  const productById = useMemo(() => {
    const map = new Map<
      string,
      { name: string; pcs: number; altUomId: any; uomId: any }
    >();
    (Array.isArray(products) ? products : []).forEach((p: any) => {
      if (p?.PRODUCT_ID == null) return;
      map.set(String(p.PRODUCT_ID), {
        name: String(p.PRODUCT_NAME ?? ""),
        pcs: numberOrNaN(p.NO_OF_PCS_PER_PACKING),
        /* Some endpoints return the product relationship as ALT_UOM_ID,
           others as ALTERNATE_UOM_ID. */
        altUomId: p.ALTERNATE_UOM_ID ?? p.ALT_UOM_ID ?? null,
        uomId: p.UOM_ID ?? null,
      });
    });
    return map;
  }, [products]);

  /* Only lines that actually carry a packing / alternate-unit conversion are
     listed. A UOM that has a weight factor but no alternate unit is not a
     conversion for the line, so it is not used as a trigger - the weight is
     still shown beside the conversion when the line qualifies through packing
     or an alternate unit. */
  const conversions = useMemo(() => {
    return (Array.isArray(rows) ? rows : []).flatMap((row, index) => {
      const product =
        row.PRODUCT_ID != null ? productById.get(String(row.PRODUCT_ID)) : undefined;

      /* Older documents may not have copied the product's conversion onto the
         line. The product master is the source of truth, so its packing /
         alternate unit is used as a fallback - that is what makes a conversion
         appear for a quotation reference that was created before the line-level
         columns were populated. */
      /* 0 / "" means "not set" for the foreign keys, so they must fall through
         to the product master rather than hiding its conversion. */
      const uomId =
        [row.UOM_ID, product?.uomId].find((v) => v != null && v !== "" && Number(v) !== 0) ?? null;
      const altUomId =
        [row.ALT_UOM_ID, row.ALTERNATE_UOM_ID, product?.altUomId].find(
          (v) => v != null && v !== "" && Number(v) !== 0
        ) ?? null;
      const uomMaster = uomId != null ? uomById.get(String(uomId)) : undefined;
      const altMaster = altUomId != null ? uomById.get(String(altUomId)) : undefined;

      const uomName = String(row.UOM_NAME || uomMaster?.name || "").trim();
      const altUomName = String(
        row.ALT_UOM_NAME || row.ALTERNATE_UOM_NAME || altMaster?.name || ""
      ).trim();
      const linePcs = numberOrNaN(row.NO_OF_PCS_PER_PACKING);
      const pcs =
        Number.isFinite(linePcs) && linePcs > 0 ? linePcs : (product?.pcs ?? NaN);
      const kgPerUom = uomMaster?.kgPerUom ?? NaN;

      const hasAltUnit =
        !!altUomName && altUomName.toUpperCase() !== uomName.toUpperCase();
      /* A packing factor of 1 with no alternate unit is just the base unit, not a
         conversion. When an alternate unit exists the factor is still shown even
         if it happens to be 1 (1 Alt UOM = 1 primary UOM). */
      const hasPacking =
        Number.isFinite(pcs) && pcs > 0 && (pcs > 1 || hasAltUnit);
      const hasWeightConversion =
        Number.isFinite(kgPerUom) && kgPerUom > 0 && kgPerUom !== 1;
      if (!hasPacking && !hasAltUnit && !hasWeightConversion) return [];

      /* GRN lines record what was physically received/accepted and invoice lines
         record the invoiced quantity; both are valid quantity sources when the
         generic TOTAL_QUANTITY column is absent (or blank). */
      const qty = firstNumber(
        row.TOTAL_QUANTITY,
        row.Total_Quantity,
        row.INVOICED_QUANTITY,
        row.ACCEPTED_QUANTITY,
        row.RECEIVED_QUANTITY
      );
      const storedAltQty = firstNumber(
        row.ALT_QUANTITY,
        row.TOTAL_PACKING,
        row.Total_Packing
      );
      /* The packing factor is authoritative, so the alternate quantity is
         derived from the live quantity first (an edited line is never shown with
         a stale stored alternate quantity) and the stored value is only a
         fallback when the primary quantity is not available. */
      const derivedAltQty =
        hasPacking && Number.isFinite(qty) ? qty / pcs : NaN;
      const altQty = Number.isFinite(derivedAltQty) ? derivedAltQty : storedAltQty;

      const parts: string[] = [];
      if (hasPacking) {
        parts.push(
          hasAltUnit
            ? `1 ${altUomName} = ${formatNumber(pcs)} ${uomName || "Pcs"}`
            : `${formatNumber(pcs)} ${uomName || "Pcs"} per packing`
        );
      } else if (hasAltUnit) {
        parts.push(`Alternate unit: ${altUomName}`);
      }
      if (Number.isFinite(kgPerUom) && kgPerUom > 0) {
        parts.push(`1 ${uomName || "UOM"} = ${formatNumber(kgPerUom)} KG`);
      }

      const productName =
        String(row.PRODUCT_NAME || "").trim() ||
        product?.name ||
        (row.PRODUCT_ID != null ? String(row.PRODUCT_ID) : "-");

      return [{
        key:
          String(
            row.PURCHASE_REQUEST_DTL_ID ??
            row.PURCHASE_QUOTATION_DTL_ID ??
            row.PURCHASE_ORDER_DTL_ID ??
            row.PURCHASE_GRN_DTL_ID ??
            row.OPENING_STOCK_DTL_ID ??
            row.key ??
            "line"
          ) + `-${index}`,
        lineNo: row.LINE_NO,
        productName,
        uomName: uomName || "-",
        altUomName: altUomName || "-",
        pcs,
        kgPerUom,
        qty,
        altQty,
        altQtyLabel: altUomName || "Packing",
        conversion: parts.join(" · "),
      }];
    });
  }, [rows, uomById, productById]);

  if (conversions.length === 0) return null;

  return (
    <div className={cn("rounded-lg border bg-card shadow-sm", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-info" />
          <div>
            <h5 className="text-xs font-semibold text-foreground">{title}</h5>
            {subtitle ? <p className="text-[11px] text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {conversions.length} conversion{conversions.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="max-h-64 overflow-auto">
        <table className="w-full min-w-max text-[11px]">
          <thead className="sticky top-0 bg-muted/60 text-muted-foreground">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium whitespace-nowrap">Line</th>
              <th className="px-2 py-1.5 text-left font-medium whitespace-nowrap">Product</th>
              <th className="px-2 py-1.5 text-left font-medium whitespace-nowrap">UOM</th>
              <th className="px-2 py-1.5 text-left font-medium whitespace-nowrap">Alt UOM</th>
              <th className="px-2 py-1.5 text-right font-medium whitespace-nowrap">Pcs/Packing</th>
              <th className="px-2 py-1.5 text-right font-medium whitespace-nowrap">KG/UOM</th>
              <th className="px-2 py-1.5 text-right font-medium whitespace-nowrap">Qty</th>
              <th className="px-2 py-1.5 text-right font-medium whitespace-nowrap">Alt Qty</th>
              <th className="px-2 py-1.5 text-left font-medium whitespace-nowrap">Conversion</th>
            </tr>
          </thead>
          <tbody>
            {conversions.map((c) => (
              <tr key={c.key} className="border-t">
                <td className="px-2 py-1.5 whitespace-nowrap">{c.lineNo ?? "-"}</td>
                <td className="px-2 py-1.5 min-w-[140px]">{c.productName}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">{c.uomName}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">{c.altUomName}</td>
                <td className="px-2 py-1.5 whitespace-nowrap text-right">
                  {Number.isFinite(c.pcs) && c.pcs > 0 ? formatNumber(c.pcs) : "-"}
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap text-right">
                  {Number.isFinite(c.kgPerUom) && c.kgPerUom > 0
                    ? formatNumber(c.kgPerUom)
                    : "-"}
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap text-right">
                  {Number.isFinite(c.qty) ? formatNumber(c.qty) : "-"}
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap text-right">
                  {Number.isFinite(c.altQty)
                    ? `${formatNumber(c.altQty)} ${c.altQtyLabel}`
                    : "-"}
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap font-medium text-foreground">
                  {c.conversion}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
