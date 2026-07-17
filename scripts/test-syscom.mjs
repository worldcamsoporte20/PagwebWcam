import { readFileSync } from "node:fs";

function loadEnv(path = ".env") {
  const values = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    values[line.slice(0, index)] = line.slice(index + 1);
  }
  return values;
}

function mask(value) {
  if (!value) return "";
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(30_000),
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Keep raw text below for diagnostics.
  }
  return { response, text, json };
}

const env = loadEnv();
const clientId = env.SYSCOM_CLIENT_ID;
const clientSecret = env.SYSCOM_CLIENT_SECRET;
const apiBaseUrl = env.SYSCOM_API_BASE_URL || "https://developers.syscom.mx/api/v1";

console.log("Syscom API test");
console.log("================");
console.log(`SYSCOM_CLIENT_ID: ${mask(clientId)}`);
console.log(`SYSCOM_CLIENT_SECRET: ${clientSecret ? "[present]" : "[missing]"}`);
console.log(`SYSCOM_API_BASE_URL: ${apiBaseUrl}`);

if (!clientId || !clientSecret) {
  console.error("\nERROR: faltan SYSCOM_CLIENT_ID o SYSCOM_CLIENT_SECRET en .env");
  process.exit(1);
}

const body = new URLSearchParams({
  client_id: clientId,
  client_secret: clientSecret,
  grant_type: "client_credentials",
});

console.log("\n1. Probando OAuth...");
const oauth = await requestJson("https://developers.syscom.mx/oauth/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body,
});

console.log(`OAuth status: ${oauth.response.status}`);
if (!oauth.response.ok) {
  console.log(`Respuesta: ${oauth.text.slice(0, 500)}`);
  console.error("\nERROR: Syscom rechazó las credenciales. Si ves 401, revisa client_id/client_secret.");
  process.exit(1);
}

const accessToken = oauth.json?.access_token;
if (!accessToken) {
  console.log(`Respuesta: ${oauth.text.slice(0, 500)}`);
  console.error("\nERROR: OAuth respondió OK pero no regresó access_token.");
  process.exit(1);
}

console.log(`Token recibido: ${mask(accessToken)}`);
console.log(`Expira en: ${oauth.json?.expires_in ?? "N/D"} segundos`);

async function apiGet(path) {
  const url = `${apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  return requestJson(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
}

console.log("\n2. Probando categorías...");
const categories = await apiGet("categorias");
console.log(`Categorias status: ${categories.response.status}`);
if (categories.response.ok) {
  const count = Array.isArray(categories.json) ? categories.json.length : Object.keys(categories.json ?? {}).length;
  console.log(`Categorias recibidas: ${count}`);
} else {
  console.log(`Respuesta: ${categories.text.slice(0, 500)}`);
}

console.log("\n3. Probando búsqueda de productos...");
const products = await apiGet("productos?busqueda=camara");
console.log(`Productos status: ${products.response.status}`);
if (products.response.ok) {
  const rows = products.json?.productos ?? [];
  console.log(`Productos encontrados: ${rows.length}`);
  for (const product of rows.slice(0, 5)) {
    console.log(`- ${product.modelo ?? "N/D"} | ${product.marca ?? "N/D"} | stock ${product.total_existencia ?? "N/D"}`);
  }
} else {
  console.log(`Respuesta: ${products.text.slice(0, 500)}`);
}

console.log("\nPrueba terminada.");
