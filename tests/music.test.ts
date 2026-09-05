import { describe, expect, it, vi } from "vitest";
import { parseTimestamp } from "../src/services/music/commandHelpers.js";

const { mockYoutubeDl } = vi.hoisted(() => ({
  mockYoutubeDl: vi.fn(),
}));

vi.mock("youtube-dl-exec", () => ({
  youtubeDl: (...args: unknown[]) => mockYoutubeDl(...args),
}));

import YtDlpResolver from "../src/services/music/YtDlpResolver.js";

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
    mockYoutubeDl.mockImplementation((target: string, options: Record<string, unknown>) => {
      capturedTarget = target;
      capturedOptions = options;
      return Promise.resolve({
        id: "test12345",
        title: "Shadow",
        uploader: "Gagan Likhari",
        duration: 180,
        webpage_url: "https://www.youtube.com/watch?v=test12345",
      });
    });

    const resolver = new YtDlpResolver();
    const result = await resolver.resolve("shadow gagan likhari", "123");

    expect(capturedTarget).toBe("ytsearch1:shadow gagan likhari");
    expect(capturedOptions?.noCheckCertificates).toBeUndefined();
    expect(result.tracks).toHaveLength(1);
    expect(result.tracks[0].title).toBe("Shadow");
    expect(result.tracks[0].author).toBe("Gagan Likhari");
  });

  it("allows tracks up to 24 hours such as 12-hour videos", async () => {
    mockYoutubeDl.mockResolvedValue({
      id: "12hours",
      title: "Azan 12 hours",
      uploader: "Faith",
      duration: 43200,
      webpage_url: "https://www.youtube.com/watch?v=12hours",
    });

    const resolver = new YtDlpResolver();
    const result = await resolver.resolve("https://www.youtube.com/watch?v=12hours", "123");
    expect(result.tracks).toHaveLength(1);
    expect(result.tracks[0].durationMs).toBe(43_200_000);
  });

  it("throws clear error when track exceeds 24-hour duration limit", async () => {
    mockYoutubeDl.mockResolvedValue({
      id: "25hours",
      title: "Very Long Stream",
      uploader: "Streamer",
      duration: 25 * 3600,
      webpage_url: "https://www.youtube.com/watch?v=25hours",
    });

    const resolver = new YtDlpResolver();
    await expect(resolver.resolve("https://www.youtube.com/watch?v=25hours", "123"))
      .rejects.toThrow("exceeds the maximum duration limit of 24 hours");
  });
});
