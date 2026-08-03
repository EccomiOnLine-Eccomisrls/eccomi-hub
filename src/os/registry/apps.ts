import {
  BookOpen,
  Boxes,
  Calculator,
  CarFront,
  LayoutDashboard,
  Mail,
  Package,
  Zap,
} from "lucide-react";
import type {
  OsAppId,
  OsAppManifest,
  OsAppStatus,
} from "./types";

export const osApps: OsAppManifest[] = [
  {
    id: "hub",
    name: "ECCOMI HUB",
    shortName: "Hub",
    description: "Cabina di regia e workspace esecutivo.",
    version: "1.0.0",
    status: "LIVE",
    icon: LayoutDashboard,
    accent: "primary",
    owner: "ECCOMI",
    route: "dashboard",
    enabled: true,
    roles: ["ceo", "manager", "operator"],
    capabilities: [
      "executive-home",
      "decision-center",
      "global-search",
      "ai-executive",
    ],
  },
  {
    id: "posta",
    name: "ECCOMI POSTA",
    shortName: "Posta",
    description: "Gestione delle pratiche e degli invii postali.",
    version: "1.0.0",
    status: "LIVE",
    icon: Mail,
    accent: "info",
    owner: "ECCOMI",
    route: "posta",
    operationalUrl:
      "https://eccomi-posta-backend.onrender.com/dashboard/pratiche",
    enabled: true,
    roles: ["ceo", "manager", "operator"],
    capabilities: ["pratiche", "invii", "tracking", "ricevute"],
  },
  {
    id: "noleggio",
    name: "ECCOMI NOLEGGIO",
    shortName: "Noleggio",
    description: "Offerte, lead e pratiche di noleggio a lungo termine.",
    version: "1.0.0",
    status: "LIVE",
    icon: CarFront,
    accent: "success",
    owner: "ECCOMI",
    route: "noleggio",
    enabled: true,
    roles: ["ceo", "manager", "operator"],
    capabilities: ["offerte", "lead", "partner", "approvazioni"],
  },
  {
    id: "energia",
    name: "ECCOMI ENERGIA",
    shortName: "Energia",
    description: "Analisi, comparazione e gestione delle forniture.",
    version: "0.1.0",
    status: "SVILUPPO",
    icon: Zap,
    accent: "warning",
    owner: "ECCOMI",
    route: "energia",
    enabled: false,
    roles: ["ceo", "manager", "operator"],
    capabilities: ["pod-pdr", "comparazione", "contratti"],
  },
  {
    id: "spedizioni",
    name: "ECCOMI SPEDIZIONI",
    shortName: "Spedizioni",
    description: "Gestione di buste, pacchi e logistica.",
    version: "0.1.0",
    status: "PIANIFICATO",
    icon: Package,
    accent: "primary",
    owner: "ECCOMI",
    route: "spedizioni",
    enabled: false,
    roles: ["ceo", "manager", "operator"],
    capabilities: ["ordini", "ldv", "tracking"],
  },
  {
    id: "guide",
    name: "ECCOMI GUIDE",
    shortName: "Guide",
    description: "Produzione e vendita delle guide ECCOMI.",
    version: "0.1.0",
    status: "PIANIFICATO",
    icon: BookOpen,
    accent: "ai",
    owner: "ECCOMI",
    route: "guide",
    enabled: false,
    roles: ["ceo", "manager"],
    capabilities: ["editor", "pdf", "catalogo"],
  },
  {
    id: "book",
    name: "ECCOMI BOOK",
    shortName: "Book",
    description: "Produzione editoriale e contenuti assistiti dall’AI.",
    version: "0.1.0",
    status: "PIANIFICATO",
    icon: Boxes,
    accent: "neutral",
    owner: "ECCOMI",
    route: "book",
    enabled: false,
    roles: ["ceo", "manager"],
    capabilities: ["editoria", "ai-content"],
  },
  {
    id: "fiscal",
    name: "ECCOMI FISCAL",
    shortName: "Fiscal",
    description: "Workspace amministrativo e fiscale.",
    version: "0.1.0",
    status: "PIANIFICATO",
    icon: Calculator,
    accent: "neutral",
    owner: "ECCOMI",
    route: "fiscal",
    enabled: false,
    roles: ["ceo", "manager"],
    capabilities: ["amministrazione", "scadenze", "documenti"],
  },
];

export function getOsApp(id: OsAppId) {
  return osApps.find((app) => app.id === id);
}

export function getEnabledOsApps() {
  return osApps.filter((app) => app.enabled);
}

export function getOsAppsByStatus(status: OsAppStatus) {
  return osApps.filter((app) => app.status === status);
}

export function getLiveOsApps() {
  return osApps.filter(
    (app) =>
      app.enabled &&
      (app.status === "LIVE" || app.status === "COLLEGATO"),
  );
}
