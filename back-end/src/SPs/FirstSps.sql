--- ALL THE SPS ARE CREATED

USE [TBGS]
GO
/****** Object:  StoredProcedure [VMaster].[DELETE_ANIMAL_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 
CREATE PROCEDURE [VMaster].[DELETE_ANIMAL_MASTER]
   (
	@ANIMAL_ID  int,
	@USER VARCHAR(50),
	@ROLE VARCHAR(50),
	@MAC_ADDRESS VARCHAR(50)
	) as begin set nocount on

	if @ROLE <>'Admin'
	begin
	select 'error','No Rights To Delete',''
	end
 else begin
 DELETE FROM [VMaster].[TBL_ANIMAL_MASTER]
   
 WHERE ANIMAL_ID =@ANIMAL_ID 
 SELECT '','Data Deleted Successfully',@ANIMAL_ID 
 
   end
	end
 
 

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_CAMP_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 

CREATE PROCEDURE [VMaster].[DELETE_CAMP_MASTER]
(
   @CAMP_ID INT,
 	@USER VARCHAR(50),
	@ROLE VARCHAR(50),
	@MAC_ADDRESS VARCHAR(50)
	)
 AS BEGIN SET NOCOUNT ON
  

  	if @ROLE <>'Admin'
	begin
	select 'error','No Rights To Delete',''
	end
 else begin
 DELETE FROM  [VMaster].[TBL_CAMP_MASTER]
   
 WHERE CAMP_ID  =@CAMP_ID 
 SELECT '','Data Deleted Successfully',@CAMP_ID 
 END
end
 

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_COMPANY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 

CREATE PROCEDURE [VMaster].[DELETE_COMPANY_MASTER]
(
@COMPANY_ID int ,
@USER VARCHAR(50),
@ROLE VARCHAR(50),
@MAC_ADDRESS VARCHAR(50)
) as begin set nocount on

	if @ROLE <>'Admin'
	begin
	select 'error','No Rights To Delete',''
	end
 else begin
 DELETE FROM VMaster.TBL_COMPANY_MASTER 
   
 WHERE COMPANY_ID =@COMPANY_ID 
 SELECT '','Data Deleted Successfully',@COMPANY_ID 
 
   end
	end

 

 
 


GO
/****** Object:  StoredProcedure [VMaster].[DELETE_COST_CENTRE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 
CREATE PROCEDURE [VMaster].[DELETE_COST_CENTRE_MASTER]
(
@COST_CENTRE_ID int, 
@USER VARCHAR(50),
@ROLE VARCHAR(50),
@MAC_ADDRESS VARCHAR(50)
) as begin set nocount on

	if @ROLE <>'Admin'
	begin
	select 'error','No Rights To Delete',''
	end
 else begin
 DELETE FROM [VMaster].[TBL_COST_CENTRE_MASTER] 
   
 WHERE COST_CENTRE_ID =@COST_CENTRE_ID 
 SELECT '','Data Deleted Successfully',@COST_CENTRE_ID  
 	end
	end
 
 

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_COUNTRY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [VMaster].[DELETE_COUNTRY_MASTER](
@Country_Id int ,
@USER VARCHAR(50),
@ROLE VARCHAR(50),
@MAC_ADDRESS VARCHAR(50)
) as begin set nocount on

	if @ROLE <>'Admin'
	begin
	select 'error','No Rights To Delete',''
	end
 else begin
 DELETE FROM  [VMaster].[tbl_country_master]
   
 WHERE Country_Id  =@Country_Id  
 SELECT '','Data Deleted Successfully',@Country_Id   
 
	end 
	END
 
 

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_CURRENCY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[DELETE_CURRENCY_MASTER]
(
    @CURRENCY_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete','';
    END
    ELSE
    BEGIN
        DELETE FROM [VMaster].[TBL_CURRENCY_MASTER]
        WHERE CURRENCY_ID = @CURRENCY_ID;

        SELECT '','Data Deleted Successfully',@CURRENCY_ID;
    END
END
GO
/****** Object:  StoredProcedure [VMaster].[DELETE_DEPARTMENT_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 
  
 

CREATE PROCEDURE [VMaster].[DELETE_DEPARTMENT_MASTER]
(
    @DEPARTMENT_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete',''
    END
    ELSE
    BEGIN
        DELETE FROM [VMaster].[TBL_DEPARTMENT_MASTER]
        WHERE DEPARTMENT_ID = @DEPARTMENT_ID

        SELECT '','Data Deleted Successfully',@DEPARTMENT_ID;
    END
END
 

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_DESIGNATION_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 
 
 
  

CREATE PROCEDURE [VMaster].[DELETE_DESIGNATION_MASTER]
(
    @DESIGNATION_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete',''
    END
    ELSE
    BEGIN
        DELETE FROM [VMaster].[TBL_DESIGNATION_MASTER]
        WHERE DESIGNATION_ID = @DESIGNATION_ID

        SELECT '','Data Deleted Successfully',@DESIGNATION_ID;
    END
END
 

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_DISTRICT_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[DELETE_DISTRICT_MASTER]
(
    @DISTRICT_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;


    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete',''
    END


   ELSE IF NOT EXISTS
    (
        SELECT 'CHECK'
        FROM [VMaster].[tbl_District_Master]
        WHERE District_id = @DISTRICT_ID
    )
    BEGIN
        SELECT 'error','Record Not Found',''
    END

	ELSE BEGIN
    DELETE FROM [VMaster].[tbl_District_Master]
    WHERE District_id = @DISTRICT_ID
    SELECT '', 'Data Deleted Successfully', @DISTRICT_ID;
	END
END

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_EXCHANGE_RATE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[DELETE_EXCHANGE_RATE_MASTER]
(
    @SNO INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON
    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete',''
      
    END


    IF NOT EXISTS
    (
        SELECT 1
        FROM [VMaster].[TBL_EXCHANGE_RATE_MASTER]
        WHERE SNO = @SNO
    )
    BEGIN
        SELECT 'error','Record Not Found',''
      
    END

    DELETE FROM [VMaster].[TBL_EXCHANGE_RATE_MASTER]
    WHERE SNO = @SNO;


    SELECT '', 'Data Deleted Successfully', @SNO;

END
 

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_LICENSE_PERMIT_TYPE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[DELETE_LICENSE_PERMIT_TYPE_MASTER]
(
    @LICENSE_PERMIT_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete','';
        RETURN;
    END


    IF NOT EXISTS
    (
        SELECT 1
        FROM [VMaster].[TBL_LICENSE_PERMIT_TYPE_MASTER]
        WHERE LICENSE_PERMIT_ID = @LICENSE_PERMIT_ID
    )
    BEGIN
        SELECT 'error','Record Not Found','';
        RETURN;
    END


    DELETE FROM [VMaster].[TBL_LICENSE_PERMIT_TYPE_MASTER]
    WHERE LICENSE_PERMIT_ID = @LICENSE_PERMIT_ID;


    SELECT '', 'Data Deleted Successfully', @LICENSE_PERMIT_ID;

END
 

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_PRICE_LIST_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[DELETE_PRICE_LIST_MASTER]
(
    @PRICE_LIST_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;


    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete','';
        RETURN;
    END


    IF NOT EXISTS
    (
        SELECT 1
        FROM [VMaster].[TBL_PRICE_LIST_MASTER]
        WHERE PRICE_LIST_ID=@PRICE_LIST_ID
    )
    BEGIN
        SELECT 'error','Record Not Found',''
        RETURN;
    END


    DELETE FROM [VMaster].[TBL_PRICE_LIST_MASTER]
    WHERE PRICE_LIST_ID=@PRICE_LIST_ID


    SELECT '', 'Data Deleted Successfully', @PRICE_LIST_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_PRICE_PACKAGE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[DELETE_PRICE_PACKAGE_MASTER]
(
    @PRICE_PACKAGE_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;


    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete','';
        RETURN;
    END


    IF NOT EXISTS
    (
        SELECT 1
        FROM [VMaster].[TBL_PRICE_PACKAGE_MASTER]
        WHERE PRICE_PACKAGE_ID=@PRICE_PACKAGE_ID
    )
    BEGIN
        SELECT 'error','Record Not Found','';
        RETURN;
    END


    DELETE FROM [VMaster].[TBL_PRICE_PACKAGE_MASTER]
    WHERE PRICE_PACKAGE_ID=@PRICE_PACKAGE_ID;


    SELECT '', 'Data Deleted Successfully', @PRICE_PACKAGE_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_PRICE_TYPE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[DELETE_PRICE_TYPE_MASTER]
(
    @PRICE_TYPE_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;


    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete','';
        RETURN;
    END


    IF NOT EXISTS
    (
        SELECT 1
        FROM [VMaster].[TBL_PRICE_TYPE_MASTER]
        WHERE PRICE_TYPE_ID = @PRICE_TYPE_ID
    )
    BEGIN
        SELECT 'error','Record Not Found',''
        RETURN;
    END


    DELETE FROM [VMaster].[TBL_PRICE_TYPE_MASTER]
    WHERE PRICE_TYPE_ID = @PRICE_TYPE_ID;


    SELECT '', 'Data Deleted Successfully', @PRICE_TYPE_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_PRODUCT_MAIN_CATEGORY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[DELETE_PRODUCT_MAIN_CATEGORY_MASTER]
(
    @MAIN_CATEGORY_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;


    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete','';
        RETURN;
    END


    IF NOT EXISTS
    (
        SELECT 1
        FROM [VMaster].[TBL_PRODUCT_MAIN_CATEGORY_MASTER]
        WHERE MAIN_CATEGORY_ID = @MAIN_CATEGORY_ID
    )
    BEGIN
        SELECT 'error','Record Not Found',''
        RETURN;
    END


    DELETE FROM [VMaster].[TBL_PRODUCT_MAIN_CATEGORY_MASTER]
    WHERE MAIN_CATEGORY_ID = @MAIN_CATEGORY_ID;


    SELECT '', 'Data Deleted Successfully', @MAIN_CATEGORY_ID;

END
 

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_PRODUCT_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[DELETE_PRODUCT_MASTER]
(
    @PRODUCT_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;


    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete',''
        
    END


    IF NOT EXISTS
    (
        SELECT 1
        FROM [VMaster].[TBL_PRODUCT_MASTER]
        WHERE PRODUCT_ID=@PRODUCT_ID
    )
    BEGIN
        SELECT 'error','Record Not Found','';
        RETURN;
    END


    DELETE FROM [VMaster].[TBL_PRODUCT_MASTER]
    WHERE PRODUCT_ID=@PRODUCT_ID


    SELECT '', 'Data Deleted Successfully', @PRODUCT_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_PRODUCT_SUB_CATEGORY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[DELETE_PRODUCT_SUB_CATEGORY_MASTER]
(
    @SUB_CATEGORY_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;


    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete',''
        RETURN;
    END


    IF NOT EXISTS
    (
        SELECT 1
        FROM [VMaster].[TBL_PRODUCT_SUB_CATEGORY_MASTER]
        WHERE SUB_CATEGORY_ID=@SUB_CATEGORY_ID
    )
    BEGIN
        SELECT 'error','Record Not Found','';
        RETURN;
    END


    DELETE FROM [VMaster].[TBL_PRODUCT_SUB_CATEGORY_MASTER]
    WHERE SUB_CATEGORY_ID=@SUB_CATEGORY_ID;


    SELECT '', 'Data Deleted Successfully', @SUB_CATEGORY_ID

END

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_REGION_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[DELETE_REGION_MASTER]
(
    @REGION_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON


    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete','';
        RETURN;
    END


    IF NOT EXISTS
    (
        SELECT 1
        FROM [VMaster].[TBL_REGION_MASTER]
        WHERE REGION_ID=@REGION_ID
    )
    BEGIN
        SELECT 'error','Record Not Found','';
        RETURN;
    END


    DELETE FROM [VMaster].[TBL_REGION_MASTER]
    WHERE REGION_ID=@REGION_ID;


    SELECT '', 'Data Deleted Successfully', @REGION_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_ROLE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[DELETE_ROLE_MASTER]
(
    @ROLE_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON


    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete',''
  
    END


    IF NOT EXISTS
    (
        SELECT 1
        FROM [VMaster].[TBL_ROLE_MASTER]
        WHERE ROLE_ID=@ROLE_ID
    )
    BEGIN
        SELECT 'error','Record Not Found','';
        RETURN;
    END


    DELETE FROM [VMaster].[TBL_ROLE_MASTER]
    WHERE ROLE_ID=@ROLE_ID;


    SELECT '', 'Data Deleted Successfully', @ROLE_ID

END
 
GO
/****** Object:  StoredProcedure [VMaster].[DELETE_SALES_PACKAGE_TYPE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[DELETE_SALES_PACKAGE_TYPE_MASTER]
(
    @SALES_PACKAGE_TYPE_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;


    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete','';
        RETURN;
    END


    IF NOT EXISTS
    (
        SELECT 1
        FROM [VMaster].[TBL_SALES_PACKAGE_TYPE_MASTER]
        WHERE SALES_PACKAGE_TYPE_ID=@SALES_PACKAGE_TYPE_ID
    )
    BEGIN
        SELECT 'error','Record Not Found',''
    END


    DELETE FROM [VMaster].[TBL_SALES_PACKAGE_TYPE_MASTER]
    WHERE SALES_PACKAGE_TYPE_ID=@SALES_PACKAGE_TYPE_ID;


    SELECT '', 'Data Deleted Successfully', @SALES_PACKAGE_TYPE_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_STORE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[DELETE_STORE_MASTER]
(
    @STORE_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;


    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete',''
    END


    IF NOT EXISTS
    (
        SELECT 1
        FROM [VMaster].[tbl_Store_Master]
        WHERE Store_Id=@STORE_ID
    )
    BEGIN
        SELECT 'error','Record Not Found','';
        RETURN;
    END


    DELETE FROM [VMaster].[tbl_Store_Master]
    WHERE Store_Id=@STORE_ID;


    SELECT '', 'Data Deleted Successfully', @STORE_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_UOM_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[DELETE_UOM_MASTER]
(
    @UOM_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;


    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete','';
        RETURN;
    END


    IF NOT EXISTS
    (
        SELECT 1
        FROM [VMaster].[TBL_UOM_MASTER]
        WHERE UOM_ID=@UOM_ID
    )
    BEGIN
        SELECT 'error','Record Not Found',''

    END


    DELETE FROM [VMaster].[TBL_UOM_MASTER]
    WHERE UOM_ID=@UOM_ID;


    SELECT '', 'Data Deleted Successfully', @UOM_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[DELETE_USER_INFO_HDR]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[DELETE_USER_INFO_HDR]
(
    @LOGIN_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON


    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete',''
    END

   ELSE  IF NOT EXISTS
    (
        SELECT 'CHECK EXISTS'
        FROM [VMaster].[TBL_USER_INFO_HDR]
        WHERE LOGIN_ID=@LOGIN_ID
    )
    BEGIN
        SELECT 'error','Record Not Found',''
     
    END

	ELSE BEGIN
    DELETE FROM [VMaster].[TBL_USER_INFO_HDR]
    WHERE LOGIN_ID=@LOGIN_ID;


    SELECT '', 'Data Deleted Successfully', @LOGIN_ID

END
END
 
GO
/****** Object:  StoredProcedure [VMaster].[DELETE_USER_TO_STORE_MAPPING]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[DELETE_USER_TO_STORE_MAPPING]
(
    @USER_TO_STORE_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON


    IF @ROLE <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete',''
     
    END
    ELSE IF NOT EXISTS  ( SELECT 'CHECK' FROM [VMaster].[TBL_USER_TO_STORE_MAPPING]    WHERE USER_TO_STORE_ID=@USER_TO_STORE_ID
    )
    BEGIN
        SELECT 'error','Record Not Found',''
    END
	ELSE BEGIN
    DELETE FROM [VMaster].[TBL_USER_TO_STORE_MAPPING]
    WHERE USER_TO_STORE_ID=@USER_TO_STORE_ID

    SELECT '', 'Data Deleted Successfully', @USER_TO_STORE_ID
	END
END
 

GO
/****** Object:  StoredProcedure [VMaster].[GET_ANIMAL_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 
CREATE PROCEDURE [VMaster].[GET_ANIMAL_MASTER]
   (
	@ANIMAL_ID  int 
	) as begin set nocount on

 
SELECT [ANIMAL_ID]
      ,[ANIMAL_NAME]
      ,[REMARKS]
      ,[STATUS_MASTER]
      ,[CREATED_BY]
  FROM [VMaster].[TBL_ANIMAL_MASTER]
 
 WHERE ANIMAL_ID =@ANIMAL_ID 
 --select * from [VMaster].[TBL_ANIMAL_MASTER]


	end
 
 

GO
/****** Object:  StoredProcedure [VMaster].[GET_CAMP_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 

CREATE PROCEDURE [VMaster].[GET_CAMP_MASTER](
	@CAMP_ID int 
 
 
	)
 AS BEGIN SET NOCOUNT ON
  
SELECT [CAMP_ID]
      ,[CAMP_NAME]
      ,[REMARKS]
      ,[STATUS_MASTER]
      ,[CREATED_BY]
      ,[CREATED_DATE]
      ,[CREATED_MAC_ADDRESS]
      ,[MODIFIED_BY]
      ,[MODIFIED_DATE]
      ,[MODIFIED_MAC_ADDRESS]
  FROM [VMaster].[TBL_CAMP_MASTER]
 WHERE CAMP_ID =@CAMP_ID 
 
 
end
 

GO
/****** Object:  StoredProcedure [VMaster].[GET_COMPANY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 

CREATE PROCEDURE [VMaster].[GET_COMPANY_MASTER]
(
@COMPANY_ID int 

) as begin set nocount on
 
SELECT [COMPANY_ID]
      ,[COMPANY_NAME]
      ,[COMPANY_FULL_NAME]
      ,[TIN_NUMBER]
      ,[VRN_NUMBER]
      ,[ADDRESS]
      ,[CONTACT_PERSON]
      ,[CONTACT_NUMBER]
      ,[EMAIL]
      ,[SHORT_CODE]
      ,[FINANCE_START_MONTH]
      ,[FINANCE_END_MONTH]
      ,[YEAR_CODE]
      ,[DEFAULT_CURRENCY_ID]
      ,[TIMEZONE]
      ,[NO_OF_USER]
      ,[WEBSITE]
      ,[COMP_BIG_LOGO]
      ,[COMP_SMALL_LOGO]
      ,[COMP_LETTER_HEAD]
      ,[COMP_STAMP_LOGO]
      ,[REMARKS]
      ,[STATUS_MASTER]
   FROM [VMaster].[TBL_COMPANY_MASTER]
 WHERE COMPANY_ID =@COMPANY_ID 
 

	end
 


GO
/****** Object:  StoredProcedure [VMaster].[GET_COST_CENTRE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 
CREATE PROCEDURE [VMaster].[GET_COST_CENTRE_MASTER](
	@COST_CENTRE_ID int 
	 
	)
	as begin set nocount on
	SELECT [COST_CENTRE_ID]
      ,[COST_CENTRE_NAME]
      ,[COMPANY_ID]
      ,[REMARKS]
      ,[STATUS_MASTER]
      ,[CREATED_BY]
  FROM [VMaster].[TBL_COST_CENTRE_MASTER] 
 WHERE COST_CENTRE_ID =@COST_CENTRE_ID 
 

	end
 
 

GO
/****** Object:  StoredProcedure [VMaster].[GET_COUNTRY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [VMaster].[GET_COUNTRY_MASTER](
	@Country_Id int 
  
 )
 as begin set nocount on
  
SELECT [Country_Id]
      ,[Country_Name]
      ,[nicename]
      ,[iso3]
      ,[numcode]
      ,[phonecode]
      ,[Batch_No]
      ,[Remarks]
      ,[Status_Master]
 
  FROM [VMaster].[tbl_country_master]
 WHERE Country_Id =@Country_Id 
 
	end
 
 

GO
/****** Object:  StoredProcedure [VMaster].[GET_CURRENCY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [VMaster].[GET_CURRENCY_MASTER]
(
    @CURRENCY_ID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        [CURRENCY_ID],
        [CURRENCY_NAME],
        [ADDRESS],
        [Exchange_Rate],
        [REMARKS],
        [STATUS_MASTER],
        [CREATED_BY]
    FROM [VMaster].[TBL_CURRENCY_MASTER]
    WHERE CURRENCY_ID = @CURRENCY_ID;
END
 
GO
/****** Object:  StoredProcedure [VMaster].[GET_DEPARTMENT_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [VMaster].[GET_DEPARTMENT_MASTER]
(
    @DEPARTMENT_ID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        [DEPARTMENT_ID],
        [DEPARTMENT_NAME],
        [REMARKS],
        [STATUS_MASTER],
        [CREATED_BY]
    FROM [VMaster].[TBL_DEPARTMENT_MASTER]
    WHERE DEPARTMENT_ID = @DEPARTMENT_ID;
END
GO
/****** Object:  StoredProcedure [VMaster].[GET_DESIGNATION_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [VMaster].[GET_DESIGNATION_MASTER]
(
    @DESIGNATION_ID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        [DESIGNATION_ID],
        [DESIGNATION_NAME],
        [REMARKS],
        [STATUS_MASTER],
        [CREATED_BY]
    FROM [VMaster].[TBL_DESIGNATION_MASTER]
    WHERE DESIGNATION_ID = @DESIGNATION_ID;
END
GO
/****** Object:  StoredProcedure [VMaster].[GET_DISTRICT_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[GET_DISTRICT_MASTER]
(
    @DISTRICT_ID INT
)
AS
BEGIN
    SET NOCOUNT ON

    SELECT
        District_id,
        Country_Id,
        Region_Id,
        District_Name,
        Total_Population,
        Zone_Name,
        Distance_From_Arusha,
        Status_Master,
        Created_By
    FROM [VMaster].[tbl_District_Master]
    WHERE District_id = @DISTRICT_ID;

END

GO
/****** Object:  StoredProcedure [VMaster].[GET_EXCHANGE_RATE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[GET_EXCHANGE_RATE_MASTER]
(
    @SNO INT
)
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        SNO,
        COMPANY_ID,
        MONTH_ENTERED,
        YEAR_ENTERED,
        DATE_OF_EXCHANGE,
        FROM_CURRENCY_ID,
        TO_CURRENCY_ID,
        EXCHANGE_RATE,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY
    FROM [VMaster].[TBL_EXCHANGE_RATE_MASTER]
    WHERE SNO = @SNO

END
 

GO
/****** Object:  StoredProcedure [VMaster].[GET_LICENSE_PERMIT_TYPE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[GET_LICENSE_PERMIT_TYPE_MASTER]
(
    @LICENSE_PERMIT_ID INT
)
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        LICENSE_PERMIT_ID,
        LICENSE_PERMIT_NAME,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY
    FROM [VMaster].[TBL_LICENSE_PERMIT_TYPE_MASTER]
    WHERE LICENSE_PERMIT_ID = @LICENSE_PERMIT_ID;

END
 

GO
/****** Object:  StoredProcedure [VMaster].[GET_PRICE_LIST_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 
CREATE PROCEDURE [VMaster].[GET_PRICE_LIST_MASTER]
(
    @PRICE_LIST_ID INT
)
AS
BEGIN
    SET NOCOUNT ON;

   
SELECT [PRICE_LIST_ID]
      ,[PRICE_TYPE_ID]

      ,[COMPANY_ID]
      ,[PRICE_PACKAGE_ID]
      ,[PER_DAY_OR_TRIP_OR_QTY_PRICE]
      ,[FOOD_LIMIT_AMOUNT]
      ,[DRINKS_LIMIT_AMOUNT]
      ,[ACCOMDATION_LIMIT_AMOUNT]
      ,[CURRENCY_ID]
      ,[EFFECTIVE_FROM]
      ,[EFFECTIVE_TO]
      ,[REQUESTED_BY]
      ,[REQUESTED_DATE]
      ,[SECTION_HEAD_RESPONSE_Person]
      ,[SECTION_HEAD_RESPONSE_DATE]
      ,[SECTION_HEAD_RESPONSE_STATUS]
      ,[SECTION_HEAD_RESPONSE_REMARKS]
      ,[RESPONSE_1_PERSON]
      ,[RESPONSE_1_DATE]
      ,[RESPONSE_1_STATUS]
      ,[RESPONSE_1_REMARKS]
      ,[RESPONSE_2_PERSON]
      ,[RESPONSE_2_DATE]
      ,[RESPONSE_2_STATUS]
      ,[RESPONSE_2_REMARKS]
      ,[FINAL_RESPONSE_PERSON]
      ,[FINAL_RESPONSE_DATE]
      ,[FINAL_RESPONSE_STATUS]
      ,[FINAL_RESPONSE_REMARKS]
      ,[REMARKS]
 
  FROM [VMaster].[TBL_PRICE_LIST_MASTER]
  
    WHERE PRICE_LIST_ID=@PRICE_LIST_ID

END
 
 
 
 

GO
/****** Object:  StoredProcedure [VMaster].[GET_PRICE_PACKAGE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[GET_PRICE_PACKAGE_MASTER]
(
    @PRICE_PACKAGE_ID INT
)
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        PRICE_PACKAGE_ID,
        PRICE_PACKAGE_TYPE,
        PRICE_PACKAGE_NAME,
        PRICE_PACKAGE_DAYS,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY
    FROM [VMaster].[TBL_PRICE_PACKAGE_MASTER]
    WHERE PRICE_PACKAGE_ID=@PRICE_PACKAGE_ID;

END
 

GO
/****** Object:  StoredProcedure [VMaster].[GET_PRICE_TYPE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[GET_PRICE_TYPE_MASTER]
(
    @PRICE_TYPE_ID INT
)
AS
BEGIN
    SET NOCOUNT ON;


    SELECT
        PRICE_TYPE_ID,
        PRICE_TYPE_NAME,
        PRICE_TYPE_DESCRIPTION,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY
    FROM [VMaster].[TBL_PRICE_TYPE_MASTER]
    WHERE PRICE_TYPE_ID = @PRICE_TYPE_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[GET_PRODUCT_MAIN_CATEGORY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[GET_PRODUCT_MAIN_CATEGORY_MASTER]
(
    @MAIN_CATEGORY_ID INT
)
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        MAIN_CATEGORY_ID,
        MAIN_CATEGORY_NAME,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY
    FROM [VMaster].[TBL_PRODUCT_MAIN_CATEGORY_MASTER]
    WHERE MAIN_CATEGORY_ID = @MAIN_CATEGORY_ID

END
 
GO
/****** Object:  StoredProcedure [VMaster].[GET_PRODUCT_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[GET_PRODUCT_MASTER]
(
    @PRODUCT_ID INT
)
AS
BEGIN
    SET NOCOUNT ON

    SELECT
        PRODUCT_ID,
        PRODUCT_NAME,
        TBS_PRODUCT_NAME,
        MAIN_CATEGORY_ID,
        SUB_CATEGORY_ID,
        UOM_ID,
        NO_OF_PCS_PER_PACKING,
        ALTERNATE_UOM_ID,
        COST_CENTRE_ID,
        COMPANY_ID,
        PRODUCTION_COST,
        VAT_PERCENTAGE,
        RESPONSE_1_PERSON,
        RESPONSE_1_DATE,
        RESPONSE_1_STATUS,
        RESPONSE_1_REMARKS,
        RESPONSE_2_PERSON,
        RESPONSE_2_DATE,
        RESPONSE_2_STATUS,
        RESPONSE_2_REMARKS,
        FINAL_RESPONSE_PERSON,
        FINAL_RESPONSE_DATE,
        FINAL_RESPONSE_STATUS,
        FINAL_RESPONSE_REMARKS,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY
    FROM [VMaster].[TBL_PRODUCT_MASTER]
    WHERE PRODUCT_ID=@PRODUCT_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[GET_PRODUCT_SUB_CATEGORY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[GET_PRODUCT_SUB_CATEGORY_MASTER]
(
    @SUB_CATEGORY_ID INT
)
AS
BEGIN
    SET NOCOUNT ON

    SELECT
        SUB_CATEGORY_ID,
        SUB_CATEGORY_NAME,
        MAIN_CATEGORY_ID,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY
    FROM [VMaster].[TBL_PRODUCT_SUB_CATEGORY_MASTER]
    WHERE SUB_CATEGORY_ID=@SUB_CATEGORY_ID;

END
 

GO
/****** Object:  StoredProcedure [VMaster].[GET_REGION_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[GET_REGION_MASTER]
(
    @REGION_ID INT
)
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        REGION_ID,
        REGION_NAME,
        COUNTRY_ID,
        CAPITAL,
        NO_OF_DISTRICTS,
        TOTAL_POPULATION,
        ZONE_NAME,
        DISTANCE_FROM_ARUSHA,
        STATUS_MASTER,
        CREATED_BY
    FROM [VMaster].[TBL_REGION_MASTER]
    WHERE REGION_ID=@REGION_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[GET_ROLE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[GET_ROLE_MASTER]
(
    @ROLE_ID INT
)
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        ROLE_ID,
        ROLE_NAME,
        ROLE_DESCRIPTION,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY
    FROM [VMaster].[TBL_ROLE_MASTER]
    WHERE ROLE_ID=@ROLE_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[GET_SALES_PACKAGE_TYPE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[GET_SALES_PACKAGE_TYPE_MASTER]
(
    @SALES_PACKAGE_TYPE_ID INT
)
AS
BEGIN
    SET NOCOUNT ON
    SELECT
        SALES_PACKAGE_TYPE_ID,
        SALES_PACKAGE_TYPE_NAME,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY
    FROM [VMaster].[TBL_SALES_PACKAGE_TYPE_MASTER]
    WHERE SALES_PACKAGE_TYPE_ID=@SALES_PACKAGE_TYPE_ID;

END
 

GO
/****** Object:  StoredProcedure [VMaster].[GET_STORE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[GET_STORE_MASTER]
(
    @STORE_ID INT
)
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        Store_Id,
        Store_Name,
        Store_Short_Name,
        Camp_Id,
        Manager_Name,
        Store_Short_Code,
        Email_Address,
        CC_Email_Address,
        BCC_Email_Address,
        Response_Directors_Name,
        Remarks,
        Status_Master,
        Created_By
    FROM [VMaster].[tbl_Store_Master]
    WHERE Store_Id=@STORE_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[GET_UOM_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[GET_UOM_MASTER]
(
 @UOM_ID INT
)
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        UOM_ID,
        UOM_NAME,
        KG_PER_UOM,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY
    FROM [VMaster].[TBL_UOM_MASTER]
    WHERE UOM_ID=@UOM_ID;

END
 

GO
/****** Object:  StoredProcedure [VMaster].[GET_USER_INFO_HDR]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[GET_USER_INFO_HDR]
(
@LOGIN_ID INT
)
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        LOGIN_ID,
        Emp_Id,
        LOGIN_NAME,
        PASSWORD,
        ROLE,
        MOBILE_NO,
        MAIL_ID,
        STOCK_SHOW_STATUS,
        OUTSIDE_ACCESS_Y_N,
        STATUS_MASTER,
        REMARKS,
        CREATED_USER
    FROM [VMaster].[TBL_USER_INFO_HDR]
    WHERE LOGIN_ID=@LOGIN_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[GET_USER_TO_STORE_MAPPING]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[GET_USER_TO_STORE_MAPPING]
(
    @USER_TO_STORE_ID INT
)
AS
BEGIN
    SET NOCOUNT ON;


    SELECT
        USER_TO_STORE_ID,
        LOGIN_ID,
        COMPANY_ID,
        CAMP_ID,
        STORE_ID,
        ROLE_ID,
        REMARKS,
        STATUS_MASTER,
        CREATED_USER
    FROM [VMaster].[TBL_USER_TO_STORE_MAPPING]
    WHERE USER_TO_STORE_ID=@USER_TO_STORE_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[SAVE_ANIMAL_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 
CREATE PROCEDURE [VMaster].[SAVE_ANIMAL_MASTER](
	@ANIMAL_ID  int ,
	@ANIMAL_NAME varchar(50) ,
	 
	@REMARKS varchar(1000) ,
	@STATUS_MASTER varchar(20) ,
	@USER varchar(50) ,
	@MAC_ADDRESS varchar(50) 
	) as begin set nocount on

	if exists (select 'check exists' from [VMaster].[TBL_ANIMAL_MASTER] where ANIMAL_NAME =@ANIMAL_NAME ) 
	begin
	select 'error','Animal Name Already Exists',''
	end
	else begin
INSERT INTO [VMaster].[TBL_ANIMAL_MASTER]
           ([ANIMAL_NAME]
           
           ,[REMARKS]
           ,[STATUS_MASTER]
           ,[CREATED_BY]
           ,[CREATED_DATE]
           ,[CREATED_MAC_ADDRESS]
           ,[MODIFIED_BY]
           ,[MODIFIED_DATE]
           ,[MODIFIED_MAC_ADDRESS])
     VALUES
           (@ANIMAL_NAME 
         
           ,@REMARKS
           ,@STATUS_MASTER 
           ,@User
           ,GETDATE ()
           ,@MAC_ADDRESS 
           ,@User 
           ,GETDATE ()
           ,@MAC_ADDRESS)

	select '','Data Saved Successfully',@ANIMAL_ID 

	end
	end
 

GO
/****** Object:  StoredProcedure [VMaster].[SAVE_CAMP_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 

CREATE PROCEDURE [VMaster].[SAVE_CAMP_MASTER](
	@CAMP_ID int  ,
	@CAMP_NAME varchar(50) ,
	@REMARKS varchar(1000) ,
	@STATUS_MASTER varchar(20) ,
	@USER varchar(50) ,
	@MAC_ADDRESS varchar(50) 
 
	)
 AS BEGIN SET NOCOUNT ON
 IF EXISTS (SELECT 'CHECK' FROM  [VMaster].[TBL_CAMP_MASTER] WHERE CAMP_NAME =@CAMP_NAME )
 BEGIN
 SELECT 'ERROR','Camp Name Already Exists',''
 END
 else begin
 
INSERT INTO [VMaster].[TBL_CAMP_MASTER]
           ([CAMP_NAME]
           ,[REMARKS]
           ,[STATUS_MASTER]
           ,[CREATED_BY]
           ,[CREATED_DATE]
           ,[CREATED_MAC_ADDRESS]
           ,[MODIFIED_BY]
           ,[MODIFIED_DATE]
           ,[MODIFIED_MAC_ADDRESS])
     VALUES
           (@CAMP_NAME
           ,@REMARKS
           ,@STATUS_MASTER 
           ,@USER
           ,GETDATE () 
           ,@MAC_ADDRESS
           ,@USER
           ,GETDATE ()
           ,@MAC_ADDRESS)
 
 SELECT '','Data Saved Successfully',@CAMP_ID 
end
 END 

GO
/****** Object:  StoredProcedure [VMaster].[SAVE_COMPANY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 

CREATE PROCEDURE [VMaster].[SAVE_COMPANY_MASTER](
	@COMPANY_ID int ,
	@COMPANY_NAME varchar(100) ,
	@COMPANY_FULL_NAME varchar(150) ,
	@TIN_NUMBER varchar(50) ,
	@VRN_NUMBER varchar(50) ,
	@ADDRESS varchar(2000) ,
	@CONTACT_PERSON varchar(50) ,
	@CONTACT_NUMBER varchar(50) ,
	@EMAIL varchar(50) ,
	@SHORT_CODE varchar(4) ,
	@FINANCE_START_MONTH varchar(50) ,
	@FINANCE_END_MONTH varchar(50) ,
	@YEAR_CODE varchar(50) ,
	@DEFAULT_CURRENCY_ID int ,
	@TIMEZONE varchar(50) ,
	@NO_OF_USER int ,
	@WEBSITE varchar(50) ,
	@COMP_BIG_LOGO varbinary(max) ,
	@COMP_SMALL_LOGO varbinary(max) ,
	@COMP_LETTER_HEAD varbinary(max) ,
	@COMP_STAMP_LOGO varbinary(max) ,
	@REMARKS varchar(2000) ,
	@STATUS_MASTER varchar(20) ,
	@USER varchar(50) ,
	@MAC_ADDRESS varchar(50) 
	
 	) as begin set nocount on
	if exists (select 'check exists' from VMaster.TBL_COMPANY_MASTER  where COMPANY_NAME  =@COMPANY_NAME ) 
	begin
	select 'error','Company Name Already Exists',''
	end
	else begin
	 
	 
INSERT INTO [VMaster].[TBL_COMPANY_MASTER]
           ([COMPANY_NAME]
           ,[COMPANY_FULL_NAME]
           ,[TIN_NUMBER]
           ,[VRN_NUMBER]
           ,[ADDRESS]
           ,[CONTACT_PERSON]
           ,[CONTACT_NUMBER]
           ,[EMAIL]
           ,[SHORT_CODE]
           ,[FINANCE_START_MONTH]
           ,[FINANCE_END_MONTH]
           ,[YEAR_CODE]
           ,[DEFAULT_CURRENCY_ID]
           ,[TIMEZONE]
           ,[NO_OF_USER]
           ,[WEBSITE]
           ,[COMP_BIG_LOGO]
           ,[COMP_SMALL_LOGO]
           ,[COMP_LETTER_HEAD]
           ,[COMP_STAMP_LOGO]
           ,[REMARKS]
           ,[STATUS_MASTER]
           ,[CREATED_BY]
           ,[CREATED_DATE]
           ,[CREATED_MAC_ADDRESS]
           ,[MODIFIED_BY]
           ,[MODIFIED_DATE]
           ,[MODIFIED_MAC_ADDRESS])
     VALUES
           (@COMPANY_NAME
           ,@COMPANY_FULL_NAME
           ,@TIN_NUMBER
           ,@VRN_NUMBER
           ,@ADDRESS
           ,@CONTACT_PERSON
           ,@CONTACT_NUMBER
           ,@EMAIL
           ,@SHORT_CODE
           ,@FINANCE_START_MONTH
           ,@FINANCE_END_MONTH
           ,@YEAR_CODE
           ,@DEFAULT_CURRENCY_ID
           ,@TIMEZONE
           ,@NO_OF_USER
           ,@WEBSITE
           ,@COMP_BIG_LOGO
           ,@COMP_SMALL_LOGO
           ,@COMP_LETTER_HEAD
           ,@COMP_STAMP_LOGO
           ,@REMARKS
           ,@STATUS_MASTER 
           ,@USER
           ,getdate()
           ,@MAC_ADDRESS
           ,@USER 
           ,GETDATE ()
           ,@MAC_ADDRESS)

	select '','Data Saved Successfully',@COMPANY_ID  

	end
	end


GO
/****** Object:  StoredProcedure [VMaster].[SAVE_COST_CENTRE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/****** Object:  StoredProcedure VMaster.SAVE_ANIMAL_MASTER    Script Date: 7/22/2026 11:09:18 AM ******/

