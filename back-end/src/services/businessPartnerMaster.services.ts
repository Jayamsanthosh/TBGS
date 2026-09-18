import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface BusinessPartnerMasterData {
  BP_ID?: number;
  BP_TYPE?: string;
  BP_NAME?: string;
  BP_SHORT_CODE?: string;
  TIN_NUMBER?: string;
  VAT_NUMBER?: string;
  CONTACT_PERSON?: string;
  CONTACT_NUMBER?: string;
  ADDRESS?: string;
  EMAIL_ADDRESS?: string;
  PHONE_NUMBER_2?: string;
  COUNTRY_ID?: number;
  COUNTRY_NAME?: string;
  REGION_ID?: number;
  REGION_NAME?: string;
  DISTRICT_ID?: number;
  DISTRICT_NAME?: string;
  LOCATION?: string;
  NATURE_OF_BUSINESS?: string;
  CREDIT_ALLOWED?: string;
  COMPANY_HEAD_CONTACT_PERSON?: string;
  COMPANY_HEAD_PHONE_NO?: string;
  COMPANY_HEAD_EMAIL?: string;
  ACCOUNTS_CONTACT_PERSON?: string;
  ACCOUNTS_PHONE_NO?: string;
  ACCOUNTS_EMAIL?: string;
  CURRENCY_ID?: number;
  CURRENCY_NAME?: string;
  PAYMENT_TERMS?: string;
  SECTION_HEAD_RESPONSE_PERSON?: string;
  SECTION_HEAD_RESPONSE_DATE?: Date;
  SECTION_HEAD_RESPONSE_STATUS?: string;
  SECTION_HEAD_RESPONSE_REMARKS?: string;
  RESPONSE_1_PERSON?: string;
  RESPONSE_1_DATE?: Date;
  RESPONSE_1_STATUS?: string;
  RESPONSE_1_REMARKS?: string;
  RESPONSE_2_PERSON?: string;
  RESPONSE_2_DATE?: Date;
  RESPONSE_2_STATUS?: string;
  RESPONSE_2_REMARKS?: string;
  FINAL_RESPONSE_PERSON?: string;
  FINAL_RESPONSE_DATE?: Date;
  FINAL_RESPONSE_STATUS?: string;
  FINAL_RESPONSE_REMARKS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  CREATED_BY?: string;
  CREATED_DATE?: Date;
  CREATED_MAC_ADDRESS?: string;
  MODIFIED_BY?: string;
  MODIFIED_DATE?: Date;
  MODIFIED_MAC_ADDRESS?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const addStatusAlias = (rows: any[]) =>
  (rows || []).map((r: any) => ({
    ...r,
    statusMaster: r.STATUS_MASTER || r.statusMaster,
  }));

export const getAllBusinessPartnerMasterService = async (status = "ALL") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL") {
      const statuses = ["AC", "IA"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(20), s)
          .execute("VMaster.SHOW_BUSINESS_PARTNER_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return addStatusAlias(allRows);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status)
      .execute("VMaster.SHOW_BUSINESS_PARTNER_MASTER");
    return addStatusAlias(result.recordset || []);
  } catch (error) {
    console.error("SHOW_BUSINESS_PARTNER_MASTER SP error:", error);
    throw error;
  }
};

export const getBusinessPartnerMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BP_ID", sql.Int, id)
      .execute("VMaster.GET_BUSINESS_PARTNER_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_BUSINESS_PARTNER_MASTER SP error:", error);
    throw error;
  }
};

export const saveBusinessPartnerMasterService = async (data: BusinessPartnerMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .output("BP_ID", sql.Int)
      .input("BP_TYPE", sql.VarChar(50), data.BP_TYPE || null)
      .input("BP_NAME", sql.VarChar(250), data.BP_NAME || null)
      .input("BP_SHORT_CODE", sql.VarChar(50), data.BP_SHORT_CODE || null)
      .input("TIN_NUMBER", sql.VarChar(100), data.TIN_NUMBER || null)
      .input("VAT_NUMBER", sql.VarChar(50), data.VAT_NUMBER || null)
      .input("CONTACT_PERSON", sql.VarChar(50), data.CONTACT_PERSON || null)
      .input("CONTACT_NUMBER", sql.VarChar(50), data.CONTACT_NUMBER || null)
      .input("ADDRESS", sql.VarChar(1500), data.ADDRESS || null)
      .input("EMAIL_ADDRESS", sql.VarChar(100), data.EMAIL_ADDRESS || null)
      .input("PHONE_NUMBER_2", sql.VarChar(50), data.PHONE_NUMBER_2 || null)
      .input("COUNTRY_ID", sql.Int, data.COUNTRY_ID ?? null)
      .input("REGION_ID", sql.Int, data.REGION_ID ?? null)
      .input("DISTRICT_ID", sql.Int, data.DISTRICT_ID ?? null)
      .input("LOCATION", sql.VarChar(100), data.LOCATION || null)
      .input("NATURE_OF_BUSINESS", sql.VarChar(50), data.NATURE_OF_BUSINESS || null)
      .input("CREDIT_ALLOWED", sql.VarChar(50), data.CREDIT_ALLOWED || null)
      .input("COMPANY_HEAD_CONTACT_PERSON", sql.VarChar(250), data.COMPANY_HEAD_CONTACT_PERSON || null)
      .input("COMPANY_HEAD_PHONE_NO", sql.VarChar(250), data.COMPANY_HEAD_PHONE_NO || null)
      .input("COMPANY_HEAD_EMAIL", sql.VarChar(250), data.COMPANY_HEAD_EMAIL || null)
      .input("ACCOUNTS_CONTACT_PERSON", sql.VarChar(250), data.ACCOUNTS_CONTACT_PERSON || null)
      .input("ACCOUNTS_PHONE_NO", sql.VarChar(250), data.ACCOUNTS_PHONE_NO || null)
      .input("ACCOUNTS_EMAIL", sql.VarChar(250), data.ACCOUNTS_EMAIL || null)
      .input("CURRENCY_ID", sql.Int, data.CURRENCY_ID ?? null)
      .input("PAYMENT_TERMS", sql.VarChar(2500), data.PAYMENT_TERMS || null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_BUSINESS_PARTNER_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save business partner");

    const newId = result.output?.BP_ID || savedData;
    return { message: message || "Data saved successfully", BP_ID: newId };
  } catch (error) {
    console.error("SAVE_BUSINESS_PARTNER_MASTER SP error:", error);
    throw error;
  }
};

export const updateBusinessPartnerMasterService = async (data: BusinessPartnerMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BP_ID", sql.Int, data.BP_ID ?? 0)
      .input("BP_TYPE", sql.VarChar(50), data.BP_TYPE ?? null)
      .input("BP_NAME", sql.VarChar(250), data.BP_NAME ?? null)
      .input("BP_SHORT_CODE", sql.VarChar(50), data.BP_SHORT_CODE ?? null)
      .input("TIN_NUMBER", sql.VarChar(100), data.TIN_NUMBER ?? null)
      .input("VAT_NUMBER", sql.VarChar(50), data.VAT_NUMBER ?? null)
      .input("CONTACT_PERSON", sql.VarChar(50), data.CONTACT_PERSON ?? null)
      .input("CONTACT_NUMBER", sql.VarChar(50), data.CONTACT_NUMBER ?? null)
      .input("ADDRESS", sql.VarChar(1500), data.ADDRESS ?? null)
      .input("EMAIL_ADDRESS", sql.VarChar(100), data.EMAIL_ADDRESS ?? null)
      .input("PHONE_NUMBER_2", sql.VarChar(50), data.PHONE_NUMBER_2 ?? null)
      .input("COUNTRY_ID", sql.Int, data.COUNTRY_ID ?? null)
      .input("REGION_ID", sql.Int, data.REGION_ID ?? null)
      .input("DISTRICT_ID", sql.Int, data.DISTRICT_ID ?? null)
      .input("LOCATION", sql.VarChar(100), data.LOCATION ?? null)
      .input("NATURE_OF_BUSINESS", sql.VarChar(50), data.NATURE_OF_BUSINESS ?? null)
      .input("CREDIT_ALLOWED", sql.VarChar(50), data.CREDIT_ALLOWED ?? null)
      .input("COMPANY_HEAD_CONTACT_PERSON", sql.VarChar(250), data.COMPANY_HEAD_CONTACT_PERSON ?? null)
      .input("COMPANY_HEAD_PHONE_NO", sql.VarChar(250), data.COMPANY_HEAD_PHONE_NO ?? null)
      .input("COMPANY_HEAD_EMAIL", sql.VarChar(250), data.COMPANY_HEAD_EMAIL ?? null)
      .input("ACCOUNTS_CONTACT_PERSON", sql.VarChar(250), data.ACCOUNTS_CONTACT_PERSON ?? null)
      .input("ACCOUNTS_PHONE_NO", sql.VarChar(250), data.ACCOUNTS_PHONE_NO ?? null)
      .input("ACCOUNTS_EMAIL", sql.VarChar(250), data.ACCOUNTS_EMAIL ?? null)
      .input("CURRENCY_ID", sql.Int, data.CURRENCY_ID ?? null)
      .input("PAYMENT_TERMS", sql.VarChar(2500), data.PAYMENT_TERMS ?? null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_BUSINESS_PARTNER_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update business partner");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_BUSINESS_PARTNER_MASTER SP error:", error);
    throw error;
  }
};

export const deleteBusinessPartnerMasterService = async (
  id: number,
  user: string,
  role: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BP_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_BUSINESS_PARTNER_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete business partner");

    return { message: message || "Record deleted successfully" };
  } catch (error: any) {
    console.error("DELETE_BUSINESS_PARTNER_MASTER SP error:", error);
    const msg = error?.message || "";
    if (msg.includes("FK_BP_ID_GUN_BRAND") || msg.includes("REFERENCE constraint")) {
      throw new Error("Cannot delete: This Business Partner has associated Gun Brands. Remove or reassign them first.");
    }
    throw error;
  }
};