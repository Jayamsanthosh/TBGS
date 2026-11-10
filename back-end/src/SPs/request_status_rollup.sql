/* ============================================================================
   Canonical approval-status rollup.

   Every dashboard count, insight card and detail list must agree on one rule:

       REJECTED  - any approval level has rejected
       HOLD      - no rejection, but a level is on hold
       APPROVED  - every required level has approved
       PENDING   - everything else (including drafts / unsubmitted rows)

   The old rollup used the *deepest answered* level, so a request that stopped
   after Response 2 (Section Head / Final blank) was reported as Approved while
   its Final level was still pending. A missing level is now treated as
   Pending, never as approval.

   Two flavours exist because the two workflows have different chains:

   * FN_APPROVAL_STATUS         - HR requests: Section Head + Response 1 +
                                  Response 2 + Final must all be approved.
   * FN_PURCHASE_APPROVAL_STATUS - purchase documents: the chain is Section
                                  Head -> Response 1 -> Response 2, and the
                                  terminal outcome is mirrored into
                                  FINAL_RESPONSE_STATUS. Response 2 or Final
                                  approving closes the chain.
   ============================================================================ */

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'VRequest')
    EXEC('CREATE SCHEMA VRequest');
GO

CREATE OR ALTER FUNCTION [VRequest].[FN_APPROVAL_STATUS]
(
    @SectionHead NVARCHAR(100),
    @Response1   NVARCHAR(100),
    @Response2   NVARCHAR(100),
    @Final       NVARCHAR(100)
)
RETURNS VARCHAR(20)
AS
BEGIN
    DECLARE @SH VARCHAR(20) = UPPER(LTRIM(RTRIM(ISNULL(@SectionHead, ''))));
    DECLARE @R1 VARCHAR(20) = UPPER(LTRIM(RTRIM(ISNULL(@Response1,   ''))));
    DECLARE @R2 VARCHAR(20) = UPPER(LTRIM(RTRIM(ISNULL(@Response2,   ''))));
    DECLARE @FN VARCHAR(20) = UPPER(LTRIM(RTRIM(ISNULL(@Final,       ''))));

    IF @SH IN ('REJECT', 'REJECTED')
       OR @R1 IN ('REJECT', 'REJECTED')
       OR @R2 IN ('REJECT', 'REJECTED')
       OR @FN IN ('REJECT', 'REJECTED')
        RETURN 'REJECTED';

    IF @SH = 'HOLD' OR @R1 = 'HOLD' OR @R2 = 'HOLD' OR @FN = 'HOLD'
        RETURN 'HOLD';

    IF @SH IN ('APPROVAL', 'APPROVED')
       AND @R1 IN ('APPROVAL', 'APPROVED')
       AND @R2 IN ('APPROVAL', 'APPROVED')
       AND @FN IN ('APPROVAL', 'APPROVED')
        RETURN 'APPROVED';

    RETURN 'PENDING';
END
GO

CREATE OR ALTER FUNCTION [VRequest].[FN_PURCHASE_APPROVAL_STATUS]
(
    @SectionHead NVARCHAR(100),
    @Response1   NVARCHAR(100),
    @Response2   NVARCHAR(100),
    @Final       NVARCHAR(100)
)
RETURNS VARCHAR(20)
AS
BEGIN
    DECLARE @SH VARCHAR(20) = UPPER(LTRIM(RTRIM(ISNULL(@SectionHead, ''))));
    DECLARE @R1 VARCHAR(20) = UPPER(LTRIM(RTRIM(ISNULL(@Response1,   ''))));
    DECLARE @R2 VARCHAR(20) = UPPER(LTRIM(RTRIM(ISNULL(@Response2,   ''))));
    DECLARE @FN VARCHAR(20) = UPPER(LTRIM(RTRIM(ISNULL(@Final,       ''))));

    IF @SH IN ('REJECT', 'REJECTED')
       OR @R1 IN ('REJECT', 'REJECTED')
       OR @R2 IN ('REJECT', 'REJECTED')
       OR @FN IN ('REJECT', 'REJECTED')
        RETURN 'REJECTED';

    IF @SH = 'HOLD' OR @R1 = 'HOLD' OR @R2 = 'HOLD' OR @FN = 'HOLD'
        RETURN 'HOLD';

    IF @R2 IN ('APPROVAL', 'APPROVED') OR @FN IN ('APPROVAL', 'APPROVED')
        RETURN 'APPROVED';

    RETURN 'PENDING';
END
GO
