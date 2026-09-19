import sql from "mssql";
import "dotenv/config";

const { DB_SERVER, DB_DATABASE, DB_UID, DB_PWD } = process.env as any;
const connectionString =
  `Driver={ODBC Driver 18 for SQL Server};` +
  `Server=${DB_SERVER};Database=${DB_DATABASE};Uid=${DB_UID};Pwd={${DB_PWD}};Encrypt=yes;TrustServerCertificate=yes;`;

async function main() {
  const pool = await sql.connect({ connectionString } as any);
  console.log("Connected.\n");

  const links = await pool.request().query(`
    SELECT * FROM [VMaster].[TBL_LINKS_PAGES] WHERE LINK_NAME LIKE '%Arrears%' OR MENU_SLUG LIKE '%arrears%'
  `);
  console.log("===== Links =====");
  console.table(links.recordset);

  // Check role links
  if (links.recordset.length > 0) {
    const linkId = links.recordset[0].LINK_PAGES_ID;
    const roles = await pool.request().query(`
      SELECT r.ROLE_NAME, rl.* 
      FROM [VMaster].[TBL_ROLE_TO_LINK] rl
      JOIN [VMaster].[TBL_ROLE_MASTER] r ON r.ROLE_ID = rl.ROLE_ID
      WHERE rl.LINK_PAGES_ID = ${linkId}
    `);
    console.log("===== Role to Link =====");
    console.table(roles.recordset);
  }

  await (sql as any).close();
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
