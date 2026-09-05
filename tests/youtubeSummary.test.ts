import { describe, expect, it } from "vitest";
import { extractVideoId } from "../src/services/YouTubeSummaryService.js";

describe("YouTube URL parsing", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?t=12", "dQw4w9WgXcQ"],
    ["https://youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("extracts %s", (url, id) => expect(extractVideoId(url)).toBe(id));
  it("rejects non-YouTube URLs", () => expect(extractVideoId("https://example.com/video")).toBeNull());
});
