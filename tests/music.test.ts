import { describe, expect, it } from "vitest";
import { parseTimestamp } from "../src/services/music/commandHelpers.js";

describe("parseTimestamp", () => {
  it.each([["90", 90_000], ["1:30", 90_000], ["1:02:30", 3_750_000]])("parses %s", (value, expected) => {
    expect(parseTimestamp(value)).toBe(expected);
  });
  it.each(["", "1:2:3:4", "hello", "-1"])("rejects %s", (value) => {
    expect(() => parseTimestamp(value)).toThrow();
  });
});
