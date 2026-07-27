import assert from "node:assert/strict";

const { default: worker } = await import("../dist/server/index.js");

const env = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
};

const requestCodeCalls = [];
globalThis.fetch = async (url, init = {}) => {
  requestCodeCalls.push({ url: String(url), init });
  return new Response("{}", { status: 200 });
};

const requestCodeResponse = await worker.fetch(
  new Request("https://hub.example/api/v1/auth/request-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "DELLIBANO@ME.COM" }),
  }),
  env,
);

assert.equal(requestCodeResponse.status, 202);
assert.deepEqual(await requestCodeResponse.json(), { accepted: true });
assert.equal(requestCodeCalls.length, 1);
assert.equal(requestCodeCalls[0].url, "https://example.supabase.co/auth/v1/otp");
assert.deepEqual(JSON.parse(requestCodeCalls[0].init.body), {
  email: "dellibano@me.com",
  create_user: true,
});

globalThis.fetch = async () => Response.json(
  { msg: "Unable to send email" },
  { status: 400 },
);

const rejectedCodeResponse = await worker.fetch(
  new Request("https://hub.example/api/v1/auth/request-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "pending@example.com" }),
  }),
  env,
);

assert.equal(rejectedCodeResponse.status, 400);
assert.deepEqual(await rejectedCodeResponse.json(), {
  detail: "Il codice non è stato inviato. Verifica l’indirizzo e riprova tra poco.",
});

let verifyStep = 0;
globalThis.fetch = async (url, init = {}) => {
  verifyStep += 1;

  if (verifyStep === 1) {
    assert.equal(String(url), "https://example.supabase.co/auth/v1/verify");
    assert.deepEqual(JSON.parse(init.body), {
      type: "email",
      email: "dellibano@me.com",
      token: "123456",
    });
    return Response.json({
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_in: 3600,
      expires_at: 1784596800,
      user: { id: "user-id", email: "dellibano@me.com" },
    });
  }

  const profileUrl = new URL(String(url));
  assert.equal(profileUrl.pathname, "/rest/v1/hub_profiles");
  assert.equal(profileUrl.searchParams.get("user_id"), "eq.user-id");
  assert.equal(init.headers.Authorization, "Bearer access-token");
  return Response.json([
    {
      user_id: "user-id",
      email: "dellibano@me.com",
      full_name: "Salvatore Del Libano",
      role: "ceo",
      active: true,
    },
  ]);
};

const verifyCodeResponse = await worker.fetch(
  new Request("https://hub.example/api/v1/auth/verify-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "dellibano@me.com", code: "123456" }),
  }),
  env,
);

assert.equal(verifyCodeResponse.status, 200);
const session = await verifyCodeResponse.json();
assert.equal(session.user.full_name, "Salvatore Del Libano");
assert.equal(session.user.role, "ceo");
assert.equal(session.access_token, "access-token");
assert.equal(session.expires_at, 1784596800);
assert.equal(verifyStep, 2);

let pendingVerifyStep = 0;
globalThis.fetch = async () => {
  pendingVerifyStep += 1;

  if (pendingVerifyStep === 1) {
    return Response.json({
      access_token: "pending-access-token",
      refresh_token: "pending-refresh-token",
      expires_in: 3600,
      user: { id: "pending-user-id", email: "pending@example.com" },
    });
  }

  return Response.json([]);
};

const pendingVerifyResponse = await worker.fetch(
  new Request("https://hub.example/api/v1/auth/verify-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "pending@example.com", code: "654321" }),
  }),
  env,
);

assert.equal(pendingVerifyResponse.status, 403);
assert.deepEqual(await pendingVerifyResponse.json(), {
  detail: "L’utente non è ancora abilitato a ECCOMI HUB.",
});
assert.equal(pendingVerifyStep, 2);

