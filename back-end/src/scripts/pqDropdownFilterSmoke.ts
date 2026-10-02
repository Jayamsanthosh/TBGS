import "dotenv/config";
import sqlLib from "mssql";
import { connectDB, getPool } from "../config/db";
import { loadPurchaseRequestOptionsService } from "../services/purchaseRequestMaster.services";

const sql: any = (sqlLib as any).default ?? sqlLib;

/* The quotation dropdown calls /purchase-request/load?statusEntry=CL and hides
   anything whose finalResponseStatus reads as rejected. This walks a request
   through every state the gate depends on and asserts what the dropdown would
   offer, so the filter cannot silently drift back to matching nothing. */
const SEEDS = [
  { no: "DD1", entry: "CF", frs: null as string | null, shown: false, why: "draft, never submitted" },
  { no: "DD2", entry: "CL", frs: null, shown: true, why: "submitted, awaiting approval" },
  { no: "DD3", entry: "CL", frs: "Approved", shown: true, why: "submitted and approved" },
  { no: "DD4", entry: "CL", frs: "Rejected", shown: false, why: "rejected at the final level" },
  { no: "DD5", entry: "CL", frs: "REJECT", shown: false, why: "rejected, stored in the short code" },
  { no: "DD6", entry: "CL", frs: "Hold", shown: true, why: "on hold is not a rejection" },
  { no: "DD7", entry: "INACTIVE", frs: "Approved", shown: false, why: "inactive is excluded" },
];
const PREFIX = "DR/FT202/PR/";

(async () => {
  await connectDB();
  const p: any = getPool();
  let pass = 0;
  let fail = 0;
  const ok = (n: string, c: boolean, x = "") => {
    if (c) { pass++; console.log("  PASS  " + n); }
    else { fail++; console.log("  FAIL  " + n + (x ? "   [" + x + "]" : "")); }
  };

  const created: string[] = [];
  try {
    for (const s of SEEDS) {
      const no = PREFIX + s.no;
      await p.request()
        .input("n", sql.VarChar(50), no)
        .input("e", sql.VarChar(10), s.entry)
        .input("f", sql.VarChar(20), s.frs)
        .query(
          `INSERT INTO VPurchase.TBL_PURCHASE_REQUEST_HDR
             (PURCHASE_REQUEST_NO, PURCHASE_REQUEST_DATE, COMPANY_ID, BRANCH_ID,
              CAMP_ID, PO_STORE_ID, STATUS_ENTRY, CREATED_BY, CREATED_DATE,
              FINAL_RESPONSE_STATUS)
           VALUES (@n, GETDATE(), 6, 1, 1, 1, @e, 'sri', GETDATE(), @f)`
        );
      created.push(no);
    }

    /* Exactly the call the quotation page makes. */
    const rows = (await loadPurchaseRequestOptionsService(null, "CL", null, false, null) as any[])
      .filter((r: any) => !/reject/i.test(String(r.finalResponseStatus ?? "")));

    console.log("\n=== dropdown contents per state ===");
    for (const s of SEEDS) {
      const no = PREFIX + s.no;
      const inList = rows.some((r: any) => r.purchaseRequestNo === no);
      console.log(`  ${no}  entry=${s.entry.padEnd(9)} final=${String(s.frs).padEnd(9)} -> ${inList ? "offered" : "hidden "}   ${s.why}`);
      ok(`${no} ${inList === s.shown ? "offered" : "hidden"} (${s.why})`, inList === s.shown, `shown=${inList} expected=${s.shown}`);
    }

    /* The regression this filter caused: matching nothing at all. */
    ok("dropdown is not empty", rows.length > 0, `count=${rows.length}`);
    ok("a submitted request is offered", rows.some((r: any) => r.purchaseRequestNo === PREFIX + "DD2"));

    /* Every offered row needs the fields the dropdown label and selection use. */
    const bad = rows.filter((r: any) => !r.purchaseRequestNo || !(r.displayText || r.purchaseRequestNo));
    ok("every offered row has a selectable value and a label", bad.length === 0, JSON.stringify(bad));
  } finally {
    for (const n of created) {
      await p.request().input("n", sql.VarChar(50), n)
        .query(`DELETE FROM VPurchase.TBL_PURCHASE_REQUEST_DTL WHERE PURCHASE_REQUEST_NO = @n`);
      await p.request().input("n", sql.VarChar(50), n)
        .query(`DELETE FROM VPurchase.TBL_PURCHASE_REQUEST_HDR WHERE PURCHASE_REQUEST_NO = @n`);
    }
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });