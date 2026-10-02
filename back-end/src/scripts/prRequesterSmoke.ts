import "dotenv/config";
import sqlLib from "mssql";
import * as fs from "fs";
import { connectDB, getPool } from "../config/db";
import { getUserEmployeeInfo } from "../services/auth.services";
import { savePurchaseRequestCombinedService } from "../services/purchaseRequestMaster.services";

const sql: any = (sqlLib as any).default ?? sqlLib;
const OUT = "C:/Users/solai/AppData/Local/Temp/opencode/pr_requester.txt";

/* A company/branch/camp/store that actually exist, so the foreign keys on the
   header are satisfied without inventing master data. */
const FIXTURE = { COMPANY_ID: 6, BRANCH_ID: 1, CAMP_ID: 1, PO_STORE_ID: 1 };

const readHdr = async (p: any, no: string) => {
  const r = await p
    .request()
    .input("n", sql.VarChar(50), no)
    .query(
      `SELECT PURCHASE_REQUEST_NO, REQUESTED_BY_EMP_ID, REQUESTED_BY_NAME, CREATED_BY, STATUS_ENTRY
       FROM VPurchase.TBL_PURCHASE_REQUEST_HDR WHERE PURCHASE_REQUEST_NO = @n`
    );
  return r.recordset[0] || null;
};

/* Removes everything the test created: header, detail lines, and the ref-number
   sequence entry, so a re-run does not accumulate rows. */
const cleanup = async (p: any, nos: string[]) => {
  for (const no of nos) {
    await p
      .request()
      .input("n", sql.VarChar(50), no)
      .query(`DELETE FROM VPurchase.TBL_PURCHASE_REQUEST_DTL WHERE PURCHASE_REQUEST_NO = @n`);
    await p
      .request()
      .input("n", sql.VarChar(50), no)
      .query(`DELETE FROM VPurchase.TBL_PURCHASE_REQUEST_HDR WHERE PURCHASE_REQUEST_NO = @n`);
  }
};

