import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  Gavel,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

type DecisionItem = {
  id: string | number;
  title: string;
  ecosystem: string;
  status: string;
  urgency: string;
  due: string;
  assignedTo?: string | null;
};

type DecisionAssistantProps = {
  decisions: DecisionItem[];
  onOpenDecisionCenter: () => void;
};

type AnalyzedDecision = DecisionItem & {
  score: number;
  level: "critical" | "high" | "medium" | "stable";
  recommendation: string;
};

function normalize(value: string | null | undefined) {
  return (value ?? "")
    .toLocaleLowerCase("it-IT")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function urgencyScore(urgency: string) {
  const value = normalize(urgency);

  if (value.includes("alta") || value.includes("urgente")) return 45;
  if (value.includes("media")) return 25;
  return 10;
}

function statusScore(status: string) {
  const value = normalize(status);

  if (
    value.includes("blocc") ||
    value.includes("scad") ||
    value.includes("urgente")
  ) {
    return 30;
  }

  if (
    value.includes("da decidere") ||
    value.includes("aperta") ||
    value.includes("valutazione")
  ) {
    return 20;
  }

  if (value.includes("decisa") || value.includes("chiusa")) {
    return -60;
  }

  return 10;
}

function dueScore(due: string) {
  const value = normalize(due);

  if (
    value.includes("oggi") ||
    value.includes("scaduta") ||
    value.includes("immediata")
  ) {
    return 25;
  }

  if (
    value.includes("domani") ||
    value.includes("24 ore") ||
    value.includes("48 ore")
  ) {
    return 18;
  }

  if (value.includes("settimana")) return 8;

  return 4;
}

function ownershipScore(assignedTo?: string | null) {
  return assignedTo?.trim() ? 0 : 10;
}

function getLevel(score: number): AnalyzedDecision["level"] {
  if (score >= 85) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "stable";
}

function getRecommendation(
  decision: DecisionItem,
  score: number,
): string {
  const status = normalize(decision.status);

  if (status.includes("decisa") || status.includes("chiusa")) {
    return "Nessuna azione richiesta: la decisione risulta già chiusa.";
  }

  if (!decision.assignedTo?.trim()) {
    return "Definire subito un responsabile prima di procedere.";
  }

  if (score >= 85) {
    return "Portare la decisione all’attenzione immediata del CEO.";
  }

  if (score >= 60) {
    return "Valutare oggi impatto, alternative e prossima azione.";
  }

  if (score >= 35) {
    return "Preparare le informazioni mancanti e fissare la decisione.";
  }

  return "Mantenere in monitoraggio senza interrompere le priorità maggiori.";
}

function analyzeDecision(decision: DecisionItem): AnalyzedDecision {
  const score = Math.max(
    0,
    Math.min(
      100,
      urgencyScore(decision.urgency) +
        statusScore(decision.status) +
        dueScore(decision.due) +
        ownershipScore(decision.assignedTo),
    ),
  );

  return {
    ...decision,
    score,
    level: getLevel(score),
    recommendation: getRecommendation(decision, score),
  };
}

function LevelIcon({
  level,
}: {
  level: AnalyzedDecision["level"];
}) {
  if (level === "critical") return <ShieldAlert size={19} />;
  if (level === "high") return <AlertTriangle size={19} />;
  if (level === "medium") return <Gavel size={19} />;
  return <CheckCircle2 size={19} />;
}

function levelLabel(level: AnalyzedDecision["level"]) {
  if (level === "critical") return "Intervento immediato";
  if (level === "high") return "Priorità alta";
  if (level === "medium") return "Da pianificare";
  return "Monitoraggio";
}

export function DecisionAssistant({
  decisions,
  onOpenDecisionCenter,
}: DecisionAssistantProps) {
  const analyzed = decisions
    .map(analyzeDecision)
    .filter(
      (item) =>
        !normalize(item.status).includes("decisa") &&
        !normalize(item.status).includes("chiusa"),
    )
    .sort((first, second) => second.score - first.score);

  const primary = analyzed[0];
  const remaining = analyzed.slice(1, 4);

  return (
    <section
      className="decision-assistant"
      aria-labelledby="decision-assistant-title"
    >
      <div className="decision-assistant__head">
        <div className="decision-assistant__identity">
          <span>
            <Bot size={22} />
          </span>

          <div>
            <small>AI EXECUTIVE · DECISION ASSISTANT</small>
            <h2 id="decision-assistant-title">
              Quale decisione affrontare per prima
            </h2>
            <p>
              Priorità calcolata usando urgenza, stato, scadenza e
              assegnazione disponibili.
            </p>
          </div>
        </div>

        <button type="button" onClick={onOpenDecisionCenter}>
          Apri Decision Center
          <ArrowRight size={16} />
        </button>
      </div>

      {primary ? (
        <div className="decision-assistant__layout">
          <article
            className={`decision-assistant__primary decision-assistant__primary--${primary.level}`}
          >
            <div className="decision-assistant__primary-top">
              <span className="decision-assistant__level-icon">
                <LevelIcon level={primary.level} />
              </span>

              <div>
                <small>PRIMA DECISIONE CONSIGLIATA</small>
                <strong>{primary.title}</strong>
              </div>

              <span className="decision-assistant__score">
                <strong>{primary.score}</strong>
                <small>/100</small>
              </span>
            </div>

            <div className="decision-assistant__metadata">
              <span>
                <Sparkles size={14} />
                {primary.ecosystem}
              </span>

              <span>
                <CalendarClock size={14} />
                {primary.due}
              </span>

              <span>
                <Gavel size={14} />
                {primary.status}
              </span>
            </div>

            <div className="decision-assistant__recommendation">
              <small>{levelLabel(primary.level)}</small>
              <p>{primary.recommendation}</p>
            </div>

            <button type="button" onClick={onOpenDecisionCenter}>
              Analizza e decidi
              <ArrowRight size={16} />
            </button>
          </article>

          <aside className="decision-assistant__queue">
            <div className="decision-assistant__queue-head">
              <small>PROSSIME IN CODA</small>
              <strong>{analyzed.length} decisioni aperte</strong>
            </div>

            {remaining.length ? (
              remaining.map((decision, index) => (
                <button
                  type="button"
                  key={decision.id}
                  onClick={onOpenDecisionCenter}
                >
                  <span className="decision-assistant__order">
                    {String(index + 2).padStart(2, "0")}
                  </span>

                  <span>
                    <strong>{decision.title}</strong>
                    <small>
                      {decision.ecosystem} · {levelLabel(decision.level)}
                    </small>
                  </span>

                  <em>{decision.score}</em>
                </button>
              ))
            ) : (
              <div className="decision-assistant__queue-empty">
                <CheckCircle2 size={19} />
                <span>Nessun’altra decisione in coda.</span>
              </div>
            )}
          </aside>
        </div>
      ) : (
        <div className="decision-assistant__empty">
          <CheckCircle2 size={23} />

          <div>
            <strong>Nessuna decisione aperta</strong>
            <p>
              Il Decision Center non mostra elementi che richiedono una
              valutazione del CEO.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
