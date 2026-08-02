import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Gavel,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CeoPriority } from "../lib/ceoIntelligence";

type WhatChangedProps = {
  priorities: CeoPriority[];
  openDecisionCount: number;
  onOpenPriorities: () => void;
  onOpenDecisions: () => void;
};

type Snapshot = {
  savedAt: string;
  priorityCount: number;
  criticalCount: number;
  opportunityCount: number;
  openDecisionCount: number;
};

type ChangeItem = {
  id: string;
  label: string;
  current: number;
  previous: number;
  difference: number;
  tone: "critical" | "warning" | "opportunity" | "neutral";
};

const STORAGE_KEY = "eccomi-os:last-executive-snapshot";

function createSnapshot(
  priorities: CeoPriority[],
  openDecisionCount: number,
): Snapshot {
  return {
    savedAt: new Date().toISOString(),
    priorityCount: priorities.filter(
      (item) =>
        item.severity === "critical" ||
        item.severity === "warning",
    ).length,
    criticalCount: priorities.filter(
      (item) => item.severity === "critical",
    ).length,
    opportunityCount: priorities.filter(
      (item) => item.severity === "opportunity",
    ).length,
    openDecisionCount,
  };
}

function readSnapshot(): Snapshot | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) return null;

    const parsed = JSON.parse(stored) as Partial<Snapshot>;

    if (
      typeof parsed.savedAt !== "string" ||
      typeof parsed.priorityCount !== "number" ||
      typeof parsed.criticalCount !== "number" ||
      typeof parsed.opportunityCount !== "number" ||
      typeof parsed.openDecisionCount !== "number"
    ) {
      return null;
    }

    return parsed as Snapshot;
  } catch {
    return null;
  }
}

function saveSnapshot(snapshot: Snapshot) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(snapshot),
    );
  } catch {
    // Il confronto resta disponibile nella sessione corrente.
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ChangeIndicator({
  difference,
  positiveIsGood = false,
}: {
  difference: number;
  positiveIsGood?: boolean;
}) {
  if (difference === 0) {
    return (
      <span className="what-changed__difference what-changed__difference--same">
        Nessuna variazione
      </span>
    );
  }

  const improved = positiveIsGood
    ? difference > 0
    : difference < 0;

  const Icon = difference > 0 ? ArrowUp : ArrowDown;

  return (
    <span
      className={`what-changed__difference ${
        improved
          ? "what-changed__difference--good"
          : "what-changed__difference--attention"
      }`}
    >
      <Icon size={13} />
      {difference > 0 ? "+" : ""}
      {difference}
    </span>
  );
}

export function WhatChanged({
  priorities,
  openDecisionCount,
  onOpenPriorities,
  onOpenDecisions,
}: WhatChangedProps) {
  const currentSnapshot = useMemo(
    () => createSnapshot(priorities, openDecisionCount),
    [priorities, openDecisionCount],
  );

  const [previousSnapshot, setPreviousSnapshot] =
    useState<Snapshot | null>(() => readSnapshot());

  const [referenceSaved, setReferenceSaved] = useState(false);

  const changes = useMemo<ChangeItem[]>(() => {
    if (!previousSnapshot) return [];

    return [
      {
        id: "priorities",
        label: "Priorità operative",
        current: currentSnapshot.priorityCount,
        previous: previousSnapshot.priorityCount,
        difference:
          currentSnapshot.priorityCount -
          previousSnapshot.priorityCount,
        tone: "warning",
      },
      {
        id: "critical",
        label: "Criticità",
        current: currentSnapshot.criticalCount,
        previous: previousSnapshot.criticalCount,
        difference:
          currentSnapshot.criticalCount -
          previousSnapshot.criticalCount,
        tone: "critical",
      },
      {
        id: "opportunities",
        label: "Opportunità",
        current: currentSnapshot.opportunityCount,
        previous: previousSnapshot.opportunityCount,
        difference:
          currentSnapshot.opportunityCount -
          previousSnapshot.opportunityCount,
        tone: "opportunity",
      },
      {
        id: "decisions",
        label: "Decisioni aperte",
        current: currentSnapshot.openDecisionCount,
        previous: previousSnapshot.openDecisionCount,
        difference:
          currentSnapshot.openDecisionCount -
          previousSnapshot.openDecisionCount,
        tone: "neutral",
      },
    ];
  }, [currentSnapshot, previousSnapshot]);

  const totalChanges = changes.filter(
    (item) => item.difference !== 0,
  ).length;

  useEffect(() => {
    if (!previousSnapshot) {
      saveSnapshot(currentSnapshot);
      setPreviousSnapshot(currentSnapshot);
      setReferenceSaved(true);
    }
  }, [currentSnapshot, previousSnapshot]);

  function updateReference() {
    const nextSnapshot = createSnapshot(
      priorities,
      openDecisionCount,
    );

    saveSnapshot(nextSnapshot);
    setPreviousSnapshot(nextSnapshot);
    setReferenceSaved(true);
  }

  return (
    <section
      className="what-changed"
      aria-labelledby="what-changed-title"
    >
      <div className="what-changed__head">
        <div>
          <span className="what-changed__eyebrow">
            WHAT CHANGED
          </span>

          <h2 id="what-changed-title">
            Cosa è cambiato dall’ultima visita
          </h2>

          <p>
            ECCOMI OS confronta i segnali attuali con l’ultimo
            riferimento salvato su questo dispositivo.
          </p>
        </div>

        <button type="button" onClick={updateReference}>
          <RefreshCw size={15} />
          Aggiorna riferimento
        </button>
      </div>

      {referenceSaved && !totalChanges ? (
        <div className="what-changed__stable">
          <CheckCircle2 size={21} />

          <div>
            <strong>Riferimento aggiornato</strong>
            <p>
              Da questo momento ECCOMI OS inizierà a rilevare le
              variazioni successive.
            </p>
          </div>
        </div>
      ) : (
        <div className="what-changed__layout">
          <div className="what-changed__grid">
            {changes.map((item) => {
              const Icon =
                item.tone === "critical"
                  ? AlertTriangle
                  : item.tone === "opportunity"
                    ? Sparkles
                    : item.tone === "neutral"
                      ? Gavel
                      : RefreshCw;

              return (
                <article
                  className={`what-changed__item what-changed__item--${item.tone}`}
                  key={item.id}
                >
                  <span className="what-changed__icon">
                    <Icon size={18} />
                  </span>

                  <div>
                    <small>{item.label}</small>

                    <strong>{item.current}</strong>

                    <span>
                      Prima: {item.previous}
                    </span>
                  </div>

                  <ChangeIndicator
                    difference={item.difference}
                    positiveIsGood={
                      item.id === "opportunities"
                    }
                  />
                </article>
              );
            })}
          </div>

          <aside className="what-changed__summary">
            <small>SINTESI</small>

            <strong>
              {totalChanges === 0
                ? "Situazione invariata"
                : totalChanges === 1
                  ? "Una variazione rilevata"
                  : `${totalChanges} variazioni rilevate`}
            </strong>

            <p>
              Ultimo riferimento:{" "}
              {previousSnapshot
                ? formatDate(previousSnapshot.savedAt)
                : "appena creato"}
            </p>

            <div>
              <button
                type="button"
                onClick={onOpenPriorities}
              >
                Apri priorità
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                onClick={onOpenDecisions}
              >
                Decision Center
                <ArrowRight size={15} />
              </button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
