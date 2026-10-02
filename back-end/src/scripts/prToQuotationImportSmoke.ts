import "dotenv/config";
import sqlLib from "mssql";
import { connectDB, getPool } from "../config/db";
import { getPurchaseRequestDtlsService, savePurchaseRequestCombinedService } from "../services/purchaseRequestMaster.services";
import { savePurchaseQuotationCombinedService } from "../services/purchaseQuotationMaster.services";

const sql: any = (sqlLib as any).default ?? sqlLib;

const FIXTURE = { COMPANY_ID: 6, BRANCH_ID: 1, CAMP_ID: 1, PO_STORE_ID: 1 };

/* The whole reported path, end to end: raise a request for "Fresh Milk", submit
   it, import its line into a quotation exactly the way the wizard does (reading
   through SHOW_PURCHASE_REQUEST_DTL), then save the quotation and read the row
   back. The failure was that the imported line carried a product name but no
   product id, and the Product cell on a quotation line is read-only, so the line
   could never be saved. */
(async () => {
  await connectDB();
  const p: any = getPool();
  let pass = 0;
  let fail = 0;
  const ok = (n: string, c: boolean, x = "") => {
    if (c) { pass++; console.log("  PASS  " + n); }
    else { fail++; console.log("  FAIL  " + n + (x ? "   [" + x + "]" : "")); }
  };

  const prod = await p.request().query(
    `SELECT TOP 1 PRODUCT_ID, PRODUCT_NAME FROM vmaster.TBL_PRODUCT_MASTER WHERE PRODUCT_NAME='Fresh Milk'`
  );
  const product = prod.recordset[0];
  if (!product) { console.log("  'Fresh Milk' is not in the product master"); process.exit(1); }

  const st = await p.request().query(
    `SELECT STATUS_ID, UPPER(LTRIM(RTRIM(ISNULL(STATUS_NAME,'')))) AS nm FROM VMaster.TBL_STATUS_MASTER`
  );
  const idFor = (n: string) => st.recordset.find((s: any) => String(s.nm).includes(n))?.STATUS_ID ?? null;

  const cat = await p.request().query(`SELECT TOP 1 MAIN_CATEGORY_ID FROM vmaster.TBL_PRODUCT_MAIN_CATEGORY_MASTER WHERE MAIN_CATEGORY_NAME='Diary'`);
  const sub = await p.request().query(`SELECT TOP 1 SUB_CATEGORY_ID FROM vmaster.TBL_PRODUCT_SUB_CATEGORY_MASTER WHERE SUB_CATEGORY_NAME='Chees'`);
  const uom = await p.request().query(`SELECT TOP 1 UOM_ID FROM vmaster.TBL_UOM_MASTER`);
  const ref = await p.request().query(`SELECT TOP 1 REFERENCE_TYPE_ID FROM VMASTER.TBL_REFERENCE_TYPE_MASTER`);
  const sup = await p.request().query(`SELECT TOP 1 BP_ID FROM vmaster.TBL_BUSINESS_PARTNER_MASTER`);

  let prNo = "";
  let pqNo = "";
  try {
    /* ---- 1. a submitted request with one Fresh Milk line ---- */
    const res: any = await savePurchaseRequestCombinedService({
      PURCHASE_REQUEST_DATE: new Date().toISOString(),
      COMPANY_ID: FIXTURE.COMPANY_ID,
      BRANCH_ID: FIXTURE.BRANCH_ID,
      CAMP_ID: FIXTURE.CAMP_ID,
      PO_STORE_ID: FIXTURE.PO_STORE_ID,
      STATUS_ID: idFor("DRAFT"),
      USER: "sri",
      MAC_ADDRESS: "E2E",
      sessionEmployee: { empId: null, empName: "sri" },
      dtls: [{
        LINE_NO: 1,
        MAIN_CATEGORY_ID: cat.recordset[0]?.MAIN_CATEGORY_ID ?? null,
        SUB_CATEGORY_ID: sub.recordset[0]?.SUB_CATEGORY_ID ?? null,
        PRODUCT_ID: product.PRODUCT_ID,
        UOM_ID: uom.recordset[0]?.UOM_ID ?? null,
        REFERENCE_TYPE_ID: ref.recordset[0]?.REFERENCE_TYPE_ID ?? null,
        REFERENCE_NO: "BOOKING-9001",
        Total_Quantity: 5,
        Total_Packing: 0,
        STATUS_ENTRY: "CF",
      } as any],
    } as any);
    prNo = res.PURCHASE_REQUEST_NO;
    console.log(`\nrequest ${prNo} created for "${product.PRODUCT_NAME}"`);

    /* ---- 2. the wizard's import: read through SHOW_PURCHASE_REQUEST_DTL ---- */
    const lines = await getPurchaseRequestDtlsService(prNo);
    const src = lines[0];
    console.log(`  imported line: name=${src?.PRODUCT_NAME} id=${src?.PRODUCT_ID}\n`);
    ok("imported line carries PRODUCT_ID", src?.PRODUCT_ID != null, String(src?.PRODUCT_ID));

    /* ---- 3. build the quotation line the way the wizard does ---- */
    const pq: any = await savePurchaseQuotationCombinedService({
      PURCHASE_QUOTATION_DATE: new Date().toISOString(),
      COMPANY_ID: FIXTURE.COMPANY_ID,
      BRANCH_ID: FIXTURE.BRANCH_ID,
      PO_STORE_ID: FIXTURE.PO_STORE_ID,
      SUPPLIER_BP_ID: sup.recordset[0].BP_ID,
      EXCHANGE_RATE: 1,
      STATUS_ENTRY: "CF",
      USER: "sri",
      MAC_ADDRESS: "E2E",
      dtls: [{
        PURCHASE_REQUEST_NO: prNo,
        PURCHASE_REQUEST_DTL_ID: src.PURCHASE_REQUEST_DTL_ID,
        MAIN_CATEGORY_ID: src.MAIN_CATEGORY_ID ?? undefined,
        SUB_CATEGORY_ID: src.SUB_CATEGORY_ID ?? undefined,
        PRODUCT_ID: src.PRODUCT_ID,
        PRODUCT_NAME: src.PRODUCT_NAME,
        UOM_ID: src.UOM_ID ?? undefined,
        REFERENCE_TYPE_ID: src.REFERENCE_TYPE_ID ?? undefined,
        REFERENCE_NO: "BOOKING-9001",
        REQUIRED_DATE: new Date("2026-11-20T00:00:00Z"),
        REASON: "campsite stock",
        REMARKS: "imported",
        TOTAL_QUANTITY: src.Total_Quantity ?? 0,
        TOTAL_PACKING: 0,
        RATE: 10,
        STATUS_ENTRY: "AC",
      }],
    } as any);
    pqNo = pq.PURCHASE_QUOTATION_NO;
    console.log(`  quotation ${pqNo} saved from the imported line\n`);

    /* ---- 4. the row must exist and carry the product ---- */
    const saved = await p.request()
      .input("n", sql.VarChar(50), pqNo)
      .query(
        `SELECT PRODUCT_ID, REFERENCE_NO, TOTAL_QUANTITY, RATE, STATUS_ENTRY,
                CAST(ISNULL(REQUIRED_DATE,'') AS VARCHAR(10)) AS REQUIRED_DATE,
                ISNULL(REASON,'') AS REASON, ISNULL(REMARKS,'') AS REMARKS
           FROM VPurchase.TBL_PURCHASE_QUOTATION_DTL WHERE PURCHASE_QUOTATION_NO = @n`
      );
    const row = saved.recordset[0];
    console.log("=== stored quotation line ===");
    console.log(`  PRODUCT_ID=${row?.PRODUCT_ID} REFERENCE_NO=${row?.REFERENCE_NO} STATUS_ENTRY=${row?.STATUS_ENTRY}`);
    console.log(`  REQUIRED_DATE=${row?.REQUIRED_DATE} REASON=${JSON.stringify(row?.REASON)} REMARKS=${JSON.stringify(row?.REMARKS)}\n`);

    ok("quotation line stored at all", !!row, "no row written");
    ok("PRODUCT_ID persisted through the FK", Number(row?.PRODUCT_ID) === Number(product.PRODUCT_ID), String(row?.PRODUCT_ID));
    ok("quantity carried from the request", Number(row?.TOTAL_QUANTITY) === 5, String(row?.TOTAL_QUANTITY));
    ok("rate stored", Number(row?.RATE) === 10, String(row?.RATE));
    ok("REFERENCE_NO derived from the request line", row?.REFERENCE_NO === "BOOKING-9001", String(row?.REFERENCE_NO));
    /* These five were accepted by the proc but left out of its INSERT, so every
       line came back with a NULL status. STATUS_ENTRY matters most: the grid
       filters on it. */
    ok("STATUS_ENTRY persisted (was silently NULL)", row?.STATUS_ENTRY === "AC", String(row?.STATUS_ENTRY));
    ok("REQUIRED_DATE persisted", !!row?.REQUIRED_DATE, String(row?.REQUIRED_DATE));
    ok("REASON persisted", row?.REASON === "campsite stock", JSON.stringify(row?.REASON));
    ok("REMARKS persisted", row?.REMARKS === "imported", JSON.stringify(row?.REMARKS));
  } catch (e: any) {
    ok("no unexpected exception", false, e?.message);
  } finally {
    if (pqNo) {
      await p.request().input("n", sql.VarChar(50), pqNo)
        .query(`DELETE FROM VPurchase.TBL_PURCHASE_QUOTATION_DTL WHERE PURCHASE_QUOTATION_NO = @n`);
      await p.request().input("n", sql.VarChar(50), pqNo)
        .query(`DELETE FROM VPurchase.TBL_PURCHASE_QUOTATION_HDR WHERE PURCHASE_QUOTATION_NO = @n`);
    }
    if (prNo) {
      await p.request().input("n", sql.VarChar(50), prNo)
        .query(`DELETE FROM VPurchase.TBL_PURCHASE_REQUEST_DTL WHERE PURCHASE_REQUEST_NO = @n`);
      await p.request().input("n", sql.VarChar(50), prNo)
        .query(`DELETE FROM VPurchase.TBL_PURCHASE_REQUEST_HDR WHERE PURCHASE_REQUEST_NO = @n`);
    }
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });