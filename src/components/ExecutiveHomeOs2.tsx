import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CarFront,
  CheckCircle2,
  ClipboardCheck,
  Gavel,
  Gauge,
  Mail,
  Network,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import type { CeoPriority } from "../lib/ceoIntelligence";

type ExecutiveView =
  | "dashboard"
  | "ecosystems"
  | "operations"
  | "ai"
  | "decisions"
  | "posta"
  | "noleggio";

type ExecutiveHomeOs2Props = {
  displayName: string;
  priorities: CeoPriority[];
  openDecisionCount: number;
  liveEcosystemCount: number;
  operationalItems: number;
  postaOpen: number;
  noleggioActivities: number;
  testMode: boolean;
  onNavigate: (view: ExecutiveView) => void;
};

type ToolCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  tone:
    | "blue"
    | "navy"
    | "green"
    | "violet"
    | "orange"
    | "teal";
  icon: React.ReactNode;
  onClick: () => void;
};

function ToolCard({
  eyebrow,
  title,
  description,
  action,
  tone,
  icon,
  onClick,
}: ToolCardProps) {
  return (
    <article className={`os2-tool-card os2-tool-card--${tone}`}>
      <span className="os2-tool-card__icon">{icon}</span>

      <div className="os2-tool-card__copy">
        <small>{eyebrow}</small>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <button type="button" onClick={onClick}>
        {action}
        <ArrowRight size={14} />
      </button>
    </article>
  );
}

function priorityTone(priority: CeoPriority) {
  if (priority.severity === "critical") return "critical";
  if (priority.severity === "warning") return "warning";
  if (priority.severity === "opportunity") return "opportunity";
  return "info";
}

function PriorityIcon({
  severity,
}: {
  severity: CeoPriority["severity"];
}) {
  if (severity === "critical") {
    return <AlertTriangle size={17} />;
  }

  if (severity === "warning") {
    return <Gavel size={17} />;
  }

  if (severity === "opportunity") {
    return <Sparkles size={17} />;
  }

  return <CheckCircle2 size={17} />;
}

