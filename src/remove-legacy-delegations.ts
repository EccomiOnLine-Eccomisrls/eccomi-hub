function removeLegacyDelegations() {
  document
    .querySelectorAll<HTMLElement>("section.panel.delegation-panel")
    .forEach((panel) => {
      const text = panel.textContent || "";
      const isLegacyBlock =
        text.includes("Deleghe e limiti decisionali") &&
        text.includes("Responsabile Energia") &&
        text.includes("Responsabile Poste") &&
        text.includes("Responsabile Spedizioni");

      if (isLegacyBlock) panel.remove();
    });
}

const observer = new MutationObserver(removeLegacyDelegations);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("popstate", removeLegacyDelegations);
window.setInterval(removeLegacyDelegations, 500);
removeLegacyDelegations();
