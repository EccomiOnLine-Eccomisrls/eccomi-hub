import {
  Activity,
  CarFront,
  CheckCircle2,
  Clock3,
  Gavel,
  Mail,
  RefreshCw,
  Server,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";

type ConnectionState = "idle" | "loading" | "ready" | "error";

type SystemPulseProps = {
  postaState: ConnectionState;
  noleggioState: ConnectionState;
  openDecisionCount: number;
  onOpenPosta: () => void;
  onOpenNoleggio: () => void;
  onOpenDecisionCenter: () => void;
};

type PulseStatus = "online" | "syncing" | "attention";

type PulseItem = {
  id: string;
  title: string;
  detail: string;
  status: PulseStatus;
  icon: typeof Activity;
  action?: () => void;
};

function stateToStatus(state: ConnectionState): PulseStatus {
  if (state === "ready") return "online";
  if (state === "loading" || state === "idle") return "syncing";
  return "attention";
}

function stateLabel(state: ConnectionState) {
  if (state === "ready") return "Collegamento attivo";
  if (state === "loading") return "Aggiornamento in corso";
  if (state === "error") return "Collegamento da verificare";
  return "In attesa di verifica";
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function SystemPulse({
  postaState,
  noleggioState,
  openDecisionCount,
  onOpenPosta,
  onOpenNoleggio,
  onOpenDecisionCenter,
}: SystemPulseProps) {
  const [checkedAt, setCheckedAt] = useState(() => new Date());
  const [checking, setChecking] = useState(false);

  const items = useMemo<PulseItem[]>(
    () => [
      {
        id: "os",
        title: "ECCOMI OS",
        detail: "Sistema centrale operativo",
        status: "online",
        icon: Server,
      },
      {
        id: "posta",
        title: "Eccomi Posta",
        detail: stateLabel(postaState),
        status: stateToStatus(postaState),
        icon: Mail,
        action: onOpenPosta,
      },
      {
        id: "noleggio",
        title: "Eccomi Noleggio",
        detail: stateLabel(noleggioState),
        status: stateToStatus(noleggioState),
        icon: CarFront,
        action: onOpenNoleggio,
      },
      {
        id: "decisions",
        title: "Decision Center",
        detail:
          openDecisionCount === 1
            ? "1 decisione aperta"
            : `${openDecisionCount} decisioni aperte`,
        status: openDecisionCount > 0 ? "attention" : "online",
        icon: Gavel,
        action: onOpenDecisionCenter,
      },
    ],
    [
      postaState,
      noleggioState,
      openDecisionCount,
      onOpenPosta,
      onOpenNoleggio,
      onOpenDecisionCenter,
    ],
  );

  function checkSession() {
    setChecking(true);

    window.setTimeout(() => {
      setCheckedAt(new Date());
      setChecking(false);
    }, 650);
  }

  return (
    <section className="system-pulse" aria-labelledby="system-pulse-title">
      <div className="system-pulse__head">
        <div>
          <span className="system-pulse__eyebrow">SYSTEM PULSE</span>
          <h2 id="system-pulse-title">Stato operativo</h2>
        </div>

        <div className="system-pulse__verification">
          <Clock3 size={14} />
          Verifica sessione: {formatTime(checkedAt)}

          <button
            type="button"
            aria-label="Aggiorna la verifica della sessione"
            title="Verifica nuovamente"
            onClick={checkSession}
          >
            <RefreshCw
              size={15}
              className={checking ? "system-pulse__spin" : undefined}
            />
          </button>
        </div>
      </div>

      <div className="system-pulse__grid">
        {items.map((item) => {
          const Icon = item.icon;
          const StatusIcon =
            item.status === "attention"
              ? TriangleAlert
              : item.status === "syncing"
                ? Activity
                : CheckCircle2;

          const content = (
            <>
              <span className="system-pulse__icon">
                <Icon size={19} />
              </span>

              <span className="system-pulse__content">
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </span>

              <span
                className={`system-pulse__status system-pulse__status--${item.status}`}
              >
                <StatusIcon size={14} />
              </span>
            </>
          );

          if (item.action) {
            return (
              <button
                type="button"
                className="system-pulse__item"
                key={item.id}
                onClick={item.action}
              >
                {content}
              </button>
            );
          }

          return (
            <div className="system-pulse__item" key={item.id}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
