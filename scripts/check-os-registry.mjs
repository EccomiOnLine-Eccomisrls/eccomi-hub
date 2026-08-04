import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/os/ECCOMI-OS-CONSTITUTION.md",
  "docs/architecture/HUB-OS-VERTICALS.md",
  "src/os/registry/types.ts",
  "src/os/registry/apps.ts",
  "src/os/registry/index.ts",
  "src/os/lab/OsLab.tsx",
  "src/os/lab/os-lab.css",
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    throw new Error(`ECCOMI OS: file mancante ${file}`);
  }
}

const registry = fs.readFileSync(
  path.join(root, "src/os/registry/apps.ts"),
  "utf8",
);

const requiredApps = [
  "hub",
  "posta",
  "noleggio",
  "energia",
  "spedizioni",
  "performance",
  "guide",
  "book",
  "fiscal",
];

for (const app of requiredApps) {
  if (!registry.includes(`id: "${app}"`)) {
    throw new Error(`ECCOMI OS: app non registrata ${app}`);
  }
}

console.log("✅ ECCOMI OS Constitution presente");
console.log("✅ Architettura HUB ↔ OS ↔ verticali presente");
console.log(`✅ ${requiredApps.length} app registrate`);
console.log("✅ ECCOMI OS Lab presente");