CREATE PROCEDURE [VMaster].[SAVE_COST_CENTRE_MASTER](
	@COST_CENTRE_ID int ,
	@COST_CENTRE_NAME varchar(50) ,
	@COMPANY_ID int ,
	@REMARKS varchar(2000) ,
	@STATUS_MASTER varchar(20) ,
	@USER varchar(50) ,
	@MAC_ADDRESS varchar(50) 
	)
	as begin set nocount on

	if exists (select 'check exists' from VMaster.TBL_COST_CENTRE_MASTER  where COST_CENTRE_NAME  =@COST_CENTRE_NAME ) 
	begin
	select 'error','Cost Name Already Exists',''
	end
	else begin
	 
	 
INSERT INTO [VMaster].[TBL_COST_CENTRE_MASTER]
           ([COST_CENTRE_NAME]
           ,[COMPANY_ID]
           ,[REMARKS]
           ,[STATUS_MASTER]
           ,[CREATED_BY]
           ,[CREATED_DATE]
           ,[CREATED_MAC_ADDRESS]
           ,[MODIFIED_BY]
           ,[MODIFIED_DATE]
           ,[MODIFIED_MAC_ADDRESS])
     VALUES
           (@COST_CENTRE_NAME
           ,@COMPANY_ID
           ,@REMARKS
           ,@STATUS_MASTER
           ,@USER
           ,GETDATE ()
           ,@MAC_ADDRESS
           ,@USER
           ,GETDATE ()
           ,@MAC_ADDRESS
           )

	select '','Data Saved Successfully',@COST_CENTRE_ID  

	end
	end
 

