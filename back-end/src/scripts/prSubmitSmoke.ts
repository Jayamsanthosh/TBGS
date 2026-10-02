import "dotenv/config";
import sqlLib from "mssql";
import * as fs from "fs";
import { connectDB, getPool } from "../config/db";
import { submitPurchaseRequestService } from "../services/purchaseRequestMaster.services";

const sql: any = (sqlLib as any).default ?? sqlLib;
const OUT = "C:/Users/solai/AppData/Local/Temp/opencode/pr_submit.txt";

const snapRow = async (p: any, no: string) => {
  const h = await p
    .request()
    .input("n", sql.VarChar(50), no)
    .query(
      `SELECT PURCHASE_REQUEST_NO, STATUS_ID, STATUS_ENTRY, FINAL_RESPONSE_STATUS,
              MODIFIED_BY, MODIFIED_DATE, MODIFIED_MAC_ADDRESS
       FROM VPurchase.TBL_PURCHASE_REQUEST_HDR WHERE PURCHASE_REQUEST_NO = @n`
    );
  const d = await p
    .request()
    .input("n", sql.VarChar(50), no)
    .query(
      `SELECT PURCHASE_REQUEST_DTL_ID, STATUS_ENTRY, MODIFIED_BY, MODIFIED_DATE, MODIFIED_MAC_ADDRESS
       FROM VPurchase.TBL_PURCHASE_REQUEST_DTL WHERE PURCHASE_REQUEST_NO = @n ORDER BY LINE_NO`
    );
  return { hdr: h.recordset[0] || null, dtl: d.recordset };
};

const restore = async (p: any, no: string, saved: any) => {
  const s = saved.hdr;
  await p
    .request()
    .input("no", sql.VarChar(50), no)
    .input("sid", sql.Int, s.STATUS_ID ?? null)
    .input("entry", sql.VarChar(20), s.STATUS_ENTRY ?? null)
    .input("by", sql.VarChar(50), s.MODIFIED_BY ?? null)
    .input("dt", sql.DateTime, s.MODIFIED_DATE ?? null)
    .input("mac", sql.VarChar(50), s.MODIFIED_MAC_ADDRESS ?? null)
    .query(
      `UPDATE VPurchase.TBL_PURCHASE_REQUEST_HDR
       SET STATUS_ID = @sid, STATUS_ENTRY = @entry, MODIFIED_BY = @by,
           MODIFIED_DATE = @dt, MODIFIED_MAC_ADDRESS = @mac
       WHERE PURCHASE_REQUEST_NO = @no`
    );
  for (const row of saved.dtl) {
    await p
      .request()
      .input("id", sql.Int, row.PURCHASE_REQUEST_DTL_ID)
      .input("entry", sql.VarChar(20), row.STATUS_ENTRY ?? null)
      .input("by", sql.VarChar(50), row.MODIFIED_BY ?? null)
      .input("dt", sql.DateTime, row.MODIFIED_DATE ?? null)
      .input("mac", sql.VarChar(50), row.MODIFIED_MAC_ADDRESS ?? null)
      .query(
        `UPDATE VPurchase.TBL_PURCHASE_REQUEST_DTL
         SET STATUS_ENTRY = @entry, MODIFIED_BY = @by, MODIFIED_DATE = @dt, MODIFIED_MAC_ADDRESS = @mac
         WHERE PURCHASE_REQUEST_DTL_ID = @id`
      );
  }
};

