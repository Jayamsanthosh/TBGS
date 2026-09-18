import { connectDB } from "./config/db";
import sql from "mssql";

async function run() {
  try {
    const pool = await connectDB();
    console.log("Querying GET_NEW_EMPLOYEE_DATABASE for SNO 6...");
    const result = await pool.request()
      .input("SNO", sql.Int, 6)
      .execute("VPayEntries.GET_NEW_EMPLOYEE_DATABASE");
    
    console.log("Record:", JSON.stringify(result.recordset?.[0], null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
