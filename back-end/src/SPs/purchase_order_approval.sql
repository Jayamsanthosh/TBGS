/* ============================================================================
   Purchase Order - approval panel stored procedures
   ----------------------------------------------------------------------------
   The Purchase Order approval panel (nextjs_Approval_tbgs) speaks the same
   request-type contract the Purchase Request / Purchase Quotation panels use:

     GET_APPROVAL_LIST_PURCHASE_ORDER      -> list / detail rows (camelCase)
     UPDATE_APPROVAL_STATUS_PURCHASE_ORDER -> Section Head -> Response 1 ->
                                              Response 2 approval chain
     GET_PURCHASE_ORDER_SUMMARY            -> dashboard card counts

   The two approval procedures already existed in the database; this file is the
   repository copy so a fresh database gets exactly the same panel behaviour.

   Differences from the old database-only versions
   -----------------------------------------------
   1. Only orders actually submitted from the entry screen reach the panel. The
      old gate was STATUS_ENTRY = 'CL' alone. SUBMIT_PURCHASE_ORDER_HDR now also
      moves PURCHASE_ORDER_STATUS_ID to 3 (Pending Approval), and the gate is the
      same positive test the Purchase Request / Quotation lists use: a row is in
      the workflow when STATUS_ENTRY = 'CL' AND (the order status is one of the
      live ones OR at least one approval level has answered). A legacy row that
      an older submit proc flipped to 'CL' without touching the status still has
      answers, so it stays visible; an untouched draft fails both halves.
   2. Person NAMES are returned beside the approval EMP_IDs
      (sectionHeadPersonName / response1PersonName / response2PersonName) so the
      detail panel does not show a bare employee number.
   3. lineCount, currencyName, purchaseQuotationNo and purchaseRequestNo are
      returned so the grid and the detail panel do not need a second call.
   4. The final approval moves PURCHASE_ORDER_STATUS_ID to 4 (Approved) and a
      final rejection to 5 (Rejected). RESPONSE_2 is the terminal level, so the
      decision is also mirrored into FINAL_RESPONSE_* - everything that reads the
      old four-level final columns (reports, the "previous order is pending"
      guard) then sees a finished order.
   5. The header has NO CAMP_ID - camp is stored per order LINE
      (TBL_PURCHASE_ORDER_DTL.CAMP_ID), so it is resolved from the first line
      that has one, exactly like the entry screen and the quotation list.

   Run against the TBGS database; every batch is CREATE OR ALTER.
   ============================================================================ */

SET QUOTED_IDENTIFIER ON
GO
SET ANSI_NULLS ON
GO

