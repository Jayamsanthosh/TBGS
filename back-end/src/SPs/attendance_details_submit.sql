USE [TBGS]
GO
/* ---- Submit (lock) an attendance detail. Mirrors VPayEntries.SUBMIT_BONUS_ENTRIES.
        NOTE: result cells are NAMED (STATUS/MESSAGE/DATA) because the submit
        service parses this SP with parseSprocResult. ---- */
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF OBJECT_ID('VPayEntries.SUBMIT_ATTENDANCE_DETAILS', 'P') IS NULL
    EXEC('CREATE PROCEDURE VPayEntries.SUBMIT_ATTENDANCE_DETAILS AS SELECT 1')
GO

ALTER PROCEDURE [VPayEntries].[SUBMIT_ATTENDANCE_DETAILS]
(
    @SNO INT,
    @Role VARCHAR(50) = 'Administrator'
)

AS
BEGIN
    SET NOCOUNT ON

    BEGIN TRY
        BEGIN TRANSACTION

        IF NOT EXISTS
        (
            SELECT 'X'
            FROM [VPayEntries].[ATTENDANCE_DETAILS]
            WHERE SNO = @SNO
        )
        BEGIN
            SELECT 'Error' AS STATUS, 'Invalid Attendance Detail ID. Record not found.. Contact Administrator' AS MESSAGE, '0' AS DATA
        END

        ELSE IF EXISTS
        (
            SELECT 'X'
            FROM [VPayEntries].[ATTENDANCE_DETAILS]
            WHERE SNO = @SNO
              AND STATUS_MASTER = 'CL'
        )
        AND @Role <> 'Administrator'
        BEGIN
            SELECT 'Error' AS STATUS, 'Already Submitted.. Contact Administrator' AS MESSAGE, '0' AS DATA
        END

        ELSE IF EXISTS
        (
            SELECT 'X'
            FROM [VPayEntries].[ATTENDANCE_DETAILS]
            WHERE SNO = @SNO
              AND STATUS_MASTER = 'CA'
        )
        BEGIN
            SELECT 'Error' AS STATUS, 'Already Cancelled.. Contact Administrator' AS MESSAGE, '0' AS DATA
        END

        ELSE
        BEGIN
            UPDATE [VPayEntries].[ATTENDANCE_DETAILS]
            SET STATUS_MASTER = 'CL'
            WHERE SNO = @SNO

            -- =====================================================================
            -- Bridge: also (upsert) into VRequest.TBL_ATTENDANCE_REQUEST so the
            -- approval 'Attendance' list shows the submitted attendance detail.
            -- Upsert keyed by ATT_REQUEST_REF_NO (auto-generated when blank).
            -- =====================================================================
            DECLARE @RefNo VARCHAR(50) = (SELECT ATT_REQUEST_REF_NO FROM [VPayEntries].[ATTENDANCE_DETAILS] WHERE SNO = @SNO);

            IF @RefNo IS NULL OR LTRIM(RTRIM(@RefNo)) = ''
                SET @RefNo = 'ATT/' + CONVERT(VARCHAR(8), GETDATE(), 112) + '/' + CAST(@SNO AS VARCHAR(20));

            IF EXISTS (SELECT 'X' FROM [VRequest].[TBL_ATTENDANCE_REQUEST] WHERE ATT_REQUEST_REF_NO = @RefNo)
            BEGIN
                -- Request already exists: refresh only display/data fields.
                -- Leave the approval response chain (SECTION_HEAD/RESPONSE_1/2/FINAL)
                -- and STATUS_MASTER untouched so approval progress is preserved.
                UPDATE R
                SET
                    R.MONTH_ENTERED      = D.MONTH_ENTERED,
                    R.YEAR_ENTERED       = D.YEAR_ENTERED,
                    R.EMP_ID             = D.EMP_ID,
                    R.FIRST_NAME         = D.FIRST_NAME,
                    R.MIDDLE_NAME        = D.MIDDLE_NAME,
                    R.LAST_NAME          = D.LAST_NAME,
                    R.COMPANY_ID         = D.COMPANY_ID,
                    R.DEPARTMENT_ID      = D.DEPARTMENT_ID,
                    R.DESIGNATION_ID     = D.DESIGNATION_ID,
                    R.DEPARTMENT_GROUP_ID  = D.DEPARTMENT_GROUP_ID,
                    R.DESIGNATION_GROUP_ID = D.DESIGNATION_GROUP_ID,
                    R.CAMP_ID            = D.CAMP_ID,
                    R.STORE_ID           = D.STORE_ID,
                    R.EMPLOYMENT_TYPE_ID = D.EMPLOYMENT_TYPE_ID,
                    R.ATTENDANCE_TYPE_ID = D.ATTENDANCE_TYPE_ID,
                    R.ELIGIBLE_DAYS      = D.ELIGIBLE_DAYS,
                    R.DATE_FROM          = D.DATE_FROM,
                    R.DATE_TO            = D.DATE_TO,
                    R.NO_OF_DAYS         = D.NO_OF_DAYS,
                    R.BALANCE_LEAVE      = D.BALANCE_LEAVE,
                    R.REASON             = D.REASON,
                    R.REMARKS            = D.REMARKS,
                    R.MODIFIED_BY        = D.CREATED_BY,
                    R.MODIFIED_DATE      = GETDATE()
                FROM [VRequest].[TBL_ATTENDANCE_REQUEST] R
                INNER JOIN [VPayEntries].[ATTENDANCE_DETAILS] D ON D.ATT_REQUEST_REF_NO = R.ATT_REQUEST_REF_NO AND D.SNO = @SNO
                WHERE R.ATT_REQUEST_REF_NO = @RefNo
                  AND UPPER(LTRIM(RTRIM(ISNULL(R.FINAL_RESPONSE_STATUS,'')))) NOT IN ('APPROVED','APPROVAL','REJECTED','REJECT','CLOSED');
            END
            ELSE
            BEGIN
                -- No request yet for this reference: create one (Submission = 'CL').
                INSERT INTO [VRequest].[TBL_ATTENDANCE_REQUEST]
                (
                    ATT_REQUEST_REF_NO,
                    MONTH_ENTERED,
                    YEAR_ENTERED,
                    EMP_ID,
                    FIRST_NAME,
                    MIDDLE_NAME,
                    LAST_NAME,
                    COMPANY_ID,
                    DEPARTMENT_ID,
                    DESIGNATION_ID,
                    DEPARTMENT_GROUP_ID,
                    DESIGNATION_GROUP_ID,
                    CAMP_ID,
                    STORE_ID,
                    EMPLOYMENT_TYPE_ID,
                    ATTENDANCE_TYPE_ID,
                    ELIGIBLE_DAYS,
                    DATE_FROM,
                    DATE_TO,
                    NO_OF_DAYS,
                    BALANCE_LEAVE,
                    REASON,
                    SECTION_HEAD_RESPONSE_PERSON_EMP_ID,
                    SECTION_HEAD_RESPONSE_DATE,
                    SECTION_HEAD_RESPONSE_STATUS,
                    SECTION_HEAD_RESPONSE_REMARKS,
                    RESPONSE_1_EMP_ID,
                    RESPONSE_1_DATE,
                    RESPONSE_1_STATUS,
                    RESPONSE_1_REMARKS,
                    RESPONSE_2_EMP_ID,
                    RESPONSE_2_DATE,
                    RESPONSE_2_STATUS,
                    RESPONSE_2_REMARKS,
                    FINAL_RESPONSE_PERSON,
                    FINAL_RESPONSE_DATE,
                    FINAL_RESPONSE_STATUS,
                    FINAL_RESPONSE_REMARKS,
                    REMARKS,
                    STATUS_MASTER,
                    CREATED_BY,
                    CREATED_DATE,
                    CREATED_MAC_ADDRESS
                )
                SELECT
                    @RefNo,
                    MONTH_ENTERED,
                    YEAR_ENTERED,
                    EMP_ID,
                    FIRST_NAME,
                    MIDDLE_NAME,
                    LAST_NAME,
                    COMPANY_ID,
                    DEPARTMENT_ID,
                    DESIGNATION_ID,
                    DEPARTMENT_GROUP_ID,
                    DESIGNATION_GROUP_ID,
                    CAMP_ID,
                    STORE_ID,
                    EMPLOYMENT_TYPE_ID,
                    ATTENDANCE_TYPE_ID,
                    ELIGIBLE_DAYS,
                    DATE_FROM,
                    DATE_TO,
                    NO_OF_DAYS,
                    BALANCE_LEAVE,
                    REASON,
                    SECTION_HEAD_RESPONSE_PERSON_EMP_ID,
                    SECTION_HEAD_RESPONSE_DATE,
                    SECTION_HEAD_RESPONSE_STATUS,
                    SECTION_HEAD_RESPONSE_REMARKS,
                    RESPONSE_1_EMP_ID,
                    RESPONSE_1_DATE,
                    RESPONSE_1_STATUS,
                    RESPONSE_1_REMARKS,
                    RESPONSE_2_EMP_ID,
                    RESPONSE_2_DATE,
                    RESPONSE_2_STATUS,
                    RESPONSE_2_REMARKS,
                    FINAL_RESPONSE_PERSON,
                    FINAL_RESPONSE_DATE,
                    FINAL_RESPONSE_STATUS,
                    FINAL_RESPONSE_REMARKS,
                    REMARKS,
                    'CL',
                    CREATED_BY,
                    GETDATE(),
                    CREATED_MAC_ADDRESS
                FROM [VPayEntries].[ATTENDANCE_DETAILS]
                WHERE SNO = @SNO;
            END

            SELECT '' AS STATUS, 'Attendance Detail Submitted Successfully' AS MESSAGE, @SNO AS DATA
        END

        COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
        DECLARE @msg VARCHAR(MAX) = ''

        SET @msg = 'ERROR: ' + ERROR_MESSAGE() + ' at '
                 + COALESCE(ERROR_PROCEDURE(), '')
                 + COALESCE(' line:' + CONVERT(VARCHAR(30), ERROR_LINE()), '')

        ROLLBACK TRAN

        RAISERROR (@msg, 0, 1) WITH NOWAIT
    END CATCH

END
GO