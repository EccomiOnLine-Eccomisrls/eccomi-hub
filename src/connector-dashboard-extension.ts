import { ecosystemRegistry } from "./ecosystems/registry";

type ConnectorState = "ready" | "planned" | "connecting" | "error";

const HOST_ID = "eccomi-connector-dashboard";
let lastMarkup = "";

function findLiveEcosystemCount(): number {
  const snapshot = document.getElementById("executive-section-snapshot");
  if (!snapshot) return 0;

  const cards = Array.from(snapshot.querySelectorAll<HTMLElement>("button, article, div"));
  const card = cards.find((element) =>
    (element.textContent || "").toLowerCase().includes("ecosistemi collegati"),
  );
  if (!card) return 0;

  const match = (card.textContent || "").match(/\b(\d+)\b/);
  return match ? Number(match[1]) : 0;
}

function dashboardVisible(): boolean {
  return Boolean(
    document.getElementById("executive-section-snapshot") &&
    document.querySelector(".os2-morning-hero"),
  );
}

function connectorState(key: string, liveCount: number): ConnectorState {
  if (key === "posta" || key === "noleggio") {
    return liveCount >= 2 ? "ready" : "error";
  }

  const definition = ecosystemRegistry.find((item) => item.key === key);
  if (definition?.lifecycle === "connecting") return "connecting";
  return "planned";
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
  if (!hero) return;

  const anchor = hero.parentElement;
  if (!anchor) return;

  let host = current;
  if (!host) {
    host = document.createElement("section");
    host.id = HOST_ID;
    host.className = "connector-dashboard";
    anchor.insertAdjacentElement("afterend", host);
  }

  const liveCount = findLiveEcosystemCount();
  const connected = ecosystemRegistry.filter(
    (definition) => connectorState(definition.key, liveCount) === "ready",
  ).length;
  const pending = ecosystemRegistry.length - connected;

  const markup = `
    <div class="connector-dashboard__head">
      <div>
        <small>ECCOMI ECOSYSTEM CONNECTOR</small>
        <strong>Collegamenti dell'ecosistema</strong>
        <p>Solo collegamenti realmente disponibili. Nessun KPI viene simulato.</p>
      </div>
      <div class="connector-dashboard__summary">
        <span><b>${connected}</b> collegati</span>
        <span><b>${pending}</b> da completare</span>
      </div>
    </div>
    <div class="connector-dashboard__grid">
      ${ecosystemRegistry.map((definition) => {
        const state = connectorState(definition.key, liveCount);
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

window.addEventListener("focus", render);
window.addEventListener("pageshow", render);
window.setInterval(render, 5_000);
window.setTimeout(render, 250);
window.setTimeout(render, 1_000);
