import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Target,
} from "lucide-react";
import type { CeoPriority } from "../lib/ceoIntelligence";

type ExecutiveIntelligenceProps = {
  priorities: CeoPriority[];
  openDecisionCount: number;
  onOpenDecisionCenter: () => void;
  onOpenAI: () => void;
};

type IntelligenceSignal = {
  id: string;
  label: string;
  title: string;
  description: string;
  tone: "critical" | "warning" | "opportunity" | "stable";
  action: string;
};

function buildSignals(
  priorities: CeoPriority[],
  openDecisionCount: number,
): IntelligenceSignal[] {
  const signals: IntelligenceSignal[] = [];

  const critical = priorities.find(
    (item) => item.severity === "critical",
  );

  const warning = priorities.find(
    (item) => item.severity === "warning",
  );

  const opportunity = priorities.find(
    (item) => item.severity === "opportunity",
  );

  if (critical) {
    signals.push({
      id: "critical",
      label: "INTERVENTO PRIORITARIO",
      title: critical.title,
      description: critical.description,
      tone: "critical",
      action: critical.actionLabel,
    });
  }

  if (warning) {
    signals.push({
      id: "warning",
      label: "ATTENZIONE OPERATIVA",
      title: warning.title,
      description: warning.description,
      tone: "warning",
      action: warning.actionLabel,
    });
  }

  if (opportunity) {
    signals.push({
      id: "opportunity",
      label: "OPPORTUNITÀ",
      title: opportunity.title,
      description: opportunity.description,
      tone: "opportunity",
      action: opportunity.actionLabel,
    });
  }

  if (openDecisionCount > 0) {
    signals.push({
      id: "decisions",
      label: "DECISION CENTER",
      title:
        openDecisionCount === 1
          ? "Una decisione attende il CEO"
          : `${openDecisionCount} decisioni attendono il CEO`,
      description:
        "Le decisioni ancora aperte possono rallentare attività, responsabili e prossimi sviluppi.",
      tone: "warning",
      action: "Apri Decision Center",
    });
  }

  if (!signals.length) {
    signals.push({
      id: "stable",
      label: "STATO GENERALE",
      title: "Nessuna criticità bloccante",
      description:
        "I sistemi collegati non mostrano criticità urgenti. ECCOMI OS continua il monitoraggio.",
      tone: "stable",
      action: "Continua monitoraggio",
    });
  }

  return signals.slice(0, 3);
}

function signalIcon(tone: IntelligenceSignal["tone"]) {
  if (tone === "critical") return AlertTriangle;
  if (tone === "warning") return Target;
  if (tone === "opportunity") return Lightbulb;
  return CheckCircle2;
}

export function ExecutiveIntelligence({
  priorities,
  openDecisionCount,
  onOpenDecisionCenter,
  onOpenAI,
}: ExecutiveIntelligenceProps) {
  const signals = buildSignals(priorities, openDecisionCount);

  const criticalCount = priorities.filter(
    (item) => item.severity === "critical",
  ).length;

  const warningCount = priorities.filter(
    (item) => item.severity === "warning",
  ).length;

  const opportunityCount = priorities.filter(
    (item) => item.severity === "opportunity",
  ).length;

  return (
    <section
      className="executive-intelligence"
      aria-labelledby="executive-intelligence-title"
    >
      <div className="executive-intelligence__head">
        <div>
          <span className="executive-intelligence__eyebrow">
            EXECUTIVE INTELLIGENCE
          </span>

          <h2 id="executive-intelligence-title">
            Cosa suggerisce ECCOMI OS
          </h2>

          <p>
            I dati disponibili vengono tradotti in priorità, rischi e
            opportunità operative.
          </p>
        </div>

        <span className="executive-intelligence__badge">
          <Bot size={16} />
          Analisi operativa
        </span>
      </div>

      <div className="executive-intelligence__layout">
        <div className="executive-intelligence__signals">
          {signals.map((signal) => {
            const Icon = signalIcon(signal.tone);

            return (
              <article
                className={`executive-intelligence__signal executive-intelligence__signal--${signal.tone}`}
                key={signal.id}
              >
                <span className="executive-intelligence__icon">
                  <Icon size={19} />
                </span>

                <div>
                  <small>{signal.label}</small>
                  <strong>{signal.title}</strong>
                  <p>{signal.description}</p>
                  <span>{signal.action}</span>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="executive-intelligence__summary">
          <div className="executive-intelligence__summary-head">
            <Sparkles size={18} />
            <span>Sintesi CEO</span>
          </div>

          <div className="executive-intelligence__metrics">
            <div>
              <strong>{criticalCount}</strong>
              <span>Criticità</span>
            </div>

            <div>
              <strong>{warningCount}</strong>
              <span>Priorità</span>
            </div>

            <div>
              <strong>{opportunityCount}</strong>
              <span>Opportunità</span>
            </div>

            <div>
              <strong>{openDecisionCount}</strong>
              <span>Decisioni aperte</span>
            </div>
          </div>

          <p>
            ECCOMI OS utilizza esclusivamente i segnali disponibili nei sistemi
            collegati. I dati non ancora integrati non vengono stimati.
          </p>

          <div className="executive-intelligence__actions">
            <button type="button" onClick={onOpenDecisionCenter}>
              Decision Center
              <ArrowRight size={15} />
            </button>

            <button type="button" onClick={onOpenAI}>
              Apri AI e alert
              <ArrowRight size={15} />
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
