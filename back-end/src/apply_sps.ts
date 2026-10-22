import fs from "fs";
import path from "path";
import sql from "mssql";
import "dotenv/config";
import { SP_FILES } from "./scripts/spFiles";

const { DB_SERVER, DB_DATABASE, DB_UID, DB_PWD } = process.env as any;
const connectionString =
  `Driver={ODBC Driver 18 for SQL Server};` +
  `Server=${DB_SERVER};Database=${DB_DATABASE};Uid=${DB_UID};Pwd={${DB_PWD}};Encrypt=yes;TrustServerCertificate=yes;`;

async function main() {
  const pool = await sql.connect({ connectionString } as any);
  console.log("Connected to DB.");

  const spsDir = path.join(__dirname, "SPs");

  /* The files are applied in the order of src/scripts/spFiles.ts, not in
     alphabetical order: a file that changes the schema has to run before the
     procedures that read it. */
  for (const file of SP_FILES) {
    const full = path.join(spsDir, file);
    if (!fs.existsSync(full)) {
      console.error(`  -> ERROR in ${file}: file not found`);
      continue;
    }

    console.log(`Applying ${file}...`);
    const content = fs.readFileSync(full, "utf-8");

    /* GO is a batch separator, not T-SQL, so the file is split on it and the
       batches run one at a time - CREATE OR ALTER PROCEDURE has to be the
       first statement in its batch. */
    const batches = content
      .split(/^\s*GO\s*$/gim)
      .map((b) => b.trim())
      .filter(Boolean);

    try {
      /* All the batches of a file run on one connection, so the session options
         a procedure is created with are the ones the file asked for. */
      const conn: any = await (pool as any).connect();
      try {
        await conn.request().batch("SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;");
        for (const b of batches) await conn.request().batch(b);
      } finally {
        conn.release();
      }
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
