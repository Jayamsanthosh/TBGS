/* ==================================================================
   PURCHASE QUOTATION CONVERSATION DTL - corrections
   Applied to [VPurchase].[TBL_PURCHASE_QUOTATION_CONVERSATION_DTL]

   1) DELETE   @ROLE <> 'Admin' is UNKNOWN when @ROLE is NULL, so the
               IF falls through and the DELETE still runs. Guarded.
   2) SHOW     the employee join selected a commented-out E.EMP_NAME,
               which does not exist as a column, and returned a date
               with no time. Name + timestamp now resolve properly.
   3) GET      returned fewer columns than SHOW and no name.
   4) UPDATE   never checked the parent quotation existed, allowed a
               conversation to be re-parented to another quotation, and
               wiped REMARKS when it was not supplied.
   5) SAVE     CREATED_DATE and MODIFIED_DATE used two separate
               GETDATE() calls and could differ by milliseconds.
   ================================================================== */

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* ------------------------------------------------------------------
   1) SAVE_PURCHASE_QUOTATION_CONVERSATION_DTL
   ------------------------------------------------------------------ */
CREATE OR ALTER PROCEDURE [VPurchase].[SAVE_PURCHASE_QUOTATION_CONVERSATION_DTL]
(
    @PURCHASE_QUOTATION_NO      VARCHAR(50),
    @RESPONSE_EMP_ID            INT           = NULL,
    @DISCUSSION_DETAILS         VARCHAR(MAX)  = NULL,
    @RESPONSE_STATUS            VARCHAR(50)   = NULL,
    @STATUS_ENTRY               VARCHAR(50),
    @REMARKS                    VARCHAR(50)   = NULL,
    @USER                       VARCHAR(50),
    @MAC_ADDRESS                VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    IF @PURCHASE_QUOTATION_NO IS NULL OR LTRIM(RTRIM(@PURCHASE_QUOTATION_NO)) = ''
    BEGIN
        SELECT 'Error' AS STATUS, 'Purchase Quotation No is required.' AS MESSAGE, '' AS DATA;
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM [VPurchase].[TBL_PURCHASE_QUOTATION_HDR] WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO)
    BEGIN
        SELECT 'Error' AS STATUS, 'Purchase Quotation Reference No does not exist.' AS MESSAGE, '' AS DATA;
        RETURN;
    END

    /* One timestamp for both audit stamps so they always agree. */
    DECLARE @NOW DATETIME = GETDATE();

    INSERT INTO [VPurchase].[TBL_PURCHASE_QUOTATION_CONVERSATION_DTL]
    (
        PURCHASE_QUOTATION_NO,
        RESPONSE_EMP_ID,
        DISCUSSION_DETAILS,
        RESPONSE_STATUS,
        STATUS_ENTRY,
        REMARKS,
        CREATED_BY,
        CREATED_DATE,
        CREATED_MAC_ADDRESS,
        MODIFIED_BY,
        MODIFIED_DATE,
        MODIFIED_MAC_ADDRESS
    )
    VALUES
    (
        LTRIM(RTRIM(@PURCHASE_QUOTATION_NO)),
        @RESPONSE_EMP_ID,
        @DISCUSSION_DETAILS,
        NULLIF(LTRIM(RTRIM(@RESPONSE_STATUS)), ''),
        ISNULL(NULLIF(LTRIM(RTRIM(@STATUS_ENTRY)), ''), 'CF'),
        NULLIF(LTRIM(RTRIM(@REMARKS)), ''),
        @USER,
        @NOW,
        @MAC_ADDRESS,
        @USER,
        @NOW,
        @MAC_ADDRESS
    );

    SELECT '' AS STATUS, 'Data Saved Successfully' AS MESSAGE, CAST(SCOPE_IDENTITY() AS VARCHAR(50)) AS DATA;
END
GO

/* ------------------------------------------------------------------
   2) SHOW_PURCHASE_QUOTATION_CONVERSATION_DTL
   ------------------------------------------------------------------ */
