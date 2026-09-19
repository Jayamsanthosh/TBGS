-- =============================================================
-- [VRequest].[GET_LEAVE_ENCASHMENT_REQUEST]  (Dual-mode)
--   * @LEAVE_ENCASHMENT_REQUEST_REF_NO given -> single-record detail.
--   * ref blank                               -> Leave Encashment list
--                                               for the Report Dashboard
--                                               (same aliases/filters/paging
--                                               as GET_REQUEST_LIST_BY_TYPE).
-- =============================================================
CREATE OR ALTER PROCEDURE [VRequest].[GET_LEAVE_ENCASHMENT_REQUEST]
(
    @LEAVE_ENCASHMENT_REQUEST_REF_NO VARCHAR(50) = NULL,
    @Status VARCHAR(50) = 'ALL',
    @FromDate DATE = NULL,
    @ToDate DATE = NULL,
    @CompanyId INT = NULL,
    @StoreId INT = NULL,
    @CampId INT = NULL,
    @DepartmentId INT = NULL,
    @Search NVARCHAR(200) = NULL,
    @Page INT = NULL,
    @PageSize INT = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    IF LTRIM(RTRIM(ISNULL(@LEAVE_ENCASHMENT_REQUEST_REF_NO, ''))) <> ''
    BEGIN
        SELECT
            SNO,
            LEAVE_ENCASHMENT_REQUEST_REF_NO,
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
            BALANCE_LEAVE_DAYS,
            LEAVE_ENCASHMENT_DAYS,
            LEAVE_ENCASHMENT_GROSS_AMOUNT,
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
        FROM [VREQUEST].[TBL_LEAVE_ENCASHMENT_REQUEST]
        WHERE LEAVE_ENCASHMENT_REQUEST_REF_NO = @LEAVE_ENCASHMENT_REQUEST_REF_NO;
        RETURN;
    END

    DROP TABLE IF EXISTS #REPORT_LEAVE;
    ;WITH CTE AS
    (
        SELECT
            A.SNO AS sno,
            A.LEAVE_ENCASHMENT_REQUEST_REF_NO AS poRefNo,
            A.LEAVE_ENCASHMENT_REQUEST_REF_NO AS requestRefNo,
            A.LEAVE_ENCASHMENT_REQUEST_REF_NO AS refNo,
            A.COMPANY_ID AS companyId,
            C.COMPANY_NAME AS companyName,
            D.DEPARTMENT_NAME AS department,
            D.DEPARTMENT_NAME AS departmentName,
            DS.DESIGNATION_NAME AS designation,
            DS.DESIGNATION_NAME AS designationName,
            A.STORE_ID AS poStoreId,
            S.STORE_NAME AS storeName,
            'Leave Encashment' AS purchaseType,
            CUR.CURRENCY_NAME AS currencyType,
            A.LEAVE_ENCASHMENT_GROSS_AMOUNT AS amount,
            A.LEAVE_ENCASHMENT_GROSS_AMOUNT AS totalFinalProductionHdrAmount,
            NULL AS vatHdrAmount,
            NULL AS supplierId,
            NULL AS supplierName,
            NULL AS cell,
            A.CREATED_DATE AS poDate,
            CASE
                WHEN LTRIM(RTRIM(ISNULL(A.FIRST_NAME,'') + ' ' + ISNULL(A.MIDDLE_NAME,'') + ' ' + ISNULL(A.LAST_NAME,''))) = ''
                    THEN 'EMP ' + CAST(A.EMP_ID AS VARCHAR(20))
                ELSE LTRIM(RTRIM(REPLACE(ISNULL(A.FIRST_NAME,'') + ' ' + ISNULL(A.MIDDLE_NAME,'') + ' ' + ISNULL(A.LAST_NAME,''), '  ', ' ')))
            END AS requestedBy,
            A.CREATED_DATE AS requestedDate,
            A.CREATED_DATE AS createdDate,
            A.STATUS_MASTER AS statusEntry,
            CASE UPPER(LTRIM(RTRIM(ISNULL(A.FINAL_RESPONSE_STATUS,
                    ISNULL(A.RESPONSE_2_STATUS, ISNULL(A.RESPONSE_1_STATUS,
                    ISNULL(A.SECTION_HEAD_RESPONSE_STATUS, 'Pending')))))))
                WHEN 'APPROVAL' THEN 'APPROVED'
                WHEN 'APPROVED' THEN 'APPROVED'
                WHEN 'REJECT'   THEN 'REJECTED'
                WHEN 'REJECTED' THEN 'REJECTED'
                WHEN 'HOLD'     THEN 'HOLD'
                ELSE 'PENDING'
            END AS finalResponseStatus,
            CASE UPPER(LTRIM(RTRIM(ISNULL(A.SECTION_HEAD_RESPONSE_STATUS,''))))
                WHEN 'APPROVAL' THEN 'APPROVED'
                WHEN 'APPROVED' THEN 'APPROVED'
                WHEN 'REJECT'   THEN 'REJECTED'
                WHEN 'REJECTED' THEN 'REJECTED'
                WHEN 'HOLD'     THEN 'HOLD'
                ELSE ''
            END AS sectionHeadStatus,
            A.SECTION_HEAD_RESPONSE_REMARKS AS sectionHeadRemarks,
            CAST(A.SECTION_HEAD_RESPONSE_PERSON_EMP_ID AS VARCHAR(20)) AS sectionHeadPerson,
            A.SECTION_HEAD_RESPONSE_DATE AS sectionHeadDate,
            CASE UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_1_STATUS,''))))
                WHEN 'APPROVAL' THEN 'APPROVED'
                WHEN 'APPROVED' THEN 'APPROVED'
                WHEN 'REJECT'   THEN 'REJECTED'
                WHEN 'REJECTED' THEN 'REJECTED'
                WHEN 'HOLD'     THEN 'HOLD'
                ELSE ''
            END AS response1Status,
            A.RESPONSE_1_REMARKS AS response1Remarks,
            CAST(A.RESPONSE_1_EMP_ID AS VARCHAR(20)) AS response1Person,
            A.RESPONSE_1_DATE AS response1Date,
            CASE UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_2_STATUS,''))))
                WHEN 'APPROVAL' THEN 'APPROVED'
                WHEN 'APPROVED' THEN 'APPROVED'
                WHEN 'REJECT'   THEN 'REJECTED'
                WHEN 'REJECTED' THEN 'REJECTED'
                WHEN 'HOLD'     THEN 'HOLD'
                ELSE ''
            END AS response2Status,
            A.RESPONSE_2_REMARKS AS response2Remarks,
            CAST(A.RESPONSE_2_EMP_ID AS VARCHAR(20)) AS response2Person,
            A.RESPONSE_2_DATE AS response2Date,
            A.FINAL_RESPONSE_REMARKS AS finalResponseRemarks,
            CAST(A.FINAL_RESPONSE_EMP_ID AS VARCHAR(20)) AS finalResponsePerson,
            A.FINAL_RESPONSE_DATE AS finalResponseDate,
            A.CREATED_BY AS createdBy,
            A.REASON AS reason,
            NULL AS approvedAmount,
            A.MONTH_ENTERED AS monthEntered,
            A.YEAR_ENTERED AS yearEntered,
            A.BALANCE_LEAVE_DAYS AS balanceLeaveDays,
            A.LEAVE_ENCASHMENT_DAYS AS leaveEncashmentDays,
            A.LEAVE_ENCASHMENT_GROSS_AMOUNT AS grossAmount,
            A.CAMP_ID AS campId,
            CP.CAMP_NAME AS campName,
            A.STORE_ID AS storeId,
            A.DEPARTMENT_ID AS departmentId,
            A.EMP_ID AS empId
        FROM [VREQUEST].[TBL_LEAVE_ENCASHMENT_REQUEST] A
        LEFT JOIN VMaster.TBL_COMPANY_MASTER C ON C.COMPANY_ID = A.COMPANY_ID
        LEFT JOIN VMaster.TBL_STORE_MASTER S ON S.STORE_ID = A.STORE_ID
        LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER D ON D.DEPARTMENT_ID = A.DEPARTMENT_ID
        LEFT JOIN VMaster.TBL_DESIGNATION_MASTER DS ON DS.DESIGNATION_ID = A.DESIGNATION_ID
        LEFT JOIN VMaster.TBL_CURRENCY_MASTER CUR ON CUR.CURRENCY_ID = A.CURRENCY_ID
        LEFT JOIN VMaster.TBL_CAMP_MASTER CP ON CP.CAMP_ID = A.CAMP_ID
        WHERE A.STATUS_MASTER = 'AC'
          AND (@FromDate IS NULL OR CONVERT(date, A.CREATED_DATE) >= @FromDate)
          AND (@ToDate IS NULL OR CONVERT(date, A.CREATED_DATE) <= @ToDate)
          AND (@CompanyId IS NULL OR A.COMPANY_ID = @CompanyId)
          AND (@StoreId IS NULL OR A.STORE_ID = @StoreId)
          AND (@CampId IS NULL OR A.CAMP_ID = @CampId)
          AND (@DepartmentId IS NULL OR A.DEPARTMENT_ID = @DepartmentId)
    )
    SELECT * INTO #REPORT_LEAVE
    FROM CTE
    WHERE (@Status = 'ALL' OR finalResponseStatus = UPPER(LTRIM(RTRIM(@Status))))
      AND (@Search IS NULL OR CONCAT(
          ISNULL(CAST(sno AS VARCHAR(20)), ''), ' ',
          ISNULL(refNo, ''), ' ',
          ISNULL(requestedBy, ''), ' ',
          ISNULL(CAST(empId AS VARCHAR(20)), ''), ' ',
          ISNULL(companyName, ''), ' ',
          ISNULL(storeName, ''), ' ',
          ISNULL(campName, ''), ' ',
          ISNULL(departmentName, '')
      ) LIKE '%' + @Search + '%');

    IF @Page IS NOT NULL AND @PageSize IS NOT NULL
    BEGIN
        SELECT COUNT(*) AS Total FROM #REPORT_LEAVE;
        SELECT * FROM #REPORT_LEAVE
        ORDER BY sno DESC
        OFFSET (@Page - 1) * @PageSize ROWS
        FETCH NEXT @PageSize ROWS ONLY;
    END
    ELSE
    BEGIN
        SELECT * FROM #REPORT_LEAVE ORDER BY sno DESC;
    END
    DROP TABLE IF EXISTS #REPORT_LEAVE;
END
GO