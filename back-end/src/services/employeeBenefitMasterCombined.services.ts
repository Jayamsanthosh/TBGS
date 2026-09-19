import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface EmployeeBenefitMasterDtl {
  SNO?: number;
  EMP_ID?: number;
  BENEFIT_TYPE_ID?: number;
  GROSS_AMOUNT?: number;
  PAID_STATUS?: string;
  REASON?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

export interface EmployeeBenefitMasterData {
  EMP_BENEFIT_REF_NO?: string;
  BENEFIT_DATE?: string;
  MONTH_ENTERED?: string;
  YEAR_ENTERED?: number;
  EMP_ID?: number;
  FIRST_NAME?: string;
  MIDDLE_NAME?: string;
  LAST_NAME?: string;
  COMPANY_ID?: number;
  DEPARTMENT_ID?: number;
  DESIGNATION_ID?: number;
  DEPARTMENT_GROUP_ID?: number;
  DESIGNATION_GROUP_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  EMPLOYMENT_TYPE_ID?: number;
  CURRENCY_ID?: number;
  TOTAL_GROSS_AMOUNT?: number;
  PAID_STATUS?: string;
  REASON?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  HDR_PAID_STATUS?: string;
  HDR_REASON?: string;
  HDR_REMARKS?: string;
  HDR_STATUS?: string;
  DTL_PAID_STATUS?: string;
  DTL_REASON?: string;
  DTL_REMARKS?: string;
  DTL_STATUS?: string;
  BENEFIT_TYPE_NAME?: string;
  COMPANY_NAME?: string;
  CURRENCY_NAME?: string;
  dtls?: EmployeeBenefitMasterDtl[];
  deletedIds?: number[];
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const dateOrNull = (v: any): Date | null => (v ? new Date(v) : null);
const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" ? null : Number(v);

/**
 * SPs return rows in two shapes:
 *   - Aliased  : '' AS STATUS, 'Data Saved Successfully' AS MESSAGE, id AS DATA
 *   - Unaliased: 'error','No Rights To Delete',''  OR  'Error','Already Submitted..','0'
 * This helper detects the error in either shape and extracts the exact message + data.
 */
const parseResponse = (row: any) => {
  if (!row) return { message: "", data: null };

  const emptyKey = row[""];
  const cells = Array.isArray(emptyKey) && emptyKey.length ? emptyKey : Object.values(row);
  const first = String(cells[0] ?? "").toLowerCase();

  if (first === "error") {
    throw new Error(String(cells[1] ?? "Operation failed"));
  }

  return {
    message: String(row.MESSAGE ?? cells[1] ?? ""),
    data: row.DATA ?? cells[2] ?? null,
  };
};

export const getAllEmployeeBenefitMasterCombinedService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool.request().query(`
      SELECT
        H.EMP_BENEFIT_REF_NO,
        CONVERT(VARCHAR(19), H.BENEFIT_DATE, 120) BENEFIT_DATE,
        H.MONTH_ENTERED,
        H.YEAR_ENTERED,
        H.EMP_ID,
        H.FIRST_NAME,
        H.MIDDLE_NAME,
        H.LAST_NAME,
        H.COMPANY_ID,
        H.DEPARTMENT_ID,
        H.DESIGNATION_ID,
        H.DEPARTMENT_GROUP_ID,
        H.DESIGNATION_GROUP_ID,
        H.CAMP_ID,
        H.STORE_ID,
        H.EMPLOYMENT_TYPE_ID,
        H.CURRENCY_ID,
        H.TOTAL_GROSS_AMOUNT,
        H.PAID_STATUS [HDR_PAID_STATUS],
        H.REASON [HDR_REASON],
        H.REMARKS [HDR_REMARKS],
        H.STATUS_MASTER [HDR_STATUS],
        C.COMPANY_NAME,
        CUR.CURRENCY_NAME,
        D.SNO,
        D.BENEFIT_TYPE_ID,
        T.BENEFIT_TYPE_NAME,
        D.GROSS_AMOUNT,
        D.PAID_STATUS [DTL_PAID_STATUS],
        D.REASON [DTL_REASON],
        D.REMARKS [DTL_REMARKS],
        D.STATUS_MASTER [DTL_STATUS]
      FROM [VPayEntries].[TBL_EMPLOYEE_BENEFIT_HDR] H
      LEFT JOIN [VPayEntries].[TBL_EMPLOYEE_BENEFIT_DTL] D
        ON H.EMP_BENEFIT_REF_NO = D.EMP_BENEFIT_REF_NO
      LEFT JOIN [VMaster].[TBL_EMPLOYEE_BENEFIT_TYPE_MASTER] T
        ON D.BENEFIT_TYPE_ID = T.BENEFIT_TYPE_ID
      LEFT JOIN [VMaster].[TBL_COMPANY_MASTER] C
        ON H.COMPANY_ID = C.COMPANY_ID
      LEFT JOIN [VMaster].[TBL_CURRENCY_MASTER] CUR
        ON H.CURRENCY_ID = CUR.CURRENCY_ID
      ORDER BY H.EMP_BENEFIT_REF_NO
    `);

    return (result.recordset || []).map((r: any) => ({ ...r, id: r.SNO ?? r.EMP_BENEFIT_REF_NO }));
  } catch (error) {
    console.error("SHOW_EMPLOYEE_BENEFIT_MASTER_COMBINED error:", error);
    throw error;
  }
};

