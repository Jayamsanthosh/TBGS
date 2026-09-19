-- =============================================================
-- [VRequest].[GET_REQUEST_SUMMARY]
-- Returns one row per request type with Pending/Approved/Hold/Rejected counts.
-- Uses FINAL_RESPONSE_STATUS (with cascading fallback) so the count reflects
-- the true current overall status, consistent with GET_REQUEST_LIST_BY_TYPE.
-- =============================================================
CREATE OR ALTER PROCEDURE [VRequest].[GET_REQUEST_SUMMARY]
AS
BEGIN
    SET NOCOUNT ON;

    -- Helper macro: maps any status value to a normalised UPPER string.
    -- Empty string / NULL both become 'PENDING'.

    -- Attendance Request Counts
    SELECT
        'Attendance Request' AS CardName,
        SUM(CASE
                WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''), 'PENDING'))))) = 'PENDING'
                THEN 1 ELSE 0
            END) AS PendingCount,
        SUM(CASE
                WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''), 'PENDING'))))) IN ('APPROVED','APPROVAL')
                THEN 1 ELSE 0
            END) AS ApprovedCount,
        SUM(CASE
                WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''), 'PENDING'))))) = 'HOLD'
                THEN 1 ELSE 0
            END) AS HoldCount,
        SUM(CASE
                WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''), 'PENDING'))))) IN ('REJECTED','REJECT')
                THEN 1 ELSE 0
            END) AS RejectedCount
    FROM [VRequest].[TBL_ATTENDANCE_REQUEST]
    WHERE STATUS_MASTER = 'AC'

    UNION ALL

    -- Cash Advance Request Counts
    SELECT
        'Cash Advance Request' AS CardName,
        SUM(CASE
                WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''), 'PENDING'))))) = 'PENDING'
                THEN 1 ELSE 0
            END) AS PendingCount,
        SUM(CASE
                WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''), 'PENDING'))))) IN ('APPROVED','APPROVAL')
                THEN 1 ELSE 0
            END) AS ApprovedCount,
        SUM(CASE
                WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''), 'PENDING'))))) = 'HOLD'
                THEN 1 ELSE 0
            END) AS HoldCount,
        SUM(CASE
                WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''), 'PENDING'))))) IN ('REJECTED','REJECT')
                THEN 1 ELSE 0
            END) AS RejectedCount
    FROM [VRequest].[TBL_CASH_ADVANCE_REQUEST]
    WHERE STATUS_MASTER = 'AC'

    UNION ALL

    -- Arrears Request Counts
    SELECT
        'Arrears Request' AS CardName,
        SUM(CASE
                WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''), 'PENDING'))))) = 'PENDING'
                THEN 1 ELSE 0
            END) AS PendingCount,
        SUM(CASE
                WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''), 'PENDING'))))) IN ('APPROVED','APPROVAL')
                THEN 1 ELSE 0
            END) AS ApprovedCount,
        SUM(CASE
                WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''), 'PENDING'))))) = 'HOLD'
                THEN 1 ELSE 0
            END) AS HoldCount,
        SUM(CASE
                WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''), 'PENDING'))))) IN ('REJECTED','REJECT')
                THEN 1 ELSE 0
            END) AS RejectedCount
    FROM [VREQUEST].[TBL_ARREARS_REQUEST]
    WHERE STATUS_MASTER = 'AC'

    UNION ALL

    -- Overtime Request Counts
    SELECT
        'Overtime Request' AS CardName,
        SUM(CASE
                WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''), 'PENDING'))))) = 'PENDING'
                THEN 1 ELSE 0
            END) AS PendingCount,
        SUM(CASE
                WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''), 'PENDING'))))) IN ('APPROVED','APPROVAL')
                THEN 1 ELSE 0
            END) AS ApprovedCount,
        SUM(CASE
                WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''), 'PENDING'))))) = 'HOLD'
                THEN 1 ELSE 0
            END) AS HoldCount,
        SUM(CASE
                WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                     ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''), 'PENDING'))))) IN ('REJECTED','REJECT')
                THEN 1 ELSE 0
            END) AS RejectedCount
    FROM [VREQUEST].[TBL_OVERTIME_REQUEST]
    WHERE STATUS_MASTER = 'AC'
END
GO
