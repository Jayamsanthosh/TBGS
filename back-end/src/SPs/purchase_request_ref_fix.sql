-- Add Purchase Request auto-ref generation branch ('PURCHASE REQUEST' -> <SHORT>/<YEAR>/PR/<n>).
-- SAVE_PURCHASE_REQUEST_HDR calls this generator; without this branch it returned empty
-- and SAVE aborted with "Can't Generate Purchase Request Reference Number.".
USE [TBGS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Fix: generator branch for WARNING FORM NO scanned WARNING_FORM_NO (INT, always NULL)
-- instead of WARNING_REQUEST_REF_NO, so it always returned '<COMPANY>/<YEAR>/WFR/1' -> PK violation.

ALTER PROCEDURE [VREQUEST].[SP_Generate_Screen_Ref_No_With_Output_Parameter]
(
@Screen_Name varchar(50),
@Company_Id int,
@Screen_Ref_No VARCHAR(50) OUT
)
as
begin
set nocount on
declare 
@Year_Code varchar(5)='',
@Company_Short_code varchar(4)=''
select @Company_Short_code=isnull(Short_Code,''),@Year_Code=isnull(Year_Code,'') from VMaster.TBL_COMPANY_MASTER  where COMPANY_ID =@Company_Id

IF @Screen_Name='ATTENDANCE REQUEST'
begin
 
IF exists(select TOP 1 'ATTENDANCE REQUEST' from VRequest.TBL_ATTENDANCE_REQUEST where ATT_REQUEST_REF_NO like '%'+@Company_Short_Code+'/'+@Year_Code+'/ATT/'+'%')
begin

select TOP 1  @Screen_Ref_No= @Company_Short_Code+'/'+@Year_Code+'/ATT/'+convert(varchar(50),ISNULL(replace(ATT_REQUEST_REF_NO,@Company_Short_Code+'/'+@Year_Code+'/ATT/',''),0)+1) from VRequest.TBL_ATTENDANCE_REQUEST 
where ATT_REQUEST_REF_NO like '%'+@Company_Short_Code+'/'+@Year_Code+'/ATT/'+'%'
order by convert(int,ISNULL(replace(ATT_REQUEST_REF_NO,@Company_Short_Code+'/'+@Year_Code+'/ATT/',''),0)) desc
end
else
begin
	select @Screen_Ref_No=@Company_Short_Code+'/'+@Year_Code+'/ATT/1'
END
END

ELSE IF @Screen_Name='CASH ADV REQUEST REQUEST'
begin

IF exists(select TOP 1 'CASH ADV REQUEST REQUEST' from [VRequest].[TBL_CASH_ADVANCE_REQUEST] where CASH_ADV_REQUEST_REF_NO like '%'+@Company_Short_Code+'/'+@Year_Code+'/ADV/'+'%')
begin

select TOP 1  @Screen_Ref_No= @Company_Short_Code+'/'+@Year_Code+'/ADV/'+convert(varchar(50),ISNULL(replace(CASH_ADV_REQUEST_REF_NO,@Company_Short_Code+'/'+@Year_Code+'/ADV/',''),0)+1) from [VRequest].[TBL_CASH_ADVANCE_REQUEST] 
where CASH_ADV_REQUEST_REF_NO like '%'+@Company_Short_Code+'/'+@Year_Code+'/ADV/'+'%'
order by convert(int,ISNULL(replace(CASH_ADV_REQUEST_REF_NO,@Company_Short_Code+'/'+@Year_Code+'/ADV/',''),0)) desc
end
else
begin
select @Screen_Ref_No=@Company_Short_Code+'/'+@Year_Code+'/ADV/1'
END
END

ELSE IF @Screen_Name='ARREAR REQUEST REF NO'
begin

IF exists(select TOP 1 'ARREAR REQUEST REF NO' from [VRequest].[TBL_ARREARS_REQUEST] where ARREAR_REQUEST_REF_NO like '%'+@Company_Short_Code+'/'+@Year_Code+'/ARS/'+'%')
begin

select TOP 1  @Screen_Ref_No= @Company_Short_Code+'/'+@Year_Code+'/ARS/'+convert(varchar(50),ISNULL(replace(ARREAR_REQUEST_REF_NO,@Company_Short_Code+'/'+@Year_Code+'/ARS/',''),0)+1) from [VRequest].[TBL_ARREARS_REQUEST]
where ARREAR_REQUEST_REF_NO like '%'+@Company_Short_Code+'/'+@Year_Code+'/ARS/'+'%'
order by convert(int,ISNULL(replace(ARREAR_REQUEST_REF_NO,@Company_Short_Code+'/'+@Year_Code+'/ARS/',''),0)) desc
end
else
begin
select @Screen_Ref_No=@Company_Short_Code+'/'+@Year_Code+'/ARS/1'
END
END

ELSE IF @Screen_Name='ARREAR ENTRY REF NO'
begin

IF exists(select TOP 1 'ARREAR ENTRY REF NO' from [VREQUEST].[TBL_ARREARS_REQUEST] where ARREAR_REQUEST_REF_NO like '%'+@Company_Short_Code+'/'+@Year_Code+'/ARS/'+'%')
begin

select TOP 1  @Screen_Ref_No= @Company_Short_Code+'/'+@Year_Code+'/ARS/'+convert(varchar(50),ISNULL(replace(ARREAR_REQUEST_REF_NO,@Company_Short_Code+'/'+@Year_Code+'/ARS/',''),0)+1) from [VREQUEST].[TBL_ARREARS_REQUEST]
where ARREAR_REQUEST_REF_NO like '%'+@Company_Short_Code+'/'+@Year_Code+'/ARS/'+'%'
order by convert(int,ISNULL(replace(ARREAR_REQUEST_REF_NO,@Company_Short_Code+'/'+@Year_Code+'/ARS/',''),0)) desc
end
else
begin
select @Screen_Ref_No=@Company_Short_Code+'/'+@Year_Code+'/ARS/1'
END
END

ELSE IF @Screen_Name='OT REQUEST REF NO'
begin

IF exists(select TOP 1 'OT REQUEST REF NO' from [VRequest].[TBL_OVERTIME_REQUEST] where OT_REQUEST_REF_NO like '%'+@Company_Short_Code+'/'+@Year_Code+'/OTR/'+'%')
begin

select TOP 1  @Screen_Ref_No= @Company_Short_Code+'/'+@Year_Code+'/OTR/'+convert(varchar(50),ISNULL(replace(OT_REQUEST_REF_NO,@Company_Short_Code+'/'+@Year_Code+'/OTR/',''),0)+1) from [VRequest].[TBL_OVERTIME_REQUEST]
where OT_REQUEST_REF_NO like '%'+@Company_Short_Code+'/'+@Year_Code+'/OTR/'+'%'
order by convert(int,ISNULL(replace(OT_REQUEST_REF_NO,@Company_Short_Code+'/'+@Year_Code+'/OTR/',''),0)) desc
end
else
begin
select @Screen_Ref_No=@Company_Short_Code+'/'+@Year_Code+'/OTR/1'
END
END

ELSE IF @Screen_Name='BONUS REQUEST REF NO'
begin

IF exists(select TOP 1 'BONUS REQUEST REF NO' from [VREQUEST].[TBL_BONUS_REQUEST] where BONUS_REQUEST_REF_NO like '%'+@Company_Short_Code+'/'+@Year_Code+'/BRF/'+'%')
begin

select TOP 1  @Screen_Ref_No= @Company_Short_Code+'/'+@Year_Code+'/BRF/'+convert(varchar(50),ISNULL(replace(BONUS_REQUEST_REF_NO,@Company_Short_Code+'/'+@Year_Code+'/BRF/',''),0)+1) from [VREQUEST].[TBL_BONUS_REQUEST]
where BONUS_REQUEST_REF_NO like '%'+@Company_Short_Code+'/'+@Year_Code+'/BRF/'+'%'
order by convert(int,ISNULL(replace(BONUS_REQUEST_REF_NO,@Company_Short_Code+'/'+@Year_Code+'/BRF/',''),0)) desc
end
else
begin
select @Screen_Ref_No=@Company_Short_Code+'/'+@Year_Code+'/BRF/1'
END
END

ELSE IF @Screen_Name='LEAVE ENCASHMENT REQUEST REF NO'
begin

IF exists(select TOP 1 'LEAVE ENCASHMENT REQUEST REF NO' from [VREQUEST].[TBL_LEAVE_ENCASHMENT_REQUEST] where LEAVE_ENCASHMENT_REQUEST_REF_NO like '%'+@Company_Short_Code+'/'+@Year_Code+'/LER/'+'%')
begin

select TOP 1  @Screen_Ref_No= @Company_Short_Code+'/'+@Year_Code+'/LER/'+convert(varchar(50),ISNULL(replace(LEAVE_ENCASHMENT_REQUEST_REF_NO,@Company_Short_Code+'/'+@Year_Code+'/LER/',''),0)+1) from [VREQUEST].[TBL_LEAVE_ENCASHMENT_REQUEST]
where LEAVE_ENCASHMENT_REQUEST_REF_NO like '%'+@Company_Short_Code+'/'+@Year_Code+'/LER/'+'%'
order by convert(int,ISNULL(replace(LEAVE_ENCASHMENT_REQUEST_REF_NO,@Company_Short_Code+'/'+@Year_Code+'/LER/',''),0)) desc
end
else
begin
select @Screen_Ref_No=@Company_Short_Code+'/'+@Year_Code+'/LER/1'
END
END

ELSE IF @Screen_Name='TRANSFER REQUEST REF NO'
begin

IF exists(select TOP 1 'TRANSFER REQUEST REF NO' from [VREQUEST].[TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST] where TRANSFER_REQUEST_REF_NO  like '%'+@Company_Short_Code+'/'+@Year_Code+'/PTR/'+'%')
begin

select TOP 1  @Screen_Ref_No= @Company_Short_Code+'/'+@Year_Code+'/PTR/'+convert(varchar(50),ISNULL(replace(TRANSFER_REQUEST_REF_NO ,@Company_Short_Code+'/'+@Year_Code+'/PTR/',''),0)+1) from [VREQUEST].[TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST]
where TRANSFER_REQUEST_REF_NO  like '%'+@Company_Short_Code+'/'+@Year_Code+'/PTR/'+'%'
order by convert(int,ISNULL(replace(TRANSFER_REQUEST_REF_NO ,@Company_Short_Code+'/'+@Year_Code+'/PTR/',''),0)) desc
end
else
begin
select @Screen_Ref_No=@Company_Short_Code+'/'+@Year_Code+'/PTR/1'
END
END

ELSE IF @Screen_Name='MONTHLY DEDUCTION REQUEST REF NO'
begin

IF exists(select TOP 1 'MONTHLY DEDUCTION REQUEST REF NO' from [VPayEntries].[TBL_MONTHLY_AUTO_DEDUCTION] where REQUEST_REF_NO   like '%'+@Company_Short_Code+'/'+@Year_Code+'/MDR/'+'%')
begin

select TOP 1  @Screen_Ref_No= @Company_Short_Code+'/'+@Year_Code+'/MDR/'+convert(varchar(50),ISNULL(replace(REQUEST_REF_NO ,@Company_Short_Code+'/'+@Year_Code+'/MDR/',''),0)+1) from [VPayEntries].[TBL_MONTHLY_AUTO_DEDUCTION]
where REQUEST_REF_NO  like '%'+@Company_Short_Code+'/'+@Year_Code+'/MDR/'+'%'
order by convert(int,ISNULL(replace(REQUEST_REF_NO ,@Company_Short_Code+'/'+@Year_Code+'/MDR/',''),0)) desc
end
else
begin
select @Screen_Ref_No=@Company_Short_Code+'/'+@Year_Code+'/MDR/1'
END
END

ELSE IF @Screen_Name='EMP BENEFIT REF NO'
begin

IF exists(select TOP 1 'EMP BENEFIT REF NO' from [VPayEntries].[TBL_EMPLOYEE_BENEFIT_HDR] where EMP_BENEFIT_REF_NO   like '%'+@Company_Short_Code+'/'+@Year_Code+'/EBR/'+'%')
begin

select TOP 1  @Screen_Ref_No= @Company_Short_Code+'/'+@Year_Code+'/EBR/'+convert(varchar(50),ISNULL(replace(EMP_BENEFIT_REF_NO ,@Company_Short_Code+'/'+@Year_Code+'/EBR/',''),0)+1) from [VPayEntries].[TBL_EMPLOYEE_BENEFIT_HDR]
where EMP_BENEFIT_REF_NO  like '%'+@Company_Short_Code+'/'+@Year_Code+'/EBR/'+'%'
order by convert(int,ISNULL(replace(EMP_BENEFIT_REF_NO ,@Company_Short_Code+'/'+@Year_Code+'/EBR/',''),0)) desc
end
else
begin
select @Screen_Ref_No=@Company_Short_Code+'/'+@Year_Code+'/EBR/1'
END
END

ELSE IF @Screen_Name='WARNING FORM NO'
begin

IF exists(select TOP 1 'WARNING FORM NO' from [VPayEntries].[TBL_WARNING_FORMS] where WARNING_REQUEST_REF_NO   like '%'+@Company_Short_Code+'/'+@Year_Code+'/WFR/'+'%')
begin

select TOP 1  @Screen_Ref_No= @Company_Short_Code+'/'+@Year_Code+'/WFR/'+convert(varchar(50),ISNULL(replace(WARNING_REQUEST_REF_NO ,@Company_Short_Code+'/'+@Year_Code+'/WFR/',''),0)+1) from [VPayEntries].[TBL_WARNING_FORMS]
where WARNING_REQUEST_REF_NO  like '%'+@Company_Short_Code+'/'+@Year_Code+'/WFR/'+'%'
order by convert(int,ISNULL(replace(WARNING_REQUEST_REF_NO ,@Company_Short_Code+'/'+@Year_Code+'/WFR/',''),0)) desc
end
else
begin
select @Screen_Ref_No=@Company_Short_Code+'/'+@Year_Code+'/WFR/1'
END
END


ELSE IF @Screen_Name='OVER TIME REFERENCE NO'
begin

IF exists(select TOP 1 'OVER TIME REFERENCE NO' from [VPayEntries].[TBL_OVER_TIME_REFERENCE_ENTRIES] where [OT_REF_NO]   like '%'+@Company_Short_Code+'/'+@Year_Code+'/OTR/'+'%')
begin

select TOP 1  @Screen_Ref_No= @Company_Short_Code+'/'+@Year_Code+'/OTR/'+convert(varchar(50),ISNULL(replace(OT_REF_NO ,@Company_Short_Code+'/'+@Year_Code+'/OTR/',''),0)+1) from [VPayEntries].[TBL_OVER_TIME_REFERENCE_ENTRIES]
where OT_REF_NO  like '%'+@Company_Short_Code+'/'+@Year_Code+'/OTR/'+'%'
order by convert(int,ISNULL(replace(OT_REF_NO ,@Company_Short_Code+'/'+@Year_Code+'/OTR/',''),0)) desc
end
else
begin
select @Screen_Ref_No=@Company_Short_Code+'/'+@Year_Code+'/OTR/1'
END
END

ELSE IF @Screen_Name='PURCHASE REQUEST'
begin

IF exists(select TOP 1 'PURCHASE REQUEST' from [VPurchase].[TBL_PURCHASE_REQUEST_HDR] where PURCHASE_REQUEST_NO   like '%'+@Company_Short_Code+'/'+@Year_Code+'/PR/'+'%')
begin

select TOP 1  @Screen_Ref_No= @Company_Short_Code+'/'+@Year_Code+'/PR/'+convert(varchar(50),ISNULL(replace(PURCHASE_REQUEST_NO ,@Company_Short_Code+'/'+@Year_Code+'/PR/',''),0)+1) from [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
where PURCHASE_REQUEST_NO  like '%'+@Company_Short_Code+'/'+@Year_Code+'/PR/'+'%'
order by convert(int,ISNULL(replace(PURCHASE_REQUEST_NO ,@Company_Short_Code+'/'+@Year_Code+'/PR/',''),0)) desc
end
else
begin
select @Screen_Ref_No=@Company_Short_Code+'/'+@Year_Code+'/PR/1'
END
END

END
GO
