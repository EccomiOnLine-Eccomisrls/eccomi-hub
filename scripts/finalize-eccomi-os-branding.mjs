import fs from "node:fs";

const appPath = "src/App.tsx";
let source = fs.readFileSync(appPath, "utf8");

const replacements = [
  ["Posso aiutarti a decidere, trovare informazioni o aprire qualsiasi area di ECCOMI HUB.", "Posso aiutarti a decidere, trovare informazioni o aprire qualsiasi area di ECCOMI OS."],
  ["ECCOMI Command Bar · V1", "ECCOMI OS · 0.1 Origins"],
];

let changed = false;
for (const [from, to] of replacements) {
  if (source.includes(from)) {
    source = source.split(from).join(to);
    changed = true;
  }
}

if (!changed) {
  console.log("No branding replacements were necessary.");
  process.exit(0);
}

fs.writeFileSync(appPath, source);
console.log("ECCOMI OS branding finalized in src/App.tsx");
