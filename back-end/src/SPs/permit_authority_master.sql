-- =====================================================================
-- Permit Authority Master
-- Table + CRUD Stored Procedures (mirrors TBL_LICENSE_PERMIT_TYPE_MASTER pattern)
-- Safe to re-run: uses CREATE OR ALTER / idempotent guards.
-- =====================================================================

IF OBJECT_ID('VMaster.TBL_PERMIT_AUTHORITY_MASTER', 'U') IS NULL
BEGIN
    CREATE TABLE VMASTER.TBL_PERMIT_AUTHORITY_MASTER
    (
        PERMIT_AUTHORITY_ID   INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_TBL_PERMIT_AUTHORITY_MASTER PRIMARY KEY,
        PERMIT_AUTHORITY_NAME VARCHAR(150) NOT NULL,
        COUNTRY_ID            INT NULL
            CONSTRAINT FK_TBL_PERMIT_AUTHORITY_MASTER_COUNTRY
            REFERENCES VMASTER.TBL_COUNTRY_MASTER(COUNTRY_ID),
        CONTACT_PERSON        VARCHAR(100) NULL,
        CONTACT_NUMBER        VARCHAR(50)  NULL,
        EMAIL                 VARCHAR(100) NULL,
        WEBSITE               VARCHAR(200) NULL,
        ADDRESS               VARCHAR(500) NULL,
        REMARKS               VARCHAR(100) NULL,
        STATUS_MASTER         VARCHAR(20)  NULL,
        CREATED_BY            VARCHAR(50)  NULL,
        CREATED_DATE          DATETIME     NULL,
        CREATED_MAC_ADDRESS   VARCHAR(50)  NULL,
        MODIFIED_BY           VARCHAR(50)  NULL,
        MODIFIED_DATE         DATETIME     NULL,
        MODIFIED_MAC_ADDRESS  VARCHAR(50)  NULL
    );
END
GO

