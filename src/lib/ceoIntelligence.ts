import type { NoleggioSummary, PostaSummary } from "./hubApi";

export type CeoPrioritySeverity =
  | "critical"
  | "warning"
  | "opportunity"
  | "info";

export type CeoPriority = {
  id: string;
  severity: CeoPrioritySeverity;
  title: string;
  description: string;
  ecosystem: string;
  actionLabel: string;
  targetView: "dashboard" | "ai" | "decisions" | "posta" | "noleggio";
};

export type CeoPriorityParams = {
  postaSummary: PostaSummary | null;
  postaState: "idle" | "loading" | "ready" | "error";
  noleggioSummary: NoleggioSummary | null;
  noleggioState: "idle" | "loading" | "ready" | "error";
  urgentOpenDecisionCount: number;
};

function makePriority(
  severity: CeoPrioritySeverity,
  title: string,
  description: string,
  ecosystem: string,
  actionLabel: string,
  targetView: CeoPriority["targetView"],
): CeoPriority {
  return {
    id: `${severity}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
    severity,
    title,
    description,
    ecosystem,
    actionLabel,
    targetView,
  };
}

export function buildCeoPriorities(params: CeoPriorityParams): CeoPriority[] {
  const priorities: CeoPriority[] = [];

  if (params.postaState === "error") {
    priorities.push(
      makePriority(
        "critical",
        "Verificare il collegamento Eccomi Posta",
        "Il flusso di lettura di Eccomi Posta non è disponibile. Verifica la configurazione prima di agire sui dati.",
        "Eccomi Posta",
        "Apri area Posta",
        "posta",
      ),
    );
  }

  if (params.noleggioState === "error") {
    priorities.push(
      makePriority(
        "critical",
        "Verificare il collegamento Eccomi Noleggio",
        "I KPI di Eccomi Noleggio non sono disponibili. Verifica la lettura reale prima di prendere decisioni.",
        "Eccomi Noleggio",
        "Apri area Noleggio",
        "noleggio",
      ),
    );
  }

  if (params.urgentOpenDecisionCount > 0) {
    priorities.push(
      makePriority(
        "warning",
        "Decisioni urgenti da prendere",
        "Sono presenti decisioni ad alta urgenza ancora aperte e richiedono un passaggio in Decision Center.",
        "Decisioni",
        "Apri Decision Center",
        "decisions",
      ),
    );
  }

  if (params.postaState === "ready" && params.postaSummary && params.postaSummary.summary.open > 0) {
    priorities.push(
      makePriority(
        "warning",
        "Pratiche Posta da lavorare",
        `${params.postaSummary.summary.open} pratiche risultano ancora aperte e richiedono verifica operativa.`,
        "Eccomi Posta",
        "Apri area Posta",
        "posta",
      ),
    );
  }

  if (params.noleggioState === "ready" && params.noleggioSummary) {
    const toWork = params.noleggioSummary.summary.pendingApproval + params.noleggioSummary.summary.newLeads + params.noleggioSummary.summary.workingLeads;
    const expiring = params.noleggioSummary.summary.expiring;

    if (expiring > 0 || toWork > 0) {
      priorities.push(
        makePriority(
          expiring > 0 ? "warning" : "opportunity",
          expiring > 0 ? "Promozioni Noleggio in scadenza" : "Nuove opportunità Noleggio",
          expiring > 0
            ? `${expiring} promozioni risultano in scadenza e richiedono attenzione.`
            : `${toWork} attività di Noleggio sono ancora da lavorare o da approvare.`,
          "Eccomi Noleggio",
          "Apri area Noleggio",
          "noleggio",
        ),
      );
    }
  }

  if (!priorities.length) {
    priorities.push(
      makePriority(
        "info",
        "Nessuna criticità bloccante rilevata",
        "Gli indicatori correnti non mostrano criticità urgenti. Il piano resta monitorato in tempo reale.",
        "Dashboard",
        "Apri dashboard",
        "dashboard",
      ),
    );
  }

  return priorities.slice(0, 5);
}

export function getCeoGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Buongiorno ${name}`;
  if (hour < 18) return `Buon pomeriggio ${name}`;
  return `Buonasera ${name}`;
}

export function getCeoGeneralState(
  postaState: CeoPriorityParams["postaState"],
  noleggioState: CeoPriorityParams["noleggioState"],
) {
  if (postaState === "loading" || noleggioState === "loading") {
    return "Collegamenti in corso";
  }
  if (postaState === "error" || noleggioState === "error") {
    return "Attenzione controllata";
  }
  return "Ecosistema operativo";
}
