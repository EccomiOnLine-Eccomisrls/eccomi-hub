import { Activity, AlertTriangle, ArrowRight, CalendarDays, Sparkles, Target, TrendingUp } from "lucide-react";

type CeoTodayProps = {
  displayName: string;
  statusLabel: string;
  statusMessage: string;
  operatingEcosystems: number;
  activitiesToVerify: number;
  criticalIssues: number;
  onOpenPriorities: () => void;
};

function getGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Buongiorno ${name}`;
  if (hour < 18) return `Buon pomeriggio ${name}`;
  return `Buonasera ${name}`;
}

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
  statusLabel,
  statusMessage,
  operatingEcosystems,
  activitiesToVerify,
  criticalIssues,
  onOpenPriorities,
}: CeoTodayProps) {
  const greeting = getGreeting(displayName);
  const formattedDate = formatItalianDate();

  return (
    <section className="ceo-today" aria-labelledby="ceo-today-title">
      <div className="ceo-today__panel">
        <div className="ceo-today__hero">
          <div className="ceo-today__intro">
            <span className="ceo-today__eyebrow">ECCOMI TODAY</span>
            <h2 id="ceo-today-title">{greeting}</h2>
            <p>{formattedDate}</p>
          </div>
          <span className="ceo-today__demo-pill">Dati dimostrativi</span>
        </div>

        <div className="ceo-today__body">
          <div className="ceo-today__focus">
            <div className="ceo-today__state-card">
              <span className="ceo-today__chip">
                <Activity size={15} /> Stato generale
              </span>
              <strong>{statusLabel}</strong>
              <p>{statusMessage}</p>
            </div>

            <div className="ceo-today__focus-list">
              <div>
                <span>Sprint attivo</span>
                <strong>HUB 2.0 – CEO Operating System</strong>
              </div>
              <div>
                <span>Obiettivo del giorno</span>
                <strong>Rendere ECCOMI HUB la cabina di comando dell’ecosistema</strong>
              </div>
            </div>
          </div>

          <div className="ceo-today__metrics" role="list" aria-label="Indicatori CEO">
            <div className="ceo-today__metric" role="listitem">
              <span className="ceo-today__metric-label">+1 di oggi</span>
              <strong>+1</strong>
              <small>Nuovo focus CEO</small>
            </div>
            <div className="ceo-today__metric" role="listitem">
              <span className="ceo-today__metric-label">Ecosistemi operativi</span>
              <strong>{operatingEcosystems}</strong>
              <small>monitorati in tempo reale</small>
            </div>
            <div className="ceo-today__metric" role="listitem">
              <span className="ceo-today__metric-label">Attività da verificare</span>
              <strong>{activitiesToVerify}</strong>
              <small>task con priorità elevata</small>
            </div>
            <div className="ceo-today__metric ceo-today__metric--critical" role="listitem">
              <span className="ceo-today__metric-label">Criticità</span>
              <strong>{criticalIssues}</strong>
              <small>richiedono attenzione</small>
            </div>
          </div>
        </div>

        <div className="ceo-today__footer">
          <div className="ceo-today__footer-copy">
            <div className="ceo-today__footer-icon">
              <Sparkles size={16} />
            </div>
            <span>Controllo centralizzato, decisioni rapide e priorità chiare.</span>
          </div>
          <button className="ceo-today__action" onClick={onOpenPriorities}>
            Vedi priorità <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
