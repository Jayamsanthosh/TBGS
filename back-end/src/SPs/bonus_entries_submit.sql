USE [TBGS]
GO
/* ---- Submit (lock) a bonus entry. Deployed SP mirrored 1:1. ---- */
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF OBJECT_ID('VPayEntries.SUBMIT_BONUS_ENTRIES', 'P') IS NULL
    EXEC('CREATE PROCEDURE VPayEntries.SUBMIT_BONUS_ENTRIES AS SELECT 1')
GO

ALTER PROCEDURE [VPayEntries].[SUBMIT_BONUS_ENTRIES]
(
    @BONUS_REQUEST_REF_NO VARCHAR(50),
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
            FROM [VPayEntries].[TBL_BONUS_ENTRIES]
            WHERE BONUS_REQUEST_REF_NO = @BONUS_REQUEST_REF_NO
        )
        BEGIN
            SELECT 'Error', 'Invalid Bonus Entry ID. Record not found.. Contact Administrator', '0'
        END

        ELSE IF EXISTS
        (
            SELECT 'X'
            FROM [VPayEntries].[TBL_BONUS_ENTRIES]
            WHERE BONUS_REQUEST_REF_NO = @BONUS_REQUEST_REF_NO
              AND STATUS_MASTER = 'CL'
        )
        AND @Role <> 'Administrator'
        BEGIN
            SELECT 'Error', 'Already Submitted.. Contact Administrator', '0'
        END

        ELSE IF EXISTS
        (
            SELECT 'X'
            FROM [VPayEntries].[TBL_BONUS_ENTRIES]
            WHERE BONUS_REQUEST_REF_NO = @BONUS_REQUEST_REF_NO
              AND STATUS_MASTER = 'CA'
        )
        BEGIN
            SELECT 'Error', 'Already Cancelled.. Contact Administrator', '0'
        END

        ELSE
        BEGIN
            UPDATE [VPayEntries].[TBL_BONUS_ENTRIES]
            SET STATUS_MASTER = 'CL'
            WHERE BONUS_REQUEST_REF_NO = @BONUS_REQUEST_REF_NO

            SELECT '', 'Bonus Entry Submitted Successfully', @BONUS_REQUEST_REF_NO
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