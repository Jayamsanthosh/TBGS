import "dotenv/config";
import sqlLib from "mssql";
import * as fs from "fs";
import { connectDB, getPool } from "../config/db";
import { getUserEmployeeInfo } from "../services/auth.services";
import {
  savePurchaseRequestCombinedService,
  loadPurchaseRequestOptionsService,
  submitPurchaseRequestService,
} from "../services/purchaseRequestMaster.services";

const sql: any = (sqlLib as any).default ?? sqlLib;
const OUT = "C:/Users/solai/AppData/Local/Temp/opencode/pr_submit_grid.txt";

/* A company/branch/camp/store that exist, so the header foreign keys pass without
   inventing master data. */
const FIXTURE = { COMPANY_ID: 6, BRANCH_ID: 1, CAMP_ID: 1, PO_STORE_ID: 1 };

const readHdr = async (p: any, no: string) => {
  const r = await p
    .request()
    .input("n", sql.VarChar(50), no)
    .query(
      `SELECT PURCHASE_REQUEST_NO, REQUESTED_BY_EMP_ID, REQUESTED_BY_NAME,
              CREATED_BY, STATUS_ID, STATUS_ENTRY
         FROM VPurchase.TBL_PURCHASE_REQUEST_HDR WHERE PURCHASE_REQUEST_NO = @n`
    );
  return r.recordset[0] || null;
};

