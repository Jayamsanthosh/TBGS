/* ============================================================================
   VMASTER.TBL_STATUS_MASTER - repair the six transaction lifecycle statuses.

   Problem found 2026-09-28 while wiring the Purchase Quotation status rule:
   all six rows were seeded with STATUS_NAME = 'Draft', so the Quotation Status
   dropdown rendered six options that all read "Draft" and the user could not
   tell which status they were actually saving. STATUS_CATEGORY was also paired
   positionally with an unrelated list (DRAFT->COMMON, PENDING_APPROVAL->
   PURCHASE, APPROVED->SALES, REJECTED->FINANCE, CANCELLED->HUNTING).

   STATUS_CODE is the trusted column and is left untouched. Only the two
   mis-seeded columns are corrected, keyed off STATUS_CODE so the script is
   idempotent and safe to re-run.

   STATUS_CATEGORY is set to 'COMMON' for all six: these are generic
   transaction lifecycle states, not module-specific ones. The Quotation page
   calls VMASTER.LOAD_STATUS_MASTER with no Category filter, so this does not
   change which rows the dropdown receives.
   ============================================================================ */

SET NOCOUNT ON;

/* ---- preview: what is there now -------------------------------------- */
SELECT STATUS_ID, STATUS_CODE, STATUS_NAME, STATUS_CATEGORY, SORT_ORDER
FROM VMASTER.TBL_STATUS_MASTER
ORDER BY SORT_ORDER;
GO

UPDATE VMASTER.TBL_STATUS_MASTER
SET
  STATUS_NAME = CASE STATUS_CODE
    WHEN 'DRAFT'            THEN 'Draft'
    WHEN 'PENDING_APPROVAL'  THEN 'Pending for Approval'
    WHEN 'APPROVED'         THEN 'Approved'
    WHEN 'REJECTED'         THEN 'Rejected'
    WHEN 'CANCELLED'        THEN 'Cancelled'
    WHEN 'CLOSED'           THEN 'Closed'
    ELSE STATUS_NAME
  END,
  STATUS_CATEGORY = 'COMMON',
  DESCRIPTION = CASE STATUS_CODE
    WHEN 'DRAFT'            THEN 'Transaction is under preparation'
    WHEN 'PENDING_APPROVAL'  THEN 'Transaction is submitted and awaiting approval'
    WHEN 'APPROVED'         THEN 'Transaction is approved'
    WHEN 'REJECTED'         THEN 'Transaction is rejected'
    WHEN 'CANCELLED'        THEN 'Transaction is cancelled'
    WHEN 'CLOSED'           THEN 'Transaction is closed'
    ELSE DESCRIPTION
  END,
  MODIFIED_BY = 'sqlfix',
  MODIFIED_DATE = GETDATE()
WHERE STATUS_CODE IN ('DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','CANCELLED','CLOSED');
GO

/* ---- verify: names must now be distinct ------------------------------ */
SELECT STATUS_ID, STATUS_CODE, STATUS_NAME, STATUS_CATEGORY, SORT_ORDER
FROM VMASTER.TBL_STATUS_MASTER
ORDER BY SORT_ORDER;

SELECT COUNT(*) AS duplicate_status_names
FROM (
  SELECT STATUS_NAME
  FROM VMASTER.TBL_STATUS_MASTER
  WHERE STATUS_MASTER = 'ACTIVE'
  GROUP BY STATUS_NAME
  HAVING COUNT(*) > 1
) d;
GO

/* ---- rollback ---------------------------------------------------------
   Run manually to restore the previous (broken) values if needed.

   UPDATE VMASTER.TBL_STATUS_MASTER
   SET STATUS_NAME = 'Draft', STATUS_CATEGORY = CASE STATUS_CODE
         WHEN 'DRAFT' THEN 'COMMON' WHEN 'PENDING_APPROVAL' THEN 'PURCHASE'
         WHEN 'APPROVED' THEN 'SALES'  WHEN 'REJECTED' THEN 'FINANCE'
         WHEN 'CANCELLED' THEN 'HUNTING' ELSE NULL END
   WHERE STATUS_CODE IN ('DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','CANCELLED','CLOSED');
   ---------------------------------------------------------------------- */
