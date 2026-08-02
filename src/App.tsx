"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  AtSign,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CarFront,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  FileText,
  FolderKanban,
  Gavel,
  Gauge,
  KeyRound,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  MessageSquareText,
  Network,
  Package,
  PanelLeftClose,
  Pencil,
  Plus,
  Search,
  Save,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TicketCheck,
  TrendingUp,
  Trash2,
  User,
  UserCheck,
  UserCog,
  Users,
  WalletCards,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AIAlertCenter } from "./components/AIAlertCenter";
import { CeoControlCenter } from "./components/CeoControlCenter";
import { ExecutiveSnapshot } from "./components/ExecutiveSnapshot";
import { ExecutiveTimeline } from "./components/ExecutiveTimeline";
import { AppRegistry } from "./components/AppRegistry";
import { ExecutiveIntelligence } from "./components/ExecutiveIntelligence";
import { ExecutiveActionQueue } from "./components/ExecutiveActionQueue";
import { ExecutiveNavigator } from "./components/ExecutiveNavigator";
import { DataTrustPanel } from "./components/DataTrustPanel";
import { CeoToday } from "./components/CeoToday";
import {
  advanceHubEntryToEvaluation,
  advanceHubProjectToTest,
  configurePostaConnection,
  createHubEntry,
  decideHubEvaluation,
  generateHubEvaluation,
  getHubProjectPlan,
  getNoleggioSummary,
  getPostaSummary,
  HubApiError,
  listHubEntries,
  refreshLoginSession,
  requestLoginCode,
  saveHubProjectPlan,
  verifyLoginCode,
  type HubEntry,
  type HubEntryInput,
  type HubEntryKind,
  type HubEntryStatus,
  type HubEvaluation,
  type HubPlanningCondition,
  type HubPlanningKpi,
  type HubPlanningTask,
  type HubPlanningTaskStatus,
  type HubProjectPlan,
  type HubProjectPlanInput,
  type HubSession,
  type HubUser,
  type NoleggioSummary,
  type PostaSummary,
} from "./lib/hubApi";
import {
  buildCeoPriorities,
  buildExecutiveBriefing,
  getCeoGeneralState,
  getCeoGreeting,
  type CeoPriority,
} from "./lib/ceoIntelligence";
import {
  searchEccomiOS,
  type EccomiOSResult,
} from "./lib/eccomiOS";

type ViewKey =
  | "dashboard"
  | "posta"
  | "noleggio"
  | "ecosystems"
  | "clients"
  | "team"
  | "operations"
  | "decisions"
  | "ai"
  | "reports"
  | "settings";

type Ecosystem = {
  id: string;
  name: string;
  short: string;
  icon: "energy" | "mail" | "rental" | "shipping" | "pec" | "generic";
  color: string;
  soft: string;
  status: HubEntryStatus | "Attenzione";
  owner: string;
  revenue: string;
  margin: string;
  open: number;
  trend: string;
  primaryMetricLabel?: string;
  secondaryMetricLabel?: string;
  dataMode?: "real" | "demo" | "loading" | "error";
  entryType?: HubEntryKind;
  customerNeed?: string;
  objective?: string;
  dnaLink?: string;
  revenueModel?: string;
  expectedCosts?: number;
  timeHorizonDays?: number;
  risks?: string;
  createdAt?: string;
  persisted?: boolean;
};

type Client = {
  id: string;
  name: string;
  kind: string;
  contact: string;
  services: string[];
  status: "Attivo" | "In attivazione" | "Attenzione";
  value: string;
  last: string;
};

type Decision = {
  id: number;
  title: string;
  ecosystem: string;
  impact: string;
  urgency: "Alta" | "Media" | "Bassa";
  due: string;
  status: "Da analizzare" | "Informazioni richieste" | "Decisa";
  recommendation: string;
  assignedTo?: string;
};

const initialEcosystems: Ecosystem[] = [
  {
    id: "energia",
    name: "Eccomi Energia",
    short: "EN",
    icon: "energy",
    color: "#e5a000",
    soft: "#fff7dc",
    status: "Attenzione",
    owner: "Responsabile Energia",
    revenue: "€ 18.420",
    margin: "31,4%",
    open: 24,
    trend: "+14,2%",
  },
  {
    id: "posta",
    name: "Eccomi Posta",
    short: "PO",
    icon: "mail",
    color: "#2563eb",
    soft: "#eaf1ff",
    status: "Operativo",
    owner: "Responsabile Poste",
    revenue: "—",
    margin: "—",
    open: 0,
    trend: "Sola lettura",
    primaryMetricLabel: "Pratiche totali",
    secondaryMetricLabel: "Inviate a Poste",
    dataMode: "loading",
  },
  {
    id: "noleggio",
    name: "Eccomi Noleggio",
    short: "NO",
    icon: "rental",
    color: "#0c5597",
    soft: "#e9f2fa",
    status: "Operativo",
    owner: "Responsabile Eccomi Noleggio",
    revenue: "—",
    margin: "—",
    open: 0,
    trend: "Collegamento in corso",
    primaryMetricLabel: "Promozioni online",
    secondaryMetricLabel: "Lead totali",
    dataMode: "loading",
  },
  {
    id: "spedizioni",
    name: "Eccomi Spedizioni",
    short: "SP",
    icon: "shipping",
    color: "#0f9f6e",
    soft: "#e6f8f1",
    status: "Operativo",
    owner: "Responsabile Spedizioni",
    revenue: "€ 9.730",
    margin: "24,9%",
    open: 17,
    trend: "+5,1%",
  },
  {
    id: "pec",
    name: "Eccomi PEC",
    short: "PE",
    icon: "pec",
    color: "#7c3aed",
    soft: "#f1eaff",
    status: "Progettazione",
    owner: "Sotto controllo CEO",
    revenue: "€ 0",
    margin: "—",
    open: 7,
    trend: "In avvio",
  },
];

const clients: Client[] = [
  {
    id: "EC-100284",
    name: "Giulia Bianchi",
    kind: "Persona",
    contact: "giulia.bianchi@example.it",
    services: ["Energia", "Posta"],
    status: "Attivo",
    value: "€ 1.840",
    last: "Oggi, 09:42",
  },
  {
    id: "EC-100196",
    name: "Studio Aurora Srl",
    kind: "Azienda",
    contact: "amministrazione@studioaurora.example",
    services: ["Spedizioni", "PEC", "Posta"],
    status: "In attivazione",
    value: "€ 4.920",
    last: "Ieri, 17:18",
  },
  {
    id: "EC-100175",
    name: "Marco Rossi",
    kind: "Persona",
    contact: "marco.rossi@example.it",
    services: ["Energia"],
    status: "Attenzione",
    value: "€ 980",
    last: "18 lug, 15:06",
  },
  {
    id: "EC-100119",
    name: "Condominio Via Verde 18",
    kind: "Condominio",
    contact: "amministratore@viaverde.example",
    services: ["Energia", "Posta", "PEC"],
    status: "Attivo",
    value: "€ 7.340",
    last: "17 lug, 11:28",
  },
];

const initialDecisions: Decision[] = [
  {
    id: 1,
    title: "Approvare il test della nuova offerta dual Energia",
    ecosystem: "Eccomi Energia",
    impact: "+€ 4.800/mese stimati",
    urgency: "Alta",
    due: "Oggi",
    status: "Da analizzare",
    recommendation: "Avviare un test controllato su 30 clienti con verifica dopo 14 giorni.",
  },
  {
    id: 2,
    title: "Rivedere la soglia del supplemento peso errato",
    ecosystem: "Eccomi Spedizioni",
    impact: "Margine +1,8%",
    urgency: "Media",
    due: "Domani",
    status: "Da analizzare",
    recommendation: "Mantenere la soglia attuale e migliorare il controllo prima dell'acquisto.",
  },
  {
    id: 3,
    title: "Autorizzare l'apertura del progetto Eccomi PEC",
    ecosystem: "Eccomi PEC",
    impact: "Nuovo ecosistema",
    urgency: "Bassa",
    due: "24 lug",
    status: "Informazioni richieste",
    recommendation: "Completare prima l'analisi dei costi operativi e dei partner.",
  },
];

const navItems: Array<{ key: ViewKey; label: string; icon: LucideIcon; badge?: string }> = [
  { key: "dashboard", label: "Dashboard CEO", icon: LayoutDashboard },
  { key: "ecosystems", label: "Ecosistemi", icon: Network },
  { key: "clients", label: "Clienti", icon: Users },
  { key: "team", label: "Responsabili", icon: UserCog },
  { key: "operations", label: "Operatori e attività", icon: ClipboardCheck, badge: "12" },
  { key: "decisions", label: "Decision Center", icon: Gavel, badge: "3" },
  { key: "ai", label: "AI e alert", icon: Sparkles, badge: "5" },
  { key: "reports", label: "Report", icon: BarChart3 },
  { key: "settings", label: "Impostazioni", icon: Settings },
];

const pageTitles: Record<ViewKey, { eyebrow: string; title: string; subtitle: string }> = {
  dashboard: {
    eyebrow: "Direzione",
    title: "Buongiorno Salvatore",
    subtitle: "Ecco cosa sta accadendo oggi nell'ecosistema Eccomi.",
  },
  posta: {
    eyebrow: "Ecosistema",
    title: "Eccomi Posta",
    subtitle: "Controllo in sola lettura e accesso diretto all’area operativa.",
  },
  noleggio: {
    eyebrow: "Ecosistema",
    title: "Eccomi Noleggio",
    subtitle: "Promozioni, lead e risultati reali con accesso diretto all’area gestionale.",
  },
  ecosystems: {
    eyebrow: "Governo",
    title: "Ecosistemi",
    subtitle: "Controlla i verticali attivi e accompagna le nuove iniziative fino all'operatività.",
  },
  clients: {
    eyebrow: "EC-ID",
    title: "Cliente unico",
    subtitle: "Una sola identità, una timeline completa e tutti i servizi Eccomi.",
  },
  team: {
    eyebrow: "Organizzazione",
    title: "Responsabili",
    subtitle: "Obiettivi, deleghe e stato delle aree di responsabilità.",
  },
  operations: {
    eyebrow: "Operatività",
    title: "Operatori e attività",
    subtitle: "Pratiche, task, ticket, scadenze e carico del team.",
  },
  decisions: {
    eyebrow: "Governo",
    title: "Decision Center",
    subtitle: "Tutto ciò che richiede una decisione, con contesto, impatto e risultato.",
  },
  ai: {
    eyebrow: "Intelligenza",
    title: "AI e alert",
    subtitle: "Priorità spiegate, anomalie e suggerimenti utili per ogni ruolo.",
  },
  reports: {
    eyebrow: "Controllo",
    title: "KPI e report",
    subtitle: "Numeri leggibili, fonti tracciate e confronto con gli obiettivi.",
  },
  settings: {
    eyebrow: "Sistema",
    title: "Impostazioni",
    subtitle: "Ruoli, accessi, integrazioni e regole di governo.",
  },
};

const POSTA_OPERATIONAL_URL = "https://eccomi-posta-backend.onrender.com/dashboard/pratiche";
const NOLEGGIO_OPERATIONAL_URL = "https://noleggio.eccomionline.com/ceo";
const requestedPreview = new URLSearchParams(window.location.search).get("preview");
const DEV_PREVIEW_VIEW: ViewKey | null = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV)
  && requestedPreview
  && ["dashboard", "posta", "noleggio", "ecosystems"].includes(requestedPreview)
  ? requestedPreview as ViewKey
  : null;

