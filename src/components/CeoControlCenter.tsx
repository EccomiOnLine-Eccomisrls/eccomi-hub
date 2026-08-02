import { ArrowRight, Bot, Sparkles } from "lucide-react";
import type { CeoPriority } from "../lib/ceoIntelligence";

type EcosystemItem = {
  name: string;
  status: "green" | "amber" | "red";
  updated: string;
  kpi: string;
};

const ecosystems: EcosystemItem[] = [
  { name: "ECCOMI OS", status: "green", updated: "Core", kpi: "Live" },
  { name: "Eccomi Posta", status: "green", updated: "Dati reali", kpi: "Collegata" },
  { name: "Eccomi Noleggio", status: "green", updated: "Dati reali", kpi: "Collegata" },
  { name: "Eccomi Energia", status: "amber", updated: "Roadmap", kpi: "Da collegare" },
  { name: "Eccomi Guide", status: "amber", updated: "Sprint futuro", kpi: "Da costruire" },
  { name: "Eccomi Spedizioni", status: "amber", updated: "Roadmap", kpi: "Da collegare" },
];

function StatusDot({ tone }: { tone: "green" | "amber" | "red" }) {
  const className = `ceo-control-center__dot ceo-control-center__dot--${tone}`;
  return <span className={className} aria-hidden="true" />;
}

export function CeoControlCenter({ priorities, onOpenDecisionCenter }: { priorities: CeoPriority[]; onOpenDecisionCenter: () => void }) {
  const activityCounters = [
    { label: "Da decidere", value: String(priorities.filter((item) => item.severity === "warning" || item.severity === "critical").length) },
    { label: "Opportunità", value: String(priorities.filter((item) => item.severity === "opportunity").length) },
    { label: "Segnali monitorati", value: String(priorities.length) },
  ];

  return (
    <section className="ceo-control-center" aria-label="Executive control center">
      <div className="ceo-control-center__grid">
        <article className="ceo-control-center__card ceo-control-center__card--priority">
          <div className="ceo-control-center__head">
            <span className="ceo-control-center__eyebrow">Cosa richiede attenzione</span>
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
            <span className="ceo-control-center__eyebrow">Mappa delle App</span>
            <span className="ceo-control-center__hint">Stato dichiarato</span>
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
            <span className="ceo-control-center__eyebrow">Quadro CEO</span>
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
            <span className="ceo-control-center__eyebrow">Executive Intelligence</span>
            <Bot size={16} className="ceo-control-center__icon" />
          </div>
          <p className="ceo-control-center__copy">ECCOMI OS ordina segnali, criticità e opportunità usando esclusivamente i dati disponibili e dichiarando ciò che non è ancora collegato.</p>
          <button className="ceo-control-center__primary" onClick={onOpenDecisionCenter}>
            Apri Decision Center <ArrowRight size={16} />
          </button>
        </article>
      </div>
    </section>
  );
}
