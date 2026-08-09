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
    key: "spedizioni",
    name: "ECCOMI Spedizioni",
    description: "Spedizioni, ritiri, lettere di vettura e tracking.",
    lifecycle: "connecting",
    health: "unknown",
    access: { supportsSso: false },
    kpis: [
      unavailableKpi("shipments", "Spedizioni"),
      unavailableKpi("exceptions", "Anomalie"),
    ],
    priorities: [],
    capabilities: [],
  },
  {
    key: "pec",
    name: "ECCOMI PEC",
    description: "Servizio PEC da collegare alla cabina di regia.",
    lifecycle: "planned",
    health: "unknown",
    access: { supportsSso: false },
    kpis: [],
    priorities: [],
    capabilities: [],
  },
  {
    key: "performance",
    name: "ECCOMI Performance",
    description: "Piattaforma gestionale multi-azienda collegata a ECCOMI HUB.",
    lifecycle: "connecting",
    health: "unknown",
    access: { supportsSso: false },
    summaryEndpoint: "/v1/ecosystems/performance/summary",
    kpis: [],
    priorities: [],
    capabilities: ["summary"],
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
