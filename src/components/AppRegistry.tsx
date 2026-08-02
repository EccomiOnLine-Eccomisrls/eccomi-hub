import {
  ArrowRight,
  BookOpen,
  Boxes,
  CarFront,
  Mail,
  Package,
  PlugZap,
  Zap,
} from "lucide-react";
import {
  ECOSYSTEMS,
  type Ecosystem,
  type EcosystemStatus,
} from "../lib/eccomi-os";

type AppRegistryProps = {
  onOpenPosta: () => void;
  onOpenNoleggio: () => void;
  onOpenEcosystems: () => void;
};

function getIcon(id: string) {
  if (id === "os") return Boxes;
  if (id === "posta") return Mail;
  if (id === "noleggio") return CarFront;
  if (id === "energia") return Zap;
  if (id === "guide") return BookOpen;
  if (id === "spedizioni") return Package;
  return PlugZap;
}

function getStatusLabel(status: EcosystemStatus) {
  if (status === "LIVE") return "Live";
  if (status === "COLLEGATO") return "Collegata";
  if (status === "ROADMAP") return "Roadmap";
  if (status === "SPRINT") return "Prossimo sprint";
  return "Offline";
}

function getStatusTone(status: EcosystemStatus) {
  if (status === "LIVE" || status === "COLLEGATO") return "green";
  if (status === "SPRINT") return "violet";
  if (status === "OFFLINE") return "red";
  return "amber";
}

function isAvailable(app: Ecosystem) {
  return (
    app.status === "LIVE" ||
    app.status === "COLLEGATO"
  );
}

export function AppRegistry({
  onOpenPosta,
  onOpenNoleggio,
  onOpenEcosystems,
}: AppRegistryProps) {
  function openApp(app: Ecosystem) {
    if (app.id === "posta") {
      onOpenPosta();
      return;
    }

    if (app.id === "noleggio") {
      onOpenNoleggio();
      return;
    }

    onOpenEcosystems();
  }

  return (
    <section className="app-registry" aria-labelledby="app-registry-title">
      <div className="app-registry__head">
        <div>
          <span className="app-registry__eyebrow">APP REGISTRY</span>
          <h2 id="app-registry-title">Le App di ECCOMI OS</h2>
          <p>
            Un unico registro per governare ecosistemi attivi, collegamenti e
            prossimi sviluppi.
          </p>
        </div>

        <button type="button" onClick={onOpenEcosystems}>
          Gestisci ecosistemi
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="app-registry__grid">
        {ECOSYSTEMS.map((app) => {
          const Icon = getIcon(app.id);
          const available = isAvailable(app);
          const tone = getStatusTone(app.status);

          return (
            <button
              type="button"
              className={`app-registry__card ${
                available
                  ? "app-registry__card--available"
                  : "app-registry__card--planned"
              }`}
              key={app.id}
              onClick={() => openApp(app)}
            >
              <div className="app-registry__top">
                <span className="app-registry__icon">
                  <Icon size={21} />
                </span>

                <span
                  className={`app-registry__status app-registry__status--${tone}`}
                >
                  <i />
                  {getStatusLabel(app.status)}
                </span>
              </div>

              <div className="app-registry__content">
                <strong>{app.name}</strong>
                <p>{app.description}</p>
              </div>

              <span className="app-registry__action">
                {available ? "Apri App" : "Vedi roadmap"}
                <ArrowRight size={15} />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
