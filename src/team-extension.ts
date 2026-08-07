type HubSession = {
  accessToken?: string;
  user?: { role?: string };
};

type Responsible = {
  user_id: string;
  ec_id: string;
  email: string;
  full_name: string;
  role: string;
  ecosystem_keys: string[];
  active: boolean;
};

const API_URL = String(import.meta.env.VITE_HUB_API_URL || "https://eccomi-hub.onrender.com").replace(/\/$/, "");
const EXTENSION_ID = "eccomi-team-extension";
let loading = false;
let lastPathKey = "";

const ecosystemLabels: Record<string, string> = {
  noleggio: "Eccomi Noleggio",
  posta: "Eccomi Posta",
  energia: "Eccomi Energia",
  spedizioni: "Eccomi Spedizioni",
  pec: "Eccomi PEC",
};

function session(): HubSession | null {
  try {
    return JSON.parse(localStorage.getItem("eccomi-hub-session") || "null") as HubSession | null;
  } catch {
    return null;
  }
}

function token(): string {
  return session()?.accessToken || "";
}

function isCeo(): boolean {
  return session()?.user?.role === "ceo";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = token();
  if (!accessToken) throw new Error("Sessione non disponibile. Accedi nuovamente.");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || "Operazione non riuscita.");
  }
  return payload as T;
}

function ensureStyles(): void {
  if (document.getElementById(`${EXTENSION_ID}-styles`)) return;
  const style = document.createElement("style");
  style.id = `${EXTENSION_ID}-styles`;
  style.textContent = `
    .team-live-toolbar{display:flex;justify-content:flex-end;margin:-2px 0 18px}
    .team-live-empty{grid-column:1/-1;background:#fff;border:1px dashed #bfd0e2;border-radius:18px;padding:28px;text-align:center;color:#5b6778}
    .team-live-empty strong{display:block;color:#102033;font-size:17px;margin-bottom:6px}
    .team-live-badge{display:inline-flex;align-items:center;gap:6px;font-style:normal;font-size:12px;font-weight:800;color:#087443;background:#e9f8f0;border-radius:999px;padding:5px 9px}
    .team-live-badge i{width:7px;height:7px;border-radius:50%;background:#19a765}
    .team-modal-layer{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:20px}
    .team-modal-scrim{position:absolute;inset:0;border:0;background:rgba(5,25,45,.56);backdrop-filter:blur(4px)}
    .team-modal{position:relative;width:min(620px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;box-shadow:0 28px 80px rgba(0,26,52,.28);padding:26px}
    .team-modal__head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:22px}
    .team-modal__head small{display:block;color:#0c5597;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}
    .team-modal__head h2{margin:0;color:#102033;font-size:25px}
    .team-modal__head p{margin:7px 0 0;color:#5b6778;line-height:1.45}
    .team-modal__close{border:0;background:#eef3f8;width:38px;height:38px;border-radius:12px;font-size:22px;cursor:pointer}
    .team-form{display:grid;gap:16px}
    .team-form label{display:grid;gap:7px;font-weight:800;color:#26384b;font-size:13px}
    .team-form input,.team-form select{width:100%;border:1px solid #cbd8e5;border-radius:12px;padding:13px 14px;font:inherit;color:#102033;background:#fff;box-sizing:border-box}
    .team-form input:focus,.team-form select:focus{outline:3px solid rgba(12,85,151,.12);border-color:#0c5597}
    .team-form__note{display:flex;gap:10px;background:#eef7ff;border:1px solid #cde4f7;border-radius:14px;padding:13px;color:#31516e;font-size:13px;line-height:1.45}
    .team-form__error{background:#fff0f0;border:1px solid #ffcaca;color:#9b2020;border-radius:12px;padding:12px 14px;font-size:13px;font-weight:700}
    .team-form__actions{display:flex;justify-content:flex-end;gap:10px;margin-top:6px}
    .team-form__actions button{border-radius:12px;padding:12px 17px;font-weight:900;cursor:pointer}
    .team-form__cancel{border:1px solid #cbd8e5;background:#fff;color:#31516e}
    .team-form__save{border:0;background:#0c5597;color:#fff}
    .team-form__save:disabled{opacity:.55;cursor:not-allowed}
  `;
  document.head.appendChild(style);
}

function managerCard(item: Responsible): string {
  const ecosystem = item.ecosystem_keys[0] || "da-assegnare";
  const area = ecosystemLabels[ecosystem] || ecosystem;
  return `
    <article class="manager-card" data-real-manager="${escapeHtml(item.user_id)}">
      <div class="manager-card__top">
        <span class="manager-avatar" style="color:#0c5597;background:#e9f2fa">${escapeHtml(initials(item.full_name))}</span>
        <em class="team-live-badge"><i></i>${item.active ? "Attivo" : "Sospeso"}</em>
      </div>
      <h3>${escapeHtml(item.full_name)}</h3>
      <p>${escapeHtml(area)}</p>
      <div class="manager-score">
        <span><small>Ruolo</small><strong>Responsabile</strong></span>
        <div><span style="width:100%;background:#0c5597"></span></div>
      </div>
      <div class="manager-meta">
        <span>${escapeHtml(item.ec_id)}</span>
        <span>${escapeHtml(item.email)}</span>
      </div>
    </article>`;
}

