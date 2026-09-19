-- =====================================================================
-- Attendance Details (Pay Entries)
-- Creates the missing table referenced by the existing VPayEntries SPs,
-- and fixes GET/SHOW SPs to also return the FINAL_RESPONSE_* columns.
-- =====================================================================

IF OBJECT_ID('VPayEntries.ATTENDANCE_DETAILS', 'U') IS NULL
BEGIN
    CREATE TABLE VPayEntries.ATTENDANCE_DETAILS
    (
        SNO                                 INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        MONTH_ENTERED                       VARCHAR(25) NULL,
        YEAR_ENTERED                        INT NULL,
        ATT_REQUEST_REF_NO                  VARCHAR(50) NULL,
        EMP_ID                              INT NULL,
        FIRST_NAME                          VARCHAR(50) NULL,
        MIDDLE_NAME                         VARCHAR(50) NULL,
        LAST_NAME                           VARCHAR(50) NULL,
        COMPANY_ID                          INT NULL,
        DEPARTMENT_ID                       INT NULL,
        DESIGNATION_ID                      INT NULL,
        DEPARTMENT_GROUP_ID                 INT NULL,
        DESIGNATION_GROUP_ID                INT NULL,
        CAMP_ID                             INT NULL,
        STORE_ID                            INT NULL,
        EMPLOYMENT_TYPE_ID                  INT NULL,
        ATTENDANCE_TYPE_ID                  INT NULL,
        ELIGIBLE_DAYS                       DECIMAL(10,3) NULL,
        DATE_FROM                           DATETIME NULL,
        DATE_TO                             DATETIME NULL,
        NO_OF_DAYS                          DECIMAL(10,3) NULL,
        BALANCE_LEAVE                       DECIMAL(10,3) NULL,
        REASON                              VARCHAR(3000) NULL,
        SECTION_HEAD_RESPONSE_PERSON_EMP_ID INT NULL,
        SECTION_HEAD_RESPONSE_DATE          DATETIME NULL,
        SECTION_HEAD_RESPONSE_STATUS        VARCHAR(50) NULL,
        SECTION_HEAD_RESPONSE_REMARKS       VARCHAR(50) NULL,
        FINAL_RESPONSE_PERSON               VARCHAR(50) NULL,
        FINAL_RESPONSE_DATE                 DATETIME NULL,
        FINAL_RESPONSE_STATUS               VARCHAR(50) NULL,
        FINAL_RESPONSE_REMARKS              VARCHAR(50) NULL,
        REMARKS                             VARCHAR(1000) NULL,
        STATUS_MASTER                       VARCHAR(20) NOT NULL DEFAULT 'AC',
        CREATED_BY                          VARCHAR(50) NULL,
        CREATED_DATE                        DATETIME NULL,
        CREATED_MAC_ADDRESS                 VARCHAR(50) NULL,
        MODIFIED_BY                         VARCHAR(50) NULL,
        MODIFIED_DATE                       DATETIME NULL,
        MODIFIED_MAC_ADDRESS                VARCHAR(50) NULL
    );
END
GO