export const getEmployeeBenefitMasterHdrService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("EMP_BENEFIT_REF_NO", sql.VarChar(50), refNo)
      .execute("VPayEntries.GET_EMPLOYEE_BENEFIT_HDR");

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Employee benefit header not found");
    return row;
  } catch (error) {
    console.error("GET_EMPLOYEE_BENEFIT_HDR error:", error);
    throw error;
  }
};

export const getEmployeeBenefitMasterDtlService = async (sno: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, sno)
      .execute("VPayEntries.GET_EMPLOYEE_BENEFIT_DTL");

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Employee benefit detail not found");
    return row;
  } catch (error) {
    console.error("GET_EMPLOYEE_BENEFIT_DTL error:", error);
    throw error;
  }
};

const saveEmployeeBenefitMasterDtlService = async (
  refNo: string,
  dtl: EmployeeBenefitMasterDtl,
  user: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("EMP_BENEFIT_REF_NO", sql.VarChar(50), refNo)
    .input("EMP_ID", sql.Int, numOrNull(dtl.EMP_ID) ?? 0)
    .input("BENEFIT_TYPE_ID", sql.Int, numOrNull(dtl.BENEFIT_TYPE_ID) ?? 0)
    .input("GROSS_AMOUNT", sql.Decimal(15, 2), numOrNull(dtl.GROSS_AMOUNT))
    .input("PAID_STATUS", sql.VarChar(50), dtl.PAID_STATUS || null)
    .input("REASON", sql.VarChar(3000), dtl.REASON || null)
    .input("REMARKS", sql.VarChar(1000), dtl.REMARKS || null)
    .input("STATUS_MASTER", sql.VarChar(20), dtl.STATUS_MASTER || null)
    .input("USER", sql.VarChar(50), user)
    .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
    .execute("VPayEntries.SAVE_EMPLOYEE_BENEFIT_DTL");

  parseSprocResult(result.recordset?.[0], "Failed to save employee benefit detail");
  return result.recordset?.[0];
};

