/* ============================================================================
   Company - Branch Mapping   ->   [VMaster].[TBL_COMPANY_BRANCH_MAPPING]
   ----------------------------------------------------------------------------
   Table shape (10 columns, nothing else exists on this table):
     MAPPING_ID            int identity  PK
     COMPANY_ID            int NOT NULL  FK -> TBL_COMPANY_MASTER     (UK pair)
     BRANCH_ID             int NOT NULL  FK -> TBL_BRANCH_Master     (UK pair)
     STATUS_MASTER         varchar(20)   AC | IA
     CREATED_BY/_DATE/_MAC_ADDRESS
     MODIFIED_BY/_DATE/_MAC_ADDRESS
   Constraints:  PK_MAPPING_ID_COMP_BRANCH, UK_COMP_BRANCH_MAP (COMPANY_ID, BRANCH_ID)

   Conventions this script follows (they differ from the original draft):
   - STATUS_MASTER is AC | IA, NOT 'ACTIVE'. The sibling mapping tables
     (TBL_COMPANY_CAMP_STORE_MAPPING etc.) store AC/IA, so writing 'ACTIVE'
     here produced rows that no AC/IA read filter could ever return.
     The full words ACTIVE/INACTIVE are still accepted on input and normalised.
   - Every write returns one row:  (STATUS, MESSAGE, DATA).
     STATUS 'ERROR' (or any error-ish word) makes the API raise a 400 with
     MESSAGE, matching parseSprocResult() in back-end/src/utils/sprocResult.ts.
     A success message must not contain the words already/duplicate/exist/
     not found/fail/error/invalid/denied/cannot.
   - Read procedures translate AC -> ACTIVE / IA -> INACTIVE in STATUS_MASTER
     and also expose the raw value as STATUS_CODE, matching SHOW_COMPANY_
     DEPARTMENT_DESIGNATION_MAPPING so the shared grid components work as-is.
   - The masters are LEFT JOINed: an INNER JOIN silently hides a mapping whose
     company or branch row is missing, which is exactly the row an admin needs
     to see in order to fix it.
   ============================================================================ */
GO
/* ---------------------------------------------------------------------------
   1. SAVE (INSERT)
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [VMaster].[SP_COMPANY_BRANCH_MAPPING_SAVE]
(
    @COMPANY_ID           INT,
    @BRANCH_ID            INT,
    @STATUS_MASTER        VARCHAR(20) = 'AC',
    @CREATED_BY           VARCHAR(50),
    @CREATED_MAC_ADDRESS  VARCHAR(50),
    @NEW_MAPPING_ID       INT OUTPUT
)
AS
BEGIN
    SET NOCOUNT ON;
    SET @NEW_MAPPING_ID = NULL;

    DECLARE @STATUS VARCHAR(20) =
        CASE
            WHEN UPPER(LTRIM(RTRIM(ISNULL(@STATUS_MASTER, '')))) IN ('AC', 'ACTIVE') THEN 'AC'
            WHEN UPPER(LTRIM(RTRIM(ISNULL(@STATUS_MASTER, '')))) IN ('IA', 'IN', 'INACTIVE') THEN 'IA'
            ELSE NULL
        END;

    BEGIN TRY
        IF @COMPANY_ID IS NULL
        BEGIN
            SELECT 'ERROR', 'COMPANY IS REQUIRED', NULL;
            RETURN;
        END

        IF @BRANCH_ID IS NULL
        BEGIN
            SELECT 'ERROR', 'BRANCH IS REQUIRED', NULL;
            RETURN;
        END

        IF @STATUS IS NULL
        BEGIN
            SELECT 'ERROR', 'STATUS MUST BE AC OR IA', NULL;
            RETURN;
        END

        /* Checked up front so the caller gets a readable message instead of a
           raw FK violation (error 547) bubbling out as HTTP 500. */
        IF NOT EXISTS (SELECT 1 FROM [VMaster].[TBL_COMPANY_MASTER] WHERE [COMPANY_ID] = @COMPANY_ID)
        BEGIN
            SELECT 'ERROR', 'SELECTED COMPANY IS NOT AVAILABLE', NULL;
            RETURN;
        END

        IF NOT EXISTS (SELECT 1 FROM [VMaster].[TBL_BRANCH_Master] WHERE [BRANCH_ID] = @BRANCH_ID)
        BEGIN
            SELECT 'ERROR', 'SELECTED BRANCH IS NOT AVAILABLE', NULL;
            RETURN;
        END

        /* Guards UK_COMP_BRANCH_MAP, which would otherwise raise error 2601. */
        IF EXISTS (
            SELECT 1 FROM [VMaster].[TBL_COMPANY_BRANCH_MAPPING]
            WHERE [COMPANY_ID] = @COMPANY_ID AND [BRANCH_ID] = @BRANCH_ID
        )
        BEGIN
            SELECT 'ERROR', 'THIS COMPANY AND BRANCH ARE ALREADY MAPPED', NULL;
            RETURN;
        END

        /* OUTPUT INSERTED avoids the deprecated SCOPE_IDENTITY(). The INTO
           target has to be a *table* variable (a scalar variable is rejected
           with "Must declare the table variable"), so the id is captured here
           and then handed back through the output parameter. */
        DECLARE @ID TABLE ([MAPPING_ID] INT);

        INSERT INTO [VMaster].[TBL_COMPANY_BRANCH_MAPPING]
        (
            [COMPANY_ID],
            [BRANCH_ID],
            [STATUS_MASTER],
            [CREATED_BY],
            [CREATED_DATE],
            [CREATED_MAC_ADDRESS]
        )
        OUTPUT INSERTED.[MAPPING_ID] INTO @ID
        VALUES
        (
            @COMPANY_ID,
            @BRANCH_ID,
            @STATUS,
            @CREATED_BY,
            GETDATE(),
            @CREATED_MAC_ADDRESS
        );

        SET @NEW_MAPPING_ID = (SELECT [MAPPING_ID] FROM @ID);

        SELECT '' AS STATUS, 'Mapping Saved Successfully' AS MESSAGE, @NEW_MAPPING_ID AS DATA;
    END TRY
    BEGIN CATCH
        SELECT 'ERROR', ERROR_MESSAGE(), NULL;
    END CATCH
