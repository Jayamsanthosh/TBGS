import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface InsightCardsFilter {
  overdueDays?: number;
}

export interface InsightRecordsFilter {
  cardKey: string;
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
}

const VALID_CARD_KEYS = [
  "management-attention", "employees", "attendance", "leave",
  "drivers", "trucks", "trailers", "contracts",
  "overtime-requests", "cash-advance-requests", "bonus-requests", "arrears-requests",
  "salary-deductions", "employee-benefits", "promotion-transfer-requests",
  "products", "business-partners", "fuel", "guns",
  "hotels-travel", "animals", "camps", "hotels",
] as const;

export const INVALID_CARD_KEY = (key: string) => !(VALID_CARD_KEYS as readonly string[]).includes(key);

export const getInsightCardsService = async (_filters: InsightCardsFilter): Promise<any[]> => {
  const pool = getPool();
  const res = await pool.request()
    .input("OverdueDays", sql.Int, 7)
    .execute("VReport.GET_DASHBOARD_CARDS");
  const recordsets = (res.recordsets || []) as any[][];
  return recordsets[0] ?? [];
};

export const getInsightRecordsService = async (filters: InsightRecordsFilter): Promise<{ total: number; rows: any[] }> => {
  const pool = getPool();
  const {
    cardKey, status = "ALL", search = "",
    fromDate, toDate,
    page = 1, pageSize = 10, sortBy = "", sortDir = "DESC",
  } = filters;

  const res = await pool.request()
    .input("CardKey", sql.VarChar(60), cardKey)
    .input("Status", sql.VarChar(30), status)
    .input("Search", sql.NVarChar(100), search)
    .input("FromDate", sql.Date, fromDate || null)
    .input("ToDate", sql.Date, toDate || null)
    .input("Page", sql.Int, page)
    .input("PageSize", sql.Int, pageSize)
    .input("SortBy", sql.VarChar(40), sortBy)
    .input("SortDir", sql.VarChar(4), sortDir)
    .execute("VReport.GET_DASHBOARD_RECORDS");

  const recordsets = (res.recordsets || []) as any[][];
  const total = recordsets[0]?.[0]?.Total ?? 0;
  const rows = recordsets[1] ?? [];
  return { total, rows };
};

export interface ReportFilters {
  requestType: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
  refNo?: string;
  employeeSearch?: string;
  companyId?: string;
  storeId?: string;
  campId?: string;
  departmentId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Hardcoded fallback only used when the VReport.TBL_REPORT_MASTER table is
 * not populated yet. The master table is the source of truth, so a new report
 * + stored procedure can be registered from the front end (Report Master).
 */
export const REPORT_TYPE_FALLBACKS = [
  { value: "Attendance Request", label: "Attendance Requests" },
  { value: "Cash Advance Request", label: "Cash Advance Requests" },
  { value: "Arrears Request", label: "Arrears Requests" },
  { value: "Overtime Request", label: "Overtime Requests" },
];

export const DEFAULT_REPORT_PROCEDURE = "VRequest.GET_REQUEST_LIST_BY_TYPE";

/**
 * Report list for the dashboard dropdown, read from the Report Master table.
 * Value/label both use REPORT_NAME so the dashboard can pass the selection
 * straight back as `requestType`.
 */
export const getReportTypesService = async (): Promise<{ value: string; label: string }[]> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(10), "ACTIVE")
      .execute("VReport.SHOW_REPORT_MASTER");
    const rows = result.recordset || [];
    if (rows.length === 0) return REPORT_TYPE_FALLBACKS;
    return rows.map((r: any) => ({
      value: String(r.REPORT_NAME),
      label: String(r.REPORT_NAME),
    }));
  } catch (error) {
    console.error("SHOW_REPORT_MASTER SP error:", error);
    return REPORT_TYPE_FALLBACKS;
  }
};

/**
 * Read the stored-procedure name configured for this report in the Report
 * Master. Falls back to the default dashboard SP when the report has no
 * (active) master row so existing requests keep working.
 */
const getConfiguredProcedureName = async (reportName: string): Promise<string> => {
  const pool = getPool();
  if (!pool) return DEFAULT_REPORT_PROCEDURE;
  const res = await pool
    .request()
    .input("ReportName", sql.VarChar(150), reportName)
    .query(`
      SELECT TOP 1 PROCEDURE_NAME
      FROM VReport.TBL_REPORT_MASTER
      WHERE UPPER(LTRIM(RTRIM(REPORT_NAME))) = UPPER(LTRIM(RTRIM(@ReportName)))
        AND UPPER(ISNULL(STATUS_MASTER, '')) IN ('AC', 'ACTIVE')
    `);
  const proc = res.recordset?.[0]?.PROCEDURE_NAME;
  const name = proc ? String(proc).trim() : "";
  return name || DEFAULT_REPORT_PROCEDURE;
};

