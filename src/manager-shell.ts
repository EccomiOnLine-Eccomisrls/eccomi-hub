type StoredSession = {
  accessToken?: string;
  access_token?: string;
  user?: { fullName?: string; full_name?: string; email?: string; role?: string };
};

type HubProfile = {
  user_id: string;
  ec_id: string;
  email: string;
  full_name: string;
  role: string;
  ecosystem_keys: string[];
  active: boolean;
};

type NoleggioSummary = {
  summary?: {
    promotions_total?: number;
    pending_approval?: number;
    active?: number;
    leads_total?: number;
    new_leads?: number;
    working_leads?: number;
    contracts?: number;
  };
};

const MANAGER_SHELL_ID = "eccomi-manager-shell";
const MANAGER_STYLE_ID = "eccomi-manager-shell-style";
let activeToken = "";
let loading = false;

function apiBaseUrl(): string {
  const env = import.meta.env as ImportMetaEnv & Record<string, string | undefined>;
  const value = [env.VITE_HUB_API_BASE_URL, env.HUB_API_BASE_URL]
    .find((candidate) => Boolean(candidate && candidate.trim()));
  return value ? String(value).trim().replace(/\/+$/, "") : "";
}

function noleggioOperationalBaseUrl(): string {
  const env = import.meta.env as ImportMetaEnv & Record<string, string | undefined>;
  const value = [env.VITE_NOLEGGIO_OPERATIONAL_URL, env.NOLEGGIO_OPERATIONAL_URL]
    .find((candidate) => Boolean(candidate && candidate.trim()));
  return value
    ? String(value).trim().replace(/\/+$/, "")
    : "https://eccomi-noleggio.onrender.com";
}

function noleggioOperationalUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${noleggioOperationalBaseUrl()}${normalizedPath}`;
}

function readSession(): { token: string; session: StoredSession | null } {
  try {
    const raw = localStorage.getItem("eccomi-hub-session");
    if (!raw) return { token: "", session: null };
    const session = JSON.parse(raw) as StoredSession;
    return { token: String(session.accessToken || session.access_token || ""), session };
  } catch {
    return { token: "", session: null };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function removeManagerShell(): void {
  document.documentElement.classList.remove("eccomi-manager-mode");
  document.getElementById(MANAGER_SHELL_ID)?.remove();
  activeToken = "";
}

function ensureStyles(): void {
  if (document.getElementById(MANAGER_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = MANAGER_STYLE_ID;
  style.textContent = `
    html.eccomi-manager-mode,html.eccomi-manager-mode body{background:#eef4f9!important;min-height:100%;}
    html.eccomi-manager-mode #root{display:none!important;}
    #${MANAGER_SHELL_ID}{position:fixed;inset:0;z-index:2147483000;overflow:auto;background:#eef4f9;color:#10233d;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}
    #${MANAGER_SHELL_ID} *{box-sizing:border-box}
    .mgr-top{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:15px 24px;background:rgba(255,255,255,.96);backdrop-filter:blur(14px);border-bottom:1px solid #dbe6ef;}
    .mgr-brand{display:flex;align-items:center;gap:12px}.mgr-logo{display:grid;place-items:center;width:44px;height:44px;border-radius:14px;background:#0b4d82;color:white;font-weight:900}.mgr-brand strong{display:block;font-size:17px}.mgr-brand small{color:#718197;font-weight:800;letter-spacing:.08em}.mgr-user{display:flex;align-items:center;gap:10px}.mgr-user span{text-align:right}.mgr-user strong,.mgr-user small{display:block}.mgr-user small{color:#718197}.mgr-exit{border:1px solid #cbd9e5;background:white;border-radius:12px;padding:10px 14px;font-weight:800;color:#173755;cursor:pointer}
    .mgr-main{width:min(1180px,calc(100% - 36px));margin:24px auto 64px}.mgr-hero{position:relative;overflow:hidden;padding:30px;border-radius:28px;background:linear-gradient(135deg,#062f55,#0c5d9a);color:white;box-shadow:0 18px 48px rgba(8,55,94,.16)}.mgr-hero:after{content:"";position:absolute;width:380px;height:380px;border:1px solid rgba(255,255,255,.12);border-radius:50%;right:-120px;top:-170px}.mgr-eyebrow{font-size:12px;font-weight:900;letter-spacing:.17em;color:#83cbff;text-transform:uppercase}.mgr-hero-row{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:flex-end;gap:24px}.mgr-hero h1{font-size:clamp(30px,5vw,48px);line-height:1.05;margin:10px 0}.mgr-hero p{margin:0;max-width:650px;color:#d8e8f5;font-size:17px;line-height:1.55}.mgr-role{display:inline-flex;margin-top:18px;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.12);font-weight:800}.mgr-open-app{position:relative;z-index:2;border:0;border-radius:15px;background:white;color:#0b4d82;padding:14px 18px;font-weight:900;cursor:pointer;white-space:nowrap}
    .mgr-section-title{margin:28px 4px 12px;font-size:13px;font-weight:900;letter-spacing:.15em;color:#1d57a4;text-transform:uppercase}.mgr-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);gap:18px}.mgr-card{background:white;border:1px solid #d8e4ed;border-radius:24px;padding:23px;box-shadow:0 12px 32px rgba(14,49,76,.06)}.mgr-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.mgr-card-head h2,.mgr-card h2{margin:5px 0 4px;font-size:26px}.mgr-card-head p,.mgr-card p{margin:0;color:#718197}.mgr-live{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:8px 11px;background:#e9f8f0;color:#087443;font-weight:900}.mgr-live i{width:8px;height:8px;background:#20b36b;border-radius:50%}
    .mgr-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:18px}.mgr-kpi{appearance:none;text-align:left;width:100%;padding:17px;border-radius:18px;background:#f4f8fb;border:1px solid #e2ebf2;cursor:pointer;color:inherit;transition:.15s}.mgr-kpi:hover,.mgr-kpi:focus{transform:translateY(-1px);border-color:#8ab8df;background:#f8fbfe}.mgr-kpi small{display:block;color:#718197;font-weight:800;margin-bottom:7px}.mgr-kpi strong{font-size:30px;color:#102b48}.mgr-kpi em{display:block;margin-top:5px;font-style:normal;font-size:12px;color:#0c5597;font-weight:800}
    .mgr-today{display:grid;gap:10px;margin-top:17px}.mgr-task{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:14px;border:1px solid #e0e9f1;border-radius:17px;background:#fbfdff}.mgr-task--urgent{border-color:#ffd6ad;background:#fff9f1}.mgr-task--lead{border-color:#cfe6ff;background:#f6fbff}.mgr-task-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:white;border:1px solid #e0e9f1;font-weight:900;color:#0c5597}.mgr-task strong{display:block}.mgr-task small{display:block;margin-top:3px;color:#718197}.mgr-task button{border:0;border-radius:11px;padding:9px 11px;background:#0c5597;color:white;font-weight:900;cursor:pointer}
    .mgr-actions{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:17px}.mgr-action{border:1px solid #d9e5ee;background:#f8fbfd;border-radius:16px;padding:15px;text-align:left;cursor:pointer;color:#16324f}.mgr-action strong,.mgr-action small{display:block}.mgr-action small{color:#718197;margin-top:5px;line-height:1.35}.mgr-action--primary{background:#0c5597;color:white;border-color:#0c5597}.mgr-action--primary small{color:#d9edff}
    .mgr-performance{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}.mgr-performance div{padding:15px;border-radius:16px;background:#f5f8fb}.mgr-performance small{display:block;color:#718197;font-weight:800}.mgr-performance strong{display:block;font-size:24px;margin-top:5px}.mgr-note{margin-top:17px;padding:15px 17px;border-radius:16px;background:#edf6ff;color:#315774;line-height:1.45}.mgr-empty{padding:30px;text-align:center;color:#718197}.mgr-error{background:#fff0f0;border:1px solid #ffcaca;color:#9b2020;border-radius:16px;padding:16px;margin-top:18px;font-weight:700}.mgr-refresh{margin-top:16px;border:1px solid #cbd9e5;background:white;color:#0c5597;border-radius:13px;padding:11px 15px;font-weight:900;cursor:pointer}.mgr-footer-note{text-align:center;color:#7d8ca0;font-size:12px;margin-top:20px}
    @media(max-width:900px){.mgr-grid{grid-template-columns:1fr}.mgr-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.mgr-hero-row{align-items:flex-start;flex-direction:column}.mgr-open-app{width:100%}}
    @media(max-width:620px){.mgr-top{padding:12px 16px}.mgr-user span{display:none}.mgr-main{width:min(100% - 24px,1180px);margin-top:15px}.mgr-hero{padding:24px 21px;border-radius:22px}.mgr-card{padding:18px;border-radius:20px}.mgr-card-head{align-items:center}.mgr-kpi strong{font-size:27px}.mgr-brand small{display:none}.mgr-actions{grid-template-columns:1fr}.mgr-task{grid-template-columns:auto 1fr}.mgr-task button{grid-column:1/-1;width:100%}.mgr-performance{grid-template-columns:1fr}.mgr-open-app{padding:13px}.mgr-section-title{margin-top:24px}}
  `;
  document.head.appendChild(style);
}

async function getJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(payload.detail || "Operazione non riuscita."));
  return payload as T;
}

function kpi(label: string, value: number | string, action: string): string {
  return `<button class="mgr-kpi" type="button" data-action="${escapeHtml(action)}"><small>${escapeHtml(label)}</small><strong>${escapeHtml(String(value))}</strong><em>Apri →</em></button>`;
}

function openNoleggio(path = "/"): void {
  window.open(noleggioOperationalUrl(path), "_blank", "noopener,noreferrer");
}

function runOperationalAction(action: string | undefined): void {
  if (action === "open-dashboard" || action === "open-leads") openNoleggio("/");
  if (action === "open-offers" || action === "open-approvals" || action === "open-promotions") openNoleggio("/offerte");
}

async function renderManagerShell(token: string): Promise<void> {
  if (loading) return;
  loading = true;
  try {
    const profile = await getJson<HubProfile>("/v1/team/me", token);
    if (profile.role !== "manager") { removeManagerShell(); return; }

    ensureStyles();
    document.documentElement.classList.add("eccomi-manager-mode");
    let shell = document.getElementById(MANAGER_SHELL_ID);
    if (!shell) {
      shell = document.createElement("div");
      shell.id = MANAGER_SHELL_ID;
      document.body.appendChild(shell);
    }

    const assigned = Array.isArray(profile.ecosystem_keys) ? profile.ecosystem_keys : [];
    const hasNoleggio = assigned.includes("noleggio");
    let noleggio: NoleggioSummary | null = null;
    let dataError = "";
    if (hasNoleggio) {
      try { noleggio = await getJson<NoleggioSummary>("/v1/ecosystems/noleggio/summary", token); }
      catch (error) { dataError = error instanceof Error ? error.message : "Dati Noleggio non disponibili."; }
    }

    const summary = noleggio?.summary || {};
    const active = Number(summary.active || 0);
    const pending = Number(summary.pending_approval || 0);
    const leadsTotal = Number(summary.leads_total || 0);
    const newLeads = Number(summary.new_leads || 0);
    const workingLeads = Number(summary.working_leads || 0);
    const leadsToWork = newLeads + workingLeads;
    const contracts = Number(summary.contracts || 0);
    const promotionsTotal = Number(summary.promotions_total || 0);
    const ecosystemLabel = hasNoleggio ? "Eccomi Noleggio" : assigned.length ? assigned.join(", ") : "Nessun ecosistema assegnato";
    const firstName = profile.full_name.split(/\s+/)[0] || "Responsabile";
    const conversion = leadsTotal > 0 ? Math.round((contracts / leadsTotal) * 100) : 0;
    const tasks = pending + leadsToWork;

    shell.innerHTML = `
      <header class="mgr-top">
        <div class="mgr-brand"><span class="mgr-logo">E</span><span><strong>ECCOMI HUB</strong><small>CABINA DI REGIA</small></span></div>
        <div class="mgr-user"><span><strong>${escapeHtml(profile.full_name)}</strong><small>Responsabile · ${escapeHtml(ecosystemLabel)}</small></span><button class="mgr-exit" type="button">Esci</button></div>
      </header>
      <main class="mgr-main">
        <section class="mgr-hero"><div class="mgr-hero-row"><div>
          <span class="mgr-eyebrow">CABINA DI REGIA · ${escapeHtml(profile.ec_id)}</span>
          <h1>Buongiorno ${escapeHtml(firstName)}</h1>
          <p>Qui guidi il lavoro quotidiano di Eccomi Noleggio: offerte, lead, priorità e risultati. La tua cabina di regia ti aiuta a trasformare ogni opportunità in avanzamento concreto.</p>
          <span class="mgr-role">Responsabile · ${escapeHtml(ecosystemLabel)}</span>
        </div>${hasNoleggio ? `<button class="mgr-open-app" type="button" data-action="open-dashboard">Apri Eccomi Noleggio ↗</button>` : ""}</div></section>

        ${hasNoleggio ? `
          <div class="mgr-section-title">Da fare oggi · ${tasks} attività</div>
          <div class="mgr-grid">
            <section class="mgr-card">
              <div class="mgr-card-head"><div><span class="mgr-eyebrow">PRIORITÀ OPERATIVE</span><h2>La tua coda di lavoro</h2><p>Parti dalle opportunità che possono generare il maggiore risultato oggi.</p></div><span class="mgr-live"><i></i>Live</span></div>
              <div class="mgr-today">
                <div class="mgr-task mgr-task--urgent"><span class="mgr-task-icon">✓</span><div><strong>${pending} offerte da approvare</strong><small>Controlla condizioni, validità e completezza e portale verso la pubblicazione.</small></div><button type="button" data-action="open-approvals">Gestisci offerte</button></div>
                <div class="mgr-task mgr-task--lead"><span class="mgr-task-icon">☎</span><div><strong>${leadsToWork} lead da lavorare</strong><small>${newLeads} nuovi · ${workingLeads} già in lavorazione. Trasforma i contatti in opportunità.</small></div><button type="button" data-action="open-leads">Lavora lead</button></div>
                <div class="mgr-task"><span class="mgr-task-icon">↗</span><div><strong>${active} promozioni attive</strong><small>${promotionsTotal} promozioni complessive monitorate dal sistema.</small></div><button type="button" data-action="open-promotions">Vedi promo</button></div>
              </div>
            </section>
            <section class="mgr-card">
              <span class="mgr-eyebrow">AZIONI RAPIDE</span><h2>Lavora da qui</h2><p>Tutto ciò che ti serve per far avanzare Eccomi Noleggio.</p>
              <div class="mgr-actions">
                <button class="mgr-action mgr-action--primary" type="button" data-action="open-dashboard"><strong>Apri Noleggio</strong><small>Entra nella dashboard operativa.</small></button>
                <button class="mgr-action" type="button" data-action="refresh"><strong>Aggiorna dati</strong><small>Ricarica KPI e coda di lavoro.</small></button>
                <button class="mgr-action" type="button" data-action="open-offers"><strong>Offerte</strong><small>Apri direttamente la gestione offerte.</small></button>
                <button class="mgr-action" type="button" data-action="open-leads"><strong>Lead</strong><small>Apri la dashboard operativa con pratiche e contatti.</small></button>
              </div>
            </section>
          </div>

          <div class="mgr-section-title">Quadro operativo</div>
          <section class="mgr-card">
            <div class="mgr-card-head"><div><span class="mgr-eyebrow">ECCOMI NOLEGGIO</span><h2>I numeri di Eccomi Noleggio</h2><p>Indicatori live per decidere dove concentrare energia e azioni.</p></div><span class="mgr-live"><i></i>Attivo</span></div>
            <div class="mgr-kpis">
              ${kpi("Promozioni attive", active, "open-promotions")}
              ${kpi("Da approvare", pending, "open-approvals")}
              ${kpi("Lead totali", leadsTotal, "open-leads")}
              ${kpi("Lead da lavorare", leadsToWork, "open-leads")}
            </div>
            <div class="mgr-performance"><div><small>Contratti</small><strong>${contracts}</strong></div><div><small>Conversione indicativa</small><strong>${conversion}%</strong></div><div><small>Attività da trasformare in risultato</small><strong>${tasks}</strong></div></div>
            ${dataError ? `<div class="mgr-error">${escapeHtml(dataError)}</div>` : `<div class="mgr-note"><strong>Il tuo spazio di lavoro.</strong> Hai tutto ciò che serve per guidare Eccomi Noleggio: offerte, lead, attività e risultati. Concentrati sulle priorità, fai avanzare le opportunità e porta ogni contatto verso il risultato.</div>`}
            <button class="mgr-refresh" type="button" data-action="refresh">↻ Aggiorna quadro</button>
          </section>
        ` : `<div class="mgr-section-title">Ecosistemi</div><section class="mgr-card mgr-empty">La tua prossima area operativa comparirà qui appena sarà pronta.</section>`}
        <div class="mgr-footer-note">ECCOMI HUB · Cabina di Regia Responsabile · ${escapeHtml(ecosystemLabel)}</div>
      </main>`;

    shell.querySelector<HTMLButtonElement>(".mgr-exit")?.addEventListener("click", () => {
      localStorage.removeItem("eccomi-hub-session");
      window.location.reload();
    });
    shell.querySelectorAll<HTMLElement>("[data-action]").forEach((element) => {
      element.addEventListener("click", () => {
        const action = element.dataset.action;
        if (action === "refresh") { activeToken = ""; void enforceManagerRole(); return; }
        runOperationalAction(action);
      });
    });
    activeToken = token;
  } catch {
    // Keep the standard login/session flow authoritative until the profile resolves.
  } finally {
    loading = false;
  }
}

async function enforceManagerRole(): Promise<void> {
  const { token, session } = readSession();
  const role = session?.user?.role;
  if (!token || role !== "manager") {
    if (document.getElementById(MANAGER_SHELL_ID)) removeManagerShell();
    return;
  }
  if (token === activeToken && document.getElementById(MANAGER_SHELL_ID)) return;
  await renderManagerShell(token);
}

window.setInterval(() => { void enforceManagerRole(); }, 450);
window.addEventListener("focus", () => { void enforceManagerRole(); });
void enforceManagerRole();