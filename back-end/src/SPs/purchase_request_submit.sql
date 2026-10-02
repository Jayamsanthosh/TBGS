/* ============================================================================
   VPurchase.SUBMIT_PURCHASE_REQUEST

   Advances a saved purchase request to PENDING FOR APPROVAL.

   Rewritten to mirror VPurchase.SUBMIT_PURCHASE_QUOTATION exactly. The previous
   version only set STATUS_ENTRY = 'CL' and returned a text rowset, which meant:

     - the Status column never moved, so the request looked Submitted while its
       master status was still Draft;
     - there was no way for the caller to tell a real change from a no-op;
     - no audit columns were written;
     - the "Record not found" / "Already Submitted" branches returned a row the
       caller had to interpret, and the "Already Submitted" branch was skipped
       for Administrators, letting a re-submit silently rewrite the row.

   Why a dedicated SP instead of UPDATE_PURCHASE_REQUEST_HDR: that procedure is
   a full overwrite - every column is assigned unconditionally from its
   parameter. Sending a status-only payload through it would null out the
   requester, dates and the whole SECTION_HEAD_RESPONSE_* / RESPONSE_1_* /
   RESPONSE_2_* / FINAL_RESPONSE_* approval history. This SP touches only the
   status and the audit columns, so submitting can never destroy data.

   Idempotent: submitting an already-submitted request succeeds and reports
   0 rows changed. @OUT_ROWCOUNT tells the caller whether anything moved.

   Three things move together, because the entry screen owns them:
     STATUS_ID     -> @STATUS_ID (the caller resolves PENDING_APPROVAL)
     STATUS_ENTRY  -> 'CL' (Submitted) on the header
     STATUS_ENTRY  -> 'CL' (Submitted) on every detail line

   The detail lines are updated too because purchase requests track status per
   line, and GET_APPROVAL_LIST_PURCHASE_REQUEST plus
   UPDATE_APPROVAL_STATUS_PURCHASE_REQUEST both gate on STATUS_ENTRY = 'CL'.
   ============================================================================ */

CREATE OR ALTER PROCEDURE [VPurchase].[SUBMIT_PURCHASE_REQUEST]
(
    @PURCHASE_REQUEST_NO VARCHAR(50),
    @STATUS_ID           INT,
    @USER                VARCHAR(50),
    @MAC_ADDRESS         VARCHAR(50),
    @OUT_ROWCOUNT        INT OUTPUT
)
AS
BEGIN
    SET NOCOUNT ON;

    IF @PURCHASE_REQUEST_NO IS NULL OR LTRIM(RTRIM(@PURCHASE_REQUEST_NO)) = ''
    BEGIN
        RAISERROR('Purchase request number is required.', 16, 1);
        RETURN;
    END

    IF @STATUS_ID IS NULL
    BEGIN
        RAISERROR('Target purchase request status is required.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
        WHERE PURCHASE_REQUEST_NO = @PURCHASE_REQUEST_NO
    )
    BEGIN
        RAISERROR('Purchase request %s does not exist.', 16, 1, @PURCHASE_REQUEST_NO);
        RETURN;
    END

    /* An inactive record is not part of the approval flow. */
    IF EXISTS (
        SELECT 1
        FROM [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
        WHERE PURCHASE_REQUEST_NO = @PURCHASE_REQUEST_NO
          AND UPPER(LTRIM(RTRIM(ISNULL(STATUS_ENTRY, '')))) IN ('INACTIVE', 'IN', 'IA')
    )
    BEGIN
        RAISERROR('Purchase request %s is inactive and cannot be submitted.', 16, 1, @PURCHASE_REQUEST_NO);
        RETURN;
    END

    UPDATE [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
    SET
        STATUS_ID = @STATUS_ID,
        /* Submitting also moves the record to the Submitted position (CL).
           SAVE_PURCHASE_REQUEST_HDR already defaults new rows to CF, so this is
           the only transition point into CL from the entry screen. */
        STATUS_ENTRY = 'CL',
        MODIFIED_BY        = @USER,
        MODIFIED_DATE      = GETDATE(),
        MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
    WHERE PURCHASE_REQUEST_NO = @PURCHASE_REQUEST_NO
      /* Updates when either half of the target state is not yet reached, so a row
         that is pending but still CF is corrected. Already-correct rows are a
         no-op and report 0. */
      AND (
            STATUS_ID IS NULL
         OR STATUS_ID <> @STATUS_ID
         OR UPPER(LTRIM(RTRIM(ISNULL(STATUS_ENTRY, '')))) <> 'CL'
      );

    SET @OUT_ROWCOUNT = @@ROWCOUNT;

    /* Detail lines follow the header, so the approval panel and the line status
       agree. Guarded on the same target state for the same idempotent reason. */
    UPDATE [VPurchase].[TBL_PURCHASE_REQUEST_DTL]
    SET
        STATUS_ENTRY = 'CL',
        MODIFIED_BY        = @USER,
        MODIFIED_DATE      = GETDATE(),
        MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
    WHERE PURCHASE_REQUEST_NO = @PURCHASE_REQUEST_NO
      AND UPPER(LTRIM(RTRIM(ISNULL(STATUS_ENTRY, '')))) <> 'CL';

    /* Always return the resulting row so the caller can confirm the status. */
    SELECT
        SNO,
        PURCHASE_REQUEST_NO,
        STATUS_ID,
        STATUS_ENTRY,
        FINAL_RESPONSE_STATUS,
        MODIFIED_BY,
        MODIFIED_DATE
    FROM [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
    WHERE PURCHASE_REQUEST_NO = @PURCHASE_REQUEST_NO;
END
GO