import type { LucideIcon } from "lucide-react";

export type OsAppStatus =
  | "LIVE"
  | "COLLEGATO"
  | "SVILUPPO"
  | "PIANIFICATO"
  | "SOSPESO";

export type OsRole =
  | "ceo"
  | "manager"
  | "operator"
  | "collaborator"
  | "customer";

export type OsAppId =
  | "hub"
  | "posta"
  | "noleggio"
  | "energia"
  | "spedizioni"
  | "guide"
  | "book"
  | "fiscal"
  | "performance";

export type OsAppManifest = {
  id: OsAppId;
  name: string;
  shortName: string;
  description: string;
  version: string;
  status: OsAppStatus;
  icon: LucideIcon;
  accent: string;
  owner: string;
  route: string;
  operationalUrl?: string;
  enabled: boolean;
  roles: OsRole[];
  capabilities: string[];
};
