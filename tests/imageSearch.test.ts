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
import { isUnembeddableMedia, normalizeImages, searchImages } from "../src/services/ImageSearchService.js";
import { resolveEmbedImageUrl } from "../src/helpers/helpersImage.js";
beforeEach(() => { state.failures = 0; state.hang = false; state.calls = 0; state.terminated = 0; });
it("filters malformed records, deduplicates and limits results", () => {
  expect(normalizeImages({ result: [null, { url: "file:///etc/passwd" },
    { url: "https://example.com/a" }, { url: "https://example.com/a" },
    { url: "https://example.com/b" }] }, 1)).toHaveLength(1);
});
it("rejects malformed responses", () => { expect(() => normalizeImages({}, 250)).toThrow(); });
it("detects unembeddable video and social media URLs", () => {
  expect(isUnembeddableMedia("https://www.tiktok.com/api/img/?itemId=123")).toBe(true);
  expect(isUnembeddableMedia("https://lookaside.instagram.com/seo/crawler/?id=1")).toBe(true);
  expect(isUnembeddableMedia("https://lookaside.fbsbx.com/crawler/media/?id=2")).toBe(true);
  expect(isUnembeddableMedia("https://example.com/clip.mp4")).toBe(true);
  expect(isUnembeddableMedia("https://www.youtube.com/watch?v=abc")).toBe(true);
  expect(isUnembeddableMedia("https://example.com/image.jpg")).toBe(false);
  expect(isUnembeddableMedia("https://i.ytimg.com/vi/abc/maxresdefault.jpg")).toBe(false);
});
it("falls back unembeddable media to thumbnail URL in normalizeImages and resolveEmbedImageUrl", () => {
  const thumb = "https://encrypted-tbn0.gstatic.com/images?q=tbn:xyz";
  const normalized = normalizeImages({
    result: [{
      url: "https://www.tiktok.com/api/img/?itemId=7664253876039732498",
      originalUrl: "https://www.tiktok.com/@user/video/7664253876039732498",
      thumbnailUrl: thumb,
    }],
  }, 10);
  expect(normalized[0].url).toBe(thumb);
  expect(normalized[0].originalUrl).toBe("https://www.tiktok.com/@user/video/7664253876039732498");
  expect(resolveEmbedImageUrl(normalized[0])).toBe(thumb);
});
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