async function loadManagers(): Promise<void> {
  const grid = document.querySelector<HTMLElement>(".manager-grid");
  if (!grid || loading || !isCeo()) return;
  loading = true;
  try {
    const managers = await api<Responsible[]>("/v1/team/responsibles");
    grid.dataset.live = "true";
    grid.innerHTML = managers.length
      ? managers.map(managerCard).join("")
      : `<div class="team-live-empty"><strong>Nessun responsabile reale registrato</strong><span>Usa “Nuovo responsabile” per assegnare la prima area.</span></div>`;
  } catch (error) {
    grid.innerHTML = `<div class="team-live-empty"><strong>Responsabili non disponibili</strong><span>${escapeHtml(error instanceof Error ? error.message : "Errore di collegamento")}</span></div>`;
  } finally {
    loading = false;
  }
}

function closeModal(): void {
  document.getElementById(`${EXTENSION_ID}-modal`)?.remove();
}

function openModal(): void {
  if (document.getElementById(`${EXTENSION_ID}-modal`)) return;
  const layer = document.createElement("div");
  layer.id = `${EXTENSION_ID}-modal`;
  layer.className = "team-modal-layer";
  layer.innerHTML = `
    <button class="team-modal-scrim" aria-label="Chiudi"></button>
    <section class="team-modal" role="dialog" aria-modal="true" aria-labelledby="team-modal-title">
      <div class="team-modal__head">
        <div><small>Solo CEO</small><h2 id="team-modal-title">Nuovo responsabile</h2><p>Collega una persona reale a un ecosistema e abilita l’accesso OTP a ECCOMI HUB.</p></div>
        <button class="team-modal__close" type="button" aria-label="Chiudi">×</button>
      </div>
      <form class="team-form">
        <label>Nome e cognome<input name="full_name" autocomplete="name" required minlength="2" placeholder="Es. Salvo Rossi"></label>
        <label>Indirizzo email<input name="email" type="email" autocomplete="email" required placeholder="nome@email.it"></label>
        <label>Ecosistema assegnato
          <select name="ecosystem_key" required>
            <option value="noleggio">Eccomi Noleggio</option>
            <option value="posta">Eccomi Posta</option>
            <option value="energia">Eccomi Energia</option>
            <option value="spedizioni">Eccomi Spedizioni</option>
            <option value="pec">Eccomi PEC</option>
          </select>
        </label>
        <div class="team-form__note">🔐 Il profilo verrà creato con ruolo <strong>manager</strong>. L’indirizzo potrà ricevere il codice OTP soltanto dopo il salvataggio.</div>
        <div class="team-form__error" hidden></div>
        <div class="team-form__actions">
          <button type="button" class="team-form__cancel">Annulla</button>
          <button type="submit" class="team-form__save">Crea responsabile</button>
        </div>
      </form>
    </section>`;
  document.body.appendChild(layer);

  layer.querySelectorAll(".team-modal-scrim,.team-modal__close,.team-form__cancel").forEach((element) => {
    element.addEventListener("click", closeModal);
  });

  const form = layer.querySelector<HTMLFormElement>("form")!;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const save = form.querySelector<HTMLButtonElement>(".team-form__save")!;
    const errorBox = form.querySelector<HTMLElement>(".team-form__error")!;
    const data = new FormData(form);
    save.disabled = true;
    save.textContent = "Creazione in corso…";
    errorBox.hidden = true;
    try {
      await api<Responsible>("/v1/team/responsibles", {
        method: "POST",
        body: JSON.stringify({
          full_name: String(data.get("full_name") || "").trim(),
          email: String(data.get("email") || "").trim().toLowerCase(),
          ecosystem_key: String(data.get("ecosystem_key") || "noleggio"),
        }),
      });
      closeModal();
      await loadManagers();
    } catch (error) {
      errorBox.textContent = error instanceof Error ? error.message : "Creazione non riuscita.";
      errorBox.hidden = false;
      save.disabled = false;
      save.textContent = "Crea responsabile";
    }
  });
}

function installOnTeamPage(): void {
  const heading = Array.from(document.querySelectorAll("h1")).find((node) => node.textContent?.trim() === "Responsabili");
  if (!heading || !isCeo()) return;
  const page = heading.closest(".content") || document.body;
  const key = `${heading.textContent}-${Boolean(page.querySelector(".manager-grid"))}`;
  if (lastPathKey === key && document.getElementById(`${EXTENSION_ID}-button`)) return;
  lastPathKey = key;

  const actions = heading.closest(".page-heading")?.querySelector(".heading-actions") || heading.parentElement;
  if (actions && !document.getElementById(`${EXTENSION_ID}-button`)) {
    const button = document.createElement("button");
    button.id = `${EXTENSION_ID}-button`;
    button.className = "new-entry-button";
    button.innerHTML = "+ Nuovo responsabile";
    button.addEventListener("click", openModal);
    actions.appendChild(button);
  }

  void loadManagers();
}

ensureStyles();
const observer = new MutationObserver(() => installOnTeamPage());
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("popstate", installOnTeamPage);
window.setInterval(installOnTeamPage, 1200);
installOnTeamPage();
