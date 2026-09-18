import sql from "mssql/msnodesqlv8";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const config: sql.config = {
  server: process.env.SERVER_NAME || "localhost",
  database: process.env.DATABASE_NAME || "TBGS",
  driver: "ODBC Driver 18 for SQL Server",
  options: {
    instanceName: process.env.INSTANCE_NAME || "SQLEXPRESS",
    trustedConnection: true,
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 15000,
    requestTimeout: 15000,
  },
};

const run = async () => {
  const pool: any = await sql.connect(config);
  const r = await pool.request().query(`
    SELECT DISTINCT L.PAGE_ACTION FROM VMaster.TBL_LINKS_AND_PAGES L
  `);
  const dbRoutes = new Set(r.recordset.map((x: any) => x.PAGE_ACTION));

  const appDir = "V:\\tbgs\\front-end\\app";
  const dirs = fs.readdirSync(appDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((n) => !n.startsWith("(") && !n.startsWith("["));
  const appRoutes = dirs.map((n) => "/" + n);

  console.log("== APP ROUTES NOT IN DB ==");
  const missing = appRoutes.filter((r) => !dbRoutes.has(r));
  for (const m of missing) console.log(m);
  console.log("missing count:", missing.length);

  console.log("== DB ROUTES NOT IN APP (broken/stale) ==");
  const stale = [...dbRoutes].filter((r) => !appRoutes.includes(r)).sort();
  for (const s of stale) console.log(s);
  console.log("stale count:", stale.length);

  await pool.close();
};

run().catch((e) => {
  console.log("FAILED:", e.message);
  process.exit(1);
});
