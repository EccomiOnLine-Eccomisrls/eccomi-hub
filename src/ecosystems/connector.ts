export type EcosystemLifecycle = "planned" | "connecting" | "operational" | "degraded" | "paused";
export type EcosystemHealth = "healthy" | "warning" | "critical" | "unknown";

export type EcosystemKpi = {
  key: string;
  label: string;
  value: string | number | null;
  unit?: string;
  trend?: string | null;
  source: "live" | "manual" | "unavailable";
  updatedAt?: string | null;
};

export type EcosystemPriority = {
  id: string;
  level: "info" | "attention" | "urgent";
  title: string;
  detail?: string;
  actionLabel?: string;
  actionHref?: string;
};

export type EcosystemResponsible = {
  userId?: string;
  name: string;
  roleLabel: string;
  active: boolean;
};

export type EcosystemAccess = {
  operationalUrl?: string;
  ssoEndpoint?: string;
  supportsSso: boolean;
};

export type EcosystemConnectorDefinition = {
  key: string;
  name: string;
  description: string;
  lifecycle: EcosystemLifecycle;
  health: EcosystemHealth;
  responsible?: EcosystemResponsible;
  access: EcosystemAccess;
  summaryEndpoint?: string;
  kpis: EcosystemKpi[];
  priorities: EcosystemPriority[];
  capabilities: string[];
  lastSyncAt?: string | null;
};

export function unavailableKpi(key: string, label: string, unit?: string): EcosystemKpi {
  return { key, label, value: null, unit, source: "unavailable", trend: null, updatedAt: null };
}
