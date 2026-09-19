USE [TBGS]
GO
/* ---- Submit (lock) a holiday entry. Mirrors VPayEntries.SUBMIT_BONUS_ENTRIES. ---- */
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF OBJECT_ID('VPayEntries.SUBMIT_HOLIDAY_ENTRIES', 'P') IS NULL
    EXEC('CREATE PROCEDURE VPayEntries.SUBMIT_HOLIDAY_ENTRIES AS SELECT 1')
GO

ALTER PROCEDURE [VPayEntries].[SUBMIT_HOLIDAY_ENTRIES]
(
    @HOLIDAY_ID INT,
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
            FROM [VPayEntries].[TBL_HOLIDAY_ENTRIES]
            WHERE HOLIDAY_ID = @HOLIDAY_ID
        )
        BEGIN
            SELECT 'Error', 'Invalid Holiday Entry ID. Record not found.. Contact Administrator', '0'
        END

        ELSE IF EXISTS
        (
            SELECT 'X'
            FROM [VPayEntries].[TBL_HOLIDAY_ENTRIES]
            WHERE HOLIDAY_ID = @HOLIDAY_ID
              AND STATUS_MASTER = 'CL'
        )
        AND @Role <> 'Administrator'
        BEGIN
            SELECT 'Error', 'Already Submitted.. Contact Administrator', '0'
        END

        ELSE IF EXISTS
        (
            SELECT 'X'
            FROM [VPayEntries].[TBL_HOLIDAY_ENTRIES]
            WHERE HOLIDAY_ID = @HOLIDAY_ID
              AND STATUS_MASTER = 'CA'
        )
        BEGIN
            SELECT 'Error', 'Already Cancelled.. Contact Administrator', '0'
        END

        ELSE
        BEGIN
            UPDATE [VPayEntries].[TBL_HOLIDAY_ENTRIES]
            SET STATUS_MASTER = 'CL'
            WHERE HOLIDAY_ID = @HOLIDAY_ID

            SELECT '', 'Holiday Entry Submitted Successfully', @HOLIDAY_ID
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

-- Rebuild SHOW_HOLIDAY_ENTRIES to expose CREATED_DATE for the from/to date filter
-- and to map CL/CA to CLOSED.
IF OBJECT_ID('VPayEntries.SHOW_HOLIDAY_ENTRIES', 'P') IS NOT NULL DROP PROCEDURE VPayEntries.SHOW_HOLIDAY_ENTRIES;
GO
CREATE PROCEDURE [VPayEntries].[SHOW_HOLIDAY_ENTRIES]
(
    @STATUS VARCHAR(20)
)
AS
BEGIN
    SET NOCOUNT ON

    SELECT
        HOLIDAY_ID,
        REPLACE(CONVERT(VARCHAR(50),HOLIDAY_DATE,106),' ','-') HOLIDAY_DATE,
        HOLIDAY_REASON,
        REMARKS,
        CASE
            WHEN STATUS_MASTER='AC' THEN 'ACTIVE'
            WHEN STATUS_MASTER IN ('CL','CA') THEN 'CLOSED'
            ELSE 'INACTIVE'
        END STATUS_MASTER,
        CREATED_DATE

    FROM [VPayEntries].[TBL_HOLIDAY_ENTRIES]

    WHERE (@STATUS='ALL' OR STATUS_MASTER=@STATUS)
END
GO