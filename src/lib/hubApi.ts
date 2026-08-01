export type HubUser = {
  id: string;
  email: string;
  fullName: string;
  role: "ceo" | "manager" | "operator";
};

export type HubSession = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt?: number;
  user: HubUser;
};

export type HubEntryKind = "ecosistema" | "servizio" | "progetto" | "idea";

export type HubEntryStatus =
  | "Da valutare"
  | "Valutazione"
  | "Approvato"
  | "Progettazione"
  | "Test"
  | "Operativo"
  | "Sospeso"
  | "Chiuso"
  | "Archiviato";

export type HubEntryInput = {
  entryType: HubEntryKind;
  name: string;
  customerNeed: string;
  objective: string;
  dnaLink: string;
  revenueModel: string;
  expectedCosts: number;
  responsible: string;
  timeHorizonDays: number;
  risks: string;
};

export type HubEntry = HubEntryInput & {
  id: string;
  status: HubEntryStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type HubEvaluationDecision =
  | "Da decidere"
  | "Dettagli richiesti"
  | "Approvato"
  | "Sospeso";

export type HubEvaluation = {
  entryId: string;
  needScore: number;
  dnaScore: number;
  revenueScore: number;
  feasibilityScore: number;
  riskControlScore: number;
  totalScore: number;
  trafficLight: "Verde" | "Giallo" | "Rosso";
  strengths: string[];
  criticalities: string[];
  conditions: string[];
  analysisSource: "hub_rules" | "openai";
  analysisModel?: string;
  decisionState: HubEvaluationDecision;
  decisionNote?: string;
  evaluatedAt: string;
  updatedAt: string;
};

export type HubPlanningTaskStatus = "Da fare" | "In corso" | "Completata" | "Bloccata";

export type HubPlanningTask = {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: HubPlanningTaskStatus;
};

export type HubPlanningKpi = {
  id: string;
  name: string;
  target: string;
};

export type HubPlanningCondition = {
  id: string;
  text: string;
  met: boolean;
};

export type HubProjectPlanInput = {
  objective: string;
  owner: string;
  startDate: string;
  targetDate: string;
  budget: number;
  tasks: HubPlanningTask[];
  kpis: HubPlanningKpi[];
  conditions: HubPlanningCondition[];
};

export type HubProjectPlan = HubProjectPlanInput & {
  entryId: string;
  planState: "Attivo" | "Pronto per il test" | "In test";
  plannedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type PostaRecentPractice = {
  id: string;
  orderName: string;
  service: string;
  status: string;
  lastEvent: string;
  createdAt: string;
  updatedAt: string;
};

export type PostaSummary = {
  source: string;
  safeReadOnly: boolean;
  generatedAt: string;
  sampleLimited: boolean;
  summary: {
    total: number;
    open: number;
    completed: number;
    sent: number;
    errors: number;
    manual: number;
    createdToday: number;
  };
  byService: Record<string, number>;
  recent: PostaRecentPractice[];
};

export type NoleggioRecentEvent = {
  id: string;
  eventType: string;
  title: string;
  createdAt: string;
};

export type NoleggioPipeline = {
  quotationsNew: number;
  aiReview: number;
  pendingApproval: number;
  published: number;
  leadsNew: number;
  leadsWorking: number;
  contracts: number;
  deliveries: number;
  archived: number;
};

export type NoleggioAlert = {
  type: string;
  title: string;
};

export type NoleggioSummary = {
  source: string;
  safeReadOnly: boolean;
  generatedAt: string;
  summary: {
    promotionsTotal: number;
    pendingApproval: number;
    approved: number;
    active: number;
    expiring: number;
    expired: number;
    leadsTotal: number;
    newLeads: number;
    workingLeads: number;
    contracts: number;
    commissionCents: number;
  };
  pipeline: NoleggioPipeline;
  alerts: NoleggioAlert[];
  recent: NoleggioRecentEvent[];
};

type ApiErrorPayload = {
  detail?: string;
  message?: string;
};

type HubApiEnv = ImportMetaEnv & Record<string, string | undefined>;

function getConfiguredHubApiBaseUrl(): string {
  const env = import.meta.env as HubApiEnv;
  const rawBaseUrl = [env.VITE_HUB_API_BASE_URL, env.HUB_API_BASE_URL]
    .find((value): value is string => Boolean(value && value.trim()))
    ?.trim();

  return rawBaseUrl ? rawBaseUrl.replace(/\/+$/, "") : "";
}

function buildHubApiUrl(path: string): string {
  const baseUrl = getConfiguredHubApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!baseUrl) {
    return normalizedPath;
  }

  return `${baseUrl}${normalizedPath}`;
}

export class HubApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HubApiError";
    this.status = status;
  }
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;

  try {
    const url = buildHubApiUrl(path);

    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } catch {
    throw new HubApiError("Il collegamento sicuro a ECCOMI HUB non è ancora disponibile.", 0);
  }

  const payload = (await response.json().catch(() => ({}))) as T & ApiErrorPayload;

  if (!response.ok) {
    const fallback = response.status === 503
      ? "Il collegamento reale è in preparazione. Riprova tra poco."
      : "Non è stato possibile completare la richiesta. Riprova tra poco.";
    throw new HubApiError(payload.detail || payload.message || fallback, response.status);
  }

  return payload;
}