let refreshStep = 0;
globalThis.fetch = async (url, init = {}) => {
  refreshStep += 1;

  if (refreshStep === 1) {
    const refreshUrl = new URL(String(url));
    assert.equal(refreshUrl.pathname, "/auth/v1/token");
    assert.equal(refreshUrl.searchParams.get("grant_type"), "refresh_token");
    assert.equal(init.method, "POST");
    assert.deepEqual(JSON.parse(init.body), { refresh_token: "refresh-token" });
    return Response.json({
      access_token: "renewed-access-token",
      refresh_token: "renewed-refresh-token",
      expires_in: 3600,
      expires_at: 1784600400,
      user: { id: "user-id", email: "dellibano@me.com" },
    });
  }

  const profileUrl = new URL(String(url));
  assert.equal(profileUrl.pathname, "/rest/v1/hub_profiles");
  assert.equal(profileUrl.searchParams.get("user_id"), "eq.user-id");
  assert.equal(init.headers.Authorization, "Bearer renewed-access-token");
  return Response.json([
    {
      user_id: "user-id",
      email: "dellibano@me.com",
      full_name: "Salvatore Del Libano",
      role: "ceo",
      active: true,
    },
  ]);
};

const refreshResponse = await worker.fetch(
  new Request("https://hub.example/api/v1/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: "refresh-token" }),
  }),
  env,
);

assert.equal(refreshResponse.status, 200);
const refreshedSession = await refreshResponse.json();
assert.equal(refreshedSession.access_token, "renewed-access-token");
assert.equal(refreshedSession.refresh_token, "renewed-refresh-token");
assert.equal(refreshedSession.expires_at, 1784600400);
assert.equal(refreshedSession.user.role, "ceo");
assert.equal(refreshStep, 2);

const storedEntry = {
  id: "11111111-1111-4111-8111-111111111111",
  entry_type: "ecosistema",
  name: "Eccomi Fiscal",
  customer_need: "Semplificare gli adempimenti del cliente.",
  objective: "Creare un servizio unico e misurabile.",
  dna_link: "Semplicità, fiducia e controllo.",
  revenue_model: "Canone mensile.",
  expected_costs: 2500,
  responsible: "Sotto controllo CEO",
  time_horizon_days: 90,
  risks: "Dipendenza dai partner tecnici.",
  status: "Da valutare",
  created_by: "user-id",
  created_at: "2026-07-21T00:00:00.000Z",
  updated_at: "2026-07-21T00:00:00.000Z",
};

let listCall;
globalThis.fetch = async (url, init = {}) => {
  listCall = { url: String(url), init };
  return Response.json([storedEntry]);
};

const listResponse = await worker.fetch(
  new Request("https://hub.example/api/v1/entries", {
    headers: { Authorization: "Bearer access-token" },
  }),
  env,
);

assert.equal(listResponse.status, 200);
assert.deepEqual(await listResponse.json(), { entries: [storedEntry] });
assert.equal(new URL(listCall.url).pathname, "/rest/v1/hub_entries");
assert.equal(new URL(listCall.url).searchParams.get("order"), "created_at.desc");
assert.equal(listCall.init.headers.Authorization, "Bearer access-token");

let createStep = 0;
globalThis.fetch = async (url, init = {}) => {
  createStep += 1;

  if (createStep === 1) {
    assert.equal(new URL(String(url)).pathname, "/rest/v1/hub_profiles");
    assert.equal(init.headers.Authorization, "Bearer access-token");
    return Response.json([
      {
        user_id: "user-id",
        email: "dellibano@me.com",
        full_name: "Salvatore Del Libano",
        role: "ceo",
        active: true,
      },
    ]);
  }

  const insertUrl = new URL(String(url));
  assert.equal(insertUrl.pathname, "/rest/v1/hub_entries");
  assert.equal(init.method, "POST");
  assert.equal(init.headers.Authorization, "Bearer access-token");
  assert.equal(init.headers.Prefer, "return=representation");
  const inserted = JSON.parse(init.body);
  assert.equal(inserted.created_by, "user-id");
  assert.equal(inserted.status, "Da valutare");
  assert.equal(inserted.entry_type, "ecosistema");
  return Response.json([storedEntry], { status: 201 });
};

const createResponse = await worker.fetch(
  new Request("https://hub.example/api/v1/entries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer access-token",
    },
    body: JSON.stringify({
      entryType: "ecosistema",
      name: "Eccomi Fiscal",
      customerNeed: "Semplificare gli adempimenti del cliente.",
      objective: "Creare un servizio unico e misurabile.",
      dnaLink: "Semplicità, fiducia e controllo.",
      revenueModel: "Canone mensile.",
      expectedCosts: 2500,
      responsible: "Sotto controllo CEO",
      timeHorizonDays: 90,
      risks: "Dipendenza dai partner tecnici.",
    }),
  }),
  env,
);

