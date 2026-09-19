USE [TBGS]
GO
/* ---- Submit (lock) a deduction entry. Mirrors VPayEntries.SUBMIT_BONUS_ENTRIES.
        NOTE: live TBL_DEDUCTION_ENTRIES has no STATUS_MASTER column - its
        status column is STATUS_ENTRY (confirmed against the DB). ---- */
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF OBJECT_ID('VPayEntries.SUBMIT_DEDUCTION_ENTRIES', 'P') IS NULL
    EXEC('CREATE PROCEDURE VPayEntries.SUBMIT_DEDUCTION_ENTRIES AS SELECT 1')
GO

ALTER PROCEDURE [VPayEntries].[SUBMIT_DEDUCTION_ENTRIES]
(
    @DED_REF_ID VARCHAR(50),
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
            FROM [VPayEntries].[TBL_DEDUCTION_ENTRIES]
            WHERE DED_REF_ID = @DED_REF_ID
        )
        BEGIN
            SELECT 'Error', 'Invalid Deduction Entry ID. Record not found.. Contact Administrator', '0'
        END

        ELSE IF EXISTS
        (
            SELECT 'X'
            FROM [VPayEntries].[TBL_DEDUCTION_ENTRIES]
            WHERE DED_REF_ID = @DED_REF_ID
              AND STATUS_ENTRY = 'CL'
        )
        AND @Role <> 'Administrator'
        BEGIN
            SELECT 'Error', 'Already Submitted.. Contact Administrator', '0'
        END

        ELSE IF EXISTS
        (
            SELECT 'X'
            FROM [VPayEntries].[TBL_DEDUCTION_ENTRIES]
            WHERE DED_REF_ID = @DED_REF_ID
              AND STATUS_ENTRY = 'CA'
        )
        BEGIN
            SELECT 'Error', 'Already Cancelled.. Contact Administrator', '0'
        END

        ELSE
        BEGIN
            UPDATE [VPayEntries].[TBL_DEDUCTION_ENTRIES]
            SET STATUS_ENTRY = 'CL'
            WHERE DED_REF_ID = @DED_REF_ID

            SELECT '', 'Deduction Entry Submitted Successfully', @DED_REF_ID
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