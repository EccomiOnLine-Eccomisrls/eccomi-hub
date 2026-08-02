import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Gavel,
  Sparkles,
  Sun,
} from "lucide-react";
import type { CeoPriority } from "../lib/ceoIntelligence";

type CeoMorningBriefProps = {
  displayName: string;
  priorities: CeoPriority[];
  openDecisionCount: number;
  onNavigate: (view: CeoPriority["targetView"]) => void;
  onOpenDecisionCenter: () => void;
};

type BriefItem = {
  id: string;
  title: string;
  description: string;
  ecosystem: string;
  actionLabel: string;
  targetView: CeoPriority["targetView"];
  tone: "critical" | "warning" | "opportunity" | "stable";
};

function weight(tone: BriefItem["tone"]) {
  if (tone === "critical") return 4;
  if (tone === "warning") return 3;
  if (tone === "opportunity") return 2;
  return 1;
}

function buildBrief(
  priorities: CeoPriority[],
  openDecisionCount: number,
): BriefItem[] {
  const items: BriefItem[] = priorities.map((priority) => ({
    id: priority.id,
    title: priority.title,
    description: priority.description,
    ecosystem: priority.ecosystem,
    actionLabel: priority.actionLabel,
    targetView: priority.targetView,
    tone:
      priority.severity === "critical"
        ? "critical"
        : priority.severity === "warning"
          ? "warning"
          : priority.severity === "opportunity"
            ? "opportunity"
            : "stable",
  }));

  if (
    openDecisionCount > 0 &&
    !items.some((item) => item.targetView === "decisions")
  ) {
    items.push({
      id: "morning-decisions",
      title:
        openDecisionCount === 1
          ? "Una decisione attende la tua approvazione"
          : `${openDecisionCount} decisioni attendono la tua approvazione`,
      description:
        "Sblocca le attività che dipendono dalle decisioni ancora aperte.",
      ecosystem: "Decision Center",
      actionLabel: "Apri Decision Center",
      targetView: "decisions",
      tone: "warning",
    });
  }

  return items
    .sort((first, second) => weight(second.tone) - weight(first.tone))
    .slice(0, 3);
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Buongiorno";
  if (hour < 18) return "Buon pomeriggio";
  return "Buonasera";
}

function BriefIcon({ tone }: { tone: BriefItem["tone"] }) {
  if (tone === "critical") return <AlertTriangle size={19} />;
  if (tone === "warning") return <Gavel size={19} />;
  if (tone === "opportunity") return <Sparkles size={19} />;
  return <CheckCircle2 size={19} />;
}

export function CeoMorningBrief({
  displayName,
  priorities,
  openDecisionCount,
  onNavigate,
  onOpenDecisionCenter,
}: CeoMorningBriefProps) {
  const brief = buildBrief(priorities, openDecisionCount);
  const firstName = displayName.trim().split(/\s+/)[0] || "Salvatore";

  return (
    <section
      className="ceo-morning-brief"
      aria-labelledby="ceo-morning-brief-title"
    >
      <div className="ceo-morning-brief__head">
        <div className="ceo-morning-brief__identity">
          <span className="ceo-morning-brief__sun">
            <Sun size={21} />
          </span>

          <div>
            <small>CEO MORNING BRIEF</small>
            <h2 id="ceo-morning-brief-title">
              {getGreeting()} {firstName}
            </h2>
            <p>
              Concentrati su queste tre cose. Il resto può aspettare.
            </p>
          </div>
        </div>

        <button type="button" onClick={onOpenDecisionCenter}>
          Decision Center
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="ceo-morning-brief__grid">
        {brief.map((item, index) => (
          <button
            type="button"
            className={`ceo-morning-brief__item ceo-morning-brief__item--${item.tone}`}
            key={item.id}
            onClick={() => onNavigate(item.targetView)}
          >
            <span className="ceo-morning-brief__number">
              {String(index + 1).padStart(2, "0")}
            </span>

            <span className="ceo-morning-brief__icon">
              <BriefIcon tone={item.tone} />
            </span>

            <span className="ceo-morning-brief__content">
              <small>{item.ecosystem}</small>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </span>

            <span className="ceo-morning-brief__action">
              {item.actionLabel}
              <ArrowRight size={15} />
            </span>
          </button>
        ))}
      </div>

      {!brief.length && (
        <div className="ceo-morning-brief__empty">
          <CheckCircle2 size={22} />
          <div>
            <strong>Nessuna attività urgente</strong>
            <p>ECCOMI OS continua a monitorare i sistemi collegati.</p>
          </div>
        </div>
      )}
    </section>
  );
}
