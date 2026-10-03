import "dotenv/config";
import { connectDB, getPool } from "../config/db";

/* Shared replacement: prefer the name the session captured at save time, fall back
   to the employee master for rows predating the column, then to the creating
   login. The old 'EMP <id>' string is only reached for rows with no name at all,
   which is no longer how a live request is saved. */
const OLD_GRID = `            ,CASE
                WHEN LTRIM(RTRIM(ISNULL(E.FIRST_NAME,'') + ' ' + ISNULL(E.MIDDLE_NAME,'') + ' ' + ISNULL(E.LAST_NAME,''))) = ''
                    THEN 'EMP ' + CAST(A.REQUESTED_BY_EMP_ID AS VARCHAR(20))
                ELSE LTRIM(RTRIM(REPLACE(ISNULL(E.FIRST_NAME,'') + ' ' + ISNULL(E.MIDDLE_NAME,'') + ' ' + ISNULL(E.LAST_NAME,''), '  ', ' ')))
             END                           AS requestedBy`;

const NEW_GRID = `            ,A.REQUESTED_BY_NAME           AS requestedByName
            ,CASE
                WHEN LTRIM(RTRIM(ISNULL(A.REQUESTED_BY_NAME,''))) <> ''
                    THEN LTRIM(RTRIM(A.REQUESTED_BY_NAME))
                WHEN LTRIM(RTRIM(ISNULL(E.FIRST_NAME,'') + ' ' + ISNULL(E.MIDDLE_NAME,'') + ' ' + ISNULL(E.LAST_NAME,''))) <> ''
                    THEN LTRIM(RTRIM(REPLACE(ISNULL(E.FIRST_NAME,'') + ' ' + ISNULL(E.MIDDLE_NAME,'') + ' ' + ISNULL(E.LAST_NAME,''), '  ', ' ')))
                /* Logins that are not employees ('sandy', 'sri') have no employee
                   row to join, so use the login that raised the request. */
                WHEN LTRIM(RTRIM(ISNULL(A.CREATED_BY,''))) <> ''
                    THEN LTRIM(RTRIM(A.CREATED_BY))
                WHEN A.REQUESTED_BY_EMP_ID IS NOT NULL
                    THEN 'EMP ' + CAST(A.REQUESTED_BY_EMP_ID AS VARCHAR(20))
                ELSE ''
             END                           AS requestedBy`;

const OLD_APPR = `            CASE
                WHEN LTRIM(RTRIM(ISNULL(E.FIRST_NAME,'') + ' ' + ISNULL(E.MIDDLE_NAME,'') + ' ' + ISNULL(E.LAST_NAME,''))) = ''
                    THEN 'EMP ' + ISNULL(CAST(A.REQUESTED_BY_EMP_ID AS VARCHAR(20)), 'NA')
                ELSE LTRIM(RTRIM(REPLACE(ISNULL(E.FIRST_NAME,'') + ' ' + ISNULL(E.MIDDLE_NAME,'') + ' ' + ISNULL(E.LAST_NAME,''), '  ', ' ')))
            END AS requestedBy,`;

const NEW_APPR = `            A.REQUESTED_BY_NAME AS requestedByName,
            CASE
                WHEN LTRIM(RTRIM(ISNULL(A.REQUESTED_BY_NAME,''))) <> ''
                    THEN LTRIM(RTRIM(A.REQUESTED_BY_NAME))
                WHEN LTRIM(RTRIM(ISNULL(E.FIRST_NAME,'') + ' ' + ISNULL(E.MIDDLE_NAME,'') + ' ' + ISNULL(E.LAST_NAME,''))) <> ''
                    THEN LTRIM(RTRIM(REPLACE(ISNULL(E.FIRST_NAME,'') + ' ' + ISNULL(E.MIDDLE_NAME,'') + ' ' + ISNULL(E.LAST_NAME,''), '  ', ' ')))
                WHEN LTRIM(RTRIM(ISNULL(A.CREATED_BY,''))) <> ''
                    THEN LTRIM(RTRIM(A.CREATED_BY))
                WHEN A.REQUESTED_BY_EMP_ID IS NOT NULL
                    THEN 'EMP ' + CAST(A.REQUESTED_BY_EMP_ID AS VARCHAR(20))
                ELSE ''
            END AS requestedBy,`;

