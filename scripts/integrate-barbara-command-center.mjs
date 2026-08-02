import fs from "node:fs";

const appPath = "src/App.tsx";
let source = fs.readFileSync(appPath, "utf8");

const importAnchor = `import {\n  buildCeoPriorities,\n  buildExecutiveBriefing,\n  getCeoGeneralState,\n  getCeoGreeting,\n  type CeoPriority,\n} from "./lib/ceoIntelligence";`;

const barbaraImport = `${importAnchor}\nimport {\n  searchBarbaraResults,\n  type BarbaraResult,\n} from "./lib/barbaraCommandCenter";`;

if (!source.includes('from "./lib/barbaraCommandCenter"')) {
  if (!source.includes(importAnchor)) {
    throw new Error("Import anchor not found in src/App.tsx");
  }
  source = source.replace(importAnchor, barbaraImport);
}

const replacement = `  const searchResults = useMemo(() => {
    const closeCommandBar = () => {
      setSearchOpen(false);
      setSearchTerm("");
    };

    const runNavigationCommand = (
      id: string,
      target: ViewKey,
      title: string,
      subtitle: string,
      keywords: string[],
      priority = 60,
    ): BarbaraResult => ({
      id,
      kind: "command",
      title,
      subtitle,
      keywords,
      priority,
      action: () => {
        navigate(target);
        closeCommandBar();
      },
    });

    const candidates: BarbaraResult[] = [
      runNavigationCommand(
        "command-dashboard",
        "dashboard",
        "Apri Dashboard CEO",
        "Vai alla cabina di comando principale",
        ["dashboard", "home", "panoramica", "situazione generale", "cabina di comando"],
        100,
      ),
      runNavigationCommand(
        "command-decisions",
        "decisions",
        "Apri Decision Center",
        "Visualizza decisioni, approvazioni e attività bloccate",
        ["decision", "decisioni", "approva", "approvazioni", "da decidere", "bloccate"],
        95,
      ),
      runNavigationCommand(
        "command-posta",
        "posta",
        "Apri Eccomi Posta",
        "Controlla pratiche, invii e anomalie",
        ["posta", "raccomandate", "telegrammi", "pratiche posta", "invii"],
        90,
      ),
      runNavigationCommand(
        "command-noleggio",
        "noleggio",
        "Apri Eccomi Noleggio",
        "Controlla promozioni, lead e scadenze",
        ["noleggio", "auto", "promozioni", "offerte noleggio", "lead"],
        88,
      ),
      runNavigationCommand(
        "command-alerts",
        "ai",
        "Mostra ciò che richiede attenzione",
        "Apri AI & Alert con le priorità operative",
        ["attenzione", "alert", "criticita", "cosa non va", "cosa richiede", "priorita"],
        86,
      ),
      runNavigationCommand(
        "command-clients",
        "clients",
        "Apri Clienti",
        "Cerca anagrafiche, servizi e storico",
        ["clienti", "cliente", "anagrafiche", "storico"],
        80,
      ),
      runNavigationCommand(
        "command-ecosystems",
        "ecosystems",
        "Apri Ecosistemi",
        "Visualizza tutti i verticali ECCOMI",
        ["ecosistemi", "ecosistema", "verticali", "moduli"],
        78,
      ),
      runNavigationCommand(
        "command-reports",
        "reports",
        "Apri Report",
        "Visualizza risultati e indicatori dell’ecosistema",
        ["report", "risultati", "andamento", "kpi", "indicatori"],
        76,
      ),
      runNavigationCommand(
        "command-team",
        "team",
        "Apri Responsabili",
        "Visualizza ruoli e responsabilità",
        ["responsabili", "responsabile", "team", "ruoli"],
        72,
      ),
      runNavigationCommand(
        "command-operations",
        "operations",
        "Apri Operatori e attività",
        "Controlla attività operative e assegnazioni",
        ["operatori", "attivita", "task", "assegnazioni"],
        70,
      ),
      {
        id: "command-new-entry",
        kind: "command",
        title: "Crea una nuova entry",
        subtitle: "Avvia la procedura per ecosistema, servizio, progetto o idea",
        keywords: ["nuova entry", "nuovo progetto", "nuovo ecosistema", "crea eccomi", "crea nuovo"],
        priority: 92,
        action: () => {
          closeCommandBar();
          setNewEntryOpen(true);
        },
      },
      ...clients.map((client): BarbaraResult => ({
        id: \`client-\${client.id}\`,
        kind: "client",
        title: client.name,
        subtitle: \`\${client.id} · \${client.services.join(", ")}\`,
        keywords: [client.id, client.name, client.kind, client.contact, ...client.services],
        priority: 35,
        action: () => {
          setSelectedClient(client);
          closeCommandBar();
        },
      })),
      ...visibleEcosystems.map((item): BarbaraResult => ({
        id: \`ecosystem-\${item.id}\`,
        kind: "ecosystem",
        title: item.name,
        subtitle: \`\${item.status} · \${item.owner}\`,
        keywords: [item.id, item.name, item.status, item.owner, item.entryType || ""],
        priority: 45,
        action: () => {
          setSelectedEcosystem(item);
          closeCommandBar();
        },
      })),
      ...decisions.map((item): BarbaraResult => ({
        id: \`decision-\${item.id}\`,
        kind: "decision",
        title: item.title,
        subtitle: \`\${item.ecosystem} · \${item.status}\`,
        keywords: [item.title, item.ecosystem, item.status, item.urgency, item.due],
        priority: item.urgency === "Alta" ? 58 : item.urgency === "Media" ? 48 : 38,
        action: () => {
          navigate("decisions");
          closeCommandBar();
        },
      })),
    ];

    const labels: Record<BarbaraResult["kind"], string> = {
      command: "Comando",
      client: "Cliente",
      ecosystem: "Ecosistema",
      decision: "Decisione",
      practice: "Pratica",
    };

    return searchBarbaraResults(searchTerm, candidates, 8).map((result) => ({
      type: labels[result.kind],
      title: result.title,
      detail: result.subtitle,
      action: result.action,
    }));
  }, [searchTerm, visibleEcosystems, decisions]);`;

const blockPattern = /  const searchResults = useMemo\(\(\) => \{[\s\S]*?\n  \}, \[searchTerm, visibleEcosystems, decisions\]\);/;

if (!blockPattern.test(source)) {
  throw new Error("searchResults block not found in src/App.tsx");
}

source = source.replace(blockPattern, replacement);
fs.writeFileSync(appPath, source);
console.log("Barbara Command Center integrated into src/App.tsx");
