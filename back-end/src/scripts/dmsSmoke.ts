/* Live end-to-end verification of the Document Management System service layer.
   Exercises the real stored procedures against the real table, then cleans up. */
import sql from "mssql";
import { getPool, connectDB } from "../config/db";
import {
  getAllDocumentsService,
  getDocumentByIdService,
  saveDocumentService,
  updateDocumentService,
  deleteDocumentService,
  MAX_UPLOAD_BYTES,
} from "../services/dms.services";

let pass = 0;
let fail = 0;
const created: number[] = [];

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
const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");

/* Must run on success too: process.exit on the happy path would otherwise leave
   every created row behind. */
const cleanupCreated = async (): Promise<number> => {
  const pool = getPool();
  if (!pool || !created.length) return 0;
  const ids = created.join(",");
  const r = await pool.request().query(
    `DELETE FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM WHERE DMS_ID IN (${ids})`
  );
  created.length = 0;
  return r.rowsAffected[0];
};

async function main() {
  await connectDB();
  const pool = getPool()!;

  const before = await pool.request().query(`SELECT COUNT(*) n FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM`);
  const countBefore = Number(before.recordset[0].n);
  console.log(`\nrows before: ${countBefore}\n`);

  /* pick a real link page so the FK is valid */
  const link = await pool.request().query(
    `SELECT TOP 1 LINK_ID, LINK_NAME FROM VMaster.TBL_LINKS_AND_PAGES WHERE STATUS_MASTER='AC' ORDER BY LINK_ID`
  );
  const linkId = Number(link.recordset[0].LINK_ID);
  console.log(`using LINK_PAGES_ID=${linkId} (${link.recordset[0].LINK_NAME})\n`);

  console.log("--- LIST ---");
  const list = await getAllDocumentsService("ALL");
  check("list returns every active+inactive row", list.length === countBefore, `got=${list.length} want=${countBefore}`);
  check("list never ships binary content", list.every((r: any) => r.CONTENT_DATA === null));
  check("list is newest-first", list.every((r: any, i: number) => i === 0 || list[i - 1].DMS_ID >= r.DMS_ID));
  const named = list.find((r: any) => Number(r.LINK_PAGES_ID) === linkId);
  check("list resolves LINK_PAGES_NAME", named === undefined || typeof named.LINK_PAGES_NAME === "string",
    `sample=${JSON.stringify(named?.LINK_PAGES_NAME)}`);

  const byLink = await getAllDocumentsService("ALL", linkId);
  check("link filter returns only that page", byLink.every((r: any) => Number(r.LINK_PAGES_ID) === linkId));
  console.log(`     (link ${linkId} has ${byLink.length} document(s))`);

  const refNo = `SMOKE-${Date.now()}`;
  const byRef = await getAllDocumentsService("ALL", undefined, refNo);
  check("ref filter is exact (pre-insert: 0)", byRef.length === 0, `got=${byRef.length}`);

  console.log("\n--- CREATE ---");
  const payload = {
    LINK_PAGES_ID: linkId,
    PAGE_REF_NO: refNo,
    DOCUMENT_TYPE: "Invoice",
    DESCRIPTIONS: "smoke test document",
    FILE_NAME: "smoke.txt",
    CONTENT_TYPE: "text/plain",
    CONTENT_DATA: b64("hello dms"),
    REMARKS: "created by smoke",
    STATUS_MASTER: "AC",
    USER: "smoke",
    MAC_ADDRESS: "WEB",
  };
  const saved = await saveDocumentService(payload);
  check("create returns a new DMS_ID", Number.isInteger(Number(saved.DMS_ID)) && Number(saved.DMS_ID) > 0, JSON.stringify(saved));
  const newId = Number(saved.DMS_ID);
  created.push(newId);
  eq("create reports the SP message", saved.message, "Data Saved Successfully");

  const row = await pool.request()
    .input("id", sql.Int, newId)
    .query(`SELECT * FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM WHERE DMS_ID=@id`);
  const ins = row.recordset[0];
  check("row physically exists", !!ins);
  eq("LINK_PAGES_ID stored", ins?.LINK_PAGES_ID, linkId);
  eq("PAGE_REF_NO stored", ins?.PAGE_REF_NO, refNo);
  eq("DOCUMENT_TYPE stored", ins?.DOCUMENT_TYPE, "Invoice");
  eq("DESCRIPTIONS stored", ins?.DESCRIPTIONS, "smoke test document");
  eq("FILE_NAME stored", ins?.FILE_NAME, "smoke.txt");
  eq("CONTENT_TYPE stored", ins?.CONTENT_TYPE, "text/plain");
  eq("REMARKS stored", ins?.REMARKS, "created by smoke");
  eq("STATUS_MASTER stored", ins?.STATUS_MASTER, "AC");
  eq("CREATED_BY from identity", ins?.CREATED_BY, "smoke");
  eq("CREATED_MAC_ADDRESS stored", ins?.CREATED_MAC_ADDRESS, "WEB");
  check("CREATED_DATE stamped", !!ins?.CREATED_DATE);
  check("binary round-tripped exactly", Buffer.compare(ins.CONTENT_DATA, Buffer.from("hello dms", "utf8")) === 0);
  check("identity id matches SCOPE_IDENTITY", Number(ins.DMS_ID) === newId);

  console.log("\n--- CREATE validations ---");
  const rejects = async (name: string, data: any, expect: number) => {
    try {
      await saveDocumentService(data);
      check(name, false, "no error thrown");
    } catch (e: any) {
      check(name, e.httpStatus === expect, `httpStatus=${e.httpStatus} msg=${e.message}`);
    }
  };
  await rejects("missing link page rejected", { ...payload, LINK_PAGES_ID: null }, 400);
  await rejects("missing page ref no rejected", { ...payload, PAGE_REF_NO: "" }, 400);
  await rejects("missing file name rejected", { ...payload, FILE_NAME: null }, 400);
  await rejects("missing file content rejected", { ...payload, CONTENT_DATA: "" }, 400);
  await rejects("over-long descriptions rejected (101>100)", { ...payload, DESCRIPTIONS: "x".repeat(101) }, 400);
  await rejects("over-long page ref no rejected (51>50)", { ...payload, PAGE_REF_NO: "y".repeat(51) }, 400);
  await rejects("over-long file name rejected (151>150)", { ...payload, FILE_NAME: "z".repeat(151) }, 400);
  await rejects("over-long remarks rejected (101>100)", { ...payload, REMARKS: "w".repeat(101) }, 400);
  await rejects("oversize upload rejected", { ...payload, CONTENT_DATA: Buffer.alloc(MAX_UPLOAD_BYTES + 1).toString("base64") }, 413);
  await rejects("duplicate page-ref+filename rejected", { ...payload }, 400);

  const dupCheck = await pool.request()
    .query(`SELECT COUNT(*) n FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM WHERE PAGE_REF_NO='${refNo}'`);
  eq("duplicate attempt inserted nothing", Number(dupCheck.recordset[0].n), 1);

  console.log("\n--- READ ONE ---");
  const one = await getDocumentByIdService(newId);
  check("read returns the row", !!one);
  eq("read exposes id alias", one?.id, newId);
  eq("read PAGE_REF_NO", one?.PAGE_REF_NO, refNo);
  eq("read content is base64 of stored bytes", Buffer.from(one.CONTENT_DATA, "base64").toString("utf8"), "hello dms");
  check("read resolves LINK_PAGES_NAME", typeof one?.LINK_PAGES_NAME === "string");
  const missing = await getDocumentByIdService(99999999);
  check("read of unknown id returns null", missing === null);

  console.log("\n--- FILTERS AFTER INSERT ---");
  const byRef2 = await getAllDocumentsService("ALL", undefined, refNo);
  eq("ref filter now finds exactly 1", byRef2.length, 1);
  eq("ref filter returns the right row", byRef2[0]?.DMS_ID, newId);
  const byLink2 = await getAllDocumentsService("ALL", linkId);
  check("link filter includes the new row", byLink2.some((r: any) => r.DMS_ID === newId));
  const byLinkMiss = await getAllDocumentsService("ALL", 999999);
  eq("link filter with no matches returns 0", byLinkMiss.length, 0);
  const refCase = await getAllDocumentsService("ALL", undefined, refNo.toLowerCase());
  eq("ref filter is case-insensitive", refCase.length, 1);

  console.log("\n--- UPDATE ---");
  const upd = await updateDocumentService({
    DMS_ID: newId,
    LINK_PAGES_ID: linkId,
    PAGE_REF_NO: refNo,
    DOCUMENT_TYPE: "Receipt",
    DESCRIPTIONS: "updated by smoke",
    FILE_NAME: "smoke.txt",
    CONTENT_TYPE: "text/plain",
    REMARKS: "updated remark",
    STATUS_MASTER: "AC",
    USER: "smoke2",
    MAC_ADDRESS: "WEB",
  });
  eq("update reports the SP message", upd.message, "Data Updated Successfully");
  const after = await pool.request()
    .input("id", sql.Int, newId)
    .query(`SELECT * FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM WHERE DMS_ID=@id`);
  const u = after.recordset[0];
  eq("DOCUMENT_TYPE updated", u?.DOCUMENT_TYPE, "Receipt");
  eq("DESCRIPTIONS updated", u?.DESCRIPTIONS, "updated by smoke");
  eq("REMARKS updated", u?.REMARKS, "updated remark");
  eq("MODIFIED_BY stamped", u?.MODIFIED_BY, "smoke2");
  check("MODIFIED_DATE stamped", !!u?.MODIFIED_DATE);
  check("update without new file kept the original bytes", Buffer.compare(u.CONTENT_DATA, Buffer.from("hello dms", "utf8")) === 0);

  const upd2 = await updateDocumentService({
    DMS_ID: newId,
    LINK_PAGES_ID: linkId,
    PAGE_REF_NO: refNo,
    DOCUMENT_TYPE: "Receipt",
    DESCRIPTIONS: "replaced content",
    FILE_NAME: "smoke.txt",
    CONTENT_TYPE: "text/plain",
    CONTENT_DATA: b64("second revision"),
    REMARKS: null as unknown as string,
    STATUS_MASTER: "AC",
  });
  const after2 = await pool.request()
    .input("id", sql.Int, newId)
    .query(`SELECT CONTENT_DATA, REMARKS FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM WHERE DMS_ID=@id`);
  check("update with new file replaced the bytes", Buffer.compare(after2.recordset[0].CONTENT_DATA, Buffer.from("second revision", "utf8")) === 0);
  check("update nulls a cleared remark", after2.recordset[0].REMARKS === null);

  try {
    await updateDocumentService({ ...payload, DMS_ID: 99999999 });
    check("update of unknown id rejected", false, "no error thrown");
  } catch (e: any) {
    check("update of unknown id rejected", e.httpStatus === 400, `httpStatus=${e.httpStatus} msg=${e.message}`);
  }
  /* Pointing this row at another row's page-ref + file-name must be refused by
     the procedure's duplicate guard, and the refusal has to surface as that
     reason rather than being masked as a missing row. */
  const other = await pool.request()
    .input("id", sql.Int, newId)
    .query(`SELECT TOP 1 PAGE_REF_NO, FILE_NAME FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM
      WHERE DMS_ID <> @id AND PAGE_REF_NO IS NOT NULL AND FILE_NAME IS NOT NULL ORDER BY DMS_ID`);
  const otherRow = other.recordset[0];
  try {
    await updateDocumentService({
      ...payload,
      DMS_ID: newId,
      PAGE_REF_NO: otherRow.PAGE_REF_NO,
      FILE_NAME: otherRow.FILE_NAME,
      DESCRIPTIONS: "dup attempt",
    });
    check("update duplicate rejected as SP error not 'not found'", false, "no error thrown");
  } catch (e: any) {
    check("update duplicate rejected as SP error not 'not found'", /already exists/i.test(e.message), `msg=${e.message}`);
  }
  const afterDup = await pool.request()
    .input("id", sql.Int, newId)
    .query(`SELECT DESCRIPTIONS FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM WHERE DMS_ID=@id`);
  check("refused duplicate left the row untouched", afterDup.recordset[0].DESCRIPTIONS !== "dup attempt",
    `got=${afterDup.recordset[0].DESCRIPTIONS}`);

  console.log("\n--- DELETE ---");
  try {
    await deleteDocumentService(newId, "smoke", "Manager", "WEB");
    check("delete blocked for non-Admin", false, "no error thrown");
  } catch (e: any) {
    check("delete blocked for non-Admin", /no rights/i.test(e.message), `msg=${e.message}`);
  }
  const stillThere = await pool.request()
    .input("id", sql.Int, newId)
    .query(`SELECT COUNT(*) n FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM WHERE DMS_ID=@id`);
  eq("blocked delete removed nothing", Number(stillThere.recordset[0].n), 1);

  const del = await deleteDocumentService(newId, "smoke", "Admin", "WEB");
  eq("delete reports the SP message", del.message, "Data Deleted Successfully");
  const gone = await pool.request()
    .input("id", sql.Int, newId)
    .query(`SELECT COUNT(*) n FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM WHERE DMS_ID=@id`);
  eq("row is physically gone", Number(gone.recordset[0].n), 0);
  eq("read after delete returns null", await getDocumentByIdService(newId), null);

  const after2Count = await pool.request().query(`SELECT COUNT(*) n FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM`);
  eq("table back to the original row count", Number(after2Count.recordset[0].n), countBefore);

  console.log("\n--- office MIME types must not be rejected ---");
  const officeTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  let accepted = 0;
  let officeId = 0;
  for (let i = 0; i < officeTypes.length; i++) {
    const res = await saveDocumentService({
      ...payload,
      PAGE_REF_NO: `${payload.PAGE_REF_NO}-of${i}`,
      FILE_NAME: `office-${i}.bin`,
      CONTENT_TYPE: officeTypes[i],
    } as any);
    const id = Number(res?.DMS_ID);
    if (id > 0) {
      accepted += 1;
      created.push(id);
      officeId = id;
    }
  }
  eq("both over-length office MIME types are accepted", accepted, officeTypes.length);

  const officeRow = await pool.request()
    .input("id", sql.Int, officeId)
    .query(`SELECT CONTENT_TYPE ct, DATALENGTH(CONTENT_DATA) n FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM WHERE DMS_ID=@id`);
  const ct = String(officeRow.recordset[0]?.ct ?? "");
  check("the over-length type was normalised", ct === "application/octet-stream", `got=${ct}`);
  check("every stored CONTENT_TYPE fits VARCHAR(50)", ct.length <= 50, `len=${ct.length}`);
  check("the office upload kept its bytes", Number(officeRow.recordset[0]?.n) > 0, JSON.stringify(officeRow.recordset[0]));

  const shortSaved = await saveDocumentService({
    ...payload,
    PAGE_REF_NO: `${payload.PAGE_REF_NO}-short`,
    FILE_NAME: "short.bin",
    CONTENT_TYPE: "text/plain",
  } as any);
  const shortId = Number(shortSaved?.DMS_ID);
  if (shortId > 0) created.push(shortId);
  const shortRow = await pool.request()
    .input("id", sql.Int, shortId)
    .query(`SELECT CONTENT_TYPE ct FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM WHERE DMS_ID=@id`);
  eq("a short MIME type is stored exactly as reported", shortRow.recordset[0]?.ct, "text/plain");

  const removed = await cleanupCreated();
  const left = await pool.request().query(
    `SELECT COUNT(*) n FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM`
  );
  eq("table is back to the original row count", Number(left.recordset[0].n), countBefore);
  check("cleanup removed every row this run created", removed > 0, `removed=${removed}`);

  console.log(`\n${"=".repeat(46)}\n  PASS ${pass}   FAIL ${fail}\n${"=".repeat(46)}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(async (e) => {
  console.error("SMOKE ERROR:", e.message);
  /* Awaited: a fire-and-forget delete followed by process.exit lets the process
     die before the statement runs, which leaves the test row behind. */
  try {
    const removed = await cleanupCreated();
    if (removed) console.error(`cleanup removed ${removed} leftover row(s)`);
  } catch (cleanupError: any) {
    console.error("cleanup failed:", cleanupError.message);
  }
  process.exit(1);
});
