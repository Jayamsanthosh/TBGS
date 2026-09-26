/*
  Purchase Request - SHOW_PURCHASE_REQUEST_DTL join fix
  ------------------------------------------------------
  Why:
    TBL_PURCHASE_REQUEST_DTL declares these columns NULL-able:
      REFERENCE_TYPE_ID, MAIN_CATEGORY_ID, SUB_CATEGORY_ID,
      PRODUCT_ID, UOM_ID, TRUCK_ID  (TRUCK_ID is documented "IF NEEDED")
    But the SP joined every one of them with INNER JOIN, so any saved
    line containing a NULL in those columns was silently dropped from the
    detail grid (it saved OK, then "disappeared" on reload).

  Fix:
    Use LEFT JOIN so the saved DTL row is always returned, and fall back
    to the raw ID when a master name is unavailable.

  Usage:  EXEC sp_executesql @sql   (run against the TBGS database)
*/

USE [TBGS]
GO

ALTER   PROCEDURE [VPurchase].[SHOW_PURCHASE_REQUEST_DTL]
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
        ISNULL(S.SUB_CATEGORY_NAME, CAST(D.SUB_CATEGORY_ID AS VARCHAR(50))) SUB_CATEGORY_NAME,
        ISNULL(E.PRODUCT_NAME, CAST(D.PRODUCT_ID AS VARCHAR(50))) PRODUCT_NAME,
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
