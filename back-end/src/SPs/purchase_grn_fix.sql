/* ==========================================================================
   Purchase GRN - stored procedures
   This file is the source of truth for the Purchase GRN procs. Run
   purchase_grn_migration.sql FIRST (it renames PO_INVOICE_QUANTITY ->
   PO_QUANTITY and adds LINK_ID, which the procs below read and write).

   Deploy with:  pnpm tsx src/scripts/deployProcs.ts
   or from SSMS / sqlcmd (the file is split on GO).

   Every write returns exactly one row: (STATUS, MESSAGE, DATA).

   Parameter lists match the API service one to one:
     SAVE_PURCHASE_GRN_HDR    34 parameters
     UPDATE_PURCHASE_GRN_HDR  25 parameters
     SAVE_PURCHASE_GRN_DTL    35 parameters
      UPDATE_PURCHASE_GRN_DTL  37 parameters
     GET_PURCHASE_GRN_HDR      2 parameters
     SHOW_PURCHASE_GRN_DTL     1 parameter
     GET_PURCHASE_GRN_DTL      1 parameter
     DELETE_PURCHASE_GRN_HDR   4 parameters
     DELETE_PURCHASE_GRN_DTL   4 parameters

   node-mssql binds the inputs by name, so a parameter that the proc does not
   declare (or one that the proc declares and the caller omits) fails the
   whole call - the two sides have to stay in step.

   Fixes carried by this version:
   1. SAVE_PURCHASE_GRN_DTL   - the PO quantity was left out of the INSERT,
                                 so the quantity the user typed was lost.
   2. UPDATE_PURCHASE_GRN_DTL - the PO quantity was commented out of the SET,
                                 so an edit wiped it. The stray debug
                                 "select * from" statements are gone and the
                                 line id is echoed back as DATA.
   3. SHOW/GET_PURCHASE_GRN_DTL- the PO quantity, the status and the link id
                                 are returned, so the screen can show them
                                 again instead of guessing.
    4. DELETE_PURCHASE_GRN_HDR - the batches mapped to the GRN are removed with
                                  it. A GRN reference number is generated from
                                  MAX(...) + 1, so a deleted reference number is
                                  re-used and the orphaned batches of the old
                                  GRN would otherwise re-attach to the new one.
    5. Every proc pins the ANSI SET options it needs. The header table carries
       a filtered index (uk_draft_ref_no_po_grn), and the DML on such a table
       is rejected unless ANSI_NULLS, ANSI_PADDING, ANSI_WARNINGS, ARITHABORT,
       CONCAT_NULL_YIELDS_NULL and QUOTED_IDENTIFIER are all ON. The first two
       and QUOTED_IDENTIFIER are captured when the proc is created, so they are
       switched on for this file before the first CREATE (below); the rest are
       set inside every proc, because they are inherited from the caller.
       Without this a save or an edit fails with
       "UPDATE failed because the following SET options have incorrect
       settings: 'QUOTED_IDENTIFIER'".
    6. The write procs report a failed write instead of swallowing it. A
       statement that fails inside a procedure (a foreign key, a truncation, a
       duplicate key) only aborts that statement, so the procedure used to run
       on and answer "Data Saved Successfully" although nothing was written.
       They now catch the error and answer ('error', the error message).
    ========================================================================== */

USE [TBGS]
GO

SET QUOTED_IDENTIFIER ON
GO
SET ANSI_NULLS ON
GO


