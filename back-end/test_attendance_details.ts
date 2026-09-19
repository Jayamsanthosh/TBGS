const BASE = "http://localhost:5000/api/v1";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, extra?: any) {
  if (cond) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}`, extra !== undefined ? JSON.stringify(extra) : "");
  }
}

async function api(path: string, init: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (init.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  let json: any = {};
  try { json = await res.json(); } catch (_) {}
  return { status: res.status, json };
}

async function run() {
  // 1. Login
  const login = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ LOGIN_NAME: "sri", PASSWORD: "ana" }),
  });
  check("Login succeeds", login.status === 200 && !!login.json.accessToken, login.json);
  const token = login.json.accessToken;
  if (!token) {
    console.log("Aborting: no token");
    process.exit(1);
  }

  // 2. Sync menus (additive; registers /attendance-details for Admin role)
  const sync = await api("/sync-menus", {}, token);
  check("Sync menus succeeds", sync.status === 200 && sync.json.success, sync.json);
  const syncedLink = (sync.json.synced || []).find((s: any) => s.route === "/attendance-details");
  check("Attendance Details link synced", !!syncedLink, sync.json.synced);

  // 3. Initial list
  const list1 = await api("/attendance-details", {}, token);
  check("GET list succeeds", list1.status === 200 && Array.isArray(list1.json.data), list1.json);
  const initialCount = (list1.json.data || []).length;
  console.log(`      initial record count: ${initialCount}`);

  // 4. Create (SAVE_ATTENDANCE_DETAILS payload)
  const createPayload = {
    MONTH_ENTERED: "August",
    YEAR_ENTERED: 2026,
    ATT_REQUEST_REF_NO: "ATT0001",
    EMP_ID: 1001,
    FIRST_NAME: "Harish",
    MIDDLE_NAME: "",
    LAST_NAME: "Prabhu",
    COMPANY_ID: 1,
    DEPARTMENT_ID: 1,
    DESIGNATION_ID: 1,
    DEPARTMENT_GROUP_ID: 1,
    DESIGNATION_GROUP_ID: 1,
    CAMP_ID: 1,
    STORE_ID: 1,
    EMPLOYMENT_TYPE_ID: 1,
    ATTENDANCE_TYPE_ID: 1,
    ELIGIBLE_DAYS: 30.000,
    DATE_FROM: "2026-08-01",
    DATE_TO: "2026-08-03",
    NO_OF_DAYS: 3.000,
    BALANCE_LEAVE: 27.000,
    REASON: "Medical Leave",
    SECTION_HEAD_RESPONSE_PERSON_EMP_ID: 2001,
    SECTION_HEAD_RESPONSE_DATE: "2026-08-04",
    SECTION_HEAD_RESPONSE_STATUS: "Approved",
    SECTION_HEAD_RESPONSE_REMARKS: "Approved by Section Head",
    FINAL_RESPONSE_PERSON: "HR Manager",
    FINAL_RESPONSE_DATE: "2026-08-05",
    FINAL_RESPONSE_STATUS: "Approved",
    FINAL_RESPONSE_REMARKS: "Final Approval",
    REMARKS: "Leave Approved",
    STATUS_MASTER: "AC",
    USER: "Admin",
    MAC_ADDRESS: "00-11-22-33-44-55",
  };
  const create = await api("/attendance-details", { method: "POST", body: JSON.stringify(createPayload) }, token);
  check("POST create succeeds", create.status === 200 && create.json.success && !!create.json.SNO, create.json);
  const sno = create.json.SNO;
  if (!sno) {
    console.log("Aborting: no SNO returned");
    process.exit(1);
  }
  console.log(`      created SNO: ${sno}`);

  // 5. GET by id
  const getOne = await api(`/attendance-details/${sno}`, {}, token);
  check("GET by id returns created record", getOne.status === 200 && getOne.json.data?.ATT_REQUEST_REF_NO === "ATT0001", getOne.json);
  check("GET by id no of days is 3", Number(getOne.json.data?.NO_OF_DAYS) === 3, getOne.json.data);
  check("GET by id final response status", getOne.json.data?.FINAL_RESPONSE_STATUS === "Approved", getOne.json.data);
  check("GET by id final response person", getOne.json.data?.FINAL_RESPONSE_PERSON === "HR Manager", getOne.json.data);
  check("GET by id employee first name", getOne.json.data?.FIRST_NAME === "Harish", getOne.json.data);

  // 6. Update (UPDATE_ATTENDANCE_DETAILS payload)
  const update = await api(`/attendance-details/${sno}`, {
    method: "PUT",
    body: JSON.stringify({
      SNO: sno,
      MONTH_ENTERED: "August",
      YEAR_ENTERED: 2026,
      ATT_REQUEST_REF_NO: "ATT0001",
      EMP_ID: 1001,
      FIRST_NAME: "Harish",
      MIDDLE_NAME: "",
      LAST_NAME: "Prabhu",
      COMPANY_ID: 1,
      DEPARTMENT_ID: 1,
      DESIGNATION_ID: 1,
      DEPARTMENT_GROUP_ID: 1,
      DESIGNATION_GROUP_ID: 1,
      CAMP_ID: 1,
      STORE_ID: 1,
      EMPLOYMENT_TYPE_ID: 1,
      ATTENDANCE_TYPE_ID: 1,
      ELIGIBLE_DAYS: 30.000,
      DATE_FROM: "2026-08-01",
      DATE_TO: "2026-08-04",
      NO_OF_DAYS: 4.000,
      BALANCE_LEAVE: 26.000,
      REASON: "Medical Leave Extended",
      SECTION_HEAD_RESPONSE_PERSON_EMP_ID: 2001,
      SECTION_HEAD_RESPONSE_DATE: "2026-08-04",
      SECTION_HEAD_RESPONSE_STATUS: "Approved",
      SECTION_HEAD_RESPONSE_REMARKS: "Approved",
      FINAL_RESPONSE_PERSON: "HR Manager",
      FINAL_RESPONSE_DATE: "2026-08-05",
      FINAL_RESPONSE_STATUS: "Approved",
      FINAL_RESPONSE_REMARKS: "Final Approval",
      REMARKS: "Updated Leave",
      STATUS_MASTER: "AC",
      USER: "Admin",
      MAC_ADDRESS: "00-11-22-33-44-55",
    }),
  }, token);
  check("PUT update succeeds", update.status === 200 && update.json.success, update.json);

  // 7. Verify update via list (active)
  const list2 = await api("/attendance-details?status=AC", {}, token);
  const updated = (list2.json.data || []).find((r: any) => Number(r.SNO) === Number(sno));
  check("Updated record visible in list", !!updated && Number(updated.NO_OF_DAYS) === 4, updated);
  check("Update persisted reason", updated?.REASON === "Medical Leave Extended", updated);
  check("Update persisted final remarks via SHOW", updated?.FINAL_RESPONSE_REMARKS === "Final Approval", updated);

  // 8. Inactive filter returns success
  const list3 = await api("/attendance-details?status=IN", {}, token);
  check("GET inactive list succeeds", list3.status === 200 && Array.isArray(list3.json.data), list3.json);

  // 9. Delete
  const del = await api(`/attendance-details/${sno}?USER=Admin&ROLE=Admin&MAC_ADDRESS=00-11-22-33-44-55`, { method: "DELETE" }, token);
  check("DELETE succeeds", del.status === 200 && del.json.success, del.json);

  // 10. Verify deletion
  const list4 = await api("/attendance-details", {}, token);
  const stillThere = (list4.json.data || []).find((r: any) => Number(r.SNO) === Number(sno));
  check("Deleted record no longer in list", !stillThere, list4.json);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});