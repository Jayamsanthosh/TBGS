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

  // 2. Sync menus (additive; registers the new /attendance-type-master link for Admin role)
  const sync = await api("/sync-menus", {}, token);
  check("Sync menus succeeds", sync.status === 200 && sync.json.success, sync.json);
  const syncedLink = (sync.json.synced || []).find((s: any) => s.route === "/attendance-type-master");
  check("Attendance Type Master link synced", !!syncedLink, sync.json.synced);

  // 3. Initial list
  const list1 = await api("/attendance-type-master", {}, token);
  check("GET list succeeds", list1.status === 200 && Array.isArray(list1.json.data), list1.json);

  // 4. Create
  const typeName = `Present ${Date.now()}`;
  const create = await api("/attendance-type-master", {
    method: "POST",
    body: JSON.stringify({
      ATTENDANCE_TYPE_NAME: typeName,
      ELIGIBLE_DAYS: 1,
      REMARKS: "Regular Attendance",
      STATUS_MASTER: "AC",
      USER: "Admin",
      MAC_ADDRESS: "00-11-22-33-44-55",
    }),
  }, token);
  check("POST create succeeds", create.status === 200 && create.json.success && !!create.json.ATTENDANCE_TYPE_ID, create.json);
  const typeId = create.json.ATTENDANCE_TYPE_ID;
  if (!typeId) {
    console.log("Aborting: no ATTENDANCE_TYPE_ID returned");
    process.exit(1);
  }
  console.log(`      created ATTENDANCE_TYPE_ID: ${typeId}`);

  // 5. GET by id
  const getOne = await api(`/attendance-type-master/${typeId}`, {}, token);
  check("GET by id returns created record", getOne.status === 200 && getOne.json.data?.ATTENDANCE_TYPE_NAME === typeName, getOne.json);
  check("GET by id eligible days is 1", Number(getOne.json.data?.ELIGIBLE_DAYS) === 1, getOne.json.data);
  check("GET by id remarks", getOne.json.data?.REMARKS === "Regular Attendance", getOne.json.data);

  // 6. Update
  const update = await api(`/attendance-type-master/${typeId}`, {
    method: "PUT",
    body: JSON.stringify({
      ATTENDANCE_TYPE_ID: typeId,
      ATTENDANCE_TYPE_NAME: typeName,
      ELIGIBLE_DAYS: 2,
      REMARKS: "Updated Attendance Type",
      STATUS_MASTER: "AC",
      USER: "Admin",
      MAC_ADDRESS: "00-11-22-33-44-55",
    }),
  }, token);
  check("PUT update succeeds", update.status === 200 && update.json.success, update.json);

  // 7. Verify update via list (active)
  const list2 = await api("/attendance-type-master?status=AC", {}, token);
  const updated = (list2.json.data || []).find((r: any) => Number(r.ATTENDANCE_TYPE_ID) === Number(typeId));
  check("Updated record visible in list", !!updated && Number(updated.ELIGIBLE_DAYS) === 2, updated);
  check("Update persisted remarks", updated?.REMARKS === "Updated Attendance Type", updated);

  // 8. Inactive filter still returns success
  const list3 = await api("/attendance-type-master?status=IN", {}, token);
  check("GET inactive list succeeds", list3.status === 200 && Array.isArray(list3.json.data), list3.json);

  // 9. Delete
  const del = await api(`/attendance-type-master/${typeId}?USER=Admin&ROLE=Admin&MAC_ADDRESS=00-11-22-33-44-55`, { method: "DELETE" }, token);
  check("DELETE succeeds", del.status === 200 && del.json.success, del.json);

  // 10. Verify deletion
  const list4 = await api("/attendance-type-master", {}, token);
  const stillThere = (list4.json.data || []).find((r: any) => Number(r.ATTENDANCE_TYPE_ID) === Number(typeId));
  check("Deleted record no longer in list", !stillThere, list4.json);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});