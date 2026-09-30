/* Verifies the HTTP layer of the Purchase Quotation Conversation module:
   status codes, session-derived audit identity, the 403 permission gate and
   that validation problems surface as 4xx instead of 500. */
import { Request, Response } from "express";
import { connectDB, getPool } from "../config/db";
import {
  getPurchaseQuotationConversations,
  getPurchaseQuotationConversation,
  getConversationResponseStatuses,
  savePurchaseQuotationConversation,
  updatePurchaseQuotationConversation,
  deletePurchaseQuotationConversation,
} from "../controllers/purchaseQuotationConversation.controller";

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
  check(name, actual === expected, `expected ${expected} but got ${actual}`);

/* Minimal express doubles so the controllers can be driven directly. */
const call = async (
  handler: (req: Request, res: Response) => Promise<void>,
  opts: { params?: any; query?: any; body?: any; user?: any } = {}
) => {
  let status = 0;
  let payload: any = null;
  const res: any = {
    status(code: number) {
      status = code;
      return res;
    },
    json(body: any) {
      /* Express implies 200 when json() is used without an explicit status. */
      if (status === 0) status = 200;
      payload = body;
      return res;
    },
  };
  const req: any = { params: opts.params ?? {}, query: opts.query ?? {}, body: opts.body ?? {} };
  if (opts.user !== undefined) req.user = opts.user;
  await handler(req, res);
  return { status, payload };
};

const admin = { loginName: "smoke-admin", role: "Admin" };
const manager = { loginName: "smoke-mgr", role: "Manager" };
const roleLess = { loginName: "smoke-norole" };

const TABLE = "[VPurchase].[TBL_PURCHASE_QUOTATION_CONVERSATION_DTL]";

