/* =============================================================================
   Run this file in SQL Server Management Studio (SSMS) against the TBGS database.
   It fixes the SHOW stored procedures for License Permit Cost / License Permit Type
   so the frontend list and "Filter by Status" work correctly.

   What changed:
     1. @STATUS now has a default and accepts '' (All), 'AC' (Active) or 'IN' (Inactive).
     2. Status matching is tolerant to both stored formats: AC/ACTIVE and IN/INACTIVE
        (so older records saved as 'ACTIVE'/'INACTIVE' are now returned too).
     3. SHOW_LICENSE_PERMIT_COST_MASTER now also returns the FK columns and name
        columns needed by the grid/edit form (and the price-package join was fixed
        so it no longer produces duplicate rows).
   ============================================================================= */

USE [TBGS];
GO

IF OBJECT_ID('[VMaster].[SHOW_LICENSE_PERMIT_COST_MASTER]','P') IS NOT NULL
    DROP PROCEDURE [VMaster].[SHOW_LICENSE_PERMIT_COST_MASTER];
GO

CREATE PROCEDURE [VMaster].[SHOW_LICENSE_PERMIT_COST_MASTER]
(
    @LICENSE_PERMIT_ID      VARCHAR(50) = '',
    @SALES_PACKAGE_TYPE_ID  VARCHAR(50) = '',
    @PRICE_PACKAGE_ID       VARCHAR(50) = '',
    @STATUS                 VARCHAR(50) = ''
)
AS
BEGIN
    SET NOCOUNT ON

    SELECT
         a.[SNO]
        ,a.[LICENSE_PERMIT_ID]
        ,lt.LICENSE_PERMIT_NAME
        ,a.[SALES_PACKAGE_TYPE_ID]
        ,st.SALES_PACKAGE_TYPE_NAME
        ,a.[PRICE_TYPE_ID]
        ,pt.PRICE_TYPE_NAME
        ,a.[PRICE_PACKAGE_ID]
        ,p.PRICE_PACKAGE_NAME
        ,a.[GOVT_RATE]
        ,a.[ACTUAL_AMOUNT]
        ,a.[CURRENCY_ID]
        ,cu.CURRENCY_NAME
        ,REPLACE(CONVERT(VARCHAR(50), a.EFFECTIVE_FROM, 106), ' ', '-') AS EFFECTIVE_FROM
        ,REPLACE(CONVERT(VARCHAR(50), a.EFFECTIVE_TO, 106), ' ', '-')   AS EFFECTIVE_TO
        ,A.[REMARKS]
        ,CASE WHEN A.STATUS_MASTER IN ('AC','ACTIVE') THEN 'ACTIVE' ELSE 'INACTIVE' END AS STATUS_MASTER
    FROM [VMaster].[TBL_LICENSE_PERMIT_COST_MASTER] AS A
    LEFT JOIN VMASTER.TBL_LICENSE_PERMIT_TYPE_MASTER  AS lt ON lt.LICENSE_PERMIT_ID  = a.LICENSE_PERMIT_ID
    LEFT JOIN VMASTER.TBL_SALES_PACKAGE_TYPE_MASTER   AS st ON st.SALES_PACKAGE_TYPE_ID = a.SALES_PACKAGE_TYPE_ID
    LEFT JOIN VMASTER.TBL_PRICE_TYPE_MASTER           AS pt ON pt.PRICE_TYPE_ID       = a.PRICE_TYPE_ID
    LEFT JOIN VMASTER.TBL_PRICE_PACKAGE_MASTER        AS p  ON p.PRICE_PACKAGE_ID     = a.PRICE_PACKAGE_ID
    LEFT JOIN VMASTER.TBL_CURRENCY_MASTER             AS cu ON cu.CURRENCY_ID         = a.CURRENCY_ID
    WHERE (@STATUS = '' OR @STATUS IS NULL
       OR UPPER(A.STATUS_MASTER) = @STATUS
       OR (UPPER(A.STATUS_MASTER) = 'ACTIVE'   AND @STATUS = 'AC')
       OR (UPPER(A.STATUS_MASTER) = 'INACTIVE' AND @STATUS = 'IN'))
     AND CASE WHEN @LICENSE_PERMIT_ID <> '' AND @LICENSE_PERMIT_ID <> '0'
              THEN CHARINDEX(',' + CONVERT(VARCHAR(MAX), a.LICENSE_PERMIT_ID) + ',', ',' + @LICENSE_PERMIT_ID + ',')
              ELSE 1 END > 0
     AND CASE WHEN @SALES_PACKAGE_TYPE_ID <> '' AND @SALES_PACKAGE_TYPE_ID <> '0'
              THEN CHARINDEX(',' + CONVERT(VARCHAR(MAX), a.SALES_PACKAGE_TYPE_ID) + ',', ',' + @SALES_PACKAGE_TYPE_ID + ',')
              ELSE 1 END > 0
     AND CASE WHEN @PRICE_PACKAGE_ID <> '' AND @PRICE_PACKAGE_ID <> '0'
              THEN CHARINDEX(',' + CONVERT(VARCHAR(MAX), a.PRICE_PACKAGE_ID) + ',', ',' + @PRICE_PACKAGE_ID + ',')
              ELSE 1 END > 0
END
GO

IF OBJECT_ID('[VMaster].[SHOW_LICENSE_PERMIT_TYPE_MASTER]','P') IS NOT NULL
    DROP PROCEDURE [VMaster].[SHOW_LICENSE_PERMIT_TYPE_MASTER];
GO

CREATE PROCEDURE [VMaster].[SHOW_LICENSE_PERMIT_TYPE_MASTER]
(
    @STATUS VARCHAR(50) = ''
)
AS
BEGIN
    SET NOCOUNT ON

    SELECT
        LICENSE_PERMIT_ID,
        LICENSE_PERMIT_NAME,
        REMARKS,
        CASE WHEN A.STATUS_MASTER IN ('AC','ACTIVE') THEN 'ACTIVE' ELSE 'INACTIVE' END AS STATUS_MASTER
    FROM [VMaster].[TBL_LICENSE_PERMIT_TYPE_MASTER] A
    WHERE (@STATUS = '' OR @STATUS IS NULL
       OR UPPER(A.STATUS_MASTER) = @STATUS
       OR (UPPER(A.STATUS_MASTER) = 'ACTIVE'   AND @STATUS = 'AC')
       OR (UPPER(A.STATUS_MASTER) = 'INACTIVE' AND @STATUS = 'IN'))
    ORDER BY LICENSE_PERMIT_NAME;
END
GO
