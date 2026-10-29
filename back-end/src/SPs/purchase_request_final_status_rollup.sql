/* ============================================================================
   VPurchase.GET_PURCHASE_REQUEST_HDR

   This is the read behind the purchase request *entry* screen (list + the
   submit button + the "Final Status" filter). It only ever derived its final
   status from RESPONSE_2 / FINAL_RESPONSE_STATUS, while the approval panel
   derives it from the whole three-level chain (Section Head -> Response 1 ->
   Response 2). The two therefore disagreed on any request that was stopped
   before the last level:

     VIT/2026/PR/3  Section Head rejected        entry: Pending  panel: REJECTED
     VIT/2026/PR/2  Section Head put on hold     entry: Pending  panel: HOLD

   The rollup below is now the *same expression* the approval list uses
   (VPurchase.GET_APPROVAL_LIST_PURCHASE_REQUEST), so the entry screen and the
   approval panel can never disagree again:

     REJECTED  any level rejected (REJECTED beats everything)
     HOLD      otherwise, any level on hold
     APPROVED  final level approved
     PENDING   nobody has decided yet

   Nothing else in the procedure changes; the signature, the by-number and
   by-sno short-circuit reads, the columns and the paging are untouched.
   ============================================================================ */
CREATE OR ALTER PROCEDURE [VPurchase].[GET_PURCHASE_REQUEST_HDR]
(
    @PURCHASE_REQUEST_NO VARCHAR(50) = NULL,
    @SNO INT = NULL,
    @Status VARCHAR(20) = 'ALL',
    @FromDate DATE = NULL,
    @ToDate DATE = NULL,
    @CompanyId INT = NULL,
    @StoreId INT = NULL,
    @CampId INT = NULL,
    @BranchId INT = NULL,
    @Search NVARCHAR(200) = NULL,
    @Page INT = NULL,
    @PageSize INT = NULL
)
AS
BEGIN
    SET NOCOUNT ON;


    IF @PURCHASE_REQUEST_NO IS NOT NULL
    BEGIN
        SELECT * FROM [VPurchase].[TBL_PURCHASE_REQUEST_HDR] WHERE PURCHASE_REQUEST_NO = @PURCHASE_REQUEST_NO;
        RETURN;
    END

    IF @SNO IS NOT NULL
    BEGIN
        SELECT * FROM [VPurchase].[TBL_PURCHASE_REQUEST_HDR]  WHERE SNO = @SNO;
        RETURN;
    END


    DROP TABLE IF EXISTS #REPORT_PR_HDR;

    ;WITH CTE AS
    (
        SELECT
             A.SNO                        AS sno
            ,A.PURCHASE_REQUEST_NO         AS purchaseRequestNo
            ,A.PURCHASE_REQUEST_NO         AS poRefNo
            ,A.PURCHASE_REQUEST_NO         AS requestRefNo
            ,A.PURCHASE_REQUEST_NO         AS refNo
            ,A.PURCHASE_REQUEST_DATE       AS purchaseRequestDate
            ,A.PURCHASE_REQUEST_DATE       AS poDate
            ,A.REQUESTED_BY_EMP_ID         AS requestedByEmpId
            ,A.REQUESTED_BY_NAME           AS requestedByName
            ,CASE
                WHEN LTRIM(RTRIM(ISNULL(A.REQUESTED_BY_NAME,''))) <> ''
                    THEN LTRIM(RTRIM(A.REQUESTED_BY_NAME))
                WHEN LTRIM(RTRIM(ISNULL(E.FIRST_NAME,'') + ' ' + ISNULL(E.MIDDLE_NAME,'') + ' ' + ISNULL(E.LAST_NAME,''))) <> ''
                    THEN LTRIM(RTRIM(REPLACE(ISNULL(E.FIRST_NAME,'') + ' ' + ISNULL(E.MIDDLE_NAME,'') + ' ' + ISNULL(E.LAST_NAME,''), '  ', ' ')))
                /* Logins that are not employees ('sandy', 'sri') have no employee
                   row to join, so use the login that raised the request. */
                WHEN LTRIM(RTRIM(ISNULL(A.CREATED_BY,''))) <> ''
                    THEN LTRIM(RTRIM(A.CREATED_BY))
                WHEN A.REQUESTED_BY_EMP_ID IS NOT NULL
                    THEN 'EMP ' + CAST(A.REQUESTED_BY_EMP_ID AS VARCHAR(20))
                ELSE ''
             END                           AS requestedBy
            ,A.COMPANY_ID                  AS companyId
            ,C.COMPANY_NAME                AS companyName
            ,A.BRANCH_ID                   AS branchId
            ,BR.BRANCH_NAME                AS branchName
            ,A.PO_STORE_ID                 AS poStoreId
            ,PS.STORE_NAME                 AS poStoreName
            ,A.CAMP_ID                     AS campId
            ,CP.CAMP_NAME                  AS campName
            ,A.REQUEST_STORE_ID            AS requestStoreId
            ,RS.STORE_NAME                 AS requestStoreName
            ,A.REQUEST_TYPE_ID             AS requestTypeId
            ,RT.REQUEST_TYPE_NAME          AS requestTypeName
            ,A.PRIORITY_ID                 AS priorityId
            ,PR.PRIORITY_NAME              AS priorityName
            ,A.REQUIRED_DATE               AS requiredDate
            ,A.REASON                      AS reason

            ,A.SECTION_HEAD_RESPONSE_PERSON_EMP_ID AS sectionHeadPersonEmpId
            ,A.SECTION_HEAD_RESPONSE_DATE  AS sectionHeadDate
            ,A.SECTION_HEAD_RESPONSE_STATUS AS sectionHeadStatusRaw
            ,CASE UPPER(LTRIM(RTRIM(ISNULL(A.SECTION_HEAD_RESPONSE_STATUS, ''))))
                WHEN 'APPROVAL' THEN 'APPROVED'
                WHEN 'APPROVED' THEN 'APPROVED'
                WHEN 'REJECT'   THEN 'REJECTED'
                WHEN 'REJECTED' THEN 'REJECTED'
                WHEN 'HOLD'     THEN 'HOLD'
                ELSE ''
             END      AS sectionHeadStatus
            ,A.SECTION_HEAD_RESPONSE_REMARKS AS sectionHeadRemarks
            ,A.SECTION_HEAD_RESPONSE_IP_ADDRESS AS sectionHeadIpAddress

            ,A.RESPONSE_1_EMP_ID           AS response1EmpId
            ,A.RESPONSE_1_DATE             AS response1Date
            ,CASE UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_1_STATUS, ''))))
                WHEN 'APPROVAL' THEN 'APPROVED'
                WHEN 'APPROVED' THEN 'APPROVED'
                WHEN 'REJECT'   THEN 'REJECTED'
                WHEN 'REJECTED' THEN 'REJECTED'
                WHEN 'HOLD'     THEN 'HOLD'
                ELSE ''
             END                           AS response1Status
            ,A.RESPONSE_1_REMARKS          AS response1Remarks
            ,A.RESPONSE_1_IP_ADDRESS       AS response1IpAddress

            ,A.RESPONSE_2_EMP_ID           AS response2EmpId
            ,A.RESPONSE_2_DATE             AS response2Date
            ,CASE UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_2_STATUS, ''))))
                WHEN 'APPROVAL' THEN 'APPROVED'
                WHEN 'APPROVED' THEN 'APPROVED'
                WHEN 'REJECT'   THEN 'REJECTED'
                WHEN 'REJECTED' THEN 'REJECTED'
                WHEN 'HOLD'     THEN 'HOLD'
                ELSE ''
             END                           AS response2Status
            ,A.RESPONSE_2_REMARKS          AS response2Remarks
            ,A.RESPONSE_2_IP_ADDRESS       AS response2IpAddress

            ,A.RESPONSE_2_EMP_ID          AS finalResponseEmpId
            ,A.RESPONSE_2_DATE            AS finalResponseDate
            ,A.RESPONSE_2_REMARKS         AS finalResponseRemarks
            ,A.RESPONSE_2_IP_ADDRESS      AS finalResponseIpAddress
            /* Same rollup as VPurchase.GET_APPROVAL_LIST_PURCHASE_REQUEST.
               REJECTED is tested first so a request that was stopped early is
               never reported as approved by a later level, and every level is
               covered so a Section Head decision is not lost. */
            ,CASE
                WHEN UPPER(LTRIM(RTRIM(ISNULL(A.FINAL_RESPONSE_STATUS, '')))) IN ('REJECT','REJECTED')
                  OR UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_2_STATUS, '')))) IN ('REJECT','REJECTED')
                  OR UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_1_STATUS, '')))) IN ('REJECT','REJECTED')
                  OR UPPER(LTRIM(RTRIM(ISNULL(A.SECTION_HEAD_RESPONSE_STATUS, '')))) IN ('REJECT','REJECTED')
                    THEN 'REJECTED'
                WHEN UPPER(LTRIM(RTRIM(ISNULL(A.FINAL_RESPONSE_STATUS, '')))) = 'HOLD'
                  OR UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_2_STATUS, '')))) = 'HOLD'
                  OR UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_1_STATUS, '')))) = 'HOLD'
                  OR UPPER(LTRIM(RTRIM(ISNULL(A.SECTION_HEAD_RESPONSE_STATUS, '')))) = 'HOLD'
                    THEN 'HOLD'
                WHEN UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_2_STATUS, '')))) IN ('APPROVAL','APPROVED')
                  OR UPPER(LTRIM(RTRIM(ISNULL(A.FINAL_RESPONSE_STATUS, '')))) IN ('APPROVAL','APPROVED')
                    THEN 'APPROVED'
                ELSE 'PENDING'
             END                           AS finalResponseStatus

            ,A.STATUS_ID                   AS statusId
            ,SM.STATUS_NAME                AS statusName
            ,A.REMARKS                     AS remarks
            ,A.STATUS_ENTRY                AS statusEntry

            ,A.CREATED_BY                  AS createdBy
            ,A.CREATED_DATE                AS createdDate
            ,A.MODIFIED_BY                 AS modifiedBy
            ,A.MODIFIED_DATE               AS modifiedDate
        FROM [VPurchase].[TBL_PURCHASE_REQUEST_HDR] A
        LEFT JOIN VMaster.TBL_COMPANY_MASTER               C  ON C.COMPANY_ID       = A.COMPANY_ID
        LEFT JOIN VMaster.TBL_BRANCH_MASTER                BR ON BR.BRANCH_ID       = A.BRANCH_ID
        LEFT JOIN VMaster.TBL_STORE_MASTER                 PS ON PS.STORE_ID        = A.PO_STORE_ID
        LEFT JOIN VMaster.TBL_STORE_MASTER                 RS ON RS.STORE_ID        = A.REQUEST_STORE_ID
        LEFT JOIN VMaster.TBL_CAMP_MASTER                  CP ON CP.CAMP_ID         = A.CAMP_ID
        LEFT JOIN VMaster.TBL_PURCHASE_REQUEST_TYPE_MASTER RT ON RT.REQUEST_TYPE_ID = A.REQUEST_TYPE_ID
        LEFT JOIN VMaster.TBL_PRIORITY_MASTER              PR ON PR.PRIORITY_ID     = A.PRIORITY_ID
        LEFT JOIN VMaster.TBL_STATUS_MASTER                SM ON SM.STATUS_ID       = A.STATUS_ID
        LEFT JOIN VPayEntries.NEW_EMPLOYEE_DATABASE        E  ON E.EMP_ID           = A.REQUESTED_BY_EMP_ID
        WHERE (@FromDate IS NULL OR CONVERT(DATE, A.PURCHASE_REQUEST_DATE) >= @FromDate)
          AND (@ToDate   IS NULL OR CONVERT(DATE, A.PURCHASE_REQUEST_DATE) <= @ToDate)
          AND (@CompanyId IS NULL OR A.COMPANY_ID   = @CompanyId)
          AND (@StoreId   IS NULL OR A.PO_STORE_ID  = @StoreId OR A.REQUEST_STORE_ID = @StoreId)
          AND (@CampId    IS NULL OR A.CAMP_ID      = @CampId)
          AND (@BranchId  IS NULL OR A.BRANCH_ID    = @BranchId)
    )
    SELECT * INTO #REPORT_PR_HDR
    FROM CTE
    WHERE (@Status = 'ALL' OR finalResponseStatus = UPPER(LTRIM(RTRIM(@Status))))
      AND (@Search IS NULL OR CONCAT(
          ISNULL(CAST(sno AS VARCHAR(20)), ''), ' ',
          ISNULL(refNo, ''), ' ',
          ISNULL(requestedBy, ''), ' ',
          ISNULL(CAST(requestedByEmpId AS VARCHAR(20)), ''), ' ',
          ISNULL(companyName, ''), ' ',
          ISNULL(branchName, ''), ' ',
          ISNULL(poStoreName, ''), ' ',
          ISNULL(requestStoreName, ''), ' ',
          ISNULL(campName, ''), ' ',
          ISNULL(priorityName, ''), ' ',
          ISNULL(requestTypeName, '')
      ) LIKE '%' + @Search + '%');

    IF @Page IS NOT NULL AND @PageSize IS NOT NULL
    BEGIN
        SELECT COUNT(*) AS Total FROM #REPORT_PR_HDR;
        SELECT * FROM #REPORT_PR_HDR
        ORDER BY sno DESC
        OFFSET (@Page - 1) * @PageSize ROWS
        FETCH NEXT @PageSize ROWS ONLY;
    END
    ELSE
    BEGIN
        SELECT * FROM #REPORT_PR_HDR ORDER BY sno DESC;
    END

    DROP TABLE IF EXISTS #REPORT_PR_HDR;
END
GO
