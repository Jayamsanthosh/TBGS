import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface PurchaseRequestDtl {
  PURCHASE_REQUEST_DTL_ID?: number;
  REFERENCE_TYPE_ID?: number;
  REFERENCE_NO?: string;
  LINE_NO?: number;
  MAIN_CATEGORY_ID?: number;
  SUB_CATEGORY_ID?: number;
  PRODUCT_ID?: number;
  DESCRIPTION?: string;
  NO_OF_PCS_PER_PACKING?: any;
  Total_Quantity?: any;
  UOM_ID?: number;
  Total_Packing?: any;
  ALT_UOM_ID?: number;
  TRUCK_ID?: number;
  REQUIRED_DATE?: string;
  REASON?: string;
  STATUS_ENTRY?: string;
}

export interface PurchaseRequestData {
  PURCHASE_REQUEST_NO?: string;
  PURCHASE_REQUEST_DATE?: string;
  REQUESTED_BY_EMP_ID?: number;
  COMPANY_ID?: number;
  BRANCH_ID?: number;
  PO_STORE_ID?: number;
  CAMP_ID?: number;
  REQUEST_STORE_ID?: number;
  REQUEST_TYPE_ID?: number;
  PRIORITY_ID?: number;
  REQUIRED_DATE?: string;
  REASON?: string;
  SECTION_HEAD_RESPONSE_PERSON_EMP_ID?: number;
  SECTION_HEAD_RESPONSE_DATE?: string;
  SECTION_HEAD_RESPONSE_STATUS?: string;
  SECTION_HEAD_RESPONSE_REMARKS?: string;
  SECTION_HEAD_RESPONSE_IP_ADDRESS?: string;
  RESPONSE_1_EMP_ID?: number;
  RESPONSE_1_DATE?: string;
  RESPONSE_1_STATUS?: string;
  RESPONSE_1_REMARKS?: string;
  RESPONSE_1_IP_ADDRESS?: string;
  RESPONSE_2_EMP_ID?: number;
  RESPONSE_2_DATE?: string;
  RESPONSE_2_STATUS?: string;
  RESPONSE_2_REMARKS?: string;
  RESPONSE_2_IP_ADDRESS?: string;
  FINAL_RESPONSE_EMP_ID?: number;
  FINAL_RESPONSE_DATE?: string;
  FINAL_RESPONSE_STATUS?: string;
  FINAL_RESPONSE_REMARKS?: string;
  FINAL_RESPONSE_IP_ADDRESS?: string;
  STATUS_ID?: number;
  REMARKS?: string;
  STATUS_ENTRY?: string;
  DELIVERY_LOCATION_ID?: number;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  dtls?: PurchaseRequestDtl[];
  deletedIds?: number[];
}

export interface PurchaseRequestListFilter {
  status?: string | null;
  search?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  companyId?: number | null;
  storeId?: number | null;
  campId?: number | null;
  branchId?: number | null;
  page?: number | null;
  pageSize?: number | null;
}

const dateOrNull = (v: any): Date | null => (v ? new Date(v) : null);

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const toNullablePage = (v: number | null | undefined): number | null =>
  v == null || !Number.isFinite(v) || v < 1 ? null : Math.floor(v);

