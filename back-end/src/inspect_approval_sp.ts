import sql from "mssql";
import "dotenv/config";

const { DB_SERVER, DB_DATABASE, DB_UID, DB_PWD } = process.env as any;
const connectionString =
  `Driver={ODBC Driver 18 for SQL Server};` +
  `Server=${DB_SERVER};Database=${DB_DATABASE};Uid=${DB_UID};Pwd={${DB_PWD}};Encrypt=yes;TrustServerCertificate=yes;`;

async function main() {
  const pool = await sql.connect({ connectionString } as any);
  console.log("Connected.\n");

  // 1. Get current GET_REQUEST_SUMMARY definition
  const def = await pool.request().query(`
    SELECT m.definition
    FROM sys.sql_modules m
    JOIN sys.objects o ON o.object_id = m.object_id
    JOIN sys.schemas s ON s.schema_id = o.schema_id
    WHERE o.name = 'GET_REQUEST_SUMMARY'
  `);
  if (def.recordset.length > 0) {
    console.log("===== Current GET_REQUEST_SUMMARY =====");
    console.log(def.recordset[0].definition);
  } else {
    console.log("GET_REQUEST_SUMMARY not found in DB.");
  }

  await (sql as any).close();
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});