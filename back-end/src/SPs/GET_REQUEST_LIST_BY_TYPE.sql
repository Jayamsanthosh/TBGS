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
                AT.ATTENDANCE_TYPE_NAME AS attendanceTypeName,
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
            LEFT JOIN VMaster.TBL_ATTENDANCE_TYPE_MASTER AT ON AT.ATTENDANCE_TYPE_ID = A.ATTENDANCE_TYPE_ID
            WHERE A.STATUS_MASTER IN ('AC', 'CL')
              -- Show attendance requests in approval ONLY after their attendance
              -- detail has been submitted (STATUS 'CL' in the payroll detail).
              AND EXISTS (SELECT 1 FROM [VPayEntries].[ATTENDANCE_DETAILS] XD
                          WHERE XD.ATT_REQUEST_REF_NO = A.ATT_REQUEST_REF_NO
                            AND XD.STATUS_MASTER = 'CL')
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
                PM.PAYMENT_MODE_NAME AS paymentModeName,
                A.BANK_ID AS bankId,
                BK.BANK_NAME AS bankName,
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
            LEFT JOIN VMaster.TBL_PAYMENT_MODE_MASTER PM ON PM.PAYMENT_MODE_ID = A.PAYMENT_MODE_ID
            LEFT JOIN VMaster.TBL_BANK_MASTER BK ON BK.BANK_ID = A.BANK_ID
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
            WHERE A.STATUS_MASTER IN ('AC', 'CL')
              -- Show arrear requests in approval ONLY after their arrear
              -- entries have been submitted (STATUS 'CL' in the entries table).
              AND EXISTS (SELECT 1 FROM [VPayEntries].[TBL_ARREAR_ENTRIES] XD
                          WHERE XD.ARREAR_REQUEST_REF_NO = A.ARREAR_REQUEST_REF_NO
                            AND XD.STATUS_MASTER = 'CL')
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
                PM.PAYMENT_MODE_NAME AS paymentModeName,
                A.BANK_ID AS bankId,
                BK.BANK_NAME AS bankName,
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
            LEFT JOIN VMaster.TBL_PAYMENT_MODE_MASTER PM ON PM.PAYMENT_MODE_ID = A.PAYMENT_MODE_ID
            LEFT JOIN VMaster.TBL_BANK_MASTER BK ON BK.BANK_ID = A.BANK_ID
            WHERE A.STATUS_MASTER IN ('AC', 'CL')
              -- Show overtime requests in approval ONLY after their overtime
              -- entries have been submitted (STATUS 'CL' in the entries table).
              AND EXISTS (SELECT 1 FROM [VPayEntries].[TBL_OVERTIME_ENTRIES] XD
                          WHERE XD.OT_REQUEST_REF_NO = A.OT_REQUEST_REF_NO
                            AND XD.STATUS_MASTER = 'CL')
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
    ELSE IF @RequestType = 'Bonus Request'
    BEGIN
        DROP TABLE IF EXISTS #REPORT_BONUS;
        ;WITH CTE AS
        (
            SELECT
                A.SNO AS sno,
                A.BONUS_REQUEST_REF_NO AS poRefNo,
                A.BONUS_REQUEST_REF_NO AS requestRefNo,
                A.BONUS_REQUEST_REF_NO AS refNo,
                A.COMPANY_ID AS companyId,
                C.COMPANY_NAME AS companyName,
                D.DEPARTMENT_NAME AS department,
                D.DEPARTMENT_NAME AS departmentName,
                DS.DESIGNATION_NAME AS designation,
                DS.DESIGNATION_NAME AS designationName,
                A.STORE_ID AS poStoreId,
                S.STORE_NAME AS storeName,
                'Bonus' AS purchaseType,
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
                A.BONUS_TYPE AS bonusType,
                A.REQUEST_AMOUNT AS requestAmount,
                A.APPROVED_AMOUNT AS approvedAmount,
                A.MONTH_ENTERED AS monthEntered,
                A.YEAR_ENTERED AS yearEntered,
                A.PAYMENT_REF_NO AS paymentRefNo,
                A.PAYMENT_MODE_ID AS paymentModeId,
                PM.PAYMENT_MODE_NAME AS paymentModeName,
                A.BANK_ID AS bankId,
                BK.BANK_NAME AS bankName,
                A.ACCOUNT_NO AS accountNo,
                A.PAID_STATUS AS paidStatus,
                A.CAMP_ID AS campId,
                CP.CAMP_NAME AS campName,
                A.STORE_ID AS storeId,
                A.DEPARTMENT_ID AS departmentId,
                A.EMP_ID AS empId
            FROM [VREQUEST].[TBL_BONUS_REQUEST] A
            LEFT JOIN VMaster.TBL_COMPANY_MASTER C ON C.COMPANY_ID = A.COMPANY_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER S ON S.STORE_ID = A.STORE_ID
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER D ON D.DEPARTMENT_ID = A.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_DESIGNATION_MASTER DS ON DS.DESIGNATION_ID = A.DESIGNATION_ID
            LEFT JOIN VMaster.TBL_CURRENCY_MASTER CUR ON CUR.CURRENCY_ID = A.CURRENCY_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER CP ON CP.CAMP_ID = A.CAMP_ID
            LEFT JOIN VMaster.TBL_PAYMENT_MODE_MASTER PM ON PM.PAYMENT_MODE_ID = A.PAYMENT_MODE_ID
            LEFT JOIN VMaster.TBL_BANK_MASTER BK ON BK.BANK_ID = A.BANK_ID
            WHERE A.STATUS_MASTER IN ('AC', 'CL')
              -- Show bonus requests in approval ONLY after their bonus
              -- entries have been submitted (STATUS 'CL' in the entries table).
              AND EXISTS (SELECT 1 FROM [VPayEntries].[TBL_BONUS_ENTRIES] XD
                          WHERE XD.BONUS_REQUEST_REF_NO = A.BONUS_REQUEST_REF_NO
                            AND XD.STATUS_MASTER = 'CL')
              AND (@FromDate IS NULL OR CONVERT(date, A.CREATED_DATE) >= @FromDate)
              AND (@ToDate IS NULL OR CONVERT(date, A.CREATED_DATE) <= @ToDate)
              AND (@CompanyId IS NULL OR A.COMPANY_ID = @CompanyId)
              AND (@StoreId IS NULL OR A.STORE_ID = @StoreId)
              AND (@CampId IS NULL OR A.CAMP_ID = @CampId)
              AND (@DepartmentId IS NULL OR A.DEPARTMENT_ID = @DepartmentId)
        )
        SELECT * INTO #REPORT_BONUS
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
            SELECT COUNT(*) AS Total FROM #REPORT_BONUS;
            SELECT * FROM #REPORT_BONUS
            ORDER BY sno DESC
            OFFSET (@Page - 1) * @PageSize ROWS
            FETCH NEXT @PageSize ROWS ONLY;
        END
        ELSE
        BEGIN
            SELECT * FROM #REPORT_BONUS ORDER BY sno DESC;
        END
        DROP TABLE IF EXISTS #REPORT_BONUS;
    END
    ELSE IF @RequestType = 'Leave Encashment Request'
    BEGIN
        DROP TABLE IF EXISTS #REPORT_LE;
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
                A.BALANCE_LEAVE_DAYS AS balanceLeaveDays,
                A.LEAVE_ENCASHMENT_DAYS AS encashmentDays,
                A.LEAVE_ENCASHMENT_GROSS_AMOUNT AS grossAmount,
                A.MONTH_ENTERED AS monthEntered,
                A.YEAR_ENTERED AS yearEntered,
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
            WHERE A.STATUS_MASTER IN ('AC', 'CL')
              -- Show leave encashment requests in approval ONLY after their
              -- leave encashment entries have been submitted (STATUS 'CL').
              AND EXISTS (SELECT 1 FROM [VPayEntries].[TBL_LEAVE_ENCASHMENT_ENTRIES] XD
                          WHERE XD.LEAVE_ENCASHMENT_REQUEST_REF_NO = A.LEAVE_ENCASHMENT_REQUEST_REF_NO
                            AND XD.STATUS_MASTER = 'CL')
              AND (@FromDate IS NULL OR CONVERT(date, A.CREATED_DATE) >= @FromDate)
              AND (@ToDate IS NULL OR CONVERT(date, A.CREATED_DATE) <= @ToDate)
              AND (@CompanyId IS NULL OR A.COMPANY_ID = @CompanyId)
              AND (@StoreId IS NULL OR A.STORE_ID = @StoreId)
              AND (@CampId IS NULL OR A.CAMP_ID = @CampId)
              AND (@DepartmentId IS NULL OR A.DEPARTMENT_ID = @DepartmentId)
        )
        SELECT * INTO #REPORT_LE
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
            SELECT COUNT(*) AS Total FROM #REPORT_LE;
            SELECT * FROM #REPORT_LE
            ORDER BY sno DESC
            OFFSET (@Page - 1) * @PageSize ROWS
            FETCH NEXT @PageSize ROWS ONLY;
        END
        ELSE
        BEGIN
            SELECT * FROM #REPORT_LE ORDER BY sno DESC;
        END
        DROP TABLE IF EXISTS #REPORT_LE;
    END
    ELSE IF @RequestType = 'Promotion Demotion Transfer Request'
    BEGIN
        DROP TABLE IF EXISTS #REPORT_PDT;
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
                OS.STORE_NAME AS storeName,
                'Promotion Demotion Transfer' AS purchaseType,
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
                A.TRANSFER_TYPE AS transferType,
                OC.COMPANY_NAME AS oldCompanyName,
                OD.DEPARTMENT_NAME AS oldDepartmentName,
                ODS.DESIGNATION_NAME AS oldDesignationName,
                A.OLD_GROSS_AMOUNT AS oldGrossAmount,
                A.NEW_COMPANY_ID AS newCompanyId,
                NC.COMPANY_NAME AS newCompanyName,
                ND.DEPARTMENT_NAME AS newDepartmentName,
                NDS.DESIGNATION_NAME AS newDesignationName,
                NS.STORE_NAME AS newStoreName,
                NCP.CAMP_NAME AS newCampName,
                A.NEW_GROSS_AMOUNT AS newGrossAmount,
                A.REPORTING_MANAGER_ID AS reportingManagerId,
                A.MANAGER_RECOMMENDED_YN AS managerRecommendedYn,
                A.MONTH_ENTERED AS monthEntered,
                A.YEAR_ENTERED AS yearEntered,
                A.OLD_CAMP_ID AS campId,
                OCP.CAMP_NAME AS campName,
                A.OLD_STORE_ID AS storeId,
                A.OLD_DEPARTMENT_ID AS departmentId,
                A.EMP_ID AS empId
            FROM [VREQUEST].[TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST] A
            LEFT JOIN VMaster.TBL_COMPANY_MASTER OC ON OC.COMPANY_ID = A.OLD_COMPANY_ID
            LEFT JOIN VMaster.TBL_COMPANY_MASTER NC ON NC.COMPANY_ID = A.NEW_COMPANY_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER OS ON OS.STORE_ID = A.OLD_STORE_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER NS ON NS.STORE_ID = A.NEW_STORE_ID
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER OD ON OD.DEPARTMENT_ID = A.OLD_DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER ND ON ND.DEPARTMENT_ID = A.NEW_DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_DESIGNATION_MASTER ODS ON ODS.DESIGNATION_ID = A.OLD_DESIGNATION_ID
            LEFT JOIN VMaster.TBL_DESIGNATION_MASTER NDS ON NDS.DESIGNATION_ID = A.NEW_DESIGNATION_ID
            LEFT JOIN VMaster.TBL_CURRENCY_MASTER CUR ON CUR.CURRENCY_ID = A.CURRENCY_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER OCP ON OCP.CAMP_ID = A.OLD_CAMP_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER NCP ON NCP.CAMP_ID = A.NEW_CAMP_ID
            WHERE A.STATUS_MASTER IN ('AC', 'CL')
              -- Show PDT requests in approval ONLY after their entries have
              -- been submitted (STATUS 'CL' in the entries table).
              AND EXISTS (SELECT 1 FROM [VPayEntries].[TBL_PROMOTION_DEMOTION_TRANSFER_ENTRIES] XD
                          WHERE XD.TRANSFER_REQUEST_REF_NO = A.TRANSFER_REQUEST_REF_NO
                            AND XD.STATUS_MASTER = 'CL')
              AND (@FromDate IS NULL OR CONVERT(date, A.CREATED_DATE) >= @FromDate)
              AND (@ToDate IS NULL OR CONVERT(date, A.CREATED_DATE) <= @ToDate)
              AND (@CompanyId IS NULL OR A.OLD_COMPANY_ID = @CompanyId)
              AND (@StoreId IS NULL OR A.OLD_STORE_ID = @StoreId)
              AND (@CampId IS NULL OR A.OLD_CAMP_ID = @CampId)
              AND (@DepartmentId IS NULL OR A.OLD_DEPARTMENT_ID = @DepartmentId)
        )
        SELECT * INTO #REPORT_PDT
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
            SELECT COUNT(*) AS Total FROM #REPORT_PDT;
            SELECT * FROM #REPORT_PDT
            ORDER BY sno DESC
            OFFSET (@Page - 1) * @PageSize ROWS
            FETCH NEXT @PageSize ROWS ONLY;
        END
        ELSE
        BEGIN
            SELECT * FROM #REPORT_PDT ORDER BY sno DESC;
        END
        DROP TABLE IF EXISTS #REPORT_PDT;
    END
    ELSE
    BEGIN
        SELECT NULL AS sno WHERE 1 = 0;
    END
END
GO