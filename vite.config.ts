import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const LEGACY_NOLEGGIO_URL = "https://eccomi-noleggio.b55k7dq9qc.chatgpt.site/";
const NOLEGGIO_OPERATIONAL_URL = "https://noleggio.eccomionline.com/ceo";

function replaceLegacyNoleggioUrl(): Plugin {
  return {
    name: "replace-legacy-noleggio-url",
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith("/src/App.tsx") || !code.includes(LEGACY_NOLEGGIO_URL)) {
        return null;
      }

      return {
        code: code.replaceAll(LEGACY_NOLEGGIO_URL, NOLEGGIO_OPERATIONAL_URL),
        map: null,
      };
    },
  };
}

export default defineConfig({
  plugins: [replaceLegacyNoleggioUrl(), react()],
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
  },
});
