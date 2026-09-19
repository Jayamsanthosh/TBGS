-- =====================================================================
-- Report Master
-- Keeps the mapping Report Name <-> Stored Procedure (the dashboard calls
-- the SP whose name is listed here, so new reports can be added from the
-- front end without re-deploying code).
-- Safe to re-run: idempotent table creation, CREATE OR ALTER SPs.
-- Registered report SPs are expected to follow the standard contract:
--   @RequestType, @Status, @FromDate, @ToDate, @CompanyId, @StoreId,
--   @CampId, @DepartmentId, @Search, @Page, @PageSize
-- and to return a single full result set (legacy) or "Total" + page rows.
-- =====================================================================

IF OBJECT_ID('VReport.TBL_REPORT_MASTER', 'U') IS NULL
BEGIN
    CREATE TABLE VReport.TBL_REPORT_MASTER
    (
        REPORT_ID           INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_TBL_REPORT_MASTER PRIMARY KEY,
        REPORT_NAME         VARCHAR(150) NOT NULL,
        PROCEDURE_NAME      VARCHAR(200) NOT NULL,
        REMARKS             VARCHAR(500) NULL,
        STATUS_MASTER       VARCHAR(20)  NULL,
        CREATED_BY          VARCHAR(50)  NULL,
        CREATED_DATE        DATETIME     NULL,
        CREATED_MAC_ADDRESS VARCHAR(50)  NULL,
        MODIFIED_BY         VARCHAR(50)  NULL,
        MODIFIED_DATE       DATETIME     NULL,
        MODIFIED_MAC_ADDRESS VARCHAR(50) NULL
    );
    CREATE UNIQUE INDEX UX_TBL_REPORT_MASTER_NAME
        ON VReport.TBL_REPORT_MASTER (REPORT_NAME);
END
GO

IF NOT EXISTS (SELECT 1 FROM VReport.TBL_REPORT_MASTER WHERE REPORT_NAME = 'Attendance Request')
INSERT INTO VReport.TBL_REPORT_MASTER (REPORT_NAME, PROCEDURE_NAME, REMARKS, STATUS_MASTER, CREATED_BY, CREATED_DATE, CREATED_MAC_ADDRESS)
VALUES ('Attendance Request', 'VRequest.GET_REQUEST_LIST_BY_TYPE', 'Attendance approval requests list', 'AC', 'System', GETDATE(), 'WEB');
GO

IF NOT EXISTS (SELECT 1 FROM VReport.TBL_REPORT_MASTER WHERE REPORT_NAME = 'Cash Advance Request')
INSERT INTO VReport.TBL_REPORT_MASTER (REPORT_NAME, PROCEDURE_NAME, REMARKS, STATUS_MASTER, CREATED_BY, CREATED_DATE, CREATED_MAC_ADDRESS)
VALUES ('Cash Advance Request', 'VRequest.GET_REQUEST_LIST_BY_TYPE', 'Cash advance approval requests list', 'AC', 'System', GETDATE(), 'WEB');
GO

IF NOT EXISTS (SELECT 1 FROM VReport.TBL_REPORT_MASTER WHERE REPORT_NAME = 'Arrears Request')
INSERT INTO VReport.TBL_REPORT_MASTER (REPORT_NAME, PROCEDURE_NAME, REMARKS, STATUS_MASTER, CREATED_BY, CREATED_DATE, CREATED_MAC_ADDRESS)
VALUES ('Arrears Request', 'VRequest.GET_REQUEST_LIST_BY_TYPE', 'Arrears approval requests list', 'AC', 'System', GETDATE(), 'WEB');
GO

IF NOT EXISTS (SELECT 1 FROM VReport.TBL_REPORT_MASTER WHERE REPORT_NAME = 'Overtime Request')
INSERT INTO VReport.TBL_REPORT_MASTER (REPORT_NAME, PROCEDURE_NAME, REMARKS, STATUS_MASTER, CREATED_BY, CREATED_DATE, CREATED_MAC_ADDRESS)
VALUES ('Overtime Request', 'VRequest.GET_REQUEST_LIST_BY_TYPE', 'Overtime approval requests list', 'AC', 'System', GETDATE(), 'WEB');
GO

