type HubSession = { accessToken?: string; access_token?: string };
type DelegationState = { permissions: Record<string, boolean> };

const API_URL = String(import.meta.env.VITE_HUB_API_URL || "https://eccomi-hub.onrender.com").replace(/\/$/, "");
let lastToken = "";
let permissions: Record<string, boolean> | null = null;
let loading = false;

function readToken(): string {
  try {
    const session = JSON.parse(localStorage.getItem("eccomi-hub-session") || "") as HubSession;
    return String(session.accessToken || session.access_token || "");
  } catch {
    return "";
  }
}

async function loadPermissions(token: string) {
  if (!token || loading) return;
  if (token === lastToken && permissions) return;
  loading = true;
  try {
    const response = await fetch(`${API_URL}/v1/team/me/delegations`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return;
    const payload = await response.json() as DelegationState;
    permissions = payload.permissions || {};
    lastToken = token;
  } finally {
    loading = false;
  }
}

function allowed(key: string): boolean {
  return Boolean(permissions?.[key]);
}

function apply() {
  const shell = document.getElementById("eccomi-manager-shell");
  if (!shell || !permissions) return;

  const rules: Array<{ selector: string; permission: string }> = [
    { selector: '[data-action="open-offers"]', permission: "offers" },
    { selector: '[data-action="open-approvals"]', permission: "approve" },
    { selector: '[data-action="open-promotions"]', permission: "offers" },
    { selector: '[data-action="open-leads"]', permission: "leads" },
  ];

  rules.forEach(({ selector, permission }) => {
    shell.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      const isAllowed = allowed(permission);
      element.style.display = isAllowed ? "" : "none";
      element.setAttribute("aria-disabled", String(!isAllowed));
      element.dataset.delegationPermission = permission;
    });
  });

  shell.querySelectorAll<HTMLElement>('[data-action="open-dashboard"]').forEach((element) => {
    const hasAnyOperationalPermission = ["offers", "leads", "negotiations", "documents", "cases"].some(allowed);
    element.style.display = hasAnyOperationalPermission ? "" : "none";
  });

  if (!shell.querySelector(".mgr-delegation-summary")) {
    const target = shell.querySelector(".mgr-hero");
    if (target) {
      const active = Object.values(permissions).filter(Boolean).length;
      const summary = document.createElement("div");
      summary.className = "mgr-delegation-summary";
      summary.style.cssText = "margin-top:12px;font-size:12px;color:#d8e8f5;font-weight:800";
      summary.textContent = `${active} deleghe operative attive`;
      target.appendChild(summary);
    }
  }
}

async function scan() {
  const shell = document.getElementById("eccomi-manager-shell");
  if (!shell) return;
  const token = readToken();
  if (!token) return;
  await loadPermissions(token);
  apply();
}

const observer = new MutationObserver(() => { void scan(); });
observer.observe(document.documentElement, { childList: true, subtree: true });
window.setInterval(() => { void scan(); }, 1500);
void scan();
