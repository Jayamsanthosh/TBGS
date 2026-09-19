USE [TBGS]
GO
/* ---- Submit (lock) a monthly auto deduction entry. Mirrors VPayEntries.SUBMIT_BONUS_ENTRIES.
        NOTE: this table has no STATUS_MASTER - its live status column is STATUS_ENTRY. ---- */
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF OBJECT_ID('VPayEntries.SUBMIT_MONTHLY_AUTO_DEDUCTION', 'P') IS NULL
    EXEC('CREATE PROCEDURE VPayEntries.SUBMIT_MONTHLY_AUTO_DEDUCTION AS SELECT 1')
GO

ALTER PROCEDURE [VPayEntries].[SUBMIT_MONTHLY_AUTO_DEDUCTION]
(
    @M_AUTO_REF_NO INT,
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
            FROM [VPayEntries].[TBL_MONTHLY_AUTO_DEDUCTION]
            WHERE M_AUTO_REF_NO = @M_AUTO_REF_NO
        )
        BEGIN
            SELECT 'Error', 'Invalid Monthly Auto Deduction ID. Record not found.. Contact Administrator', '0'
        END

        ELSE IF EXISTS
        (
            SELECT 'X'
            FROM [VPayEntries].[TBL_MONTHLY_AUTO_DEDUCTION]
            WHERE M_AUTO_REF_NO = @M_AUTO_REF_NO
              AND STATUS_ENTRY = 'CL'
        )
        AND @Role <> 'Administrator'
        BEGIN
            SELECT 'Error', 'Already Submitted.. Contact Administrator', '0'
        END

        ELSE IF EXISTS
        (
            SELECT 'X'
            FROM [VPayEntries].[TBL_MONTHLY_AUTO_DEDUCTION]
            WHERE M_AUTO_REF_NO = @M_AUTO_REF_NO
              AND STATUS_ENTRY = 'CA'
        )
        BEGIN
            SELECT 'Error', 'Already Cancelled.. Contact Administrator', '0'
        END

        ELSE
        BEGIN
            UPDATE [VPayEntries].[TBL_MONTHLY_AUTO_DEDUCTION]
            SET STATUS_ENTRY = 'CL'
            WHERE M_AUTO_REF_NO = @M_AUTO_REF_NO

            SELECT '', 'Monthly Auto Deduction Submitted Successfully', @M_AUTO_REF_NO
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