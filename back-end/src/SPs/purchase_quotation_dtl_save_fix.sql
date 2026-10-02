/* ============================================================================
   Fix: SAVE_PURCHASE_QUOTATION_DTL omitted audit/status fields that the API
   passes and that the quotation lines need persisted.

   The procedure accepted REQUIRED_DATE, REASON, REMARKS, ITEM_TYPE, STATUS_ENTRY
   as parameters but did not include them in the INSERT column list or VALUES.
   As a result, quotation detail rows stored STATUS_ENTRY = NULL and lost those
   fields even though the service supplied them.

   This brings the INSERT in line with the parameter list (and matches how the
   UPDATE version behaves conceptually). Only the INSERT is changed; no other
   logic is modified.
   ============================================================================ */

CREATE OR ALTER PROCEDURE [VPurchase].[SAVE_PURCHASE_QUOTATION_DTL]
(
    @PURCHASE_QUOTATION_NO VARCHAR(50),
    @PURCHASE_REQUEST_NO VARCHAR(50),
    @PURCHASE_REQUEST_DTL_ID INT,
    @CAMP_ID INT,
    @REQUEST_STORE_ID INT,
    @REFERENCE_TYPE_ID INT,
    @REFERENCE_NO VARCHAR(50),
    @LINE_NO INT,
    @MAIN_CATEGORY_ID INT,
    @SUB_CATEGORY_ID INT,
    @PRODUCT_ID INT,
    @NO_OF_PCS_PER_PACKING DECIMAL(15,3),
    @TOTAL_QUANTITY DECIMAL(15,3),
    @UOM_ID INT,
    @TOTAL_PACKING DECIMAL(15,3),
    @ALT_UOM_ID INT,
    @RATE DECIMAL(15,3),
    @SUB_TOTAL_AMOUNT_FC DECIMAL(15,3),
    @DISCOUNT_PERCENTAGE DECIMAL(15,3),
    @DISCOUNT_AMOUNT_FC DECIMAL(15,3),
    @TOTAL_PRODUCT_AMOUNT_FC DECIMAL(15,3),
    @TAX_ID INT,
    @TAX_PERCENTAGE DECIMAL(15,3),
    @TAX_AMOUNT_FC DECIMAL(15,3),
    @FINAL_AMOUNT_FC DECIMAL(15,3),
    @EXCHANGE_RATE DECIMAL(15,6),
    @SUB_TOTAL_AMOUNT_LC DECIMAL(15,3),
    @DISCOUNT_AMOUNT_LC DECIMAL(15,3),
    @TOTAL_PRODUCT_AMOUNT_LC DECIMAL(15,3),
    @TAX_AMOUNT_LC DECIMAL(15,3),
    @FINAL_AMOUNT_LC DECIMAL(15,3),
    @REQUIRED_DATE DATETIME,
    @REASON VARCHAR(500),
    @REMARKS VARCHAR(500),
    @ITEM_TYPE VARCHAR(50) = NULL,
    @STATUS_ENTRY VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF NOT EXISTS (
        SELECT 1 FROM [VPurchase].[TBL_PURCHASE_QUOTATION_HDR]
        WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO
    )
    BEGIN
        SELECT 'Error', 'Parent Purchase Quotation not found. Cannot save detail.', ''
        RETURN
    END

    IF EXISTS (
        SELECT 1 FROM [VPurchase].[TBL_PURCHASE_QUOTATION_DTL]
        WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO
          AND LINE_NO = @LINE_NO
    )
    BEGIN
        SELECT 'Error', 'Line No ' + CAST(@LINE_NO AS VARCHAR(10)) + ' already exists for this Quotation.', ''
        RETURN
    END

    INSERT INTO [VPurchase].[TBL_PURCHASE_QUOTATION_DTL]
    (
        PURCHASE_QUOTATION_NO,
        PURCHASE_REQUEST_NO,
        PURCHASE_REQUEST_DTL_ID,
        CAMP_ID,
        REQUEST_STORE_ID,
        REFERENCE_TYPE_ID,
        REFERENCE_NO,
        LINE_NO,
        MAIN_CATEGORY_ID,
        SUB_CATEGORY_ID,
        PRODUCT_ID,
        NO_OF_PCS_PER_PACKING,
        TOTAL_QUANTITY,
        UOM_ID,
        TOTAL_PACKING,
        ALT_UOM_ID,
        RATE,
        SUB_TOTAL_AMOUNT_FC,
        DISCOUNT_PERCENTAGE,
        DISCOUNT_AMOUNT_FC,
        TOTAL_PRODUCT_AMOUNT_FC,
        TAX_ID,
        TAX_PERCENTAGE,
        TAX_AMOUNT_FC,
        FINAL_AMOUNT_FC,
        EXCHANGE_RATE,
        SUB_TOTAL_AMOUNT_LC,
        DISCOUNT_AMOUNT_LC,
        TOTAL_PRODUCT_AMOUNT_LC,
        TAX_AMOUNT_LC,
        FINAL_AMOUNT_LC,
        REQUIRED_DATE,
        REASON,
        REMARKS,
        ITEM_TYPE,
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
        @PURCHASE_QUOTATION_NO,
        @PURCHASE_REQUEST_NO,
        @PURCHASE_REQUEST_DTL_ID,
        @CAMP_ID,
        @REQUEST_STORE_ID,
        @REFERENCE_TYPE_ID,
        @REFERENCE_NO,
        @LINE_NO,
        @MAIN_CATEGORY_ID,
        @SUB_CATEGORY_ID,
        @PRODUCT_ID,
        @NO_OF_PCS_PER_PACKING,
        @TOTAL_QUANTITY,
        @UOM_ID,
        @TOTAL_PACKING,
        @ALT_UOM_ID,
        @RATE,
        @SUB_TOTAL_AMOUNT_FC,
        @DISCOUNT_PERCENTAGE,
        @DISCOUNT_AMOUNT_FC,
        @TOTAL_PRODUCT_AMOUNT_FC,
        @TAX_ID,
        @TAX_PERCENTAGE,
        @TAX_AMOUNT_FC,
        @FINAL_AMOUNT_FC,
        @EXCHANGE_RATE,
        @SUB_TOTAL_AMOUNT_LC,
        @DISCOUNT_AMOUNT_LC,
        @TOTAL_PRODUCT_AMOUNT_LC,
        @TAX_AMOUNT_LC,
        @FINAL_AMOUNT_LC,
        @REQUIRED_DATE,
        @REASON,
        @REMARKS,
        @ITEM_TYPE,
        @STATUS_ENTRY,
        @USER,
        GETDATE(),
        @MAC_ADDRESS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS
    )

    DECLARE @LAST_INSERTED_ID INT = SCOPE_IDENTITY();

    SELECT '' AS STATUS, 'Data Saved Successfully' AS MESSAGE, @LAST_INSERTED_ID AS DATA;
END
