import { describe, it, expect } from "vitest";
import { promises as fs, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { proposeReviewItem, buildReviewItemLine, nextReviewSeq } from "./tools";
import { parseReviewItems } from "../fileApi";
import { assistantStatus } from "./chat";
import { assistantEnabled, resolveModel } from "../env";

describe("propose_review_item writer", () => {
  it("appends a contract-valid `rv-` line and NEVER writes the change-log", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aios-review-"));
    try {
      const res = await proposeReviewItem(
        { text: "Add a tag to the index", target: "wiki/index.md", detail: "tag it 'meta'" },
        { outputsDir: dir, today: "2026-06-30" }
      );
      expect(res.id).toMatch(/^rv-20260630-\d{3}$/);
      expect(res.file).toBe("review-2026-06-30.md");

      // The pinned contract: parseReviewItems (the GUI/skill parser) recovers it.
      const body = await fs.readFile(path.join(dir, res.file), "utf8");
      const item = parseReviewItems(body).find((i) => i.id === res.id);
      expect(item).toBeTruthy();
      expect(item!.checked).toBe(false);
      expect(item!.text).toBe("Add a tag to the index");
      expect(item!.target).toBe("wiki/index.md");
      expect(item!.detail).toBe("tag it 'meta'");

      // It proposes only — the change-log ledger is never touched.
      expect(existsSync(path.join(dir, "change-log.md"))).toBe(false);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it("increments NNN per item within the same day's file", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aios-review-"));
    try {
      const a = await proposeReviewItem({ text: "first" }, { outputsDir: dir, today: "2026-06-30" });
      const b = await proposeReviewItem({ text: "second" }, { outputsDir: dir, today: "2026-06-30" });
      expect(a.id).toBe("rv-20260630-001");
      expect(b.id).toBe("rv-20260630-002");
      const body = await fs.readFile(path.join(dir, "review-2026-06-30.md"), "utf8");
      expect(parseReviewItems(body)).toHaveLength(2);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it("buildReviewItemLine emits a line the contract parser accepts", () => {
    const line = buildReviewItemLine("rv-20260630-007", { text: "x", target: "a/b", detail: "c" });
    const item = parseReviewItems(line)[0];
    expect(item.id).toBe("rv-20260630-007");
    expect(item.target).toBe("a/b");
    expect(item.detail).toBe("c");
  });

  it("nextReviewSeq returns max existing + 1 for the date", () => {
    const body = "- [ ] `rv-20260630-001` — a\n- [x] `rv-20260630-005` — b\n";
    expect(nextReviewSeq(body, "20260630")).toBe(6);
    expect(nextReviewSeq("", "20260630")).toBe(1);
  });
});

describe("graceful-off status logic", () => {
  it("assistantEnabled requires a non-empty ANTHROPIC_API_KEY", () => {
    expect(assistantEnabled({})).toBe(false);
    expect(assistantEnabled({ ANTHROPIC_API_KEY: "" })).toBe(false);
    expect(assistantEnabled({ ANTHROPIC_API_KEY: "   " })).toBe(false);
    expect(assistantEnabled({ ANTHROPIC_API_KEY: "sk-ant-xyz" })).toBe(true);
  });

  it("resolveModel defaults to claude-sonnet-4-6; env overrides", () => {
    expect(resolveModel({})).toBe("claude-sonnet-4-6");
    expect(resolveModel({ ANTHROPIC_MODEL: "claude-opus-4-8" })).toBe("claude-opus-4-8");
  });

  it("status reports enabled:false with no key (UI falls back to search)", async () => {
    const status = await assistantStatus({});
    expect(status.enabled).toBe(false);
    expect(status.model).toBe("claude-sonnet-4-6");
    expect(typeof status.backend).toBe("string");
  });
});
