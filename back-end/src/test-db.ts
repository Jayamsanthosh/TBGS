import { connectDB } from "./config/db";
import sql from "mssql";

async function run() {
  try {
    const pool = await connectDB();
    console.log("Connected. Querying active employees...");
    const result = await pool.request()
      .input("STATUS", sql.VarChar(20), "AC")
      .execute("VPayEntries.SHOW_NEW_EMPLOYEE_DATABASE");
    console.log("Active count:", result.recordset?.length);
    if (result.recordset?.length > 0) {
      console.log("First active record:", JSON.stringify(result.recordset[0], null, 2));
    }

    console.log("Querying inactive employees...");
    const result2 = await pool.request()
      .input("STATUS", sql.VarChar(20), "IN")
      .execute("VPayEntries.SHOW_NEW_EMPLOYEE_DATABASE");
    console.log("Inactive count:", result2.recordset?.length);
    if (result2.recordset?.length > 0) {
      console.log("First inactive record:", JSON.stringify(result2.recordset[0], null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
