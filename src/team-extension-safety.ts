const NOLEGGIO_SUMMARY_PATH = "/v1/ecosystems/noleggio/summary";
let noleggioSummaryAvailable: boolean | null = null;

const originalFetch = window.fetch.bind(window);

window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
  const input = args[0];
  const url = typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;

  if (!url.includes(NOLEGGIO_SUMMARY_PATH)) {
    return originalFetch(...args);
  }

  try {
    const response = await originalFetch(...args);
    noleggioSummaryAvailable = response.ok;
    if (!response.ok) window.setTimeout(applyUnavailableState, 0);
    return response;
  } catch (error) {
    noleggioSummaryAvailable = false;
    window.setTimeout(applyUnavailableState, 0);
    throw error;
  }
};

function applyUnavailableState(): void {
  if (noleggioSummaryAvailable !== false) return;

  const panel = document.getElementById("team-service-governance");
  if (!(panel instanceof HTMLElement)) return;

  panel.querySelectorAll<HTMLElement>(".team-service-kpi strong")
    .forEach((value) => { value.textContent = "—"; });

  const description = panel.querySelector<HTMLElement>(".team-service-head p");
  if (description) {
    description.textContent = description.textContent
      ?.replace(/dati operativi live/gi, "dati non disponibili")
      || "Dati operativi non disponibili";
  }

  const badge = panel.querySelector<HTMLElement>(".team-live-badge");
  if (badge) {
    badge.classList.add("off");
    badge.innerHTML = "<i></i>Dati non disponibili";
  }

  panel.dataset.summaryUnavailable = "true";
}

const observer = new MutationObserver(() => {
  if (noleggioSummaryAvailable === false) applyUnavailableState();
});
observer.observe(document.documentElement, { childList: true, subtree: true });
