import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { connectDB, getPool } from "../config/db";
import { patchRequestedByReadSprocs } from "./patchRequestedByReadSprocs";
import { SP_FILES } from "./spFiles";

/* Deploys stored procedures from src/SPs.

   The repo already carried the correct SUBMIT_PURCHASE_REQUEST / SUBMIT_PURCHASE_QUOTATION
   definitions, but the database still had the old text-rowset versions, so the
   app failed with "too many arguments specified". This runner is what was
   missing from the workflow.

   GO is a SSMS batch separator, not T-SQL, so each file is split on it and the
   batches run one at a time - CREATE OR ALTER PROCEDURE has to be the first
   statement in its batch. */
/* The deploy order lives in SP_FILES (purchase request procs are ordered so the
   read fix lands in the same pass: submit first, then the grid projection).
   Optional file filter: `npx tsx src/scripts/deployProcs.ts purchase_request_approval.sql`
   applies only the named files (still in SP_FILES order). Without arguments the
   whole list runs, which is the behaviour a fresh database needs. */
const requestedFiles = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
const unknownFiles = requestedFiles.filter((f) => !SP_FILES.includes(f));
if (unknownFiles.length) {
  console.error(`Unknown SP file(s): ${unknownFiles.join(", ")}`);
  console.error(`Known files: ${SP_FILES.join(", ")}`);
  process.exit(1);
}
const FILES = requestedFiles.length
  ? SP_FILES.filter((f) => requestedFiles.includes(f))
  : SP_FILES;

const dir = path.join(__dirname, "..", "SPs");

/* Reports the declared parameter count, so a redeploy that silently does not
   match the caller is visible instead of failing later at runtime. */
const paramCount = (def: string) => {
  /* Count only the parameter list. Comments are stripped first because these
     files document @STATUS_ID and friends in prose, and the leading comment
     block otherwise looks like part of the signature. */
  const body = def.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--.*$/gm, "");
  const open = body.indexOf("(");
  if (open < 0) return 0;
  let depth = 0;
  let end = open;
  for (let i = open; i < body.length; i++) {
    if (body[i] === "(") depth++;
    else if (body[i] === ")") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  const names = (body.slice(open, end).match(/@[A-Za-z_]\w*/g) || []);
  return names.length;
};

(async () => {
  await connectDB();
  const p: any = getPool();

  /* The GRN procedures read and write columns that the migration creates
     (PO_QUANTITY on the lines, LINK_ID on the lines). A procedure can be
     created even when the column is not there - the name is only resolved
     when it runs - so a deployment without the migration looks fine and the
     first save fails with "Invalid column name". The state is checked before
     the procedures go out, and the missing columns are named. */
  const requiredColumns = [
    { table: "TBL_PURCHASE_GRN_DTL", column: "PO_QUANTITY" },
    { table: "TBL_PURCHASE_GRN_DTL", column: "LINK_ID" },
  ];

  for (const f of FILES) {
    const full = path.join(dir, f);
    const sql = fs.readFileSync(full, "utf8");
    const batches = sql
      .split(/^\s*GO\s*$/gim)
      .map((b) => b.trim())
      .filter(Boolean);

    /* All the batches of a file run on one connection. The session options a
       procedure is created with are part of its metadata, and the pool can
       hand a different connection to the next request - the file level
       "SET QUOTED_IDENTIFIER ON" would then be lost before the CREATE. */
    const conn = await p.connect();
    try {
      await conn.request().batch("SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;");
      for (const b of batches) await conn.request().batch(b);
    } finally {
      conn.release();
    }

    /* Take the schema and the name from the CREATE OR ALTER lines. Reading
       OBJECT_NAME(...) out of the file misses plain
       "CREATE OR ALTER PROCEDURE [s].[p]" declarations, which is how these are
       written. A file can hold more than one procedure, so every one of them
       is reported. */
    const procNames = Array.from(
      sql.matchAll(
        /(?:CREATE|ALTER)\s+(?:OR\s+ALTER\s+)?PROCEDURE\s+\[?(\w+)\]?\.\[?(\w+)\]?/gi
      )
    ).map((m) => ({ schema: m[1], name: m[2] }));

    for (const proc of procNames.length
      ? procNames
      : [{ schema: "VPurchase", name: f.replace(/\.sql$/i, "") }]) {
      const r = await p.request().query(
        `SELECT OBJECT_DEFINITION(OBJECT_ID('[${proc.schema}].[${proc.name}]')) AS def`
      );
      const def = String(r.recordset[0]?.def || "");
      console.log(
        def
          ? `${f}\n  -> ${proc.schema}.${proc.name} deployed (${paramCount(def)} parameters)`
          : `${f}\n  -> WARNING: applied, but ${proc.schema}.${proc.name} not found afterwards`
      );
    }

    /* The check runs after the migration file of this same run, so it only
       fails when the migration did not do its job. */
    if (f === "purchase_grn_fix.sql") {
      const missing: string[] = [];
      for (const c of requiredColumns) {
        const r = await p.request()
          .input("TABLE_NAME", c.table)
          .input("COLUMN_NAME", c.column)
          .query(
            `SELECT 1 AS HIT
               FROM sys.columns
               WHERE object_id = OBJECT_ID('VInventory.' + @TABLE_NAME)
                 AND name = @COLUMN_NAME`
          );
        if (!r.recordset?.length) missing.push(`VInventory.${c.table}.${c.column}`);
      }
      if (missing.length) {
        console.error(
          `  -> ERROR: ${missing.join(", ")} missing. The Purchase GRN procedures need them; run back-end/src/SPs/purchase_grn_migration.sql.`
        );
        process.exit(1);
      }

      /* A procedure keeps the session options it was created with. The header
         table has a filtered index, so a procedure created with
         QUOTED_IDENTIFIER OFF fails every write to it with "UPDATE failed
         because the following SET options have incorrect settings". */
      const r = await p.request().query(
        `SELECT OBJECT_NAME(object_id) AS PROC_NAME
           FROM sys.sql_modules
          WHERE object_id IN (SELECT object_id FROM sys.objects WHERE type = 'P')
            AND name LIKE '%PURCHASE_GRN%'
            AND uses_quoted_identifier = 0`
      );
      const bad = (r.recordset || []).map((x: any) => x.PROC_NAME);
      if (bad.length) {
        console.error(
          `  -> ERROR: ${bad.join(", ")} were created with QUOTED_IDENTIFIER OFF. Recreate them in a session with "SET QUOTED_IDENTIFIER ON" (deployProcs.ts does that).`
        );
        process.exit(1);
      }
    }
  }

  /* GET_PURCHASE_REQUEST_HDR and GET_APPROVAL_LIST_PURCHASE_REQUEST have no file
     in src/SPs, so nothing above can correct their requester-name block. Run the
     patcher last so a fresh database, or one whose procedures were rebuilt some
     other way, ends up with the same fix as this one. It is a no-op when the
     procedures are already correct. */
  console.log("requested-by read procs");
  await patchRequestedByReadSprocs();

  process.exit(0);
})().catch((e) => {
  console.error("deploy failed:", e);
  process.exit(1);
});