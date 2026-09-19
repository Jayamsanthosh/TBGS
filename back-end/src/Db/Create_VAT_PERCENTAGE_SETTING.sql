-- ============================================================
-- RUN THIS SCRIPT ON YOUR SQL SERVER DATABASE
-- This creates the missing TBL_VAT_PERCENTAGE_SETTING table
-- and all related stored procedures under VMaster schema
-- ============================================================

-- 1. Create the table
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id 
               WHERE t.name = 'TBL_VAT_PERCENTAGE_SETTING' AND s.name = 'VMaster')
BEGIN
    CREATE TABLE [VMASTER].[TBL_VAT_PERCENTAGE_SETTING](
        [SNO]                    [INT] IDENTITY(1,1) CONSTRAINT PK_VAT_PERC_SETT PRIMARY KEY,
        [VAT_PERCENTAGE]         [DECIMAL](15, 2) NULL,
        [EFFECTIVE_FROM]         [DATETIME] NULL,
        [EFFECTIVE_TO]           [DATETIME] NULL,
        [REMARKS]                [VARCHAR](2000) NULL,
        [STATUS_MASTER]          [VARCHAR](20) NULL,
        [CREATED_BY]             [VARCHAR](50) NULL,
        [CREATED_DATE]           [DATETIME] NULL,
        [CREATED_MAC_ADDRESS]    [VARCHAR](50) NULL,
        [MODIFIED_BY]            [VARCHAR](50) NULL,
        [MODIFIED_DATE]          [DATETIME] NULL,
        [MODIFIED_MAC_ADDRESS]   [VARCHAR](50) NULL,
    )
    PRINT 'Table VMaster.TBL_VAT_PERCENTAGE_SETTING created successfully.'
END
ELSE
    PRINT 'Table VMaster.TBL_VAT_PERCENTAGE_SETTING already exists. Skipping.'
GO

-- 2. Drop existing procedures if they exist (to recreate with correct definition)
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'SHOW_VAT_PERCENTAGE_SETTING' AND schema_id = SCHEMA_ID('VMaster'))
    DROP PROCEDURE [VMaster].[SHOW_VAT_PERCENTAGE_SETTING]
GO

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'GET_VAT_PERCENTAGE_SETTING' AND schema_id = SCHEMA_ID('VMaster'))
    DROP PROCEDURE [VMaster].[GET_VAT_PERCENTAGE_SETTING]
GO

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'SAVE_VAT_PERCENTAGE_SETTING' AND schema_id = SCHEMA_ID('VMaster'))
    DROP PROCEDURE [VMaster].[SAVE_VAT_PERCENTAGE_SETTING]
GO

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'UPDATE_VAT_PERCENTAGE_SETTING' AND schema_id = SCHEMA_ID('VMaster'))
    DROP PROCEDURE [VMaster].[UPDATE_VAT_PERCENTAGE_SETTING]
GO

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'DELETE_VAT_PERCENTAGE_SETTING' AND schema_id = SCHEMA_ID('VMaster'))
    DROP PROCEDURE [VMaster].[DELETE_VAT_PERCENTAGE_SETTING]
GO

-- 3. SHOW_VAT_PERCENTAGE_SETTING
CREATE PROCEDURE [VMaster].[SHOW_VAT_PERCENTAGE_SETTING]
AS 
BEGIN
    SET NOCOUNT ON

    SELECT [SNO]
          ,[VAT_PERCENTAGE]
          ,REPLACE(CONVERT(VARCHAR(50),[EFFECTIVE_FROM],106),' ','-') [EFFECTIVE_FROM] 
          ,REPLACE(CONVERT(VARCHAR(50),[EFFECTIVE_TO],106),' ','-') [EFFECTIVE_TO]
          ,[REMARKS]
          ,Case when A.STATUS_MASTER ='AC' THEN 'ACTIVE' ELSE 'INACTIVE' END [STATUS_MASTER] 
    FROM [VMaster].[TBL_VAT_PERCENTAGE_SETTING] A
    WHERE A.STATUS_MASTER = 'AC'
END
GO

-- 4. GET_VAT_PERCENTAGE_SETTING
CREATE PROCEDURE [VMaster].[GET_VAT_PERCENTAGE_SETTING]
(
    @SNO INT
) 
AS 
BEGIN
    SET NOCOUNT ON

    SELECT [SNO]
          ,[VAT_PERCENTAGE]
          ,[EFFECTIVE_FROM]
          ,[EFFECTIVE_TO]
          ,[REMARKS]
          ,[STATUS_MASTER]
    FROM [VMaster].[TBL_VAT_PERCENTAGE_SETTING]
    WHERE SNO = @SNO
END
GO

