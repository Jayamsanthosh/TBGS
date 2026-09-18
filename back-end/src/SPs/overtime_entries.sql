-- Overtime Entries stored procedures (VPayEntries schema)
-- Fixes applied vs the deployed procedures:
--   1. DELETE_OVERTIME_ENTRIES: role / existence checks now RETURN after error
--      (previously they printed the error but still fell through to the DELETE).
--   2. SAVE_OVERTIME_ENTRIES: duplicate-check logic was inverted
--      (IF NOT EXISTS -> error / ELSE insert), so new rows were never saved and
--      existing refs were duplicated. Overtime entries are now linked to an
--      existing overtime request, so @OT_REQUEST_REF_NO is a plain INPUT (the
--      admin picks the request's ref number on the entry form) with a corrected
--      EXISTS duplicate guard (no auto-generated ref, no OUTPUT parameter).
--   3. UPDATE_OVERTIME_ENTRIES: the 'CL' (submitted) guard now RETURNs instead of
--      printing the error and still running the UPDATE; added a not-found guard.
--   4. GET_OVERTIME_ENTRIES / SHOW_OVERTIME_ENTRIES: kept as deployed.

USE [TBGS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/****** Object:  StoredProcedure [VPayEntries].[DELETE_OVERTIME_ENTRIES]    Script Date: 12-08-2026 ******/
ALTER   PROCEDURE [VPayEntries].[DELETE_OVERTIME_ENTRIES]
(
    @OT_REQUEST_REF_NO varchar(50),
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    IF @ROLE <> 'Admin'
    BEGIN
        SELECT
            'error' AS STATUS,
            'No Rights To Delete' AS MESSAGE,
            '' AS DATA
        RETURN
    END

    IF NOT EXISTS
    (
        SELECT 1
        FROM [VPayEntries].[TBL_OVERTIME_ENTRIES]
        WHERE OT_REQUEST_REF_NO = @OT_REQUEST_REF_NO
    )
    BEGIN
        SELECT
            'error' AS STATUS,
            'Overtime Entry Not Found' AS MESSAGE,
            '' AS DATA
        RETURN
    END

    DELETE FROM [VPayEntries].[TBL_OVERTIME_ENTRIES]
    WHERE OT_REQUEST_REF_NO = @OT_REQUEST_REF_NO

    IF @@ROWCOUNT = 0
    BEGIN
        SELECT
            'error' AS STATUS,
            'Overtime Entry Not Found' AS MESSAGE,
            '' AS DATA
        RETURN
    END

    SELECT
        '' AS STATUS,
        'Overtime Entry Deleted Successfully' AS MESSAGE,
        @OT_REQUEST_REF_NO AS DATA
END
GO

/****** Object:  StoredProcedure [VPayEntries].[GET_OVERTIME_ENTRIES]    Script Date: 12-08-2026 ******/
ALTER   PROCEDURE [VPayEntries].[GET_OVERTIME_ENTRIES]
(
    @OT_REQUEST_REF_NO varchar(50)
)
AS
BEGIN
    SET NOCOUNT ON

    SELECT
        SNO,
        OT_REQUEST_REF_NO,
        MONTH_ENTERED,
        YEAR_ENTERED,
        EMP_ID,
        FIRST_NAME,
        MIDDLE_NAME,
        LAST_NAME,
        COMPANY_ID,
        DEPARTMENT_ID,
        DESIGNATION_ID,
        DEPARTMENT_GROUP_ID,
        DESIGNATION_GROUP_ID,
        CAMP_ID,
        STORE_ID,
        EMPLOYMENT_TYPE_ID,
        CURRENCY_ID,
        OT_FROM_DATE,
        OT_TO_DATE,
        OT_HOURS,
        OT_AMOUNT,
        PAYMENT_REF_NO,
        PAYMENT_MODE_ID,
        BANK_ID,
        ACCOUNT_NO,
        PAID_STATUS,
        REASON,

        SECTION_HEAD_RESPONSE_PERSON_EMP_ID,
        SECTION_HEAD_RESPONSE_DATE,
        SECTION_HEAD_RESPONSE_STATUS,
        SECTION_HEAD_RESPONSE_REMARKS,

        RESPONSE_1_EMP_ID,
        RESPONSE_1_DATE,
        RESPONSE_1_STATUS,
        RESPONSE_1_REMARKS,

        RESPONSE_2_EMP_ID,
        RESPONSE_2_DATE,
        RESPONSE_2_STATUS,
        RESPONSE_2_REMARKS,

        FINAL_RESPONSE_EMP_ID,
        FINAL_RESPONSE_DATE,
        FINAL_RESPONSE_STATUS,
        FINAL_RESPONSE_REMARKS,

        REMARKS,
        STATUS_MASTER,

        CREATED_BY,
        CREATED_DATE,
        CREATED_MAC_ADDRESS,
        MODIFIED_BY,
        MODIFIED_DATE,
        MODIFIED_MAC_ADDRESS
    FROM [VPayEntries].[TBL_OVERTIME_ENTRIES]
    WHERE OT_REQUEST_REF_NO = @OT_REQUEST_REF_NO
END
GO

/****** Object:  StoredProcedure [VPayEntries].[SAVE_OVERTIME_ENTRIES]    Script Date: 12-08-2026 ******/
ALTER   PROCEDURE [VPayEntries].[SAVE_OVERTIME_ENTRIES]
(
    @OT_REQUEST_REF_NO VARCHAR(50),
    @MONTH_ENTERED VARCHAR(25),
    @YEAR_ENTERED INT,
    @EMP_ID INT,
    @FIRST_NAME VARCHAR(50),
    @MIDDLE_NAME VARCHAR(50),
    @LAST_NAME VARCHAR(50),
    @COMPANY_ID INT,
    @DEPARTMENT_ID INT,
    @DESIGNATION_ID INT,
    @DEPARTMENT_GROUP_ID INT,
    @DESIGNATION_GROUP_ID INT,
    @CAMP_ID INT,
    @STORE_ID INT,
    @EMPLOYMENT_TYPE_ID INT,
    @CURRENCY_ID INT,
    @OT_FROM_DATE DATETIME,
    @OT_TO_DATE DATETIME,
    @OT_HOURS DECIMAL(10,2),
    @OT_AMOUNT DECIMAL(15,2),
    @PAYMENT_REF_NO VARCHAR(50),
    @PAYMENT_MODE_ID INT,
    @BANK_ID INT,
    @ACCOUNT_NO VARCHAR(50),
    @PAID_STATUS VARCHAR(50),
    @REASON VARCHAR(3000),
    @SECTION_HEAD_RESPONSE_PERSON_EMP_ID INT,
    @SECTION_HEAD_RESPONSE_DATE DATETIME,
    @SECTION_HEAD_RESPONSE_STATUS VARCHAR(50),
    @SECTION_HEAD_RESPONSE_REMARKS VARCHAR(50),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM [VPayEntries].[TBL_OVERTIME_ENTRIES]
               WHERE OT_REQUEST_REF_NO = @OT_REQUEST_REF_NO)
    BEGIN
        SELECT
            'error' AS STATUS,
            'Overtime Entry Already Exists For This Request Ref No' AS MESSAGE,
            '' AS DATA
        RETURN
    END

    INSERT INTO [VPayEntries].[TBL_OVERTIME_ENTRIES]
    (
        OT_REQUEST_REF_NO,
        MONTH_ENTERED,
        YEAR_ENTERED,
        EMP_ID,
        FIRST_NAME,
        MIDDLE_NAME,
        LAST_NAME,
        COMPANY_ID,
        DEPARTMENT_ID,
        DESIGNATION_ID,
        DEPARTMENT_GROUP_ID,
        DESIGNATION_GROUP_ID,
        CAMP_ID,
        STORE_ID,
        EMPLOYMENT_TYPE_ID,
        CURRENCY_ID,
        OT_FROM_DATE,
        OT_TO_DATE,
        OT_HOURS,
        OT_AMOUNT,
        PAYMENT_REF_NO,
        PAYMENT_MODE_ID,
        BANK_ID,
        ACCOUNT_NO,
        PAID_STATUS,
        REASON,
        SECTION_HEAD_RESPONSE_PERSON_EMP_ID,
        SECTION_HEAD_RESPONSE_DATE,
        SECTION_HEAD_RESPONSE_STATUS,
        SECTION_HEAD_RESPONSE_REMARKS,
        RESPONSE_1_EMP_ID,
        RESPONSE_1_DATE,
        RESPONSE_1_STATUS,
        RESPONSE_1_REMARKS,
        RESPONSE_2_EMP_ID,
        RESPONSE_2_DATE,
        RESPONSE_2_STATUS,
        RESPONSE_2_REMARKS,
        FINAL_RESPONSE_EMP_ID,
        FINAL_RESPONSE_DATE,
        FINAL_RESPONSE_STATUS,
        FINAL_RESPONSE_REMARKS,
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
        @OT_REQUEST_REF_NO,
        @MONTH_ENTERED,
        @YEAR_ENTERED,
        @EMP_ID,
        @FIRST_NAME,
        @MIDDLE_NAME,
        @LAST_NAME,
        @COMPANY_ID,
        @DEPARTMENT_ID,
        @DESIGNATION_ID,
        @DEPARTMENT_GROUP_ID,
        @DESIGNATION_GROUP_ID,
        @CAMP_ID,
        @STORE_ID,
        @EMPLOYMENT_TYPE_ID,
        @CURRENCY_ID,
        @OT_FROM_DATE,
        @OT_TO_DATE,
        @OT_HOURS,
        @OT_AMOUNT,
        @PAYMENT_REF_NO,
        @PAYMENT_MODE_ID,
        @BANK_ID,
        @ACCOUNT_NO,
        @PAID_STATUS,
        @REASON,
        @SECTION_HEAD_RESPONSE_PERSON_EMP_ID,
        @SECTION_HEAD_RESPONSE_DATE,
        @SECTION_HEAD_RESPONSE_STATUS,
        @SECTION_HEAD_RESPONSE_REMARKS,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        @REMARKS,
        @STATUS_MASTER,
        @USER,
        GETDATE(),
        @MAC_ADDRESS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS
    )

    DECLARE @LAST_INSERTED_ID INT = SCOPE_IDENTITY();

    SELECT
        '' AS STATUS,
        'Overtime Entry Saved Successfully' AS MESSAGE,
        @LAST_INSERTED_ID AS DATA
END
GO

/****** Object:  StoredProcedure [VPayEntries].[SHOW_OVERTIME_ENTRIES]    Script Date: 12-08-2026 ******/
ALTER   PROCEDURE [VPayEntries].[SHOW_OVERTIME_ENTRIES]
(
    @OT_REQUEST_REF_NO VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        SNO,
        OT_REQUEST_REF_NO,
        MONTH_ENTERED,
        YEAR_ENTERED,
        EMP_ID,
        FIRST_NAME,
        MIDDLE_NAME,
        LAST_NAME,
        COMPANY_ID,
        DEPARTMENT_ID,
        DESIGNATION_ID,
        DEPARTMENT_GROUP_ID,
        DESIGNATION_GROUP_ID,
        CAMP_ID,
        STORE_ID,
        EMPLOYMENT_TYPE_ID,
        CURRENCY_ID,
        OT_FROM_DATE,
        OT_TO_DATE,
        OT_HOURS,
        OT_AMOUNT,
        PAYMENT_REF_NO,
        PAYMENT_MODE_ID,
        BANK_ID,
        ACCOUNT_NO,
        PAID_STATUS,
        REASON,
        SECTION_HEAD_RESPONSE_STATUS,
        RESPONSE_1_STATUS,
        RESPONSE_2_STATUS,
        FINAL_RESPONSE_STATUS,
        REMARKS,
        STATUS_MASTER
    FROM [VPayEntries].[TBL_OVERTIME_ENTRIES]
    WHERE OT_REQUEST_REF_NO = @OT_REQUEST_REF_NO
END
GO

/****** Object:  StoredProcedure [VPayEntries].[UPDATE_OVERTIME_ENTRIES]    Script Date: 12-08-2026 ******/
ALTER   PROCEDURE [VPayEntries].[UPDATE_OVERTIME_ENTRIES]
(
    @SNO INT,
    @OT_REQUEST_REF_NO VARCHAR(50),
    @MONTH_ENTERED VARCHAR(25),
    @YEAR_ENTERED INT,
    @EMP_ID INT,
    @FIRST_NAME VARCHAR(50),
    @MIDDLE_NAME VARCHAR(50),
    @LAST_NAME VARCHAR(50),
    @COMPANY_ID INT,
    @DEPARTMENT_ID INT,
    @DESIGNATION_ID INT,
    @DEPARTMENT_GROUP_ID INT,
    @DESIGNATION_GROUP_ID INT,
    @CAMP_ID INT,
    @STORE_ID INT,
    @EMPLOYMENT_TYPE_ID INT,
    @CURRENCY_ID INT,
    @OT_FROM_DATE DATETIME,
    @OT_TO_DATE DATETIME,
    @OT_HOURS DECIMAL(10,2),
    @OT_AMOUNT DECIMAL(15,2),
    @PAYMENT_REF_NO VARCHAR(50),
    @PAYMENT_MODE_ID INT,
    @BANK_ID INT,
    @ACCOUNT_NO VARCHAR(50),
    @PAID_STATUS VARCHAR(50),
    @REASON VARCHAR(3000),
    @SECTION_HEAD_RESPONSE_PERSON_EMP_ID INT,
    @SECTION_HEAD_RESPONSE_DATE DATETIME,
    @SECTION_HEAD_RESPONSE_STATUS VARCHAR(50),
    @SECTION_HEAD_RESPONSE_REMARKS VARCHAR(50),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS
    (
        SELECT 1
        FROM [VPayEntries].[TBL_OVERTIME_ENTRIES]
        WHERE OT_REQUEST_REF_NO = @OT_REQUEST_REF_NO
    )
    BEGIN
        SELECT
            'error' AS STATUS,
            'Overtime Entry Not Found' AS MESSAGE,
            '' AS DATA
        RETURN
    END

    IF EXISTS
    (
        SELECT 1
        FROM [VPayEntries].[TBL_OVERTIME_ENTRIES]
        WHERE OT_REQUEST_REF_NO = @OT_REQUEST_REF_NO
        AND STATUS_MASTER = 'CL'
    )
    BEGIN
        SELECT
            'error' AS STATUS,
            'Already Submitted Can''t do any changes contact to admin' AS MESSAGE,
            '' AS DATA
        RETURN
    END

    UPDATE [VPayEntries].[TBL_OVERTIME_ENTRIES]
    SET
        OT_REQUEST_REF_NO = @OT_REQUEST_REF_NO,
        MONTH_ENTERED = @MONTH_ENTERED,
        YEAR_ENTERED = @YEAR_ENTERED,
        EMP_ID = @EMP_ID,
        FIRST_NAME = @FIRST_NAME,
        MIDDLE_NAME = @MIDDLE_NAME,
        LAST_NAME = @LAST_NAME,
        COMPANY_ID = @COMPANY_ID,
        DEPARTMENT_ID = @DEPARTMENT_ID,
        DESIGNATION_ID = @DESIGNATION_ID,
        DEPARTMENT_GROUP_ID = @DEPARTMENT_GROUP_ID,
        DESIGNATION_GROUP_ID = @DESIGNATION_GROUP_ID,
        CAMP_ID = @CAMP_ID,
        STORE_ID = @STORE_ID,
        EMPLOYMENT_TYPE_ID = @EMPLOYMENT_TYPE_ID,
        CURRENCY_ID = @CURRENCY_ID,
        OT_FROM_DATE = @OT_FROM_DATE,
        OT_TO_DATE = @OT_TO_DATE,
        OT_HOURS = @OT_HOURS,
        OT_AMOUNT = @OT_AMOUNT,
        PAYMENT_REF_NO = @PAYMENT_REF_NO,
        PAYMENT_MODE_ID = @PAYMENT_MODE_ID,
        BANK_ID = @BANK_ID,
        ACCOUNT_NO = @ACCOUNT_NO,
        PAID_STATUS = @PAID_STATUS,
        REASON = @REASON,
        SECTION_HEAD_RESPONSE_PERSON_EMP_ID = @SECTION_HEAD_RESPONSE_PERSON_EMP_ID,
        SECTION_HEAD_RESPONSE_DATE = @SECTION_HEAD_RESPONSE_DATE,
        SECTION_HEAD_RESPONSE_STATUS = @SECTION_HEAD_RESPONSE_STATUS,
        SECTION_HEAD_RESPONSE_REMARKS = @SECTION_HEAD_RESPONSE_REMARKS,
        REMARKS = @REMARKS,
        STATUS_MASTER = @STATUS_MASTER,
        MODIFIED_BY = @USER,
        MODIFIED_DATE = GETDATE(),
        MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
    WHERE OT_REQUEST_REF_NO = @OT_REQUEST_REF_NO;

    SELECT
        '' AS STATUS,
        'Overtime Entry Updated Successfully' AS MESSAGE,
        @OT_REQUEST_REF_NO AS DATA
END
GO
