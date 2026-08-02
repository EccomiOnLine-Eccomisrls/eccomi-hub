import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Gavel,
  Mail,
  CarFront,
  PlugZap,
} from "lucide-react";
import type { CeoPriority } from "../lib/ceoIntelligence";

type ConnectionState = "idle" | "loading" | "ready" | "error";

type ExecutiveSnapshotProps = {
  priorities: CeoPriority[];
  openDecisionCount: number;
  postaState: ConnectionState;
  noleggioState: ConnectionState;
  onOpenPriorities: () => void;
  onOpenDecisions: () => void;
  onOpenPosta: () => void;
  onOpenNoleggio: () => void;
};

function connectionLabel(state: ConnectionState) {
  if (state === "ready") return "Collegata";
  if (state === "loading") return "Aggiornamento";
  if (state === "error") return "Da verificare";
  return "Non disponibile";
}

function connectionTone(state: ConnectionState) {
  if (state === "ready") return "green";
  if (state === "error") return "red";
  return "amber";
}

export function ExecutiveSnapshot({
  priorities,
  openDecisionCount,
  postaState,
  noleggioState,
  onOpenPriorities,
  onOpenDecisions,
  onOpenPosta,
  onOpenNoleggio,
}: ExecutiveSnapshotProps) {
  const criticalCount = priorities.filter(
    (item) => item.severity === "critical",
  ).length;

  const warningCount = priorities.filter(
    (item) => item.severity === "warning",
  ).length;

  return (
    <section className="executive-snapshot" aria-label="Executive Snapshot">
      <div className="executive-snapshot__heading">
        <div>
          <span>EXECUTIVE SNAPSHOT</span>
          <h2>Il quadro che conta, adesso</h2>
          <p>
            Segnali operativi, decisioni e collegamenti reali in un’unica vista.
          </p>
        </div>

        <button onClick={onOpenPriorities}>
          Apri tutte le priorità <ArrowRight size={16} />
        </button>
      </div>

      <div className="executive-snapshot__grid">
        <button
          className={`executive-snapshot__card ${
            criticalCount ? "executive-snapshot__card--critical" : ""
          }`}
          onClick={onOpenPriorities}
        >
          <span className="executive-snapshot__icon">
            <AlertTriangle size={20} />
          </span>
          <small>ATTENZIONE CEO</small>
          <strong>{criticalCount + warningCount}</strong>
          <p>
            {criticalCount
              ? `${criticalCount} criticità richiedono un intervento immediato.`
              : warningCount
                ? `${warningCount} priorità operative da gestire.`
                : "Nessuna criticità urgente rilevata."}
          </p>
        </button>

        <button
          className="executive-snapshot__card"
          onClick={onOpenDecisions}
        >
          <span className="executive-snapshot__icon">
            <Gavel size={20} />
          </span>
          <small>DECISION CENTER</small>
          <strong>{openDecisionCount}</strong>
          <p>
            {openDecisionCount === 1
              ? "Una decisione è ancora aperta."
              : `${openDecisionCount} decisioni sono ancora aperte.`}
          </p>
        </button>

        <button className="executive-snapshot__card" onClick={onOpenPosta}>
          <span className="executive-snapshot__icon">
            <Mail size={20} />
          </span>
          <small>ECCOMI POSTA</small>
          <div className="executive-snapshot__status">
            <i
              className={`executive-snapshot__dot executive-snapshot__dot--${connectionTone(
                postaState,
              )}`}
            />
            {connectionLabel(postaState)}
          </div>
          <p>Dati operativi in sola lettura.</p>
        </button>

        <button
          className="executive-snapshot__card"
          onClick={onOpenNoleggio}
        >
          <span className="executive-snapshot__icon">
            <CarFront size={20} />
          </span>
          <small>ECCOMI NOLEGGIO</small>
          <div className="executive-snapshot__status">
            <i
              className={`executive-snapshot__dot executive-snapshot__dot--${connectionTone(
                noleggioState,
              )}`}
            />
            {connectionLabel(noleggioState)}
          </div>
          <p>Promozioni, lead e scadenze monitorati.</p>
        </button>
      </div>

      <div className="executive-snapshot__system">
        <span>
          <PlugZap size={17} />
          <strong>ECCOMI OS 0.2</strong>
        </span>

        <span>
          <CheckCircle2 size={16} />
          Executive Home in costruzione
        </span>
      </div>
    </section>
  );
}
