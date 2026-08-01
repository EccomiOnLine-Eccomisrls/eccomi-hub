import { ArrowRight, Bot, Sparkles } from "lucide-react";
import type { CeoPriority } from "../lib/ceoIntelligence";

type EcosystemItem = {
  name: string;
  status: "green" | "amber" | "red";
  updated: string;
  kpi: string;
};

const ecosystems: EcosystemItem[] = [
  { name: "Posta", status: "green", updated: "Realtime", kpi: "Live" },
  { name: "Noleggio", status: "amber", updated: "Realtime", kpi: "Live" },
  { name: "Energia", status: "amber", updated: "Monitor", kpi: "Attenzione" },
  { name: "Spedizioni", status: "green", updated: "Monitor", kpi: "Operativo" },
  { name: "Hub", status: "green", updated: "Sistema", kpi: "OK" },
];

function StatusDot({ tone }: { tone: "green" | "amber" | "red" }) {
  const className = `ceo-control-center__dot ceo-control-center__dot--${tone}`;
  return <span className={className} aria-hidden="true" />;
}

export function CeoControlCenter({ priorities, onOpenDecisionCenter }: { priorities: CeoPriority[]; onOpenDecisionCenter: () => void }) {
  const activityCounters = [
    { label: "Da approvare", value: String(priorities.filter((item) => item.severity === "warning" || item.severity === "critical").length), tone: "amber" },
    { label: "In lavorazione", value: String(Math.max(0, priorities.length - 1)), tone: "green" },
    { label: "Completate oggi", value: "—", tone: "green" },
  ];

  return (
    <section className="ceo-control-center" aria-label="CEO control center">
      <div className="ceo-control-center__grid">
        <article className="ceo-control-center__card ceo-control-center__card--priority">
          <div className="ceo-control-center__head">
            <span className="ceo-control-center__eyebrow">Priorità del giorno</span>
            <button className="ceo-control-center__action" onClick={onOpenDecisionCenter}>Apri</button>
          </div>
          <div className="ceo-control-center__body">
            {priorities.slice(0, 3).map((item) => (
              <div className="ceo-control-center__item" key={item.id}>
                <span className="ceo-control-center__item-label">{item.ecosystem}</span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="ceo-control-center__card ceo-control-center__card--ecosystems">
          <div className="ceo-control-center__head">
            <span className="ceo-control-center__eyebrow">Ecosistemi</span>
            <span className="ceo-control-center__hint">Stato indicativo</span>
          </div>
          <div className="ceo-control-center__ecosystems">
            {ecosystems.map((item) => (
              <div className="ceo-control-center__ecosystem-row" key={item.name}>
                <span className="ceo-control-center__ecosystem-main">
                  <StatusDot tone={item.status} />
                  <strong>{item.name}</strong>
                </span>
                <span className="ceo-control-center__ecosystem-meta">{item.updated}</span>
                <span className="ceo-control-center__ecosystem-kpi">{item.kpi}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="ceo-control-center__card">
          <div className="ceo-control-center__head">
            <span className="ceo-control-center__eyebrow">Attività CEO</span>
            <Sparkles size={16} className="ceo-control-center__icon" />
          </div>
          <div className="ceo-control-center__counters">
            {activityCounters.map((item) => (
              <div className="ceo-control-center__counter" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="ceo-control-center__card ceo-control-center__card--ai">
          <div className="ceo-control-center__head">
            <span className="ceo-control-center__eyebrow">AI Executive</span>
            <Bot size={16} className="ceo-control-center__icon" />
          </div>
          <p className="ceo-control-center__copy">Le priorità emergono dai dati reali già disponibili nel sistema e si traducono in azioni immediate per il CEO.</p>
          <button className="ceo-control-center__primary" onClick={onOpenDecisionCenter}>
            Apri Decision Center <ArrowRight size={16} />
          </button>
        </article>
      </div>
    </section>
  );
}
