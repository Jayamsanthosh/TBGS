import sql from "mssql";
import { getPool } from "../config/db";

export const getNavigationHierarchyService = async (roleName: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const roleResult = await pool
      .request()
      .input("ROLE_NAME", sql.VarChar, roleName)
      .query("SELECT ROLE_ID FROM VMaster.TBL_ROLE_MASTER WHERE ROLE_NAME = @ROLE_NAME");

    if (!roleResult.recordset || roleResult.recordset.length === 0) {
      console.warn(`Role not found: ${roleName}`);
      return [];
    }

    const roleId = roleResult.recordset[0].ROLE_ID;

    // 1. Fetch Main Menus
    const mainMenuResult = await pool
      .request()
      .input("Role_Id", sql.Int, roleId)
      .execute("VMaster.Load_Main_Menu_Using_Role_Id");
    
    const mainMenus = mainMenuResult.recordset || [];

    // 2. Fetch Sub Menus and Links for each Main Menu
    const hierarchy = await Promise.all(
      mainMenus.map(async (mainMenu) => {
        const subMenuResult = await pool
          .request()
          .input("Role_Id", sql.Int, roleId)
          .input("Main_Menu_Id", sql.Int, mainMenu.main_menu_id)
          .execute("VMaster.Load_Sub_Menu_Using_Rold_Main_Menu_Id");
        
        const subMenus = subMenuResult.recordset || [];

        const subMenusWithLinks = await Promise.all(
          subMenus.map(async (subMenu) => {
            // NOTE: VMaster.Load_Link_Using_Role_Sub_Menu_Id selects an
            // unqualified `link_id`, which is ambiguous now that both
            // vmaster.tbl_role_to_link_and_page and vmaster.tbl_links_and_pages
            // have a LINK_ID column. The SP is left untouched; qualify the
            // columns here instead so the sidebar loads.
            const linkResult = await pool
              .request()
              .input("Role_Id", sql.Int, roleId)
              .input("Sub_Menu_Id", sql.Int, subMenu.sub_menu_id)
              .query(`
                SELECT
                  b.link_id              AS link_id,
                  b.link_name            AS link_name,
                  b.page_action          AS page_action,
                  b.redirection_type     AS redirection_type,
                  b.link_Location        AS link_Location,
                  b.link_seq_id          AS link_seq_id,
                  ISNULL(b.style_css,'') AS style_css
                FROM vmaster.tbl_role_to_link_and_page AS A
                INNER JOIN vmaster.tbl_links_and_pages AS b
                  ON a.link_id_role_to_link = b.link_id
                WHERE a.role_id_role_to_link = @Role_Id
                  AND b.sub_menu_id = @Sub_Menu_Id
                  AND a.status_role_to_link = 'AC'
                  AND b.status_master = 'AC'
                ORDER BY b.link_seq_id
              `);

            return {
              ...subMenu,
              links: linkResult.recordset || [],
            };
          })
        );

        return {
          ...mainMenu,
          subMenus: subMenusWithLinks,
        };
      })
    );

    return hierarchy;
  } catch (error) {
    console.error("Error fetching navigation hierarchy:", error);
    throw error;
  }
};
