import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { connectDB, getPool } from "../config/db";

/* Deploys stored procedures from src/SPs.

   The repo already carried the correct SUBMIT_PURCHASE_REQUEST / SUBMIT_PURCHASE_QUOTATION
   definitions, but the database still had the old text-rowset versions, so the
   app failed with "too many arguments specified". This runner is what was
   missing from the workflow.

   GO is a SSMS batch separator, not T-SQL, so each file is split on it and the
   batches run one at a time - CREATE OR ALTER PROCEDURE has to be the first
   statement in its batch. */
/* Purchase request procs are ordered so the read fix lands in the same pass:
   submit first, then the grid projection. */
const FILES = [
  "purchase_request_submit.sql",
  "purchase_quotation_submit.sql",
  "purchase_request_load_grid_fields.sql",
  "purchase_request_requested_by_name.sql",
  /* The quotation wizard copies lines from a request via this read; without
     PRODUCT_ID every imported line arrived unnamed and failed to save. */
  "purchase_request_dtl_product_id_fix.sql",
  /* The save proc took REQUIRED_DATE / REASON / REMARKS / ITEM_TYPE /
     STATUS_ENTRY as parameters but left them out of the INSERT, so every
     quotation line stored STATUS_ENTRY = NULL. */
  "purchase_quotation_dtl_save_fix.sql",
];

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

  for (const f of FILES) {
    const full = path.join(dir, f);
    const sql = fs.readFileSync(full, "utf8");
    const batches = sql
      .split(/^\s*GO\s*$/gim)
      .map((b) => b.trim())
      .filter(Boolean);

    for (const b of batches) await p.request().batch(b);

    /* Take the name from the CREATE OR ALTER line. Reading OBJECT_NAME(...)
       out of the file misses plain "CREATE OR ALTER PROCEDURE [s].[p]"
       declarations, which is how these are written. */
    const procName =
      /(?:CREATE|ALTER)\s+(?:OR\s+ALTER\s+)?PROCEDURE\s+\[?[\w]+\]?\.\[?(\w+)\]?/i.exec(sql)?.[1] ??
      f.replace(/\.sql$/i, "");
    const r = await p.request().query(
      `SELECT OBJECT_DEFINITION(OBJECT_ID('VPurchase.${procName}')) AS def`
    );
    const def = String(r.recordset[0].def || "");
    console.log(
      def
        ? `${f}\n  -> VPurchase.${procName} deployed (${paramCount(def)} parameters)`
        : `${f}\n  -> WARNING: applied, but VPurchase.${procName} not found afterwards`
    );
  }

  process.exit(0);
})().catch((e) => {
  console.error("deploy failed:", e);
  process.exit(1);
});