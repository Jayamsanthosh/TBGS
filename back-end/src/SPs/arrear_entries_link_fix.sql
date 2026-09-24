USE [TBGS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Link arrear entries to the arrear request (TBL_ARREARS_REQUEST) by keeping the
-- ARREAR_REQUEST_REF_NO the caller passes in. Only generate a new reference number
-- server-side when none is provided (standalone entry).
ALTER PROCEDURE [VPayEntries].[SAVE_ARREAR_ENTRIES]
(
    @ARREAR_REQUEST_REF_NO VARCHAR(50),
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
    @ARREAR_AMOUNT DECIMAL(15,2),
    @REASON VARCHAR(3000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF (@ARREAR_REQUEST_REF_NO IS NULL OR LTRIM(RTRIM(@ARREAR_REQUEST_REF_NO)) = '')
    BEGIN
        EXEC VRequest.SP_Generate_Screen_Ref_No_With_Output_Parameter 'ARREAR ENTRY REF NO', @COMPANY_ID, @ARREAR_REQUEST_REF_NO OUT
    END

    IF (@ARREAR_REQUEST_REF_NO IS NULL OR @ARREAR_REQUEST_REF_NO='')
    BEGIN
        SELECT 'Error','Can''t Generate Arrear Entry Reference Number. Contact Admin',''
    END

    ELSE
    BEGIN
        INSERT INTO [VPayEntries].[TBL_ARREAR_ENTRIES]
        (
            ARREAR_REQUEST_REF_NO,
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
            ARREAR_AMOUNT,
            REASON,
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
            @ARREAR_REQUEST_REF_NO,
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
            @ARREAR_AMOUNT,
            @REASON,
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