-- ===================== SAVE =====================
CREATE OR ALTER PROCEDURE [VMASTER].[SAVE_PERMIT_AUTHORITY_MASTER]
(
    @PERMIT_AUTHORITY_ID INT,
    @PERMIT_AUTHORITY_NAME VARCHAR(150),
    @COUNTRY_ID INT,
    @CONTACT_PERSON VARCHAR(100),
    @CONTACT_NUMBER VARCHAR(50),
    @EMAIL VARCHAR(100),
    @WEBSITE VARCHAR(200),
    @ADDRESS VARCHAR(500),
    @REMARKS VARCHAR(100),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS   (
        SELECT 'CHECK'
        FROM [VMaster].[TBL_PERMIT_AUTHORITY_MASTER]
        WHERE PERMIT_AUTHORITY_NAME = @PERMIT_AUTHORITY_NAME
    )
    BEGIN
        SELECT 'error', 'Permit Authority Name Already Exists', ''
    END
    ELSE
    BEGIN
        INSERT INTO [VMaster].[TBL_PERMIT_AUTHORITY_MASTER]
        (
            PERMIT_AUTHORITY_NAME,
            COUNTRY_ID,
            CONTACT_PERSON,
            CONTACT_NUMBER,
            EMAIL,
            WEBSITE,
            ADDRESS,
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
            @PERMIT_AUTHORITY_NAME,
            @COUNTRY_ID,
            @CONTACT_PERSON,
            @CONTACT_NUMBER,
            @EMAIL,
            @WEBSITE,
            @ADDRESS,
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
CREATE OR ALTER PROCEDURE [VMASTER].[UPDATE_PERMIT_AUTHORITY_MASTER]
(
    @PERMIT_AUTHORITY_ID INT,
    @PERMIT_AUTHORITY_NAME VARCHAR(150),
    @COUNTRY_ID INT,
    @CONTACT_PERSON VARCHAR(100),
    @CONTACT_NUMBER VARCHAR(50),
    @EMAIL VARCHAR(100),
    @WEBSITE VARCHAR(200),
    @ADDRESS VARCHAR(500),
    @REMARKS VARCHAR(100),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS
    (
        SELECT 'CHECK'
        FROM [VMaster].[TBL_PERMIT_AUTHORITY_MASTER]
        WHERE PERMIT_AUTHORITY_NAME = @PERMIT_AUTHORITY_NAME
          AND PERMIT_AUTHORITY_ID <> @PERMIT_AUTHORITY_ID
    )
    BEGIN
        SELECT 'error', 'Permit Authority Name Already Exists', ''
    END
    ELSE
    BEGIN
        UPDATE [VMaster].[TBL_PERMIT_AUTHORITY_MASTER]
        SET
            PERMIT_AUTHORITY_NAME = @PERMIT_AUTHORITY_NAME,
            COUNTRY_ID = @COUNTRY_ID,
            CONTACT_PERSON = @CONTACT_PERSON,
            CONTACT_NUMBER = @CONTACT_NUMBER,
            EMAIL = @EMAIL,
            WEBSITE = @WEBSITE,
            ADDRESS = @ADDRESS,
            REMARKS = @REMARKS,
            STATUS_MASTER = @STATUS_MASTER,
            MODIFIED_BY = @USER,
            MODIFIED_DATE = GETDATE(),
            MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
        WHERE PERMIT_AUTHORITY_ID = @PERMIT_AUTHORITY_ID;

        SELECT
            '',
            'Data Updated Successfully',
            @PERMIT_AUTHORITY_ID;
    END
END
GO

-- ===================== DELETE =====================
CREATE OR ALTER PROCEDURE [VMASTER].[DELETE_PERMIT_AUTHORITY_MASTER]
(
    @PERMIT_AUTHORITY_ID INT,
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
        DELETE FROM [VMaster].[TBL_PERMIT_AUTHORITY_MASTER]
        WHERE PERMIT_AUTHORITY_ID = @PERMIT_AUTHORITY_ID;

        SELECT
            '',
            'Data Deleted Successfully',
            @PERMIT_AUTHORITY_ID;
    END
END
GO

-- ===================== GET =====================
CREATE OR ALTER PROCEDURE [VMASTER].[GET_PERMIT_AUTHORITY_MASTER]
(
  @PERMIT_AUTHORITY_ID INT
)
AS
BEGIN
    SET NOCOUNT ON

    SELECT
        [PERMIT_AUTHORITY_ID],
        [PERMIT_AUTHORITY_NAME],
        [COUNTRY_ID],
        [CONTACT_PERSON],
        [CONTACT_NUMBER],
        [EMAIL],
        [WEBSITE],
        [ADDRESS],
        [REMARKS],
        [STATUS_MASTER],
        [CREATED_BY]
    FROM [VMaster].[TBL_PERMIT_AUTHORITY_MASTER]
    WHERE PERMIT_AUTHORITY_ID = @PERMIT_AUTHORITY_ID;
END
GO

-- ===================== SHOW =====================
-- @STATUS = 'ALL' / '' / NULL  ->  every record
-- @STATUS = 'ACTIVE' / 'AC' / 'INACTIVE' / 'IN'  ->  filtered
CREATE OR ALTER PROCEDURE [VMASTER].[SHOW_PERMIT_AUTHORITY_MASTER]
(
 @STATUS VARCHAR(10)
)
AS
BEGIN
    SET NOCOUNT ON

    SELECT
        a.[PERMIT_AUTHORITY_ID],
        a.[PERMIT_AUTHORITY_NAME],
        a.[COUNTRY_ID],
        c.COUNTRY_NAME,
        a.[CONTACT_PERSON],
        a.[CONTACT_NUMBER],
        a.[EMAIL],
        a.[WEBSITE],
        a.[ADDRESS],
        a.[REMARKS],
        a.[STATUS_MASTER]
    FROM [VMaster].[TBL_PERMIT_AUTHORITY_MASTER] a
    LEFT JOIN VMASTER.TBL_COUNTRY_MASTER c ON a.COUNTRY_ID = c.COUNTRY_ID
    WHERE (@STATUS = '' OR @STATUS IS NULL OR UPPER(@STATUS) = 'ALL'
        OR UPPER(a.STATUS_MASTER) = UPPER(@STATUS)
        OR (UPPER(a.STATUS_MASTER) = 'ACTIVE'   AND UPPER(@STATUS) = 'AC')
        OR (UPPER(a.STATUS_MASTER) = 'INACTIVE' AND UPPER(@STATUS) = 'IN'))
    ORDER BY a.PERMIT_AUTHORITY_ID
END
GO