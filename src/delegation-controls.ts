type HubSession = { accessToken?: string; access_token?: string };
type Delegation = {
  id: string;
  label: string;
  description: string;
  functionText: string;
  dependsOn?: string[];
};
type DelegationState = { user_id: string; ecosystem_key: string; permissions: Record<string, boolean> };

const API_URL = String(import.meta.env.VITE_HUB_API_URL || "https://eccomi-hub.onrender.com").replace(/\/$/, "");

const definitions: Delegation[] = [
  { id: "offers", label: "Gestione offerte", description: "Gestione operativa dell'offerta prima della fase di approvazione.", functionText: "Consente di caricare, aprire, modificare e aggiornare le offerte di Eccomi Noleggio." },
  { id: "approve", label: "Approvazione offerte", description: "Validazione dell'offerta quando è completa e pronta per il passaggio successivo.", functionText: "Consente di approvare o respingere un'offerta dopo il controllo di condizioni, validità e completezza.", dependsOn: ["offers"] },
  { id: "publish", label: "Pubblicazione offerte", description: "Messa online di un'offerta già approvata.", functionText: "Consente di pubblicare nel canale operativo soltanto offerte che hanno già superato l'approvazione.", dependsOn: ["offers", "approve"] },
  { id: "leads", label: "Gestione lead", description: "Lavorazione commerciale dei contatti assegnati a Eccomi Noleggio.", functionText: "Consente di aprire i lead, aggiornarne lo stato, registrare attività e portarli avanti nel percorso commerciale." },
  { id: "negotiations", label: "Gestione trattative", description: "Gestione dell'avanzamento commerciale dopo il primo contatto.", functionText: "Consente di portare il lead da contatto a preventivo, trattativa ed esito, registrando i passaggi commerciali." },
  { id: "documents", label: "Gestione documenti cliente", description: "Accesso ai documenti necessari alla pratica.", functionText: "Consente di visualizzare e caricare i documenti richiesti per la pratica di noleggio." },
  { id: "cases", label: "Gestione pratiche e contratti", description: "Gestione della pratica dopo l'accettazione dell'offerta.", functionText: "Consente di seguire la pratica, aggiornare gli stati e gestire il percorso fino al contratto e alla consegna." },
  { id: "archive", label: "Archiviazione pratiche", description: "Chiusura amministrativa delle attività concluse.", functionText: "Consente di chiudere e archiviare pratiche terminate mantenendole nello storico.", dependsOn: ["cases"] },
  { id: "export", label: "Export dati", description: "Esportazione dei dati del proprio servizio.", functionText: "Consente di esportare offerte, lead e pratiche di Eccomi Noleggio secondo i dati disponibili." },
];

function token(): string {
  for (const key of ["eccomi-hub-session", "hub_session", "eccomi_session", "session"]) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "") as HubSession;
      if (parsed.accessToken || parsed.access_token) return parsed.accessToken || parsed.access_token || "";
    } catch {}
  }
  return "";
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = token();
  if (!auth) throw new Error("Sessione non disponibile. Accedi nuovamente.");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth}`, ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(payload.detail || "Operazione non riuscita."));
  return payload as T;
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
    .ec-delegation-function{margin-top:9px;padding-top:9px;border-top:1px solid #e7eef5;color:#31516e;font-size:12px;line-height:1.45}.ec-delegation-function b{color:#173e63}
    .ec-delegation-requirement{display:inline-flex;margin-top:8px;padding:5px 8px;border-radius:999px;background:#f3f6f9;color:#597087;font-size:11px;font-weight:800}
    .ec-switch{width:54px;height:30px;border:0;border-radius:999px;background:#cbd7e2;padding:3px;cursor:pointer;transition:.2s;position:relative}.ec-switch span{display:block;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.18);transition:.2s}.ec-switch.on{background:#18a765}.ec-switch.on span{transform:translateX(24px)}.ec-switch:disabled{opacity:.45;cursor:not-allowed}.ec-switch:focus-visible{outline:3px solid rgba(12,85,151,.25);outline-offset:2px}
    .ec-delegation-state{font-size:12px;font-weight:900;margin-top:5px;text-align:center;color:#7b8794}.ec-delegation-state.on{color:#087443}.ec-delegation-save{font-size:11px;color:#718197;text-align:right;margin-top:4px}.ec-delegation-error{padding:12px 14px;border-radius:12px;background:#fff0f0;border:1px solid #ffcaca;color:#9b2020;font-weight:750}
    @media(max-width:600px){.ec-delegation-intro{align-items:flex-start;flex-direction:column}.ec-delegation-row{grid-template-columns:1fr auto}}
  `;
  document.head.appendChild(style);
}

