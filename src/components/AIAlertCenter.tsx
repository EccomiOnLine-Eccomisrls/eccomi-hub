import { ArrowRight, AlertTriangle, Bot, CheckCircle2, ChevronDown, Lightbulb, Sparkles, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  explainCeoPriority,
  type CeoPriority,
  type CeoPrioritySeverity,
} from "../lib/ceoIntelligence";

type AIAlertCenterProps = {
  priorities: CeoPriority[];
  onNavigate: (view: CeoPriority["targetView"]) => void;
};

type FilterKey = "all" | CeoPrioritySeverity;

const filterLabels: Record<FilterKey, string> = {
  all: "Tutti",
  critical: "Critici",
  warning: "Da verificare",
  opportunity: "Opportunità",
  info: "Informativi",
};

const severityMeta: Record<CeoPrioritySeverity, { label: string; icon: typeof AlertTriangle; className: string }> = {
  critical: { label: "Critico", icon: AlertTriangle, className: "ai-alert-card--critical" },
  warning: { label: "Da verificare", icon: TrendingUp, className: "ai-alert-card--warning" },
  opportunity: { label: "Opportunità", icon: Lightbulb, className: "ai-alert-card--opportunity" },
  info: { label: "Informativo", icon: CheckCircle2, className: "ai-alert-card--info" },
};

function getActionLabel(targetView: CeoPriority["targetView"]) {
  if (targetView === "posta") return "Apri Posta";
  if (targetView === "noleggio") return "Apri Noleggio";
  if (targetView === "decisions") return "Apri Decision Center";
  return "Apri dashboard";
}

export function AIAlertCenter({ priorities, onNavigate }: AIAlertCenterProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [expandedPriorityId, setExpandedPriorityId] = useState<string | null>(null);
  const filteredPriorities = useMemo(() => {
    if (activeFilter === "all") return priorities;
    return priorities.filter((item) => item.severity === activeFilter);
  }, [activeFilter, priorities]);

  return (
    <div className="view-stack">
      <section className="ai-hero">
        <div className="ai-hero__icon"><Sparkles size={31} /></div>
        <div>
          <span>ASSISTENTE DI GOVERNO</span>
          <h2>Le priorità emergono dai dati reali già disponibili.</h2>
          <p>Ogni suggerimento collega un rischio, un'opportunità o una decisione all’area operativa più adatta.</p>
        </div>
        <div className="ai-hero__stat">
          <small>Priorità attive</small>
          <strong>{priorities.length}</strong>
          <span><span className="status-dot status-dot--green" /> Aggiornate in tempo reale</span>
        </div>
      </section>

      <section className="ai-layout">
        <div className="panel alert-feed">
          <div className="panel__head">
            <div className="panel-title">
              <span className="panel-icon panel-icon--ai"><Bot size={18} /></span>
              <span><small>AI & ALERT</small><strong>Priorità operative</strong></span>
            </div>
            <div className="ai-filter-row" role="tablist" aria-label="Filtri priorità">
              {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
                <button
                  key={key}
                  className={key === activeFilter ? "ai-filter-pill ai-filter-pill--active" : "ai-filter-pill"}
                  onClick={() => setActiveFilter(key)}
                >
                  {filterLabels[key]}
                </button>
              ))}
            </div>
          </div>
          <div className="alert-list">
            {filteredPriorities.map((priority) => {
              const meta = severityMeta[priority.severity];
              const Icon = meta.icon;
              const explanation = explainCeoPriority(priority);
              const expanded = expandedPriorityId === priority.id;

              return (
                <article className={`alert-card ${meta.className}`} key={priority.id}>
                  <span className={`alert-icon alert-icon--${priority.severity}`}>
                    <Icon size={19} />
                  </span>
                  <div>
                    <div className="alert-card__top">
                      <span className={`priority-tag priority-tag--${priority.severity}`}>{meta.label}</span>
                      <small>{priority.ecosystem}</small>
                    </div>
                    <h3>{priority.title}</h3>
                    <p>{priority.description}</p>

                    <div className="alert-card__actions">
                      <button
                        className="alert-card__why-button"
                        onClick={() =>
                          setExpandedPriorityId(
                            expanded ? null : priority.id,
                          )
                        }
                        aria-expanded={expanded}
                      >
                        Perché lo vedo?
                        <ChevronDown
                          size={15}
                          className={
                            expanded
                              ? "alert-card__chevron alert-card__chevron--open"
                              : "alert-card__chevron"
                          }
                        />
                      </button>

                      <button onClick={() => onNavigate(priority.targetView)}>
                        {priority.actionLabel} <ArrowRight size={15} />
                      </button>
                    </div>

                    {expanded && (
                      <div className="decision-intelligence">
                        <div className="decision-intelligence__item">
                          <span>PERCHÉ</span>
                          <p>{explanation.why}</p>
                        </div>

                        <div className="decision-intelligence__item decision-intelligence__item--risk">
                          <span>RISCHIO SE NON INTERVIENI</span>
                          <p>{explanation.risk}</p>
                        </div>

                        <div className="decision-intelligence__item decision-intelligence__item--benefit">
                          <span>BENEFICIO ATTESO</span>
                          <p>{explanation.benefit}</p>
                        </div>

                        <div className="decision-intelligence__recommendation">
                          <Sparkles size={16} />
                          <div>
                            <span>AZIONE CONSIGLIATA</span>
                            <strong>{explanation.recommendedAction}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
            {!filteredPriorities.length && <div className="empty-state"><Sparkles size={24} /><strong>Nessun elemento per questo filtro</strong><span>Prova un’altra categoria di priorità.</span></div>}
          </div>
        </div>
        <aside className="panel ai-rules">
          <div className="panel__head">
            <div className="panel-title">
              <span className="panel-icon"><Sparkles size={18} /></span>
              <span><small>GUIDA</small><strong>Come usare il centro</strong></span>
            </div>
          </div>
          <div className="rule-list">
            <div className="rule-item">
              <strong>Priorità operative</strong>
              <p>Le card si aggiornano con i dati reali già caricati da Posta e Noleggio.</p>
            </div>
            <div className="rule-item">
              <strong>Azioni immediate</strong>
              <p>Ogni CTA porta direttamente alla vista più utile per la gestione del caso.</p>
            </div>
            <div className="rule-item">
              <strong>Decisioni urgenti</strong>
              <p>Le decisioni aperte alimentano automaticamente il centro alert e la dashboard CEO.</p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
