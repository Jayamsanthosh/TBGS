/* Document Management System corrections.

   Issue: UPDATE_DOCUMENT_MANAGEMENT_SYSTEM assigns CONTENT_DATA = @CONTENT_DATA
   unconditionally. A metadata-only update (change the description, keep the file)
   therefore sends no CONTENT_DATA, the parameter arrives as NULL and the stored
   file is silently erased. Verified against the live table: a description-only
   update left DATALENGTH(CONTENT_DATA) at NULL.

   Fix: only overwrite the binary when one was actually supplied, so an update
   that does not re-upload the file leaves the existing content in place.
   Every other column keeps the plain assignment because those are meant to be
   edited in place. The output shape and parameter list are unchanged. */
USE [TBGS]
GO
ALTER PROCEDURE [VMaster].[UPDATE_DOCUMENT_MANAGEMENT_SYSTEM]
(
    @DMS_ID INT,
    @LINK_PAGES_ID INT,
    @PAGE_REF_NO VARCHAR(50),
    @DOCUMENT_TYPE VARCHAR(50),
    @DESCRIPTIONS VARCHAR(100),
    @FILE_NAME VARCHAR(150),
    @CONTENT_TYPE VARCHAR(50),
    @CONTENT_DATA VARBINARY(MAX),
    @REMARKS VARCHAR(100),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS
    (
        SELECT 'CHECK'
        FROM [VMaster].[TBL_DOCUMENT_MANAGEMENT_SYSTEM]
        WHERE PAGE_REF_NO = @PAGE_REF_NO
          AND FILE_NAME = @FILE_NAME
          AND DMS_ID <> @DMS_ID
    )
    BEGIN
        SELECT 'error','Document Already Exists','';
    END
    ELSE
    BEGIN
        UPDATE [VMaster].[TBL_DOCUMENT_MANAGEMENT_SYSTEM]
        SET
            LINK_PAGES_ID = @LINK_PAGES_ID,
            PAGE_REF_NO = @PAGE_REF_NO,
            DOCUMENT_TYPE = @DOCUMENT_TYPE,
            DESCRIPTIONS = @DESCRIPTIONS,
            FILE_NAME = @FILE_NAME,
            CONTENT_TYPE = @CONTENT_TYPE,
            CONTENT_DATA = COALESCE(@CONTENT_DATA, CONTENT_DATA),
            REMARKS = @REMARKS,
            STATUS_MASTER = @STATUS_MASTER,
            MODIFIED_BY = @USER,
            MODIFIED_DATE = GETDATE(),
            MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
        WHERE DMS_ID = @DMS_ID;

        SELECT '',
               'Data Updated Successfully',
               @DMS_ID
    END
END
GO

/* Same class of hole in the delete guard: IF @ROLE <> 'Admin' is UNKNOWN, not
   TRUE, when @ROLE is NULL, so a missing role falls into the ELSE branch and the
   row is deleted. ISNULL makes an absent role fail the check instead. */
ALTER PROCEDURE [VMaster].[DELETE_DOCUMENT_MANAGEMENT_SYSTEM]
(
    @DMS_ID INT,
    @USER VARCHAR(50),
    @ROLE VARCHAR(50),
    @MAC_ADDRESS VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON

    IF ISNULL(@ROLE, '') <> 'Admin'
    BEGIN
        SELECT 'error','No Rights To Delete','';
    END
    ELSE
    BEGIN
        DELETE FROM [VMaster].[TBL_DOCUMENT_MANAGEMENT_SYSTEM]
        WHERE DMS_ID = @DMS_ID

        SELECT '',
               'Data Deleted Successfully',
               @DMS_ID;
    END
END
GO
