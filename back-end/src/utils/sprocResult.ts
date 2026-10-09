export interface SprocResult {
  status: string;
  message: string;
  data: any;
}

const ERROR_STATUS_RE = /error|fail|invalid|incorrect|not ?found|no rights|denied|cannot|unauth(or|ori)sed/i;
const ERROR_MESSAGE_RE = /already|duplicate|exist|not ?found|no rights|fail|error|invalid|denied|cannot/i;

const readCells = (row: any): any[] | null => {
  const empty = row?.[""];
  return Array.isArray(empty) && empty.length ? empty : null;
};

const pick = (row: any, names: string[]): any => {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null) return row[name];
  }
  return undefined;
};

export const readSprocResult = (row?: any): SprocResult => {
  if (!row) return { status: "", message: "", data: undefined as any };
  const cells = readCells(row);
  const get = (index: number, names: string[]): any => {
    const named = pick(row, names);
    if (named !== undefined) return named;
    if (row[String(index)] !== undefined && row[String(index)] !== null) return row[String(index)];
    if (row[index] !== undefined && row[index] !== null) return row[index];
    if (cells) return cells[index];
    /* Some procs return the value column without an alias (e.g. `SELECT '',
       'msg', @ref`); node-mssql then exposes a single anonymous value as a
       scalar under the empty key instead of an ordered cell array. */
    if (index === 2) {
      const anon = row[""];
      if (anon !== undefined && anon !== null && !Array.isArray(anon)) return anon;
    }
    return undefined;
  };
  return {
    status: String(get(0, ["STATUS", "STATUS_MASTER", "status", "status_master"]) ?? ""),
    message: String(get(1, ["MESSAGE", "MESSAGE_MASTER", "message", "message_master"]) ?? ""),
    data: get(2, ["DATA", "data"]),
  };
};

/* A proc can emit more than one result set when it internally EXECs another
   proc that SELECTs (e.g. SAVE_PURCHASE_GRN_HDR calls the ref-no generator,
   whose row lands first). node-mssql exposes only the first set via
   `result.recordset`, so callers must pick the STATUS/MESSAGE/DATA row. This
   prefers the last set that looks like a standard result row, falling back to
   the last (then first) set. */
export const pickResultRow = (result: any): any => {
  const sets: any[][] = Array.isArray(result?.recordsets)
    ? result.recordsets
    : result?.recordset
      ? [result.recordset]
      : [];
  if (!sets.length) return undefined;
  const looksLikeResult = (row: any): boolean =>
    !!row &&
    ("STATUS" in row ||
      "status" in row ||
      "MESSAGE" in row ||
      "message" in row ||
      "DATA" in row ||
      "data" in row);
  for (let i = sets.length - 1; i >= 0; i--) {
    const row = sets[i]?.[0];
    if (looksLikeResult(row)) return row;
  }
  return sets[sets.length - 1]?.[0];
};

export const isSprocError = (result: SprocResult): boolean => {
  const status = String(result.status ?? "").trim();
  // Convention in this codebase: the SP returns the literal 'error' as the first
  // anonymous cell (or a hint text in an empty status). Numeric statuses such as
  // "0"/"1" are not used as error markers by these stored procedures, so they are
  // not treated as failures.
  if (status) return ERROR_STATUS_RE.test(status);
  return ERROR_MESSAGE_RE.test(String(result.message ?? ""));
};

export const parseSprocResult = (row?: any, fallback = "Operation failed"): SprocResult => {
  const result = readSprocResult(row);
  if (isSprocError(result)) {
    const error = new Error(result.message || fallback) as Error & { httpStatus?: number };
    error.httpStatus = 400;
    throw error;
  }
  return result;
};