-- ===================== GET fix: include FINAL_RESPONSE_* =====================
IF OBJECT_ID('VPayEntries.GET_ATTENDANCE_DETAILS', 'P') IS NOT NULL DROP PROCEDURE VPayEntries.GET_ATTENDANCE_DETAILS;
GO
CREATE PROCEDURE VPayEntries.GET_ATTENDANCE_DETAILS
(
    @SNO INT
)
AS
BEGIN
    SET NOCOUNT ON

    SELECT [SNO]
          ,[MONTH_ENTERED]
          ,[YEAR_ENTERED]
          ,[ATT_REQUEST_REF_NO]
          ,[EMP_ID]
          ,[FIRST_NAME]
          ,[MIDDLE_NAME]
          ,[LAST_NAME]
          ,[COMPANY_ID]
          ,[DEPARTMENT_ID]
          ,[DESIGNATION_ID]
          ,[DEPARTMENT_GROUP_ID]
          ,[DESIGNATION_GROUP_ID]
          ,[CAMP_ID]
          ,[STORE_ID]
          ,[EMPLOYMENT_TYPE_ID]
          ,[ATTENDANCE_TYPE_ID]
          ,[ELIGIBLE_DAYS]
          ,[DATE_FROM]
          ,[DATE_TO]
          ,[NO_OF_DAYS]
          ,[BALANCE_LEAVE]
          ,[REASON]
          ,[SECTION_HEAD_RESPONSE_PERSON_EMP_ID]
          ,[SECTION_HEAD_RESPONSE_DATE]
          ,[SECTION_HEAD_RESPONSE_STATUS]
          ,[SECTION_HEAD_RESPONSE_REMARKS]
          ,[FINAL_RESPONSE_PERSON]
          ,[FINAL_RESPONSE_DATE]
          ,[FINAL_RESPONSE_STATUS]
          ,[FINAL_RESPONSE_REMARKS]
          ,[REMARKS]
          ,[STATUS_MASTER]
          ,[CREATED_BY]
          ,[CREATED_DATE]
          ,[CREATED_MAC_ADDRESS]
          ,[MODIFIED_BY]
          ,[MODIFIED_DATE]
          ,[MODIFIED_MAC_ADDRESS]
      FROM [VPayEntries].[ATTENDANCE_DETAILS]
      WHERE SNO=@SNO
END
GO

-- ===================== SHOW fix: include FINAL_RESPONSE_* =====================
IF OBJECT_ID('VPayEntries.SHOW_ATTENDANCE_DETAILS', 'P') IS NOT NULL DROP PROCEDURE VPayEntries.SHOW_ATTENDANCE_DETAILS;
GO
CREATE PROCEDURE VPayEntries.SHOW_ATTENDANCE_DETAILS
(
    @STATUS VARCHAR(20)
)
AS
BEGIN
    SET NOCOUNT ON

    SELECT [SNO]
          ,[MONTH_ENTERED]
          ,[YEAR_ENTERED]
          ,[ATT_REQUEST_REF_NO]
          ,[EMP_ID]
          ,[FIRST_NAME]
          ,[MIDDLE_NAME]
          ,[LAST_NAME]
          ,[COMPANY_ID]
          ,[DEPARTMENT_ID]
          ,[DESIGNATION_ID]
          ,[DEPARTMENT_GROUP_ID]
          ,[DESIGNATION_GROUP_ID]
          ,[CAMP_ID]
          ,[STORE_ID]
          ,[EMPLOYMENT_TYPE_ID]
          ,[ATTENDANCE_TYPE_ID]
          ,[ELIGIBLE_DAYS]
          ,[DATE_FROM]
          ,[DATE_TO]
          ,[NO_OF_DAYS]
          ,[BALANCE_LEAVE]
          ,[REASON]
          ,[SECTION_HEAD_RESPONSE_PERSON_EMP_ID]
          ,[SECTION_HEAD_RESPONSE_DATE]
          ,[SECTION_HEAD_RESPONSE_STATUS]
          ,[SECTION_HEAD_RESPONSE_REMARKS]
          ,[FINAL_RESPONSE_PERSON]
          ,[FINAL_RESPONSE_DATE]
          ,[FINAL_RESPONSE_STATUS]
          ,[FINAL_RESPONSE_REMARKS]
          ,[REMARKS]
          ,[STATUS_MASTER]
          ,[CREATED_BY]
          ,[CREATED_DATE]
          ,[CREATED_MAC_ADDRESS]
          ,[MODIFIED_BY]
          ,[MODIFIED_DATE]
          ,[MODIFIED_MAC_ADDRESS]
      FROM [VPayEntries].[ATTENDANCE_DETAILS]
      WHERE STATUS_MASTER=@STATUS
END
GO