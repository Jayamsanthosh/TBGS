/* Live end-to-end check for the Company Branch Mapping module.
   Drives the real controllers -> services -> stored procedures against the
   live database with a mock req/res so the HTTP status codes are verified too.
   Every row it creates is removed again at the end. */
import "dotenv/config";
import * as fs from "fs";
import { connectDB, getPool } from "../config/db";
import {
  getAllMapping,
  loadMapping,
  getMappingById,
  saveMapping,
  updateMapping,
  deleteMapping,
} from "../controllers/companyBranchMapping.controller";

let pass = 0;
let fail = 0;
const lines: string[] = [];

const log = (s: string) => { lines.push(s); };

const check = (name: string, ok: boolean, detail = "") => {
  if (ok) { pass++; log(`  PASS  ${name}${detail ? "  " + detail : ""}`); }
  else { fail++; log(`  FAIL  ${name}${detail ? "  " + detail : ""}`); }
};

type Res = { statusCode: number; body: any };

const call = async (
  handler: any,
  req: any
): Promise<Res> => {
  let statusCode = 200;
  const res: any = {
    status(c: number) { statusCode = c; return res; },
    json(b: any) { res.body = b; return res; },
  };
  await handler({ params: {}, query: {}, body: {}, ...req }, res);
  return { statusCode, body: res.body };
};

