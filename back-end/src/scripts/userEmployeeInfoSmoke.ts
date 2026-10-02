import "dotenv/config";
import * as fs from "fs";
import { connectDB, getPool } from "../config/db";
import { getUserCompanyInfo, getUserEmployeeInfo } from "../services/auth.services";

const OUT = "C:/Users/solai/AppData/Local/Temp/opencode/emp_session.txt";

(async () => {
  await connectDB();
  const p: any = getPool();
  const o: string[] = [];
  let pass = 0;
  let fail = 0;
  const ok = (name: string, cond: boolean, extra = "") => {
    if (cond) { pass++; o.push("  PASS  " + name); }
    else { fail++; o.push("  FAIL  " + name + (extra ? "   [" + extra + "]" : "")); }
  };

  const users = await p.request().query(
    `SELECT LOGIN_ID, LOGIN_NAME, EMP_ID FROM VMaster.TBL_USER_INFO_HDR ORDER BY LOGIN_ID`
  );

  o.push("=== resolved employee identity per login ===");
  const resolved = new Map<any, any>();
  for (const u of users.recordset) {
    const info = await getUserEmployeeInfo(u.LOGIN_ID, u.LOGIN_NAME);
    resolved.set(u.LOGIN_ID, info);
    o.push(
      "  " +
        String(u.LOGIN_NAME).padEnd(8) +
        "mappedEmpId=" + String(u.EMP_ID ?? "null").padEnd(7) +
        "-> empId=" + String(info.EMP_ID ?? "null").padEnd(7) +
        "name='" + info.EMP_NAME + "'" +
        "  co=" + info.COMPANY_ID + " camp=" + info.CAMP_ID + " store=" + info.STORE_ID
    );

    // The contract: empId is only ever an id that really exists.
    if (info.EMP_ID != null) {
      const exists = await p.request().query(
        `SELECT COUNT(*) AS c FROM VPayEntries.NEW_EMPLOYEE_DATABASE WHERE EMP_ID = @i`,
        require("mssql").sql ? null : undefined
      ).catch(() => ({ recordset: [{ c: 0 }] }));
      void exists;
    }

    ok(`${u.LOGIN_NAME}: name is never empty`, (info.EMP_NAME || "").trim().length > 0, JSON.stringify(info.EMP_NAME));
  }

  // Hard guarantees, checked explicitly.
  const sri = await getUserEmployeeInfo(1, "sri");
  ok("sri: dangling EMP_ID 102 is NOT surfaced (would fail the FK)", sri.EMP_ID === null, "got " + sri.EMP_ID);
  ok("sri: name falls back to the login name", sri.EMP_NAME === "sri", sri.EMP_NAME);

  /* The "no employee behind the login" case is looked up in the data rather than
     pinned to a login name: master data gains employees over time, and a fixed
     name quietly stops testing anything once that login is mapped. The dangling
     sri case above is deliberately not reused, because it gets there by a
     different route (an EMP_ID that points at no row). */
  const orphan = users.recordset.find((u: any) => {
    if (u.EMP_ID == null) return true;
    return resolved.get(u.LOGIN_ID)?.EMP_ID == null && u.LOGIN_NAME !== "sri";
  });
  if (orphan) {
    const n = await getUserEmployeeInfo(orphan.LOGIN_ID, orphan.LOGIN_NAME);
    ok(`${orphan.LOGIN_NAME}: unmapped login gives null EMP_ID`, n.EMP_ID === null, "got " + n.EMP_ID);
    ok(`${orphan.LOGIN_NAME}: name falls back to the login name`,
       n.EMP_NAME === orphan.LOGIN_NAME, n.EMP_NAME);
  } else {
    o.push("  SKIP  every login now maps to an employee, so there is no orphan case left to check");
  }

  // Every non-null empId must satisfy the FK.
  for (const u of users.recordset) {
    const info = await getUserEmployeeInfo(u.LOGIN_ID, u.LOGIN_NAME);
    if (info.EMP_ID == null) continue;
    const r = await p.request().query(
      `SELECT 1 AS ok FROM VPayEntries.NEW_EMPLOYEE_DATABASE WHERE EMP_ID = ${Number(info.EMP_ID)}`
    );
    ok(`${u.LOGIN_NAME}: empId ${info.EMP_ID} exists in NEW_EMPLOYEE_DATABASE (FK safe)`, r.recordset.length === 1);
  }

  // Real employees get their real name and their company/camp/store defaults.
  const solaiId = users.recordset.find((u: any) => u.LOGIN_NAME === "solai")?.LOGIN_ID;
  const solai = await getUserEmployeeInfo(solaiId, "solai");
  ok("solai: real employee name resolved", solai.EMP_NAME === "Solai k Raja", solai.EMP_NAME);
  ok("solai: empId resolved", solai.EMP_ID === 1001, String(solai.EMP_ID));
  ok("solai: company/camp/store defaults present", solai.COMPANY_ID != null && solai.CAMP_ID != null && solai.STORE_ID != null,
     JSON.stringify([solai.COMPANY_ID, solai.CAMP_ID, solai.STORE_ID]));

  // Unknown login must not explode.
  const ghost = await getUserEmployeeInfo(999999, "ghostuser");
  ok("unknown login degrades gracefully", ghost.EMP_ID === null && ghost.EMP_NAME === "ghostuser",
     JSON.stringify(ghost));

  /* The branch must belong to the company that will actually be stamped. An
     employee's company can differ from the login's mapped company, so resolving the
     branch from the mapping alone would pair company 7 with company 6's branch. */
  for (const u of users.recordset) {
    const companies: any[] = await getUserCompanyInfo(u.LOGIN_ID, u.LOGIN_NAME);
    const mapped = companies[0];
    const info = await getUserEmployeeInfo(u.LOGIN_ID, u.LOGIN_NAME, mapped?.COMPANY_ID ?? null);
    const effectiveCompany = info.COMPANY_ID ?? mapped?.COMPANY_ID ?? null;

    if (effectiveCompany == null) {
      ok(`${u.LOGIN_NAME}: no company resolved`, info.BRANCH_ID === null, String(info.BRANCH_ID));
      continue;
    }
    if (info.BRANCH_ID == null) continue;

    const pair = await p.request().query(
      `SELECT COUNT(*) AS c FROM VMaster.TBL_COMPANY_BRANCH_MAPPING
       WHERE COMPANY_ID = ${Number(effectiveCompany)} AND BRANCH_ID = ${Number(info.BRANCH_ID)}`
    );
    ok(`${u.LOGIN_NAME}: branch ${info.BRANCH_ID} belongs to the stamped company ${effectiveCompany}`,
       pair.recordset[0].c > 0, "branch/company pairing not found in mapping");
  }

  o.push("");
  o.push(pass + " passed, " + fail + " failed");
  fs.writeFileSync(OUT, o.join("\r\n"), "utf8");
  process.exit(fail > 0 ? 1 : 0);
})();