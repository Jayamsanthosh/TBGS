USE [TBGS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Seeds the 7 weekdays into VMASTER.TBL_WEEK_DAY_MASTER.
-- Required because TBL_EMPLOYEE_DAILY_SHIFT_DETAILS.WEEK_DAY_ID has a FK (FK_WEEKDAY_ID_DAILY_SHIFT)
-- to VMASTER.TBL_WEEK_DAY_MASTER.WEEK_DAY_ID, and the table is currently empty.
-- Safe to re-run: skips ids that already exist.

SET IDENTITY_INSERT VMASTER.TBL_WEEK_DAY_MASTER ON;

INSERT INTO VMASTER.TBL_WEEK_DAY_MASTER
    (WEEK_DAY_ID, WEEK_DAY_NAME, REMARKS, STATUS_MASTER, CREATED_BY, CREATED_DATE, CREATED_MAC_ADDRESS)
SELECT v.id, v.name, NULL, 'AC', 'System', GETDATE(), 'WEB'
FROM (VALUES
    (1, 'Sunday'),
    (2, 'Monday'),
    (3, 'Tuesday'),
    (4, 'Wednesday'),
    (5, 'Thursday'),
    (6, 'Friday'),
    (7, 'Saturday')
) AS v(id, name)
WHERE NOT EXISTS (
    SELECT 1 FROM VMASTER.TBL_WEEK_DAY_MASTER w WHERE w.WEEK_DAY_ID = v.id
);

SET IDENTITY_INSERT VMASTER.TBL_WEEK_DAY_MASTER OFF;

PRINT 'Week day master seeded.';
GO