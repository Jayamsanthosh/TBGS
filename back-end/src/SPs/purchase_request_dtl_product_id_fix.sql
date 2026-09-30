/* ============================================================================
   Fix: SHOW_PURCHASE_REQUEST_DTL did not return PRODUCT_ID (or the category
   ids), only the resolved names.

   The SP joins vmaster.TBL_PRODUCT_MASTER to resolve the product name and
   wraps it as ISNULL(name, id), so the name displayed correctly - but the raw
   PRODUCT_ID column was never selected.

   The purchase quotation wizard copies its lines from a Purchase Request. It
   needs PRODUCT_ID, not just the name, because:
     - the quotation line stores PRODUCT_ID (FK to TBL_PRODUCT_MASTER), and
     - on the quotation line card the Product cell is read-only, rendered from
       PRODUCT_NAME, so a user cannot type the id in by hand.

   Result: every line imported from a request arrived with PRODUCT_NAME set and
   PRODUCT_ID undefined, so "Product is required" fired on save and the line
   could never be completed. Adding the ids to the select fixes it at source.

   Everything else - the ID alias, TRUCK_NO, the REQUIRED_DATE formatting, the
   exact WHERE and ORDER BY - is left exactly as it was. Only the SELECT list
   gains three columns.
   ============================================================================ */

CREATE OR ALTER PROCEDURE [VPurchase].[SHOW_PURCHASE_REQUEST_DTL]
(
    @PURCHASE_REQUEST_NO VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    SELECT
        D.PURCHASE_REQUEST_DTL_ID ID,
        -- Also expose the column under its real name. The request grid keys off
        -- ID, but the Purchase Quotation screen reads PURCHASE_REQUEST_DTL_ID
        -- to link each quotation line back to the line it was quoted from, and
        -- silently got NULL when only the ID alias was present.
        D.PURCHASE_REQUEST_DTL_ID,
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
        -- Was missing. The quotation wizard needs this to build a quotation
        -- line, and the line's Product cell is read-only, so a missing id here
        -- made the imported line permanently unsavable.
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
        D.REASON,
        -- Surfaced so the client can tell a draft line (CF) from a submitted
        -- one (CL). SUBMIT_PURCHASE_REQUEST sets this on every line.
        D.STATUS_ENTRY
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
