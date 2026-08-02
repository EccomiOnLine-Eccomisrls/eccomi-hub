import fs from "node:fs";

const appPath = "src/App.tsx";
let source = fs.readFileSync(appPath, "utf8");

const replacements = [
  ['searchBarbaraResults', 'searchEccomiOS'],
  ['BarbaraResult', 'EccomiOSResult'],
  ['./lib/barbaraCommandCenter', './lib/eccomiOS'],
  ['Chiedimi qualsiasi cosa o dimmi cosa vuoi fare...', 'Chiedi a ECCOMI OS cosa vuoi fare...'],
];

for (const [from, to] of replacements) {
  source = source.split(from).join(to);
}

fs.writeFileSync(appPath, source);
console.log("ECCOMI OS naming applied to src/App.tsx");
