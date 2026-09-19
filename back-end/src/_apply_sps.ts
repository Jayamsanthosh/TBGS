import sql from "mssql";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectDB } from "./config/db";

const SP_FILES = [
  "report_master.sql",
  "report_dashboard_insights.sql",
  "GET_REQUEST_SUMMARY.sql",
  "GET_REQUEST_LIST_BY_TYPE.sql",
  "UPDATE_REQUEST_STATUS.sql",
  "get_attendance_request.sql",
  "get_cash_advance_request.sql",
  "get_arrears_request.sql",
  "get_overtime_request.sql",
  "get_bonus_request.sql",
  "get_leave_encashment_request.sql",
  "get_promotion_demotion_transfer_request.sql",
  "get_man_power_change_request.sql",
];

async function applyBatch(pool: sql.ConnectionPool, batchSql: string, label: string) {
  await pool.request().batch(batchSql);
  console.log(`  ✅  ${label}`);
}

async function main() {
  const pool = await connectDB();
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