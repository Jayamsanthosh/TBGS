import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface EmployeeDatabaseData {
  SNO?: number;
  EMP_ID?: number;
  INT_TITLES?: string;
  FIRST_NAME?: string;
  MIDDLE_NAME?: string;
  LAST_NAME?: string;
  DATE_OF_BIRTH?: Date | string | null;
  AGE?: string;
  GENDER?: string;
  TRIAL_PERIOD_VALID_FROM?: Date | string | null;
  TRIAL_PERIOD_VALID_TO?: Date | string | null;
  DATE_OF_JOINING?: Date | string | null;
  RELAVANT_EXPERIENCE?: string;
  MARITAL_STATUS?: string;
  BLOOD_GROUP_ID?: number;
  EMPLOYEE_SKILL_STATUS?: string;
  COMPANY_ID?: number;
  DEPARTMENT_ID?: number;
  DESIGNATION_ID?: number;
  DEPARTMENT_GROUP_ID?: number;
  DESIGNATION_GROUP_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  EMPLOYMENT_TYPE_ID?: number;
  SALARY_SCALE_ID?: number;
  BASIC_SALARY?: number;
  GROSS?: number;
  CURRENCY_ID?: number;
  COUNTRY_ID?: number;
  REGION_ID?: number;
  DISTRICT_ID?: number;
  LOCATION_ID?: number;
  ADDRESS_STREET?: string;
  PAYMENT_MODE_ID?: number;
  BANK_ID?: number;
  ACCOUNT_NO?: string;
  EMP_PH_NO?: string;
  EMP_MAILID?: string;
  APPROVED_BY?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const toDecimal = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const toDate = (v: any): Date | null => {
  if (v === undefined || v === null || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const cleanNone = (data: EmployeeDatabaseData): EmployeeDatabaseData => {
  const o: any = { ...data };
  for (const k of Object.keys(o)) {
    if (o[k] === "__none__") o[k] = undefined;
  }
  return o;
};

const baseInputs = (req: any, data: EmployeeDatabaseData) => {
  data = cleanNone(data);
  req.input("EMP_ID", sql.Int, toInt(data.EMP_ID));
  req.input("INT_TITLES", sql.VarChar(20), data.INT_TITLES || null);
  req.input("FIRST_NAME", sql.VarChar(50), data.FIRST_NAME || null);
  req.input("MIDDLE_NAME", sql.VarChar(50), data.MIDDLE_NAME || null);
  req.input("LAST_NAME", sql.VarChar(50), data.LAST_NAME || null);
  req.input("DATE_OF_BIRTH", sql.DateTime, toDate(data.DATE_OF_BIRTH));
  req.input("AGE", sql.VarChar(50), data.AGE || null);
  req.input("GENDER", sql.VarChar(20), data.GENDER || null);
  req.input("TRIAL_PERIOD_VALID_FROM", sql.DateTime, toDate(data.TRIAL_PERIOD_VALID_FROM));
  req.input("TRIAL_PERIOD_VALID_TO", sql.DateTime, toDate(data.TRIAL_PERIOD_VALID_TO));
  req.input("DATE_OF_JOINING", sql.DateTime, toDate(data.DATE_OF_JOINING));
  req.input("RELAVANT_EXPERIENCE", sql.VarChar(50), data.RELAVANT_EXPERIENCE || null);
  req.input("MARITAL_STATUS", sql.VarChar(50), data.MARITAL_STATUS || null);
  req.input("BLOOD_GROUP_ID", sql.Int, toInt(data.BLOOD_GROUP_ID));
  req.input("EMPLOYEE_SKILL_STATUS", sql.VarChar(50), data.EMPLOYEE_SKILL_STATUS || null);
  req.input("COMPANY_ID", sql.Int, toInt(data.COMPANY_ID));
  req.input("DEPARTMENT_ID", sql.Int, toInt(data.DEPARTMENT_ID));
  req.input("DESIGNATION_ID", sql.Int, toInt(data.DESIGNATION_ID));
  req.input("CAMP_ID", sql.Int, toInt(data.CAMP_ID));
  req.input("STORE_ID", sql.Int, toInt(data.STORE_ID));
  req.input("EMPLOYMENT_TYPE_ID", sql.Int, toInt(data.EMPLOYMENT_TYPE_ID));
  req.input("SALARY_SCALE_ID", sql.Int, toInt(data.SALARY_SCALE_ID));
  req.input("BASIC_SALARY", sql.Decimal(15, 2), toDecimal(data.BASIC_SALARY));
  req.input("GROSS", sql.Decimal(15, 2), toDecimal(data.GROSS));
  req.input("EMP_PH_NO", sql.VarChar(50), data.EMP_PH_NO || null);
  req.input("EMP_MAILID", sql.VarChar(50), data.EMP_MAILID || null);
  req.input("ACCOUNT_NO", sql.VarChar(50), data.ACCOUNT_NO || null);
  req.input("BANK_ID", sql.Int, toInt(data.BANK_ID));
  req.input("REMARKS", sql.VarChar(1000), data.REMARKS || null);
  req.input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null);
  req.input("USER", sql.VarChar(50), data.USER || "Admin");
  req.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");
  return req;
};

const updateOnlyInputs = (req: any, data: EmployeeDatabaseData) => {
  data = cleanNone(data);
  req.input("DEPARTMENT_GROUP_ID", sql.Int, toInt(data.DEPARTMENT_GROUP_ID));
  req.input("DESIGNATION_GROUP_ID", sql.Int, toInt(data.DESIGNATION_GROUP_ID));
  req.input("CURRENCY_ID", sql.Int, toInt(data.CURRENCY_ID));
  req.input("COUNTRY_ID", sql.Int, toInt(data.COUNTRY_ID));
  req.input("REGION_ID", sql.Int, toInt(data.REGION_ID));
  req.input("DISTRICT_ID", sql.Int, toInt(data.DISTRICT_ID));
  req.input("LOCATION_ID", sql.Int, toInt(data.LOCATION_ID));
  req.input("ADDRESS_STREET", sql.VarChar(250), data.ADDRESS_STREET || null);
  req.input("PAYMENT_MODE_ID", sql.Int, toInt(data.PAYMENT_MODE_ID));
  req.input("APPROVED_BY", sql.VarChar(50), data.APPROVED_BY || null);
  return req;
};

export const getAllEmployeeDatabaseService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (!status || status === "ALL") {
      let allRows: any[] = [];
      for (const s of ["AC", "IN"]) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(20), s)
          .execute("VPayEntries.SHOW_NEW_EMPLOYEE_DATABASE");
        allRows = allRows.concat(result.recordset || []);
      }
      return allRows;
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status)
      .execute("VPayEntries.SHOW_NEW_EMPLOYEE_DATABASE");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_NEW_EMPLOYEE_DATABASE SP error:", error);
    throw error;
  }
};

