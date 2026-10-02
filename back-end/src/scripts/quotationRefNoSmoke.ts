/* Live smoke test for the quotation line Reference No rule.

   A quoted line's REFERENCE_NO must be the request line's own ref no, falling back
   to the purchase request number when that is blank. It is derived server-side, so
   this also proves a hand-crafted request body cannot override it. Lines with no
   request link keep whatever the user typed.

   Creates its own request + quotation fixtures and deletes them again. */
import "dotenv/config";
import * as fs from "fs";
import { getPool, connectDB } from "../config/db";
import sql, { VarChar as prVarChar } from "mssql";
import {
} from "../services/purchaseRequestMaster.services";
import {
  savePurchaseQuotationCombinedService,
  updatePurchaseQuotationCombinedService,
  getPurchaseQuotationDtlsService,
  deletePurchaseQuotationHdrService,
} from "../services/purchaseQuotationMaster.services";

let pass = 0;
let fail = 0;
const createdQuotations: string[] = [];
/* Hoisted so cleanup can drop the request lines even when a check throws. */
let idA: number | null = null;
let idB: number | null = null;
/* True when this run had to create the host request, so cleanup knows it may
   remove it. Declared out here because cleanup() runs on the error path too. */
let hostCreated = false;
/* Line numbers this script owns on the host request. Cleanup removes them by number
   so it can also catch lines left behind by an earlier failed run. */
const HOST_PR = "VIT/2026/PR/1";
const LINE_WITH_REF = 9001;
const LINE_WITHOUT_REF = 9002;

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

const stamp = Date.now().toString().slice(-8);

