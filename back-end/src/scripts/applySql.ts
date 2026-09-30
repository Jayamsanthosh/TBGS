/* Applies a .sql file, splitting on GO, through the project's own connection. */
import * as fs from "fs";
import * as path from "path";
import { connectDB, getPool } from "../config/db";

const file = process.argv[2];
if (!file) {
  console.error("usage: ts-node src/scripts/applySql.ts <file.sql>");
  process.exit(1);
}

const main = async () => {
  await connectDB();
  const pool = getPool()!;
  const sqlText = fs.readFileSync(path.resolve(file), "utf8");
  const batches = sqlText
    .split(/^\s*GO\s*$/gim)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  let n = 0;
  for (const batch of batches) {
    n += 1;
    try {
      await pool.request().batch(batch);
      console.log(`  applied batch ${n}`);
    } catch (error: any) {
      console.error(`  BATCH ${n} FAILED: ${error?.message ?? error}`);
      process.exit(1);
    }
  }
  console.log(`done, ${n} batches`);
  await pool.close();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
