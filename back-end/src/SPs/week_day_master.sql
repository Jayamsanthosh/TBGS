USE [TBGS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Corrected CREATE TABLE for VMASTER.TBL_WEEK_DAY_MASTER.
-- Changes from the original script:
--   * Removed the invalid trailing comma after MODIFIED_MAC_ADDRESS.
--   * Fixed the comment typo (MUNDAY -> MONDAY) and removed the duplicated SUNDAY.
--   * Added UNIQUE on WEEK_DAY_NAME to enforce the same duplicate rule the SAVE/UPDATE SPs check.
-- NOTE: The table already exists in the database (seeded with ids 1-7). This script is for
-- reference / fresh setups only. To change an existing table, use ALTER instead.

CREATE TABLE VMASTER.TBL_WEEK_DAY_MASTER
(
    WEEK_DAY_ID INT IDENTITY(1,1) CONSTRAINT PK_WEEKDAY_MAS PRIMARY KEY,
    WEEK_DAY_NAME VARCHAR(50) CONSTRAINT UQ_WEEKDAY_MAS_NAME UNIQUE, -- SUNDAY/MONDAY/TUESDAY/WEDNESDAY/THURSDAY/FRIDAY/SATURDAY
    REMARKS VARCHAR(1000) NULL,
    STATUS_MASTER VARCHAR(20) NULL,
    CREATED_BY VARCHAR(50) NULL,
    CREATED_DATE DATETIME NULL,
    CREATED_MAC_ADDRESS VARCHAR(50) NULL,
    MODIFIED_BY VARCHAR(50) NULL,
    MODIFIED_DATE DATETIME NULL,
    MODIFIED_MAC_ADDRESS VARCHAR(50) NULL
)
GO
