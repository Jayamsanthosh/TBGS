import "dotenv/config";
import sqlLib from "mssql";
import { connectDB, getPool } from "../config/db";
import { savePurchaseRequestCombinedService, submitPurchaseRequestService } from "../services/purchaseRequestMaster.services";

const sql: any = (sqlLib as any).default ?? sqlLib;

/* The Purchase Quotation wizard offers requests in a dropdown and pulls their
   lines into the quotation. A request that has been fully pulled in has nothing
   left to give, so it must not be offered again - the user asked for exactly
   that. This exercises the two facts the rule depends on:
     1. the grid read reports how many lines a request has (detailLineCount),
     2. that count is right for a one-line and a multi-line request,
   and checks the client-side rule against them. */
const isFullyImported = (
  row: any,
  importedCountByRequest: Map<string, number>
) => {
  const no = String(row?.purchaseRequestNo ?? "").trim();
  if (!no) return false;
  const total = Number(row?.detailLineCount);
  if (!Number.isFinite(total) || total <= 0) return false;
  return (importedCountByRequest.get(no) ?? 0) >= total;
};

const countFrom = (dtls: any[]) => {
  const counts = new Map<string, number>();
  for (const r of dtls) {
    const no = String(r.PURCHASE_REQUEST_NO ?? "").trim();
    if (!no) continue;
    counts.set(no, (counts.get(no) ?? 0) + 1);
  }
  return counts;
};

(async () => {
  await connectDB();
  const p: any = getPool();
  let pass = 0;
  let fail = 0;
  const ok = (n: string, c: boolean, x = "") => {
    if (c) { pass++; console.log("  PASS  " + n); }
    else { fail++; console.log("  FAIL  " + n + (x ? "   [" + x + "]" : "")); }
  };

  const st = await p.request().query(
    `SELECT STATUS_ID, UPPER(LTRIM(RTRIM(ISNULL(STATUS_NAME,'')))) AS nm FROM VMaster.TBL_STATUS_MASTER`
  );
  const idFor = (n: string) => st.recordset.find((s: any) => String(s.nm).includes(n))?.STATUS_ID ?? null;

  const prod = await p.request().query(
    `SELECT TOP 3 PRODUCT_ID, PRODUCT_NAME FROM vmaster.TBL_PRODUCT_MASTER
      WHERE ISNULL(PRODUCT_NAME,'')<>'' ORDER BY PRODUCT_ID`
  );
  const uom = await p.request().query(`SELECT TOP 1 UOM_ID FROM vmaster.TBL_UOM_MASTER`);
  const ref = await p.request().query(`SELECT TOP 1 REFERENCE_TYPE_ID FROM VMASTER.TBL_REFERENCE_TYPE_MASTER`);

  const created: string[] = [];
  const mk = async (nLines: number) => {
    const r: any = await savePurchaseRequestCombinedService({
      PURCHASE_REQUEST_DATE: new Date().toISOString(),
      COMPANY_ID: 6, BRANCH_ID: 1, CAMP_ID: 1, PO_STORE_ID: 1,
      STATUS_ID: idFor("DRAFT"), USER: "sri", MAC_ADDRESS: "DROPDOWN",
      sessionEmployee: { empId: null, empName: "sri" },
      dtls: Array.from({ length: nLines }, (_, i) => ({
        LINE_NO: i + 1,
        MAIN_CATEGORY_ID: 1, SUB_CATEGORY_ID: 2,
        PRODUCT_ID: prod.recordset[i % prod.recordset.length].PRODUCT_ID,
        UOM_ID: uom.recordset[0].UOM_ID,
        REFERENCE_TYPE_ID: ref.recordset[0].REFERENCE_TYPE_ID,
        REFERENCE_NO: "BOOKING-D" + i,
        Total_Quantity: 1 + i, Total_Packing: 0, STATUS_ENTRY: "CL",
      } as any)),
    } as any);
    /* The dropdown reads statusEntry = 'CL' only, so a saved draft would never
       appear in it. Submit puts the header where the wizard would see it. */
    await submitPurchaseRequestService(
      r.PURCHASE_REQUEST_NO, Number(idFor("PENDING")), "sri", "DROPDOWN"
    );
    created.push(r.PURCHASE_REQUEST_NO);
    return r.PURCHASE_REQUEST_NO;
  };

  const loadRow = async (no: string) => {
    const r = await p.request().query(
      `EXEC VPurchase.LOAD_PURCHASE_REQUEST_HDR @StatusEntry='CL', @IncludeInactive=0`
    );
    const row = r.recordset.find((x: any) => x.purchaseRequestNo === no);
    ok(`grid read returns ${no}`, !!row, "row missing");
    return row;
  };

  try {
    /* ---- the count reaches the client ---- */
    const one = await mk(1);
    const three = await mk(3);

    const rowOne = await loadRow(one);
    const rowThree = await loadRow(three);

    console.log("\n=== detailLineCount as the dropdown sees it ===");
    console.log(`  ${one}: ${rowOne?.detailLineCount}`);
    console.log(`  ${three}: ${rowThree?.detailLineCount}\n`);

    ok("detailLineCount is present on a grid row", rowOne?.detailLineCount !== undefined);
    ok("one-line request reports 1", Number(rowOne?.detailLineCount) === 1, String(rowOne?.detailLineCount));
    ok("three-line request reports 3", Number(rowThree?.detailLineCount) === 3, String(rowThree?.detailLineCount));

    /* ---- the dropdown rule ---- */
    ok("fresh request is offered", !isFullyImported(rowOne, countFrom([])));

    ok("1 of 3 lines taken: still offered",
       !isFullyImported(rowThree, countFrom([{ PURCHASE_REQUEST_NO: three }])));
    ok("2 of 3 lines taken: still offered",
       !isFullyImported(rowThree, countFrom([
         { PURCHASE_REQUEST_NO: three }, { PURCHASE_REQUEST_NO: three }])));

    ok("all 3 lines taken: hidden",
       isFullyImported(rowThree, countFrom([
         { PURCHASE_REQUEST_NO: three }, { PURCHASE_REQUEST_NO: three },
         { PURCHASE_REQUEST_NO: three }])));

    /* The removal case: taking a line back out must offer the request again. */
    const twoLeft = countFrom([{ PURCHASE_REQUEST_NO: three }, { PURCHASE_REQUEST_NO: three }]);
    ok("removing a line brings the request back", !isFullyImported(rowThree, twoLeft));

    /* Manually added lines with no request must not disturb the count. */
    ok("unlinked lines are ignored by the count",
       !isFullyImported(rowThree, countFrom([{ PURCHASE_REQUEST_NO: null }, { PURCHASE_REQUEST_NO: "" }])));

    /* A row from a build predating the column has no count: stay listed rather
       than be wrongly hidden. */
    ok("missing detailLineCount is treated as unknown, not fully imported",
       !isFullyImported({ purchaseRequestNo: "X/1" }, countFrom([
         { PURCHASE_REQUEST_NO: "X/1" }, { PURCHASE_REQUEST_NO: "X/1" }])));
    ok("zero-line request is not treated as fully imported",
       !isFullyImported({ purchaseRequestNo: "X/1", detailLineCount: 0 },
         countFrom([])));

    /* Two requests in the same quotation: fully importing one must not hide the
       other. */
    ok("a fully imported request does not hide another request",
       !isFullyImported(rowOne, countFrom([{ PURCHASE_REQUEST_NO: three }])));
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