/**
 * Return the fully-qualified [schema].[name] of a stored procedure by looking
 * it up inside the database instead of assuming dbo. Accepts both a bare name
 * ("GET_OVERTIME_REQUEST" - searched across all schemas, preferring the V*
 * schemas) and a schema-qualified name ("VRequest.GET_OVERTIME_REQUEST").
 * Returns null when the procedure does not exist so callers can fail clearly.
 */
const resolveStoredProcedure = async (
  pool: sql.ConnectionPool,
  procedureName: string
): Promise<string | null> => {
  const trimmed = String(procedureName || "").trim();
  if (!trimmed) return null;

  let schema: string | null = null;
  let base = trimmed;
  const dot = trimmed.indexOf(".");
  if (dot > 0) {
    const maybeSchema = trimmed.slice(0, dot).replace(/[\[\]]/g, "").trim();
    base = trimmed.slice(dot + 1).replace(/[\[\]]/g, "").trim();
    if (maybeSchema) schema = maybeSchema;
  }

  const request = pool.request().input("Base", sql.VarChar(300), base);

  if (schema) {
    const result = await request.input("Schema", sql.VarChar(300), schema).query(`
        SELECT TOP 1 OBJECT_SCHEMA_NAME(o.object_id) AS s, o.name AS n
        FROM sys.objects o
        WHERE o.type = 'P'
          AND LOWER(LTRIM(RTRIM(o.name))) = LOWER(LTRIM(RTRIM(@Base)))
          AND LOWER(LTRIM(RTRIM(OBJECT_SCHEMA_NAME(o.object_id)))) = LOWER(LTRIM(RTRIM(@Schema)))
      `);
    const row = result.recordset?.[0];
    return row ? `[${row.s}].[${row.n}]` : null;
  }

  const result = await request.query(`
      SELECT TOP 1 OBJECT_SCHEMA_NAME(o.object_id) AS s, o.name AS n
      FROM sys.objects o
      WHERE o.type = 'P'
        AND LOWER(LTRIM(RTRIM(o.name))) = LOWER(LTRIM(RTRIM(@Base)))
      ORDER BY CASE
          WHEN OBJECT_SCHEMA_NAME(o.object_id) IN ('VRequest', 'VReport', 'VMaster') THEN 0
          ELSE 1
        END, o.object_id
    `);
  const row = result.recordset?.[0];
  return row ? `[${row.s}].[${row.n}]` : null;
};

const toNullableInt = (v: string | number | null | undefined): number | null => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toNullablePage = (v: number | null | undefined): number | null =>
  v == null || !Number.isFinite(v) || v < 1 ? null : Math.floor(v);

const mapReportRow = (r: any): any => ({ ...r, id: r.sno ?? r.SNO });

const orderedColumns = (resultSet: any[] | undefined): string[] => {
  if (!resultSet || !Array.isArray(resultSet)) return [];
  const meta = (resultSet as any).columns;
  if (meta && typeof meta === "object") return Object.keys(meta);
  const first = resultSet[0];
  return first ? Object.keys(first) : [];
};

interface ProcedureParameter {
  name: string; // without the leading @
  dataType: string;
  maxLength: number | null;
  mode: string; // IN | OUT | INOUT
}

/**
 * Declared parameters of a stored procedure, so the dashboard can call any
 * report SP with exactly the parameters it accepts instead of assuming the
 * standard 11-parameter contract.
 */
const getProcedureParameters = async (
  pool: sql.ConnectionPool,
  qualifiedName: string
): Promise<ProcedureParameter[]> => {
  const match = qualifiedName.match(/^\[([^\]]+)\]\.\[([^\]]+)\]$/);
  if (!match || !pool) return [];
  const [, schema, name] = match;
  const result = await pool
    .request()
    .input("Schema", sql.VarChar(300), schema)
    .input("Name", sql.VarChar(300), name)
    .query(`
      SELECT PARAMETER_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, PARAMETER_MODE
      FROM INFORMATION_SCHEMA.PARAMETERS
      WHERE SPECIFIC_SCHEMA = @Schema AND SPECIFIC_NAME = @Name
      ORDER BY ORDINAL_POSITION
    `);
  return (result.recordset || []).map((r: any) => ({
    name: String(r.PARAMETER_NAME).replace(/^@/, ""),
    dataType: String(r.DATA_TYPE).toLowerCase(),
    maxLength: r.CHARACTER_MAXIMUM_LENGTH == null ? null : Number(r.CHARACTER_MAXIMUM_LENGTH),
    mode: String(r.PARAMETER_MODE || "IN").toUpperCase(),
  }));
};

