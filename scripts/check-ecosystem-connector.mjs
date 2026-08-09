import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const registry = read("src/ecosystems/registry.ts");
const adapter = read("src/ecosystems/dashboardAdapter.ts");
const dashboardExtension = read("src/connector-dashboard-extension.ts");
const main = read("src/main.tsx");

const required = ["noleggio", "posta", "energia", "spedizioni", "pec", "performance", "future"];
for (const key of required) {
  if (!registry.includes(`key: \"${key}\"`)) {
    throw new Error(`Missing ecosystem connector: ${key}`);
  }
}

for (const key of ["noleggio", "posta"]) {
  const start = registry.indexOf(`key: \"${key}\"`);
  const next = registry.indexOf("key: \"", start + 6);
  const block = registry.slice(start, next === -1 ? undefined : next);
  if (!block.includes("summaryEndpoint")) {
    throw new Error(`Operational connector ${key} has no summary endpoint`);
  }
}

if (!adapter.includes("registryDashboardSeeds") || !adapter.includes("connectedEcosystemCount")) {
  throw new Error("Dashboard connector adapter is incomplete");
}

if (!dashboardExtension.includes("ecosystemRegistry") || !dashboardExtension.includes("Nessun KPI viene simulato")) {
  throw new Error("CEO dashboard connector surface is incomplete");
}

if (!main.includes('import "./connector-dashboard-extension"')) {
  throw new Error("CEO dashboard connector surface is not mounted");
}

console.log("Ecosystem Connector checks passed");