assert.equal(createResponse.status, 201);
assert.deepEqual(await createResponse.json(), { entry: storedEntry });
assert.equal(createStep, 2);

const entryInEvaluation = {
  ...storedEntry,
  status: "Valutazione",
  updated_at: "2026-07-21T01:00:00.000Z",
};

let advanceStep = 0;
globalThis.fetch = async (url, init = {}) => {
  advanceStep += 1;

  if (advanceStep === 1) {
    assert.equal(new URL(String(url)).pathname, "/rest/v1/hub_profiles");
    assert.equal(init.headers.Authorization, "Bearer access-token");
    return Response.json([
      {
        user_id: "user-id",
        email: "dellibano@me.com",
        full_name: "Salvatore Del Libano",
        role: "ceo",
        active: true,
      },
    ]);
  }

  const updateUrl = new URL(String(url));
  assert.equal(updateUrl.pathname, "/rest/v1/hub_entries");
  assert.equal(updateUrl.searchParams.get("id"), `eq.${storedEntry.id}`);
  assert.equal(updateUrl.searchParams.get("status"), "eq.Da valutare");
  assert.equal(init.method, "PATCH");
  assert.equal(init.headers.Authorization, "Bearer access-token");
  assert.equal(init.headers.Prefer, "return=representation");
  assert.deepEqual(JSON.parse(init.body), { status: "Valutazione" });
  return Response.json([entryInEvaluation]);
};

const advanceResponse = await worker.fetch(
  new Request(`https://hub.example/api/v1/entries/${storedEntry.id}/advance`, {
    method: "POST",
    headers: { Authorization: "Bearer access-token" },
  }),
  env,
);

assert.equal(advanceResponse.status, 200);
assert.deepEqual(await advanceResponse.json(), { entry: entryInEvaluation });
assert.equal(advanceStep, 2);

globalThis.fetch = async () => Response.json([
  {
    user_id: "manager-id",
    email: "manager@example.com",
    full_name: "Responsabile Test",
    role: "manager",
    active: true,
  },
]);

const deniedResponse = await worker.fetch(
  new Request("https://hub.example/api/v1/entries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer manager-token",
    },
    body: JSON.stringify({
      entryType: "idea",
      name: "Idea riservata al CEO",
      customerNeed: "Bisogno",
      objective: "Obiettivo",
      dnaLink: "ECCOMI DNA",
      revenueModel: "Canone",
      expectedCosts: 0,
      responsible: "Responsabile da nominare",
      timeHorizonDays: 30,
      risks: "Da valutare",
    }),
  }),
  env,
);

assert.equal(deniedResponse.status, 403);
assert.deepEqual(await deniedResponse.json(), { detail: "Solo il CEO può creare una new entry." });

globalThis.fetch = async () => Response.json([
  {
    user_id: "manager-id",
    email: "manager@example.com",
    full_name: "Responsabile Test",
    role: "manager",
    active: true,
  },
]);

const deniedAdvanceResponse = await worker.fetch(
  new Request(`https://hub.example/api/v1/entries/${storedEntry.id}/advance`, {
    method: "POST",
    headers: { Authorization: "Bearer manager-token" },
  }),
  env,
);

assert.equal(deniedAdvanceResponse.status, 403);
assert.deepEqual(await deniedAdvanceResponse.json(), { detail: "Solo il CEO può avviare la valutazione di una new entry." });

let generatedEvaluation;
globalThis.fetch = async (url, init = {}) => {
  const parsed = new URL(String(url));

  if (parsed.pathname === "/rest/v1/hub_profiles") {
    return Response.json([
      {
        user_id: "user-id",
        email: "dellibano@me.com",
        full_name: "Salvatore Del Libano",
        role: "ceo",
        active: true,
      },
    ]);
  }

  if (parsed.pathname === "/rest/v1/hub_evaluations" && init.method !== "POST") {
    assert.equal(parsed.searchParams.get("entry_id"), `eq.${storedEntry.id}`);
    return Response.json([]);
  }

  if (parsed.pathname === "/rest/v1/hub_entries") {
    return Response.json([entryInEvaluation]);
  }

  if (parsed.pathname === "/rest/v1/hub_evaluations" && init.method === "POST") {
    const inserted = JSON.parse(init.body);
    assert.equal(inserted.entry_id, storedEntry.id);
    assert.equal(inserted.evaluated_by, "user-id");
    assert.equal(inserted.analysis_source, "hub_rules");
    assert.equal(inserted.decision_state, "Da decidere");
    assert.ok(inserted.total_score >= 0 && inserted.total_score <= 100);
    generatedEvaluation = {
      ...inserted,
      evaluated_at: "2026-07-21T02:00:00.000Z",
      updated_at: "2026-07-21T02:00:00.000Z",
    };
    return Response.json([generatedEvaluation], { status: 201 });
  }

  throw new Error(`Unexpected evaluation URL: ${url}`);
};

