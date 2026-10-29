/* The stored procedure files of this project, in the order they have to be
   applied. A file that changes the schema has to come before the procedures
   that read and write it, so the order is fixed here and shared by every
   runner (src/scripts/deployProcs.ts and src/apply_sps.ts). */
export const SP_FILES: string[] = [
  "purchase_request_submit.sql",
  /* The approval panel reads and writes the purchase request through its own
     procs; they live beside the submit proc because both operate on the same
     header row. */
  "purchase_request_approval.sql",
  /* The entry screen's final status has to use the same three-level rollup as
     the approval panel, or a request stopped at the Section Head reads
     "Pending" on one screen and "Rejected" on the other. */
  "purchase_request_final_status_rollup.sql",
  "purchase_quotation_submit.sql",
  /* The quotation approval panel reads and writes through its own procs, kept
     next to the submit proc they depend on (the panel only shows rows the
     submit proc marked as submitted). */
  "purchase_quotation_approval.sql",
  /* The order submit proc has to move PURCHASE_ORDER_STATUS_ID to Pending as
     well as STATUS_ENTRY, and the approval panel only shows submitted orders. */
  "purchase_order_submit.sql",
  /* The order approval panel reads and writes through its own procs, kept next
     to the submit proc they depend on. */
  "purchase_order_approval.sql",
  "purchase_request_load_grid_fields.sql",
  "purchase_request_requested_by_name.sql",
  /* The quotation wizard copies lines from a request via this read; without
     PRODUCT_ID every imported line arrived unnamed and failed to save. */
  "purchase_request_dtl_product_id_fix.sql",
  /* The save proc took REQUIRED_DATE / REASON / REMARKS / ITEM_TYPE /
     STATUS_ENTRY as parameters but left them out of the INSERT, so every
     quotation line stored STATUS_ENTRY = NULL. */
  "purchase_quotation_dtl_save_fix.sql",
  /* The purchase GRN schema has to be in place before its procs are read:
     the migration renames PO_INVOICE_QUANTITY to PO_QUANTITY and adds the
     LINK_ID column that the procs read and write. */
  "purchase_grn_migration.sql",
  "purchase_grn_fix.sql",
];
