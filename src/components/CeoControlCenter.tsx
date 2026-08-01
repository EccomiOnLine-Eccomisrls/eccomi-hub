import { ArrowRight, Bot, CircleCheckBig, Clock3, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";

type ControlCardItem = {
  label: string;
  value: string;
  meta: string;
  tone?: "green" | "amber" | "red";
};

type EcosystemItem = {
  name: string;
  status: "green" | "amber" | "red";
  updated: string;
  kpi: string;
};

const priorityItems: ControlCardItem[] = [
  { label: "Attività prioritaria", value: "Verificare 3 pratiche Energia", meta: "Responsabile: Luca Bianchi", tone: "amber" },
  { label: "Scadenza", value: "Ore 11:30", meta: "Coinvolge: Posta · Energia", tone: "green" },
];

const ecosystems: EcosystemItem[] = [
  { name: "Posta", status: "green", updated: "2 min fa", kpi: "+8%" },
  { name: "Energia", status: "amber", updated: "11 min fa", kpi: "+3%" },
  { name: "Spedizioni", status: "green", updated: "18 min fa", kpi: "+5%" },
  { name: "Noleggio", status: "red", updated: "25 min fa", kpi: "-1%" },
  { name: "Hub", status: "green", updated: "1 ora fa", kpi: "+12%" },
];

const activityCounters = [
  { label: "Da approvare", value: "6", tone: "amber" },
  { label: "In lavorazione", value: "14", tone: "green" },
  { label: "Completate oggi", value: "32", tone: "green" },
];

function StatusDot({ tone }: { tone: "green" | "amber" | "red" }) {
  const className = `ceo-control-center__dot ceo-control-center__dot--${tone}`;
  return <span className={className} aria-hidden="true" />;
}

export function CeoControlCenter({ onOpenDecisionCenter }: { onOpenDecisionCenter: () => void }) {
  return (
    <section className="ceo-control-center" aria-label="CEO control center">
      <div className="ceo-control-center__grid">
        <article className="ceo-control-center__card ceo-control-center__card--priority">
          <div className="ceo-control-center__head">
            <span className="ceo-control-center__eyebrow">Priorità del giorno</span>
            <button className="ceo-control-center__action">Apri</button>
          </div>
          <div className="ceo-control-center__body">
            {priorityItems.map((item) => (
              <div className="ceo-control-center__item" key={item.label}>
                <span className="ceo-control-center__item-label">{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.meta}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="ceo-control-center__card ceo-control-center__card--ecosystems">
          <div className="ceo-control-center__head">
            <span className="ceo-control-center__eyebrow">Ecosistemi</span>
            <span className="ceo-control-center__hint">Dati demo</span>
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
          <p className="ceo-control-center__copy">Oggi il sistema suggerisce di verificare le priorità dei responsabili prima delle ore 12:00.</p>
          <button className="ceo-control-center__primary" onClick={onOpenDecisionCenter}>
            Apri Decision Center <ArrowRight size={16} />
          </button>
        </article>
      </div>
    </section>
  );
}
