import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File obbligatorio mancante: ${relativePath}`);
  }

  return fs.readFileSync(absolutePath, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const app = read("src/App.tsx");
const main = read("src/main.tsx");
const executiveCss = read("src/executive-home.css");

const requiredComponents = [
  "ExecutiveHomeOs2",
  "ExecutiveNavigator",
];

const requiredFiles = [
  "src/components/ExecutiveNavigator.tsx",
  "src/components/ExecutiveHomeOs2.tsx",
];

for (const file of requiredFiles) {
  assert(
    fs.existsSync(path.join(root, file)),
    `Componente Executive Home mancante: ${file}`,
  );
}

for (const component of requiredComponents) {
  assert(
    app.includes(`<${component}`),
    `Il componente ${component} non è montato in App.tsx`,
  );
}

assert(
  main.includes('import "./executive-home.css";'),
  "executive-home.css non è importato",
);

assert(
  main.includes('import "./eccomi-os-2.css";'),
  "eccomi-os-2.css non è importato",
);

assert(
  executiveCss.includes(".executive-navigator"),
  "Stili Executive Navigator mancanti",
);

const forbiddenPatterns = [
  {
    pattern: /€\s*21[.,]640/i,
    message: "È ricomparso il valore potenziale dimostrativo €21.640",
  },
  {
    pattern: /34 opportunità aperte/i,
    message: "È ricomparso il conteggio dimostrativo delle opportunità",
  },
  {
    pattern: /Pratica #PO-1827 conclusa/i,
    message: "È ricomparsa una pratica dimostrativa legacy",
  },
  {
    pattern: /Nuovo cliente EC-100284/i,
    message: "È ricomparso un cliente dimostrativo legacy",
  },
  {
    pattern: /Ticket #TK-439/i,
    message: "È ricomparso un ticket dimostrativo legacy",
  },
  {
    pattern: /Attività recenti/i,
    message: "È ricomparso il pannello legacy Attività recenti",
  },
  {
    pattern: /Valore potenziale/i,
    message: "È ricomparso il pannello legacy Valore potenziale",
  },
  {
    pattern: /dashboard-columns--lower/i,
    message: "È ricomparso il contenitore inferiore della dashboard legacy",
  },
  {
    pattern: /<CeoToday/i,
    message: "È ricomparso il componente legacy CeoToday",
  },
  {
    pattern: /<CeoControlCenter/i,
    message: "È ricomparso il componente legacy CeoControlCenter",
  },
];

for (const check of forbiddenPatterns) {
  assert(!check.pattern.test(app), check.message);
}

const mountedOrder = requiredComponents.map((component) =>
  app.indexOf(`<${component}`),
);

for (let index = 1; index < mountedOrder.length; index += 1) {
  assert(
    mountedOrder[index] > mountedOrder[index - 1],
    `Ordine Executive Home non valido tra ${requiredComponents[index - 1]} e ${requiredComponents[index]}`,
  );
}

const backupFiles = fs
  .readdirSync(path.join(root, "src"))
  .filter((file) => file.includes(".backup"));

if (backupFiles.length) {
  console.warn(
    `⚠ Backup locali presenti in src: ${backupFiles.join(", ")}`,
  );
  console.warn("  Non aggiungerli al commit.");
}

console.log("");
console.log("✅ Executive Home verificata");
console.log("✅ Executive Home OS 2 montata");
console.log("✅ Nessun pannello legacy rilevato");
console.log("✅ Nessun valore dimostrativo vietato rilevato");
console.log("✅ CSS dedicato correttamente importato");
console.log("");
