import { describe, expect, it, vi } from "vitest";
import { parseTimestamp } from "../src/services/music/commandHelpers.js";

describe("parseTimestamp", () => {
  it.each([["90", 90_000], ["1:30", 90_000], ["1:02:30", 3_750_000]])("parses %s", (value, expected) => {
    expect(parseTimestamp(value)).toBe(expected);
  });
  it.each(["", "1:2:3:4", "hello", "-1"])("rejects %s", (value) => {
    expect(() => parseTimestamp(value)).toThrow();
  });
});

describe("YtDlpResolver", () => {
  it("resolves query and does not pass noCheckCertificates: false", async () => {
    let capturedTarget = "";
    let capturedOptions: Record<string, unknown> | null = null;
    vi.doMock("youtube-dl-exec", () => ({
      youtubeDl: (target: string, options: Record<string, unknown>) => {
        capturedTarget = target;
        capturedOptions = options;
        return Promise.resolve({
          id: "test12345",
          title: "Shadow",
          uploader: "Gagan Likhari",
          duration: 180,
          webpage_url: "https://www.youtube.com/watch?v=test12345",
        });
      },
    }));

    const { default: YtDlpResolver } = await import("../src/services/music/YtDlpResolver.js");
    const resolver = new YtDlpResolver();
    const result = await resolver.resolve("shadow gagan likhari", "123");

    expect(capturedTarget).toBe("ytsearch1:shadow gagan likhari");
    expect(capturedOptions?.noCheckCertificates).toBeUndefined();
    expect(result.tracks).toHaveLength(1);
    expect(result.tracks[0].title).toBe("Shadow");
    expect(result.tracks[0].author).toBe("Gagan Likhari");
  });
});
