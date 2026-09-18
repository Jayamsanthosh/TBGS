import fs from "fs";
import path from "path";
import sql from "mssql";
import "dotenv/config";

const { DB_SERVER, DB_DATABASE, DB_UID, DB_PWD } = process.env as any;
const connectionString =
  `Driver={ODBC Driver 18 for SQL Server};` +
  `Server=${DB_SERVER};Database=${DB_DATABASE};Uid=${DB_UID};Pwd={${DB_PWD}};Encrypt=yes;TrustServerCertificate=yes;`;

async function main() {
  const pool = await sql.connect({ connectionString } as any);
  console.log("Connected to DB.");

  const spsDir = path.join(__dirname, "SPs");
  const files = fs.readdirSync(spsDir).filter(f => f.endsWith(".sql"));

  for (const file of files) {
    console.log(`Applying ${file}...`);
    const content = fs.readFileSync(path.join(spsDir, file), "utf-8");
    
    // Split on GO if present, but mssql doesn't support GO, so we execute it as one block if it's just ALTER PROCEDURE.
    // If it has multiple GO statements, we'd need to split, but ALTER PROC is usually one block.
    try {
      await pool.request().batch(content);
      console.log(`  -> SUCCESS: ${file}`);
    } catch (e: any) {
      console.error(`  -> ERROR in ${file}:`, e.message);
    }
  }

  await (sql as any).close();
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