const mssqlTypeForParameter = (dataType: string, maxLength: number | null): any => {
  const len = maxLength != null && maxLength > 0 ? maxLength : sql.MAX;
  switch (dataType) {
    case "varchar": return sql.VarChar(len);
    case "nvarchar": return sql.NVarChar(len);
    case "char": return sql.Char(len);
    case "nchar": return sql.NChar(len);
    case "text": return sql.VarChar(sql.MAX);
    case "ntext": return sql.NVarChar(sql.MAX);
    case "int": return sql.Int;
    case "bigint": return sql.BigInt;
    case "smallint": return sql.SmallInt;
    case "tinyint": return sql.TinyInt;
    case "decimal":
    case "numeric": return sql.Decimal;
    case "money": return sql.Money;
    case "smallmoney": return sql.SmallMoney;
    case "float": return sql.Float;
    case "real": return sql.Real;
    case "bit": return sql.Bit;
    case "datetime": return sql.DateTime;
    case "datetime2": return sql.DateTime2;
    case "smalldatetime": return sql.SmallDateTime;
    case "date": return sql.Date;
    case "time": return sql.Time;
    case "uniqueidentifier": return sql.UniqueIdentifier;
    case "xml": return sql.Xml;
    default: return sql.NVarChar(sql.MAX);
  }
};

const defaultProcedureValue = (dataType: string): any => {
  switch (dataType) {
    case "int": case "bigint": case "smallint": case "tinyint":
    case "decimal": case "numeric": case "money": case "smallmoney":
    case "float": case "real": case "uniqueidentifier":
    case "datetime": case "datetime2": case "smalldatetime": case "date": case "time":
      return null;
    case "bit":
      return 0;
    default:
      return "";
  }
};

/**
 * Value for a declared SP parameter: the standard dashboard filters map onto
 * matching parameter names (case/underscore-insensitive); every other declared
 * parameter receives a safe default so the call never fails with
 * "expects parameter X" / "too many arguments".
 */
const valueForParameter = (param: ProcedureParameter, filters: ReportFilters): any => {
  const name = param.name.toUpperCase().replace(/[^A-Z0-9]/g, "");
  switch (name) {
    case "REQUESTTYPE": return filters.requestType;
    case "STATUS": return filters.status || "ALL";
    case "FROMDATE": return filters.fromDate || null;
    case "TODATE": return filters.toDate || null;
    case "COMPANYID": return toNullableInt(filters.companyId);
    case "STOREID": return toNullableInt(filters.storeId);
    case "CAMPID": return toNullableInt(filters.campId);
    case "DEPARTMENTID": return toNullableInt(filters.departmentId);
    case "SEARCH": return filters.search || null;
    case "PAGE": return toNullablePage(filters.page);
    case "PAGESIZE": return toNullablePage(filters.pageSize);
    default: return defaultProcedureValue(param.dataType);
  }
};

/**
 * Execute the stored procedure configured for the report (in the Report
 * Master) with adaptively-bound parameters. The procedure is resolved inside
 * the database first (any schema), and only its declared parameters are sent.
 */
const executeReportProcedure = async (filters: ReportFilters): Promise<any> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const configured = await getConfiguredProcedureName(filters.requestType);
  if (!configured) {
    throw new Error(`No stored procedure configured for report '${filters.requestType}'.`);
  }

  const qualified = await resolveStoredProcedure(pool, configured);
  if (!qualified) {
    throw new Error(`Stored procedure '${configured}' was not found in the database. Check the Report Master entry.`);
  }

  const parameters = await getProcedureParameters(pool, qualified);
  const request = pool.request();

  for (const param of parameters) {
    const type = mssqlTypeForParameter(param.dataType, param.maxLength);
    if (param.mode === "OUT" || param.mode === "INOUT") {
      request.output(param.name, type);
    } else {
      request.input(param.name, type, valueForParameter(param, filters));
    }
  }

  return request.execute(qualified);
};

/**
 * Existence check used by the Report Master save/update path: verify the
 * entered stored procedure really exists in the database before accepting it.
 */