/* Two read procedures have no .sql file in src/SPs - they exist only in the
   database - so there is nothing for deployProcs to redeploy and their text has
   to be corrected in place. exportPatchRequestedByReadSprocs is imported by
   deployProcs so every deploy re-asserts the fix instead of leaving it to
   whoever notices a blank requester first. */
export async function patchRequestedByReadSprocs() {
  await connectDB();
  const p: any = getPool();

  /* The stored definitions come back with CRLF line endings, so match with a
     whitespace-tolerant pattern rather than an exact multi-line literal. */
  const gridCase = new RegExp(
    ",\\s*CASE\\s+WHEN LTRIM\\(RTRIM\\(ISNULL\\(E\\.FIRST_NAME,''\\) \\+ ' ' \\+ ISNULL\\(E\\.MIDDLE_NAME,''\\) \\+ ' ' \\+ ISNULL\\(E\\.LAST_NAME,''\\)\\)\\) = ''\\s+THEN 'EMP ' \\+ CAST\\(A\\.REQUESTED_BY_EMP_ID AS VARCHAR\\(20\\)\\)\\s+ELSE LTRIM\\(RTRIM\\(REPLACE\\(ISNULL\\(E\\.FIRST_NAME,''\\) \\+ ' ' \\+ ISNULL\\(E\\.MIDDLE_NAME,''\\) \\+ ' ' \\+ ISNULL\\(E\\.LAST_NAME,''\\), '  ', ' '\\)\\)\\)\\s+END\\s+AS requestedBy",
    "i"
  );

  const apprCase = new RegExp(
    "CASE\\s+WHEN LTRIM\\(RTRIM\\(ISNULL\\(E\\.FIRST_NAME,''\\) \\+ ' ' \\+ ISNULL\\(E\\.MIDDLE_NAME,''\\) \\+ ' ' \\+ ISNULL\\(E\\.LAST_NAME,''\\)\\)\\) = ''\\s+THEN 'EMP ' \\+ ISNULL\\(CAST\\(A\\.REQUESTED_BY_EMP_ID AS VARCHAR\\(20\\)\\), 'NA'\\)\\s+ELSE LTRIM\\(RTRIM\\(REPLACE\\(ISNULL\\(E\\.FIRST_NAME,''\\) \\+ ' ' \\+ ISNULL\\(E\\.MIDDLE_NAME,''\\) \\+ ' ' \\+ ISNULL\\(E\\.LAST_NAME,''\\), '  ', ' '\\)\\)\\)\\s+END AS requestedBy,",
    "i"
  );

  for (const [name, pattern, replacement] of [
    ["GET_PURCHASE_REQUEST_HDR", gridCase, NEW_GRID],
    ["GET_APPROVAL_LIST_PURCHASE_REQUEST", apprCase, NEW_APPR],
  ] as const) {
    const r = await p.request().query(
      `SELECT OBJECT_DEFINITION(OBJECT_ID('VPurchase.${name}')) AS def`
    );
    let def = String(r.recordset[0].def);

    if (/requestedByName/i.test(def)) {
      console.log(name + ": already patched, skipping");
      continue;
    }
    if (!pattern.test(def)) {
      throw new Error(name + ": expected block not found - refusing to guess");
    }
    def = def.replace(pattern, () => replacement);
    /* The stored definitions use a plain CREATE, so make the redefinition legal. */
    def = def.replace(/CREATE(\s+)PROCEDURE/i, "CREATE OR ALTER$1PROCEDURE");
    await p.request().batch(def);
    console.log(name + ": patched and applied");
  }
}

/* Still runnable on its own: npx tsx src/scripts/patchRequestedByReadSprocs.ts */
if (require.main === module) {
  patchRequestedByReadSprocs()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}