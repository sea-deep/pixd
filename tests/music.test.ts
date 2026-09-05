import { describe, expect, it } from "vitest";
import { parseTimestamp } from "../src/services/music/commandHelpers.js";

describe("music timestamp parsing", () => {
  it.each([
    ["90", 90_000],
    ["1:30", 90_000],
    ["1:02:30", 3_750_000],
  ])("parses %s", (input, expected) => {
    expect(parseTimestamp(input)).toBe(expected);
  });

  it.each(["", "abc", "-1", "1:2:3:4"])("rejects %s", (input) => {
    expect(() => parseTimestamp(input)).toThrow();
  });
});
