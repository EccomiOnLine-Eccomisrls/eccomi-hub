type StoredSession = {
  accessToken?: string;
  access_token?: string;
  user?: {
    fullName?: string;
    full_name?: string;
    email?: string;
    role?: string;
  };
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

function readSession(): { token: string; session: StoredSession | null } {
  try {
    const raw = localStorage.getItem("eccomi-hub-session");
    if (!raw) return { token: "", session: null };
    const session = JSON.parse(raw) as StoredSession;
    return {
      token: String(session.accessToken || session.access_token || ""),
      session,
    };
  } catch {
    return { token: "", session: null };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
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
    .mgr-top{position:sticky;top:0;z-index:4;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:16px 24px;background:rgba(255,255,255,.94);backdrop-filter:blur(14px);border-bottom:1px solid #dbe6ef;}
    .mgr-brand{display:flex;align-items:center;gap:12px}.mgr-logo{display:grid;place-items:center;width:44px;height:44px;border-radius:14px;background:#0b4d82;color:white;font-weight:900}.mgr-brand strong{display:block;font-size:17px}.mgr-brand small{color:#718197;font-weight:700;letter-spacing:.08em}
    .mgr-user{display:flex;align-items:center;gap:10px}.mgr-user span{text-align:right}.mgr-user strong,.mgr-user small{display:block}.mgr-user small{color:#718197}.mgr-exit{border:1px solid #cbd9e5;background:white;border-radius:12px;padding:10px 14px;font-weight:800;color:#173755;cursor:pointer}
    .mgr-main{width:min(1120px,calc(100% - 36px));margin:28px auto 64px}.mgr-hero{position:relative;overflow:hidden;padding:32px;border-radius:28px;background:linear-gradient(135deg,#062f55,#0c5d9a);color:white;box-shadow:0 18px 48px rgba(8,55,94,.16)}.mgr-hero:after{content:"";position:absolute;width:360px;height:360px;border:1px solid rgba(255,255,255,.12);border-radius:50%;right:-110px;top:-160px}.mgr-eyebrow{font-size:12px;font-weight:900;letter-spacing:.17em;color:#83cbff}.mgr-hero h1{font-size:clamp(31px,6vw,50px);line-height:1.05;margin:10px 0}.mgr-hero p{margin:0;max-width:680px;color:#d8e8f5;font-size:17px;line-height:1.55}.mgr-role{display:inline-flex;margin-top:20px;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.12);font-weight:800}
    .mgr-section-title{margin:30px 4px 13px;font-size:13px;font-weight:900;letter-spacing:.15em;color:#1d57a4;text-transform:uppercase}.mgr-card{background:white;border:1px solid #d8e4ed;border-radius:24px;padding:24px;box-shadow:0 12px 32px rgba(14,49,76,.06)}.mgr-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.mgr-card-head h2{margin:5px 0 4px;font-size:27px}.mgr-card-head p{margin:0;color:#718197}.mgr-live{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:8px 11px;background:#e9f8f0;color:#087443;font-weight:900}.mgr-live i{width:8px;height:8px;background:#20b36b;border-radius:50%}
    .mgr-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:22px}.mgr-kpi{padding:18px;border-radius:18px;background:#f4f8fb;border:1px solid #e2ebf2}.mgr-kpi small{display:block;color:#718197;font-weight:800;margin-bottom:7px}.mgr-kpi strong{font-size:30px;color:#102b48}.mgr-note{margin-top:18px;padding:15px 17px;border-radius:16px;background:#edf6ff;color:#315774;line-height:1.45}.mgr-empty{padding:30px;text-align:center;color:#718197}.mgr-error{background:#fff0f0;border:1px solid #ffcaca;color:#9b2020;border-radius:16px;padding:16px;margin-top:18px;font-weight:700}.mgr-refresh{margin-top:18px;border:0;background:#0c5597;color:white;border-radius:13px;padding:12px 17px;font-weight:900;cursor:pointer}
    @media(max-width:760px){.mgr-top{padding:12px 16px}.mgr-user span{display:none}.mgr-main{width:min(100% - 24px,1120px);margin-top:18px}.mgr-hero{padding:25px 22px;border-radius:22px}.mgr-card{padding:19px;border-radius:20px}.mgr-card-head{align-items:center}.mgr-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.mgr-kpi strong{font-size:26px}.mgr-brand small{display:none}}
  `;
  document.head.appendChild(style);
}

async function getJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(payload.detail || "Operazione non riuscita."));
  return payload as T;
}

function kpi(label: string, value: number | string): string {
  return `<div class="mgr-kpi"><small>${escapeHtml(label)}</small><strong>${escapeHtml(String(value))}</strong></div>`;
}

async function renderManagerShell(token: string): Promise<void> {
  if (loading) return;
  loading = true;
  try {
    const profile = await getJson<HubProfile>("/v1/team/me", token);
    if (profile.role !== "manager") {
      removeManagerShell();
      return;
    }

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
      try {
        noleggio = await getJson<NoleggioSummary>("/v1/ecosystems/noleggio/summary", token);
      } catch (error) {
        dataError = error instanceof Error ? error.message : "Dati Noleggio non disponibili.";
      }
    }

    const summary = noleggio?.summary || {};
    const ecosystemLabel = hasNoleggio ? "Eccomi Noleggio" : assigned.length ? assigned.join(", ") : "Nessun ecosistema assegnato";

    shell.innerHTML = `
      <header class="mgr-top">
        <div class="mgr-brand"><span class="mgr-logo">E</span><span><strong>ECCOMI HUB</strong><small>AREA RESPONSABILE</small></span></div>
        <div class="mgr-user"><span><strong>${escapeHtml(profile.full_name)}</strong><small>${escapeHtml(profile.email)}</small></span><button class="mgr-exit" type="button">Esci</button></div>
      </header>
      <main class="mgr-main">
        <section class="mgr-hero">
          <span class="mgr-eyebrow">AREA PERSONALE · ${escapeHtml(profile.ec_id)}</span>
          <h1>Buongiorno ${escapeHtml(profile.full_name.split(/\s+/)[0] || "Responsabile")}</h1>
          <p>Qui trovi esclusivamente gli ecosistemi e i dati assegnati al tuo ruolo. Le funzioni di governo e le aree riservate al CEO non sono disponibili.</p>
          <span class="mgr-role">Responsabile · ${escapeHtml(ecosystemLabel)}</span>
        </section>
        <div class="mgr-section-title">Ecosistemi assegnati</div>
        ${hasNoleggio ? `
          <section class="mgr-card">
            <div class="mgr-card-head"><div><span class="mgr-eyebrow">ECOSISTEMA</span><h2>Eccomi Noleggio</h2><p>Promozioni, lead e attività del tuo perimetro.</p></div><span class="mgr-live"><i></i>Attivo</span></div>
            <div class="mgr-kpis">
              ${kpi("Promozioni attive", Number(summary.active || 0))}
              ${kpi("Da approvare", Number(summary.pending_approval || 0))}
              ${kpi("Lead totali", Number(summary.leads_total || 0))}
              ${kpi("Lead da lavorare", Number(summary.new_leads || 0) + Number(summary.working_leads || 0))}
            </div>
            ${dataError ? `<div class="mgr-error">${escapeHtml(dataError)}</div>` : `<div class="mgr-note">Accesso limitato al solo perimetro Noleggio. Posta, Decision Center, New Entry, Responsabili e controlli executive restano riservati al CEO.</div>`}
            <button class="mgr-refresh" type="button">Aggiorna dati</button>
          </section>
        ` : `<section class="mgr-card mgr-empty">Nessun ecosistema operativo assegnato a questo profilo.</section>`}
      </main>
    `;

    shell.querySelector<HTMLButtonElement>(".mgr-exit")?.addEventListener("click", () => {
      localStorage.removeItem("eccomi-hub-session");
      window.location.reload();
    });
    shell.querySelector<HTMLButtonElement>(".mgr-refresh")?.addEventListener("click", () => {
      activeToken = "";
      void enforceManagerRole();
    });
    activeToken = token;
  } catch {
    // The normal React login/session flow remains authoritative until the
    // authenticated profile can be resolved successfully.
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