export const getPurchaseRequestListService = async (
  filter: PurchaseRequestListFilter = {}
): Promise<{ total: number; rows: any[] }> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PURCHASE_REQUEST_NO", sql.VarChar(50), null)
      .input("SNO", sql.Int, null)
      .input("Status", sql.VarChar(20), filter.status || "ALL")
      .input("FromDate", sql.Date, filter.fromDate ? new Date(filter.fromDate) : null)
      .input("ToDate", sql.Date, filter.toDate ? new Date(filter.toDate) : null)
      .input("CompanyId", sql.Int, numOrNull(filter.companyId))
      .input("StoreId", sql.Int, numOrNull(filter.storeId))
      .input("CampId", sql.Int, numOrNull(filter.campId))
      .input("BranchId", sql.Int, numOrNull(filter.branchId))
      .input("Search", sql.NVarChar(200), filter.search || null)
      .input("Page", sql.Int, toNullablePage(filter.page))
      .input("PageSize", sql.Int, toNullablePage(filter.pageSize))
      .execute("VPurchase.GET_PURCHASE_REQUEST_HDR");

    const recordsets = (result.recordsets || []) as any[][];
    if (recordsets.length >= 2) {
      const rows = (recordsets[1] || []).map((r: any) => ({ ...r, id: r.sno }));
      const total = Number(recordsets[0]?.[0]?.Total ?? rows.length);
      return { total, rows };
    }
    const rows = (recordsets[0] || []).map((r: any) => ({ ...r, id: r.sno }));
    return { total: rows.length, rows };
  } catch (error) {
    console.error("GET_PURCHASE_REQUEST_HDR SP error:", error);
    throw error;
  }
};

export const getPurchaseRequestHdrService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PURCHASE_REQUEST_NO", sql.VarChar(50), refNo)
      .input("SNO", sql.Int, null)
      .input("Status", sql.VarChar(20), "ALL")
      .input("FromDate", sql.Date, null)
      .input("ToDate", sql.Date, null)
      .input("CompanyId", sql.Int, null)
      .input("StoreId", sql.Int, null)
      .input("CampId", sql.Int, null)
      .input("BranchId", sql.Int, null)
      .input("Search", sql.NVarChar(200), null)
      .input("Page", sql.Int, null)
      .input("PageSize", sql.Int, null)
      .execute("VPurchase.GET_PURCHASE_REQUEST_HDR");

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Purchase Request header not found");
    return row;
  } catch (error) {
    console.error("GET_PURCHASE_REQUEST_HDR (by no) error:", error);
    throw error;
  }
};

export const getPurchaseRequestDtlsService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PURCHASE_REQUEST_NO", sql.VarChar(50), refNo)
      .execute("VPurchase.SHOW_PURCHASE_REQUEST_DTL");

    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_PURCHASE_REQUEST_DTL SP error:", error);
    throw error;
  }
};

export const getPurchaseRequestDtlService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PURCHASE_REQUEST_DTL_ID", sql.Int, id)
      .execute("VPurchase.GET_PURCHASE_REQUEST_DTL");

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Purchase Request detail not found");
    return row;
  } catch (error) {
    console.error("GET_PURCHASE_REQUEST_DTL SP error:", error);
    throw error;
  }
};

const savePurchaseRequestDtlService = async (
  refNo: string,
  dtl: PurchaseRequestDtl,
  user: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("PURCHASE_REQUEST_NO", sql.VarChar(50), refNo)
    .input("REFERENCE_TYPE_ID", sql.Int, numOrNull(dtl.REFERENCE_TYPE_ID))
    .input("REFERENCE_NO", sql.VarChar(50), dtl.REFERENCE_NO || null)
    .input("LINE_NO", sql.Int, numOrNull(dtl.LINE_NO) ?? 0)
    .input("MAIN_CATEGORY_ID", sql.Int, numOrNull(dtl.MAIN_CATEGORY_ID))
    .input("SUB_CATEGORY_ID", sql.Int, numOrNull(dtl.SUB_CATEGORY_ID))
    .input("PRODUCT_ID", sql.Int, numOrNull(dtl.PRODUCT_ID))
    .input("DESCRIPTION", sql.VarChar(500), dtl.DESCRIPTION || null)
    .input("NO_OF_PCS_PER_PACKING", sql.Decimal(15, 3), numOrNull(dtl.NO_OF_PCS_PER_PACKING))
    .input("Total_Quantity", sql.Decimal(15, 3), numOrNull(dtl.Total_Quantity))
    .input("UOM_ID", sql.Int, numOrNull(dtl.UOM_ID))
    .input("Total_Packing", sql.Decimal(15, 3), numOrNull(dtl.Total_Packing))
    .input("ALT_UOM_ID", sql.Int, numOrNull(dtl.ALT_UOM_ID))
    .input("TRUCK_ID", sql.Int, numOrNull(dtl.TRUCK_ID))
    .input("REQUIRED_DATE", sql.DateTime, dateOrNull(dtl.REQUIRED_DATE))
    .input("REASON", sql.VarChar(500), dtl.REASON || null)
    .input("STATUS_ENTRY", sql.VarChar(20), dtl.STATUS_ENTRY || "CF")
    .input("USER", sql.VarChar(50), user)
    .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
    .execute("VPurchase.SAVE_PURCHASE_REQUEST_DTL");

  parseSprocResult(result.recordset?.[0], "Failed to save purchase request detail");
  return result.recordset?.[0];
};

