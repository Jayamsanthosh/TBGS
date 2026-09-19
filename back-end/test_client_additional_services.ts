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

  // 2. Sync menus (additive; registers the new Financial link for Admin role)
  const sync = await api("/sync-menus", {}, token);
  check("Sync menus succeeds", sync.status === 200 && sync.json.success, sync.json);

  // 3. Initial list
  const list1 = await api("/client-additional-services-master", {}, token);
  check("GET list succeeds", list1.status === 200 && Array.isArray(list1.json.data), list1.json);
  const initialCount = (list1.json.data || []).length;
  console.log(`      initial record count: ${initialCount}`);

  // 4. Create
  const serviceName = `Installation Charges ${Date.now()}`;
  const create = await api("/client-additional-services-master", {
    method: "POST",
    body: JSON.stringify({
      SERVICES_NAME: serviceName,
      UOM: "Nos",
      UNIT_PRICE: 500.00,
      CURRENCY_ID: 1,
      SECTION_HEAD_RESPONSE_PERSON_EMP_ID: 5,
      SECTION_HEAD_RESPONSE_DATE: "2026-08-05",
      SECTION_HEAD_RESPONSE_STATUS: "Pending",
      SECTION_HEAD_RESPONSE_REMARKS: "Awaiting Approval",
      REMARKS: "Standard Installation",
      STATUS_MASTER: "AC",
      USER: "sri",
      MAC_ADDRESS: "00-11-22-33-44-55",
    }),
  }, token);
  check("POST create succeeds", create.status === 200 && create.json.success && !!create.json.SERVICES_ID, create.json);
  const serviceId = create.json.SERVICES_ID;
  if (!serviceId) {
    console.log("Aborting: no SERVICES_ID returned");
    process.exit(1);
  }
  console.log(`      created SERVICES_ID: ${serviceId}`);

  // 5. GET by id
  const getOne = await api(`/client-additional-services-master/${serviceId}`, {}, token);
  check("GET by id returns created record", getOne.status === 200 && getOne.json.data?.SERVICES_NAME === serviceName, getOne.json);
  check("GET by id unit price is 500", Number(getOne.json.data?.UNIT_PRICE) === 500, getOne.json.data);
  check("GET by id section head person", Number(getOne.json.data?.SECTION_HEAD_RESPONSE_PERSON_EMP_ID) === 5, getOne.json.data);
  check("GET by id section head status", getOne.json.data?.SECTION_HEAD_RESPONSE_STATUS === "Pending", getOne.json.data);

  // 6. Update
  const update = await api(`/client-additional-services-master/${serviceId}`, {
    method: "PUT",
    body: JSON.stringify({
      SERVICES_ID: serviceId,
      SERVICES_NAME: serviceName,
      UOM: "Nos",
      UNIT_PRICE: 750.00,
      CURRENCY_ID: 1,
      SECTION_HEAD_RESPONSE_PERSON_EMP_ID: 5,
      SECTION_HEAD_RESPONSE_DATE: "2026-08-06",
      SECTION_HEAD_RESPONSE_STATUS: "Approved",
      SECTION_HEAD_RESPONSE_REMARKS: "Approved by Section Head",
      REMARKS: "Updated Installation Charges",
      STATUS_MASTER: "AC",
      USER: "sri",
      MAC_ADDRESS: "00-11-22-33-44-55",
    }),
  }, token);
  check("PUT update succeeds", update.status === 200 && update.json.success, update.json);

  // 7. Verify update via list (active)
  const list2 = await api("/client-additional-services-master?status=AC", {}, token);
  const updated = (list2.json.data || []).find((r: any) => Number(r.SERVICES_ID) === Number(serviceId));
  check("Updated record visible in list", !!updated && Number(updated.UNIT_PRICE) === 750, updated);
  check("Update persisted section head status", updated?.SECTION_HEAD_RESPONSE_STATUS === "Approved", updated);

  // 8. Inactive filter still returns record count
  const list3 = await api("/client-additional-services-master?status=IN", {}, token);
  check("GET inactive list succeeds", list3.status === 200 && Array.isArray(list3.json.data), list3.json);

  // 9. Delete
  const del = await api(`/client-additional-services-master/${serviceId}?USER=sri&ROLE=Admin&MAC_ADDRESS=00-11-22-33-44-55`, { method: "DELETE" }, token);
  check("DELETE succeeds", del.status === 200 && del.json.success, del.json);

  // 10. Verify deletion
  const list4 = await api("/client-additional-services-master", {}, token);
  const stillThere = (list4.json.data || []).find((r: any) => Number(r.SERVICES_ID) === Number(serviceId));
  check("Deleted record no longer in list", !stillThere, list4.json);
  console.log(`      final record count: ${(list4.json.data || []).length}`);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