export async function requestLoginCode(email: string): Promise<void> {
  await apiRequest<{ accepted: boolean }>("/v1/auth/request-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

type HubSessionPayload = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: HubUser["role"];
  };
};

function mapHubSession(payload: HubSessionPayload): HubSession {
  const expiresAt = Number(payload.expires_at);
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresIn: payload.expires_in,
    expiresAt: Number.isFinite(expiresAt)
      ? expiresAt
      : Math.floor(Date.now() / 1000) + payload.expires_in,
    user: {
      id: payload.user.id,
      email: payload.user.email,
      fullName: payload.user.full_name,
      role: payload.user.role,
    },
  };
}

export async function verifyLoginCode(email: string, code: string): Promise<HubSession> {
  const payload = await apiRequest<HubSessionPayload>("/v1/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });

  return mapHubSession(payload);
}

export async function refreshLoginSession(refreshToken: string): Promise<HubSession> {
  const payload = await apiRequest<HubSessionPayload>("/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  return mapHubSession(payload);
}

type PostaSummaryPayload = {
  source: string;
  safe_read_only: boolean;
  generated_at: string;
  sample_limited: boolean;
  summary: {
    total: number;
    open: number;
    completed: number;
    sent: number;
    errors: number;
    manual: number;
    created_today: number;
  };
  by_service: Record<string, number>;
  recent: Array<{
    id: string;
    order_name: string;
    service: string;
    status: string;
    last_event: string;
    created_at: string;
    updated_at: string;
  }>;
};

export async function getPostaSummary(accessToken: string): Promise<PostaSummary> {
  const payload = await apiRequest<PostaSummaryPayload>("/v1/ecosystems/posta/summary", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!payload?.summary || payload.safe_read_only !== true) {
    throw new HubApiError("Il collegamento dati di Eccomi Posta non è ancora disponibile.", 502);
  }

  return {
    source: payload.source,
    safeReadOnly: Boolean(payload.safe_read_only),
    generatedAt: payload.generated_at,
    sampleLimited: Boolean(payload.sample_limited),
    summary: {
      total: Number(payload.summary?.total || 0),
      open: Number(payload.summary?.open || 0),
      completed: Number(payload.summary?.completed || 0),
      sent: Number(payload.summary?.sent || 0),
      errors: Number(payload.summary?.errors || 0),
      manual: Number(payload.summary?.manual || 0),
      createdToday: Number(payload.summary?.created_today || 0),
    },
    byService: payload.by_service || {},
    recent: Array.isArray(payload.recent)
      ? payload.recent.map((practice) => ({
        id: practice.id,
        orderName: practice.order_name,
        service: practice.service,
        status: practice.status,
        lastEvent: practice.last_event,
        createdAt: practice.created_at,
        updatedAt: practice.updated_at,
      }))
      : [],
  };
}

export async function configurePostaConnection(accessToken: string, serviceKey: string): Promise<void> {
  await apiRequest<{ configured: boolean; verified: boolean }>("/v1/ecosystems/posta/configure", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ service_key: serviceKey }),
  });
}

type NoleggioSummaryPayload = {
  source: string;
  safe_read_only: boolean;
  generated_at: string;
  summary: {
    promotions_total: number;
    pending_approval: number;
    approved: number;
    active: number;
    expiring: number;
    expired: number;
    leads_total: number;
    new_leads: number;
    working_leads: number;
    contracts: number;
    commission_cents: number;
  };
  pipeline?: {
    quotations_new: number;
    ai_review: number;
    pending_approval: number;
    published: number;
    leads_new: number;
    leads_working: number;
    contracts: number;
    deliveries: number;
    archived: number;
  };
  alerts?: Array<{
    type: string;
    title: string;
  }>;
  recent: Array<{
    id: string;
    event_type: string;
    title: string;
    created_at: string;
  }>;
};