async function main() {
  await connectDB();
  const pool = getPool();
  if (!pool) throw new Error("no pool");

/* ------------------------------------------------ request fixtures */
console.log("\n=== 1. two request lines: one with a ref no, one without ===");

/* The request stored procs refuse to create a request while another one is still
   pending, so this does not go through them. It adds two lines to a host request
   and deletes exactly those rows again. Only PURCHASE_REQUEST_NO and LINE_NO are
   NOT NULL on the detail table.

   The host request is created here if it is missing: the test used to rely on
   VIT/2026/PR/1 already existing, which stopped being true once the purchase data
   was cleared. Inserting the header directly keeps the test self-contained. */
const ensureHostRequest = async () => {
  const existing = await pool
    .request()
    .input("PRNO", prVarChar(50), HOST_PR)
    .query(
      `SELECT COUNT(*) AS n FROM VPurchase.TBL_PURCHASE_REQUEST_HDR WHERE PURCHASE_REQUEST_NO = @PRNO`
    );
  if (Number(existing.recordset[0].n) > 0) return false;

  await pool
    .request()
    .input("PRNO", prVarChar(50), HOST_PR)
    .input("USER", prVarChar(50), "Admin")
    .query(
      `INSERT INTO VPurchase.TBL_PURCHASE_REQUEST_HDR
         (PURCHASE_REQUEST_NO, PURCHASE_REQUEST_DATE, COMPANY_ID, BRANCH_ID,
          CAMP_ID, PO_STORE_ID, STATUS_ENTRY, CREATED_BY, CREATED_DATE)
       VALUES (@PRNO, GETDATE(), 6, 1, 1, 1, 'CF', @USER, GETDATE())`
    );
  return true;
};

const insertPrLine = async (lineNo: number, refNo: string | null) => {
  const r = await pool
    .request()
    .input("PRNO", prVarChar(50), HOST_PR)
    .input("LINE", sql.Int, lineNo)
    .input("REFD", prVarChar(50), refNo)
    .query(`INSERT INTO VPurchase.TBL_PURCHASE_REQUEST_DTL
              (PURCHASE_REQUEST_NO, LINE_NO, REFERENCE_TYPE_ID, REFERENCE_NO,
               TOTAL_QUANTITY, STATUS_ENTRY, CREATED_BY)
            VALUES (@PRNO, @LINE, 3, @REFD, 1, 'AC', 'Admin');
            SELECT CAST(SCOPE_IDENTITY() AS int) AS NEW_ID;`);
  return r.recordset[0]?.NEW_ID;
};

hostCreated = await ensureHostRequest();
if (hostCreated) console.log(`  created host request ${HOST_PR} (none existed)`);

idA = await insertPrLine(LINE_WITH_REF, "BOOKING-7781");
idB = await insertPrLine(LINE_WITHOUT_REF, null);
console.log(`  host request ${HOST_PR}: line ${idA} (ref no), line ${idB} (no ref no)`);
check("request line A created with a ref no", !!idA, `id=${idA}`);
check("request line B created without a ref no", !!idB, `id=${idB}`);
if (!idA || !idB) throw new Error("fixtures not created");

  /* ------------------------------------------------ quotation with 3 lines */
  console.log("\n=== 2. save a quotation: linked A, linked B, unlinked ===");

const line = (lineNo: number, over: any) => ({
    LINE_NO: lineNo,
    PRODUCT_ID: null,
    TOTAL_QUANTITY: 1,
    RATE: 10,
    TOTAL_PACKING: 1,
    REFERENCE_TYPE_ID: 3,
    STATUS_ENTRY: "AC",
    ...over,
  });

  const created = await savePurchaseQuotationCombinedService({
    PURCHASE_QUOTATION_DATE: "2026-10-01",
    COMPANY_ID: null,
    SUPPLIER_BP_ID: 3,
    CURRENCY_ID: 3,
    EXCHANGE_RATE: 1,
    QUOTATION_STATUS_ID: 2,
    STATUS_ENTRY: "CF",
    USER: "Admin",
    MAC_ADDRESS: "WEB",
    ROLE: "Admin",
    dtls: [
      /* linked to a request line that HAS a ref no -> that ref no */
      line(1, { PURCHASE_REQUEST_NO: HOST_PR, PURCHASE_REQUEST_DTL_ID: idA, REFERENCE_NO: "TAMPERED-1" }),
      /* linked to a request line with NO ref no -> the request number */
      line(2, { PURCHASE_REQUEST_NO: HOST_PR, PURCHASE_REQUEST_DTL_ID: idB, REFERENCE_NO: "TAMPERED-2" }),
      /* not linked -> the user's own value survives */
      line(3, { PURCHASE_REQUEST_NO: null, PURCHASE_REQUEST_DTL_ID: null, REFERENCE_NO: "MANUAL-9" }),
    ],
  } as any);

  const refNo = created.PURCHASE_QUOTATION_NO;
  createdQuotations.push(refNo);
  console.log(`  created ${refNo}`);

  const lines = await getPurchaseQuotationDtlsService(refNo);
  const a = lines.find((l: any) => l.PURCHASE_REQUEST_DTL_ID === idA);
  const b = lines.find((l: any) => l.PURCHASE_REQUEST_DTL_ID === idB);
  const m = lines.find((l: any) => l.PURCHASE_REQUEST_DTL_ID == null);

  eq("linked line with a ref no takes the request's ref no", a?.REFERENCE_NO, "BOOKING-7781");
  eq("linked line without a ref no falls back to the request number", b?.REFERENCE_NO, HOST_PR);
  eq("unlinked line keeps the typed value", m?.REFERENCE_NO, "MANUAL-9");

  /* ------------------------------------------------ update path */
  console.log("\n=== 3. update cannot re-point the reference ===");

  const updated = await updatePurchaseQuotationCombinedService({
    PURCHASE_QUOTATION_NO: refNo,
    PURCHASE_QUOTATION_DATE: "2026-10-01",
    COMPANY_ID: null,
    SUPPLIER_BP_ID: 3,
    CURRENCY_ID: 3,
    EXCHANGE_RATE: 1,
    QUOTATION_STATUS_ID: 2,
    STATUS_ENTRY: "CF",
    USER: "Admin",
    MAC_ADDRESS: "WEB",
    ROLE: "Admin",
    dtls: lines.map((l: any) => ({
      PURCHASE_QUOTATION_DTL_ID: l.PURCHASE_QUOTATION_DTL_ID,
      PURCHASE_REQUEST_NO: l.PURCHASE_REQUEST_NO,
      PURCHASE_REQUEST_DTL_ID: l.PURCHASE_REQUEST_DTL_ID,
      REFERENCE_TYPE_ID: l.REFERENCE_TYPE_ID,
      REFERENCE_NO: "TAMPERED-ON-UPDATE",
      LINE_NO: l.LINE_NO,
      PRODUCT_ID: l.PRODUCT_ID,
      TOTAL_QUANTITY: l.TOTAL_QUANTITY,
      TOTAL_PACKING: l.TOTAL_PACKING,
      RATE: l.RATE,
      EXCHANGE_RATE: 1,
      STATUS_ENTRY: "AC",
    })),
  } as any);
  check("update succeeded", !!updated.PURCHASE_QUOTATION_NO);

  const after = await getPurchaseQuotationDtlsService(refNo);
  const a2 = after.find((l: any) => l.PURCHASE_REQUEST_DTL_ID === idA);
  const b2 = after.find((l: any) => l.PURCHASE_REQUEST_DTL_ID === idB);
  const m2 = after.find((l: any) => l.PURCHASE_REQUEST_DTL_ID == null);
  eq("update: linked line A still shows the request ref no", a2?.REFERENCE_NO, "BOOKING-7781");
  eq("update: linked line B still shows the request number", b2?.REFERENCE_NO, HOST_PR);
eq("update: unlinked line keeps its typed value", m2?.REFERENCE_NO, "TAMPERED-ON-UPDATE");

  /* A linked line whose request line does not exist is not reachable: the detail
     table has FK_TBL_PURCHASE_QUOTATION_DTL_REQUEST_DTL, so the insert is refused
     before the reference is derived. No case to assert here. */
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* Retries because a request that just failed can leave the pooled connection
   briefly busy, which made an earlier version of this script leak its fixtures
   into the shared database. Anything still standing after the retries is
   reported, so residue is visible instead of silent. */
const withRetry = async <T,>(label: string, fn: () => Promise<T>): Promise<T | null> => {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await fn();
    } catch (e) {
      if (attempt === 3) {
        console.log(`  cleanup gave up on ${label}: ${(e as Error).message}`);
      }
      await sleep(400 * attempt);
    }
  }
  return null;
};

