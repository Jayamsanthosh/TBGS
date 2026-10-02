/* ============================================================================
   VPurchase.LOAD_PURCHASE_REQUEST_HDR

   Projects the fields the purchase request *grid* renders but which this read
   procedure never returned, so those columns silently came back empty:

     statusId          the Submit button decides "already pending" from
                       STATUS_ID, and entryLabel() reads STATUS_ENTRY. The
                       entry screen moves both together, but this read exposed
                       neither, so the two could never agree in the table.
     requestedBy       "Requested By" column. Always blank.
     requestedByEmpId  shown beside the name as " (#id)" when the requester is
                       an employee.
     branchName        "Branch" column - always blank.
     poStoreName       "PO Store" column - always blank.

   requestedBy prefers the name the session captured at save time
   (REQUESTED_BY_NAME) over a join to the employee master, because a login with
   no employee row - 'sandy', 'sri' - still has to raise a request and is stored
   with a NULL REQUESTED_BY_EMP_ID plus its login name. Joining the employee
   master cannot produce a name for those rows. CREATED_BY is the fallback for
   rows saved before REQUESTED_BY_NAME existed.

   This is the grid read. The edit form uses VPurchase.GET_PURCHASE_REQUEST_HDR,
   which already returns requestedBy / branchName / poStoreName / statusId - that
   is why opening a request showed the right values while the table did not.

   Branch and store are LEFT JOINed so a request whose branch or PO store was
   cleared still lists, exactly as the form read does.
   ============================================================================ */

CREATE OR ALTER PROCEDURE [VPurchase].[LOAD_PURCHASE_REQUEST_HDR]
(
    @CompanyId INT = NULL,
    @StatusEntry VARCHAR(20) = NULL,
    @ApprovalStatus VARCHAR(20) = NULL,
    @IncludeInactive BIT = 0,
    @FinalResponseStatus VARCHAR(20) = NULL
)
AS
BEGIN
    SET NOCOUNT ON

    ;WITH DATA AS
    (
        SELECT
             A.PURCHASE_REQUEST_NO AS purchaseRequestNo
            ,A.PURCHASE_REQUEST_DATE AS purchaseRequestDate
            ,A.COMPANY_ID AS companyId
            ,C.COMPANY_NAME AS companyName
            ,BR.BRANCH_NAME AS branchName
            ,PS.STORE_NAME AS poStoreName
            ,A.STATUS_ID AS statusId
            ,A.STATUS_ENTRY AS statusEntry
            ,A.PURCHASE_REQUEST_NO + ' - ' + ISNULL(C.COMPANY_NAME,'') AS displayText
            ,A.REQUESTED_BY_EMP_ID AS requestedByEmpId
            -- The stored name first, then the creating login. Never the employee
            -- master: a non-employee login has no row there to join.
            ,ISNULL(NULLIF(LTRIM(RTRIM(A.REQUESTED_BY_NAME)), ''),
                    LTRIM(RTRIM(ISNULL(A.CREATED_BY, '')))) AS requestedBy
            -- Overall status for display: the deepest level that has been
            -- answered (this is the convention the other request types use).
            ,CASE UPPER(LTRIM(RTRIM(ISNULL(A.FINAL_RESPONSE_STATUS,
                    ISNULL(A.RESPONSE_2_STATUS,
                    ISNULL(A.RESPONSE_1_STATUS,
                    ISNULL(A.SECTION_HEAD_RESPONSE_STATUS, 'Pending')))))))
                WHEN 'APPROVAL'  THEN 'APPROVED'
                WHEN 'APPROVED'  THEN 'APPROVED'
                WHEN 'REJECT'    THEN 'REJECTED'
                WHEN 'REJECTED'  THEN 'REJECTED'
                WHEN 'HOLD'      THEN 'HOLD'
                ELSE 'PENDING' END AS approvalStatus
            -- The FINAL level only. A request may only be quoted once every
            -- approver has signed off, so the gate must NOT cascade: reading
            -- SECTION_HEAD_RESPONSE_STATUS here would let a single section-head
            -- approval make the request quotable.
            ,CASE UPPER(LTRIM(RTRIM(ISNULL(A.FINAL_RESPONSE_STATUS, ''))))
                WHEN 'APPROVAL'  THEN 'APPROVED'
                WHEN 'APPROVED'  THEN 'APPROVED'
                WHEN 'REJECT'    THEN 'REJECTED'
                WHEN 'REJECTED'  THEN 'REJECTED'
                WHEN 'HOLD'      THEN 'HOLD'
                ELSE 'PENDING' END AS finalResponseStatus
            -- How many detail lines the request has.
            --
            -- The purchase quotation wizard pulls a request's lines into the
            -- quotation and then has nothing more to take from it, so the
            -- dropdown stops offering it. Deciding that needs the request's own
            -- line count: counting lines in the quotation only says how many
            -- were taken, not whether any are left. Without this column a request
            -- stays selectable after it is fully quoted, and re-picking it only
            -- produces an "already added" refusal.
            --
            -- A request with no lines at all keeps a count of 0 and stays
            -- listed, so picking it still reports that it has no detail lines.
            ,(SELECT COUNT(1)
                FROM [VPurchase].[TBL_PURCHASE_REQUEST_DTL] DT
               WHERE DT.PURCHASE_REQUEST_NO = A.PURCHASE_REQUEST_NO) AS detailLineCount
        FROM [VPurchase].[TBL_PURCHASE_REQUEST_HDR] A
        LEFT JOIN [VMaster].[TBL_COMPANY_MASTER] C ON C.COMPANY_ID = A.COMPANY_ID
        LEFT JOIN [VMaster].[TBL_BRANCH_MASTER] BR ON BR.BRANCH_ID = A.BRANCH_ID
        LEFT JOIN [VMaster].[TBL_STORE_MASTER] PS ON PS.STORE_ID = A.PO_STORE_ID
        WHERE (@CompanyId IS NULL OR A.COMPANY_ID = @CompanyId)
          AND (@StatusEntry IS NULL OR A.STATUS_ENTRY = @StatusEntry)
          AND (@IncludeInactive = 1
               OR UPPER(LTRIM(RTRIM(ISNULL(A.STATUS_ENTRY,'')))) <> 'INACTIVE')
    )
    SELECT
         purchaseRequestNo
        ,purchaseRequestDate
        ,companyId, companyName
        ,branchName, poStoreName
        ,statusId, statusEntry
        ,requestedBy, requestedByEmpId
        ,approvalStatus, finalResponseStatus, displayText
        ,detailLineCount
    FROM DATA
    WHERE (@ApprovalStatus IS NULL OR approvalStatus = UPPER(LTRIM(RTRIM(@ApprovalStatus))))
      AND (@FinalResponseStatus IS NULL OR finalResponseStatus = UPPER(LTRIM(RTRIM(@FinalResponseStatus))))
    ORDER BY purchaseRequestDate DESC, purchaseRequestNo DESC
END
GO