export const saveEmployeeBenefitMasterCombinedService = async (data: EmployeeBenefitMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const hdrResult = await pool
      .request()
      .input("EMP_BENEFIT_REF_NO", sql.VarChar(50), "")
      .input("BENEFIT_DATE", sql.DateTime, dateOrNull(data.BENEFIT_DATE))
      .input("MONTH_ENTERED", sql.VarChar(25), data.MONTH_ENTERED || null)
      .input("YEAR_ENTERED", sql.Int, numOrNull(data.YEAR_ENTERED) ?? 0)
      .input("EMP_ID", sql.Int, numOrNull(data.EMP_ID) ?? 0)
      .input("FIRST_NAME", sql.VarChar(50), data.FIRST_NAME || null)
      .input("MIDDLE_NAME", sql.VarChar(50), data.MIDDLE_NAME || null)
      .input("LAST_NAME", sql.VarChar(50), data.LAST_NAME || null)
      .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID) ?? 0)
      .input("DEPARTMENT_ID", sql.Int, numOrNull(data.DEPARTMENT_ID) ?? 0)
      .input("DESIGNATION_ID", sql.Int, numOrNull(data.DESIGNATION_ID) ?? 0)
      .input("DEPARTMENT_GROUP_ID", sql.Int, numOrNull(data.DEPARTMENT_GROUP_ID) ?? 0)
      .input("DESIGNATION_GROUP_ID", sql.Int, numOrNull(data.DESIGNATION_GROUP_ID) ?? 0)
      .input("CAMP_ID", sql.Int, numOrNull(data.CAMP_ID) ?? 0)
      .input("STORE_ID", sql.Int, numOrNull(data.STORE_ID) ?? 0)
      .input("EMPLOYMENT_TYPE_ID", sql.Int, numOrNull(data.EMPLOYMENT_TYPE_ID) ?? 0)
      .input("CURRENCY_ID", sql.Int, numOrNull(data.CURRENCY_ID) ?? 0)
      .input("TOTAL_GROSS_AMOUNT", sql.Decimal(15, 2), numOrNull(data.TOTAL_GROSS_AMOUNT))
      .input("PAID_STATUS", sql.VarChar(50), data.PAID_STATUS || null)
      .input("REASON", sql.VarChar(3000), data.REASON || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VPayEntries.SAVE_EMPLOYEE_BENEFIT_HDR");

    const hdrResponse = hdrResult.recordset?.[0];
    const { status, message, data: parsedData } = parseSprocResult(hdrResponse, "Failed to save employee benefit header");
    const refNo = String(parsedData ?? data.EMP_BENEFIT_REF_NO ?? "");

    if (!refNo) {
      throw new Error("Can't Generate Emp Benefit Request Reference Number. Contact Admin");
    }

    const dtls = Array.isArray(data.dtls) ? data.dtls : [];
    for (const dtl of dtls) {
      await saveEmployeeBenefitMasterDtlService(refNo, dtl, data.USER || "Admin", data.MAC_ADDRESS || "WEB");
    }

    return { message: message || "Employee benefit saved successfully", EMP_BENEFIT_REF_NO: refNo };
  } catch (error) {
    console.error("SAVE_EMPLOYEE_BENEFIT_MASTER_COMBINED error:", error);
    throw error;
  }
};

