USE [TBGS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Adds the /week-day-master link under Masters > HR & Payroll and maps it to the Admin role.
-- Safe to re-run: no-ops if the link already exists.
-- NOTE: To grant access to other roles, add more ROLE_NAME rows in the role-mapping INSERT below.

DECLARE @MAIN_MENU_ID INT = (
    SELECT MAIN_MENU_ID FROM VMaster.TBL_MAIN_MENU WHERE MAIN_MENU_NAME = 'Masters'
);
DECLARE @SUB_MENU_ID INT = (
    SELECT SUB_MENU_ID FROM VMaster.TBL_SUB_MENU
    WHERE MAIN_MENU_ID = @MAIN_MENU_ID AND SUB_MENU_NAME = 'HR & Payroll'
);
DECLARE @LINK_SEQ INT = ISNULL((
    SELECT MAX(LINK_SEQ_ID) FROM VMaster.TBL_LINKS_AND_PAGES WHERE SUB_MENU_ID = @SUB_MENU_ID
), 0) + 1;

IF @SUB_MENU_ID IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM VMaster.TBL_LINKS_AND_PAGES WHERE LINK_LOCATION = '/week-day-master'
)
BEGIN
    INSERT INTO VMaster.TBL_LINKS_AND_PAGES
        (SUB_MENU_ID, LINK_NAME, PAGE_ACTION, REDIRECTION_TYPE, LINK_LOCATION, LINK_SEQ_ID, STYLE_CSS, STATUS_MASTER, CREATED_BY, CREATED_DATE)
    VALUES
        (@SUB_MENU_ID, 'Week Day Master', '/week-day-master', 'internal', '/week-day-master', @LINK_SEQ, 'Calendar', 'AC', 'System', GETDATE());

    DECLARE @LINK_ID INT = SCOPE_IDENTITY();

    INSERT INTO VMaster.TBL_ROLE_TO_LINK_AND_PAGE
        (ROLE_ID_ROLE_TO_LINK, LINK_ID_ROLE_TO_LINK, STATUS_ROLE_TO_LINK, CREATED_DATE_ROLE_TO_LINK)
    SELECT ROLE_ID, @LINK_ID, 'AC', GETDATE()
    FROM VMaster.TBL_ROLE_MASTER
    WHERE ROLE_NAME = 'Admin'
      AND NOT EXISTS (
        SELECT 1 FROM VMaster.TBL_ROLE_TO_LINK_AND_PAGE
        WHERE ROLE_ID_ROLE_TO_LINK = VMaster.TBL_ROLE_MASTER.ROLE_ID
          AND LINK_ID_ROLE_TO_LINK = @LINK_ID
      );

    PRINT 'Week Day Master link added (LINK_ID = ' + CAST(@LINK_ID AS VARCHAR(10)) + ').';
END
ELSE
BEGIN
    PRINT 'Week Day Master link already exists - no change.';
END
GO