/* ----------------------------------------------------------------------------
   VPurchase.GET_APPROVAL_LIST_PURCHASE_ORDER

   One row per submitted purchase order (STATUS_ENTRY = 'CL' and in the
   workflow), shaped for the approval grid and the detail panel.

   The overall state is the same non-cascading terminal rollup the Purchase
   Request and Quotation lists use:

     any level rejected       -> REJECTED
     any level held           -> HOLD      (re-actionable at that level)
     Response 2 / Final       -> APPROVED  (chain complete)
     otherwise                -> PENDING

   ARM ORDER MATTERS: REJECTED, then HOLD, then APPROVED. A legacy row can be
   RESPONSE_2=Approved AND FINAL_RESPONSE=Rejected (the old four-level ladder
   let level 4 reject after level 3 approved), and testing APPROVED first would
   report that as approved.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [VPurchase].[GET_APPROVAL_LIST_PURCHASE_ORDER]
(
    @Status       VARCHAR(50)     = 'ALL',
    @FromDate     DATE            = NULL,
    @ToDate       DATE            = NULL,
    @CompanyId    INT             = NULL,
    @StoreId      INT             = NULL,
    @CampId       INT             = NULL,
    @DepartmentId INT             = NULL,
    @Search       NVARCHAR(200)   = NULL,
    @Page         INT             = NULL,
    @PageSize     INT             = NULL
)
AS
BEGIN
    SET NOCOUNT ON

    DROP TABLE IF EXISTS #REPORT_PURCHASE_ORDER;
    ;WITH CTE AS
    (
        SELECT
            A.SNO AS sno,
            A.PURCHASE_ORDER_NO AS poRefNo,
            A.PURCHASE_ORDER_NO AS requestRefNo,
            A.PURCHASE_ORDER_NO AS refNo,
            A.PURCHASE_QUOTATION_NO AS purchaseQuotationNo,
            /* The request behind the order comes from the quotation it was
               raised against; the order header itself has no request column. */
            PQ.PURCHASE_REQUEST_NO AS purchaseRequestNo,
            A.COMPANY_ID AS companyId,
            C.COMPANY_NAME AS companyName,
            NULL AS department,
            NULL AS departmentName,
            NULL AS designation,
            NULL AS designationName,
            A.PO_STORE_ID AS poStoreId,
            PS.STORE_NAME AS storeName,
            'Purchase Order' AS purchaseType,
            A.CURRENCY_ID AS currencyType,
            CM.CURRENCY_NAME AS currencyName,
            A.FINAL_PRODUCT_HDR_AMOUNT_FC AS amount,
            A.FINAL_PRODUCT_HDR_AMOUNT_FC AS totalFinalProductionHdrAmount,
            A.TOTAL_VAT_HDR_AMOUNT_FC AS vatHdrAmount,
            A.SUPPLIER_BP_ID AS supplierId,
            BP.BP_NAME AS supplierName,
            NULL AS cell,
            A.PURCHASE_ORDER_DATE AS poDate,
            A.CREATED_BY AS requestedBy,
            A.PURCHASE_ORDER_DATE AS requestedDate,
            A.CREATED_DATE AS createdDate,
            A.STATUS_ENTRY AS statusEntry,
            CASE
                WHEN UPPER(LTRIM(RTRIM(ISNULL(A.FINAL_RESPONSE_STATUS,'')))) IN ('REJECT','REJECTED')
                 OR  UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_2_STATUS,'')))) IN ('REJECT','REJECTED')
                 OR  UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_1_STATUS,'')))) IN ('REJECT','REJECTED')
                 OR  UPPER(LTRIM(RTRIM(ISNULL(A.SECTION_HEAD_RESPONSE_STATUS,'')))) IN ('REJECT','REJECTED')
                    THEN 'REJECTED'
                WHEN UPPER(LTRIM(RTRIM(ISNULL(A.FINAL_RESPONSE_STATUS,'')))) = 'HOLD'
                 OR  UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_2_STATUS,'')))) = 'HOLD'
                 OR  UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_1_STATUS,'')))) = 'HOLD'
                 OR  UPPER(LTRIM(RTRIM(ISNULL(A.SECTION_HEAD_RESPONSE_STATUS,'')))) = 'HOLD'
                    THEN 'HOLD'
                WHEN UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_2_STATUS,'')))) IN ('APPROVAL','APPROVED')
                  OR UPPER(LTRIM(RTRIM(ISNULL(A.FINAL_RESPONSE_STATUS,'')))) IN ('APPROVAL','APPROVED')
                    THEN 'APPROVED'
                ELSE 'PENDING'
            END AS finalResponseStatus,
            -- How many of the three levels are approved (0..3), for the grid.
            (SELECT COUNT(*) FROM (SELECT 1 AS x
                WHERE UPPER(LTRIM(RTRIM(ISNULL(A.SECTION_HEAD_RESPONSE_STATUS,'')))) IN ('APPROVAL','APPROVED')
                UNION ALL SELECT 1 WHERE UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_1_STATUS,'')))) IN ('APPROVAL','APPROVED')
                UNION ALL SELECT 1 WHERE UPPER(LTRIM(RTRIM(ISNULL(A.RESPONSE_2_STATUS,'')))) IN ('APPROVAL','APPROVED')
             ) AS lvl) AS approvedLevels,
            -- Number of order lines, so the grid can show it without a second call.
            (SELECT COUNT(1)
               FROM [VPurchase].[TBL_PURCHASE_ORDER_DTL] DTL
              WHERE DTL.PURCHASE_ORDER_NO = A.PURCHASE_ORDER_NO) AS lineCount,
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
            LTRIM(RTRIM(REPLACE(ISNULL(ESH.FIRST_NAME,'') + ' ' + ISNULL(ESH.MIDDLE_NAME,'') + ' ' + ISNULL(ESH.LAST_NAME,''), '  ', ' '))) AS sectionHeadPersonName,
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
            LTRIM(RTRIM(REPLACE(ISNULL(ER1.FIRST_NAME,'') + ' ' + ISNULL(ER1.MIDDLE_NAME,'') + ' ' + ISNULL(ER1.LAST_NAME,''), '  ', ' '))) AS response1PersonName,
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
            LTRIM(RTRIM(REPLACE(ISNULL(ER2.FIRST_NAME,'') + ' ' + ISNULL(ER2.MIDDLE_NAME,'') + ' ' + ISNULL(ER2.LAST_NAME,''), '  ', ' '))) AS response2PersonName,
            A.RESPONSE_2_DATE AS response2Date,
            -- The finalResponse* aliases carry the Response 2 level, which is the
            -- terminal level of the chain. Names are kept for existing consumers.
            A.RESPONSE_2_REMARKS AS finalResponseRemarks,
            CAST(A.RESPONSE_2_EMP_ID AS VARCHAR(20)) AS finalResponsePerson,
            A.RESPONSE_2_DATE AS finalResponseDate,
            -- Raw UPPERCASE approval columns: the backend re-derives the cascade
            -- from these (the mapped camelCase values collapse HOLD/PENDING to '').
            A.SECTION_HEAD_RESPONSE_STATUS AS SECTION_HEAD_RESPONSE_STATUS,
            A.RESPONSE_1_STATUS AS RESPONSE_1_STATUS,
            A.RESPONSE_2_STATUS AS RESPONSE_2_STATUS,
            A.FINAL_RESPONSE_STATUS AS FINAL_RESPONSE_STATUS,
            A.CREATED_BY AS createdBy,
            A.SHIPMENT_REMARKS AS reason,
            A.REMARKS AS remarks,
            A.DELIVERY_DATE AS requiredDate,
            'Order' AS requestTypeName,
            A.BRANCH_ID AS branchId,
            BR.BRANCH_NAME AS branchName,
            CL.CAMP_ID AS campId,
            CP.CAMP_NAME AS campName,
            A.DELIVERY_LOCATION_ID AS deliveryLocationId,
            DL.LOCATION_NAME AS deliveryLocationName,
            A.PO_STORE_ID AS requestStoreId,
            PS.STORE_NAME AS requestStoreName,
            CAST(NULL AS VARCHAR(20)) AS empId
        FROM [VPurchase].[TBL_PURCHASE_ORDER_HDR] A
        LEFT JOIN VMaster.TBL_COMPANY_MASTER C ON C.COMPANY_ID = A.COMPANY_ID
        LEFT JOIN VMaster.TBL_STORE_MASTER PS ON PS.STORE_ID = A.PO_STORE_ID
        LEFT JOIN VMaster.TBL_BRANCH_MASTER BR ON BR.BRANCH_ID = A.BRANCH_ID
        LEFT JOIN VMaster.TBL_CURRENCY_MASTER CM ON CM.CURRENCY_ID = A.CURRENCY_ID
        /* The quotation behind the order supplies the request number and the
           request-level reference the panel shows. */
        LEFT JOIN [VPurchase].[TBL_PURCHASE_QUOTATION_HDR] PQ ON PQ.PURCHASE_QUOTATION_NO = A.PURCHASE_QUOTATION_NO
        /* TBL_PURCHASE_ORDER_HDR has no CAMP_ID - camp is stored per order LINE
           (TBL_PURCHASE_ORDER_DTL.CAMP_ID), the same place the entry screen
           reads it from. So resolve it from the first line that has one. */
        OUTER APPLY (
            SELECT TOP 1 D.CAMP_ID
            FROM [VPurchase].[TBL_PURCHASE_ORDER_DTL] D
            WHERE D.PURCHASE_ORDER_NO = A.PURCHASE_ORDER_NO
              AND D.CAMP_ID IS NOT NULL
            ORDER BY D.LINE_NO
        ) CL
        LEFT JOIN VMaster.TBL_CAMP_MASTER CP ON CP.CAMP_ID = CL.CAMP_ID
        LEFT JOIN VMaster.TBL_BUSINESS_PARTNER_MASTER BP ON BP.BP_ID = A.SUPPLIER_BP_ID
        LEFT JOIN VMaster.TBL_LOCATION_MASTER DL ON DL.LOCATION_ID = A.DELIVERY_LOCATION_ID
        LEFT JOIN VPayEntries.NEW_EMPLOYEE_DATABASE ESH ON ESH.EMP_ID = A.SECTION_HEAD_RESPONSE_PERSON_EMP_ID
        LEFT JOIN VPayEntries.NEW_EMPLOYEE_DATABASE ER1 ON ER1.EMP_ID = A.RESPONSE_1_EMP_ID
        LEFT JOIN VPayEntries.NEW_EMPLOYEE_DATABASE ER2 ON ER2.EMP_ID = A.RESPONSE_2_EMP_ID
        -- Only submitted orders reach the approval panel, and the submit button
        -- on the entry screen is the only thing that marks an order as
        -- submitted: VPurchase.SUBMIT_PURCHASE_ORDER_HDR moves STATUS_ENTRY to
        -- 'CL' *and* PURCHASE_ORDER_STATUS_ID to Pending Approval in one call.
        --
        -- The gate is therefore written as a positive test - "is this row in the
        -- workflow?" - rather than "CL and not a draft". A row has entered the
        -- workflow when its order status is one of the live ones (Pending /
        -- Approved / Rejected / Cancelled / Closed) or when at least one level
        -- has actually answered. A legacy row that an older submit proc flipped
        -- to 'CL' without touching PURCHASE_ORDER_STATUS_ID stays on Draft and
        -- has no answers, so it fails both halves and is excluded.
        WHERE UPPER(LTRIM(RTRIM(ISNULL(A.STATUS_ENTRY,'')))) = 'CL'
          AND (
                ISNULL(A.PURCHASE_ORDER_STATUS_ID, 0) IN (3, 4, 5, 6, 7)
             OR LTRIM(RTRIM(ISNULL(A.SECTION_HEAD_RESPONSE_STATUS,''))) <> ''
             OR LTRIM(RTRIM(ISNULL(A.RESPONSE_1_STATUS,'')))            <> ''
             OR LTRIM(RTRIM(ISNULL(A.RESPONSE_2_STATUS,'')))            <> ''
             OR LTRIM(RTRIM(ISNULL(A.FINAL_RESPONSE_STATUS,'')))        <> ''
          )
          AND (@FromDate IS NULL OR CONVERT(date, A.PURCHASE_ORDER_DATE) >= @FromDate)
          AND (@ToDate IS NULL OR CONVERT(date, A.PURCHASE_ORDER_DATE) <= @ToDate)
          AND (@CompanyId IS NULL OR A.COMPANY_ID = @CompanyId)
          AND (@StoreId IS NULL OR A.PO_STORE_ID = @StoreId)
          AND (@CampId IS NULL OR CL.CAMP_ID = @CampId)
    )
    SELECT * INTO #REPORT_PURCHASE_ORDER
    FROM CTE
    WHERE (@Status = 'ALL' OR finalResponseStatus = UPPER(LTRIM(RTRIM(@Status))))
      AND (@Search IS NULL OR CONCAT(
            ISNULL(CAST(sno AS VARCHAR(20)), ''), ' ',
            ISNULL(refNo, ''), ' ',
            ISNULL(purchaseQuotationNo, ''), ' ',
            ISNULL(purchaseRequestNo, ''), ' ',
            ISNULL(requestedBy, ''), ' ',
            ISNULL(companyName, ''), ' ',
            ISNULL(storeName, ''), ' ',
            ISNULL(campName, ''), ' ',
            ISNULL(supplierName, ''), ' ',
            ISNULL(reason, '')
      ) LIKE '%' + @Search + '%');

    IF @Page IS NOT NULL AND @PageSize IS NOT NULL
    BEGIN
        SELECT COUNT(*) AS Total FROM #REPORT_PURCHASE_ORDER;
        SELECT * FROM #REPORT_PURCHASE_ORDER
        ORDER BY sno DESC
        OFFSET (@Page - 1) * @PageSize ROWS
        FETCH NEXT @PageSize ROWS ONLY;
    END
    ELSE
    BEGIN
        SELECT * FROM #REPORT_PURCHASE_ORDER ORDER BY sno DESC;
    END
    DROP TABLE IF EXISTS #REPORT_PURCHASE_ORDER;
END
GO

/* ----------------------------------------------------------------------------
   VPurchase.UPDATE_APPROVAL_STATUS_PURCHASE_ORDER

   Sequential chain: Section Head -> Response 1 -> Response 2 (final).
   A level that is PENDING or HOLD can be actioned; a HELD level is therefore
   re-actionable at the same level. Once the chain is terminal nothing is
   actionable (the backend pre-validates the whole batch with the same rules).

   The final level also moves the order's own status:
     Approved -> PURCHASE_ORDER_STATUS_ID 4 (Approved)
     Rejected -> PURCHASE_ORDER_STATUS_ID 5 (Rejected)
     Hold     -> left on 3 (Pending Approval), the level stays re-actionable
   and mirrors the decision into FINAL_RESPONSE_*, because Response Two IS the
   final response. Leaving FINAL_RESPONSE_* dormant made anything reading it
   (reports, and the "previous order is pending" guard in
   SAVE_PURCHASE_ORDER_HDR) treat a finished order as still unfinished.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [VPurchase].[UPDATE_APPROVAL_STATUS_PURCHASE_ORDER]
(
    @RequestID      INT,
    @Status         VARCHAR(50),
    @UpdatedBy      VARCHAR(50),
    @HoldReason     VARCHAR(1000) = NULL,
    -- Approver's EMP_ID and IP, supplied by the API from the access token and
    -- the request. @UpdatedBy is the LOGIN NAME, which is not numeric, so it
    -- can never yield an EMP_ID on its own.
    @UpdatedByEmpId INT = NULL,
    @ApproverIp     VARCHAR(50) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    SET @Status = LTRIM(RTRIM(@Status));
    SET @Status = CASE UPPER(@Status)
                    WHEN 'APPROVED'  THEN 'Approved'
                    WHEN 'APPROVAL'  THEN 'Approved'
                    WHEN 'REJECTED'  THEN 'Rejected'
                    WHEN 'REJECT'    THEN 'Rejected'
                    WHEN 'HOLD'      THEN 'Hold'
                    ELSE @Status
                  END;

    -- Person columns are INT (EMP_ID based) with an FK to
    -- VPayEntries.NEW_EMPLOYEE_DATABASE. The token's emp id wins; the
    -- FK-guarded fallback only accepts a numeric @UpdatedBy that really
    -- exists, so an arbitrary number can never break the whole approval.
    DECLARE @PersonEmpId INT = COALESCE(
        @UpdatedByEmpId,
        (
            SELECT TOP 1 TRY_CONVERT(INT, @UpdatedBy)
            FROM [VPayEntries].[NEW_EMPLOYEE_DATABASE]
            WHERE TRY_CONVERT(INT, @UpdatedBy) IS NOT NULL
              AND EMP_ID = TRY_CONVERT(INT, @UpdatedBy)
        )
    );

    IF @Status = 'Hold' AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) = ''
    BEGIN
        SELECT 'error' AS STATUS, 'Hold Reason is mandatory when status is Hold' AS MESSAGE, '' AS DATA;
        RETURN;
    END

    IF @Status NOT IN ('Approved', 'Rejected', 'Hold')
    BEGIN
        SELECT 'error' AS STATUS,
               'Invalid Status. Allowed values: Approved, Rejected, Hold' AS MESSAGE,
               '' AS DATA;
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1 FROM [VPurchase].[TBL_PURCHASE_ORDER_HDR]
            WHERE SNO = @RequestID
        )
        BEGIN
            SELECT 'error' AS STATUS, 'Purchase Order not found' AS MESSAGE, '' AS DATA;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Only submitted orders are in the approval workflow.
        IF NOT EXISTS (
            SELECT 1 FROM [VPurchase].[TBL_PURCHASE_ORDER_HDR]
            WHERE SNO = @RequestID
              AND UPPER(LTRIM(RTRIM(ISNULL(STATUS_ENTRY,'')))) = 'CL'
        )
        BEGIN
            SELECT 'error' AS STATUS,
                   'Purchase Order has not been submitted for approval' AS MESSAGE,
                   '' AS DATA;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        DECLARE @SecHeadStatusN  VARCHAR(50),
                @Resp1StatusN    VARCHAR(50),
                @Resp2StatusN    VARCHAR(50);

        SELECT
            @SecHeadStatusN = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)), ''), 'PENDING')),
            @Resp1StatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),             ''), 'PENDING')),
            @Resp2StatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),             ''), 'PENDING'))
        FROM [VPurchase].[TBL_PURCHASE_ORDER_HDR]
        WHERE SNO = @RequestID;

        /* ---------------- LEVEL 1: Section Head ---------------- */
        IF @SecHeadStatusN IN ('PENDING', 'HOLD')
        BEGIN
            UPDATE [VPurchase].[TBL_PURCHASE_ORDER_HDR]
            SET
                SECTION_HEAD_RESPONSE_STATUS        = @Status,
                SECTION_HEAD_RESPONSE_REMARKS       = CASE WHEN LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> '' THEN @HoldReason ELSE SECTION_HEAD_RESPONSE_REMARKS END,
                SECTION_HEAD_RESPONSE_DATE          = GETDATE(),
                SECTION_HEAD_RESPONSE_PERSON_EMP_ID = @PersonEmpId,
                SECTION_HEAD_RESPONSE_IP_ADDRESS    = @ApproverIp,
                MODIFIED_BY                         = @UpdatedBy,
                MODIFIED_DATE                       = GETDATE()
            WHERE SNO = @RequestID;
        END
        /* ---------------- LEVEL 2: Response 1 ---------------- */
        ELSE IF @SecHeadStatusN = 'APPROVED' AND @Resp1StatusN IN ('PENDING', 'HOLD')
        BEGIN
            UPDATE [VPurchase].[TBL_PURCHASE_ORDER_HDR]
            SET
                RESPONSE_1_STATUS      = @Status,
                RESPONSE_1_REMARKS     = CASE WHEN LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> '' THEN @HoldReason ELSE RESPONSE_1_REMARKS END,
                RESPONSE_1_DATE        = GETDATE(),
                RESPONSE_1_EMP_ID      = @PersonEmpId,
                RESPONSE_1_IP_ADDRESS  = @ApproverIp,
                MODIFIED_BY            = @UpdatedBy,
                MODIFIED_DATE          = GETDATE()
            WHERE SNO = @RequestID;
        END
        /* ---------------- LEVEL 3: Response 2 - FINAL LEVEL ----------------
         *
         * Last branch on purpose. The chain runs Section Head -> Response One
         * -> Response Two, and RESPONSE_2 is the final response, so an action
         * here completes the order. There is deliberately no fourth branch; a
         * completed order falls through to the ELSE below.
         */
        ELSE IF @Resp1StatusN = 'APPROVED' AND @Resp2StatusN IN ('PENDING', 'HOLD')
        BEGIN
            UPDATE [VPurchase].[TBL_PURCHASE_ORDER_HDR]
            SET
                RESPONSE_2_STATUS      = @Status,
                RESPONSE_2_REMARKS     = CASE WHEN LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> '' THEN @HoldReason ELSE RESPONSE_2_REMARKS END,
                RESPONSE_2_DATE        = GETDATE(),
                RESPONSE_2_EMP_ID      = @PersonEmpId,
                RESPONSE_2_IP_ADDRESS  = @ApproverIp,
                -- Response Two is the FINAL level, so this decision is also the
                -- final response.
                FINAL_RESPONSE_STATUS      = @Status,
                FINAL_RESPONSE_REMARKS     = CASE WHEN LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> '' THEN @HoldReason ELSE FINAL_RESPONSE_REMARKS END,
                FINAL_RESPONSE_DATE        = GETDATE(),
                FINAL_RESPONSE_EMP_ID      = @PersonEmpId,
                FINAL_RESPONSE_IP_ADDRESS  = @ApproverIp,
                -- The order lifecycle follows the final decision. A Hold leaves
                -- the order Pending Approval so the level stays re-actionable.
                PURCHASE_ORDER_STATUS_ID   = CASE
                                                WHEN @Status = 'Approved' THEN 4
                                                WHEN @Status = 'Rejected' THEN 5
                                                ELSE PURCHASE_ORDER_STATUS_ID
                                             END,
                MODIFIED_BY                = @UpdatedBy,
                MODIFIED_DATE              = GETDATE()
            WHERE SNO = @RequestID;
        END
        ELSE
        BEGIN
            SELECT 'error' AS STATUS,
                   'No pending approval level found. The order may already be fully approved/rejected at every level.' AS MESSAGE,
                   CONCAT('SecHead=', @SecHeadStatusN, ' Resp1=', @Resp1StatusN, ' Resp2=', @Resp2StatusN) AS DATA;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        COMMIT TRANSACTION;
        SELECT '' AS STATUS, 'Status updated successfully' AS MESSAGE, CAST(@RequestID AS VARCHAR(20)) AS DATA;
    END TRY
    BEGIN CATCH
        DECLARE @msg VARCHAR(MAX) = '';
        SET @msg = 'ERROR: ' + ERROR_MESSAGE() + ' at '
                    + COALESCE(ERROR_PROCEDURE(), '')
                    + COALESCE(' line:' + CONVERT(VARCHAR(30), ERROR_LINE()), '');
        ROLLBACK TRANSACTION;
        RAISERROR (@msg, 16, 1) WITH NOWAIT;
    END CATCH
