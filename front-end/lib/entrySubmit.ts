/**
 * Entry submit lifecycle helpers.
 *
 * Transactional screens keep a per-row status until the user submits it:
 *   - `STATUS_MASTER` (AC / CF -> CL) on most payroll + purchase screens
 *   - `STATUS_ENTRY`  (CF -> CL)      on GRN, opening stock, deductions...
 *
 * A row counts as *submitted* once its status is CL (closed) or CA
 * (cancelled). Every other non-empty status is still waiting for a submit,
 * which is what blocks creating the next entry on the same screen.
 */

/** Fields that may carry the entry lifecycle status, in priority order. */
export const DEFAULT_ENTRY_STATUS_KEYS = [
  "STATUS_ENTRY",
  "STATUS_MASTER",
  "HDR_STATUS",
  "statusEntry",
  "statusMaster",
  "status",
] as const;

/** Statuses that mean the entry has already left the entry screen. */
const SUBMITTED_ENTRY_CODES = new Set(["CL", "CA", "SUBMITTED", "CLOSED", "CANCELLED", "CANCELED"]);

/** Reads the first non-empty entry status from the row. */
export function entryStatusOf(
  row: Record<string, any> | null | undefined,
  statusKeys: readonly string[] = DEFAULT_ENTRY_STATUS_KEYS,
): string {
  if (!row || typeof row !== "object") return "";
  for (const key of statusKeys) {
    const value = row[key];
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text) return text.toUpperCase();
  }
  return "";
}

/** True only when the row carries a real status that is not submitted yet. */
export function isEntryPending(
  row: Record<string, any> | null | undefined,
  statusKeys: readonly string[] = DEFAULT_ENTRY_STATUS_KEYS,
): boolean {
  const status = entryStatusOf(row, statusKeys);
  return status !== "" && !SUBMITTED_ENTRY_CODES.has(status);
}

/** True when the row is already submitted (or cancelled). */
export function isEntrySubmitted(
  row: Record<string, any> | null | undefined,
  statusKeys: readonly string[] = DEFAULT_ENTRY_STATUS_KEYS,
): boolean {
  return SUBMITTED_ENTRY_CODES.has(entryStatusOf(row, statusKeys));
}

/** First row on the screen that still has to be submitted. */
export function findPendingEntry<T extends Record<string, any>>(
  rows: readonly T[] | null | undefined,
  statusKeys: readonly string[] = DEFAULT_ENTRY_STATUS_KEYS,
): T | null {
  if (!Array.isArray(rows)) return null;
  return rows.find((row) => isEntryPending(row, statusKeys)) ?? null;
}

/** True when at least one row on the screen is still waiting for a submit. */
export function hasPendingEntry(
  rows: readonly Record<string, any>[] | null | undefined,
  statusKeys: readonly string[] = DEFAULT_ENTRY_STATUS_KEYS,
): boolean {
  return findPendingEntry(rows, statusKeys) !== null;
}

export const SUBMIT_BEFORE_ADD_MESSAGE =
  "Submit the pending entry before creating a new one.";

/** Best-effort reference/label for the pending row, used in the banner. */
export function pendingEntryLabel(row: Record<string, any> | null | undefined): string {
  if (!row) return "";
  const candidates = [
    /* Purchase screens return the reference in camelCase on the grid row and
       in upper case when the header/detail is loaded. Both are listed so the
       banner always names the row that is blocking a new entry. */
    "grnNo",
    "openingStockNo",
    "purchaseRequestNo",
    "purchaseQuotationNo",
    "purchaseOrderNo",
    "purchaseInvoiceRefNo",
    "refNo",
    "PURCHASE_GRN_REF_NO",
    "OPENING_STOCK_REF_NO",
    "PURCHASE_REQUEST_NO",
    "PURCHASE_REQUEST_REF_NO",
    "PURCHASE_QUOTATION_NO",
    "PURCHASE_QUOTATION_REF_NO",
    "PURCHASE_ORDER_NO",
    "PURCHASE_ORDER_REF_NO",
    "PURCHASE_INVOICE_REF_NO",
    "ARREAR_REQUEST_REF_NO",
    "BONUS_REQUEST_REF_NO",
    "OT_REQUEST_REF_NO",
    "LEAVE_ENCASHMENT_REQUEST_REF_NO",
    "M_AUTO_REF_NO",
    "ANIMAL_HUNT_CHARGE_ID",
    "HOLIDAY_ID",
    "SNO",
    "id",
  ];
  for (const key of candidates) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}
