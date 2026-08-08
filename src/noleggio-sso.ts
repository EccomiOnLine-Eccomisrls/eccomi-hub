type HubSession = { accessToken?: string; access_token?: string };

const API_URL = String(import.meta.env.VITE_HUB_API_URL || "https://eccomi-hub.onrender.com").replace(/\/$/, "");

function accessToken(): string {
  for (const key of ["eccomi-hub-session", "hub_session", "eccomi_session", "session"]) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "") as HubSession;
      if (value.accessToken || value.access_token) return value.accessToken || value.access_token || "";
    } catch {}
  }
  for (let i = 0; i < localStorage.length; i += 1) {
    try {
      const value = JSON.parse(localStorage.getItem(localStorage.key(i) || "") || "") as HubSession;
      if (value.accessToken || value.access_token) return value.accessToken || value.access_token || "";
    } catch {}
  }
  return "";
}

function isNoleggioContext(element: HTMLElement): boolean {
  let current: HTMLElement | null = element;
  for (let depth = 0; depth < 7 && current; depth += 1, current = current.parentElement) {
    const text = current.textContent || "";
    if (/Eccomi\s+Noleggio/i.test(text)) return true;
  }
  return false;
}

function nextPath(element: HTMLElement): string | null {
  const text = (element.textContent || "").trim().toLowerCase();
  const anchor = element.closest("a") as HTMLAnchorElement | null;
  const href = anchor?.href || "";

  if (href && /(?:noleggio\.eccomionline\.com|eccomi-noleggio\.onrender\.com)/i.test(href)) {
    try {
      const url = new URL(href);
      return `${url.pathname}${url.search}` || "/ceo";
    } catch {
      return "/ceo";
    }
  }

  if (!isNoleggioContext(element)) return null;
  if (text.includes("gestisci offerte")) return "/offerte";
  if (text.includes("apri servizio") || text.includes("apri area operativa")) return "/ceo";
  return null;
}

async function handoff(next: string): Promise<string> {
  const token = accessToken();
  if (!token) throw new Error("Sessione HUB non disponibile. Accedi nuovamente.");
  const response = await fetch(`${API_URL}/v1/sso/noleggio?next=${encodeURIComponent(next)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => ({})) as { url?: string; detail?: string };
  if (!response.ok || !payload.url) throw new Error(payload.detail || "Accesso diretto a Eccomi Noleggio non disponibile.");
  return payload.url;
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const control = target.closest("button,a") as HTMLElement | null;
  if (!control) return;
  const next = nextPath(control);
  if (!next) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const opened = window.open("about:blank", "_blank");
  void handoff(next)
    .then((url) => {
      if (opened) opened.location.href = url;
      else window.location.href = url;
    })
    .catch((error) => {
      if (opened) opened.close();
      alert(error instanceof Error ? error.message : "Accesso diretto a Eccomi Noleggio non riuscito.");
    });
}, true);
