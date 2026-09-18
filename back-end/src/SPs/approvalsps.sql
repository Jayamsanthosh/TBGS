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
END


-- ==========================================================
-- 1. Request Summary SP
-- ==========================================================
IF OBJECT_ID('VRequest.GET_REQUEST_SUMMARY', 'P') IS NOT NULL 
    DROP PROCEDURE [VRequest].[GET_REQUEST_SUMMARY];
GO
CREATE PROCEDURE [VRequest].[GET_REQUEST_SUMMARY]
AS
BEGIN
    SET NOCOUNT ON;

    -- Attendance Request Counts
    SELECT 
        'Attendance Request' AS CardName,
        SUM(CASE WHEN ISNULL(SECTION_HEAD_RESPONSE_STATUS, 'Pending') = 'Pending' THEN 1 ELSE 0 END) AS PendingCount,
        SUM(CASE WHEN SECTION_HEAD_RESPONSE_STATUS IN ('Approval', 'Approved') THEN 1 ELSE 0 END) AS ApprovedCount,
        SUM(CASE WHEN SECTION_HEAD_RESPONSE_STATUS = 'Hold' THEN 1 ELSE 0 END) AS HoldCount,
        SUM(CASE WHEN SECTION_HEAD_RESPONSE_STATUS IN ('Reject', 'Rejected') THEN 1 ELSE 0 END) AS RejectedCount
    FROM [VRequest].[TBL_ATTENDANCE_REQUEST]
    WHERE STATUS_MASTER = 'AC'

    UNION ALL

    -- Cash Advance Request Counts
    SELECT 
        'Cash Advance Request' AS CardName,
        SUM(CASE WHEN ISNULL(SECTION_HEAD_RESPONSE_STATUS, 'Pending') = 'Pending' THEN 1 ELSE 0 END) AS PendingCount,
        SUM(CASE WHEN SECTION_HEAD_RESPONSE_STATUS IN ('Approval', 'Approved') THEN 1 ELSE 0 END) AS ApprovedCount,
        SUM(CASE WHEN SECTION_HEAD_RESPONSE_STATUS = 'Hold' THEN 1 ELSE 0 END) AS HoldCount,
        SUM(CASE WHEN SECTION_HEAD_RESPONSE_STATUS IN ('Reject', 'Rejected') THEN 1 ELSE 0 END) AS RejectedCount
    FROM [VRequest].[TBL_CASH_ADVANCE_REQUEST]
    WHERE STATUS_MASTER = 'AC'
END
GO

-- ==========================================================
-- 2. Request List SP
-- ==========================================================
IF OBJECT_ID('VRequest.GET_REQUEST_LIST_BY_TYPE', 'P') IS NOT NULL 
    DROP PROCEDURE [VRequest].[GET_REQUEST_LIST_BY_TYPE];
GO
CREATE PROCEDURE [VRequest].[GET_REQUEST_LIST_BY_TYPE]
(
    @RequestType VARCHAR(100)
)
AS
BEGIN
    SET NOCOUNT ON;

    IF @RequestType = 'Attendance Request'
    BEGIN
        SELECT * FROM [VRequest].[TBL_ATTENDANCE_REQUEST] WHERE STATUS_MASTER = 'AC'
    END
    ELSE IF @RequestType = 'Cash Advance Request'
    BEGIN
        SELECT * FROM [VRequest].[TBL_CASH_ADVANCE_REQUEST] WHERE STATUS_MASTER = 'AC'
    END
    ELSE
    BEGIN
        -- Empty fallback
        SELECT NULL AS SNO WHERE 1 = 0
    END
END
GO

-- ==========================================================
-- 3. Request Status Update SP
-- ==========================================================
IF OBJECT_ID('VRequest.UPDATE_REQUEST_STATUS', 'P') IS NOT NULL 
    DROP PROCEDURE [VRequest].[UPDATE_REQUEST_STATUS];
