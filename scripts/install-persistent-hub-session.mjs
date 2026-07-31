import { readFile, writeFile } from "node:fs/promises";

const target = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(target, "utf8");

const sessionKey = "eccomi-hub-session";

if (source.includes(`window.localStorage.setItem("${sessionKey}"`)) {
  console.log("Persistent HUB session already installed.");
  process.exit(0);
}

const replacements = [
  [
    `window.sessionStorage.setItem("${sessionKey}", JSON.stringify(session));`,
    `window.localStorage.setItem("${sessionKey}", JSON.stringify(session));`,
  ],
  [
    `const savedSession = window.sessionStorage.getItem("${sessionKey}");`,
    `const savedSession = window.localStorage.getItem("${sessionKey}");`,
  ],
];

for (const [from, to] of replacements) {
  if (!source.includes(from)) {
    throw new Error(`Expected authentication marker not found: ${from}`);
  }
  source = source.replace(from, to);
}

const removeCall = `window.sessionStorage.removeItem("${sessionKey}");`;
const removeCount = source.split(removeCall).length - 1;
if (removeCount < 3) {
  throw new Error(`Expected at least 3 session cleanup calls, found ${removeCount}.`);
}
source = source.split(removeCall).join(`window.localStorage.removeItem("${sessionKey}");`);

await writeFile(target, source, "utf8");
console.log("Persistent HUB session installed in src/App.tsx.");
console.log("The existing Supabase refresh flow remains unchanged.");
