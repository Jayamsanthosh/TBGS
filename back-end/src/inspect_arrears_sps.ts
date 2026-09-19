import sql from "mssql";
import "dotenv/config";

const { DB_SERVER, DB_DATABASE, DB_UID, DB_PWD } = process.env as any;
const connectionString =
  `Driver={ODBC Driver 18 for SQL Server};` +
  `Server=${DB_SERVER};Database=${DB_DATABASE};Uid=${DB_UID};Pwd={${DB_PWD}};Encrypt=yes;TrustServerCertificate=yes;`;

async function main() {
  const pool = await sql.connect({ connectionString } as any);
  console.log("Connected.\n");

  const def = await pool.request().query(`
    SELECT o.name
    FROM sys.objects o
    WHERE o.type = 'P' AND o.name LIKE '%ARREARS_REQUEST%'
  `);
  console.log("===== Arrears Request SPs =====");
  console.table(def.recordset);

  await (sql as any).close();
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
