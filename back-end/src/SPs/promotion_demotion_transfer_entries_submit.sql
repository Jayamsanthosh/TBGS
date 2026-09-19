USE [TBGS]
GO
/* ---- Submit (lock) a promotion / demotion / transfer entry. Mirrors VPayEntries.SUBMIT_BONUS_ENTRIES. ---- */
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF OBJECT_ID('VPayEntries.SUBMIT_PROMOTION_DEMOTION_TRANSFER_ENTRIES', 'P') IS NULL
    EXEC('CREATE PROCEDURE VPayEntries.SUBMIT_PROMOTION_DEMOTION_TRANSFER_ENTRIES AS SELECT 1')
GO

ALTER PROCEDURE [VPayEntries].[SUBMIT_PROMOTION_DEMOTION_TRANSFER_ENTRIES]
(
    @TRANSFER_REQUEST_REF_NO VARCHAR(50),
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
            FROM [VPayEntries].[TBL_PROMOTION_DEMOTION_TRANSFER_ENTRIES]
            WHERE TRANSFER_REQUEST_REF_NO = @TRANSFER_REQUEST_REF_NO
        )
        BEGIN
            SELECT 'Error', 'Invalid Promotion / Demotion / Transfer Entry ID. Record not found.. Contact Administrator', '0'
        END

        ELSE IF EXISTS
        (
            SELECT 'X'
            FROM [VPayEntries].[TBL_PROMOTION_DEMOTION_TRANSFER_ENTRIES]
            WHERE TRANSFER_REQUEST_REF_NO = @TRANSFER_REQUEST_REF_NO
              AND STATUS_MASTER = 'CL'
        )
        AND @Role <> 'Administrator'
        BEGIN
            SELECT 'Error', 'Already Submitted.. Contact Administrator', '0'
        END

        ELSE IF EXISTS
        (
            SELECT 'X'
            FROM [VPayEntries].[TBL_PROMOTION_DEMOTION_TRANSFER_ENTRIES]
            WHERE TRANSFER_REQUEST_REF_NO = @TRANSFER_REQUEST_REF_NO
              AND STATUS_MASTER = 'CA'
        )
        BEGIN
            SELECT 'Error', 'Already Cancelled.. Contact Administrator', '0'
        END

        ELSE
        BEGIN
            UPDATE [VPayEntries].[TBL_PROMOTION_DEMOTION_TRANSFER_ENTRIES]
            SET STATUS_MASTER = 'CL'
            WHERE TRANSFER_REQUEST_REF_NO = @TRANSFER_REQUEST_REF_NO

            SELECT '', 'Promotion Demotion Transfer Entry Submitted Successfully', @TRANSFER_REQUEST_REF_NO
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