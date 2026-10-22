/* ==========================================================================
   Purchase GRN - schema migration
   Run this against the TBGS database BEFORE deploying purchase_grn_fix.sql
   (SSMS / sqlcmd / src/scripts/deployProcs.ts).

   Every statement is guarded, so the script can be re-run safely.

   Changes:
   1. TBL_PURCHASE_GRN_DTL.PO_INVOICE_QUANTITY -> PO_QUANTITY
      The procs, the API DTO and the screen all call the column PO_QUANTITY,
      so the quantity the user typed was written to a column that nothing read
      back - the "PO Qty" cell was always empty and the value was lost.
   2. TBL_PURCHASE_GRN_DTL.LINK_ID added
      The source page link id of every GRN line (the header already carries it).
   3. TBL_PURCHASE_GRN_HDR.LINK_ID added when missing.
   4. The free-text header columns are widened to the width of the proc
      parameters (CONTAINER_NO / VEHICLE_NAME / DRIVER_NAME /
      SUPPLIER_INVOICE_NUMBER). The parameters were wider than the columns, so
      a long value failed with "String or binary data would be truncated".
   5. DRAFT_REF_NO uniqueness: a plain UNIQUE constraint treats NULL as a real
      value, which blocked the second GRN ("duplicate key value is (<NULL>)").
      A filtered unique index allows any number of NULL draft refs while a real
      draft ref stays unique.
   ========================================================================== */

USE [TBGS]
GO

/* The filtered unique index created below (and every INSERT / UPDATE of the
   header table) needs ANSI_NULLS, ANSI_PADDING, ANSI_WARNINGS, ARITHABORT,
   CONCAT_NULL_YIELDS_NULL and QUOTED_IDENTIFIER to be ON. sqlcmd and some
   drivers start with QUOTED_IDENTIFIER OFF, so it is switched on here. */
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_NULLS ON
GO

/* -------------------------------------------------------------------------- */
/* 1. The PO quantity column.                                                  */
IF EXISTS
(
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('VInventory.TBL_PURCHASE_GRN_DTL')
      AND name = 'PO_INVOICE_QUANTITY'
)
AND NOT EXISTS
(
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('VInventory.TBL_PURCHASE_GRN_DTL')
      AND name = 'PO_QUANTITY'
)
    EXEC sp_rename 'VInventory.TBL_PURCHASE_GRN_DTL.PO_INVOICE_QUANTITY', 'PO_QUANTITY', 'COLUMN';
GO

/* -------------------------------------------------------------------------- */
/* 2. The GRN lines carry the source page link id as well.                      */
IF NOT EXISTS
(
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('VInventory.TBL_PURCHASE_GRN_DTL')
      AND name = 'LINK_ID'
)
    ALTER TABLE [VInventory].[TBL_PURCHASE_GRN_DTL] ADD [LINK_ID] INT NULL;
GO

/* -------------------------------------------------------------------------- */
/* 3. The header carries the source page link id as well.                      */
IF NOT EXISTS
(
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('VInventory.TBL_PURCHASE_GRN_HDR')
      AND name = 'LINK_ID'
)
    ALTER TABLE [VInventory].[TBL_PURCHASE_GRN_HDR] ADD [LINK_ID] INT NULL;
GO

/* -------------------------------------------------------------------------- */
/* 4. Widen the free-text header columns to the width of the proc parameters.   */
/*    The columns are not indexed and hold no default, so this is a safe,      */
/*    value preserving change.                                                  */
IF EXISTS
(
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('VInventory.TBL_PURCHASE_GRN_HDR')
      AND name = 'CONTAINER_NO'
      AND max_length < 50
)
    ALTER TABLE [VInventory].[TBL_PURCHASE_GRN_HDR] ALTER COLUMN [CONTAINER_NO] VARCHAR(50) NULL;
GO

IF EXISTS
(
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('VInventory.TBL_PURCHASE_GRN_HDR')
      AND name = 'VEHICLE_NAME'
      AND max_length < 100
)
    ALTER TABLE [VInventory].[TBL_PURCHASE_GRN_HDR] ALTER COLUMN [VEHICLE_NAME] VARCHAR(100) NULL;
GO

IF EXISTS
(
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('VInventory.TBL_PURCHASE_GRN_HDR')
      AND name = 'DRIVER_NAME'
      AND max_length < 100
)
    ALTER TABLE [VInventory].[TBL_PURCHASE_GRN_HDR] ALTER COLUMN [DRIVER_NAME] VARCHAR(100) NULL;
GO

IF EXISTS
(
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('VInventory.TBL_PURCHASE_GRN_HDR')
      AND name = 'SUPPLIER_INVOICE_NUMBER'
      AND max_length < 100
)
    ALTER TABLE [VInventory].[TBL_PURCHASE_GRN_HDR] ALTER COLUMN [SUPPLIER_INVOICE_NUMBER] VARCHAR(100) NULL;
GO

/* -------------------------------------------------------------------------- */
/* 5. DRAFT_REF_NO may be NULL on every GRN, so it cannot carry a plain       */
/*    UNIQUE constraint.                                                        */
IF EXISTS
(
    SELECT 1 FROM sys.key_constraints
    WHERE parent_object_id = OBJECT_ID('VInventory.TBL_PURCHASE_GRN_HDR')
      AND name = 'uk_draft_ref_no_po_grn'
)
    ALTER TABLE [VInventory].[TBL_PURCHASE_GRN_HDR] DROP CONSTRAINT [uk_draft_ref_no_po_grn];
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID('VInventory.TBL_PURCHASE_GRN_HDR')
      AND name = 'uk_draft_ref_no_po_grn'
)
    CREATE UNIQUE INDEX [uk_draft_ref_no_po_grn]
        ON [VInventory].[TBL_PURCHASE_GRN_HDR] ([DRAFT_REF_NO])
        WHERE [DRAFT_REF_NO] IS NOT NULL;
GO