-- 5. SAVE_VAT_PERCENTAGE_SETTING
CREATE PROCEDURE [VMaster].[SAVE_VAT_PERCENTAGE_SETTING]
(
    @SNO INT,
    @VAT_PERCENTAGE DECIMAL(15,2),
    @EFFECTIVE_FROM DATETIME,
    @EFFECTIVE_TO DATETIME,
    @REMARKS VARCHAR(2000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
) 
AS 
BEGIN 
    SET NOCOUNT ON

    IF EXISTS(SELECT 'X' FROM [VMaster].[TBL_VAT_PERCENTAGE_SETTING] r 
              WHERE VAT_PERCENTAGE = @VAT_PERCENTAGE 
              AND EFFECTIVE_FROM = @EFFECTIVE_FROM)
    BEGIN
        SELECT 'error','VAT PERCENTAGE ALREADY EXISTS','0'
    END
    ELSE BEGIN
        INSERT INTO [VMaster].[TBL_VAT_PERCENTAGE_SETTING]
               ([VAT_PERCENTAGE]
               ,[EFFECTIVE_FROM]
               ,[EFFECTIVE_TO]
               ,[REMARKS]
               ,[STATUS_MASTER]
               ,[CREATED_BY]
               ,[CREATED_DATE]
               ,[CREATED_MAC_ADDRESS]
               ,[MODIFIED_BY]
               ,[MODIFIED_DATE]
               ,[MODIFIED_MAC_ADDRESS])
         VALUES
               (@VAT_PERCENTAGE
               ,@EFFECTIVE_FROM
               ,@EFFECTIVE_TO
               ,@REMARKS
               ,@STATUS_MASTER
               ,@USER
               ,GETDATE()
               ,@MAC_ADDRESS
               ,@USER
               ,GETDATE()
               ,@MAC_ADDRESS)

        SELECT @SNO = MAX(SNO) FROM [VMaster].[TBL_VAT_PERCENTAGE_SETTING]
        SELECT '','DATA SAVED SUCCESSFULL',@SNO 
    END
END
GO

-- 6. UPDATE_VAT_PERCENTAGE_SETTING
CREATE PROCEDURE [VMaster].[UPDATE_VAT_PERCENTAGE_SETTING]
(
    @SNO INT,
    @VAT_PERCENTAGE DECIMAL(15,2),
    @EFFECTIVE_FROM DATETIME,
    @EFFECTIVE_TO DATETIME,
    @REMARKS VARCHAR(2000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS 
BEGIN
    SET NOCOUNT ON

    IF EXISTS(SELECT 'X' FROM [VMaster].[TBL_VAT_PERCENTAGE_SETTING] r 
              WHERE VAT_PERCENTAGE = @VAT_PERCENTAGE 
              AND EFFECTIVE_FROM = @EFFECTIVE_FROM
              AND SNO <> @SNO)
    BEGIN
        SELECT 'error','VAT PERCENTAGE ALREADY EXISTS','0'
    END
    ELSE BEGIN
        UPDATE [VMaster].[TBL_VAT_PERCENTAGE_SETTING]
           SET [VAT_PERCENTAGE] = @VAT_PERCENTAGE
              ,[EFFECTIVE_FROM] = @EFFECTIVE_FROM
              ,[EFFECTIVE_TO] = @EFFECTIVE_TO
              ,[REMARKS] = @REMARKS
              ,[STATUS_MASTER] = @STATUS_MASTER
              ,[MODIFIED_BY] = @USER
              ,[MODIFIED_DATE] = GETDATE()
              ,[MODIFIED_MAC_ADDRESS] = @MAC_ADDRESS
        WHERE SNO = @SNO

        SELECT '','RECORD UPDATED SUCCESSFULL',@SNO 
    END
END
GO

-- 7. DELETE_VAT_PERCENTAGE_SETTING
CREATE PROCEDURE [VMaster].[DELETE_VAT_PERCENTAGE_SETTING]
(
    @SNO INT
) 
AS 
BEGIN
    SET NOCOUNT ON 

    IF NOT EXISTS (SELECT 'X' FROM [VMaster].[TBL_VAT_PERCENTAGE_SETTING] WHERE SNO = @SNO)
    BEGIN
        SELECT 'Error','RECORD NOT EXISTS SUCCESSFULL',@SNO 
    END
    ELSE BEGIN
        DELETE [VMaster].[TBL_VAT_PERCENTAGE_SETTING] WHERE SNO = @SNO
        SELECT '','RECORD DELETED SUCCESSFULL',@SNO 
    END
END
GO

PRINT '===================================================='
PRINT 'ALL DONE! Table and 5 Stored Procedures created.'
PRINT '===================================================='
