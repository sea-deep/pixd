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
    expect(capturedOptions?.extractorArgs).toBe("youtube:player_client=ios,android,mweb;player_skip=webpage");
    expect(result.tracks).toHaveLength(1);
    expect(result.tracks[0].title).toBe("Shadow");
    expect(result.tracks[0].author).toBe("Gagan Likhari");
  });

  it("does not treat ytsearch collection wrappers as playlists and leaves playlistName undefined", async () => {
    mockYoutubeDl.mockResolvedValue({
      _type: "playlist",
      id: "ytsearch1:skethcers driprreprot",
      title: "skethcers driprreprot",
      entries: [
        {
          id: "sk123",
          title: "DripReport - Skechers (Official Music Video)",
          uploader: "DripReport",
          duration: 140,
          webpage_url: "https://www.youtube.com/watch?v=sk123",
          thumbnail: "https://i.ytimg.com/vi/sk123/default.jpg",
        },
      ],
    });

    const resolver = new YtDlpResolver();
    const result = await resolver.resolve("skethcers driprreprot", "user456");

    expect(result.playlistName).toBeUndefined();
    expect(result.tracks).toHaveLength(1);
    expect(result.tracks[0].title).toBe("DripReport - Skechers (Official Music Video)");
    expect(result.tracks[0].author).toBe("DripReport");
  });

  it("correctly identifies multi-track playlist URLs and sets playlistName", async () => {
    mockYoutubeDl.mockResolvedValue({
      _type: "playlist",
      playlist_title: "Top Hits",
      entries: [
        {
          id: "t1",
          title: "Song 1",
          uploader: "Artist 1",
          duration: 200,
          webpage_url: "https://www.youtube.com/watch?v=t1",
        },
        {
          id: "t2",
          title: "Song 2",
          uploader: "Artist 2",
          duration: 180,
          webpage_url: "https://www.youtube.com/watch?v=t2",
        },
      ],
    });

    const resolver = new YtDlpResolver();
    const result = await resolver.resolve("https://www.youtube.com/playlist?list=PL123", "user456");

    expect(result.playlistName).toBe("Top Hits");
    expect(result.tracks).toHaveLength(2);
    expect(result.tracks[0].title).toBe("Song 1");
    expect(result.tracks[1].title).toBe("Song 2");
  });

  it("treats single-track URLs as single tracks without playlistName", async () => {
    mockYoutubeDl.mockResolvedValue({
      id: "solo1",
      title: "Solo Track",
      uploader: "Solo Artist",
      duration: 150,
      webpage_url: "https://www.youtube.com/watch?v=solo1",
    });

    const resolver = new YtDlpResolver();
    const result = await resolver.resolve("https://www.youtube.com/watch?v=solo1", "user456");

    expect(result.playlistName).toBeUndefined();
    expect(result.tracks).toHaveLength(1);
    expect(result.tracks[0].title).toBe("Solo Track");
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
