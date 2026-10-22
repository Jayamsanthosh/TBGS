/* The stored procedure files of this project, in the order they have to be
   applied. A file that changes the schema has to come before the procedures
   that read and write it, so the order is fixed here and shared by every
   runner (src/scripts/deployProcs.ts and src/apply_sps.ts). */
export const SP_FILES: string[] = [
  "purchase_request_submit.sql",
  "purchase_quotation_submit.sql",
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
