import "dotenv/config";
import sqlLib from "mssql";
import { connectDB, getPool } from "../config/db";
import { savePurchaseRequestCombinedService, submitPurchaseRequestService } from "../services/purchaseRequestMaster.services";
import { savePurchaseQuotationCombinedService, submitPurchaseQuotationService } from "../services/purchaseQuotationMaster.services";

const sql: any = (sqlLib as any).default ?? sqlLib;

/* The Purchase Quotation wizard offers requests in a dropdown. A request that is
   already fully quoted must not be offered again.

   "Already quoted" has two meanings, and the difference matters:
     a) its lines are on the quotation being edited right now;
     b) its lines are in another SUBMITTED quotation.

   Only a *submitted* quotation counts for (b). A draft is unfinished work, not a
   decision, so it must not hide the request from anyone else - and must not stop
   a second supplier being asked to quote the same request, which is how prices
   get compared. That distinction is the whole point of this test. */
const isFullyQuoted = (row: any, importedCountByRequest: Map<string, number>) => {
  const no = String(row?.purchaseRequestNo ?? "").trim();
  if (!no) return false;
  const total = Number(row?.detailLineCount);
  if (!Number.isFinite(total) || total <= 0) return false;
  if ((importedCountByRequest.get(no) ?? 0) >= total) return true;
  const inSubmitted = Number(row?.quotedLineCountSubmitted);
  if (!Number.isFinite(inSubmitted) || inSubmitted < 0) return false;
  return inSubmitted >= total;
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
  const draftId = idFor("DRAFT");
  const pendingId = idFor("PENDING");

  const prod = await p.request().query(
    `SELECT TOP 2 PRODUCT_ID FROM vmaster.TBL_PRODUCT_MASTER WHERE ISNULL(PRODUCT_NAME,'')<>'' ORDER BY PRODUCT_ID`
  );
  const uom = await p.request().query(`SELECT TOP 1 UOM_ID FROM vmaster.TBL_UOM_MASTER`);
  const ref = await p.request().query(`SELECT TOP 1 REFERENCE_TYPE_ID FROM VMASTER.TBL_REFERENCE_TYPE_MASTER`);
  const bp = await p.request().query(`SELECT TOP 1 BP_ID FROM vmaster.TBL_BUSINESS_PARTNER_MASTER`);

  const reqs: string[] = [];
  const pqs: string[] = [];

  /* A request with n lines, submitted so it reaches the dropdown. */
  const mkRequest = async (nLines: number) => {
    const r: any = await savePurchaseRequestCombinedService({
      PURCHASE_REQUEST_DATE: new Date().toISOString(),
      COMPANY_ID: 6, BRANCH_ID: 1, CAMP_ID: 1, PO_STORE_ID: 1,
      STATUS_ID: draftId, USER: "sri", MAC_ADDRESS: "SUBSMOKE",
      sessionEmployee: { empId: null, empName: "sri" },
      dtls: Array.from({ length: nLines }, (_, i) => ({
        LINE_NO: i + 1, MAIN_CATEGORY_ID: 1, SUB_CATEGORY_ID: 2,
        PRODUCT_ID: prod.recordset[i % prod.recordset.length].PRODUCT_ID,
        UOM_ID: uom.recordset[0].UOM_ID,
        REFERENCE_TYPE_ID: ref.recordset[0].REFERENCE_TYPE_ID,
        REFERENCE_NO: "BOOKING-S" + i,
        Total_Quantity: 1 + i, Total_Packing: 0, STATUS_ENTRY: "CF",
      } as any)),
    } as any);
    await submitPurchaseRequestService(r.PURCHASE_REQUEST_NO, Number(pendingId), "sri", "SUBSMOKE");
    reqs.push(r.PURCHASE_REQUEST_NO);
    return r.PURCHASE_REQUEST_NO;
  };

  /* Quote the first n detail lines of a request into a new quotation. */
  const mkQuotation = async (prNo: string, nLines: number, submitIt: boolean) => {
    const lines = await p.request()
      .input("n", sql.VarChar(50), prNo)
      .query(
        `SELECT TOP (${nLines}) PURCHASE_REQUEST_DTL_ID, MAIN_CATEGORY_ID, SUB_CATEGORY_ID,
                PRODUCT_ID, UOM_ID, REFERENCE_TYPE_ID, REFERENCE_NO, Total_Quantity
           FROM VPurchase.TBL_PURCHASE_REQUEST_DTL
          WHERE PURCHASE_REQUEST_NO = @n ORDER BY LINE_NO`
      );
    const q: any = await savePurchaseQuotationCombinedService({
      PURCHASE_QUOTATION_DATE: new Date().toISOString(),
      COMPANY_ID: 6, BRANCH_ID: 1, PO_STORE_ID: 1,
      SUPPLIER_BP_ID: bp.recordset[0].BP_ID, CURRENCY_ID: null,
      EXCHANGE_RATE: 1, QUOTATION_STATUS_ID: draftId,
      STATUS_ENTRY: "CF", USER: "sri", MAC_ADDRESS: "SUBSMOKE",
      dtls: lines.recordset.map((s: any, i: number) => ({
        PURCHASE_REQUEST_NO: prNo,
        PURCHASE_REQUEST_DTL_ID: s.PURCHASE_REQUEST_DTL_ID,
        MAIN_CATEGORY_ID: s.MAIN_CATEGORY_ID, SUB_CATEGORY_ID: s.SUB_CATEGORY_ID,
        PRODUCT_ID: s.PRODUCT_ID, UOM_ID: s.UOM_ID,
        REFERENCE_TYPE_ID: s.REFERENCE_TYPE_ID, REFERENCE_NO: s.REFERENCE_NO,
        TOTAL_QUANTITY: s.Total_Quantity, TOTAL_PACKING: 0, RATE: 10,
        STATUS_ENTRY: "AC", LINE_NO: i + 1,
      })),
    } as any);
    const no = q.PURCHASE_QUOTATION_NO;
    pqs.push(no);
    /* Submit moves STATUS_ENTRY to CL, which is what the SP treats as quoted. */
    if (submitIt) await submitPurchaseQuotationService(no, Number(pendingId), "sri", "SUBSMOKE");
    return no;
  };

  const rowFor = async (no: string) => {
    const r = await p.request().query(
      `EXEC VPurchase.LOAD_PURCHASE_REQUEST_HDR @StatusEntry='CL', @IncludeInactive=0`
    );
    const row = r.recordset.find((x: any) => x.purchaseRequestNo === no);
    ok("grid read returns " + no, !!row, "row missing");
    return row;
  };

  try {
    /* ---- (b) is the part that needed the database ---- */
    const inDraft = await mkRequest(2);
    await mkQuotation(inDraft, 2, /* submitIt */ false);
    let row = await rowFor(inDraft);
    console.log("\n=== quoted only in a DRAFT quotation ===");
    console.log(`  ${inDraft}: lines=${row?.detailLineCount} inSubmitted=${row?.quotedLineCountSubmitted}\n`);
    ok("a draft quotation does not count as quoted",
       Number(row?.quotedLineCountSubmitted) === 0, String(row?.quotedLineCountSubmitted));
    ok("draft-quoted request is still offered", !isFullyQuoted(row, countFrom([])));

    const inSubmitted = await mkRequest(2);
    await mkQuotation(inSubmitted, 2, /* submitIt */ true);
    row = await rowFor(inSubmitted);
    console.log("=== fully quoted in a SUBMITTED quotation ===");
    console.log(`  ${inSubmitted}: lines=${row?.detailLineCount} inSubmitted=${row?.quotedLineCountSubmitted}\n`);
    ok("submitted quotation counts every one of its request lines",
       Number(row?.quotedLineCountSubmitted) === Number(row?.detailLineCount),
       `${row?.quotedLineCountSubmitted} of ${row?.detailLineCount}`);
    ok("fully submitted-quoted request is hidden", isFullyQuoted(row, countFrom([])));

    /* A draft on top of a submitted quote must not resurrect it. */
    await mkQuotation(inSubmitted, 2, /* submitIt */ false);
    row = await rowFor(inSubmitted);
    ok("adding a draft quote on top does not un-hide it",
       isFullyQuoted(row, countFrom([])),
       `inSubmitted=${row?.quotedLineCountSubmitted}`);

    /* Partly quoted in a submitted quotation: lines remain, so keep offering it. */
    const partly = await mkRequest(3);
    await mkQuotation(partly, 2, /* submitIt */ true);
    row = await rowFor(partly);
    console.log("=== partly quoted in a SUBMITTED quotation ===");
    console.log(`  ${partly}: lines=${row?.detailLineCount} inSubmitted=${row?.quotedLineCountSubmitted}\n`);
    ok("only the taken lines are counted",
       Number(row?.quotedLineCountSubmitted) === 2, String(row?.quotedLineCountSubmitted));
    ok("partly quoted request is still offered", !isFullyQuoted(row, countFrom([])));

    /* ---- (a) the within-this-quotation rule still holds ---- */
    ok("lines on this quotation hide it too",
       isFullyQuoted(row, countFrom([
         { PURCHASE_REQUEST_NO: partly }, { PURCHASE_REQUEST_NO: partly },
         { PURCHASE_REQUEST_NO: partly }])));
    ok("removing a line brings it back",
       !isFullyQuoted(row, countFrom([{ PURCHASE_REQUEST_NO: partly }])));

    /* ---- safety: unknown counts must never hide ---- */
    ok("missing detailLineCount is treated as unknown",
       !isFullyQuoted({ purchaseRequestNo: "X/1", quotedLineCountSubmitted: 99 },
         countFrom([{ PURCHASE_REQUEST_NO: "X/1" }])));
    ok("missing quotedLineCountSubmitted is treated as unknown",
       !isFullyQuoted({ purchaseRequestNo: "X/1", detailLineCount: 1 },
         countFrom([])));
    ok("zero-line request is not treated as fully quoted",
       !isFullyQuoted({ purchaseRequestNo: "X/1", detailLineCount: 0, quotedLineCountSubmitted: 5 },
         countFrom([])));

    /* Two requests: fully quoting one must not hide the other. */
    const other = await mkRequest(1);
    const otherRow = await rowFor(other);
    ok("one request hidden does not hide another",
       !isFullyQuoted(otherRow, countFrom([
         { PURCHASE_REQUEST_NO: inSubmitted }, { PURCHASE_REQUEST_NO: inSubmitted }])));
  } finally {
    for (const n of pqs) {
      await p.request().input("n", sql.VarChar(50), n)
        .query(`DELETE FROM VPurchase.TBL_PURCHASE_QUOTATION_DTL WHERE PURCHASE_QUOTATION_NO = @n`);
      await p.request().input("n", sql.VarChar(50), n)
        .query(`DELETE FROM VPurchase.TBL_PURCHASE_QUOTATION_HDR WHERE PURCHASE_QUOTATION_NO = @n`);
    }
    for (const n of reqs) {
      await p.request().input("n", sql.VarChar(50), n)
        .query(`DELETE FROM VPurchase.TBL_PURCHASE_REQUEST_DTL WHERE PURCHASE_REQUEST_NO = @n`);
      await p.request().input("n", sql.VarChar(50), n)
        .query(`DELETE FROM VPurchase.TBL_PURCHASE_REQUEST_HDR WHERE PURCHASE_REQUEST_NO = @n`);
    }
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });