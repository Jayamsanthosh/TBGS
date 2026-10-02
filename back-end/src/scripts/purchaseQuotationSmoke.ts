/* Live end-to-end smoke test for the Purchase Quotation module.
   Exercises the real service layer against the real stored procedures. */
import { getPool, connectDB } from "../config/db";
import {
  savePurchaseQuotationCombinedService,
  updatePurchaseQuotationCombinedService,
  getPurchaseQuotationHdrService,
  getPurchaseQuotationDtlsService,
  getPurchaseQuotationListService,
  deletePurchaseQuotationDtlService,
  deletePurchaseQuotationHdrService,
  loadPurchaseQuotationOptionsService,
} from "../services/purchaseQuotationMaster.services";
import {
  readSprocResult,
  isSprocError,
  parseSprocResult,
} from "../utils/sprocResult";

let pass = 0;
let fail = 0;
const created: string[] = [];

const check = (name: string, cond: boolean, detail = "") => {
  if (cond) {
    pass += 1;
    console.log(`  PASS  ${name}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${name} ${detail}`);
  }
};
const eq = (name: string, actual: any, expected: any) =>
  check(name, String(actual) === String(expected), `expected=${expected} actual=${actual}`);
const near = (name: string, actual: any, expected: number) =>
  check(name, Math.abs(Number(actual) - expected) < 0.01, `expected=${expected} actual=${actual}`);

const r3 = (n: number) => Math.round(n * 1000) / 1000;