export function ExecutiveHomeOs2({
  displayName,
  priorities,
  openDecisionCount,
  liveEcosystemCount,
  operationalItems,
  postaOpen,
  noleggioActivities,
  testMode,
  onNavigate,
}: ExecutiveHomeOs2Props) {
  const firstName =
    displayName.trim().split(/\s+/)[0] || "Salvatore";

  const mainPriorities = priorities.slice(0, 3);

  const attentionCount = priorities.filter(
    (priority) =>
      priority.severity === "critical" ||
      priority.severity === "warning",
  ).length;

  const opportunityCount = priorities.filter(
    (priority) => priority.severity === "opportunity",
  ).length;

  return (
    <div className="os2-operational-home">
      <section
        className="os2-primary-kpis"
        aria-label="Indicatori principali"
      >
        <button
          type="button"
          className="os2-primary-kpi os2-primary-kpi--blue"
          onClick={() => onNavigate("ecosystems")}
        >
          <span>
            <Network size={25} />
          </span>

          <div>
            <small>Ecosistemi collegati</small>
            <strong>{liveEcosystemCount}</strong>
            <p>Posta e Noleggio monitorati</p>
          </div>
        </button>

        <button
          type="button"
          className="os2-primary-kpi os2-primary-kpi--violet"
          onClick={() => onNavigate("decisions")}
        >
          <span>
            <ClipboardCheck size={25} />
          </span>

          <div>
            <small>Decisioni aperte</small>
            <strong>{openDecisionCount}</strong>
            <p>Da valutare o approvare</p>
          </div>
        </button>

        <button
          type="button"
          className="os2-primary-kpi os2-primary-kpi--orange"
          onClick={() => onNavigate("ai")}
        >
          <span>
            <AlertTriangle size={25} />
          </span>

          <div>
            <small>Priorità da gestire</small>
            <strong>{attentionCount}</strong>
            <p>Criticità e attività urgenti</p>
          </div>
        </button>

        <button
          type="button"
          className="os2-primary-kpi os2-primary-kpi--green"
          onClick={() => onNavigate("operations")}
        >
          <span>
            <Activity size={25} />
          </span>

          <div>
            <small>Attività operative</small>
            <strong>{operationalItems}</strong>
            <p>Pratiche, lead e approvazioni</p>
          </div>
        </button>
      </section>

      <section className="os2-executive-main-grid">
        <div>
          <span className="os2-section-label">
            Priorità del CEO
          </span>

          <article className="os2-morning-hero">
            <div className="os2-morning-hero__intro">
              <span className="os2-morning-hero__sun">
                <Sun size={28} />
              </span>

              <div>
                <strong>
                  Buongiorno {firstName},
                  <br />
                  ecco le tue priorità di oggi.
                </strong>

                <p>
                  Focus su ciò che genera maggiore impatto
                  operativo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate("ai")}
              >
                Apri vista completa
                <ArrowRight size={15} />
              </button>
            </div>

            <div className="os2-morning-hero__stats">
              <span>
                <strong>{attentionCount}</strong>
                <small>Priorità operative</small>
              </span>

              <span>
                <strong>{openDecisionCount}</strong>
                <small>Decisioni aperte</small>
              </span>

              <span>
                <strong>{operationalItems}</strong>
                <small>Attività da gestire</small>
              </span>
            </div>

            <div className="os2-morning-hero__priorities">
              <small>Le 3 priorità principali</small>

              {mainPriorities.map((priority) => (
                <button
                  type="button"
                  key={priority.id}
                  className={`os2-priority-row os2-priority-row--${priorityTone(priority)}`}
                  onClick={() =>
                    onNavigate(priority.targetView)
                  }
                >
                  <span>
                    <PriorityIcon
                      severity={priority.severity}
                    />
                  </span>

                  <div>
                    <strong>{priority.title}</strong>
                    <p>{priority.description}</p>
                  </div>

                  <em>
                    {priority.actionLabel}
                    <ArrowRight size={14} />
                  </em>
                </button>
              ))}
            </div>
          </article>
        </div>

        <div>
          <span className="os2-section-label">
            Cosa è cambiato
          </span>

          <article className="os2-change-card">
            <div className="os2-change-row os2-change-row--green">
              <span>
                <Mail size={17} />
              </span>

              <div>
                <strong>{postaOpen}</strong>
                <p>Pratiche Posta ancora aperte</p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate("posta")}
              >
                Apri
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="os2-change-row os2-change-row--orange">
              <span>
                <CarFront size={17} />
              </span>

              <div>
                <strong>{noleggioActivities}</strong>
                <p>Attività Noleggio da lavorare</p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate("noleggio")}
              >
                Apri
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="os2-change-row os2-change-row--violet">
              <span>
                <Gavel size={17} />
              </span>

              <div>
                <strong>{openDecisionCount}</strong>
                <p>Decisioni ancora aperte</p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate("decisions")}
              >
                Apri
                <ArrowRight size={13} />
              </button>
            </div>
          </article>
        </div>

        <div>
          <span className="os2-section-label">
            Timeline esecutiva
          </span>

          <article className="os2-timeline-card">
            {mainPriorities.map((priority, index) => (
              <button
                type="button"
                key={priority.id}
                onClick={() =>
                  onNavigate(priority.targetView)
                }
              >
                <span className="os2-timeline-card__rail">
                  <i />
                </span>

                <small>
                  {String(index + 1).padStart(2, "0")}
                </small>

                <div>
                  <strong>{priority.title}</strong>
                  <p>{priority.ecosystem}</p>
                </div>

                <ArrowRight size={14} />
              </button>
            ))}
          </article>
        </div>
      </section>

      <section className="os2-middle-grid">
        <div className="os2-summary-section">
          <span className="os2-section-label">
            Intelligenza operativa
          </span>

          <div className="os2-tool-grid os2-tool-grid--two">
            <ToolCard
              eyebrow="ECCOMI OS Copilot"
              title="Chiedi cosa sta succedendo"
              description="Risposte operative costruite esclusivamente sui segnali disponibili."
              action="Apri Copilot"
              tone="violet"
              icon={<Bot size={20} />}
              onClick={() => onNavigate("ai")}
            />

            <ToolCard
              eyebrow="Decision Assistant"
              title="Quale decisione affrontare prima"
              description={`${openDecisionCount} decisioni disponibili da valutare nel Decision Center.`}
              action="Apri Decision Assistant"
              tone="navy"
              icon={<Gavel size={20} />}
              onClick={() => onNavigate("decisions")}
            />
          </div>
        </div>

        <div className="os2-summary-section">
          <span className="os2-section-label">
            Controllo esecutivo
          </span>

          <div className="os2-tool-grid os2-tool-grid--two">
            <ToolCard
              eyebrow="Executive Snapshot"
              title="Il quadro completo, adesso"
              description="Panoramica dello stato degli ecosistemi e delle priorità."
              action="Apri Snapshot"
              tone="blue"
              icon={<Gauge size={20} />}
              onClick={() => onNavigate("dashboard")}
            />

            <ToolCard
              eyebrow="Executive Health"
              title="Salute operativa"
              description={`${liveEcosystemCount} sistemi collegati e ${attentionCount} elementi da verificare.`}
              action="Apri Health"
              tone="green"
              icon={<Activity size={20} />}
              onClick={() => onNavigate("ai")}
            />
          </div>
        </div>
      </section>

      <section className="os2-bottom-grid">
        <div>
          <span className="os2-section-label">
            Intelligence e azioni
          </span>

          <div className="os2-tool-grid os2-tool-grid--two">
            <ToolCard
              eyebrow="Executive Intelligence"
              title="Insight e segnali"
              description={`${opportunityCount} opportunità rilevate dai dati disponibili.`}
              action="Apri Intelligence"
              tone="blue"
              icon={<Sparkles size={20} />}
              onClick={() => onNavigate("ai")}
            />

            <ToolCard
              eyebrow="Executive Action Queue"
              title="Azioni in attesa"
              description={`${operationalItems} attività complessive richiedono lavorazione.`}
              action="Apri Action Queue"
              tone="orange"
              icon={<ClipboardCheck size={20} />}
              onClick={() => onNavigate("operations")}
            />
          </div>
        </div>

        <div>
          <span className="os2-section-label">
            Sistema e collegamenti
          </span>

          <div className="os2-tool-grid os2-tool-grid--three">
            <ToolCard
              eyebrow="Data Trust"
              title="Qualità dei dati"
              description={
                testMode
                  ? "Modalità dimostrativa attiva."
                  : "Dati live disponibili."
              }
              action="Verifica dati"
              tone="teal"
              icon={<ShieldCheck size={20} />}
              onClick={() => onNavigate("dashboard")}
            />

            <ToolCard
              eyebrow="System Pulse"
              title="Stato sistemi"
              description={`${liveEcosystemCount} collegamenti operativi monitorati.`}
              action="Apri sistemi"
              tone="blue"
              icon={<Activity size={20} />}
              onClick={() => onNavigate("ecosystems")}
            />

            <ToolCard
              eyebrow="App Registry"
              title="Workspace ECCOMI"
              description="Accedi agli ecosistemi disponibili."
              action="Apri app"
              tone="violet"
              icon={<Network size={20} />}
              onClick={() => onNavigate("ecosystems")}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