-- ===================== SAVE =====================
CREATE OR ALTER PROCEDURE [VReport].[SAVE_REPORT_MASTER]
(
    @REPORT_ID INT,
    @REPORT_NAME VARCHAR(150),
    @PROCEDURE_NAME VARCHAR(200),
    @REMARKS VARCHAR(500),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF @REPORT_NAME IS NULL OR LTRIM(RTRIM(@REPORT_NAME)) = ''
    BEGIN
        SELECT 'error', 'Report Name is required', '';
        RETURN;
    END

    IF @PROCEDURE_NAME IS NULL OR LTRIM(RTRIM(@PROCEDURE_NAME)) = ''
    BEGIN
        SELECT 'error', 'Procedure Name is required', '';
        RETURN;
    END

    IF EXISTS
    (
        SELECT 'CHECK'
        FROM [VReport].[TBL_REPORT_MASTER]
        WHERE UPPER(LTRIM(RTRIM(REPORT_NAME))) = UPPER(LTRIM(RTRIM(@REPORT_NAME)))
    )
    BEGIN
        SELECT 'error', 'Report Name Already Exists', '';
    END
    ELSE
    BEGIN
        INSERT INTO [VReport].[TBL_REPORT_MASTER]
        (
            REPORT_NAME,
            PROCEDURE_NAME,
            REMARKS,
            STATUS_MASTER,
            CREATED_BY,
            CREATED_DATE,
            CREATED_MAC_ADDRESS,
            MODIFIED_BY,
            MODIFIED_DATE,
            MODIFIED_MAC_ADDRESS
        )
        VALUES
        (
            LTRIM(RTRIM(@REPORT_NAME)),
            LTRIM(RTRIM(@PROCEDURE_NAME)),
            @REMARKS,
            @STATUS_MASTER,
            @USER,
            GETDATE(),
            @MAC_ADDRESS,
            @USER,
            GETDATE(),
            @MAC_ADDRESS
        );

        DECLARE @lasted_inserted_id INT = SCOPE_IDENTITY();

        SELECT
            '' AS STATUS,
            'Data Saved Successfully' AS MESSAGE,
            @lasted_inserted_id AS DATA;
    END
END
GO

-- ===================== UPDATE =====================
CREATE OR ALTER PROCEDURE [VReport].[UPDATE_REPORT_MASTER]
(
    @REPORT_ID INT,
    @REPORT_NAME VARCHAR(150),
    @PROCEDURE_NAME VARCHAR(200),
    @REMARKS VARCHAR(500),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF @REPORT_ID IS NULL OR @REPORT_ID = 0
    BEGIN
        SELECT 'error', 'Report ID is required', '';
        RETURN;
    END

    IF EXISTS
    (
        SELECT 'CHECK'
        FROM [VReport].[TBL_REPORT_MASTER]
        WHERE UPPER(LTRIM(RTRIM(REPORT_NAME))) = UPPER(LTRIM(RTRIM(@REPORT_NAME)))
          AND REPORT_ID <> @REPORT_ID
    )
    BEGIN
        SELECT 'error', 'Report Name Already Exists', '';
    END
    ELSE
    BEGIN
        UPDATE [VReport].[TBL_REPORT_MASTER]
        SET
            REPORT_NAME = LTRIM(RTRIM(@REPORT_NAME)),
            PROCEDURE_NAME = LTRIM(RTRIM(@PROCEDURE_NAME)),
            REMARKS = @REMARKS,
            STATUS_MASTER = @STATUS_MASTER,
            MODIFIED_BY = @USER,
            MODIFIED_DATE = GETDATE(),
            MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
        WHERE REPORT_ID = @REPORT_ID;

        SELECT
            '',
            'Data Updated Successfully',
            @REPORT_ID;
    END
END
GO

-- ===================== DELETE =====================
CREATE OR ALTER PROCEDURE [VReport].[DELETE_REPORT_MASTER]
(
    @REPORT_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF @ROLE <> 'Admin'
    BEGIN
        SELECT
            'error',
            'No Rights To Delete',
            '';
    END
    ELSE
    BEGIN
        DELETE FROM [VReport].[TBL_REPORT_MASTER]
        WHERE REPORT_ID = @REPORT_ID;

        SELECT
            '',
            'Data Deleted Successfully',
            @REPORT_ID;
    END
END
GO

-- ===================== GET =====================
CREATE OR ALTER PROCEDURE [VReport].[GET_REPORT_MASTER]
(
    @REPORT_ID INT
)
AS
BEGIN
    SET NOCOUNT ON

    SELECT
        [REPORT_ID],
        [REPORT_NAME],
        [PROCEDURE_NAME],
        [REMARKS],
        [STATUS_MASTER],
        [CREATED_BY]
    FROM [VReport].[TBL_REPORT_MASTER]
    WHERE REPORT_ID = @REPORT_ID;
END
GO

-- ===================== SHOW =====================
-- @STATUS = 'ALL' / '' / NULL  ->  every record
-- @STATUS = 'ACTIVE' / 'AC' / 'INACTIVE' / 'IN'  ->  filtered
CREATE OR ALTER PROCEDURE [VReport].[SHOW_REPORT_MASTER]
(
    @STATUS VARCHAR(10)
)
AS
BEGIN
    SET NOCOUNT ON

    SELECT
        a.[REPORT_ID],
        a.[REPORT_NAME],
        a.[PROCEDURE_NAME],
        a.[REMARKS],
        a.[STATUS_MASTER],
        a.[CREATED_BY]
    FROM [VReport].[TBL_REPORT_MASTER] a
    WHERE (@STATUS = '' OR @STATUS IS NULL OR UPPER(@STATUS) = 'ALL'
        OR (
            UPPER(@STATUS) IN ('AC', 'ACTIVE')
            AND UPPER(LEFT(ISNULL(a.STATUS_MASTER, ''), 2)) IN ('AC', 'ACT')
        )
        OR (
            UPPER(@STATUS) IN ('IN', 'INACTIVE')
            AND UPPER(LEFT(ISNULL(a.STATUS_MASTER, ''), 2)) IN ('IN', 'INA')
        ))
    ORDER BY a.REPORT_ID
END
GO