function ecosystemIcon(icon: Ecosystem["icon"], size = 22) {
  const props = { size, strokeWidth: 2 };
  if (icon === "energy") return <Zap {...props} />;
  if (icon === "mail") return <Mail {...props} />;
  if (icon === "rental") return <CarFront {...props} />;
  if (icon === "shipping") return <Package {...props} />;
  if (icon === "pec") return <ShieldCheck {...props} />;
  return <BriefcaseBusiness {...props} />;
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function hubEntryToEcosystem(entry: HubEntry): Ecosystem {
  return {
    id: entry.id,
    name: entry.name,
    short: entry.name
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    icon: "generic",
    color: "#0c5597",
    soft: "#e9f2fa",
    status: entry.status,
    owner: entry.responsible,
    revenue: "€ 0",
    margin: "—",
    open: 0,
    trend: "Salvata",
    entryType: entry.entryType,
    customerNeed: entry.customerNeed,
    objective: entry.objective,
    dnaLink: entry.dnaLink,
    revenueModel: entry.revenueModel,
    expectedCosts: entry.expectedCosts,
    timeHorizonDays: entry.timeHorizonDays,
    risks: entry.risks,
    createdAt: entry.createdAt,
    persisted: true,
  };
}

function withPostaSummary(
  ecosystems: Ecosystem[],
  postaSummary: PostaSummary | null,
  postaState: "idle" | "loading" | "ready" | "error",
): Ecosystem[] {
  return ecosystems.map((ecosystem) => {
    if (ecosystem.id !== "posta") return ecosystem;

    if (!postaSummary) {
      const dataMode: Ecosystem["dataMode"] = postaState === "loading" || postaState === "idle"
        ? "loading"
        : "error";
      return {
        ...ecosystem,
        revenue: "—",
        margin: "—",
        open: 0,
        trend: dataMode === "loading" ? "Collegamento in corso" : "Sola lettura",
        primaryMetricLabel: "Pratiche totali",
        secondaryMetricLabel: "Inviate a Poste",
        dataMode,
      };
    }

    return {
      ...ecosystem,
      status: postaSummary.summary.errors > 0 ? "Attenzione" as const : "Operativo" as const,
      revenue: String(postaSummary.summary.total),
      margin: String(postaSummary.summary.sent),
      open: postaSummary.summary.open,
      trend: `${postaSummary.summary.createdToday} oggi`,
      primaryMetricLabel: "Pratiche totali",
      secondaryMetricLabel: "Inviate a Poste",
      dataMode: "real" as const,
    };
  });
}

function withNoleggioSummary(
  ecosystems: Ecosystem[],
  noleggioSummary: NoleggioSummary | null,
  noleggioState: "idle" | "loading" | "ready" | "error",
): Ecosystem[] {
  return ecosystems.map((ecosystem) => {
    if (ecosystem.id !== "noleggio") return ecosystem;

    if (!noleggioSummary) {
      const dataMode: Ecosystem["dataMode"] = noleggioState === "loading" || noleggioState === "idle"
        ? "loading"
        : "error";
      return {
        ...ecosystem,
        revenue: "—",
        margin: "—",
        open: 0,
        trend: dataMode === "loading" ? "Collegamento in corso" : "Dati non disponibili",
        primaryMetricLabel: "Promozioni online",
        secondaryMetricLabel: "Lead totali",
        dataMode,
      };
    }

    const toWork = noleggioSummary.summary.pendingApproval
      + noleggioSummary.summary.newLeads
      + noleggioSummary.summary.workingLeads;

    return {
      ...ecosystem,
      status: "Operativo",
      revenue: String(noleggioSummary.summary.active),
      margin: String(noleggioSummary.summary.leadsTotal),
      open: toWork,
      trend: toWork > 0
        ? `${toWork} ${toWork === 1 ? "attività da lavorare" : "attività da lavorare"}`
        : "Nessuna attività critica",
      primaryMetricLabel: "Promozioni online",
      secondaryMetricLabel: "Lead totali",
      dataMode: "real",
    };
  });
}

export default function Home() {
  const [authenticated, setAuthenticated] = useState(Boolean(DEV_PREVIEW_VIEW));
  const [currentUser, setCurrentUser] = useState<HubUser | null>(DEV_PREVIEW_VIEW ? {
    id: "preview-ceo",
    email: "preview@eccomionline.com",
    fullName: "Salvatore",
    role: "ceo",
  } : null);
  const [hubSession, setHubSession] = useState<HubSession | null>(DEV_PREVIEW_VIEW ? {
    accessToken: "preview-only",
    refreshToken: "",
    expiresIn: 3600,
    user: {
      id: "preview-ceo",
      email: "preview@eccomionline.com",
      fullName: "Salvatore",
      role: "ceo",
    },
  } : null);
  const [loginStep, setLoginStep] = useState<"email" | "code" | "pending">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [realCodeSent, setRealCodeSent] = useState(false);
  const [view, setView] = useState<ViewKey>(DEV_PREVIEW_VIEW || "dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [selectedEcosystem, setSelectedEcosystem] = useState<Ecosystem | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [ecosystems, setEcosystems] = useState<Ecosystem[]>(initialEcosystems);
  const [entryArchiveState, setEntryArchiveState] = useState<"idle" | "loading" | "ready" | "pending">("idle");
  const [postaSummary, setPostaSummary] = useState<PostaSummary | null>(null);
  const [postaState, setPostaState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [postaRefreshKey, setPostaRefreshKey] = useState(0);
  const [postaConfigOpen, setPostaConfigOpen] = useState(false);
  const [noleggioSummary, setNoleggioSummary] = useState<NoleggioSummary | null>(null);
  const [noleggioState, setNoleggioState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [noleggioRefreshKey, setNoleggioRefreshKey] = useState(0);
  const [decisions, setDecisions] = useState<Decision[]>(initialDecisions);
  const [toast, setToast] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [livePopoverOpen, setLivePopoverOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [assignedToByDecision, setAssignedToByDecision] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState("");
  const visibleEcosystems = useMemo(
    () => withNoleggioSummary(
      withPostaSummary(ecosystems, postaSummary, postaState),
      noleggioSummary,
      noleggioState,
    ),
    [ecosystems, postaSummary, postaState, noleggioSummary, noleggioState],
  );

  const priorities = useMemo<CeoPriority[]>(() => buildCeoPriorities({
    postaSummary,
    postaState,
    noleggioSummary,
    noleggioState,
    urgentOpenDecisionCount: decisions.filter((decision) => decision.status !== "Decisa" && decision.urgency === "Alta").length,
  }), [decisions, noleggioState, noleggioSummary, postaState, postaSummary]);

  const aiAlertCount = priorities.filter((item) => item.severity === "critical" || item.severity === "warning").length;
  const todayStatusLabel = getCeoGeneralState(postaState, noleggioState);
  const todayStatusMessage = postaState === "ready" && postaSummary && noleggioState === "ready" && noleggioSummary
    ? `${postaSummary.summary.total} pratiche Posta e ${noleggioSummary.summary.promotionsTotal} promozioni Noleggio lette dai sistemi reali.`
    : postaState === "ready" && postaSummary
      ? `${postaSummary.summary.total} pratiche lette dai sistemi reali, senza modificazioni operative.`
      : noleggioState === "ready" && noleggioSummary
        ? `${noleggioSummary.summary.promotionsTotal} promozioni e ${noleggioSummary.summary.leadsTotal} lead letti dal sistema reale.`
        : "I collegamenti reali sono in caricamento o in configurazione.";

  const saveSession = (session: HubSession) => {
    window.localStorage.setItem("eccomi-hub-session", JSON.stringify(session));
    setHubSession(session);
    setCurrentUser(session.user);
    setAuthenticated(true);
  };

  useEffect(() => {
    let cancelled = false;
    const savedSession = window.localStorage.getItem("eccomi-hub-session");
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession) as HubSession;
        if (session.user && session.accessToken) {
          setCurrentUser(session.user);
          setAuthenticated(true);

          const expiresSoon = !session.expiresAt || session.expiresAt <= Math.floor(Date.now() / 1000) + 60;
          if (session.refreshToken && expiresSoon) {
            refreshLoginSession(session.refreshToken)
              .then((refreshedSession) => {
                if (!cancelled) saveSession(refreshedSession);
              })
              .catch(() => {
                if (!cancelled) {
                  window.localStorage.removeItem("eccomi-hub-session");
                  setHubSession(null);
                  setCurrentUser(null);
                  setAuthenticated(false);
                  setEmail(session.user.email || "");
                  setLoginError("La sessione non può essere rinnovata. Richiedi un nuovo codice.");
                }
              });
          } else {
            setHubSession(session);
          }
        }
      } catch {
        window.localStorage.removeItem("eccomi-hub-session");
      }
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hubSession?.refreshToken || !hubSession.expiresAt) return;

    let cancelled = false;
    const refreshAt = hubSession.expiresAt * 1000 - 120_000;
    const delay = Math.max(5_000, refreshAt - Date.now());
    const timer = window.setTimeout(() => {
      refreshLoginSession(hubSession.refreshToken)
        .then((refreshedSession) => {
          if (!cancelled) saveSession(refreshedSession);
        })
        .catch(() => {
          if (!cancelled) setToast("Rinnovo della sessione non riuscito: riproveremo alla prossima operazione");
        });
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [hubSession?.refreshToken, hubSession?.expiresAt]);

  useEffect(() => {
    if (!hubSession?.accessToken || currentUser?.role !== "ceo") return;

    let cancelled = false;
    setEntryArchiveState("loading");

    listHubEntries(hubSession.accessToken)
      .then((entries) => {
        if (!cancelled) {
          setEcosystems([...initialEcosystems, ...entries.map(hubEntryToEcosystem)]);
          setEntryArchiveState("ready");
        }
      })
      .catch(() => {
        // L'interfaccia resta consultabile mentre l'archivio centrale viene attivato.
        if (!cancelled) setEntryArchiveState("pending");
      });

    return () => {
      cancelled = true;
    };
  }, [hubSession?.accessToken, currentUser?.role]);

  useEffect(() => {
    if (!hubSession?.accessToken || currentUser?.role === "operator") {
      setPostaSummary(null);
      setPostaState("idle");
      return;
    }

    let cancelled = false;
    setPostaState("loading");

    getPostaSummary(hubSession.accessToken)
      .then((summary) => {
        if (!cancelled) {
          setPostaSummary(summary);
          setPostaState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPostaSummary(null);
          setPostaState("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hubSession?.accessToken, currentUser?.role, postaRefreshKey]);

  useEffect(() => {
    if (!hubSession?.accessToken || currentUser?.role === "operator") {
      setNoleggioSummary(null);
      setNoleggioState("idle");
      return;
    }

    let cancelled = false;
    setNoleggioState("loading");

    getNoleggioSummary(hubSession.accessToken)
      .then((summary) => {
        if (!cancelled) {
          setNoleggioSummary(summary);
          setNoleggioState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNoleggioSummary(null);
          setNoleggioState("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hubSession?.accessToken, currentUser?.role, noleggioRefreshKey]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const navigate = (key: ViewKey) => {
    setView(key);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openPostaOperationalArea = () => {
    window.open(POSTA_OPERATIONAL_URL, "_blank", "noopener,noreferrer");
  };

  const openNoleggioOperationalArea = () => {
    window.open(NOLEGGIO_OPERATIONAL_URL, "_blank", "noopener,noreferrer");
  };

  const openEcosystemDashboard = (item: Ecosystem) => {
    setSelectedEcosystem(null);
    if (item.id === "posta") {
      navigate("posta");
      return;
    }
    if (item.id === "noleggio") {
      navigate("noleggio");
      return;
    }
    navigate("reports");
  };

  const openEcosystemOperations = (item: Ecosystem) => {
    if (item.id === "posta") {
      openPostaOperationalArea();
      return;
    }
    if (item.id === "noleggio") {
      openNoleggioOperationalArea();
      return;
    }

    setSelectedEcosystem(null);
    navigate("operations");
  };

  const sendLoginCode = async (emailOverride?: string) => {
    setLoginError(null);
    setCode("");
    const loginEmail = (emailOverride || email).trim().toLowerCase();

    setLoginLoading(true);
    try {
      await requestLoginCode(loginEmail);
      setRealCodeSent(true);
      setLoginStep("code");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Non è stato possibile inviare il codice.");
    } finally {
      setLoginLoading(false);
    }
  };

  const enterHub = async () => {
    setLoginError(null);
    const normalizedEmail = email.trim().toLowerCase();

    setLoginLoading(true);
    try {
      const session = await verifyLoginCode(normalizedEmail, code);
      saveSession(session);
      setView(session.user.role === "operator" ? "operations" : "dashboard");
    } catch (error) {
      if (error instanceof HubApiError && error.status === 403) {
        setCode("");
        setLoginError(null);
        setLoginStep("pending");
        return;
      }
      setLoginError(error instanceof Error ? error.message : "Non è stato possibile verificare il codice.");
    } finally {
      setLoginLoading(false);
    }
  };

  const signOut = () => {
    window.localStorage.removeItem("eccomi-hub-session");
    setAuthenticated(false);
    setHubSession(null);
    setCurrentUser(null);
    setEcosystems(initialEcosystems);
    setEntryArchiveState("idle");
    setPostaSummary(null);
    setPostaState("idle");
    setNoleggioSummary(null);
    setNoleggioState("idle");
    setLoginStep("email");
    setEmail("");
    setCode("");
    setLoginError(null);
    setRealCodeSent(false);
  };

  const searchResults = useMemo(() => {
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
    ): EccomiOSResult => ({
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

    const candidates: EccomiOSResult[] = [
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
      ...clients.map((client): EccomiOSResult => ({
        id: `client-${client.id}`,
        kind: "client",
        title: client.name,
        subtitle: `${client.id} · ${client.services.join(", ")}`,
        keywords: [client.id, client.name, client.kind, client.contact, ...client.services],
        priority: 35,
        action: () => {
          setSelectedClient(client);
          closeCommandBar();
        },
      })),
      ...visibleEcosystems.map((item): EccomiOSResult => ({
        id: `ecosystem-${item.id}`,
        kind: "ecosystem",
        title: item.name,
        subtitle: `${item.status} · ${item.owner}`,
        keywords: [item.id, item.name, item.status, item.owner, item.entryType || ""],
        priority: 45,
        action: () => {
          setSelectedEcosystem(item);
          closeCommandBar();
        },
      })),
      ...decisions.map((item): EccomiOSResult => ({
        id: `decision-${item.id}`,
        kind: "decision",
        title: item.title,
        subtitle: `${item.ecosystem} · ${item.status}`,
        keywords: [item.title, item.ecosystem, item.status, item.urgency, item.due],
        priority: item.urgency === "Alta" ? 58 : item.urgency === "Media" ? 48 : 38,
        action: () => {
          navigate("decisions");
          closeCommandBar();
        },
      })),
    ];

    const labels: Record<EccomiOSResult["kind"], string> = {
      command: "Comando",
      client: "Cliente",
      ecosystem: "Ecosistema",
      decision: "Decisione",
      practice: "Pratica",
    };

    return searchEccomiOS(searchTerm, candidates, 8).map((result) => ({
      type: labels[result.kind],
      title: result.title,
      detail: result.subtitle,
      action: result.action,
    }));
  }, [searchTerm, visibleEcosystems, decisions]);

  if (!authenticated) {
    return (
      <LoginScreen
        step={loginStep}
        email={email}
        code={code}
        onEmail={setEmail}
        onCode={(value) => {
          setCode(value);
          setLoginError(null);
        }}
        onSendCode={sendLoginCode}
        onBack={() => {
          setLoginStep("email");
          setCode("");
          setLoginError(null);
          setRealCodeSent(false);
        }}
        onEnter={enterHub}
        loading={loginLoading}
        error={loginError}
        realCodeSent={realCodeSent}
      />
    );
  }

  const displayName = currentUser?.fullName?.split(" ")[0] || "Salvatore";
  const roleLabel = currentUser?.role === "manager" ? "Responsabile" : currentUser?.role === "operator" ? "Operatore" : "CEO";
  const greeting = getCeoGreeting(displayName);
  const title = view === "dashboard"
    ? { ...pageTitles.dashboard, title: greeting }
    : pageTitles[view];

  return (
    <div className="app-shell">
      <aside className={classNames("sidebar", mobileMenu && "sidebar--open")}>
        <div className="sidebar__top">
          <button className="brand" onClick={() => navigate("dashboard")} aria-label="Vai alla Dashboard CEO">
            <span className="brand__mark">E</span>
            <span className="brand__text">
              <strong>ECCOMI</strong>
              <small>HUB</small>
            </span>
          </button>
          <button className="icon-button sidebar__close" onClick={() => setMobileMenu(false)} aria-label="Chiudi menu">
            <X size={21} />
          </button>
        </div>

        <nav className="nav" aria-label="Navigazione principale">
          <span className="nav__label">Governo centrale</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={classNames("nav__item", view === item.key && "nav__item--active")}
                onClick={() => navigate(item.key)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {item.badge && <em>{item.badge}</em>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <button className="ceo-profile" onClick={() => setToast(`Profilo ${roleLabel}: ${currentUser?.email || "utente"}`) }>
            <span className="avatar">{initials(currentUser?.fullName || "Salvatore Del Libano")}</span>
            <span>
              <strong>{displayName}</strong>
              <small>{roleLabel} · Accesso riconosciuto</small>
            </span>
            <ChevronRight size={16} />
          </button>
          <button className="sidebar-logout" onClick={signOut}>
            <LogOut size={16} /> Esci da ECCOMI OS
          </button>
          <div className="system-state">
            <span className="status-dot status-dot--green" />
            <span>
              <strong>Sistemi operativi</strong>
              <small>Ultimo controllo: ora</small>
            </span>
          </div>
        </div>
      </aside>

      {mobileMenu && <button className="mobile-scrim" onClick={() => setMobileMenu(false)} aria-label="Chiudi menu" />}

      <main className="main">
        <header className="topbar">
          <div className="topbar__left">
            <button className="icon-button mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Apri menu">
              <Menu size={22} />
            </button>
            <button className="global-search" onClick={() => setSearchOpen(true)}>
              <Search size={18} />
              <span>Chiedi a ECCOMI OS cosa vuoi fare...</span>
              <kbd>⌘ K</kbd>
            </button>
          </div>
          <div className="topbar__actions">
            <div className="topbar-actions__group">
              <button
                className={classNames("topbar-pill topbar-ai-button", aiAlertCount > 0 && "topbar-ai-button--alert")}
                onClick={() => navigate("ai")}
                aria-label="Apri AI e alert"
                title="Apri AI e alert"
              >
                <span className="topbar-pill__icon">
                  <Sparkles size={16} />
                </span>
                <span className="topbar-pill__label">AI &amp; Alert</span>
                {aiAlertCount > 0 && <span className="topbar-ai-badge">{aiAlertCount}</span>}
              </button>
            </div>
            <div className="topbar-actions__group">
              <button
                className={classNames("topbar-status-pill", testMode && "topbar-status-pill--demo")}
                onClick={() => {
                  setLivePopoverOpen((value) => !value);
                  setProfileMenuOpen(false);
                  setTestMode((value) => !value);
                }}
                aria-label={testMode ? "Passa ai dati live" : "Passa ai dati demo"}
                title={testMode ? "Passa ai dati live" : "Passa ai dati demo"}
              >
                <span className={classNames("status-dot", testMode ? "status-dot--amber" : "status-dot--green")} />
                <span className="topbar-status-pill__label">{testMode ? "Live" : "Live"}</span>
              </button>
              {livePopoverOpen && (
                <div className="topbar-popover">
                  <strong>Stato dei collegamenti</strong>
                  <p>{todayStatusLabel}</p>
                  <small>{todayStatusMessage}</small>
                </div>
              )}
            </div>
            <div className="topbar-actions__group">
              <button
                className="topbar-profile-button"
                onClick={() => {
                  setProfileMenuOpen((value) => !value);
                  setLivePopoverOpen(false);
                }}
                aria-label={`Profilo ${displayName}`}
                title={`Profilo ${displayName}`}
              >
                <span className="topbar-profile-button__avatar">
                  <User size={15} />
                </span>
                <span className="topbar-profile-button__label">{displayName}</span>
              </button>
              {profileMenuOpen && (
                <div className="topbar-popover topbar-popover--profile">
                  <strong>{displayName}</strong>
                  <small>{roleLabel} · {currentUser?.email || "utente"}</small>
                  <button onClick={() => { setProfileMenuOpen(false); setToast(`Profilo ${roleLabel}: ${currentUser?.email || "utente"}`); }}>Apri profilo</button>
                  <button onClick={() => { setProfileMenuOpen(false); setToast("Feedback ricevuto. Grazie per il supporto."); }}>Invia feedback</button>
                  <button className="topbar-popover__danger" onClick={() => { setProfileMenuOpen(false); signOut(); }}>Esci</button>
                </div>
              )}
            </div>
            {currentUser?.role === "ceo" && (
              <button className="new-entry-button topbar-new-entry" onClick={() => setNewEntryOpen(true)}>
                <Plus size={18} />
                <span>New entry</span>
              </button>
            )}
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">{title.eyebrow}</span>
              <h1>{title.title}</h1>
              <p>{title.subtitle}</p>
            </div>
            <div className="heading-actions">
              {postaState === "ready" && (
                <span className="live-pill">
                  <span /> Posta collegata
                </span>
              )}
              {noleggioState === "ready" && (
                <span className="live-pill">
                  <span /> Noleggio collegato
                </span>
              )}
              {testMode && (
                <span className="demo-pill">
                  <span /> {postaState === "ready" || noleggioState === "ready" ? "Altri dati dimostrativi" : "Dati dimostrativi"}
                </span>
              )}
              <span className="today-pill">
                <Clock3 size={15} /> {formatToday()}
              </span>
            </div>
          </div>

          {view === "dashboard" && (
            <DashboardView
              ecosystems={visibleEcosystems}
              decisions={decisions}
              priorities={priorities}
              postaSummary={postaSummary}
              postaState={postaState}
              noleggioSummary={noleggioSummary}
              noleggioState={noleggioState}
              displayName={displayName}
              greeting={greeting}
              testMode={testMode}
              onNavigate={navigate}
              onSelectEcosystem={setSelectedEcosystem}
              onNewEntry={() => setNewEntryOpen(true)}
            />
          )}
          {view === "posta" && (
            <PostaDashboardView
              summary={postaSummary}
              state={postaState}
              onBack={() => navigate("ecosystems")}
              onRefresh={() => setPostaRefreshKey((value) => value + 1)}
              onOpenOperational={openPostaOperationalArea}
              onConfigure={currentUser?.role === "ceo" ? () => setPostaConfigOpen(true) : undefined}
            />
          )}
          {view === "noleggio" && (
            <NoleggioDashboardView
              summary={noleggioSummary}
              state={noleggioState}
              onBack={() => navigate("ecosystems")}
              onRefresh={() => setNoleggioRefreshKey((value) => value + 1)}
              onOpenOperational={openNoleggioOperationalArea}
            />
          )}
          {view === "ecosystems" && (
            <EcosystemsView
              ecosystems={visibleEcosystems}
              archiveState={entryArchiveState}
              onSelect={setSelectedEcosystem}
              onNewEntry={() => setNewEntryOpen(true)}
            />
          )}
          {view === "clients" && <ClientsView onSelect={setSelectedClient} />}
          {view === "team" && <TeamView />}
          {view === "operations" && <OperationsView />}
          {view === "decisions" && (
            <DecisionsView
              decisions={decisions}
              assignedToByDecision={assignedToByDecision}
              assignedOwnerLabel={displayName}
              onAssign={(id, owner) => {
                setAssignedToByDecision((current) => ({ ...current, [id]: owner }));
                setToast(`Decisione assegnata a ${owner}`);
              }}
              onAction={(id, status, message) => {
                setDecisions((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
                setToast(message);
              }}
            />
          )}
          {view === "ai" && <AIView priorities={priorities} onNavigate={navigate} />}
          {view === "reports" && <ReportsView />}
          {view === "settings" && <SettingsView />}
        </div>
      </main>

      {searchOpen && (
        <SearchModal
          value={searchTerm}
          onChange={setSearchTerm}
          onClose={() => {
            setSearchOpen(false);
            setSearchTerm("");
          }}
          results={searchResults}
        />
      )}

      {newEntryOpen && (
        <NewEntryModal
          onClose={() => setNewEntryOpen(false)}
          storageState={hubSession?.accessToken && entryArchiveState === "ready" ? "real" : "pending"}
          onCreate={async (input) => {
            if (!hubSession?.accessToken) {
              throw new Error("Accedi nuovamente prima di registrare una new entry.");
            }

            const savedEntry = await createHubEntry(hubSession.accessToken, input);
            const entry = hubEntryToEcosystem(savedEntry);

            setEcosystems((current) => [...current.filter((item) => item.id !== entry.id), entry]);
            setNewEntryOpen(false);
            setToast(`${entry.name} salvata in ECCOMI OS nello stato “Da valutare”`);
            navigate("ecosystems");
          }}
        />
      )}

      {postaConfigOpen && hubSession?.accessToken && (
        <PostaConnectionModal
          onClose={() => setPostaConfigOpen(false)}
          onConnect={async (serviceKey) => {
            let activeSession = hubSession;
            try {
              await configurePostaConnection(activeSession.accessToken, serviceKey);
            } catch (error) {
              if (!(error instanceof HubApiError) || error.status !== 401 || !activeSession.refreshToken) {
                throw error;
              }
              activeSession = await refreshLoginSession(activeSession.refreshToken);
              saveSession(activeSession);
              await configurePostaConnection(activeSession.accessToken, serviceKey);
            }
            setPostaConfigOpen(false);
            setPostaRefreshKey((value) => value + 1);
            setToast("Eccomi Posta collegato: caricamento dei dati reali in corso");
          }}
        />
      )}

      {selectedEcosystem && (
        <EcosystemDrawer
          item={selectedEcosystem}
          postaSummary={selectedEcosystem.id === "posta" ? postaSummary : null}
          noleggioSummary={selectedEcosystem.id === "noleggio" ? noleggioSummary : null}
          onClose={() => setSelectedEcosystem(null)}
          onOpenDashboard={openEcosystemDashboard}
          onOpenOperational={openEcosystemOperations}
          onConfigurePosta={currentUser?.role === "ceo" ? () => setPostaConfigOpen(true) : undefined}
          onAdvance={async (item) => {
            if (!hubSession?.accessToken) {
              throw new Error("Accedi nuovamente per avviare la valutazione.");
            }

            let activeSession = hubSession;
            let savedEntry;
            try {
              savedEntry = await advanceHubEntryToEvaluation(activeSession.accessToken, item.id);
            } catch (error) {
              if (!(error instanceof HubApiError) || error.status !== 401 || !activeSession.refreshToken) {
                throw error;
              }

              activeSession = await refreshLoginSession(activeSession.refreshToken);
              saveSession(activeSession);
              savedEntry = await advanceHubEntryToEvaluation(activeSession.accessToken, item.id);
            }
            const updatedEntry = hubEntryToEcosystem(savedEntry);
            setEcosystems((current) => current.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)));
            setSelectedEcosystem(updatedEntry);
            setToast(`${updatedEntry.name} è ora nello stato “Valutazione”`);
          }}
          onGenerateEvaluation={async (item) => {
            if (!hubSession?.accessToken) {
              throw new Error("Accedi nuovamente per generare la valutazione.");
            }

            let activeSession = hubSession;
            try {
              return await generateHubEvaluation(activeSession.accessToken, item.id);
            } catch (error) {
              if (!(error instanceof HubApiError) || error.status !== 401 || !activeSession.refreshToken) {
                throw error;
              }

              activeSession = await refreshLoginSession(activeSession.refreshToken);
              saveSession(activeSession);
              return generateHubEvaluation(activeSession.accessToken, item.id);
            }
          }}
          onDecision={async (item, action) => {
            if (!hubSession?.accessToken) {
              throw new Error("Accedi nuovamente per registrare la decisione.");
            }

            let activeSession = hubSession;
            let result;
            try {
              result = await decideHubEvaluation(activeSession.accessToken, item.id, action);
            } catch (error) {
              if (!(error instanceof HubApiError) || error.status !== 401 || !activeSession.refreshToken) {
                throw error;
              }

              activeSession = await refreshLoginSession(activeSession.refreshToken);
              saveSession(activeSession);
              result = await decideHubEvaluation(activeSession.accessToken, item.id, action);
            }

            const updatedEntry = hubEntryToEcosystem(result.entry);
            setEcosystems((current) => current.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)));
            setSelectedEcosystem(updatedEntry);

            const outcome = action === "approve"
              ? "approvata"
              : action === "suspend"
                ? "sospesa"
                : "in attesa di dettagli";
            setToast(`${updatedEntry.name}: valutazione ${outcome}`);

            return { item: updatedEntry, evaluation: result.evaluation };
          }}
          onLoadProjectPlan={async (item) => {
            if (!hubSession?.accessToken) {
              throw new Error("Accedi nuovamente per aprire la progettazione.");
            }

            let activeSession = hubSession;
            try {
              return await getHubProjectPlan(activeSession.accessToken, item.id);
            } catch (error) {
              if (!(error instanceof HubApiError) || error.status !== 401 || !activeSession.refreshToken) {
                throw error;
              }

              activeSession = await refreshLoginSession(activeSession.refreshToken);
              saveSession(activeSession);
              return getHubProjectPlan(activeSession.accessToken, item.id);
            }
          }}
          onSaveProjectPlan={async (item, input) => {
            if (!hubSession?.accessToken) {
              throw new Error("Accedi nuovamente per salvare la progettazione.");
            }

            let activeSession = hubSession;
            let result;
            try {
              result = await saveHubProjectPlan(activeSession.accessToken, item.id, input);
            } catch (error) {
              if (!(error instanceof HubApiError) || error.status !== 401 || !activeSession.refreshToken) {
                throw error;
              }

              activeSession = await refreshLoginSession(activeSession.refreshToken);
              saveSession(activeSession);
              result = await saveHubProjectPlan(activeSession.accessToken, item.id, input);
            }

            const updatedEntry = hubEntryToEcosystem(result.entry);
            setEcosystems((current) => current.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)));
            setSelectedEcosystem(updatedEntry);
            setToast(`${updatedEntry.name}: piano di progettazione salvato`);
            return { item: updatedEntry, plan: result.plan };
          }}
          onAdvanceToTest={async (item) => {
            if (!hubSession?.accessToken) {
              throw new Error("Accedi nuovamente per autorizzare il Test.");
            }

            let activeSession = hubSession;
            let result;
            try {
              result = await advanceHubProjectToTest(activeSession.accessToken, item.id);
            } catch (error) {
              if (!(error instanceof HubApiError) || error.status !== 401 || !activeSession.refreshToken) {
                throw error;
              }

              activeSession = await refreshLoginSession(activeSession.refreshToken);
              saveSession(activeSession);
              result = await advanceHubProjectToTest(activeSession.accessToken, item.id);
            }

            const updatedEntry = hubEntryToEcosystem(result.entry);
            setEcosystems((current) => current.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)));
            setSelectedEcosystem(updatedEntry);
            setToast(`${updatedEntry.name} è ora nello stato “Test”`);
            return { item: updatedEntry, plan: result.plan };
          }}
        />
      )}
      {selectedClient && <ClientDrawer client={selectedClient} onClose={() => setSelectedClient(null)} />}

      {testMode && (
        <button className="feedback-fab" onClick={() => setFeedbackOpen(true)}>
          <MessageSquareText size={19} />
          <span>Segnala una modifica</span>
        </button>
      )}

      {feedbackOpen && (
        <div className="feedback-card">
          <div className="feedback-card__head">
            <div>
              <strong>Nota di test</strong>
              <small>Schermata: {pageTitles[view].title}</small>
            </div>
            <button className="icon-button" onClick={() => setFeedbackOpen(false)} aria-label="Chiudi">
              <X size={18} />
            </button>
          </div>
          <textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="Scrivi cosa vuoi cambiare, aggiungere o togliere..."
          />
          <button
            className="primary-button"
            disabled={!feedback.trim()}
            onClick={() => {
              const notes = JSON.parse(window.localStorage.getItem("eccomi-hub-feedback") || "[]");
              notes.push({ page: view, note: feedback, createdAt: new Date().toISOString() });
              window.localStorage.setItem("eccomi-hub-feedback", JSON.stringify(notes));
              setFeedback("");
              setFeedbackOpen(false);
              setToast("Nota salvata nella modalità test");
            }}
          >
            <Send size={16} /> Salva nota
          </button>
        </div>
      )}

      {toast && (
        <div className="toast">
          <CheckCircle2 size={19} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

function LoginScreen({
  step,
  email,
  code,
  onEmail,
  onCode,
  onSendCode,
  onBack,
  onEnter,
  loading,
  error,
  realCodeSent,
}: {
  step: "email" | "code" | "pending";
  email: string;
  code: string;
  onEmail: (value: string) => void;
  onCode: (value: string) => void;
  onSendCode: (emailOverride?: string) => void;
  onBack: () => void;
  onEnter: () => void;
  loading: boolean;
  error: string | null;
  realCodeSent: boolean;
}) {
  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand">
          <span className="brand__mark brand__mark--large">E</span>
          <span className="brand__text brand__text--light">
            <strong>ECCOMI</strong>
            <small>ONLINE</small>
          </span>
        </div>
        <div className="login-message">
          <span className="login-kicker">ECCOMI OS</span>
          <h1>Un solo accesso.<br />Tutto Eccomi sotto controllo.</h1>
          <p>La cabina di governo che collega clienti, persone, decisioni e ogni ecosistema operativo.</p>
        </div>
        <div className="login-system-flow">
          <div><Check size={15} /><span>Identità unica</span></div>
          <span />
          <div><Check size={15} /><span>Ruolo riconosciuto</span></div>
          <span />
          <div><Check size={15} /><span>Area personale</span></div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <div className="login-card__icon"><LockKeyhole size={24} /></div>
          {step === "email" ? (
            <>
              <span className="eyebrow">Accesso unico EccomiOnline</span>
              <h2>Accedi alla tua area</h2>
              <p>Inserisci l'email associata al tuo ruolo. Riceverai un codice temporaneo.</p>
              <label>
                Indirizzo email
                <span className="input-with-icon"><AtSign size={18} /><input type="email" value={email} onChange={(e) => onEmail(e.target.value)} placeholder="nome@eccomionline.com" /></span>
              </label>
              {error && <div className="login-alert" role="alert"><AlertTriangle size={17} /><span>{error}</span></div>}
              <button className="login-primary" onClick={() => onSendCode()} disabled={!email.includes("@") || loading}>
                {loading ? "Collegamento in corso..." : "Invia codice di accesso"} <ArrowRight size={18} />
              </button>
            </>
          ) : step === "code" ? (
            <>
              <button className="back-link" onClick={onBack}><ChevronRight size={16} /> Cambia email</button>
              <span className="eyebrow">Verifica identità</span>
              <h2>Inserisci il codice</h2>
              <p>{realCodeSent ? `Abbiamo inviato il codice a ${email}.` : `Inserisci il codice temporaneo inviato a ${email}.`}</p>
              <label>
                Codice temporaneo
                <span className="input-with-icon code-input"><KeyRound size={18} /><input inputMode="numeric" maxLength={6} value={code} onChange={(e) => onCode(e.target.value.replace(/\D/g, ""))} placeholder="••••••" /></span>
              </label>
              {error && <div className="login-alert" role="alert"><AlertTriangle size={17} /><span>{error}</span></div>}
              <button className="login-primary" onClick={onEnter} disabled={code.length !== 6 || loading}>
                {loading ? "Verifica in corso..." : "Accedi a ECCOMI OS"} <ArrowRight size={18} />
              </button>
            </>
          ) : (
            <>
              <span className="eyebrow">Identità verificata</span>
              <h2>Accesso in attesa di autorizzazione</h2>
              <p>L’indirizzo <strong>{email}</strong> è stato verificato, ma non ha ancora un ruolo attivo in ECCOMI OS.</p>
              <div className="login-pending-status" role="status">
                <Clock3 size={19} />
                <span>Nessun dato o area operativa è accessibile finché il CEO non assegna un ruolo.</span>
              </div>
              <button className="login-primary" onClick={onBack}>
                Torna all’accesso <ArrowRight size={18} />
              </button>
            </>
          )}
          <div className="login-security"><ShieldCheck size={16} /><span>Accesso protetto · Il ruolo determina automaticamente l'area visibile</span></div>
        </div>
      </section>
    </main>
  );
}

function PostaDashboardView({
  summary,
  state,
  onBack,
  onRefresh,
  onOpenOperational,
  onConfigure,
}: {
  summary: PostaSummary | null;
  state: "idle" | "loading" | "ready" | "error";
  onBack: () => void;
  onRefresh: () => void;
  onOpenOperational: () => void;
  onConfigure?: () => void;
}) {
  const serviceRows = summary
    ? Object.entries(summary.byService)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="view-stack posta-dashboard">
      <section className="posta-dashboard__actions">
        <button className="secondary-button posta-back-button" onClick={onBack}>
          <ChevronRight size={15} /> Torna agli ecosistemi
        </button>
        <div>
          <button className="secondary-button" onClick={onRefresh} disabled={state === "loading"}>
            <Activity size={15} /> {state === "loading" ? "Aggiornamento…" : "Aggiorna dati"}
          </button>
          <button className="primary-button" onClick={onOpenOperational}>
            Apri area operativa <ArrowUpRight size={16} />
          </button>
        </div>
      </section>

      {state === "loading" && (
        <section className="panel posta-connection-state" role="status">
          <Activity size={23} />
          <span><strong>Collegamento a Eccomi Posta</strong><small>L’HUB sta aggiornando i dati in sola lettura.</small></span>
        </section>
      )}

      {state === "error" && (
        <section className="panel posta-connection-state posta-connection-state--warning" role="status">
          <LockKeyhole size={23} />
          <span><strong>Area operativa collegata, dati in configurazione</strong><small>Il pulsante operativo è attivo. I KPI compariranno appena la chiave di lettura protetta sarà registrata esclusivamente nell’HUB.</small></span>
          {onConfigure && <button className="primary-button posta-configure-button" onClick={onConfigure}>Configura dati reali</button>}
        </section>
      )}

      {state === "ready" && summary && (
        <>
          <section className="panel posta-dashboard__overview">
            <div className="panel__head">
              <span><small>DATI REALI · SOLA LETTURA</small><strong>Quadro operativo</strong></span>
              <span className="live-badge"><span /> Aggiornato {formatRelativeDate(summary.generatedAt)}</span>
            </div>
            <div className="posta-real-grid posta-real-grid--page">
              <div><small>Pratiche totali</small><strong>{summary.summary.total}</strong><em>{summary.summary.createdToday} create oggi</em></div>
              <div><small>Da lavorare</small><strong>{summary.summary.open}</strong><em>richiedono ancora un intervento</em></div>
              <div><small>Inviate a Poste</small><strong>{summary.summary.sent}</strong><em>invio eseguito</em></div>
              <div className={summary.summary.errors ? "posta-real-grid__warning" : undefined}><small>Anomalie</small><strong>{summary.summary.errors}</strong><em>{summary.summary.manual} in lavorazione manuale</em></div>
            </div>
          </section>

          <section className="posta-dashboard__columns">
            <div className="panel">
              <div className="panel__head"><span><small>RIPARTIZIONE</small><strong>Servizi rilevati</strong></span></div>
              <div className="posta-service-grid posta-service-grid--page">
                {serviceRows.map(([service, count]) => (
                  <span key={service}><small>{formatPostaStatus(service)}</small><strong>{count}</strong></span>
                ))}
              </div>
            </div>
            <div className="panel">
              <div className="panel__head"><span><small>AGGIORNAMENTI</small><strong>Ultime pratiche</strong></span></div>
              <div className="posta-practice-list posta-practice-list--page">
                {summary.recent.slice(0, 8).map((practice) => (
                  <div className="posta-practice-row" key={practice.id}>
                    <span className={`status-dot status-dot--${postaStatusColor(practice.status)}`} />
                    <span><strong>{practice.orderName || practice.id.slice(0, 8)}</strong><small>{formatPostaStatus(practice.service)} · {formatPostaStatus(practice.status)}</small></span>
                    <time>{formatRelativeDate(practice.updatedAt || practice.createdAt)}</time>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <div className="posta-readonly-note posta-readonly-note--page">
        <ShieldCheck size={18} />
        <span><strong>Eccomi Posta non viene modificato dall’HUB</strong><small>L’HUB può leggere soltanto conteggi, stati e riferimenti pratica. Invii, worker, pagamenti, documenti e chiamate a Poste restano separati.</small></span>
      </div>
    </div>
  );
}

function NoleggioDashboardView({
  summary,
  state,
  onBack,
  onRefresh,
  onOpenOperational,
}: {
  summary: NoleggioSummary | null;
  state: "idle" | "loading" | "ready" | "error";
  onBack: () => void;
  onRefresh: () => void;
  onOpenOperational: () => void;
}) {
  const toWork = summary
    ? summary.summary.pendingApproval + summary.summary.newLeads + summary.summary.workingLeads
    : 0;

  return (
    <div className="view-stack posta-dashboard">
      <section className="posta-dashboard__actions">
        <button className="secondary-button posta-back-button" onClick={onBack}>
          <ChevronRight size={15} /> Torna agli ecosistemi
        </button>
        <div>
          <button className="secondary-button" onClick={onRefresh} disabled={state === "loading"}>
            <Activity size={15} /> {state === "loading" ? "Aggiornamento…" : "Aggiorna dati"}
          </button>
          <button className="primary-button" onClick={onOpenOperational}>
            Apri area operativa <ArrowUpRight size={16} />
          </button>
        </div>
      </section>

      {state === "loading" && (
        <section className="panel posta-connection-state" role="status">
          <Activity size={23} />
          <span><strong>Collegamento a Eccomi Noleggio</strong><small>L’HUB sta leggendo promozioni, lead e risultati aggregati.</small></span>
        </section>
      )}

      {state === "error" && (
        <section className="panel posta-connection-state posta-connection-state--warning" role="status">
          <AlertTriangle size={23} />
          <span><strong>Area operativa collegata, KPI non disponibili</strong><small>Puoi entrare nella dashboard Noleggio. La lettura dei dati reali verrà riprovata con “Aggiorna dati”.</small></span>
        </section>
      )}

      {state === "ready" && summary && (
        <>
          <section className="panel posta-dashboard__overview">
            <div className="panel__head">
              <span><small>DATI REALI · SOLA LETTURA</small><strong>Quadro Eccomi Noleggio</strong></span>
              <span className="live-badge"><span /> Aggiornato {formatRelativeDate(summary.generatedAt)}</span>
            </div>
            <div className="posta-real-grid posta-real-grid--page">
              <div><small>Promozioni totali</small><strong>{summary.summary.promotionsTotal}</strong><em>{summary.summary.active} online su Shopify</em></div>
              <div className={summary.summary.pendingApproval ? "posta-real-grid__warning" : undefined}><small>Da approvare</small><strong>{summary.summary.pendingApproval}</strong><em>richiedono controllo CEO</em></div>
              <div><small>Lead totali</small><strong>{summary.summary.leadsTotal}</strong><em>{summary.summary.newLeads} nuovi</em></div>
              <div className={toWork ? "posta-real-grid__warning" : undefined}><small>Da lavorare</small><strong>{toWork}</strong><em>{summary.summary.contracts} contratti conclusi</em></div>
            </div>
          </section>

          <section className="posta-dashboard__columns">
            <div className="panel">
              <div className="panel__head"><span><small>PIPELINE</small><strong>Stato reale</strong></span></div>
              <div className="posta-service-grid posta-service-grid--page">
                <span><small>Approvate</small><strong>{summary.summary.approved}</strong></span>
                <span><small>In scadenza</small><strong>{summary.summary.expiring}</strong></span>
                <span><small>Scadute / archiviate</small><strong>{summary.summary.expired}</strong></span>
                <span><small>Commissioni maturate</small><strong>{formatCurrency(summary.summary.commissionCents / 100)}</strong></span>
              </div>
            </div>
            <div className="panel">
              <div className="panel__head"><span><small>AGGIORNAMENTI</small><strong>Ultimi eventi Noleggio</strong></span></div>
              <div className="posta-practice-list posta-practice-list--page">
                {summary.recent.map((event) => (
                  <div className="posta-practice-row" key={event.id}>
                    <span className="status-dot status-dot--blue" />
                    <span><strong>{event.title}</strong><small>{formatPostaStatus(event.eventType)}</small></span>
                    <time>{formatRelativeDate(event.createdAt)}</time>
                  </div>
                ))}
                {!summary.recent.length && <div className="empty-state"><CarFront size={22} /><strong>Nessun evento recente</strong><span>I nuovi caricamenti e le pubblicazioni compariranno qui.</span></div>}
              </div>
            </div>
          </section>
        </>
      )}

      <div className="posta-readonly-note posta-readonly-note--page">
        <ShieldCheck size={18} />
        <span><strong>Eccomi Noleggio resta operativo e autonomo</strong><small>L’HUB legge solo indicatori aggregati. Quotazioni, immagini, pubblicazione Shopify, lead e documenti restano gestiti nell’area Noleggio.</small></span>
      </div>
    </div>
  );
}

function DashboardView({
  ecosystems,
  decisions,
  priorities,
  postaSummary,
  postaState,
  noleggioSummary,
  noleggioState,
  displayName,
  greeting,
  testMode,
  onNavigate,
  onSelectEcosystem,
  onNewEntry,
}: {
  ecosystems: Ecosystem[];
  decisions: Decision[];
  priorities: CeoPriority[];
  postaSummary: PostaSummary | null;
  postaState: "idle" | "loading" | "ready" | "error";
  noleggioSummary: NoleggioSummary | null;
  noleggioState: "idle" | "loading" | "ready" | "error";
  displayName: string;
  greeting: string;
  testMode: boolean;
  onNavigate: (key: ViewKey) => void;
  onSelectEcosystem: (item: Ecosystem) => void;
  onNewEntry: () => void;
}) {
  const postaLive = postaState === "ready" ? postaSummary : null;
  const noleggioLive = noleggioState === "ready" ? noleggioSummary : null;
  const unavailableNote = "Dato amministrativo non ancora collegato";

  const kpis = testMode
    ? [
        { label: "Ricavi del mese", value: "€ 48.320", trend: "+12,4%", trendType: "up", note: "Dato dimostrativo", icon: CircleDollarSign },
        { label: "Margine", value: "€ 14.870", trend: "+8,1%", trendType: "up", note: "Dato dimostrativo", icon: WalletCards },
        { label: "Clienti attivi", value: "1.284", trend: "+5,2%", trendType: "up", note: "Dato dimostrativo", icon: UserCheck },
        { label: "Pratiche aperte", value: "86", trend: "12 oggi", trendType: "neutral", note: "Dato dimostrativo", icon: FolderKanban },
        { label: "Pratiche critiche", value: "7", trend: "−2", trendType: "down", note: "Dato dimostrativo", icon: AlertTriangle },
        { label: "Opportunità", value: "34", trend: "+€ 21,6K", trendType: "up", note: "Dato dimostrativo", icon: Target },
      ]
    : [
        { label: "Ricavi del mese", value: "—", trend: "—", trendType: "neutral", note: unavailableNote, icon: CircleDollarSign },
        { label: "Margine", value: "—", trend: "—", trendType: "neutral", note: unavailableNote, icon: WalletCards },
        { label: "Clienti attivi", value: "—", trend: "—", trendType: "neutral", note: unavailableNote, icon: UserCheck },
        {
          label: "Posta · da lavorare",
          value: postaLive ? String(postaLive.summary.open) : "—",
          trend: postaLive ? `${postaLive.summary.createdToday} oggi` : "—",
          trendType: "neutral",
          note: postaLive ? `${postaLive.summary.sent} inviate a Poste` : "Dato reale non disponibile",
          icon: FolderKanban,
        },
        {
          label: "Posta · anomalie",
          value: postaLive ? String(postaLive.summary.errors) : "—",
          trend: postaLive ? `${postaLive.summary.manual} manuali` : "—",
          trendType: postaLive?.summary.errors ? "neutral" : "down",
          note: postaLive ? "Fonte reale in sola lettura" : "Dato reale non disponibile",
          icon: AlertTriangle,
        },
        { label: "Opportunità", value: "—", trend: "—", trendType: "neutral", note: unavailableNote, icon: Target },
      ];

  const openDecisionCount = decisions.filter(
    (item) => item.status !== "Decisa",
  ).length;

  const executiveBriefing = buildExecutiveBriefing({
    priorities,
    postaSummary: postaLive,
    noleggioSummary: noleggioLive,
    openDecisionCount,
  });

  const urgencyMap: Record<CeoPriority["severity"], string> = {
    critical: "Critico",
    warning: "Attenzione",
    opportunity: "Opportunità",
    info: "Info",
  };

  return (
    <div className="dashboard-stack">
      <CeoToday
        displayName={displayName}
        greeting={greeting}
        statusLabel={executiveBriefing.headline}
        statusMessage={executiveBriefing.message}
        operatingEcosystems={ecosystems.length}
        activitiesToVerify={priorities.length}
        criticalIssues={priorities.filter((item) => item.severity === "critical").length}
        objective={executiveBriefing.objective}
        dataModeLabel={
          testMode
            ? "Dati dimostrativi"
            : postaLive || noleggioLive
              ? "Dati reali attivi"
              : "Dati reali non disponibili"
        }
        onOpenPriorities={() => onNavigate("ai")}
      />
      <CeoControlCenter priorities={priorities} onOpenDecisionCenter={() => onNavigate("decisions")} />

      <ExecutiveNavigator />

      <DataTrustPanel />

      <div id="executive-section-snapshot" className="executive-section-anchor">
      <ExecutiveSnapshot
        priorities={priorities}
        openDecisionCount={openDecisionCount}
        postaState={postaState}
        noleggioState={noleggioState}
        onOpenPriorities={() => onNavigate("ai")}
        onOpenDecisions={() => onNavigate("decisions")}
        onOpenPosta={() => onNavigate("posta")}
        onOpenNoleggio={() => onNavigate("noleggio")}
      />
      </div>

      <div id="executive-section-timeline" className="executive-section-anchor">
      <ExecutiveTimeline
        priorities={priorities}
        onNavigate={onNavigate}
      />
      </div>

      <div id="executive-section-apps" className="executive-section-anchor">
      <AppRegistry
        onOpenPosta={() => onNavigate("posta")}
        onOpenNoleggio={() => onNavigate("noleggio")}
        onOpenEcosystems={() => onNavigate("ecosystems")}
      />
      </div>

      <div id="executive-section-intelligence" className="executive-section-anchor">
      <ExecutiveIntelligence
        priorities={priorities}
        openDecisionCount={openDecisionCount}
        onOpenDecisionCenter={() => onNavigate("decisions")}
        onOpenAI={() => onNavigate("ai")}
      />
      </div>

      <div id="executive-section-actions" className="executive-section-anchor">
      <ExecutiveActionQueue
        priorities={priorities}
        openDecisionCount={openDecisionCount}
        onNavigate={onNavigate}
        onOpenDecisionCenter={() => onNavigate("decisions")}
      />
      </div>

      <section className="kpi-grid">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button className="kpi-card" key={kpi.label} onClick={() => onNavigate("reports")}>
              <div className="kpi-card__top"><span>{kpi.label}</span><span className="kpi-icon"><Icon size={18} /></span></div>
              <strong>{kpi.value}</strong>
              <div className="kpi-card__bottom">
                <em className={`trend trend--${kpi.trendType}`}>{kpi.trend}</em>
                <span>{kpi.note}</span>
              </div>
            </button>
          );
        })}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div><span className="eyebrow">Ecosistemi</span><h2>Vista globale</h2></div>
          <button className="text-button" onClick={() => onNavigate("ecosystems")}>Vedi tutti <ArrowRight size={16} /></button>
        </div>
        <div className="ecosystem-grid ecosystem-grid--dashboard">
          {ecosystems.slice(0, 5).map((item) => <EcosystemCard key={item.id} item={item} onClick={() => onSelectEcosystem(item)} />)}
          <button className="new-ecosystem-card" onClick={onNewEntry}><span><Plus size={24} /></span><strong>Aggiungi una new entry</strong><small>Ecosistema, servizio, progetto o idea</small></button>
        </div>
      </section>

      <section className="dashboard-columns">
        <div className="panel ai-priority-panel">
          <div className="panel__head">
            <div className="panel-title"><span className="panel-icon panel-icon--ai"><Sparkles size={18} /></span><span><small>ASSISTENTE AI</small><strong>Le 3 cose più importanti oggi</strong></span></div>
            <button className="icon-button" onClick={() => onNavigate("ai")}><ArrowUpRight size={18} /></button>
          </div>
          <div className="priority-list">
            {priorities.slice(0, 3).map((priority, index) => (
              <PriorityItem
                key={priority.id}
                number={`0${index + 1}`}
                urgency={urgencyMap[priority.severity]}
                title={priority.title}
                detail={priority.description}
                action={() => onNavigate(priority.targetView)}
              />
            ))}
          </div>
          <div className="ai-explanation"><Bot size={17} /><span>Priorità calcolate su urgenza, impatto economico, rischio cliente e scadenze.</span></div>
        </div>

        <div className="panel decision-preview-panel">
          <div className="panel__head">
            <div className="panel-title"><span className="panel-icon"><Gavel size={18} /></span><span><small>DECISION CENTER</small><strong>Richiedono la tua attenzione</strong></span></div>
            <button className="text-button" onClick={() => onNavigate("decisions")}>Apri <ArrowRight size={15} /></button>
          </div>
          <div className="decision-mini-list">
            {decisions.slice(0, 3).map((decision) => (
              <button key={decision.id} onClick={() => onNavigate("decisions")}>
                <span className={`urgency-dot urgency-dot--${decision.urgency.toLowerCase()}`} />
                <span><strong>{decision.title}</strong><small>{decision.ecosystem} · {decision.due}</small></span>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
          <div className="decision-summary"><span><strong>{decisions.filter((d) => d.status !== "Decisa").length}</strong> da decidere</span><span><strong>{decisions.filter((d) => d.assignedTo).length}</strong> in esecuzione</span><span><strong>{decisions.filter((d) => d.status === "Decisa").length}</strong> verificate</span></div>
        </div>
      </section>

      <section className="dashboard-columns dashboard-columns--lower">
        <div className="panel activity-panel">
          <div className="panel__head"><div className="panel-title"><span className="panel-icon"><Activity size={18} /></span><span><small>TIMELINE</small><strong>Attività recenti</strong></span></div><button className="text-button">Tutte <ArrowRight size={15} /></button></div>
          <div className="activity-list">
            {postaLive?.recent.length ? postaLive.recent.slice(0, 4).map((practice) => (
              <ActivityRow
                key={practice.id}
                color={postaStatusColor(practice.status)}
                title={`Pratica ${practice.orderName || practice.id.slice(0, 8)}`}
                detail={`Eccomi Posta · ${formatPostaStatus(practice.status)}`}
                time={formatRelativeDate(practice.updatedAt || practice.createdAt)}
              />
            )) : (
              <>
                <ActivityRow color="green" title="Pratica #PO-1827 conclusa" detail="Eccomi Posta · operazione completata" time="8 min" />
                <ActivityRow color="blue" title="Nuovo cliente EC-100284" detail="Acquisito da Eccomi Energia" time="24 min" />
                <ActivityRow color="amber" title="Ticket #TK-439 in attesa" detail="Richiesto documento al cliente" time="41 min" />
                <ActivityRow color="purple" title="Decisione verificata" detail="Campagna Spedizioni · risultato +6,2%" time="1 ora" />
              </>
            )}
          </div>
        </div>
        <div className="panel opportunity-panel">
          <div className="panel__head"><div className="panel-title"><span className="panel-icon panel-icon--green"><TrendingUp size={18} /></span><span><small>OPPORTUNITÀ</small><strong>Valore potenziale</strong></span></div><button className="icon-button"><ArrowUpRight size={18} /></button></div>
          <div className="opportunity-total"><strong>€ 21.640</strong><span>34 opportunità aperte</span></div>
          <div className="opportunity-bars"><ProgressRow label="Energia" value="€ 9.800" width={82} color="#e5a000" /><ProgressRow label="Spedizioni" value="€ 6.240" width={62} color="#0f9f6e" /><ProgressRow label="PEC" value="€ 3.920" width={43} color="#7c3aed" /><ProgressRow label="Posta" value="€ 1.680" width={28} color="#2563eb" /></div>
        </div>
      </section>
    </div>
  );
}

function EcosystemCard({ item, onClick }: { item: Ecosystem; onClick: () => void }) {
  const footerText = item.dataMode === "loading"
    ? "Collegamento dati in corso"
    : item.dataMode === "error"
      ? "Dati reali in configurazione"
      : item.id === "noleggio"
        ? `${item.open} elementi da lavorare`
        : `${item.open} pratiche aperte`;

  return (
    <button className="ecosystem-card" onClick={onClick}>
      <div className="ecosystem-card__top">
        <span className="ecosystem-logo" style={{ color: item.color, background: item.soft }}>{ecosystemIcon(item.icon)}</span>
        <span className="ecosystem-card__badges">
          {item.dataMode === "real" && <span className="live-badge"><span />Reale</span>}
          {item.dataMode === "loading" && <span className="sync-badge"><Activity size={11} />Sync</span>}
          <span className={`status-badge status-badge--${statusClass(item.status)}`}><span />{item.status}</span>
        </span>
      </div>
      <h3>{item.name}</h3>
      <p>{item.owner}</p>
      <div className="ecosystem-card__metrics"><span><small>{item.primaryMetricLabel || "Ricavi mese"}</small><strong>{item.revenue}</strong></span><span><small>{item.secondaryMetricLabel || "Margine"}</small><strong>{item.margin}</strong></span></div>
      <div className="ecosystem-card__footer"><span>{footerText}</span><em>{item.trend}</em><ChevronRight size={17} /></div>
    </button>
  );
}

function EcosystemsView({
  ecosystems,
  archiveState,
  onSelect,
  onNewEntry,
}: {
  ecosystems: Ecosystem[];
  archiveState: "idle" | "loading" | "ready" | "pending";
  onSelect: (item: Ecosystem) => void;
  onNewEntry: () => void;
}) {
  const lifecycle = [
    { label: "Idea", statuses: ["Da valutare"] },
    { label: "Valutazione", statuses: ["Valutazione"] },
    { label: "Approvato", statuses: ["Approvato"] },
    { label: "Progettazione", statuses: ["Progettazione"] },
    { label: "Test", statuses: ["Test"] },
    { label: "Operativo", statuses: ["Operativo", "Attenzione"] },
  ].map((step) => ({
    ...step,
    count: ecosystems.filter((item) => step.statuses.includes(item.status)).length,
  }));

  return (
    <div className="view-stack">
      <section className="overview-strip">
        <div><span className="overview-icon"><Network size={22} /></span><span><small>Ecosistemi registrati</small><strong>{ecosystems.length}</strong></span></div>
        <div><span className="status-dot status-dot--green" /><span><small>Operativi</small><strong>{ecosystems.filter((item) => item.status === "Operativo").length}</strong></span></div>
        <div><span className="status-dot status-dot--amber" /><span><small>Da seguire</small><strong>{ecosystems.filter((item) => item.status !== "Operativo").length}</strong></span></div>
        <button className="new-entry-button" onClick={onNewEntry}><Plus size={18} /> New entry</button>
      </section>
      <div className="section-heading"><div><span className="eyebrow">Portafoglio</span><h2>Tutte le iniziative</h2></div><div className="filter-chip"><span className={`status-dot status-dot--${archiveState === "ready" ? "green" : "amber"}`} /> {archiveState === "ready" ? "Archivio sincronizzato" : archiveState === "loading" ? "Sincronizzazione in corso" : "Archivio da attivare"} <ChevronDown size={15} /></div></div>
      <section className="ecosystem-grid">
        {ecosystems.map((item) => <EcosystemCard key={item.id} item={item} onClick={() => onSelect(item)} />)}
        <button className="new-ecosystem-card new-ecosystem-card--large" onClick={onNewEntry}><span><Plus size={24} /></span><strong>Aggiungi una new entry</strong><small>Parte sempre dallo stato “Da valutare”</small></button>
      </section>
      <section className="panel lifecycle-panel">
        <div className="panel__head"><div className="panel-title"><span className="panel-icon"><FolderKanban size={18} /></span><span><small>GOVERNANCE</small><strong>Percorso delle iniziative</strong></span></div></div>
        <div className="lifecycle">
          {lifecycle.map((step, index, all) => (
            <div className="lifecycle__step" key={step.label}><span>{index + 1}</span><strong>{step.label}</strong><small>{step.count} iniziative</small>{index < all.length - 1 && <i><ChevronRight size={17} /></i>}</div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ClientsView({ onSelect }: { onSelect: (client: Client) => void }) {
  const [term, setTerm] = useState("");
  const filtered = clients.filter((client) => `${client.id} ${client.name} ${client.contact} ${client.services.join(" ")}`.toLowerCase().includes(term.toLowerCase()));
  return (
    <div className="view-stack">
      <section className="client-stats">
        <StatTile icon={Users} label="Anagrafiche EC-ID" value="1.486" note="+64 questo mese" color="blue" />
        <StatTile icon={CheckCircle2} label="Clienti attivi" value="1.284" note="86,4% del totale" color="green" />
        <StatTile icon={Network} label="Multi-servizio" value="312" note="24,3% dei clienti" color="purple" />
        <StatTile icon={AlertTriangle} label="Duplicati da verificare" value="8" note="Nessuna fusione automatica" color="amber" />
      </section>
      <section className="panel client-panel">
        <div className="panel__head client-panel__head">
          <div className="panel-title"><span className="panel-icon"><Users size={18} /></span><span><small>ANAGRAFICA UNICA</small><strong>Clienti recenti</strong></span></div>
          <div className="table-search"><Search size={17} /><input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Cerca nome, EC-ID o servizio" /></div>
        </div>
        <div className="client-table-wrap">
          <table className="client-table">
            <thead><tr><th>Cliente</th><th>Servizi attivi</th><th>Stato</th><th>Valore</th><th>Ultimo evento</th><th /></tr></thead>
            <tbody>{filtered.map((client) => (
              <tr key={client.id} onClick={() => onSelect(client)}>
                <td><span className="table-avatar">{initials(client.name)}</span><span><strong>{client.name}</strong><small>{client.id} · {client.kind}</small></span></td>
                <td><div className="service-tags">{client.services.map((service) => <span key={service}>{service}</span>)}</div></td>
                <td><span className={`status-badge status-badge--${client.status === "Attivo" ? "green" : client.status === "Attenzione" ? "red" : "amber"}`}><span />{client.status}</span></td>
                <td><strong>{client.value}</strong><small>valore annuo</small></td>
                <td>{client.last}</td>
                <td><ChevronRight size={17} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {!filtered.length && <div className="empty-state"><Search size={24} /><strong>Nessun cliente trovato</strong><span>Prova con un nome, EC-ID o servizio diverso.</span></div>}
      </section>
      <section className="duplicate-banner"><span><AlertTriangle size={20} /></span><div><strong>8 possibili duplicati richiedono verifica</strong><p>HUB ha trovato corrispondenze su codice fiscale, email o telefono. Nessuna anagrafica verrà unita senza autorizzazione.</p></div><button>Apri verifica <ArrowRight size={16} /></button></section>
    </div>
  );
}

function TeamView() {
  const managers = [
    { initials: "RE", role: "Responsabile Energia", area: "Eccomi Energia", score: "92%", tasks: 24, alert: 2, color: "#e5a000", soft: "#fff7dc" },
    { initials: "RP", role: "Responsabile Poste", area: "Eccomi Posta", score: "97%", tasks: 38, alert: 0, color: "#2563eb", soft: "#eaf1ff" },
    { initials: "RS", role: "Responsabile Spedizioni", area: "Eccomi Spedizioni", score: "94%", tasks: 17, alert: 1, color: "#0f9f6e", soft: "#e6f8f1" },
    { initials: "SD", role: "Salvatore", area: "Eccomi PEC · controllo CEO", score: "In avvio", tasks: 7, alert: 1, color: "#7c3aed", soft: "#f1eaff" },
  ];
  return (
    <div className="view-stack">
      <section className="manager-grid">{managers.map((manager) => (
        <article className="manager-card" key={manager.area}>
          <div className="manager-card__top"><span className="manager-avatar" style={{ color: manager.color, background: manager.soft }}>{manager.initials}</span><button className="icon-button"><ArrowUpRight size={18} /></button></div>
          <h3>{manager.role}</h3><p>{manager.area}</p>
          <div className="manager-score"><span><small>Obiettivi</small><strong>{manager.score}</strong></span><div><span style={{ width: manager.score.includes("%") ? manager.score : "28%", background: manager.color }} /></div></div>
          <div className="manager-meta"><span><ClipboardCheck size={15} /> {manager.tasks} pratiche</span><span className={manager.alert ? "text-amber" : "text-green"}><AlertTriangle size={15} /> {manager.alert} alert</span></div>
        </article>
      ))}</section>
      <section className="panel delegation-panel">
        <div className="panel__head"><div className="panel-title"><span className="panel-icon"><ShieldCheck size={18} /></span><span><small>GOVERNANCE</small><strong>Deleghe e limiti decisionali</strong></span></div><button className="secondary-button"><Plus size={16} /> Nuova delega</button></div>
        <div className="delegation-table"><div className="delegation-row delegation-row--head"><span>Responsabile</span><span>Perimetro</span><span>Limite economico</span><span>Validità</span><span>Stato</span></div>
          <div className="delegation-row"><strong>Responsabile Energia</strong><span>Operatività ordinaria</span><span>€ 1.500</span><span>31 dic 2026</span><em className="status-badge status-badge--green"><span />Attiva</em></div>
          <div className="delegation-row"><strong>Responsabile Poste</strong><span>Rimborsi e anomalie</span><span>€ 500</span><span>31 dic 2026</span><em className="status-badge status-badge--green"><span />Attiva</em></div>
          <div className="delegation-row"><strong>Responsabile Spedizioni</strong><span>Supplementi e reclami</span><span>€ 750</span><span>30 set 2026</span><em className="status-badge status-badge--amber"><span />In revisione</em></div>
        </div>
      </section>
    </div>
  );
}

function OperationsView() {
  const columns = [
    { title: "Da iniziare", color: "blue", count: 8, tasks: [
      { id: "TK-451", title: "Verificare documento cliente", meta: "Energia · EC-100284", priority: "Alta", due: "Oggi, 15:00" },
      { id: "TK-447", title: "Inviare ricevuta ufficiale", meta: "Posta · EC-100175", priority: "Media", due: "Oggi, 17:30" },
    ] },
    { title: "In lavorazione", color: "purple", count: 12, tasks: [
      { id: "TK-439", title: "Controllo telegramma", meta: "Posta · EC-100196", priority: "Alta", due: "Tra 42 min" },
      { id: "TK-432", title: "Preparare preventivo dual", meta: "Energia · EC-100119", priority: "Media", due: "Domani" },
    ] },
    { title: "In attesa", color: "amber", count: 9, tasks: [
      { id: "TK-428", title: "Attesa bolletta gas", meta: "Energia · EC-100284", priority: "Media", due: "Da 1 giorno" },
      { id: "TK-411", title: "Conferma ritiro pacco", meta: "Spedizioni · EC-100196", priority: "Bassa", due: "Da 3 ore" },
    ] },
    { title: "Bloccato", color: "red", count: 3, tasks: [
      { id: "TK-405", title: "Indirizzo non validato", meta: "Posta · EC-100175", priority: "Critica", due: "Da 2 giorni" },
      { id: "TK-398", title: "Pagamento da riconciliare", meta: "Spedizioni · EC-100119", priority: "Alta", due: "Da 18 ore" },
    ] },
  ];
  return (
    <div className="view-stack">
      <section className="operations-summary"><div><span className="status-dot status-dot--blue" /><span><small>Da iniziare</small><strong>8</strong></span></div><div><span className="status-dot status-dot--purple" /><span><small>In lavorazione</small><strong>12</strong></span></div><div><span className="status-dot status-dot--amber" /><span><small>In attesa</small><strong>9</strong></span></div><div><span className="status-dot status-dot--red" /><span><small>Bloccate</small><strong>3</strong></span></div><button className="secondary-button"><Plus size={16} /> Nuovo task</button></section>
      <section className="kanban">{columns.map((column) => (
        <div className="kanban-column" key={column.title}>
          <div className="kanban-column__head"><span className={`status-dot status-dot--${column.color}`} /><strong>{column.title}</strong><em>{column.count}</em></div>
          <div className="kanban-column__body">{column.tasks.map((task) => (
            <button className="task-card" key={task.id}><div className="task-card__id"><span>{task.id}</span><ChevronRight size={15} /></div><strong>{task.title}</strong><p>{task.meta}</p><div><span className={`priority-tag priority-tag--${task.priority.toLowerCase()}`}>{task.priority}</span><small><Clock3 size={13} />{task.due}</small></div></button>
          ))}<button className="add-task"><Plus size={15} /> Aggiungi attività</button></div>
        </div>
      ))}</section>
      <section className="escalation-banner"><span><Clock3 size={22} /></span><div><strong>Escalation automatica attiva</strong><p>Operatore → Responsabile → CEO in base a scadenza, rischio cliente e impatto economico.</p></div><button>Vedi regole <ArrowRight size={16} /></button></section>
    </div>
  );
}

function DecisionsView({
  decisions,
  assignedToByDecision,
  assignedOwnerLabel,
  onAction,
  onAssign,
}: {
  decisions: Decision[];
  assignedToByDecision: Record<number, string>;
  assignedOwnerLabel: string;
  onAction: (id: number, status: Decision["status"], message: string) => void;
  onAssign: (id: number, owner: string) => void;
}) {
  const open = decisions.filter((decision) => decision.status !== "Decisa").length;
  return (
    <div className="view-stack">
      <section className="decision-stats"><StatTile icon={Gavel} label="Da decidere" value={String(open)} note="1 ad alta priorità" color="red" /><StatTile icon={Clock3} label="In esecuzione" value={String(decisions.filter((decision) => decision.status !== "Decisa" && assignedToByDecision[decision.id]).length)} note="Assegnate al team" color="blue" /><StatTile icon={CheckCircle2} label="Verificate" value={String(decisions.filter((decision) => decision.status === "Decisa").length)} note="Questo mese" color="green" /><StatTile icon={TrendingUp} label="Impatto prodotto" value="€ 18,4K" note="Ultimi 90 giorni" color="purple" /></section>
      <section className="decision-list">{decisions.map((decision) => (
        <article className={classNames("decision-card", decision.status === "Decisa" && "decision-card--done")} key={decision.id}>
          <div className="decision-card__status"><span className={`urgency-dot urgency-dot--${decision.urgency.toLowerCase()}`} /><span><small>{decision.ecosystem}</small><strong>{decision.urgency} priorità</strong></span></div>
          <div className="decision-card__main"><div className="decision-card__title"><h3>{decision.title}</h3><span className={`status-badge status-badge--${decision.status === "Decisa" ? "green" : decision.status === "Informazioni richieste" ? "amber" : "blue"}`}><span />{decision.status}</span></div>
            <div className="decision-facts"><span><CircleDollarSign size={16} /><small>Impatto</small><strong>{decision.impact}</strong></span><span><Clock3 size={16} /><small>Scadenza</small><strong>{decision.due}</strong></span><span><UserCog size={16} /><small>Responsabile</small><strong>{assignedToByDecision[decision.id] || decision.assignedTo || "Da assegnare"}</strong></span></div>
            <div className="ai-recommendation"><span><Sparkles size={18} /></span><div><small>SUGGERIMENTO AI · AFFIDABILITÀ 87%</small><p>{decision.recommendation}</p></div></div>
          </div>
          <div className="decision-card__actions">
            {decision.status !== "Decisa" ? <><button className="approve-button" onClick={() => onAction(decision.id, "Decisa", "Decisione approvata e attività generate")}><Check size={17} /> Approva</button><button className="secondary-button" onClick={() => onAction(decision.id, "Informazioni richieste", "Richiesta di approfondimento registrata")}>Rinvia</button><button className="secondary-button" onClick={() => onAssign(decision.id, assignedOwnerLabel)}>Assegna a me</button></> : <span className="decision-completed"><CheckCircle2 size={18} /> Decisione registrata</span>}
          </div>
        </article>
      ))}</section>
    </div>
  );
}

function AIView({ priorities, onNavigate }: { priorities: CeoPriority[]; onNavigate: (key: ViewKey) => void }) {
  return <AIAlertCenter priorities={priorities} onNavigate={onNavigate} />;
}

function ReportsView() {
  const rows = [
    { kpi: "Ricavi globali", current: "€ 48.320", target: "€ 45.000", variance: "+7,4%", source: "EccomiOnline + verticali", state: "green" },
    { kpi: "Margine globale", current: "30,8%", target: "32,0%", variance: "−1,2 pt", source: "Costi operativi", state: "amber" },
    { kpi: "Tempo medio pratica", current: "1,8 gg", target: "2,0 gg", variance: "−10%", source: "Workflow HUB", state: "green" },
    { kpi: "Pratiche critiche", current: "7", target: "≤ 5", variance: "+2", source: "Tutti i verticali", state: "red" },
    { kpi: "Clienti multi-servizio", current: "24,3%", target: "25,0%", variance: "−0,7 pt", source: "EC-ID", state: "amber" },
  ];
  return (
    <div className="view-stack">
      <section className="report-grid"><article className="report-card report-card--featured"><div><span className="report-icon"><FileText size={22} /></span><span className="status-badge status-badge--green"><span />Pronto</span></div><h3>Report mensile CEO</h3><p>Numeri, problemi, opportunità, decisioni e risultati di luglio.</p><small>Aggiornato oggi alle 10:42</small><button className="primary-button">Apri report <ArrowRight size={16} /></button></article>
        <article className="report-card"><div><span className="report-icon"><BarChart3 size={22} /></span></div><h3>Sintesi settimanale</h3><p>Performance degli ecosistemi e scostamenti dagli obiettivi.</p><small>Prossima generazione: lunedì</small><button className="secondary-button">Anteprima</button></article>
        <article className="report-card"><div><span className="report-icon"><Users size={22} /></span></div><h3>Report responsabili</h3><p>Obiettivi, carichi, SLA, deleghe e criticità per area.</p><small>4 aree monitorate</small><button className="secondary-button">Apri</button></article>
      </section>
      <section className="panel kpi-table-panel"><div className="panel__head"><div className="panel-title"><span className="panel-icon"><Target size={18} /></span><span><small>DIZIONARIO KPI</small><strong>Indicatori globali</strong></span></div><div className="period-selector">Questo mese <ChevronDown size={15} /></div></div>
        <div className="kpi-table"><div className="kpi-row kpi-row--head"><span>Indicatore</span><span>Attuale</span><span>Obiettivo</span><span>Scostamento</span><span>Fonte</span></div>{rows.map((row) => <div className="kpi-row" key={row.kpi}><span><i className={`status-dot status-dot--${row.state}`} /><strong>{row.kpi}</strong></span><strong>{row.current}</strong><span>{row.target}</span><em className={`variance variance--${row.state}`}>{row.variance}</em><span>{row.source}</span></div>)}</div>
      </section>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="view-stack">
      <section className="settings-grid"><SettingsCard icon={ShieldCheck} title="Ruoli e permessi" description="CEO, responsabili, operatori e limiti di accesso." value="Struttura pronta" /><SettingsCard icon={Network} title="Integrazioni" description="Servizi disponibili e collegamenti ancora da attivare." value="3 disponibili" /><SettingsCard icon={Bell} title="Regole e notifiche" description="Soglie, escalation e canali di avviso." value="Da configurare" /><SettingsCard icon={FileText} title="Audit e sicurezza" description="Accessi, modifiche, esportazioni e storico." value="Predisposto" /></section>
      <section className="panel integration-panel"><div className="panel__head"><div className="panel-title"><span className="panel-icon"><Network size={18} /></span><span><small>COLLEGAMENTI</small><strong>Stato dei sistemi</strong></span></div><button className="secondary-button"><Plus size={16} /> Nuovo collegamento</button></div>
        <div className="integration-list"><IntegrationRow name="EccomiOnline · Shopify" detail="Negozio e punto unico di ingresso già esistenti" state="Disponibile" updated="Verificato" icon={Building2} /><IntegrationRow name="Resend" detail="Dominio email e invii automatici già attivi" state="Connesso" updated="OTP operativo" icon={Mail} /><IntegrationRow name="OpenAI API" detail="Account API e credito già disponibili" state="Disponibile" updated="Verificato" icon={Bot} /><IntegrationRow name="Supabase · ECCOMI OS" detail="Identità, ruoli e accesso CEO collegati" state="Connesso" updated="Accesso attivo" icon={ShieldCheck} /><IntegrationRow name="Render · HUB API" detail="Backend separato per i futuri collegamenti verticali" state="Da configurare" updated="Fase successiva" icon={Activity} /></div>
      </section>
      <section className="security-note"><LockKeyhole size={21} /><div><strong>Accesso reale protetto e operativo</strong><p>Le credenziali restano negli ambienti protetti. Ruolo CEO e permessi vengono verificati anche dal database.</p></div></section>
    </div>
  );
}

function PostaConnectionModal({
  onClose,
  onConnect,
}: {
  onClose: () => void;
  onConnect: (serviceKey: string) => Promise<void>;
}) {
  const [serviceKey, setServiceKey] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (connecting || serviceKey.trim().length < 32) return;
    setConnecting(true);
    setError(null);
    try {
      await onConnect(serviceKey.trim());
      setServiceKey("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Non è stato possibile verificare la chiave.");
      setConnecting(false);
    }
  };

  return (
    <div className="modal-layer posta-config-layer" role="dialog" aria-modal="true" aria-labelledby="posta-config-title">
      <button className="modal-scrim" onClick={onClose} disabled={connecting} aria-label="Chiudi" />
      <form className="modal posta-config-modal" onSubmit={submit}>
        <div className="modal__head">
          <div>
            <span className="eyebrow">Solo CEO · configurazione protetta</span>
            <h2 id="posta-config-title">Collega i dati reali di Eccomi Posta</h2>
            <p>La chiave viene verificata e cifrata nell’HUB. Non viene salvata nel browser e non modifica Eccomi Posta.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} disabled={connecting} aria-label="Chiudi"><X size={20} /></button>
        </div>

        <div className="posta-config-body">
          <div className="posta-config-instruction">
            <KeyRound size={21} />
            <span><strong>In Render copia il valore di SUPABASE_SERVICE_KEY</strong><small>Incollalo qui senza inviarlo in chat. L’HUB controllerà che appartenga all’archivio Eccomi Posta prima di conservarlo.</small></span>
          </div>
          <label className="posta-config-field">
            Chiave protetta
            <span className="input-with-icon">
              <LockKeyhole size={18} />
              <input
                autoFocus
                autoComplete="off"
                name="posta-service-key"
                type="password"
                value={serviceKey}
                onChange={(event) => {
                  setServiceKey(event.target.value);
                  setError(null);
                }}
                placeholder="Incolla qui la chiave copiata da Render"
                spellCheck={false}
              />
            </span>
          </label>
          <div className="posta-config-security"><ShieldCheck size={18} /><span><strong>Sola lettura dall’HUB</strong><small>Nessun invio, pagamento, worker o pratica potrà essere modificato.</small></span></div>
          {error && <div className="entry-error" role="alert"><AlertTriangle size={17} /><span>{error}</span></div>}
        </div>

        <div className="modal__actions">
          <button type="button" className="secondary-button" onClick={onClose} disabled={connecting}>Annulla</button>
          <button type="submit" className="primary-button" disabled={connecting || serviceKey.trim().length < 32}>
            {connecting ? "Verifica in corso…" : "Verifica e collega"}
          </button>
        </div>
      </form>
    </div>
  );
}

function NewEntryModal({
  onClose,
  onCreate,
  storageState,
}: {
  onClose: () => void;
  onCreate: (entry: HubEntryInput) => Promise<void>;
  storageState: "real" | "pending" | "demo";
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [kind, setKind] = useState<HubEntryKind>("ecosistema");
  const [name, setName] = useState("");
  const [need, setNeed] = useState("");
  const [objective, setObjective] = useState("");
  const [dnaLink, setDnaLink] = useState("");
  const [revenueModel, setRevenueModel] = useState("");
  const [expectedCosts, setExpectedCosts] = useState("");
  const [responsible, setResponsible] = useState("Sotto controllo CEO");
  const [timeHorizonDays, setTimeHorizonDays] = useState("90");
  const [risks, setRisks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const types: Array<{ id: HubEntryKind; label: string; icon: LucideIcon }> = [
    { id: "ecosistema", label: "Nuovo ecosistema", icon: Network },
    { id: "servizio", label: "Nuovo servizio", icon: BriefcaseBusiness },
    { id: "progetto", label: "Nuovo progetto", icon: FolderKanban },
    { id: "idea", label: "Idea da valutare", icon: Lightbulb },
  ];

  const firstStepValid = [name, need, objective, dnaLink].every((value) => value.trim());
  const parsedCosts = Number(expectedCosts);
  const secondStepValid = Boolean(
    revenueModel.trim()
    && expectedCosts !== ""
    && Number.isFinite(parsedCosts)
    && parsedCosts >= 0
    && responsible.trim()
    && risks.trim(),
  );

  const submit = async () => {
    if (!firstStepValid || !secondStepValid || storageState === "pending" || saving) return;
    setSaving(true);
    setError(null);

    try {
      await onCreate({
        entryType: kind,
        name: name.trim(),
        customerNeed: need.trim(),
        objective: objective.trim(),
        dnaLink: dnaLink.trim(),
        revenueModel: revenueModel.trim(),
        expectedCosts: parsedCosts,
        responsible,
        timeHorizonDays: Number(timeHorizonDays),
        risks: risks.trim(),
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Non è stato possibile salvare la new entry.");
      setSaving(false);
    }
  };

  return (
    <div className="modal-layer" role="dialog" aria-modal="true">
      <button className="modal-scrim" onClick={onClose} aria-label="Chiudi" />
      <div className="modal new-entry-modal">
        <div className="modal__head">
          <div><span className="eyebrow">Solo CEO</span><h2>+ New entry</h2><p>Ogni nuova iniziativa nasce nello stato “Da valutare”.</p></div>
          <button className="icon-button" onClick={onClose} disabled={saving} aria-label="Chiudi"><X size={20} /></button>
        </div>

        <div className="entry-progress" aria-label={`Passaggio ${step} di 2`}>
          <span className={classNames(step >= 1 && "entry-progress__active")}><i>1</i><strong>Iniziativa</strong></span>
          <span className={classNames(step >= 2 && "entry-progress__active")}><i>2</i><strong>Valutazione</strong></span>
        </div>

        {step === 1 ? (
          <>
            <div className="entry-types">
              {types.map((type) => {
                const Icon = type.icon;
                return <button type="button" key={type.id} className={classNames(kind === type.id && "entry-type--active")} onClick={() => setKind(type.id)}><Icon size={20} /><span>{type.label}</span><Check size={16} /></button>;
              })}
            </div>
            <div className="entry-form">
              <label>Nome della new entry<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Es. Eccomi Fiscal" /></label>
              <label>Bisogno del cliente<textarea value={need} onChange={(event) => setNeed(event.target.value)} placeholder="Quale problema concreto risolve?" /></label>
              <label>Obiettivo<textarea value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Quale risultato vogliamo raggiungere?" /></label>
              <label>Collegamento con ECCOMI DNA<textarea value={dnaLink} onChange={(event) => setDnaLink(event.target.value)} placeholder="Come rafforza semplicità, fiducia o utilità per il cliente?" /></label>
            </div>
            <div className="dna-check"><ShieldCheck size={19} /><div><strong>Coerenza prima dell’operatività</strong><p>L’iniziativa sarà valutata senza diventare automaticamente operativa.</p></div></div>
          </>
        ) : (
          <div className="entry-form entry-form--second-step">
            <label>Modello di ricavo<textarea autoFocus value={revenueModel} onChange={(event) => setRevenueModel(event.target.value)} placeholder="Come genera valore e ricavi per Eccomi?" /></label>
            <div className="entry-form__row">
              <label>Costi previsti (€)<input type="number" min="0" step="0.01" inputMode="decimal" value={expectedCosts} onChange={(event) => setExpectedCosts(event.target.value)} placeholder="0,00" /></label>
              <label>Tempi previsti<select value={timeHorizonDays} onChange={(event) => setTimeHorizonDays(event.target.value)}><option value="30">30 giorni</option><option value="60">60 giorni</option><option value="90">90 giorni</option><option value="180">6 mesi</option><option value="365">12 mesi</option></select></label>
            </div>
            <label>Responsabile<select value={responsible} onChange={(event) => setResponsible(event.target.value)}><option value="Sotto controllo CEO">Sotto controllo diretto del CEO</option><option value="Responsabile da nominare">Responsabile da nominare</option></select></label>
            <label>Rischi<textarea value={risks} onChange={(event) => setRisks(event.target.value)} placeholder="Rischi economici, operativi, normativi o reputazionali..." /></label>
            <div className={classNames("entry-storage-note", storageState === "real" ? "entry-storage-note--real" : "entry-storage-note--demo")}>
              {storageState === "real" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>
                <strong>{storageState === "real" ? "Salvataggio reale" : storageState === "pending" ? "Archivio da attivare" : "Modalità dimostrativa"}</strong>
                <small>{storageState === "real" ? "La new entry sarà registrata nell’archivio centrale ECCOMI OS." : storageState === "pending" ? "Completa l’attivazione Supabase prima di registrare la prima new entry." : "Questa prova non verrà registrata nell’archivio centrale."}</small>
              </span>
            </div>
          </div>
        )}

        {error && <div className="entry-error" role="alert"><AlertTriangle size={17} /><span>{error}</span></div>}

        <div className="modal__actions">
          {step === 1 ? (
            <>
              <button className="secondary-button" onClick={onClose}>Annulla</button>
              <button className="primary-button" disabled={!firstStepValid} onClick={() => setStep(2)}>Continua <ArrowRight size={16} /></button>
            </>
          ) : (
            <>
              <button className="secondary-button" onClick={() => { setStep(1); setError(null); }} disabled={saving}>Indietro</button>
              <button className="primary-button" disabled={!secondStepValid || storageState === "pending" || saving} onClick={submit}>{saving ? "Salvataggio..." : storageState === "pending" ? "Attiva prima l’archivio" : "Inserisci da valutare"} {!saving && storageState !== "pending" && <ArrowRight size={16} />}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchModal({
  value,
  onChange,
  onClose,
  results,
}: {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  results: Array<{
    type: string;
    title: string;
    detail: string;
    action: () => void;
  }>;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Enter" && value.trim() && results.length > 0) {
        event.preventDefault();
        results[0].action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, results, value]);

  const executeFirstResult = () => {
    if (results.length > 0) {
      results[0].action();
    }
  };

  const suggestions = [
    {
      label: "Cosa richiede attenzione?",
      query: "cosa richiede attenzione",
      icon: AlertTriangle,
    },
    {
      label: "Apri Decision Center",
      query: "apri decision center",
      icon: Gavel,
    },
    {
      label: "Pratiche Eccomi Posta",
      query: "pratiche posta",
      icon: Mail,
    },
    {
      label: "Offerte Eccomi Noleggio",
      query: "offerte noleggio",
      icon: CarFront,
    },
    {
      label: "Crea una nuova entry",
      query: "nuova entry",
      icon: Plus,
    },
    {
      label: "Report e risultati",
      query: "apri report",
      icon: BarChart3,
    },
  ];

  return (
    <div
      className="modal-layer search-layer"
      role="dialog"
      aria-modal="true"
      aria-label="Command Bar ECCOMI OS"
    >
      <button
        className="modal-scrim"
        onClick={onClose}
        aria-label="Chiudi"
      />

      <div className="search-modal command-center">
        <div className="search-modal__input">
          <Sparkles size={21} />
          <input
            autoFocus
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                onClose();
                return;
              }

              if (event.key === "Enter") {
                event.preventDefault();
                executeFirstResult();
              }
            }}
            placeholder="Chiedi a ECCOMI OS cosa vuoi fare..."
          />
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Chiudi Command Bar"
          >
            <X size={19} />
          </button>
        </div>

        {!value ? (
          <div className="command-center__body">
            <div className="command-center__intro">
              <span className="panel-icon panel-icon--ai">
                <Sparkles size={18} />
              </span>
              <div>
                <small>ANTICIPATORE OPERATIVO</small>
                <strong>Cosa vuoi fare adesso?</strong>
                <p>
                  Posso aiutarti a decidere, trovare informazioni o aprire
                  qualsiasi area di ECCOMI OS.
                </p>
              </div>
            </div>

            <div className="command-suggestion-grid">
              {suggestions.map((suggestion) => {
                const Icon = suggestion.icon;

                return (
                  <button
                    key={suggestion.query}
                    onClick={() => onChange(suggestion.query)}
                  >
                    <span>
                      <Icon size={17} />
                    </span>
                    <strong>{suggestion.label}</strong>
                    <ChevronRight size={16} />
                  </button>
                );
              })}
            </div>

            <div className="command-center__examples">
              <small>PUOI ANCHE SCRIVERE</small>
              <button
                type="button"
                onClick={() => onChange("Cosa non va oggi?")}
              >
                Cosa non va oggi?
              </button>

              <button
                type="button"
                onClick={() => onChange("Apri Eccomi Noleggio")}
              >
                Apri Eccomi Noleggio
              </button>

              <button
                type="button"
                onClick={() => onChange("Mostrami i clienti")}
              >
                Mostrami i clienti
              </button>
            </div>
          </div>
        ) : (
          <div className="search-results command-results">
            <div className="command-results__heading">
              <small>ECCOMI HA CAPITO</small>
              <strong>{results.length} azioni o risultati disponibili</strong>
            </div>

            {results.length ? (
              results.map((result, index) => (
                <button
                  key={`${result.type}-${result.title}-${index}`}
                  onClick={result.action}
                >
                  <span
                    className={
                      result.type === "Comando" ||
                      result.type === "Azione"
                        ? "result-type result-type--command"
                        : "result-type"
                    }
                  >
                    {result.type}
                  </span>

                  <span>
                    <strong>{result.title}</strong>
                    <small>{result.detail}</small>
                  </span>

                  <ChevronRight size={17} />
                </button>
              ))
            ) : (
              <div className="empty-state">
                <Bot size={24} />
                <strong>Non ho ancora capito la richiesta</strong>
                <span>
                  Prova con “Apri Decision Center”, “Posta” o “Nuova entry”.
                </span>
              </div>
            )}
          </div>
        )}

        <div className="search-modal__footer">
          <div className="command-footer-actions">
            <button
              type="button"
              className="command-footer-button command-footer-button--primary"
              onClick={executeFirstResult}
              disabled={!value.trim() || results.length === 0}
            >
              <kbd>↵</kbd>
              <span>Apri risultato</span>
            </button>

            <button
              type="button"
              className="command-footer-button"
              onClick={onClose}
            >
              <kbd>ESC</kbd>
              <span>Chiudi</span>
            </button>
          </div>

          <em>ECCOMI Command Bar · V1</em>
        </div>
      </div>
    </div>
  );
}

function EcosystemDrawer({
  item,
  postaSummary,
  noleggioSummary,
  onClose,
  onOpenDashboard,
  onOpenOperational,
  onConfigurePosta,
  onAdvance,
  onGenerateEvaluation,
  onDecision,
  onLoadProjectPlan,
  onSaveProjectPlan,
  onAdvanceToTest,
}: {
  item: Ecosystem;
  postaSummary: PostaSummary | null;
  noleggioSummary: NoleggioSummary | null;
  onClose: () => void;
  onOpenDashboard: (item: Ecosystem) => void;
  onOpenOperational: (item: Ecosystem) => void;
  onConfigurePosta?: () => void;
  onAdvance: (item: Ecosystem) => Promise<void>;
  onGenerateEvaluation: (item: Ecosystem) => Promise<HubEvaluation>;
  onDecision: (
    item: Ecosystem,
    action: "request_details" | "suspend" | "approve",
  ) => Promise<{ item: Ecosystem; evaluation: HubEvaluation }>;
  onLoadProjectPlan: (item: Ecosystem) => Promise<HubProjectPlan | null>;
  onSaveProjectPlan: (
    item: Ecosystem,
    input: HubProjectPlanInput,
  ) => Promise<{ item: Ecosystem; plan: HubProjectPlan }>;
  onAdvanceToTest: (item: Ecosystem) => Promise<{ item: Ecosystem; plan: HubProjectPlan }>;
}) {
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<HubEvaluation | null>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [decisionLoading, setDecisionLoading] = useState<"request_details" | "suspend" | "approve" | null>(null);
  const [projectPlan, setProjectPlan] = useState<HubProjectPlan | null>(null);
  const [projectPlanLoading, setProjectPlanLoading] = useState(false);
  const [projectPlanError, setProjectPlanError] = useState<string | null>(null);
  const [projectPlanOpen, setProjectPlanOpen] = useState(false);
  const [projectPlanInitialStep, setProjectPlanInitialStep] = useState<1 | 2>(1);
  const [testAdvancing, setTestAdvancing] = useState(false);

  useEffect(() => {
    if (!item.entryType || !item.persisted || !["Valutazione", "Approvato", "Sospeso"].includes(item.status)) {
      return;
    }

    let cancelled = false;
    setEvaluationLoading(true);
    setEvaluationError(null);
    onGenerateEvaluation(item)
      .then((result) => {
        if (!cancelled) setEvaluation(result);
      })
      .catch((error) => {
        if (!cancelled) {
          setEvaluationError(error instanceof Error ? error.message : "Non è stato possibile preparare la valutazione.");
        }
      })
      .finally(() => {
        if (!cancelled) setEvaluationLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [item.id, item.status, item.entryType, item.persisted]);

  useEffect(() => {
    if (!item.entryType || !item.persisted || !["Progettazione", "Test"].includes(item.status)) {
      return;
    }

    let cancelled = false;
    setProjectPlanLoading(true);
    setProjectPlanError(null);
    onLoadProjectPlan(item)
      .then((result) => {
        if (!cancelled) setProjectPlan(result);
      })
      .catch((error) => {
        if (!cancelled) {
          setProjectPlanError(error instanceof Error ? error.message : "Non è stato possibile aprire la progettazione.");
        }
      })
      .finally(() => {
        if (!cancelled) setProjectPlanLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [item.id, item.status, item.entryType, item.persisted]);

  const advanceToEvaluation = async () => {
    setAdvanceError(null);
    setAdvancing(true);
    try {
      await onAdvance(item);
    } catch (error) {
      setAdvanceError(error instanceof Error ? error.message : "Non è stato possibile avviare la valutazione.");
    } finally {
      setAdvancing(false);
    }
  };

  const decideEvaluation = async (action: "request_details" | "suspend" | "approve") => {
    setEvaluationError(null);
    setDecisionLoading(action);
    try {
      const result = await onDecision(item, action);
      setEvaluation(result.evaluation);
    } catch (error) {
      setEvaluationError(error instanceof Error ? error.message : "Non è stato possibile registrare la decisione.");
    } finally {
      setDecisionLoading(null);
    }
  };

  const saveProjectPlan = async (input: HubProjectPlanInput) => {
    setProjectPlanError(null);
    const result = await onSaveProjectPlan(item, input);
    setProjectPlan(result.plan);
    setProjectPlanOpen(false);
  };

  const openProjectPlan = (initialStep: 1 | 2 = 1) => {
    setProjectPlanInitialStep(initialStep);
    setProjectPlanOpen(true);
  };

  const advanceToTest = async () => {
    setProjectPlanError(null);
    setTestAdvancing(true);
    try {
      const result = await onAdvanceToTest(item);
      setProjectPlan(result.plan);
    } catch (error) {
      setProjectPlanError(error instanceof Error ? error.message : "Non è stato possibile avviare il Test.");
    } finally {
      setTestAdvancing(false);
    }
  };

  const projectGate = projectPlan ? projectPlanGate(projectPlan) : null;

  if (item.id === "posta" && postaSummary) {
    const serviceRows = Object.entries(postaSummary.byService)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    return (
      <div className="drawer-layer">
        <button className="drawer-scrim" onClick={onClose} aria-label="Chiudi" />
        <aside className="drawer drawer--posta">
          <div className="drawer__head">
            <span className="ecosystem-logo ecosystem-logo--large" style={{ color: item.color, background: item.soft }}>{ecosystemIcon(item.icon, 27)}</span>
            <div><span className="eyebrow">Ecosistema · dati reali</span><h2>{item.name}</h2><p>Collegamento protetto in sola lettura</p></div>
            <button className="icon-button" onClick={onClose}><X size={20} /></button>
          </div>
          <div className="drawer__body">
            <div className="drawer-status">
              <span className={`status-badge status-badge--${statusClass(item.status)}`}><span />{item.status}</span>
              <small>Aggiornato {formatRelativeDate(postaSummary.generatedAt)}</small>
            </div>

            <section className="posta-real-grid">
              <div><small>Pratiche totali</small><strong>{postaSummary.summary.total}</strong><em>{postaSummary.summary.createdToday} create oggi</em></div>
              <div><small>Da lavorare</small><strong>{postaSummary.summary.open}</strong><em>richiedono ancora un intervento</em></div>
              <div><small>Inviate a Poste</small><strong>{postaSummary.summary.sent}</strong><em>invio eseguito</em></div>
              <div className={postaSummary.summary.errors ? "posta-real-grid__warning" : undefined}><small>Anomalie</small><strong>{postaSummary.summary.errors}</strong><em>{postaSummary.summary.manual} in lavorazione manuale</em></div>
            </section>

            <section className="drawer-section">
              <span className="drawer-section__title">Servizi rilevati</span>
              <div className="posta-service-grid">
                {serviceRows.map(([service, count]) => (
                  <span key={service}><small>{formatPostaStatus(service)}</small><strong>{count}</strong></span>
                ))}
              </div>
            </section>

            <section className="drawer-section">
              <span className="drawer-section__title">Ultime pratiche</span>
              <div className="posta-practice-list">
                {postaSummary.recent.map((practice) => (
                  <div className="posta-practice-row" key={practice.id}>
                    <span className={`status-dot status-dot--${postaStatusColor(practice.status)}`} />
                    <span><strong>{practice.orderName || practice.id.slice(0, 8)}</strong><small>{formatPostaStatus(practice.service)} · {formatPostaStatus(practice.status)}</small></span>
                    <time>{formatRelativeDate(practice.updatedAt || practice.createdAt)}</time>
                  </div>
                ))}
                {!postaSummary.recent.length && <div className="empty-state"><Mail size={22} /><strong>Nessuna pratica disponibile</strong><span>Il collegamento è attivo ma l’archivio non contiene ancora record.</span></div>}
              </div>
            </section>

            <div className="posta-readonly-note"><ShieldCheck size={18} /><span><strong>Nessuna operazione può partire dall’HUB</strong><small>Questa prima integrazione legge soltanto conteggi, stati e riferimenti pratica. Email, indirizzi, documenti e contenuti non vengono trasferiti.</small></span></div>
          </div>
          <div className="drawer__footer"><button className="secondary-button" onClick={() => onOpenDashboard(item)}>Dashboard ecosistema</button><button className="primary-button" onClick={() => onOpenOperational(item)}>Apri area operativa <ArrowUpRight size={16} /></button></div>
        </aside>
      </div>
    );
  }

  if (item.id === "posta") {
    const connecting = item.dataMode === "loading";

    return (
      <div className="drawer-layer">
        <button className="drawer-scrim" onClick={onClose} aria-label="Chiudi" />
        <aside className="drawer drawer--posta">
          <div className="drawer__head">
            <span className="ecosystem-logo ecosystem-logo--large" style={{ color: item.color, background: item.soft }}>{ecosystemIcon(item.icon, 27)}</span>
            <div><span className="eyebrow">Ecosistema · sola lettura</span><h2>{item.name}</h2><p>Nessun dato dimostrativo visualizzato</p></div>
            <button className="icon-button" onClick={onClose}><X size={20} /></button>
          </div>
          <div className="drawer__body">
            <div className="drawer-status">
              <span className={`status-badge status-badge--${statusClass(item.status)}`}><span />{item.status}</span>
              <small>{connecting ? "Collegamento in corso" : "Dati reali in configurazione"}</small>
            </div>

            <section className="posta-real-grid">
              <div><small>Pratiche totali</small><strong>—</strong><em>dato non ancora disponibile</em></div>
              <div><small>Da lavorare</small><strong>—</strong><em>dato non ancora disponibile</em></div>
              <div><small>Inviate a Poste</small><strong>—</strong><em>dato non ancora disponibile</em></div>
              <div><small>Anomalie</small><strong>—</strong><em>dato non ancora disponibile</em></div>
            </section>

            <section className="panel posta-connection-state posta-connection-state--warning" role="status">
              {connecting ? <Activity size={23} /> : <LockKeyhole size={23} />}
              <span>
                <strong>{connecting ? "Collegamento a Eccomi Posta" : "Manca la credenziale protetta nell’HUB"}</strong>
                <small>{connecting ? "L’HUB sta verificando la disponibilità dei dati reali." : "Appena viene registrata, questi indicatori saranno sostituiti automaticamente dai dati effettivi delle pratiche."}</small>
              </span>
              {!connecting && onConfigurePosta && <button className="primary-button posta-configure-button" onClick={onConfigurePosta}>Configura dati reali</button>}
            </section>

            <div className="posta-readonly-note">
              <ShieldCheck size={18} />
              <span><strong>Eccomi Posta resta separato e intatto</strong><small>L’HUB leggerà soltanto conteggi, stati e riferimenti pratica. Non potrà avviare invii, modificare pratiche o intervenire sui worker.</small></span>
            </div>
          </div>
          <div className="drawer__footer"><button className="secondary-button" onClick={() => onOpenDashboard(item)}>Dashboard ecosistema</button><button className="primary-button" onClick={() => onOpenOperational(item)}>Apri area operativa <ArrowUpRight size={16} /></button></div>
        </aside>
      </div>
    );
  }

  if (item.id === "noleggio" && noleggioSummary) {
    const toWork = noleggioSummary.summary.pendingApproval
      + noleggioSummary.summary.newLeads
      + noleggioSummary.summary.workingLeads;

    const noleggioBusinessEvents = noleggioSummary.recent.filter((event) => {
      const eventType = event.eventType.toLowerCase();
      return !eventType.includes("delete")
        && !eventType.includes("purge");
    });

    const hiddenTechnicalEvents =
      noleggioSummary.recent.length - noleggioBusinessEvents.length;

    return (
      <div className="drawer-layer">
        <button className="drawer-scrim" onClick={onClose} aria-label="Chiudi" />
        <aside className="drawer drawer--posta">
          <div className="drawer__head">
            <span className="ecosystem-logo ecosystem-logo--large" style={{ color: item.color, background: item.soft }}>{ecosystemIcon(item.icon, 27)}</span>
            <div><span className="eyebrow">Ecosistema · dati reali</span><h2>{item.name}</h2><p>Promozioni, lead e risultati aggregati</p></div>
            <button className="icon-button" onClick={onClose}><X size={20} /></button>
          </div>
          <div className="drawer__body">
            <div className="drawer-status">
              <span className={`status-badge status-badge--${statusClass(item.status)}`}><span />{item.status}</span>
              <small>Aggiornato {formatRelativeDate(noleggioSummary.generatedAt)}</small>
            </div>

            <section className="posta-real-grid">
              <div><small>Promozioni totali</small><strong>{noleggioSummary.summary.promotionsTotal}</strong><em>{noleggioSummary.summary.active} online</em></div>
              <div className={noleggioSummary.summary.pendingApproval ? "posta-real-grid__warning" : undefined}><small>Da approvare</small><strong>{noleggioSummary.summary.pendingApproval}</strong><em>controllo CEO</em></div>
              <div><small>Lead totali</small><strong>{noleggioSummary.summary.leadsTotal}</strong><em>{noleggioSummary.summary.newLeads} nuovi</em></div>
              <div className={toWork ? "posta-real-grid__warning" : undefined}><small>Da lavorare</small><strong>{toWork}</strong><em>{noleggioSummary.summary.contracts} contratti</em></div>
            </section>

            <section className="drawer-section">
              <span className="drawer-section__title">
                Pipeline operativa
              </span>

              <div className="posta-readonly-note">
                <CarFront size={18} />
                <span>
                  <strong>Pubblicazione offerte</strong>
                  <small>
                    Dalla quotazione ricevuta fino alla pubblicazione online.
                  </small>
                </span>
              </div>

              <div className="posta-service-grid">
                <span>
                  <small>Nuove quotazioni</small>
                  <strong>
                    {noleggioSummary.pipeline.quotationsNew}
                  </strong>
                </span>

                <span>
                  <small>Verifica AI</small>
                  <strong>
                    {noleggioSummary.pipeline.aiReview}
                  </strong>
                </span>

                <span>
                  <small>Da approvare</small>
                  <strong>
                    {noleggioSummary.pipeline.pendingApproval}
                  </strong>
                </span>

                <span>
                  <small>Pubblicate</small>
                  <strong>
                    {noleggioSummary.pipeline.published}
                  </strong>
                </span>
              </div>

              <div className="posta-readonly-note">
                <CarFront size={18} />
                <span>
                  <strong>Pipeline commerciale</strong>
                  <small>
                    Dal nuovo contatto fino alla firma del contratto.
                  </small>
                </span>
              </div>

              <div className="posta-service-grid">
                <span>
                  <small>Lead nuovi</small>
                  <strong>
                    {noleggioSummary.pipeline.leadsNew}
                  </strong>
                </span>

                <span>
                  <small>In lavorazione</small>
                  <strong>
                    {noleggioSummary.pipeline.leadsWorking}
                  </strong>
                </span>

                <span>
                  <small>Contratti</small>
                  <strong>
                    {noleggioSummary.pipeline.contracts}
                  </strong>
                </span>
              </div>

              <div className="posta-readonly-note">
                <ShieldCheck size={18} />
                <span>
                  <strong>Gestione operativa</strong>
                  <small>
                    Consegne completate e pratiche archiviate.
                  </small>
                </span>
              </div>

              <div className="posta-service-grid">
                <span>
                  <small>Consegne</small>
                  <strong>
                    {noleggioSummary.pipeline.deliveries}
                  </strong>
                </span>

                <span>
                  <small>Archiviate</small>
                  <strong>
                    {noleggioSummary.pipeline.archived}
                  </strong>
                </span>
              </div>
            </section>

            <section className="drawer-section">
              <span className="drawer-section__title">
                Decision Center · Alert
              </span>

              <div className="posta-practice-list">
                {noleggioSummary.alerts.map((alert, index) => {
                  const alertType = alert.type.toLowerCase();

                  const priority =
                    alertType === "critical" || alertType === "error"
                      ? "Critico"
                      : alertType === "warning"
                        ? "Attenzione"
                        : alertType === "success"
                          ? "Opportunità"
                          : "Informazione";

                  const dotClass =
                    alertType === "critical" || alertType === "error"
                      ? "status-dot--red"
                      : alertType === "warning"
                        ? "status-dot--orange"
                        : alertType === "success"
                          ? "status-dot--green"
                          : "status-dot--blue";

                  return (
                    <div
                      className="posta-practice-row"
                      key={`${alert.type}-${alert.title}-${index}`}
                    >
                      <span className={`status-dot ${dotClass}`} />

                      <span>
                        <strong>{alert.title}</strong>
                        <small>{priority}</small>
                      </span>
                    </div>
                  );
                })}

                {!noleggioSummary.alerts.length && (
                  <div className="empty-state">
                    <ShieldCheck size={22} />
                    <strong>Nessun alert operativo</strong>
                    <span>
                      Al momento non risultano attività urgenti.
                    </span>
                  </div>
                )}
              </div>
            </section>

            <section className="drawer-section">
              <span className="drawer-section__title">Ultimi eventi</span>
              <div className="posta-practice-list">
                {noleggioBusinessEvents.slice(0, 6).map((event) => (
                  <div className="posta-practice-row" key={event.id}>
                    <span className="status-dot status-dot--blue" />

                    <span>
                      <strong>{event.title}</strong>
                      <small>
                        {formatPostaStatus(event.eventType)}
                      </small>
                    </span>

                    <time>
                      {formatRelativeDate(event.createdAt)}
                    </time>
                  </div>
                ))}

                {!noleggioBusinessEvents.length && (
                  <div className="empty-state">
                    <CarFront size={22} />
                    <strong>
                      Nessun evento commerciale recente
                    </strong>
                    <span>
                      Nuovi lead, pubblicazioni e contratti
                      compariranno qui.
                    </span>
                  </div>
                )}

                {hiddenTechnicalEvents > 0 && (
                  <div className="posta-readonly-note">
                    <ShieldCheck size={18} />

                    <span>
                      <strong>
                        {hiddenTechnicalEvents}
                        {" "}
                        {hiddenTechnicalEvents === 1
                          ? "evento tecnico escluso"
                          : "eventi tecnici esclusi"}
                      </strong>

                      <small>
                        Eliminazioni e manutenzioni restano
                        disponibili nei log dell’area Noleggio.
                      </small>
                    </span>
                  </div>
                )}
              </div>
            </section>

            <div className="posta-readonly-note"><ShieldCheck size={18} /><span><strong>L’operatività resta nell’area Noleggio</strong><small>L’HUB legge solo indicatori aggregati e non può pubblicare offerte, modificare lead o accedere ai documenti.</small></span></div>
          </div>
          <div className="drawer__footer"><button className="secondary-button" onClick={() => onOpenDashboard(item)}>Dashboard ecosistema</button><button className="primary-button" onClick={() => onOpenOperational(item)}>Apri area operativa <ArrowUpRight size={16} /></button></div>
        </aside>
      </div>
    );
  }

  if (item.id === "noleggio") {
    const connecting = item.dataMode === "loading";

    return (
      <div className="drawer-layer">
        <button className="drawer-scrim" onClick={onClose} aria-label="Chiudi" />
        <aside className="drawer drawer--posta">
          <div className="drawer__head">
            <span className="ecosystem-logo ecosystem-logo--large" style={{ color: item.color, background: item.soft }}>{ecosystemIcon(item.icon, 27)}</span>
            <div><span className="eyebrow">Ecosistema</span><h2>{item.name}</h2><p>Area gestionale già collegata</p></div>
            <button className="icon-button" onClick={onClose}><X size={20} /></button>
          </div>
          <div className="drawer__body">
            <div className="drawer-status">
              <span className={`status-badge status-badge--${statusClass(item.status)}`}><span />{item.status}</span>
              <small>{connecting ? "Collegamento KPI in corso" : "KPI momentaneamente non disponibili"}</small>
            </div>
            <section className="posta-real-grid">
              <div><small>Promozioni totali</small><strong>—</strong><em>dato in aggiornamento</em></div>
              <div><small>Da approvare</small><strong>—</strong><em>dato in aggiornamento</em></div>
              <div><small>Lead totali</small><strong>—</strong><em>dato in aggiornamento</em></div>
              <div><small>Da lavorare</small><strong>—</strong><em>dato in aggiornamento</em></div>
            </section>
            <section className="panel posta-connection-state posta-connection-state--warning" role="status">
              {connecting ? <Activity size={23} /> : <AlertTriangle size={23} />}
              <span><strong>{connecting ? "Lettura dati reali in corso" : "Collegamento KPI da riprovare"}</strong><small>Il pulsante “Apri area operativa” rimane disponibile e porta alla dashboard gestionale, non alla pagina pubblica Shopify.</small></span>
            </section>
          </div>
          <div className="drawer__footer"><button className="secondary-button" onClick={() => onOpenDashboard(item)}>Dashboard ecosistema</button><button className="primary-button" onClick={() => onOpenOperational(item)}>Apri area operativa <ArrowUpRight size={16} /></button></div>
        </aside>
      </div>
    );
  }

  if (item.entryType) {
    return (
      <div className="drawer-layer">
        <button className="drawer-scrim" onClick={onClose} aria-label="Chiudi" />
        <aside className={classNames("drawer", item.status !== "Da valutare" && "drawer--evaluation")}>
          <div className="drawer__head">
            <span className="ecosystem-logo ecosystem-logo--large" style={{ color: item.color, background: item.soft }}>{ecosystemIcon(item.icon, 27)}</span>
            <div><span className="eyebrow">{entryTypeLabel(item.entryType)}</span><h2>{item.name}</h2><p>{item.persisted ? "Registrata nell’archivio centrale" : "Prova dimostrativa"}</p></div>
            <button className="icon-button" onClick={onClose}><X size={20} /></button>
          </div>
          <div className="drawer__body">
            <div className="drawer-status"><span className={`status-badge status-badge--${statusClass(item.status)}`}><span />{item.status}</span><small>{item.createdAt ? `Creata ${formatEntryDate(item.createdAt)}` : "Creata ora"}</small></div>
            <section className="drawer-section"><span className="drawer-section__title">Fondamento</span><EntryDetail label="Bisogno del cliente" value={item.customerNeed} /><EntryDetail label="Obiettivo" value={item.objective} /><EntryDetail label="Collegamento con ECCOMI DNA" value={item.dnaLink} /></section>
            <section className="drawer-section"><span className="drawer-section__title">Valutazione iniziale</span><EntryDetail label="Modello di ricavo" value={item.revenueModel} /><div className="entry-facts"><span><small>Costi previsti</small><strong>{formatCurrency(item.expectedCosts || 0)}</strong></span><span><small>Tempi previsti</small><strong>{item.timeHorizonDays || 0} giorni</strong></span></div><EntryDetail label="Rischi" value={item.risks} /></section>
            {item.status !== "Da valutare" && (
              <section className="drawer-section evaluation-section">
                <div className="evaluation-section__head">
                  <span className="drawer-section__title">Valutazione strategica</span>
                  {evaluation && (
                    <span className={classNames("evaluation-source", evaluation.analysisSource === "openai" && "evaluation-source--ai")}>
                      <Sparkles size={12} />
                      {evaluation.analysisSource === "openai" ? `AI · ${evaluation.analysisModel || "OpenAI"}` : "Analisi preliminare HUB"}
                    </span>
                  )}
                </div>

                {evaluationLoading && (
                  <div className="evaluation-loading"><Activity size={19} /><span><strong>Analisi in corso</strong><small>Calcolo dei punteggi e delle condizioni decisionali…</small></span></div>
                )}

                {evaluation && !evaluationLoading && (
                  <>
                    <div className={`evaluation-summary evaluation-summary--${evaluation.trafficLight.toLowerCase()}`}>
                      <span className="evaluation-traffic-light"><i /><i /><i /></span>
                      <span><small>SEMAFORO FINALE</small><strong>{evaluation.trafficLight}</strong><p>{evaluationSummaryText(evaluation)}</p></span>
                      <span className="evaluation-total"><strong>{evaluation.totalScore}</strong><small>/ 100</small></span>
                    </div>

                    <div className="evaluation-scores">
                      <EvaluationScore label="Bisogno cliente" value={evaluation.needScore} />
                      <EvaluationScore label="Coerenza DNA" value={evaluation.dnaScore} />
                      <EvaluationScore label="Ricavi" value={evaluation.revenueScore} />
                      <EvaluationScore label="Fattibilità" value={evaluation.feasibilityScore} />
                      <EvaluationScore label="Controllo rischi" value={evaluation.riskControlScore} />
                    </div>

                    <div className="evaluation-analysis-grid">
                      <EvaluationAnalysis title="Punti di forza" tone="green" icon={CheckCircle2} items={evaluation.strengths} />
                      <EvaluationAnalysis title="Criticità" tone="amber" icon={AlertTriangle} items={evaluation.criticalities} />
                      <EvaluationAnalysis title="Condizioni" tone="blue" icon={ClipboardCheck} items={evaluation.conditions} />
                    </div>

                    {evaluation.analysisSource !== "openai" && (
                      <p className="evaluation-ai-note"><Bot size={14} /> Il motore HUB ha preparato l’analisi iniziale. Il collegamento OpenAI la renderà contestuale senza cambiare il percorso decisionale.</p>
                    )}

                    {evaluation.decisionState !== "Da decidere" && (
                      <div className={classNames("evaluation-decision", `evaluation-decision--${evaluation.decisionState.toLowerCase().replace(/\s+/g, "-")}`)}>
                        <Gavel size={17} />
                        <span><strong>{evaluation.decisionState}</strong><small>{evaluation.decisionNote || "Decisione registrata dal CEO."}</small></span>
                      </div>
                    )}
                  </>
                )}

                {evaluationError && <div className="entry-error evaluation-error" role="alert"><AlertTriangle size={17} /><span>{evaluationError}</span></div>}
              </section>
            )}
            {["Progettazione", "Test"].includes(item.status) && (
              <section className="drawer-section planning-section">
                <div className="evaluation-section__head">
                  <span className="drawer-section__title">Cabina di progettazione</span>
                  {projectPlan && (
                    <span className={classNames("planning-state", projectPlan.planState === "Pronto per il test" && "planning-state--ready", projectPlan.planState === "In test" && "planning-state--test")}>
                      <ListChecks size={12} /> {projectPlan.planState}
                    </span>
                  )}
                </div>
                {projectPlanLoading && (
                  <div className="evaluation-loading"><Activity size={19} /><span><strong>Caricamento del piano</strong><small>Attività, KPI e condizioni obbligatorie…</small></span></div>
                )}
                {projectPlan && !projectPlanLoading && (
                  <ProjectPlanningSummary plan={projectPlan} gate={projectGate || projectPlanGate(projectPlan)} />
                )}
                {!projectPlan && !projectPlanLoading && !projectPlanError && (
                  <div className="planning-empty"><FolderKanban size={20} /><span><strong>Piano non disponibile</strong><small>Apri la progettazione per completare il piano operativo.</small></span></div>
                )}
                {projectPlanError && <div className="entry-error planning-error" role="alert"><AlertTriangle size={17} /><span>{projectPlanError}</span></div>}
              </section>
            )}
            <section className="drawer-section"><span className="drawer-section__title">Responsabilità</span><div className="owner-row"><span className="avatar avatar--soft">SD</span><span><strong>{item.owner}</strong><small>{item.owner === "Sotto controllo CEO" ? "Controllo temporaneo diretto del CEO" : "Assegnazione da completare"}</small></span><ChevronRight size={17} /></div></section>
            <section className="drawer-section"><span className="drawer-section__title">Percorso</span><div className="entry-lifecycle-mini">Idea <ArrowRight size={13} /> Valutazione <ArrowRight size={13} /> Approvato <ArrowRight size={13} /> Progettazione <ArrowRight size={13} /> Test <ArrowRight size={13} /> Operativo</div></section>
            {advanceError && <div className="entry-error drawer-error" role="alert"><AlertTriangle size={17} /><span>{advanceError}</span></div>}
          </div>
          <div className={classNames(
            "drawer__footer",
            item.status === "Valutazione" && "drawer__footer--evaluation",
            ["Approvato", "Progettazione"].includes(item.status) && "drawer__footer--planning",
          )}>
            <button className="secondary-button" onClick={onClose}>Chiudi</button>
            {item.status === "Da valutare" ? (
              <button
                className="primary-button"
                disabled={!item.persisted || advancing}
                onClick={advanceToEvaluation}
                aria-busy={advancing}
              >
                {advancing ? "Avvio valutazione..." : item.persisted ? "Valutazione: prossimo passo" : "Non disponibile nella demo"}
                {!advancing && item.persisted && <ArrowRight size={16} />}
              </button>
            ) : item.status === "Valutazione" ? (
              <>
                <button
                  className="evaluation-action evaluation-action--details"
                  disabled={!evaluation || Boolean(decisionLoading)}
                  onClick={() => decideEvaluation("request_details")}
                >
                  <MessageSquareText size={15} />
                  {decisionLoading === "request_details" ? "Registrazione…" : "Chiedi dettagli"}
                </button>
                <button
                  className="evaluation-action evaluation-action--suspend"
                  disabled={!evaluation || Boolean(decisionLoading)}
                  onClick={() => decideEvaluation("suspend")}
                >
                  <Clock3 size={15} />
                  {decisionLoading === "suspend" ? "Sospensione…" : "Sospendi"}
                </button>
                <button
                  className="approve-button"
                  disabled={!evaluation || Boolean(decisionLoading)}
                  onClick={() => decideEvaluation("approve")}
                >
                  <Check size={16} />
                  {decisionLoading === "approve" ? "Approvazione…" : "Approva"}
                </button>
              </>
            ) : item.status === "Approvato" ? (
              <button className="primary-button" onClick={() => openProjectPlan(1)}>
                <FolderKanban size={16} /> Avvia progettazione
              </button>
            ) : item.status === "Progettazione" ? (
              <>
                <button className="secondary-button" disabled={projectPlanLoading} onClick={() => openProjectPlan(1)}>
                  <Pencil size={15} /> Modifica piano
                </button>
                <button
                  className="primary-button"
                  disabled={!projectPlan || projectPlanLoading || testAdvancing}
                  onClick={projectGate?.ready ? advanceToTest : () => openProjectPlan(2)}
                  title={!projectGate?.ready ? "Completa attività e condizioni obbligatorie prima del Test." : undefined}
                >
                  {testAdvancing
                    ? "Avvio Test…"
                    : projectGate?.ready
                      ? "Passa al Test"
                      : `Completa ${projectGate?.remaining || 0} requisiti`}
                  {!testAdvancing && (projectGate?.ready ? <ArrowRight size={16} /> : <Pencil size={15} />)}
                </button>
              </>
            ) : item.status === "Test" ? (
              <button className="primary-button" disabled><TicketCheck size={16} /> Test avviato</button>
            ) : (
              <button className="primary-button" disabled>
                Stato: {item.status}
              </button>
            )}
          </div>
        </aside>
        {projectPlanOpen && (
          <ProjectPlanModal
            item={item}
            evaluation={evaluation}
            initialPlan={projectPlan}
            initialStep={projectPlanInitialStep}
            onClose={() => setProjectPlanOpen(false)}
            onSave={saveProjectPlan}
          />
        )}
      </div>
    );
  }

  return (
    <div className="drawer-layer"><button className="drawer-scrim" onClick={onClose} aria-label="Chiudi" /><aside className="drawer"><div className="drawer__head"><span className="ecosystem-logo ecosystem-logo--large" style={{ color: item.color, background: item.soft }}>{ecosystemIcon(item.icon, 27)}</span><div><span className="eyebrow">Ecosistema</span><h2>{item.name}</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div><div className="drawer__body"><div className="drawer-status"><span className={`status-badge status-badge--${statusClass(item.status)}`}><span />{item.status}</span><small>Aggiornato 2 minuti fa</small></div><div className="drawer-kpis"><div><small>Ricavi mese</small><strong>{item.revenue}</strong><em>{item.trend}</em></div><div><small>Margine</small><strong>{item.margin}</strong><em>Obiettivo 30%</em></div><div><small>Pratiche aperte</small><strong>{item.open}</strong><em>3 da seguire</em></div></div><section className="drawer-section"><span className="drawer-section__title">Responsabilità</span><div className="owner-row"><span className="avatar avatar--soft">{item.owner === "Sotto controllo CEO" ? "SD" : "R"}</span><span><strong>{item.owner}</strong><small>Perimetro operativo e KPI assegnati</small></span><ChevronRight size={17} /></div></section><section className="drawer-section"><span className="drawer-section__title">Stato operativo</span><ProgressRow label="Obiettivo ricavi" value="82%" width={82} color={item.color} /><ProgressRow label="SLA pratiche" value="94%" width={94} color="#0f9f6e" /><ProgressRow label="Completamento task" value="76%" width={76} color="#2563eb" /></section><section className="drawer-section"><span className="drawer-section__title">Ultimi segnali</span><div className="drawer-signals"><div><span className="status-dot status-dot--amber" /><span><strong>2 pratiche oltre soglia</strong><small>Richiedono verifica del responsabile</small></span></div><div><span className="status-dot status-dot--green" /><span><strong>Margine stabile</strong><small>In linea con il periodo precedente</small></span></div></div></section></div><div className="drawer__footer"><button className="secondary-button" onClick={() => onOpenDashboard(item)}>Dashboard ecosistema</button><button className="primary-button" onClick={() => onOpenOperational(item)}>Apri area operativa <ArrowUpRight size={16} /></button></div></aside></div>
  );
}

function evaluationSummaryText(evaluation: HubEvaluation) {
  if (evaluation.trafficLight === "Verde") return "Iniziativa promettente: può avanzare se le condizioni indicate vengono rispettate.";
  if (evaluation.trafficLight === "Giallo") return "Iniziativa interessante, ma richiede integrazioni prima dell’approvazione.";
  return "Rischi o informazioni mancanti impediscono per ora un’approvazione responsabile.";
}

function EvaluationScore({ label, value }: { label: string; value: number }) {
  return (
    <div className="evaluation-score">
      <span><small>{label}</small><strong>{value}/5</strong></span>
      <div>{[1, 2, 3, 4, 5].map((step) => <i key={step} className={step <= value ? "evaluation-score__filled" : undefined} />)}</div>
    </div>
  );
}

function EvaluationAnalysis({
  title,
  tone,
  icon: Icon,
  items,
}: {
  title: string;
  tone: "green" | "amber" | "blue";
  icon: LucideIcon;
  items: string[];
}) {
  return (
    <article className={`evaluation-analysis evaluation-analysis--${tone}`}>
      <div><span><Icon size={15} /></span><strong>{title}</strong></div>
      <ul>{items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</ul>
    </article>
  );
}

type ProjectPlanGate = {
  ready: boolean;
  completedTasks: number;
  totalTasks: number;
  metConditions: number;
  totalConditions: number;
  remaining: number;
  progress: number;
};

function projectPlanGate(plan: HubProjectPlan): ProjectPlanGate {
  const completedTasks = plan.tasks.filter((task) => task.status === "Completata").length;
  const metConditions = plan.conditions.filter((condition) => condition.met).length;
  const missingKpis = plan.kpis.length > 0 ? 0 : 1;
  const missingFoundation = plan.objective && plan.owner && plan.startDate && plan.targetDate ? 0 : 1;
  const remaining = (plan.tasks.length - completedTasks)
    + (plan.conditions.length - metConditions)
    + missingKpis
    + missingFoundation;
  const total = plan.tasks.length + plan.conditions.length + 2;
  const completed = completedTasks + metConditions + (missingKpis ? 0 : 1) + (missingFoundation ? 0 : 1);

  return {
    ready: remaining === 0 && plan.tasks.length > 0 && plan.conditions.length > 0,
    completedTasks,
    totalTasks: plan.tasks.length,
    metConditions,
    totalConditions: plan.conditions.length,
    remaining,
    progress: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function ProjectPlanningSummary({ plan, gate }: { plan: HubProjectPlan; gate: ProjectPlanGate }) {
  return (
    <div className="planning-summary">
      <div className="planning-progress-card">
        <span><small>PRONTEZZA PER IL TEST</small><strong>{gate.progress}%</strong></span>
        <div className="planning-progress-track"><i style={{ width: `${gate.progress}%` }} /></div>
        <em>{gate.ready ? "Tutti i requisiti sono soddisfatti" : `${gate.remaining} requisiti da completare`}</em>
      </div>

      <div className="planning-facts">
        <span><UserCog size={15} /><small>Responsabile</small><strong>{plan.owner}</strong></span>
        <span><CalendarDays size={15} /><small>Scadenza</small><strong>{formatProjectDate(plan.targetDate)}</strong></span>
        <span><WalletCards size={15} /><small>Budget</small><strong>{formatCurrency(plan.budget)}</strong></span>
      </div>

      <EntryDetail label="Obiettivo della progettazione" value={plan.objective} />

      <div className="planning-block">
        <div className="planning-block__head"><span><ListChecks size={15} /> Attività</span><small>{gate.completedTasks}/{gate.totalTasks} completate</small></div>
        <div className="planning-task-list">
          {plan.tasks.map((task) => (
            <div key={task.id} className="planning-task">
              <span className={classNames("planning-check", task.status === "Completata" && "planning-check--done", task.status === "Bloccata" && "planning-check--blocked")}>
                {task.status === "Completata" ? <Check size={13} /> : task.status === "Bloccata" ? <AlertTriangle size={12} /> : <Clock3 size={12} />}
              </span>
              <span><strong>{task.title}</strong><small>{task.owner} · {formatProjectDate(task.dueDate)}</small></span>
              <em>{task.status}</em>
            </div>
          ))}
        </div>
      </div>

      <div className="planning-block">
        <div className="planning-block__head"><span><Gauge size={15} /> KPI</span><small>{plan.kpis.length} indicatori</small></div>
        <div className="planning-kpi-grid">
          {plan.kpis.map((kpi) => <span key={kpi.id}><small>{kpi.name}</small><strong>{kpi.target}</strong></span>)}
        </div>
      </div>

      <div className="planning-block">
        <div className="planning-block__head"><span><ShieldCheck size={15} /> Condizioni obbligatorie</span><small>{gate.metConditions}/{gate.totalConditions} soddisfatte</small></div>
        <div className="planning-condition-list">
          {plan.conditions.map((condition) => (
            <span key={condition.id} className={condition.met ? "planning-condition--met" : undefined}>
              {condition.met ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}
              <strong>{condition.text}</strong>
            </span>
          ))}
        </div>
      </div>

      <div className={classNames("planning-gate", gate.ready && "planning-gate--ready")}>
        {gate.ready ? <CheckCircle2 size={18} /> : <LockKeyhole size={18} />}
        <span><strong>{gate.ready ? "Accesso al Test sbloccato" : "Accesso al Test protetto"}</strong><small>{gate.ready ? "Il CEO può autorizzare il passaggio alla fase Test." : "Completa tutte le attività e le condizioni prima di avanzare."}</small></span>
      </div>
    </div>
  );
}

function ProjectPlanModal({
  item,
  evaluation,
  initialPlan,
  initialStep,
  onClose,
  onSave,
}: {
  item: Ecosystem;
  evaluation: HubEvaluation | null;
  initialPlan: HubProjectPlan | null;
  initialStep: 1 | 2;
  onClose: () => void;
  onSave: (input: HubProjectPlanInput) => Promise<void>;
}) {
  const defaults = useMemo(
    () => initialPlan || createDefaultProjectPlan(item, evaluation),
    [item.id, initialPlan, evaluation],
  );
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [objective, setObjective] = useState(defaults.objective);
  const [owner, setOwner] = useState(defaults.owner);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [targetDate, setTargetDate] = useState(defaults.targetDate);
  const [budget, setBudget] = useState(String(defaults.budget));
  const [tasks, setTasks] = useState<HubPlanningTask[]>(() => defaults.tasks.map((task) => ({ ...task })));
  const [kpis, setKpis] = useState<HubPlanningKpi[]>(() => defaults.kpis.map((kpi) => ({ ...kpi })));
  const [conditions, setConditions] = useState<HubPlanningCondition[]>(() => defaults.conditions.map((condition) => ({ ...condition })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstStepValid = Boolean(
    objective.trim()
    && owner.trim()
    && startDate
    && targetDate
    && targetDate >= startDate
    && Number.isFinite(Number(budget))
    && Number(budget) >= 0,
  );
  const allowedStatuses: HubPlanningTaskStatus[] = ["Da fare", "In corso", "Completata", "Bloccata"];
  const secondStepValid = tasks.length > 0
    && tasks.every((task) => task.title.trim() && task.owner.trim() && task.dueDate && allowedStatuses.includes(task.status))
    && kpis.length > 0
    && kpis.every((kpi) => kpi.name.trim() && kpi.target.trim())
    && conditions.length > 0
    && conditions.every((condition) => condition.text.trim());

  const updateTask = (id: string, patch: Partial<HubPlanningTask>) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, ...patch } : task));
  };
  const updateKpi = (id: string, patch: Partial<HubPlanningKpi>) => {
    setKpis((current) => current.map((kpi) => kpi.id === id ? { ...kpi, ...patch } : kpi));
  };
  const updateCondition = (id: string, patch: Partial<HubPlanningCondition>) => {
    setConditions((current) => current.map((condition) => condition.id === id ? { ...condition, ...patch } : condition));
  };

  const submit = async () => {
    if (!firstStepValid || !secondStepValid) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        objective: objective.trim(),
        owner: owner.trim(),
        startDate,
        targetDate,
        budget: Number(budget),
        tasks: tasks.map((task) => ({ ...task, title: task.title.trim(), owner: task.owner.trim() })),
        kpis: kpis.map((kpi) => ({ ...kpi, name: kpi.name.trim(), target: kpi.target.trim() })),
        conditions: conditions.map((condition) => ({ ...condition, text: condition.text.trim() })),
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Non è stato possibile salvare la progettazione.");
      setSaving(false);
    }
  };

  return (
    <div className="modal-layer planning-modal-layer" role="dialog" aria-modal="true" aria-label="Piano di progettazione">
      <button className="modal-scrim" onClick={onClose} disabled={saving} aria-label="Chiudi" />
      <div className="modal planning-modal">
        <div className="modal__head">
          <div><span className="eyebrow">Solo CEO · {item.name}</span><h2>{initialPlan ? "Modifica progettazione" : "Avvia progettazione"}</h2><p>Il Test resterà bloccato finché tutti i requisiti non saranno soddisfatti.</p></div>
          <button className="icon-button" onClick={onClose} disabled={saving} aria-label="Chiudi"><X size={20} /></button>
        </div>

        <div className="entry-progress planning-progress" aria-label={`Passaggio ${step} di 2`}>
          <span className={classNames(step >= 1 && "entry-progress__active")}><i>1</i><strong>Impostazione</strong></span>
          <span className={classNames(step >= 2 && "entry-progress__active")}><i>2</i><strong>Piano operativo</strong></span>
        </div>

        <div className="planning-modal__body">
          {step === 1 ? (
            <div className="entry-form planning-foundation-form">
              <label>Obiettivo della progettazione<textarea autoFocus value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Quale risultato deve essere pronto prima del Test?" /></label>
              <div className="entry-form__row planning-form-grid">
                <label>Responsabile operativo<input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Nome o funzione responsabile" /></label>
                <label>Budget autorizzato (€)<input type="number" min="0" step="0.01" inputMode="decimal" value={budget} onChange={(event) => setBudget(event.target.value)} /></label>
              </div>
              <div className="entry-form__row planning-form-grid">
                <label>Data di avvio<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
                <label>Scadenza progettazione<input type="date" min={startDate} value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /></label>
              </div>
              <div className="dna-check planning-rule"><LockKeyhole size={19} /><div><strong>Gate obbligatorio prima del Test</strong><p>Il piano richiederà attività completate, KPI definiti e tutte le condizioni verificate.</p></div></div>
            </div>
          ) : (
            <div className="planning-editor">
              <section className="planning-editor-section">
                <div className="planning-editor-section__head"><span><ListChecks size={17} /><span><strong>Attività</strong><small>Cosa va completato, da chi ed entro quando.</small></span></span><button type="button" className="text-button" onClick={() => setTasks((current) => [...current, { id: createPlanId("task"), title: "", owner, dueDate: targetDate, status: "Da fare" }])}><Plus size={14} /> Aggiungi</button></div>
                <div className="planning-editor-list">
                  {tasks.map((task, index) => (
                    <div className="planning-task-editor" key={task.id}>
                      <span className="planning-row-number">{index + 1}</span>
                      <input aria-label={`Attività ${index + 1}`} value={task.title} onChange={(event) => updateTask(task.id, { title: event.target.value })} placeholder="Descrivi l’attività" />
                      <input aria-label={`Responsabile attività ${index + 1}`} value={task.owner} onChange={(event) => updateTask(task.id, { owner: event.target.value })} placeholder="Responsabile" />
                      <input aria-label={`Scadenza attività ${index + 1}`} type="date" min={startDate} max={targetDate} value={task.dueDate} onChange={(event) => updateTask(task.id, { dueDate: event.target.value })} />
                      <select aria-label={`Stato attività ${index + 1}`} value={task.status} onChange={(event) => updateTask(task.id, { status: event.target.value as HubPlanningTaskStatus })}>{allowedStatuses.map((status) => <option value={status} key={status}>{status}</option>)}</select>
                      <button type="button" className="icon-button planning-delete" disabled={tasks.length === 1} onClick={() => setTasks((current) => current.filter((row) => row.id !== task.id))} aria-label={`Elimina attività ${index + 1}`}><Trash2 size={15} /></button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="planning-editor-section">
                <div className="planning-editor-section__head"><span><Gauge size={17} /><span><strong>KPI</strong><small>Come misuriamo se la progettazione ha funzionato.</small></span></span><button type="button" className="text-button" onClick={() => setKpis((current) => [...current, { id: createPlanId("kpi"), name: "", target: "" }])}><Plus size={14} /> Aggiungi</button></div>
                <div className="planning-kpi-editor-list">
                  {kpis.map((kpi, index) => (
                    <div className="planning-kpi-editor" key={kpi.id}>
                      <input aria-label={`KPI ${index + 1}`} value={kpi.name} onChange={(event) => updateKpi(kpi.id, { name: event.target.value })} placeholder="Nome KPI" />
                      <input aria-label={`Target KPI ${index + 1}`} value={kpi.target} onChange={(event) => updateKpi(kpi.id, { target: event.target.value })} placeholder="Target / soglia" />
                      <button type="button" className="icon-button planning-delete" disabled={kpis.length === 1} onClick={() => setKpis((current) => current.filter((row) => row.id !== kpi.id))} aria-label={`Elimina KPI ${index + 1}`}><Trash2 size={15} /></button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="planning-editor-section">
                <div className="planning-editor-section__head"><span><ShieldCheck size={17} /><span><strong>Condizioni obbligatorie</strong><small>Derivano dalla valutazione approvata e devono essere verificate.</small></span></span><button type="button" className="text-button" onClick={() => setConditions((current) => [...current, { id: createPlanId("condition"), text: "", met: false }])}><Plus size={14} /> Aggiungi</button></div>
                <div className="planning-condition-editor-list">
                  {conditions.map((condition, index) => (
                    <div className={classNames("planning-condition-editor", condition.met && "planning-condition-editor--met")} key={condition.id}>
                      <button type="button" className="planning-condition-toggle" onClick={() => updateCondition(condition.id, { met: !condition.met })} aria-label={condition.met ? `Segna non soddisfatta la condizione ${index + 1}` : `Segna soddisfatta la condizione ${index + 1}`} aria-pressed={condition.met}>{condition.met ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}</button>
                      <input aria-label={`Condizione ${index + 1}`} value={condition.text} onChange={(event) => updateCondition(condition.id, { text: event.target.value })} placeholder="Condizione obbligatoria" />
                      <button type="button" className="icon-button planning-delete" disabled={conditions.length === 1} onClick={() => setConditions((current) => current.filter((row) => row.id !== condition.id))} aria-label={`Elimina condizione ${index + 1}`}><Trash2 size={15} /></button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>

        {error && <div className="entry-error planning-modal-error" role="alert"><AlertTriangle size={17} /><span>{error}</span></div>}

        <div className="modal__actions">
          {step === 1 ? (
            <><button className="secondary-button" onClick={onClose}>Annulla</button><button className="primary-button" disabled={!firstStepValid} onClick={() => setStep(2)}>Continua <ArrowRight size={16} /></button></>
          ) : (
            <><button className="secondary-button" disabled={saving} onClick={() => { setStep(1); setError(null); }}>Indietro</button><button className="primary-button" disabled={!secondStepValid || saving} onClick={submit}>{saving ? "Salvataggio…" : initialPlan ? "Salva aggiornamenti" : "Avvia progettazione"}{!saving && <Save size={16} />}</button></>
          )}
        </div>
      </div>
    </div>
  );
}

function createDefaultProjectPlan(item: Ecosystem, evaluation: HubEvaluation | null): HubProjectPlanInput {
  const startDate = localDateString(new Date());
  const horizon = Math.max(7, item.timeHorizonDays || 30);
  const targetDate = addDaysToDate(startDate, horizon);
  const firstMilestone = addDaysToDate(startDate, Math.max(2, Math.round(horizon / 3)));
  const secondMilestone = addDaysToDate(startDate, Math.max(4, Math.round((horizon * 2) / 3)));
  const owner = item.owner || "Sotto controllo CEO";
  const conditionTexts = evaluation?.conditions?.length
    ? evaluation.conditions
    : [
      "Nominare il responsabile operativo e formalizzare ruoli e accessi.",
      "Definire KPI, soglie di successo e data di verifica.",
      "Preparare un collaudo con casi reali e procedura di ritorno sicuro.",
    ];

  return {
    objective: item.objective || `Tradurre ${item.name} in un piano verificabile e pronto per il Test.`,
    owner,
    startDate,
    targetDate,
    budget: item.expectedCosts || 0,
    tasks: [
      { id: createPlanId("task"), title: "Definire architettura e flusso operativo", owner, dueDate: firstMilestone, status: "Da fare" },
      { id: createPlanId("task"), title: "Assegnare ruoli, accessi e responsabilità", owner, dueDate: secondMilestone, status: "Da fare" },
      { id: createPlanId("task"), title: "Preparare collaudo, controlli e gestione errori", owner, dueDate: targetDate, status: "Da fare" },
    ],
    kpis: [
      { id: createPlanId("kpi"), name: "Requisiti completati", target: "100% prima del Test" },
      { id: createPlanId("kpi"), name: "Errori bloccanti", target: "0 nel collaudo" },
      { id: createPlanId("kpi"), name: "Rispetto scadenza", target: `Entro ${horizon} giorni` },
    ],
    conditions: conditionTexts.map((text) => ({ id: createPlanId("condition"), text, met: false })),
  };
}

function createPlanId(prefix: string) {
  const random = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysToDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDateString(date);
}

function formatProjectDate(value: string) {
  if (!value) return "Da definire";
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function ClientDrawer({ client, onClose }: { client: Client; onClose: () => void }) {
  return (
    <div className="drawer-layer"><button className="drawer-scrim" onClick={onClose} aria-label="Chiudi" /><aside className="drawer client-drawer"><div className="drawer__head"><span className="table-avatar table-avatar--large">{initials(client.name)}</span><div><span className="eyebrow">{client.id}</span><h2>{client.name}</h2><p>{client.kind}</p></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div><div className="drawer__body"><div className="client-contact"><span><AtSign size={16} />{client.contact}</span><span><Building2 size={16} />Roma, Italia</span></div><section className="drawer-section"><span className="drawer-section__title">Servizi Eccomi</span><div className="client-services">{client.services.map((service) => <div key={service}><span className="status-dot status-dot--green" /><span><strong>Eccomi {service}</strong><small>Servizio attivo · nessun problema</small></span><ChevronRight size={17} /></div>)}</div></section><section className="drawer-section"><span className="drawer-section__title">Timeline unica</span><div className="timeline"><div><i className="status-dot status-dot--green" /><span><strong>Pagamento registrato</strong><small>EccomiOnline · oggi, 09:42</small></span></div><div><i className="status-dot status-dot--blue" /><span><strong>Pratica aggiornata</strong><small>Eccomi {client.services[0]} · ieri, 16:20</small></span></div><div><i className="status-dot status-dot--purple" /><span><strong>Documento acquisito</strong><small>Eccomi Area · 17 luglio</small></span></div></div></section><section className="drawer-section"><span className="drawer-section__title">Suggerimento AI</span><div className="ai-recommendation"><span><Sparkles size={18} /></span><div><small>PROSSIMO SERVIZIO UTILE</small><p>Valutare Eccomi PEC in base ai servizi attivi e al profilo documentale.</p></div></div></section></div><div className="drawer__footer"><button className="secondary-button">Crea task</button><button className="primary-button">Apri scheda completa <ArrowRight size={16} /></button></div></aside></div>
  );
}

function PriorityItem({ number, urgency, title, detail, action }: { number: string; urgency: string; title: string; detail: string; action: () => void }) { return <button className="priority-item" onClick={action}><span className="priority-number">{number}</span><span className="priority-copy"><em>{urgency}</em><strong>{title}</strong><small>{detail}</small></span><ChevronRight size={18} /></button>; }
function ActivityRow({ color, title, detail, time }: { color: string; title: string; detail: string; time: string }) { return <div className="activity-row"><span className={`status-dot status-dot--${color}`} /><span><strong>{title}</strong><small>{detail}</small></span><time>{time}</time></div>; }
function ProgressRow({ label, value, width, color }: { label: string; value: string; width: number; color: string }) { return <div className="progress-row"><div><span>{label}</span><strong>{value}</strong></div><div className="progress-track"><span style={{ width: `${width}%`, background: color }} /></div></div>; }
function StatTile({ icon: Icon, label, value, note, color }: { icon: LucideIcon; label: string; value: string; note: string; color: string }) { return <article className="stat-tile"><span className={`stat-tile__icon stat-tile__icon--${color}`}><Icon size={20} /></span><span><small>{label}</small><strong>{value}</strong><em>{note}</em></span></article>; }
function RuleItem({ title, detail }: { title: string; detail: string }) { return <div className="rule-item"><span><Check size={15} /></span><div><strong>{title}</strong><p>{detail}</p></div></div>; }
function SettingsCard({ icon: Icon, title, description, value }: { icon: LucideIcon; title: string; description: string; value: string }) { return <button className="settings-card"><span className="settings-card__icon"><Icon size={21} /></span><span><strong>{title}</strong><p>{description}</p><small>{value}</small></span><ChevronRight size={18} /></button>; }
function IntegrationRow({ name, detail, state, updated, icon: Icon }: { name: string; detail: string; state: string; updated: string; icon: LucideIcon }) { const stateClass = state === "Connesso" || state === "Disponibile" ? "green" : state === "Test" || state === "Da configurare" ? "amber" : "neutral"; return <div className="integration-row"><span className="integration-icon"><Icon size={19} /></span><span><strong>{name}</strong><small>{detail}</small></span><em className={`status-badge status-badge--${stateClass}`}><span />{state}</em><small>Stato: {updated}</small><button className="icon-button"><ChevronRight size={17} /></button></div>; }
function EntryDetail({ label, value }: { label: string; value?: string }) { return <div className="entry-detail"><small>{label}</small><p>{value || "Da completare"}</p></div>; }

function formatToday() {
  return new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "2-digit", month: "short" }).format(new Date());
}

function formatPostaStatus(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function postaStatusColor(status: string) {
  const normalized = status.toUpperCase();
  if (normalized.includes("ERRORE")) return "red";
  if (["COMPLETATO", "RICEVUTA_SALVATA", "INVIATO_POSTE"].includes(normalized)) return "green";
  if (normalized.includes("MANUALE") || normalized.includes("ATTESA")) return "amber";
  if (normalized.includes("CORSO") || normalized.includes("RICEVUTO")) return "blue";
  return "purple";
}

function formatRelativeDate(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "—";

  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "ora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} g`;

  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short" }).format(new Date(timestamp));
}

function statusClass(status: Ecosystem["status"]) {
  if (status === "Operativo") return "green";
  if (status === "Attenzione" || status === "Sospeso") return "amber";
  if (status === "Da valutare" || status === "Valutazione" || status === "Approvato") return "blue";
  if (status === "Progettazione" || status === "Test") return "purple";
  return "neutral";
}

function entryTypeLabel(type: HubEntryKind) {
  if (type === "ecosistema") return "Nuovo ecosistema";
  if (type === "servizio") return "Nuovo servizio";
  if (type === "progetto") return "Nuovo progetto";
  return "Idea da valutare";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
}

function formatEntryDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}