CREATE OR ALTER PROCEDURE [VPurchase].[SHOW_PURCHASE_QUOTATION_CONVERSATION_DTL]
(
    @PURCHASE_QUOTATION_NO VARCHAR(50),
    @STATUS_ENTRY          VARCHAR(50) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        C.SNO ID,
        C.SNO,
        C.PURCHASE_QUOTATION_NO,
        C.RESPONSE_EMP_ID,
        /* NEW_EMPLOYEE_DATABASE has no EMP_NAME; the name is three columns.
           CONCAT treats a NULL part as empty, so no ISNULL is needed. */
        NULLIF(LTRIM(RTRIM(CONCAT(E.FIRST_NAME, ' ', E.MIDDLE_NAME, ' ', E.LAST_NAME)), ''), '') AS RESPONSE_EMP_NAME,
        C.DISCUSSION_DETAILS,
        C.RESPONSE_STATUS,
        C.STATUS_ENTRY,
        C.REMARKS,
        /* A discussion thread is useless without the time of day. */
        CONVERT(VARCHAR(30), C.CREATED_DATE, 120) AS CREATED_DATE,
        CONVERT(VARCHAR(30), C.MODIFIED_DATE, 120) AS MODIFIED_DATE,
        C.CREATED_BY,
        C.CREATED_MAC_ADDRESS,
        C.MODIFIED_BY,
        C.MODIFIED_MAC_ADDRESS
    FROM [VPurchase].[TBL_PURCHASE_QUOTATION_CONVERSATION_DTL] C
    /* EMP_ID is the FK target, so this join cannot multiply rows. */
    LEFT JOIN [VPayEntries].[NEW_EMPLOYEE_DATABASE] E ON E.EMP_ID = C.RESPONSE_EMP_ID
    WHERE C.PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO
      AND (@STATUS_ENTRY IS NULL OR LTRIM(RTRIM(@STATUS_ENTRY)) = '' OR C.STATUS_ENTRY = @STATUS_ENTRY)
    ORDER BY C.SNO ASC;
END
GO

/* ------------------------------------------------------------------
   3) GET_PURCHASE_QUOTATION_CONVERSATION_DTL
   ------------------------------------------------------------------ */
CREATE OR ALTER PROCEDURE [VPurchase].[GET_PURCHASE_QUOTATION_CONVERSATION_DTL]
(
    @SNO INT
)
AS
BEGIN
    SET NOCOUNT ON;

    IF @SNO IS NULL OR @SNO <= 0
    BEGIN
        SELECT 'Error' AS STATUS, 'A valid conversation SNO is required.' AS MESSAGE, '' AS DATA;
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM [VPurchase].[TBL_PURCHASE_QUOTATION_CONVERSATION_DTL] WHERE SNO = @SNO)
    BEGIN
        SELECT 'Error' AS STATUS, 'Purchase Quotation Conversation not found.' AS MESSAGE, '' AS DATA;
        RETURN;
    END

    SELECT
        C.SNO ID,
        C.SNO,
        C.PURCHASE_QUOTATION_NO,
        C.RESPONSE_EMP_ID,
        NULLIF(LTRIM(RTRIM(CONCAT(E.FIRST_NAME, ' ', E.MIDDLE_NAME, ' ', E.LAST_NAME)), ''), '') AS RESPONSE_EMP_NAME,
        C.DISCUSSION_DETAILS,
        C.RESPONSE_STATUS,
        C.STATUS_ENTRY,
        C.REMARKS,
        CONVERT(VARCHAR(30), C.CREATED_DATE, 120) AS CREATED_DATE,
        CONVERT(VARCHAR(30), C.MODIFIED_DATE, 120) AS MODIFIED_DATE,
        C.CREATED_BY,
        C.CREATED_MAC_ADDRESS,
        C.MODIFIED_BY,
        C.MODIFIED_MAC_ADDRESS
    FROM [VPurchase].[TBL_PURCHASE_QUOTATION_CONVERSATION_DTL] C
    LEFT JOIN [VPayEntries].[NEW_EMPLOYEE_DATABASE] E ON E.EMP_ID = C.RESPONSE_EMP_ID
    WHERE C.SNO = @SNO;
END
GO

/* ------------------------------------------------------------------
   4) UPDATE_PURCHASE_QUOTATION_CONVERSATION_DTL
   ------------------------------------------------------------------ */