const evaluationResponse = await worker.fetch(
  new Request(`https://hub.example/api/v1/entries/${storedEntry.id}/evaluation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer access-token",
    },
    body: JSON.stringify({ action: "generate" }),
  }),
  env,
);

assert.equal(evaluationResponse.status, 200);
const generatedPayload = await evaluationResponse.json();
assert.equal(generatedPayload.evaluation.entry_id, storedEntry.id);
assert.equal(generatedPayload.evaluation.analysis_source, "hub_rules");
assert.equal(generatedPayload.evaluation.strengths.length, 3);
assert.equal(generatedPayload.evaluation.criticalities.length, 3);
assert.equal(generatedPayload.evaluation.conditions.length, 3);

const approvedEntry = { ...entryInEvaluation, status: "Approvato" };
const approvedEvaluation = {
  ...generatedEvaluation,
  decision_state: "Approvato",
  decision_note: "Valutazione approvata dal CEO.",
  updated_at: "2026-07-21T03:00:00.000Z",
};

globalThis.fetch = async (url, init = {}) => {
  const parsed = new URL(String(url));

  if (parsed.pathname === "/rest/v1/hub_profiles") {
    return Response.json([
      {
        user_id: "user-id",
        email: "dellibano@me.com",
        full_name: "Salvatore Del Libano",
        role: "ceo",
        active: true,
      },
    ]);
  }

  if (parsed.pathname === "/rest/v1/rpc/hub_decide_entry") {
    assert.equal(init.method, "POST");
    assert.deepEqual(JSON.parse(init.body), {
      p_entry_id: storedEntry.id,
      p_action: "approve",
      p_note: null,
    });
    return Response.json({ status: "Approvato" });
  }

  if (parsed.pathname === "/rest/v1/hub_entries") return Response.json([approvedEntry]);
  if (parsed.pathname === "/rest/v1/hub_evaluations") return Response.json([approvedEvaluation]);
  throw new Error(`Unexpected decision URL: ${url}`);
};

const approveEvaluationResponse = await worker.fetch(
  new Request(`https://hub.example/api/v1/entries/${storedEntry.id}/evaluation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer access-token",
    },
    body: JSON.stringify({ action: "approve" }),
  }),
  env,
);

assert.equal(approveEvaluationResponse.status, 200);
const approvedPayload = await approveEvaluationResponse.json();
assert.equal(approvedPayload.entry.status, "Approvato");
assert.equal(approvedPayload.evaluation.decision_state, "Approvato");

globalThis.fetch = async () => Response.json([
  {
    user_id: "manager-id",
    email: "manager@example.com",
    full_name: "Responsabile Test",
    role: "manager",
    active: true,
  },
]);

