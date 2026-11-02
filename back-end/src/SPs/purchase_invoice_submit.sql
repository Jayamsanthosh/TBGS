/* ============================================================================
   VPurchase.SUBMIT_PURCHASE_INVOICE_HDR

   Advances a saved purchase invoice to PENDING FOR APPROVAL.

   Why a dedicated SP instead of UPDATE_PURCHASE_INVOICE_HDR: that procedure is
   a full overwrite - every column is assigned unconditionally from its
   parameter. Sending a status-only payload through it would null out the
   supplier, dates, amounts and the conversation response fields. This SP
   touches only the status and audit columns, so submitting can never destroy
   data.

   Two things move together, because the entry screen owns both:
     STATUS_ID    -> PENDING_APPROVAL (resolved by the caller)
     STATUS_ENTRY -> 'CL' (Submitted)

   Children move with the parent so a submitted invoice has no draft lines or
   charges left hanging off it.

   Idempotent: submitting an already-submitted invoice succeeds and reports 0
   rows changed. @OUT_ROWCOUNT tells the caller whether anything moved, and the
   resulting header row is always returned so the caller can confirm the status.
   ============================================================================ */

SET QUOTED_IDENTIFIER ON
GO
SET ANSI_NULLS ON
GO

CREATE OR ALTER PROCEDURE [VPurchase].[SUBMIT_PURCHASE_INVOICE_HDR]
(
    @PURCHASE_INVOICE_REF_NO VARCHAR(50),
    @STATUS_ID                INT,
    @USER                     VARCHAR(50),
    @MAC_ADDRESS              VARCHAR(50),
    @OUT_ROWCOUNT             INT OUTPUT
)
AS
BEGIN
    SET NOCOUNT ON;
    SET @OUT_ROWCOUNT = 0;

    IF @PURCHASE_INVOICE_REF_NO IS NULL OR LTRIM(RTRIM(@PURCHASE_INVOICE_REF_NO)) = ''
    BEGIN
        RAISERROR('Purchase invoice number is required.', 16, 1);
        RETURN;
    END

    IF @STATUS_ID IS NULL
    BEGIN
        RAISERROR('Target purchase invoice status is required.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM [VPurchase].[TBL_PURCHASE_INVOICE_HDR]
        WHERE PURCHASE_INVOICE_REF_NO = @PURCHASE_INVOICE_REF_NO
    )
    BEGIN
        RAISERROR('Purchase invoice %s does not exist.', 16, 1, @PURCHASE_INVOICE_REF_NO);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM [VPurchase].[TBL_PURCHASE_INVOICE_DTL]
        WHERE PURCHASE_INVOICE_REF_NO = @PURCHASE_INVOICE_REF_NO
    )
    BEGIN
        RAISERROR('Purchase invoice %s has no invoice lines and cannot be submitted.', 16, 1, @PURCHASE_INVOICE_REF_NO);
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE [VPurchase].[TBL_PURCHASE_INVOICE_HDR]
        SET STATUS_ID            = @STATUS_ID,
            STATUS_ENTRY         = 'CL',
            MODIFIED_BY          = @USER,
            MODIFIED_DATE        = GETDATE(),
            MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
        WHERE PURCHASE_INVOICE_REF_NO = @PURCHASE_INVOICE_REF_NO
          AND (
                UPPER(LTRIM(RTRIM(ISNULL(STATUS_ENTRY, '')))) <> 'CL'
             OR ISNULL(STATUS_ID, 0) NOT IN (3, 4, 5, 6, 7)
          );

        SET @OUT_ROWCOUNT = @@ROWCOUNT;

        UPDATE [VPurchase].[TBL_PURCHASE_INVOICE_DTL]
        SET STATUS_ENTRY = 'CL'
        WHERE PURCHASE_INVOICE_REF_NO = @PURCHASE_INVOICE_REF_NO;

        UPDATE [VPurchase].[TBL_PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL]
        SET STATUS_ENTRY = 'CL'
        WHERE PURCHASE_INVOICE_REF_NO = @PURCHASE_INVOICE_REF_NO;

        COMMIT TRANSACTION;

        SELECT
            H.SNO,
            H.PURCHASE_INVOICE_REF_NO,
            H.STATUS_ID,
            COALESCE(SM.STATUS_NAME, 'Pending for Approval') AS STATUS_NAME,
            H.STATUS_ENTRY,
            H.MODIFIED_BY,
            H.MODIFIED_DATE
        FROM [VPurchase].[TBL_PURCHASE_INVOICE_HDR] H
        LEFT JOIN [VMaster].[TBL_STATUS_MASTER] SM ON SM.STATUS_ID = H.STATUS_ID
        WHERE H.PURCHASE_INVOICE_REF_NO = @PURCHASE_INVOICE_REF_NO;
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
