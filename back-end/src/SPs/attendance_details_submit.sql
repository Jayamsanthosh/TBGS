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