(async () => {
  let createdId: number | null = null;
/* Rows that legitimately existed before the run. The table is not an empty
   fixture - real company/branch mappings live in it - so "no residue" means the
   count returned to this, not zero. */
let baselineRows = 0;
  try {
    await connectDB();
    const p: any = getPool();

    log("");
    log("=== setup: pick a real company + branch ===");
    const co = await p.request().query(`SELECT COMPANY_ID FROM VMaster.TBL_COMPANY_MASTER ORDER BY COMPANY_ID`);
    const br = await p.request().query(`SELECT BRANCH_ID FROM VMaster.TBL_BRANCH_Master ORDER BY BRANCH_ID`);
    /* Real mappings occupy some (company, branch) pairs already, so taking the
       lowest ids would collide with production data and the create would fail
       with "already mapped" instead of testing anything. Pick the first company
       that still has two free branches. */
    const usedPairs = await p.request().query(`SELECT COMPANY_ID, BRANCH_ID FROM VMaster.TBL_COMPANY_BRANCH_MAPPING`);
    baselineRows = usedPairs.recordset.length;
    const taken = new Set(usedPairs.recordset.map((m: any) => `${m.COMPANY_ID}:${m.BRANCH_ID}`));
    const branchIds: number[] = br.recordset.map((b: any) => b.BRANCH_ID);
    let COMPANY_ID = 0;
    let BRANCH_ID = 0;
    let BRANCH_ID_2 = 0;
    for (const c of co.recordset) {
      const free = branchIds.filter((bid) => !taken.has(`${c.COMPANY_ID}:${bid}`));
      if (free.length >= 2) {
        COMPANY_ID = c.COMPANY_ID;
        BRANCH_ID = free[0];
        BRANCH_ID_2 = free[1];
        break;
      }
    }
    if (!COMPANY_ID) {
      throw new Error("no company with two unmapped branches - cannot run isolated");
    }
    log(`  using company ${COMPANY_ID}, branch ${BRANCH_ID} / ${BRANCH_ID_2}`);

    log("");
    log("=== GET / (list) ===");
    const empty = await call(getAllMapping, { query: { status: "AC" } });
    check("list returns 200", empty.statusCode === 200, `status=${empty.statusCode}`);
    check("list has count + data array", Array.isArray(empty.body?.data) && typeof empty.body.count === "number", `count=${empty.body?.count}`);

    log("");
    log("=== POST / (create) ===");
    const created = await call(saveMapping, {
      body: { COMPANY_ID, BRANCH_ID, STATUS_MASTER: "AC" },
      user: { loginName: "e2e", role: "Admin" },
    });
    check("create returns 201", created.statusCode === 201, `status=${created.statusCode} body=${JSON.stringify(created.body)}`);
    check("create returns the new id", !!created.body?.MAPPING_ID, `MAPPING_ID=${created.body?.MAPPING_ID}`);
    check("create returns a message", !!created.body?.message, `"${created.body?.message}"`);
    createdId = created.body?.MAPPING_ID ?? null;

    log("");
    log("=== POST / validation ===");
    const noCompany = await call(saveMapping, { body: { BRANCH_ID } });
    check("missing company -> 400", noCompany.statusCode === 400, `"${noCompany.body?.message}"`);
    const noBranch = await call(saveMapping, { body: { COMPANY_ID } });
    check("missing branch -> 400", noBranch.statusCode === 400, `"${noBranch.body?.message}"`);
    const badStatus = await call(saveMapping, { body: { COMPANY_ID, BRANCH_ID, STATUS_MASTER: "ZZZ" } });
    check("bad status -> 400", badStatus.statusCode === 400, `"${badStatus.body?.message}"`);
    const dupe = await call(saveMapping, { body: { COMPANY_ID, BRANCH_ID, STATUS_MASTER: "AC" } });
    check("duplicate pair -> 400 (not a raw 500)", dupe.statusCode === 400, `status=${dupe.statusCode} "${dupe.body?.message}"`);
    const ghostCo = await call(saveMapping, { body: { COMPANY_ID: 999999, BRANCH_ID } });
    check("unknown company -> 400 (not an FK crash)", ghostCo.statusCode === 400, `"${ghostCo.body?.message}"`);
    const ghostBr = await call(saveMapping, { body: { COMPANY_ID, BRANCH_ID: 999999 } });
    check("unknown branch -> 400 (not an FK crash)", ghostBr.statusCode === 400, `"${ghostBr.body?.message}"`);

    log("");
    log("=== GET /:id ===");
    const one = await call(getMappingById, { params: { id: String(createdId) } });
    check("get by id -> 200", one.statusCode === 200, `status=${one.statusCode}`);
    check("get by id joins company name", !!one.body?.data?.COMPANY_NAME, `"${one.body?.data?.COMPANY_NAME}"`);
    check("get by id joins branch name", !!one.body?.data?.BRANCH_NAME, `"${one.body?.data?.BRANCH_NAME}"`);
    check("get by id exposes STATUS_CODE + STATUS_MASTER", one.body?.data?.STATUS_CODE === "AC" && one.body?.data?.STATUS_MASTER === "ACTIVE", `code=${one.body?.data?.STATUS_CODE} label=${one.body?.data?.STATUS_MASTER}`);
    check("get by id aliases id", one.body?.data?.id === createdId, `id=${one.body?.data?.id}`);
    const missing = await call(getMappingById, { params: { id: "99999999" } });
    check("unknown id -> 404", missing.statusCode === 404, `status=${missing.statusCode}`);

    log("");
    log("=== GET /load ===");
    const load = await call(loadMapping, { query: { companyId: String(COMPANY_ID), status: "ALL" } });
    check("load by company -> 200", load.statusCode === 200, `status=${load.statusCode}`);
    check("load filtered to that company", (load.body?.data || []).every((x: any) => x.COMPANY_ID === COMPANY_ID), `rows=${load.body?.data?.length}`);
    check("load finds the created row", (load.body?.data || []).some((x: any) => x.MAPPING_ID === createdId));

    log("");
    log("=== PUT /:id ===");
    const upd = await call(updateMapping, {
      params: { id: String(createdId) },
      body: { COMPANY_ID, BRANCH_ID, STATUS_MASTER: "IA" },
    });
    check("update returns 200", upd.statusCode === 200, `status=${upd.statusCode} "${upd.body?.message}"`);
    const afterUpd = await call(getMappingById, { params: { id: String(createdId) } });
    check("status became IA", afterUpd.body?.data?.STATUS_CODE === "IA", `code=${afterUpd.body?.data?.STATUS_CODE}`);
    check("modified audit stamp written", !!afterUpd.body?.data?.MODIFIED_BY, `by=${afterUpd.body?.data?.MODIFIED_BY} on=${afterUpd.body?.data?.MODIFIED_DATE}`);

    log("");
    log("=== status filter actually filters ===");
    const acList = await call(getAllMapping, { query: { status: "AC" } });
    check("AC list excludes the IA row", !(acList.body?.data || []).some((x: any) => x.MAPPING_ID === createdId));
    const iaList = await call(getAllMapping, { query: { status: "IA" } });
    check("IA list includes the IA row", (iaList.body?.data || []).some((x: any) => x.MAPPING_ID === createdId));
    const allList = await call(getAllMapping, { query: {} });
    check("no status returns both", (allList.body?.data || []).some((x: any) => x.MAPPING_ID === createdId), `rows=${allList.body?.data?.length}`);

    log("");
    log("=== UPDATE /:id error paths ===");
    const updMissing = await call(updateMapping, { params: { id: "99999999" }, body: { COMPANY_ID, BRANCH_ID } });
    check("update unknown id -> 400 not silent success", updMissing.statusCode === 400, `status=${updMissing.statusCode} "${updMissing.body?.message}"`);

    /* second row, to prove the duplicate guard on UPDATE */
    const second = await call(saveMapping, { body: { COMPANY_ID, BRANCH_ID: BRANCH_ID_2, STATUS_MASTER: "AC" } });
    check("second distinct row created", second.statusCode === 201, `MAPPING_ID=${second.body?.MAPPING_ID}`);
    const collide = await call(updateMapping, {
      params: { id: String(second.body?.MAPPING_ID) },
      body: { COMPANY_ID, BRANCH_ID, STATUS_MASTER: "AC" },
    });
    check("update onto an existing pair -> 400", collide.statusCode === 400, `status=${collide.statusCode} "${collide.body?.message}"`);
    const delSecond = await call(deleteMapping, { params: { id: String(second.body?.MAPPING_ID) }, user: { loginName: "e2e", role: "Admin" } });
    check("second row cleaned up", delSecond.statusCode === 200);

    log("");
    log("=== DELETE /:id ===");
    const denied = await call(deleteMapping, { params: { id: String(createdId) }, user: { loginName: "e2e", role: "Manager" } });
    check("non-admin delete -> 400", denied.statusCode === 400, `"${denied.body?.message}"`);
    const del = await call(deleteMapping, { params: { id: String(createdId) }, user: { loginName: "e2e", role: "Admin" } });
    check("admin delete -> 200", del.statusCode === 200, `status=${del.statusCode} "${del.body?.message}"`);
    const delAgain = await call(deleteMapping, { params: { id: String(createdId) }, user: { loginName: "e2e", role: "Admin" } });
    check("delete again -> 400 not found", delAgain.statusCode === 400, `"${delAgain.body?.message}"`);
    const gone = await call(getMappingById, { params: { id: String(createdId) } });
    check("row is really gone -> 404", gone.statusCode === 404);
    createdId = null;

    log("");
    log("=== residue check ===");
    const n = await p.request().query(`SELECT COUNT(*) AS N FROM VMaster.TBL_COMPANY_BRANCH_MAPPING`);
    check("mapping table back to its pre-test row count", n.recordset[0].N === baselineRows, `rows=${n.recordset[0].N} baseline=${baselineRows}`);
  } catch (e: any) {
    fail++;
    log(`  ERROR ${e?.message ?? e}`);
  } finally {
    /* belt and braces: never leave a test row behind */
    try {
      const p: any = getPool();
      await p.request().query(`DELETE FROM VMaster.TBL_COMPANY_BRANCH_MAPPING WHERE CREATED_BY='e2e'`);
      const n = await p.request().query(`SELECT COUNT(*) AS N FROM VMaster.TBL_COMPANY_BRANCH_MAPPING`);
      log(`  (forced cleanup done, rows now ${n.recordset[0].N})`);
    } catch {}
  }

  log("");
  log(`=== RESULT: ${pass} passed, ${fail} failed ===`);
  fs.writeFileSync("C:/Users/solai/AppData/Local/Temp/opencode/cbm_e2e.txt", lines.join("\r\n"), "utf8");
  process.exit(fail ? 1 : 0);
})();
