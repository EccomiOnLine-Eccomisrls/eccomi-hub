import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Sparkles,
} from "lucide-react";
import type { CeoPriority } from "../lib/ceoIntelligence";

type ExecutiveTimelineProps = {
  priorities: CeoPriority[];
  onNavigate: (view: CeoPriority["targetView"]) => void;
};

function severityIcon(severity: CeoPriority["severity"]) {
  if (severity === "critical" || severity === "warning") {
    return AlertTriangle;
  }

  if (severity === "opportunity") {
    return Sparkles;
  }

  return CheckCircle2;
}

function severityLabel(severity: CeoPriority["severity"]) {
  if (severity === "critical") return "Criticità";
  if (severity === "warning") return "Da gestire";
  if (severity === "opportunity") return "Opportunità";
  return "Monitoraggio";
}

export function ExecutiveTimeline({
  priorities,
  onNavigate,
}: ExecutiveTimelineProps) {
  const visibleItems = priorities.slice(0, 5);

  return (
    <section
      className="executive-timeline"
      aria-labelledby="executive-timeline-title"
    >
      <div className="executive-timeline__head">
        <div>
          <span className="executive-timeline__eyebrow">
            EXECUTIVE TIMELINE
          </span>

          <h2 id="executive-timeline-title">
            Cosa sta succedendo
          </h2>

          <p>
            Gli eventi che richiedono attenzione, decisione o monitoraggio.
          </p>
        </div>

        <span className="executive-timeline__live">
          <i />
          Aggiornamento continuo
        </span>
      </div>

      <div className="executive-timeline__list">
        {visibleItems.map((item, index) => {
          const Icon = severityIcon(item.severity);

          return (
            <button
              type="button"
              className={`executive-timeline__item executive-timeline__item--${item.severity}`}
              key={item.id}
              onClick={() => onNavigate(item.targetView)}
            >
              <div className="executive-timeline__rail">
                <span className="executive-timeline__icon">
                  <Icon size={18} />
                </span>

                {index < visibleItems.length - 1 && <i />}
              </div>

              <div className="executive-timeline__content">
                <div className="executive-timeline__meta">
                  <span>{severityLabel(item.severity)}</span>
                  <small>
                    <Clock3 size={13} />
                    Adesso
                  </small>
                </div>

                <strong>{item.title}</strong>
                <p>{item.description}</p>

                <span className="executive-timeline__ecosystem">
                  {item.ecosystem}
                </span>
              </div>

              <span className="executive-timeline__action">
                {item.actionLabel}
                <ArrowRight size={15} />
              </span>
            </button>
          );
        })}
      </div>

      {!visibleItems.length && (
        <div className="executive-timeline__empty">
          <CheckCircle2 size={22} />
          <strong>Nessun evento urgente</strong>
          <p>ECCOMI OS continuerà a monitorare i sistemi collegati.</p>
        </div>
      )}
    </section>
  );
}