export const validateReportStoredProcedure = async (
  procedureName: string
): Promise<{ ok: boolean; message: string }> => {
  const pool = getPool();
  if (!pool) return { ok: false, message: "Database not connected" };
  const name = String(procedureName || "").trim();
  if (!name) return { ok: false, message: "Stored Procedure name is required." };
  const qualified = await resolveStoredProcedure(pool, name);
  return qualified
    ? { ok: true, message: "" }
    : { ok: false, message: `Stored procedure '${name}' was not found in the database. Use a valid name such as VRequest.GET_REQUEST_LIST_BY_TYPE.` };
};

export interface ReportParameterInfo extends ProcedureParameter {
  filter: string;
  sample: string;
}

const parameterFilterMapping = (name: string): string => {
  switch (name.toUpperCase().replace(/[^A-Z0-9]/g, "")) {
    case "REQUESTTYPE": return "Selected Report Name";
    case "STATUS": return "Status dropdown";
    case "FROMDATE": return "From Date field";
    case "TODATE": return "To Date field";
    case "COMPANYID": return "Company dropdown";
    case "STOREID": return "Store dropdown";
    case "CAMPID": return "Camp dropdown";
    case "DEPARTMENTID": return "Department dropdown";
    case "SEARCH": return "Custom Search box";
    case "PAGE": return "Pagination (page number)";
    case "PAGESIZE": return "Pagination (rows per page)";
    case "REFNO": return "Ref No (export only)";
    case "EMPLOYEESEARCH": return "Employee name / ID search";
    default: return "Auto default (not bound to any dashboard field)";
  }
};

/**
 * Declared parameters of the stored procedure configured for a report. Used by
 * the Report Dashboard UI to show "the list of parameters to pass" as soon as
 * a report name is selected, plus which dashboard filter each one maps to.
 */
export const getReportParametersService = async (reportName: string): Promise<{
  reportName: string;
  procedureName: string;
  qualifiedName: string | null;
  procedureFound: boolean;
  parameters: ReportParameterInfo[];
}> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const configured = await getConfiguredProcedureName(reportName);
  const qualified = configured ? await resolveStoredProcedure(pool, configured) : null;
  const parameters = qualified ? await getProcedureParameters(pool, qualified) : [];

  return {
    reportName,
    procedureName: configured,
    qualifiedName: qualified,
    procedureFound: !!qualified,
    parameters: parameters.map((p) => ({
      ...p,
      filter: parameterFilterMapping(p.name),
      sample: String(valueForParameter(p, { requestType: reportName }) ?? ""),
    })),
  };
};

/**
 * Server-side paged report rows. All filter predicates are pushed into the SQL
 * SP configured for this report in the Report Master (defaults to
 * GET_REQUEST_LIST_BY_TYPE), so only one page is materialised rather than
 * loading the entire dataset into Node memory.
 */
export const getReportPageService = async (filters: ReportFilters): Promise<{ rows: any[]; total: number; columns: string[] }> => {
  const result = await executeReportProcedure(filters);

  const recordsets = (result.recordsets || []) as any[][];
  if (recordsets.length >= 2) {
    const rows = (recordsets[1] || []).map(mapReportRow);
    const total = Number(recordsets[0]?.[0]?.Total ?? 0);
    return { total, rows, columns: orderedColumns(recordsets[1]) };
  }
  const rows = (recordsets[0] || []).map(mapReportRow);
  return { total: rows.length, rows, columns: orderedColumns(recordsets[0]) };
};

