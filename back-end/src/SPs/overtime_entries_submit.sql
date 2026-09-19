USE [TBGS]
GO
/* ---- Submit (lock) an overtime entry. Mirrors VPayEntries.SUBMIT_BONUS_ENTRIES. ---- */
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF OBJECT_ID('VPayEntries.SUBMIT_OVERTIME_ENTRIES', 'P') IS NULL
    EXEC('CREATE PROCEDURE VPayEntries.SUBMIT_OVERTIME_ENTRIES AS SELECT 1')
GO

ALTER PROCEDURE [VPayEntries].[SUBMIT_OVERTIME_ENTRIES]
(
    @OT_REQUEST_REF_NO VARCHAR(50),
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
            FROM [VPayEntries].[TBL_OVERTIME_ENTRIES]
            WHERE OT_REQUEST_REF_NO = @OT_REQUEST_REF_NO
        )
        BEGIN
            SELECT 'Error', 'Invalid Overtime Entry ID. Record not found.. Contact Administrator', '0'
        END

        ELSE IF EXISTS
        (
            SELECT 'X'
            FROM [VPayEntries].[TBL_OVERTIME_ENTRIES]
            WHERE OT_REQUEST_REF_NO = @OT_REQUEST_REF_NO
              AND STATUS_MASTER = 'CL'
        )
        AND @Role <> 'Administrator'
        BEGIN
            SELECT 'Error', 'Already Submitted.. Contact Administrator', '0'
        END

        ELSE IF EXISTS
        (
            SELECT 'X'
            FROM [VPayEntries].[TBL_OVERTIME_ENTRIES]
            WHERE OT_REQUEST_REF_NO = @OT_REQUEST_REF_NO
              AND STATUS_MASTER = 'CA'
        )
        BEGIN
            SELECT 'Error', 'Already Cancelled.. Contact Administrator', '0'
        END

        ELSE
        BEGIN
            UPDATE [VPayEntries].[TBL_OVERTIME_ENTRIES]
            SET STATUS_MASTER = 'CL'
            WHERE OT_REQUEST_REF_NO = @OT_REQUEST_REF_NO

            SELECT '', 'Overtime Entry Submitted Successfully', @OT_REQUEST_REF_NO
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