function managerUserId(section: HTMLElement): string {
  const owner = section.querySelector<HTMLElement>(".team-delegation-owner");
  const explicitUserId = String(owner?.dataset.userId || "").trim();
  if (explicitUserId) return explicitUserId;

  const ownerIdentity = owner?.querySelector<HTMLElement>("span")?.textContent || "";
  const ecId = ownerIdentity.split("·").pop()?.trim() || "";
  if (!ecId) return "";

  const card = Array.from(document.querySelectorAll<HTMLElement>(".manager-card[data-real-manager]"))
    .find((candidate) => (candidate.textContent || "").includes(ecId));
  return String(card?.dataset.realManager || "");
}

function dependencyLabels(ids: string[] | undefined): string {
  if (!ids?.length) return "";
  return ids.map((id) => definitions.find((item) => item.id === id)?.label || id).join(" + ");
}

function normalizeClient(permissions: Record<string, boolean>): Record<string, boolean> {
  const next = { ...permissions };
  if (!next.offers) { next.approve = false; next.publish = false; }
  if (!next.approve) next.publish = false;
  if (next.approve && !next.offers) next.approve = false;
  if (next.publish && (!next.offers || !next.approve)) next.publish = false;
  if (!next.cases) next.archive = false;
  if (next.archive && !next.cases) next.archive = false;
  return next;
}

async function render(section: HTMLElement) {
  if (section.dataset.delegationControls === "ready") return;
  section.dataset.delegationControls = "ready";
  const empty = section.querySelector<HTMLElement>(".team-delegation-empty");
  if (!empty) return;
  empty.style.display = "none";

  const userId = managerUserId(section);
  const host = document.createElement("div");
  host.className = "ec-delegation-controls";
  section.appendChild(host);

  if (!userId) {
    host.innerHTML = `<div class="ec-delegation-error">Responsabile non identificato. Aggiorna la pagina e riprova.</div>`;
    return;
  }

  let state: DelegationState;
  try {
    state = await api<DelegationState>(`/v1/team/responsibles/${encodeURIComponent(userId)}/delegations`);
  } catch (error) {
    host.innerHTML = `<div class="ec-delegation-error">${error instanceof Error ? error.message : "Deleghe non disponibili."}</div>`;
    return;
  }

  let permissions = normalizeClient(state.permissions || {});
  let saving = false;

  const save = async () => {
    saving = true;
    draw();
    try {
      state = await api<DelegationState>(`/v1/team/responsibles/${encodeURIComponent(userId)}/delegations`, {
        method: "PUT",
        body: JSON.stringify({ permissions }),
      });
      permissions = normalizeClient(state.permissions || {});
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Salvataggio deleghe non riuscito.");
    } finally {
      saving = false;
      draw();
    }
  };

  const draw = () => {
    const active = definitions.filter((item) => Boolean(permissions[item.id])).length;
    host.innerHTML = `
      <div class="ec-delegation-intro">
        <span><strong>Autorizzazioni del Responsabile</strong><small>Le deleghe sono salvate nell'HUB e rispettano le dipendenze operative definite dal CEO.</small></span>
        <span class="ec-delegation-count">${active}/${definitions.length} attive</span>
      </div>
      ${definitions.map((item) => {
        const enabled = Boolean(permissions[item.id]);
        const deps = item.dependsOn || [];
        const unmet = deps.some((id) => !permissions[id]);
        return `<div class="ec-delegation-row" data-delegation-id="${item.id}">
          <span>
            <strong>${item.label}</strong>
            <small>${item.description}</small>
            <div class="ec-delegation-function"><b>Funzione:</b> ${item.functionText}</div>
            ${deps.length ? `<span class="ec-delegation-requirement">Richiede: ${dependencyLabels(deps)}</span>` : ""}
          </span>
          <span>
            <button class="ec-switch ${enabled ? "on" : ""}" ${saving || (unmet && !enabled) ? "disabled" : ""} type="button" role="switch" aria-checked="${enabled}" aria-label="${enabled ? "Disattiva" : "Attiva"} ${item.label}"><span></span></button>
            <div class="ec-delegation-state ${enabled ? "on" : ""}">${enabled ? "ON" : "OFF"}</div>
            <div class="ec-delegation-save">${saving ? "Salvataggio…" : "Salvato HUB"}</div>
          </span>
        </div>`;
      }).join("")}
    `;

    host.querySelectorAll<HTMLElement>("[data-delegation-id]").forEach((row) => {
      const id = row.dataset.delegationId;
      const button = row.querySelector<HTMLButtonElement>(".ec-switch");
      if (!id || !button || button.disabled) return;
      button.addEventListener("click", async () => {
        permissions = normalizeClient({ ...permissions, [id]: !permissions[id] });
        await save();
      });
    });
  };

  draw();
}

function scan() {
  installStyles();
  const section = document.getElementById("team-real-delegations");
  if (section instanceof HTMLElement) void render(section);
}

const observer = new MutationObserver(scan);
observer.observe(document.documentElement, { childList: true, subtree: true });
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan, { once: true });
else scan();
