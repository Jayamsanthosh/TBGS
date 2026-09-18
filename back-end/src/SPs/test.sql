/****************************************************************************************
  APPROVAL MICROSERVICE - PHASE 1 (DATABASE / STORED PROCEDURES)
  Project: nextjs_Approval_tbgs
  Scope  : Request Summary SP, Request List SP, Request Status Update SP
  Notes  :
    - Reuses existing VRequest tables (TBL_ATTENDANCE_REQUEST, TBL_CASH_ADVANCE_REQUEST,
      TBL_ARREARS_REQUEST, TBL_OVERTIME_REQUEST). No duplicate tables/business logic.
    - Overall workflow status (Pending/Approval/Rejected/Hold) is mapped onto the existing
      FINAL_RESPONSE_STATUS / FINAL_RESPONSE_PERSON / FINAL_RESPONSE_DATE columns, since
      none of the request tables has a dedicated single-status column today.
    - FINAL_RESPONSE_REMARKS is reused as the Hold Reason field and is widened below
      (VARCHAR(50) -> VARCHAR(500)) because 50 chars is too short for a real reason.
    - A new, small config table (TBL_APPROVAL_REQUEST_TYPE_MASTER) drives which request
      tables participate, so adding a 5th/6th request type later is a data row, not code.
****************************************************************************************/

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- ---------------------------------------------------------------------------------------
-- 0a. Widen the reused "Hold Reason" columns (safe, additive schema change - no data loss)
-- ---------------------------------------------------------------------------------------
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('VRequest.TBL_ATTENDANCE_REQUEST') AND name = 'FINAL_RESPONSE_REMARKS')
  ALTER TABLE VRequest.TBL_ATTENDANCE_REQUEST ALTER COLUMN FINAL_RESPONSE_REMARKS VARCHAR(500) NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('VRequest.TBL_CASH_ADVANCE_REQUEST') AND name = 'FINAL_RESPONSE_REMARKS')
  ALTER TABLE VRequest.TBL_CASH_ADVANCE_REQUEST ALTER COLUMN FINAL_RESPONSE_REMARKS VARCHAR(500) NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('VRequest.TBL_ARREARS_REQUEST') AND name = 'FINAL_RESPONSE_REMARKS')
  ALTER TABLE VRequest.TBL_ARREARS_REQUEST ALTER COLUMN FINAL_RESPONSE_REMARKS VARCHAR(500) NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('VRequest.TBL_OVERTIME_REQUEST') AND name = 'FINAL_RESPONSE_REMARKS')
  ALTER TABLE VRequest.TBL_OVERTIME_REQUEST ALTER COLUMN FINAL_RESPONSE_REMARKS VARCHAR(500) NULL;
GO

-- ---------------------------------------------------------------------------------------
-- 0b. Config table: drives Dashboard cards / Sidebar / List / Status-update generically
-- ---------------------------------------------------------------------------------------
IF OBJECT_ID('VRequest.TBL_APPROVAL_REQUEST_TYPE_MASTER') IS NULL
BEGIN
  CREATE TABLE VRequest.TBL_APPROVAL_REQUEST_TYPE_MASTER (
    REQUEST_TYPE_ID   INT IDENTITY(1,1) CONSTRAINT PK_APPROVAL_REQUEST_TYPE PRIMARY KEY,
    REQUEST_TYPE_CODE VARCHAR(50)  NOT NULL CONSTRAINT UQ_APPROVAL_REQUEST_TYPE_CODE UNIQUE, -- e.g. ATTENDANCE_REQUEST
    CARD_NAME         VARCHAR(100) NOT NULL,   -- e.g. Attendance Request  (shown on Dashboard/Sidebar)
    TABLE_SCHEMA_NAME VARCHAR(50)  NOT NULL DEFAULT 'VRequest',
    TABLE_NAME        VARCHAR(100) NOT NULL,   -- e.g. TBL_ATTENDANCE_REQUEST
    REF_NO_COLUMN     VARCHAR(100) NOT NULL,   -- e.g. ATT_REQUEST_REF_NO (primary key / reference no)
    ICON              VARCHAR(50)  NULL,
    SORT_ORDER        INT NOT NULL DEFAULT 0,
    IS_ACTIVE         CHAR(1) NOT NULL DEFAULT 'Y',
    CREATED_DATE      DATETIME NOT NULL DEFAULT GETDATE()
  );

  INSERT INTO VRequest.TBL_APPROVAL_REQUEST_TYPE_MASTER
    (REQUEST_TYPE_CODE, CARD_NAME, TABLE_NAME, REF_NO_COLUMN, ICON, SORT_ORDER)
  VALUES
    ('ATTENDANCE_REQUEST',  'Attendance Request',   'TBL_ATTENDANCE_REQUEST',   'ATT_REQUEST_REF_NO',      'calendar-clock', 1),
    ('CASH_ADVANCE_REQUEST','Cash Advance Request',  'TBL_CASH_ADVANCE_REQUEST', 'CASH_ADV_REQUEST_REF_NO', 'wallet',          2),
    ('ARREARS_REQUEST',     'Arrears Request',       'TBL_ARREARS_REQUEST',      'ARREAR_REQUEST_REF_NO',   'trending-up',     3),
    ('OVERTIME_REQUEST',    'Overtime Request',      'TBL_OVERTIME_REQUEST',     'OT_REQUEST_REF_NO',       'clock',           4);
