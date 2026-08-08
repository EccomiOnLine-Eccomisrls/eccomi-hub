const LEGACY_TITLE = "Deleghe e limiti decisionali";

function removeLegacyDelegations() {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,div,span"),
  ).filter((node) => node.textContent?.trim() === LEGACY_TITLE);

  for (const title of candidates) {
    let container: HTMLElement | null = title;

    for (let depth = 0; depth < 8 && container; depth += 1) {
      const table = container.querySelector("table");
      const text = container.textContent || "";
      const isLegacyBlock =
        Boolean(table) &&
        text.includes("Responsabile Energia") &&
        text.includes("Responsabile Poste") &&
        text.includes("Responsabile Spedizioni");

      if (isLegacyBlock) {
        container.remove();
        return;
      }

      container = container.parentElement;
    }
  }
}

const observer = new MutationObserver(removeLegacyDelegations);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("popstate", removeLegacyDelegations);
window.setInterval(removeLegacyDelegations, 800);
removeLegacyDelegations();
