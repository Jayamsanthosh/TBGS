import { getPool } from "./src/config/db";

async function run() {
  const pool = getPool();
  if (!pool) {
    console.log("No pool");
    return;
  }
  
  try {
    const roles = await pool.request().query("SELECT * FROM VMaster.TBL_ROLE_MASTER");
    console.log("Roles:");
    console.table(roles.recordset);

    const mainMenus = await pool.request().query("SELECT * FROM VMaster.TBL_MAIN_MENU");
    console.log("\nMain Menus:");
    console.table(mainMenus.recordset);

    const subMenus = await pool.request().query("SELECT * FROM VMaster.TBL_SUB_MENU");
    console.log("\nSub Menus:");
    console.table(subMenus.recordset);

    const links = await pool.request().query("SELECT * FROM VMaster.TBL_LINKS_AND_PAGES");
    console.log("\nLinks:");
    console.table(links.recordset);
    
    const roleLinks = await pool.request().query("SELECT * FROM VMaster.TBL_ROLE_TO_LINK_AND_PAGE");
    console.log("\nRole to Link Mapping:");
    console.table(roleLinks.recordset);

  } catch (err) {
    console.error(err);
  }
  
  process.exit(0);
}

setTimeout(run, 1000);