export const updateEmployeeBenefitMasterCombinedService = async (data: EmployeeBenefitMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const hdrResult = await pool
      .request()
      .input("EMP_BENEFIT_REF_NO", sql.VarChar(50), data.EMP_BENEFIT_REF_NO || null)
      .input("BENEFIT_DATE", sql.DateTime, dateOrNull(data.BENEFIT_DATE))
      .input("MONTH_ENTERED", sql.VarChar(25), data.MONTH_ENTERED || null)
      .input("YEAR_ENTERED", sql.Int, numOrNull(data.YEAR_ENTERED) ?? 0)
      .input("EMP_ID", sql.Int, numOrNull(data.EMP_ID) ?? 0)
      .input("FIRST_NAME", sql.VarChar(50), data.FIRST_NAME || null)
      .input("MIDDLE_NAME", sql.VarChar(50), data.MIDDLE_NAME || null)
      .input("LAST_NAME", sql.VarChar(50), data.LAST_NAME || null)
      .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID) ?? 0)
      .input("DEPARTMENT_ID", sql.Int, numOrNull(data.DEPARTMENT_ID) ?? 0)
      .input("DESIGNATION_ID", sql.Int, numOrNull(data.DESIGNATION_ID) ?? 0)
      .input("DEPARTMENT_GROUP_ID", sql.Int, numOrNull(data.DEPARTMENT_GROUP_ID) ?? 0)
      .input("DESIGNATION_GROUP_ID", sql.Int, numOrNull(data.DESIGNATION_GROUP_ID) ?? 0)
      .input("CAMP_ID", sql.Int, numOrNull(data.CAMP_ID) ?? 0)
      .input("STORE_ID", sql.Int, numOrNull(data.STORE_ID) ?? 0)
      .input("EMPLOYMENT_TYPE_ID", sql.Int, numOrNull(data.EMPLOYMENT_TYPE_ID) ?? 0)
      .input("CURRENCY_ID", sql.Int, numOrNull(data.CURRENCY_ID) ?? 0)
      .input("TOTAL_GROSS_AMOUNT", sql.Decimal(15, 2), numOrNull(data.TOTAL_GROSS_AMOUNT))
      .input("PAID_STATUS", sql.VarChar(50), data.PAID_STATUS || null)
      .input("REASON", sql.VarChar(3000), data.REASON || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VPayEntries.UPDATE_EMPLOYEE_BENEFIT_HDR");

    const hdrResponse = hdrResult.recordset?.[0];
    parseSprocResult(hdrResponse, "Failed to update employee benefit header");

    const refNo = data.EMP_BENEFIT_REF_NO || "";
    const user = data.USER || "Admin";
    const macAddress = data.MAC_ADDRESS || "WEB";

    const dtls = Array.isArray(data.dtls) ? data.dtls : [];
    for (const dtl of dtls) {
      if (dtl.SNO) {
        const dtlResult = await pool
          .request()
          .input("SNO", sql.Int, dtl.SNO)
          .input("EMP_BENEFIT_REF_NO", sql.VarChar(50), refNo)
          .input("EMP_ID", sql.Int, numOrNull(dtl.EMP_ID) ?? 0)
          .input("BENEFIT_TYPE_ID", sql.Int, numOrNull(dtl.BENEFIT_TYPE_ID) ?? 0)
          .input("GROSS_AMOUNT", sql.Decimal(15, 2), numOrNull(dtl.GROSS_AMOUNT))
          .input("PAID_STATUS", sql.VarChar(50), dtl.PAID_STATUS || null)
          .input("REASON", sql.VarChar(3000), dtl.REASON || null)
          .input("REMARKS", sql.VarChar(1000), dtl.REMARKS || null)
          .input("STATUS_MASTER", sql.VarChar(20), dtl.STATUS_MASTER || null)
          .input("USER", sql.VarChar(50), user)
          .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
          .execute("VPayEntries.UPDATE_EMPLOYEE_BENEFIT_DTL");

        const dtlResponse = dtlResult.recordset?.[0];
        parseSprocResult(dtlResponse, "Failed to update employee benefit detail");
      } else {
        await saveEmployeeBenefitMasterDtlService(refNo, dtl, user, macAddress);
      }
    }

    const deletedIds = Array.isArray(data.deletedIds) ? data.deletedIds : [];
    for (const sno of deletedIds) {
      await deleteEmployeeBenefitMasterDtlService(sno, user, data.ROLE || "Admin", macAddress);
    }

    return { message: "Employee benefit updated successfully", EMP_BENEFIT_REF_NO: refNo };
  } catch (error) {
    console.error("UPDATE_EMPLOYEE_BENEFIT_MASTER_COMBINED error:", error);
    throw error;
  }
};

export const deleteEmployeeBenefitMasterDtlService = async (
  sno: number,
  user = "Admin",
  role = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, sno)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VPayEntries.DELETE_EMPLOYEE_BENEFIT_DTL");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete employee benefit detail");
    return { message: message || "Employee benefit detail deleted successfully" };
  } catch (error) {
    console.error("DELETE_EMPLOYEE_BENEFIT_DTL error:", error);
    throw error;
  }
};

export const deleteEmployeeBenefitMasterHdrService = async (
  refNo: string,
  user = "Admin",
  role = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const children = await pool
      .request()
      .input("EMP_BENEFIT_REF_NO", sql.VarChar(50), refNo)
      .query(
        `SELECT SNO FROM [VPayEntries].[TBL_EMPLOYEE_BENEFIT_DTL] WHERE EMP_BENEFIT_REF_NO = @EMP_BENEFIT_REF_NO`
      );

    for (const row of children.recordset || []) {
      await deleteEmployeeBenefitMasterDtlService(row.SNO, user, role, macAddress);
    }

    const result = await pool
      .request()
      .input("EMP_BENEFIT_REF_NO", sql.VarChar(50), refNo)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VPayEntries.DELETE_EMPLOYEE_BENEFIT_HDR");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete employee benefit header");
    return { message: message || "Employee benefit header deleted successfully" };
  } catch (error) {
    console.error("DELETE_EMPLOYEE_BENEFIT_HDR error:", error);
    throw error;
  }
};
