import {
  CheckCircle2,
  Database,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { ECOSYSTEMS } from "../lib/eccomi-os";

export function DataTrustPanel() {
  const connected = ECOSYSTEMS.filter(
    (app) => app.status === "LIVE" || app.status === "COLLEGATO",
  );

  const planned = ECOSYSTEMS.filter(
    (app) => app.status !== "LIVE" && app.status !== "COLLEGATO",
  );

  const coverage = Math.round(
    (connected.length / Math.max(ECOSYSTEMS.length, 1)) * 100,
  );

  return (
    <section className="data-trust-panel" aria-label="Copertura dati ECCOMI OS">
      <div className="data-trust-panel__identity">
        <span className="data-trust-panel__icon">
          <ShieldCheck size={20} />
        </span>

        <div>
          <small>DATA TRUST</small>
          <strong>Dati dichiarati, mai inventati</strong>
          <p>
            ECCOMI OS utilizza solo informazioni disponibili nei sistemi
            realmente collegati.
          </p>
        </div>
      </div>

      <div className="data-trust-panel__coverage">
        <div className="data-trust-panel__coverage-head">
          <span>Copertura integrazioni</span>
          <strong>{coverage}%</strong>
        </div>

        <div className="data-trust-panel__bar">
          <i style={{ width: `${coverage}%` }} />
        </div>
      </div>

      <div className="data-trust-panel__metrics">
        <div>
          <CheckCircle2 size={17} />
          <span>
            <strong>{connected.length}</strong>
            App collegate
          </span>
        </div>

        <div>
          <Unplug size={17} />
          <span>
            <strong>{planned.length}</strong>
            Da integrare
          </span>
        </div>

        <div>
          <Database size={17} />
          <span>
            <strong>0</strong>
            Valori stimati
          </span>
        </div>
      </div>
    </section>
  );
}
