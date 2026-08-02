import { Command, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Target =
  | "dashboard"
  | "posta"
  | "noleggio"
  | "decisions"
  | "ai"
  | "ecosystems";

type Item = {
  id: string;
  title: string;
  subtitle: string;
  target: Target;
};

const ITEMS: Item[] = [
  {
    id: "dashboard",
    title: "Executive Home",
    subtitle: "Torna alla dashboard principale",
    target: "dashboard",
  },
  {
    id: "posta",
    title: "Eccomi Posta",
    subtitle: "Apri il modulo Posta",
    target: "posta",
  },
  {
    id: "noleggio",
    title: "Eccomi Noleggio",
    subtitle: "Apri il modulo Noleggio",
    target: "noleggio",
  },
  {
    id: "decisions",
    title: "Decision Center",
    subtitle: "Decisioni aperte",
    target: "decisions",
  },
  {
    id: "ai",
    title: "Executive Intelligence",
    subtitle: "Priorità AI",
    target: "ai",
  },
  {
    id: "ecosystems",
    title: "Ecosistemi",
    subtitle: "Elenco completo",
    target: "ecosystems",
  },
];

export function CommandPalette({
  onNavigate,
}: {
  onNavigate: (view: Target) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }

      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return ITEMS;

    return ITEMS.filter((item) =>
      `${item.title} ${item.subtitle}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  }, [query]);

  if (!open) return null;

  return (
    <div className="command-palette-backdrop">
      <div className="command-palette">
        <div className="command-palette__search">
          <Search size={18} />

          <input
            autoFocus
            value={query}
            placeholder="Cerca un comando..."
            onChange={(e) => setQuery(e.target.value)}
          />

          <button onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="command-palette__list">
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.target);
                setOpen(false);
              }}
            >
              <div>
                <strong>{item.title}</strong>
                <small>{item.subtitle}</small>
              </div>

              <Command size={16} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