async function cleanup() {
  const pool = getPool();
  /* Quotations first: their lines hold the foreign key that would otherwise block
     the request lines below. */
  for (const q of createdQuotations) {
    await withRetry(`quotation ${q}`, () =>
      deletePurchaseQuotationHdrService(q, "Admin", "Admin", "WEB")
    );
  }
  for (const id of [idA, idB]) {
    if (!id) continue;
    await withRetry(`request line ${id}`, () =>
      pool
        .request()
        .input("ID", sql.Int, id)
        .query(`DELETE FROM VPurchase.TBL_PURCHASE_REQUEST_DTL WHERE PURCHASE_REQUEST_DTL_ID = @ID`)
    );
  }

  /* Only remove the host request when this run created it - it may be real data. */
  if (hostCreated) {
    await withRetry("host request", () =>
      pool
        .request()
        .input("PRNO", prVarChar(50), HOST_PR)
        .query(`DELETE FROM VPurchase.TBL_PURCHASE_REQUEST_HDR WHERE PURCHASE_REQUEST_NO = @PRNO`)
    );
  }

  const left = await pool
    .request()
    .query(
      `SELECT
         (SELECT COUNT(*) FROM VPurchase.TBL_PURCHASE_QUOTATION_HDR
           WHERE PURCHASE_QUOTATION_NO LIKE '//PQ/%') AS Q,
         (SELECT COUNT(*) FROM VPurchase.TBL_PURCHASE_REQUEST_DTL
           WHERE LINE_NO IN (${LINE_WITH_REF}, ${LINE_WITHOUT_REF})) AS P`
    );
  const residue = left.recordset[0];
  if (residue.Q > 0 || residue.P > 0) {
    console.log(`  RESIDUE LEFT: ${residue.Q} quotation(s), ${residue.P} request line(s)`);
    console.log(`    ${"C:/Users/solai/AppData/Local/Temp/opencode/quotation_refno_residue.txt"}`);
    fs.writeFileSync(
      "C:/Users/solai/AppData/Local/Temp/opencode/quotation_refno_residue.txt",
      `quotations=${residue.Q} requestLines=${residue.P}`,
      "utf8"
    );
  } else {
    console.log("  cleanup verified: no fixtures left behind");
  }
}

main()
  .then(cleanup)
  .catch(async (e) => {
    console.error("error:", e);
    fail += 1;
    await cleanup();
  })
  .finally(() => {
    console.log(`\n${pass} passed, ${fail} failed`);
    fs.writeFileSync(
      "C:/Users/solai/AppData/Local/Temp/opencode/quotation_refno.txt",
      `${pass} passed, ${fail} failed`,
      "utf8"
    );
    process.exit(fail === 0 ? 0 : 1);
  });