END
GO
/* ---------------------------------------------------------------------------
   2. UPDATE
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [VMaster].[SP_COMPANY_BRANCH_MAPPING_UPDATE]
(
    @MAPPING_ID            INT,
    @COMPANY_ID            INT,
    @BRANCH_ID             INT,
    @STATUS_MASTER         VARCHAR(20),
    @MODIFIED_BY           VARCHAR(50),
    @MODIFIED_MAC_ADDRESS  VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @STATUS VARCHAR(20) =
        CASE
            WHEN UPPER(LTRIM(RTRIM(ISNULL(@STATUS_MASTER, '')))) IN ('AC', 'ACTIVE') THEN 'AC'
            WHEN UPPER(LTRIM(RTRIM(ISNULL(@STATUS_MASTER, '')))) IN ('IA', 'IN', 'INACTIVE') THEN 'IA'
            ELSE NULL
        END;

    BEGIN TRY
        /* Without this the statement matched 0 rows and the API reported
           success for a mapping that was never there. */
        IF @MAPPING_ID IS NULL OR NOT EXISTS (
            SELECT 1 FROM [VMaster].[TBL_COMPANY_BRANCH_MAPPING] WHERE [MAPPING_ID] = @MAPPING_ID
        )
        BEGIN
            SELECT 'ERROR', 'MAPPING RECORD NOT FOUND', NULL;
            RETURN;
        END

        IF @COMPANY_ID IS NULL
        BEGIN
            SELECT 'ERROR', 'COMPANY IS REQUIRED', NULL;
            RETURN;
        END

        IF @BRANCH_ID IS NULL
        BEGIN
            SELECT 'ERROR', 'BRANCH IS REQUIRED', NULL;
            RETURN;
        END

        IF @STATUS IS NULL
        BEGIN
            SELECT 'ERROR', 'STATUS MUST BE AC OR IA', NULL;
            RETURN;
        END

        IF NOT EXISTS (SELECT 1 FROM [VMaster].[TBL_COMPANY_MASTER] WHERE [COMPANY_ID] = @COMPANY_ID)
        BEGIN
            SELECT 'ERROR', 'SELECTED COMPANY IS NOT AVAILABLE', NULL;
            RETURN;
        END

        IF NOT EXISTS (SELECT 1 FROM [VMaster].[TBL_BRANCH_Master] WHERE [BRANCH_ID] = @BRANCH_ID)
        BEGIN
            SELECT 'ERROR', 'SELECTED BRANCH IS NOT AVAILABLE', NULL;
            RETURN;
        END

        /* Same pair already owned by a different mapping. */
        IF EXISTS (
            SELECT 1 FROM [VMaster].[TBL_COMPANY_BRANCH_MAPPING]
            WHERE [COMPANY_ID] = @COMPANY_ID
              AND [BRANCH_ID] = @BRANCH_ID
              AND [MAPPING_ID] <> @MAPPING_ID
        )
        BEGIN
            SELECT 'ERROR', 'THIS COMPANY AND BRANCH ARE ALREADY MAPPED', NULL;
            RETURN;
        END

        UPDATE [VMaster].[TBL_COMPANY_BRANCH_MAPPING]
        SET
            [COMPANY_ID] = @COMPANY_ID,
            [BRANCH_ID] = @BRANCH_ID,
            [STATUS_MASTER] = @STATUS,
            [MODIFIED_BY] = @MODIFIED_BY,
            [MODIFIED_DATE] = GETDATE(),
            [MODIFIED_MAC_ADDRESS] = @MODIFIED_MAC_ADDRESS
        WHERE [MAPPING_ID] = @MAPPING_ID;

        SELECT '' AS STATUS, 'Mapping Updated Successfully' AS MESSAGE, @MAPPING_ID AS DATA;
    END TRY
    BEGIN CATCH
        SELECT 'ERROR', ERROR_MESSAGE(), NULL;
    END CATCH
END
GO
/* ---------------------------------------------------------------------------
   3. DELETE
   No child table references this mapping, so a hard delete cannot orphan
   anything; the schema carries no delete-audit column, so @USER/@MAC_ADDRESS
   are accepted and echoed for the caller's own audit log.
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [VMaster].[SP_COMPANY_BRANCH_MAPPING_DELETE]
(
    @MAPPING_ID  INT,
    @USER        VARCHAR(50) = NULL,
    @ROLE        VARCHAR(50) = NULL,
    @MAC_ADDRESS VARCHAR(50) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        /* The role names below are the same set the grid treats as admin, so
           the button is never shown to a caller the procedure would reject. */
        IF @ROLE IS NOT NULL
           AND LTRIM(RTRIM(@ROLE)) NOT IN ('Admin', 'Super Admin', 'Administrator')
        BEGIN
            SELECT 'ERROR', 'NO RIGHTS TO DELETE THIS RECORD', NULL;
            RETURN;
        END

        IF @MAPPING_ID IS NULL OR NOT EXISTS (
            SELECT 1 FROM [VMaster].[TBL_COMPANY_BRANCH_MAPPING] WHERE [MAPPING_ID] = @MAPPING_ID
        )
        BEGIN
            SELECT 'ERROR', 'MAPPING RECORD NOT FOUND', NULL;
            RETURN;
        END

        DELETE FROM [VMaster].[TBL_COMPANY_BRANCH_MAPPING]
        WHERE [MAPPING_ID] = @MAPPING_ID;

        SELECT '' AS STATUS, 'Mapping Deleted Successfully' AS MESSAGE, @MAPPING_ID AS DATA;
    END TRY
    BEGIN CATCH
        SELECT 'ERROR', ERROR_MESSAGE(), NULL;
    END CATCH
