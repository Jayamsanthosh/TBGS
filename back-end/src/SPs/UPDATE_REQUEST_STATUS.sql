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
                    SECTION_HEAD_RESPONSE_REMARKS       = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE SECTION_HEAD_RESPONSE_REMARKS END,
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
                    RESPONSE_1_REMARKS  = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE RESPONSE_1_REMARKS END,
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
                    RESPONSE_2_REMARKS  = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE RESPONSE_2_REMARKS END,
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
                    FINAL_RESPONSE_REMARKS  = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE FINAL_RESPONSE_REMARKS END,
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

            -- AUTO-APPROVE cascade (attendance only): one 'Approved' click fills
            -- any still-PENDING deeper level (Response 1 / Response 2 / Final).
            -- Hold & Reject remain single-level (they halt the chain).
            IF @Status = 'Approved'
            BEGIN
                UPDATE [VRequest].[TBL_ATTENDANCE_REQUEST]
                SET
                    SECTION_HEAD_RESPONSE_STATUS = CASE
                        WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)), ''), 'PENDING')) = 'PENDING'
                            THEN 'Approved' ELSE SECTION_HEAD_RESPONSE_STATUS END,
                    SECTION_HEAD_RESPONSE_DATE = CASE
                        WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)), ''), 'PENDING')) = 'PENDING'
                            THEN GETDATE() ELSE SECTION_HEAD_RESPONSE_DATE END,
                    RESPONSE_1_STATUS = CASE
                        WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)), ''), 'PENDING')) = 'PENDING'
                            THEN 'Approved' ELSE RESPONSE_1_STATUS END,
                    RESPONSE_1_DATE = CASE
                        WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)), ''), 'PENDING')) = 'PENDING'
                            THEN GETDATE() ELSE RESPONSE_1_DATE END,
                    RESPONSE_1_EMP_ID = CASE
                        WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)), ''), 'PENDING')) = 'PENDING'
                            THEN @PersonEmpId ELSE RESPONSE_1_EMP_ID END,
                    RESPONSE_2_STATUS = CASE
                        WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)), ''), 'PENDING')) = 'PENDING'
                            THEN 'Approved' ELSE RESPONSE_2_STATUS END,
                    RESPONSE_2_DATE = CASE
                        WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)), ''), 'PENDING')) = 'PENDING'
                            THEN GETDATE() ELSE RESPONSE_2_DATE END,
                    RESPONSE_2_EMP_ID = CASE
                        WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)), ''), 'PENDING')) = 'PENDING'
                            THEN @PersonEmpId ELSE RESPONSE_2_EMP_ID END,
                    FINAL_RESPONSE_STATUS = CASE
                        WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)), ''), 'PENDING')) = 'PENDING'
                            THEN 'Approved' ELSE FINAL_RESPONSE_STATUS END,
                    FINAL_RESPONSE_REMARKS = CASE
                        WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)), ''), 'PENDING')) = 'PENDING'
                            THEN '' ELSE FINAL_RESPONSE_REMARKS END,
                    FINAL_RESPONSE_DATE = CASE
                        WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)), ''), 'PENDING')) = 'PENDING'
                            THEN GETDATE() ELSE FINAL_RESPONSE_DATE END,
                    FINAL_RESPONSE_PERSON = CASE
                        WHEN UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)), ''), 'PENDING')) = 'PENDING'
                            THEN @UpdatedBy ELSE FINAL_RESPONSE_PERSON END,
                    MODIFIED_BY = @UpdatedBy,
                    MODIFIED_DATE = GETDATE()
                WHERE SNO = @RequestID;
            END

            -- Mirror the full approval chain back to the payroll attendance
            -- detail (same ATT_REQUEST_REF_NO) so the attendance-details grid
            -- shows the latest Section Head / Final status correctly.
            UPDATE D
            SET
                D.SECTION_HEAD_RESPONSE_PERSON_EMP_ID = R.SECTION_HEAD_RESPONSE_PERSON_EMP_ID,
                D.SECTION_HEAD_RESPONSE_DATE          = R.SECTION_HEAD_RESPONSE_DATE,
                D.SECTION_HEAD_RESPONSE_STATUS        = R.SECTION_HEAD_RESPONSE_STATUS,
                D.SECTION_HEAD_RESPONSE_REMARKS       = R.SECTION_HEAD_RESPONSE_REMARKS,
                D.RESPONSE_1_STATUS                   = R.RESPONSE_1_STATUS,
                D.RESPONSE_1_REMARKS                  = R.RESPONSE_1_REMARKS,
                D.RESPONSE_1_DATE                     = R.RESPONSE_1_DATE,
                D.RESPONSE_1_EMP_ID                   = R.RESPONSE_1_EMP_ID,
                D.RESPONSE_2_STATUS                   = R.RESPONSE_2_STATUS,
                D.RESPONSE_2_REMARKS                  = R.RESPONSE_2_REMARKS,
                D.RESPONSE_2_DATE                     = R.RESPONSE_2_DATE,
                D.RESPONSE_2_EMP_ID                   = R.RESPONSE_2_EMP_ID,
                D.FINAL_RESPONSE_STATUS               = R.FINAL_RESPONSE_STATUS,
                D.FINAL_RESPONSE_REMARKS              = R.FINAL_RESPONSE_REMARKS,
                D.FINAL_RESPONSE_DATE                 = R.FINAL_RESPONSE_DATE,
                D.FINAL_RESPONSE_PERSON               = R.FINAL_RESPONSE_PERSON,
                D.MODIFIED_BY                         = @UpdatedBy,
                D.MODIFIED_DATE                       = GETDATE()
            FROM [VPayEntries].[ATTENDANCE_DETAILS] D
            INNER JOIN [VRequest].[TBL_ATTENDANCE_REQUEST] R ON R.ATT_REQUEST_REF_NO = D.ATT_REQUEST_REF_NO
            WHERE R.SNO = @RequestID;
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
                    SECTION_HEAD_RESPONSE_REMARKS       = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE SECTION_HEAD_RESPONSE_REMARKS END,
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
                    RESPONSE_1_REMARKS  = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE RESPONSE_1_REMARKS END,
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
                    RESPONSE_2_REMARKS  = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE RESPONSE_2_REMARKS END,
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
                    FINAL_RESPONSE_REMARKS  = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE FINAL_RESPONSE_REMARKS END,
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

            -- Mirror the full approval chain back to the linked arrear entries
            -- (same ARREAR_REQUEST_REF_NO) so the arrear-entries grid and the
            -- request approval status / remarks show the latest decision.
            UPDATE D
            SET
                D.SECTION_HEAD_RESPONSE_PERSON_EMP_ID = R.SECTION_HEAD_RESPONSE_PERSON_EMP_ID,
                D.SECTION_HEAD_RESPONSE_DATE          = R.SECTION_HEAD_RESPONSE_DATE,
                D.SECTION_HEAD_RESPONSE_STATUS        = R.SECTION_HEAD_RESPONSE_STATUS,
                D.SECTION_HEAD_RESPONSE_REMARKS       = R.SECTION_HEAD_RESPONSE_REMARKS,
                D.RESPONSE_1_STATUS                   = R.RESPONSE_1_STATUS,
                D.RESPONSE_1_REMARKS                  = R.RESPONSE_1_REMARKS,
                D.RESPONSE_1_DATE                     = R.RESPONSE_1_DATE,
                D.RESPONSE_1_EMP_ID                   = R.RESPONSE_1_EMP_ID,
                D.RESPONSE_2_STATUS                   = R.RESPONSE_2_STATUS,
                D.RESPONSE_2_REMARKS                  = R.RESPONSE_2_REMARKS,
                D.RESPONSE_2_DATE                     = R.RESPONSE_2_DATE,
                D.RESPONSE_2_EMP_ID                   = R.RESPONSE_2_EMP_ID,
                D.FINAL_RESPONSE_STATUS               = R.FINAL_RESPONSE_STATUS,
                D.FINAL_RESPONSE_REMARKS              = R.FINAL_RESPONSE_REMARKS,
                D.FINAL_RESPONSE_DATE                 = R.FINAL_RESPONSE_DATE,
                D.FINAL_RESPONSE_EMP_ID               = R.FINAL_RESPONSE_EMP_ID,
                D.MODIFIED_BY                         = @UpdatedBy,
                D.MODIFIED_DATE                       = GETDATE()
            FROM [VPayEntries].[TBL_ARREAR_ENTRIES] D
            INNER JOIN [VREQUEST].[TBL_ARREARS_REQUEST] R ON R.ARREAR_REQUEST_REF_NO = D.ARREAR_REQUEST_REF_NO
            WHERE R.SNO = @RequestID;
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
                    SECTION_HEAD_RESPONSE_REMARKS       = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE SECTION_HEAD_RESPONSE_REMARKS END,
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
                    RESPONSE_1_REMARKS  = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE RESPONSE_1_REMARKS END,
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
                    RESPONSE_2_REMARKS  = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE RESPONSE_2_REMARKS END,
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
                    FINAL_RESPONSE_REMARKS  = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE FINAL_RESPONSE_REMARKS END,
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

            -- Mirror the full approval chain back to the linked overtime entries
            -- (same OT_REQUEST_REF_NO) so the overtime-entries grid and the
            -- request approval status / remarks show the latest decision.
            UPDATE D
            SET
                D.SECTION_HEAD_RESPONSE_PERSON_EMP_ID = R.SECTION_HEAD_RESPONSE_PERSON_EMP_ID,
                D.SECTION_HEAD_RESPONSE_DATE          = R.SECTION_HEAD_RESPONSE_DATE,
                D.SECTION_HEAD_RESPONSE_STATUS        = R.SECTION_HEAD_RESPONSE_STATUS,
                D.SECTION_HEAD_RESPONSE_REMARKS       = R.SECTION_HEAD_RESPONSE_REMARKS,
                D.RESPONSE_1_STATUS                   = R.RESPONSE_1_STATUS,
                D.RESPONSE_1_REMARKS                  = R.RESPONSE_1_REMARKS,
                D.RESPONSE_1_DATE                     = R.RESPONSE_1_DATE,
                D.RESPONSE_1_EMP_ID                   = R.RESPONSE_1_EMP_ID,
                D.RESPONSE_2_STATUS                   = R.RESPONSE_2_STATUS,
                D.RESPONSE_2_REMARKS                  = R.RESPONSE_2_REMARKS,
                D.RESPONSE_2_DATE                     = R.RESPONSE_2_DATE,
                D.RESPONSE_2_EMP_ID                   = R.RESPONSE_2_EMP_ID,
                D.FINAL_RESPONSE_STATUS               = R.FINAL_RESPONSE_STATUS,
                D.FINAL_RESPONSE_REMARKS              = R.FINAL_RESPONSE_REMARKS,
                D.FINAL_RESPONSE_DATE                 = R.FINAL_RESPONSE_DATE,
                D.FINAL_RESPONSE_EMP_ID               = R.FINAL_RESPONSE_EMP_ID,
                D.MODIFIED_BY                         = @UpdatedBy,
                D.MODIFIED_DATE                       = GETDATE()
            FROM [VPayEntries].[TBL_OVERTIME_ENTRIES] D
            INNER JOIN [VREQUEST].[TBL_OVERTIME_REQUEST] R ON R.OT_REQUEST_REF_NO = D.OT_REQUEST_REF_NO
            WHERE R.SNO = @RequestID;
        END
        -- ─────────────────────────────────────────────
        -- BONUS REQUEST
        -- ─────────────────────────────────────────────
        ELSE IF @RequestType = 'Bonus Request'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM [VREQUEST].[TBL_BONUS_REQUEST] WHERE SNO = @RequestID)
            BEGIN
                SELECT 'error' AS STATUS, 'Bonus Request not found' AS MESSAGE, '' AS DATA;
                ROLLBACK TRANSACTION;
                RETURN;
            END

            SELECT
                @SecHeadStatusN = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)), ''), 'PENDING')),
                @Resp1StatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),             ''), 'PENDING')),
                @Resp2StatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),             ''), 'PENDING')),
                @FinalStatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),         ''), 'PENDING'))
            FROM [VREQUEST].[TBL_BONUS_REQUEST]
            WHERE SNO = @RequestID;

            -- Level 1: Section Head
            IF @SecHeadStatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_BONUS_REQUEST]
                SET
                    SECTION_HEAD_RESPONSE_STATUS        = @Status,
                    SECTION_HEAD_RESPONSE_REMARKS       = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE SECTION_HEAD_RESPONSE_REMARKS END,
                    SECTION_HEAD_RESPONSE_DATE          = GETDATE(),
                    SECTION_HEAD_RESPONSE_PERSON_EMP_ID = @PersonEmpId,
                    MODIFIED_BY                         = @UpdatedBy,
                    MODIFIED_DATE                       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 2: Response 1
            ELSE IF @SecHeadStatusN = 'APPROVED' AND @Resp1StatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_BONUS_REQUEST]
                SET
                    RESPONSE_1_STATUS   = @Status,
                    RESPONSE_1_REMARKS  = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE RESPONSE_1_REMARKS END,
                    RESPONSE_1_DATE     = GETDATE(),
                    RESPONSE_1_EMP_ID   = @PersonEmpId,
                    MODIFIED_BY         = @UpdatedBy,
                    MODIFIED_DATE       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 3: Response 2
            ELSE IF @Resp1StatusN = 'APPROVED' AND @Resp2StatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_BONUS_REQUEST]
                SET
                    RESPONSE_2_STATUS   = @Status,
                    RESPONSE_2_REMARKS  = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE RESPONSE_2_REMARKS END,
                    RESPONSE_2_DATE     = GETDATE(),
                    RESPONSE_2_EMP_ID   = @PersonEmpId,
                    MODIFIED_BY         = @UpdatedBy,
                    MODIFIED_DATE       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 4: Final Response
            ELSE IF @Resp2StatusN = 'APPROVED' AND @FinalStatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_BONUS_REQUEST]
                SET
                    FINAL_RESPONSE_STATUS   = @Status,
                    FINAL_RESPONSE_REMARKS  = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE FINAL_RESPONSE_REMARKS END,
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

            -- Mirror the full approval chain back to the linked bonus entries
            -- (same BONUS_REQUEST_REF_NO) so the bonus-entries grid and the
            -- request approval status / remarks show the latest decision.
            UPDATE D
            SET
                D.SECTION_HEAD_RESPONSE_PERSON_EMP_ID = R.SECTION_HEAD_RESPONSE_PERSON_EMP_ID,
                D.SECTION_HEAD_RESPONSE_DATE          = R.SECTION_HEAD_RESPONSE_DATE,
                D.SECTION_HEAD_RESPONSE_STATUS        = R.SECTION_HEAD_RESPONSE_STATUS,
                D.SECTION_HEAD_RESPONSE_REMARKS       = R.SECTION_HEAD_RESPONSE_REMARKS,
                D.RESPONSE_1_STATUS                   = R.RESPONSE_1_STATUS,
                D.RESPONSE_1_REMARKS                  = R.RESPONSE_1_REMARKS,
                D.RESPONSE_1_DATE                     = R.RESPONSE_1_DATE,
                D.RESPONSE_1_EMP_ID                   = R.RESPONSE_1_EMP_ID,
                D.RESPONSE_2_STATUS                   = R.RESPONSE_2_STATUS,
                D.RESPONSE_2_REMARKS                  = R.RESPONSE_2_REMARKS,
                D.RESPONSE_2_DATE                     = R.RESPONSE_2_DATE,
                D.RESPONSE_2_EMP_ID                   = R.RESPONSE_2_EMP_ID,
                D.FINAL_RESPONSE_STATUS               = R.FINAL_RESPONSE_STATUS,
                D.FINAL_RESPONSE_REMARKS              = R.FINAL_RESPONSE_REMARKS,
                D.FINAL_RESPONSE_DATE                 = R.FINAL_RESPONSE_DATE,
                D.FINAL_RESPONSE_EMP_ID               = R.FINAL_RESPONSE_EMP_ID,
                D.MODIFIED_BY                         = @UpdatedBy,
                D.MODIFIED_DATE                       = GETDATE()
            FROM [VPayEntries].[TBL_BONUS_ENTRIES] D
            INNER JOIN [VREQUEST].[TBL_BONUS_REQUEST] R ON R.BONUS_REQUEST_REF_NO = D.BONUS_REQUEST_REF_NO
            WHERE R.SNO = @RequestID;
        END
        -- ─────────────────────────────────────────────
        -- LEAVE ENCASHMENT REQUEST
        -- ─────────────────────────────────────────────
        ELSE IF @RequestType = 'Leave Encashment Request'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM [VREQUEST].[TBL_LEAVE_ENCASHMENT_REQUEST] WHERE SNO = @RequestID)
            BEGIN
                SELECT 'error' AS STATUS, 'Leave Encashment Request not found' AS MESSAGE, '' AS DATA;
                ROLLBACK TRANSACTION;
                RETURN;
            END

            SELECT
                @SecHeadStatusN = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)), ''), 'PENDING')),
                @Resp1StatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),             ''), 'PENDING')),
                @Resp2StatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),             ''), 'PENDING')),
                @FinalStatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),         ''), 'PENDING'))
            FROM [VREQUEST].[TBL_LEAVE_ENCASHMENT_REQUEST]
            WHERE SNO = @RequestID;

            -- Level 1: Section Head
            IF @SecHeadStatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_LEAVE_ENCASHMENT_REQUEST]
                SET
                    SECTION_HEAD_RESPONSE_STATUS        = @Status,
                    SECTION_HEAD_RESPONSE_REMARKS       = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE SECTION_HEAD_RESPONSE_REMARKS END,
                    SECTION_HEAD_RESPONSE_DATE          = GETDATE(),
                    SECTION_HEAD_RESPONSE_PERSON_EMP_ID = @PersonEmpId,
                    MODIFIED_BY                         = @UpdatedBy,
                    MODIFIED_DATE                       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 2: Response 1
            ELSE IF @SecHeadStatusN = 'APPROVED' AND @Resp1StatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_LEAVE_ENCASHMENT_REQUEST]
                SET
                    RESPONSE_1_STATUS   = @Status,
                    RESPONSE_1_REMARKS  = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE RESPONSE_1_REMARKS END,
                    RESPONSE_1_DATE     = GETDATE(),
                    RESPONSE_1_EMP_ID   = @PersonEmpId,
                    MODIFIED_BY         = @UpdatedBy,
                    MODIFIED_DATE       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 3: Response 2
            ELSE IF @Resp1StatusN = 'APPROVED' AND @Resp2StatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_LEAVE_ENCASHMENT_REQUEST]
                SET
                    RESPONSE_2_STATUS   = @Status,
                    RESPONSE_2_REMARKS  = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE RESPONSE_2_REMARKS END,
                    RESPONSE_2_DATE     = GETDATE(),
                    RESPONSE_2_EMP_ID   = @PersonEmpId,
                    MODIFIED_BY         = @UpdatedBy,
                    MODIFIED_DATE       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 4: Final Response
            ELSE IF @Resp2StatusN = 'APPROVED' AND @FinalStatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_LEAVE_ENCASHMENT_REQUEST]
                SET
                    FINAL_RESPONSE_STATUS   = @Status,
                    FINAL_RESPONSE_REMARKS  = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE FINAL_RESPONSE_REMARKS END,
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

            -- Mirror the full approval chain back to the linked leave
            -- encashment entries (same LEAVE_ENCASHMENT_REQUEST_REF_NO).
            UPDATE D
            SET
                D.SECTION_HEAD_RESPONSE_PERSON_EMP_ID = R.SECTION_HEAD_RESPONSE_PERSON_EMP_ID,
                D.SECTION_HEAD_RESPONSE_DATE          = R.SECTION_HEAD_RESPONSE_DATE,
                D.SECTION_HEAD_RESPONSE_STATUS        = R.SECTION_HEAD_RESPONSE_STATUS,
                D.SECTION_HEAD_RESPONSE_REMARKS       = R.SECTION_HEAD_RESPONSE_REMARKS,
                D.RESPONSE_1_STATUS                   = R.RESPONSE_1_STATUS,
                D.RESPONSE_1_REMARKS                  = R.RESPONSE_1_REMARKS,
                D.RESPONSE_1_DATE                     = R.RESPONSE_1_DATE,
                D.RESPONSE_1_EMP_ID                   = R.RESPONSE_1_EMP_ID,
                D.RESPONSE_2_STATUS                   = R.RESPONSE_2_STATUS,
                D.RESPONSE_2_REMARKS                  = R.RESPONSE_2_REMARKS,
                D.RESPONSE_2_DATE                     = R.RESPONSE_2_DATE,
                D.RESPONSE_2_EMP_ID                   = R.RESPONSE_2_EMP_ID,
                D.FINAL_RESPONSE_STATUS               = R.FINAL_RESPONSE_STATUS,
                D.FINAL_RESPONSE_REMARKS              = R.FINAL_RESPONSE_REMARKS,
                D.FINAL_RESPONSE_DATE                 = R.FINAL_RESPONSE_DATE,
                D.FINAL_RESPONSE_EMP_ID               = R.FINAL_RESPONSE_EMP_ID,
                D.MODIFIED_BY                         = @UpdatedBy,
                D.MODIFIED_DATE                       = GETDATE()
            FROM [VPayEntries].[TBL_LEAVE_ENCASHMENT_ENTRIES] D
            INNER JOIN [VREQUEST].[TBL_LEAVE_ENCASHMENT_REQUEST] R ON R.LEAVE_ENCASHMENT_REQUEST_REF_NO = D.LEAVE_ENCASHMENT_REQUEST_REF_NO
            WHERE R.SNO = @RequestID;
        END
        -- ─────────────────────────────────────────────
        -- PROMOTION DEMOTION TRANSFER REQUEST
        -- ─────────────────────────────────────────────
        ELSE IF @RequestType = 'Promotion Demotion Transfer Request'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM [VREQUEST].[TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST] WHERE SNO = @RequestID)
            BEGIN
                SELECT 'error' AS STATUS, 'Promotion Demotion Transfer Request not found' AS MESSAGE, '' AS DATA;
                ROLLBACK TRANSACTION;
                RETURN;
            END

            SELECT
                @SecHeadStatusN = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)), ''), 'PENDING')),
                @Resp1StatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),             ''), 'PENDING')),
                @Resp2StatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),             ''), 'PENDING')),
                @FinalStatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),         ''), 'PENDING'))
            FROM [VREQUEST].[TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST]
            WHERE SNO = @RequestID;

            -- Level 1: Section Head
            IF @SecHeadStatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST]
                SET
                    SECTION_HEAD_RESPONSE_STATUS        = @Status,
                    SECTION_HEAD_RESPONSE_REMARKS       = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE SECTION_HEAD_RESPONSE_REMARKS END,
                    SECTION_HEAD_RESPONSE_DATE          = GETDATE(),
                    SECTION_HEAD_RESPONSE_PERSON_EMP_ID = @PersonEmpId,
                    MODIFIED_BY                         = @UpdatedBy,
                    MODIFIED_DATE                       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 2: Response 1
            ELSE IF @SecHeadStatusN = 'APPROVED' AND @Resp1StatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST]
                SET
                    RESPONSE_1_STATUS   = @Status,
                    RESPONSE_1_REMARKS  = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE RESPONSE_1_REMARKS END,
                    RESPONSE_1_DATE     = GETDATE(),
                    RESPONSE_1_EMP_ID   = @PersonEmpId,
                    MODIFIED_BY         = @UpdatedBy,
                    MODIFIED_DATE       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 3: Response 2
            ELSE IF @Resp1StatusN = 'APPROVED' AND @Resp2StatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST]
                SET
                    RESPONSE_2_STATUS   = @Status,
                    RESPONSE_2_REMARKS  = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE RESPONSE_2_REMARKS END,
                    RESPONSE_2_DATE     = GETDATE(),
                    RESPONSE_2_EMP_ID   = @PersonEmpId,
                    MODIFIED_BY         = @UpdatedBy,
                    MODIFIED_DATE       = GETDATE()
                WHERE SNO = @RequestID;
            END
            -- Level 4: Final Response
            ELSE IF @Resp2StatusN = 'APPROVED' AND @FinalStatusN IN ('PENDING', 'HOLD')
            BEGIN
                UPDATE [VREQUEST].[TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST]
                SET
                    FINAL_RESPONSE_STATUS   = @Status,
                    FINAL_RESPONSE_REMARKS  = CASE
                        WHEN @Status IN ('Hold', 'Approved', 'Rejected') AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> ''
                            THEN @HoldReason
                        ELSE FINAL_RESPONSE_REMARKS END,
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

            -- Mirror the full approval chain back to the linked PDT entries
            -- (same TRANSFER_REQUEST_REF_NO).
            UPDATE D
            SET
                D.SECTION_HEAD_RESPONSE_PERSON_EMP_ID = R.SECTION_HEAD_RESPONSE_PERSON_EMP_ID,
                D.SECTION_HEAD_RESPONSE_DATE          = R.SECTION_HEAD_RESPONSE_DATE,
                D.SECTION_HEAD_RESPONSE_STATUS        = R.SECTION_HEAD_RESPONSE_STATUS,
                D.SECTION_HEAD_RESPONSE_REMARKS       = R.SECTION_HEAD_RESPONSE_REMARKS,
                D.RESPONSE_1_STATUS                   = R.RESPONSE_1_STATUS,
                D.RESPONSE_1_REMARKS                  = R.RESPONSE_1_REMARKS,
                D.RESPONSE_1_DATE                     = R.RESPONSE_1_DATE,
                D.RESPONSE_1_EMP_ID                   = R.RESPONSE_1_EMP_ID,
                D.RESPONSE_2_STATUS                   = R.RESPONSE_2_STATUS,
                D.RESPONSE_2_REMARKS                  = R.RESPONSE_2_REMARKS,
                D.RESPONSE_2_DATE                     = R.RESPONSE_2_DATE,
                D.RESPONSE_2_EMP_ID                   = R.RESPONSE_2_EMP_ID,
                D.FINAL_RESPONSE_STATUS               = R.FINAL_RESPONSE_STATUS,
                D.FINAL_RESPONSE_REMARKS              = R.FINAL_RESPONSE_REMARKS,
                D.FINAL_RESPONSE_DATE                 = R.FINAL_RESPONSE_DATE,
                D.FINAL_RESPONSE_EMP_ID               = R.FINAL_RESPONSE_EMP_ID,
                D.MODIFIED_BY                         = @UpdatedBy,
                D.MODIFIED_DATE                       = GETDATE()
            FROM [VPayEntries].[TBL_PROMOTION_DEMOTION_TRANSFER_ENTRIES] D
            INNER JOIN [VREQUEST].[TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST] R ON R.TRANSFER_REQUEST_REF_NO = D.TRANSFER_REQUEST_REF_NO
            WHERE R.SNO = @RequestID;
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
