import { Activity, ArrowRight, Sparkles } from "lucide-react";

type CeoTodayProps = {
  displayName: string;
  greeting: string;
  statusLabel: string;
  statusMessage: string;
  operatingEcosystems: number;
  activitiesToVerify: number;
  criticalIssues: number;
  dataModeLabel: string;
  objective: string;
  onOpenPriorities: () => void;
};

function formatItalianDate() {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function CeoToday({
  displayName,
  greeting,
  statusLabel,
  statusMessage,
  operatingEcosystems,
  activitiesToVerify,
  criticalIssues,
  dataModeLabel,
  objective,
  onOpenPriorities,
}: CeoTodayProps) {
  const formattedDate = formatItalianDate();

  return (
    <section className="ceo-today" aria-labelledby="ceo-today-title">
      <div className="ceo-today__panel">
        <div className="ceo-today__hero">
          <div className="ceo-today__intro">
            <span className="ceo-today__eyebrow">ECCOMI OS · EXECUTIVE HOME</span>
            <h2 id="ceo-today-title">{greeting || `Buongiorno ${displayName}`}</h2>
            <p>{formattedDate}</p>
          </div>
          <span className="ceo-today__demo-pill">{dataModeLabel}</span>
        </div>

        <div className="ceo-today__body">
          <div className="ceo-today__focus">
            <div className="ceo-today__state-card">
              <span className="ceo-today__chip">
                <Activity size={15} /> Briefing esecutivo
              </span>
              <strong>{statusLabel}</strong>
              <p>{statusMessage}</p>
            </div>

            <div className="ceo-today__focus-list">
              <div>
                <span>Release attiva</span>
                <strong>ECCOMI OS 0.2 · Executive Home</strong>
              </div>
              <div>
                <span>Obiettivo prioritario</span>
                <strong>{objective}</strong>
              </div>
            </div>
          </div>

          <div className="ceo-today__metrics" role="list" aria-label="Indicatori CEO">
            <div className="ceo-today__metric" role="listitem">
              <span className="ceo-today__metric-label">Priorità attive</span>
              <strong>{activitiesToVerify}</strong>
              <small>azioni suggerite da ECCOMI OS</small>
            </div>
            <div className="ceo-today__metric" role="listitem">
              <span className="ceo-today__metric-label">App monitorate</span>
              <strong>{operatingEcosystems}</strong>
              <small>ecosistemi presenti nel sistema</small>
            </div>
            <div className="ceo-today__metric" role="listitem">
              <span className="ceo-today__metric-label">Attività da verificare</span>
              <strong>{activitiesToVerify}</strong>
              <small>ordinate per urgenza e impatto</small>
            </div>
            <div className="ceo-today__metric ceo-today__metric--critical" role="listitem">
              <span className="ceo-today__metric-label">Criticità</span>
              <strong>{criticalIssues}</strong>
              <small>richiedono intervento immediato</small>
            </div>
          </div>
        </div>

        <div className="ceo-today__footer">
          <div className="ceo-today__footer-copy">
            <div className="ceo-today__footer-icon">
              <Sparkles size={16} />
            </div>
            <span>Prima ciò che richiede una decisione. Poi tutto il resto.</span>
          </div>
          <button className="ceo-today__action" onClick={onOpenPriorities}>
            Apri priorità <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
