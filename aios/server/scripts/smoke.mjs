/**
 * No-keys smoke test for the intelligence layer. Spins up the real Vite
 * middleware (the same one `npm run dev`/`preview` mount) over an HTTP server,
 * then exercises three endpoints with NO env keys:
 *
 *   GET  /api/assistant/status  → { enabled:false }
 *   GET  /api/search?q=…        → ranked BM25 hits over the seed wiki pages
 *   POST /api/kb/reindex        → runs the BM25 path and reports a count
 *
 * Requires no network and no model download — it confirms graceful fallback.
 * Run: node server/scripts/smoke.mjs
 */
import { createServer } from "vite";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aiosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const vite = await createServer({
  root: aiosRoot,
  appType: "custom",
  // watch:null + noDiscovery keep the process free of lingering handles so it
  // exits cleanly on Windows (no libuv teardown race on process exit).
  server: { middlewareMode: true, watch: null },
  optimizeDeps: { noDiscovery: true },
  logLevel: "warn",
});

const server = http.createServer(vite.middlewares);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

let failures = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};
const getJson = async (p) => (await fetch(base + p)).json();
const postJson = async (p) => (await fetch(base + p, { method: "POST" })).json();

try {
  const status = await getJson("/api/assistant/status");
  check("assistant status enabled:false (no key)", status.enabled === false, JSON.stringify(status));

  const search = await getJson("/api/search?q=" + encodeURIComponent("knowledge base"));
  const results = Array.isArray(search.results) ? search.results : [];
  check("search returns ranked BM25 hits over seed pages", results.length > 0, `${results.length} hits`);
  check(
    "hits keep the { title, path, snippet, score } shape",
    results.every((r) => "title" in r && "path" in r && "snippet" in r && "score" in r)
  );

  const reindex = await postJson("/api/kb/reindex");
  check(
    "kb/reindex runs the BM25 path and reports a count",
    typeof reindex.count === "number" && reindex.count >= 0,
    JSON.stringify(reindex)
  );
} finally {
  await new Promise((resolve) => server.close(resolve));
  await vite.close();
}

console.log(failures === 0 ? "\nSMOKE OK" : `\nSMOKE FAILED (${failures})`);
// Set exit code and let Node drain naturally (avoids a libuv handle-close race
// that aborts the process on Windows when calling process.exit() directly).
process.exitCode = failures === 0 ? 0 : 1;