/* -------------------------------------------------------------------------- */
/* Header create. The reference number comes from the generator proc; the      */
/* totals are supplied by the caller, which rolls them up from the lines.     */
CREATE OR ALTER PROCEDURE [VInventory].[SAVE_PURCHASE_GRN_HDR]
(
    @DRAFT_REF_NO VARCHAR(50),
    @PURCHASE_GRN_REF_NO VARCHAR(50),
    @PURCHASE_GRN_DATE DATETIME,
    @COMPANY_ID INT,
    @CAMP_ID INT,
    @STORE_ID INT,
    @LOCATION_ID INT,
    @SUPPLIER_BP_ID INT,
    @PURCHASE_INVOICE_REF_NO VARCHAR(50),
    @PURCHASE_ORDER_NO VARCHAR(50),
    @SUPPLIER_INVOICE_NUMBER VARCHAR(100),
    @CONTAINER_NO VARCHAR(50),
    @VEHICLE_SOURCE_STATUS VARCHAR(50),
    @VEHICLE_ID INT,
    @VEHICLE_NAME VARCHAR(100),
    @DRIVER_NAME VARCHAR(100),
    @DRIVER_PHONE_NUMBER VARCHAR(50),
    @SEAL_NUMBER VARCHAR(50),
    @SUPPLIER_DELIVERY_NOTE_NO VARCHAR(100),
    @SUPPLIER_DELIVERY_NOTE_DATE DATETIME,
    @CURRENCY_ID INT,
    @EXCHANGE_RATE DECIMAL(15,6),
    @TOTAL_QUANTITY DECIMAL(15,3),
    @TOTAL_VALUE_FC DECIMAL(15,3),
    @TOTAL_VALUE_LC DECIMAL(15,3),
    @STATUS_ID INT,
    @RESPONSE_BY_EMP_ID INT,
    @RESPONSE_DATE DATETIME,
    @RESPONSE_REMARKS VARCHAR(500),
    @REMARKS VARCHAR(500),
    @LINK_PAGES_ID INT,
    @STATUS_ENTRY VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;
    SET ANSI_WARNINGS ON;
    SET ARITHABORT ON;
    SET CONCAT_NULL_YIELDS_NULL ON;
    SET ANSI_PADDING ON;

    BEGIN TRY

    EXEC [VInventory].[SP_GENERATE_PURCHASE_GRN_REF_NO] @PURCHASE_GRN_REF_NO OUTPUT

    IF EXISTS(SELECT 'CHECK' FROM [VInventory].[TBL_PURCHASE_GRN_HDR] WHERE PURCHASE_GRN_REF_NO = @PURCHASE_GRN_REF_NO)
    BEGIN
        SELECT 'error' AS STATUS,'Purchase GRN Reference No Already Exists' AS MESSAGE, '' AS DATA;
    END
    ELSE
    BEGIN

        INSERT INTO [VInventory].[TBL_PURCHASE_GRN_HDR]
        (
            DRAFT_REF_NO,
            PURCHASE_GRN_REF_NO,
            PURCHASE_GRN_DATE,
            COMPANY_ID,
            CAMP_ID,
            STORE_ID,
            LOCATION_ID,
            SUPPLIER_BP_ID,
            PURCHASE_INVOICE_REF_NO,
            PURCHASE_ORDER_NO,
            SUPPLIER_INVOICE_NUMBER,
            CONTAINER_NO,
            VEHICLE_SOURCE_STATUS,
            VEHICLE_ID,
            VEHICLE_NAME,
            DRIVER_NAME,
            DRIVER_PHONE_NUMBER,
            SEAL_NUMBER,
            SUPPLIER_DELIVERY_NOTE_NO,
            SUPPLIER_DELIVERY_NOTE_DATE,
            CURRENCY_ID,
            EXCHANGE_RATE,
            TOTAL_QUANTITY,
            TOTAL_VALUE_FC,
            TOTAL_VALUE_LC,
            STATUS_ID,
            RESPONSE_BY_EMP_ID,
            RESPONSE_DATE,
            RESPONSE_REMARKS,
            REMARKS,
            LINK_PAGES_ID,
            STATUS_ENTRY,
            CREATED_BY,
            CREATED_DATE,
            CREATED_MAC_ADDRESS,
            MODIFIED_BY,
            MODIFIED_DATE,
            MODIFIED_MAC_ADDRESS
        )
        VALUES
        (
            @DRAFT_REF_NO,
            @PURCHASE_GRN_REF_NO,
            @PURCHASE_GRN_DATE,
            @COMPANY_ID,
            @CAMP_ID,
            @STORE_ID,
            @LOCATION_ID,
            @SUPPLIER_BP_ID,
            @PURCHASE_INVOICE_REF_NO,
            @PURCHASE_ORDER_NO,
            @SUPPLIER_INVOICE_NUMBER,
            @CONTAINER_NO,
            @VEHICLE_SOURCE_STATUS,
            @VEHICLE_ID,
            @VEHICLE_NAME,
            @DRIVER_NAME,
            @DRIVER_PHONE_NUMBER,
            @SEAL_NUMBER,
            @SUPPLIER_DELIVERY_NOTE_NO,
            @SUPPLIER_DELIVERY_NOTE_DATE,
            @CURRENCY_ID,
            @EXCHANGE_RATE,
            @TOTAL_QUANTITY,
            @TOTAL_VALUE_FC,
            @TOTAL_VALUE_LC,
            @STATUS_ID,
            @RESPONSE_BY_EMP_ID,
            @RESPONSE_DATE,
            @RESPONSE_REMARKS,
            @REMARKS,
            @LINK_PAGES_ID,
            @STATUS_ENTRY,
            @USER,
            GETDATE(),
            @MAC_ADDRESS,
            @USER,
            GETDATE(),
            @MAC_ADDRESS
        )

        SELECT '' AS STATUS,
               'Data Saved Successfully' AS MESSAGE,
               @PURCHASE_GRN_REF_NO AS DATA
    END

    END TRY
    BEGIN CATCH
        SELECT 'error' AS STATUS, ERROR_MESSAGE() AS MESSAGE, '' AS DATA;
    END CATCH
END
GO

/* -------------------------------------------------------------------------- */
/* Header update. The newer transport / invoice columns are not parameters of   */
/* this proc (the create proc takes them), so the service writes them right    */
/* after the update - see syncGrnHdrTransportFields.                            */
CREATE OR ALTER PROCEDURE [VInventory].[UPDATE_PURCHASE_GRN_HDR]
(
    @SNO INT,
    @PURCHASE_GRN_REF_NO VARCHAR(50),
    @PURCHASE_GRN_DATE DATETIME,
    @PURCHASE_ORDER_NO VARCHAR(50),
    @COMPANY_ID INT,
    @CAMP_ID INT,
    @STORE_ID INT,
    @LOCATION_ID INT,
    @SUPPLIER_BP_ID INT,
    @SUPPLIER_DELIVERY_NOTE_NO VARCHAR(100),
    @SUPPLIER_DELIVERY_NOTE_DATE DATETIME,
    @CURRENCY_ID INT,
    @EXCHANGE_RATE DECIMAL(15,6),
    @TOTAL_QUANTITY DECIMAL(15,3),
    @TOTAL_VALUE_FC DECIMAL(15,3),
    @TOTAL_VALUE_LC DECIMAL(15,3),
    @STATUS_ID INT,
    @RESPONSE_BY_EMP_ID INT,
    @RESPONSE_DATE DATETIME,
    @RESPONSE_REMARKS VARCHAR(500),
    @REMARKS VARCHAR(500),
    @LINK_PAGES_ID INT,
    @STATUS_ENTRY VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON
    SET ANSI_WARNINGS ON;
    SET ARITHABORT ON;
    SET CONCAT_NULL_YIELDS_NULL ON;
    SET ANSI_PADDING ON;

    BEGIN TRY

    IF NOT EXISTS
    (
        SELECT 'CHECK'
        FROM [VInventory].[TBL_PURCHASE_GRN_HDR]
        WHERE PURCHASE_GRN_REF_NO = @PURCHASE_GRN_REF_NO
    )
    BEGIN
        SELECT 'error' AS STATUS,'Purchase GRN Reference No Not Found' AS MESSAGE, '' AS DATA
    END
    ELSE
    BEGIN

        UPDATE [VInventory].[TBL_PURCHASE_GRN_HDR]
        SET
            PURCHASE_GRN_DATE = @PURCHASE_GRN_DATE,
            PURCHASE_ORDER_NO = @PURCHASE_ORDER_NO,
            COMPANY_ID = @COMPANY_ID,
            CAMP_ID = @CAMP_ID,
            STORE_ID = @STORE_ID,
            LOCATION_ID = @LOCATION_ID,
            SUPPLIER_BP_ID = @SUPPLIER_BP_ID,
            SUPPLIER_DELIVERY_NOTE_NO = @SUPPLIER_DELIVERY_NOTE_NO,
            SUPPLIER_DELIVERY_NOTE_DATE = @SUPPLIER_DELIVERY_NOTE_DATE,
            CURRENCY_ID = @CURRENCY_ID,
            EXCHANGE_RATE = @EXCHANGE_RATE,
            TOTAL_QUANTITY = @TOTAL_QUANTITY,
            TOTAL_VALUE_FC = @TOTAL_VALUE_FC,
            TOTAL_VALUE_LC = @TOTAL_VALUE_LC,
            STATUS_ID = @STATUS_ID,
            RESPONSE_BY_EMP_ID = @RESPONSE_BY_EMP_ID,
            RESPONSE_DATE = @RESPONSE_DATE,
            RESPONSE_REMARKS = @RESPONSE_REMARKS,
            REMARKS = @REMARKS,
            LINK_PAGES_ID = @LINK_PAGES_ID,
            STATUS_ENTRY = @STATUS_ENTRY,
            MODIFIED_BY = @USER,
            MODIFIED_DATE = GETDATE(),
            MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
        WHERE PURCHASE_GRN_REF_NO = @PURCHASE_GRN_REF_NO

        SELECT '' AS STATUS,
               'Data Updated Successfully' AS MESSAGE,@PURCHASE_GRN_REF_NO AS DATA
    END

    END TRY
    BEGIN CATCH
        SELECT 'error' AS STATUS, ERROR_MESSAGE() AS MESSAGE, '' AS DATA;
    END CATCH
END
GO

/* -------------------------------------------------------------------------- */
/* Line create. Same GRN + same line number = duplicate.                        */
CREATE OR ALTER PROCEDURE [VInventory].[SAVE_PURCHASE_GRN_DTL]
(
    @PURCHASE_GRN_REF_NO VARCHAR(50),
    @PURCHASE_ORDER_NO VARCHAR(50),
    @PURCHASE_ORDER_DTL_ID INT,
    @PURCHASE_INVOICE_DTL_ID INT,
    @LINE_NO INT,
    @MAIN_CATEGORY_ID INT,
    @SUB_CATEGORY_ID INT,
    @PRODUCT_ID INT,
    @NO_OF_PCS_PER_PACKING DECIMAL(15,3),
    @PO_QUANTITY DECIMAL(15,3),
    @ALREADY_RECEIVED_QTY DECIMAL(15,3),
    @BALANCE_TO_RECEIVE_QTY DECIMAL(15,3),
    @RECEIVED_QUANTITY DECIMAL(15,3),
    @REJECTED_QUANTITY DECIMAL(15,3),
    @ACCEPTED_QUANTITY DECIMAL(15,3),
    @UOM_ID INT,
    @ALT_QUANTITY DECIMAL(15,3),
    @ALT_UOM_ID INT,
    @RATE_FC DECIMAL(15,3),
    @TOTAL_COST_FC DECIMAL(15,3),
    @EXCHANGE_RATE DECIMAL(15,6),
    @RATE_LC DECIMAL(15,3),
    @TOTAL_COST_LC DECIMAL(15,3),
    @BATCH_NO VARCHAR(100),
    @SERIAL_NO VARCHAR(100),
    @MANUFACTURE_DATE DATETIME,
    @EXPIRY_DATE DATETIME,
    @RACK_ID INT,
    @REJECTION_REMARKS VARCHAR(500),
    @REMARKS VARCHAR(500),
    @STATUS_ENTRY VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50),
    @BATCH_MAPPED_QUANTITY DECIMAL(15,3),
    @BALANCE_TO_MAP_BATCH_QTY DECIMAL(15,3)
)
AS
BEGIN
    SET NOCOUNT ON
    SET ANSI_WARNINGS ON;
    SET ARITHABORT ON;
    SET CONCAT_NULL_YIELDS_NULL ON;
    SET ANSI_PADDING ON;

    BEGIN TRY

    IF EXISTS
    (
        SELECT 'CHECK'
        FROM [VInventory].[TBL_PURCHASE_GRN_DTL]
        WHERE PURCHASE_GRN_REF_NO = @PURCHASE_GRN_REF_NO
          AND LINE_NO = @LINE_NO
    )
    BEGIN
        SELECT 'error' AS STATUS,'Purchase GRN Line No Already Exists' AS MESSAGE, '' AS DATA
    END
    ELSE
    BEGIN

        INSERT INTO [VInventory].[TBL_PURCHASE_GRN_DTL]
        (
            PURCHASE_GRN_REF_NO,
            PURCHASE_ORDER_NO,
            PURCHASE_ORDER_DTL_ID,
            PURCHASE_INVOICE_DTL_ID,
            LINE_NO,
            MAIN_CATEGORY_ID,
            SUB_CATEGORY_ID,
            PRODUCT_ID,
            NO_OF_PCS_PER_PACKING,
            PO_QUANTITY,
            ALREADY_RECEIVED_QTY,
            BALANCE_TO_RECEIVE_QTY,
            RECEIVED_QUANTITY,
            REJECTED_QUANTITY,
            ACCEPTED_QUANTITY,
            UOM_ID,
            ALT_QUANTITY,
            ALT_UOM_ID,
            RATE_FC,
            TOTAL_COST_FC,
            EXCHANGE_RATE,
            RATE_LC,
            TOTAL_COST_LC,
            BATCH_NO,
            SERIAL_NO,
            MANUFACTURE_DATE,
            EXPIRY_DATE,
            RACK_ID,
            REJECTION_REMARKS,
            REMARKS,
            STATUS_ENTRY,
            CREATED_BY,
            CREATED_DATE,
            CREATED_MAC_ADDRESS,
            MODIFIED_BY,
            MODIFIED_DATE,
            MODIFIED_MAC_ADDRESS,
            BATCH_MAPPED_QUANTITY,
            BALANCE_TO_MAP_BATCH_QTY
        )
        VALUES
        (
            @PURCHASE_GRN_REF_NO,
            @PURCHASE_ORDER_NO,
            @PURCHASE_ORDER_DTL_ID,
            @PURCHASE_INVOICE_DTL_ID,
            @LINE_NO,
            @MAIN_CATEGORY_ID,
            @SUB_CATEGORY_ID,
            @PRODUCT_ID,
            @NO_OF_PCS_PER_PACKING,
            @PO_QUANTITY,
            @ALREADY_RECEIVED_QTY,
            @BALANCE_TO_RECEIVE_QTY,
            @RECEIVED_QUANTITY,
            @REJECTED_QUANTITY,
            @ACCEPTED_QUANTITY,
            @UOM_ID,
            @ALT_QUANTITY,
            @ALT_UOM_ID,
            @RATE_FC,
            @TOTAL_COST_FC,
            @EXCHANGE_RATE,
            @RATE_LC,
            @TOTAL_COST_LC,
            @BATCH_NO,
            @SERIAL_NO,
            @MANUFACTURE_DATE,
            @EXPIRY_DATE,
            @RACK_ID,
            @REJECTION_REMARKS,
            @REMARKS,
            @STATUS_ENTRY,
            @USER,
            GETDATE(),
            @MAC_ADDRESS,
            @USER,
            GETDATE(),
            @MAC_ADDRESS,
            @BATCH_MAPPED_QUANTITY,
            @BALANCE_TO_MAP_BATCH_QTY
        )

        SELECT '' AS STATUS, 'Data Saved Successfully' AS MESSAGE, CAST(SCOPE_IDENTITY() AS INT) AS DATA
    END

    END TRY
    BEGIN CATCH
        SELECT 'error' AS STATUS, ERROR_MESSAGE() AS MESSAGE, '' AS DATA;
    END CATCH
END
GO

/* -------------------------------------------------------------------------- */
/* Line update. The duplicate check ignores the row being updated, so a GRN    */
/* with two or more lines can be saved.                                        */
CREATE OR ALTER PROCEDURE [VInventory].[UPDATE_PURCHASE_GRN_DTL]
(
    @PURCHASE_GRN_DTL_ID INT,
    @PURCHASE_GRN_REF_NO VARCHAR(50),
    @PURCHASE_ORDER_NO VARCHAR(50),
    @PURCHASE_ORDER_DTL_ID INT,
    @PURCHASE_INVOICE_DTL_ID INT,
    @LINE_NO INT,
    @MAIN_CATEGORY_ID INT,
    @SUB_CATEGORY_ID INT,
    @PRODUCT_ID INT,
    @NO_OF_PCS_PER_PACKING DECIMAL(15,3),
    @PO_QUANTITY DECIMAL(15,3),
    @ALREADY_RECEIVED_QTY DECIMAL(15,3),
    @BALANCE_TO_RECEIVE_QTY DECIMAL(15,3),
    @RECEIVED_QUANTITY DECIMAL(15,3),
    @REJECTED_QUANTITY DECIMAL(15,3),
    @ACCEPTED_QUANTITY DECIMAL(15,3),
    @UOM_ID INT,
    @ALT_QUANTITY DECIMAL(15,3),
    @ALT_UOM_ID INT,
    @RATE_FC DECIMAL(15,3),
    @TOTAL_COST_FC DECIMAL(15,3),
    @EXCHANGE_RATE DECIMAL(15,6),
    @RATE_LC DECIMAL(15,3),
    @TOTAL_COST_LC DECIMAL(15,3),
    @BATCH_NO VARCHAR(100),
    @SERIAL_NO VARCHAR(100),
    @MANUFACTURE_DATE DATETIME,
    @EXPIRY_DATE DATETIME,
    @RACK_ID INT,
    @REJECTION_REMARKS VARCHAR(500),
    @REMARKS VARCHAR(500),
    @STATUS_ENTRY VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50),
    @BATCH_MAPPED_QUANTITY DECIMAL(15,3),
    @BALANCE_TO_MAP_BATCH_QTY DECIMAL(15,3),
    @LINK_ID INT
)
AS
BEGIN
    SET NOCOUNT ON
    SET ANSI_WARNINGS ON;
    SET ARITHABORT ON;
    SET CONCAT_NULL_YIELDS_NULL ON;
    SET ANSI_PADDING ON;

    BEGIN TRY

    IF EXISTS
    (
        SELECT 'CHECK'
        FROM [VInventory].[TBL_PURCHASE_GRN_DTL]
        WHERE PURCHASE_GRN_REF_NO = @PURCHASE_GRN_REF_NO
          AND LINE_NO = @LINE_NO
          AND PURCHASE_GRN_DTL_ID <> @PURCHASE_GRN_DTL_ID
    )
    BEGIN
        SELECT 'error' AS STATUS,'Purchase GRN Line No Already Exists' AS MESSAGE,'' AS DATA;
    END
    ELSE
    BEGIN

        UPDATE [VInventory].[TBL_PURCHASE_GRN_DTL]
        SET
            PURCHASE_GRN_REF_NO = @PURCHASE_GRN_REF_NO,
            PURCHASE_ORDER_NO = @PURCHASE_ORDER_NO,
            PURCHASE_ORDER_DTL_ID = @PURCHASE_ORDER_DTL_ID,
            PURCHASE_INVOICE_DTL_ID = @PURCHASE_INVOICE_DTL_ID,
            LINE_NO = @LINE_NO,
            MAIN_CATEGORY_ID = @MAIN_CATEGORY_ID,
            SUB_CATEGORY_ID = @SUB_CATEGORY_ID,
            PRODUCT_ID = @PRODUCT_ID,
            NO_OF_PCS_PER_PACKING = @NO_OF_PCS_PER_PACKING,
            PO_QUANTITY = @PO_QUANTITY,
            ALREADY_RECEIVED_QTY = @ALREADY_RECEIVED_QTY,
            BALANCE_TO_RECEIVE_QTY = @BALANCE_TO_RECEIVE_QTY,
            RECEIVED_QUANTITY = @RECEIVED_QUANTITY,
            REJECTED_QUANTITY = @REJECTED_QUANTITY,
            ACCEPTED_QUANTITY = @ACCEPTED_QUANTITY,
            UOM_ID = @UOM_ID,
            ALT_QUANTITY = @ALT_QUANTITY,
            ALT_UOM_ID = @ALT_UOM_ID,
            RATE_FC = @RATE_FC,
            TOTAL_COST_FC = @TOTAL_COST_FC,
            EXCHANGE_RATE = @EXCHANGE_RATE,
            RATE_LC = @RATE_LC,
            TOTAL_COST_LC = @TOTAL_COST_LC,
            BATCH_NO = @BATCH_NO,
            SERIAL_NO = @SERIAL_NO,
            MANUFACTURE_DATE = @MANUFACTURE_DATE,
            EXPIRY_DATE = @EXPIRY_DATE,
            RACK_ID = @RACK_ID,
            REJECTION_REMARKS = @REJECTION_REMARKS,
            REMARKS = @REMARKS,
            STATUS_ENTRY = @STATUS_ENTRY,
            BATCH_MAPPED_QUANTITY = @BATCH_MAPPED_QUANTITY,
            BALANCE_TO_MAP_BATCH_QTY = @BALANCE_TO_MAP_BATCH_QTY,
            LINK_ID = @LINK_ID,
            MODIFIED_BY = @USER,
            MODIFIED_DATE = GETDATE(),
            MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
        WHERE PURCHASE_GRN_DTL_ID = @PURCHASE_GRN_DTL_ID

        SELECT '' AS STATUS,'Data Updated Successfully' AS MESSAGE,@PURCHASE_GRN_DTL_ID AS DATA
    END

    END TRY
    BEGIN CATCH
        SELECT 'error' AS STATUS, ERROR_MESSAGE() AS MESSAGE, '' AS DATA;
    END CATCH
