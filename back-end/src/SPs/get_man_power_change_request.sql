-- =============================================================
-- [VMaster].[GET_MAN_POWER_CHANGE_REQUEST]  (Dual-mode)
--   * @MAN_POWER_REQUEST_ID given -> single-record detail (entry screen).
--   * id blank                    -> Man Power Change list for the Report
--                                    Dashboard (same aliases/filters/paging
--                                    as GET_REQUEST_LIST_BY_TYPE).
--   NOTE: this SP lives in the VMASTER schema, not VRequest.
-- =============================================================
CREATE OR ALTER PROCEDURE [VMaster].[GET_MAN_POWER_CHANGE_REQUEST]
(
    @MAN_POWER_REQUEST_ID INT = NULL,
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

    IF ISNULL(@MAN_POWER_REQUEST_ID, 0) <> 0
    BEGIN
        SELECT
            MAN_POWER_REQUEST_ID,
            COMPANY_ID,
            DEPARTMENT_ID,
            DESIGNATION_ID,
            EMPLOYMENT_TYPE_ID,
            OLD_APPROVED_MAN_POWER,
            ADD_REMOVE_MAN_POWER,
            NEW_APPROVED_MAN_POWER,
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
            FINAL_RESPONSE_PERSON,
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
        FROM [VMaster].[TBL_MAN_POWER_CHANGE_REQUEST]
        WHERE MAN_POWER_REQUEST_ID = @MAN_POWER_REQUEST_ID;
        RETURN;
    END

    DROP TABLE IF EXISTS #REPORT_MANPOWER;
    ;WITH CTE AS
    (
        SELECT
            A.MAN_POWER_REQUEST_ID AS sno,
            A.MAN_POWER_REQUEST_ID AS poRefNo,
            A.MAN_POWER_REQUEST_ID AS requestRefNo,
            A.MAN_POWER_REQUEST_ID AS refNo,
            A.COMPANY_ID AS companyId,
            C.COMPANY_NAME AS companyName,
            D.DEPARTMENT_NAME AS department,
            D.DEPARTMENT_NAME AS departmentName,
            DS.DESIGNATION_NAME AS designation,
            DS.DESIGNATION_NAME AS designationName,
            NULL AS poStoreId,
            NULL AS storeName,
            'Man Power' AS purchaseType,
            NULL AS currencyType,
            A.NEW_APPROVED_MAN_POWER AS amount,
            A.NEW_APPROVED_MAN_POWER AS totalFinalProductionHdrAmount,
            NULL AS vatHdrAmount,
            NULL AS supplierId,
            NULL AS supplierName,
            NULL AS cell,
            A.CREATED_DATE AS poDate,
            '' AS requestedBy,
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
            CAST(A.FINAL_RESPONSE_PERSON AS VARCHAR(20)) AS finalResponsePerson,
            A.FINAL_RESPONSE_DATE AS finalResponseDate,
            A.CREATED_BY AS createdBy,
            NULL AS reason,
            NULL AS approvedAmount,
            NULL AS monthEntered,
            NULL AS yearEntered,
            A.OLD_APPROVED_MAN_POWER AS oldApprovedManPower,
            A.ADD_REMOVE_MAN_POWER AS addRemoveManPower,
            A.NEW_APPROVED_MAN_POWER AS newApprovedManPower,
            NULL AS campId,
            NULL AS campName,
            NULL AS storeId,
            A.DEPARTMENT_ID AS departmentId,
            NULL AS empId
        FROM [VMaster].[TBL_MAN_POWER_CHANGE_REQUEST] A
        LEFT JOIN VMaster.TBL_COMPANY_MASTER C ON C.COMPANY_ID = A.COMPANY_ID
        LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER D ON D.DEPARTMENT_ID = A.DEPARTMENT_ID
        LEFT JOIN VMaster.TBL_DESIGNATION_MASTER DS ON DS.DESIGNATION_ID = A.DESIGNATION_ID
        WHERE A.STATUS_MASTER = 'AC'
          AND (@FromDate IS NULL OR CONVERT(date, A.CREATED_DATE) >= @FromDate)
          AND (@ToDate IS NULL OR CONVERT(date, A.CREATED_DATE) <= @ToDate)
          AND (@CompanyId IS NULL OR A.COMPANY_ID = @CompanyId)
          AND (@DepartmentId IS NULL OR A.DEPARTMENT_ID = @DepartmentId)
    )
    SELECT * INTO #REPORT_MANPOWER
    FROM CTE
    WHERE (@Status = 'ALL' OR finalResponseStatus = UPPER(LTRIM(RTRIM(@Status))))
      AND (@Search IS NULL OR CONCAT(
          ISNULL(CAST(sno AS VARCHAR(20)), ''), ' ',
          ISNULL(refNo, ''), ' ',
          ISNULL(companyName, ''), ' ',
          ISNULL(departmentName, ''), ' ',
          ISNULL(designationName, '')
      ) LIKE '%' + @Search + '%');

    IF @Page IS NOT NULL AND @PageSize IS NOT NULL
    BEGIN
        SELECT COUNT(*) AS Total FROM #REPORT_MANPOWER;
        SELECT * FROM #REPORT_MANPOWER
        ORDER BY sno DESC
        OFFSET (@Page - 1) * @PageSize ROWS
        FETCH NEXT @PageSize ROWS ONLY;
    END
    ELSE
    BEGIN
        SELECT * FROM #REPORT_MANPOWER ORDER BY sno DESC;
    END
    DROP TABLE IF EXISTS #REPORT_MANPOWER;
END
GO