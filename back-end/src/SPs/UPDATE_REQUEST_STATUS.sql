-- =============================================================
-- [VRequest].[UPDATE_REQUEST_STATUS]
-- Fixes applied:
--   1. NULLIF(LTRIM(RTRIM(col)),'') treats empty strings as NULL.
--   2. All stored status values are normalised to UPPER() before
--      comparison so 'Approved', 'APPROVED', 'Approval' all match.
--   3. Hold is treated as a re-actionable level (not a permanent
--      blocker), so the same level can be updated again after Hold.
--   4. Incoming @Status is normalised to Proper-case before writing
--      so future reads are consistent.
-- Sequential flow: Section Head -> Response 1 -> Response 2 -> Final
-- =============================================================
CREATE OR ALTER PROCEDURE [VRequest].[UPDATE_REQUEST_STATUS]
(
    @RequestID  INT,
    @RequestType VARCHAR(100),
    @Status     VARCHAR(50),
    @UpdatedBy  VARCHAR(50),
    @HoldReason VARCHAR(1000) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Normalise incoming status to Proper-case for consistent storage
    SET @Status = LTRIM(RTRIM(@Status));
    SET @Status = CASE UPPER(@Status)
                    WHEN 'APPROVED'  THEN 'Approved'
                    WHEN 'APPROVAL'  THEN 'Approved'
                    WHEN 'REJECTED'  THEN 'Rejected'
                    WHEN 'REJECT'    THEN 'Rejected'
                    WHEN 'HOLD'      THEN 'Hold'
                    ELSE @Status
                  END;

    -- Person columns are INT (EMP_ID based); keep NULL for non-numeric logins.
    DECLARE @PersonEmpId INT = TRY_CONVERT(INT, @UpdatedBy);

    -- Validate Hold Reason
    IF @Status = 'Hold' AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) = ''
    BEGIN
        SELECT 'error' AS STATUS, 'Hold Reason is mandatory when status is Hold' AS MESSAGE, '' AS DATA;
        RETURN;
    END

    -- Validate Status
    IF @Status NOT IN ('Approved', 'Rejected', 'Hold')
    BEGIN
        SELECT 'error' AS STATUS,
               'Invalid Status. Allowed values: Approved, Rejected, Hold' AS MESSAGE,
               '' AS DATA;
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Normalised (UPPER) status variables for comparison
        DECLARE @SecHeadStatusN  VARCHAR(50),
                @Resp1StatusN    VARCHAR(50),
                @Resp2StatusN    VARCHAR(50),
                @FinalStatusN    VARCHAR(50);

        -- ─────────────────────────────────────────────
        -- ATTENDANCE REQUEST
        -- ─────────────────────────────────────────────
        IF @RequestType = 'Attendance Request'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM [VRequest].[TBL_ATTENDANCE_REQUEST] WHERE SNO = @RequestID)
            BEGIN
                SELECT 'error' AS STATUS, 'Attendance Request not found' AS MESSAGE, '' AS DATA;
                ROLLBACK TRANSACTION;
                RETURN;
            END

            -- Read statuses, treat NULL and '' both as 'PENDING', normalise to UPPER for comparison
            SELECT
                @SecHeadStatusN = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)), ''), 'PENDING')),
                @Resp1StatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),             ''), 'PENDING')),
                @Resp2StatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),             ''), 'PENDING')),
                @FinalStatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),         ''), 'PENDING'))
            FROM [VRequest].[TBL_ATTENDANCE_REQUEST]
            WHERE SNO = @RequestID;

            -- Level 1: Section Head is Pending or Hold (re-actionable)
            IF @SecHeadStatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VRequest].[TBL_ATTENDANCE_REQUEST]
                SET
                    SECTION_HEAD_RESPONSE_STATUS        = @Status,
                    SECTION_HEAD_RESPONSE_REMARKS       = CASE WHEN @Status = 'Hold' THEN @HoldReason ELSE SECTION_HEAD_RESPONSE_REMARKS END,
                    SECTION_HEAD_RESPONSE_DATE          = GETDATE(),
                    SECTION_HEAD_RESPONSE_PERSON_EMP_ID = @PersonEmpId,
                    MODIFIED_BY                         = @UpdatedBy,
                    MODIFIED_DATE                       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 2: Section Head Approved, Response 1 is Pending or Hold
            ELSE IF @SecHeadStatusN = 'APPROVED' AND @Resp1StatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VRequest].[TBL_ATTENDANCE_REQUEST]
                SET
                    RESPONSE_1_STATUS   = @Status,
                    RESPONSE_1_REMARKS  = CASE WHEN @Status = 'Hold' THEN @HoldReason ELSE RESPONSE_1_REMARKS END,
                    RESPONSE_1_DATE     = GETDATE(),
                    RESPONSE_1_EMP_ID   = @PersonEmpId,
                    MODIFIED_BY         = @UpdatedBy,
                    MODIFIED_DATE       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 3: Response 1 Approved, Response 2 is Pending or Hold
            ELSE IF @Resp1StatusN = 'APPROVED' AND @Resp2StatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VRequest].[TBL_ATTENDANCE_REQUEST]
                SET
                    RESPONSE_2_STATUS   = @Status,
                    RESPONSE_2_REMARKS  = CASE WHEN @Status = 'Hold' THEN @HoldReason ELSE RESPONSE_2_REMARKS END,
                    RESPONSE_2_DATE     = GETDATE(),
                    RESPONSE_2_EMP_ID   = @PersonEmpId,
                    MODIFIED_BY         = @UpdatedBy,
                    MODIFIED_DATE       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 4: Response 2 Approved, Final is Pending or Hold
            ELSE IF @Resp2StatusN = 'APPROVED' AND @FinalStatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VRequest].[TBL_ATTENDANCE_REQUEST]
                SET
                    FINAL_RESPONSE_STATUS   = @Status,
                    FINAL_RESPONSE_REMARKS  = CASE WHEN @Status = 'Hold' THEN @HoldReason ELSE FINAL_RESPONSE_REMARKS END,
                    FINAL_RESPONSE_DATE     = GETDATE(),
                    FINAL_RESPONSE_PERSON   = @UpdatedBy,
                    MODIFIED_BY             = @UpdatedBy,
                    MODIFIED_DATE           = GETDATE()
                WHERE SNO = @RequestID;
            END
            ELSE
            BEGIN
                SELECT 'error' AS STATUS,
                       'No pending approval level found. The request may already be fully approved/rejected at every level.' AS MESSAGE,
                       CONCAT('SecHead=', @SecHeadStatusN, ' Resp1=', @Resp1StatusN, ' Resp2=', @Resp2StatusN, ' Final=', @FinalStatusN) AS DATA;
                ROLLBACK TRANSACTION;
                RETURN;
            END
        END

        -- ─────────────────────────────────────────────
        -- CASH ADVANCE REQUEST
        -- ─────────────────────────────────────────────
        ELSE IF @RequestType = 'Cash Advance Request'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM [VRequest].[TBL_CASH_ADVANCE_REQUEST] WHERE SNO = @RequestID)
            BEGIN
                SELECT 'error' AS STATUS, 'Cash Advance Request not found' AS MESSAGE, '' AS DATA;
                ROLLBACK TRANSACTION;
                RETURN;
            END

            SELECT
                @SecHeadStatusN = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)), ''), 'PENDING')),
                @Resp1StatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),             ''), 'PENDING')),
                @Resp2StatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),             ''), 'PENDING')),
                @FinalStatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),         ''), 'PENDING'))
            FROM [VRequest].[TBL_CASH_ADVANCE_REQUEST]
            WHERE SNO = @RequestID;

            -- Level 1: Section Head
            IF @SecHeadStatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VRequest].[TBL_CASH_ADVANCE_REQUEST]
                SET
                    SECTION_HEAD_RESPONSE_STATUS        = @Status,
                    SECTION_HEAD_RESPONSE_REMARKS       = CASE WHEN @Status = 'Hold' THEN @HoldReason ELSE SECTION_HEAD_RESPONSE_REMARKS END,
                    SECTION_HEAD_RESPONSE_DATE          = GETDATE(),
                    SECTION_HEAD_RESPONSE_PERSON_EMP_ID = @PersonEmpId,
                    MODIFIED_BY                         = @UpdatedBy,
                    MODIFIED_DATE                       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 2: Response 1
            ELSE IF @SecHeadStatusN = 'APPROVED' AND @Resp1StatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VRequest].[TBL_CASH_ADVANCE_REQUEST]
                SET
                    RESPONSE_1_STATUS   = @Status,
                    RESPONSE_1_REMARKS  = CASE WHEN @Status = 'Hold' THEN @HoldReason ELSE RESPONSE_1_REMARKS END,
                    RESPONSE_1_DATE     = GETDATE(),
                    RESPONSE_1_EMP_ID   = @PersonEmpId,
                    MODIFIED_BY         = @UpdatedBy,
                    MODIFIED_DATE       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 3: Response 2
            ELSE IF @Resp1StatusN = 'APPROVED' AND @Resp2StatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VRequest].[TBL_CASH_ADVANCE_REQUEST]
                SET
                    RESPONSE_2_STATUS   = @Status,
                    RESPONSE_2_REMARKS  = CASE WHEN @Status = 'Hold' THEN @HoldReason ELSE RESPONSE_2_REMARKS END,
                    RESPONSE_2_DATE     = GETDATE(),
                    RESPONSE_2_EMP_ID   = @PersonEmpId,
                    MODIFIED_BY         = @UpdatedBy,
                    MODIFIED_DATE       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 4: Final Response
            ELSE IF @Resp2StatusN = 'APPROVED' AND @FinalStatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VRequest].[TBL_CASH_ADVANCE_REQUEST]
                SET
                    FINAL_RESPONSE_STATUS   = @Status,
                    FINAL_RESPONSE_REMARKS  = CASE WHEN @Status = 'Hold' THEN @HoldReason ELSE FINAL_RESPONSE_REMARKS END,
                    FINAL_RESPONSE_DATE     = GETDATE(),
                    FINAL_RESPONSE_PERSON   = @UpdatedBy,
                    MODIFIED_BY             = @UpdatedBy,
                    MODIFIED_DATE           = GETDATE()
                WHERE SNO = @RequestID;
            END
            ELSE
            BEGIN
                SELECT 'error' AS STATUS,
                       'No pending approval level found. The request may already be fully approved/rejected at every level.' AS MESSAGE,
                       CONCAT('SecHead=', @SecHeadStatusN, ' Resp1=', @Resp1StatusN, ' Resp2=', @Resp2StatusN, ' Final=', @FinalStatusN) AS DATA;
                ROLLBACK TRANSACTION;
                RETURN;
            END
        END
        -- ─────────────────────────────────────────────
        -- ARREARS REQUEST
        -- ─────────────────────────────────────────────
        ELSE IF @RequestType = 'Arrears Request'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM [VREQUEST].[TBL_ARREARS_REQUEST] WHERE SNO = @RequestID)
            BEGIN
                SELECT 'error' AS STATUS, 'Arrears Request not found' AS MESSAGE, '' AS DATA;
                ROLLBACK TRANSACTION;
                RETURN;
            END

            SELECT
                @SecHeadStatusN = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)), ''), 'PENDING')),
                @Resp1StatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),             ''), 'PENDING')),
                @Resp2StatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),             ''), 'PENDING')),
                @FinalStatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),         ''), 'PENDING'))
            FROM [VREQUEST].[TBL_ARREARS_REQUEST]
            WHERE SNO = @RequestID;

            -- Level 1: Section Head
            IF @SecHeadStatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_ARREARS_REQUEST]
                SET
                    SECTION_HEAD_RESPONSE_STATUS        = @Status,
                    SECTION_HEAD_RESPONSE_REMARKS       = CASE WHEN @Status = 'Hold' THEN @HoldReason ELSE SECTION_HEAD_RESPONSE_REMARKS END,
                    SECTION_HEAD_RESPONSE_DATE          = GETDATE(),
                    SECTION_HEAD_RESPONSE_PERSON_EMP_ID = @PersonEmpId,
                    MODIFIED_BY                         = @UpdatedBy,
                    MODIFIED_DATE                       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 2: Response 1
            ELSE IF @SecHeadStatusN = 'APPROVED' AND @Resp1StatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_ARREARS_REQUEST]
                SET
                    RESPONSE_1_STATUS   = @Status,
                    RESPONSE_1_REMARKS  = CASE WHEN @Status = 'Hold' THEN @HoldReason ELSE RESPONSE_1_REMARKS END,
                    RESPONSE_1_DATE     = GETDATE(),
                    RESPONSE_1_EMP_ID   = @PersonEmpId,
                    MODIFIED_BY         = @UpdatedBy,
                    MODIFIED_DATE       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 3: Response 2
            ELSE IF @Resp1StatusN = 'APPROVED' AND @Resp2StatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_ARREARS_REQUEST]
                SET
                    RESPONSE_2_STATUS   = @Status,
                    RESPONSE_2_REMARKS  = CASE WHEN @Status = 'Hold' THEN @HoldReason ELSE RESPONSE_2_REMARKS END,
                    RESPONSE_2_DATE     = GETDATE(),
                    RESPONSE_2_EMP_ID   = @PersonEmpId,
                    MODIFIED_BY         = @UpdatedBy,
                    MODIFIED_DATE       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 4: Final Response (NOTE: column is FINAL_RESPONSE_EMP_ID here)
            ELSE IF @Resp2StatusN = 'APPROVED' AND @FinalStatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_ARREARS_REQUEST]
                SET
                    FINAL_RESPONSE_STATUS   = @Status,
                    FINAL_RESPONSE_REMARKS  = CASE WHEN @Status = 'Hold' THEN @HoldReason ELSE FINAL_RESPONSE_REMARKS END,
                    FINAL_RESPONSE_DATE     = GETDATE(),
                    FINAL_RESPONSE_EMP_ID   = @PersonEmpId,
                    MODIFIED_BY             = @UpdatedBy,
                    MODIFIED_DATE           = GETDATE()
                WHERE SNO = @RequestID;
            END
            ELSE
            BEGIN
                SELECT 'error' AS STATUS,
                       'No pending approval level found. The request may already be fully approved/rejected at every level.' AS MESSAGE,
                       CONCAT('SecHead=', @SecHeadStatusN, ' Resp1=', @Resp1StatusN, ' Resp2=', @Resp2StatusN, ' Final=', @FinalStatusN) AS DATA;
                ROLLBACK TRANSACTION;
                RETURN;
            END
        END
        -- ─────────────────────────────────────────────
        -- OVERTIME REQUEST
        -- ─────────────────────────────────────────────
        ELSE IF @RequestType = 'Overtime Request'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM [VREQUEST].[TBL_OVERTIME_REQUEST] WHERE SNO = @RequestID)
            BEGIN
                SELECT 'error' AS STATUS, 'Overtime Request not found' AS MESSAGE, '' AS DATA;
                ROLLBACK TRANSACTION;
                RETURN;
            END

            SELECT
                @SecHeadStatusN = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)), ''), 'PENDING')),
                @Resp1StatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),             ''), 'PENDING')),
                @Resp2StatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),             ''), 'PENDING')),
                @FinalStatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),         ''), 'PENDING'))
            FROM [VREQUEST].[TBL_OVERTIME_REQUEST]
            WHERE SNO = @RequestID;

            -- Level 1: Section Head
            IF @SecHeadStatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_OVERTIME_REQUEST]
                SET
                    SECTION_HEAD_RESPONSE_STATUS        = @Status,
                    SECTION_HEAD_RESPONSE_REMARKS       = CASE WHEN @Status = 'Hold' THEN @HoldReason ELSE SECTION_HEAD_RESPONSE_REMARKS END,
                    SECTION_HEAD_RESPONSE_DATE          = GETDATE(),
                    SECTION_HEAD_RESPONSE_PERSON_EMP_ID = @PersonEmpId,
                    MODIFIED_BY                         = @UpdatedBy,
                    MODIFIED_DATE                       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 2: Response 1
            ELSE IF @SecHeadStatusN = 'APPROVED' AND @Resp1StatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_OVERTIME_REQUEST]
                SET
                    RESPONSE_1_STATUS   = @Status,
                    RESPONSE_1_REMARKS  = CASE WHEN @Status = 'Hold' THEN @HoldReason ELSE RESPONSE_1_REMARKS END,
                    RESPONSE_1_DATE     = GETDATE(),
                    RESPONSE_1_EMP_ID   = @PersonEmpId,
                    MODIFIED_BY         = @UpdatedBy,
                    MODIFIED_DATE       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 3: Response 2
            ELSE IF @Resp1StatusN = 'APPROVED' AND @Resp2StatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_OVERTIME_REQUEST]
                SET
                    RESPONSE_2_STATUS   = @Status,
                    RESPONSE_2_REMARKS  = CASE WHEN @Status = 'Hold' THEN @HoldReason ELSE RESPONSE_2_REMARKS END,
                    RESPONSE_2_DATE     = GETDATE(),
                    RESPONSE_2_EMP_ID   = @PersonEmpId,
                    MODIFIED_BY         = @UpdatedBy,
                    MODIFIED_DATE       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 4: Final Response (NOTE: column is FINAL_RESPONSE_EMP_ID here)
            ELSE IF @Resp2StatusN = 'APPROVED' AND @FinalStatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_OVERTIME_REQUEST]
                SET
                    FINAL_RESPONSE_STATUS   = @Status,
                    FINAL_RESPONSE_REMARKS  = CASE WHEN @Status = 'Hold' THEN @HoldReason ELSE FINAL_RESPONSE_REMARKS END,
                    FINAL_RESPONSE_DATE     = GETDATE(),
                    FINAL_RESPONSE_EMP_ID   = @PersonEmpId,
                    MODIFIED_BY             = @UpdatedBy,
                    MODIFIED_DATE           = GETDATE()
                WHERE SNO = @RequestID;
            END
            ELSE
            BEGIN
                SELECT 'error' AS STATUS,
                       'No pending approval level found. The request may already be fully approved/rejected at every level.' AS MESSAGE,
                       CONCAT('SecHead=', @SecHeadStatusN, ' Resp1=', @Resp1StatusN, ' Resp2=', @Resp2StatusN, ' Final=', @FinalStatusN) AS DATA;
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
