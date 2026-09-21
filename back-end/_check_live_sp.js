const sql = require("mssql");
require("dotenv/config");

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_UID,
  password: process.env.DB_PWD,
  options: { encrypt: false, trustServerCertificate: true },
};

(async () => {
  const pool = await sql.connect(config);
  // Get the actual deployed SP definition for GET_REQUEST_LIST_BY_TYPE
  const def = await pool.request().query(`
    SELECT OBJECT_DEFINITION(OBJECT_ID('VRequest.GET_REQUEST_LIST_BY_TYPE')) AS def
  `);
  const sp = def.recordset[0]?.def || "";
  console.log("=== SP length:", sp.length);
  const m = sp.match(/ELSE IF @RequestType = 'Cash Advance Request'([\s\S]*?)(ELSE IF|ELSE|END|GO)/);
  const block = m ? m[1] : "";
  const ac = (block.match(/STATUS_MASTER\s*=\s*'AC'/g) || []).length;
  const cl = (block.match(/STATUS_MASTER\s*=\s*'CL'/g) || []).length;
  const all = (sp.match(/STATUS_MASTER\s*=\s*'(AC|CL|IN|CA)'/gi) || []);
  console.log("Cash Advance block STATUS_MASTER='AC' count:", ac);
  console.log("Cash Advance block STATUS_MASTER='CL' count:", cl);
  console.log("All STATUS_MASTER matches in SP:", all);

  const counts = await pool.request().query(`
    SELECT STATUS_MASTER, COUNT(*) AS cnt FROM [VRequest].[TBL_CASH_ADVANCE_REQUEST] GROUP BY STATUS_MASTER
  `);
  console.log("=== Live TBL_CASH_ADVANCE_REQUEST status counts ===");
  console.table(counts.recordset);

  const list = await pool.request()
    .input("RequestType", sql.VarChar(100), "Cash Advance Request")
    .input("Status", sql.VarChar(50), "ALL")
    .execute("VRequest.GET_REQUEST_LIST_BY_TYPE");
  console.log("=== Live GET_REQUEST_LIST_BY_TYPE('Cash Advance Request') returns", list.recordset.length, "rows ===");
  console.table(list.recordset.map(r => ({ sno: r.sno, ref: r.poRefNo, status: r.statusEntry, final: r.finalResponseStatus })));

  await sql.close();
})().catch(async (e) => {
  console.error("ERROR:", e.message);
  try { await sql.close(); } catch {}
  process.exit(1);
});