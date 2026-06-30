import { defineConfig } from "vitest/config";
import type { PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileApiMiddleware } from "./server/fileApi";

/**
 * Mount the local File API as a Vite middleware in BOTH the dev server and the
 * preview server, so `npm run dev` and `npm run preview` each serve the app +
 * the /api/* endpoints with no separate process. Installed before Vite's
 * internal middlewares so /api/* is intercepted ahead of the SPA fallback.
 */
function fileApiPlugin(): PluginOption {
  return {
    name: "aios-file-api",
    configureServer(server) {
      server.middlewares.use(fileApiMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(fileApiMiddleware());
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "127.0.0.1",
    port: 8080,
  },
  preview: {
    host: "127.0.0.1",
    port: 8080,
  },
  plugins: [react(), fileApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-icons": ["lucide-react"],
          "vendor-markdown": ["react-markdown", "remark-gfm"],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["server/**/*.test.ts", "src/**/*.test.{ts,tsx}"],
  },
}));
