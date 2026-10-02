/* ============================================================================
   Purchase request: remember WHO raised the request, not just which employee id

   REQUESTED_BY_EMP_ID has an enforced FK to NEW_EMPLOYEE_DATABASE.EMP_ID, so it
   cannot identify every login. 'sandy' has no employee row, and 'sri' maps to
   EMP_ID 102 which does not exist. The screens resolved the display name by
   joining the employee table, which produced the useless fallbacks 'EMP 102' and
   'EMP ' for exactly those logins.

   REQUESTED_BY_NAME stores the name the session resolved at save time - the
   employee's full name, or the login name when the login is not an employee - so
   a request always shows a real name even when the requester has no employee
   record, and even if the employee row is later renamed or removed.

   The read SPs prefer this column and fall back to the employee join, so rows
   created before this column keep showing their employee name.
   ============================================================================ */

IF COL_LENGTH('VPurchase.TBL_PURCHASE_REQUEST_HDR', 'REQUESTED_BY_NAME') IS NULL
    ALTER TABLE [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
        ADD [REQUESTED_BY_NAME] VARCHAR(200) NULL;
GO

/* Backfill existing rows from the employee master so no historical request shows
   a blank requester after the change. Rows with no employee row keep NULL and the
   read SPs still fall back to the join. */
UPDATE [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
SET REQUESTED_BY_NAME = LTRIM(RTRIM(
        ISNULL(E.FIRST_NAME, '') + ' ' +
        ISNULL(E.MIDDLE_NAME, '') + ' ' +
        ISNULL(E.LAST_NAME, '')))
FROM [VPurchase].[TBL_PURCHASE_REQUEST_HDR] A
INNER JOIN VPayEntries.NEW_EMPLOYEE_DATABASE E ON E.EMP_ID = A.REQUESTED_BY_EMP_ID
WHERE A.REQUESTED_BY_NAME IS NULL
  AND LTRIM(RTRIM(
        ISNULL(E.FIRST_NAME, '') + ' ' +
        ISNULL(E.MIDDLE_NAME, '') + ' ' +
        ISNULL(E.LAST_NAME, ''))) <> '';
GO

/* ---------------------------------------------------------------------------
   SAVE_PURCHASE_REQUEST_HDR

   Only two things change: a new @REQUESTED_BY_NAME parameter, placed directly
   after @REQUESTED_BY_EMP_ID so it can never be confused with the neighbour, and
   its column in the INSERT. The reference-number generation and the
   'previous request is pending' guard are preserved exactly as they were.
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [VPurchase].[SAVE_PURCHASE_REQUEST_HDR]
(
    @PURCHASE_REQUEST_NO VARCHAR(50),
    @PURCHASE_REQUEST_DATE DATETIME,

    @REQUESTED_BY_EMP_ID INT,
    @REQUESTED_BY_NAME VARCHAR(200),
    @COMPANY_ID INT,
    @BRANCH_ID INT,
    @PO_STORE_ID INT,
    @CAMP_ID INT,
    @REQUEST_STORE_ID INT,
    @REQUEST_TYPE_ID INT,
    @PRIORITY_ID INT,

    @REQUIRED_DATE DATETIME,
    @REASON VARCHAR(500),

    @SECTION_HEAD_RESPONSE_PERSON_EMP_ID INT,
    @SECTION_HEAD_RESPONSE_DATE DATETIME,
    @SECTION_HEAD_RESPONSE_STATUS VARCHAR(50),
    @SECTION_HEAD_RESPONSE_REMARKS VARCHAR(50),
    @SECTION_HEAD_RESPONSE_IP_ADDRESS VARCHAR(50),

    @RESPONSE_1_EMP_ID INT,
    @RESPONSE_1_DATE DATETIME,
    @RESPONSE_1_STATUS VARCHAR(50),
    @RESPONSE_1_REMARKS VARCHAR(50),
    @RESPONSE_1_IP_ADDRESS VARCHAR(50),

    @RESPONSE_2_EMP_ID INT,
    @RESPONSE_2_DATE DATETIME,
    @RESPONSE_2_STATUS VARCHAR(50),
    @RESPONSE_2_REMARKS VARCHAR(50),
    @RESPONSE_2_IP_ADDRESS VARCHAR(50),

    @FINAL_RESPONSE_EMP_ID INT,
    @FINAL_RESPONSE_DATE DATETIME,
    @FINAL_RESPONSE_STATUS VARCHAR(50),
    @FINAL_RESPONSE_REMARKS VARCHAR(50),
    @FINAL_RESPONSE_IP_ADDRESS VARCHAR(50),

    @STATUS_ID INT,
    @REMARKS VARCHAR(500),
    @STATUS_ENTRY VARCHAR(20),

    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50),
    @DELIVERY_LOCATION_ID int
)
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @Previous_Request VARCHAR(MAX) = ''

    IF (@PURCHASE_REQUEST_NO IS NULL OR @PURCHASE_REQUEST_NO = '')
    BEGIN
        EXEC VRequest.SP_Generate_Screen_Ref_No_With_Output_Parameter
             'PURCHASE REQUEST', @COMPANY_ID, @PURCHASE_REQUEST_NO OUT
    END

    IF (@PURCHASE_REQUEST_NO IS NULL OR @PURCHASE_REQUEST_NO = '')
    BEGIN
        SELECT 'Error', 'Can''t Generate Purchase Request Reference Number. Contact Admin.', ''
        RETURN
    END

    IF EXISTS (
        SELECT 1
        FROM [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
        WHERE CREATED_BY = @USER
          AND UPPER(LTRIM(RTRIM(ISNULL(STATUS_ENTRY, '')))) <> 'CF'
          AND UPPER(LTRIM(RTRIM(ISNULL(FINAL_RESPONSE_STATUS, '')))) NOT IN ('APPROVED', 'APPROVAL')
          AND UPPER(LTRIM(RTRIM(ISNULL(SECTION_HEAD_RESPONSE_STATUS, '')))) NOT IN ('REJECTED', 'REJECT')
          AND UPPER(LTRIM(RTRIM(ISNULL(RESPONSE_1_STATUS, '')))) NOT IN ('REJECTED', 'REJECT')
          AND UPPER(LTRIM(RTRIM(ISNULL(RESPONSE_2_STATUS, '')))) NOT IN ('REJECTED', 'REJECT')
          AND UPPER(LTRIM(RTRIM(ISNULL(FINAL_RESPONSE_STATUS, '')))) NOT IN ('REJECTED', 'REJECT')
    ) AND @USER<>'SRI'
    BEGIN
        SELECT @Previous_Request += '( ' + PURCHASE_REQUEST_NO + ' ) => ' + ISNULL(CREATED_BY, '')
        FROM [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
        WHERE CREATED_BY = @USER
          AND UPPER(LTRIM(RTRIM(ISNULL(STATUS_ENTRY, '')))) <> 'CF'
          AND UPPER(LTRIM(RTRIM(ISNULL(FINAL_RESPONSE_STATUS, '')))) NOT IN ('APPROVED', 'APPROVAL')
          AND UPPER(LTRIM(RTRIM(ISNULL(SECTION_HEAD_RESPONSE_STATUS, '')))) NOT IN ('REJECTED', 'REJECT')
          AND UPPER(LTRIM(RTRIM(ISNULL(RESPONSE_1_STATUS, '')))) NOT IN ('REJECTED', 'REJECT')
          AND UPPER(LTRIM(RTRIM(ISNULL(RESPONSE_2_STATUS, '')))) NOT IN ('REJECTED', 'REJECT')
          AND UPPER(LTRIM(RTRIM(ISNULL(FINAL_RESPONSE_STATUS, '')))) NOT IN ('REJECTED', 'REJECT')

        SELECT 'Error',
               'Previous request is pending. Kindly update previous Purchase Request Ref No and then submit.... Ref Nos [ ' + ISNULL(@Previous_Request, '') + ' ]',
               ''
        RETURN
    END

    INSERT INTO [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
    (
        PURCHASE_REQUEST_NO,
        PURCHASE_REQUEST_DATE,
        REQUESTED_BY_EMP_ID,
        REQUESTED_BY_NAME,
        COMPANY_ID,
        BRANCH_ID,
        PO_STORE_ID,
        CAMP_ID,
        REQUEST_STORE_ID,
        REQUEST_TYPE_ID,
        PRIORITY_ID,
        REQUIRED_DATE,
        REASON,

        SECTION_HEAD_RESPONSE_PERSON_EMP_ID,
        SECTION_HEAD_RESPONSE_DATE,
        SECTION_HEAD_RESPONSE_STATUS,
        SECTION_HEAD_RESPONSE_REMARKS,
        SECTION_HEAD_RESPONSE_IP_ADDRESS,

        RESPONSE_1_EMP_ID,
        RESPONSE_1_DATE,
        RESPONSE_1_STATUS,
        RESPONSE_1_REMARKS,
        RESPONSE_1_IP_ADDRESS,
        RESPONSE_2_EMP_ID,
        RESPONSE_2_DATE,
        RESPONSE_2_STATUS,
        RESPONSE_2_REMARKS,
        RESPONSE_2_IP_ADDRESS,
        FINAL_RESPONSE_EMP_ID,
        FINAL_RESPONSE_DATE,
        FINAL_RESPONSE_STATUS,
        FINAL_RESPONSE_REMARKS,
        FINAL_RESPONSE_IP_ADDRESS,

        STATUS_ID,
        REMARKS,
        STATUS_ENTRY,

        CREATED_BY,
        CREATED_DATE,
        CREATED_MAC_ADDRESS,
        MODIFIED_BY,
        MODIFIED_DATE,
        MODIFIED_MAC_ADDRESS,
        DELIVERY_LOCATION_ID
    )
    VALUES
    (
        @PURCHASE_REQUEST_NO,
        @PURCHASE_REQUEST_DATE,
        @REQUESTED_BY_EMP_ID,
        NULLIF(LTRIM(RTRIM(ISNULL(@REQUESTED_BY_NAME, ''))), ''),
        @COMPANY_ID,
        @BRANCH_ID,
        @PO_STORE_ID,
        @CAMP_ID,
        @REQUEST_STORE_ID,
        @REQUEST_TYPE_ID,
        @PRIORITY_ID,
        @REQUIRED_DATE,
        @REASON,

        @SECTION_HEAD_RESPONSE_PERSON_EMP_ID,
        @SECTION_HEAD_RESPONSE_DATE,
        @SECTION_HEAD_RESPONSE_STATUS,
        @SECTION_HEAD_RESPONSE_REMARKS,
        @SECTION_HEAD_RESPONSE_IP_ADDRESS,

        @RESPONSE_1_EMP_ID,
        @RESPONSE_1_DATE,
        @RESPONSE_1_STATUS,
        @RESPONSE_1_REMARKS,
        @RESPONSE_1_IP_ADDRESS,
        @RESPONSE_2_EMP_ID,
        @RESPONSE_2_DATE,
        @RESPONSE_2_STATUS,
        @RESPONSE_2_REMARKS,
        @RESPONSE_2_IP_ADDRESS,
        @FINAL_RESPONSE_EMP_ID,
        @FINAL_RESPONSE_DATE,
        @FINAL_RESPONSE_STATUS,
        @FINAL_RESPONSE_REMARKS,
        @FINAL_RESPONSE_IP_ADDRESS,

        @STATUS_ID,
        @REMARKS,
        ISNULL(@STATUS_ENTRY, 'CF'),

        @USER, GETDATE(),
        @MAC_ADDRESS,
        @USER, GETDATE(),
        @MAC_ADDRESS,
        @DELIVERY_LOCATION_ID
    )

    SELECT '' AS STATUS, 'Data Saved Successfully' AS MESSAGE, @PURCHASE_REQUEST_NO AS DATA;
END
GO

/* ---------------------------------------------------------------------------
   UPDATE_PURCHASE_REQUEST_HDR

   Same two changes as the save: the new parameter after @REQUESTED_BY_EMP_ID and
   its column in the UPDATE. The 'not found' and 'already submitted' guards are
   preserved exactly as they were.
   --------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [VPurchase].[UPDATE_PURCHASE_REQUEST_HDR]
(
    @PURCHASE_REQUEST_NO VARCHAR(50),
    @PURCHASE_REQUEST_DATE DATETIME,

    @REQUESTED_BY_EMP_ID INT,
    @REQUESTED_BY_NAME VARCHAR(200),
    @COMPANY_ID INT,
    @BRANCH_ID INT,
    @PO_STORE_ID INT,
    @CAMP_ID INT,
    @REQUEST_STORE_ID INT,
    @REQUEST_TYPE_ID INT,
    @PRIORITY_ID INT,

    @REQUIRED_DATE DATETIME,
    @REASON VARCHAR(500),

    @SECTION_HEAD_RESPONSE_PERSON_EMP_ID INT,
    @SECTION_HEAD_RESPONSE_DATE DATETIME,
    @SECTION_HEAD_RESPONSE_STATUS VARCHAR(50),
    @SECTION_HEAD_RESPONSE_REMARKS VARCHAR(50),
    @SECTION_HEAD_RESPONSE_IP_ADDRESS VARCHAR(50),

    @RESPONSE_1_EMP_ID INT,
    @RESPONSE_1_DATE DATETIME,
    @RESPONSE_1_STATUS VARCHAR(50),
    @RESPONSE_1_REMARKS VARCHAR(50),
    @RESPONSE_1_IP_ADDRESS VARCHAR(50),

    @RESPONSE_2_EMP_ID INT,
    @RESPONSE_2_DATE DATETIME,
    @RESPONSE_2_STATUS VARCHAR(50),
    @RESPONSE_2_REMARKS VARCHAR(50),
    @RESPONSE_2_IP_ADDRESS VARCHAR(50),

    @FINAL_RESPONSE_EMP_ID INT,
    @FINAL_RESPONSE_DATE DATETIME,
    @FINAL_RESPONSE_STATUS VARCHAR(50),
    @FINAL_RESPONSE_REMARKS VARCHAR(50),
    @FINAL_RESPONSE_IP_ADDRESS VARCHAR(50),

    @STATUS_ID INT,
    @REMARKS VARCHAR(500),
    @STATUS_ENTRY VARCHAR(50),

    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50),
    @DELIVERY_LOCATION_ID  int
)
AS
BEGIN
    SET NOCOUNT ON

    IF NOT EXISTS (
        SELECT 1 FROM [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
        WHERE PURCHASE_REQUEST_NO = @PURCHASE_REQUEST_NO
    )
    BEGIN
        SELECT 'Error', 'Purchase Request not found.', ''
        RETURN
    END

    IF EXISTS (
        SELECT 1 FROM [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
        WHERE PURCHASE_REQUEST_NO = @PURCHASE_REQUEST_NO
          AND UPPER(LTRIM(RTRIM(ISNULL(STATUS_ENTRY,'')))) = 'CL'
    )
    BEGIN
        SELECT 'Error', 'Records Already Submitted You Can''t Change Anything. Contact To Admin', ''
        RETURN
    END

    UPDATE [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
    SET
        PURCHASE_REQUEST_DATE = @PURCHASE_REQUEST_DATE,

        REQUESTED_BY_EMP_ID = @REQUESTED_BY_EMP_ID,
        /* Never blank out a name we already have - the employee row may have been
           removed since the request was raised. */
        REQUESTED_BY_NAME  = COALESCE(NULLIF(LTRIM(RTRIM(ISNULL(@REQUESTED_BY_NAME, ''))), ''), REQUESTED_BY_NAME),
        COMPANY_ID          = @COMPANY_ID,
        BRANCH_ID           = @BRANCH_ID,
        PO_STORE_ID         = @PO_STORE_ID,
        CAMP_ID             = @CAMP_ID,
        REQUEST_STORE_ID    = @REQUEST_STORE_ID,
        REQUEST_TYPE_ID     = @REQUEST_TYPE_ID,
        PRIORITY_ID         = @PRIORITY_ID,

        REQUIRED_DATE = @REQUIRED_DATE,
        REASON        = @REASON,

        SECTION_HEAD_RESPONSE_PERSON_EMP_ID = @SECTION_HEAD_RESPONSE_PERSON_EMP_ID,
        SECTION_HEAD_RESPONSE_DATE          = @SECTION_HEAD_RESPONSE_DATE,
        SECTION_HEAD_RESPONSE_STATUS        = @SECTION_HEAD_RESPONSE_STATUS,
        SECTION_HEAD_RESPONSE_REMARKS       = @SECTION_HEAD_RESPONSE_REMARKS,
        SECTION_HEAD_RESPONSE_IP_ADDRESS    = @SECTION_HEAD_RESPONSE_IP_ADDRESS,

        RESPONSE_1_EMP_ID      = @RESPONSE_1_EMP_ID,
        RESPONSE_1_DATE        = @RESPONSE_1_DATE,
        RESPONSE_1_STATUS      = @RESPONSE_1_STATUS,
        RESPONSE_1_REMARKS     = @RESPONSE_1_REMARKS,
        RESPONSE_1_IP_ADDRESS  = @RESPONSE_1_IP_ADDRESS,

        RESPONSE_2_EMP_ID      = @RESPONSE_2_EMP_ID,
        RESPONSE_2_DATE        = @RESPONSE_2_DATE,
        RESPONSE_2_STATUS      = @RESPONSE_2_STATUS,
        RESPONSE_2_REMARKS     = @RESPONSE_2_REMARKS,
        RESPONSE_2_IP_ADDRESS  = @RESPONSE_2_IP_ADDRESS,

        FINAL_RESPONSE_EMP_ID      = @FINAL_RESPONSE_EMP_ID,
        FINAL_RESPONSE_DATE        = @FINAL_RESPONSE_DATE,
        FINAL_RESPONSE_STATUS      = @FINAL_RESPONSE_STATUS,
        FINAL_RESPONSE_REMARKS     = @FINAL_RESPONSE_REMARKS,
        FINAL_RESPONSE_IP_ADDRESS  = @FINAL_RESPONSE_IP_ADDRESS,

        STATUS_ID    = @STATUS_ID,
        REMARKS      = @REMARKS,
        STATUS_ENTRY = ISNULL(@STATUS_ENTRY, STATUS_ENTRY),

        MODIFIED_BY          = @USER,
        MODIFIED_DATE        = GETDATE(),
        MODIFIED_MAC_ADDRESS = @MAC_ADDRESS,
        DELIVERY_LOCATION_ID = @DELIVERY_LOCATION_ID
    WHERE PURCHASE_REQUEST_NO = @PURCHASE_REQUEST_NO;

    SELECT '', 'Data Updated Successfully', @PURCHASE_REQUEST_NO;
END
GO