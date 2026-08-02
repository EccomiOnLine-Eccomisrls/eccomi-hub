import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CarFront,
  CheckCircle2,
  Gavel,
  Mail,
  Send,
  Sparkles,
} from "lucide-react";
import {
  useMemo,
  useState,
  type FormEvent,
} from "react";
import type { CeoPriority } from "../lib/ceoIntelligence";

type ConnectionState =
  | "idle"
  | "loading"
  | "ready"
  | "error";

type CopilotTarget =
  | "dashboard"
  | "posta"
  | "noleggio"
  | "decisions"
  | "ai"
  | "ecosystems";

type ExecutiveCopilotProps = {
  priorities: CeoPriority[];
  openDecisionCount: number;
  postaState: ConnectionState;
  noleggioState: ConnectionState;
  onNavigate: (target: CopilotTarget) => void;
};

type CopilotAnswer = {
  title: string;
  message: string;
  target?: CopilotTarget;
  actionLabel?: string;
  tone: "neutral" | "critical" | "warning" | "opportunity";
};

const suggestions = [
  "Quali sono le priorità?",
  "Ci sono criticità?",
  "Quante decisioni sono aperte?",
  "Come sta Eccomi Posta?",
  "Come sta Eccomi Noleggio?",
  "Mostrami le opportunità",
];