GO
/****** Object:  StoredProcedure [VMaster].[SAVE_COUNTRY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [VMaster].[SAVE_COUNTRY_MASTER](
	@Country_Id int ,
	@Country_Name varchar(100) ,
	@nicename varchar(80) ,
	@iso3 varchar(50) ,
	@numcode int ,
	@phonecode int ,
	@Batch_No varchar(2) ,
	@Remarks varchar(1000) ,
	@Status_Master varchar(50) ,
	@User varchar(50) ,
	@Mac_Address varchar(50) 
 )
 as begin set nocount on

	if exists (select 'check exists' from VMaster.tbl_country_master  where Country_Name  =@Country_Name ) 
	begin
	select 'error','Country Name Already Exists',''
	end
	else begin
	 
INSERT INTO [VMaster].[tbl_country_master]
           ([Country_Name]
           ,[nicename]
           ,[iso3]
           ,[numcode]
           ,[phonecode]
           ,[Batch_No]
           ,[Remarks]
           ,[Status_Master]
           ,[Created_User]
           ,[Created_Date]
           ,[Created_Mac_Address]
           ,[Modified_User]
           ,[Modified_Date]
           ,[Modified_Mac_Address])
     VALUES
           (@Country_Name 
           ,@nicename 
           ,@iso3 
           ,@numcode 
           ,@phonecode 
           ,@Batch_No 
           ,@Remarks 
           ,@Status_Master 
           ,@User
           ,GETDATE ()
           ,@Mac_Address 
           ,@User
           ,GETDATE ()
           ,@Mac_Address 
       )

	select '','Data Saved Successfully',@Country_Id  

	end
	end
 

GO
/****** Object:  StoredProcedure [VMaster].[SAVE_CURRENCY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SAVE_CURRENCY_MASTER]
(
    @CURRENCY_ID INT,
    @CURRENCY_NAME VARCHAR(50),
    @ADDRESS VARCHAR(50),
    @EXCHANGE_RATE DECIMAL(15,5),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON 
    IF EXISTS   (   SELECT 'CHECK'   FROM [VMaster].[TBL_CURRENCY_MASTER]
        WHERE CURRENCY_NAME = @CURRENCY_NAME          
    )
    BEGIN
        SELECT 'error', 'Currency Name Already Exists', ''
    END
    ELSE    BEGIN
       
            INSERT INTO [VMaster].[TBL_CURRENCY_MASTER]
            (
                CURRENCY_NAME,
                ADDRESS,
                Exchange_Rate,
                REMARKS,
                STATUS_MASTER,
                CREATED_BY,
                CREATED_DATE,
                CREATED_MAC_ADDRESS,
                MODIFIED_BY,
                MODIFIED_DATE,
                MODIFIED_MAC_ADDRESS
            )
            VALUES
            (
                @CURRENCY_NAME,
                @ADDRESS,
                @EXCHANGE_RATE,
                @REMARKS,
                @STATUS_MASTER,
                @USER,
                GETDATE(),
                @MAC_ADDRESS,
                @USER,
                GETDATE(),
                @MAC_ADDRESS
            )

            SELECT '', 'Data Saved Successfully',@CURRENCY_ID
        END
		END
	 
GO
/****** Object:  StoredProcedure [VMaster].[SAVE_DEPARTMENT_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SAVE_DEPARTMENT_MASTER]
(
    @DEPARTMENT_ID INT,
    @DEPARTMENT_NAME VARCHAR(50),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS    (
        SELECT 'check exists'
        FROM [VMaster].[TBL_DEPARTMENT_MASTER]
        WHERE DEPARTMENT_NAME = @DEPARTMENT_NAME
    )
    BEGIN
        SELECT 'error','Department Name Already Exists','';
    END
    ELSE
    BEGIN
        INSERT INTO [VMaster].[TBL_DEPARTMENT_MASTER]
        (
            DEPARTMENT_NAME,
            REMARKS,
            STATUS_MASTER,
            CREATED_BY,
            CREATED_DATE,
            CREATED_MAC_ADDRESS,
            MODIFIED_BY,
            MODIFIED_DATE,
            MODIFIED_MAC_ADDRESS
        )
        VALUES
        (
            @DEPARTMENT_NAME,
            @REMARKS,
            @STATUS_MASTER,
            @USER,
            GETDATE(),
            @MAC_ADDRESS,
            @USER,
            GETDATE(),
            @MAC_ADDRESS
        )

        SELECT '','Data Saved Successfully',@DEPARTMENT_ID;
    END
END

GO
/****** Object:  StoredProcedure [VMaster].[SAVE_DESIGNATION_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SAVE_DESIGNATION_MASTER]
(
    @DESIGNATION_ID INT,
    @DESIGNATION_NAME VARCHAR(50),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS (SELECT 'check exists' FROM [VMaster].[TBL_DESIGNATION_MASTER]
        WHERE DESIGNATION_NAME = @DESIGNATION_NAME
    )
    BEGIN
        SELECT 'error','Designation Name Already Exists','';
    END
    ELSE
    BEGIN
        INSERT INTO [VMaster].[TBL_DESIGNATION_MASTER]
        (
            DESIGNATION_NAME,
            REMARKS,
            STATUS_MASTER,
            CREATED_BY,
            CREATED_DATE,
            CREATED_MAC_ADDRESS,
            MODIFIED_BY,
            MODIFIED_DATE,
            MODIFIED_MAC_ADDRESS
        )
        VALUES
        (
            @DESIGNATION_NAME,
            @REMARKS,
            @STATUS_MASTER,
            @USER,
            GETDATE(),
            @MAC_ADDRESS,
            @USER,
            GETDATE(),
            @MAC_ADDRESS
        )

        SELECT '','Data Saved Successfully',@DESIGNATION_ID;
    END
END

GO
/****** Object:  StoredProcedure [VMaster].[SAVE_DISTRICT_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SAVE_DISTRICT_MASTER]
(
    @DISTRICT_ID INT,
    @COUNTRY_ID INT,
    @REGION_ID INT,
    @DISTRICT_NAME VARCHAR(50),
    @TOTAL_POPULATION DECIMAL(18,2),
    @ZONE_NAME VARCHAR(50),
    @DISTANCE_FROM_ARUSHA DECIMAL(18,2),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS  ( SELECT 'CHECK EXISTS' FROM [VMaster].[tbl_District_Master]    
	WHERE UPPER(District_Name) = UPPER(@DISTRICT_NAME)
    )
    BEGIN
        SELECT 'error','District Name Already Exists',''
    END

    INSERT INTO [VMaster].[tbl_District_Master]
    (
        Country_Id,
        Region_Id,
        District_Name,
        Total_Population,
        Zone_Name,
        Distance_From_Arusha,
        Status_Master,
        Created_By,
        Created_Date,
        Created_Mac_Address,
        Modified_By,
        Modified_Date,
        Modified_Mac_Address
    )
    VALUES
    (
        @COUNTRY_ID,
        @REGION_ID,
        @DISTRICT_NAME,
        @TOTAL_POPULATION,
        @ZONE_NAME,
        @DISTANCE_FROM_ARUSHA,
        @STATUS_MASTER,
        @USER,
        GETDATE(),
        @MAC_ADDRESS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS
    )

    SELECT '', 'Data Saved Successfully', @COUNTRY_ID 
END

GO
/****** Object:  StoredProcedure [VMaster].[SAVE_EXCHANGE_RATE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SAVE_EXCHANGE_RATE_MASTER]
(
    @SNO INT,
    @COMPANY_ID INT,
    @MONTH_ENTERED VARCHAR(50),
    @YEAR_ENTERED VARCHAR(20),
    @DATE_OF_EXCHANGE DATETIME,
    @FROM_CURRENCY_ID INT,
    @TO_CURRENCY_ID INT,
    @EXCHANGE_RATE DECIMAL(15,5),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS ( SELECT 'CHECK' FROM [VMaster].[TBL_EXCHANGE_RATE_MASTER]
        WHERE COMPANY_ID = @COMPANY_ID AND MONTH_ENTERED = @MONTH_ENTERED
        AND YEAR_ENTERED = @YEAR_ENTERED AND FROM_CURRENCY_ID = @FROM_CURRENCY_ID
        AND TO_CURRENCY_ID = @TO_CURRENCY_ID
    )
    BEGIN
        SELECT 'error','Exchange Rate Already Exists For This Period',''
      
    END
	ELSE BEGIN

    INSERT INTO [VMaster].[TBL_EXCHANGE_RATE_MASTER]
    (
        COMPANY_ID,
        MONTH_ENTERED,
        YEAR_ENTERED,
        DATE_OF_EXCHANGE,
        FROM_CURRENCY_ID,
        TO_CURRENCY_ID,
        EXCHANGE_RATE,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY,
        CREATED_DATE,
        CREATED_MAC_ADDRESS,
        MODIFIED_BY,
        MODIFIED_DATE,
        MODIFIED_MAC_ADDRESS
    )
    VALUES
    (
        @COMPANY_ID,
        @MONTH_ENTERED,
        @YEAR_ENTERED,
        @DATE_OF_EXCHANGE,
        @FROM_CURRENCY_ID,
        @TO_CURRENCY_ID,
        @EXCHANGE_RATE,
        @REMARKS,
        @STATUS_MASTER,
        @USER,
        GETDATE(),
        @MAC_ADDRESS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS
    )

SELECT '', 'Data Saved Successfully', @COMPANY_ID 

END
 END
GO
/****** Object:  StoredProcedure [VMaster].[SAVE_LICENSE_PERMIT_TYPE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 
 CREATE PROCEDURE [VMaster].[SAVE_LICENSE_PERMIT_TYPE_MASTER]
(
    @LICENSE_PERMIT_ID INT,
    @LICENSE_PERMIT_NAME VARCHAR(50),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS
    (
        SELECT 'CHECK'  FROM [VMaster].[TBL_LICENSE_PERMIT_TYPE_MASTER]
        WHERE UPPER(LICENSE_PERMIT_NAME) = UPPER(@LICENSE_PERMIT_NAME)
    )
    BEGIN
        SELECT 'error','License Permit Name Already Exists',''
    
    END

	ELSE BEGIN
    INSERT INTO [VMaster].[TBL_LICENSE_PERMIT_TYPE_MASTER]
    (
        LICENSE_PERMIT_NAME,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY,
        CREATED_DATE,
        CREATED_MAC_ADDRESS,
        MODIFIED_BY,
        MODIFIED_DATE,
        MODIFIED_MAC_ADDRESS
    )
    VALUES
    (
        @LICENSE_PERMIT_NAME,
        @REMARKS,
        @STATUS_MASTER,
        @USER,
        GETDATE(),
        @MAC_ADDRESS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS
    )


    SELECT '', 'Data Saved Successfully', @LICENSE_PERMIT_ID 

END
END
 

GO
/****** Object:  StoredProcedure [VMaster].[SAVE_PRICE_LIST_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SAVE_PRICE_LIST_MASTER]
(
    @PRICE_LIST_ID INT,
    @PRICE_TYPE_ID INT,
    @COMPANY_ID INT,
    @PRICE_PACKAGE_ID INT,
    @PER_DAY_OR_TRIP_OR_QTY_PRICE DECIMAL(15,2),
    @FOOD_LIMIT_AMOUNT DECIMAL(15,2),
    @DRINKS_LIMIT_AMOUNT DECIMAL(15,2),
    @ACCOMDATION_LIMIT_AMOUNT DECIMAL(15,2),
    @CURRENCY_ID INT,
    @EFFECTIVE_FROM DATETIME,
    @EFFECTIVE_TO DATETIME,
    @REQUESTED_BY VARCHAR(50),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 'CHECK'
        FROM [VMaster].[TBL_PRICE_LIST_MASTER]
        WHERE  
          COMPANY_ID=@COMPANY_ID  AND PRICE_TYPE_ID=@PRICE_TYPE_ID
    )
    BEGIN
        SELECT 'error','Price List Already Exists',''
    END

	ELSE BEGIN
    INSERT INTO [VMaster].[TBL_PRICE_LIST_MASTER]
    (
        PRICE_TYPE_ID,
         
        COMPANY_ID,
        PRICE_PACKAGE_ID,
        PER_DAY_OR_TRIP_OR_QTY_PRICE,
        FOOD_LIMIT_AMOUNT,
        DRINKS_LIMIT_AMOUNT,
        ACCOMDATION_LIMIT_AMOUNT,
        CURRENCY_ID,
        EFFECTIVE_FROM,
        EFFECTIVE_TO,
        REQUESTED_BY,
        REQUESTED_DATE,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY,
        CREATED_DATE,
        CREATED_MAC_ADDRESS,
        MODIFIED_BY,
        MODIFIED_DATE,
        MODIFIED_MAC_ADDRESS
    )
    VALUES
    (
        @PRICE_TYPE_ID,
        @COMPANY_ID,
        @PRICE_PACKAGE_ID,
        @PER_DAY_OR_TRIP_OR_QTY_PRICE,
        @FOOD_LIMIT_AMOUNT,
        @DRINKS_LIMIT_AMOUNT,
        @ACCOMDATION_LIMIT_AMOUNT,
        @CURRENCY_ID,
        @EFFECTIVE_FROM,
        @EFFECTIVE_TO,
        @REQUESTED_BY,
        GETDATE(),
        @REMARKS,
        @STATUS_MASTER,
        @USER,
        GETDATE(),
        @MAC_ADDRESS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS
    )


    SELECT '', 'Data Saved Successfully',@PRICE_LIST_ID 
END
END
 
GO
/****** Object:  StoredProcedure [VMaster].[SAVE_PRICE_PACKAGE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SAVE_PRICE_PACKAGE_MASTER]
(
    @PRICE_PACKAGE_ID INT,
    @PRICE_PACKAGE_TYPE VARCHAR(50),
    @PRICE_PACKAGE_NAME VARCHAR(50),
    @PRICE_PACKAGE_DAYS INT,
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS
    (
        SELECT 'CHECK EXISTS'
        FROM [VMaster].[TBL_PRICE_PACKAGE_MASTER]
        WHERE UPPER(PRICE_PACKAGE_NAME)=UPPER(@PRICE_PACKAGE_NAME)
    )
    BEGIN
        SELECT 'error','Price Package Name Already Exists',''
 
    END
	ELSE BEGIN
	
    INSERT INTO [VMaster].[TBL_PRICE_PACKAGE_MASTER]
    (
        PRICE_PACKAGE_TYPE,
        PRICE_PACKAGE_NAME,
        PRICE_PACKAGE_DAYS,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY,
        CREATED_DATE,
        CREATED_MAC_ADDRESS,
        MODIFIED_BY,
        MODIFIED_DATE,
        MODIFIED_MAC_ADDRESS
    )
    VALUES
    (
        @PRICE_PACKAGE_TYPE,
        @PRICE_PACKAGE_NAME,
        @PRICE_PACKAGE_DAYS,
        @REMARKS,
        @STATUS_MASTER,
        @USER,
        GETDATE(),
        @MAC_ADDRESS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS
    )


    SELECT '', 'Data Saved Successfully',@PRICE_PACKAGE_ID 

END
END


GO
/****** Object:  StoredProcedure [VMaster].[SAVE_PRICE_TYPE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SAVE_PRICE_TYPE_MASTER]
(
    @PRICE_TYPE_ID INT,
    @PRICE_TYPE_NAME VARCHAR(50),
    @PRICE_TYPE_DESCRIPTION VARCHAR(50),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS  (  SELECT 'CHECK EXISTS'
        FROM [VMaster].[TBL_PRICE_TYPE_MASTER] WHERE UPPER(PRICE_TYPE_NAME)=UPPER(@PRICE_TYPE_NAME)
    )
    BEGIN
        SELECT 'error','Price Type Name Already Exists',''
     
    END
	ELSE BEGIN

    INSERT INTO [VMaster].[TBL_PRICE_TYPE_MASTER]
    (
        PRICE_TYPE_NAME,
        PRICE_TYPE_DESCRIPTION,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY,
        CREATED_DATE,
        CREATED_MAC_ADDRESS,
        MODIFIED_BY,
        MODIFIED_DATE,
        MODIFIED_MAC_ADDRESS
    )
    VALUES
    (
        @PRICE_TYPE_NAME,
        @PRICE_TYPE_DESCRIPTION,
        @REMARKS,
        @STATUS_MASTER,
        @USER,
        GETDATE(),
        @MAC_ADDRESS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS
    )


    SELECT '', 'Data Saved Successfully', @PRICE_TYPE_ID 

END
END
GO
/****** Object:  StoredProcedure [VMaster].[SAVE_PRODUCT_MAIN_CATEGORY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SAVE_PRODUCT_MAIN_CATEGORY_MASTER]
(
    @MAIN_CATEGORY_ID INT,
    @MAIN_CATEGORY_NAME VARCHAR(100),
    @REMARKS VARCHAR(2000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS (
        SELECT 'CHECK'
        FROM [VMaster].[TBL_PRODUCT_MAIN_CATEGORY_MASTER]
        WHERE UPPER(MAIN_CATEGORY_NAME)=UPPER(@MAIN_CATEGORY_NAME)
    )
    BEGIN
        SELECT 'error','Main Category Name Already Exists',''
   
    END
   ELSE BEGIN

    INSERT INTO [VMaster].[TBL_PRODUCT_MAIN_CATEGORY_MASTER]
    (
        MAIN_CATEGORY_NAME,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY,
        CREATED_DATE,
        CREATED_MAC_ADDRESS,
        MODIFIED_BY,
        MODIFIED_DATE,
        MODIFIED_MAC_ADDRESS
    )
    VALUES
    (
        @MAIN_CATEGORY_NAME,
        @REMARKS,
        @STATUS_MASTER,
        @USER,
        GETDATE(),
        @MAC_ADDRESS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS
    )


    SELECT '', 'Data Saved Successfully', @MAIN_CATEGORY_ID 

END
 END
GO
/****** Object:  StoredProcedure [VMaster].[SAVE_PRODUCT_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SAVE_PRODUCT_MASTER]
(
    @PRODUCT_ID INT,
    @PRODUCT_NAME VARCHAR(1500),
    @TBS_PRODUCT_NAME VARCHAR(MAX),
    @MAIN_CATEGORY_ID INT,
    @SUB_CATEGORY_ID INT,
    @UOM_ID INT,
    @NO_OF_PCS_PER_PACKING DECIMAL(15,2),
    @ALTERNATE_UOM_ID INT,
    @COST_CENTRE_ID INT,
    @COMPANY_ID INT,
    @PRODUCTION_COST DECIMAL(15,2),
    @VAT_PERCENTAGE DECIMAL(15,2),
    @REMARKS VARCHAR(2000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS   (
        SELECT 'CHECK EXISTS' FROM [VMaster].[TBL_PRODUCT_MASTER]  WHERE UPPER(PRODUCT_NAME)=UPPER(@PRODUCT_NAME)  AND COMPANY_ID=@COMPANY_ID
    )
    BEGIN
        SELECT 'error','Product Name Already Exists',''
   
    END
	ELSE BEGIN

    INSERT INTO [VMaster].[TBL_PRODUCT_MASTER]
    (
        PRODUCT_NAME,
        TBS_PRODUCT_NAME,
        MAIN_CATEGORY_ID,
        SUB_CATEGORY_ID,
        UOM_ID,
        NO_OF_PCS_PER_PACKING,
        ALTERNATE_UOM_ID,
        COST_CENTRE_ID,
        COMPANY_ID,
        PRODUCTION_COST,
        VAT_PERCENTAGE,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY,
        CREATED_DATE,
        CREATED_MAC_ADDRESS,
        MODIFIED_BY,
        MODIFIED_DATE,
        MODIFIED_MAC_ADDRESS
    )
    VALUES
    (
        @PRODUCT_NAME,
        @TBS_PRODUCT_NAME,
        @MAIN_CATEGORY_ID,
        @SUB_CATEGORY_ID,
        @UOM_ID,
        @NO_OF_PCS_PER_PACKING,
        @ALTERNATE_UOM_ID,
        @COST_CENTRE_ID,
        @COMPANY_ID,
        @PRODUCTION_COST,
        @VAT_PERCENTAGE,
        @REMARKS,
        @STATUS_MASTER,
        @USER,
        GETDATE(),
        @MAC_ADDRESS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS
    )


    SELECT '', 'Data Saved Successfully',@PRODUCT_ID 

END
 END

GO
/****** Object:  StoredProcedure [VMaster].[SAVE_PRODUCT_SUB_CATEGORY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SAVE_PRODUCT_SUB_CATEGORY_MASTER]
(
    @SUB_CATEGORY_ID INT,
    @SUB_CATEGORY_NAME VARCHAR(50),
    @MAIN_CATEGORY_ID INT,
    @REMARKS VARCHAR(2000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS
    (
        SELECT 'CHECK'
        FROM [VMaster].[TBL_PRODUCT_SUB_CATEGORY_MASTER]
        WHERE UPPER(SUB_CATEGORY_NAME)=UPPER(@SUB_CATEGORY_NAME)
    )
    BEGIN
        SELECT 'error','Sub Category Name Already Exists',''
       
    END
	ELSE BEGIN

    INSERT INTO [VMaster].[TBL_PRODUCT_SUB_CATEGORY_MASTER]
    (
        SUB_CATEGORY_NAME,
        MAIN_CATEGORY_ID,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY,
        CREATED_DATE,
        CREATED_MAC_ADDRESS,
        MODIFIED_BY,
        MODIFIED_DATE,
        MODIFIED_MAC_ADDRESS
    )
    VALUES
    (
        @SUB_CATEGORY_NAME,
        @MAIN_CATEGORY_ID,
        @REMARKS,
        @STATUS_MASTER,
        @USER,
        GETDATE(),
        @MAC_ADDRESS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS
    )


    SELECT '', 'Data Saved Successfully',@SUB_CATEGORY_ID 

END
END

GO
/****** Object:  StoredProcedure [VMaster].[SAVE_REGION_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SAVE_REGION_MASTER]
(
    @REGION_ID INT,
    @REGION_NAME VARCHAR(50),
    @COUNTRY_ID INT,
    @CAPITAL VARCHAR(50),
    @NO_OF_DISTRICTS INT,
    @TOTAL_POPULATION DECIMAL(18,2),
    @ZONE_NAME VARCHAR(50),
    @DISTANCE_FROM_ARUSHA DECIMAL(18,2),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS
    (
        SELECT 'CHECK EXISTS'
        FROM [VMaster].[TBL_REGION_MASTER]
        WHERE UPPER(REGION_NAME)=UPPER(@REGION_NAME)        
    )
    BEGIN
        SELECT 'error','Region Name Already Exists',''
    
    END

	ELSE BEGIN
    INSERT INTO [VMaster].[TBL_REGION_MASTER]
    (
        REGION_NAME,
        COUNTRY_ID,
        CAPITAL,
        NO_OF_DISTRICTS,
        TOTAL_POPULATION,
        ZONE_NAME,
        DISTANCE_FROM_ARUSHA,
        STATUS_MASTER,
        CREATED_BY,
        CREATED_DATE,
        CREATED_MAC_ADDRESS,
        MODIFIED_BY,
        MODIFIED_DATE,
        MODIFIED_MAC_ADDRESS
    )
    VALUES
    (
        @REGION_NAME,
        @COUNTRY_ID,
        @CAPITAL,
        @NO_OF_DISTRICTS,
        @TOTAL_POPULATION,
        @ZONE_NAME,
        @DISTANCE_FROM_ARUSHA,
        @STATUS_MASTER,
        @USER,
        GETDATE(),
        @MAC_ADDRESS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS
    )


    SELECT '', 'Data Saved Successfully', @REGION_ID 
END
END

ALTER PROCEDURE [VMaster].[SAVE_ROLE_MASTER]
(
    @ROLE_NAME VARCHAR(50),
    @ROLE_DESCRIPTION VARCHAR(50),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS
    (
        SELECT 1
        FROM [VMaster].[TBL_ROLE_MASTER]
        WHERE UPPER(ROLE_NAME) = UPPER(@ROLE_NAME)
    )
    BEGIN
        SELECT
            'error' AS STATUS,
            'Role Name Already Exists' AS MESSAGE,
            NULL AS DATA;
        RETURN;
    END;

    INSERT INTO [VMaster].[TBL_ROLE_MASTER]
    (
        ROLE_NAME,
        ROLE_DESCRIPTION,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY,
        CREATED_DATE,
        CREATED_MAC_ADDRESS,
        MODIFIED_BY,
        MODIFIED_DATE,
        MODIFIED_MAC_ADDRESS
    )
    VALUES
    (
        @ROLE_NAME,
        @ROLE_DESCRIPTION,
        @REMARKS,
        @STATUS_MASTER,
        @USER,
        GETDATE(),
        @MAC_ADDRESS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS
    );

    DECLARE @NEW_ROLE_ID INT = SCOPE_IDENTITY();

    SELECT
        '' AS STATUS,
        'Data Saved Successfully' AS MESSAGE,
        @NEW_ROLE_ID AS DATA;
END;
 

GO
/****** Object:  StoredProcedure [VMaster].[SAVE_SALES_PACKAGE_TYPE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SAVE_SALES_PACKAGE_TYPE_MASTER]
(
    @SALES_PACKAGE_TYPE_ID INT,
    @SALES_PACKAGE_TYPE_NAME VARCHAR(50),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS
    (
        SELECT 'check'
        FROM [VMaster].[TBL_SALES_PACKAGE_TYPE_MASTER]
        WHERE UPPER(SALES_PACKAGE_TYPE_NAME)=UPPER(@SALES_PACKAGE_TYPE_NAME)
    )
    BEGIN
        SELECT 'error','Sales Package Type Name Already Exists',''
 
    END

	ELSE BEGIN
    INSERT INTO [VMaster].[TBL_SALES_PACKAGE_TYPE_MASTER]
    (
        SALES_PACKAGE_TYPE_NAME,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY,
        CREATED_DATE,
        CREATED_MAC_ADDRESS,
        MODIFIED_BY,
        MODIFIED_DATE,
        MODIFIED_MAC_ADDRESS
    )
    VALUES
    (
        @SALES_PACKAGE_TYPE_NAME,
        @REMARKS,
        @STATUS_MASTER,
        @USER,
        GETDATE(),
        @MAC_ADDRESS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS
    )


    SELECT '', 'Data Saved Successfully',@SALES_PACKAGE_TYPE_ID 

END
END

GO
/****** Object:  StoredProcedure [VMaster].[SAVE_STORE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SAVE_STORE_MASTER]
(
    @STORE_ID INT,
    @STORE_NAME VARCHAR(100),
    @STORE_SHORT_NAME VARCHAR(50),
    @CAMP_ID INT,
    @MANAGER_NAME VARCHAR(50),
    @STORE_SHORT_CODE VARCHAR(5),
    @EMAIL_ADDRESS VARCHAR(1000),
    @CC_EMAIL_ADDRESS VARCHAR(MAX),
    @BCC_EMAIL_ADDRESS VARCHAR(50),
    @RESPONSE_DIRECTORS_NAME VARCHAR(1000),
    @REMARKS VARCHAR(2000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS
    (
        SELECT 'CHECK EXISTS'
        FROM [VMaster].[tbl_Store_Master]
        WHERE UPPER(Store_Name)=UPPER(@STORE_NAME)
    )
    BEGIN
        SELECT 'error','Store Name Already Exists',''
        
    END
	ELSE BEGIN

    INSERT INTO [VMaster].[tbl_Store_Master]
    (
        Store_Name,
        Store_Short_Name,
        Camp_Id,
        Manager_Name,
        Store_Short_Code,
        Email_Address,
        CC_Email_Address,
        BCC_Email_Address,
        Response_Directors_Name,
        Remarks,
        Status_Master,
        Created_By,
        Created_Date,
        Created_Mac_Address,
        Modified_By,
        Modified_Date,
        Modified_Mac_Address
    )
    VALUES
    (
        @STORE_NAME,
        @STORE_SHORT_NAME,
        @CAMP_ID,
        @MANAGER_NAME,
        @STORE_SHORT_CODE,
        @EMAIL_ADDRESS,
        @CC_EMAIL_ADDRESS,
        @BCC_EMAIL_ADDRESS,
        @RESPONSE_DIRECTORS_NAME,
        @REMARKS,
        @STATUS_MASTER,
        @USER,
        GETDATE(),
        @MAC_ADDRESS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS
    )


    SELECT '', 'Data Saved Successfully',@STORE_ID 

END
END
 
GO
/****** Object:  StoredProcedure [VMaster].[SAVE_UOM_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SAVE_UOM_MASTER]
(
    @UOM_ID INT,
    @UOM_NAME VARCHAR(50),
    @KG_PER_UOM DECIMAL(15,2),
    @REMARKS VARCHAR(2000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS
    (
        SELECT 'CHECK EXISTS'
        FROM [VMaster].[TBL_UOM_MASTER]
        WHERE UPPER(UOM_NAME)=UPPER(@UOM_NAME)
    )
    BEGIN
        SELECT 'error','UOM Name Already Exists',''
  
    END
	ELSE BEGIN

    INSERT INTO [VMaster].[TBL_UOM_MASTER]
    (
        UOM_NAME,
        KG_PER_UOM,
        REMARKS,
        STATUS_MASTER,
        CREATED_BY,
        CREATED_DATE,
        CREATED_MAC_ADDRESS,
        MODIFIED_BY,
        MODIFIED_DATE,
        MODIFIED_MAC_ADDRESS
    )
    VALUES
    (
        @UOM_NAME,
        @KG_PER_UOM,
        @REMARKS,
        @STATUS_MASTER,
        @USER,
        GETDATE(),
        @MAC_ADDRESS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS
    );


    SELECT '', 'Data Saved Successfully', @UOM_ID

END
END
 

GO
/****** Object:  StoredProcedure [VMaster].[SAVE_USER_INFO_HDR]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SAVE_USER_INFO_HDR]
(
    @LOGIN_ID INT,
    @EMP_ID INT,
    @LOGIN_NAME VARCHAR(50),
    @PASSWORD VARCHAR(100),
    @ROLE VARCHAR(100),
    @MOBILE_NO VARCHAR(30),
    @MAIL_ID VARCHAR(150),
    @STOCK_SHOW_STATUS VARCHAR(10),
    @OUTSIDE_ACCESS_Y_N VARCHAR(20),
    @STATUS_MASTER VARCHAR(20),
    @REMARKS VARCHAR(1000),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;


    IF EXISTS
    (
        SELECT 'CHECK EXISTS'
        FROM [VMaster].[TBL_USER_INFO_HDR]
        WHERE UPPER(LOGIN_NAME)=UPPER(@LOGIN_NAME)
    )
    BEGIN
        SELECT 'error','Login Name Already Exists',''
      
    END
	ELSE BEGIN

    INSERT INTO [VMaster].[TBL_USER_INFO_HDR]
    (
        Emp_Id,
        LOGIN_NAME,
        PASSWORD,
        ROLE,
        MOBILE_NO,
        MAIL_ID,
        STOCK_SHOW_STATUS,
        OUTSIDE_ACCESS_Y_N,
        STATUS_MASTER,
        REMARKS,
        CREATED_USER,
        CREATED_DATE,
        CREATED_MAC_ADDR,
        MODIFIED_USER,
        MODIFIED_DATE,
        MODIFIED_MAC_ADDR
    )
    VALUES
    (
        @EMP_ID,
        @LOGIN_NAME,
        @PASSWORD,
        @ROLE,
        @MOBILE_NO,
        @MAIL_ID,
        @STOCK_SHOW_STATUS,
        @OUTSIDE_ACCESS_Y_N,
        @STATUS_MASTER,
        @REMARKS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS
    )


    SELECT '', 'Data Saved Successfully', @EMP_ID 
END
END
 

GO
/****** Object:  StoredProcedure [VMaster].[SAVE_USER_TO_STORE_MAPPING]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SAVE_USER_TO_STORE_MAPPING]
(
    @USER_TO_STORE_ID INT,
    @LOGIN_ID INT,
    @COMPANY_ID INT,
    @CAMP_ID INT,
    @STORE_ID INT,
    @ROLE_ID INT,
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS   ( SELECT 'check exists'
        FROM [VMaster].[TBL_USER_TO_STORE_MAPPING]
        WHERE LOGIN_ID=@LOGIN_ID   AND COMPANY_ID=@COMPANY_ID  AND CAMP_ID=@CAMP_ID AND STORE_ID=@STORE_ID
    )
    BEGIN
        SELECT 'error','User Store Mapping Already Exists',''
    END

	ELSE BEGIN
    INSERT INTO [VMaster].[TBL_USER_TO_STORE_MAPPING]
    (
        LOGIN_ID,
        COMPANY_ID,
        CAMP_ID,
        STORE_ID,
        ROLE_ID,
        REMARKS,
        STATUS_MASTER,
        CREATED_USER,
        CREATED_DATE,
        CREATED_MAC_ADDR,
        MODIFIED_USER,
        MODIFIED_DATE,
        MODIFIED_MAC_ADDR
    )
    VALUES
    (
        @LOGIN_ID,
        @COMPANY_ID,
        @CAMP_ID,
        @STORE_ID,
        @ROLE_ID,
        @REMARKS,
        @STATUS_MASTER,
        @USER,
        GETDATE(),
        @MAC_ADDRESS,
        @USER,
        GETDATE(),
        @MAC_ADDRESS
    );


    SELECT '', 'Data Saved Successfully',@USER_TO_STORE_ID 

END
END

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_ANIMAL_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 
CREATE PROCEDURE [VMaster].[SHOW_ANIMAL_MASTER]
 
 
	as begin set nocount on

SELECT [ANIMAL_ID]
      ,[ANIMAL_NAME]
     
      ,[REMARKS]
      ,[STATUS_MASTER]
  FROM [VMaster].[TBL_ANIMAL_MASTER]

 
   end
 
 
 

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_CAMP_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 

CREATE PROCEDURE [VMaster].[SHOW_CAMP_MASTER]
 
 AS BEGIN SET NOCOUNT ON
  
SELECT [CAMP_ID]
      ,[CAMP_NAME]
      ,[REMARKS]
      ,[STATUS_MASTER]
  FROM [VMaster].[TBL_CAMP_MASTER]
end
 

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_COMPANY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 

CREATE PROCEDURE [VMaster].[SHOW_COMPANY_MASTER]
(
@COMPANY_ID int 

) as begin set nocount on
 
SELECT [COMPANY_ID]
      ,[COMPANY_NAME]
      ,[COMPANY_FULL_NAME]
      ,[TIN_NUMBER]
      ,[VRN_NUMBER]
      ,[ADDRESS]
      ,[CONTACT_PERSON]
      ,[CONTACT_NUMBER]
      ,[EMAIL]
      ,[SHORT_CODE]
      ,[FINANCE_START_MONTH]
      ,[FINANCE_END_MONTH]
      ,[YEAR_CODE]
      ,[DEFAULT_CURRENCY_ID]
      ,[TIMEZONE]
      ,[NO_OF_USER]
      ,[WEBSITE]
      ,[COMP_BIG_LOGO]
      ,[COMP_SMALL_LOGO]
      ,[COMP_LETTER_HEAD]
      ,[COMP_STAMP_LOGO]
      ,[REMARKS]
      ,[STATUS_MASTER]
   FROM [VMaster].[TBL_COMPANY_MASTER]
 WHERE COMPANY_ID =@COMPANY_ID 
 

	end
 


GO
/****** Object:  StoredProcedure [VMaster].[SHOW_COST_CENTRE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 
CREATE PROCEDURE [VMaster].[SHOW_COST_CENTRE_MASTER]
 
	as begin set nocount on
	SELECT [COST_CENTRE_ID]
      ,[COST_CENTRE_NAME]
      ,[COMPANY_ID]
      ,[REMARKS]
      ,[STATUS_MASTER]
      ,[CREATED_BY]
  FROM [VMaster].[TBL_COST_CENTRE_MASTER] 
 
 

	end
 
 

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_COUNTRY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 
CREATE PROCEDURE [VMaster].[SHOW_COUNTRY_MASTER]
--(
--@Country_Id int 
  
-- )
 as begin set nocount on
  
SELECT [Country_Id]
      ,[Country_Name]
      ,[nicename]
      ,[iso3]
      ,[numcode]
      ,[phonecode]
      ,[Batch_No]
      ,[Remarks]
      ,[Status_Master]
 
  FROM [VMaster].[tbl_country_master]
 --WHERE Country_Id =@Country_Id 
 
	end
 
 

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_CURRENCY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [VMaster].[SHOW_CURRENCY_MASTER]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        [CURRENCY_ID],
        [CURRENCY_NAME],
        [ADDRESS],
        [Exchange_Rate],
        [REMARKS],
        [STATUS_MASTER]
    FROM [VMaster].[TBL_CURRENCY_MASTER];
END
GO
/****** Object:  StoredProcedure [VMaster].[SHOW_DEPARTMENT_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [VMaster].[SHOW_DEPARTMENT_MASTER]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        [DEPARTMENT_ID],
        [DEPARTMENT_NAME],
        [REMARKS],
        [STATUS_MASTER]
    FROM [VMaster].[TBL_DEPARTMENT_MASTER];
END
GO
/****** Object:  StoredProcedure [VMaster].[SHOW_DESIGNATION_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 

CREATE PROCEDURE [VMaster].[SHOW_DESIGNATION_MASTER]
AS
BEGIN
    SET NOCOUNT ON

    SELECT
        [DESIGNATION_ID],
        [DESIGNATION_NAME],
        [REMARKS],
        [STATUS_MASTER]
    FROM [VMaster].[TBL_DESIGNATION_MASTER];
END

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_DISTRICT_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SHOW_DISTRICT_MASTER]
AS
BEGIN
    SET NOCOUNT ON

    SELECT
        District_id,
        Country_Id,
        Region_Id,
        District_Name,
        Total_Population,
        Zone_Name,
        Distance_From_Arusha,
        Status_Master
    FROM [VMaster].[tbl_District_Master]
    ORDER BY District_Name;

END

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_EXCHANGE_RATE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SHOW_EXCHANGE_RATE_MASTER]
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        SNO,
        COMPANY_ID,
        MONTH_ENTERED,
        YEAR_ENTERED,
        DATE_OF_EXCHANGE,
        FROM_CURRENCY_ID,
        TO_CURRENCY_ID,
        EXCHANGE_RATE,
        REMARKS,
        STATUS_MASTER
    FROM [VMaster].[TBL_EXCHANGE_RATE_MASTER]
    ORDER BY DATE_OF_EXCHANGE DESC;

END

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_LICENSE_PERMIT_TYPE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SHOW_LICENSE_PERMIT_TYPE_MASTER]
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        LICENSE_PERMIT_ID,
        LICENSE_PERMIT_NAME,
        REMARKS,
        STATUS_MASTER
    FROM [VMaster].[TBL_LICENSE_PERMIT_TYPE_MASTER]
    ORDER BY LICENSE_PERMIT_NAME;

END
 

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_PRICE_LIST_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SHOW_PRICE_LIST_MASTER]
AS
BEGIN
    SET NOCOUNT ON

    SELECT
        PRICE_LIST_ID,
        PRICE_TYPE_ID,
        COMPANY_NAME ,
        PRICE_PACKAGE_NAME  ,
        PER_DAY_OR_TRIP_OR_QTY_PRICE,
        FOOD_LIMIT_AMOUNT,
        DRINKS_LIMIT_AMOUNT,
        ACCOMDATION_LIMIT_AMOUNT,
        CURRENCY_ID,
        EFFECTIVE_FROM,
        EFFECTIVE_TO,
        A.REMARKS,
        A.STATUS_MASTER
    FROM [VMaster].[TBL_PRICE_LIST_MASTER] A
	INNER JOIN  VMaster.TBL_COMPANY_MASTER  C ON A.COMPANY_ID =C.COMPANY_ID 
	INNER JOIN VMaster.TBL_PRICE_PACKAGE_MASTER   P ON A.PRICE_LIST_ID  =P.PRICE_PACKAGE_ID  

END
 

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_PRICE_PACKAGE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SHOW_PRICE_PACKAGE_MASTER]
AS
BEGIN
    SET NOCOUNT ON;


    SELECT
        PRICE_PACKAGE_ID,
        PRICE_PACKAGE_TYPE,
        PRICE_PACKAGE_NAME,
        PRICE_PACKAGE_DAYS,
        REMARKS,
        STATUS_MASTER
    FROM [VMaster].[TBL_PRICE_PACKAGE_MASTER]
    ORDER BY PRICE_PACKAGE_NAME

END
 

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_PRICE_TYPE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SHOW_PRICE_TYPE_MASTER]
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        PRICE_TYPE_ID,
        PRICE_TYPE_NAME,
        PRICE_TYPE_DESCRIPTION,
        REMARKS,
        STATUS_MASTER
    FROM [VMaster].[TBL_PRICE_TYPE_MASTER]
    ORDER BY PRICE_TYPE_NAME;

END
 

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_PRODUCT_MAIN_CATEGORY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SHOW_PRODUCT_MAIN_CATEGORY_MASTER]
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        MAIN_CATEGORY_ID,
        MAIN_CATEGORY_NAME,
        REMARKS,
        STATUS_MASTER
    FROM [VMaster].[TBL_PRODUCT_MAIN_CATEGORY_MASTER]
    ORDER BY MAIN_CATEGORY_NAME

END
 

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_PRODUCT_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SHOW_PRODUCT_MASTER]
AS
BEGIN
    SET NOCOUNT ON

    SELECT
        PRODUCT_ID,
        PRODUCT_NAME,
        MAIN_CATEGORY_ID,
        SUB_CATEGORY_ID,
        UOM_ID,
        NO_OF_PCS_PER_PACKING,
        ALTERNATE_UOM_ID,
        COST_CENTRE_ID,
        COMPANY_ID,
        PRODUCTION_COST,
        VAT_PERCENTAGE,
        REMARKS,
        STATUS_MASTER
    FROM [VMaster].[TBL_PRODUCT_MASTER]
    ORDER BY PRODUCT_NAME;

END
 

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_PRODUCT_SUB_CATEGORY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SHOW_PRODUCT_SUB_CATEGORY_MASTER]
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        SUB_CATEGORY_ID,
        SUB_CATEGORY_NAME,
        MAIN_CATEGORY_ID,
        REMARKS,
        STATUS_MASTER
    FROM [VMaster].[TBL_PRODUCT_SUB_CATEGORY_MASTER]
    ORDER BY SUB_CATEGORY_NAME;

END
 

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_REGION_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SHOW_REGION_MASTER]
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        REGION_ID,
        REGION_NAME,
        COUNTRY_ID,
        CAPITAL,
        NO_OF_DISTRICTS,
        TOTAL_POPULATION,
        ZONE_NAME,
        DISTANCE_FROM_ARUSHA,
        STATUS_MASTER
    FROM [VMaster].[TBL_REGION_MASTER]
    ORDER BY REGION_NAME

END
 

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_ROLE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SHOW_ROLE_MASTER]
AS
BEGIN
    SET NOCOUNT ON;


    SELECT
        ROLE_ID,
        ROLE_NAME,
        ROLE_DESCRIPTION,
        REMARKS,
        STATUS_MASTER
    FROM [VMaster].[TBL_ROLE_MASTER]
    ORDER BY ROLE_NAME

END
 
GO
/****** Object:  StoredProcedure [VMaster].[SHOW_SALES_PACKAGE_TYPE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SHOW_SALES_PACKAGE_TYPE_MASTER]
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        SALES_PACKAGE_TYPE_ID,
        SALES_PACKAGE_TYPE_NAME,
        REMARKS,
        STATUS_MASTER
    FROM [VMaster].[TBL_SALES_PACKAGE_TYPE_MASTER]
    ORDER BY SALES_PACKAGE_TYPE_NAME

END
 

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_STORE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SHOW_STORE_MASTER]
AS
BEGIN
    SET NOCOUNT ON;


    SELECT
        Store_Id,
        Store_Name,
        Store_Short_Name,
        Camp_Id,
        Manager_Name,
        Store_Short_Code,
        Email_Address,
        CC_Email_Address,
        BCC_Email_Address,
        Response_Directors_Name,
        Remarks,
        Status_Master
    FROM [VMaster].[tbl_Store_Master]
    ORDER BY Store_Name

END
 

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_UOM_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SHOW_UOM_MASTER]
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        UOM_ID,
        UOM_NAME,
        KG_PER_UOM,
        REMARKS,
        STATUS_MASTER
    FROM [VMaster].[TBL_UOM_MASTER]
    ORDER BY UOM_NAME

END
 
GO
/****** Object:  StoredProcedure [VMaster].[SHOW_USER_INFO_HDR]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SHOW_USER_INFO_HDR]
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        LOGIN_ID,
        Emp_Id,
        LOGIN_NAME,
        ROLE,
        MOBILE_NO,
        MAIL_ID,
        STOCK_SHOW_STATUS,
        OUTSIDE_ACCESS_Y_N,
        STATUS_MASTER,
        REMARKS
    FROM [VMaster].[TBL_USER_INFO_HDR]
    ORDER BY LOGIN_NAME

END
 

GO
/****** Object:  StoredProcedure [VMaster].[SHOW_USER_TO_STORE_MAPPING]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[SHOW_USER_TO_STORE_MAPPING]
AS
BEGIN
    SET NOCOUNT ON


    SELECT
        USER_TO_STORE_ID,
        LOGIN_ID,
        COMPANY_ID,
        CAMP_ID,
        STORE_ID,
        ROLE_ID,
        REMARKS,
        STATUS_MASTER
    FROM [VMaster].[TBL_USER_TO_STORE_MAPPING]
    ORDER BY USER_TO_STORE_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_ANIMAL_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 
CREATE PROCEDURE [VMaster].[UPDATE_ANIMAL_MASTER](
	@ANIMAL_ID  int ,
	@ANIMAL_NAME varchar(50) ,
	@ADDRESS varchar(50) ,
	@EXCHANGE_RATE decimal(15, 5) ,
	@REMARKS varchar(1000) ,
	@STATUS_MASTER varchar(20) ,
	@USER varchar(50) ,
	@MAC_ADDRESS varchar(50) 
	) as begin set nocount on

	if exists (select 'check exists' from [VMaster].[TBL_ANIMAL_MASTER] where ANIMAL_NAME =@ANIMAL_NAME
	AND ANIMAL_ID <>@ANIMAL_ID ) 
	begin
	select 'error','Animal Name Already Exists',''
	end
	else begin
	 
	 
UPDATE [VMaster].[TBL_ANIMAL_MASTER]
   SET [ANIMAL_NAME] = @ANIMAL_NAME
    
      ,[REMARKS] = @REMARKS 
      ,[STATUS_MASTER] = @STATUS_MASTER 
      
      ,[MODIFIED_BY] = @USER
      ,[MODIFIED_DATE] = GETDATE ()
      ,[MODIFIED_MAC_ADDRESS] = @MAC_ADDRESS
 WHERE ANIMAL_ID =@ANIMAL_ID 
	select '','Records Update Successfully',@ANIMAL_ID 

	end
	end
 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_CAMP_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 

CREATE PROCEDURE [VMaster].[UPDATE_CAMP_MASTER](
	@CAMP_ID int  ,
	@CAMP_NAME varchar(50) ,
	@REMARKS varchar(1000) ,
	@STATUS_MASTER varchar(20) ,
	@USER varchar(50) ,
	@MAC_ADDRESS varchar(50) 
 
	)
 AS BEGIN SET NOCOUNT ON
 IF EXISTS (SELECT 'CHECK' FROM  [VMaster].[TBL_CAMP_MASTER] WHERE CAMP_NAME =@CAMP_NAME 
 AND CAMP_ID <>@CAMP_ID )
 BEGIN
 SELECT 'ERROR','Camp Name Already Exists',''
 END
 else begin
  
UPDATE [VMaster].[TBL_CAMP_MASTER]
   SET [CAMP_NAME] = @CAMP_NAME
      ,[REMARKS] = @REMARKS 
      ,[STATUS_MASTER] = @STATUS_MASTER 
     
      ,[MODIFIED_BY] = @USER
      ,[MODIFIED_DATE] = GETDATE ()
      ,[MODIFIED_MAC_ADDRESS] = @MAC_ADDRESS
 WHERE CAMP_ID =@CAMP_ID 
 
 SELECT '','Data Saved Successfully',@CAMP_ID 
end
 END 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_COMPANY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 

CREATE PROCEDURE [VMaster].[UPDATE_COMPANY_MASTER](
	@COMPANY_ID int ,
	@COMPANY_NAME varchar(100) ,
	@COMPANY_FULL_NAME varchar(150) ,
	@TIN_NUMBER varchar(50) ,
	@VRN_NUMBER varchar(50) ,
	@ADDRESS varchar(2000) ,
	@CONTACT_PERSON varchar(50) ,
	@CONTACT_NUMBER varchar(50) ,
	@EMAIL varchar(50) ,
	@SHORT_CODE varchar(4) ,
	@FINANCE_START_MONTH varchar(50) ,
	@FINANCE_END_MONTH varchar(50) ,
	@YEAR_CODE varchar(50) ,
	@DEFAULT_CURRENCY_ID int ,
	@TIMEZONE varchar(50) ,
	@NO_OF_USER int ,
	@WEBSITE varchar(50) ,
	@COMP_BIG_LOGO varbinary(max) ,
	@COMP_SMALL_LOGO varbinary(max) ,
	@COMP_LETTER_HEAD varbinary(max) ,
	@COMP_STAMP_LOGO varbinary(max) ,
	@REMARKS varchar(2000) ,
	@STATUS_MASTER varchar(20) ,
	@USER varchar(50) ,
	@MAC_ADDRESS varchar(50) 
	
 	) as begin set nocount on
	if exists (select 'check exists' from VMaster.TBL_COMPANY_MASTER  where COMPANY_NAME  =@COMPANY_NAME 
	AND COMPANY_ID <>@COMPANY_ID ) 
	begin
	select 'error','Company Name Already Exists',''
	end
	else begin
	
UPDATE [VMaster].[TBL_COMPANY_MASTER]
   SET [COMPANY_NAME] = @COMPANY_NAME
      ,[COMPANY_FULL_NAME] = @COMPANY_FULL_NAME
      ,[TIN_NUMBER] = @TIN_NUMBER
      ,[VRN_NUMBER] = @VRN_NUMBER
      ,[ADDRESS] = @ADDRESS
      ,[CONTACT_PERSON] = @CONTACT_PERSON
      ,[CONTACT_NUMBER] = @CONTACT_NUMBER
      ,[EMAIL] = @EMAIL
      ,[SHORT_CODE] = @SHORT_CODE
      ,[FINANCE_START_MONTH] = @FINANCE_START_MONTH
      ,[FINANCE_END_MONTH] = @FINANCE_END_MONTH
      ,[YEAR_CODE] = @YEAR_CODE
      ,[DEFAULT_CURRENCY_ID] = @DEFAULT_CURRENCY_ID
      ,[TIMEZONE] = @TIMEZONE
      ,[NO_OF_USER] = @NO_OF_USER
      ,[WEBSITE] = @WEBSITE
      ,[COMP_BIG_LOGO] = @COMP_BIG_LOGO
      ,[COMP_SMALL_LOGO] = @COMP_SMALL_LOGO
      ,[COMP_LETTER_HEAD] = @COMP_LETTER_HEAD
      ,[COMP_STAMP_LOGO] = @COMP_STAMP_LOGO
      ,[REMARKS] = @REMARKS
      ,[STATUS_MASTER] = @STATUS_MASTER 
       
      ,[MODIFIED_BY] = @USER
      ,[MODIFIED_DATE] = GETDATE ()
      ,[MODIFIED_MAC_ADDRESS] = @MAC_ADDRESS
 WHERE COMPANY_ID =@COMPANY_ID 
 
	select '','Records Updated Successfully',@COMPANY_ID  

	end
	end


GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_COST_CENTRE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 
CREATE PROCEDURE [VMaster].[UPDATE_COST_CENTRE_MASTER](
	@COST_CENTRE_ID int ,
	@COST_CENTRE_NAME varchar(50) ,
	@COMPANY_ID int ,
	@REMARKS varchar(2000) ,
	@STATUS_MASTER varchar(20) ,
	@USER varchar(50) ,
	@MAC_ADDRESS varchar(50) 
	)
	as begin set nocount on

	if exists (select 'check exists' from VMaster.TBL_COST_CENTRE_MASTER  where COST_CENTRE_NAME  =@COST_CENTRE_NAME 
	AND COST_CENTRE_ID <>@COST_CENTRE_ID ) 
	begin
	select 'error','Cost Name Already Exists',''
	end
	else begin
	 
	 
UPDATE [VMaster].[TBL_COST_CENTRE_MASTER]
   SET [COST_CENTRE_NAME] = @COST_CENTRE_NAME
      ,[COMPANY_ID] = @COMPANY_ID
      ,[REMARKS] = @REMARKS 
      ,[STATUS_MASTER] = @STATUS_MASTER 
      
      ,[MODIFIED_BY] = @USER
      ,[MODIFIED_DATE] = GETDATE ()
      ,[MODIFIED_MAC_ADDRESS] = @MAC_ADDRESS
 WHERE COST_CENTRE_ID =@COST_CENTRE_ID 
  	select '','Records Updated Successfully',@COST_CENTRE_ID  

	end
	end
 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_COUNTRY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [VMaster].[UPDATE_COUNTRY_MASTER](
	@Country_Id int ,
	@Country_Name varchar(100) ,
	@nicename varchar(80) ,
	@iso3 varchar(50) ,
	@numcode int ,
	@phonecode int ,
	@Batch_No varchar(2) ,
	@Remarks varchar(1000) ,
	@Status_Master varchar(50) ,
	@User varchar(50) ,
	@Mac_Address varchar(50) 
 )
 as begin set nocount on

	if exists (select 'check exists' from VMaster.tbl_country_master  where Country_Name  =@Country_Name 
	AND Country_Id <>@Country_Id ) 
	begin
	select 'error','Country Name Already Exists',''
	end
	else begin
	 
UPDATE [VMaster].[tbl_country_master]
   SET [Country_Name] = @Country_Name 
      ,[nicename] = @nicename 
      ,[iso3] = @iso3 
      ,[numcode] = @numcode 
      ,[phonecode] = @phonecode 
      ,[Batch_No] = @Batch_No 
      ,[Remarks] = @Remarks 
      ,[Status_Master] = @Status_Master 
      
      ,[Modified_User] = @User
      ,[Modified_Date] = GETDATE ()
      ,[Modified_Mac_Address] = @Mac_Address 
 WHERE Country_Id =@Country_Id 
	select '','Records Updated Successfully',@Country_Id  

	end
	end
 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_CURRENCY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_CURRENCY_MASTER]
(
    @CURRENCY_ID INT,
    @CURRENCY_NAME VARCHAR(50),
    @ADDRESS VARCHAR(50),
    @EXCHANGE_RATE DECIMAL(15,5),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN

    SET NOCOUNT ON
    IF EXISTS   (  SELECT 'CHECK'   FROM [VMaster].[TBL_CURRENCY_MASTER]
        WHERE CURRENCY_NAME = @CURRENCY_NAME  AND CURRENCY_ID <> @CURRENCY_ID
    )
    BEGIN
        SELECT 'error', 'Currency Name Already Exists', '';
    END
         ELSE
        BEGIN
            UPDATE [VMaster].[TBL_CURRENCY_MASTER]
            SET
                CURRENCY_NAME = @CURRENCY_NAME,
                ADDRESS = @ADDRESS,
                Exchange_Rate = @EXCHANGE_RATE,
                REMARKS = @REMARKS,
                STATUS_MASTER = @STATUS_MASTER,
                MODIFIED_BY = @USER,
                MODIFIED_DATE = GETDATE(),
                MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
            WHERE CURRENCY_ID = @CURRENCY_ID

            SELECT '', 'Data Updated Successfully', @CURRENCY_ID
        END
    END
 
GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_DEPARTMENT_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_DEPARTMENT_MASTER]
(
    @DEPARTMENT_ID INT,
    @DEPARTMENT_NAME VARCHAR(50),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS
    (
        SELECT 'check exists'
        FROM [VMaster].[TBL_DEPARTMENT_MASTER]
        WHERE DEPARTMENT_NAME = @DEPARTMENT_NAME
		AND DEPARTMENT_ID <>@DEPARTMENT_ID 
    )
    BEGIN
        SELECT 'error','Department Name Already Exists',''
    END
    ELSE
    BEGIN
	 UPDATE [VMaster].[TBL_DEPARTMENT_MASTER]
   SET [DEPARTMENT_NAME] = @DEPARTMENT_NAME
      ,[REMARKS] = @REMARKS
      ,[STATUS_MASTER] = @STATUS_MASTER 
      ,[MODIFIED_BY] = @USER
      ,[MODIFIED_DATE] =GETDATE()
      ,[MODIFIED_MAC_ADDRESS] = @MAC_ADDRESS
 WHERE DEPARTMENT_ID =@DEPARTMENT_ID 
SELECT '','Records Saved Successfully',@DEPARTMENT_ID
    END
END
 
 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_DESIGNATION_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_DESIGNATION_MASTER]
(
    @DESIGNATION_ID INT,
    @DESIGNATION_NAME VARCHAR(50),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS   (
        SELECT 'CHECK'
        FROM [VMaster].[TBL_DESIGNATION_MASTER]
        WHERE UPPER(DESIGNATION_NAME) = UPPER(@DESIGNATION_NAME)
          AND DESIGNATION_ID <> @DESIGNATION_ID
    )
    BEGIN
        SELECT 'error','Designation Name Already Exists',''
    END

    UPDATE [VMaster].[TBL_DESIGNATION_MASTER]
    SET
        DESIGNATION_NAME = @DESIGNATION_NAME,
        REMARKS = @REMARKS,
        STATUS_MASTER = @STATUS_MASTER,
        MODIFIED_BY = @USER,
        MODIFIED_DATE = GETDATE(),
        MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
    WHERE DESIGNATION_ID = @DESIGNATION_ID;

    SELECT '', 'Record Updated Successfully', @DESIGNATION_ID
END
 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_DISTRICT_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_DISTRICT_MASTER]
(
    @DISTRICT_ID INT,
    @COUNTRY_ID INT,
    @REGION_ID INT,
    @DISTRICT_NAME VARCHAR(50),
    @TOTAL_POPULATION DECIMAL(18,2),
    @ZONE_NAME VARCHAR(50),
    @DISTANCE_FROM_ARUSHA DECIMAL(18,2),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS
    (
        SELECT 'CHECK'
        FROM [VMaster].[tbl_District_Master]
        WHERE UPPER(District_Name) = UPPER(@DISTRICT_NAME)
        AND District_id <> @DISTRICT_ID
    )
    BEGIN
        SELECT 'error','District Name Already Exists',''
    END

	ELSE BEGIN
    UPDATE [VMaster].[tbl_District_Master]
    SET
        Country_Id = @COUNTRY_ID,
        Region_Id = @REGION_ID,
        District_Name = @DISTRICT_NAME,
        Total_Population = @TOTAL_POPULATION,
        Zone_Name = @ZONE_NAME,
        Distance_From_Arusha = @DISTANCE_FROM_ARUSHA,
        Status_Master = @STATUS_MASTER,
        Modified_By = @USER,
        Modified_Date = GETDATE(),
        Modified_Mac_Address = @MAC_ADDRESS
    WHERE District_id = @DISTRICT_ID
    SELECT '', 'Record Updated Successfully', @DISTRICT_ID;
END
END
GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_EXCHANGE_RATE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_EXCHANGE_RATE_MASTER]
(
    @SNO INT,
    @COMPANY_ID INT,
    @MONTH_ENTERED VARCHAR(50),
    @YEAR_ENTERED VARCHAR(20),
    @DATE_OF_EXCHANGE DATETIME,
    @FROM_CURRENCY_ID INT,
    @TO_CURRENCY_ID INT,
    @EXCHANGE_RATE DECIMAL(15,5),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF EXISTS
    (
        SELECT 'CHECK'
        FROM [VMaster].[TBL_EXCHANGE_RATE_MASTER]
        WHERE COMPANY_ID = @COMPANY_ID
        AND MONTH_ENTERED = @MONTH_ENTERED
        AND YEAR_ENTERED = @YEAR_ENTERED
        AND FROM_CURRENCY_ID = @FROM_CURRENCY_ID
        AND TO_CURRENCY_ID = @TO_CURRENCY_ID
        AND SNO <> @SNO
    )
    BEGIN
        SELECT 'error','Exchange Rate Already Exists For This Period',''
        RETURN
    END

	ELSE BEGIN
    UPDATE [VMaster].[TBL_EXCHANGE_RATE_MASTER]
    SET
        COMPANY_ID = @COMPANY_ID,
        MONTH_ENTERED = @MONTH_ENTERED,
        YEAR_ENTERED = @YEAR_ENTERED,
        DATE_OF_EXCHANGE = @DATE_OF_EXCHANGE,
        FROM_CURRENCY_ID = @FROM_CURRENCY_ID,
        TO_CURRENCY_ID = @TO_CURRENCY_ID,
        EXCHANGE_RATE = @EXCHANGE_RATE,
        REMARKS = @REMARKS,
        STATUS_MASTER = @STATUS_MASTER,
        MODIFIED_BY = @USER,
        MODIFIED_DATE = GETDATE(),
        MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
    WHERE SNO = @SNO


    SELECT '', 'Record Updated Successfully', @SNO

END
END
 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_LICENSE_PERMIT_TYPE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_LICENSE_PERMIT_TYPE_MASTER]
(
    @LICENSE_PERMIT_ID INT,
    @LICENSE_PERMIT_NAME VARCHAR(50),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON


    IF EXISTS
    (
        SELECT 'CHECK'
        FROM [VMaster].[TBL_LICENSE_PERMIT_TYPE_MASTER]
        WHERE UPPER(LICENSE_PERMIT_NAME) = UPPER(@LICENSE_PERMIT_NAME)
        AND LICENSE_PERMIT_ID <> @LICENSE_PERMIT_ID
    )
    BEGIN
        SELECT 'error','License Permit Name Already Exists',''
    END
	ELSE BEGIN

    UPDATE [VMaster].[TBL_LICENSE_PERMIT_TYPE_MASTER]
    SET
        LICENSE_PERMIT_NAME = @LICENSE_PERMIT_NAME,
        REMARKS = @REMARKS,
        STATUS_MASTER = @STATUS_MASTER,
        MODIFIED_BY = @USER,
        MODIFIED_DATE = GETDATE(),
        MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
    WHERE LICENSE_PERMIT_ID = @LICENSE_PERMIT_ID;


    SELECT '', 'Record Updated Successfully', @LICENSE_PERMIT_ID
	END
END
 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_PRICE_LIST_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_PRICE_LIST_MASTER]
(
    @PRICE_LIST_ID INT,
    @PRICE_TYPE_ID INT,
    @COMPANY_ID INT,
    @PRICE_PACKAGE_ID INT,
    @PER_DAY_OR_TRIP_OR_QTY_PRICE DECIMAL(15,2),
    @FOOD_LIMIT_AMOUNT DECIMAL(15,2),
    @DRINKS_LIMIT_AMOUNT DECIMAL(15,2),
    @ACCOMDATION_LIMIT_AMOUNT DECIMAL(15,2),
    @CURRENCY_ID INT,
    @EFFECTIVE_FROM DATETIME,
    @EFFECTIVE_TO DATETIME,
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON


    IF EXISTS
    (
        SELECT 1
        FROM [VMaster].[TBL_PRICE_LIST_MASTER]
        WHERE 
          COMPANY_ID=@COMPANY_ID
        AND PRICE_TYPE_ID=@PRICE_TYPE_ID
        AND PRICE_LIST_ID<>@PRICE_LIST_ID
    )
    BEGIN
        SELECT 'error','Price List Already Exists',''
  
    END
	ELSE BEGIN

    UPDATE [VMaster].[TBL_PRICE_LIST_MASTER]
    SET
        PRICE_TYPE_ID=@PRICE_TYPE_ID,
        COMPANY_ID=@COMPANY_ID,
        PRICE_PACKAGE_ID=@PRICE_PACKAGE_ID,
        PER_DAY_OR_TRIP_OR_QTY_PRICE=@PER_DAY_OR_TRIP_OR_QTY_PRICE,
        FOOD_LIMIT_AMOUNT=@FOOD_LIMIT_AMOUNT,
        DRINKS_LIMIT_AMOUNT=@DRINKS_LIMIT_AMOUNT,
        ACCOMDATION_LIMIT_AMOUNT=@ACCOMDATION_LIMIT_AMOUNT,
        CURRENCY_ID=@CURRENCY_ID,
        EFFECTIVE_FROM=@EFFECTIVE_FROM,
        EFFECTIVE_TO=@EFFECTIVE_TO,
        REMARKS=@REMARKS,
        STATUS_MASTER=@STATUS_MASTER,
        MODIFIED_BY=@USER,
        MODIFIED_DATE=GETDATE(),
        MODIFIED_MAC_ADDRESS=@MAC_ADDRESS
    WHERE PRICE_LIST_ID=@PRICE_LIST_ID


    SELECT '', 'Record Updated Successfully', @PRICE_LIST_ID
	END
END
 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_PRICE_PACKAGE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_PRICE_PACKAGE_MASTER]
(
    @PRICE_PACKAGE_ID INT,
    @PRICE_PACKAGE_TYPE VARCHAR(50),
    @PRICE_PACKAGE_NAME VARCHAR(50),
    @PRICE_PACKAGE_DAYS INT,
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON


    IF EXISTS
    (
        SELECT 'CHECK'
        FROM [VMaster].[TBL_PRICE_PACKAGE_MASTER]
        WHERE UPPER(PRICE_PACKAGE_NAME)=UPPER(@PRICE_PACKAGE_NAME)
        AND PRICE_PACKAGE_ID<>@PRICE_PACKAGE_ID
    )
    BEGIN
        SELECT 'error','Price Package Name Already Exists',''
 
    END
	ELSE BEGIN

    UPDATE [VMaster].[TBL_PRICE_PACKAGE_MASTER]
    SET
        PRICE_PACKAGE_TYPE=@PRICE_PACKAGE_TYPE,
        PRICE_PACKAGE_NAME=@PRICE_PACKAGE_NAME,
        PRICE_PACKAGE_DAYS=@PRICE_PACKAGE_DAYS,
        REMARKS=@REMARKS,
        STATUS_MASTER=@STATUS_MASTER,
        MODIFIED_BY=@USER,
        MODIFIED_DATE=GETDATE(),
        MODIFIED_MAC_ADDRESS=@MAC_ADDRESS
    WHERE PRICE_PACKAGE_ID=@PRICE_PACKAGE_ID;


    SELECT '', 'Record Updated Successfully', @PRICE_PACKAGE_ID

END
END
 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_PRICE_TYPE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_PRICE_TYPE_MASTER]
(
    @PRICE_TYPE_ID INT,
    @PRICE_TYPE_NAME VARCHAR(50),
    @PRICE_TYPE_DESCRIPTION VARCHAR(50),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON


    IF EXISTS
    (
        SELECT 'CHECK'
        FROM [VMaster].[TBL_PRICE_TYPE_MASTER]
        WHERE UPPER(PRICE_TYPE_NAME)=UPPER(@PRICE_TYPE_NAME)
        AND PRICE_TYPE_ID <> @PRICE_TYPE_ID
    )
    BEGIN
        SELECT 'error','Price Type Name Already Exists',''
     
    END

	ELSE BEGIN
    UPDATE [VMaster].[TBL_PRICE_TYPE_MASTER]
    SET
        PRICE_TYPE_NAME = @PRICE_TYPE_NAME,
        PRICE_TYPE_DESCRIPTION = @PRICE_TYPE_DESCRIPTION,
        REMARKS = @REMARKS,
        STATUS_MASTER = @STATUS_MASTER,
        MODIFIED_BY = @USER,
        MODIFIED_DATE = GETDATE(),
        MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
    WHERE PRICE_TYPE_ID = @PRICE_TYPE_ID;


    SELECT '', 'Record Updated Successfully', @PRICE_TYPE_ID
	END
END
 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_PRODUCT_MAIN_CATEGORY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_PRODUCT_MAIN_CATEGORY_MASTER]
(
    @MAIN_CATEGORY_ID INT,
    @MAIN_CATEGORY_NAME VARCHAR(100),
    @REMARKS VARCHAR(2000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON


    IF EXISTS
    (
        SELECT 'CHECK'
        FROM [VMaster].[TBL_PRODUCT_MAIN_CATEGORY_MASTER]
        WHERE UPPER(MAIN_CATEGORY_NAME)=UPPER(@MAIN_CATEGORY_NAME)
        AND MAIN_CATEGORY_ID <> @MAIN_CATEGORY_ID
    )
    BEGIN
        SELECT 'error','Main Category Name Already Exists',''
 
    END
	ELSE BEGIN

    UPDATE [VMaster].[TBL_PRODUCT_MAIN_CATEGORY_MASTER]
    SET
        MAIN_CATEGORY_NAME = @MAIN_CATEGORY_NAME,
        REMARKS = @REMARKS,
        STATUS_MASTER = @STATUS_MASTER,
        MODIFIED_BY = @USER,
        MODIFIED_DATE = GETDATE(),
        MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
    WHERE MAIN_CATEGORY_ID = @MAIN_CATEGORY_ID;


    SELECT '', 'Record Updated Successfully', @MAIN_CATEGORY_ID
END
END
 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_PRODUCT_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_PRODUCT_MASTER]
(
    @PRODUCT_ID INT,
    @PRODUCT_NAME VARCHAR(1500),
    @TBS_PRODUCT_NAME VARCHAR(MAX),
    @MAIN_CATEGORY_ID INT,
    @SUB_CATEGORY_ID INT,
    @UOM_ID INT,
    @NO_OF_PCS_PER_PACKING DECIMAL(15,2),
    @ALTERNATE_UOM_ID INT,
    @COST_CENTRE_ID INT,
    @COMPANY_ID INT,
    @PRODUCTION_COST DECIMAL(15,2),
    @VAT_PERCENTAGE DECIMAL(15,2),
    @REMARKS VARCHAR(2000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON


    IF EXISTS
    (
        SELECT 'CHECK'
        FROM [VMaster].[TBL_PRODUCT_MASTER]
        WHERE UPPER(PRODUCT_NAME)=UPPER(@PRODUCT_NAME)
        AND COMPANY_ID=@COMPANY_ID
        AND PRODUCT_ID<>@PRODUCT_ID
    )
    BEGIN
        SELECT 'error','Product Name Already Exists',''
  
    END

	ELSE BEGIN
    UPDATE [VMaster].[TBL_PRODUCT_MASTER]
    SET
        PRODUCT_NAME=@PRODUCT_NAME,
        TBS_PRODUCT_NAME=@TBS_PRODUCT_NAME,
        MAIN_CATEGORY_ID=@MAIN_CATEGORY_ID,
        SUB_CATEGORY_ID=@SUB_CATEGORY_ID,
        UOM_ID=@UOM_ID,
        NO_OF_PCS_PER_PACKING=@NO_OF_PCS_PER_PACKING,
        ALTERNATE_UOM_ID=@ALTERNATE_UOM_ID,
        COST_CENTRE_ID=@COST_CENTRE_ID,
        COMPANY_ID=@COMPANY_ID,
        PRODUCTION_COST=@PRODUCTION_COST,
        VAT_PERCENTAGE=@VAT_PERCENTAGE,
        REMARKS=@REMARKS,
        STATUS_MASTER=@STATUS_MASTER,
        MODIFIED_BY=@USER,
        MODIFIED_DATE=GETDATE(),
        MODIFIED_MAC_ADDRESS=@MAC_ADDRESS
    WHERE PRODUCT_ID=@PRODUCT_ID;


    SELECT '', 'Record Updated Successfully', @PRODUCT_ID

END
END 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_PRODUCT_SUB_CATEGORY_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_PRODUCT_SUB_CATEGORY_MASTER]
(
    @SUB_CATEGORY_ID INT,
    @SUB_CATEGORY_NAME VARCHAR(50),
    @MAIN_CATEGORY_ID INT,
    @REMARKS VARCHAR(2000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON


    IF EXISTS
    (
        SELECT 'CHECK'
        FROM [VMaster].[TBL_PRODUCT_SUB_CATEGORY_MASTER]
        WHERE UPPER(SUB_CATEGORY_NAME)=UPPER(@SUB_CATEGORY_NAME)
        AND MAIN_CATEGORY_ID=@MAIN_CATEGORY_ID
        AND SUB_CATEGORY_ID<>@SUB_CATEGORY_ID
    )
    BEGIN
        SELECT 'error','Sub Category Name Already Exists',''
    
    END
	ELSE BEGIN
	    UPDATE [VMaster].[TBL_PRODUCT_SUB_CATEGORY_MASTER]
    SET
        SUB_CATEGORY_NAME=@SUB_CATEGORY_NAME,
        MAIN_CATEGORY_ID=@MAIN_CATEGORY_ID,
        REMARKS=@REMARKS,
        STATUS_MASTER=@STATUS_MASTER,
        MODIFIED_BY=@USER,
        MODIFIED_DATE=GETDATE(),
        MODIFIED_MAC_ADDRESS=@MAC_ADDRESS
    WHERE SUB_CATEGORY_ID=@SUB_CATEGORY_ID

    SELECT '', 'Record Updated Successfully', @SUB_CATEGORY_ID
END
END
 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_REGION_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_REGION_MASTER]
(
    @REGION_ID INT,
    @REGION_NAME VARCHAR(50),
    @COUNTRY_ID INT,
    @CAPITAL VARCHAR(50),
    @NO_OF_DISTRICTS INT,
    @TOTAL_POPULATION DECIMAL(18,2),
    @ZONE_NAME VARCHAR(50),
    @DISTANCE_FROM_ARUSHA DECIMAL(18,2),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON


    IF EXISTS   (
        SELECT 'CHECH'
        FROM [VMaster].[TBL_REGION_MASTER]
        WHERE UPPER(REGION_NAME)=UPPER(@REGION_NAME)
        AND COUNTRY_ID=@COUNTRY_ID
        AND REGION_ID<>@REGION_ID
    )
    BEGIN
        SELECT 'error','Region Name Already Exists',''
     
    END
	ELSE BEGIN

    UPDATE [VMaster].[TBL_REGION_MASTER]
    SET
        REGION_NAME=@REGION_NAME,
        COUNTRY_ID=@COUNTRY_ID,
        CAPITAL=@CAPITAL,
        NO_OF_DISTRICTS=@NO_OF_DISTRICTS,
        TOTAL_POPULATION=@TOTAL_POPULATION,
        ZONE_NAME=@ZONE_NAME,
        DISTANCE_FROM_ARUSHA=@DISTANCE_FROM_ARUSHA,
        STATUS_MASTER=@STATUS_MASTER,
        MODIFIED_BY=@USER,
        MODIFIED_DATE=GETDATE(),
        MODIFIED_MAC_ADDRESS=@MAC_ADDRESS
    WHERE REGION_ID=@REGION_ID

    SELECT '', 'Record Updated Successfully', @REGION_ID
	END
END
 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_ROLE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_ROLE_MASTER]
(
    @ROLE_ID INT,
    @ROLE_NAME VARCHAR(50),
    @ROLE_DESCRIPTION VARCHAR(50),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON


    IF EXISTS
    (
        SELECT 1
        FROM [VMaster].[TBL_ROLE_MASTER]
        WHERE UPPER(ROLE_NAME)=UPPER(@ROLE_NAME)
        AND ROLE_ID<>@ROLE_ID
    )
    BEGIN
        SELECT 'error','Role Name Already Exists',''
    END

	ELSE BEGIN
    UPDATE [VMaster].[TBL_ROLE_MASTER]
    SET
        ROLE_NAME=@ROLE_NAME,
        ROLE_DESCRIPTION=@ROLE_DESCRIPTION,
        REMARKS=@REMARKS,
        STATUS_MASTER=@STATUS_MASTER,
        MODIFIED_BY=@USER,
        MODIFIED_DATE=GETDATE(),
        MODIFIED_MAC_ADDRESS=@MAC_ADDRESS
    WHERE ROLE_ID=@ROLE_ID


    SELECT '', 'Record Updated Successfully', @ROLE_ID
	END
END
 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_SALES_PACKAGE_TYPE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_SALES_PACKAGE_TYPE_MASTER]
(
    @SALES_PACKAGE_TYPE_ID INT,
    @SALES_PACKAGE_TYPE_NAME VARCHAR(50),
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON


    IF EXISTS
    (
        SELECT 1
        FROM [VMaster].[TBL_SALES_PACKAGE_TYPE_MASTER]
        WHERE UPPER(SALES_PACKAGE_TYPE_NAME)=UPPER(@SALES_PACKAGE_TYPE_NAME)
        AND SALES_PACKAGE_TYPE_ID<>@SALES_PACKAGE_TYPE_ID
    )
    BEGIN
        SELECT 'error','Sales Package Type Name Already Exists',''
 
    END


    UPDATE [VMaster].[TBL_SALES_PACKAGE_TYPE_MASTER]
    SET
        SALES_PACKAGE_TYPE_NAME=@SALES_PACKAGE_TYPE_NAME,
        REMARKS=@REMARKS,
        STATUS_MASTER=@STATUS_MASTER,
        MODIFIED_BY=@USER,
        MODIFIED_DATE=GETDATE(),
        MODIFIED_MAC_ADDRESS=@MAC_ADDRESS
    WHERE SALES_PACKAGE_TYPE_ID=@SALES_PACKAGE_TYPE_ID;


    SELECT '', 'Record Updated Successfully', @SALES_PACKAGE_TYPE_ID

END
 
GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_STORE_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_STORE_MASTER]
(
    @STORE_ID INT,
    @STORE_NAME VARCHAR(100),
    @STORE_SHORT_NAME VARCHAR(50),
    @CAMP_ID INT,
    @MANAGER_NAME VARCHAR(50),
    @STORE_SHORT_CODE VARCHAR(5),
    @EMAIL_ADDRESS VARCHAR(1000),
    @CC_EMAIL_ADDRESS VARCHAR(MAX),
    @BCC_EMAIL_ADDRESS VARCHAR(50),
    @RESPONSE_DIRECTORS_NAME VARCHAR(1000),
    @REMARKS VARCHAR(2000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON


    IF EXISTS
    (
        SELECT 1
        FROM [VMaster].[tbl_Store_Master]
        WHERE UPPER(Store_Name)=UPPER(@STORE_NAME)
        AND Store_Id<>@STORE_ID
    )
    BEGIN
        SELECT 'error','Store Name Already Exists',''

    END


    UPDATE [VMaster].[tbl_Store_Master]
    SET
        Store_Name=@STORE_NAME,
        Store_Short_Name=@STORE_SHORT_NAME,
        Camp_Id=@CAMP_ID,
        Manager_Name=@MANAGER_NAME,
        Store_Short_Code=@STORE_SHORT_CODE,
        Email_Address=@EMAIL_ADDRESS,
        CC_Email_Address=@CC_EMAIL_ADDRESS,
        BCC_Email_Address=@BCC_EMAIL_ADDRESS,
        Response_Directors_Name=@RESPONSE_DIRECTORS_NAME,
        Remarks=@REMARKS,
        Status_Master=@STATUS_MASTER,
        Modified_By=@USER,
        Modified_Date=GETDATE(),
        Modified_Mac_Address=@MAC_ADDRESS
    WHERE Store_Id=@STORE_ID;


    SELECT '', 'Record Updated Successfully', @STORE_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_UOM_MASTER]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_UOM_MASTER]
(
    @UOM_ID INT,
    @UOM_NAME VARCHAR(50),
    @KG_PER_UOM DECIMAL(15,2),
    @REMARKS VARCHAR(2000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON


    IF EXISTS
    (
        SELECT 1
        FROM [VMaster].[TBL_UOM_MASTER]
        WHERE UPPER(UOM_NAME)=UPPER(@UOM_NAME)
        AND UOM_ID<>@UOM_ID
    )
    BEGIN
        SELECT 'error','UOM Name Already Exists','';
        RETURN;
    END


    UPDATE [VMaster].[TBL_UOM_MASTER]
    SET
        UOM_NAME=@UOM_NAME,
        KG_PER_UOM=@KG_PER_UOM,
        REMARKS=@REMARKS,
        STATUS_MASTER=@STATUS_MASTER,
        MODIFIED_BY=@USER,
        MODIFIED_DATE=GETDATE(),
        MODIFIED_MAC_ADDRESS=@MAC_ADDRESS
    WHERE UOM_ID=@UOM_ID;


    SELECT '', 'Record Updated Successfully', @UOM_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_USER_INFO_HDR]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_USER_INFO_HDR]
(
    @LOGIN_ID INT,
    @EMP_ID INT,
    @LOGIN_NAME VARCHAR(50),
    @PASSWORD VARCHAR(100),
    @ROLE VARCHAR(100),
    @MOBILE_NO VARCHAR(30),
    @MAIL_ID VARCHAR(150),
    @STOCK_SHOW_STATUS VARCHAR(10),
    @OUTSIDE_ACCESS_Y_N VARCHAR(20),
    @STATUS_MASTER VARCHAR(20),
    @REMARKS VARCHAR(1000),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON
    IF EXISTS    ( SELECT 'check' FROM [VMaster].[TBL_USER_INFO_HDR]
        WHERE UPPER(LOGIN_NAME)=UPPER(@LOGIN_NAME)  AND LOGIN_ID<>@LOGIN_ID
    )
    BEGIN
        SELECT 'error','Login Name Already Exists',''
     
    END

    UPDATE [VMaster].[TBL_USER_INFO_HDR]
    SET
        Emp_Id=@EMP_ID,
        LOGIN_NAME=@LOGIN_NAME,
        PASSWORD=@PASSWORD,
        ROLE=@ROLE,
        MOBILE_NO=@MOBILE_NO,
        MAIL_ID=@MAIL_ID,
        STOCK_SHOW_STATUS=@STOCK_SHOW_STATUS,
        OUTSIDE_ACCESS_Y_N=@OUTSIDE_ACCESS_Y_N,
        STATUS_MASTER=@STATUS_MASTER,
        REMARKS=@REMARKS,
        MODIFIED_USER=@USER,
        MODIFIED_DATE=GETDATE(),
        MODIFIED_MAC_ADDR=@MAC_ADDRESS
    WHERE LOGIN_ID=@LOGIN_ID;


    SELECT '', 'Record Updated Successfully', @LOGIN_ID

END
 

GO
/****** Object:  StoredProcedure [VMaster].[UPDATE_USER_TO_STORE_MAPPING]    Script Date: 22 Jul 2026 16:29:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [VMaster].[UPDATE_USER_TO_STORE_MAPPING]
(
    @USER_TO_STORE_ID INT,
    @LOGIN_ID INT,
    @COMPANY_ID INT,
    @CAMP_ID INT,
    @STORE_ID INT,
    @ROLE_ID INT,
    @REMARKS VARCHAR(1000),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON


    IF EXISTS
    (
        SELECT 1
        FROM [VMaster].[TBL_USER_TO_STORE_MAPPING]
        WHERE LOGIN_ID=@LOGIN_ID
        AND COMPANY_ID=@COMPANY_ID
        AND CAMP_ID=@CAMP_ID
        AND STORE_ID=@STORE_ID
        AND USER_TO_STORE_ID<>@USER_TO_STORE_ID
    )
    BEGIN
        SELECT 'error','User Store Mapping Already Exists',''
    END


    UPDATE [VMaster].[TBL_USER_TO_STORE_MAPPING]
    SET
        LOGIN_ID=@LOGIN_ID,
        COMPANY_ID=@COMPANY_ID,
        CAMP_ID=@CAMP_ID,
        STORE_ID=@STORE_ID,
        ROLE_ID=@ROLE_ID,
        REMARKS=@REMARKS,
        STATUS_MASTER=@STATUS_MASTER,
        MODIFIED_USER=@USER,
        MODIFIED_DATE=GETDATE(),
        MODIFIED_MAC_ADDR=@MAC_ADDRESS
    WHERE USER_TO_STORE_ID=@USER_TO_STORE_ID;


    SELECT '', 'Record Updated Successfully', @USER_TO_STORE_ID

END
 

GO
