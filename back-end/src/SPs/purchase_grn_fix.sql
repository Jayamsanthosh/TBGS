/* ==========================================================================
   Purchase GRN - stored procedure fixes
   Run this script against the TBGS database (SSMS / sqlcmd).

   Fixes applied:
   1. SAVE_PURCHASE_GRN_HDR   - success row was missing the AS DATA alias, so
                                the API could never read the generated
                                PURCHASE_GRN_REF_NO.
   2. UPDATE_PURCHASE_GRN_HDR - the NOT EXISTS branch returned the wrong
                                message ("Already Exists" instead of
                                "Not Found").
   3. SAVE_PURCHASE_GRN_DTL   - duplicate check was inverted (IF NOT EXISTS),
                                which made the FIRST detail line of every GRN
                                fail, and it tested PURCHASE_GRN_REF_NO (shared
                                by all lines) instead of LINE_NO. Now checks
                                REF_NO + LINE_NO and returns the new identity
                                id as DATA.
   4. UPDATE_PURCHASE_GRN_DTL - duplicate check tested PURCHASE_GRN_REF_NO, so
                                any GRN with 2+ lines could never update a
                                line. Now checks REF_NO + LINE_NO excluding
                                self.

   Every write returns one row: (STATUS, MESSAGE, DATA).
   ========================================================================== */

USE [TBGS]
GO

/* -------------------------------------------------------------------------- */
ALTER PROCEDURE [VInventory].[SAVE_PURCHASE_GRN_HDR]
(
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
    SET NOCOUNT ON;

    EXEC [VInventory].[SP_GENERATE_PURCHASE_GRN_REF_NO] @PURCHASE_GRN_REF_NO OUTPUT

    IF EXISTS(SELECT 'CHECK' FROM [VInventory].[TBL_PURCHASE_GRN_HDR] WHERE PURCHASE_GRN_REF_NO = @PURCHASE_GRN_REF_NO)
    BEGIN
        SELECT 'error' AS STATUS,'Purchase GRN Reference No Already Exists' AS MESSAGE, '' AS DATA;
    END

    ELSE  BEGIN

        INSERT INTO [VInventory].[TBL_PURCHASE_GRN_HDR]
        (
            PURCHASE_GRN_REF_NO,
            PURCHASE_GRN_DATE,
            PURCHASE_ORDER_NO,
            COMPANY_ID,
            CAMP_ID,
            STORE_ID,
            LOCATION_ID,
            SUPPLIER_BP_ID,
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
            @PURCHASE_GRN_REF_NO,
            @PURCHASE_GRN_DATE,
            @PURCHASE_ORDER_NO,
            @COMPANY_ID,
            @CAMP_ID,
            @STORE_ID,
            @LOCATION_ID,
            @SUPPLIER_BP_ID,
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
END
GO

/* -------------------------------------------------------------------------- */
ALTER PROCEDURE [VInventory].[UPDATE_PURCHASE_GRN_HDR]
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
END
GO

/* -------------------------------------------------------------------------- */
ALTER PROCEDURE [VInventory].[SAVE_PURCHASE_GRN_DTL]
(
    @PURCHASE_GRN_REF_NO VARCHAR(50),
    @PURCHASE_ORDER_NO VARCHAR(50),
    @PURCHASE_ORDER_DTL_ID INT,
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
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    /* Same GRN + same line number = duplicate (the old check was inverted and
       tested only the header ref no, so the first line could never insert). */
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
            MODIFIED_MAC_ADDRESS
        )
        VALUES
        (
            @PURCHASE_GRN_REF_NO,
            @PURCHASE_ORDER_NO,
            @PURCHASE_ORDER_DTL_ID,
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
            @MAC_ADDRESS
        )

        SELECT '' AS STATUS, 'Data Saved Successfully' AS MESSAGE, CAST(SCOPE_IDENTITY() AS INT) AS DATA
    END
END
GO

/* -------------------------------------------------------------------------- */
ALTER PROCEDURE [VInventory].[UPDATE_PURCHASE_GRN_DTL]
(
    @PURCHASE_GRN_DTL_ID INT,
    @PURCHASE_GRN_REF_NO VARCHAR(50),
    @PURCHASE_ORDER_NO VARCHAR(50),
    @PURCHASE_ORDER_DTL_ID INT,
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
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    /* Duplicate line no within the same GRN, ignoring the row being updated.
       (The old check compared the shared header ref no, so any GRN with two
       or more lines could never update.) */
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
            MODIFIED_BY = @USER,
            MODIFIED_DATE = GETDATE(),
            MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
        WHERE PURCHASE_GRN_DTL_ID = @PURCHASE_GRN_DTL_ID

        SELECT '' AS STATUS,'Data Updated Successfully' AS MESSAGE,@PURCHASE_GRN_DTL_ID AS DATA
    END
END
GO