export const getReportDataService = async (filters: ReportFilters): Promise<{ rows: any[]; columns: string[] }> => {
  const { requestType, fromDate, toDate, status, refNo, employeeSearch, companyId, storeId, campId, departmentId, search } = filters;

  const spResult = await executeReportProcedure(filters);

  const rows = (spResult.recordset || []).map(mapReportRow);
  const columns = orderedColumns(spResult.recordset);

  let result = rows;

  if (fromDate) {
    const from = new Date(fromDate + "T00:00:00");
    if (!isNaN(from.getTime())) {
      result = result.filter((r: any) => {
        const raw = r.createdDate || r.CREATED_DATE;
        const d = raw ? new Date(raw) : null;
        return d && !isNaN(d.getTime()) && d >= from;
      });
    }
  }

  if (toDate) {
    const to = new Date(toDate + "T23:59:59");
    if (!isNaN(to.getTime())) {
      result = result.filter((r: any) => {
        const raw = r.createdDate || r.CREATED_DATE;
        const d = raw ? new Date(raw) : null;
        return d && !isNaN(d.getTime()) && d <= to;
      });
    }
  }

  if (refNo && refNo.trim()) {
    const term = refNo.trim().toLowerCase();
    result = result.filter((r: any) => {
      const ref = String(r.refNo || r.poRefNo || r.requestRefNo || r.ATT_REQUEST_REF_NO || r.CASH_ADV_REQUEST_REF_NO || r.ARREAR_REQUEST_REF_NO || r.OT_REQUEST_REF_NO || "").toLowerCase();
      return ref.includes(term);
    });
  }

  if (employeeSearch && employeeSearch.trim()) {
    const term = employeeSearch.trim().toLowerCase();
    result = result.filter((r: any) => {
      const emp = String(r.requestedBy || r.FIRST_NAME || r.EMP_ID || r.empId || "").toLowerCase();
      return emp.includes(term);
    });
  }

  if (companyId && String(companyId) !== "ALL") {
    const target = String(companyId);
    result = result.filter((r: any) => String(r.companyId ?? r.COMPANY_ID ?? "") === target);
  }

  if (storeId && String(storeId) !== "ALL") {
    const target = String(storeId);
    result = result.filter((r: any) => String(r.storeId ?? r.poStoreId ?? r.STORE_ID ?? "") === target);
  }

  if (campId && String(campId) !== "ALL") {
    const target = String(campId);
    result = result.filter((r: any) => String(r.campId ?? r.CAMP_ID ?? "") === target);
  }

  if (departmentId && String(departmentId) !== "ALL") {
    const target = String(departmentId);
    result = result.filter((r: any) => String(r.departmentId ?? r.DEPARTMENT_ID ?? "") === target);
  }

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    result = result.filter((r: any) => {
      const haystack = [
        r.refNo,
        r.poRefNo,
        r.requestRefNo,
        r.ATT_REQUEST_REF_NO,
        r.CASH_ADV_REQUEST_REF_NO,
        r.ARREAR_REQUEST_REF_NO,
        r.OT_REQUEST_REF_NO,
        r.requestedBy,
        r.FIRST_NAME,
        r.empId,
        r.EMP_ID,
        r.companyName,
        r.storeName,
        r.campName,
        r.departmentName,
        r.department,
      ]
        .map((v) => String(v ?? ""))
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }

  return { rows: result, columns };
};

/**
 * Lightweight option lists for the Report Dashboard filter dropdowns plus the
 * data needed to cascade Store/Camp by the selected Company.
 *
 * companyCamps map: COMPANY_ID -> distinct CAMP_ID actually used by active
 * requests across the four request tables (data-driven, no mapping-table
 * dependency). Stores carry their CAMP_ID from TBL_STORE_MASTER so the UI can
 * narrow Store options by Company -> Camp -> Store.
 */
export const getReportFilterOptionsService = async (): Promise<{
  companies: { value: number; label: string }[];
  stores: { value: number; label: string; campId: number | null }[];
  camps: { value: number; label: string }[];
  departments: { value: number; label: string }[];
  companyCamps: { companyId: number; campId: number }[];
}> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const [companies, stores, camps, departments, companyCamps] = await Promise.all([
    pool.request().query(
      "SELECT COMPANY_ID AS value, COMPANY_NAME AS label FROM VMaster.TBL_COMPANY_MASTER ORDER BY COMPANY_NAME"
    ),
    pool.request().query(
      "SELECT STORE_ID AS value, STORE_NAME AS label, CAMP_ID AS campId FROM VMaster.TBL_STORE_MASTER ORDER BY STORE_NAME"
    ),
    pool.request().query(
      "SELECT CAMP_ID AS value, CAMP_NAME AS label FROM VMaster.TBL_CAMP_MASTER ORDER BY CAMP_NAME"
    ),
    pool.request().query(
      "SELECT DEPARTMENT_ID AS value, DEPARTMENT_NAME AS label FROM VMaster.TBL_DEPARTMENT_MASTER ORDER BY DEPARTMENT_NAME"
    ),
    pool.request().query(
      `SELECT COMPANY_ID AS companyId, CAMP_ID AS campId FROM (
        SELECT COMPANY_ID, CAMP_ID FROM [VRequest].[TBL_ATTENDANCE_REQUEST] WHERE STATUS_MASTER = 'AC' AND CAMP_ID IS NOT NULL
        UNION
        SELECT COMPANY_ID, CAMP_ID FROM [VRequest].[TBL_CASH_ADVANCE_REQUEST] WHERE STATUS_MASTER = 'AC' AND CAMP_ID IS NOT NULL
        UNION
        SELECT COMPANY_ID, CAMP_ID FROM [VRequest].[TBL_ARREARS_REQUEST] WHERE STATUS_MASTER = 'AC' AND CAMP_ID IS NOT NULL
        UNION
        SELECT COMPANY_ID, CAMP_ID FROM [VRequest].[TBL_OVERTIME_REQUEST] WHERE STATUS_MASTER = 'AC' AND CAMP_ID IS NOT NULL
      ) t`
    ),
  ]);

  return {
    companies: companies.recordset || [],
    stores: (stores.recordset || []).map((r: any) => ({
      value: Number(r.value),
      label: String(r.label ?? ""),
      campId: r.campId == null ? null : Number(r.campId),
    })),
    camps: camps.recordset || [],
    departments: departments.recordset || [],
    companyCamps: (companyCamps.recordset || []).map((r: any) => ({
      companyId: Number(r.companyId),
      campId: Number(r.campId),
    })),
  };
};