GO
CREATE PROCEDURE [VRequest].[UPDATE_REQUEST_STATUS]
(
    @RequestID INT,
    @RequestType VARCHAR(100),
    @Status VARCHAR(50),
    @UpdatedBy VARCHAR(50),
    @HoldReason VARCHAR(1000) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate Hold Reason
    IF @Status = 'Hold' AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) = ''
    BEGIN
        SELECT 'error' AS STATUS, 'Hold Reason is mandatory when status is Hold' AS MESSAGE, '' AS DATA;
        RETURN;
    END

    -- Validate Status
    IF @Status NOT IN ('Approval', 'Approved', 'Hold', 'Reject', 'Rejected')
    BEGIN
        SELECT 'error' AS STATUS, 'Invalid Status. Allowed values: Approval, Hold, Reject' AS MESSAGE, '' AS DATA;
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Local variables to check current approval level status
        DECLARE @SecHeadStatus VARCHAR(50), 
                @Resp1Status VARCHAR(50), 
                @Resp2Status VARCHAR(50), 
                @FinalStatus VARCHAR(50);

        IF @RequestType = 'Attendance Request'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM [VRequest].[TBL_ATTENDANCE_REQUEST] WHERE SNO = @RequestID)
            BEGIN
                SELECT 'error' AS STATUS, 'Attendance Request not found' AS MESSAGE, '' AS DATA;
                ROLLBACK TRANSACTION;
                RETURN;
            END

            -- Fetch current statuses
            SELECT 
                @SecHeadStatus = ISNULL(SECTION_HEAD_RESPONSE_STATUS, 'Pending'),
                @Resp1Status = ISNULL(RESPONSE_1_STATUS, 'Pending'),
                @Resp2Status = ISNULL(RESPONSE_2_STATUS, 'Pending'),
                @FinalStatus = ISNULL(FINAL_RESPONSE_STATUS, 'Pending')
            FROM [VRequest].[TBL_ATTENDANCE_REQUEST]
            WHERE SNO = @RequestID;

            -- 1. Section Head Level
            IF @SecHeadStatus = 'Pending'
            BEGIN
                UPDATE [VRequest].[TBL_ATTENDANCE_REQUEST]
                SET 
                    SECTION_HEAD_RESPONSE_STATUS = @Status,
                    SECTION_HEAD_RESPONSE_REMARKS = CASE WHEN @Status = 'Hold' THEN @HoldReason ELSE SECTION_HEAD_RESPONSE_REMARKS END,
                    SECTION_HEAD_RESPONSE_DATE = GETDATE(),
                    SECTION_HEAD_RESPONSE_PERSON_EMP_ID = @UpdatedBy,
                    MODIFIED_BY = @UpdatedBy,
                    MODIFIED_DATE = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- 2. Response 1 Level
            ELSE IF @SecHeadStatus IN ('Approval', 'Approved') AND @Resp1Status = 'Pending'
            BEGIN
                UPDATE [VRequest].[TBL_ATTENDANCE_REQUEST]
                SET 
                    RESPONSE_1_STATUS = @Status,
                    -- Assuming a remarks column exists, fallback to standard remarks if it doesn't
                    REMARKS = CASE WHEN @Status = 'Hold' THEN ISNULL(REMARKS, '') + ' [Level 1 Hold: ' + @HoldReason + ']' ELSE REMARKS END,
                    RESPONSE_1_DATE = GETDATE(),
                    RESPONSE_1_EMP_ID = @UpdatedBy,
                    MODIFIED_BY = @UpdatedBy,
                    MODIFIED_DATE = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- 3. Response 2 Level
            ELSE IF @Resp1Status IN ('Approval', 'Approved') AND @Resp2Status = 'Pending'
            BEGIN
                UPDATE [VRequest].[TBL_ATTENDANCE_REQUEST]
                SET 
                    RESPONSE_2_STATUS = @Status,
                    REMARKS = CASE WHEN @Status = 'Hold' THEN ISNULL(REMARKS, '') + ' [Level 2 Hold: ' + @HoldReason + ']' ELSE REMARKS END,
                    RESPONSE_2_DATE = GETDATE(),
                    RESPONSE_2_EMP_ID = @UpdatedBy,
                    MODIFIED_BY = @UpdatedBy,
                    MODIFIED_DATE = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- 4. Final Response Level
            ELSE IF @Resp2Status IN ('Approval', 'Approved') AND @FinalStatus = 'Pending'
            BEGIN
                UPDATE [VRequest].[TBL_ATTENDANCE_REQUEST]
                SET 
                    FINAL_RESPONSE_STATUS = @Status,
                    REMARKS = CASE WHEN @Status = 'Hold' THEN ISNULL(REMARKS, '') + ' [Final Hold: ' + @HoldReason + ']' ELSE REMARKS END,
                    FINAL_RESPONSE_DATE = GETDATE(),
                    FINAL_RESPONSE_PERSON = @UpdatedBy,
                    MODIFIED_BY = @UpdatedBy,
                    MODIFIED_DATE = GETDATE()
                WHERE SNO = @RequestID;
            END
            ELSE
            BEGIN
                SELECT 'error' AS STATUS, 'Request is already fully processed or was rejected at a previous level.' AS MESSAGE, '' AS DATA;
                ROLLBACK TRANSACTION;
                RETURN;
            END
        END
        ELSE IF @RequestType = 'Cash Advance Request'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM [VRequest].[TBL_CASH_ADVANCE_REQUEST] WHERE SNO = @RequestID)
            BEGIN
                SELECT 'error' AS STATUS, 'Cash Advance Request not found' AS MESSAGE, '' AS DATA;
                ROLLBACK TRANSACTION;
                RETURN;
            END

            -- Fetch current statuses
            SELECT 
                @SecHeadStatus = ISNULL(SECTION_HEAD_RESPONSE_STATUS, 'Pending'),
                @Resp1Status = ISNULL(RESPONSE_1_STATUS, 'Pending'),
                @Resp2Status = ISNULL(RESPONSE_2_STATUS, 'Pending'),
                @FinalStatus = ISNULL(FINAL_RESPONSE_STATUS, 'Pending')
            FROM [VRequest].[TBL_CASH_ADVANCE_REQUEST]
            WHERE SNO = @RequestID;

            -- 1. Section Head Level
            IF @SecHeadStatus = 'Pending'
            BEGIN
                UPDATE [VRequest].[TBL_CASH_ADVANCE_REQUEST]
                SET 
                    SECTION_HEAD_RESPONSE_STATUS = @Status,
                    SECTION_HEAD_RESPONSE_REMARKS = CASE WHEN @Status = 'Hold' THEN @HoldReason ELSE SECTION_HEAD_RESPONSE_REMARKS END,
                    SECTION_HEAD_RESPONSE_DATE = GETDATE(),
                    SECTION_HEAD_RESPONSE_PERSON_EMP_ID = @UpdatedBy,
                    MODIFIED_BY = @UpdatedBy,
                    MODIFIED_DATE = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- 2. Response 1 Level
            ELSE IF @SecHeadStatus IN ('Approval', 'Approved') AND @Resp1Status = 'Pending'
            BEGIN
                UPDATE [VRequest].[TBL_CASH_ADVANCE_REQUEST]
                SET 
                    RESPONSE_1_STATUS = @Status,
                    REMARKS = CASE WHEN @Status = 'Hold' THEN ISNULL(REMARKS, '') + ' [Level 1 Hold: ' + @HoldReason + ']' ELSE REMARKS END,
                    RESPONSE_1_DATE = GETDATE(),
                    RESPONSE_1_EMP_ID = @UpdatedBy,
                    MODIFIED_BY = @UpdatedBy,
                    MODIFIED_DATE = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- 3. Response 2 Level
            ELSE IF @Resp1Status IN ('Approval', 'Approved') AND @Resp2Status = 'Pending'
            BEGIN
                UPDATE [VRequest].[TBL_CASH_ADVANCE_REQUEST]
                SET 
                    RESPONSE_2_STATUS = @Status,
                    REMARKS = CASE WHEN @Status = 'Hold' THEN ISNULL(REMARKS, '') + ' [Level 2 Hold: ' + @HoldReason + ']' ELSE REMARKS END,
                    RESPONSE_2_DATE = GETDATE(),
                    RESPONSE_2_EMP_ID = @UpdatedBy,
                    MODIFIED_BY = @UpdatedBy,
                    MODIFIED_DATE = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- 4. Final Response Level
            ELSE IF @Resp2Status IN ('Approval', 'Approved') AND @FinalStatus = 'Pending'
            BEGIN
                UPDATE [VRequest].[TBL_CASH_ADVANCE_REQUEST]
                SET 
                    FINAL_RESPONSE_STATUS = @Status,
                    REMARKS = CASE WHEN @Status = 'Hold' THEN ISNULL(REMARKS, '') + ' [Final Hold: ' + @HoldReason + ']' ELSE REMARKS END,
                    FINAL_RESPONSE_DATE = GETDATE(),
                    FINAL_RESPONSE_PERSON = @UpdatedBy,
                    MODIFIED_BY = @UpdatedBy,
                    MODIFIED_DATE = GETDATE()
                WHERE SNO = @RequestID;
            END
            ELSE
            BEGIN
                SELECT 'error' AS STATUS, 'Request is already fully processed or was rejected at a previous level.' AS MESSAGE, '' AS DATA;
                ROLLBACK TRANSACTION;
                RETURN;
            END
        END
        ELSE
        BEGIN
            SELECT 'error' AS STATUS, 'Invalid Request Type' AS MESSAGE, '' AS DATA;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        COMMIT TRANSACTION;
        SELECT '' AS STATUS, 'Status Updated Successfully' AS MESSAGE, CONVERT(VARCHAR, @RequestID) AS DATA;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        SELECT 'error' AS STATUS, ERROR_MESSAGE() AS MESSAGE, '' AS DATA;
    END CATCH
END
GO