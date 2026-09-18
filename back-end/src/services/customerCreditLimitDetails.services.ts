import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface CustomerCreditLimitDetailsData {
  SNO?: number;
  COMPANY_ID?: number;
  BP_ID?: number;
  CREDIT_LIMIT_DAYS?: number;
  CREDIT_LIMIT_AMOUNT?: number;
  PAYMENT_MODE_ID?: number;
  EFFECTIVE_FROM?: string;
  EFFECTIVE_TO?: string;
  VALID_TYPE?: string;
  CURRENCY_ID?: number;
  EXPECTED_NEXT_PAYMENT_DATE?: string;
  EXPECTED_NEXT_PAYMENT_AMOUNT?: number;
  REQUEST_FOR?: string;
  SINGLE_INVOICE_REQUEST_AMOUNT?: number;
  CREDIT_LIMIT_BUFFER_DAYS?: number;
  TOTAL_OUTSTANDING_AMOUNT?: number;
  OVER_DUE_OUTSTANDING_AMOUNT?: number;
  REQUESTED_BY?: string;
  REQUESTED_DATE?: string;
  SECTION_HEAD_RESPONSE_PERSON_EMP_ID?: number;
  SECTION_HEAD_RESPONSE_DATE?: string;
  SECTION_HEAD_RESPONSE_STATUS?: string;
  SECTION_HEAD_RESPONSE_REMARKS?: string;
  RESPONSE_1_EMP_ID?: number;
  RESPONSE_1_DATE?: string;
  RESPONSE_1_STATUS?: string;
  RESPONSE_1_REMARKS?: string;
  RESPONSE_2_EMP_ID?: number;
  RESPONSE_2_DATE?: string;
  RESPONSE_2_STATUS?: string;
  RESPONSE_2_REMARKS?: string;
  FINAL_RESPONSE_PERSON?: string;
  FINAL_RESPONSE_DATE?: string;
  FINAL_RESPONSE_STATUS?: string;
  FINAL_RESPONSE_REMARKS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export interface CustomerCreditLimitInput {
  name: string;
  type: any;
  value: any;
}

const saveFieldInputs = (data: CustomerCreditLimitDetailsData): CustomerCreditLimitInput[] => [
  { name: "COMPANY_ID", type: sql.Int, value: data.COMPANY_ID ?? null },
  { name: "BP_ID", type: sql.Int, value: data.BP_ID ?? null },
  { name: "CREDIT_LIMIT_DAYS", type: sql.Int, value: data.CREDIT_LIMIT_DAYS ?? null },
  { name: "CREDIT_LIMIT_AMOUNT", type: sql.Decimal(15, 2), value: data.CREDIT_LIMIT_AMOUNT ?? null },
  { name: "PAYMENT_MODE_ID", type: sql.Int, value: data.PAYMENT_MODE_ID ?? null },
  { name: "EFFECTIVE_FROM", type: sql.DateTime, value: data.EFFECTIVE_FROM || null },
  { name: "EFFECTIVE_TO", type: sql.DateTime, value: data.EFFECTIVE_TO || null },
  { name: "VALID_TYPE", type: sql.VarChar(50), value: data.VALID_TYPE || null },
  { name: "CURRENCY_ID", type: sql.Int, value: data.CURRENCY_ID ?? null },
  { name: "EXPECTED_NEXT_PAYMENT_DATE", type: sql.DateTime, value: data.EXPECTED_NEXT_PAYMENT_DATE || null },
  { name: "EXPECTED_NEXT_PAYMENT_AMOUNT", type: sql.Decimal(15, 2), value: data.EXPECTED_NEXT_PAYMENT_AMOUNT ?? null },
  { name: "REQUEST_FOR", type: sql.VarChar(50), value: data.REQUEST_FOR || null },
  { name: "SINGLE_INVOICE_REQUEST_AMOUNT", type: sql.Decimal(15, 2), value: data.SINGLE_INVOICE_REQUEST_AMOUNT ?? null },
  { name: "CREDIT_LIMIT_BUFFER_DAYS", type: sql.Int, value: data.CREDIT_LIMIT_BUFFER_DAYS ?? null },
  { name: "TOTAL_OUTSTANDING_AMOUNT", type: sql.Decimal(15, 2), value: data.TOTAL_OUTSTANDING_AMOUNT ?? null },
  { name: "OVER_DUE_OUTSTANDING_AMOUNT", type: sql.Decimal(15, 2), value: data.OVER_DUE_OUTSTANDING_AMOUNT ?? null },
  { name: "REQUESTED_BY", type: sql.VarChar(50), value: data.REQUESTED_BY || null },
  { name: "REQUESTED_DATE", type: sql.DateTime, value: data.REQUESTED_DATE || null },
  { name: "SECTION_HEAD_RESPONSE_PERSON_EMP_ID", type: sql.Int, value: data.SECTION_HEAD_RESPONSE_PERSON_EMP_ID ?? null },
  { name: "SECTION_HEAD_RESPONSE_DATE", type: sql.DateTime, value: data.SECTION_HEAD_RESPONSE_DATE || null },
  { name: "SECTION_HEAD_RESPONSE_STATUS", type: sql.VarChar(50), value: data.SECTION_HEAD_RESPONSE_STATUS || null },
  { name: "SECTION_HEAD_RESPONSE_REMARKS", type: sql.VarChar(50), value: data.SECTION_HEAD_RESPONSE_REMARKS || null },
  { name: "RESPONSE_1_EMP_ID", type: sql.Int, value: data.RESPONSE_1_EMP_ID ?? null },
  { name: "RESPONSE_1_DATE", type: sql.DateTime, value: data.RESPONSE_1_DATE || null },
  { name: "RESPONSE_1_STATUS", type: sql.VarChar(50), value: data.RESPONSE_1_STATUS || null },
  { name: "RESPONSE_1_REMARKS", type: sql.VarChar(50), value: data.RESPONSE_1_REMARKS || null },
  { name: "RESPONSE_2_EMP_ID", type: sql.Int, value: data.RESPONSE_2_EMP_ID ?? null },
  { name: "RESPONSE_2_DATE", type: sql.DateTime, value: data.RESPONSE_2_DATE || null },
  { name: "RESPONSE_2_STATUS", type: sql.VarChar(50), value: data.RESPONSE_2_STATUS || null },
  { name: "RESPONSE_2_REMARKS", type: sql.VarChar(50), value: data.RESPONSE_2_REMARKS || null },
  { name: "FINAL_RESPONSE_PERSON", type: sql.VarChar(50), value: data.FINAL_RESPONSE_PERSON || null },
  { name: "FINAL_RESPONSE_DATE", type: sql.DateTime, value: data.FINAL_RESPONSE_DATE || null },
  { name: "FINAL_RESPONSE_STATUS", type: sql.VarChar(50), value: data.FINAL_RESPONSE_STATUS || null },
  { name: "FINAL_RESPONSE_REMARKS", type: sql.VarChar(50), value: data.FINAL_RESPONSE_REMARKS || null },
  { name: "REMARKS", type: sql.VarChar(2000), value: data.REMARKS || null },
  { name: "STATUS_MASTER", type: sql.VarChar(20), value: data.STATUS_MASTER || null },
];

const updateFieldInputs = (data: CustomerCreditLimitDetailsData): CustomerCreditLimitInput[] => [
  { name: "COMPANY_ID", type: sql.Int, value: data.COMPANY_ID ?? null },
  { name: "BP_ID", type: sql.Int, value: data.BP_ID ?? null },
  { name: "CREDIT_LIMIT_DAYS", type: sql.Int, value: data.CREDIT_LIMIT_DAYS ?? null },
  { name: "CREDIT_LIMIT_AMOUNT", type: sql.Decimal(15, 2), value: data.CREDIT_LIMIT_AMOUNT ?? null },
  { name: "PAYMENT_MODE_ID", type: sql.Int, value: data.PAYMENT_MODE_ID ?? null },
  { name: "EFFECTIVE_FROM", type: sql.DateTime, value: data.EFFECTIVE_FROM || null },
  { name: "EFFECTIVE_TO", type: sql.DateTime, value: data.EFFECTIVE_TO || null },
  { name: "VALID_TYPE", type: sql.VarChar(50), value: data.VALID_TYPE || null },
  { name: "CURRENCY_ID", type: sql.Int, value: data.CURRENCY_ID ?? null },
  { name: "EXPECTED_NEXT_PAYMENT_DATE", type: sql.DateTime, value: data.EXPECTED_NEXT_PAYMENT_DATE || null },
  { name: "EXPECTED_NEXT_PAYMENT_AMOUNT", type: sql.Decimal(15, 2), value: data.EXPECTED_NEXT_PAYMENT_AMOUNT ?? null },
  { name: "REQUEST_FOR", type: sql.VarChar(50), value: data.REQUEST_FOR || null },
  { name: "SINGLE_INVOICE_REQUEST_AMOUNT", type: sql.Decimal(15, 2), value: data.SINGLE_INVOICE_REQUEST_AMOUNT ?? null },
  { name: "CREDIT_LIMIT_BUFFER_DAYS", type: sql.Int, value: data.CREDIT_LIMIT_BUFFER_DAYS ?? null },
  { name: "TOTAL_OUTSTANDING_AMOUNT", type: sql.Decimal(15, 2), value: data.TOTAL_OUTSTANDING_AMOUNT ?? null },
  { name: "OVER_DUE_OUTSTANDING_AMOUNT", type: sql.Decimal(15, 2), value: data.OVER_DUE_OUTSTANDING_AMOUNT ?? null },
  { name: "REMARKS", type: sql.VarChar(2000), value: data.REMARKS || null },
  { name: "STATUS_MASTER", type: sql.VarChar(20), value: data.STATUS_MASTER || null },
];

const applyInputs = (request: sql.Request, inputs: CustomerCreditLimitInput[]) => {
  for (const input of inputs) {
    request.input(input.name, input.type, input.value);
  }
  return request;
};

export const getAllCustomerCreditLimitDetailsService = async (companyId: number, status = "ALL") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const statuses = status === "ALL" ? ["AC", "IN"] : [status];

    // Resolve the company scope: a specific company, or every company when 0/ALL
    let companyIds: number[] = [];
    if (companyId && companyId > 0) {
      companyIds = [companyId];
    } else {
      const companiesResult = await pool
        .request()
        .query(`SELECT COMPANY_ID FROM VMaster.TBL_COMPANY_MASTER`);
      companyIds = (companiesResult.recordset || [])
        .map((r: any) => Number(r.COMPANY_ID))
        .filter((id: number) => !isNaN(id));
    }

    let allRows: any[] = [];
    for (const cid of companyIds) {
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("COMPANY_ID", sql.Int, cid)
          .input("STATUS", sql.VarChar(50), s)
          .execute("VMaster.SHOW_CUSTOMER_CREDIT_LIMIT_DETAILS");
        allRows = allRows.concat(result.recordset || []);
      }
    }
    return (allRows || []).map((r: any) => ({ ...r, id: r.SNO }));
  } catch (error) {
    console.error("SHOW_CUSTOMER_CREDIT_LIMIT_DETAILS SP error:", error);
    throw error;
  }
};