function normalize(value: string) {
  return value
    .toLocaleLowerCase("it-IT")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function connectionDescription(
  name: string,
  state: ConnectionState,
): CopilotAnswer {
  if (state === "ready") {
    return {
      title: `${name} è collegata`,
      message:
        "Il collegamento operativo risulta disponibile nella sessione corrente.",
      tone: "neutral",
    };
  }

  if (state === "loading") {
    return {
      title: `${name} è in aggiornamento`,
      message:
        "ECCOMI OS sta attendendo il completamento della sincronizzazione.",
      tone: "warning",
    };
  }

  if (state === "error") {
    return {
      title: `${name} richiede una verifica`,
      message:
        "Il collegamento non è disponibile. Apri l’App per controllare configurazione e dati.",
      tone: "critical",
    };
  }

  return {
    title: `${name} non è ancora disponibile`,
    message:
      "Il sistema non ha ancora completato la verifica del collegamento.",
    tone: "warning",
  };
}

function buildAnswer({
  query,
  priorities,
  openDecisionCount,
  postaState,
  noleggioState,
}: {
  query: string;
  priorities: CeoPriority[];
  openDecisionCount: number;
  postaState: ConnectionState;
  noleggioState: ConnectionState;
}): CopilotAnswer {
  const value = normalize(query);

  const critical = priorities.filter(
    (item) => item.severity === "critical",
  );

  const warnings = priorities.filter(
    (item) => item.severity === "warning",
  );

  const opportunities = priorities.filter(
    (item) => item.severity === "opportunity",
  );

  if (
    value.includes("apri decision") ||
    value.includes("decision center")
  ) {
    return {
      title: "Decision Center",
      message:
        openDecisionCount === 1
          ? "È presente una decisione aperta."
          : `Sono presenti ${openDecisionCount} decisioni aperte.`,
      target: "decisions",
      actionLabel: "Apri Decision Center",
      tone: openDecisionCount ? "warning" : "neutral",
    };
  }

  if (
    value.includes("apri posta") ||
    value.includes("eccomi posta")
  ) {
    return {
      ...connectionDescription(
        "Eccomi Posta",
        postaState,
      ),
      target: "posta",
      actionLabel: "Apri Eccomi Posta",
    };
  }

  if (
    value.includes("apri noleggio") ||
    value.includes("eccomi noleggio")
  ) {
    return {
      ...connectionDescription(
        "Eccomi Noleggio",
        noleggioState,
      ),
      target: "noleggio",
      actionLabel: "Apri Eccomi Noleggio",
    };
  }

  if (
    value.includes("critic") ||
    value.includes("risch")
  ) {
    if (!critical.length) {
      return {
        title: "Nessuna criticità immediata",
        message:
          "Nei segnali disponibili non risultano criticità classificate come bloccanti.",
        target: "ai",
        actionLabel: "Apri AI e alert",
        tone: "neutral",
      };
    }

    return {
      title:
        critical.length === 1
          ? "Una criticità richiede attenzione"
          : `${critical.length} criticità richiedono attenzione`,
      message: critical
        .slice(0, 2)
        .map((item) => item.title)
        .join(" · "),
      target: "ai",
      actionLabel: "Apri criticità",
      tone: "critical",
    };
  }

  if (
    value.includes("priorita") ||
    value.includes("cosa devo fare") ||
    value.includes("cosa fare")
  ) {
    const operational = [...critical, ...warnings];

    if (!operational.length) {
      return {
        title: "Nessuna priorità urgente",
        message:
          "ECCOMI OS non rileva attività urgenti nei sistemi attualmente collegati.",
        tone: "neutral",
      };
    }

    return {
      title:
        operational.length === 1
          ? "Una priorità operativa"
          : `${operational.length} priorità operative`,
      message: operational
        .slice(0, 3)
        .map((item) => item.title)
        .join(" · "),
      target: "ai",
      actionLabel: "Apri priorità",
      tone: critical.length
        ? "critical"
        : "warning",
    };
  }

  if (
    value.includes("opportunita") ||
    value.includes("crescita")
  ) {
    if (!opportunities.length) {
      return {
        title: "Nessuna opportunità rilevata",
        message:
          "I sistemi collegati non espongono al momento opportunità operative.",
        tone: "neutral",
      };
    }

    return {
      title:
        opportunities.length === 1
          ? "Una opportunità rilevata"
          : `${opportunities.length} opportunità rilevate`,
      message: opportunities
        .slice(0, 3)
        .map((item) => item.title)
        .join(" · "),
      target:
        opportunities[0]?.targetView ?? "ai",
      actionLabel:
        opportunities[0]?.actionLabel ??
        "Apri opportunità",
      tone: "opportunity",
    };
  }

  if (
    value.includes("decision") ||
    value.includes("approvaz")
  ) {
    return {
      title:
        openDecisionCount === 0
          ? "Nessuna decisione aperta"
          : openDecisionCount === 1
            ? "Una decisione aperta"
            : `${openDecisionCount} decisioni aperte`,
      message:
        openDecisionCount === 0
          ? "Il Decision Center non mostra decisioni ancora da chiudere."
          : "Le decisioni aperte possono condizionare attività e prossimi sviluppi.",
      target: "decisions",
      actionLabel: "Apri Decision Center",
      tone: openDecisionCount
        ? "warning"
        : "neutral",
    };
  }

  if (
    value.includes("ecosistem") ||
    value.includes("app")
  ) {
    return {
      title: "Registro delle App",
      message:
        "Apri la vista Ecosistemi per controllare App operative, roadmap e nuovi sviluppi.",
      target: "ecosystems",
      actionLabel: "Apri Ecosistemi",
      tone: "neutral",
    };
  }

  return {
    title: "Comando non ancora riconosciuto",
    message:
      "Prova a chiedere priorità, criticità, opportunità, decisioni oppure lo stato di Posta e Noleggio.",
    tone: "neutral",
  };
}

function AnswerIcon({
  tone,
}: {
  tone: CopilotAnswer["tone"];
}) {
  if (tone === "critical") {
    return <AlertTriangle size={20} />;
  }

  if (tone === "warning") {
    return <Gavel size={20} />;
  }

  if (tone === "opportunity") {
    return <Sparkles size={20} />;
  }

  return <CheckCircle2 size={20} />;
}

export function ExecutiveCopilot({
  priorities,
  openDecisionCount,
  postaState,
  noleggioState,
  onNavigate,
}: ExecutiveCopilotProps) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] =
    useState("Quali sono le priorità?");

  const answer = useMemo(
    () =>
      buildAnswer({
        query: submittedQuery,
        priorities,
        openDecisionCount,
        postaState,
        noleggioState,
      }),
    [
      submittedQuery,
      priorities,
      openDecisionCount,
      postaState,
      noleggioState,
    ],
  );

  function submit(event: FormEvent) {
    event.preventDefault();

    const value = query.trim();

    if (!value) return;

    setSubmittedQuery(value);
    setQuery("");
  }

  function askSuggestion(value: string) {
    setSubmittedQuery(value);
    setQuery("");
  }

  return (
    <section
      className="executive-copilot"
      aria-labelledby="executive-copilot-title"
    >
      <div className="executive-copilot__head">
        <div className="executive-copilot__identity">
          <span>
            <Bot size={22} />
          </span>

          <div>
            <small>ECCOMI OS COPILOT</small>

            <h2 id="executive-copilot-title">
              Chiedi cosa sta succedendo
            </h2>

            <p>
              Risposte operative costruite esclusivamente sui
              segnali disponibili.
            </p>
          </div>
        </div>

        <span className="executive-copilot__mode">
          Livello 2 · AI Executive
        </span>
      </div>

      <form
        className="executive-copilot__form"
        onSubmit={submit}
      >
        <input
          value={query}
          placeholder="Esempio: quali sono le priorità?"
          aria-label="Domanda per ECCOMI OS Copilot"
          onChange={(event) =>
            setQuery(event.target.value)
          }
        />

        <button type="submit">
          <Send size={17} />
          Chiedi
        </button>
      </form>

      <div className="executive-copilot__suggestions">
        {suggestions.map((suggestion) => (
          <button
            type="button"
            key={suggestion}
            onClick={() => askSuggestion(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <article
        className={`executive-copilot__answer executive-copilot__answer--${answer.tone}`}
      >
        <span className="executive-copilot__answer-icon">
          <AnswerIcon tone={answer.tone} />
        </span>

        <div>
          <small>RISPOSTA OPERATIVA</small>
          <strong>{answer.title}</strong>
          <p>{answer.message}</p>
        </div>

        {answer.target && answer.actionLabel && (
          <button
            type="button"
            onClick={() => onNavigate(answer.target!)}
          >
            {answer.actionLabel}
            <ArrowRight size={15} />
          </button>
        )}
      </article>

      <div className="executive-copilot__connections">
        <span>
          <Mail size={15} />
          Posta
        </span>

        <span>
          <CarFront size={15} />
          Noleggio
        </span>

        <span>
          <Gavel size={15} />
          Decision Center
        </span>
      </div>
    </section>
  );
}