CREATE OR ALTER PROCEDURE [VPurchase].[UPDATE_PURCHASE_QUOTATION_CONVERSATION_DTL]
(
    @SNO                        INT,
    @PURCHASE_QUOTATION_NO      VARCHAR(50),
    @RESPONSE_EMP_ID            INT          = NULL,
    @DISCUSSION_DETAILS         VARCHAR(MAX) = NULL,
    @RESPONSE_STATUS            VARCHAR(50)  = NULL,
    @STATUS_ENTRY               VARCHAR(50),
    @REMARKS                    VARCHAR(50)  = NULL,
    @USER                       VARCHAR(50),
    @MAC_ADDRESS                VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    IF @SNO IS NULL OR @SNO <= 0
    BEGIN
        SELECT 'Error' AS STATUS, 'A valid conversation SNO is required.' AS MESSAGE, '' AS DATA;
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM [VPurchase].[TBL_PURCHASE_QUOTATION_CONVERSATION_DTL] WHERE SNO = @SNO)
    BEGIN
        SELECT 'Error' AS STATUS, 'Purchase Quotation Conversation not found.' AS MESSAGE, '' AS DATA;
        RETURN;
    END

    /* A conversation belongs to the quotation it was raised under. */
    IF EXISTS (
        SELECT 1 FROM [VPurchase].[TBL_PURCHASE_QUOTATION_CONVERSATION_DTL]
        WHERE SNO = @SNO AND PURCHASE_QUOTATION_NO <> @PURCHASE_QUOTATION_NO
    )
    BEGIN
        SELECT 'Error' AS STATUS, 'Conversation cannot be moved to a different purchase quotation.' AS MESSAGE, '' AS DATA;
        RETURN;
    END

    UPDATE [VPurchase].[TBL_PURCHASE_QUOTATION_CONVERSATION_DTL]
    SET
        /* Every optional field is kept as is when the caller sends NULL, so a
           partial edit cannot silently blank a stored value. An empty string
           is still honoured, which is how a field is cleared on purpose. */
        RESPONSE_EMP_ID         = COALESCE(@RESPONSE_EMP_ID, RESPONSE_EMP_ID),
        DISCUSSION_DETAILS      = COALESCE(@DISCUSSION_DETAILS, DISCUSSION_DETAILS),
        RESPONSE_STATUS         = COALESCE(@RESPONSE_STATUS, RESPONSE_STATUS),
        STATUS_ENTRY            = COALESCE(NULLIF(LTRIM(RTRIM(@STATUS_ENTRY)), ''), STATUS_ENTRY),
        REMARKS                 = COALESCE(@REMARKS, REMARKS),
        MODIFIED_BY             = @USER,
        MODIFIED_DATE           = GETDATE(),
        MODIFIED_MAC_ADDRESS    = @MAC_ADDRESS
    WHERE SNO = @SNO;

    SELECT '' AS STATUS, 'Data Updated Successfully' AS MESSAGE, CAST(@SNO AS VARCHAR(50)) AS DATA;
END
GO

/* ------------------------------------------------------------------
   5) DELETE_PURCHASE_QUOTATION_CONVERSATION_DTL
   ------------------------------------------------------------------ */
CREATE OR ALTER PROCEDURE [VPurchase].[DELETE_PURCHASE_QUOTATION_CONVERSATION_DTL]
(
    @SNO         INT,
    @USER        VARCHAR(50),
    @ROLE        VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    /* NULL ROLE makes "@ROLE <> 'Admin'" UNKNOWN, which falls straight
       through to the DELETE. ISNULL closes that hole. */
    IF ISNULL(LTRIM(RTRIM(@ROLE)), '') <> 'Admin'
    BEGIN
        SELECT 'Error' AS STATUS, 'No Rights To Delete' AS MESSAGE, '' AS DATA;
        RETURN;
    END

    IF @SNO IS NULL OR @SNO <= 0
    BEGIN
        SELECT 'Error' AS STATUS, 'A valid conversation SNO is required.' AS MESSAGE, '' AS DATA;
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM [VPurchase].[TBL_PURCHASE_QUOTATION_CONVERSATION_DTL] WHERE SNO = @SNO)
    BEGIN
        SELECT 'Error' AS STATUS, 'Purchase Quotation Conversation not found.' AS MESSAGE, '' AS DATA;
        RETURN;
    END

    DELETE FROM [VPurchase].[TBL_PURCHASE_QUOTATION_CONVERSATION_DTL]
    WHERE SNO = @SNO;

    SELECT '' AS STATUS, 'Data Deleted Successfully' AS MESSAGE, CAST(@SNO AS VARCHAR(50)) AS DATA;
END
GO
