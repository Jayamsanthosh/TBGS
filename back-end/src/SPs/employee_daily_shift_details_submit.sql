USE [TBGS]
GO
/* ---- Submit (lock) an employee daily shift detail. Mirrors VPayEntries.SUBMIT_BONUS_ENTRIES. ---- */
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF OBJECT_ID('VPayEntries.SUBMIT_EMPLOYEE_DAILY_SHIFT_DETAILS', 'P') IS NULL
    EXEC('CREATE PROCEDURE VPayEntries.SUBMIT_EMPLOYEE_DAILY_SHIFT_DETAILS AS SELECT 1')
GO

ALTER PROCEDURE [VPayEntries].[SUBMIT_EMPLOYEE_DAILY_SHIFT_DETAILS]
(
    @SNO BIGINT,
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
            FROM [VPayEntries].[TBL_EMPLOYEE_DAILY_SHIFT_DETAILS]
            WHERE SNO = @SNO
        )
        BEGIN
            SELECT 'Error', 'Invalid Employee Daily Shift Detail ID. Record not found.. Contact Administrator', '0'
        END

        ELSE IF EXISTS
        (
            SELECT 'X'
            FROM [VPayEntries].[TBL_EMPLOYEE_DAILY_SHIFT_DETAILS]
            WHERE SNO = @SNO
              AND STATUS_MASTER = 'CL'
        )
        AND @Role <> 'Administrator'
        BEGIN
            SELECT 'Error', 'Already Submitted.. Contact Administrator', '0'
        END

        ELSE IF EXISTS
        (
            SELECT 'X'
            FROM [VPayEntries].[TBL_EMPLOYEE_DAILY_SHIFT_DETAILS]
            WHERE SNO = @SNO
              AND STATUS_MASTER = 'CA'
        )
        BEGIN
            SELECT 'Error', 'Already Cancelled.. Contact Administrator', '0'
        END

        ELSE
        BEGIN
            UPDATE [VPayEntries].[TBL_EMPLOYEE_DAILY_SHIFT_DETAILS]
            SET STATUS_MASTER = 'CL'
            WHERE SNO = @SNO

            SELECT '', 'Employee Daily Shift Detail Submitted Successfully', @SNO
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