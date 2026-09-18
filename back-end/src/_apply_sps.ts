import sql from "mssql";
import "dotenv/config";
import fs from "fs";
import path from "path";

const { DB_SERVER, DB_DATABASE, DB_UID, DB_PWD } = process.env as any;
const connectionString =
  `Driver={ODBC Driver 18 for SQL Server};` +
  `Server=${DB_SERVER};Database=${DB_DATABASE};Uid=${DB_UID};Pwd={${DB_PWD}};Encrypt=yes;TrustServerCertificate=yes;`;

const SP_FILES = [
  "GET_REQUEST_SUMMARY.sql",
  "GET_REQUEST_LIST_BY_TYPE.sql",
  "UPDATE_REQUEST_STATUS.sql",
];

async function applyBatch(pool: sql.ConnectionPool, batchSql: string, label: string) {
  await pool.request().batch(batchSql);
  console.log(`  ✅  ${label}`);
}

async function main() {
  const pool = await sql.connect({ connectionString } as any);
  console.log("Connected.\n");

  for (const file of SP_FILES) {
    const filePath = path.join(__dirname, "SPs", file);
    const spSql = fs.readFileSync(filePath, "utf8");
    const batches = spSql.split(/^\s*GO\s*$/im).map(b => b.trim()).filter(Boolean);
    console.log(`Applying ${file} (${batches.length} batch(es))...`);
    for (const batch of batches) {
      await applyBatch(pool, batch, batch.slice(0, 60).replace(/\s+/g, ' ') + "...");
    }
  }

  console.log("\n🎉  All SPs applied successfully.\n");

  // Quick smoke test: call GET_REQUEST_SUMMARY
  const summary = await pool.request().execute("VRequest.GET_REQUEST_SUMMARY");
  console.log("GET_REQUEST_SUMMARY result:");
  console.table(summary.recordset);

  // Quick smoke test: GET_REQUEST_LIST_BY_TYPE for Arrears
  const list = await pool.request()
    .input("RequestType", sql.VarChar(100), "Arrears Request")
    .input("Status", sql.VarChar(50), "ALL")
    .execute("VRequest.GET_REQUEST_LIST_BY_TYPE");
  console.log(`\nGET_REQUEST_LIST_BY_TYPE 'Arrears Request' → ${list.recordset.length} row(s)`);
  if (list.recordset.length > 0) {
    console.log("First row fields:", Object.keys(list.recordset[0]).join(", "));
  }

  await (sql as any).close();
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});