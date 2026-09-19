-- =============================================================
-- [VRequest].[GET_REQUEST_LIST_BY_TYPE]
-- Returns frontend-ready camelCase rows for the app/[approvalType] pages.
-- Field names match exactly what the DataTable / detail pages consume.
-- Run this on the TBGS database (it replaces the old SP).
--
-- Optional filter/page inputs are used by the Report Dashboard only.
-- When @Page/@PageSize are NULL (approval pages) the legacy single
-- result-set behaviour is preserved.
-- =============================================================
CREATE OR ALTER PROCEDURE [VRequest].[GET_REQUEST_LIST_BY_TYPE]
(
    @RequestType VARCHAR(100),
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

    IF @RequestType = 'Attendance Request'
    BEGIN
        DROP TABLE IF EXISTS #REPORT_ATT;
        ;WITH CTE AS
        (
            SELECT
                A.SNO AS sno,
                A.ATT_REQUEST_REF_NO AS poRefNo,
                A.ATT_REQUEST_REF_NO AS requestRefNo,
                A.ATT_REQUEST_REF_NO AS refNo,
                A.COMPANY_ID AS companyId,
                C.COMPANY_NAME AS companyName,
                D.DEPARTMENT_NAME AS department,
                D.DEPARTMENT_NAME AS departmentName,
                DS.DESIGNATION_NAME AS designation,
                DS.DESIGNATION_NAME AS designationName,
                A.STORE_ID AS poStoreId,
                S.STORE_NAME AS storeName,
                'Attendance' AS purchaseType,
                NULL AS currencyType,
                NULL AS amount,
                NULL AS totalFinalProductionHdrAmount,
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
                    WHEN 'REJECT' THEN 'REJECTED'
                    WHEN 'REJECTED' THEN 'REJECTED'
                    WHEN 'HOLD' THEN 'HOLD'
                    ELSE 'PENDING'
                END AS finalResponseStatus,
                CASE UPPER(LTRIM(RTRIM(ISNULL(A.SECTION_HEAD_RESPONSE_STATUS,''))))
                    WHEN 'APPROVAL' THEN 'APPROVED'
                    WHEN 'APPROVED' THEN 'APPROVED'
                    WHEN 'REJECT' THEN 'REJECTED'
                    WHEN 'REJECTED' THEN 'REJECTED'
                    WHEN 'HOLD' THEN 'HOLD'
                    ELSE ''
                END AS sectionHeadStatus,
                A.SECTION_HEAD_RESPONSE_REMARKS AS sectionHeadRemarks,
                CAST(A.SECTION_HEAD_RESPONSE_PERSON_EMP_ID AS VARCHAR(20)) AS sectionHeadPerson,
                A.SECTION_HEAD_RESPONSE_DATE AS sectionHeadDate,
                CASE UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_1_STATUS,''))))
                    WHEN 'APPROVAL' THEN 'APPROVED'
                    WHEN 'APPROVED' THEN 'APPROVED'
                    WHEN 'REJECT' THEN 'REJECTED'
                    WHEN 'REJECTED' THEN 'REJECTED'
                    WHEN 'HOLD' THEN 'HOLD'
                    ELSE ''
                END AS response1Status,
                A.RESPONSE_1_REMARKS AS response1Remarks,
                CAST(A.RESPONSE_1_EMP_ID AS VARCHAR(20)) AS response1Person,
                A.RESPONSE_1_DATE AS response1Date,
                CASE UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_2_STATUS,''))))
                    WHEN 'APPROVAL' THEN 'APPROVED'
                    WHEN 'APPROVED' THEN 'APPROVED'
                    WHEN 'REJECT' THEN 'REJECTED'
                    WHEN 'REJECTED' THEN 'REJECTED'
                    WHEN 'HOLD' THEN 'HOLD'
                    ELSE ''
                END AS response2Status,
                A.RESPONSE_2_REMARKS AS response2Remarks,
                CAST(A.RESPONSE_2_EMP_ID AS VARCHAR(20)) AS response2Person,
                A.RESPONSE_2_DATE AS response2Date,
                A.FINAL_RESPONSE_REMARKS AS finalResponseRemarks,
                A.CREATED_BY AS createdBy,
                A.REASON AS reason,
                A.DATE_FROM AS dateFrom,
                A.DATE_TO AS dateTo,
                A.NO_OF_DAYS AS noOfDays,
                A.ELIGIBLE_DAYS AS eligibleDays,
                A.BALANCE_LEAVE AS balanceLeave,
                A.MONTH_ENTERED AS monthEntered,
                A.YEAR_ENTERED AS yearEntered,
                A.ATTENDANCE_TYPE_ID AS attendanceTypeId,
                A.CAMP_ID AS campId,
                CP.CAMP_NAME AS campName,
                A.STORE_ID AS storeId,
                A.DEPARTMENT_ID AS departmentId,
                A.EMP_ID AS empId
            FROM [VRequest].[TBL_ATTENDANCE_REQUEST] A
            LEFT JOIN VMaster.TBL_COMPANY_MASTER C ON C.COMPANY_ID = A.COMPANY_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER S ON S.STORE_ID = A.STORE_ID
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER D ON D.DEPARTMENT_ID = A.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_DESIGNATION_MASTER DS ON DS.DESIGNATION_ID = A.DESIGNATION_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER CP ON CP.CAMP_ID = A.CAMP_ID
            WHERE A.STATUS_MASTER = 'AC'
              AND (@FromDate IS NULL OR CONVERT(date, A.CREATED_DATE) >= @FromDate)
              AND (@ToDate IS NULL OR CONVERT(date, A.CREATED_DATE) <= @ToDate)
              AND (@CompanyId IS NULL OR A.COMPANY_ID = @CompanyId)
              AND (@StoreId IS NULL OR A.STORE_ID = @StoreId)
              AND (@CampId IS NULL OR A.CAMP_ID = @CampId)
              AND (@DepartmentId IS NULL OR A.DEPARTMENT_ID = @DepartmentId)
        )
        SELECT * INTO #REPORT_ATT
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
            SELECT COUNT(*) AS Total FROM #REPORT_ATT;
            SELECT * FROM #REPORT_ATT
            ORDER BY sno DESC
            OFFSET (@Page - 1) * @PageSize ROWS
            FETCH NEXT @PageSize ROWS ONLY;
        END
        ELSE
        BEGIN
            SELECT * FROM #REPORT_ATT ORDER BY sno DESC;
        END
        DROP TABLE IF EXISTS #REPORT_ATT;
    END
    ELSE IF @RequestType = 'Cash Advance Request'
    BEGIN
        DROP TABLE IF EXISTS #REPORT_CASH;
        ;WITH CTE AS
        (
            SELECT
                A.SNO AS sno,
                A.CASH_ADV_REQUEST_REF_NO AS poRefNo,
                A.CASH_ADV_REQUEST_REF_NO AS requestRefNo,
                A.CASH_ADV_REQUEST_REF_NO AS refNo,
                A.COMPANY_ID AS companyId,
                C.COMPANY_NAME AS companyName,
                D.DEPARTMENT_NAME AS department,
                D.DEPARTMENT_NAME AS departmentName,
                DS.DESIGNATION_NAME AS designation,
                DS.DESIGNATION_NAME AS designationName,
                A.STORE_ID AS poStoreId,
                S.STORE_NAME AS storeName,
                A.ADVANCE_TYPE AS purchaseType,
                CUR.CURRENCY_NAME AS currencyType,
                A.REQUEST_AMOUNT AS amount,
                A.REQUEST_AMOUNT AS totalFinalProductionHdrAmount,
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
                    WHEN 'REJECT' THEN 'REJECTED'
                    WHEN 'REJECTED' THEN 'REJECTED'
                    WHEN 'HOLD' THEN 'HOLD'
                    ELSE 'PENDING'
                END AS finalResponseStatus,
                CASE UPPER(LTRIM(RTRIM(ISNULL(A.SECTION_HEAD_RESPONSE_STATUS,''))))
                    WHEN 'APPROVAL' THEN 'APPROVED'
                    WHEN 'APPROVED' THEN 'APPROVED'
                    WHEN 'REJECT' THEN 'REJECTED'
                    WHEN 'REJECTED' THEN 'REJECTED'
                    WHEN 'HOLD' THEN 'HOLD'
                    ELSE ''
                END AS sectionHeadStatus,
                A.SECTION_HEAD_RESPONSE_REMARKS AS sectionHeadRemarks,
                CAST(A.SECTION_HEAD_RESPONSE_PERSON_EMP_ID AS VARCHAR(20)) AS sectionHeadPerson,
                A.SECTION_HEAD_RESPONSE_DATE AS sectionHeadDate,
                CASE UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_1_STATUS,''))))
                    WHEN 'APPROVAL' THEN 'APPROVED'
                    WHEN 'APPROVED' THEN 'APPROVED'
                    WHEN 'REJECT' THEN 'REJECTED'
                    WHEN 'REJECTED' THEN 'REJECTED'
                    WHEN 'HOLD' THEN 'HOLD'
                    ELSE ''
                END AS response1Status,
                A.RESPONSE_1_REMARKS AS response1Remarks,
                CAST(A.RESPONSE_1_EMP_ID AS VARCHAR(20)) AS response1Person,
                A.RESPONSE_1_DATE AS response1Date,
                CASE UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_2_STATUS,''))))
                    WHEN 'APPROVAL' THEN 'APPROVED'
                    WHEN 'APPROVED' THEN 'APPROVED'
                    WHEN 'REJECT' THEN 'REJECTED'
                    WHEN 'REJECTED' THEN 'REJECTED'
                    WHEN 'HOLD' THEN 'HOLD'
                    ELSE ''
                END AS response2Status,
                A.RESPONSE_2_REMARKS AS response2Remarks,
                CAST(A.RESPONSE_2_EMP_ID AS VARCHAR(20)) AS response2Person,
                A.RESPONSE_2_DATE AS response2Date,
                A.FINAL_RESPONSE_REMARKS AS finalResponseRemarks,
                A.CREATED_BY AS createdBy,
                A.REASON AS reason,
                A.SALARY_DEDUCTION_TYPE AS salaryDeductionType,
                A.ADVANCE_TYPE AS advanceType,
                A.GROSS_PAY AS grossPay,
                A.NET_PAY AS netPay,
                A.ELIGIBLE_AMOUNT AS eligibleAmount,
                A.APPROVED_AMOUNT AS approvedAmount,
                A.DEDUCTION_FROM_DATE AS deductionFromDate,
                A.DEDUCTION_TO_DATE AS deductionToDate,
                A.NO_OF_MONTHS AS noOfMonths,
                A.MONTHLY_DEDUCTION AS monthlyDeduction,
                A.PAYMENT_MODE_ID AS paymentModeId,
                A.BANK_ID AS bankId,
                A.ACCOUNT_NO AS accountNo,
                A.CURRENCY_ID AS currencyId,
                A.MONTH_ENTERED AS monthEntered,
                A.YEAR_ENTERED AS yearEntered,
                A.CAMP_ID AS campId,
                CP.CAMP_NAME AS campName,
                A.STORE_ID AS storeId,
                A.DEPARTMENT_ID AS departmentId,
                A.EMP_ID AS empId
            FROM [VRequest].[TBL_CASH_ADVANCE_REQUEST] A
            LEFT JOIN VMaster.TBL_COMPANY_MASTER C ON C.COMPANY_ID = A.COMPANY_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER S ON S.STORE_ID = A.STORE_ID
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER D ON D.DEPARTMENT_ID = A.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_DESIGNATION_MASTER DS ON DS.DESIGNATION_ID = A.DESIGNATION_ID
            LEFT JOIN VMaster.TBL_CURRENCY_MASTER CUR ON CUR.CURRENCY_ID = A.CURRENCY_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER CP ON CP.CAMP_ID = A.CAMP_ID
            WHERE A.STATUS_MASTER = 'CL'
              AND (@FromDate IS NULL OR CONVERT(date, A.CREATED_DATE) >= @FromDate)
              AND (@ToDate IS NULL OR CONVERT(date, A.CREATED_DATE) <= @ToDate)
              AND (@CompanyId IS NULL OR A.COMPANY_ID = @CompanyId)
              AND (@StoreId IS NULL OR A.STORE_ID = @StoreId)
              AND (@CampId IS NULL OR A.CAMP_ID = @CampId)
              AND (@DepartmentId IS NULL OR A.DEPARTMENT_ID = @DepartmentId)
        )
        SELECT * INTO #REPORT_CASH
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
            SELECT COUNT(*) AS Total FROM #REPORT_CASH;
            SELECT * FROM #REPORT_CASH
            ORDER BY sno DESC
            OFFSET (@Page - 1) * @PageSize ROWS
            FETCH NEXT @PageSize ROWS ONLY;
        END
        ELSE
        BEGIN
            SELECT * FROM #REPORT_CASH ORDER BY sno DESC;
        END
        DROP TABLE IF EXISTS #REPORT_CASH;
    END
    ELSE IF @RequestType = 'Arrears Request'
    BEGIN
        DROP TABLE IF EXISTS #REPORT_ARREARS;
        ;WITH CTE AS
        (
            SELECT
                A.SNO AS sno,
                A.ARREAR_REQUEST_REF_NO AS poRefNo,
                A.ARREAR_REQUEST_REF_NO AS requestRefNo,
                A.ARREAR_REQUEST_REF_NO AS refNo,
                A.COMPANY_ID AS companyId,
                C.COMPANY_NAME AS companyName,
                D.DEPARTMENT_NAME AS department,
                D.DEPARTMENT_NAME AS departmentName,
                DS.DESIGNATION_NAME AS designation,
                DS.DESIGNATION_NAME AS designationName,
                A.STORE_ID AS poStoreId,
                S.STORE_NAME AS storeName,
                'Arrears' AS purchaseType,
                CUR.CURRENCY_NAME AS currencyType,
                A.REQUEST_AMOUNT AS amount,
                A.REQUEST_AMOUNT AS totalFinalProductionHdrAmount,
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
                A.APPROVED_AMOUNT AS approvedAmount,
                A.MONTH_ENTERED AS monthEntered,
                A.YEAR_ENTERED AS yearEntered,
                A.CAMP_ID AS campId,
                CP.CAMP_NAME AS campName,
                A.STORE_ID AS storeId,
                A.DEPARTMENT_ID AS departmentId,
                A.EMP_ID AS empId
            FROM [VREQUEST].[TBL_ARREARS_REQUEST] A
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
        SELECT * INTO #REPORT_ARREARS
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
            SELECT COUNT(*) AS Total FROM #REPORT_ARREARS;
            SELECT * FROM #REPORT_ARREARS
            ORDER BY sno DESC
            OFFSET (@Page - 1) * @PageSize ROWS
            FETCH NEXT @PageSize ROWS ONLY;
        END
        ELSE
        BEGIN
            SELECT * FROM #REPORT_ARREARS ORDER BY sno DESC;
        END
        DROP TABLE IF EXISTS #REPORT_ARREARS;
    END
    ELSE IF @RequestType = 'Overtime Request'
    BEGIN
        DROP TABLE IF EXISTS #REPORT_OT;
        ;WITH CTE AS
        (
            SELECT
                A.SNO AS sno,
                A.OT_REQUEST_REF_NO AS poRefNo,
                A.OT_REQUEST_REF_NO AS requestRefNo,
                A.OT_REQUEST_REF_NO AS refNo,
                A.COMPANY_ID AS companyId,
                C.COMPANY_NAME AS companyName,
                D.DEPARTMENT_NAME AS department,
                D.DEPARTMENT_NAME AS departmentName,
                DS.DESIGNATION_NAME AS designation,
                DS.DESIGNATION_NAME AS designationName,
                A.STORE_ID AS poStoreId,
                S.STORE_NAME AS storeName,
                'Overtime' AS purchaseType,
                CUR.CURRENCY_NAME AS currencyType,
                A.REQUEST_AMOUNT AS amount,
                A.REQUEST_AMOUNT AS totalFinalProductionHdrAmount,
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
                A.APPROVED_AMOUNT AS approvedAmount,
                A.MONTH_ENTERED AS monthEntered,
                A.YEAR_ENTERED AS yearEntered,
                A.OT_FROM_DATE AS otFromDate,
                A.OT_TO_DATE AS otToDate,
                A.OT_HOURS AS otHours,
                A.PAYMENT_REF_NO AS paymentRefNo,
                A.PAYMENT_MODE_ID AS paymentModeId,
                A.BANK_ID AS bankId,
                A.ACCOUNT_NO AS accountNo,
                A.PAID_STATUS AS paidStatus,
                A.CAMP_ID AS campId,
                CP.CAMP_NAME AS campName,
                A.STORE_ID AS storeId,
                A.DEPARTMENT_ID AS departmentId,
                A.EMP_ID AS empId
            FROM [VREQUEST].[TBL_OVERTIME_REQUEST] A
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
        SELECT * INTO #REPORT_OT
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
            SELECT COUNT(*) AS Total FROM #REPORT_OT;
            SELECT * FROM #REPORT_OT
            ORDER BY sno DESC
            OFFSET (@Page - 1) * @PageSize ROWS
            FETCH NEXT @PageSize ROWS ONLY;
        END
        ELSE
        BEGIN
            SELECT * FROM #REPORT_OT ORDER BY sno DESC;
        END
        DROP TABLE IF EXISTS #REPORT_OT;
    END
    ELSE
    BEGIN
        SELECT NULL AS sno WHERE 1 = 0;
    END
END
GO