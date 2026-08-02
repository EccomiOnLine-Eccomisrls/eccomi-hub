import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Gavel,
  Sparkles,
} from "lucide-react";
import type { CeoPriority } from "../lib/ceoIntelligence";

type ExecutiveActionQueueProps = {
  priorities: CeoPriority[];
  openDecisionCount: number;
  onNavigate: (view: CeoPriority["targetView"]) => void;
  onOpenDecisionCenter: () => void;
};

type ExecutiveAction = {
  id: string;
  title: string;
  description: string;
  label: string;
  priority: "critical" | "high" | "opportunity" | "monitor";
  targetView: CeoPriority["targetView"];
  actionLabel: string;
};

function priorityWeight(priority: ExecutiveAction["priority"]) {
  if (priority === "critical") return 4;
  if (priority === "high") return 3;
  if (priority === "opportunity") return 2;
  return 1;
}

function buildExecutiveActions(
  priorities: CeoPriority[],
  openDecisionCount: number,
): ExecutiveAction[] {
  const actions: ExecutiveAction[] = priorities.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    label: item.ecosystem,
    priority:
      item.severity === "critical"
        ? "critical"
        : item.severity === "warning"
          ? "high"
          : item.severity === "opportunity"
            ? "opportunity"
            : "monitor",
    targetView: item.targetView,
    actionLabel: item.actionLabel,
  }));

  if (openDecisionCount > 0) {
    actions.push({
      id: "open-decisions",
      title:
        openDecisionCount === 1
          ? "Chiudere una decisione aperta"
          : `Chiudere ${openDecisionCount} decisioni aperte`,
      description:
        "Le decisioni ancora aperte possono rallentare responsabili, attività e prossimi sviluppi.",
      label: "Decision Center",
      priority: "high",
      targetView: "decisions",
      actionLabel: "Apri Decision Center",
    });
  }

  return actions
    .sort(
      (first, second) =>
        priorityWeight(second.priority) -
        priorityWeight(first.priority),
    )
    .slice(0, 5);
}

function priorityLabel(priority: ExecutiveAction["priority"]) {
  if (priority === "critical") return "Immediata";
  if (priority === "high") return "Alta";
  if (priority === "opportunity") return "Crescita";
  return "Monitoraggio";
}

function PriorityIcon({
  priority,
}: {
  priority: ExecutiveAction["priority"];
}) {
  if (priority === "critical") {
    return <AlertTriangle size={18} />;
  }

  if (priority === "high") {
    return <Gavel size={18} />;
  }

  if (priority === "opportunity") {
    return <Sparkles size={18} />;
  }

  return <CheckCircle2 size={18} />;
}

export function ExecutiveActionQueue({
  priorities,
  openDecisionCount,
  onNavigate,
  onOpenDecisionCenter,
}: ExecutiveActionQueueProps) {
  const actions = buildExecutiveActions(
    priorities,
    openDecisionCount,
  );

  return (
    <section
      className="executive-action-queue"
      aria-labelledby="executive-action-queue-title"
    >
      <div className="executive-action-queue__head">
        <div>
          <span className="executive-action-queue__eyebrow">
            EXECUTIVE ACTION QUEUE
          </span>

          <h2 id="executive-action-queue-title">
            Cosa fare adesso
          </h2>

          <p>
            ECCOMI OS ordina le attività per priorità e impatto operativo.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenDecisionCenter}
        >
          Apri Decision Center
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="executive-action-queue__list">
        {actions.map((action, index) => (
          <button
            type="button"
            className={`executive-action-queue__item executive-action-queue__item--${action.priority}`}
            key={action.id}
            onClick={() => onNavigate(action.targetView)}
          >
            <span className="executive-action-queue__order">
              {String(index + 1).padStart(2, "0")}
            </span>

            <span className="executive-action-queue__icon">
              <PriorityIcon priority={action.priority} />
            </span>

            <span className="executive-action-queue__content">
              <span className="executive-action-queue__meta">
                <small>{action.label}</small>

                <i>
                  <Clock3 size={12} />
                  {priorityLabel(action.priority)}
                </i>
              </span>

              <strong>{action.title}</strong>
              <p>{action.description}</p>
            </span>

            <span className="executive-action-queue__action">
              {action.actionLabel}
              <ArrowRight size={15} />
            </span>
          </button>
        ))}
      </div>

      {!actions.length && (
        <div className="executive-action-queue__empty">
          <CheckCircle2 size={22} />
          <strong>Nessuna attività urgente</strong>
          <p>
            ECCOMI OS continuerà a monitorare i sistemi collegati.
          </p>
        </div>
      )}
    </section>
  );
}