const deniedEvaluationResponse = await worker.fetch(
  new Request(`https://hub.example/api/v1/entries/${storedEntry.id}/evaluation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer manager-token",
    },
    body: JSON.stringify({ action: "generate" }),
  }),
  env,
);

assert.equal(deniedEvaluationResponse.status, 403);
assert.deepEqual(await deniedEvaluationResponse.json(), { detail: "Solo il CEO può gestire la valutazione." });

const planningInput = {
  objective: "Preparare un flusso unico di accesso pronto per il collaudo.",
  owner: "Sotto controllo CEO",
  startDate: "2026-07-21",
  targetDate: "2026-08-20",
  budget: 0,
  tasks: [
    {
      id: "task-1",
      title: "Definire architettura e flusso operativo",
      owner: "Sotto controllo CEO",
      dueDate: "2026-08-01",
      status: "Da fare",
    },
  ],
  kpis: [
    { id: "kpi-1", name: "Errori bloccanti", target: "0 nel collaudo" },
  ],
  conditions: [
    { id: "condition-1", text: "Ruoli e accessi approvati.", met: false },
  ],
};
const projectEntry = { ...approvedEntry, status: "Progettazione" };
const storedPlan = {
  entry_id: storedEntry.id,
  objective: planningInput.objective,
  owner: planningInput.owner,
  start_date: planningInput.startDate,
  target_date: planningInput.targetDate,
  budget: planningInput.budget,
  tasks: planningInput.tasks,
  kpis: planningInput.kpis,
  conditions: planningInput.conditions,
  plan_state: "Attivo",
  planned_by: "user-id",
  created_at: "2026-07-21T04:00:00.000Z",
  updated_at: "2026-07-21T04:00:00.000Z",
};

globalThis.fetch = async (url, init = {}) => {
  const parsed = new URL(String(url));

  if (parsed.pathname === "/rest/v1/hub_profiles") {
    return Response.json([
      {
        user_id: "user-id",
        email: "dellibano@me.com",
        full_name: "Salvatore Del Libano",
        role: "ceo",
        active: true,
      },
    ]);
  }
  if (parsed.pathname === "/rest/v1/rpc/hub_save_project_plan") {
    assert.equal(init.method, "POST");
    assert.deepEqual(JSON.parse(init.body), {
      p_entry_id: storedEntry.id,
      p_objective: planningInput.objective,
      p_owner: planningInput.owner,
      p_start_date: planningInput.startDate,
      p_target_date: planningInput.targetDate,
      p_budget: planningInput.budget,
      p_tasks: planningInput.tasks,
      p_kpis: planningInput.kpis,
      p_conditions: planningInput.conditions,
    });
    return Response.json({ status: "Progettazione" });
  }
  if (parsed.pathname === "/rest/v1/hub_entries") return Response.json([projectEntry]);
  if (parsed.pathname === "/rest/v1/hub_project_plans") return Response.json([storedPlan]);
  throw new Error(`Unexpected planning URL: ${url}`);
};

const savePlanningResponse = await worker.fetch(
  new Request(`https://hub.example/api/v1/entries/${storedEntry.id}/planning`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer access-token",
    },
    body: JSON.stringify({ action: "save", plan: planningInput }),
  }),
  env,
);

assert.equal(savePlanningResponse.status, 200);
const planningPayload = await savePlanningResponse.json();
assert.equal(planningPayload.entry.status, "Progettazione");
assert.equal(planningPayload.plan.plan_state, "Attivo");
assert.equal(planningPayload.plan.tasks.length, 1);

const readyPlan = {
  ...storedPlan,
  tasks: storedPlan.tasks.map((task) => ({ ...task, status: "Completata" })),
  conditions: storedPlan.conditions.map((condition) => ({ ...condition, met: true })),
  plan_state: "In test",
  updated_at: "2026-07-21T05:00:00.000Z",
};
const testEntry = { ...projectEntry, status: "Test" };

globalThis.fetch = async (url, init = {}) => {
  const parsed = new URL(String(url));

  if (parsed.pathname === "/rest/v1/hub_profiles") {
    return Response.json([
      {
        user_id: "user-id",
        email: "dellibano@me.com",
        full_name: "Salvatore Del Libano",
        role: "ceo",
        active: true,
      },
    ]);
  }
  if (parsed.pathname === "/rest/v1/rpc/hub_advance_entry_to_test") {
    assert.equal(init.method, "POST");
    assert.deepEqual(JSON.parse(init.body), { p_entry_id: storedEntry.id });
    return Response.json({ status: "Test" });
  }
  if (parsed.pathname === "/rest/v1/hub_entries") return Response.json([testEntry]);
  if (parsed.pathname === "/rest/v1/hub_project_plans") return Response.json([readyPlan]);
  throw new Error(`Unexpected Test transition URL: ${url}`);
};

const advanceTestResponse = await worker.fetch(
  new Request(`https://hub.example/api/v1/entries/${storedEntry.id}/planning`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer access-token",
    },
    body: JSON.stringify({ action: "advance_test" }),
  }),
  env,
);

assert.equal(advanceTestResponse.status, 200);
const testPayload = await advanceTestResponse.json();
assert.equal(testPayload.entry.status, "Test");
assert.equal(testPayload.plan.plan_state, "In test");

const deniedPostaResponse = await worker.fetch(
  new Request("https://hub.example/api/v1/ecosystems/posta/summary"),
  env,
);
assert.equal(deniedPostaResponse.status, 401);

