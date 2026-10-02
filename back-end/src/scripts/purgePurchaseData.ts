/* Backs up then clears every Purchase Request and Purchase Quotation row.
   Deletes in FK-safe order (children first) and verifies afterwards.

   Order matters: TBL_PURCHASE_ORDER_DTL holds an FK to both the quotation detail
   and the request detail, so the order rows have to go before the rows they point
   at, or the server refuses the delete.

   The backup is written first so this is reversible. */
import "dotenv/config";
import * as fs from "fs";
import sql from "mssql";
import { connectDB, getPool } from "../config/db";

const BACKUP = "C:/Users/solai/AppData/Local/Temp/opencode/purchase_data_backup.json";

/* Children before parents, matching the foreign keys:
     PO additional charges -> PO detail -> PO header
     quotation additional charges -> quotation conversation -> quotation detail -> quotation header
     request detail -> request header */
const TABLES = [
  "VPurchase.TBL_PURCHASE_ORDER_ADDITIONAL_CHARGES_DTL",
  "VPurchase.TBL_PURCHASE_ORDER_DTL",
  "VPurchase.TBL_PURCHASE_ORDER_HDR",
  "VPurchase.TBL_PURCHASE_QUOTATION_ADDITIONAL_CHARGES_DTL",
  "VPurchase.TBL_PURCHASE_QUOTATION_CONVERSATION_DTL",
  "VPurchase.TBL_PURCHASE_QUOTATION_DTL",
  "VPurchase.TBL_PURCHASE_QUOTATION_HDR",
  "VPurchase.TBL_PURCHASE_REQUEST_DTL",
  "VPurchase.TBL_PURCHASE_REQUEST_HDR",
];

/* "[schema].[table]" - each part bracketed separately. Bracketing the whole
   dotted string makes SQL read it as one identifier and it fails as invalid. */
const q = (t: string) => "[" + t.split(".").join("].[") + "]";

(async () => {
  await connectDB();
  const p: any = getPool();

  /* ---------------------------------------------------------- 1. backup */
  console.log("=== 1. backing up ===");
  const backup: Record<string, any[]> = {};
  for (const t of TABLES) {
    const r = await p.request().query(`SELECT * FROM ${q(t)}`);
    backup[t] = r.recordset;
    console.log(`  ${t.padEnd(56)} ${String(r.recordset.length).padStart(4)} rows`);
  }
  fs.writeFileSync(BACKUP, JSON.stringify(backup, null, 1), "utf8");
  const total = Object.values(backup).reduce((n, rows) => n + rows.length, 0);
  console.log(`  wrote ${total} rows to ${BACKUP}`);

  /* ---------------------------------------------------------- 2. delete */
  /* One transaction, so a foreign key refusing any single table rolls the whole
     thing back instead of leaving the set half-cleared. */
  console.log("\n=== 2. deleting ===");
  const tr = new sql.Transaction(p as any);
  try {
    await tr.begin();
    for (const t of TABLES) {
      const r = await tr.request().query(`DELETE FROM ${q(t)}`);
      console.log(`  ${t.padEnd(56)} deleted ${r.rowsAffected[0]}`);
    }
    await tr.commit();
    console.log("  committed");
  } catch (e) {
    await tr.rollback().catch(() => undefined);
    console.error("  rolled back - nothing was deleted:", (e as Error).message);
    throw e;
  }

  /* ---------------------------------------------------------- 3. verify */
  console.log("\n=== 3. verifying ===");
  let bad = 0;
  for (const t of TABLES) {
    const r = await p.request().query(`SELECT COUNT(*) AS n FROM ${q(t)}`);
    const n = r.recordset[0].n;
    if (n !== 0) {
      bad += 1;
      console.log(`  NOT EMPTY  ${t} -> ${n}`);
    }
  }
  if (bad === 0) console.log("  all 9 tables are empty");

  /* A leftover child row would have failed the batch outright, so the counts
     double as proof no dependent data was orphaned. */
  console.log("\nbackup kept at: " + BACKUP);
  process.exit(bad === 0 ? 0 : 1);
})().catch((e) => {
  console.error("failed:", e);
  process.exit(1);
});