async function main() {
  await connectDB();
  const pool = getPool();
  if (!pool) throw new Error("no pool");
  await pool.request().query("SELECT 1");

  /* pick a real purchase request line to inherit from */
  const prRows: any = await pool
    .request()
    .input("PURCHASE_REQUEST_NO", (await pool.request().query(
      "SELECT TOP 1 PURCHASE_REQUEST_NO FROM VPurchase.TBL_PURCHASE_REQUEST_DTL ORDER BY PURCHASE_REQUEST_DTL_ID DESC"
    )).recordset[0]?.PURCHASE_REQUEST_NO || "")
    .execute("VPurchase.SHOW_PURCHASE_REQUEST_DTL");

  const prLine = (prRows.recordset || [])[0];
  console.log("=== source purchase request line ===");
  console.log("  ", prLine ? `${prLine.PURCHASE_REQUEST_NO} line ${prLine.LINE_NO} product ${prLine.PRODUCT_ID}` : "(none)");

  const prHdrRows: any = await pool
    .request()
    .input("PURCHASE_REQUEST_NO", prLine?.PURCHASE_REQUEST_NO || "")
    .execute("VPurchase.GET_PURCHASE_REQUEST_HDR");
  const prHdr = prHdrRows.recordset?.[0] || {};
  console.log(`   header camp=${prHdr.CAMP_ID} requestStore=${prHdr.REQUEST_STORE_ID} company=${prHdr.COMPANY_ID}`);

  const QTY = 10;
  const RATE = 25.5;
  const DISC = 10;
  const TAX_PCT = 18;
  const XR = 83.5;
  const PCS = 6;

  const subFc = r3(QTY * RATE);
  const discFc = r3((subFc * DISC) / 100);
  const prodFc = r3(subFc - discFc);
  const taxFc = r3((prodFc * TAX_PCT) / 100);
  const finalFc = r3(prodFc + taxFc);
  const subLc = r3(subFc * XR);
  const discLc = r3(discFc * XR);
  const taxLc = r3(taxFc * XR);
  /* per the DTL DDL every LC column is "FC x EXCHANGE_RATE" */
  const prodLc = r3(prodFc * XR);
  const finalLc = r3(finalFc * XR);
  const packing = r3(QTY / PCS);

  /* ------------------------------------------------- 1. create */
  console.log("\n=== 1. create (header + 2 lines) ===");
  const created1 = await savePurchaseQuotationCombinedService({
    PURCHASE_QUOTATION_DATE: "2026-09-26",
    COMPANY_ID: prHdr.COMPANY_ID ?? null,
    SUPPLIER_BP_ID: 3,
    BRANCH_ID: null,
    PO_STORE_ID: null,
    SUPPLIER_QUOTATION_NO: "SQ-001",
    SUPPLIER_QUOTATION_DATE: "2026-09-20",
    VALID_FROM_DATE: "2026-09-26",
    VALID_TO_DATE: "2026-10-26",
    PAYMENT_TERM_ID: 1,
    PAYMENT_MODE_ID: 1,
    SHIPMENT_MODE_ID: 4,
    DELIVERY_DATE: "2026-10-20",
    DELIVERY_TERM: "DDP",
    DELIVERY_LOCATION_ID: null,
    CURRENCY_ID: 3,
    EXCHANGE_RATE: XR,
    TOTAL_SUB_TOTAL_HDR_AMOUNT_FC: subFc,
    TOTAL_DISCOUNT_HDR_AMOUNT_FC: discFc,
    TOTAL_PRODUCT_HDR_AMOUNT_FC: prodFc,
    TOTAL_VAT_HDR_AMOUNT_FC: taxFc,
    FINAL_PRODUCT_HDR_AMOUNT_FC: finalFc,
    TOTAL_SUB_TOTAL_HDR_AMOUNT_LC: subLc,
    TOTAL_DISCOUNT_HDR_AMOUNT_LC: discLc,
    TOTAL_PRODUCT_HDR_AMOUNT_LC: prodLc,
    TOTAL_TAX_HDR_AMOUNT_LC: taxLc,
    FINAL_PRODUCT_HDR_AMOUNT_LC: finalLc,
    QUOTATION_STATUS_ID: 2,
    REMARKS: "smoke test",
    SHIPMENT_REMARKS: "ship notes",
    STATUS_ENTRY: "CF",
    USER: "Admin",
    MAC_ADDRESS: "WEB",
    ROLE: "Admin",
    dtls: [
      {
        PURCHASE_REQUEST_NO: prLine?.PURCHASE_REQUEST_NO ?? null,
        PURCHASE_REQUEST_DTL_ID: prLine?.ID ?? null,
        CAMP_ID: prHdr.CAMP_ID ?? null,
        REQUEST_STORE_ID: prHdr.REQUEST_STORE_ID ?? null,
        REFERENCE_TYPE_ID: prLine?.REFERENCE_TYPE_ID ?? null,
        REFERENCE_NO: prLine?.REFERENCE_NO ?? null,
        LINE_NO: 1,
        MAIN_CATEGORY_ID: prLine?.MAIN_CATEGORY_ID ?? null,
        SUB_CATEGORY_ID: prLine?.SUB_CATEGORY_ID ?? null,
        PRODUCT_ID: prLine?.PRODUCT_ID ?? null,
        NO_OF_PCS_PER_PACKING: PCS,
        TOTAL_QUANTITY: QTY,
        UOM_ID: prLine?.UOM_ID ?? null,
        TOTAL_PACKING: packing,
        ALT_UOM_ID: prLine?.ALT_UOM_ID ?? null,
        RATE,
        SUB_TOTAL_AMOUNT_FC: subFc,
        DISCOUNT_PERCENTAGE: DISC,
        DISCOUNT_AMOUNT_FC: discFc,
        TOTAL_PRODUCT_AMOUNT_FC: prodFc,
        TAX_ID: 1,
        TAX_PERCENTAGE: TAX_PCT,
        TAX_AMOUNT_FC: taxFc,
        FINAL_AMOUNT_FC: finalFc,
        EXCHANGE_RATE: XR,
        SUB_TOTAL_AMOUNT_LC: subLc,
        DISCOUNT_AMOUNT_LC: discLc,
        TOTAL_PRODUCT_AMOUNT_LC: prodLc,
        TAX_AMOUNT_LC: taxLc,
        FINAL_AMOUNT_LC: finalLc,
        REQUIRED_DATE: "2026-10-15",
        REASON: "line one",
        REMARKS: "rm1",
        STATUS_ENTRY: "AC",
      },
      {
        /* nullable FKs must survive as NULL, not 0 */
        PURCHASE_REQUEST_NO: prLine?.PURCHASE_REQUEST_NO ?? null,
        PURCHASE_REQUEST_DTL_ID: prLine?.ID ?? null,
        CAMP_ID: prHdr.CAMP_ID ?? null,
        REQUEST_STORE_ID: prHdr.REQUEST_STORE_ID ?? null,
        LINE_NO: 2,
        PRODUCT_ID: prLine?.PRODUCT_ID ?? null,
        TOTAL_QUANTITY: 4,
        RATE: 10,
        STATUS_ENTRY: "AC",
      },
    ],
  });
  const refNo = created1.PURCHASE_QUOTATION_NO as string;
  created.push(refNo);
  check("reference number generated", !!refNo, `got "${refNo}"`);
  check("reference uses /PQ/ pattern", /\/PQ\/\d+$/.test(refNo), `got "${refNo}"`);
  console.log(`   created ${refNo}`);

  /* ------------------------------------------- 2. read back header */
  console.log("\n=== 2. read back header ===");
  const hdr: any = await getPurchaseQuotationHdrService(refNo);
  eq("PURCHASE_QUOTATION_NO", hdr.PURCHASE_QUOTATION_NO, refNo);
  eq("SUPPLIER_BP_ID", hdr.SUPPLIER_BP_ID, 3);
  eq("CURRENCY_ID", hdr.CURRENCY_ID, 3);
  near("EXCHANGE_RATE", hdr.EXCHANGE_RATE, XR);
  /* the service recomputes the roll-ups, so the header carries BOTH lines:
     line 1 (finalFc) + line 2 (4 x 10 FC, no tax/discount) */
  const line2Fc = r3(40);
  near("FINAL_PRODUCT_HDR_AMOUNT_FC (sum of all lines)", hdr.FINAL_PRODUCT_HDR_AMOUNT_FC, r3(finalFc + line2Fc));
  near("FINAL_PRODUCT_HDR_AMOUNT_LC (sum of all lines)", hdr.FINAL_PRODUCT_HDR_AMOUNT_LC, r3(finalLc + line2Fc * XR));
   near("TOTAL_VAT_HDR_AMOUNT_FC (sum of all lines)", hdr.TOTAL_VAT_HDR_AMOUNT_FC, taxFc);
   eq("STATUS_ENTRY", hdr.STATUS_ENTRY, "CF");
  eq("QUOTATION_STATUS_ID", hdr.QUOTATION_STATUS_ID, 2);
  eq("SUPPLIER_QUOTATION_NO", hdr.SUPPLIER_QUOTATION_NO, "SQ-001");
  eq("DELIVERY_TERM", hdr.DELIVERY_TERM, "DDP");
  check("BRANCH_ID stayed NULL (not 0)", hdr.BRANCH_ID === null, `got ${hdr.BRANCH_ID}`);
  check("DELIVERY_LOCATION_ID stayed NULL (not 0)", hdr.DELIVERY_LOCATION_ID === null, `got ${hdr.DELIVERY_LOCATION_ID}`);
  eq("audit CREATED_BY", hdr.CREATED_BY, "Admin");

  /* --------------------------------- 3. read back lines (parent filter) */
  console.log("\n=== 3. read back lines via new parent-scoped SHOW ===");
  const lines: any[] = await getPurchaseQuotationDtlsService(refNo);
  eq("line count", lines.length, 2);
  const l1 = lines.find((l) => Number(l.LINE_NO) === 1) || {};
  const l2 = lines.find((l) => Number(l.LINE_NO) === 2) || {};

  near("L1 TOTAL_QUANTITY", l1.TOTAL_QUANTITY, QTY);
  near("L1 RATE", l1.RATE, RATE);
  near("L1 SUB_TOTAL_AMOUNT_FC", l1.SUB_TOTAL_AMOUNT_FC, subFc);
  near("L1 DISCOUNT_AMOUNT_FC", l1.DISCOUNT_AMOUNT_FC, discFc);
  near("L1 TOTAL_PRODUCT_AMOUNT_FC", l1.TOTAL_PRODUCT_AMOUNT_FC, prodFc);
  near("L1 TAX_AMOUNT_FC", l1.TAX_AMOUNT_FC, taxFc);
  near("L1 FINAL_AMOUNT_FC", l1.FINAL_AMOUNT_FC, finalFc);
  near("L1 SUB_TOTAL_AMOUNT_LC", l1.SUB_TOTAL_AMOUNT_LC, subLc);
   near("L1 DISCOUNT_AMOUNT_LC", l1.DISCOUNT_AMOUNT_LC, discLc);
   near("L1 TOTAL_PRODUCT_AMOUNT_LC", l1.TOTAL_PRODUCT_AMOUNT_LC, prodLc);
   near("L1 TAX_AMOUNT_LC", l1.TAX_AMOUNT_LC, taxLc);
   near("L1 FINAL_AMOUNT_LC", l1.FINAL_AMOUNT_LC, finalLc);
   near("L1 TOTAL_PACKING", l1.TOTAL_PACKING, packing);
  check(
    "L1 PRODUCT_NAME joined",
    l1.PRODUCT_ID == null ? l1.PRODUCT_NAME == null : !!l1.PRODUCT_NAME,
    `productId=${l1.PRODUCT_ID} name="${l1.PRODUCT_NAME}"`
  );
  check("L1 UOM_NAME joined", !!l1.UOM_NAME, `got "${l1.UOM_NAME}"`);
      check("L1 TAX_NAME joined", !!l1.TAX_NAME, `got "${l1.TAX_NAME}"`);
      check(
      "L1 REFERENCE_TYPE_NAME joined",
      l1.REFERENCE_TYPE_ID == null ? l1.REFERENCE_TYPE_NAME == null : !!l1.REFERENCE_TYPE_NAME,
      `refTypeId=${l1.REFERENCE_TYPE_ID} name="${l1.REFERENCE_TYPE_NAME}"`
      );
      check("L1 REQUIRED_DATE returned", !!l1.REQUIRED_DATE, `got "${l1.REQUIRED_DATE}"`);
  eq("L1 STATUS_ENTRY", l1.STATUS_ENTRY, "AC");
  check("L1 has an identity id", !!l1.PURCHASE_QUOTATION_DTL_ID);

  /* line 2 exercised the nullable path */
  near("L2 TOTAL_QUANTITY", l2.TOTAL_QUANTITY, 4);
  near("L2 RATE", l2.RATE, 10);
  check("L2 SUB_CATEGORY_ID stayed NULL", l2.SUB_CATEGORY_ID === null, `got ${l2.SUB_CATEGORY_ID}`);
  check("L2 TAX_ID stayed NULL", l2.TAX_ID === null, `got ${l2.TAX_ID}`);
  check("L2 REQUIRED_DATE stayed NULL", l2.REQUIRED_DATE === null, `got ${l2.REQUIRED_DATE}`);
  check("L2 STATUS_ENTRY", l2.STATUS_ENTRY === "AC");

  /* --------------------------------------------- 4. list endpoint */
  console.log("\n=== 4. list endpoint ===");
  const listAll = await getPurchaseQuotationListService({ status: "ALL" });
  const inList = listAll.rows.find((r: any) => r.purchaseQuotationNo === refNo);
  check("quotation appears in list", !!inList, `total=${listAll.total}`);
  eq("list finalResponseStatus", inList?.finalResponseStatus, "PENDING");
  eq("list statusEntry", inList?.statusEntry, "CF");
  eq("list supplierName joined", inList?.supplierName, "Private");
  check("list quotationStatusName joined", !!inList?.quotationStatusName, `got "${inList?.quotationStatusName}"`);
  /* header totals are the sum of BOTH lines (line 2 = 4 x 10 FC, no tax) */
  const line2FinalLc = r3(40 * XR);
  near(
    "list finalProductHdrAmountLc (sum of all lines)",
    inList?.finalProductHdrAmountLc,
    r3(finalLc + line2FinalLc)
  );
  near("header roll-up stored on create", hdr.FINAL_PRODUCT_HDR_AMOUNT_LC, r3(finalLc + line2FinalLc));

  const listSearch = await getPurchaseQuotationListService({ status: "ALL", search: refNo });
  check("list search by ref no", listSearch.rows.some((r: any) => r.purchaseQuotationNo === refNo));
  const listPaged = await getPurchaseQuotationListService({ status: "ALL", page: 1, pageSize: 5 });
  check("list paged returns total recordset", listPaged.total >= 1, `total=${listPaged.total}`);

  /* --------------------------------------------- 5. LOAD options */
  console.log("\n=== 5. LOAD options ===");
  const opts = await loadPurchaseQuotationOptionsService(null, null, null, null);
  check("load returns the quotation", opts.some((o: any) => o.purchaseQuotationNo === refNo));
  const optTxt = opts.find((o: any) => o.purchaseQuotationNo === refNo);
  check("load displayText built", !!optTxt?.displayText, `got "${optTxt?.displayText}"`);

  /* --------------------------------------------- 6. update */
  console.log("\n=== 6. update (header + existing line + new line) ===");
  const upd = await updatePurchaseQuotationCombinedService({
    PURCHASE_QUOTATION_NO: refNo,
    PURCHASE_QUOTATION_DATE: "2026-09-26",
    SUPPLIER_BP_ID: 3,
    CURRENCY_ID: 3,
    EXCHANGE_RATE: XR,
    REMARKS: "smoke test updated",
    STATUS_ENTRY: "CF",
    USER: "Admin",
    MAC_ADDRESS: "WEB",
    ROLE: "Admin",
    QUOTATION_STATUS_ID: 3,
    dtls: [
      {
        PURCHASE_QUOTATION_DTL_ID: l1.PURCHASE_QUOTATION_DTL_ID,
        PURCHASE_REQUEST_NO: l1.PURCHASE_REQUEST_NO,
        PURCHASE_REQUEST_DTL_ID: l1.PURCHASE_REQUEST_DTL_ID,
        CAMP_ID: l1.CAMP_ID,
        REQUEST_STORE_ID: l1.REQUEST_STORE_ID,
        LINE_NO: 1,
        PRODUCT_ID: l1.PRODUCT_ID,
        TOTAL_QUANTITY: QTY,
        RATE: RATE * 2,
        DISCOUNT_PERCENTAGE: DISC,
        TAX_ID: 1,
        TAX_PERCENTAGE: TAX_PCT,
    EXCHANGE_RATE: XR,
    STATUS_ENTRY: "AC",
      },
    ],
    deletedIds: [l2.PURCHASE_QUOTATION_DTL_ID],
  });
  check("update returned a message", !!upd.message, upd.message);

  const lines2: any[] = await getPurchaseQuotationDtlsService(refNo);
  eq("line count after update (1 kept, 1 deleted)", lines2.length, 1);
  const u1 = lines2[0] || {};
  near("updated RATE", u1.RATE, RATE * 2);
  const updSub = r3(QTY * RATE * 2);
  near("recomputed SUB_TOTAL_AMOUNT_FC", u1.SUB_TOTAL_AMOUNT_FC, updSub);
  const hdr2: any = await getPurchaseQuotationHdrService(refNo);
  eq("header REMARKS updated", hdr2.REMARKS, "smoke test updated");
  eq("header QUOTATION_STATUS_ID updated", hdr2.QUOTATION_STATUS_ID, 3);
  check("header MODIFIED_BY set", !!hdr2.MODIFIED_BY, `got "${hdr2.MODIFIED_BY}"`);

  /* --------------------------------------------- 7. delete guards */
  console.log("\n=== 7. delete guard + cleanup ===");
  /* the SP rejects a non-Admin role. Unnamed result columns arrive as row[""] = [...],
     which is exactly what readSprocResult/parseSprocResult normalise for the controller. */
  const guard: any = await pool
    .request()
    .input("PURCHASE_QUOTATION_NO", refNo)
    .input("USER", "Admin")
    .input("ROLE", "Manager")
    .input("MAC_ADDRESS", "WEB")
    .execute("VPurchase.DELETE_PURCHASE_QUOTATION_HDR");
  const guardParsed = readSprocResult(guard.recordset?.[0]);
  eq("non-Admin guard status", guardParsed.status, "error");
  eq("non-Admin guard message", guardParsed.message, "No Rights To Delete");
  check("non-Admin guard detected as error", isSprocError(guardParsed), `status="${guardParsed.status}"`);
  /* the service layer must turn that into a 400 for the UI, not a silent success */
  let guardErr = "";
  try {
    parseSprocResult(guard.recordset?.[0], "delete failed");
  } catch (e: any) {
    guardErr = `${e?.message}|${e?.httpStatus}`;
  }
  eq("parseSprocResult throws 400 to the caller", guardErr, "No Rights To Delete|400");
  const stillThere: any = await pool
    .request()
    .input("PURCHASE_QUOTATION_NO", refNo)
    .query("SELECT COUNT(*) c FROM VPurchase.TBL_PURCHASE_QUOTATION_HDR WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO");
  eq("blocked delete left the header intact", stillThere.recordset?.[0]?.c, 1);

  const delLine = await deletePurchaseQuotationDtlService(Number(u1.PURCHASE_QUOTATION_DTL_ID), "Admin", "Admin", "WEB");
  check("detail delete succeeded", /Deleted Successfully/i.test(delLine.message || ""), delLine.message);
  eq("lines gone after delete", (await getPurchaseQuotationDtlsService(refNo)).length, 0);

  const delHdr = await deletePurchaseQuotationHdrService(refNo, "Admin", "Admin", "WEB");
  check("header delete succeeded", /Deleted Successfully/i.test(delHdr.message || ""), delHdr.message);

  const left: any = await pool
    .request()
    .input("PURCHASE_QUOTATION_NO", refNo)
    .query("SELECT COUNT(*) c FROM VPurchase.TBL_PURCHASE_QUOTATION_HDR WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO");
  eq("no header residue", left.recordset?.[0]?.c, 0);
  const leftD: any = await pool
    .request()
    .input("PURCHASE_QUOTATION_NO", refNo)
    .query("SELECT COUNT(*) c FROM VPurchase.TBL_PURCHASE_QUOTATION_DTL WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO");
  eq("no detail residue", leftD.recordset?.[0]?.c, 0);

  /* -------------------------- 8. additional-charge delete guard -------- */
  /* A quotation that still carries additional-charge rows must not be deleted.
     The critical part is that the regular lines must SURVIVE the rejected delete:
     cascading them first would silently strip the quotation of its line set. */
  console.log("\n=== 8. additional-charge delete guard ===");
  const guardRes = await savePurchaseQuotationCombinedService({
    PURCHASE_QUOTATION_DATE: "2026-09-26",
    COMPANY_ID: prHdr.COMPANY_ID ?? null,
    SUPPLIER_BP_ID: 3,
    CURRENCY_ID: 3,
    EXCHANGE_RATE: XR,
    QUOTATION_STATUS_ID: 2,
    STATUS_ENTRY: "CF",
    USER: "Admin",
    ROLE: "Admin",
    MAC_ADDRESS: "WEB",
    dtls: [
      {
        PURCHASE_REQUEST_NO: prLine?.PURCHASE_REQUEST_NO ?? null,
        PURCHASE_REQUEST_DTL_ID: prLine?.ID ?? null,
        CAMP_ID: prHdr.CAMP_ID ?? null,
        REQUEST_STORE_ID: prHdr.REQUEST_STORE_ID ?? null,
        LINE_NO: 1,
        TOTAL_QUANTITY: QTY,
        RATE,
        EXCHANGE_RATE: XR,
        STATUS_ENTRY: "AC",
      },
    ],
  } as any);
  const guardRef = guardRes.PURCHASE_QUOTATION_NO;
  created.push(guardRef);
  const guardLines = await getPurchaseQuotationDtlsService(guardRef);
  eq("guard fixture has 1 line", guardLines.length, 1);

  await pool
    .request()
    .input("PURCHASE_QUOTATION_NO", guardRef)
    .input("LINE_NO", 1)
    .input("DESCRIPTION", "smoke test freight charge")
    .input("RATE", 100)
    .input("EXCHANGE_RATE", XR)
    .query(`INSERT INTO VPurchase.TBL_PURCHASE_QUOTATION_ADDITIONAL_CHARGES_DTL
              (PURCHASE_QUOTATION_NO, LINE_NO, DESCRIPTION, QUANTITY, RATE,
               TOTAL_AMOUNT_FC, FINAL_AMOUNT_FC, EXCHANGE_RATE, TOTAL_AMOUNT_LC, FINAL_AMOUNT_LC,
               STATUS_ENTRY, CREATED_BY, CREATED_DATE)
            VALUES (@PURCHASE_QUOTATION_NO, @LINE_NO, @DESCRIPTION, 1, @RATE,
              100, 100, @EXCHANGE_RATE, @RATE * @EXCHANGE_RATE, @RATE * @EXCHANGE_RATE,
              'AC', 'Admin', GETDATE())`);

  let blocked = "";
  try {
    await deletePurchaseQuotationHdrService(guardRef, "Admin", "Admin", "WEB");
  } catch (e: any) {
    blocked = `${e?.message}|${e?.httpStatus}`;
  }
  check(
    "header delete refused while charges exist",
    /additional charge/i.test(blocked),
    `got "${blocked}"`
  );
  check("refusal is a 400 for the UI", blocked.endsWith("|400"), `got "${blocked}"`);

  const afterGuard = await getPurchaseQuotationDtlsService(guardRef);
  eq("regular lines survived the refused delete", afterGuard.length, 1);
  const hdrIntact: any = await pool
    .request()
    .input("PURCHASE_QUOTATION_NO", guardRef)
    .query("SELECT COUNT(*) c FROM VPurchase.TBL_PURCHASE_QUOTATION_HDR WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO");
  eq("header survived the refused delete", hdrIntact.recordset?.[0]?.c, 1);

  /* remove the charge, then the normal cascade must succeed */
  await pool
    .request()
    .input("PURCHASE_QUOTATION_NO", guardRef)
    .query("DELETE FROM VPurchase.TBL_PURCHASE_QUOTATION_ADDITIONAL_CHARGES_DTL WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO");
  const guardDel = await deletePurchaseQuotationHdrService(guardRef, "Admin", "Admin", "WEB");
  check("delete succeeds once charges are removed", /Deleted Successfully/i.test(guardDel.message || ""), guardDel.message);
  const guardLeft: any = await pool
    .request()
    .input("PURCHASE_QUOTATION_NO", guardRef)
    .query(`SELECT (SELECT COUNT(*) FROM VPurchase.TBL_PURCHASE_QUOTATION_HDR WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO) h,
                   (SELECT COUNT(*) FROM VPurchase.TBL_PURCHASE_QUOTATION_DTL WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO) d,
                   (SELECT COUNT(*) FROM VPurchase.TBL_PURCHASE_QUOTATION_ADDITIONAL_CHARGES_DTL WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO) a`);
  eq("guard fixture fully removed", `${guardLeft.recordset?.[0]?.h}/${guardLeft.recordset?.[0]?.d}/${guardLeft.recordset?.[0]?.a}`, "0/0/0");

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
  if (fail > 0) process.exitCode = 1;
  await pool.close();
}

main().catch(async (e) => {
  console.error("SMOKE ERROR:", e);
  /* best-effort cleanup */
  try {
    const pool = getPool();
    if (pool) {
      for (const r of created) {
        await pool.request().input("PURCHASE_QUOTATION_NO", r).query(
          "DELETE FROM VPurchase.TBL_PURCHASE_QUOTATION_ADDITIONAL_CHARGES_DTL WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO; DELETE FROM VPurchase.TBL_PURCHASE_QUOTATION_DTL WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO; DELETE FROM VPurchase.TBL_PURCHASE_QUOTATION_HDR WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO;"
        );
      }
      console.error("cleanup done for", created);
      await pool.close();
    }
  } catch { }
  process.exitCode = 1;
});