const updatePurchaseRequestDtlService = async (
  refNo: string,
  dtl: PurchaseRequestDtl,
  user: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("PURCHASE_REQUEST_DTL_ID", sql.Int, numOrNull(dtl.PURCHASE_REQUEST_DTL_ID) ?? 0)
    .input("PURCHASE_REQUEST_NO", sql.VarChar(50), refNo)
    .input("REFERENCE_TYPE_ID", sql.Int, numOrNull(dtl.REFERENCE_TYPE_ID))
    .input("REFERENCE_NO", sql.VarChar(50), dtl.REFERENCE_NO || null)
    .input("LINE_NO", sql.Int, numOrNull(dtl.LINE_NO) ?? 0)
    .input("MAIN_CATEGORY_ID", sql.Int, numOrNull(dtl.MAIN_CATEGORY_ID))
    .input("SUB_CATEGORY_ID", sql.Int, numOrNull(dtl.SUB_CATEGORY_ID))
    .input("PRODUCT_ID", sql.Int, numOrNull(dtl.PRODUCT_ID))
    .input("DESCRIPTION", sql.VarChar(500), dtl.DESCRIPTION || null)
    .input("NO_OF_PCS_PER_PACKING", sql.Decimal(15, 3), numOrNull(dtl.NO_OF_PCS_PER_PACKING))
    .input("Total_Quantity", sql.Decimal(15, 3), numOrNull(dtl.Total_Quantity))
    .input("UOM_ID", sql.Int, numOrNull(dtl.UOM_ID))
    .input("Total_Packing", sql.Decimal(15, 3), numOrNull(dtl.Total_Packing))
    .input("ALT_UOM_ID", sql.Int, numOrNull(dtl.ALT_UOM_ID))
    .input("TRUCK_ID", sql.Int, numOrNull(dtl.TRUCK_ID))
    .input("REQUIRED_DATE", sql.DateTime, dateOrNull(dtl.REQUIRED_DATE))
    .input("REASON", sql.VarChar(500), dtl.REASON || null)
    .input("STATUS_ENTRY", sql.VarChar(20), dtl.STATUS_ENTRY || null)
    .input("USER", sql.VarChar(50), user)
    .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
    .execute("VPurchase.UPDATE_PURCHASE_REQUEST_DTL");

  parseSprocResult(result.recordset?.[0], "Failed to update purchase request detail");
  return result.recordset?.[0];
};

export const savePurchaseRequestCombinedService = async (data: PurchaseRequestData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const hdrResult = await pool
      .request()
      .input("PURCHASE_REQUEST_NO", sql.VarChar(50), "")
      .input("PURCHASE_REQUEST_DATE", sql.DateTime, dateOrNull(data.PURCHASE_REQUEST_DATE))
      .input("REQUESTED_BY_EMP_ID", sql.Int, numOrNull(data.REQUESTED_BY_EMP_ID))
      .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID))
      .input("BRANCH_ID", sql.Int, numOrNull(data.BRANCH_ID))
      .input("PO_STORE_ID", sql.Int, numOrNull(data.PO_STORE_ID))
      .input("CAMP_ID", sql.Int, numOrNull(data.CAMP_ID))
      .input("REQUEST_STORE_ID", sql.Int, numOrNull(data.REQUEST_STORE_ID))
      .input("REQUEST_TYPE_ID", sql.Int, numOrNull(data.REQUEST_TYPE_ID))
      .input("PRIORITY_ID", sql.Int, numOrNull(data.PRIORITY_ID))
      .input("REQUIRED_DATE", sql.DateTime, dateOrNull(data.REQUIRED_DATE))
      .input("REASON", sql.VarChar(500), data.REASON || null)
      .input("SECTION_HEAD_RESPONSE_PERSON_EMP_ID", sql.Int, numOrNull(data.SECTION_HEAD_RESPONSE_PERSON_EMP_ID))
      .input("SECTION_HEAD_RESPONSE_DATE", sql.DateTime, dateOrNull(data.SECTION_HEAD_RESPONSE_DATE))
      .input("SECTION_HEAD_RESPONSE_STATUS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_STATUS || null)
      .input("SECTION_HEAD_RESPONSE_REMARKS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_REMARKS || null)
      .input("SECTION_HEAD_RESPONSE_IP_ADDRESS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_IP_ADDRESS || null)
      .input("RESPONSE_1_EMP_ID", sql.Int, numOrNull(data.RESPONSE_1_EMP_ID))
      .input("RESPONSE_1_DATE", sql.DateTime, dateOrNull(data.RESPONSE_1_DATE))
      .input("RESPONSE_1_STATUS", sql.VarChar(50), data.RESPONSE_1_STATUS || null)
      .input("RESPONSE_1_REMARKS", sql.VarChar(50), data.RESPONSE_1_REMARKS || null)
      .input("RESPONSE_1_IP_ADDRESS", sql.VarChar(50), data.RESPONSE_1_IP_ADDRESS || null)
      .input("RESPONSE_2_EMP_ID", sql.Int, numOrNull(data.RESPONSE_2_EMP_ID))
      .input("RESPONSE_2_DATE", sql.DateTime, dateOrNull(data.RESPONSE_2_DATE))
      .input("RESPONSE_2_STATUS", sql.VarChar(50), data.RESPONSE_2_STATUS || null)
      .input("RESPONSE_2_REMARKS", sql.VarChar(50), data.RESPONSE_2_REMARKS || null)
      .input("RESPONSE_2_IP_ADDRESS", sql.VarChar(50), data.RESPONSE_2_IP_ADDRESS || null)
      .input("FINAL_RESPONSE_EMP_ID", sql.Int, numOrNull(data.FINAL_RESPONSE_EMP_ID))
      .input("FINAL_RESPONSE_DATE", sql.DateTime, dateOrNull(data.FINAL_RESPONSE_DATE))
      .input("FINAL_RESPONSE_STATUS", sql.VarChar(50), data.FINAL_RESPONSE_STATUS || null)
      .input("FINAL_RESPONSE_REMARKS", sql.VarChar(50), data.FINAL_RESPONSE_REMARKS || null)
      .input("FINAL_RESPONSE_IP_ADDRESS", sql.VarChar(50), data.FINAL_RESPONSE_IP_ADDRESS || null)
      .input("STATUS_ID", sql.Int, numOrNull(data.STATUS_ID))
      .input("REMARKS", sql.VarChar(500), data.REMARKS || null)
      .input("STATUS_ENTRY", sql.VarChar(20), data.STATUS_ENTRY || "CF")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("DELIVERY_LOCATION_ID", sql.Int, numOrNull(data.DELIVERY_LOCATION_ID))
      .execute("VPurchase.SAVE_PURCHASE_REQUEST_HDR");

    const hdrResponse = hdrResult.recordset?.[0];
    const { message, data: parsedData } = parseSprocResult(
      hdrResponse,
      "Failed to save purchase request header"
    );
    const refNo = String(parsedData ?? data.PURCHASE_REQUEST_NO ?? "").trim();

    if (!refNo) {
      throw new Error("Can't Generate Purchase Request Reference Number. Contact Admin");
    }

    const dtls = Array.isArray(data.dtls) ? data.dtls : [];
    for (const dtl of dtls) {
      await savePurchaseRequestDtlService(refNo, dtl, data.USER || "Admin", data.MAC_ADDRESS || "WEB");
    }

    return { message: message || "Purchase Request created successfully", PURCHASE_REQUEST_NO: refNo };
  } catch (error) {
    console.error("SAVE_PURCHASE_REQUEST_HDR/DTL combined error:", error);
    throw error;
  }
};

export const updatePurchaseRequestCombinedService = async (data: PurchaseRequestData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const hdrResult = await pool
      .request()
      .input("PURCHASE_REQUEST_NO", sql.VarChar(50), data.PURCHASE_REQUEST_NO || null)
      .input("PURCHASE_REQUEST_DATE", sql.DateTime, dateOrNull(data.PURCHASE_REQUEST_DATE))
      .input("REQUESTED_BY_EMP_ID", sql.Int, numOrNull(data.REQUESTED_BY_EMP_ID))
      .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID))
      .input("BRANCH_ID", sql.Int, numOrNull(data.BRANCH_ID))
      .input("PO_STORE_ID", sql.Int, numOrNull(data.PO_STORE_ID))
      .input("CAMP_ID", sql.Int, numOrNull(data.CAMP_ID))
      .input("REQUEST_STORE_ID", sql.Int, numOrNull(data.REQUEST_STORE_ID))
      .input("REQUEST_TYPE_ID", sql.Int, numOrNull(data.REQUEST_TYPE_ID))
      .input("PRIORITY_ID", sql.Int, numOrNull(data.PRIORITY_ID))
      .input("REQUIRED_DATE", sql.DateTime, dateOrNull(data.REQUIRED_DATE))
      .input("REASON", sql.VarChar(500), data.REASON || null)
      .input("SECTION_HEAD_RESPONSE_PERSON_EMP_ID", sql.Int, numOrNull(data.SECTION_HEAD_RESPONSE_PERSON_EMP_ID))
      .input("SECTION_HEAD_RESPONSE_DATE", sql.DateTime, dateOrNull(data.SECTION_HEAD_RESPONSE_DATE))
      .input("SECTION_HEAD_RESPONSE_STATUS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_STATUS || null)
      .input("SECTION_HEAD_RESPONSE_REMARKS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_REMARKS || null)
      .input("SECTION_HEAD_RESPONSE_IP_ADDRESS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_IP_ADDRESS || null)
      .input("RESPONSE_1_EMP_ID", sql.Int, numOrNull(data.RESPONSE_1_EMP_ID))
      .input("RESPONSE_1_DATE", sql.DateTime, dateOrNull(data.RESPONSE_1_DATE))
      .input("RESPONSE_1_STATUS", sql.VarChar(50), data.RESPONSE_1_STATUS || null)
      .input("RESPONSE_1_REMARKS", sql.VarChar(50), data.RESPONSE_1_REMARKS || null)
      .input("RESPONSE_1_IP_ADDRESS", sql.VarChar(50), data.RESPONSE_1_IP_ADDRESS || null)
      .input("RESPONSE_2_EMP_ID", sql.Int, numOrNull(data.RESPONSE_2_EMP_ID))
      .input("RESPONSE_2_DATE", sql.DateTime, dateOrNull(data.RESPONSE_2_DATE))
      .input("RESPONSE_2_STATUS", sql.VarChar(50), data.RESPONSE_2_STATUS || null)
      .input("RESPONSE_2_REMARKS", sql.VarChar(50), data.RESPONSE_2_REMARKS || null)
      .input("RESPONSE_2_IP_ADDRESS", sql.VarChar(50), data.RESPONSE_2_IP_ADDRESS || null)
      .input("FINAL_RESPONSE_EMP_ID", sql.Int, numOrNull(data.FINAL_RESPONSE_EMP_ID))
      .input("FINAL_RESPONSE_DATE", sql.DateTime, dateOrNull(data.FINAL_RESPONSE_DATE))
      .input("FINAL_RESPONSE_STATUS", sql.VarChar(50), data.FINAL_RESPONSE_STATUS || null)
      .input("FINAL_RESPONSE_REMARKS", sql.VarChar(50), data.FINAL_RESPONSE_REMARKS || null)
      .input("FINAL_RESPONSE_IP_ADDRESS", sql.VarChar(50), data.FINAL_RESPONSE_IP_ADDRESS || null)
      .input("STATUS_ID", sql.Int, numOrNull(data.STATUS_ID))
      .input("REMARKS", sql.VarChar(500), data.REMARKS || null)
      .input("STATUS_ENTRY", sql.VarChar(20), data.STATUS_ENTRY || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("DELIVERY_LOCATION_ID", sql.Int, numOrNull(data.DELIVERY_LOCATION_ID))
      .execute("VPurchase.UPDATE_PURCHASE_REQUEST_HDR");

    parseSprocResult(hdrResult.recordset?.[0], "Failed to update purchase request header");

    const refNo = data.PURCHASE_REQUEST_NO || "";
    const user = data.USER || "Admin";
    const macAddress = data.MAC_ADDRESS || "WEB";

    const dtls = Array.isArray(data.dtls) ? data.dtls : [];
    for (const dtl of dtls) {
      if (dtl.PURCHASE_REQUEST_DTL_ID) {
        await updatePurchaseRequestDtlService(refNo, dtl, user, macAddress);
      } else {
        await savePurchaseRequestDtlService(refNo, dtl, user, macAddress);
      }
    }

    const deletedIds = Array.isArray(data.deletedIds) ? data.deletedIds : [];
    for (const id of deletedIds) {
      await deletePurchaseRequestDtlService(id, user, data.ROLE || "Admin", macAddress);
    }

    return { message: "Purchase Request updated successfully", PURCHASE_REQUEST_NO: refNo };
  } catch (error) {
    console.error("UPDATE_PURCHASE_REQUEST_HDR/DTL combined error:", error);
    throw error;
  }
};

export const deletePurchaseRequestDtlService = async (
  id: number,
  user = "Admin",
  role = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VPurchase.DELETE_PURCHASE_REQUEST_DTL");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to delete purchase request detail"
    );
    return { message: message || "Purchase Request detail deleted successfully" };
  } catch (error) {
    console.error("DELETE_PURCHASE_REQUEST_DTL error:", error);
    throw error;
  }
};