const now = new Date().toISOString();
const postaPractices = [
  {
    id: "posta-1",
    order_name: "#1401",
    shopify_order_name: "#1401",
    tipo_servizio: "RACCOMANDATA",
    stato: "INVIATO_POSTE",
    ultimo_evento: "Invio completato",
    created_at: now,
    updated_at: now,
  },
  {
    id: "posta-2",
    order_name: "#1400",
    shopify_order_name: "#1400",
    tipo_servizio: "TELEGRAMMA",
    stato: "ERRORE_INVIO",
    ultimo_evento: "Invio da verificare",
    created_at: "2026-07-20T10:00:00.000Z",
    updated_at: "2026-07-20T10:05:00.000Z",
  },
  {
    id: "posta-3",
    order_name: "#1399",
    shopify_order_name: "#1399",
    tipo_servizio: "RACCOMANDATA",
    stato: "COMPLETATO",
    ultimo_evento: "Pratica completata",
    created_at: "2026-07-19T10:00:00.000Z",
    updated_at: "2026-07-19T10:05:00.000Z",
  },
  {
    id: "posta-4",
    order_name: "#1398",
    shopify_order_name: "#1398",
    tipo_servizio: "RACCOMANDATA",
    stato: "NON_PAGATO",
    ultimo_evento: "Checkout non pagato",
    created_at: "2026-07-18T10:00:00.000Z",
    updated_at: "2026-07-18T10:05:00.000Z",
  },
];

const postaCalls = [];
globalThis.fetch = async (url, init = {}) => {
  const parsed = new URL(String(url));
  postaCalls.push({ url: String(url), init });

  if (parsed.pathname === "/auth/v1/user") {
    assert.equal(init.headers.Authorization, "Bearer access-token");
    return Response.json({ id: "user-id", email: "dellibano@me.com" });
  }

  if (parsed.hostname === "example.supabase.co" && parsed.pathname === "/rest/v1/hub_profiles") {
    assert.equal(parsed.searchParams.get("user_id"), "eq.user-id");
    return Response.json([{
      user_id: "user-id",
      email: "dellibano@me.com",
      full_name: "Salvatore Del Libano",
      role: "ceo",
      active: true,
      ecosystem_keys: [],
    }]);
  }

  if (parsed.hostname === "posta.supabase.co" && parsed.pathname === "/rest/v1/pratiche") {
    assert.equal(init.headers.apikey, "posta-service-key");
    assert.equal(init.headers.Authorization, "Bearer posta-service-key");
    assert.equal(parsed.searchParams.get("order"), "updated_at.desc");
    assert.equal(parsed.searchParams.get("limit"), "1000");
    return Response.json(postaPractices);
  }

  throw new Error(`Unexpected Eccomi Posta URL: ${url}`);
};

const postaResponse = await worker.fetch(
  new Request("https://hub.example/api/v1/ecosystems/posta/summary", {
    headers: { Authorization: "Bearer access-token" },
  }),
  {
    ...env,
    POSTA_SUPABASE_URL: "https://posta.supabase.co/",
    POSTA_SUPABASE_SERVICE_KEY: "posta-service-key",
  },
);

assert.equal(postaResponse.status, 200);
const postaPayload = await postaResponse.json();
assert.equal(postaPayload.source, "eccomi-hub-readonly");
assert.equal(postaPayload.safe_read_only, true);
assert.equal(postaPayload.sample_limited, false);
assert.deepEqual(postaPayload.summary, {
  total: 3,
  open: 1,
  completed: 1,
  sent: 2,
  errors: 1,
  manual: 0,
  created_today: 1,
});
assert.deepEqual(postaPayload.by_service, { RACCOMANDATA: 2, TELEGRAMMA: 1 });
assert.equal(postaPayload.recent.length, 3);
assert.equal(postaCalls.length, 3);

const secureRows = new Map();
const mockDb = {
  prepare(sql) {
    const statement = {
      args: [],
      bind(...args) {
        this.args = args;
        return this;
      },
      async run() {
        if (sql.includes("INSERT INTO hub_secure_integrations")) {
          secureRows.set(this.args[0], {
            encrypted_value: this.args[1],
            iv: this.args[2],
          });
        }
        return { success: true };
      },
      async first() {
        return secureRows.get(this.args[0]) || null;
      },
    };
    return statement;
  },
};

