import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
const oldUrl = "https://eccomi-noleggio.b55k7dq9qc.chatgpt.site/";
const newUrl = "https://noleggio.eccomionline.com/ceo";

const source = await readFile(appPath, "utf8");

if (source.includes(newUrl)) {
  console.log(`ECCOMI NOLEGGIO URL already configured: ${newUrl}`);
  process.exit(0);
}

if (!source.includes(oldUrl)) {
  throw new Error(`ECCOMI NOLEGGIO legacy URL not found in ${appPath.pathname}`);
}

const updated = source.replaceAll(oldUrl, newUrl);
await writeFile(appPath, updated, "utf8");
console.log(`ECCOMI NOLEGGIO URL updated: ${newUrl}`);
