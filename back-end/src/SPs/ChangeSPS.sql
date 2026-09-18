-- Login SP

CREATE PROCEDURE [VMaster].[LOGIN_USER]
(
    @LOGIN_NAME VARCHAR(50),
    @PASSWORD VARCHAR(255)
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        LOGIN_ID,
        LOGIN_NAME,
        ROLE,
        MAIL_ID,
        STOCK_SHOW_STATUS,
        OUTSIDE_ACCESS_Y_N
    FROM VMaster.TBL_USER_INFO_HDR
    WHERE LOGIN_NAME = @LOGIN_NAME
      AND PASSWORD = @PASSWORD;
END

-- ROLE SPS
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


-- MAIN MENU SPS
ALTER PROCEDURE [VMaster].[SAVE_MAIN_MENU]
(
    @MAIN_MENU_NAME VARCHAR(100),
    @MAIN_MENU_LOCATION VARCHAR(100),
    @MAIN_MENU_SEQ_ID INT,
    @STATUS_MASTER VARCHAR(20),
    @STYLE_CSS VARCHAR(1000),
    @PAGE_ACTION VARCHAR(100),
    @USER VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS
        (
            SELECT 1
            FROM [VMaster].[TBL_MAIN_MENU]
            WHERE UPPER(MAIN_MENU_NAME)=UPPER(@MAIN_MENU_NAME)
        )
        BEGIN
            SELECT 'error','MAIN MENU NAME ALREADY EXISTS','';
        END
        ELSE
        BEGIN
            INSERT INTO [VMaster].[TBL_MAIN_MENU]
            (
                MAIN_MENU_NAME,
                MAIN_MENU_LOCATION,
                MAIN_MENU_SEQ_ID,
                STATUS_MASTER,
                STYLE_CSS,
                PAGE_ACTION,
                CREATED_BY,
                CREATED_DATE,
                MODIFIED_BY,
                MODIFIED_DATE
            )
            VALUES
            (
                @MAIN_MENU_NAME,
                @MAIN_MENU_LOCATION,
                @MAIN_MENU_SEQ_ID,
                @STATUS_MASTER,
                @STYLE_CSS,
                @PAGE_ACTION,
                @USER,
                GETDATE(),
                @USER,
                GETDATE()
            );

            SELECT '', 'DATA SAVED SUCCESSFULLY', SCOPE_IDENTITY();
        END

        COMMIT TRANSACTION;
    END TRY

    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @MSG VARCHAR(MAX);

        SET @MSG =
            'ERROR: ' + ERROR_MESSAGE() +
            ' AT ' + ISNULL(ERROR_PROCEDURE(),'') +
            ' LINE: ' + CAST(ERROR_LINE() AS VARCHAR(10));

        RAISERROR(@MSG,16,1);
    END CATCH
END


-- SUB MENU SPS
ALTER PROCEDURE [VMaster].[SAVE_SUB_MENU]
(
    @MAIN_MENU_ID INT,
    @SUB_MENU_NAME VARCHAR(100),
    @SUB_MENU_LOCATION VARCHAR(100),
    @SUB_MENU_SEQ_ID INT,
    @STYLE_CSS VARCHAR(1000),
    @PAGE_ACTION VARCHAR(100),
    @IS_PARENT VARCHAR(25),
    @STATUS_MASTER VARCHAR(20),
    @USER VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS
        (
            SELECT 1
            FROM [VMaster].[TBL_SUB_MENU]
            WHERE UPPER(SUB_MENU_NAME) = UPPER(@SUB_MENU_NAME)
              AND MAIN_MENU_ID = @MAIN_MENU_ID
        )
        BEGIN
            SELECT 'error', 'SUB MENU NAME ALREADY EXISTS', '';
        END
        ELSE
        BEGIN
            INSERT INTO [VMaster].[TBL_SUB_MENU]
            (
                MAIN_MENU_ID,
                SUB_MENU_NAME,
                SUB_MENU_LOCATION,
                SUB_MENU_SEQ_ID,
                STYLE_CSS,
                PAGE_ACTION,
                IS_PARENT,
                STATUS_MASTER,
                CREATED_BY,
                CREATED_DATE,
                MODIFIED_BY,
                MODIFIED_DATE
            )
            VALUES
            (
                @MAIN_MENU_ID,
                @SUB_MENU_NAME,
                @SUB_MENU_LOCATION,
                @SUB_MENU_SEQ_ID,
                @STYLE_CSS,
                @PAGE_ACTION,
                @IS_PARENT,
                @STATUS_MASTER,
                @USER,
                GETDATE(),
                @USER,
                GETDATE()
            );

            SELECT '', 'DATA SAVED SUCCESSFULLY', SCOPE_IDENTITY();
        END

        COMMIT TRANSACTION;
    END TRY

    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @MSG VARCHAR(MAX);

        SET @MSG =
            'ERROR: ' + ERROR_MESSAGE() +
            ' AT ' + ISNULL(ERROR_PROCEDURE(), '') +
            ' LINE: ' + CAST(ERROR_LINE() AS VARCHAR(10));

        RAISERROR(@MSG, 16, 1);
    END CATCH
END
GO