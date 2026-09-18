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
            const linkResult = await pool
              .request()
              .input("Role_Id", sql.Int, roleId)
              .input("Sub_Menu_Id", sql.Int, subMenu.sub_menu_id)
              .execute("VMaster.Load_Link_Using_Role_Sub_Menu_Id");

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
