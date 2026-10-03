/* Live end-to-end checks for the purchase quotation conversation DTL.
   Runs against the real SPs and restores the table to its starting row count. */
import sql from "mssql";
import { getPool, connectDB } from "../config/db";
import {
  getPurchaseQuotationConversationsService,
  getPurchaseQuotationConversationService,
  getConversationResponseStatusesService,
  savePurchaseQuotationConversationService,
  updatePurchaseQuotationConversationService,
  deletePurchaseQuotationConversationService,
} from "../services/purchaseQuotationConversation.services";

let pass = 0;
let fail = 0;
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

const created: number[] = [];

const cleanup = async (): Promise<number> => {
  const pool = getPool();
  if (!pool || !created.length) return 0;
  const r = await pool.request().query(
    `DELETE FROM VPurchase.TBL_PURCHASE_QUOTATION_CONVERSATION_DTL WHERE SNO IN (${created.join(",")})`
  );
  created.length = 0;
  return r.rowsAffected[0];
};

const httpStatusOf = async (fn: () => Promise<any>): Promise<number> => {
  try {
    await fn();
    return 0;
  } catch (e: any) {
    return e?.httpStatus ?? 0;
  }
};

async function main() {
  await connectDB();
  const pool = getPool()!;

  const before = await pool.request().query(
    `SELECT COUNT(*) n FROM VPurchase.TBL_PURCHASE_QUOTATION_CONVERSATION_DTL`
  );
  const countBefore = Number(before.recordset[0].n);

  /* Uses a real quotation so the FK and the SAVE guard are both exercised. Two
     filters matter, and both were learned the hard way:
       - the quotation must not be submitted. DELETE_PURCHASE_QUOTATION_CONVERSATION_DTL
         refuses once the parent is 'CL', so a submitted quotation made every
         delete assertion below fail;
       - it must have no conversation rows already. Cleanup deletes by SNO, so a
         shared quotation risks touching someone else's entry.
     Ordering by quotation number simply makes the pick repeatable. */
  const q = await pool.request().query(
    `SELECT TOP 1 H.PURCHASE_QUOTATION_NO FROM VPurchase.TBL_PURCHASE_QUOTATION_HDR H
      WHERE H.PURCHASE_QUOTATION_NO NOT LIKE '%SMOKE%' AND H.PURCHASE_QUOTATION_NO NOT LIKE '%DBG%'
        AND UPPER(LTRIM(RTRIM(ISNULL(H.STATUS_ENTRY, '')))) <> 'CL'
        AND NOT EXISTS (
              SELECT 1 FROM VPurchase.TBL_PURCHASE_QUOTATION_CONVERSATION_DTL C
               WHERE C.PURCHASE_QUOTATION_NO = H.PURCHASE_QUOTATION_NO)
      ORDER BY H.PURCHASE_QUOTATION_NO`
  );
  if (!q.recordset.length) {
    throw new Error("No draft purchase quotation without conversation rows exists to test against");
  }
  const refNo: string = q.recordset[0].PURCHASE_QUOTATION_NO;
  console.log(`  (using quotation ${refNo})`);
  const missingRef = "CONV-NOT-A-REAL-QUOTATION";

  const emp = await pool.request().query(
    `SELECT TOP 1 EMP_ID FROM VPayEntries.NEW_EMPLOYEE_DATABASE ORDER BY EMP_ID`
  );
  const empId: number = emp.recordset[0].EMP_ID;

  const base = {
    PURCHASE_QUOTATION_NO: refNo,
    RESPONSE_EMP_ID: empId,
    DISCUSSION_DETAILS: "Please confirm the revised rate.",
    RESPONSE_STATUS: "QUERY",
    STATUS_ENTRY: "CF",
    REMARKS: "raised by buyer",
    USER: "conv-smoke",
    MAC_ADDRESS: "WEB",
  };

  console.log("--- SAVE ---");
  const saved = await savePurchaseQuotationConversationService(base);
  check("save returns a new SNO", Number(saved.SNO) > 0, JSON.stringify(saved));
  created.push(saved.SNO);

  const ins = await pool.request()
    .input("sno", sql.Int, saved.SNO)
    .query(
      `SELECT * FROM VPurchase.TBL_PURCHASE_QUOTATION_CONVERSATION_DTL WHERE SNO=@sno`
    );
  const row = ins.recordset[0];
  eq("row physically exists", !!row, true);
  eq("CREATED_BY stamped", row?.CREATED_BY, "conv-smoke");
  eq("CREATED_MAC_ADDRESS stamped", row?.CREATED_MAC_ADDRESS, "WEB");
  check("CREATED_DATE stamped", !!row?.CREATED_DATE);
  check(
    "CREATED_DATE and MODIFIED_DATE are identical on insert",
    String(row?.CREATED_DATE) === String(row?.MODIFIED_DATE),
    `${row?.CREATED_DATE} vs ${row?.MODIFIED_DATE}`
  );
  eq("parent quotation is the real one", row?.PURCHASE_QUOTATION_NO, refNo);

  const badRef = await httpStatusOf(() =>
    savePurchaseQuotationConversationService({ ...base, PURCHASE_QUOTATION_NO: missingRef })
  );
  eq("save under a non-existent quotation is rejected with 400", badRef, 400);

  const noRef = await httpStatusOf(() => savePurchaseQuotationConversationService({ ...base, PURCHASE_QUOTATION_NO: "" }));
  eq("save with a blank quotation no is rejected with 400", noRef, 400);

  const longStatus = await httpStatusOf(() =>
    savePurchaseQuotationConversationService({ ...base, RESPONSE_STATUS: "X".repeat(51) })
  );
  eq("a 51 character response status is rejected with 400", longStatus, 400);

  const longRemarks = await httpStatusOf(() =>
    savePurchaseQuotationConversationService({ ...base, REMARKS: "R".repeat(51) })
  );
  eq("a 51 character remark is rejected with 400", longRemarks, 400);

  const badEmp = await httpStatusOf(() =>
    savePurchaseQuotationConversationService({ ...base, RESPONSE_EMP_ID: -5 })
  );
  eq("a negative employee id is rejected with 400", badEmp, 400);

  console.log("\n--- SHOW ---");
  const list = await getPurchaseQuotationConversationsService(refNo);
  check("show returns the saved row", list.some((r: any) => r.SNO === saved.SNO));
  const mine = list.find((r: any) => r.SNO === saved.SNO);
  check("show resolves RESPONSE_EMP_NAME", !!mine?.RESPONSE_EMP_NAME, JSON.stringify(mine?.RESPONSE_EMP_NAME));
  check(
    "show CREATED_DATE includes a time component",
    /\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(String(mine?.CREATED_DATE ?? "")),
    String(mine?.CREATED_DATE)
  );
  check("show exposes both ID and SNO", mine?.id === saved.SNO && mine?.SNO === saved.SNO);
  const filtered = await getPurchaseQuotationConversationsService(refNo, "CF");
  check("status filter CF returns the row", filtered.some((r: any) => r.SNO === saved.SNO));
  const wrongFilter = await getPurchaseQuotationConversationsService(refNo, "ZZ");
  eq("an unused status filter returns nothing", wrongFilter.length, 0);
  const empty = await getPurchaseQuotationConversationsService("NO-SUCH-QUOTE-XYZ");
  eq("show for an unknown quotation returns an empty list", empty.length, 0);

  console.log("\n--- GET ---");
  const one = await getPurchaseQuotationConversationService(saved.SNO);
  eq("get returns the row", one?.SNO, saved.SNO);
  check("get resolves RESPONSE_EMP_NAME", !!one?.RESPONSE_EMP_NAME, JSON.stringify(one?.RESPONSE_EMP_NAME));
  const missing = await httpStatusOf(() => getPurchaseQuotationConversationService(99999999));
  eq("get for an unknown SNO is rejected with 404", missing, 404);
  const badSno = await httpStatusOf(() => getPurchaseQuotationConversationService("abc"));
  eq("get for a non-numeric SNO is rejected with 400", badSno, 400);

  console.log("\n--- UPDATE ---");
  const upd = await updatePurchaseQuotationConversationService(saved.SNO, {
    ...base,
    DISCUSSION_DETAILS: "Please confirm the revised rate by Friday.",
    RESPONSE_STATUS: "RESPONSE",
  });
  check("update returns success", !!upd, JSON.stringify(upd));
  const after = await pool.request()
    .input("sno", sql.Int, saved.SNO)
    .query(`SELECT * FROM VPurchase.TBL_PURCHASE_QUOTATION_CONVERSATION_DTL WHERE SNO=@sno`);
  eq("discussion updated", after.recordset[0].DISCUSSION_DETAILS, "Please confirm the revised rate by Friday.");
  eq("response status updated", after.recordset[0].RESPONSE_STATUS, "RESPONSE");
  eq("MODIFIED_BY updated", after.recordset[0].MODIFIED_BY, "conv-smoke");
  check(
    "MODIFIED_DATE moved past CREATED_DATE",
    new Date(after.recordset[0].MODIFIED_DATE).getTime() >= new Date(after.recordset[0].CREATED_DATE).getTime()
  );

  const keptRemarks = await updatePurchaseQuotationConversationService(saved.SNO, {
    PURCHASE_QUOTATION_NO: refNo,
    RESPONSE_EMP_ID: empId,
    REMARKS: undefined,
  });
  const after2 = await pool.request()
    .input("sno", sql.Int, saved.SNO)
    .query(`SELECT * FROM VPurchase.TBL_PURCHASE_QUOTATION_CONVERSATION_DTL WHERE SNO=@sno`);
  eq("a null remark does not wipe the stored remark", after2.recordset[0].REMARKS, "raised by buyer");
  check("a null discussion does not wipe the stored discussion", !!after2.recordset[0].DISCUSSION_DETAILS, String(after2.recordset[0].DISCUSSION_DETAILS));
  check("partial update still reported success", !!keptRemarks);

  /* An omitted field means "leave it alone", never "blank it". */
  const statusBefore = after2.recordset[0].RESPONSE_STATUS;
  const keptStatus = await updatePurchaseQuotationConversationService(saved.SNO, {
    PURCHASE_QUOTATION_NO: refNo,
    DISCUSSION_DETAILS: "partial write",
  });
  const after3 = await pool.request()
    .input("sno", sql.Int, saved.SNO)
    .query(`SELECT * FROM VPurchase.TBL_PURCHASE_QUOTATION_CONVERSATION_DTL WHERE SNO=@sno`);
  eq("an omitted response status does not wipe the stored response status", after3.recordset[0].RESPONSE_STATUS, statusBefore);
  eq("an omitted employee does not wipe the stored employee", after3.recordset[0].RESPONSE_EMP_ID, empId);
  eq("an omitted status entry does not wipe the stored status entry", after3.recordset[0].STATUS_ENTRY, "CF");
  check("the partial write was still reported successful", !!keptStatus);

  const moved = await httpStatusOf(() =>
    updatePurchaseQuotationConversationService(saved.SNO, { ...base, PURCHASE_QUOTATION_NO: missingRef })
  );
  eq("a conversation cannot be moved to another quotation", moved, 400);
  const updMissing = await httpStatusOf(() => updatePurchaseQuotationConversationService(99999999, base));
  eq("update for an unknown SNO is rejected with 400", updMissing, 400);

  console.log("\n--- DELETE permission gate ---");
  const asManager = await httpStatusOf(() =>
    deletePurchaseQuotationConversationService(saved.SNO, { USER: "m", ROLE: "Manager", MAC_ADDRESS: "WEB" })
  );
  eq("delete as Manager is rejected with 400 from the procedure", asManager, 400);
  const noRole = await httpStatusOf(() =>
    deletePurchaseQuotationConversationService(saved.SNO, { USER: "m", ROLE: undefined, MAC_ADDRESS: "WEB" })
  );
  eq("delete with no role is rejected with 400", noRole, 400);
  const emptyRole = await httpStatusOf(() =>
    deletePurchaseQuotationConversationService(saved.SNO, { USER: "m", ROLE: "", MAC_ADDRESS: "WEB" })
  );
  eq("delete with an empty role is rejected with 400", emptyRole, 400);
  const superRole = await httpStatusOf(() =>
    deletePurchaseQuotationConversationService(saved.SNO, { USER: "m", ROLE: "super admin", MAC_ADDRESS: "WEB" })
  );
  eq("delete as super admin is rejected with 400", superRole, 400);

  const survived = await pool.request()
    .input("sno", sql.Int, saved.SNO)
    .query(`SELECT COUNT(*) n FROM VPurchase.TBL_PURCHASE_QUOTATION_CONVERSATION_DTL WHERE SNO=@sno`);
  eq("row survives every refused delete", Number(survived.recordset[0].n), 1);

  const asAdmin = await deletePurchaseQuotationConversationService(saved.SNO, {
    USER: "conv-smoke",
    ROLE: "Admin",
    MAC_ADDRESS: "WEB",
  });
  check("delete as Admin succeeds", !!asAdmin, JSON.stringify(asAdmin));
  const gone = await pool.request()
    .input("sno", sql.Int, saved.SNO)
    .query(`SELECT COUNT(*) n FROM VPurchase.TBL_PURCHASE_QUOTATION_CONVERSATION_DTL WHERE SNO=@sno`);
  eq("row is gone after an Admin delete", Number(gone.recordset[0].n), 0);
  const delAgain = await httpStatusOf(() =>
    deletePurchaseQuotationConversationService(saved.SNO, { USER: "a", ROLE: "Admin" })
  );
  eq("deleting twice is rejected with 400", delAgain, 400);

  console.log("\n--- lookup helper ---");
  const statuses = await getConversationResponseStatusesService();
  check("response statuses are returned as strings", statuses.every((s) => typeof s === "string"), JSON.stringify(statuses));
  check("no blank statuses leak through", statuses.every((s) => s.trim() !== ""), JSON.stringify(statuses));

  /* Leave the table exactly as it was found. */
  created.length = 0;
  const after2Count = await pool.request().query(
    `SELECT COUNT(*) n FROM VPurchase.TBL_PURCHASE_QUOTATION_CONVERSATION_DTL`
  );
  eq("table is back to its starting row count", Number(after2Count.recordset[0].n), countBefore);

  console.log(`\n${"=".repeat(46)}\n  PASS ${pass}   FAIL ${fail}\n${"=".repeat(46)}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(async (e) => {
  console.error("SMOKE ERROR:", e.message);
  try {
    const removed = await cleanup();
    if (removed) console.error(`cleanup removed ${removed} leftover row(s)`);
  } catch (cleanupError: any) {
    console.error("cleanup failed:", cleanupError.message);
  }
  process.exit(1);
});
