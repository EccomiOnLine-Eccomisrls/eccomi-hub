import { ecosystemRegistry } from "./ecosystems/registry";

type ConnectorState = "ready" | "planned" | "connecting" | "error";
type HubSession = { accessToken?: string; access_token?: string };

const HOST_ID = "eccomi-connector-dashboard";
const API_URL = String(import.meta.env.VITE_HUB_API_URL || import.meta.env.VITE_HUB_API_BASE_URL || "https://eccomi-hub.onrender.com").replace(/\/$/, "");
const verifiedStates = new Map<string, ConnectorState>();
let lastMarkup = "";
let verifying = false;

function sessionToken(): string {
  for (const key of ["eccomi-hub-session", "hub_session", "eccomi_session", "session"]) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "") as HubSession;
      const token = parsed.accessToken || parsed.access_token;
      if (token) return token;
    } catch {}
  }
  for (let i = 0; i < localStorage.length; i += 1) {
    try {
      const parsed = JSON.parse(localStorage.getItem(localStorage.key(i) || "") || "") as HubSession;
      const token = parsed.accessToken || parsed.access_token;
      if (token) return token;
    } catch {}
  }
  return "";
}

function dashboardVisible(): boolean {
  return Boolean(
    document.getElementById("executive-section-snapshot") &&
    document.querySelector(".os2-morning-hero"),
  );
}

function defaultState(key: string): ConnectorState {
  const definition = ecosystemRegistry.find((item) => item.key === key);
  if (definition?.summaryEndpoint) return verifiedStates.get(key) || "connecting";
  if (definition?.lifecycle === "connecting") return "connecting";
  return "planned";
}

async function verifyOperationalConnectors(): Promise<void> {
  if (verifying) return;
  const token = sessionToken();
  if (!token) {
    ecosystemRegistry.filter((item) => item.summaryEndpoint).forEach((item) => verifiedStates.set(item.key, "error"));
    render();
    return;
  }

  verifying = true;
  try {
    await Promise.all(ecosystemRegistry.filter((item) => item.summaryEndpoint).map(async (definition) => {
      verifiedStates.set(definition.key, "connecting");
      try {
        const response = await fetch(`${API_URL}${definition.summaryEndpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await response.json();
        verifiedStates.set(definition.key, "ready");
      } catch {
        verifiedStates.set(definition.key, "error");
      }
    }));
  } finally {
    verifying = false;
    render();
  }
}

function stateLabel(state: ConnectorState): string {
  if (state === "ready") return "Collegato";
  if (state === "error") return "Da verificare";
  if (state === "connecting") return "Da collegare";
  return "Pianificato";
}

function stateClass(state: ConnectorState): string {
  if (state === "ready") return "ready";
  if (state === "error") return "error";
  if (state === "connecting") return "loading";
  return "planned";
}

function render(): void {
  const current = document.getElementById(HOST_ID);
  if (!dashboardVisible()) {
    current?.remove();
    lastMarkup = "";
    return;
  }

  const hero = document.querySelector<HTMLElement>(".os2-morning-hero");
  if (!hero?.parentElement) return;

  let host = current;
  if (!host) {
    host = document.createElement("section");
    host.id = HOST_ID;
    host.className = "connector-dashboard";
    hero.parentElement.insertAdjacentElement("afterend", host);
  }

  const connected = ecosystemRegistry.filter((definition) => defaultState(definition.key) === "ready").length;
  const pending = ecosystemRegistry.length - connected;

  const markup = `
    <div class="connector-dashboard__head">
      <div>
        <small>ECCOMI ECOSYSTEM CONNECTOR</small>
        <strong>Collegamenti dell'ecosistema</strong>
        <p>Solo collegamenti verificati realmente. Nessun KPI viene simulato.</p>
      </div>
      <div class="connector-dashboard__summary">
        <span><b>${connected}</b> collegati</span>
        <span><b>${pending}</b> da completare</span>
      </div>
    </div>
    <div class="connector-dashboard__grid">
      ${ecosystemRegistry.map((definition) => {
        const state = defaultState(definition.key);
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

  if (markup !== lastMarkup) {
    host.innerHTML = markup;
    lastMarkup = markup;
  }
}

function refresh(): void {
  render();
  void verifyOperationalConnectors();
}

window.addEventListener("focus", refresh);
window.addEventListener("pageshow", refresh);
window.setInterval(refresh, 30_000);
window.setTimeout(refresh, 250);
window.setTimeout(refresh, 1_000);
