/* ============================================================================
   Registers the "Company Branch Mapping" screen in the RBAC tables so that
   checkPermission("/company-branch-mapping") in src/routers/index.ts resolves.

   - TBL_LINKS_AND_PAGES          one link under the Organization sub menu (4),
                                  which is where every other company mapping
                                  screen already lives.
   - TBL_ROLE_TO_LINK_AND_PAGE    same role grants as the sibling company
                                  mappings (Admin, Manager, clerk).

   Re-runnable: the link is matched on LINK_LOCATION, and grants on the
   (role, link) pair, so running this twice adds nothing.
   ============================================================================ */
GO
DECLARE @LINK_ID INT;

SELECT @LINK_ID = [LINK_ID]
FROM [VMaster].[TBL_LINKS_AND_PAGES]
WHERE [LINK_LOCATION] = '/company-branch-mapping';

IF @LINK_ID IS NULL
BEGIN
    INSERT INTO [VMaster].[TBL_LINKS_AND_PAGES]
    (
        [SUB_MENU_ID],
        [LINK_NAME],
        [PAGE_ACTION],
        [REDIRECTION_TYPE],
        [LINK_LOCATION],
        [LINK_SEQ_ID],
        [STYLE_CSS],
        [STATUS_MASTER],
        [CREATED_BY],
        [CREATED_DATE]
    )
    VALUES
    (
        4,
        'Company Branch Mapping',
        '/company-branch-mapping',
        'internal',
        '/company-branch-mapping',
        21,
        'Building',
        'AC',
        'System',
        GETDATE()
    );

    SET @LINK_ID = SCOPE_IDENTITY();
END

/* Admin, Manager and clerk, matching the sibling mapping screens. */
DECLARE @ROLE_IDS TABLE ([ROLE_ID] INT);

INSERT INTO @ROLE_IDS ([ROLE_ID])
SELECT [ROLE_ID] FROM [VMaster].[TBL_ROLE_MASTER] WHERE [ROLE_NAME] IN ('Admin', 'Manager', 'clerk');

INSERT INTO [VMaster].[TBL_ROLE_TO_LINK_AND_PAGE]
(
    [ROLE_ID_ROLE_TO_LINK],
    [LINK_ID_ROLE_TO_LINK],
    [STATUS_ROLE_TO_LINK],
    [CREATED_USER_ROLE_TO_LINK],
    [CREATED_DATE_ROLE_TO_LINK]
)
SELECT
    R.[ROLE_ID],
    @LINK_ID,
    'AC',
    'System',
    GETDATE()
FROM @ROLE_IDS R
WHERE NOT EXISTS (
    SELECT 1
    FROM [VMaster].[TBL_ROLE_TO_LINK_AND_PAGE] X
    WHERE X.[ROLE_ID_ROLE_TO_LINK] = R.[ROLE_ID]
      AND X.[LINK_ID_ROLE_TO_LINK] = @LINK_ID
);

SELECT @LINK_ID AS LINK_ID_CREATED;
GO
