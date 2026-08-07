const STORAGE_KEY = "eccomi-hub-manager-delegations-v1";

type Delegation = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

const defaults: Delegation[] = [
  { id: "offers", label: "Gestione offerte", description: "Caricare, modificare e portare avanti le offerte di Eccomi Noleggio.", enabled: true },
  { id: "approve", label: "Approvazione offerte", description: "Approvare le offerte complete prima della pubblicazione.", enabled: false },
  { id: "publish", label: "Pubblicazione offerte", description: "Pubblicare le promozioni approvate nel canale operativo.", enabled: false },
  { id: "leads", label: "Gestione lead", description: "Aprire, lavorare e aggiornare i contatti commerciali.", enabled: true },
  { id: "archive", label: "Archiviazione pratiche", description: "Chiudere e archiviare le attività concluse.", enabled: true },
];

function readState(): Delegation[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as Record<string, boolean> | null;
    if (!saved) return defaults;
    return defaults.map((item) => ({ ...item, enabled: typeof saved[item.id] === "boolean" ? saved[item.id] : item.enabled }));
  } catch {
    return defaults;
  }
}

function saveState(items: Delegation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(items.map((item) => [item.id, item.enabled]))));
}

function installStyles() {
  if (document.getElementById("eccomi-delegation-controls-style")) return;
  const style = document.createElement("style");
  style.id = "eccomi-delegation-controls-style";
  style.textContent = `
    .ec-delegation-controls{margin-top:16px;display:grid;gap:10px}
    .ec-delegation-intro{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:12px 14px;background:#eef7ff;border:1px solid #cfe4f5;border-radius:14px;color:#31516e}
    .ec-delegation-intro strong{display:block;color:#173e63;margin-bottom:2px}.ec-delegation-intro small{display:block;line-height:1.35}
    .ec-delegation-count{white-space:nowrap;font-weight:900;color:#0c5597}
    .ec-delegation-row{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;padding:14px;border:1px solid #dce7f0;border-radius:14px;background:#fff}
    .ec-delegation-row strong{display:block;color:#102b48;font-size:15px}.ec-delegation-row small{display:block;color:#74859a;margin-top:4px;line-height:1.35}
    .ec-switch{width:54px;height:30px;border:0;border-radius:999px;background:#cbd7e2;padding:3px;cursor:pointer;transition:.2s;position:relative}
    .ec-switch span{display:block;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.18);transition:.2s}
    .ec-switch.on{background:#18a765}.ec-switch.on span{transform:translateX(24px)}
    .ec-switch:focus-visible{outline:3px solid rgba(12,85,151,.25);outline-offset:2px}
    .ec-delegation-state{font-size:12px;font-weight:900;margin-top:5px;text-align:center;color:#7b8794}.ec-delegation-state.on{color:#087443}
    @media(max-width:600px){.ec-delegation-intro{align-items:flex-start;flex-direction:column}.ec-delegation-row{grid-template-columns:1fr auto}}
  `;
  document.head.appendChild(style);
}

function render(section: HTMLElement) {
  if (section.dataset.delegationControls === "ready") return;
  section.dataset.delegationControls = "ready";
  const empty = section.querySelector<HTMLElement>(".team-delegation-empty");
  if (!empty) return;

  let items = readState();
  empty.style.display = "none";
  const host = document.createElement("div");
  host.className = "ec-delegation-controls";
  section.appendChild(host);

  const draw = () => {
    const active = items.filter((item) => item.enabled).length;
    host.innerHTML = `
      <div class="ec-delegation-intro">
        <span><strong>Autorizzazioni del Responsabile</strong><small>Dal CEO puoi attivare o disattivare ogni delega con un solo comando.</small></span>
        <span class="ec-delegation-count">${active}/${items.length} attive</span>
      </div>
      ${items.map((item) => `
        <div class="ec-delegation-row" data-delegation-id="${item.id}">
          <span><strong>${item.label}</strong><small>${item.description}</small></span>
          <span>
            <button class="ec-switch ${item.enabled ? "on" : ""}" type="button" role="switch" aria-checked="${item.enabled}" aria-label="${item.enabled ? "Disattiva" : "Attiva"} ${item.label}"><span></span></button>
            <div class="ec-delegation-state ${item.enabled ? "on" : ""}">${item.enabled ? "ON" : "OFF"}</div>
          </span>
        </div>`).join("")}
    `;

    host.querySelectorAll<HTMLElement>("[data-delegation-id]").forEach((row) => {
      const id = row.dataset.delegationId;
      const button = row.querySelector<HTMLButtonElement>(".ec-switch");
      if (!id || !button) return;
      button.addEventListener("click", () => {
        items = items.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item);
        saveState(items);
        draw();
      });
    });
  };
  draw();
}

function scan() {
  installStyles();
  const section = document.getElementById("team-real-delegations");
  if (section instanceof HTMLElement) render(section);
}

const observer = new MutationObserver(scan);
observer.observe(document.documentElement, { childList: true, subtree: true });
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan, { once: true });
else scan();
