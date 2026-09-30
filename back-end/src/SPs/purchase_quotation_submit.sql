/* ============================================================================
   VPurchase.SUBMIT_PURCHASE_QUOTATION

   Advances a saved quotation to PENDING FOR APPROVAL.

   Why a dedicated SP instead of UPDATE_PURCHASE_QUOTATION_HDR: that procedure is
   a full overwrite - every column is assigned unconditionally from its
   parameter (only STATUS_ENTRY uses ISNULL). Sending a status-only payload
   through it would null out the supplier, dates, amounts and the whole
   SECTION_HEAD_RESPONSE_* / RESPONSE_1_* / RESPONSE_2_* / FINAL_RESPONSE_*
   approval history. This SP touches only the status and the audit columns, so
   submitting can never destroy data.

   Idempotent: submitting an already-submitted quotation succeeds and reports
   0 rows changed. @OUT_ROWCOUNT tells the caller whether anything moved.

   Two things move together, because the entry screen owns both:
     QUOTATION_STATUS_ID -> PENDING_APPROVAL
     STATUS_ENTRY        -> 'CL' (Submitted)
   ============================================================================ */

CREATE OR ALTER PROCEDURE [VPurchase].[SUBMIT_PURCHASE_QUOTATION]
(
    @PURCHASE_QUOTATION_NO VARCHAR(50),
    @QUOTATION_STATUS_ID  INT,
    @USER                 VARCHAR(50),
    @MAC_ADDRESS          VARCHAR(50),
    @OUT_ROWCOUNT         INT OUTPUT
)
AS
BEGIN
    SET NOCOUNT ON;

    IF @PURCHASE_QUOTATION_NO IS NULL OR LTRIM(RTRIM(@PURCHASE_QUOTATION_NO)) = ''
    BEGIN
        RAISERROR('Purchase quotation number is required.', 16, 1);
        RETURN;
    END

    IF @QUOTATION_STATUS_ID IS NULL
    BEGIN
        RAISERROR('Target quotation status is required.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM [VPurchase].[TBL_PURCHASE_QUOTATION_HDR]
        WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO
    )
    BEGIN
        RAISERROR('Purchase quotation %s does not exist.', 16, 1, @PURCHASE_QUOTATION_NO);
        RETURN;
    END

    /* An inactive record is not part of the approval flow. */
    IF EXISTS (
        SELECT 1
        FROM [VPurchase].[TBL_PURCHASE_QUOTATION_HDR]
        WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO
          AND UPPER(LTRIM(RTRIM(ISNULL(STATUS_ENTRY, '')))) = 'INACTIVE'
    )
    BEGIN
        RAISERROR('Purchase quotation %s is inactive and cannot be submitted.', 16, 1, @PURCHASE_QUOTATION_NO);
        RETURN;
    END

    UPDATE [VPurchase].[TBL_PURCHASE_QUOTATION_HDR]
    SET
        QUOTATION_STATUS_ID = @QUOTATION_STATUS_ID,
        /* Submitting also moves the record to the Submitted position (CL).
           SAVE_PURCHASE_QUOTATION_HDR already defaults new rows to CF, so this
           is the only transition point into CL from the entry screen. */
        STATUS_ENTRY = 'CL',
        MODIFIED_BY        = @USER,
        MODIFIED_DATE      = GETDATE(),
        MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
    WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO
      /* Updates when either half of the target state is not yet reached, so a row
         that is pending but still CF is corrected. Already-correct rows are a
         no-op and report 0. */
      AND (
            QUOTATION_STATUS_ID IS NULL
         OR QUOTATION_STATUS_ID <> @QUOTATION_STATUS_ID
         OR UPPER(LTRIM(RTRIM(ISNULL(STATUS_ENTRY, '')))) <> 'CL'
      );

    SET @OUT_ROWCOUNT = @@ROWCOUNT;

    /* Always return the resulting row so the caller can confirm the status. */
    SELECT
        SNO,
        PURCHASE_QUOTATION_NO,
        QUOTATION_STATUS_ID,
        STATUS_ENTRY,
        FINAL_RESPONSE_STATUS,
        MODIFIED_BY,
        MODIFIED_DATE
    FROM [VPurchase].[TBL_PURCHASE_QUOTATION_HDR]
    WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO;
END
GO
