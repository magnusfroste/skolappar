import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // `npm run dev` serves the frontend; run the API with `PORT=8787 npm run dev:server`.
    proxy: {
      "/api": "http://localhost:8787",
      "/images": "http://localhost:8787",
      "/mcp": "http://localhost:8787",
      "/llms.txt": "http://localhost:8787",
      "/sitemap.xml": "http://localhost:8787",
      "/bekrafta": "http://localhost:8787",
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
