import "dotenv/config";
import sqlLib from "mssql";
import { connectDB, getPool } from "../config/db";
import {
  savePurchaseRequestCombinedService,
  submitPurchaseRequestService,
  getPurchaseRequestDtlsService,
} from "../services/purchaseRequestMaster.services";

const sql: any = (sqlLib as any).default ?? sqlLib;

/* "Fresh Milk" is the product that broke: the quotation wizard copies lines from
   a request and needs PRODUCT_ID, not just the name. The Product cell on a
   quotation line is read-only, so a missing id there is unsavable and cannot be
   typed in by hand. This reproduces that exact import path and asserts the ids
   survive it. */
const FIXTURE = { COMPANY_ID: 6, BRANCH_ID: 1, CAMP_ID: 1, PO_STORE_ID: 1 };

const cleanup = async (p: any, no: string) => {
  await p.request().input("n", sql.VarChar(50), no)
    .query(`DELETE FROM VPurchase.TBL_PURCHASE_REQUEST_DTL WHERE PURCHASE_REQUEST_NO = @n`);
  await p.request().input("n", sql.VarChar(50), no)
    .query(`DELETE FROM VPurchase.TBL_PURCHASE_REQUEST_HDR WHERE PURCHASE_REQUEST_NO = @n`);
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

  /* Real master ids, so the joins resolve the same names a user would see. */
  const prod = await p.request().query(
    `SELECT TOP 1 PRODUCT_ID, PRODUCT_NAME FROM vmaster.TBL_PRODUCT_MASTER
      WHERE ISNULL(PRODUCT_NAME,'')<>'' AND PRODUCT_NAME='Fresh Milk'`
  );
  const product = prod.recordset[0];
  if (!product) { console.log("  no 'Fresh Milk' product in master; cannot reproduce"); process.exit(1); }
  console.log(`\nreproducing with product ${product.PRODUCT_ID} "${product.PRODUCT_NAME}"\n`);

  const cat = await p.request().query(
    `SELECT TOP 1 MAIN_CATEGORY_ID FROM vmaster.TBL_PRODUCT_MAIN_CATEGORY_MASTER
      WHERE MAIN_CATEGORY_NAME='Diary'`
  );
  const sub = await p.request().query(
    `SELECT TOP 1 SUB_CATEGORY_ID FROM vmaster.TBL_PRODUCT_SUB_CATEGORY_MASTER
      WHERE SUB_CATEGORY_NAME='Chees'`
  );
  const uom = await p.request().query(`SELECT TOP 1 UOM_ID FROM vmaster.TBL_UOM_MASTER`);
  const ref = await p.request().query(`SELECT TOP 1 REFERENCE_TYPE_ID FROM VMASTER.TBL_REFERENCE_TYPE_MASTER`);

  let no = "";
  try {
    const st = await p.request().query(
      `SELECT STATUS_ID, UPPER(LTRIM(RTRIM(ISNULL(STATUS_NAME,'')))) AS nm
         FROM VMaster.TBL_STATUS_MASTER`
    );
    const idFor = (n: string) =>
      st.recordset.find((s: any) => String(s.nm).includes(n))?.STATUS_ID ?? null;

    const res: any = await savePurchaseRequestCombinedService({
      PURCHASE_REQUEST_DATE: new Date().toISOString(),
      COMPANY_ID: FIXTURE.COMPANY_ID,
      BRANCH_ID: FIXTURE.BRANCH_ID,
      CAMP_ID: FIXTURE.CAMP_ID,
      PO_STORE_ID: FIXTURE.PO_STORE_ID,
      STATUS_ID: idFor("DRAFT"),
      USER: "sri",
      MAC_ADDRESS: "PRODID",
      sessionEmployee: { empId: null, empName: "sri" },
      dtls: [{
        LINE_NO: 1,
        MAIN_CATEGORY_ID: cat.recordset[0]?.MAIN_CATEGORY_ID ?? null,
        SUB_CATEGORY_ID: sub.recordset[0]?.SUB_CATEGORY_ID ?? null,
        PRODUCT_ID: product.PRODUCT_ID,
        UOM_ID: uom.recordset[0]?.UOM_ID ?? null,
        REFERENCE_TYPE_ID: ref.recordset[0]?.REFERENCE_TYPE_ID ?? null,
        REFERENCE_NO: "BOOKING-9001",
        TOTAL_QUANTITY: 5,
        RATE: 10,
        STATUS_ENTRY: "CF",
      } as any],
    } as any);
    no = res.PURCHASE_REQUEST_NO;
    console.log(`created request ${no}\n`);

    await submitPurchaseRequestService(no, Number(idFor("PENDING")), "sri", "PRODID");

    /* Exactly what the quotation wizard calls when importing lines. */
    const lines = await getPurchaseRequestDtlsService(no);
    ok("request returns its detail line", lines.length === 1, `count=${lines.length}`);

    const l = lines[0];
    console.log("\n=== what the import actually receives ===");
    console.log(`  PRODUCT_NAME      = ${JSON.stringify(l.PRODUCT_NAME)}`);
    console.log(`  PRODUCT_ID        = ${JSON.stringify(l.PRODUCT_ID)}`);
    console.log(`  MAIN_CATEGORY_ID  = ${JSON.stringify(l.MAIN_CATEGORY_ID)}`);
    console.log(`  SUB_CATEGORY_ID   = ${JSON.stringify(l.SUB_CATEGORY_ID)}`);
    console.log(`  PURCHASE_REQUEST_DTL_ID = ${JSON.stringify(l.PURCHASE_REQUEST_DTL_ID)}\n`);

    ok("PRODUCT_NAME resolved", l.PRODUCT_NAME === product.PRODUCT_NAME, String(l.PRODUCT_NAME));
    ok("PRODUCT_ID returned (was the bug)", Number(l.PRODUCT_ID) === Number(product.PRODUCT_ID),
       String(l.PRODUCT_ID));
    ok("MAIN_CATEGORY_ID returned", l.MAIN_CATEGORY_ID != null, String(l.MAIN_CATEGORY_ID));
    ok("SUB_CATEGORY_ID returned", l.SUB_CATEGORY_ID != null, String(l.SUB_CATEGORY_ID));
    ok("link id returned under its real name", l.PURCHASE_REQUEST_DTL_ID != null, String(l.PURCHASE_REQUEST_DTL_ID));

    /* The exact condition the save error was raised from. */
    ok("the save-time error can no longer fire on this line", !!l.PRODUCT_ID,
       `name=${l.PRODUCT_NAME} id=${l.PRODUCT_ID}`);
  } finally {
    if (no) await cleanup(p, no);
    /* Checked by request number, not by an audit column: the header has no
       MAC_ADDRESS column. */
    const left = await p.request().input("n", sql.VarChar(50), no)
      .query(`SELECT COUNT(*) AS n FROM VPurchase.TBL_PURCHASE_REQUEST_HDR WHERE PURCHASE_REQUEST_NO = @n`);
    ok("cleaned up", Number(left.recordset[0].n) === 0, String(left.recordset[0].n));
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });