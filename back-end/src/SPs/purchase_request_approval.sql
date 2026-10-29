/* ============================================================================
   Purchase Request - approval panel stored procedures
   ----------------------------------------------------------------------------
   The Purchase Request approval panel (nextjs_Approval_tbgs) is driven by the
   SAME request-type contract the HR request types already use:

     GET_APPROVAL_LIST_PURCHASE_REQUEST      -> list / detail rows (camelCase)
     UPDATE_APPROVAL_STATUS_PURCHASE_REQUEST -> Section Head -> Response 1 ->
                                                Response 2 approval chain
     GET_PURCHASE_REQUEST_SUMMARY            -> dashboard card counts

   These procedures used to exist only in the database. Keeping them in the
   repository (and in SP_FILES) means a fresh database, or one rebuilt by hand,
   gets exactly the same panel behaviour.

   Differences from the old database-only versions
   -----------------------------------------------
   1. Person NAMES are returned beside the approval EMP_IDs (sectionHeadPersonName
      / response1PersonName / response2PersonName) so the detail panel does not
      show a bare employee number.
   2. lineCount is returned so the grid can show how many request lines a PR has
      without downloading them.
   3. A terminal outcome is mirrored into FINAL_RESPONSE_* and STATUS_ID:
        - a rejection at ANY level  -> FINAL_RESPONSE_STATUS / STATUS_ID = Rejected
        - an approval at the FINAL level (Response 2) -> Approved
      The entry screen's "Final Status" and "Status" columns read exactly those
      two columns, so the requester's grid agrees with the approver's decision.
      A Hold is deliberately NOT mirrored: it is re-actionable at the same level,
      and a stale Hold in FINAL_RESPONSE_* would win over a later approval.
   4. Accepting/Rejecting still writes the per-level columns and the audit
      columns only - the whole four-level history is never overwritten.

   Run against the TBGS database; every batch is CREATE OR ALTER.
   ============================================================================ */

SET QUOTED_IDENTIFIER ON
GO
SET ANSI_NULLS ON
GO

/* ----------------------------------------------------------------------------
   VPurchase.GET_APPROVAL_LIST_PURCHASE_REQUEST

   One row per submitted purchase request (STATUS_ENTRY = 'CL'), shaped for the
   approval grid and the detail panel.

   The overall state is deliberately NOT the "deepest answered level" rollup the
   HR types use. The panel shows Approve/Reject/Hold while the status is not
   terminal, so a cascading rollup would report APPROVED as soon as the Section
   Head approved and hide the buttons with two levels still to go.

     any level rejected       -> REJECTED
     any level held           -> HOLD      (re-actionable at that level)
     Response 2 / Final       -> APPROVED  (chain complete)
     otherwise                -> PENDING
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [VPurchase].[GET_APPROVAL_LIST_PURCHASE_REQUEST]
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

    DROP TABLE IF EXISTS #REPORT_PURCHASE_REQUEST;
    ;WITH CTE AS
    (
        SELECT
            A.SNO AS sno,
            A.PURCHASE_REQUEST_NO AS poRefNo,
            A.PURCHASE_REQUEST_NO AS requestRefNo,
            A.PURCHASE_REQUEST_NO AS refNo,
            A.COMPANY_ID AS companyId,
            C.COMPANY_NAME AS companyName,
            NULL AS department,
            NULL AS departmentName,
            NULL AS designation,
            NULL AS designationName,
            A.PO_STORE_ID AS poStoreId,
            PS.STORE_NAME AS storeName,
            RT.REQUEST_TYPE_NAME AS purchaseType,
            NULL AS currencyType,
            NULL AS amount,
            NULL AS totalFinalProductionHdrAmount,
            NULL AS vatHdrAmount,
            NULL AS supplierId,
            NULL AS supplierName,
            NULL AS cell,
            A.PURCHASE_REQUEST_DATE AS poDate,
            A.REQUESTED_BY_NAME AS requestedByName,
            CASE
                WHEN LTRIM(RTRIM(ISNULL(A.REQUESTED_BY_NAME,''))) <> ''
                    THEN LTRIM(RTRIM(A.REQUESTED_BY_NAME))
                WHEN LTRIM(RTRIM(ISNULL(E.FIRST_NAME,'') + ' ' + ISNULL(E.MIDDLE_NAME,'') + ' ' + ISNULL(E.LAST_NAME,''))) <> ''
                    THEN LTRIM(RTRIM(REPLACE(ISNULL(E.FIRST_NAME,'') + ' ' + ISNULL(E.MIDDLE_NAME,'') + ' ' + ISNULL(E.LAST_NAME,''), '  ', ' ')))
                WHEN LTRIM(RTRIM(ISNULL(A.CREATED_BY,''))) <> ''
                    THEN LTRIM(RTRIM(A.CREATED_BY))
                WHEN A.REQUESTED_BY_EMP_ID IS NOT NULL
                    THEN 'EMP ' + CAST(A.REQUESTED_BY_EMP_ID AS VARCHAR(20))
                ELSE ''
            END AS requestedBy,
            A.PURCHASE_REQUEST_DATE AS requestedDate,
            A.CREATED_DATE AS createdDate,
            A.STATUS_ENTRY AS statusEntry,
            -- Terminal-only rollup (see header comment).
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
            -- Number of request lines, so the grid can show it without a second call.
            (SELECT COUNT(1)
               FROM [VPurchase].[TBL_PURCHASE_REQUEST_DTL] DTL
              WHERE DTL.PURCHASE_REQUEST_NO = A.PURCHASE_REQUEST_NO) AS lineCount,
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
            A.REASON AS reason,
            A.REMARKS AS remarks,
            A.REQUIRED_DATE AS requiredDate,
            RT.REQUEST_TYPE_NAME AS requestTypeName,
            PR.PRIORITY_NAME AS priorityName,
            A.BRANCH_ID AS branchId,
            BR.BRANCH_NAME AS branchName,
            A.CAMP_ID AS campId,
            CP.CAMP_NAME AS campName,
            A.REQUEST_STORE_ID AS requestStoreId,
            RS.STORE_NAME AS requestStoreName,
            A.DELIVERY_LOCATION_ID AS deliveryLocationId,
            DL.LOCATION_NAME AS deliveryLocationName,
            CAST(A.REQUESTED_BY_EMP_ID AS VARCHAR(20)) AS empId
        FROM [VPurchase].[TBL_PURCHASE_REQUEST_HDR] A
        LEFT JOIN VMaster.TBL_COMPANY_MASTER C ON C.COMPANY_ID = A.COMPANY_ID
        LEFT JOIN VMaster.TBL_STORE_MASTER PS ON PS.STORE_ID = A.PO_STORE_ID
        LEFT JOIN VMaster.TBL_STORE_MASTER RS ON RS.STORE_ID = A.REQUEST_STORE_ID
        LEFT JOIN VMaster.TBL_BRANCH_MASTER BR ON BR.BRANCH_ID = A.BRANCH_ID
        LEFT JOIN VMaster.TBL_CAMP_MASTER CP ON CP.CAMP_ID = A.CAMP_ID
        LEFT JOIN VMaster.TBL_PURCHASE_REQUEST_TYPE_MASTER RT ON RT.REQUEST_TYPE_ID = A.REQUEST_TYPE_ID
        LEFT JOIN VMaster.TBL_PRIORITY_MASTER PR ON PR.PRIORITY_ID = A.PRIORITY_ID
        LEFT JOIN VMaster.TBL_LOCATION_MASTER DL ON DL.LOCATION_ID = A.DELIVERY_LOCATION_ID
        LEFT JOIN VPayEntries.NEW_EMPLOYEE_DATABASE E ON E.EMP_ID = A.REQUESTED_BY_EMP_ID
        LEFT JOIN VPayEntries.NEW_EMPLOYEE_DATABASE ESH ON ESH.EMP_ID = A.SECTION_HEAD_RESPONSE_PERSON_EMP_ID
        LEFT JOIN VPayEntries.NEW_EMPLOYEE_DATABASE ER1 ON ER1.EMP_ID = A.RESPONSE_1_EMP_ID
        LEFT JOIN VPayEntries.NEW_EMPLOYEE_DATABASE ER2 ON ER2.EMP_ID = A.RESPONSE_2_EMP_ID
        -- Only submitted requests reach the approval panel, and the submit
        -- button on the entry screen is the only thing that marks a request as
        -- submitted: it moves STATUS_ENTRY to 'CL' *and* STATUS_ID to Pending
        -- Approval in the same procedure (SUBMIT_PURCHASE_REQUEST).
        --
        -- The gate is therefore written as a positive test - "is this row in the
        -- workflow?" - rather than the previous "CL but not a DRAFT" blacklist.
        -- A row has entered the workflow when its status id is one of the live
        -- ones (Pending / Approved / Rejected / Cancelled / Closed) or when at
        -- least one level has actually answered. Legacy rows that an older
        -- submit proc flipped to 'CL' without touching STATUS_ID stay on DRAFT
        -- and have no answers, so they fail both halves and are excluded.
        WHERE UPPER(LTRIM(RTRIM(ISNULL(A.STATUS_ENTRY,'')))) = 'CL'
          AND (
                ISNULL(A.STATUS_ID, 0) IN (3, 4, 5, 6, 7)
             OR LTRIM(RTRIM(ISNULL(A.SECTION_HEAD_RESPONSE_STATUS,''))) <> ''
             OR LTRIM(RTRIM(ISNULL(A.RESPONSE_1_STATUS,'')))            <> ''
             OR LTRIM(RTRIM(ISNULL(A.RESPONSE_2_STATUS,'')))            <> ''
             OR LTRIM(RTRIM(ISNULL(A.FINAL_RESPONSE_STATUS,'')))        <> ''
          )
          AND (@FromDate IS NULL OR CONVERT(date, A.PURCHASE_REQUEST_DATE) >= @FromDate)
          AND (@ToDate IS NULL OR CONVERT(date, A.PURCHASE_REQUEST_DATE) <= @ToDate)
          AND (@CompanyId IS NULL OR A.COMPANY_ID = @CompanyId)
          AND (@StoreId IS NULL OR A.PO_STORE_ID = @StoreId)
          AND (@CampId IS NULL OR A.CAMP_ID = @CampId)
    )
    SELECT * INTO #REPORT_PURCHASE_REQUEST
    FROM CTE
    WHERE (@Status = 'ALL' OR finalResponseStatus = UPPER(LTRIM(RTRIM(@Status))))
      AND (@Search IS NULL OR CONCAT(
            ISNULL(CAST(sno AS VARCHAR(20)), ''), ' ',
            ISNULL(refNo, ''), ' ',
            ISNULL(requestedBy, ''), ' ',
            ISNULL(companyName, ''), ' ',
            ISNULL(storeName, ''), ' ',
            ISNULL(campName, ''), ' ',
            ISNULL(requestTypeName, ''), ' ',
            ISNULL(priorityName, ''), ' ',
            ISNULL(reason, '')
      ) LIKE '%' + @Search + '%');

    IF @Page IS NOT NULL AND @PageSize IS NOT NULL
    BEGIN
        SELECT COUNT(*) AS Total FROM #REPORT_PURCHASE_REQUEST;
        SELECT * FROM #REPORT_PURCHASE_REQUEST
        ORDER BY sno DESC
        OFFSET (@Page - 1) * @PageSize ROWS
        FETCH NEXT @PageSize ROWS ONLY;
    END
    ELSE
    BEGIN
        SELECT * FROM #REPORT_PURCHASE_REQUEST ORDER BY sno DESC;
    END
    DROP TABLE IF EXISTS #REPORT_PURCHASE_REQUEST;
END
GO

/* ----------------------------------------------------------------------------
   VPurchase.UPDATE_APPROVAL_STATUS_PURCHASE_REQUEST

   Sequential chain: Section Head -> Response 1 -> Response 2 (final).
   A level that is PENDING or HOLD can be actioned; a HELD level is therefore
   re-actionable at the same level. Once the chain is terminal nothing is
   actionable (the backend pre-validates the whole batch with the same rules).

   All-or-nothing: the level write, the terminal mirror, and the STATUS_ID sync
   run inside one transaction, so a failure leaves the request untouched.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [VPurchase].[UPDATE_APPROVAL_STATUS_PURCHASE_REQUEST]
(
    @RequestID      INT,
    @Status         VARCHAR(50),
    @UpdatedBy      VARCHAR(50),
    @HoldReason     VARCHAR(1000) = NULL,
    -- Approver's EMP_ID and IP, supplied by the API from the access token and
    -- the request. @UpdatedBy is the LOGIN NAME ("ngoe"), which is not numeric,
    -- so it can never yield an EMP_ID on its own.
    @UpdatedByEmpId INT = NULL,
    @ApproverIp     VARCHAR(50) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Normalise incoming status to Proper-case for consistent storage.
    SET @Status = LTRIM(RTRIM(@Status));
    SET @Status = CASE UPPER(@Status)
                    WHEN 'APPROVED'  THEN 'Approved'
                    WHEN 'APPROVAL'  THEN 'Approved'
                    WHEN 'REJECTED'  THEN 'Rejected'
                    WHEN 'REJECT'    THEN 'Rejected'
                    WHEN 'HOLD'      THEN 'Hold'
                    ELSE @Status
                  END;

    -- Person columns are INT (EMP_ID based) and foreign keyed. @UpdatedByEmpId
    -- comes from the access token; the fallback is FK-guarded so an arbitrary
    -- number cannot break the approval. The login is always in MODIFIED_BY.
    DECLARE @PersonEmpId INT = COALESCE(
        @UpdatedByEmpId,
        (
            SELECT TOP 1 TRY_CONVERT(INT, @UpdatedBy)
            FROM [VPayEntries].[NEW_EMPLOYEE_DATABASE]
            WHERE TRY_CONVERT(INT, @UpdatedBy) IS NOT NULL
              AND EMP_ID = TRY_CONVERT(INT, @UpdatedBy)
        )
    );

    -- Validate Hold Reason
    IF @Status = 'Hold' AND LTRIM(RTRIM(ISNULL(@HoldReason, ''))) = ''
    BEGIN
        SELECT 'error' AS STATUS, 'Hold Reason is mandatory when status is Hold' AS MESSAGE, '' AS DATA;
        RETURN;
    END

    -- Validate Status
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
            SELECT 1 FROM [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
            WHERE SNO = @RequestID
        )
        BEGIN
            SELECT 'error' AS STATUS, 'Purchase Request not found' AS MESSAGE, '' AS DATA;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Only submitted requests are in the approval workflow.
        IF NOT EXISTS (
            SELECT 1 FROM [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
            WHERE SNO = @RequestID
              AND UPPER(LTRIM(RTRIM(ISNULL(STATUS_ENTRY,'')))) = 'CL'
        )
        BEGIN
            SELECT 'error' AS STATUS,
                   'Purchase Request has not been submitted for approval' AS MESSAGE,
                   '' AS DATA;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        DECLARE @SecHeadStatusN VARCHAR(50),
                @Resp1StatusN   VARCHAR(50),
                @Resp2StatusN   VARCHAR(50);

        SELECT
            @SecHeadStatusN = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)), ''), 'PENDING')),
            @Resp1StatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)),             ''), 'PENDING')),
            @Resp2StatusN   = UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)),             ''), 'PENDING'))
        FROM [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
        WHERE SNO = @RequestID;

        -- Which level this call answered (1, 2 or 3). The terminal mirror below
        -- needs to know whether the final level was just completed.
        DECLARE @HandledLevel INT = 0;

        -- ── LEVEL 1: Section Head ───────────────────────────────────────────
        IF @SecHeadStatusN IN ('PENDING', 'HOLD')
        BEGIN
            UPDATE [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
            SET
                SECTION_HEAD_RESPONSE_STATUS        = @Status,
                SECTION_HEAD_RESPONSE_REMARKS       = CASE WHEN LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> '' THEN @HoldReason ELSE SECTION_HEAD_RESPONSE_REMARKS END,
                SECTION_HEAD_RESPONSE_DATE          = GETDATE(),
                SECTION_HEAD_RESPONSE_PERSON_EMP_ID = @PersonEmpId,
                SECTION_HEAD_RESPONSE_IP_ADDRESS    = @ApproverIp,
                MODIFIED_BY                         = @UpdatedBy,
                MODIFIED_DATE                       = GETDATE()
            WHERE SNO = @RequestID;

            SET @HandledLevel = 1;
        END
        -- ── LEVEL 2: Response 1 ─────────────────────────────────────────────
        ELSE IF @SecHeadStatusN = 'APPROVED' AND @Resp1StatusN IN ('PENDING', 'HOLD')
        BEGIN
            UPDATE [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
            SET
                RESPONSE_1_STATUS     = @Status,
                RESPONSE_1_REMARKS    = CASE WHEN LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> '' THEN @HoldReason ELSE RESPONSE_1_REMARKS END,
                RESPONSE_1_DATE       = GETDATE(),
                RESPONSE_1_EMP_ID     = @PersonEmpId,
                RESPONSE_1_IP_ADDRESS = @ApproverIp,
                MODIFIED_BY           = @UpdatedBy,
                MODIFIED_DATE         = GETDATE()
            WHERE SNO = @RequestID;

            SET @HandledLevel = 2;
        END
        -- ── LEVEL 3: Response 2 - FINAL LEVEL ───────────────────────────────
        ELSE IF @Resp1StatusN = 'APPROVED' AND @Resp2StatusN IN ('PENDING', 'HOLD')
        BEGIN
            UPDATE [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
            SET
                RESPONSE_2_STATUS     = @Status,
                RESPONSE_2_REMARKS    = CASE WHEN LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> '' THEN @HoldReason ELSE RESPONSE_2_REMARKS END,
                RESPONSE_2_DATE       = GETDATE(),
                RESPONSE_2_EMP_ID     = @PersonEmpId,
                RESPONSE_2_IP_ADDRESS = @ApproverIp,
                MODIFIED_BY           = @UpdatedBy,
                MODIFIED_DATE         = GETDATE()
            WHERE SNO = @RequestID;

            SET @HandledLevel = 3;
        END
        ELSE
        BEGIN
            SELECT 'error' AS STATUS,
                   'No pending approval level found. The request may already be fully approved/rejected at every level.' AS MESSAGE,
                   CONCAT('SecHead=', @SecHeadStatusN, ' Resp1=', @Resp1StatusN, ' Resp2=', @Resp2StatusN) AS DATA;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        /* Terminal outcome mirror.
           The entry screen paints "Final Status" from FINAL_RESPONSE_STATUS and
           "Status" from STATUS_ID, so a rejection (any level) and a completion
           (final level approved) are written there too. A Hold is NOT mirrored:
           it is re-actionable, and a stale Hold would win over the later
           approval in every read path. */
        IF @Status = 'Rejected' OR (@Status = 'Approved' AND @HandledLevel = 3)
        BEGIN
            UPDATE [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
            SET
                FINAL_RESPONSE_STATUS     = @Status,
                FINAL_RESPONSE_DATE       = GETDATE(),
                FINAL_RESPONSE_EMP_ID     = @PersonEmpId,
                FINAL_RESPONSE_REMARKS    = CASE WHEN LTRIM(RTRIM(ISNULL(@HoldReason, ''))) <> '' THEN @HoldReason ELSE FINAL_RESPONSE_REMARKS END,
                FINAL_RESPONSE_IP_ADDRESS = @ApproverIp,
                MODIFIED_BY               = @UpdatedBy,
                MODIFIED_DATE             = GETDATE()
            WHERE SNO = @RequestID;
        END

        -- STATUS_ID follows the terminal outcome so the requester's Status column
        -- and the approver's decision can never disagree. STATUS_ENTRY stays 'CL'
        -- (submitted) - it identifies the request as part of the workflow.
        DECLARE @OutcomeCode VARCHAR(20) = NULL;
        IF @Status = 'Rejected'
            SET @OutcomeCode = 'REJECTED';
        ELSE IF @Status = 'Approved' AND @HandledLevel = 3
            SET @OutcomeCode = 'APPROVED';

        IF @OutcomeCode IS NOT NULL
        BEGIN
            DECLARE @OutcomeStatusId INT;

            SELECT TOP 1 @OutcomeStatusId = STATUS_ID
            FROM [VMaster].[TBL_STATUS_MASTER]
            WHERE STATUS_CODE = @OutcomeCode
              AND UPPER(ISNULL(STATUS_MASTER, '')) IN ('AC', 'ACTIVE')
            ORDER BY STATUS_ID;

            IF @OutcomeStatusId IS NOT NULL
            BEGIN
                UPDATE [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
                SET
                    STATUS_ID     = @OutcomeStatusId,
                    MODIFIED_BY   = @UpdatedBy,
                    MODIFIED_DATE = GETDATE()
                WHERE SNO = @RequestID
                  AND (STATUS_ID IS NULL OR STATUS_ID <> @OutcomeStatusId);
            END
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
   VRequest.GET_PURCHASE_REQUEST_SUMMARY

   One dashboard-card row for the Purchase Request panel. Counts use the exact
   same terminal-only rollup as the list procedure, so the number on the card
   always matches the rows the grid shows for that status.

   Kept as its own procedure (rather than a new UNION block inside
   GET_REQUEST_SUMMARY) so the existing seven request types are never rewritten
   just to add one card.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [VRequest].[GET_PURCHASE_REQUEST_SUMMARY]
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
        FROM [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
        -- Same submitted gate as the list procedure: a row counts only once the
        -- entry screen submitted it (live status id, or a level has answered).
        WHERE UPPER(LTRIM(RTRIM(ISNULL(STATUS_ENTRY,'')))) = 'CL'
          AND (
                ISNULL(STATUS_ID, 0) IN (3, 4, 5, 6, 7)
             OR LTRIM(RTRIM(ISNULL(SECTION_HEAD_RESPONSE_STATUS,''))) <> ''
             OR LTRIM(RTRIM(ISNULL(RESPONSE_1_STATUS,'')))            <> ''
             OR LTRIM(RTRIM(ISNULL(RESPONSE_2_STATUS,'')))            <> ''
             OR LTRIM(RTRIM(ISNULL(FINAL_RESPONSE_STATUS,'')))        <> ''
          )
    )
    SELECT
        'Purchase Request' AS CardName,
        SUM(CASE WHEN finalResponseStatus = 'PENDING'  THEN 1 ELSE 0 END) AS PendingCount,
        SUM(CASE WHEN finalResponseStatus = 'APPROVED' THEN 1 ELSE 0 END) AS ApprovedCount,
        SUM(CASE WHEN finalResponseStatus = 'HOLD'     THEN 1 ELSE 0 END) AS HoldCount,
        SUM(CASE WHEN finalResponseStatus = 'REJECTED' THEN 1 ELSE 0 END) AS RejectedCount
    FROM STATE;
END
GO