END
GO

-- =========================================================================================
-- 1. REQUEST SUMMARY SP  ->  Dashboard cards + Sidebar badges (single source of truth)
-- =========================================================================================
IF OBJECT_ID('VRequest.GET_REQUEST_SUMMARY_COUNTS') IS NOT NULL
  DROP PROCEDURE VRequest.GET_REQUEST_SUMMARY_COUNTS
GO
CREATE PROCEDURE VRequest.GET_REQUEST_SUMMARY_COUNTS
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @SQL NVARCHAR(MAX) = N'';

  SELECT @SQL = @SQL +
    CASE WHEN @SQL = N'' THEN N'' ELSE N'
UNION ALL
' END +
    N'SELECT ' + QUOTENAME(REQUEST_TYPE_CODE, '''') + N' AS RequestTypeCode, ' +
                 QUOTENAME(CARD_NAME, '''') + N' AS CardName, ' +
                 CAST(REQUEST_TYPE_ID AS NVARCHAR(20)) + N' AS RequestTypeId, ' +
                 CAST(SORT_ORDER AS NVARCHAR(20)) + N' AS SortOrder, ' +
                 N'COUNT(1) AS PendingCount ' +
    N'FROM ' + QUOTENAME(TABLE_SCHEMA_NAME) + N'.' + QUOTENAME(TABLE_NAME) +
    N' WHERE (STATUS_MASTER = ''AC'' OR STATUS_MASTER IS NULL) ' +
    N'   AND (FINAL_RESPONSE_STATUS IS NULL OR FINAL_RESPONSE_STATUS = ''Pending'')'
  FROM VRequest.TBL_APPROVAL_REQUEST_TYPE_MASTER
  WHERE IS_ACTIVE = 'Y';

  IF @SQL = N''
  BEGIN
    SELECT CAST(NULL AS VARCHAR(50)) AS RequestTypeCode, CAST(NULL AS VARCHAR(100)) AS CardName,
           CAST(NULL AS INT) AS RequestTypeId, CAST(NULL AS INT) AS SortOrder, 0 AS PendingCount
    WHERE 1 = 0; -- empty resultset, correctly shaped
    RETURN;
  END

  SET @SQL = @SQL + N' ORDER BY SortOrder ASC;';

  EXEC sp_executesql @SQL;
END
GO

-- =========================================================================================
-- 2. REQUEST LIST SP  ->  Records for the selected request type (List / grid screen)
-- =========================================================================================
IF OBJECT_ID('VRequest.GET_REQUEST_LIST') IS NOT NULL
  DROP PROCEDURE VRequest.GET_REQUEST_LIST
GO
CREATE PROCEDURE VRequest.GET_REQUEST_LIST
(
  @REQUEST_TYPE_CODE VARCHAR(50),
  @STATUS_FILTER     VARCHAR(20) = 'ALL'   -- 'ALL' | 'Pending' | 'Approval' | 'Rejected' | 'Hold'
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @TABLE_SCHEMA_NAME VARCHAR(50), @TABLE_NAME VARCHAR(100), @REF_NO_COLUMN VARCHAR(100);

  SELECT @TABLE_SCHEMA_NAME = TABLE_SCHEMA_NAME, @TABLE_NAME = TABLE_NAME, @REF_NO_COLUMN = REF_NO_COLUMN
  FROM VRequest.TBL_APPROVAL_REQUEST_TYPE_MASTER
  WHERE REQUEST_TYPE_CODE = @REQUEST_TYPE_CODE AND IS_ACTIVE = 'Y';

  IF @TABLE_NAME IS NULL
  BEGIN
    SELECT 'ERROR' AS STATUS, 'Unknown or inactive request type: ' + ISNULL(@REQUEST_TYPE_CODE,'') AS MESSAGE;
    RETURN;
  END

  DECLARE @SQL NVARCHAR(MAX) = N'
SELECT
    SNO,
    ' + QUOTENAME(@REF_NO_COLUMN) + N' AS REQUEST_REF_NO,
    ''' + @REQUEST_TYPE_CODE + N''' AS REQUEST_TYPE,
    EMP_ID,
    LTRIM(RTRIM(ISNULL(FIRST_NAME,'''') + '' '' + ISNULL(MIDDLE_NAME,'''') + '' '' + ISNULL(LAST_NAME,''''))) AS EMPLOYEE_NAME,
    COMPANY_ID, DEPARTMENT_ID, DESIGNATION_ID, DEPARTMENT_GROUP_ID, DESIGNATION_GROUP_ID, CAMP_ID, STORE_ID,
    REASON,
    ISNULL(FINAL_RESPONSE_STATUS, ''Pending'') AS REQUEST_STATUS,
    FINAL_RESPONSE_REMARKS AS HOLD_REASON,
    FINAL_RESPONSE_PERSON  AS UPDATED_BY,
    FINAL_RESPONSE_DATE    AS UPDATED_DATE,
    CREATED_BY, CREATED_DATE
FROM ' + QUOTENAME(@TABLE_SCHEMA_NAME) + N'.' + QUOTENAME(@TABLE_NAME) + N'
WHERE (STATUS_MASTER = ''AC'' OR STATUS_MASTER IS NULL)
  AND (@P_STATUS = ''ALL'' OR ISNULL(FINAL_RESPONSE_STATUS, ''Pending'') = @P_STATUS)
ORDER BY CREATED_DATE DESC;';

  EXEC sp_executesql @SQL, N'@P_STATUS VARCHAR(20)', @P_STATUS = @STATUS_FILTER;
END
GO

-- =========================================================================================
-- 3. REQUEST STATUS UPDATE SP  ->  Pending -> Approval / Rejected / Hold (reusable, generic)
-- =========================================================================================
IF OBJECT_ID('VRequest.UPDATE_REQUEST_STATUS') IS NOT NULL
  DROP PROCEDURE VRequest.UPDATE_REQUEST_STATUS
GO
CREATE PROCEDURE VRequest.UPDATE_REQUEST_STATUS
(
  @REQUEST_TYPE_CODE VARCHAR(50),   -- e.g. ATTENDANCE_REQUEST
  @REQUEST_REF_NO    VARCHAR(50),   -- e.g. the ATT_REQUEST_REF_NO value
  @STATUS             VARCHAR(20),  -- Approval | Rejected | Hold
  @UPDATED_BY         VARCHAR(50),
  @HOLD_REASON        VARCHAR(500) = NULL
)
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  -- 3. Validate requested status
  IF @STATUS NOT IN ('Approval', 'Rejected', 'Hold')
  BEGIN
    SELECT 'ERROR' AS STATUS, 'Invalid status. Allowed values: Approval, Rejected, Hold.' AS MESSAGE;
    RETURN;
  END

  -- 5. Hold requires a reason; 6. Approval/Rejected must not require one
  IF @STATUS = 'Hold' AND (LTRIM(RTRIM(ISNULL(@HOLD_REASON,''))) = '')
  BEGIN
    SELECT 'ERROR' AS STATUS, 'HoldReason is required when Status = Hold.' AS MESSAGE;
    RETURN;
  END
  IF @STATUS <> 'Hold' SET @HOLD_REASON = NULL;

  -- 2. Validate request type
  DECLARE @TABLE_SCHEMA_NAME VARCHAR(50), @TABLE_NAME VARCHAR(100), @REF_NO_COLUMN VARCHAR(100);
  SELECT @TABLE_SCHEMA_NAME = TABLE_SCHEMA_NAME, @TABLE_NAME = TABLE_NAME, @REF_NO_COLUMN = REF_NO_COLUMN
  FROM VRequest.TBL_APPROVAL_REQUEST_TYPE_MASTER
  WHERE REQUEST_TYPE_CODE = @REQUEST_TYPE_CODE AND IS_ACTIVE = 'Y';

  IF @TABLE_NAME IS NULL
  BEGIN
    SELECT 'ERROR' AS STATUS, 'Unknown or inactive request type: ' + ISNULL(@REQUEST_TYPE_CODE,'') AS MESSAGE;
    RETURN;
  END

  BEGIN TRY
    BEGIN TRANSACTION;

    -- 1. Validate that the request exists, and 4. lock the row for the current-status check
    DECLARE @EXISTS_SQL NVARCHAR(MAX) = N'
SELECT @P_CURRENT_STATUS = ISNULL(FINAL_RESPONSE_STATUS, ''Pending'')
FROM ' + QUOTENAME(@TABLE_SCHEMA_NAME) + N'.' + QUOTENAME(@TABLE_NAME) + N' WITH (UPDLOCK, ROWLOCK)
WHERE ' + QUOTENAME(@REF_NO_COLUMN) + N' = @P_REF_NO;';

    DECLARE @CURRENT_STATUS VARCHAR(20) = NULL;

    EXEC sp_executesql @EXISTS_SQL,
      N'@P_REF_NO VARCHAR(50), @P_CURRENT_STATUS VARCHAR(20) OUTPUT',
      @P_REF_NO = @REQUEST_REF_NO, @P_CURRENT_STATUS = @CURRENT_STATUS OUTPUT;

    IF @CURRENT_STATUS IS NULL
    BEGIN
      ROLLBACK TRANSACTION;
      SELECT 'ERROR' AS STATUS, 'Request not found: ' + @REQUEST_REF_NO AS MESSAGE;
      RETURN;
    END

    -- 4. Only Pending or Hold requests can be actioned; Approval/Rejected are terminal
    IF @CURRENT_STATUS NOT IN ('Pending', 'Hold')
    BEGIN
      ROLLBACK TRANSACTION;
      SELECT 'ERROR' AS STATUS, 'Request is already ' + @CURRENT_STATUS + ' and cannot be updated.' AS MESSAGE;
      RETURN;
    END

    -- 7-9. Update the record: status, hold reason, updated-by, updated-date
    DECLARE @UPDATE_SQL NVARCHAR(MAX) = N'
UPDATE ' + QUOTENAME(@TABLE_SCHEMA_NAME) + N'.' + QUOTENAME(@TABLE_NAME) + N'
SET FINAL_RESPONSE_STATUS  = @P_STATUS,
    FINAL_RESPONSE_REMARKS = @P_HOLD_REASON,
    FINAL_RESPONSE_PERSON  = @P_UPDATED_BY,
    FINAL_RESPONSE_DATE    = GETDATE(),
    MODIFIED_BY             = @P_UPDATED_BY,
    MODIFIED_DATE           = GETDATE()
WHERE ' + QUOTENAME(@REF_NO_COLUMN) + N' = @P_REF_NO;';

    EXEC sp_executesql @UPDATE_SQL,
      N'@P_STATUS VARCHAR(20), @P_HOLD_REASON VARCHAR(500), @P_UPDATED_BY VARCHAR(50), @P_REF_NO VARCHAR(50)',
      @P_STATUS = @STATUS, @P_HOLD_REASON = @HOLD_REASON, @P_UPDATED_BY = @UPDATED_BY, @P_REF_NO = @REQUEST_REF_NO;

    COMMIT TRANSACTION;

    -- 12. Clear success response
    SELECT 'SUCCESS' AS STATUS, 'Request ' + @REQUEST_REF_NO + ' updated to ' + @STATUS + '.' AS MESSAGE, @REQUEST_REF_NO AS DATA;
  END TRY
  BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    -- 11. Proper error handling / clear failure response
    SELECT 'ERROR' AS STATUS, ERROR_MESSAGE() AS MESSAGE;
  END CATCH
END
GO