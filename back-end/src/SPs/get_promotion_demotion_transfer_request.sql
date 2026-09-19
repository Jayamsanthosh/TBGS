-- =============================================================
-- [VRequest].[GET_PROMOTION_DEMOTION_TRANSFER_REQUEST]  (Dual-mode)
--   * @TRANSFER_REQUEST_REF_NO given -> single-record detail (entry screen).
--   * ref blank                       -> Promotion/Demotion/Transfer list
--                                        for the Report Dashboard
--                                        (same aliases/filters/paging as
--                                        GET_REQUEST_LIST_BY_TYPE).
-- =============================================================
CREATE OR ALTER PROCEDURE [VRequest].[GET_PROMOTION_DEMOTION_TRANSFER_REQUEST]
(
    @TRANSFER_REQUEST_REF_NO VARCHAR(50) = NULL,
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

    IF LTRIM(RTRIM(ISNULL(@TRANSFER_REQUEST_REF_NO, ''))) <> ''
    BEGIN
        SELECT
            SNO,
            TRANSFER_REQUEST_REF_NO,
            MONTH_ENTERED,
            YEAR_ENTERED,
            TRANSFER_TYPE,
            EMP_ID,
            FIRST_NAME,
            MIDDLE_NAME,
            LAST_NAME,
            EMPLOYMENT_TYPE_ID,
            CURRENCY_ID,
            OLD_COMPANY_ID,
            OLD_DEPARTMENT_ID,
            OLD_DESIGNATION_ID,
            OLD_DEPARTMENT_GROUP_ID,
            OLD_DESIGNATION_GROUP_ID,
            OLD_CAMP_ID,
            OLD_STORE_ID,
            OLD_SALARY_SCALE_ID,
            OLD_BASIC_SALARY,
            OLD_FOT_ALLOWANCE,
            OLD_ATTENDANCE_ALLOWANCE,
            OLD_ONE_1YP_ALLOWANCE,
            OLD_TECHNICAL,
            OLD_POLYVALENT,
            OLD_RESPONSIBILITY,
            OLD_LOYALTY,
            OLD_PRODUCTIVITY,
            OLD_CAPACITY,
            OLD_DISCIPLINARY,
            OLD_HOUSE_ALLOW,
            OLD_MEDICIAL,
            OLD_EDUCATION,
            OLD_MISCELLANIES,
            OLD_NIGHT_ALLOWANCE,
            OLD_EXTRA1,
            OLD_EXTRA2,
            OLD_EXTRA3,
            OLD_EXTRA4,
            OLD_EXTRA5,
            OLD_EXTRA6,
            OLD_GROSS_AMOUNT,
            NEW_COMPANY_ID,
            NEW_DEPARTMENT_ID,
            NEW_DESIGNATION_ID,
            NEW_DEPARTMENT_GROUP_ID,
            NEW_DESIGNATION_GROUP_ID,
            NEW_CAMP_ID,
            NEW_STORE_ID,
            NEW_SALARY_SCALE_ID,
            NEW_BASIC_SALARY,
            NEW_FOT_ALLOWANCE,
            NEW_ATTENDANCE_ALLOWANCE,
            NEW_ONE_1YP_ALLOWANCE,
            NEW_TECHNICAL,
            NEW_POLYVALENT,
            NEW_RESPONSIBILITY,
            NEW_LOYALTY,
            NEW_PRODUCTIVITY,
            NEW_CAPACITY,
            NEW_DISCIPLINARY,
            NEW_HOUSE_ALLOW,
            NEW_MEDICIAL,
            NEW_EDUCATION,
            NEW_MISCELLANIES,
            NEW_NIGHT_ALLOWANCE,
            NEW_EXTRA1,
            NEW_EXTRA2,
            NEW_EXTRA3,
            NEW_EXTRA4,
            NEW_EXTRA5,
            NEW_EXTRA6,
            NEW_GROSS_AMOUNT,
            NEW_APPROVED_MAN_POWER,
            NEW_CURRENT_MAN_POWER,
            NEW_PENDING_MAN_POWER,
            NEW_BALANCE_MAN_POWER,
            REPORTING_MANAGER_ID,
            REPORTING_MANAGER_COMMENTS,
            MANAGER_RECOMMENDED_YN,
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
        FROM [VREQUEST].[TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST]
        WHERE TRANSFER_REQUEST_REF_NO = @TRANSFER_REQUEST_REF_NO;
        RETURN;
    END

    DROP TABLE IF EXISTS #REPORT_TRANSFER;
    ;WITH CTE AS
    (
        SELECT
            A.SNO AS sno,
            A.TRANSFER_REQUEST_REF_NO AS poRefNo,
            A.TRANSFER_REQUEST_REF_NO AS requestRefNo,
            A.TRANSFER_REQUEST_REF_NO AS refNo,
            A.OLD_COMPANY_ID AS companyId,
            OC.COMPANY_NAME AS companyName,
            OD.DEPARTMENT_NAME AS department,
            OD.DEPARTMENT_NAME AS departmentName,
            ODS.DESIGNATION_NAME AS designation,
            ODS.DESIGNATION_NAME AS designationName,
            A.OLD_STORE_ID AS poStoreId,
            OST.STORE_NAME AS storeName,
            'Transfer' AS purchaseType,
            CUR.CURRENCY_NAME AS currencyType,
            A.NEW_GROSS_AMOUNT AS amount,
            A.NEW_GROSS_AMOUNT AS totalFinalProductionHdrAmount,
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
            A.TRANSFER_TYPE AS transferType,
            NC.COMPANY_NAME AS newCompanyName,
            ND.DEPARTMENT_NAME AS newDepartment,
            NDS.DESIGNATION_NAME AS newDesignation,
            NST.STORE_NAME AS newStoreName,
            NCP.CAMP_NAME AS newCampName,
            A.OLD_GROSS_AMOUNT AS oldGrossAmount,
            A.NEW_GROSS_AMOUNT AS newGrossAmount,
            A.NEW_APPROVED_MAN_POWER AS newApprovedManPower,
            A.NEW_CURRENT_MAN_POWER AS newCurrentManPower,
            A.NEW_PENDING_MAN_POWER AS newPendingManPower,
            A.NEW_BALANCE_MAN_POWER AS newBalanceManPower,
            A.REPORTING_MANAGER_COMMENTS AS reportingManagerComments,
            A.MANAGER_RECOMMENDED_YN AS managerRecommendedYn,
            A.OLD_CAMP_ID AS campId,
            OCP.CAMP_NAME AS campName,
            A.OLD_STORE_ID AS storeId,
            A.OLD_DEPARTMENT_ID AS departmentId,
            A.EMP_ID AS empId
        FROM [VREQUEST].[TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST] A
        LEFT JOIN VMaster.TBL_COMPANY_MASTER OC ON OC.COMPANY_ID = A.OLD_COMPANY_ID
        LEFT JOIN VMaster.TBL_COMPANY_MASTER NC ON NC.COMPANY_ID = A.NEW_COMPANY_ID
        LEFT JOIN VMaster.TBL_STORE_MASTER OST ON OST.STORE_ID = A.OLD_STORE_ID
        LEFT JOIN VMaster.TBL_STORE_MASTER NST ON NST.STORE_ID = A.NEW_STORE_ID
        LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER OD ON OD.DEPARTMENT_ID = A.OLD_DEPARTMENT_ID
        LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER ND ON ND.DEPARTMENT_ID = A.NEW_DEPARTMENT_ID
        LEFT JOIN VMaster.TBL_DESIGNATION_MASTER ODS ON ODS.DESIGNATION_ID = A.OLD_DESIGNATION_ID
        LEFT JOIN VMaster.TBL_DESIGNATION_MASTER NDS ON NDS.DESIGNATION_ID = A.NEW_DESIGNATION_ID
        LEFT JOIN VMaster.TBL_CURRENCY_MASTER CUR ON CUR.CURRENCY_ID = A.CURRENCY_ID
        LEFT JOIN VMaster.TBL_CAMP_MASTER OCP ON OCP.CAMP_ID = A.OLD_CAMP_ID
        LEFT JOIN VMaster.TBL_CAMP_MASTER NCP ON NCP.CAMP_ID = A.NEW_CAMP_ID
        WHERE A.STATUS_MASTER = 'AC'
          AND (@FromDate IS NULL OR CONVERT(date, A.CREATED_DATE) >= @FromDate)
          AND (@ToDate IS NULL OR CONVERT(date, A.CREATED_DATE) <= @ToDate)
          AND (@CompanyId IS NULL OR A.OLD_COMPANY_ID = @CompanyId)
          AND (@StoreId IS NULL OR A.OLD_STORE_ID = @StoreId)
          AND (@CampId IS NULL OR A.OLD_CAMP_ID = @CampId)
          AND (@DepartmentId IS NULL OR A.OLD_DEPARTMENT_ID = @DepartmentId)
    )
    SELECT * INTO #REPORT_TRANSFER
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
          ISNULL(departmentName, ''), ' ',
          ISNULL(newCompanyName, '')
      ) LIKE '%' + @Search + '%');

    IF @Page IS NOT NULL AND @PageSize IS NOT NULL
    BEGIN
        SELECT COUNT(*) AS Total FROM #REPORT_TRANSFER;
        SELECT * FROM #REPORT_TRANSFER
        ORDER BY sno DESC
        OFFSET (@Page - 1) * @PageSize ROWS
        FETCH NEXT @PageSize ROWS ONLY;
    END
    ELSE
    BEGIN
        SELECT * FROM #REPORT_TRANSFER ORDER BY sno DESC;
    END
    DROP TABLE IF EXISTS #REPORT_TRANSFER;
END
GO