export const deletePurchaseRequestHdrService = async (
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
      .input("PURCHASE_REQUEST_NO", sql.VarChar(50), refNo)
      .query(
        `SELECT PURCHASE_REQUEST_DTL_ID FROM [VPurchase].[TBL_PURCHASE_REQUEST_DTL] WHERE PURCHASE_REQUEST_NO = @PURCHASE_REQUEST_NO`
      );

    for (const row of children.recordset || []) {
      await deletePurchaseRequestDtlService(
        Number(row.PURCHASE_REQUEST_DTL_ID),
        user,
        role,
        macAddress
      );
    }

    const result = await pool
      .request()
      .input("PURCHASE_REQUEST_NO", sql.VarChar(50), refNo)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VPurchase.DELETE_PURCHASE_REQUEST_HDR");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to delete purchase request header"
    );
    return { message: message || "Purchase Request deleted successfully" };
  } catch (error) {
    console.error("DELETE_PURCHASE_REQUEST_HDR error:", error);
    throw error;
  }
};

export const loadPurchaseRequestOptionsService = async (
  companyId?: number | null,
  statusEntry?: string | null,
  approvalStatus?: string | null,
  includeInactive = false
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("CompanyId", sql.Int, numOrNull(companyId))
      .input("StatusEntry", sql.VarChar(20), statusEntry || null)
      .input("ApprovalStatus", sql.VarChar(20), approvalStatus || null)
      .input("IncludeInactive", sql.Bit, includeInactive ? 1 : 0)
      .execute("VPurchase.LOAD_PURCHASE_REQUEST_HDR");

    return (result.recordset || []).map((r: any) => ({ ...r, id: r.purchaseRequestNo }));
  } catch (error) {
    console.error("LOAD_PURCHASE_REQUEST_HDR SP error:", error);
    throw error;
  }
};