globalThis.fetch = async (url, init = {}) => {
  const parsed = new URL(String(url));
  if (parsed.hostname === "example.supabase.co" && parsed.pathname === "/auth/v1/user") {
    return Response.json({ id: "user-id", email: "dellibano@me.com" });
  }
  if (parsed.hostname === "example.supabase.co" && parsed.pathname === "/rest/v1/hub_profiles") {
    return Response.json([{
      user_id: "user-id",
      email: "dellibano@me.com",
      full_name: "Salvatore Del Libano",
      role: "ceo",
      active: true,
      ecosystem_keys: [],
    }]);
  }
  if (parsed.hostname === "posta.supabase.co" && parsed.pathname === "/rest/v1/pratiche") {
    assert.equal(init.headers.apikey, "stored-posta-service-key-that-is-valid");
    return Response.json([]);
  }
  throw new Error(`Unexpected secure configuration URL: ${url}`);
};

const protectedPostaEnv = {
  ...env,
  DB: mockDb,
  POSTA_SUPABASE_URL: "https://posta.supabase.co",
  POSTA_CONFIG_ENCRYPTION_KEY: "01".repeat(32),
};
const configurePostaResponse = await worker.fetch(
  new Request("https://hub.example/api/v1/ecosystems/posta/configure", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer access-token",
    },
    body: JSON.stringify({ service_key: "stored-posta-service-key-that-is-valid" }),
  }),
  protectedPostaEnv,
);
assert.equal(configurePostaResponse.status, 200);
assert.deepEqual(await configurePostaResponse.json(), { configured: true, verified: true });
assert.equal(secureRows.has("eccomi-posta-supabase"), true);
assert.notEqual(secureRows.get("eccomi-posta-supabase").encrypted_value, "stored-posta-service-key-that-is-valid");

const storedPostaResponse = await worker.fetch(
  new Request("https://hub.example/api/v1/ecosystems/posta/summary", {
    headers: { Authorization: "Bearer access-token" },
  }),
  protectedPostaEnv,
);
assert.equal(storedPostaResponse.status, 200);
assert.equal((await storedPostaResponse.json()).safe_read_only, true);

const noleggioPayload = {
  source: "eccomi-noleggio-d1",
  safe_read_only: true,
  generated_at: "2026-07-26T20:00:00.000Z",
  summary: {
    promotions_total: 2,
    pending_approval: 1,
    approved: 0,
    active: 1,
    expiring: 0,
    expired: 0,
    leads_total: 3,
    new_leads: 1,
    working_leads: 1,
    contracts: 1,
    commission_cents: 25000,
  },
  recent: [{
    id: "event-1",
    event_type: "PROMOTION_PUBLISHED",
    title: "KIA Picanto pubblicata online",
    created_at: "2026-07-26T19:55:00.000Z",
  }],
};

let noleggioStep = 0;
globalThis.fetch = async (url, init = {}) => {
  noleggioStep += 1;
  const parsed = new URL(String(url));

  if (parsed.hostname === "example.supabase.co" && parsed.pathname === "/auth/v1/user") {
    return Response.json({ id: "user-id", email: "dellibano@me.com" });
  }
  if (parsed.hostname === "example.supabase.co" && parsed.pathname === "/rest/v1/hub_profiles") {
    return Response.json([{
      user_id: "user-id",
      email: "dellibano@me.com",
      full_name: "Salvatore Del Libano",
      role: "ceo",
      active: true,
      ecosystem_keys: [],
    }]);
  }
  if (parsed.hostname === "eccomi-noleggio.example" && parsed.pathname === "/api/internal/hub-summary") {
    assert.equal(init.headers.Authorization, "Bearer noleggio-read-secret");
    return Response.json(noleggioPayload);
  }
  throw new Error(`Unexpected Eccomi Noleggio URL: ${url}`);
};

const noleggioResponse = await worker.fetch(
  new Request("https://hub.example/api/v1/ecosystems/noleggio/summary", {
    headers: { Authorization: "Bearer access-token" },
  }),
  {
    ...env,
    NOLEGGIO_API_URL: "https://eccomi-noleggio.example/",
    NOLEGGIO_HUB_READ_SECRET: "noleggio-read-secret",
  },
);

assert.equal(noleggioResponse.status, 200);
assert.deepEqual(await noleggioResponse.json(), noleggioPayload);
assert.equal(noleggioStep, 3);

console.log("ECCOMI HUB auth, governance and protected Posta/Noleggio read-only checks passed.");
