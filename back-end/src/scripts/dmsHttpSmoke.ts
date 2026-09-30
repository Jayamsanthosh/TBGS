/* Verifies the HTTP layer of the DMS module: status codes, the permission gate
   and that validation problems surface as 4xx instead of 500. */
import { Request, Response } from "express";
import sql from "mssql";
import { getPool, connectDB } from "../config/db";
import {
  getAllDocuments,
  getDocumentById,
  saveDocument,
  updateDocument,
  deleteDocument,
} from "../controllers/dms.controller";
import { MAX_UPLOAD_BYTES } from "../services/dms.services";

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

async function main() {
  await connectDB();
  const pool = getPool()!;

  const before = await pool.request().query(`SELECT COUNT(*) n FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM`);
  const countBefore = Number(before.recordset[0].n);

  const link = await pool.request().query(
    `SELECT TOP 1 LINK_ID FROM VMaster.TBL_LINKS_AND_PAGES WHERE STATUS_MASTER='AC' ORDER BY LINK_ID`
  );
  const linkId = Number(link.recordset[0].LINK_ID);
  const refNo = `SMOKE-HTTP-${Date.now()}`;

  const file = {
    LINK_PAGES_ID: linkId,
    PAGE_REF_NO: refNo,
    DOCUMENT_TYPE: "Invoice",
    DESCRIPTIONS: "http smoke",
    FILE_NAME: "http-smoke.txt",
    CONTENT_TYPE: "text/plain",
    CONTENT_DATA: Buffer.from("http dms", "utf8").toString("base64"),
    REMARKS: "http",
    STATUS_MASTER: "AC",
  };

  console.log("--- LIST ---");
  const list = await call(getAllDocuments, { query: { status: "ALL" }, user: admin });
  check("GET list returns 200", list.status === 200, `got=${list.status}`);
  check("GET list includes count", list.payload?.count === countBefore, `count=${list.payload?.count}`);
  check("GET list returns an array", Array.isArray(list.payload?.data));
  const badLink = await call(getAllDocuments, { query: { linkPagesId: "abc" }, user: admin });
  check("GET list rejects a non-numeric link id with 400", badLink.status === 400, `got=${badLink.status}`);

  console.log("\n--- CREATE ---");
  const bad = await call(saveDocument, { body: { ...file, FILE_NAME: "" }, user: admin });
  check("POST with a missing file name returns 400 not 500", bad.status === 400, `got=${bad.status}`);
  check("POST validation message is human readable", /file name is required/i.test(bad.payload?.message ?? ""), bad.payload?.message);

  const over = await call(saveDocument, {
    body: { ...file, CONTENT_DATA: Buffer.alloc(MAX_UPLOAD_BYTES + 1).toString("base64") },
    user: admin,
  });
  check("POST oversize upload returns 413", over.status === 413, `got=${over.status}`);

  const created = await call(saveDocument, { body: file, user: admin });
  check("POST returns 201", created.status === 201, `got=${created.status}`);
  const newId = Number(created.payload?.DMS_ID);
  check("POST returns the new id", Number.isInteger(newId) && newId > 0, JSON.stringify(created.payload));

  const who = await pool.request()
    .input("id", sql.Int, newId)
    .query(`SELECT CREATED_BY FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM WHERE DMS_ID=@id`);
  check("POST stamps the session user, not the body", who.recordset[0].CREATED_BY === "smoke-admin", who.recordset[0].CREATED_BY);

  const dup = await call(saveDocument, { body: file, user: admin });
  check("POST duplicate returns 400", dup.status === 400, `got=${dup.status}`);
  check("POST duplicate explains why", /already exists/i.test(dup.payload?.message ?? ""), dup.payload?.message);

  console.log("\n--- READ ---");
  const one = await call(getDocumentById, { params: { id: String(newId) }, user: admin });
  check("GET by id returns 200", one.status === 200, `got=${one.status}`);
  const notFound = await call(getDocumentById, { params: { id: "99999999" }, user: admin });
  check("GET unknown id returns 404", notFound.status === 404, `got=${notFound.status}`);
  const badId = await call(getDocumentById, { params: { id: "abc" }, user: admin });
  check("GET invalid id returns 400", badId.status === 400, `got=${badId.status}`);

  console.log("\n--- UPDATE ---");
  const upd = await call(updateDocument, {
    params: { id: String(newId) },
    body: { ...file, DESCRIPTIONS: "http updated" },
    user: admin,
  });
  check("PUT returns 200", upd.status === 200, `got=${upd.status}`);
  const updBad = await call(updateDocument, {
    params: { id: String(newId) },
    body: { ...file, DESCRIPTIONS: "x".repeat(101) },
    user: admin,
  });
  check("PUT over-long text returns 400 not 500", updBad.status === 400, `got=${updBad.status}`);
  const updMissing = await call(updateDocument, { params: { id: "99999999" }, body: file, user: admin });
  check("PUT unknown id returns 400", updMissing.status === 400, `got=${updMissing.status}`);

  console.log("\n--- DELETE permission gate ---");
  const asManager = await call(deleteDocument, { params: { id: String(newId) }, user: manager });
  check("DELETE as Manager returns 403", asManager.status === 403, `got=${asManager.status}`);
  check("DELETE as Manager says NO RIGHTS TO DELETE", /no rights to delete/i.test(asManager.payload?.message ?? ""), asManager.payload?.message);

  const survived = await pool.request()
    .input("id", sql.Int, newId)
    .query(`SELECT COUNT(*) n FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM WHERE DMS_ID=@id`);
  eqRow(Number(survived.recordset[0].n), 1, "row survives a refused delete");

  const asAdmin = await call(deleteDocument, { params: { id: String(newId) }, user: admin });
  check("DELETE as Admin returns 200", asAdmin.status === 200, `got=${asAdmin.status}`);

  console.log("\n--- DELETE with an unresolvable role defers to the procedure ---");
  const refNo2 = `SMOKE-HTTP2-${Date.now()}`;
  const second = await call(saveDocument, { body: { ...file, PAGE_REF_NO: refNo2, FILE_NAME: "second.txt" }, user: admin });
  const secondId = Number(second.payload?.DMS_ID);
  const noRole = await call(deleteDocument, { params: { id: String(secondId) }, user: { loginName: "x" } });
  check("DELETE with no role is refused by the procedure, not allowed", noRole.status === 400, `got=${noRole.status}`);
  check("refusal message comes from the procedure", /no rights to delete/i.test(noRole.payload?.message ?? ""), noRole.payload?.message);
  const stillTwo = await pool.request()
    .input("id", sql.Int, secondId)
    .query(`SELECT COUNT(*) n FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM WHERE DMS_ID=@id`);
  eqRow(Number(stillTwo.recordset[0].n), 1, "row survives when the role cannot be resolved");

  await pool.request().query(`DELETE FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM WHERE DMS_ID=${secondId}`);

  const after = await pool.request().query(`SELECT COUNT(*) n FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM`);
  eqRow(Number(after.recordset[0].n), countBefore, "table back to the original row count");

  console.log(`\n${"=".repeat(46)}\n  PASS ${pass}   FAIL ${fail}\n${"=".repeat(46)}`);
  process.exit(fail === 0 ? 0 : 1);
}

const eqRow = (actual: number, expected: number, name: string) =>
  check(name, actual === expected, `expected=${expected} actual=${actual}`);

main().catch(async (e) => {
  console.error("SMOKE ERROR:", e.message);
  /* Awaited so a mid-run failure cannot leave the uploaded row behind. */
  try {
    const pool = getPool();
    if (pool) {
      const r = await pool.request().query(
        "DELETE FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM WHERE CREATED_BY LIKE 'smoke-%'"
      );
      if (r.rowsAffected[0]) console.error(`cleanup removed ${r.rowsAffected[0]} leftover row(s)`);
    }
  } catch (cleanupError: any) {
    console.error("cleanup failed:", cleanupError.message);
  }
  process.exit(1);
});