export async function getNoleggioSummary(accessToken: string): Promise<NoleggioSummary> {
  const payload = await apiRequest<NoleggioSummaryPayload>("/v1/ecosystems/noleggio/summary", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!payload?.summary || payload.safe_read_only !== true) {
    throw new HubApiError("Il collegamento dati di Eccomi Noleggio non è ancora disponibile.", 502);
  }

  return {
    source: payload.source,
    safeReadOnly: Boolean(payload.safe_read_only),
    generatedAt: payload.generated_at,
    summary: {
      promotionsTotal: Number(payload.summary.promotions_total || 0),
      pendingApproval: Number(payload.summary.pending_approval || 0),
      approved: Number(payload.summary.approved || 0),
      active: Number(payload.summary.active || 0),
      expiring: Number(payload.summary.expiring || 0),
      expired: Number(payload.summary.expired || 0),
      leadsTotal: Number(payload.summary.leads_total || 0),
      newLeads: Number(payload.summary.new_leads || 0),
      workingLeads: Number(payload.summary.working_leads || 0),
      contracts: Number(payload.summary.contracts || 0),
      commissionCents: Number(payload.summary.commission_cents || 0),
    },
    pipeline: {
      quotationsNew: Number(payload.pipeline?.quotations_new || 0),
      aiReview: Number(payload.pipeline?.ai_review || 0),
      pendingApproval: Number(payload.pipeline?.pending_approval || 0),
      published: Number(payload.pipeline?.published || 0),
      leadsNew: Number(payload.pipeline?.leads_new || 0),
      leadsWorking: Number(payload.pipeline?.leads_working || 0),
      contracts: Number(payload.pipeline?.contracts || 0),
      deliveries: Number(payload.pipeline?.deliveries || 0),
      archived: Number(payload.pipeline?.archived || 0),
    },
    alerts: Array.isArray(payload.alerts)
      ? payload.alerts.map((alert) => ({
        type: String(alert.type || "info"),
        title: String(alert.title || ""),
      }))
      : [],
    recent: Array.isArray(payload.recent)
      ? payload.recent.map((event) => ({
        id: event.id,
        eventType: event.event_type,
        title: event.title,
        createdAt: event.created_at,
      }))
      : [],
  };
}

type HubEntryPayload = {
  id: string;
  entry_type: HubEntryKind;
  name: string;
  customer_need: string;
  objective: string;
  dna_link: string;
  revenue_model: string;
  expected_costs: number | string;
  responsible: string;
  time_horizon_days: number;
  risks: string;
  status: HubEntryStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type HubEvaluationPayload = {
  entry_id: string;
  need_score: number;
  dna_score: number;
  revenue_score: number;
  feasibility_score: number;
  risk_control_score: number;
  total_score: number;
  traffic_light: HubEvaluation["trafficLight"];
  strengths: string[];
  criticalities: string[];
  conditions: string[];
  analysis_source: HubEvaluation["analysisSource"];
  analysis_model?: string | null;
  decision_state: HubEvaluationDecision;
  decision_note?: string | null;
  evaluated_at: string;
  updated_at: string;
};

type HubProjectPlanPayload = {
  entry_id: string;
  objective: string;
  owner: string;
  start_date: string;
  target_date: string;
  budget: number | string;
  tasks: Array<{
    id: string;
    title: string;
    owner: string;
    dueDate?: string;
    due_date?: string;
    status: HubPlanningTaskStatus;
  }>;
  kpis: HubPlanningKpi[];
  conditions: HubPlanningCondition[];
  plan_state: HubProjectPlan["planState"];
  planned_by: string;
  created_at: string;
  updated_at: string;
};

function mapHubEntry(entry: HubEntryPayload): HubEntry {
  return {
    id: entry.id,
    entryType: entry.entry_type,
    name: entry.name,
    customerNeed: entry.customer_need,
    objective: entry.objective,
    dnaLink: entry.dna_link,
    revenueModel: entry.revenue_model,
    expectedCosts: Number(entry.expected_costs),
    responsible: entry.responsible,
    timeHorizonDays: entry.time_horizon_days,
    risks: entry.risks,
    status: entry.status,
    createdBy: entry.created_by,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  };
}

function mapHubEvaluation(evaluation: HubEvaluationPayload): HubEvaluation {
  return {
    entryId: evaluation.entry_id,
    needScore: Number(evaluation.need_score),
    dnaScore: Number(evaluation.dna_score),
    revenueScore: Number(evaluation.revenue_score),
    feasibilityScore: Number(evaluation.feasibility_score),
    riskControlScore: Number(evaluation.risk_control_score),
    totalScore: Number(evaluation.total_score),
    trafficLight: evaluation.traffic_light,
    strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
    criticalities: Array.isArray(evaluation.criticalities) ? evaluation.criticalities : [],
    conditions: Array.isArray(evaluation.conditions) ? evaluation.conditions : [],
    analysisSource: evaluation.analysis_source,
    analysisModel: evaluation.analysis_model || undefined,
    decisionState: evaluation.decision_state,
    decisionNote: evaluation.decision_note || undefined,
    evaluatedAt: evaluation.evaluated_at,
    updatedAt: evaluation.updated_at,
  };
}

function mapHubProjectPlan(plan: HubProjectPlanPayload): HubProjectPlan {
  return {
    entryId: plan.entry_id,
    objective: plan.objective,
    owner: plan.owner,
    startDate: plan.start_date,
    targetDate: plan.target_date,
    budget: Number(plan.budget),
    tasks: Array.isArray(plan.tasks)
      ? plan.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        owner: task.owner,
        dueDate: task.dueDate || task.due_date || "",
        status: task.status,
      }))
      : [],
    kpis: Array.isArray(plan.kpis) ? plan.kpis : [],
    conditions: Array.isArray(plan.conditions) ? plan.conditions : [],
    planState: plan.plan_state,
    plannedBy: plan.planned_by,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
  };
}

