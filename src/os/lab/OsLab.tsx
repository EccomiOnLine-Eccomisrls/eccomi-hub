import {
  Activity,
  Bot,
  CheckCircle2,
  Network,
} from "lucide-react";
import {
  EcoBadge,
  EcoButton,
  EcoCard,
  EcoKpiCard,
  EcoSectionHeader,
  EcoToolCard,
} from "../../design-system/components";
import { osApps } from "../registry";

export function OsLab() {
  return (
    <div className="os-lab">
      <EcoSectionHeader
        eyebrow="ECCOMI OS"
        title="Design System Lab"
        description="Catalogo vivente dei componenti condivisi della piattaforma."
        action={
          <EcoBadge tone="success" dot>
            Foundation attiva
          </EcoBadge>
        }
      />

      <section className="os-lab__section">
        <h3>Azioni</h3>
        <div className="os-lab__row">
          <EcoButton>Primaria</EcoButton>
          <EcoButton variant="secondary">Secondaria</EcoButton>
          <EcoButton variant="ghost">Ghost</EcoButton>
          <EcoButton variant="danger">Pericolosa</EcoButton>
        </div>
      </section>

      <section className="os-lab__section">
        <h3>Stati</h3>
        <div className="os-lab__row">
          <EcoBadge tone="success" dot>Live</EcoBadge>
          <EcoBadge tone="warning" dot>Attenzione</EcoBadge>
          <EcoBadge tone="danger" dot>Critico</EcoBadge>
          <EcoBadge tone="ai" dot>AI</EcoBadge>
          <EcoBadge tone="info" dot>Collegato</EcoBadge>
        </div>
      </section>

      <section className="os-lab__section">
        <h3>KPI</h3>
        <div className="os-lab__grid os-lab__grid--four">
          <EcoKpiCard
            label="Ecosistemi"
            value={osApps.length}
            description="App registrate in ECCOMI OS"
            icon={<Network size={22} />}
          />
          <EcoKpiCard
            label="AI Executive"
            value="Live"
            description="Servizio centrale disponibile"
            tone="ai"
            icon={<Bot size={22} />}
          />
          <EcoKpiCard
            label="Sistemi"
            value="OK"
            description="Nessun errore critico"
            tone="success"
            icon={<CheckCircle2 size={22} />}
          />
          <EcoKpiCard
            label="Attività"
            value={18}
            description="Esempio componente operativo"
            tone="warning"
            icon={<Activity size={22} />}
          />
        </div>
      </section>

      <section className="os-lab__section">
        <h3>Tool Card</h3>
        <div className="os-lab__grid os-lab__grid--three">
          <EcoToolCard
            eyebrow="AI Executive"
            title="Executive Copilot"
            description="Analizza i segnali disponibili e suggerisce le azioni."
            action="Apri"
            tone="ai"
            icon={<Bot size={20} />}
            onClick={() => undefined}
          />
          <EcoToolCard
            eyebrow="Sistema"
            title="App Registry"
            description={`${osApps.length} applicazioni registrate nella piattaforma.`}
            action="Esamina"
            tone="primary"
            icon={<Network size={20} />}
            onClick={() => undefined}
          />
          <EcoToolCard
            eyebrow="Controllo"
            title="System Pulse"
            description="Visualizza lo stato tecnico degli ecosistemi."
            action="Verifica"
            tone="success"
            icon={<Activity size={20} />}
            onClick={() => undefined}
          />
        </div>
      </section>

      <section className="os-lab__section">
        <h3>App Registry</h3>
        <div className="os-lab__apps">
          {osApps.map((app) => {
            const Icon = app.icon;

            return (
              <EcoCard
                key={app.id}
                tone={app.enabled ? "primary" : "neutral"}
                interactive
                className="os-lab__app"
              >
                <span>
                  <Icon size={20} />
                </span>
                <div>
                  <small>{app.version}</small>
                  <strong>{app.name}</strong>
                  <p>{app.description}</p>
                </div>
                <EcoBadge
                  tone={
                    app.status === "LIVE"
                      ? "success"
                      : app.status === "SVILUPPO"
                        ? "warning"
                        : "neutral"
                  }
                  dot
                >
                  {app.status}
                </EcoBadge>
              </EcoCard>
            );
          })}
        </div>
      </section>
    </div>
  );
}