(async () => {
  await connectDB();
  const p: any = getPool();
  const o: string[] = [];
  let pass = 0;
  let fail = 0;
  const ok = (name: string, cond: boolean, extra = "") => {
    if (cond) { pass++; o.push("  PASS  " + name); }
    else { fail++; o.push("  FAIL  " + name + (extra ? "   [" + extra + "]" : "")); }
  };

  // Use the highest-numbered request as the fixture, and restore it at the end.
  const list = await p.request().query(`SELECT TOP 1 PURCHASE_REQUEST_NO FROM VPurchase.TBL_PURCHASE_REQUEST_HDR ORDER BY PURCHASE_REQUEST_NO DESC`);
  const no = list.recordset[0].PURCHASE_REQUEST_NO;
  const saved = await snapRow(p, no);
  o.push("fixture " + no + "  statusId=" + saved.hdr.STATUS_ID + "  entry=" + JSON.stringify(saved.hdr.STATUS_ENTRY) + "  dtlRows=" + saved.dtl.length);

  try {
    // 1) Basic submit moves status + entry together.
    const r1 = await submitPurchaseRequestService(no, 3, "SMOKE", "TESTMAC");
    ok("submit reports changed=1", r1.changed === 1, "changed=" + r1.changed);
    const s1 = await snapRow(p, no);
    ok("hdr STATUS_ID -> PENDING_APPROVAL(3)", Number(s1.hdr.STATUS_ID) === 3, "got " + s1.hdr.STATUS_ID);
    ok("hdr STATUS_ENTRY -> CL", String(s1.hdr.STATUS_ENTRY).toUpperCase() === "CL", "got " + JSON.stringify(s1.hdr.STATUS_ENTRY));
    ok("all dtl STATUS_ENTRY -> CL", s1.dtl.every((d: any) => String(d.STATUS_ENTRY).toUpperCase() === "CL"), JSON.stringify(s1.dtl.map((d: any) => d.STATUS_ENTRY)));
    ok("audit MODIFIED_BY written", s1.hdr.MODIFIED_BY === "SMOKE", "got " + s1.hdr.MODIFIED_BY);
    ok("audit MAC written", s1.hdr.MODIFIED_MAC_ADDRESS === "TESTMAC", "got " + s1.hdr.MODIFIED_MAC_ADDRESS);

    // 2) Idempotent: re-submit must be a no-op, not an error.
    const r2 = await submitPurchaseRequestService(no, 3, "SMOKE2", "TESTMAC2");
    ok("re-submit reports changed=0", r2.changed === 0, "changed=" + r2.changed);
    ok("re-submit message says already submitted", /already submitted/i.test(r2.message), r2.message);

    // 3) Half-way row (correct status, still CF) must be corrected.
    await p.request().input("no", sql.VarChar(50), no).query(`UPDATE VPurchase.TBL_PURCHASE_REQUEST_HDR SET STATUS_ENTRY='CF' WHERE PURCHASE_REQUEST_NO=@no`);
    await p.request().input("no", sql.VarChar(50), no).query(`UPDATE VPurchase.TBL_PURCHASE_REQUEST_DTL SET STATUS_ENTRY='CF' WHERE PURCHASE_REQUEST_NO=@no`);
    const r3 = await submitPurchaseRequestService(no, 3, "SMOKE3", "TESTMAC");
    ok("pending-but-CF row is corrected", r3.changed === 1, "changed=" + r3.changed);
    const s3 = await snapRow(p, no);
    ok("corrected hdr is CL", String(s3.hdr.STATUS_ENTRY).toUpperCase() === "CL");

    // 4) Approval history must survive submitting.
    const hist = await p.request().input("no", sql.VarChar(50), no).query(`SELECT FINAL_RESPONSE_STATUS FROM VPurchase.TBL_PURCHASE_REQUEST_HDR WHERE PURCHASE_REQUEST_NO=@no`);
    const wasFinal = saved.hdr.FINAL_RESPONSE_STATUS ?? null;
    ok("FINAL_RESPONSE_STATUS preserved", (hist.recordset[0].FINAL_RESPONSE_STATUS ?? null) === wasFinal,
       String(hist.recordset[0].FINAL_RESPONSE_STATUS) + " vs " + String(wasFinal));

    // 5) Inactive request must be refused.
    await p.request().input("no", sql.VarChar(50), no).query(`UPDATE VPurchase.TBL_PURCHASE_REQUEST_HDR SET STATUS_ENTRY='INACTIVE' WHERE PURCHASE_REQUEST_NO=@no`);
    let refused = "";
    try { await submitPurchaseRequestService(no, 3, "SMOKE", "TESTMAC"); } catch (e: any) { refused = e.message; }
    ok("inactive request refused", /inactive/i.test(refused), refused);

    // 6) Missing status id is a 400, not a crash.
    let bad: any = null;
    try { await submitPurchaseRequestService(no, NaN as any, "SMOKE", "TESTMAC"); } catch (e: any) { bad = e; }
    ok("missing status id -> httpStatus 400", bad?.httpStatus === 400, String(bad?.message));

    // 7) Unknown ref number is refused by the SP.
    let missing = "";
    try { await submitPurchaseRequestService("ZZZ/NOPE/999", 3, "SMOKE", "TESTMAC"); } catch (e: any) { missing = e.message; }
    ok("unknown ref refused", /does not exist/i.test(missing), missing);
  } finally {
    await restore(p, no, saved);
    const after = await snapRow(p, no);
    const sameHdr =
      Number(after.hdr.STATUS_ID) === Number(saved.hdr.STATUS_ID) &&
      String(after.hdr.STATUS_ENTRY) === String(saved.hdr.STATUS_ENTRY);
    ok("fixture restored", sameHdr,
       "statusId " + saved.hdr.STATUS_ID + "->" + after.hdr.STATUS_ID + " entry " + JSON.stringify(saved.hdr.STATUS_ENTRY) + "->" + JSON.stringify(after.hdr.STATUS_ENTRY));
    o.push("");
    o.push(pass + " passed, " + fail + " failed");
  }

  fs.writeFileSync(OUT, o.join("\r\n"), "utf8");
  process.exit(fail > 0 ? 1 : 0);
})();