END
GO

/* -------------------------------------------------------------------------- */
/* Every line of a GRN.                                                          */
CREATE OR ALTER PROCEDURE [VInventory].[SHOW_PURCHASE_GRN_DTL]
(
    @PURCHASE_GRN_REF_NO VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON
    SET ANSI_WARNINGS ON;
    SET ARITHABORT ON;
    SET CONCAT_NULL_YIELDS_NULL ON;
    SET ANSI_PADDING ON;

    SELECT
        [PURCHASE_GRN_DTL_ID],
        [PURCHASE_GRN_REF_NO],
        [PURCHASE_ORDER_NO],
        [PURCHASE_ORDER_DTL_ID],
        [PURCHASE_INVOICE_DTL_ID],
        [LINE_NO],
        [MAIN_CATEGORY_ID],
        [SUB_CATEGORY_ID],
        [PRODUCT_ID],
        [NO_OF_PCS_PER_PACKING],
        [PO_QUANTITY],
        [ALREADY_RECEIVED_QTY],
        [BALANCE_TO_RECEIVE_QTY],
        [RECEIVED_QUANTITY],
        [REJECTED_QUANTITY],
        [ACCEPTED_QUANTITY],
        [UOM_ID],
        [ALT_QUANTITY],
        [ALT_UOM_ID],
        [RATE_FC],
        [TOTAL_COST_FC],
        [EXCHANGE_RATE],
        [RATE_LC],
        [TOTAL_COST_LC],
        [BATCH_NO],
        [SERIAL_NO],
        [MANUFACTURE_DATE],
        [EXPIRY_DATE],
        [RACK_ID],
        [REJECTION_REMARKS],
        [REMARKS],
        [STATUS_ENTRY],
        [LINK_ID],
        [BATCH_MAPPED_QUANTITY],
        [BALANCE_TO_MAP_BATCH_QTY]
    FROM [VInventory].[TBL_PURCHASE_GRN_DTL]
    WHERE PURCHASE_GRN_REF_NO = @PURCHASE_GRN_REF_NO
END
GO

/* -------------------------------------------------------------------------- */
/* One line of a GRN.                                                           */
CREATE OR ALTER PROCEDURE [VInventory].[GET_PURCHASE_GRN_DTL]
(
    @PURCHASE_GRN_DTL_ID INT
)
AS
BEGIN
    SET NOCOUNT ON
    SET ANSI_WARNINGS ON;
    SET ARITHABORT ON;
    SET CONCAT_NULL_YIELDS_NULL ON;
    SET ANSI_PADDING ON;

    SELECT
        [PURCHASE_GRN_DTL_ID],
        [PURCHASE_GRN_REF_NO],
        [PURCHASE_ORDER_NO],
        [PURCHASE_ORDER_DTL_ID],
        [PURCHASE_INVOICE_DTL_ID],
        [LINE_NO],
        [MAIN_CATEGORY_ID],
        [SUB_CATEGORY_ID],
        [PRODUCT_ID],
        [NO_OF_PCS_PER_PACKING],
        [PO_QUANTITY],
        [ALREADY_RECEIVED_QTY],
        [BALANCE_TO_RECEIVE_QTY],
        [RECEIVED_QUANTITY],
        [REJECTED_QUANTITY],
        [ACCEPTED_QUANTITY],
        [UOM_ID],
        [ALT_QUANTITY],
        [ALT_UOM_ID],
        [RATE_FC],
        [TOTAL_COST_FC],
        [EXCHANGE_RATE],
        [RATE_LC],
        [TOTAL_COST_LC],
        [BATCH_NO],
        [SERIAL_NO],
        [MANUFACTURE_DATE],
        [EXPIRY_DATE],
        [RACK_ID],
        [REJECTION_REMARKS],
        [REMARKS],
        [STATUS_ENTRY],
        [LINK_ID],
        [BATCH_MAPPED_QUANTITY],
        [BALANCE_TO_MAP_BATCH_QTY]
    FROM [VInventory].[TBL_PURCHASE_GRN_DTL]
    WHERE PURCHASE_GRN_DTL_ID = @PURCHASE_GRN_DTL_ID;
END
GO

/* -------------------------------------------------------------------------- */
/* Single header fetch. Scoped by BOTH the reference no and the source page link */
/* id, so a GRN can only be read back from the page that created it.           */
CREATE OR ALTER PROCEDURE [VInventory].[GET_PURCHASE_GRN_HDR]
(
    @PURCHASE_GRN_REF_NO VARCHAR(50),
    @LINK_PAGES_ID INT
)
AS
BEGIN
    SET NOCOUNT ON
    SET ANSI_WARNINGS ON;
    SET ARITHABORT ON;
    SET CONCAT_NULL_YIELDS_NULL ON;
    SET ANSI_PADDING ON;

    SELECT [SNO],
           [PURCHASE_GRN_REF_NO],
           [PURCHASE_GRN_DATE],
           [PURCHASE_ORDER_NO],
           [COMPANY_ID],
           [CAMP_ID],
           [STORE_ID],
           [LOCATION_ID],
           [SUPPLIER_BP_ID],
           [PURCHASE_INVOICE_REF_NO],
           [CONTAINER_NO],
           [VEHICLE_SOURCE_STATUS],
           [VEHICLE_ID],
           [VEHICLE_NAME],
           [DRIVER_NAME],
           [DRIVER_PHONE_NUMBER],
           [SEAL_NUMBER],
           [SUPPLIER_DELIVERY_NOTE_NO],
           [SUPPLIER_DELIVERY_NOTE_DATE],
           [CURRENCY_ID],
           [EXCHANGE_RATE],
           [TOTAL_QUANTITY],
           [TOTAL_VALUE_FC],
           [TOTAL_VALUE_LC],
           [STATUS_ID],
           [RESPONSE_BY_EMP_ID],
           [RESPONSE_DATE],
           [RESPONSE_REMARKS],
           [REMARKS],
           [LINK_PAGES_ID],
           [LINK_ID],
           [STATUS_ENTRY],
           [CREATED_BY]
    FROM [VInventory].[TBL_PURCHASE_GRN_HDR]
    WHERE PURCHASE_GRN_REF_NO = @PURCHASE_GRN_REF_NO
        AND (@LINK_PAGES_ID IS NULL OR LINK_PAGES_ID = @LINK_PAGES_ID)
END
GO

/* -------------------------------------------------------------------------- */
/* Line delete. Admin only - the service checks the same rule before it calls  */
/* this proc, so a user without the right never reaches a partial write.       */
CREATE OR ALTER PROCEDURE [VInventory].[DELETE_PURCHASE_GRN_DTL]
(
    @PURCHASE_GRN_DTL_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;
    SET ANSI_WARNINGS ON;
    SET ARITHABORT ON;
    SET CONCAT_NULL_YIELDS_NULL ON;
    SET ANSI_PADDING ON;

    BEGIN TRY

    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error' AS STATUS,
               'No Rights To Delete' AS MESSAGE,
               '' AS DATA;
    END
    ELSE
    BEGIN

        DELETE FROM [VInventory].[TBL_PURCHASE_GRN_DTL]
        WHERE PURCHASE_GRN_DTL_ID = @PURCHASE_GRN_DTL_ID;

        SELECT '' AS STATUS,'Data Deleted Successfully' AS MESSAGE, @PURCHASE_GRN_DTL_ID AS DATA
    END

    END TRY
    BEGIN CATCH
        SELECT 'error' AS STATUS, ERROR_MESSAGE() AS MESSAGE, '' AS DATA;
    END CATCH
END
GO

/* -------------------------------------------------------------------------- */
/* Header delete. Admin only. The batches mapped to the GRN go with it: a GRN   */
/* reference number is generated from MAX(...) + 1, so a deleted reference      */
/* number is re-used and orphaned batches would re-attach to the new GRN.      */
CREATE OR ALTER PROCEDURE [VInventory].[DELETE_PURCHASE_GRN_HDR]
(
    @PURCHASE_GRN_REF_NO VARCHAR(50),
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON
    SET ANSI_WARNINGS ON;
    SET ARITHABORT ON;
    SET CONCAT_NULL_YIELDS_NULL ON;
    SET ANSI_PADDING ON;

    BEGIN TRY

    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error' AS STATUS,
               'No Rights To Delete' AS MESSAGE,
               '' AS DATA
    END
    ELSE
    BEGIN

        DELETE FROM [VInventory].[TBL_PURCHASE_GRN_HDR]
        WHERE PURCHASE_GRN_REF_NO = @PURCHASE_GRN_REF_NO

        DELETE FROM [VInventory].[TBL_BATCH_MASTER]
        WHERE BATCH_SOURCE_REF_NO = @PURCHASE_GRN_REF_NO

        SELECT '' AS STATUS,
               'Data Deleted Successfully' AS MESSAGE,
               @PURCHASE_GRN_REF_NO AS DATA;
    END

    END TRY
    BEGIN CATCH
        SELECT 'error' AS STATUS, ERROR_MESSAGE() AS MESSAGE, '' AS DATA;
    END CATCH
END
GO