END
GO
/* ---------------------------------------------------------------------------
   4. GET BY ID
   Returns an empty resultset when the row is missing, which the controller
   turns into a 404 rather than a 400.
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [VMaster].[SP_COMPANY_BRANCH_MAPPING_GET_BY_ID]
(
    @MAPPING_ID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        MAP.[MAPPING_ID],
        MAP.[COMPANY_ID],
        COMP.[COMPANY_NAME],
        COMP.[COMPANY_FULL_NAME],
        MAP.[BRANCH_ID],
        BRANCH.[BRANCH_NAME],
        BRANCH.[BRANCH_DESCRIPTION],
        MAP.[STATUS_MASTER] AS STATUS_CODE,
        CASE WHEN MAP.[STATUS_MASTER] = 'AC' THEN 'ACTIVE' ELSE 'INACTIVE' END AS STATUS_MASTER,
        MAP.[CREATED_BY],
        MAP.[CREATED_DATE],
        MAP.[CREATED_MAC_ADDRESS],
        MAP.[MODIFIED_BY],
        MAP.[MODIFIED_DATE],
        MAP.[MODIFIED_MAC_ADDRESS]
    FROM [VMaster].[TBL_COMPANY_BRANCH_MAPPING] MAP
    LEFT JOIN [VMaster].[TBL_COMPANY_MASTER] COMP ON MAP.[COMPANY_ID] = COMP.[COMPANY_ID]
    LEFT JOIN [VMaster].[TBL_BRANCH_Master] BRANCH ON MAP.[BRANCH_ID] = BRANCH.[BRANCH_ID]
    WHERE MAP.[MAPPING_ID] = @MAPPING_ID;
END
GO
/* ---------------------------------------------------------------------------
   5. SHOW
   @STATUS and @MAPPING_ID are both optional and combine, so the same procedure
   serves the status-filtered list, the unfiltered list (@STATUS = 'ALL') and a
   single-row fetch.
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [VMaster].[SP_COMPANY_BRANCH_MAPPING_SHOW]
(
    @STATUS     VARCHAR(20) = 'ALL',
    @MAPPING_ID INT = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        MAP.[MAPPING_ID],
        MAP.[COMPANY_ID],
        COMP.[COMPANY_NAME],
        COMP.[COMPANY_FULL_NAME],
        COMP.[TIN_NUMBER],
        COMP.[VRN_NUMBER],
        MAP.[BRANCH_ID],
        BRANCH.[BRANCH_NAME],
        BRANCH.[BRANCH_DESCRIPTION],
        MAP.[STATUS_MASTER] AS STATUS_CODE,
        CASE WHEN MAP.[STATUS_MASTER] = 'AC' THEN 'ACTIVE' ELSE 'INACTIVE' END AS STATUS_MASTER,
        MAP.[CREATED_BY],
        MAP.[CREATED_DATE],
        MAP.[CREATED_MAC_ADDRESS],
        MAP.[MODIFIED_BY],
        MAP.[MODIFIED_DATE],
        MAP.[MODIFIED_MAC_ADDRESS]
    FROM [VMaster].[TBL_COMPANY_BRANCH_MAPPING] MAP
    LEFT JOIN [VMaster].[TBL_COMPANY_MASTER] COMP ON MAP.[COMPANY_ID] = COMP.[COMPANY_ID]
    LEFT JOIN [VMaster].[TBL_BRANCH_Master] BRANCH ON MAP.[BRANCH_ID] = BRANCH.[BRANCH_ID]
    WHERE
        (
            @MAPPING_ID IS NULL
            OR MAP.[MAPPING_ID] = @MAPPING_ID
        )
        AND
        (
            @STATUS IS NULL
            OR UPPER(LTRIM(RTRIM(@STATUS))) = 'ALL'
            OR MAP.[STATUS_MASTER] = UPPER(LTRIM(RTRIM(@STATUS)))
        )
    ORDER BY MAP.[MAPPING_ID] DESC;
END
GO
/* ---------------------------------------------------------------------------
   6. LOAD BY COMPANY / BRANCH
   Pass NULL for either filter to ignore it. @STATUS = 'ALL' returns both.
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [VMaster].[SP_COMPANY_BRANCH_MAPPING_LOAD_BY_IDS]
(
    @COMPANY_ID INT = NULL,
    @BRANCH_ID  INT = NULL,
    @STATUS     VARCHAR(20) = 'ALL'
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        MAP.[MAPPING_ID],
        MAP.[COMPANY_ID],
        COMP.[COMPANY_NAME],
        COMP.[COMPANY_FULL_NAME],
        MAP.[BRANCH_ID],
        BRANCH.[BRANCH_NAME],
        BRANCH.[BRANCH_DESCRIPTION],
        MAP.[STATUS_MASTER] AS STATUS_CODE,
        CASE WHEN MAP.[STATUS_MASTER] = 'AC' THEN 'ACTIVE' ELSE 'INACTIVE' END AS STATUS_MASTER,
        MAP.[CREATED_BY],
        MAP.[CREATED_DATE],
        MAP.[CREATED_MAC_ADDRESS],
        MAP.[MODIFIED_BY],
        MAP.[MODIFIED_DATE],
        MAP.[MODIFIED_MAC_ADDRESS]
    FROM [VMaster].[TBL_COMPANY_BRANCH_MAPPING] MAP
    LEFT JOIN [VMaster].[TBL_COMPANY_MASTER] COMP ON MAP.[COMPANY_ID] = COMP.[COMPANY_ID]
    LEFT JOIN [VMaster].[TBL_BRANCH_Master] BRANCH ON MAP.[BRANCH_ID] = BRANCH.[BRANCH_ID]
    WHERE
        (@COMPANY_ID IS NULL OR MAP.[COMPANY_ID] = @COMPANY_ID)
        AND (@BRANCH_ID IS NULL OR MAP.[BRANCH_ID] = @BRANCH_ID)
        AND
        (
            @STATUS IS NULL
            OR UPPER(LTRIM(RTRIM(@STATUS))) = 'ALL'
            OR MAP.[STATUS_MASTER] = UPPER(LTRIM(RTRIM(@STATUS)))
        )
    ORDER BY MAP.[MAPPING_ID] DESC;
END
GO
