import { EventEmitter } from "node:events";
import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ failures: 0, hang: false, calls: 0, terminated: 0 }));
vi.mock("node:worker_threads", () => ({ Worker: class extends EventEmitter {
  constructor() {
    super(); state.calls++;
    queueMicrotask(() => {
      if (state.hang) return;
      if (state.failures-- > 0) this.emit("message", { failed: true });
      else this.emit("message", { value: { result: [{ url: "https://example.com/image.jpg" }] } });
    });
  }
  async terminate() { state.terminated++; return 0; }
} }));
import { normalizeImages, searchImages } from "../src/services/ImageSearchService.js";
beforeEach(() => { state.failures = 0; state.hang = false; state.calls = 0; state.terminated = 0; });
it("filters malformed records, deduplicates and limits results", () => {
  expect(normalizeImages({ result: [null, { url: "file:///etc/passwd" },
    { url: "https://example.com/a" }, { url: "https://example.com/a" },
    { url: "https://example.com/b" }] }, 1)).toHaveLength(1);
});
it("rejects malformed responses", () => { expect(() => normalizeImages({}, 250)).toThrow(); });
it("retries once and cleans up both workers", async () => {
  state.failures = 1;
  expect(await searchImages("cats")).toHaveLength(1);
  expect(state.calls).toBe(2); expect(state.terminated).toBe(2);
});
it("fails safely after two provider errors", async () => {
  state.failures = 10;
  await expect(searchImages("cats")).rejects.toThrow("temporarily unavailable");
  expect(state.calls).toBe(2);
});
it("terminates stalled searches and releases concurrency slots", async () => {
  state.hang = true;
  const first = searchImages("cats", { timeoutMs: 100 });
  const second = searchImages("dogs", { timeoutMs: 100 });
  await expect(searchImages("birds")).rejects.toThrow("busy");
  const results = await Promise.allSettled([first, second]);
  expect(results.every(result => result.status === "rejected")).toBe(true);
  expect(state.terminated).toBe(4);
  state.hang = false;
  expect(await searchImages("birds")).toHaveLength(1);
});
