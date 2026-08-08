import type { EcosystemConnectorDefinition } from "./connector";
import { unavailableKpi } from "./connector";

export const ecosystemRegistry: EcosystemConnectorDefinition[] = [
  {
    key: "noleggio",
    name: "ECCOMI Noleggio",
    description: "Noleggio a lungo termine, offerte, lead e pratiche.",
    lifecycle: "operational",
    health: "healthy",
    access: {
      operationalUrl: "https://noleggio.eccomionline.com",
      ssoEndpoint: "/v1/sso/noleggio",
      supportsSso: true,
    },
    summaryEndpoint: "/v1/ecosystems/noleggio/summary",
    kpis: [],
    priorities: [],
    capabilities: ["summary", "responsible", "delegations", "sso"],
  },
  {
    key: "posta",
    name: "ECCOMI Posta",
    description: "Servizi postali, pratiche e stato operativo.",
    lifecycle: "operational",
    health: "healthy",
    access: { supportsSso: false },
    summaryEndpoint: "/v1/ecosystems/posta/summary",
    kpis: [],
    priorities: [],
    capabilities: ["summary"],
  },
  {
    key: "energia",
    name: "ECCOMI Energia",
    description: "Energia, comparazione offerte e gestione opportunità.",
    lifecycle: "planned",
    health: "unknown",
    access: { supportsSso: false },
    kpis: [
      unavailableKpi("opportunities", "Opportunità"),
      unavailableKpi("practices", "Pratiche"),
    ],
    priorities: [],
    capabilities: [],
  },
  {
    key: "performance",
    name: "ECCOMI Performance",
    description: "Verticale Performance da collegare a ECCOMI HUB.",
    lifecycle: "planned",
    health: "unknown",
    access: { supportsSso: false },
    kpis: [],
    priorities: [],
    capabilities: [],
  },
  {
    key: "future",
    name: "ECCOMI Future",
    description: "Verticale Future da collegare a ECCOMI HUB.",
    lifecycle: "planned",
    health: "unknown",
    access: { supportsSso: false },
    kpis: [],
    priorities: [],
    capabilities: [],
  },
];

export function getEcosystemConnector(key: string): EcosystemConnectorDefinition | undefined {
  return ecosystemRegistry.find((ecosystem) => ecosystem.key === key);
}
