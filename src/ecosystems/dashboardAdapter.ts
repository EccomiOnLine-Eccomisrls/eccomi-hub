import type { EcosystemConnectorDefinition } from "./connector";
import { ecosystemRegistry } from "./registry";

export type DashboardConnectorState = "idle" | "loading" | "ready" | "error";

export type DashboardEcosystemSeed = {
  id: string;
  name: string;
  short: string;
  status: "Operativo" | "Progettazione" | "Attenzione";
  owner: string;
  revenue: string;
  margin: string;
  open: number;
  trend: string;
  primaryMetricLabel?: string;
  secondaryMetricLabel?: string;
  dataMode: "real" | "loading" | "error";
};

function shortName(name: string): string {
  return name
    .replace(/^ECCOMI\s+/i, "")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ownerLabel(definition: EcosystemConnectorDefinition): string {
  return definition.responsible?.name || `Responsabile ${definition.name.replace(/^ECCOMI\s+/i, "")}`;
}

export function connectorToDashboardSeed(definition: EcosystemConnectorDefinition): DashboardEcosystemSeed {
  const connected = definition.lifecycle === "operational" || definition.lifecycle === "degraded";
  const attention = definition.health === "warning" || definition.health === "critical" || definition.lifecycle === "degraded";

  return {
    id: definition.key,
    name: definition.name.replace(/^ECCOMI\s+/i, "Eccomi "),
    short: shortName(definition.name),
    status: attention ? "Attenzione" : connected ? "Operativo" : "Progettazione",
    owner: ownerLabel(definition),
    revenue: "—",
    margin: "—",
    open: 0,
    trend: connected ? "Collegamento dati" : "Da collegare",
    dataMode: connected ? "loading" : "error",
  };
}

export function registryDashboardSeeds(): DashboardEcosystemSeed[] {
  return ecosystemRegistry.map(connectorToDashboardSeed);
}

export function connectedEcosystemCount(states: Record<string, DashboardConnectorState>): number {
  return ecosystemRegistry.filter((definition) => {
    if (!definition.summaryEndpoint) return false;
    return states[definition.key] === "ready";
  }).length;
}
