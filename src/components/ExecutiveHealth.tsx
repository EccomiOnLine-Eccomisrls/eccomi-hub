import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Gauge,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { CeoPriority } from "../lib/ceoIntelligence";

type ConnectionState = "idle" | "loading" | "ready" | "error";

type ExecutiveHealthProps = {
  priorities: CeoPriority[];
  openDecisionCount: number;
  postaState: ConnectionState;
  noleggioState: ConnectionState;
  onOpenPriorities: () => void;
  onOpenDecisions: () => void;
};

type HealthLevel = "excellent" | "stable" | "attention" | "critical";

function connectionPenalty(state: ConnectionState) {
  if (state === "error") return 12;
  if (state === "loading" || state === "idle") return 4;
  return 0;
}

function calculateHealth({
  priorities,
  openDecisionCount,
  postaState,
  noleggioState,
}: Pick<
  ExecutiveHealthProps,
  | "priorities"
  | "openDecisionCount"
  | "postaState"
  | "noleggioState"
>) {
  const criticalCount = priorities.filter(
    (item) => item.severity === "critical",
  ).length;

  const warningCount = priorities.filter(
    (item) => item.severity === "warning",
  ).length;

  const opportunityCount = priorities.filter(
    (item) => item.severity === "opportunity",
  ).length;

  const penalty =
    criticalCount * 18 +
    warningCount * 8 +
    Math.min(openDecisionCount * 4, 20) +
    connectionPenalty(postaState) +
    connectionPenalty(noleggioState);

  const score = Math.max(0, Math.min(100, 100 - penalty));

  let level: HealthLevel = "excellent";
  let label = "Ecosistema sotto controllo";
  let message =
    "I sistemi collegati non mostrano elementi bloccanti rilevanti.";

  if (score < 85) {
    level = "stable";
    label = "Situazione stabile";
    message =
      "Sono presenti attività da seguire, ma nessun rischio sistemico immediato.";
  }

  if (score < 65) {
    level = "attention";
    label = "Richiede attenzione";
    message =
      "Priorità e decisioni aperte stanno riducendo la salute operativa.";
  }

  if (score < 40) {
    level = "critical";
    label = "Intervento necessario";
    message =
      "Sono presenti criticità o collegamenti che richiedono un intervento rapido.";
  }

  return {
    score,
    level,
    label,
    message,
    criticalCount,
    warningCount,
    opportunityCount,
  };
}

function getLevelIcon(level: HealthLevel) {
  if (level === "critical") return ShieldAlert;
  if (level === "attention") return AlertTriangle;
  if (level === "stable") return Gauge;
  return CheckCircle2;
}

export function ExecutiveHealth({
  priorities,
  openDecisionCount,
  postaState,
  noleggioState,
  onOpenPriorities,
  onOpenDecisions,
}: ExecutiveHealthProps) {
  const health = calculateHealth({
    priorities,
    openDecisionCount,
    postaState,
    noleggioState,
  });

  const LevelIcon = getLevelIcon(health.level);

  return (
    <section
      className={`executive-health executive-health--${health.level}`}
      aria-labelledby="executive-health-title"
    >
      <div className="executive-health__score">
        <div
          className="executive-health__ring"
          style={
            {
              "--health-score": `${health.score * 3.6}deg`,
            } as React.CSSProperties
          }
        >
          <span>
            <strong>{health.score}</strong>
            <small>/100</small>
          </span>
        </div>

        <div>
          <small>EXECUTIVE HEALTH</small>
          <h2 id="executive-health-title">{health.label}</h2>
          <p>{health.message}</p>
        </div>
      </div>

      <div className="executive-health__signals">
        <div>
          <LevelIcon size={18} />
          <span>
            <strong>
              {health.criticalCount + health.warningCount}
            </strong>
            Segnali da gestire
          </span>
        </div>

        <div>
          <Gauge size={18} />
          <span>
            <strong>{openDecisionCount}</strong>
            Decisioni aperte
          </span>
        </div>

        <div>
          <Sparkles size={18} />
          <span>
            <strong>{health.opportunityCount}</strong>
            Opportunità
          </span>
        </div>
      </div>

      <div className="executive-health__actions">
        <button type="button" onClick={onOpenPriorities}>
          Vedi priorità
          <ArrowRight size={15} />
        </button>

        <button type="button" onClick={onOpenDecisions}>
          Decision Center
          <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
}
