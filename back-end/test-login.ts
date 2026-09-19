async function run() {
  const loginRes = await fetch("http://localhost:5000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ LOGIN_NAME: "sri", PASSWORD: "ana" })
  });
  const loginData = await loginRes.json();
  console.log("Login data:", loginData);

  const token = loginData.accessToken;
  const meRes = await fetch("http://localhost:5000/api/v1/auth/me", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const meData = await meRes.json();
  console.log("Me data:", meData);
  
  const permRes = await fetch("http://localhost:5000/api/v1/auth/permissions", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const permData = await permRes.json();
  console.log("Permissions data:", permData);
}

run().catch(console.error);