export const getCustomerCreditLimitDetailsByIdService = async (sno: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, sno)
      .execute("VMaster.GET_CUSTOMER_CREDIT_LIMIT_DETAILS");

    const row = result.recordset[0] || null;
    return row ? { ...row, id: row.SNO } : null;
  } catch (error) {
    console.error("GET_CUSTOMER_CREDIT_LIMIT_DETAILS SP error:", error);
    throw error;
  }
};

export const saveCustomerCreditLimitDetailsService = async (data: CustomerCreditLimitDetailsData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.output("SNO", sql.Int);
    applyInputs(request, saveFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VMaster.SAVE_CUSTOMER_CREDIT_LIMIT_DETAILS");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save customer credit limit details");

    const newId = result.output?.SNO ?? savedData;
    return { message: message || "Data saved successfully", SNO: newId };
  } catch (error) {
    console.error("SAVE_CUSTOMER_CREDIT_LIMIT_DETAILS SP error:", error);
    throw error;
  }
};

export const updateCustomerCreditLimitDetailsService = async (data: CustomerCreditLimitDetailsData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.input("SNO", sql.Int, data.SNO ?? 0);
    applyInputs(request, updateFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VMaster.UPDATE_CUSTOMER_CREDIT_LIMIT_DETAILS");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update customer credit limit details");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_CUSTOMER_CREDIT_LIMIT_DETAILS SP error:", error);
    throw error;
  }
};

export const deleteCustomerCreditLimitDetailsService = async (
  sno: number,
  user: string,
  role: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, sno)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_CUSTOMER_CREDIT_LIMIT_DETAILS");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete customer credit limit details");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_CUSTOMER_CREDIT_LIMIT_DETAILS SP error:", error);
    throw error;
  }
};