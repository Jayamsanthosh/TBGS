-- =============================================================
-- [VRequest].[GET_REQUEST_SUMMARY]
-- Returns one row per request type with Pending/Approved/Hold/Rejected counts.
--
-- Counting rule
--   * @IncludeUnsubmitted = 1  -> every stored row is counted (drafts too).
--   * @IncludeUnsubmitted = 0  -> only submitted / actionable rows are counted
--                                 (the approval app's historical behaviour).
--
-- Status rule is the canonical terminal-only rollup in
-- VRequest.FN_APPROVAL_STATUS, so a request whose deeper levels are still
-- blank is Pending and never leaks into Approved.
--
-- Total is always Pending + Approved + Hold + Rejected because every row is
-- classified into exactly one bucket.
-- =============================================================
CREATE OR ALTER PROCEDURE [VRequest].[GET_REQUEST_SUMMARY]
    @IncludeUnsubmitted BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH ALL_REQUEST AS
    (
        -- Attendance Request
        SELECT
            'Attendance Request' AS CardName,
            VRequest.FN_APPROVAL_STATUS(
                SECTION_HEAD_RESPONSE_STATUS,
                RESPONSE_1_STATUS,
                RESPONSE_2_STATUS,
                FINAL_RESPONSE_STATUS
            ) AS St
        FROM [VRequest].[TBL_ATTENDANCE_REQUEST] A
        WHERE @IncludeUnsubmitted = 1
           OR (A.STATUS_MASTER IN ('AC', 'CL')
               AND EXISTS (SELECT 1 FROM [VPayEntries].[ATTENDANCE_DETAILS] XD
                           WHERE XD.ATT_REQUEST_REF_NO = A.ATT_REQUEST_REF_NO
                             AND XD.STATUS_MASTER = 'CL'))

        UNION ALL

        -- Cash Advance Request
        SELECT
            'Cash Advance Request',
            VRequest.FN_APPROVAL_STATUS(
                SECTION_HEAD_RESPONSE_STATUS,
                RESPONSE_1_STATUS,
                RESPONSE_2_STATUS,
                FINAL_RESPONSE_STATUS
            )
        FROM [VRequest].[TBL_CASH_ADVANCE_REQUEST]
        WHERE @IncludeUnsubmitted = 1 OR STATUS_MASTER = 'CL'

        UNION ALL

        -- Arrears Request
        SELECT
            'Arrears Request',
            VRequest.FN_APPROVAL_STATUS(
                SECTION_HEAD_RESPONSE_STATUS,
                RESPONSE_1_STATUS,
                RESPONSE_2_STATUS,
                FINAL_RESPONSE_STATUS
            )
        FROM [VRequest].[TBL_ARREARS_REQUEST] A
        WHERE @IncludeUnsubmitted = 1
           OR (A.STATUS_MASTER IN ('AC', 'CL')
               AND EXISTS (SELECT 1 FROM [VPayEntries].[TBL_ARREAR_ENTRIES] XD
                           WHERE XD.ARREAR_REQUEST_REF_NO = A.ARREAR_REQUEST_REF_NO
                             AND XD.STATUS_MASTER = 'CL'))

        UNION ALL

        -- Overtime Request
        SELECT
            'Overtime Request',
            VRequest.FN_APPROVAL_STATUS(
                SECTION_HEAD_RESPONSE_STATUS,
                RESPONSE_1_STATUS,
                RESPONSE_2_STATUS,
                FINAL_RESPONSE_STATUS
            )
        FROM [VRequest].[TBL_OVERTIME_REQUEST] A
        WHERE @IncludeUnsubmitted = 1
           OR (A.STATUS_MASTER IN ('AC', 'CL')
               AND EXISTS (SELECT 1 FROM [VPayEntries].[TBL_OVERTIME_ENTRIES] XD
                           WHERE XD.OT_REQUEST_REF_NO = A.OT_REQUEST_REF_NO
                             AND XD.STATUS_MASTER = 'CL'))

        UNION ALL

        -- Bonus Request
        SELECT
            'Bonus Request',
            VRequest.FN_APPROVAL_STATUS(
                SECTION_HEAD_RESPONSE_STATUS,
                RESPONSE_1_STATUS,
                RESPONSE_2_STATUS,
                FINAL_RESPONSE_STATUS
            )
        FROM [VRequest].[TBL_BONUS_REQUEST] A
        WHERE @IncludeUnsubmitted = 1
           OR (A.STATUS_MASTER IN ('AC', 'CL')
               AND EXISTS (SELECT 1 FROM [VPayEntries].[TBL_BONUS_ENTRIES] XD
                           WHERE XD.BONUS_REQUEST_REF_NO = A.BONUS_REQUEST_REF_NO
                             AND XD.STATUS_MASTER = 'CL'))

        UNION ALL

        -- Leave Encashment Request
        SELECT
            'Leave Encashment Request',
            VRequest.FN_APPROVAL_STATUS(
                SECTION_HEAD_RESPONSE_STATUS,
                RESPONSE_1_STATUS,
                RESPONSE_2_STATUS,
                FINAL_RESPONSE_STATUS
            )
        FROM [VRequest].[TBL_LEAVE_ENCASHMENT_REQUEST] A
        WHERE @IncludeUnsubmitted = 1
           OR (A.STATUS_MASTER IN ('AC', 'CL')
               AND EXISTS (SELECT 1 FROM [VPayEntries].[TBL_LEAVE_ENCASHMENT_ENTRIES] XD
                           WHERE XD.LEAVE_ENCASHMENT_REQUEST_REF_NO = A.LEAVE_ENCASHMENT_REQUEST_REF_NO
                             AND XD.STATUS_MASTER = 'CL'))

        UNION ALL

        -- Promotion Demotion Transfer Request
        SELECT
            'Promotion Demotion Transfer Request',
            VRequest.FN_APPROVAL_STATUS(
                SECTION_HEAD_RESPONSE_STATUS,
                RESPONSE_1_STATUS,
                RESPONSE_2_STATUS,
                FINAL_RESPONSE_STATUS
            )
        FROM [VRequest].[TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST] A
        WHERE @IncludeUnsubmitted = 1
           OR (A.STATUS_MASTER IN ('AC', 'CL')
               AND EXISTS (SELECT 1 FROM [VPayEntries].[TBL_PROMOTION_DEMOTION_TRANSFER_ENTRIES] XD
                           WHERE XD.TRANSFER_REQUEST_REF_NO = A.TRANSFER_REQUEST_REF_NO
                             AND XD.STATUS_MASTER = 'CL'))
    )
    SELECT
        CardName,
        SUM(CASE WHEN St = 'PENDING'  THEN 1 ELSE 0 END) AS PendingCount,
        SUM(CASE WHEN St = 'APPROVED' THEN 1 ELSE 0 END) AS ApprovedCount,
        SUM(CASE WHEN St = 'HOLD'     THEN 1 ELSE 0 END) AS HoldCount,
        SUM(CASE WHEN St = 'REJECTED' THEN 1 ELSE 0 END) AS RejectedCount
    FROM ALL_REQUEST
    GROUP BY CardName;
END
GO