export async function listHubEntries(accessToken: string): Promise<HubEntry[]> {
  const payload = await apiRequest<{ entries: HubEntryPayload[] }>("/v1/entries", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return payload.entries.map(mapHubEntry);
}

export async function createHubEntry(accessToken: string, input: HubEntryInput): Promise<HubEntry> {
  const payload = await apiRequest<{ entry: HubEntryPayload }>("/v1/entries", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });

  return mapHubEntry(payload.entry);
}

export async function advanceHubEntryToEvaluation(accessToken: string, entryId: string): Promise<HubEntry> {
  const payload = await apiRequest<{ entry: HubEntryPayload }>(
    `/v1/entries/${encodeURIComponent(entryId)}/advance`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({}),
    },
  );

  return mapHubEntry(payload.entry);
}

export async function generateHubEvaluation(accessToken: string, entryId: string): Promise<HubEvaluation> {
  const payload = await apiRequest<{ evaluation: HubEvaluationPayload }>(
    `/v1/entries/${encodeURIComponent(entryId)}/evaluation`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ action: "generate" }),
    },
  );

  return mapHubEvaluation(payload.evaluation);
}

export async function decideHubEvaluation(
  accessToken: string,
  entryId: string,
  action: "request_details" | "suspend" | "approve",
): Promise<{ entry: HubEntry; evaluation: HubEvaluation }> {
  const payload = await apiRequest<{
    entry: HubEntryPayload;
    evaluation: HubEvaluationPayload;
  }>(
    `/v1/entries/${encodeURIComponent(entryId)}/evaluation`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ action }),
    },
  );

  return {
    entry: mapHubEntry(payload.entry),
    evaluation: mapHubEvaluation(payload.evaluation),
  };
}

export async function getHubProjectPlan(
  accessToken: string,
  entryId: string,
): Promise<HubProjectPlan | null> {
  const payload = await apiRequest<{ plan: HubProjectPlanPayload | null }>(
    `/v1/entries/${encodeURIComponent(entryId)}/planning`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  return payload.plan ? mapHubProjectPlan(payload.plan) : null;
}

export async function saveHubProjectPlan(
  accessToken: string,
  entryId: string,
  input: HubProjectPlanInput,
): Promise<{ entry: HubEntry; plan: HubProjectPlan }> {
  const payload = await apiRequest<{
    entry: HubEntryPayload;
    plan: HubProjectPlanPayload;
  }>(
    `/v1/entries/${encodeURIComponent(entryId)}/planning`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ action: "save", plan: input }),
    },
  );

  return {
    entry: mapHubEntry(payload.entry),
    plan: mapHubProjectPlan(payload.plan),
  };
}

export async function advanceHubProjectToTest(
  accessToken: string,
  entryId: string,
): Promise<{ entry: HubEntry; plan: HubProjectPlan }> {
  const payload = await apiRequest<{
    entry: HubEntryPayload;
    plan: HubProjectPlanPayload;
  }>(
    `/v1/entries/${encodeURIComponent(entryId)}/planning`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ action: "advance_test" }),
    },
  );

  return {
    entry: mapHubEntry(payload.entry),
    plan: mapHubProjectPlan(payload.plan),
  };
}