// ---------------------------------------------------------------------------
// Report Master CRUD (Report Name <-> Stored Procedure mapping)
// ---------------------------------------------------------------------------

export interface ReportMasterData {
  REPORT_ID?: number | null;
  REPORT_NAME?: string;
  PROCEDURE_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  CREATED_BY?: string;
}

export const getReportMasterService = async (
  status: string = "ALL"
): Promise<ReportMasterData[]> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  const result = await pool
    .request()
    .input("STATUS", sql.VarChar(10), status)
    .execute("VReport.SHOW_REPORT_MASTER");
  return (result.recordset || []) as ReportMasterData[];
};

export const getReportMasterByIdService = async (
  id: number
): Promise<ReportMasterData | null> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  const result = await pool
    .request()
    .input("REPORT_ID", sql.Int, id)
    .execute("VReport.GET_REPORT_MASTER");
  return (result.recordset || [])[0] || null;
};

export const saveReportMasterService = async (
  data: ReportMasterData,
  userInfo: { user: string | null; role: string | null; macAddress: string | null }
): Promise<string> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  const result = await pool
    .request()
    .input("REPORT_ID", sql.Int, data.REPORT_ID ?? 0)
    .input("REPORT_NAME", sql.VarChar(150), data.REPORT_NAME || "")
    .input("PROCEDURE_NAME", sql.VarChar(200), data.PROCEDURE_NAME || "")
    .input("REMARKS", sql.VarChar(500), data.REMARKS || "")
    .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "")
    .input("USER", sql.VarChar(50), userInfo.user || "")
    .input("MAC_ADDRESS", sql.VarChar(50), userInfo.macAddress || "")
    .execute("VReport.SAVE_REPORT_MASTER");
  const spResult = parseSprocResult(result.recordset?.[0]);
  return spResult.message || "Data saved successfully";
};

export const updateReportMasterService = async (
  id: number,
  data: ReportMasterData,
  userInfo: { user: string | null; role: string | null; macAddress: string | null }
): Promise<string> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  const result = await pool
    .request()
    .input("REPORT_ID", sql.Int, id)
    .input("REPORT_NAME", sql.VarChar(150), data.REPORT_NAME || "")
    .input("PROCEDURE_NAME", sql.VarChar(200), data.PROCEDURE_NAME || "")
    .input("REMARKS", sql.VarChar(500), data.REMARKS || "")
    .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "")
    .input("USER", sql.VarChar(50), userInfo.user || "")
    .input("MAC_ADDRESS", sql.VarChar(50), userInfo.macAddress || "")
    .execute("VReport.UPDATE_REPORT_MASTER");
  const spResult = parseSprocResult(result.recordset?.[0]);
  return spResult.message || "Data updated successfully";
};

export const deleteReportMasterService = async (
  id: number,
  userInfo: { user: string | null; role: string | null; macAddress: string | null }
): Promise<string> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  const result = await pool
    .request()
    .input("REPORT_ID", sql.Int, id)
    .input("USER", sql.VarChar(50), userInfo.user || "")
    .input("ROLE", sql.VarChar(50), userInfo.role || "")
    .input("MAC_ADDRESS", sql.VarChar(50), userInfo.macAddress || "")
    .execute("VReport.DELETE_REPORT_MASTER");
  const spResult = parseSprocResult(result.recordset?.[0]);
  return spResult.message || "Data deleted successfully";
};
