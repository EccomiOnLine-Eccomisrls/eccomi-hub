import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

const clientDirectory = new URL("../dist/client/", import.meta.url);
const clientHtml = new URL("../dist/client/index.html", import.meta.url);
const sourceConfig = new URL("../.openai/hosting.json", import.meta.url);
const targetDirectory = new URL("../dist/.openai/", import.meta.url);
const targetConfig = new URL("../dist/.openai/hosting.json", import.meta.url);
const serverDirectory = new URL("../dist/server/", import.meta.url);
const serverEntry = new URL("../dist/server/index.js", import.meta.url);

let html = await readFile(clientHtml, "utf8");

const stylesheetPattern = /<link rel="stylesheet" crossorigin href="([^"]+)">/g;
const scriptPattern = /<script type="module" crossorigin src="([^"]+)"><\/script>/g;

for (const match of [...html.matchAll(stylesheetPattern)]) {
  const css = await readFile(new URL(`.${match[1]}`, clientDirectory), "utf8");
  html = html.replace(match[0], `<style>${css}</style>`);
}

for (const match of [...html.matchAll(scriptPattern)]) {
  const javascript = await readFile(new URL(`.${match[1]}`, clientDirectory), "utf8");
  html = html.replace(match[0], `<script type="module">${javascript}</script>`);
}

const worker = `
const html = ${JSON.stringify(html)};

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function supabaseConfig(env) {
  const url = env && env.SUPABASE_URL
    ? String(env.SUPABASE_URL).replace(/\\/+$/, "")
    : "";
  const key = env && env.SUPABASE_PUBLISHABLE_KEY
    ? String(env.SUPABASE_PUBLISHABLE_KEY)
    : "";

  return { url, key, ready: Boolean(url && key) };
}

function postaSupabaseConfig(env) {
  const url = env && env.POSTA_SUPABASE_URL
    ? String(env.POSTA_SUPABASE_URL).replace(/\\/+$/, "")
    : "";
  const key = env && env.POSTA_SUPABASE_SERVICE_KEY
    ? String(env.POSTA_SUPABASE_SERVICE_KEY)
    : "";

  return { url, key, ready: Boolean(url && key) };
}

function noleggioConfig(env) {
  const url = env && env.NOLEGGIO_API_URL
    ? String(env.NOLEGGIO_API_URL).replace(/\\/+$/, "")
    : "";
  const key = env && env.NOLEGGIO_HUB_READ_SECRET
    ? String(env.NOLEGGIO_HUB_READ_SECRET).trim()
    : "";

  return { url, key, ready: Boolean(url && key) };
}

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function postaEncryptionKey(env) {
  const raw = env && env.POSTA_CONFIG_ENCRYPTION_KEY
    ? String(env.POSTA_CONFIG_ENCRYPTION_KEY).trim()
    : "";
  if (!/^[0-9a-f]{64}$/i.test(raw)) return null;

  const bytes = Uint8Array.from(raw.match(/.{2}/g), (pair) => Number.parseInt(pair, 16));
  return crypto.subtle.importKey("raw", bytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function ensureHubIntegrationsTable(env) {
  if (!env || !env.DB) return false;
  await env.DB.prepare(\`CREATE TABLE IF NOT EXISTS hub_secure_integrations (
    name TEXT PRIMARY KEY,
    encrypted_value TEXT NOT NULL,
    iv TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT NOT NULL
  )\`).run();
  return true;
}

async function encryptPostaSecret(env, value) {
  const key = await postaEncryptionKey(env);
  if (!key) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(value);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return {
    encryptedValue: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
  };
}

async function decryptPostaSecret(env, encryptedValue, ivValue) {
  const key = await postaEncryptionKey(env);
  if (!key) return "";
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(ivValue) },
      key,
      base64ToBytes(encryptedValue),
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return "";
  }
}

async function readStoredPostaSecret(env) {
  if (!env || !env.DB) return "";
  try {
    await ensureHubIntegrationsTable(env);
    const row = await env.DB.prepare(
      "SELECT encrypted_value, iv FROM hub_secure_integrations WHERE name = ? LIMIT 1",
    ).bind("eccomi-posta-supabase").first();
    if (!row || !row.encrypted_value || !row.iv) return "";
    return await decryptPostaSecret(env, String(row.encrypted_value), String(row.iv));
  } catch {
    return "";
  }
}

async function storePostaSecret(env, value, userId) {
  if (!env || !env.DB) return false;
  const encrypted = await encryptPostaSecret(env, value);
  if (!encrypted) return false;

  try {
    await ensureHubIntegrationsTable(env);
    await env.DB.prepare(\`INSERT INTO hub_secure_integrations
      (name, encrypted_value, iv, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        encrypted_value = excluded.encrypted_value,
        iv = excluded.iv,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by\`)
      .bind(
        "eccomi-posta-supabase",
        encrypted.encryptedValue,
        encrypted.iv,
        new Date().toISOString(),
        userId,
      )
      .run();
    return true;
  } catch {
    return false;
  }
}

async function resolvePostaSupabaseConfig(env) {
  const configured = postaSupabaseConfig(env);
  if (configured.ready || !configured.url) return configured;
  const storedKey = await readStoredPostaSecret(env);
  return {
    url: configured.url,
    key: storedKey,
    ready: Boolean(configured.url && storedKey),
  };
}

function supabaseHeaders(key, accessToken) {
  const headers = {
    "apikey": key,
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers.Authorization = "Bearer " + accessToken;
  }

  return headers;
}

async function requestJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function bearerToken(request) {
  const authorization = request.headers.get("Authorization") || "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
}

async function getHubProfile(config, accessToken, userId) {
  const profileUrl = new URL(config.url + "/rest/v1/hub_profiles");
  if (userId) {
    profileUrl.searchParams.set("user_id", "eq." + userId);
  }
  profileUrl.searchParams.set("select", "user_id,email,full_name,role,active,ecosystem_keys");
  profileUrl.searchParams.set("limit", "1");

  let response;
  try {
    response = await fetch(profileUrl, {
      headers: supabaseHeaders(config.key, accessToken),
    });
  } catch {
    return { ok: false, status: 502, profile: null };
  }

  if (!response.ok) {
    return { ok: false, status: response.status, profile: null };
  }

  const profiles = await response.json().catch(() => []);
  return {
    ok: true,
    status: 200,
    profile: Array.isArray(profiles) ? profiles[0] || null : null,
  };
}

async function hubDataFailure(response) {
  const payload = await response.json().catch(() => null);
  const code = payload && payload.code;

  if (response.status === 401) {
    return json({ detail: "La sessione è scaduta. Esci e richiedi un nuovo codice." }, 401);
  }

  if (response.status === 404 || code === "PGRST205") {
    return json({ detail: "L’archivio New Entry deve ancora essere attivato in Supabase." }, 503);
  }

  if (response.status === 403) {
    return json({ detail: "Il tuo ruolo non consente questa operazione." }, 403);
  }

  return json({ detail: "Non è stato possibile aggiornare l’archivio ECCOMI HUB." }, 502);
}

async function requestSupabaseCode(request, config) {
  const body = await requestJson(request);
  const email = body && typeof body.email === "string"
    ? body.email.trim().toLowerCase()
    : "";

  if (!email || !email.includes("@")) {
    return json({ detail: "Inserisci un indirizzo email valido." }, 400);
  }

  let response;
  try {
    response = await fetch(config.url + "/auth/v1/otp", {
      method: "POST",
      headers: supabaseHeaders(config.key),
      body: JSON.stringify({ email, create_user: true }),
    });
  } catch {
    return json({ detail: "Il servizio di accesso non è momentaneamente raggiungibile." }, 502);
  }

  if (response.status === 429) {
    return json({ detail: "Hai richiesto troppi codici. Attendi un minuto e riprova." }, 429);
  }

  if (response.status >= 500) {
    return json({ detail: "Il servizio di accesso non è momentaneamente raggiungibile." }, 502);
  }

  if (!response.ok) {
    return json({ detail: "Il codice non è stato inviato. Verifica l’indirizzo e riprova tra poco." }, 400);
  }

  return json({ accepted: true }, 202);
}

async function verifySupabaseCode(request, config) {
  const body = await requestJson(request);
  const email = body && typeof body.email === "string"
    ? body.email.trim().toLowerCase()
    : "";
  const code = body && typeof body.code === "string" ? body.code.trim() : "";

  if (!email || !email.includes("@") || !/^[0-9]{6}$/.test(code)) {
    return json({ detail: "Inserisci l’email e il codice di 6 cifre." }, 400);
  }

  let response;
  try {
    response = await fetch(config.url + "/auth/v1/verify", {
      method: "POST",
      headers: supabaseHeaders(config.key),
      body: JSON.stringify({ type: "email", email, token: code }),
    });
  } catch {
    return json({ detail: "Il servizio di accesso non è momentaneamente raggiungibile." }, 502);
  }

  if (!response.ok) {
    return json({ detail: "Il codice non è valido oppure è scaduto." }, 401);
  }

  const session = await response.json().catch(() => null);
  const accessToken = session && session.access_token;
  const refreshToken = session && session.refresh_token;
  const user = session && session.user;

  if (!accessToken || !refreshToken || !user || !user.id) {
    return json({ detail: "La sessione non è stata creata correttamente." }, 502);
  }

  const profileResult = await getHubProfile(config, accessToken, user.id);
  if (!profileResult.ok) {
    return json({ detail: "Non è stato possibile verificare il ruolo ECCOMI HUB." }, 502);
  }
  const profile = profileResult.profile;
  const allowedRoles = ["ceo", "manager", "operator"];

  if (!profile || !profile.active || !allowedRoles.includes(profile.role)) {
    return json({ detail: "L’utente non è ancora abilitato a ECCOMI HUB." }, 403);
  }

  return json({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: Number(session.expires_in || 3600),
    expires_at: Number(session.expires_at || Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600)),
    user: {
      id: String(user.id),
      email: profile.email || user.email || email,
      full_name: profile.full_name || email.split("@")[0],
      role: profile.role,
    },
  });
}

async function refreshSupabaseSession(request, config) {
  const body = await requestJson(request);
  const refreshToken = body && typeof body.refresh_token === "string"
    ? body.refresh_token.trim().slice(0, 8192)
    : "";

  if (!refreshToken) {
    return json({ detail: "La sessione non può essere rinnovata." }, 400);
  }

  const refreshUrl = new URL(config.url + "/auth/v1/token");
  refreshUrl.searchParams.set("grant_type", "refresh_token");

  let response;
  try {
    response = await fetch(refreshUrl, {
      method: "POST",
      headers: supabaseHeaders(config.key),
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    return json({ detail: "Il servizio di accesso non è momentaneamente raggiungibile." }, 502);
  }

  if (!response.ok) {
    return json({ detail: "La sessione è scaduta. Richiedi un nuovo codice." }, 401);
  }

  const session = await response.json().catch(() => null);
  const accessToken = session && session.access_token;
  const nextRefreshToken = session && session.refresh_token;
  const user = session && session.user;

  if (!accessToken || !nextRefreshToken || !user || !user.id) {
    return json({ detail: "La sessione non è stata rinnovata correttamente." }, 502);
  }

  const profileResult = await getHubProfile(config, accessToken, user.id);
  if (!profileResult.ok) {
    return json({ detail: "Non è stato possibile verificare il ruolo ECCOMI HUB." }, 502);
  }

  const profile = profileResult.profile;
  const allowedRoles = ["ceo", "manager", "operator"];
  if (!profile || !profile.active || !allowedRoles.includes(profile.role)) {
    return json({ detail: "L’utente non è più abilitato a ECCOMI HUB." }, 403);
  }

  const expiresIn = Number(session.expires_in || 3600);
  return json({
    access_token: accessToken,
    refresh_token: nextRefreshToken,
    expires_in: expiresIn,
    expires_at: Number(session.expires_at || Math.floor(Date.now() / 1000) + expiresIn),
    user: {
      id: String(user.id),
      email: profile.email || user.email || "",
      full_name: profile.full_name || (user.email ? user.email.split("@")[0] : "Utente ECCOMI"),
      role: profile.role,
    },
  });
}

const hubEntrySelect = [
  "id",
  "entry_type",
  "name",
  "customer_need",
  "objective",
  "dna_link",
  "revenue_model",
  "expected_costs",
  "responsible",
  "time_horizon_days",
  "risks",
  "status",
  "created_by",
  "created_at",
  "updated_at",
].join(",");

const hubEvaluationSelect = [
  "entry_id",
  "need_score",
  "dna_score",
  "revenue_score",
  "feasibility_score",
  "risk_control_score",
  "total_score",
  "traffic_light",
  "strengths",
  "criticalities",
  "conditions",
  "analysis_source",
  "analysis_model",
  "decision_state",
  "decision_note",
  "evaluated_at",
  "updated_at",
].join(",");

const hubProjectPlanSelect = [
  "entry_id",
  "objective",
  "owner",
  "start_date",
  "target_date",
  "budget",
  "tasks",
  "kpis",
  "conditions",
  "plan_state",
  "planned_by",
  "created_at",
  "updated_at",
].join(",");

async function listSupabaseEntries(request, config) {
  const accessToken = bearerToken(request);
  if (!accessToken) {
    return json({ detail: "Accedi a ECCOMI HUB per visualizzare l’archivio." }, 401);
  }

  const entriesUrl = new URL(config.url + "/rest/v1/hub_entries");
  entriesUrl.searchParams.set("select", hubEntrySelect);
  entriesUrl.searchParams.set("order", "created_at.desc");

  let response;
  try {
    response = await fetch(entriesUrl, {
      headers: supabaseHeaders(config.key, accessToken),
    });
  } catch {
    return json({ detail: "L’archivio ECCOMI HUB non è momentaneamente raggiungibile." }, 502);
  }

  if (!response.ok) {
    return hubDataFailure(response);
  }

  const entries = await response.json().catch(() => []);
  return json({ entries: Array.isArray(entries) ? entries : [] });
}

function cleanEntryInput(body) {
  const text = (key, max = 5000) => body && typeof body[key] === "string"
    ? body[key].trim().slice(0, max)
    : "";
  const entryType = text("entryType", 30);
  const expectedCosts = Number(body && body.expectedCosts);
  const timeHorizonDays = Number(body && body.timeHorizonDays);
  const input = {
    entry_type: entryType,
    name: text("name", 160),
    customer_need: text("customerNeed"),
    objective: text("objective"),
    dna_link: text("dnaLink"),
    revenue_model: text("revenueModel"),
    expected_costs: expectedCosts,
    responsible: text("responsible", 160),
    time_horizon_days: timeHorizonDays,
    risks: text("risks"),
  };
  const allowedTypes = ["ecosistema", "servizio", "progetto", "idea"];
  const requiredText = [
    input.name,
    input.customer_need,
    input.objective,
    input.dna_link,
    input.revenue_model,
    input.responsible,
    input.risks,
  ];
  const valid = allowedTypes.includes(input.entry_type)
    && requiredText.every(Boolean)
    && Number.isFinite(expectedCosts)
    && expectedCosts >= 0
    && Number.isInteger(timeHorizonDays)
    && timeHorizonDays > 0
    && timeHorizonDays <= 3650;

  return valid ? input : null;
}

async function createSupabaseEntry(request, config) {
  const accessToken = bearerToken(request);
  if (!accessToken) {
    return json({ detail: "Accedi a ECCOMI HUB per creare una new entry." }, 401);
  }

  const body = await requestJson(request);
  const input = cleanEntryInput(body);
  if (!input) {
    return json({ detail: "Completa tutti i dati richiesti prima di continuare." }, 400);
  }

  const profileResult = await getHubProfile(config, accessToken);
  if (!profileResult.ok) {
    if (profileResult.status === 401) {
      return json({ detail: "La sessione è scaduta. Esci e richiedi un nuovo codice." }, 401);
    }
    return json({ detail: "Non è stato possibile verificare il ruolo ECCOMI HUB." }, 502);
  }

  const profile = profileResult.profile;
  if (!profile || !profile.active || profile.role !== "ceo") {
    return json({ detail: "Solo il CEO può creare una new entry." }, 403);
  }

  const headers = supabaseHeaders(config.key, accessToken);
  headers.Prefer = "return=representation";

  let response;
  try {
    response = await fetch(config.url + "/rest/v1/hub_entries?select=" + encodeURIComponent(hubEntrySelect), {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...input,
        status: "Da valutare",
        created_by: profile.user_id,
      }),
    });
  } catch {
    return json({ detail: "L’archivio ECCOMI HUB non è momentaneamente raggiungibile." }, 502);
  }

  if (!response.ok) {
    return hubDataFailure(response);
  }

  const entries = await response.json().catch(() => []);
  const entry = Array.isArray(entries) ? entries[0] : null;
  if (!entry) {
    return json({ detail: "La new entry è stata registrata, ma non è stato possibile rileggerla." }, 502);
  }

  return json({ entry }, 201);
}

function entryIdFromAdvancePath(pathname) {
  const match = pathname.match(/^\\/api\\/v1\\/entries\\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\\/advance$/i);
  return match ? match[1] : null;
}

async function advanceSupabaseEntry(request, config, entryId) {
  if (request.method !== "POST") {
    return json({ detail: "Metodo non consentito." }, 405);
  }

  const accessToken = bearerToken(request);
  if (!accessToken) {
    return json({ detail: "Accedi a ECCOMI HUB per avviare la valutazione." }, 401);
  }

  const profileResult = await getHubProfile(config, accessToken);
  if (!profileResult.ok) {
    if (profileResult.status === 401) {
      return json({ detail: "La sessione è scaduta. Esci e richiedi un nuovo codice." }, 401);
    }
    return json({ detail: "Non è stato possibile verificare il ruolo ECCOMI HUB." }, 502);
  }

  const profile = profileResult.profile;
  if (!profile || !profile.active || profile.role !== "ceo") {
    return json({ detail: "Solo il CEO può avviare la valutazione di una new entry." }, 403);
  }

  const entryUrl = new URL(config.url + "/rest/v1/hub_entries");
  entryUrl.searchParams.set("id", "eq." + entryId);
  entryUrl.searchParams.set("status", "eq.Da valutare");
  entryUrl.searchParams.set("select", hubEntrySelect);

  const headers = supabaseHeaders(config.key, accessToken);
  headers.Prefer = "return=representation";

  let response;
  try {
    response = await fetch(entryUrl, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "Valutazione" }),
    });
  } catch {
    return json({ detail: "L’archivio ECCOMI HUB non è momentaneamente raggiungibile." }, 502);
  }

  if (!response.ok) {
    return hubDataFailure(response);
  }

  const entries = await response.json().catch(() => []);
  const entry = Array.isArray(entries) ? entries[0] : null;
  if (!entry) {
    return json({ detail: "L’iniziativa non è più nello stato “Da valutare”. Aggiorna la pagina e riprova." }, 409);
  }

  return json({ entry });
}

function evaluationEntryIdFromPath(pathname) {
  const match = pathname.match(/^\\/api\\/v1\\/entries\\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\\/evaluation$/i);
  return match ? match[1] : null;
}

function planningEntryIdFromPath(pathname) {
  const match = pathname.match(/^\\/api\\/v1\\/entries\\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\\/planning$/i);
  return match ? match[1] : null;
}

async function evaluationDataFailure(response) {
  const payload = await response.json().catch(() => null);
  const code = payload && payload.code;

  if (response.status === 401) {
    return json({ detail: "La sessione è scaduta. Esci e richiedi un nuovo codice." }, 401);
  }
  if (response.status === 404 || code === "PGRST205") {
    return json({ detail: "L’archivio della valutazione deve ancora essere attivato in Supabase." }, 503);
  }
  if (response.status === 403 || code === "42501") {
    return json({ detail: "Solo il CEO può gestire la valutazione." }, 403);
  }
  if (response.status === 400 && code === "P0001") {
    return json({ detail: payload && payload.message ? payload.message : "La decisione non è compatibile con lo stato attuale." }, 409);
  }

  return json({ detail: "Non è stato possibile aggiornare la valutazione ECCOMI HUB." }, 502);
}

async function planningDataFailure(response) {
  const payload = await response.json().catch(() => null);
  const code = payload && payload.code;

  if (response.status === 401) {
    return json({ detail: "La sessione è scaduta. Esci e richiedi un nuovo codice." }, 401);
  }
  if (response.status === 404 || code === "PGRST202" || code === "PGRST205") {
    return json({ detail: "L’archivio della progettazione deve ancora essere attivato in Supabase." }, 503);
  }
  if (response.status === 403 || code === "42501") {
    return json({ detail: "Solo il CEO può gestire la progettazione." }, 403);
  }
  if (response.status === 400 && code === "P0001") {
    return json({ detail: payload && payload.message ? payload.message : "Il piano non è compatibile con lo stato attuale." }, 409);
  }

  return json({ detail: "Non è stato possibile aggiornare la progettazione ECCOMI HUB." }, 502);
}

function wordCount(value) {
  return String(value || "").trim().split(/\\s+/).filter(Boolean).length;
}

function includesAny(value, terms) {
  const normalized = String(value || "").toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function clampScore(value) {
  return Math.max(1, Math.min(5, Math.round(value)));
}

function scoreHubEntry(entry) {
  const foundation = [entry.customer_need, entry.objective].join(" ");
  const needScore = clampScore(
    2
    + (wordCount(foundation) >= 22 ? 1 : 0)
    + (wordCount(foundation) >= 35 ? 1 : 0)
    + (includesAny(foundation, ["cliente", "utente", "accesso", "servizio", "unico", "automaticamente"]) ? 1 : 0),
  );

  const dnaScore = clampScore(
    2
    + (wordCount(entry.dna_link) >= 8 ? 1 : 0)
    + (includesAny(entry.dna_link, ["semplice", "fiducia", "conness", "controll", "riconosc", "ecosistema"]) ? 1 : 0)
    + (wordCount(entry.dna_link) >= 14 ? 1 : 0),
  );

  let revenueScore = 2;
  if (wordCount(entry.revenue_model) >= 12) revenueScore += 1;
  if (includesAny(entry.revenue_model, ["canone", "commissione", "margine", "vendita", "ricavo diretto", "fee"])) revenueScore += 1;
  if (includesAny(entry.revenue_model, ["misur", "kpi", "mese", "percent", "euro", "€"])) revenueScore += 1;
  revenueScore = clampScore(revenueScore);

  let feasibilityScore = 2;
  if (Number(entry.time_horizon_days) <= 90) feasibilityScore += 1;
  if (Number(entry.time_horizon_days) <= 30) feasibilityScore += 1;
  if (Number(entry.expected_costs) <= 1000) feasibilityScore += 1;
  if (!entry.responsible) feasibilityScore -= 1;
  feasibilityScore = clampScore(feasibilityScore);

  let riskControlScore = 2;
  if (wordCount(entry.risks) >= 8) riskControlScore += 1;
  if (includesAny(entry.risks, ["controll", "test", "verifica", "backup", "monitor", "piano", "procedura"])) riskControlScore += 1;
  if (includesAny(entry.risks, ["blocc", "critico", "dipendenza", "sicurezza", "accessi"])) riskControlScore -= 1;
  riskControlScore = clampScore(riskControlScore);

  const totalScore = Math.round(
    (needScore / 5) * 25
    + (dnaScore / 5) * 20
    + (revenueScore / 5) * 20
    + (feasibilityScore / 5) * 20
    + (riskControlScore / 5) * 15,
  );
  const trafficLight = totalScore >= 75 ? "Verde" : totalScore >= 55 ? "Giallo" : "Rosso";

  return {
    needScore,
    dnaScore,
    revenueScore,
    feasibilityScore,
    riskControlScore,
    totalScore,
    trafficLight,
  };
}

function ruleBasedEvaluationAnalysis(entry, scores) {
  const strengths = [
    scores.needScore >= 4
      ? "Il bisogno del cliente e l’obiettivo sono descritti con chiarezza."
      : "L’iniziativa parte da un bisogno cliente riconoscibile.",
    scores.dnaScore >= 4
      ? "Il collegamento con ECCOMI DNA è concreto e coerente."
      : "Il collegamento con ECCOMI DNA è presente e può essere reso più misurabile.",
    scores.feasibilityScore >= 4
      ? "Tempi e costi dichiarati rendono credibile una prima sperimentazione controllata."
      : "La fattibilità può essere verificata con un perimetro pilota ridotto.",
  ];

  const criticalities = [
    scores.revenueScore < 4
      ? "Il ritorno economico è soprattutto indiretto e non ha ancora un KPI numerico."
      : "Il modello di ricavo va confermato con dati osservabili durante il test.",
    entry.responsible && entry.responsible.toLowerCase().includes("ceo")
      ? "Il controllo diretto del CEO è utile in avvio, ma non sostituisce un responsabile operativo."
      : "Responsabilità, poteri e tempi di risposta devono essere formalizzati.",
    "I rischi indicati richiedono controlli preventivi prima del rilascio agli utenti.",
  ];

  const conditions = [
    "Definire un KPI di successo, una soglia minima e una data di verifica.",
    "Assegnare il responsabile operativo e approvare la matrice dei ruoli e degli accessi.",
    "Eseguire un test pilota con casi reali, controllo errori e procedura di ritorno sicuro.",
  ];

  return {
    strengths,
    criticalities,
    conditions,
    analysisSource: "hub_rules",
    analysisModel: null,
  };
}

function openAIOutputText(payload) {
  if (!payload || !Array.isArray(payload.output)) return "";
  for (const output of payload.output) {
    if (!output || output.type !== "message" || !Array.isArray(output.content)) continue;
    const content = output.content.find((item) => item && item.type === "output_text" && typeof item.text === "string");
    if (content) return content.text;
  }
  return "";
}

function normalizeAnalysisItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => item.trim().slice(0, 360))
    .slice(0, 3);
}

async function generateOpenAIAnalysis(entry, scores, env, fallback) {
  const apiKey = env && env.OPENAI_API_KEY ? String(env.OPENAI_API_KEY) : "";
  if (!apiKey) return fallback;

  const model = env && env.OPENAI_MODEL ? String(env.OPENAI_MODEL) : "gpt-5.6";
  const schema = {
    type: "object",
    properties: {
      strengths: { type: "array", items: { type: "string" } },
      criticalities: { type: "array", items: { type: "string" } },
      conditions: { type: "array", items: { type: "string" } },
    },
    required: ["strengths", "criticalities", "conditions"],
    additionalProperties: false,
  };

  let response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        instructions: "Agisci come analista strategico di ECCOMI HUB. Analizza solo i dati forniti, non inventare numeri e non prendere la decisione al posto del CEO. Scrivi in italiano professionale e operativo. Restituisci esattamente tre punti di forza, tre criticità e tre condizioni necessarie prima dell’approvazione.",
        input: JSON.stringify({
          initiative: {
            type: entry.entry_type,
            name: entry.name,
            customer_need: entry.customer_need,
            objective: entry.objective,
            dna_link: entry.dna_link,
            revenue_model: entry.revenue_model,
            expected_costs: Number(entry.expected_costs),
            responsible: entry.responsible,
            time_horizon_days: Number(entry.time_horizon_days),
            risks: entry.risks,
          },
          auditable_scores: scores,
        }),
        text: {
          format: {
            type: "json_schema",
            name: "eccomi_hub_evaluation",
            schema,
            strict: true,
          },
        },
        max_output_tokens: 800,
      }),
    });
  } catch {
    return fallback;
  }

  if (!response.ok) return fallback;
  const payload = await response.json().catch(() => null);
  const outputText = openAIOutputText(payload);
  if (!outputText) return fallback;

  let analysis;
  try {
    analysis = JSON.parse(outputText);
  } catch {
    return fallback;
  }

  const strengths = normalizeAnalysisItems(analysis.strengths);
  const criticalities = normalizeAnalysisItems(analysis.criticalities);
  const conditions = normalizeAnalysisItems(analysis.conditions);
  if (strengths.length !== 3 || criticalities.length !== 3 || conditions.length !== 3) return fallback;

  return {
    strengths,
    criticalities,
    conditions,
    analysisSource: "openai",
    analysisModel: model,
  };
}

async function readSupabaseEntry(config, accessToken, entryId) {
  const entryUrl = new URL(config.url + "/rest/v1/hub_entries");
  entryUrl.searchParams.set("id", "eq." + entryId);
  entryUrl.searchParams.set("select", hubEntrySelect);
  entryUrl.searchParams.set("limit", "1");

  let response;
  try {
    response = await fetch(entryUrl, { headers: supabaseHeaders(config.key, accessToken) });
  } catch {
    return { ok: false, response: json({ detail: "L’archivio ECCOMI HUB non è momentaneamente raggiungibile." }, 502) };
  }

  if (!response.ok) return { ok: false, response: await hubDataFailure(response) };
  const entries = await response.json().catch(() => []);
  const entry = Array.isArray(entries) ? entries[0] : null;
  if (!entry) return { ok: false, response: json({ detail: "Iniziativa non trovata." }, 404) };
  return { ok: true, entry };
}

async function readHubEvaluation(config, accessToken, entryId) {
  const evaluationUrl = new URL(config.url + "/rest/v1/hub_evaluations");
  evaluationUrl.searchParams.set("entry_id", "eq." + entryId);
  evaluationUrl.searchParams.set("select", hubEvaluationSelect);
  evaluationUrl.searchParams.set("limit", "1");

  let response;
  try {
    response = await fetch(evaluationUrl, { headers: supabaseHeaders(config.key, accessToken) });
  } catch {
    return { ok: false, response: json({ detail: "La valutazione non è momentaneamente raggiungibile." }, 502) };
  }

  if (!response.ok) return { ok: false, response: await evaluationDataFailure(response) };
  const evaluations = await response.json().catch(() => []);
  return { ok: true, evaluation: Array.isArray(evaluations) ? evaluations[0] || null : null };
}

async function createHubEvaluation(config, accessToken, profile, entry, env) {
  const scores = scoreHubEntry(entry);
  const fallback = ruleBasedEvaluationAnalysis(entry, scores);
  const analysis = await generateOpenAIAnalysis(entry, scores, env, fallback);
  const evaluationUrl = new URL(config.url + "/rest/v1/hub_evaluations");
  evaluationUrl.searchParams.set("on_conflict", "entry_id");
  evaluationUrl.searchParams.set("select", hubEvaluationSelect);

  const headers = supabaseHeaders(config.key, accessToken);
  headers.Prefer = "resolution=merge-duplicates,return=representation";

  let response;
  try {
    response = await fetch(evaluationUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        entry_id: entry.id,
        need_score: scores.needScore,
        dna_score: scores.dnaScore,
        revenue_score: scores.revenueScore,
        feasibility_score: scores.feasibilityScore,
        risk_control_score: scores.riskControlScore,
        total_score: scores.totalScore,
        traffic_light: scores.trafficLight,
        strengths: analysis.strengths,
        criticalities: analysis.criticalities,
        conditions: analysis.conditions,
        analysis_source: analysis.analysisSource,
        analysis_model: analysis.analysisModel,
        decision_state: "Da decidere",
        evaluated_by: profile.user_id,
        evaluated_at: new Date().toISOString(),
      }),
    });
  } catch {
    return { ok: false, response: json({ detail: "La valutazione non è momentaneamente raggiungibile." }, 502) };
  }

  if (!response.ok) return { ok: false, response: await evaluationDataFailure(response) };
  const evaluations = await response.json().catch(() => []);
  const evaluation = Array.isArray(evaluations) ? evaluations[0] : null;
  if (!evaluation) return { ok: false, response: json({ detail: "La valutazione è stata generata, ma non è stato possibile rileggerla." }, 502) };
  return { ok: true, evaluation };
}

async function decideSupabaseEvaluation(config, accessToken, entryId, action) {
  const rpcUrl = config.url + "/rest/v1/rpc/hub_decide_entry";
  let response;
  try {
    response = await fetch(rpcUrl, {
      method: "POST",
      headers: supabaseHeaders(config.key, accessToken),
      body: JSON.stringify({ p_entry_id: entryId, p_action: action, p_note: null }),
    });
  } catch {
    return { ok: false, response: json({ detail: "La decisione non è momentaneamente raggiungibile." }, 502) };
  }

  if (!response.ok) return { ok: false, response: await evaluationDataFailure(response) };
  return { ok: true };
}

async function handleSupabaseEvaluation(request, env, config, entryId) {
  if (request.method !== "POST") return json({ detail: "Metodo non consentito." }, 405);

  const accessToken = bearerToken(request);
  if (!accessToken) return json({ detail: "Accedi a ECCOMI HUB per gestire la valutazione." }, 401);

  const profileResult = await getHubProfile(config, accessToken);
  if (!profileResult.ok) {
    if (profileResult.status === 401) return json({ detail: "La sessione è scaduta. Esci e richiedi un nuovo codice." }, 401);
    return json({ detail: "Non è stato possibile verificare il ruolo ECCOMI HUB." }, 502);
  }
  const profile = profileResult.profile;
  if (!profile || !profile.active || profile.role !== "ceo") {
    return json({ detail: "Solo il CEO può gestire la valutazione." }, 403);
  }

  const body = await requestJson(request);
  const action = body && typeof body.action === "string" ? body.action : "";
  if (!["generate", "request_details", "suspend", "approve"].includes(action)) {
    return json({ detail: "Azione di valutazione non valida." }, 400);
  }

  if (action === "generate") {
    const existing = await readHubEvaluation(config, accessToken, entryId);
    if (!existing.ok) return existing.response;
    if (existing.evaluation) return json({ evaluation: existing.evaluation });

    const entryResult = await readSupabaseEntry(config, accessToken, entryId);
    if (!entryResult.ok) return entryResult.response;
    if (!["Valutazione", "Approvato", "Sospeso"].includes(entryResult.entry.status)) {
      return json({ detail: "Avvia prima la fase Valutazione." }, 409);
    }

    const created = await createHubEvaluation(config, accessToken, profile, entryResult.entry, env);
    if (!created.ok) return created.response;
    return json({ evaluation: created.evaluation });
  }

  const decided = await decideSupabaseEvaluation(config, accessToken, entryId, action);
  if (!decided.ok) return decided.response;

  const [entryResult, evaluationResult] = await Promise.all([
    readSupabaseEntry(config, accessToken, entryId),
    readHubEvaluation(config, accessToken, entryId),
  ]);
  if (!entryResult.ok) return entryResult.response;
  if (!evaluationResult.ok) return evaluationResult.response;
  if (!evaluationResult.evaluation) return json({ detail: "La decisione è stata registrata, ma la valutazione non è leggibile." }, 502);

  return json({ entry: entryResult.entry, evaluation: evaluationResult.evaluation });
}

function cleanPlanningInput(body) {
  const plan = body && body.plan && typeof body.plan === "object" ? body.plan : null;
  if (!plan) return null;

  const text = (value, max) => typeof value === "string"
    ? value.trim().slice(0, max)
    : "";
  const isoDate = (value) => {
    const candidate = text(value, 10);
    return /^\\d{4}-\\d{2}-\\d{2}$/.test(candidate) ? candidate : "";
  };
  const budget = Number(plan.budget);
  const tasks = Array.isArray(plan.tasks)
    ? plan.tasks.slice(0, 50).map((task) => ({
      id: text(task && task.id, 80),
      title: text(task && task.title, 240),
      owner: text(task && task.owner, 160),
      dueDate: isoDate(task && task.dueDate),
      status: text(task && task.status, 30),
    }))
    : [];
  const kpis = Array.isArray(plan.kpis)
    ? plan.kpis.slice(0, 20).map((kpi) => ({
      id: text(kpi && kpi.id, 80),
      name: text(kpi && kpi.name, 180),
      target: text(kpi && kpi.target, 180),
    }))
    : [];
  const conditions = Array.isArray(plan.conditions)
    ? plan.conditions.slice(0, 20).map((condition) => ({
      id: text(condition && condition.id, 80),
      text: text(condition && condition.text, 360),
      met: Boolean(condition && condition.met),
    }))
    : [];
  const allowedTaskStatuses = ["Da fare", "In corso", "Completata", "Bloccata"];
  const input = {
    objective: text(plan.objective, 5000),
    owner: text(plan.owner, 160),
    startDate: isoDate(plan.startDate),
    targetDate: isoDate(plan.targetDate),
    budget,
    tasks,
    kpis,
    conditions,
  };
  const valid = Boolean(input.objective && input.owner && input.startDate && input.targetDate)
    && input.targetDate >= input.startDate
    && Number.isFinite(input.budget)
    && input.budget >= 0
    && tasks.length > 0
    && tasks.every((task) => task.id && task.title && task.owner && task.dueDate && allowedTaskStatuses.includes(task.status))
    && kpis.length > 0
    && kpis.every((kpi) => kpi.id && kpi.name && kpi.target)
    && conditions.length > 0
    && conditions.every((condition) => condition.id && condition.text);

  return valid ? input : null;
}

async function readHubProjectPlan(config, accessToken, entryId) {
  const planUrl = new URL(config.url + "/rest/v1/hub_project_plans");
  planUrl.searchParams.set("entry_id", "eq." + entryId);
  planUrl.searchParams.set("select", hubProjectPlanSelect);
  planUrl.searchParams.set("limit", "1");

  let response;
  try {
    response = await fetch(planUrl, { headers: supabaseHeaders(config.key, accessToken) });
  } catch {
    return { ok: false, response: json({ detail: "La progettazione non è momentaneamente raggiungibile." }, 502) };
  }

  if (!response.ok) return { ok: false, response: await planningDataFailure(response) };
  const plans = await response.json().catch(() => []);
  return { ok: true, plan: Array.isArray(plans) ? plans[0] || null : null };
}

async function callPlanningRpc(config, accessToken, functionName, payload) {
  let response;
  try {
    response = await fetch(config.url + "/rest/v1/rpc/" + functionName, {
      method: "POST",
      headers: supabaseHeaders(config.key, accessToken),
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, response: json({ detail: "La progettazione non è momentaneamente raggiungibile." }, 502) };
  }

  if (!response.ok) return { ok: false, response: await planningDataFailure(response) };
  return { ok: true };
}

async function handleSupabasePlanning(request, config, entryId) {
  if (!['GET', 'POST'].includes(request.method)) {
    return json({ detail: "Metodo non consentito." }, 405);
  }

  const accessToken = bearerToken(request);
  if (!accessToken) return json({ detail: "Accedi a ECCOMI HUB per gestire la progettazione." }, 401);

  const profileResult = await getHubProfile(config, accessToken);
  if (!profileResult.ok) {
    if (profileResult.status === 401) return json({ detail: "La sessione è scaduta. Esci e richiedi un nuovo codice." }, 401);
    return json({ detail: "Non è stato possibile verificare il ruolo ECCOMI HUB." }, 502);
  }
  const profile = profileResult.profile;
  if (!profile || !profile.active || profile.role !== "ceo") {
    return json({ detail: "Solo il CEO può gestire la progettazione." }, 403);
  }

  if (request.method === "GET") {
    const planResult = await readHubProjectPlan(config, accessToken, entryId);
    if (!planResult.ok) return planResult.response;
    return json({ plan: planResult.plan });
  }

  const body = await requestJson(request);
  const action = body && typeof body.action === "string" ? body.action : "";
  if (!['save', 'advance_test'].includes(action)) {
    return json({ detail: "Azione di progettazione non valida." }, 400);
  }

  let rpcResult;
  if (action === "save") {
    const input = cleanPlanningInput(body);
    if (!input) {
      return json({ detail: "Completa responsabile, date, budget, attività, KPI e condizioni." }, 400);
    }
    rpcResult = await callPlanningRpc(config, accessToken, "hub_save_project_plan", {
      p_entry_id: entryId,
      p_objective: input.objective,
      p_owner: input.owner,
      p_start_date: input.startDate,
      p_target_date: input.targetDate,
      p_budget: input.budget,
      p_tasks: input.tasks,
      p_kpis: input.kpis,
      p_conditions: input.conditions,
    });
  } else {
    rpcResult = await callPlanningRpc(config, accessToken, "hub_advance_entry_to_test", {
      p_entry_id: entryId,
    });
  }
  if (!rpcResult.ok) return rpcResult.response;

  const [entryResult, planResult] = await Promise.all([
    readSupabaseEntry(config, accessToken, entryId),
    readHubProjectPlan(config, accessToken, entryId),
  ]);
  if (!entryResult.ok) return entryResult.response;
  if (!planResult.ok) return planResult.response;
  if (!planResult.plan) {
    return json({ detail: "Il piano è stato salvato, ma non è possibile rileggerlo." }, 502);
  }

  return json({ entry: entryResult.entry, plan: planResult.plan });
}

async function handleSupabaseEntries(request, config) {
  if (request.method === "GET") {
    return listSupabaseEntries(request, config);
  }
  if (request.method === "POST") {
    return createSupabaseEntry(request, config);
  }
  return json({ detail: "Metodo non consentito." }, 405);
}

async function handleSupabaseAuth(request, env, url) {
  const config = supabaseConfig(env);

  if (!config.ready) {
    return null;
  }

  if (url.pathname === "/api/v1/auth/request-code") {
    if (request.method !== "POST") {
      return json({ detail: "Metodo non consentito." }, 405);
    }
    return requestSupabaseCode(request, config);
  }

  if (url.pathname === "/api/v1/auth/verify-code") {
    if (request.method !== "POST") {
      return json({ detail: "Metodo non consentito." }, 405);
    }
    return verifySupabaseCode(request, config);
  }

  if (url.pathname === "/api/v1/auth/refresh") {
    if (request.method !== "POST") {
      return json({ detail: "Metodo non consentito." }, 405);
    }
    return refreshSupabaseSession(request, config);
  }

  return null;
}

async function proxyApi(request, env, url) {
  const backendBaseUrl = env && env.HUB_API_BASE_URL;

  if (!backendBaseUrl) {
    return json({
      detail: "Il collegamento reale è in preparazione. Riprova tra poco.",
    }, 503);
  }

  const base = backendBaseUrl.endsWith("/") ? backendBaseUrl : backendBaseUrl + "/";
  const apiPath = url.pathname.replace(/^\\/api\\/?/, "");
  const target = new URL(apiPath + url.search, base);
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("cf-connecting-ip");
  headers.set("X-Eccomi-Hub-Proxy", "sites");

  const init = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  try {
    return await fetch(target, init);
  } catch {
    return json({ detail: "Il servizio ECCOMI HUB non è momentaneamente raggiungibile." }, 502);
  }
}

async function authorizePostaAccess(request, env, ceoOnly = false) {
  const accessToken = bearerToken(request);
  if (!accessToken) {
    return { ok: false, response: json({ detail: "Accesso ECCOMI HUB richiesto." }, 401) };
  }

  const hubConfig = supabaseConfig(env);
  if (!hubConfig.ready) {
    return { ok: false, response: json({ detail: "Accesso ECCOMI HUB non configurato." }, 503) };
  }

  let authResponse;
  try {
    authResponse = await fetch(hubConfig.url + "/auth/v1/user", {
      headers: supabaseHeaders(hubConfig.key, accessToken),
    });
  } catch {
    return { ok: false, response: json({ detail: "Il servizio di accesso ECCOMI HUB non è raggiungibile." }, 502) };
  }

  if (!authResponse.ok) {
    return { ok: false, response: json({ detail: "Sessione ECCOMI HUB scaduta o non valida." }, 401) };
  }

  const hubUser = await authResponse.json().catch(() => null);
  if (!hubUser || !hubUser.id) {
    return { ok: false, response: json({ detail: "Sessione ECCOMI HUB non valida." }, 401) };
  }

  const profileResult = await getHubProfile(hubConfig, accessToken, hubUser.id);
  if (!profileResult.ok) {
    return { ok: false, response: json({ detail: "Non è stato possibile verificare il ruolo ECCOMI HUB." }, 502) };
  }

  const profile = profileResult.profile;
  const scopes = profile && Array.isArray(profile.ecosystem_keys)
    ? profile.ecosystem_keys.map((scope) => String(scope).trim().toLowerCase())
    : [];
  const canReadPosta = !ceoOnly && profile
    && profile.active
    && (
      profile.role === "ceo"
      || (profile.role === "manager" && scopes.some((scope) => ["posta", "eccomi-posta", "eccomi_posta"].includes(scope)))
    );
  const canConfigurePosta = ceoOnly && profile && profile.active && profile.role === "ceo";

  if (!canReadPosta && !canConfigurePosta) {
    return {
      ok: false,
      response: json({
        detail: ceoOnly
          ? "Solo il CEO può configurare il collegamento a Eccomi Posta."
          : "Il ruolo non è autorizzato ai dati di Eccomi Posta.",
      }, 403),
    };
  }

  return { ok: true, profile };
}

async function authorizeNoleggioAccess(request, env) {
  const accessToken = bearerToken(request);
  if (!accessToken) {
    return { ok: false, response: json({ detail: "Accesso ECCOMI HUB richiesto." }, 401) };
  }

  const hubConfig = supabaseConfig(env);
  if (!hubConfig.ready) {
    return { ok: false, response: json({ detail: "Accesso ECCOMI HUB non configurato." }, 503) };
  }

  let authResponse;
  try {
    authResponse = await fetch(hubConfig.url + "/auth/v1/user", {
      headers: supabaseHeaders(hubConfig.key, accessToken),
    });
  } catch {
    return { ok: false, response: json({ detail: "Il servizio di accesso ECCOMI HUB non è raggiungibile." }, 502) };
  }

  if (!authResponse.ok) {
    return { ok: false, response: json({ detail: "Sessione ECCOMI HUB scaduta o non valida." }, 401) };
  }

  const hubUser = await authResponse.json().catch(() => null);
  if (!hubUser || !hubUser.id) {
    return { ok: false, response: json({ detail: "Sessione ECCOMI HUB non valida." }, 401) };
  }

  const profileResult = await getHubProfile(hubConfig, accessToken, hubUser.id);
  if (!profileResult.ok) {
    return { ok: false, response: json({ detail: "Non è stato possibile verificare il ruolo ECCOMI HUB." }, 502) };
  }

  const profile = profileResult.profile;
  const scopes = profile && Array.isArray(profile.ecosystem_keys)
    ? profile.ecosystem_keys.map((scope) => String(scope).trim().toLowerCase())
    : [];
  const canReadNoleggio = profile
    && profile.active
    && (
      profile.role === "ceo"
      || (profile.role === "manager" && scopes.some((scope) => ["noleggio", "eccomi-noleggio", "eccomi_noleggio"].includes(scope)))
    );

  if (!canReadNoleggio) {
    return {
      ok: false,
      response: json({ detail: "Il ruolo non è autorizzato ai dati di Eccomi Noleggio." }, 403),
    };
  }

  return { ok: true, profile };
}

async function configurePostaConnection(request, env) {
  if (request.method !== "POST") {
    return json({ detail: "Metodo non consentito." }, 405);
  }

  const authorization = await authorizePostaAccess(request, env, true);
  if (!authorization.ok) return authorization.response;

  if (!env || !env.DB || !(await postaEncryptionKey(env))) {
    return json({ detail: "L’archivio protetto dell’HUB non è ancora disponibile." }, 503);
  }

  const body = await requestJson(request);
  const serviceKey = body && typeof body.service_key === "string"
    ? body.service_key.trim().slice(0, 4096)
    : "";
  if (serviceKey.length < 32 || /\\s/.test(serviceKey)) {
    return json({ detail: "La chiave copiata da Render non è completa." }, 400);
  }

  const postaUrl = env && env.POSTA_SUPABASE_URL
    ? String(env.POSTA_SUPABASE_URL).replace(/\\/+$/, "")
    : "";
  if (!postaUrl) {
    return json({ detail: "L’indirizzo dati di Eccomi Posta non è configurato nell’HUB." }, 503);
  }

  const verificationUrl = new URL(postaUrl + "/rest/v1/pratiche");
  verificationUrl.searchParams.set("select", "id");
  verificationUrl.searchParams.set("limit", "1");

  let verificationResponse;
  try {
    verificationResponse = await fetch(verificationUrl, {
      headers: {
        "apikey": serviceKey,
        "Authorization": "Bearer " + serviceKey,
        "Accept": "application/json",
      },
    });
  } catch {
    return json({ detail: "Non è stato possibile verificare il collegamento. Riprova tra poco." }, 502);
  }

  if (verificationResponse.status === 401 || verificationResponse.status === 403) {
    return json({ detail: "La chiave non è valida per l’archivio Eccomi Posta." }, 400);
  }
  if (!verificationResponse.ok) {
    return json({ detail: "L’archivio Eccomi Posta non è momentaneamente raggiungibile." }, 502);
  }

  const stored = await storePostaSecret(env, serviceKey, String(authorization.profile.user_id || "ceo"));
  if (!stored) {
    return json({ detail: "Non è stato possibile proteggere la chiave nell’HUB." }, 503);
  }

  return json({ configured: true, verified: true });
}

async function proxyPostaSummary(request, env) {
  if (request.method !== "GET") {
    return json({ detail: "Metodo non consentito." }, 405);
  }

  const authorization = await authorizePostaAccess(request, env);
  if (!authorization.ok) return authorization.response;

  const postaConfig = await resolvePostaSupabaseConfig(env);
  if (!postaConfig.ready) {
    return json({ detail: "La lettura protetta di Eccomi Posta deve ancora essere configurata nell’HUB." }, 503);
  }

  const practicesUrl = new URL(postaConfig.url + "/rest/v1/pratiche");
  practicesUrl.searchParams.set("select", "id,order_name,shopify_order_name,tipo_servizio,stato,ultimo_evento,created_at,updated_at");
  practicesUrl.searchParams.set("order", "updated_at.desc");
  practicesUrl.searchParams.set("limit", "1000");

  let practicesResponse;
  try {
    practicesResponse = await fetch(practicesUrl, {
      headers: {
        "apikey": postaConfig.key,
        "Authorization": "Bearer " + postaConfig.key,
        "Accept": "application/json",
      },
    });
  } catch {
    return json({ detail: "I dati di Eccomi Posta non sono momentaneamente raggiungibili." }, 502);
  }

  if (!practicesResponse.ok) {
    return json({ detail: "I dati di Eccomi Posta non sono momentaneamente disponibili." }, 502);
  }

  const fetchedRows = await practicesResponse.json().catch(() => []);
  const excludedStates = new Set(["BOZZA_CHECKOUT", "NON_PAGATO"]);
  const completedStates = new Set(["COMPLETATO"]);
  const sentStates = new Set(["INVIATO_POSTE", "PRESA_IN_CARICO_POSTEL", "CONSEGNATO", "COMPLETATO"]);
  const manualStates = new Set(["LAVORAZIONE_MANUALE", "RICEVUTO_MANUALE"]);
  const rows = Array.isArray(fetchedRows)
    ? fetchedRows.filter((row) => !excludedStates.has(String(row.stato || "").trim().toUpperCase()))
    : [];
  const todayRome = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const byService = {};
  const recent = [];
  let completed = 0;
  let sent = 0;
  let open = 0;
  let errors = 0;
  let manual = 0;
  let createdToday = 0;

  for (const row of rows) {
    const stateName = String(row.stato || "DA_VERIFICARE").trim().toUpperCase();
    const serviceName = String(row.tipo_servizio || "ALTRO").trim().toUpperCase();
    byService[serviceName] = Number(byService[serviceName] || 0) + 1;
    if (completedStates.has(stateName)) completed += 1;
    if (sentStates.has(stateName)) sent += 1;
    else open += 1;
    if (stateName.startsWith("ERRORE_") || stateName === "INDIRIZZO_DA_VERIFICARE") errors += 1;
    if (manualStates.has(stateName)) manual += 1;

    const createdAt = row.created_at ? new Date(row.created_at) : null;
    if (createdAt && Number.isFinite(createdAt.getTime())) {
      const createdRome = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Rome",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(createdAt);
      if (createdRome === todayRome) createdToday += 1;
    }

    if (recent.length < 12) {
      const practiceId = String(row.id || "").trim();
      recent.push({
        id: practiceId,
        order_name: String(row.shopify_order_name || row.order_name || (practiceId ? "Pratica " + practiceId.slice(0, 8) : "Pratica")),
        service: serviceName,
        status: stateName,
        last_event: String(row.ultimo_evento || stateName),
        created_at: String(row.created_at || ""),
        updated_at: String(row.updated_at || ""),
      });
    }
  }

  return json({
    source: "eccomi-hub-readonly",
    safe_read_only: true,
    generated_at: new Date().toISOString(),
    sample_limited: Array.isArray(fetchedRows) && fetchedRows.length >= 1000,
    summary: {
      total: rows.length,
      open,
      completed,
      sent,
      errors,
      manual,
      created_today: createdToday,
    },
    by_service: Object.fromEntries(Object.entries(byService).sort(([a], [b]) => a.localeCompare(b))),
    recent,
  });
}

async function proxyNoleggioSummary(request, env) {
  if (request.method !== "GET") {
    return json({ detail: "Metodo non consentito." }, 405);
  }

  const authorization = await authorizeNoleggioAccess(request, env);
  if (!authorization.ok) return authorization.response;

  const config = noleggioConfig(env);
  if (!config.ready) {
    return json({ detail: "La lettura protetta di Eccomi Noleggio non è ancora configurata nell’HUB." }, 503);
  }

  let response;
  try {
    response = await fetch(config.url + "/api/internal/hub-summary", {
      headers: {
        "Authorization": "Bearer " + config.key,
        "Accept": "application/json",
      },
    });
  } catch {
    return json({ detail: "I dati di Eccomi Noleggio non sono momentaneamente raggiungibili." }, 502);
  }

  if (!response.ok) {
    return json({ detail: "I dati di Eccomi Noleggio non sono momentaneamente disponibili." }, 502);
  }

  const payload = await response.json().catch(() => null);
  if (!payload || payload.safe_read_only !== true || !payload.summary) {
    return json({ detail: "La risposta di Eccomi Noleggio non è valida." }, 502);
  }

  return json(payload);
}

async function handleApi(request, env, url) {
  if (url.pathname === "/api/v1/ecosystems/posta/configure") {
    return configurePostaConnection(request, env);
  }

  if (url.pathname === "/api/v1/ecosystems/posta/summary") {
    return proxyPostaSummary(request, env);
  }

  if (url.pathname === "/api/v1/ecosystems/noleggio/summary") {
    return proxyNoleggioSummary(request, env);
  }

  const backendBaseUrl = env && env.HUB_API_BASE_URL;

  if (backendBaseUrl) {
    return proxyApi(request, env, url);
  }

  const authResponse = await handleSupabaseAuth(request, env, url);
  if (authResponse) {
    return authResponse;
  }

  const config = supabaseConfig(env);
  const planningEntryId = planningEntryIdFromPath(url.pathname);
  if (config.ready && planningEntryId) {
    return handleSupabasePlanning(request, config, planningEntryId);
  }
  const evaluationEntryId = evaluationEntryIdFromPath(url.pathname);
  if (config.ready && evaluationEntryId) {
    return handleSupabaseEvaluation(request, env, config, evaluationEntryId);
  }
  const advanceEntryId = entryIdFromAdvancePath(url.pathname);
  if (config.ready && advanceEntryId) {
    return advanceSupabaseEntry(request, config, advanceEntryId);
  }
  if (config.ready && url.pathname === "/api/v1/entries") {
    return handleSupabaseEntries(request, config);
  }

  return json({
    detail: "Il collegamento reale è in preparazione. Riprova tra poco.",
  }, 503);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return handleApi(request, env, url);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    return new Response(request.method === "HEAD" ? null : html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  },
};
`;

await mkdir(serverDirectory, { recursive: true });
await mkdir(targetDirectory, { recursive: true });
await writeFile(serverEntry, worker, "utf8");
await copyFile(sourceConfig, targetConfig);
