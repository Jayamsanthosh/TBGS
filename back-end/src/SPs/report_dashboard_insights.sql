IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'VReport')
    EXEC('CREATE SCHEMA VReport');
GO

CREATE OR ALTER PROCEDURE [VReport].[GET_DASHBOARD_CARDS]
    @OverdueDays INT = 7
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH REQ AS (
        SELECT 'Attendance Request' AS Src,
            CASE UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''),'PENDING')))))
                WHEN 'APPROVAL' THEN 'APPROVED' WHEN 'APPROVED' THEN 'APPROVED'
                WHEN 'REJECT' THEN 'REJECTED' WHEN 'REJECTED' THEN 'REJECTED'
                WHEN 'HOLD' THEN 'HOLD' ELSE 'PENDING' END AS St,
            CREATED_DATE AS Cd
        FROM VRequest.TBL_ATTENDANCE_REQUEST WHERE STATUS_MASTER = 'AC'
        UNION ALL
        SELECT 'Cash Advance Request',
            CASE UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''),'PENDING')))))
                WHEN 'APPROVAL' THEN 'APPROVED' WHEN 'APPROVED' THEN 'APPROVED'
                WHEN 'REJECT' THEN 'REJECTED' WHEN 'REJECTED' THEN 'REJECTED'
                WHEN 'HOLD' THEN 'HOLD' ELSE 'PENDING' END,
            CREATED_DATE
        FROM VRequest.TBL_CASH_ADVANCE_REQUEST WHERE STATUS_MASTER = 'AC'
        UNION ALL
        SELECT 'Arrears Request',
            CASE UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''),'PENDING')))))
                WHEN 'APPROVAL' THEN 'APPROVED' WHEN 'APPROVED' THEN 'APPROVED'
                WHEN 'REJECT' THEN 'REJECTED' WHEN 'REJECTED' THEN 'REJECTED'
                WHEN 'HOLD' THEN 'HOLD' ELSE 'PENDING' END,
            CREATED_DATE
        FROM VREQUEST.TBL_ARREARS_REQUEST WHERE STATUS_MASTER = 'AC'
        UNION ALL
        SELECT 'Overtime Request',
            CASE UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''),'PENDING')))))
                WHEN 'APPROVAL' THEN 'APPROVED' WHEN 'APPROVED' THEN 'APPROVED'
                WHEN 'REJECT' THEN 'REJECTED' WHEN 'REJECTED' THEN 'REJECTED'
                WHEN 'HOLD' THEN 'HOLD' ELSE 'PENDING' END,
            CREATED_DATE
        FROM VREQUEST.TBL_OVERTIME_REQUEST WHERE STATUS_MASTER = 'AC'
        UNION ALL
        SELECT 'Bonus Request',
            CASE UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''),'PENDING')))))
                WHEN 'APPROVAL' THEN 'APPROVED' WHEN 'APPROVED' THEN 'APPROVED'
                WHEN 'REJECT' THEN 'REJECTED' WHEN 'REJECTED' THEN 'REJECTED'
                WHEN 'HOLD' THEN 'HOLD' ELSE 'PENDING' END,
            CREATED_DATE
        FROM VRequest.TBL_BONUS_REQUEST WHERE STATUS_MASTER = 'AC'
        UNION ALL
        SELECT 'Leave Encashment Request',
            CASE UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''),'PENDING')))))
                WHEN 'APPROVAL' THEN 'APPROVED' WHEN 'APPROVED' THEN 'APPROVED'
                WHEN 'REJECT' THEN 'REJECTED' WHEN 'REJECTED' THEN 'REJECTED'
                WHEN 'HOLD' THEN 'HOLD' ELSE 'PENDING' END,
            CREATED_DATE
        FROM VRequest.TBL_LEAVE_ENCASHMENT_REQUEST WHERE STATUS_MASTER = 'AC'
        UNION ALL
        SELECT 'Promotion/Demotion/Transfer Request',
            CASE UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''),'PENDING')))))
                WHEN 'APPROVAL' THEN 'APPROVED' WHEN 'APPROVED' THEN 'APPROVED'
                WHEN 'REJECT' THEN 'REJECTED' WHEN 'REJECTED' THEN 'REJECTED'
                WHEN 'HOLD' THEN 'HOLD' ELSE 'PENDING' END,
            CREATED_DATE
        FROM VRequest.TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST WHERE STATUS_MASTER = 'AC'
        UNION ALL
        SELECT 'Man Power Change Request',
            CASE UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)),''),'PENDING')))))
                WHEN 'APPROVAL' THEN 'APPROVED' WHEN 'APPROVED' THEN 'APPROVED'
                WHEN 'REJECT' THEN 'REJECTED' WHEN 'REJECTED' THEN 'REJECTED'
                WHEN 'HOLD' THEN 'HOLD' ELSE 'PENDING' END,
            CREATED_DATE
        FROM VMaster.TBL_MAN_POWER_CHANGE_REQUEST WHERE STATUS_MASTER = 'AC'
    ),
    REQ_AGG AS (
        SELECT u.Src,
            ISNULL(r.Total, 0) AS Total,
            ISNULL(r.Pend, 0) AS Pend,
            ISNULL(r.Appr, 0) AS Appr,
            ISNULL(r.Hold, 0) AS Hold,
            ISNULL(r.Rej, 0) AS Rej,
            ISNULL(r.Overdue, 0) AS Overdue
        FROM (
            SELECT 'Attendance Request' AS Src
            UNION ALL SELECT 'Cash Advance Request'
            UNION ALL SELECT 'Arrears Request'
            UNION ALL SELECT 'Overtime Request'
            UNION ALL SELECT 'Bonus Request'
            UNION ALL SELECT 'Leave Encashment Request'
            UNION ALL SELECT 'Promotion/Demotion/Transfer Request'
            UNION ALL SELECT 'Man Power Change Request'
        ) u
        LEFT JOIN (
            SELECT Src,
                COUNT(*) AS Total,
                SUM(CASE WHEN St = 'PENDING' THEN 1 ELSE 0 END) AS Pend,
                SUM(CASE WHEN St = 'APPROVED' THEN 1 ELSE 0 END) AS Appr,
                SUM(CASE WHEN St = 'HOLD' THEN 1 ELSE 0 END) AS Hold,
                SUM(CASE WHEN St = 'REJECTED' THEN 1 ELSE 0 END) AS Rej,
                SUM(CASE WHEN St = 'PENDING' AND Cd < DATEADD(DAY, -@OverdueDays, GETDATE()) THEN 1 ELSE 0 END) AS Overdue
            FROM REQ
            GROUP BY Src
        ) r ON r.Src = u.Src
    ),
    ATT AS (
        SELECT ad.EMP_ID, ad.DATE_FROM, ad.DATE_TO, ad.BALANCE_LEAVE,
            LTRIM(RTRIM(ISNULL(atm.ATTENDANCE_TYPE_NAME,''))) AS TypeName,
            CASE UPPER(ISNULL(NULLIF(LTRIM(RTRIM(ad.FINAL_RESPONSE_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(ad.RESPONSE_2_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(ad.RESPONSE_1_STATUS)),''),
                 ISNULL(NULLIF(LTRIM(RTRIM(ad.SECTION_HEAD_RESPONSE_STATUS)),''),'PENDING')))))
                WHEN 'APPROVAL' THEN 'APPROVED' WHEN 'APPROVED' THEN 'APPROVED'
                WHEN 'REJECT' THEN 'REJECTED' WHEN 'REJECTED' THEN 'REJECTED'
                WHEN 'HOLD' THEN 'HOLD' ELSE 'PENDING' END AS St
        FROM VPayEntries.ATTENDANCE_DETAILS ad
        LEFT JOIN VMaster.TBL_ATTENDANCE_TYPE_MASTER atm ON atm.ATTENDANCE_TYPE_ID = ad.ATTENDANCE_TYPE_ID
        WHERE ad.STATUS_MASTER = 'AC'
    ),
    TODAY AS (
        SELECT EMP_ID, TypeName
        FROM ATT
        WHERE St = 'APPROVED'
          AND CAST(GETDATE() AS DATE) BETWEEN CAST(DATE_FROM AS DATE) AND CAST(DATE_TO AS DATE)
    ),
    LIC AS (
        SELECT 'Driving Licence' AS Doc, EMP_ID, FIRST_NAME, MIDDLE_NAME, LAST_NAME, COMPANY_ID, DEPARTMENT_ID, DRIVING_LICENSE_NO AS DocNo, DRIVING_LICENSE_EXPIRE_DATE AS ExpDate
        FROM VPayEntries.NEW_EMPLOYEE_DATABASE WHERE DRIVING_LICENSE_EXPIRE_DATE IS NOT NULL
        UNION ALL
        SELECT 'Passport', EMP_ID, FIRST_NAME, MIDDLE_NAME, LAST_NAME, COMPANY_ID, DEPARTMENT_ID, PASSPORT_NO, PASSPORT_EXPIRY_DATE
        FROM VPayEntries.NEW_EMPLOYEE_DATABASE WHERE PASSPORT_EXPIRY_DATE IS NOT NULL
        UNION ALL
        SELECT 'Visa', EMP_ID, FIRST_NAME, MIDDLE_NAME, LAST_NAME, COMPANY_ID, DEPARTMENT_ID, NULL, VISA_EXPIRY_DATE
        FROM VPayEntries.NEW_EMPLOYEE_DATABASE WHERE VISA_EXPIRY_DATE IS NOT NULL
        UNION ALL
        SELECT 'Work Permit', EMP_ID, FIRST_NAME, MIDDLE_NAME, LAST_NAME, COMPANY_ID, DEPARTMENT_ID, WORK_PERMIT_NO, WORK_PERMIT_EXPIRY_DATE
        FROM VPayEntries.NEW_EMPLOYEE_DATABASE WHERE WORK_PERMIT_EXPIRY_DATE IS NOT NULL
        UNION ALL
        SELECT 'Resident Permit', EMP_ID, FIRST_NAME, MIDDLE_NAME, LAST_NAME, COMPANY_ID, DEPARTMENT_ID, RESIDENT_PERMIT_NO, RESIDENT_PERMIT_EXPIRY_DATE
        FROM VPayEntries.NEW_EMPLOYEE_DATABASE WHERE RESIDENT_PERMIT_EXPIRY_DATE IS NOT NULL
    ),
    STOCK AS (
        SELECT COMPANY_ID, CAMP_ID, STORE_ID, PRODUCT_ID, MAX(OPENING_STOCK_DATE) AS MaxDate
        FROM VMaster.TBL_PRODUCT_OPENING_STOCK
        WHERE STATUS_MASTER = 'AC'
        GROUP BY COMPANY_ID, CAMP_ID, STORE_ID, PRODUCT_ID
    ),
    CUR AS (
        SELECT o.COMPANY_ID, o.CAMP_ID, o.STORE_ID, o.PRODUCT_ID, o.QTY,
            ROW_NUMBER() OVER (PARTITION BY o.COMPANY_ID, o.CAMP_ID, o.STORE_ID, o.PRODUCT_ID ORDER BY o.OPENING_STOCK_DATE DESC) AS rn
        FROM STOCK s
        JOIN VMaster.TBL_PRODUCT_OPENING_STOCK o
          ON o.COMPANY_ID = s.COMPANY_ID AND o.CAMP_ID = s.CAMP_ID AND o.STORE_ID = s.STORE_ID AND o.PRODUCT_ID = s.PRODUCT_ID AND o.OPENING_STOCK_DATE = s.MaxDate
    ),
    MINS AS (
        SELECT t.COMPANY_ID, t.CAMP_ID, t.STORE_ID, t.PRODUCT_ID, t.MINIMUM_STOCK_PCS, t.PURCHASE_ALERT_QTY
        FROM (
            SELECT m.*, ROW_NUMBER() OVER (PARTITION BY m.COMPANY_ID, m.CAMP_ID, m.STORE_ID, m.PRODUCT_ID ORDER BY ISNULL(m.EFFECTIVE_FROM,'1900-01-01') DESC) AS rn
            FROM VMaster.TBL_STORE_PRODUCT_MINIMUM_STOCK m
            WHERE m.STATUS_MASTER = 'AC' AND (m.EFFECTIVE_TO IS NULL OR m.EFFECTIVE_TO >= CAST(GETDATE() AS DATE))
        ) t WHERE t.rn = 1
    ),
    LOW AS (
        SELECT c.PRODUCT_ID
        FROM CUR c
        JOIN MINS m
          ON m.COMPANY_ID = c.COMPANY_ID AND m.CAMP_ID = c.CAMP_ID AND m.STORE_ID = c.STORE_ID AND m.PRODUCT_ID = c.PRODUCT_ID
        WHERE c.rn = 1 AND (c.QTY < m.MINIMUM_STOCK_PCS OR c.QTY < m.PURCHASE_ALERT_QTY)
    ),
    CVT AS (
        SELECT CONTRACT_ID, EMP_ID, FIRST_NAME, MIDDLE_NAME, LAST_NAME, CONTRACT_TYPE_ID, CONTRACT_STATUS, CONTRACT_VALID_FROM_DATE, CONTRACT_VALID_TO_DATE
        FROM VPayEntries.TBL_NEW_EMPLOYEE_CONTRACTS
        WHERE CONTRACT_VALID_TO_DATE IS NOT NULL
    ),
    DED AS (
        SELECT DED_REF_ID, EMP_ID, FIRST_NAME, MIDDLE_NAME, LAST_NAME, REQUEST_REF_NO, REQUEST_TYPE, DEDUCTION_AMOUNT, STATUS_ENTRY
        FROM VPayEntries.TBL_DEDUCTION_ENTRIES
        WHERE UPPER(ISNULL(LTRIM(RTRIM(STATUS_ENTRY)),'')) <> 'CL'
    ),
    MAD AS (
        SELECT M_AUTO_REF_NO, EMP_ID, FIRST_NAME, MIDDLE_NAME, LAST_NAME, REQUEST_REF_NO, SALARY_DEDUCTION_TYPE, TOTAL_DEDUCTION_AMOUNT, MONTHLY_DEDUCTION, STATUS_ENTRY
        FROM VPayEntries.TBL_MONTHLY_AUTO_DEDUCTION
        WHERE UPPER(ISNULL(LTRIM(RTRIM(STATUS_ENTRY)),'')) <> 'CL'
    ),
    BEN AS (
        SELECT EMP_BENEFIT_REF_NO, EMP_ID, FIRST_NAME, MIDDLE_NAME, LAST_NAME, TOTAL_GROSS_AMOUNT, PAID_STATUS
        FROM VPayEntries.TBL_EMPLOYEE_BENEFIT_HDR
        WHERE STATUS_MASTER = 'AC'
    ),
    OTE AS (
        SELECT OT_REQUEST_REF_NO, EMP_ID, OT_HOURS, OT_AMOUNT
        FROM VPayEntries.TBL_OVERTIME_ENTRIES
        WHERE STATUS_MASTER = 'AC'
    ),
    HUNT AS (
        SELECT DISTINCT ANIMAL_ID
        FROM VMaster.TBL_ANIMAL_HUNTING_CHARGES_MASTER_DTL
        WHERE STATUS_MASTER = 'AC'
    )
    SELECT
        'management-attention' AS CardKey,
        'Management Attention' AS CardTitle,
        'attention' AS GroupKey,
        'Management Attention' AS GroupTitle,
        'ShieldAlert' AS IconKey,
        'red' AS ColorKey,
        1 AS OrderSeq,
        'OVERDUE,EXPIRED,LOW,CRITICAL,SOON30,ALL' AS Filters,
        (SELECT SUM(Overdue) FROM REQ_AGG) + (SELECT COUNT(*) FROM LIC WHERE ExpDate < GETDATE()) + (SELECT COUNT(*) FROM CVT WHERE CONTRACT_VALID_TO_DATE < GETDATE()) AS TotalCount,
        (SELECT SUM(Overdue) FROM REQ_AGG) AS PendingCount,
        (SELECT COUNT(*) FROM LIC WHERE ExpDate < GETDATE()) AS ApprovedCount,
        (SELECT COUNT(*) FROM LOW) AS HoldCount,
        (SELECT COUNT(*) FROM CVT WHERE CONTRACT_VALID_TO_DATE >= GETDATE() AND CONTRACT_VALID_TO_DATE <= DATEADD(DAY,30,GETDATE())) AS RejectedCount,
        0 AS ExtraCount1, 0 AS ExtraCount2,
        'Overdue >' + CAST(@OverdueDays AS VARCHAR(3)) + 'd' AS ExtraLabel1,
        NULL AS ExtraLabel2,
        'Critical issues = overdue approvals + expired licences/permits + expired contracts. Low/critical stock rows and contracts expiring in 30 days are shown alongside.' AS ApproxNote
    UNION ALL SELECT 'employees', 'Employee', 'workforce', 'Workforce', 'Users', 'sky', 2, 'ACTIVE,INACTIVE,PRESENT,ABSENT,ALL',
        (SELECT COUNT(*) FROM VPayEntries.NEW_EMPLOYEE_DATABASE),
        (SELECT COUNT(*) FROM TODAY WHERE TypeName LIKE '%Present%'),
        (SELECT COUNT(*) FROM VPayEntries.NEW_EMPLOYEE_DATABASE WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE')),
        (SELECT COUNT(*) FROM VPayEntries.NEW_EMPLOYEE_DATABASE WHERE UPPER(ISNULL(STATUS_MASTER,'')) NOT IN ('AC','ACTIVE')),
        (SELECT COUNT(*) FROM TODAY WHERE TypeName LIKE '%Absent%'),
        0, 0,
        'Present', NULL,
        'Present/Absent today = approved attendance records covering today. Active/Inactive = employee master status.'
UNION ALL SELECT 'attendance', 'Attendance', 'workforce', 'Workforce', 'CalendarCheck', 'indigo', 3, 'PRESENT,ABSENT,SICK,LATE,ALL',
        (SELECT COUNT(*) FROM ATT),
        (SELECT COUNT(*) FROM ATT WHERE TypeName LIKE '%Absent%'),
        (SELECT COUNT(*) FROM ATT WHERE TypeName LIKE '%Sick%'),
        (SELECT COUNT(*) FROM ATT WHERE TypeName LIKE '%Late%'),
        0, 0, 0,
        'Present today', NULL, 'Attendance is request/detail based; counts cover all approved records.'
    UNION ALL SELECT 'leave', 'Leave', 'workforce', 'Workforce', 'CalendarRange', 'violet', 4, 'ONLEAVE,PENDING,APPROVED,ALL',
        (SELECT COUNT(*) FROM ATT WHERE TypeName LIKE '%Leave%') + ISNULL((SELECT COUNT(*) FROM VRequest.TBL_LEAVE_ENCASHMENT_REQUEST WHERE STATUS_MASTER = 'AC'),0),
        (SELECT Pend FROM REQ_AGG WHERE Src = 'Attendance Request') + ISNULL((SELECT Pend FROM REQ_AGG WHERE Src = 'Leave Encashment Request'),0),
        (SELECT COUNT(*) FROM VMaster.TBL_ATTENDANCE_TYPE_MASTER WHERE STATUS_MASTER = 'AC' AND ATTENDANCE_TYPE_NAME LIKE '%Leave%'),
        (SELECT SUM(BALANCE_LEAVE) FROM ATT WHERE St = 'APPROVED'),
        0, 0, 0,
        'Leave balance (days)', NULL, 'Leave flows through attendance records and leave encashment requests; no separate leave master exists yet.'
    UNION ALL SELECT 'drivers', 'Drivers', 'fleet', 'Fleet & Transport', 'UserRound', 'teal', 5, 'ACTIVE,INACTIVE,EXPIRED,SOON30,ALL',
        (SELECT COUNT(*) FROM VMaster.TBL_DRIVER_MASTER_HDR),
        (SELECT COUNT(*) FROM VMaster.TBL_DRIVER_MASTER_HDR WHERE DRIVING_LICENSE_EXPIRY_DATE >= GETDATE() AND DRIVING_LICENSE_EXPIRY_DATE <= DATEADD(DAY,30,GETDATE())),
        (SELECT COUNT(*) FROM VMaster.TBL_DRIVER_MASTER_HDR WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE')),
        (SELECT COUNT(*) FROM VMaster.TBL_DRIVER_MASTER_HDR WHERE UPPER(ISNULL(STATUS_MASTER,'')) NOT IN ('AC','ACTIVE')),
        (SELECT COUNT(*) FROM VMaster.TBL_DRIVER_MASTER_HDR WHERE DRIVING_LICENSE_EXPIRY_DATE < GETDATE()),
        0, 0,
        'Licences expiring 30d', NULL,
        'Licence expiry read from the driver master expiry date.'
    UNION ALL SELECT 'trucks', 'Trucks', 'fleet', 'Fleet & Transport', 'Truck', 'indigo', 6, 'ACTIVE,INACTIVE,EXPIRED,SOON30,MAINTENANCE,AVAILABLE,ALL',
        (SELECT COUNT(*) FROM VMaster.TBL_TRUCK_MASTER_hdr),
        (SELECT COUNT(*) FROM VMaster.TBL_TRUCK_MASTER_hdr WHERE DRIVING_LICENSE_EXPIRY_DATE IS NOT NULL AND DRIVING_LICENSE_EXPIRY_DATE < DATEADD(DAY,30,GETDATE())),
        (SELECT COUNT(*) FROM VMaster.TBL_TRUCK_MASTER_hdr WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE')),
        (SELECT COUNT(*) FROM VMaster.TBL_TRUCK_MASTER_hdr WHERE UPPER(ISNULL(STATUS_MASTER,'')) NOT IN ('AC','ACTIVE')),
        (SELECT COUNT(*) FROM VMaster.TBL_TRUCK_MASTER_hdr WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE') AND (UPPER(ISNULL(TRUCK_STATUS,'')) LIKE '%MAINTENANCE%' OR UPPER(ISNULL(TRUCK_STATUS,'')) LIKE '%SERVICE%' OR UPPER(ISNULL(TRUCK_STATUS,'')) LIKE '%REPAIR%')),
        (SELECT COUNT(*) FROM VMaster.TBL_TRUCK_MASTER_hdr WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE') AND UPPER(ISNULL(TRUCK_STATUS,'')) = 'AVAILABLE'),
        0,
        'Licences expiring/expired', 'Available', 'Expiry = driving licence coming due or expired. Maintenance/available read from TRUCK_STATUS; insurance has no expiry date field.'
    UNION ALL SELECT 'trailers', 'Trailers', 'fleet', 'Fleet & Transport', 'Container', 'amber', 7, 'ACTIVE,INACTIVE,ALL',
        (SELECT COUNT(*) FROM VMaster.TBL_TRAILER_MASTER_HDR),
        (SELECT COUNT(*) FROM VMaster.TBL_TRAILER_MASTER_HDR WHERE 1 = 0),
        (SELECT COUNT(*) FROM VMaster.TBL_TRAILER_MASTER_HDR WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE')),
        (SELECT COUNT(*) FROM VMaster.TBL_TRAILER_MASTER_HDR WHERE UPPER(ISNULL(STATUS_MASTER,'')) NOT IN ('AC','ACTIVE')),
        0, 0, 0,
        'Insurance/Doc expiry', NULL, 'Trailer master only tracks active/inactive. Maintenance and insurance/document expiry dates are not stored.'
    UNION ALL SELECT 'contracts', 'Contracts', 'contracts', 'Contracts', 'FileSignature', 'orange', 8, 'ACTIVE,INACTIVE,ALL',
        (SELECT COUNT(*) FROM VMaster.TBL_EMPLOYEE_CONTRACT_TYPE_MASTER),
        (SELECT COUNT(*) FROM VMaster.TBL_EMPLOYEE_CONTRACT_TYPE_MASTER WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE')),
        0, 0,
        (SELECT COUNT(*) FROM VMaster.TBL_EMPLOYEE_CONTRACT_TYPE_MASTER WHERE UPPER(ISNULL(STATUS_MASTER,'')) NOT IN ('AC','ACTIVE')),
        0, 0,
        'Active', NULL, 'Contract types from the employee contract type master; ACTIVE maps to AC status.'
    UNION ALL SELECT 'overtime-requests', 'Overtime', 'hrpayroll', 'HR & Payroll', 'Timer', 'sky', 9, 'PENDING,APPROVED,ALL',
        (SELECT Total FROM REQ_AGG WHERE Src = 'Overtime Request'), (SELECT Pend FROM REQ_AGG WHERE Src = 'Overtime Request'),
        (SELECT Appr FROM REQ_AGG WHERE Src = 'Overtime Request'), 0, 0,
        (SELECT ISNULL(SUM(OT_HOURS),0) FROM OTE), (SELECT ISNULL(SUM(OT_AMOUNT),0) FROM OTE),
        'OT hours', 'OT amount', 'Hours/amount from committed overtime entries; approval state from overtime requests.'
    UNION ALL SELECT 'cash-advance-requests', 'Cash Advance', 'hrpayroll', 'HR & Payroll', 'Wallet', 'emerald', 10, 'PENDING,APPROVED,HOLD,REJECTED,ALL',
        (SELECT Total FROM REQ_AGG WHERE Src = 'Cash Advance Request'), (SELECT Pend FROM REQ_AGG WHERE Src = 'Cash Advance Request'),
        (SELECT Appr FROM REQ_AGG WHERE Src = 'Cash Advance Request'), (SELECT Hold FROM REQ_AGG WHERE Src = 'Cash Advance Request'),
        (SELECT Rej FROM REQ_AGG WHERE Src = 'Cash Advance Request'), 0, 0, NULL, NULL, NULL
    UNION ALL SELECT 'bonus-requests', 'Bonus', 'hrpayroll', 'HR & Payroll', 'Gift', 'rose', 11, 'PENDING,APPROVED,HOLD,REJECTED,ALL',
        (SELECT Total FROM REQ_AGG WHERE Src = 'Bonus Request'), (SELECT Pend FROM REQ_AGG WHERE Src = 'Bonus Request'),
        (SELECT Appr FROM REQ_AGG WHERE Src = 'Bonus Request'), (SELECT Hold FROM REQ_AGG WHERE Src = 'Bonus Request'),
        (SELECT Rej FROM REQ_AGG WHERE Src = 'Bonus Request'), 0, 0, NULL, NULL, NULL
    UNION ALL SELECT 'arrears-requests', 'Arrears', 'hrpayroll', 'HR & Payroll', 'BadgeDollarSign', 'amber', 12, 'PENDING,APPROVED,HOLD,REJECTED,ALL',
        (SELECT Total FROM REQ_AGG WHERE Src = 'Arrears Request'), (SELECT Pend FROM REQ_AGG WHERE Src = 'Arrears Request'),
        (SELECT Appr FROM REQ_AGG WHERE Src = 'Arrears Request'), (SELECT Hold FROM REQ_AGG WHERE Src = 'Arrears Request'),
        (SELECT Rej FROM REQ_AGG WHERE Src = 'Arrears Request'), 0, 0, NULL, NULL, NULL
    UNION ALL SELECT 'salary-deductions', 'Salary Deduction', 'hrpayroll', 'HR & Payroll', 'Banknote', 'violet', 13, 'ALL',
        (SELECT COUNT(*) FROM DED), 0, 0, 0, 0,
        (SELECT ISNULL(SUM(MONTHLY_DEDUCTION),0) FROM MAD), 0,
        'Monthly deduction', NULL, 'Deduction entries plus the monthly (per-instalment) amount from monthly auto deduction records.'
    UNION ALL SELECT 'employee-benefits', 'Employee Benefits', 'hrpayroll', 'HR & Payroll', 'HeartHandshake', 'teal', 14, 'PAID,UNPAID,ALL',
        (SELECT COUNT(*) FROM BEN),
        (SELECT COUNT(*) FROM BEN WHERE UPPER(ISNULL(LTRIM(RTRIM(PAID_STATUS)),'')) <> 'PAID'),
        (SELECT COUNT(*) FROM BEN WHERE UPPER(ISNULL(LTRIM(RTRIM(PAID_STATUS)),'')) = 'PAID'),
        0, 0,
        (SELECT ISNULL(SUM(TOTAL_GROSS_AMOUNT),0) FROM BEN), 0,
        'Benefit amount', NULL, 'Paid/unpaid from the benefit header PAID_STATUS flag.'
    UNION ALL SELECT 'promotion-transfer-requests', 'Promotion / Transfer', 'hrpayroll', 'HR & Payroll', 'ArrowUpDown', 'orange', 15, 'PENDING,APPROVED,HOLD,REJECTED,ALL',
        (SELECT Total FROM REQ_AGG WHERE Src = 'Promotion/Demotion/Transfer Request'), (SELECT Pend FROM REQ_AGG WHERE Src = 'Promotion/Demotion/Transfer Request'),
        (SELECT Appr FROM REQ_AGG WHERE Src = 'Promotion/Demotion/Transfer Request'), (SELECT Hold FROM REQ_AGG WHERE Src = 'Promotion/Demotion/Transfer Request'),
        (SELECT Rej FROM REQ_AGG WHERE Src = 'Promotion/Demotion/Transfer Request'), 0, 0, NULL, NULL, NULL
    UNION ALL SELECT 'products', 'Product', 'registry', 'Registries', 'Package', 'blue', 16, 'ACTIVE,INACTIVE,PENDING,REJECTED,ALL',
        (SELECT COUNT(*) FROM VMaster.TBL_PRODUCT_MASTER),
        (SELECT COUNT(*) FROM VMaster.TBL_PRODUCT_MASTER WHERE STATUS_MASTER = 'AC' AND UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),'PENDING')))) = 'PENDING'),
        (SELECT COUNT(*) FROM VMaster.TBL_PRODUCT_MASTER WHERE STATUS_MASTER = 'AC' AND UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),'PENDING')))) NOT IN ('PENDING','REJECT')),
        (SELECT COUNT(*) FROM VMaster.TBL_PRODUCT_MASTER WHERE UPPER(ISNULL(STATUS_MASTER,'')) NOT IN ('AC','ACTIVE')),
        (SELECT COUNT(*) FROM VMaster.TBL_PRODUCT_MASTER WHERE STATUS_MASTER = 'AC' AND UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),'PENDING')))) = 'REJECT'),
        0, 0,
        'Active (approved)', 'Approval-driven', 'Product records carry an approval workflow on top of AC/IN status.'
    UNION ALL SELECT 'business-partners', 'Business Partners / Customers', 'registry', 'Registries', 'Handshake', 'violet', 17, 'ACTIVE,INACTIVE,PENDING,REJECTED,ALL',
        (SELECT COUNT(*) FROM VMaster.TBL_BUSINESS_PARTNER_MASTER),
        (SELECT COUNT(*) FROM VMaster.TBL_BUSINESS_PARTNER_MASTER WHERE STATUS_MASTER = 'AC' AND UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),'PENDING')))) = 'PENDING'),
        (SELECT COUNT(*) FROM VMaster.TBL_BUSINESS_PARTNER_MASTER WHERE STATUS_MASTER = 'AC' AND UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),'PENDING')))) NOT IN ('PENDING','REJECT')),
        (SELECT COUNT(*) FROM VMaster.TBL_BUSINESS_PARTNER_MASTER WHERE UPPER(ISNULL(STATUS_MASTER,'')) NOT IN ('AC','ACTIVE')),
        (SELECT COUNT(*) FROM VMaster.TBL_BUSINESS_PARTNER_MASTER WHERE STATUS_MASTER = 'AC' AND UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)),''),ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),''),ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),''),'PENDING')))) = 'REJECT'),
        0, 0,
        'Active (approved)', 'Approval-driven', 'Covers both supplier and customer partner records with their approval workflow.'
    UNION ALL SELECT 'fuel', 'Fuel', 'registry', 'Registries', 'Fuel', 'amber', 18, 'ACTIVE,INACTIVE,ALL',
        (SELECT COUNT(*) FROM VMaster.TBL_FUEL_STATION_MASTER),
        (SELECT COUNT(*) FROM VMaster.TBL_FUEL_STATION_MASTER WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE')),
        0, 0, 0,
        (SELECT COUNT(*) FROM VMaster.TBL_FUEL_TYPE_MASTER WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE')),
        0,
        'Fuel types', NULL, 'Fuel stations with their active fuel-type master. No consumption/stock data is stored.'
    UNION ALL SELECT 'guns', 'Guns', 'registry', 'Registries', 'Crosshair', 'zinc', 19, 'ACTIVE,INACTIVE,ALL',
        (SELECT COUNT(*) FROM VMaster.TBL_GUN_MASTER),
        (SELECT COUNT(*) FROM VMaster.TBL_GUN_MASTER WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE')),
        0, 0, 0,
        (SELECT COUNT(*) FROM VMaster.TBL_GUN_MASTER WHERE UPPER(ISNULL(STATUS_MASTER,'')) NOT IN ('AC','ACTIVE')),
        0,
        'Inactive', NULL, 'Firearm licence expiry dates are not stored, so licence expiry always shows 0.'
    UNION ALL SELECT 'hotels-travel', 'Hotels / Travel', 'travel', 'Hotels & Travel', 'Plane', 'sky', 20, 'ALL',
        (SELECT COUNT(*) FROM VMaster.TBL_HOTEL_RESORT_MASTER WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE')),
        (SELECT COUNT(*) FROM VMaster.TBL_AIRLINES_MASTER WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE')),
        (SELECT COUNT(*) FROM VMaster.TBL_HOTEL_ROOM_TYPE_MASTER WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE')),
        (SELECT COUNT(*) FROM VMaster.TBL_AIRPORT_MASTER WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE')),
        0,
        (SELECT COUNT(*) FROM VMaster.TBL_TRIP_TEMPLATE_PRICE_MAPPING WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE')),
        0, 'Travel pricing', NULL, 'Hotels, room types, airlines, airports and active trip-template prices for travel planning.'
    UNION ALL SELECT 'animals', 'Animals', 'registry', 'Registries', 'PawPrint', 'emerald', 21, 'ACTIVE,INACTIVE,ALL',
        (SELECT COUNT(*) FROM VMaster.TBL_ANIMAL_MASTER),
        (SELECT COUNT(*) FROM VMaster.TBL_ANIMAL_MASTER WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE')),
        0, 0, 0,
        (SELECT COUNT(*) FROM HUNT), 0,
        'Most visited (priced)', NULL, 'No visit log exists; "most visited" counts animals with active hunting-charge pricing as the visited set.'
    UNION ALL SELECT 'camps', 'Camps', 'registry', 'Registries', 'Tent', 'orange', 22, 'ACTIVE,INACTIVE,ALL',
        (SELECT COUNT(*) FROM VMaster.TBL_CAMP_MASTER),
        (SELECT COUNT(*) FROM VMaster.TBL_CAMP_MASTER WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE')),
        0, 0, 0,
        (SELECT COUNT(*) FROM VMaster.TBL_GUN_CATEGORY_MASTER WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE')),
        0,
        'Gun categories', NULL, 'Total camps alongside the gun-category master count.'
    UNION ALL SELECT 'hotels', 'Hotels', 'registry', 'Registries', 'Hotel', 'rose', 23, 'ACTIVE,INACTIVE,ALL',
        (SELECT COUNT(*) FROM VMaster.TBL_HOTEL_RESORT_MASTER),
        (SELECT COUNT(*) FROM VMaster.TBL_HOTEL_RESORT_MASTER WHERE UPPER(ISNULL(STATUS_MASTER,'')) IN ('AC','ACTIVE')),
        0, 0, 0,
        (SELECT COUNT(*) FROM VMaster.TBL_HOTEL_RESORT_MASTER WHERE UPPER(ISNULL(STATUS_MASTER,'')) NOT IN ('AC','ACTIVE')),
        0,
        'Inactive', NULL, NULL
    ORDER BY OrderSeq;
END
GO

CREATE OR ALTER PROCEDURE [VReport].[GET_DASHBOARD_RECORDS]
    @CardKey VARCHAR(60),
    @Status VARCHAR(30) = 'ALL',
    @Search NVARCHAR(100) = '',
    @FromDate DATE = NULL,
    @ToDate DATE = NULL,
    @Page INT = 1,
    @PageSize INT = 10,
    @SortBy VARCHAR(40) = '',
    @SortDir VARCHAR(4) = 'DESC'
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @base VARCHAR(MAX);
    DECLARE @defaultSort NVARCHAR(40) = 'reqDate';
    DECLARE @Offset INT = (@Page - 1) * @PageSize;
    IF @Offset < 0 SET @Offset = 0;
    IF @PageSize <= 0 SET @PageSize = 10;

    SET @CardKey = LOWER(LTRIM(RTRIM(@CardKey)));

    DECLARE @EmpExpr VARCHAR(MAX) = 'LTRIM(RTRIM(COALESCE(NULLIF(a.FIRST_NAME,'''')+'' '','''') + COALESCE(NULLIF(a.MIDDLE_NAME,'''')+'' '','''') + COALESCE(NULLIF(a.LAST_NAME,''''),'''')))';
    DECLARE @StExpr VARCHAR(MAX) = 'CASE UPPER(ISNULL(NULLIF(LTRIM(RTRIM(a.FINAL_RESPONSE_STATUS)),''''),ISNULL(NULLIF(LTRIM(RTRIM(a.RESPONSE_2_STATUS)),''''),ISNULL(NULLIF(LTRIM(RTRIM(a.RESPONSE_1_STATUS)),''''),ISNULL(NULLIF(LTRIM(RTRIM(a.SECTION_HEAD_RESPONSE_STATUS)),''''),''PENDING''))))) WHEN ''APPROVAL'' THEN ''APPROVED'' WHEN ''APPROVED'' THEN ''APPROVED'' WHEN ''REJECT'' THEN ''REJECTED'' WHEN ''REJECTED'' THEN ''REJECTED'' WHEN ''HOLD'' THEN ''HOLD'' ELSE ''PENDING'' END';
    DECLARE @StExpr3 VARCHAR(MAX) = 'CASE UPPER(ISNULL(NULLIF(LTRIM(RTRIM(a.FINAL_RESPONSE_STATUS)),''''),ISNULL(NULLIF(LTRIM(RTRIM(a.RESPONSE_2_STATUS)),''''),ISNULL(NULLIF(LTRIM(RTRIM(a.RESPONSE_1_STATUS)),''''),''PENDING'')))) WHEN ''APPROVAL'' THEN ''APPROVED'' WHEN ''APPROVED'' THEN ''APPROVED'' WHEN ''REJECT'' THEN ''REJECTED'' WHEN ''REJECTED'' THEN ''REJECTED'' WHEN ''HOLD'' THEN ''HOLD'' ELSE ''PENDING'' END';
    DECLARE @OverdueExpr VARCHAR(MAX) = 'CASE WHEN ' + @StExpr + ' = ''PENDING'' AND a.CREATED_DATE < DATEADD(DAY,-7,GETDATE()) THEN ''OVERDUE'' ELSE ' + @StExpr + ' END';
    DECLARE @StOk NVARCHAR(200) = ' (x.st = @Status OR @Status = ''ALL'') ';

    DECLARE @searchCond NVARCHAR(500) = ' AND (@Search = '''' OR ISNULL(x.refNo,'''') LIKE ''%''+@Search+''%'' OR ISNULL(x.title,'''') LIKE ''%''+@Search+''%'' OR ISNULL(x.empName,'''') LIKE ''%''+@Search+''%'' OR ISNULL(x.subtitle,'''') LIKE ''%''+@Search+''%'')';
    DECLARE @dateCond NVARCHAR(400) = ' AND (@FromDate IS NULL OR (x.reqDate IS NOT NULL AND CONVERT(DATE, x.reqDate) >= @FromDate)) AND (@ToDate IS NULL OR (x.reqDate IS NOT NULL AND CONVERT(DATE, x.reqDate) <= @ToDate))';

    DECLARE @statCond NVARCHAR(200) = ' 1=1 ';

    IF @CardKey = 'management-attention'
    BEGIN
        SET @defaultSort = 'reqDate';
        SET @base = '
            SELECT ''Attendance Request'' AS src, a.SNO AS id, a.ATT_REQUEST_REF_NO AS refNo, ''Attendance Request'' AS title, NULL AS subtitle, ' + @EmpExpr + ' AS empName,
                dp.DEPARTMENT_NAME AS dept, st.STORE_NAME AS store, cp.CAMP_NAME AS camp, NULL AS amount, NULL AS currency,
                a.DATE_FROM AS dateFrom, a.DATE_TO AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate, ' + @OverdueExpr + ' AS st, NULL AS paid, a.REASON AS extra
            FROM VRequest.TBL_ATTENDANCE_REQUEST a
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = a.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER st ON st.STORE_ID = a.STORE_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = a.CAMP_ID
            WHERE a.STATUS_MASTER = ''AC''
            UNION ALL
            SELECT ''Cash Advance Request'', a.SNO, a.CASH_ADV_REQUEST_REF_NO, ''Cash Advance Request'', a.ADVANCE_TYPE, ' + @EmpExpr + ', dp.DEPARTMENT_NAME, st.STORE_NAME, cp.CAMP_NAME, a.REQUEST_AMOUNT, cur.CURRENCY_NAME, a.DEDUCTION_FROM_DATE, a.DEDUCTION_TO_DATE, NULL, a.CREATED_DATE, ' + @OverdueExpr + ', NULL, a.REASON
            FROM VRequest.TBL_CASH_ADVANCE_REQUEST a
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = a.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER st ON st.STORE_ID = a.STORE_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = a.CAMP_ID
            LEFT JOIN VMaster.TBL_CURRENCY_MASTER cur ON cur.CURRENCY_ID = a.CURRENCY_ID
            WHERE a.STATUS_MASTER = ''AC''
            UNION ALL
            SELECT ''Arrears Request'', a.SNO, a.ARREAR_REQUEST_REF_NO, ''Arrears Request'', NULL, ' + @EmpExpr + ', dp.DEPARTMENT_NAME, st.STORE_NAME, cp.CAMP_NAME, a.REQUEST_AMOUNT, cur.CURRENCY_NAME, NULL, NULL, NULL, a.CREATED_DATE, ' + @OverdueExpr + ', NULL, a.REASON
            FROM VREQUEST.TBL_ARREARS_REQUEST a
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = a.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER st ON st.STORE_ID = a.STORE_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = a.CAMP_ID
            LEFT JOIN VMaster.TBL_CURRENCY_MASTER cur ON cur.CURRENCY_ID = a.CURRENCY_ID
            WHERE a.STATUS_MASTER = ''AC''
            UNION ALL
            SELECT ''Overtime Request'', a.SNO, a.OT_REQUEST_REF_NO, ''Overtime Request'', NULL, ' + @EmpExpr + ', dp.DEPARTMENT_NAME, st.STORE_NAME, cp.CAMP_NAME, a.REQUEST_AMOUNT, cur.CURRENCY_NAME, a.OT_FROM_DATE, a.OT_TO_DATE, NULL, a.CREATED_DATE, ' + @OverdueExpr + ', a.PAID_STATUS, a.REASON
            FROM VREQUEST.TBL_OVERTIME_REQUEST a
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = a.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER st ON st.STORE_ID = a.STORE_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = a.CAMP_ID
            LEFT JOIN VMaster.TBL_CURRENCY_MASTER cur ON cur.CURRENCY_ID = a.CURRENCY_ID
            WHERE a.STATUS_MASTER = ''AC''
            UNION ALL
            SELECT ''Bonus Request'', a.SNO, a.BONUS_REQUEST_REF_NO, ''Bonus Request'', a.BONUS_TYPE, ' + @EmpExpr + ', dp.DEPARTMENT_NAME, st.STORE_NAME, cp.CAMP_NAME, a.REQUEST_AMOUNT, cur.CURRENCY_NAME, NULL, NULL, NULL, a.CREATED_DATE, ' + @OverdueExpr + ', a.PAID_STATUS, a.REASON
            FROM VRequest.TBL_BONUS_REQUEST a
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = a.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER st ON st.STORE_ID = a.STORE_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = a.CAMP_ID
            LEFT JOIN VMaster.TBL_CURRENCY_MASTER cur ON cur.CURRENCY_ID = a.CURRENCY_ID
            WHERE a.STATUS_MASTER = ''AC''
            UNION ALL
            SELECT ''Leave Encashment Request'', a.SNO, a.LEAVE_ENCASHMENT_REQUEST_REF_NO, ''Leave Encashment Request'', NULL, ' + @EmpExpr + ', dp.DEPARTMENT_NAME, st.STORE_NAME, cp.CAMP_NAME, a.LEAVE_ENCASHMENT_GROSS_AMOUNT, cur.CURRENCY_NAME, NULL, NULL, NULL, a.CREATED_DATE, ' + @OverdueExpr + ', NULL, ''Days: '' + CAST(a.LEAVE_ENCASHMENT_DAYS AS VARCHAR(20))
            FROM VRequest.TBL_LEAVE_ENCASHMENT_REQUEST a
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = a.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER st ON st.STORE_ID = a.STORE_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = a.CAMP_ID
            LEFT JOIN VMaster.TBL_CURRENCY_MASTER cur ON cur.CURRENCY_ID = a.CURRENCY_ID
            WHERE a.STATUS_MASTER = ''AC''
            UNION ALL
            SELECT ''Promotion/Demotion/Transfer Request'', a.SNO, a.TRANSFER_REQUEST_REF_NO, ''Promotion/Demotion/Transfer Request'', a.TRANSFER_TYPE, ' + @EmpExpr + ', dp.DEPARTMENT_NAME, st.STORE_NAME, cp.CAMP_NAME, a.NEW_GROSS_AMOUNT, cur.CURRENCY_NAME, NULL, NULL, NULL, a.CREATED_DATE, ' + @OverdueExpr + ', NULL, a.REASON
            FROM VRequest.TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST a
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = a.NEW_DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER st ON st.STORE_ID = a.NEW_STORE_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = a.NEW_CAMP_ID
            LEFT JOIN VMaster.TBL_CURRENCY_MASTER cur ON cur.CURRENCY_ID = a.CURRENCY_ID
            WHERE a.STATUS_MASTER = ''AC''
            UNION ALL
            SELECT ''Man Power Change Request'', a.MAN_POWER_REQUEST_ID, ''MP-'' + CAST(a.MAN_POWER_REQUEST_ID AS VARCHAR(20)), ''Man Power Change Request'', ds.DESIGNATION_NAME, NULL, dp.DEPARTMENT_NAME, NULL, NULL, CAST(a.NEW_APPROVED_MAN_POWER AS DECIMAL(18,2)), NULL, NULL, NULL, NULL, a.CREATED_DATE, ' + @OverdueExpr + ', NULL, ''Add/Remove: '' + CAST(a.ADD_REMOVE_MAN_POWER AS VARCHAR(20))
            FROM VMaster.TBL_MAN_POWER_CHANGE_REQUEST a
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = a.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_DESIGNATION_MASTER ds ON ds.DESIGNATION_ID = a.DESIGNATION_ID
            WHERE a.STATUS_MASTER = ''AC''
            UNION ALL
            SELECT ''Driving Licence'', n.EMP_ID, ''Driving Licence'', ''Employee Checklist'', NULL, LTRIM(RTRIM(COALESCE(NULLIF(FIRST_NAME,'''')+'' '','''') + COALESCE(NULLIF(MIDDLE_NAME,'''')+'' '','''') + COALESCE(NULLIF(LAST_NAME,''''),''''))), dp.DEPARTMENT_NAME, NULL, NULL, NULL, NULL, NULL, NULL, DRIVING_LICENSE_EXPIRE_DATE, NULL,
                CASE WHEN DRIVING_LICENSE_EXPIRE_DATE < GETDATE() THEN ''EXPIRED'' WHEN DRIVING_LICENSE_EXPIRE_DATE <= DATEADD(DAY,30,GETDATE()) THEN ''SOON30'' WHEN DRIVING_LICENSE_EXPIRE_DATE <= DATEADD(DAY,60,GETDATE()) THEN ''SOON60'' ELSE ''VALID'' END, NULL, DRIVING_LICENSE_NO
            FROM VPayEntries.NEW_EMPLOYEE_DATABASE n
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = n.DEPARTMENT_ID
            WHERE DRIVING_LICENSE_EXPIRE_DATE IS NOT NULL
            UNION ALL
            SELECT ''Passport'', n.EMP_ID, ''Passport'', ''Employee Checklist'', NULL, LTRIM(RTRIM(COALESCE(NULLIF(FIRST_NAME,'''')+'' '','''') + COALESCE(NULLIF(MIDDLE_NAME,'''')+'' '','''') + COALESCE(NULLIF(LAST_NAME,''''),''''))), dp.DEPARTMENT_NAME, NULL, NULL, NULL, NULL, NULL, NULL, PASSPORT_EXPIRY_DATE, NULL,
                CASE WHEN PASSPORT_EXPIRY_DATE < GETDATE() THEN ''EXPIRED'' WHEN PASSPORT_EXPIRY_DATE <= DATEADD(DAY,30,GETDATE()) THEN ''SOON30'' WHEN PASSPORT_EXPIRY_DATE <= DATEADD(DAY,60,GETDATE()) THEN ''SOON60'' ELSE ''VALID'' END, NULL, PASSPORT_NO
            FROM VPayEntries.NEW_EMPLOYEE_DATABASE n
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = n.DEPARTMENT_ID
            WHERE PASSPORT_EXPIRY_DATE IS NOT NULL
            UNION ALL
            SELECT ''Visa'', n.EMP_ID, ''Visa'', ''Employee Checklist'', NULL, LTRIM(RTRIM(COALESCE(NULLIF(FIRST_NAME,'''')+'' '','''') + COALESCE(NULLIF(MIDDLE_NAME,'''')+'' '','''') + COALESCE(NULLIF(LAST_NAME,''''),''''))), dp.DEPARTMENT_NAME, NULL, NULL, NULL, NULL, NULL, NULL, VISA_EXPIRY_DATE, NULL,
                CASE WHEN VISA_EXPIRY_DATE < GETDATE() THEN ''EXPIRED'' WHEN VISA_EXPIRY_DATE <= DATEADD(DAY,30,GETDATE()) THEN ''SOON30'' WHEN VISA_EXPIRY_DATE <= DATEADD(DAY,60,GETDATE()) THEN ''SOON60'' ELSE ''VALID'' END, NULL, NULL
            FROM VPayEntries.NEW_EMPLOYEE_DATABASE n
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = n.DEPARTMENT_ID
            WHERE VISA_EXPIRY_DATE IS NOT NULL
            UNION ALL
            SELECT ''Work Permit'', n.EMP_ID, ''Work Permit'', ''Employee Checklist'', NULL, LTRIM(RTRIM(COALESCE(NULLIF(FIRST_NAME,'''')+'' '','''') + COALESCE(NULLIF(MIDDLE_NAME,'''')+'' '','''') + COALESCE(NULLIF(LAST_NAME,''''),''''))), dp.DEPARTMENT_NAME, NULL, NULL, NULL, NULL, NULL, NULL, WORK_PERMIT_EXPIRY_DATE, NULL,
                CASE WHEN WORK_PERMIT_EXPIRY_DATE < GETDATE() THEN ''EXPIRED'' WHEN WORK_PERMIT_EXPIRY_DATE <= DATEADD(DAY,30,GETDATE()) THEN ''SOON30'' WHEN WORK_PERMIT_EXPIRY_DATE <= DATEADD(DAY,60,GETDATE()) THEN ''SOON60'' ELSE ''VALID'' END, NULL, WORK_PERMIT_NO
            FROM VPayEntries.NEW_EMPLOYEE_DATABASE n
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = n.DEPARTMENT_ID
            WHERE WORK_PERMIT_EXPIRY_DATE IS NOT NULL
            UNION ALL
            SELECT ''Resident Permit'', n.EMP_ID, ''Resident Permit'', ''Employee Checklist'', NULL, LTRIM(RTRIM(COALESCE(NULLIF(FIRST_NAME,'''')+'' '','''') + COALESCE(NULLIF(MIDDLE_NAME,'''')+'' '','''') + COALESCE(NULLIF(LAST_NAME,''''),''''))), dp.DEPARTMENT_NAME, NULL, NULL, NULL, NULL, NULL, NULL, RESIDENT_PERMIT_EXPIRY_DATE, NULL,
                CASE WHEN RESIDENT_PERMIT_EXPIRY_DATE < GETDATE() THEN ''EXPIRED'' WHEN RESIDENT_PERMIT_EXPIRY_DATE <= DATEADD(DAY,30,GETDATE()) THEN ''SOON30'' WHEN RESIDENT_PERMIT_EXPIRY_DATE <= DATEADD(DAY,60,GETDATE()) THEN ''SOON60'' ELSE ''VALID'' END, NULL, RESIDENT_PERMIT_NO
            FROM VPayEntries.NEW_EMPLOYEE_DATABASE n
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = n.DEPARTMENT_ID
            WHERE RESIDENT_PERMIT_EXPIRY_DATE IS NOT NULL
            UNION ALL
            SELECT ''Low Stock'', c.PRODUCT_ID, CONVERT(VARCHAR(20), c.PRODUCT_ID), ''['' + s.STORE_NAME + ''] '' + p.PRODUCT_NAME, cp.CAMP_NAME, NULL, NULL, s.STORE_NAME, cp.CAMP_NAME, c.QTY, NULL, NULL, NULL, NULL, c.StockDate,
                CASE WHEN c.QTY < m.PURCHASE_ALERT_QTY THEN ''CRITICAL'' WHEN c.QTY < m.MINIMUM_STOCK_PCS THEN ''LOW'' ELSE ''OK'' END, NULL, ''Min '' + CAST(m.MINIMUM_STOCK_PCS AS VARCHAR(20)) + '' / Alert '' + CAST(m.PURCHASE_ALERT_QTY AS VARCHAR(20))
            FROM (
                SELECT o.COMPANY_ID, o.CAMP_ID, o.STORE_ID, o.PRODUCT_ID, o.QTY, o.OPENING_STOCK_DATE AS StockDate,
                    ROW_NUMBER() OVER (PARTITION BY o.COMPANY_ID, o.CAMP_ID, o.STORE_ID, o.PRODUCT_ID ORDER BY o.OPENING_STOCK_DATE DESC) AS rn
                FROM (
                    SELECT COMPANY_ID, CAMP_ID, STORE_ID, PRODUCT_ID, MAX(OPENING_STOCK_DATE) AS MaxDate
                    FROM VMaster.TBL_PRODUCT_OPENING_STOCK
                    WHERE STATUS_MASTER = ''AC''
                    GROUP BY COMPANY_ID, CAMP_ID, STORE_ID, PRODUCT_ID
                ) s
                JOIN VMaster.TBL_PRODUCT_OPENING_STOCK o
                  ON o.COMPANY_ID = s.COMPANY_ID AND o.CAMP_ID = s.CAMP_ID AND o.STORE_ID = s.STORE_ID AND o.PRODUCT_ID = s.PRODUCT_ID AND o.OPENING_STOCK_DATE = s.MaxDate
            ) c
            JOIN (
                SELECT t.COMPANY_ID, t.CAMP_ID, t.STORE_ID, t.PRODUCT_ID, t.MINIMUM_STOCK_PCS, t.PURCHASE_ALERT_QTY
                FROM (
                    SELECT m.*, ROW_NUMBER() OVER (PARTITION BY m.COMPANY_ID, m.CAMP_ID, m.STORE_ID, m.PRODUCT_ID ORDER BY ISNULL(m.EFFECTIVE_FROM,''1900-01-01'') DESC) AS rn
                    FROM VMaster.TBL_STORE_PRODUCT_MINIMUM_STOCK m
                    WHERE m.STATUS_MASTER = ''AC'' AND (m.EFFECTIVE_TO IS NULL OR m.EFFECTIVE_TO >= CAST(GETDATE() AS DATE))
                ) t WHERE t.rn = 1
            ) m
              ON m.COMPANY_ID = c.COMPANY_ID AND m.CAMP_ID = c.CAMP_ID AND m.STORE_ID = c.STORE_ID AND m.PRODUCT_ID = c.PRODUCT_ID
            JOIN VMaster.TBL_PRODUCT_MASTER p ON p.PRODUCT_ID = c.PRODUCT_ID
            JOIN VMaster.TBL_STORE_MASTER s ON s.STORE_ID = c.STORE_ID
            JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = c.CAMP_ID
            WHERE c.rn = 1
            UNION ALL
            SELECT ''Contract'', a.CONTRACT_ID, ''CONTR-'' + CAST(a.CONTRACT_ID AS VARCHAR(20)), ct.CONTRACT_TYPE_NAME, ''Contract'', LTRIM(RTRIM(COALESCE(NULLIF(a.FIRST_NAME,'''')+'' '','''') + COALESCE(NULLIF(a.MIDDLE_NAME,'''')+'' '','''') + COALESCE(NULLIF(a.LAST_NAME,''''),''''))), dp.DEPARTMENT_NAME, NULL, cp.CAMP_NAME, NULL, NULL, a.CONTRACT_VALID_FROM_DATE, a.CONTRACT_VALID_TO_DATE, a.CONTRACT_VALID_TO_DATE, a.CREATED_DATE,
                CASE WHEN a.CONTRACT_VALID_TO_DATE < GETDATE() THEN ''EXPIRED'' WHEN a.CONTRACT_VALID_TO_DATE <= DATEADD(DAY,30,GETDATE()) THEN ''SOON30'' WHEN a.CONTRACT_VALID_TO_DATE <= DATEADD(DAY,60,GETDATE()) THEN ''SOON60'' ELSE ''VALID'' END, a.CONTRACT_STATUS, CAST(a.NO_OF_MONTHS AS VARCHAR(20))
            FROM VPayEntries.TBL_NEW_EMPLOYEE_CONTRACTS a
            LEFT JOIN VMaster.TBL_EMPLOYEE_CONTRACT_TYPE_MASTER ct ON ct.CONTRACT_TYPE_ID = a.CONTRACT_TYPE_ID
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = a.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = a.CAMP_ID
            WHERE a.CONTRACT_VALID_TO_DATE IS NOT NULL AND ISNULL(a.STATUS_ENTRY,'''') <> ''CL''';
        IF @Status = 'OVERDUE'
            SET @statCond = ' x.st = ''OVERDUE'' ';
        ELSE IF @Status = 'EXPIRED'
            SET @statCond = ' x.st = ''EXPIRED'' ';
        ELSE IF @Status = 'LOW'
            SET @statCond = ' x.st IN (''LOW'',''CRITICAL'') ';
        ELSE IF @Status = 'CRITICAL'
            SET @statCond = ' x.st = ''CRITICAL'' ';
        ELSE IF @Status = 'SOON30'
            SET @statCond = ' x.st = ''SOON30'' ';
        ELSE
            SET @statCond = ' 1=1 ';
    END
    ELSE IF @CardKey = 'employees'
    BEGIN
        SET @defaultSort = 'title';
        SET @base = 'SELECT a.EMP_ID AS id, CAST(a.EMP_ID AS VARCHAR(20)) AS refNo, LTRIM(RTRIM(COALESCE(NULLIF(a.FIRST_NAME,'''')+'' '','''') + COALESCE(NULLIF(a.MIDDLE_NAME,'''')+'' '','''') + COALESCE(NULLIF(a.LAST_NAME,''''),''''))) AS title,
                ws.EMP_CURRENT_STATUS_NAME AS subtitle, NULL AS empName, dp.DEPARTMENT_NAME AS dept, st.STORE_NAME AS store, cp.CAMP_NAME AS camp,
                a.GROSS AS amount, cur.CURRENCY_NAME AS currency, a.DATE_OF_JOINING AS dateFrom, NULL AS dateTo, a.CONTRACT_END_DATE_LATEST AS expiryDate, a.CREATED_DATE AS reqDate,
                CASE WHEN UPPER(ISNULL(a.STATUS_MASTER,'''')) IN (''AC'',''ACTIVE'') THEN
                    CASE WHEN td.Cat = ''PRESENT'' THEN ''PRESENT'' WHEN td.Cat = ''ABSENT'' THEN ''ABSENT'' ELSE ''ACTIVE'' END
                    ELSE ''INACTIVE'' END AS st, NULL AS paid,
                ''Status eff: '' + CONVERT(VARCHAR(10), a.STATUS_EFFECTIVE_FROM, 120) AS extra
            FROM VPayEntries.NEW_EMPLOYEE_DATABASE a
            LEFT JOIN VMaster.TBL_EMPLOYEE_WORKING_STATUS_MASTER ws ON ws.EMP_CURRENT_STATUS_ID = a.EMP_CURRENT_STATUS_ID
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = a.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER st ON st.STORE_ID = a.STORE_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = a.CAMP_ID
            LEFT JOIN VMaster.TBL_CURRENCY_MASTER cur ON cur.CURRENCY_ID = a.CURRENCY_ID
            LEFT JOIN (
                SELECT DISTINCT ad.EMP_ID,
                    CASE WHEN atm.ATTENDANCE_TYPE_NAME LIKE ''%Absent%'' THEN ''ABSENT'' WHEN atm.ATTENDANCE_TYPE_NAME LIKE ''%Present%'' THEN ''PRESENT'' ELSE NULL END AS Cat
                FROM VPayEntries.ATTENDANCE_DETAILS ad
                LEFT JOIN VMaster.TBL_ATTENDANCE_TYPE_MASTER atm ON atm.ATTENDANCE_TYPE_ID = ad.ATTENDANCE_TYPE_ID
                WHERE ad.STATUS_MASTER = ''AC''
                  AND UPPER(ISNULL(NULLIF(LTRIM(RTRIM(ad.FINAL_RESPONSE_STATUS)),''''),ISNULL(NULLIF(LTRIM(RTRIM(ad.RESPONSE_2_STATUS)),''''),ISNULL(NULLIF(LTRIM(RTRIM(ad.RESPONSE_1_STATUS)),''''),ISNULL(NULLIF(LTRIM(RTRIM(ad.SECTION_HEAD_RESPONSE_STATUS)),''''),''PENDING''))))) IN (''APPROVAL'',''APPROVED'')
                  AND CAST(GETDATE() AS DATE) BETWEEN CAST(ad.DATE_FROM AS DATE) AND CAST(ad.DATE_TO AS DATE)
            ) td ON td.EMP_ID = a.EMP_ID';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'attendance'
    BEGIN
        SET @defaultSort = 'reqDate';
        SET @base = 'SELECT ad.SNO AS id, ad.ATT_REQUEST_REF_NO AS refNo, LTRIM(RTRIM(ISNULL(atm.ATTENDANCE_TYPE_NAME,''''))) AS title, ''Attendance Detail'' AS subtitle, ' + REPLACE(@EmpExpr, 'a.', 'emp.') + ' AS empName,
                dp.DEPARTMENT_NAME AS dept, st.STORE_NAME AS store, cp.CAMP_NAME AS camp, ad.NO_OF_DAYS AS amount, NULL AS currency,
                ad.DATE_FROM AS dateFrom, ad.DATE_TO AS dateTo, NULL AS expiryDate, ad.CREATED_DATE AS reqDate,
                CASE WHEN atm.ATTENDANCE_TYPE_NAME LIKE ''%Sick%'' THEN ''SICK'' WHEN atm.ATTENDANCE_TYPE_NAME LIKE ''%Late%'' THEN ''LATE''
                     WHEN atm.ATTENDANCE_TYPE_NAME LIKE ''%Absent%'' THEN ''ABSENT'' WHEN atm.ATTENDANCE_TYPE_NAME LIKE ''%Present%'' THEN ''PRESENT'' ELSE ''OTHER'' END AS st,
                NULL AS paid, ''Balance leave: '' + ISNULL(CONVERT(VARCHAR(20), ad.BALANCE_LEAVE),'''') AS extra
            FROM VPayEntries.ATTENDANCE_DETAILS ad
            LEFT JOIN VPayEntries.NEW_EMPLOYEE_DATABASE emp ON emp.EMP_ID = ad.EMP_ID
            LEFT JOIN VMaster.TBL_ATTENDANCE_TYPE_MASTER atm ON atm.ATTENDANCE_TYPE_ID = ad.ATTENDANCE_TYPE_ID
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = ad.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER st ON st.STORE_ID = ad.STORE_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = ad.CAMP_ID
            WHERE ad.STATUS_MASTER = ''AC''';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'leave'
    BEGIN
        SET @defaultSort = 'reqDate';
        SET @base = 'SELECT ad.SNO AS id, ad.ATT_REQUEST_REF_NO AS refNo, LTRIM(RTRIM(ISNULL(atm.ATTENDANCE_TYPE_NAME,''''))) AS title, ''Attendance'' AS subtitle, ' + REPLACE(@EmpExpr, 'a.', 'emp.') + ' AS empName,
                dp.DEPARTMENT_NAME AS dept, st.STORE_NAME AS store, cp.CAMP_NAME AS camp, ad.NO_OF_DAYS AS amount, NULL AS currency,
                ad.DATE_FROM AS dateFrom, ad.DATE_TO AS dateTo, NULL AS expiryDate, ad.CREATED_DATE AS reqDate,
                CASE WHEN ' + REPLACE(@StExpr, 'a.', 'ad.') + ' = ''APPROVED'' THEN CASE WHEN CAST(GETDATE() AS DATE) BETWEEN CAST(ad.DATE_FROM AS DATE) AND CAST(ad.DATE_TO AS DATE) THEN ''ONLEAVE'' ELSE ''APPROVED'' END ELSE ''PENDING'' END AS st,
                NULL AS paid, ''Balance leave: '' + ISNULL(CONVERT(VARCHAR(20), ad.BALANCE_LEAVE),'''') AS extra
            FROM VPayEntries.ATTENDANCE_DETAILS ad
            LEFT JOIN VPayEntries.NEW_EMPLOYEE_DATABASE emp ON emp.EMP_ID = ad.EMP_ID
            LEFT JOIN VMaster.TBL_ATTENDANCE_TYPE_MASTER atm ON atm.ATTENDANCE_TYPE_ID = ad.ATTENDANCE_TYPE_ID
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = ad.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER st ON st.STORE_ID = ad.STORE_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = ad.CAMP_ID
            WHERE ad.STATUS_MASTER = ''AC'' AND atm.ATTENDANCE_TYPE_NAME LIKE ''%Leave%''
            UNION ALL
            SELECT a.SNO AS id, a.LEAVE_ENCASHMENT_REQUEST_REF_NO AS refNo, ''Leave Encashment Request'' AS title, NULL AS subtitle, ' + @EmpExpr + ' AS empName,
                dp.DEPARTMENT_NAME AS dept, st.STORE_NAME AS store, cp.CAMP_NAME AS camp, a.LEAVE_ENCASHMENT_GROSS_AMOUNT AS amount, cur.CURRENCY_NAME AS currency,
                NULL AS dateFrom, NULL AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate, ' + @StExpr + ' AS st, NULL AS paid,
                ''Days: '' + CAST(a.LEAVE_ENCASHMENT_DAYS AS VARCHAR(20)) AS extra
            FROM VRequest.TBL_LEAVE_ENCASHMENT_REQUEST a
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = a.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER st ON st.STORE_ID = a.STORE_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = a.CAMP_ID
            LEFT JOIN VMaster.TBL_CURRENCY_MASTER cur ON cur.CURRENCY_ID = a.CURRENCY_ID
            WHERE a.STATUS_MASTER = ''AC''';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'drivers'
    BEGIN
        SET @defaultSort = 'title';
        SET @base = 'SELECT a.SNO AS id, a.DRIVING_LICENSE_NUMBER AS refNo, ISNULL(NULLIF(a.DRIVER_FULL_NAME,''''),''EMP '' + CAST(a.DRIVER_EMP_ID AS VARCHAR(20))) AS title,
                a.VEHICLE_CATEGORIES_LICENSED AS subtitle, ISNULL(NULLIF(a.DRIVER_FULL_NAME,''''),''EMP '' + CAST(a.DRIVER_EMP_ID AS VARCHAR(20))) AS empName,
                dp.DEPARTMENT_NAME AS dept, NULL AS store, NULL AS camp, NULL AS amount, NULL AS currency,
                NULL AS dateFrom, NULL AS dateTo, a.DRIVING_LICENSE_EXPIRY_DATE AS expiryDate, a.CREATED_DATE AS reqDate,
                CASE WHEN UPPER(ISNULL(a.STATUS_MASTER,'''')) IN (''AC'',''ACTIVE'') THEN
                    CASE WHEN a.DRIVING_LICENSE_EXPIRY_DATE < GETDATE() THEN ''EXPIRED'' WHEN a.DRIVING_LICENSE_EXPIRY_DATE <= DATEADD(DAY,30,GETDATE()) THEN ''SOON30'' ELSE ''ACTIVE'' END
                    ELSE ''INACTIVE'' END AS st, NULL AS paid, a.PHONE_NUMBER AS extra
            FROM VMaster.TBL_DRIVER_MASTER_HDR a
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = a.DEPARTMENT_ID';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'trucks'
    BEGIN
        SET @defaultSort = 'title';
        SET @base = 'SELECT a.TRUCK_ID AS id, a.TRUCK_NO AS refNo, a.TRUCK_NO AS title, ISNULL(tt.TRUCK_TYPE_NAME,'''') AS subtitle,
                a.DRIVER_NAME AS empName, NULL AS dept, NULL AS store, NULL AS camp, a.TRUCK_CAPACITY AS amount, NULL AS currency,
                a.PURCHASE_DATE AS dateFrom, NULL AS dateTo, a.DRIVING_LICENSE_EXPIRY_DATE AS expiryDate, a.CREATED_DATE AS reqDate,
                CASE WHEN UPPER(ISNULL(a.STATUS_MASTER,'''')) IN (''AC'',''ACTIVE'') THEN
                    CASE WHEN UPPER(ISNULL(a.TRUCK_STATUS,'''')) LIKE ''%MAINTENANCE%'' OR UPPER(ISNULL(a.TRUCK_STATUS,'''')) LIKE ''%SERVICE%'' OR UPPER(ISNULL(a.TRUCK_STATUS,'''')) LIKE ''%REPAIR%'' THEN ''MAINTENANCE''
                         WHEN UPPER(ISNULL(a.TRUCK_STATUS,'''')) = ''AVAILABLE'' THEN ''AVAILABLE''
                         WHEN a.DRIVING_LICENSE_EXPIRY_DATE < GETDATE() THEN ''EXPIRED''
                         WHEN a.DRIVING_LICENSE_EXPIRY_DATE <= DATEADD(DAY,30,GETDATE()) THEN ''SOON30''
                         ELSE ''ACTIVE'' END
                    ELSE ''INACTIVE'' END AS st, a.TRUCK_STATUS AS paid, a.LATEST_INSURANCE_NO AS extra
            FROM VMaster.TBL_TRUCK_MASTER_hdr a
            LEFT JOIN VMaster.TBL_TRUCK_TYPE_MASTER tt ON tt.TRUCK_TYPE_ID = a.TRUCK_TYPE_ID';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'trailers'
    BEGIN
        SET @defaultSort = 'title';
        SET @base = 'SELECT a.TRAILER_ID AS id, a.TRAILER_NO AS refNo, a.TRAILER_NO AS title, ISNULL(tt.TRAILER_TYPE_NAME,'''') AS subtitle,
                NULL AS empName, NULL AS dept, NULL AS store, NULL AS camp, a.Goods_Capacity AS amount, NULL AS currency,
                a.PURCHASE_DATE AS dateFrom, NULL AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate,
                CASE WHEN UPPER(ISNULL(a.STATUS_MASTER,'''')) IN (''AC'',''ACTIVE'') THEN ''ACTIVE'' ELSE ''INACTIVE'' END AS st, NULL AS paid, a.LATEST_INSURANCE_NO AS extra
            FROM VMaster.TBL_TRAILER_MASTER_HDR a
            LEFT JOIN VMaster.TBL_TRAILER_TYPE_MASTER tt ON tt.TRAILER_TYPE_ID = a.TRAILER_TYPE_ID';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'contracts'
    BEGIN
        SET @defaultSort = 'title';
        SET @base = 'SELECT a.CONTRACT_TYPE_ID AS id, CAST(a.CONTRACT_TYPE_ID AS VARCHAR(20)) AS refNo, a.CONTRACT_TYPE_NAME AS title, ISNULL(a.REMARKS,'''') AS subtitle,
                NULL AS empName, NULL AS dept, NULL AS store, NULL AS camp, NULL AS amount, NULL AS currency,
                NULL AS dateFrom, NULL AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate,
                CASE WHEN UPPER(ISNULL(a.STATUS_MASTER,'''')) IN (''AC'',''ACTIVE'') THEN ''ACTIVE'' ELSE ''INACTIVE'' END AS st,
                NULL AS paid, a.REMARKS AS extra
            FROM VMaster.TBL_EMPLOYEE_CONTRACT_TYPE_MASTER a';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'overtime-requests'
    BEGIN
        SET @defaultSort = 'reqDate';
        SET @base = 'SELECT a.SNO AS id, a.OT_REQUEST_REF_NO AS refNo, ''Overtime Request'' AS title, NULL AS subtitle, ' + @EmpExpr + ' AS empName,
                dp.DEPARTMENT_NAME AS dept, st.STORE_NAME AS store, cp.CAMP_NAME AS camp, a.REQUEST_AMOUNT AS amount, cur.CURRENCY_NAME AS currency,
                a.OT_FROM_DATE AS dateFrom, a.OT_TO_DATE AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate, ' + @StExpr + ' AS st, a.PAID_STATUS AS paid, a.REASON AS extra
            FROM VREQUEST.TBL_OVERTIME_REQUEST a
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = a.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER st ON st.STORE_ID = a.STORE_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = a.CAMP_ID
            LEFT JOIN VMaster.TBL_CURRENCY_MASTER cur ON cur.CURRENCY_ID = a.CURRENCY_ID
            WHERE a.STATUS_MASTER = ''AC''';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'cash-advance-requests'
    BEGIN
        SET @defaultSort = 'reqDate';
        SET @base = 'SELECT a.SNO AS id, a.CASH_ADV_REQUEST_REF_NO AS refNo, ''Cash Advance Request'' AS title, a.ADVANCE_TYPE AS subtitle, ' + @EmpExpr + ' AS empName,
                dp.DEPARTMENT_NAME AS dept, st.STORE_NAME AS store, cp.CAMP_NAME AS camp, a.REQUEST_AMOUNT AS amount, cur.CURRENCY_NAME AS currency,
                a.DEDUCTION_FROM_DATE AS dateFrom, a.DEDUCTION_TO_DATE AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate, ' + @StExpr + ' AS st, NULL AS paid, a.REASON AS extra
            FROM VRequest.TBL_CASH_ADVANCE_REQUEST a
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = a.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER st ON st.STORE_ID = a.STORE_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = a.CAMP_ID
            LEFT JOIN VMaster.TBL_CURRENCY_MASTER cur ON cur.CURRENCY_ID = a.CURRENCY_ID
            WHERE a.STATUS_MASTER = ''AC''';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'arrears-requests'
    BEGIN
        SET @defaultSort = 'reqDate';
        SET @base = 'SELECT a.SNO AS id, a.ARREAR_REQUEST_REF_NO AS refNo, ''Arrears Request'' AS title, NULL AS subtitle, ' + @EmpExpr + ' AS empName,
                dp.DEPARTMENT_NAME AS dept, st.STORE_NAME AS store, cp.CAMP_NAME AS camp, a.REQUEST_AMOUNT AS amount, cur.CURRENCY_NAME AS currency,
                NULL AS dateFrom, NULL AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate, ' + @StExpr + ' AS st, NULL AS paid, a.REASON AS extra
            FROM VREQUEST.TBL_ARREARS_REQUEST a
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = a.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER st ON st.STORE_ID = a.STORE_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = a.CAMP_ID
            LEFT JOIN VMaster.TBL_CURRENCY_MASTER cur ON cur.CURRENCY_ID = a.CURRENCY_ID
            WHERE a.STATUS_MASTER = ''AC''';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'bonus-requests'
    BEGIN
        SET @defaultSort = 'reqDate';
        SET @base = 'SELECT a.SNO AS id, a.BONUS_REQUEST_REF_NO AS refNo, ''Bonus Request'' AS title, a.BONUS_TYPE AS subtitle, ' + @EmpExpr + ' AS empName,
                dp.DEPARTMENT_NAME AS dept, st.STORE_NAME AS store, cp.CAMP_NAME AS camp, a.REQUEST_AMOUNT AS amount, cur.CURRENCY_NAME AS currency,
                NULL AS dateFrom, NULL AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate, ' + @StExpr + ' AS st, a.PAID_STATUS AS paid, a.REASON AS extra
            FROM VRequest.TBL_BONUS_REQUEST a
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = a.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER st ON st.STORE_ID = a.STORE_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = a.CAMP_ID
            LEFT JOIN VMaster.TBL_CURRENCY_MASTER cur ON cur.CURRENCY_ID = a.CURRENCY_ID
            WHERE a.STATUS_MASTER = ''AC''';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'promotion-transfer-requests'
    BEGIN
        SET @defaultSort = 'reqDate';
        SET @base = 'SELECT a.SNO AS id, a.TRANSFER_REQUEST_REF_NO AS refNo, ''Promotion/Demotion/Transfer Request'' AS title, a.TRANSFER_TYPE AS subtitle, ' + @EmpExpr + ' AS empName,
                dp.DEPARTMENT_NAME AS dept, st.STORE_NAME AS store, cp.CAMP_NAME AS camp, a.NEW_GROSS_AMOUNT AS amount, cur.CURRENCY_NAME AS currency,
                NULL AS dateFrom, NULL AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate, ' + @StExpr + ' AS st, NULL AS paid, a.REASON AS extra
            FROM VRequest.TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST a
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = a.NEW_DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER st ON st.STORE_ID = a.NEW_STORE_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = a.NEW_CAMP_ID
            LEFT JOIN VMaster.TBL_CURRENCY_MASTER cur ON cur.CURRENCY_ID = a.CURRENCY_ID
            WHERE a.STATUS_MASTER = ''AC''';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'salary-deductions'
    BEGIN
        SET @defaultSort = 'amount';
        SET @base = 'SELECT CONVERT(BIGINT, a.M_AUTO_REF_NO) AS id, a.REQUEST_REF_NO AS refNo, ''Monthly auto deduction'' AS title, a.SALARY_DEDUCTION_TYPE AS subtitle, ' + @EmpExpr + ' AS empName,
                NULL AS dept, NULL AS store, NULL AS camp, a.TOTAL_DEDUCTION_AMOUNT AS amount, NULL AS currency,
                a.DEDUCTION_FROM_DATE AS dateFrom, a.DEDUCTION_TO_DATE AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate,
                CASE WHEN UPPER(ISNULL(a.STATUS_ENTRY,'''')) = ''CL'' THEN ''CLOSED'' ELSE UPPER(ISNULL(a.STATUS_ENTRY,'''')) END AS st, NULL AS paid,
                ''Monthly: '' + CONVERT(VARCHAR(20), ISNULL(a.MONTHLY_DEDUCTION,0)) AS extra
            FROM VPayEntries.TBL_MONTHLY_AUTO_DEDUCTION a
            WHERE UPPER(ISNULL(a.STATUS_ENTRY,'''')) <> ''CL''
            UNION ALL
            SELECT CONVERT(BIGINT, a.DED_REF_ID) AS id, a.REQUEST_REF_NO AS refNo, ''Deduction entry'' AS title, a.REQUEST_TYPE AS subtitle, ' + @EmpExpr + ' AS empName,
                NULL AS dept, NULL AS store, NULL AS camp, a.DEDUCTION_AMOUNT AS amount, NULL AS currency,
                NULL AS dateFrom, NULL AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate,
                CASE WHEN UPPER(ISNULL(a.STATUS_ENTRY,'''')) = ''CL'' THEN ''CLOSED'' ELSE UPPER(ISNULL(a.STATUS_ENTRY,'''')) END AS st, NULL AS paid, NULL AS extra
            FROM VPayEntries.TBL_DEDUCTION_ENTRIES a
            WHERE UPPER(ISNULL(a.STATUS_ENTRY,'''')) <> ''CL''';
        SET @statCond = ' 1=1 ';
    END
    ELSE IF @CardKey = 'employee-benefits'
    BEGIN
        SET @defaultSort = 'amount';
        SET @base = 'SELECT CONVERT(BIGINT, ROW_NUMBER() OVER (ORDER BY a.EMP_BENEFIT_REF_NO)) AS id, a.EMP_BENEFIT_REF_NO AS refNo, ''Employee Benefit'' AS title,
                LTRIM(RTRIM(ISNULL(a.MONTH_ENTERED,''''))) + '' '' + CONVERT(VARCHAR(4), ISNULL(a.YEAR_ENTERED,0)) AS subtitle, ' + @EmpExpr + ' AS empName,
                dp.DEPARTMENT_NAME AS dept, st.STORE_NAME AS store, cp.CAMP_NAME AS camp, a.TOTAL_GROSS_AMOUNT AS amount, cur.CURRENCY_NAME AS currency,
                a.BENEFIT_DATE AS dateFrom, NULL AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate,
                CASE WHEN UPPER(ISNULL(a.PAID_STATUS,'''')) = ''PAID'' THEN ''PAID'' ELSE ''UNPAID'' END AS st, a.PAID_STATUS AS paid, a.REASON AS extra
            FROM VPayEntries.TBL_EMPLOYEE_BENEFIT_HDR a
            LEFT JOIN VMaster.TBL_DEPARTMENT_MASTER dp ON dp.DEPARTMENT_ID = a.DEPARTMENT_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER st ON st.STORE_ID = a.STORE_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = a.CAMP_ID
            LEFT JOIN VMaster.TBL_CURRENCY_MASTER cur ON cur.CURRENCY_ID = a.CURRENCY_ID
            WHERE a.STATUS_MASTER = ''AC''';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'products'
    BEGIN
        SET @defaultSort = 'title';
        SET @base = 'SELECT a.PRODUCT_ID AS id, CAST(a.PRODUCT_ID AS VARCHAR(20)) AS refNo, a.PRODUCT_NAME AS title,
                mc.MAIN_CATEGORY_NAME AS subtitle, NULL AS empName, NULL AS dept, NULL AS store, NULL AS camp,
                a.PRODUCTION_COST AS amount, NULL AS currency, NULL AS dateFrom, NULL AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate,
                CASE WHEN UPPER(ISNULL(a.STATUS_MASTER,'''')) IN (''AC'',''ACTIVE'') THEN
                    CASE WHEN ' + @StExpr3 + ' = ''PENDING'' THEN ''PENDING'' WHEN ' + @StExpr3 + ' = ''REJECTED'' THEN ''REJECTED'' ELSE ''ACTIVE'' END
                    ELSE ''INACTIVE'' END AS st, NULL AS paid, NULL AS extra
            FROM VMaster.TBL_PRODUCT_MASTER a
            LEFT JOIN VMaster.TBL_PRODUCT_MAIN_CATEGORY_MASTER mc ON mc.MAIN_CATEGORY_ID = a.MAIN_CATEGORY_ID';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'business-partners'
    BEGIN
        SET @defaultSort = 'title';
        SET @base = 'SELECT a.BP_ID AS id, a.BP_SHORT_CODE AS refNo, a.BP_NAME AS title,
                a.BP_TYPE AS subtitle, NULL AS empName, d.DISTRICT_NAME AS dept, NULL AS store, NULL AS camp,
                NULL AS amount, NULL AS currency, NULL AS dateFrom, NULL AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate,
                CASE WHEN UPPER(ISNULL(a.STATUS_MASTER,'''')) IN (''AC'',''ACTIVE'') THEN
                    CASE WHEN ' + @StExpr + ' = ''PENDING'' THEN ''PENDING'' WHEN ' + @StExpr + ' = ''REJECTED'' THEN ''REJECTED'' ELSE ''ACTIVE'' END
                    ELSE ''INACTIVE'' END AS st, NULL AS paid, a.TIN_NUMBER AS extra
            FROM VMaster.TBL_BUSINESS_PARTNER_MASTER a
            LEFT JOIN VMaster.TBL_DISTRICT_MASTER d ON d.DISTRICT_ID = a.DISTRICT_ID';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'fuel'
    BEGIN
        SET @defaultSort = 'title';
        SET @base = 'SELECT a.FUEL_STATIONE_ID AS id, CAST(a.FUEL_STATIONE_ID AS VARCHAR(20)) AS refNo, a.FUEL_STATIONE_NAME AS title,
                d.DISTRICT_NAME AS subtitle, NULL AS empName, NULL AS dept, NULL AS store, NULL AS camp,
                NULL AS amount, NULL AS currency, NULL AS dateFrom, NULL AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate,
                CASE WHEN UPPER(ISNULL(a.STATUS_MASTER,'''')) IN (''AC'',''ACTIVE'') THEN ''ACTIVE'' ELSE ''INACTIVE'' END AS st, NULL AS paid, NULL AS extra
            FROM VMaster.TBL_FUEL_STATION_MASTER a
            LEFT JOIN VMaster.TBL_DISTRICT_MASTER d ON d.DISTRICT_ID = a.DISTRICT_ID';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'guns'
    BEGIN
        SET @defaultSort = 'title';
        SET @base = 'SELECT a.GUN_ID AS id, a.SERIAL_NUMBER AS refNo, a.GUN_NAME AS title,
                gc.GUN_CATEGORY_NAME AS subtitle, NULL AS empName, NULL AS dept, s.STORE_NAME AS store, cp.CAMP_NAME AS camp,
                a.MAGAZINE_CAPACITY AS amount, NULL AS currency, NULL AS dateFrom, NULL AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate,
                CASE WHEN UPPER(ISNULL(a.STATUS_MASTER,'''')) IN (''AC'',''ACTIVE'') THEN ''ACTIVE'' ELSE ''INACTIVE'' END AS st, NULL AS paid,
                a.LICENSE_NUMBER AS extra
            FROM VMaster.TBL_GUN_MASTER a
            LEFT JOIN VMaster.TBL_GUN_CATEGORY_MASTER gc ON gc.GUN_CATEGORY_ID = a.GUN_CATEGORY_ID
            LEFT JOIN VMaster.TBL_STORE_MASTER s ON s.STORE_ID = a.STORE_ID
            LEFT JOIN VMaster.TBL_CAMP_MASTER cp ON cp.CAMP_ID = a.CAMP_ID';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'hotels-travel'
    BEGIN
        SET @defaultSort = 'title';
        SET @base = 'SELECT CONVERT(BIGINT, ROW_NUMBER() OVER (ORDER BY r.Source)) AS id, r.Source AS refNo, r.Name AS title, r.Source AS subtitle,
                NULL AS empName, NULL AS dept, NULL AS store, NULL AS camp, r.Amount AS amount, NULL AS currency,
                NULL AS dateFrom, NULL AS dateTo, NULL AS expiryDate, NULL AS reqDate, r.st AS st, NULL AS paid, NULL AS extra
            FROM (
                SELECT ''Hotel'' AS Source, a.HOTEL_NAME AS Name, NULL AS Amount, ''ACTIVE'' AS st FROM VMaster.TBL_HOTEL_RESORT_MASTER a WHERE UPPER(ISNULL(a.STATUS_MASTER,'''')) IN (''AC'',''ACTIVE'')
                UNION ALL SELECT ''Room Type'', a.ROOM_TYPE_NAME, NULL, ''ACTIVE'' FROM VMaster.TBL_HOTEL_ROOM_TYPE_MASTER a WHERE UPPER(ISNULL(a.STATUS_MASTER,'''')) IN (''AC'',''ACTIVE'')
                UNION ALL SELECT ''Airline'', a.AIRLINE_NAME, NULL, ''ACTIVE'' FROM VMaster.TBL_AIRLINES_MASTER a WHERE UPPER(ISNULL(a.STATUS_MASTER,'''')) IN (''AC'',''ACTIVE'')
                UNION ALL SELECT ''Airport'', a.AIRPORT_NAME, NULL, ''ACTIVE'' FROM VMaster.TBL_AIRPORT_MASTER a WHERE UPPER(ISNULL(a.STATUS_MASTER,'''')) IN (''AC'',''ACTIVE'')
                UNION ALL SELECT ''Travel Price'', ISNULL(t.TRIP_TEMPLATE_NAME, CONVERT(VARCHAR(20), p.TRIP_TEMPLATE_ID)), p.TRIP_AMOUNT, ''ACTIVE'' FROM VMaster.TBL_TRIP_TEMPLATE_PRICE_MAPPING p LEFT JOIN VMaster.TBL_TRIP_TEMPLATE_MASTER t ON t.TRIP_TEMPLATE_ID = p.TRIP_TEMPLATE_ID WHERE UPPER(ISNULL(p.STATUS_MASTER,'''')) IN (''AC'',''ACTIVE'')
            ) r';
        SET @statCond = ' 1=1 ';
    END
    ELSE IF @CardKey = 'animals'
    BEGIN
        SET @defaultSort = 'title';
        SET @base = 'SELECT a.ANIMAL_ID AS id, CAST(a.ANIMAL_ID AS VARCHAR(20)) AS refNo, a.ANIMAL_NAME AS title,
                ac.ANIMAL_CATEGORY_NAME AS subtitle, NULL AS empName, NULL AS dept, NULL AS store, NULL AS camp,
                NULL AS amount, NULL AS currency, NULL AS dateFrom, NULL AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate,
                CASE WHEN UPPER(ISNULL(a.STATUS_MASTER,'''')) IN (''AC'',''ACTIVE'') THEN ''ACTIVE'' ELSE ''INACTIVE'' END AS st, NULL AS paid, NULL AS extra
            FROM VMaster.TBL_ANIMAL_MASTER a
            LEFT JOIN VMaster.TBL_ANIMAL_CATEGORY_MASTER ac ON ac.ANIMAL_CATEGORY_ID = a.ANIMAL_CATEGORY_ID';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'camps'
    BEGIN
        SET @defaultSort = 'title';
        SET @base = 'SELECT a.CAMP_ID AS id, CAST(a.CAMP_ID AS VARCHAR(20)) AS refNo, a.CAMP_NAME AS title,
                NULL AS subtitle, NULL AS empName, NULL AS dept, NULL AS store, a.CAMP_NAME AS camp,
                NULL AS amount, NULL AS currency, NULL AS dateFrom, NULL AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate,
                CASE WHEN UPPER(ISNULL(a.STATUS_MASTER,'''')) IN (''AC'',''ACTIVE'') THEN ''ACTIVE'' ELSE ''INACTIVE'' END AS st, NULL AS paid, NULL AS extra
            FROM VMaster.TBL_CAMP_MASTER a';
        SET @statCond = @StOk;
    END
    ELSE IF @CardKey = 'hotels'
    BEGIN
        SET @defaultSort = 'title';
        SET @base = 'SELECT a.HOTEL_ID AS id, CAST(a.HOTEL_ID AS VARCHAR(20)) AS refNo, a.HOTEL_NAME AS title,
                ISNULL(a.HOTEL_TYPE,'''') AS subtitle, NULL AS empName, NULL AS dept, NULL AS store, NULL AS camp,
                NULL AS amount, NULL AS currency, NULL AS dateFrom, NULL AS dateTo, NULL AS expiryDate, a.CREATED_DATE AS reqDate,
                CASE WHEN UPPER(ISNULL(a.STATUS_MASTER,'''')) IN (''AC'',''ACTIVE'') THEN ''ACTIVE'' ELSE ''INACTIVE'' END AS st, NULL AS paid, ISNULL(a.HOTEL_STAR,'''') AS extra
            FROM VMaster.TBL_HOTEL_RESORT_MASTER a';
        SET @statCond = @StOk;
    END
    ELSE
    BEGIN
        SELECT CONVERT(INT, 0) AS Total WHERE 1 = 0;
        RETURN;
    END

    DECLARE @orderCol NVARCHAR(40) = CASE LOWER(@SortBy)
        WHEN 'ref' THEN 'refNo' WHEN 'title' THEN 'title' WHEN 'emp' THEN 'empName'
        WHEN 'date' THEN 'reqDate' WHEN 'amount' THEN 'amount' WHEN 'status' THEN 'st'
        ELSE @defaultSort END;
    DECLARE @orderDir NVARCHAR(4) = CASE WHEN UPPER(@SortDir) = 'ASC' THEN 'ASC' ELSE 'DESC' END;
    DECLARE @orderSql NVARCHAR(100) = ' ORDER BY x.' + @orderCol + ' ' + @orderDir;

    DECLARE @cntSql NVARCHAR(MAX) = 'SELECT COUNT(*) AS Total FROM (' + @base + ') x WHERE ' + @statCond + @searchCond + @dateCond;
    DECLARE @listSql NVARCHAR(MAX) = 'SELECT x.id, x.refNo, x.title, x.subtitle, x.empName, x.dept, x.store, x.camp, x.amount, x.currency, x.dateFrom, x.dateTo, x.expiryDate, x.reqDate, x.st, x.paid, x.extra FROM (' + @base + ') x WHERE ' + @statCond + @searchCond + @dateCond + @orderSql +
        ' OFFSET ' + CAST(@Offset AS NVARCHAR(12)) + ' ROWS FETCH NEXT ' + CAST(@PageSize AS NVARCHAR(12)) + ' ROWS ONLY';

    DECLARE @Parm NVARCHAR(400) = N'@Status VARCHAR(30), @Search NVARCHAR(100), @FromDate DATE, @ToDate DATE';

    EXEC sp_executesql @cntSql, @Parm, @Status, @Search, @FromDate, @ToDate;
    EXEC sp_executesql @listSql, @Parm, @Status, @Search, @FromDate, @ToDate;
END
GO