async function main() {
  await connectDB();
  const pool = getPool()!;

  const before = await pool.request().query(`SELECT COUNT(*) n FROM ${TABLE}`);
  const startCount = Number(before.recordset[0].n);

  /* Only work against a quotation that really exists. */
  const ref = await pool.request().query(
    `SELECT TOP 1 PURCHASE_QUOTATION_NO FROM [VPurchase].[TBL_PURCHASE_QUOTATION_HDR]
     WHERE PURCHASE_QUOTATION_NO IS NOT NULL ORDER BY PURCHASE_QUOTATION_NO`
  );
  if (!ref.recordset.length) throw new Error("No purchase quotation exists to test against");
  const refNo: string = ref.recordset[0].PURCHASE_QUOTATION_NO;

  const emp = await pool.request().query(
    `SELECT TOP 1 EMP_ID FROM [VPayEntries].[NEW_EMPLOYEE_DATABASE] ORDER BY EMP_ID`
  );
  const empId: number = Number(emp.recordset[0].EMP_ID);

  console.log("\n--- GET statuses ---\n");
  const statuses = await call(getConversationResponseStatuses, { user: admin });
  eq("status list answers 200", statuses.status, 200);
  check("status list reports success", statuses.payload?.success === true);
  check(
    "status list returns an array",
    Array.isArray(statuses.payload?.data),
    JSON.stringify(statuses.payload)
  );
  check(
    "status list has no blank entries",
    (statuses.payload?.data ?? []).every((s: any) => String(s).trim() !== "")
  );

  console.log("\n--- GET list ---\n");
  const list = await call(getPurchaseQuotationConversations, { params: { refNo }, user: admin });
  eq("list answers 200", list.status, 200);
  check("list reports success", list.payload?.success === true);
  check("list returns an array", Array.isArray(list.payload?.data));
  eq("count matches the data length", list.payload?.count, (list.payload?.data ?? []).length);

  const emptyList = await call(getPurchaseQuotationConversations, {
    params: { refNo: "NO-SUCH-QUOTATION-0001" },
    user: admin,
  });
  eq("list for an unknown quotation answers 200", emptyList.status, 200);
  eq("list for an unknown quotation is empty", emptyList.payload?.count, 0);

  const filtered = await call(getPurchaseQuotationConversations, {
    params: { refNo },
    query: { statusEntry: "ZZ-NEVER-USED" },
    user: admin,
  });
  eq("status filter answers 200", filtered.status, 200);
  eq("status filter narrows the result", filtered.payload?.count, 0);

  console.log("\n--- POST ---\n");
  const saved = await call(savePurchaseQuotationConversation, {
    user: admin,
    body: {
      PURCHASE_QUOTATION_NO: refNo,
      RESPONSE_EMP_ID: empId,
      DISCUSSION_DETAILS: "HTTP smoke entry",
      RESPONSE_STATUS: "QUERY",
      STATUS_ENTRY: "CF",
      REMARKS: "smoke",
      /* A forged body identity must never win over the session. */
      USER: "forged-user",
      MAC_ADDRESS: "FORGED",
    },
  });
  eq("save answers 201", saved.status, 201);
  check("save reports success", saved.payload?.success === true);
  check("save returns the new SNO", Number(saved.payload?.SNO) > 0);
  const sno: number = Number(saved.payload?.SNO);

  const row = await pool.request()
    .input("SNO", require("mssql").Int, sno)
    .query(`SELECT CREATED_BY, CREATED_MAC_ADDRESS FROM ${TABLE} WHERE SNO=@SNO`);
  eq("created by comes from the session, not the body", row.recordset[0]?.CREATED_BY, "smoke-admin");
  eq("created mac comes from the session, not the body", row.recordset[0]?.CREATED_MAC_ADDRESS, "WEB");

  const badQuote = await call(savePurchaseQuotationConversation, {
    user: admin,
    body: { PURCHASE_QUOTATION_NO: "NO-SUCH-QUOTATION-0001", DISCUSSION_DETAILS: "x" },
  });
  eq("save under an unknown quotation answers 400", badQuote.status, 400);
  check("save under an unknown quotation reports failure", badQuote.payload?.success === false);

  const noQuote = await call(savePurchaseQuotationConversation, {
    user: admin,
    body: { DISCUSSION_DETAILS: "x" },
  });
  eq("save without a quotation answers 400", noQuote.status, 400);

  const longStatus = await call(savePurchaseQuotationConversation, {
    user: admin,
    body: { PURCHASE_QUOTATION_NO: refNo, DISCUSSION_DETAILS: "x", RESPONSE_STATUS: "S".repeat(51) },
  });
  eq("a 51 character response status answers 400", longStatus.status, 400);

  const longDiscussion = await call(savePurchaseQuotationConversation, {
    user: admin,
    body: { PURCHASE_QUOTATION_NO: refNo, DISCUSSION_DETAILS: "D".repeat(10001) },
  });
  eq("a 10001 character discussion answers 413", longDiscussion.status, 413);

  console.log("\n--- GET one ---\n");
  const one = await call(getPurchaseQuotationConversation, { params: { sno }, user: admin });
  eq("get one answers 200", one.status, 200);
  eq("get one returns the SNO", Number(one.payload?.data?.SNO), sno);
  check("get one resolves the employee name", !!one.payload?.data?.RESPONSE_EMP_NAME);

  const missing = await call(getPurchaseQuotationConversation, { params: { sno: 99999999 }, user: admin });
  eq("get one for an unknown SNO answers 404", missing.status, 404);
  check("get one for an unknown SNO reports failure", missing.payload?.success === false);

  const badSno = await call(getPurchaseQuotationConversation, { params: { sno: "abc" }, user: admin });
  eq("get one for a non numeric SNO answers 400", badSno.status, 400);

  console.log("\n--- PUT ---\n");
  const updated = await call(updatePurchaseQuotationConversation, {
    params: { sno },
    user: admin,
    body: { PURCHASE_QUOTATION_NO: refNo, DISCUSSION_DETAILS: "HTTP smoke edited", REMARKS: "edited" },
  });
  eq("update answers 200", updated.status, 200);
  check("update reports success", updated.payload?.success === true);

  const afterUpdate = await pool.request()
    .input("SNO", require("mssql").Int, sno)
    .query(`SELECT DISCUSSION_DETAILS, MODIFIED_BY, REMARKS, RESPONSE_STATUS FROM ${TABLE} WHERE SNO=@SNO`);
  eq("discussion was written", afterUpdate.recordset[0]?.DISCUSSION_DETAILS, "HTTP smoke edited");
  eq("modified by comes from the session", afterUpdate.recordset[0]?.MODIFIED_BY, "smoke-admin");
  eq("an omitted response status is preserved", afterUpdate.recordset[0]?.RESPONSE_STATUS, "QUERY");
  eq("an omitted remark is preserved", afterUpdate.recordset[0]?.REMARKS, "edited");

  const move = await call(updatePurchaseQuotationConversation, {
    params: { sno },
    user: admin,
    body: { PURCHASE_QUOTATION_NO: "SOME-OTHER-QUOTATION", DISCUSSION_DETAILS: "x" },
  });
  eq("moving the row to another quotation answers 400", move.status, 400);

  const missingUpdate = await call(updatePurchaseQuotationConversation, {
    params: { sno: 99999999 },
    user: admin,
    body: { PURCHASE_QUOTATION_NO: refNo, DISCUSSION_DETAILS: "x" },
  });
  eq("update for an unknown SNO answers 400", missingUpdate.status, 400);

  console.log("\n--- DELETE ---\n");
  const asManager = await call(deletePurchaseQuotationConversation, { params: { sno }, user: manager });
  eq("delete as Manager answers 403", asManager.status, 403);
  check("delete as Manager reports failure", asManager.payload?.success === false);

  const noRole = await call(deletePurchaseQuotationConversation, { params: { sno }, user: roleLess });
  eq("delete without a role answers 403", noRole.status, 403);

  const survives = await pool.request()
    .input("SNO", require("mssql").Int, sno)
    .query(`SELECT COUNT(*) n FROM ${TABLE} WHERE SNO=@SNO`);
  eq("the row survived every refused delete", Number(survives.recordset[0].n), 1);

  const removed = await call(deletePurchaseQuotationConversation, { params: { sno }, user: admin });
  eq("delete as Admin answers 200", removed.status, 200);
  check("delete as Admin reports success", removed.payload?.success === true);

  const gone = await pool.request()
    .input("SNO", require("mssql").Int, sno)
    .query(`SELECT COUNT(*) n FROM ${TABLE} WHERE SNO=@SNO`);
  eq("the row is gone", Number(gone.recordset[0].n), 0);

  const after = await pool.request().query(`SELECT COUNT(*) n FROM ${TABLE}`);
  eq("the table is back to its starting row count", Number(after.recordset[0].n), startCount);

  console.log("\n==============================================");
  console.log(`  PASS ${pass}   FAIL ${fail}`);
  console.log("==============================================\n");
  await pool.close();
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error("\nSmoke run crashed:", error);
  try {
    const pool = getPool();
    await pool?.request().query(
      `DELETE FROM ${TABLE} WHERE CREATED_BY = 'smoke-admin' AND CREATED_MAC_ADDRESS = 'WEB' AND REMARKS = 'smoke'`
    );
    const after = await pool!.request().query(`SELECT COUNT(*) n FROM ${TABLE}`);
    console.log(`cleanup left ${after.recordset[0].n} rows`);
    await pool?.close();
  } catch {
    /* nothing further to do */
  }
  process.exit(1);
});