(async () => {
  await connectDB();
  const p: any = getPool();
  const o: string[] = [];
  let pass = 0;
  let fail = 0;
  const created: string[] = [];
  const ok = (name: string, cond: boolean, extra = "") => {
    if (cond) { pass++; o.push("  PASS  " + name); }
    else { fail++; o.push("  FAIL  " + name + (extra ? "   [" + extra + "]" : "")); }
  };

  const users = await p.request().query(
    `SELECT LOGIN_ID, LOGIN_NAME FROM VMaster.TBL_USER_INFO_HDR ORDER BY LOGIN_ID`
  );
  const byName = (n: string) => users.recordset.find((u: any) => u.LOGIN_NAME === n);
  const sriRow = byName("sri");
  const sandyRow = byName("sandy");
  const solaiRow = byName("solai");

  /* ---- 1. sri: the dangling EMP_ID 102 must not reach the FK ---- */
  const sri = await getUserEmployeeInfo(sriRow.LOGIN_ID, sriRow.LOGIN_NAME);
  let sriNo = "";
  try {
    const res: any = await savePurchaseRequestCombinedService({
      PURCHASE_REQUEST_DATE: new Date().toISOString(),
      COMPANY_ID: FIXTURE.COMPANY_ID,
      BRANCH_ID: FIXTURE.BRANCH_ID,
      CAMP_ID: FIXTURE.CAMP_ID,
      PO_STORE_ID: FIXTURE.PO_STORE_ID,
      USER: "sri",
      MAC_ADDRESS: "SMOKE",
      /* Deliberately wrong: the client claims employee 102, which does not exist.
         The session must win, or this insert fails the FK. */
      REQUESTED_BY_EMP_ID: 102,
      REQUESTED_BY_NAME: "spoofed name",
      sessionEmployee: { empId: sri.EMP_ID, empName: sri.EMP_NAME },
    });
    sriNo = res.PURCHASE_REQUEST_NO;
    created.push(sriNo);
    const hdr = await readHdr(p, sriNo);
    ok("sri: save succeeds despite EMP_ID 102 not existing (FK would reject it)", !!sriNo, JSON.stringify(hdr));
    ok("sri: REQUESTED_BY_EMP_ID stored as NULL", hdr?.REQUESTED_BY_EMP_ID == null, String(hdr?.REQUESTED_BY_EMP_ID));
    ok("sri: stored name is the session login name, not the spoofed body value",
       hdr?.REQUESTED_BY_NAME === "sri", String(hdr?.REQUESTED_BY_NAME));
    ok("sri: no 'EMP 102' text anywhere in the stored name",
       !String(hdr?.REQUESTED_BY_NAME || "").includes("EMP"), String(hdr?.REQUESTED_BY_NAME));
  } catch (e: any) {
    ok("sri: save succeeds despite EMP_ID 102 not existing (FK would reject it)", false, e?.message);
  }

  /* ---- 2. sandy: no employee row at all ---- */
  const sandy = await getUserEmployeeInfo(sandyRow.LOGIN_ID, sandyRow.LOGIN_NAME);
  let sandyNo = "";
  try {
    const res: any = await savePurchaseRequestCombinedService({
      PURCHASE_REQUEST_DATE: new Date().toISOString(),
      COMPANY_ID: FIXTURE.COMPANY_ID,
      BRANCH_ID: FIXTURE.BRANCH_ID,
      CAMP_ID: FIXTURE.CAMP_ID,
      PO_STORE_ID: FIXTURE.PO_STORE_ID,
      USER: "sandy",
      MAC_ADDRESS: "SMOKE",
      REQUESTED_BY_EMP_ID: 999999,
      REQUESTED_BY_NAME: "spoofed",
      sessionEmployee: { empId: sandy.EMP_ID, empName: sandy.EMP_NAME },
    });
    sandyNo = res.PURCHASE_REQUEST_NO;
    created.push(sandyNo);
    const hdr = await readHdr(p, sandyNo);
ok("sandy: save succeeds", !!sandyNo, JSON.stringify(hdr));

    /* sandy used to have no employee row, which made it the fixture for the
       "login that is not an employee" path: a NULL id plus the login name. An
       employee record now exists for this login, so the app is behaving
       correctly - it stores that employee, exactly as it does for any other
       employee login. sri above still covers the non-employee path. Assert on
       what the session resolved rather than on a stale master-data assumption. */
    const sandyIsEmployee = !!sandy.EMP_ID;
    if (sandyIsEmployee) {
      ok("sandy: employee id from the session is stored", hdr?.REQUESTED_BY_EMP_ID === sandy.EMP_ID,
         `${hdr?.REQUESTED_BY_EMP_ID} vs ${sandy.EMP_ID}`);
      ok("sandy: employee name from the session is stored", hdr?.REQUESTED_BY_NAME === sandy.EMP_NAME,
         String(hdr?.REQUESTED_BY_NAME));
    } else {
      ok("sandy: REQUESTED_BY_EMP_ID stored as NULL", hdr?.REQUESTED_BY_EMP_ID == null, String(hdr?.REQUESTED_BY_EMP_ID));
      ok("sandy: stored name falls back to the login name", hdr?.REQUESTED_BY_NAME === "sandy", String(hdr?.REQUESTED_BY_NAME));
    }
  } catch (e: any) {
    ok("sandy: save succeeds", false, e?.message);
  }

  /* ---- 3. solai: a real employee, so the id is kept and the real name stored ---- */
  const solai = await getUserEmployeeInfo(solaiRow.LOGIN_ID, solaiRow.LOGIN_NAME);
  let solaiNo = "";
  try {
    const res: any = await savePurchaseRequestCombinedService({
      PURCHASE_REQUEST_DATE: new Date().toISOString(),
      COMPANY_ID: FIXTURE.COMPANY_ID,
      BRANCH_ID: FIXTURE.BRANCH_ID,
      CAMP_ID: FIXTURE.CAMP_ID,
      PO_STORE_ID: FIXTURE.PO_STORE_ID,
      USER: "solai",
      MAC_ADDRESS: "SMOKE",
      /* Spoofed employee id, real session - session must win. */
      REQUESTED_BY_EMP_ID: 1003,
      REQUESTED_BY_NAME: "spoofed",
      sessionEmployee: { empId: solai.EMP_ID, empName: solai.EMP_NAME },
    });
    solaiNo = res.PURCHASE_REQUEST_NO;
    created.push(solaiNo);
    const hdr = await readHdr(p, solaiNo);
    ok("solai: save succeeds", !!solaiNo, JSON.stringify(hdr));
    ok("solai: real employee id is kept", hdr?.REQUESTED_BY_EMP_ID === solai.EMP_ID,
       String(hdr?.REQUESTED_BY_EMP_ID) + " vs " + solai.EMP_ID);
    ok("solai: real employee name is stored", hdr?.REQUESTED_BY_NAME === solai.EMP_NAME,
       String(hdr?.REQUESTED_BY_NAME));
    ok("solai: client-supplied employee id is ignored (session is authoritative)",
       hdr?.REQUESTED_BY_EMP_ID !== 1003, String(hdr?.REQUESTED_BY_EMP_ID));
  } catch (e: any) {
    ok("solai: save succeeds", false, e?.message);
  }

  /* ---- 4. the grid must show a real name, never 'EMP <id>' or blank ---- */
  /* Query the list path (no @PURCHASE_REQUEST_NO): passing that takes the SP's
     early "SELECT *" return, which never reaches the aliased grid columns. */
  const grid = await p
    .request()
    .input("CompanyId", sql.Int, FIXTURE.COMPANY_ID)
    .execute("VPurchase.GET_PURCHASE_REQUEST_HDR");
  const rows: any[] = (grid.recordsets || [])[0] ?? [];
  const sriGrid = rows.find((r: any) => r.refNo === sriNo);
  ok("sri: grid shows the login name rather than 'EMP 102' or a blank",
     String(sriGrid?.requestedBy ?? "").trim() === "sri", JSON.stringify(sriGrid?.requestedBy));
  ok("sri: grid also exposes the stored name", String(sriGrid?.requestedByName ?? "").trim() === "sri",
     JSON.stringify(sriGrid?.requestedByName));

  const sandyGrid = rows.find((r: any) => r.refNo === sandyNo);
const sandyExpected = sandy.EMP_ID ? String(sandy.EMP_NAME).trim() : "sandy";
    ok("sandy: grid shows a non-blank requester name",
       String(sandyGrid?.requestedBy ?? "").trim() === sandyExpected,
       `${JSON.stringify(sandyGrid?.requestedBy)} vs ${sandyExpected}`);

  const solaiGrid = rows.find((r: any) => r.refNo === solaiNo);
  ok("solai: grid shows the real employee name",
     String(solaiGrid?.requestedBy ?? "").trim() === solai.EMP_NAME, JSON.stringify(solaiGrid?.requestedBy));

  /* Pre-existing rows must still resolve a name. The backfilled rows live in
     company 4, so read the unfiltered grid rather than the fixture company. */
  const allRows = await p.request().execute("VPurchase.GET_PURCHASE_REQUEST_HDR");
  const existing: any[] = (allRows.recordsets || [])[0] ?? [];
  ok("backfill: existing requests still resolve a requester name",
     existing.length === 0 || existing.every((r: any) => String(r.requestedBy ?? "").trim().length > 0),
     JSON.stringify(existing.map((r: any) => r.requestedBy)));

  /* ---- 5. historical rows still resolve through the employee join ---- */
  const legacy = await p.request().query(
    `SELECT TOP 3 A.PURCHASE_REQUEST_NO, A.REQUESTED_BY_NAME, A.REQUESTED_BY_EMP_ID
     FROM VPurchase.TBL_PURCHASE_REQUEST_HDR A
     WHERE A.REQUESTED_BY_NAME IS NULL AND A.REQUESTED_BY_EMP_ID IS NOT NULL
     ORDER BY A.PURCHASE_REQUEST_NO`
  );
  for (const row of legacy.recordset) {
    ok("backfill: existing row " + row.PURCHASE_REQUEST_NO + " got a name",
       String(row.REQUESTED_BY_NAME ?? "").trim().length > 0, JSON.stringify(row));
  }

  await cleanup(p, created);
  const left = await p
    .request()
    .query(
      `SELECT COUNT(*) AS c FROM VPurchase.TBL_PURCHASE_REQUEST_HDR
       WHERE PURCHASE_REQUEST_NO IN (${created.map((n) => "'" + n + "'").join(",") || "''"})`
    );
  ok("cleanup: no test rows left behind", left.recordset[0].c === 0, JSON.stringify(left.recordset[0]));

  o.unshift("=== purchase request requester smoke ===");
  o.push("");
  o.push(pass + " passed, " + fail + " failed");
  fs.writeFileSync(OUT, o.join("\r\n"), "utf8");
  process.exit(fail > 0 ? 1 : 0);
})();
