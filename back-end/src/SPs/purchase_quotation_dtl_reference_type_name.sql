-- Purchase quotation line grid: SHOW/GET_PURCHASE_QUOTATION_DTL returned
-- REFERENCE_TYPE_ID but never REFERENCE_TYPE_NAME, so the "Ref Type" cell fell
-- back to showing a bare id (e.g. 3) instead of the name (Booking). The other
-- master names on this grid are joined the same way.

-- GET_PURCHASE_QUOTATION_DTL: return the reference-type name alongside its id.
-- Get purchase quotation dtl: additional-cost columns removed.
/* ---------- 1) GET_PURCHASE_QUOTATION_DTL : required date format ---------- */
ALTER   PROCEDURE [VPurchase].[GET_PURCHASE_QUOTATION_DTL]
(
    @PURCHASE_QUOTATION_DTL_ID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
         D.PURCHASE_QUOTATION_DTL_ID
        ,D.PURCHASE_QUOTATION_NO
        ,D.PURCHASE_REQUEST_NO
        ,D.PURCHASE_REQUEST_DTL_ID
        ,D.CAMP_ID
        ,D.REQUEST_STORE_ID
        ,D.REFERENCE_TYPE_ID
        ,RT.REFERENCE_TYPE_NAME
        ,D.REFERENCE_NO
        ,D.LINE_NO
        ,D.MAIN_CATEGORY_ID
        ,D.SUB_CATEGORY_ID
        ,D.PRODUCT_ID
        ,P.PRODUCT_NAME
        ,D.NO_OF_PCS_PER_PACKING
        ,D.TOTAL_QUANTITY
        ,D.UOM_ID
        ,U.UOM_NAME
        ,D.TOTAL_PACKING
        ,D.ALT_UOM_ID
        ,AU.UOM_NAME AS ALT_UOM_NAME
        ,D.RATE
        ,D.SUB_TOTAL_AMOUNT_FC
        ,D.DISCOUNT_PERCENTAGE
        ,D.DISCOUNT_AMOUNT_FC
        ,D.TOTAL_PRODUCT_AMOUNT_FC
        ,D.TAX_ID
        ,D.TAX_PERCENTAGE
        ,D.TAX_AMOUNT_FC
        ,D.FINAL_AMOUNT_FC
        ,D.EXCHANGE_RATE
        ,D.SUB_TOTAL_AMOUNT_LC
        ,D.DISCOUNT_AMOUNT_LC

        ,D.TOTAL_PRODUCT_AMOUNT_LC
        ,D.TAX_AMOUNT_LC
        ,D.FINAL_AMOUNT_LC
        ,REPLACE(CONVERT(VARCHAR(50), D.REQUIRED_DATE, 106), ' ', '-') AS REQUIRED_DATE
        ,D.REASON
        ,D.REMARKS
        ,D.STATUS_ENTRY
        ,D.CREATED_BY
        ,D.CREATED_DATE
        ,D.CREATED_MAC_ADDRESS
        ,D.MODIFIED_BY
        ,D.MODIFIED_DATE
        ,D.MODIFIED_MAC_ADDRESS
    FROM VPurchase.TBL_PURCHASE_QUOTATION_DTL D
    LEFT JOIN VMaster.TBL_PRODUCT_MASTER P ON P.PRODUCT_ID = D.PRODUCT_ID
        LEFT JOIN VMaster.TBL_REFERENCE_TYPE_MASTER  RT ON RT.REFERENCE_TYPE_ID = D.REFERENCE_TYPE_ID
    LEFT JOIN VMaster.TBL_UOM_MASTER      U  ON U.UOM_ID      = D.UOM_ID
    LEFT JOIN VMaster.TBL_UOM_MASTER      AU ON AU.UOM_ID     = D.ALT_UOM_ID
    WHERE D.PURCHASE_QUOTATION_DTL_ID = @PURCHASE_QUOTATION_DTL_ID;
END
GO
-- SHOW_PURCHASE_QUOTATION_DTL: return the reference-type name alongside its id.
-- Show purchase quotation dtl: additional-cost columns removed.
/* ------------------------------------------------------------------ */
/* 3. SHOW_PURCHASE_QUOTATION_DTL                                      */
/* ------------------------------------------------------------------ */
ALTER PROCEDURE [VPurchase].[SHOW_PURCHASE_QUOTATION_DTL]
(
    @STATUS                  VARCHAR(20),
    @PURCHASE_QUOTATION_NO   VARCHAR(50) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
         D.PURCHASE_QUOTATION_DTL_ID
        ,D.PURCHASE_QUOTATION_NO
        ,D.PURCHASE_REQUEST_NO
        ,D.PURCHASE_REQUEST_DTL_ID
        ,D.CAMP_ID
        ,D.REQUEST_STORE_ID
        ,D.REFERENCE_TYPE_ID
        ,RT.REFERENCE_TYPE_NAME
        ,D.REFERENCE_NO
        ,D.LINE_NO
        ,D.MAIN_CATEGORY_ID
        ,MC.MAIN_CATEGORY_NAME
        ,D.SUB_CATEGORY_ID
        ,SC.SUB_CATEGORY_NAME
        ,D.PRODUCT_ID
        ,P.PRODUCT_NAME
        ,D.NO_OF_PCS_PER_PACKING
        ,D.TOTAL_QUANTITY
        ,D.UOM_ID
        ,U.UOM_NAME
        ,D.TOTAL_PACKING
        ,D.ALT_UOM_ID
        ,AU.UOM_NAME AS ALT_UOM_NAME
        ,D.RATE
        ,D.SUB_TOTAL_AMOUNT_FC
        ,D.DISCOUNT_PERCENTAGE
        ,D.DISCOUNT_AMOUNT_FC
        ,D.TOTAL_PRODUCT_AMOUNT_FC
        ,D.TAX_ID
        ,T.TAX_NAME
        ,D.TAX_PERCENTAGE
        ,D.TAX_AMOUNT_FC
        ,D.FINAL_AMOUNT_FC
        ,D.EXCHANGE_RATE
        ,D.SUB_TOTAL_AMOUNT_LC
        ,D.DISCOUNT_AMOUNT_LC

        ,D.TOTAL_PRODUCT_AMOUNT_LC
        ,D.TAX_AMOUNT_LC
        ,D.FINAL_AMOUNT_LC
        ,D.REQUIRED_DATE
        ,D.REASON
        ,D.REMARKS
        ,D.ITEM_TYPE
        ,D.STATUS_ENTRY
        ,D.CREATED_BY
        ,D.CREATED_DATE
        ,D.CREATED_MAC_ADDRESS
        ,D.MODIFIED_BY
        ,D.MODIFIED_DATE
        ,D.MODIFIED_MAC_ADDRESS
    FROM VPurchase.TBL_PURCHASE_QUOTATION_DTL D
    LEFT JOIN VMaster.TBL_PRODUCT_MASTER           P  ON P.PRODUCT_ID       = D.PRODUCT_ID
        LEFT JOIN VMaster.TBL_REFERENCE_TYPE_MASTER  RT ON RT.REFERENCE_TYPE_ID = D.REFERENCE_TYPE_ID
    LEFT JOIN VMaster.TBL_UOM_MASTER                U  ON U.UOM_ID           = D.UOM_ID
    LEFT JOIN VMaster.TBL_UOM_MASTER                AU ON AU.UOM_ID          = D.ALT_UOM_ID
    LEFT JOIN VMaster.TBL_PRODUCT_MAIN_CATEGORY_MASTER MC ON MC.MAIN_CATEGORY_ID = D.MAIN_CATEGORY_ID
    LEFT JOIN VMaster.TBL_PRODUCT_SUB_CATEGORY_MASTER  SC ON SC.SUB_CATEGORY_ID  = D.SUB_CATEGORY_ID
    LEFT JOIN VMaster.TBL_TAX_MASTER                T  ON T.TAX_ID            = D.TAX_ID
    WHERE (@STATUS = 'ALL' OR D.STATUS_ENTRY = @STATUS)
      AND (@PURCHASE_QUOTATION_NO IS NULL OR D.PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO)
    ORDER BY D.LINE_NO, D.PURCHASE_QUOTATION_DTL_ID;
END
GO