export const getEmployeeDatabaseByIdService = async (sno: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, sno)
      .execute("VPayEntries.GET_NEW_EMPLOYEE_DATABASE");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_NEW_EMPLOYEE_DATABASE SP error:", error);
    throw error;
  }
};

export const saveEmployeeDatabaseService = async (data: EmployeeDatabaseData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await baseInputs(pool.request(), data).execute("VPayEntries.SAVE_NEW_EMPLOYEE_DATABASE");

    const { status, message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to save employee");

    if (id) {
      await updateEmployeeDatabaseService({ ...data, SNO: id });
    }

    return { message: message || "Data saved successfully", SNO: id };
  } catch (error) {
    console.error("SAVE_NEW_EMPLOYEE_DATABASE SP error:", error);
    const msg = (error as any)?.message || "";
    if ((error as any)?.number === 547 || msg.includes("FOREIGN KEY") || msg.includes("FK_")) {
      throw new Error("Cannot save: one or more selected values (Company, Department, etc.) is invalid.");
    }
    if (
      (error as any)?.number === 2627 ||
      msg.includes("PRIMARY KEY") ||
      msg.includes("duplicate key") ||
      msg.includes("Cannot insert duplicate")
    ) {
      throw new Error("EMPLOYEE ALREADY EXISTS");
    }
    throw error;
  }
};

export const updateEmployeeDatabaseService = async (data: EmployeeDatabaseData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const req = pool.request().input("SNO", sql.Int, toInt(data.SNO) ?? 0);
    baseInputs(req, data);
    updateOnlyInputs(req, data);
    const result = await req.execute("VPayEntries.UPDATE_NEW_EMPLOYEE_DATABASE");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update employee");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_NEW_EMPLOYEE_DATABASE SP error:", error);
    const msg = (error as any)?.message || "";
    if ((error as any)?.number === 547 || msg.includes("FOREIGN KEY") || msg.includes("FK_")) {
      throw new Error("Cannot update: one or more selected values (Company, Department, etc.) is invalid.");
    }
    if (
      (error as any)?.number === 2627 ||
      msg.includes("PRIMARY KEY") ||
      msg.includes("duplicate key") ||
      msg.includes("Cannot insert duplicate")
    ) {
      throw new Error("EMPLOYEE ALREADY EXISTS");
    }
    throw error;
  }
};

export const deleteEmployeeDatabaseService = async (
  empId: number,
  user: string,
  role: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("EMP_ID", sql.Int, empId)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VPayEntries.DELETE_NEW_EMPLOYEE_DATABASE");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This employee has associated records.");
    }
    throw error;
  }
};
