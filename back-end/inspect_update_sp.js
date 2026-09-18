const sql = require("msnodesqlv8");
const cs = "Driver={ODBC Driver 18 for SQL Server};Server=41.220.131.249,15045;Database=TBGS;Uid=tbgs;Pwd={tbgs@159};Encrypt=yes;TrustServerCertificate=yes;";
sql.open(cs, (e, c) => {
  if (e) { console.error("OPEN ERR:", e.message); process.exit(1); }
  c.query("SELECT OBJECT_DEFINITION(OBJECT_ID('VPayEntries.UPDATE_LEAVE_ENCASHMENT_ENTRIES')) AS def", (e, r) => {
    if (e) { console.error("Q ERR:", e.message); process.exit(1); }
    console.log(r[0].def || "NOT FOUND");
    c.close(); process.exit(0);
  });
});