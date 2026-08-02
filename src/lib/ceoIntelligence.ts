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

export type PriorityExplanation = {
  why: string;
  risk: string;
  benefit: string;
  recommendedAction: string;
};

export function explainCeoPriority(
  priority: CeoPriority,
): PriorityExplanation {
  if (priority.targetView === "posta") {
    if (priority.severity === "critical") {
      return {
        why: "Il collegamento con Eccomi Posta non sta restituendo dati affidabili.",
        risk: "Il CEO potrebbe prendere decisioni utilizzando informazioni incomplete o non aggiornate.",
        benefit: "Ripristinare il collegamento restituisce visibilità immediata su pratiche, anomalie e carichi operativi.",
        recommendedAction: "Aprire Eccomi Posta e verificare configurazione, credenziali e stato del servizio.",
      };
    }

    return {
      why: priority.description,
      risk: "Le pratiche aperte possono accumulare ritardo e aumentare il carico operativo.",
      benefit: "Una verifica tempestiva riduce i tempi di lavorazione e previene pratiche bloccate.",
      recommendedAction: "Aprire l’area Posta e controllare prima le pratiche ancora aperte.",
    };
  }

  if (priority.targetView === "noleggio") {
    if (priority.severity === "critical") {
      return {
        why: "I dati aggregati di Eccomi Noleggio non sono disponibili nell’HUB.",
        risk: "Promozioni, lead o attività urgenti potrebbero non essere intercettati in tempo.",
        benefit: "Il ripristino del collegamento consente di governare scadenze, promozioni e lead da un unico punto.",
        recommendedAction: "Aprire Eccomi Noleggio e verificare il collegamento con HUB.",
      };
    }

    return {
      why: priority.description,
      risk:
        priority.severity === "warning"
          ? "Una promozione o un’attività non gestita può perdere efficacia o superare la scadenza."
          : "Un’opportunità non lavorata può ridurre la probabilità di conversione.",
      benefit:
        priority.severity === "warning"
          ? "Intervenire ora protegge la continuità commerciale delle offerte."
          : "Lavorare rapidamente i lead aumenta la possibilità di trasformarli in trattative.",
      recommendedAction: "Aprire l’area Noleggio e lavorare gli elementi con maggiore urgenza.",
    };
  }

  if (priority.targetView === "decisions") {
    return {
      why: priority.description,
      risk: "Rimandare una decisione urgente può bloccare attività, responsabili o opportunità collegate.",
      benefit: "Una decisione tempestiva sblocca il flusso operativo e chiarisce le responsabilità.",
      recommendedAction: "Aprire il Decision Center e completare prima le decisioni ad alta urgenza.",
    };
  }

  if (priority.severity === "critical") {
    return {
      why: priority.description,
      risk: "La criticità può produrre un impatto operativo crescente se non viene gestita.",
      benefit: "Un intervento immediato limita il rischio e ripristina il controllo.",
      recommendedAction: priority.actionLabel,
    };
  }

  if (priority.severity === "warning") {
    return {
      why: priority.description,
      risk: "La situazione può diventare critica se resta senza responsabile o senza azione.",
      benefit: "Gestirla oggi mantiene il sistema sotto controllo.",
      recommendedAction: priority.actionLabel,
    };
  }

  if (priority.severity === "opportunity") {
    return {
      why: priority.description,
      risk: "Rinviare può ridurre il valore o la probabilità di conversione dell’opportunità.",
      benefit: "Intervenire rapidamente può generare crescita commerciale o operativa.",
      recommendedAction: priority.actionLabel,
    };
  }

  return {
    why: priority.description,
    risk: "Nessun rischio immediato rilevato.",
    benefit: "Mantenere il monitoraggio garantisce continuità e controllo.",
    recommendedAction: "Continuare il monitoraggio.",
  };
}


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

export type ExecutiveBriefing = {
  headline: string;
  message: string;
  objective: string;
};

export type ExecutiveBriefingParams = {
  priorities: CeoPriority[];
  postaSummary: PostaSummary | null;
  noleggioSummary: NoleggioSummary | null;
  openDecisionCount: number;
};

export function buildExecutiveBriefing(
  params: ExecutiveBriefingParams,
): ExecutiveBriefing {
  const criticalCount = params.priorities.filter(
    (item) => item.severity === "critical",
  ).length;

  const warningCount = params.priorities.filter(
    (item) => item.severity === "warning",
  ).length;

  const opportunityCount = params.priorities.filter(
    (item) => item.severity === "opportunity",
  ).length;

  const topPriority = params.priorities.find(
    (item) =>
      item.severity === "critical" ||
      item.severity === "warning" ||
      item.severity === "opportunity",
  );

  if (criticalCount > 0) {
    return {
      headline: "Richiesta attenzione immediata",
      message:
        criticalCount === 1
          ? "È presente una criticità che richiede il tuo intervento."
          : `Sono presenti ${criticalCount} criticità che richiedono il tuo intervento.`,
      objective: topPriority?.title || "Verificare le criticità operative",
    };
  }

  if (warningCount > 0) {
    return {
      headline: "Attenzione controllata",
      message:
        warningCount === 1
          ? "È presente una priorità operativa da gestire oggi."
          : `Sono presenti ${warningCount} priorità operative da gestire oggi.`,
      objective: topPriority?.title || "Completare le priorità operative",
    };
  }

  if (opportunityCount > 0) {
    return {
      headline: "Giornata orientata alla crescita",
      message:
        opportunityCount === 1
          ? "È disponibile una nuova opportunità commerciale."
          : `Sono disponibili ${opportunityCount} opportunità commerciali.`,
      objective: topPriority?.title || "Valutare le opportunità commerciali",
    };
  }

  if (params.openDecisionCount > 0) {
    return {
      headline: "Decisioni da completare",
      message:
        params.openDecisionCount === 1
          ? "Una decisione è ancora aperta nel Decision Center."
          : `${params.openDecisionCount} decisioni sono ancora aperte nel Decision Center.`,
      objective: "Completare le decisioni ancora aperte",
    };
  }

  const realSignals: string[] = [];

  if (params.postaSummary) {
    realSignals.push(
      `${params.postaSummary.summary.open} pratiche Posta aperte`,
    );
  }

  if (params.noleggioSummary) {
    const noleggioActivities =
      params.noleggioSummary.summary.pendingApproval +
      params.noleggioSummary.summary.newLeads +
      params.noleggioSummary.summary.workingLeads;

    realSignals.push(
      `${noleggioActivities} attività Noleggio da monitorare`,
    );
  }

  return {
    headline: "Ecosistema operativo",
    message: realSignals.length
      ? `Situazione sotto controllo: ${realSignals.join(" e ")}.`
      : "Nessuna criticità bloccante rilevata nei sistemi collegati.",
    objective: "Concentrarsi sulla crescita dell’ecosistema",
  };
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