const readDtlEntry = async (p: any, no: string) => {
  const r = await p
    .request()
    .input("n", sql.VarChar(50), no)
    .query(
      `SELECT TOP 1 STATUS_ENTRY FROM VPurchase.TBL_PURCHASE_REQUEST_DTL
        WHERE PURCHASE_REQUEST_NO = @n ORDER BY PURCHASE_REQUEST_DTL_ID`
    );
  return r.recordset[0]?.STATUS_ENTRY ?? null;
};

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

  /* The grid resolves these two codes from the status master, exactly as the
     page does, so the test uses the real ids rather than hardcoded ones. */
  const st = await p.request().query(
    `SELECT STATUS_ID, UPPER(LTRIM(RTRIM(ISNULL(STATUS_NAME,'')))) AS nm
       FROM VMaster.TBL_STATUS_MASTER`
  );
  const statusIdFor = (needle: string) =>
    st.recordset.find((s: any) => String(s.nm).includes(needle))?.STATUS_ID ?? null;
  const draftId = statusIdFor("DRAFT");
  const pendingId = statusIdFor("PENDING");
  o.push(`status master: DRAFT=${draftId} PENDING_APPROVAL=${pendingId}`);

  const users = await p.request().query(
    `SELECT LOGIN_ID, LOGIN_NAME FROM VMaster.TBL_USER_INFO_HDR ORDER BY LOGIN_ID`
  );
  const byName = (n: string) => users.recordset.find((u: any) => u.LOGIN_NAME === n);
  const sriRow = byName("sri");
  const solaiRow = byName("solai");

  let no = "";
  try {
    /* ---- 1. submit no longer trips "too many arguments specified" ---- */
    const sri = await getUserEmployeeInfo(sriRow.LOGIN_ID, sriRow.LOGIN_NAME);
    const res: any = await savePurchaseRequestCombinedService({
      PURCHASE_REQUEST_DATE: new Date().toISOString(),
      COMPANY_ID: FIXTURE.COMPANY_ID,
      BRANCH_ID: FIXTURE.BRANCH_ID,
      CAMP_ID: FIXTURE.CAMP_ID,
      PO_STORE_ID: FIXTURE.PO_STORE_ID,
      STATUS_ID: draftId,
      USER: "sri",
      MAC_ADDRESS: "SMOKE",
      /* Deliberately wrong: the client claims employee 102, which does not exist.
         The session must win, or this insert fails the FK. */
      REQUESTED_BY_EMP_ID: 102,
      REQUESTED_BY_NAME: "spoofed name",
      sessionEmployee: { empId: sri.EMP_ID, empName: sri.EMP_NAME },
      /* A real detail line: the submit SP moves the detail STATUS_ENTRY too, and
         the approval panel gates on it, so it has to exist to be checked. */
      dtls: [{ LINE_NO: 1, TOTAL_QUANTITY: 1, STATUS_ENTRY: "CF" } as any],
    } as any);
    no = res.PURCHASE_REQUEST_NO;
    created.push(no);
    o.push(`created ${no} (requester sri, employee ${sri.EMP_ID ?? "none"})`);

    const before = await readHdr(p, no);
    ok("new request starts as Draft entry", before?.STATUS_ENTRY === "CF", String(before?.STATUS_ENTRY));

    let sub: any = null;
    try {
      sub = await submitPurchaseRequestService(no, Number(pendingId), "sri", "SMOKE");
      ok("SUBMIT_PURCHASE_REQUEST executes (no 'too many arguments')", true);
    } catch (e: any) {
      ok("SUBMIT_PURCHASE_REQUEST executes (no 'too many arguments')", false, e?.message);
    }

    if (sub) {
      ok("submit reports 1 row changed", Number(sub.changed) === 1, String(sub.changed));
      const after = await readHdr(p, no);
      ok("STATUS_ENTRY moved to CL", after?.STATUS_ENTRY === "CL", String(after?.STATUS_ENTRY));
      ok("STATUS_ID moved to PENDING_APPROVAL", Number(after?.STATUS_ID) === Number(pendingId),
         `${after?.STATUS_ID} vs ${pendingId}`);
      ok("detail line entry moved to CL too", (await readDtlEntry(p, no)) === "CL");
      ok("submit returns the resulting row", !!sub.purchaseRequest?.purchaseRequestNo,
         JSON.stringify(sub.purchaseRequest));
      const audit = await p
        .request()
        .input("n", sql.VarChar(50), no)
        .query(
          `SELECT MODIFIED_BY, MODIFIED_MAC_ADDRESS FROM VPurchase.TBL_PURCHASE_REQUEST_HDR
            WHERE PURCHASE_REQUEST_NO = @n`
        );
      ok("audit columns written by submit",
         audit.recordset[0]?.MODIFIED_BY === "sri" &&
         audit.recordset[0]?.MODIFIED_MAC_ADDRESS === "SMOKE",
         JSON.stringify(audit.recordset[0]));

      /* ---- 2. re-submit is idempotent ---- */
      const again = await submitPurchaseRequestService(no, Number(pendingId), "sri", "SMOKE");
      ok("re-submit reports 0 changed (idempotent)", Number(again.changed) === 0, String(again.changed));

      /* ---- 3. the grid read now carries the fields the columns render ---- */
      const rows = await loadPurchaseRequestOptionsService() as any[];
      const row = rows.find((r: any) => r.purchaseRequestNo === no);

      ok("grid row is returned by the load read", !!row);
      if (row) {
        ok("grid: requestedBy is the stored requester name", row.requestedBy === "sri", String(row.requestedBy));
        ok("grid: requestedByEmpId is null for a non-employee login", row.requestedByEmpId == null,
           String(row.requestedByEmpId));
        ok("grid: statusId is present (Submit button can disable itself)",
           Number(row.statusId) === Number(pendingId), String(row.statusId));
        ok("grid: statusEntry is CL", row.statusEntry === "CL", String(row.statusEntry));
        ok("grid: branchName resolved", !!row.branchName, String(row.branchName));
        ok("grid: poStoreName resolved", !!row.poStoreName, String(row.poStoreName));
      }
    }

    /* ---- 4. an employee requester shows the real name, not the login ---- */
    const solai = await getUserEmployeeInfo(solaiRow.LOGIN_ID, solaiRow.LOGIN_NAME);
    if (solai.EMP_ID) {
      const res2: any = await savePurchaseRequestCombinedService({
        PURCHASE_REQUEST_DATE: new Date().toISOString(),
        COMPANY_ID: FIXTURE.COMPANY_ID,
        BRANCH_ID: FIXTURE.BRANCH_ID,
        CAMP_ID: FIXTURE.CAMP_ID,
        PO_STORE_ID: FIXTURE.PO_STORE_ID,
        STATUS_ID: draftId,
        USER: "solai",
        MAC_ADDRESS: "SMOKE",
        sessionEmployee: { empId: solai.EMP_ID, empName: solai.EMP_NAME },
      } as any);
      created.push(res2.PURCHASE_REQUEST_NO);
      const rows2 = await loadPurchaseRequestOptionsService() as any[];
      const r2 = rows2.find((r: any) => r.purchaseRequestNo === res2.PURCHASE_REQUEST_NO);
      ok("grid: employee requester shows the employee name", r2?.requestedBy === solai.EMP_NAME,
         `${r2?.requestedBy} vs ${solai.EMP_NAME}`);
      ok("grid: employee id is exposed for the (#id) suffix", Number(r2?.requestedByEmpId) === Number(solai.EMP_ID),
         String(r2?.requestedByEmpId));
    }
  } catch (e: any) {
    ok("no unexpected exception", false, e?.message);
  } finally {
    await cleanup(p, created);
    /* mssql has no "?" placeholders, so each number is checked by name. */
    let left = 0;
    for (const n of created) {
      const r = await p
        .request()
        .input("n", sql.VarChar(50), n)
        .query(`SELECT COUNT(*) AS n FROM VPurchase.TBL_PURCHASE_REQUEST_HDR WHERE PURCHASE_REQUEST_NO = @n`);
      left += Number(r.recordset[0].n);
    }
    ok("cleanup removed every test request", left === 0, String(left));
  }

  const head = `SUBMIT_PURCHASE_REQUEST + grid fields  ${pass} passed, ${fail} failed\n\n`;
  fs.writeFileSync(OUT, head + o.join("\n"), "utf8");
  console.log(head + o.join("\n"));
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });