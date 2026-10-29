/* ============================================================================
   VPurchase.SUBMIT_PURCHASE_ORDER_HDR

   Advances a saved purchase order to PENDING FOR APPROVAL.

   Why a dedicated SP instead of UPDATE_PURCHASE_ORDER_HDR: that procedure is a
   full overwrite - every column is assigned unconditionally from its parameter.
   Sending a status-only payload through it would null out the supplier, dates,
   amounts and the whole SECTION_HEAD_RESPONSE_* / RESPONSE_1_* / RESPONSE_2_* /
   FINAL_RESPONSE_* approval history. This SP touches only the status and the
   audit columns, so submitting can never destroy data.

   Two things move together, because the entry screen owns both:
     PURCHASE_ORDER_STATUS_ID -> 3 (Pending for Approval)
     STATUS_ENTRY             -> 'CL' (Submitted)

   The approval panel's gate is a positive test built on those two columns: an
   order only reaches the panel when STATUS_ENTRY = 'CL' AND (the order status
   is one of the live ones OR an approval level has answered). A submit proc
   that flipped STATUS_ENTRY alone left the order on Draft (2) with no answers,
   so it stayed out of the panel; moving the status here is what actually puts
   a freshly submitted order in front of the approvers.

   Idempotent: submitting an already-submitted order succeeds and reports 0 rows
   changed. @OUT_ROWCOUNT tells the caller whether anything moved, and the
   resulting header row is always returned so the caller can confirm the status
   (the same contract SUBMIT_PURCHASE_QUOTATION uses).
   ============================================================================ */

SET QUOTED_IDENTIFIER ON
GO
SET ANSI_NULLS ON
GO

CREATE OR ALTER PROCEDURE [VPurchase].[SUBMIT_PURCHASE_ORDER_HDR]
(
    @PURCHASE_ORDER_NO VARCHAR(50),
    @USER              VARCHAR(50),
    @MAC_ADDRESS       VARCHAR(50),
    @OUT_ROWCOUNT      INT OUTPUT
)
AS
BEGIN
    SET NOCOUNT ON;
    SET @OUT_ROWCOUNT = 0;

    IF @PURCHASE_ORDER_NO IS NULL OR LTRIM(RTRIM(@PURCHASE_ORDER_NO)) = ''
    BEGIN
        RAISERROR('Purchase order number is required.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM [VPurchase].[TBL_PURCHASE_ORDER_HDR]
        WHERE PURCHASE_ORDER_NO = @PURCHASE_ORDER_NO
    )
    BEGIN
        RAISERROR('Purchase Order %s does not exist.', 16, 1, @PURCHASE_ORDER_NO);
        RETURN;
    END

    /* An order with no quotation behind it is not an order - it is an unpriced
       commitment. Refused here as well as in the service, so the rule survives
       a caller that skips the service. */
    IF NOT EXISTS (
        SELECT 1
        FROM [VPurchase].[TBL_PURCHASE_ORDER_HDR]
        WHERE PURCHASE_ORDER_NO = @PURCHASE_ORDER_NO
          AND NULLIF(LTRIM(RTRIM(PURCHASE_QUOTATION_NO)), '') IS NOT NULL
    )
    BEGIN
        RAISERROR('Purchase Order %s has no Purchase Quotation and cannot be submitted.', 16, 1, @PURCHASE_ORDER_NO);
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        /* A row that is already CL *and* already in the workflow is a no-op.
           A row that is CL but still on Draft (the legacy submit only moved
           STATUS_ENTRY) is corrected, so an "already submitted" order really is
           in the workflow. Any finished order (Approved / Rejected / Cancelled
           / Closed) is left alone. */
        UPDATE [VPurchase].[TBL_PURCHASE_ORDER_HDR]
        SET PURCHASE_ORDER_STATUS_ID = 3,
            STATUS_ENTRY             = 'CL',
            MODIFIED_BY              = @USER,
            MODIFIED_DATE            = GETDATE(),
            MODIFIED_MAC_ADDRESS     = @MAC_ADDRESS
        WHERE PURCHASE_ORDER_NO = @PURCHASE_ORDER_NO
          AND (
                UPPER(LTRIM(RTRIM(ISNULL(STATUS_ENTRY, '')))) <> 'CL'
             OR ISNULL(PURCHASE_ORDER_STATUS_ID, 0) NOT IN (3, 4, 5, 6, 7)
          );

        SET @OUT_ROWCOUNT = @@ROWCOUNT;

        /* The children are moved with the parent so a submitted order has no
           draft lines left hanging off it. */
        UPDATE [VPurchase].[TBL_PURCHASE_ORDER_DTL]
        SET STATUS_ENTRY = 'CL'
        WHERE PURCHASE_ORDER_NO = @PURCHASE_ORDER_NO;

        UPDATE [VPurchase].[TBL_PURCHASE_ORDER_ADDITIONAL_CHARGES_DTL]
        SET STATUS_ENTRY = 'CL'
        WHERE PURCHASE_ORDER_NO = @PURCHASE_ORDER_NO;

        COMMIT TRANSACTION;

        /* Always return the resulting header row so the caller can confirm the
           status, whatever the rowcount was. */
        SELECT
            SNO,
            PURCHASE_ORDER_NO,
            PURCHASE_ORDER_STATUS_ID,
            STATUS_ENTRY,
            FINAL_RESPONSE_STATUS,
            MODIFIED_BY,
            MODIFIED_DATE
        FROM [VPurchase].[TBL_PURCHASE_ORDER_HDR]
        WHERE PURCHASE_ORDER_NO = @PURCHASE_ORDER_NO;
    END TRY
    BEGIN CATCH
        DECLARE @msg VARCHAR(MAX) = '';
        SET @OUT_ROWCOUNT = 0;
        SET @msg = 'ERROR: ' + ERROR_MESSAGE() + ' at '
                    + COALESCE(ERROR_PROCEDURE(), '')
                    + COALESCE(' line:' + CONVERT(VARCHAR(30), ERROR_LINE()), '');
        IF @@TRANCOUNT > 0 ROLLBACK TRAN;
        RAISERROR (@msg, 16, 1) WITH NOWAIT;
    END CATCH
END
GO
