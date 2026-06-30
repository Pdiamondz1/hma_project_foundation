/**
 * `npm run kb:index` — (re)build the active KnowledgeStore's index from wiki/.
 *
 * Runs the TypeScript reindex module through Vite's SSR loader, so it needs ZERO
 * extra dependencies (no ts-node / tsx) and works cross-platform. Vite is already
 * a devDependency.
 */
import { createServer } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aiosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const server = await createServer({
  root: aiosRoot,
  appType: "custom",
  server: { middlewareMode: true },
  logLevel: "warn",
});

try {
  const { runReindex } = await server.ssrLoadModule("/server/kb/reindex.ts");
  const result = await runReindex();
  console.log(
    `kb:index — backend=${result.backend} embeddings=${result.embeddings} ` +
      `count=${result.count} vectors=${result.vectors} lastIndexed=${result.lastIndexed}`
  );
} finally {
  await server.close();
}
