import { ecosystemRegistry } from "./ecosystems/registry";

type HubSession = {
  accessToken?: string;
  access_token?: string;
  user?: { role?: string };
};

type ConnectorState = "ready" | "loading" | "error" | "planned" | "connecting";

const HOST_ID = "eccomi-connector-dashboard";
let loading = false;
let lastToken = "";
let states: Record<string, ConnectorState> = {};
let lastMarkup = "";

function apiBaseUrl(): string {
  const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
  const env = meta.env || {};
  return String(env.VITE_HUB_API_URL || env.VITE_HUB_API_BASE_URL || "https://eccomi-hub.onrender.com").replace(/\/$/, "");
}

function readSession(): { token: string; role: string } {
  try {
    const session = JSON.parse(localStorage.getItem("eccomi-hub-session") || "") as HubSession;
    return {
      token: String(session.accessToken || session.access_token || ""),
      role: String(session.user?.role || ""),
    };
  } catch {
    return { token: "", role: "" };
  }
}

function dashboardVisible(): boolean {
  const text = document.body.textContent || "";
  return text.includes("Priorità del CEO") && text.includes("Ecosistemi collegati");
}

async function checkConnector(key: string, endpoint: string, token: string): Promise<void> {
  states[key] = "loading";
  try {
    const response = await fetch(`${apiBaseUrl()}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    states[key] = response.ok ? "ready" : "error";
  } catch {
    states[key] = "error";
  }
}

async function loadStates(token: string): Promise<void> {
  if (loading) return;
  loading = true;
  try {
    states = {};
    for (const definition of ecosystemRegistry) {
      if (definition.summaryEndpoint) states[definition.key] = "loading";
      else states[definition.key] = definition.lifecycle === "connecting" ? "connecting" : "planned";
    }

    await Promise.all(
      ecosystemRegistry
        .filter((definition) => Boolean(definition.summaryEndpoint))
        .map((definition) => checkConnector(definition.key, definition.summaryEndpoint!, token)),
    );
    lastToken = token;
  } finally {
    loading = false;
  }
}

function stateLabel(state: ConnectorState): string {
  if (state === "ready") return "Collegato";
  if (state === "loading") return "Verifica…";
  if (state === "error") return "Da verificare";
  if (state === "connecting") return "Da collegare";
  return "Pianificato";
}

function stateClass(state: ConnectorState): string {
  if (state === "ready") return "ready";
  if (state === "error") return "error";
  if (state === "loading") return "loading";
  return "planned";
}

function buildMarkup(): string {
  const connected = ecosystemRegistry.filter((definition) => states[definition.key] === "ready").length;
  const pending = ecosystemRegistry.length - connected;

  return `
    <div class="connector-dashboard__head">
      <div>
        <small>ECCOMI ECOSYSTEM CONNECTOR</small>
        <strong>Collegamenti dell'ecosistema</strong>
        <p>Solo dati realmente disponibili. Nessun KPI viene simulato.</p>
      </div>
      <div class="connector-dashboard__summary">
        <span><b>${connected}</b> collegati</span>
        <span><b>${pending}</b> da completare</span>
      </div>
    </div>
    <div class="connector-dashboard__grid">
      ${ecosystemRegistry.map((definition) => {
        const state = states[definition.key] || (definition.summaryEndpoint ? "loading" : "planned");
        return `<article class="connector-dashboard__item">
          <span class="connector-dashboard__dot connector-dashboard__dot--${stateClass(state)}"></span>
          <div>
            <strong>${definition.name}</strong>
            <small>${definition.description}</small>
          </div>
          <em class="connector-dashboard__badge connector-dashboard__badge--${stateClass(state)}">${stateLabel(state)}</em>
        </article>`;
      }).join("")}
    </div>
  `;
}

function render(): void {
  const current = document.getElementById(HOST_ID);
  if (!dashboardVisible()) {
    current?.remove();
    lastMarkup = "";
    return;
  }

  const { token, role } = readSession();
  if (!token || role !== "ceo") {
    current?.remove();
    lastMarkup = "";
    return;
  }

  const anchor = document.querySelector<HTMLElement>(".os2-primary-kpis");
  if (!anchor) return;

  let host = current;
  if (!host) {
    host = document.createElement("section");
    host.id = HOST_ID;
    host.className = "connector-dashboard";
    anchor.insertAdjacentElement("afterend", host);
  }

  const markup = buildMarkup();
  if (markup !== lastMarkup) {
    host.innerHTML = markup;
    lastMarkup = markup;
  }
}

async function scan(forceReload = false): Promise<void> {
  const { token, role } = readSession();
  if (!dashboardVisible() || !token || role !== "ceo") {
    document.getElementById(HOST_ID)?.remove();
    lastMarkup = "";
    return;
  }

  if (forceReload || token !== lastToken || Object.keys(states).length === 0) {
    await loadStates(token);
  }
  render();
}

window.addEventListener("focus", () => {
  void scan(true);
});
window.addEventListener("popstate", () => {
  void scan();
});
window.setInterval(() => {
  void scan();
}, 15_000);
window.setTimeout(() => {
  void scan();
}, 500);
