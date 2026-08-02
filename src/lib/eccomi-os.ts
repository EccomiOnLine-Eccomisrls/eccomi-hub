export type EcosystemStatus =
  | "LIVE"
  | "COLLEGATO"
  | "ROADMAP"
  | "SPRINT"
  | "OFFLINE";

export interface Ecosystem {
  id: string;
  name: string;
  status: EcosystemStatus;
  description: string;
}

export const ECOSYSTEMS: Ecosystem[] = [
  {
    id: "os",
    name: "ECCOMI OS",
    status: "LIVE",
    description: "Sistema operativo centrale"
  },
  {
    id: "posta",
    name: "Eccomi Posta",
    status: "COLLEGATO",
    description: "Dati operativi reali"
  },
  {
    id: "noleggio",
    name: "Eccomi Noleggio",
    status: "COLLEGATO",
    description: "Lead e promozioni"
  },
  {
    id: "energia",
    name: "Eccomi Energia",
    status: "ROADMAP",
    description: "Integrazione prevista"
  },
  {
    id: "guide",
    name: "Eccomi Guide",
    status: "SPRINT",
    description: "Sprint successivo"
  },
  {
    id: "spedizioni",
    name: "Eccomi Spedizioni",
    status: "ROADMAP",
    description: "Collegamento futuro"
  }
];

export function getLiveApps() {
  return ECOSYSTEMS.filter(e =>
    e.status === "LIVE" || e.status === "COLLEGATO"
  );
}

export function getRoadmapApps() {
  return ECOSYSTEMS.filter(e =>
    e.status !== "LIVE" && e.status !== "COLLEGATO"
  );
}