END
GO

/* ----------------------------------------------------------------------------
   VRequest.GET_PURCHASE_ORDER_SUMMARY

   One dashboard-card row for the Purchase Order panel. Counts use the exact same
   terminal-only rollup and submitted gate as the list procedure, so the number
   on the card always matches the rows the grid shows for that status.

   Kept as its own procedure (rather than a new UNION block inside
   GET_REQUEST_SUMMARY) so the existing request types are never rewritten just
   to add one card.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [VRequest].[GET_PURCHASE_ORDER_SUMMARY]
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH STATE AS
    (
        SELECT
            CASE
                WHEN UPPER(LTRIM(RTRIM(ISNULL(FINAL_RESPONSE_STATUS,'')))) IN ('REJECT','REJECTED')
                 OR  UPPER(LTRIM(RTRIM(ISNULL(RESPONSE_2_STATUS,'')))) IN ('REJECT','REJECTED')
                 OR  UPPER(LTRIM(RTRIM(ISNULL(RESPONSE_1_STATUS,'')))) IN ('REJECT','REJECTED')
                 OR  UPPER(LTRIM(RTRIM(ISNULL(SECTION_HEAD_RESPONSE_STATUS,'')))) IN ('REJECT','REJECTED')
                    THEN 'REJECTED'
                WHEN UPPER(LTRIM(RTRIM(ISNULL(FINAL_RESPONSE_STATUS,'')))) = 'HOLD'
                 OR  UPPER(LTRIM(RTRIM(ISNULL(RESPONSE_2_STATUS,'')))) = 'HOLD'
                 OR  UPPER(LTRIM(RTRIM(ISNULL(RESPONSE_1_STATUS,'')))) = 'HOLD'
                 OR  UPPER(LTRIM(RTRIM(ISNULL(SECTION_HEAD_RESPONSE_STATUS,'')))) = 'HOLD'
                    THEN 'HOLD'
                WHEN UPPER(LTRIM(RTRIM(ISNULL(RESPONSE_2_STATUS,'')))) IN ('APPROVAL','APPROVED')
                  OR UPPER(LTRIM(RTRIM(ISNULL(FINAL_RESPONSE_STATUS,'')))) IN ('APPROVAL','APPROVED')
                    THEN 'APPROVED'
                ELSE 'PENDING'
            END AS finalResponseStatus
        FROM [VPurchase].[TBL_PURCHASE_ORDER_HDR]
        -- Same submitted gate as the list procedure: a row counts only once the
        -- entry screen submitted it (live order status, or a level answered).
        WHERE UPPER(LTRIM(RTRIM(ISNULL(STATUS_ENTRY,'')))) = 'CL'
          AND (
                ISNULL(PURCHASE_ORDER_STATUS_ID, 0) IN (3, 4, 5, 6, 7)
             OR LTRIM(RTRIM(ISNULL(SECTION_HEAD_RESPONSE_STATUS,''))) <> ''
             OR LTRIM(RTRIM(ISNULL(RESPONSE_1_STATUS,'')))            <> ''
             OR LTRIM(RTRIM(ISNULL(RESPONSE_2_STATUS,'')))            <> ''
             OR LTRIM(RTRIM(ISNULL(FINAL_RESPONSE_STATUS,'')))        <> ''
          )
    )
    SELECT
        'Purchase Order' AS CardName,
        SUM(CASE WHEN finalResponseStatus = 'PENDING'  THEN 1 ELSE 0 END) AS PendingCount,
        SUM(CASE WHEN finalResponseStatus = 'APPROVED' THEN 1 ELSE 0 END) AS ApprovedCount,
        SUM(CASE WHEN finalResponseStatus = 'HOLD'     THEN 1 ELSE 0 END) AS HoldCount,
        SUM(CASE WHEN finalResponseStatus = 'REJECTED' THEN 1 ELSE 0 END) AS RejectedCount
    FROM STATE;
END
GO
