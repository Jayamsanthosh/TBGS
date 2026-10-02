/* =====================================================================
   Purchase Quotation - stored procedure corrections
   ---------------------------------------------------------------------
   1) GET_PURCHASE_QUOTATION_DTL
      REPLACE(CONVERT(VARCHAR(50), REQUIRED_DATE, 106), '', '-') is a no-op
      (it searches for an empty string, which never matches). The column was
      meant to be ' ' so the client receives dd-mm-yyyy hh:mm:ss.fff.
      Corrected to match SHOW_PURCHASE_QUOTATION_DTL / the other modules.

   2) SHOW_PURCHASE_QUOTATION_DTL
      - only filtered by @STATUS, so it could never scope lines to one
        quotation. @PURCHASE_QUOTATION_NO is added as an OPTIONAL trailing
        parameter (backward compatible for existing callers).
      - returned a 22 column report subset. The editor needs the full
        editable row, so all 43 detail columns are returned and the product
        / UOM / category labels are joined in.
   ===================================================================== */

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* ---------- 1) GET_PURCHASE_QUOTATION_DTL : required date format ---------- */
CREATE OR ALTER PROCEDURE [VPurchase].[GET_PURCHASE_QUOTATION_DTL]
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
    LEFT JOIN VMaster.TBL_UOM_MASTER      U  ON U.UOM_ID      = D.UOM_ID
    LEFT JOIN VMaster.TBL_UOM_MASTER      AU ON AU.UOM_ID     = D.ALT_UOM_ID
    WHERE D.PURCHASE_QUOTATION_DTL_ID = @PURCHASE_QUOTATION_DTL_ID;
END
GO

/* ---------- 2) SHOW_PURCHASE_QUOTATION_DTL : optional parent + full row ---------- */
CREATE OR ALTER PROCEDURE [VPurchase].[SHOW_PURCHASE_QUOTATION_DTL]
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
        ,D.STATUS_ENTRY
        ,D.CREATED_BY
        ,D.CREATED_DATE
        ,D.CREATED_MAC_ADDRESS
        ,D.MODIFIED_BY
        ,D.MODIFIED_DATE
        ,D.MODIFIED_MAC_ADDRESS
    FROM VPurchase.TBL_PURCHASE_QUOTATION_DTL D
    LEFT JOIN VMaster.TBL_PRODUCT_MASTER           P  ON P.PRODUCT_ID       = D.PRODUCT_ID
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

/* ------------------------------------------------------------------
   SHOW_PURCHASE_REQUEST_DTL: expose the product / category key columns.

   The procedure already joins the masters to build *_NAME, but it never
   returned MAIN_CATEGORY_ID / SUB_CATEGORY_ID / PRODUCT_ID themselves.
   Purchase Quotation copies these keys onto TBL_PURCHASE_QUOTATION_DTL
   ("PICK AUTOMATICALLY FROM PO REQUEST DTL TABLE"), so without them the
   quotation line silently lost its product / category foreign keys and the
   quotation product name came back blank. The change is additive - every
   existing column keeps its name, position consumer and value, so the
   Purchase Request screen is unaffected.
   ------------------------------------------------------------------ */
CREATE OR ALTER PROCEDURE [VPurchase].[SHOW_PURCHASE_REQUEST_DTL]
(
    @PURCHASE_REQUEST_NO VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    SELECT
        D.PURCHASE_REQUEST_DTL_ID ID,
        D.PURCHASE_REQUEST_NO,
        ISNULL(RE.REFERENCE_TYPE_NAME, CAST(D.REFERENCE_TYPE_ID AS VARCHAR(50))) REFERENCE_TYPE_NAME,
        D.REFERENCE_TYPE_ID,
        D.REFERENCE_NO,
        D.LINE_NO,
        ISNULL(M.MAIN_CATEGORY_NAME, CAST(D.MAIN_CATEGORY_ID AS VARCHAR(50))) MAIN_CATEGORY_NAME,
        D.MAIN_CATEGORY_ID,
        ISNULL(S.SUB_CATEGORY_NAME, CAST(D.SUB_CATEGORY_ID AS VARCHAR(50))) SUB_CATEGORY_NAME,
        D.SUB_CATEGORY_ID,
        ISNULL(E.PRODUCT_NAME, CAST(D.PRODUCT_ID AS VARCHAR(50))) PRODUCT_NAME,
        D.PRODUCT_ID,
        D.DESCRIPTION,
        D.NO_OF_PCS_PER_PACKING,
        D.Total_Quantity,
        D.UOM_ID,
        D.Total_Packing,
        ISNULL(U.UOM_NAME, CAST(D.UOM_ID AS VARCHAR(50))) UOM_NAME,
        D.ALT_UOM_ID,
        D.TRUCK_ID,
        ISNULL(T.TRUCK_NO, CAST(D.TRUCK_ID AS VARCHAR(50))) TRUCK_NO,
        REPLACE(CONVERT(VARCHAR(50),D.REQUIRED_DATE,106),' ','-') REQUIRED_DATE,
        D.REASON
    FROM [VPurchase].[TBL_PURCHASE_REQUEST_DTL] D
    LEFT JOIN  vmaster.TBL_PRODUCT_MASTER as e on  e.PRODUCT_ID =d.PRODUCT_ID
    LEFT JOIN  vmaster.TBL_PRODUCT_MAIN_CATEGORY_MASTER  as M on  M.MAIN_CATEGORY_ID =D.MAIN_CATEGORY_ID
    LEFT JOIN  vmaster.TBL_PRODUCT_SUB_CATEGORY_MASTER   as S on  S.SUB_CATEGORY_ID=D.SUB_CATEGORY_ID
    LEFT JOIN  vmaster.TBL_UOM_MASTER   as U on  U.UOM_ID=D.UOM_ID
    LEFT JOIN  VMASTER.TBL_TRUCK_MASTER_hdr AS T ON T.TRUCK_ID =D.TRUCK_ID
    LEFT JOIN   VMASTER.TBL_REFERENCE_TYPE_MASTER  AS  RE ON  RE.REFERENCE_TYPE_ID =D.REFERENCE_TYPE_ID
    WHERE D.PURCHASE_REQUEST_NO = @PURCHASE_REQUEST_NO
    ORDER BY D.LINE_NO ASC
END
GO

PRINT 'Purchase Quotation SP fixes applied.';
GO
